import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ----------------------------------------------------------------------
// Authorized Clerk Organization Roles
// ----------------------------------------------------------------------
export const ROLES = {
  ADMIN: "org:admin",
  QA_MANAGER: "org:qa_manager",
  COMPLAINT_INVESTIGATOR: "org:complaint_investigator",
  CAPA_OWNER: "org:capa_owner",
  VIGILANCE_LEAD: "org:vigilance_lead",
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];

// ----------------------------------------------------------------------
// Granular Clerk Permissions for Action & Route Protection
// ----------------------------------------------------------------------
export const PERMISSIONS = {
  COMPLAINTS_CREATE: "org:complaints:create",
  COMPLAINTS_INVESTIGATE: "org:complaints:investigate",
  COMPLAINTS_APPROVE_CLOSE: "org:complaints:approve_close",
  CAPA_CREATE: "org:capa:create",
  CAPA_EDIT: "org:capa:edit",
  CAPA_APPROVE_CLOSE: "org:capa:approve_close",
  VIGILANCE_MANAGE: "org:vigilance:manage",
  SYSTEM_AUDIT_READ: "org:system:audit_read",
} as const;

export type PermissionSlug =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface AuthenticatedOrgContext {
  userId: string;
  orgId: string;
  orgRole?: string;
  orgSlug?: string;
}

/**
 * Ensures user and organization records exist in PostgreSQL database
 * to satisfy relational foreign key constraints.
 */
export async function syncUserAndOrg(userId: string, orgId: string) {
  try {
    const [userRecord, orgRecord] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.organization.findUnique({ where: { id: orgId } }),
    ]);

    if (!userRecord) {
      const user = await currentUser();
      if (user) {
        await prisma.user.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email:
              user.emailAddresses?.[0]?.emailAddress || `${userId}@clerk.local`,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          },
          update: {
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          },
        });
      }
    }

    if (!orgRecord) {
      const clerk = await clerkClient();
      const org = await clerk.organizations.getOrganization({
        organizationId: orgId,
      });
      if (org) {
        await prisma.organization.upsert({
          where: { id: orgId },
          create: {
            id: orgId,
            name: org.name,
            slug: org.slug,
            imageUrl: org.imageUrl,
          },
          update: {
            name: org.name,
            slug: org.slug,
            imageUrl: org.imageUrl,
          },
        });
      }
    }
  } catch (error) {
    console.warn("[syncUserAndOrg] Auto-sync warning:", error);
  }
}

/**
 * Ensures the request is authenticated, has an active Organization (orgId),
 * and optionally verifies the caller has the required Clerk custom permission.
 * Throws an explicit error (401 or 403) on violation to maintain strict compliance.
 */
export async function requireOrgAuth(
  requiredPermission?: PermissionSlug
): Promise<AuthenticatedOrgContext> {
  const authContext = await auth();

  if (!authContext.userId) {
    throw new Error("401 Unauthorized: User authentication required.");
  }

  if (!authContext.orgId) {
    throw new Error(
      "403 Forbidden: An active Organization context (orgId) is mandatory for tenant isolation."
    );
  }

  // Ensure user and organization records are synced in DB
  await syncUserAndOrg(authContext.userId, authContext.orgId);

  if (requiredPermission) {
    const isAdmin =
      authContext.orgRole === ROLES.ADMIN ||
      authContext.has({ role: ROLES.ADMIN });

    const hasClerkPermission = authContext.has({
      permission: requiredPermission,
    });

    // Role-based permission mapping for default Clerk roles & custom roles
    const rolePermissions: Record<string, PermissionSlug[]> = {
      [ROLES.ADMIN]: Object.values(PERMISSIONS),
      [ROLES.QA_MANAGER]: Object.values(PERMISSIONS),
      [ROLES.COMPLAINT_INVESTIGATOR]: [
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.COMPLAINTS_INVESTIGATE,
        PERMISSIONS.CAPA_CREATE,
        PERMISSIONS.CAPA_EDIT,
        PERMISSIONS.SYSTEM_AUDIT_READ,
      ],
      [ROLES.CAPA_OWNER]: [
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.CAPA_CREATE,
        PERMISSIONS.CAPA_EDIT,
        PERMISSIONS.SYSTEM_AUDIT_READ,
      ],
      [ROLES.VIGILANCE_LEAD]: [
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.COMPLAINTS_INVESTIGATE,
        PERMISSIONS.VIGILANCE_MANAGE,
        PERMISSIONS.SYSTEM_AUDIT_READ,
      ],
      "org:member": [
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.SYSTEM_AUDIT_READ,
      ],
    };

    const hasRolePermission =
      authContext.orgRole &&
      rolePermissions[authContext.orgRole]?.includes(requiredPermission);

    if (!isAdmin && !hasClerkPermission && !hasRolePermission) {
      throw new Error(
        `403 Forbidden: User ${authContext.userId} lacks required permission "${requiredPermission}".`
      );
    }
  }

  return {
    userId: authContext.userId,
    orgId: authContext.orgId,
    orgRole: authContext.orgRole,
    orgSlug: authContext.orgSlug,
  };
}

/**
 * Enforces ISO 13485 and FDA 21 CFR Part 11 "Separation of Duties".
 * Verifies that the approving authority (approverId) is NOT the same user
 * who performed or investigated the work (performerId).
 */
export function verifySeparationOfDuties(
  approverId: string,
  performerId: string | null | undefined,
  entityType: "Complaint" | "CAPA" = "Complaint"
): void {
  if (!approverId) {
    throw new Error(
      `400 Bad Request: Missing approver user ID for ${entityType} closure.`
    );
  }

  if (performerId && approverId === performerId) {
    throw new Error(
      `403 Forbidden: Compliance Violation (Separation of Duties). The user (${approverId}) who investigated/implemented this ${entityType} cannot be the final approving authority.`
    );
  }
}
