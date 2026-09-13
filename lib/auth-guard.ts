import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ----------------------------------------------------------------------
// Authorized Clerk Organization Roles
// ----------------------------------------------------------------------
export const ROLES = {
  ADMIN: "org:admin",
  QA_MANAGER: "org:qa_manager",
  QA_APPROVER: "org:qa_approver",
  QA_REVIEWER: "org:qa_reviewer",
  QUALITY_ENGINEER: "org:quality_engineer",
  COMPLAINT_INVESTIGATOR: "org:complaint_investigator",
  CAPA_OWNER: "org:capa_owner",
  VIGILANCE_LEAD: "org:vigilance_lead",
  MEMBER: "org:member",
  READ_ONLY: "org:read_only",
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];

// ----------------------------------------------------------------------
// Granular Clerk Permissions for Action & Route Protection
// ----------------------------------------------------------------------
export const PERMISSIONS = {
  // Complaint Permissions
  COMPLAINT_CREATE: "org:complaint:create",
  COMPLAINT_EDIT: "org:complaint:edit",
  COMPLAINT_CLOSE: "org:complaint:close",
  COMPLAINT_ASSIGN: "org:complaint:assign",
  COMPLAINT_INVESTIGATE: "org:complaint:investigate",

  // CAPA Permissions
  CAPA_CREATE: "org:capa:create",
  CAPA_EDIT: "org:capa:edit",
  CAPA_APPROVE: "org:capa:approve",
  CAPA_CLOSE: "org:capa:close",

  // Vigilance Permissions
  VIGILANCE_MANAGE: "org:vigilance:manage",
  VIGILANCE_VIEW: "org:vigilance:view",

  // Audit & Signatures
  AUDIT_VIEW: "org:audit:view",
  ESIGNATURE_SIGN: "org:esignature:sign",

  // Reports & Exports
  REPORT_EXPORT: "org:report:export",

  // Administration
  USER_MANAGE: "org:user:manage",
  SETTINGS_MANAGE: "org:settings:manage",

  // Backward-compatibility Aliases with Existing Codebase
  COMPLAINTS_CREATE: "org:complaints:create",
  COMPLAINTS_INVESTIGATE: "org:complaints:investigate",
  COMPLAINTS_APPROVE_CLOSE: "org:complaints:approve_close",
  CAPA_APPROVE_CLOSE: "org:capa:approve_close",
  SYSTEM_AUDIT_READ: "org:system:audit_read",
} as const;

export type PermissionSlug =
  | (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
  | "complaint.create"
  | "complaint.edit"
  | "complaint.close"
  | "complaint.assign"
  | "complaint.investigate"
  | "capa.create"
  | "capa.edit"
  | "capa.approve"
  | "capa.close"
  | "vigilance.manage"
  | "vigilance.view"
  | "audit.view"
  | "esignature.sign"
  | "report.export"
  | "user.manage"
  | "settings.manage";

export const PERMISSION_EQUIVALENTS: Record<string, string[]> = {
  // Complaint create
  "org:complaint:create": ["org:complaint:create", "org:complaints:create", "complaint.create"],
  "org:complaints:create": ["org:complaint:create", "org:complaints:create", "complaint.create"],
  "complaint.create": ["org:complaint:create", "org:complaints:create", "complaint.create"],

  // Complaint edit
  "org:complaint:edit": ["org:complaint:edit", "complaint.edit"],
  "complaint.edit": ["org:complaint:edit", "complaint.edit"],

  // Complaint assign
  "org:complaint:assign": ["org:complaint:assign", "complaint.assign"],
  "complaint.assign": ["org:complaint:assign", "complaint.assign"],

  // Complaint investigate
  "org:complaint:investigate": ["org:complaint:investigate", "org:complaints:investigate", "complaint.investigate"],
  "org:complaints:investigate": ["org:complaint:investigate", "org:complaints:investigate", "complaint.investigate"],
  "complaint.investigate": ["org:complaint:investigate", "org:complaints:investigate", "complaint.investigate"],

  // Complaint close
  "org:complaint:close": ["org:complaint:close", "org:complaints:approve_close", "complaint.close"],
  "org:complaints:approve_close": ["org:complaint:close", "org:complaints:approve_close", "complaint.close"],
  "complaint.close": ["org:complaint:close", "org:complaints:approve_close", "complaint.close"],

  // CAPA create
  "org:capa:create": ["org:capa:create", "capa.create"],
  "capa.create": ["org:capa:create", "capa.create"],

  // CAPA edit
  "org:capa:edit": ["org:capa:edit", "capa.edit"],
  "capa.edit": ["org:capa:edit", "capa.edit"],

  // CAPA approve
  "org:capa:approve": ["org:capa:approve", "org:capa:approve_close", "capa.approve"],
  "capa.approve": ["org:capa:approve", "org:capa:approve_close", "capa.approve"],

  // CAPA close
  "org:capa:close": ["org:capa:close", "org:capa:approve_close", "capa.close"],
  "capa.close": ["org:capa:close", "org:capa:approve_close", "capa.close"],
  "org:capa:approve_close": ["org:capa:close", "org:capa:approve", "org:capa:approve_close", "capa.approve", "capa.close"],

  // Vigilance
  "org:vigilance:manage": ["org:vigilance:manage", "vigilance.manage"],
  "vigilance.manage": ["org:vigilance:manage", "vigilance.manage"],
  "org:vigilance:view": ["org:vigilance:view", "vigilance.view"],
  "vigilance.view": ["org:vigilance:view", "vigilance.view"],

  // Audit
  "org:audit:view": ["org:audit:view", "org:system:audit_read", "audit.view"],
  "org:system:audit_read": ["org:audit:view", "org:system:audit_read", "audit.view"],
  "audit.view": ["org:audit:view", "org:system:audit_read", "audit.view"],

  // E-signature
  "org:esignature:sign": ["org:esignature:sign", "esignature.sign"],
  "esignature.sign": ["org:esignature:sign", "esignature.sign"],

  // Report
  "org:report:export": ["org:report:export", "report.export"],
  "report.export": ["org:report:export", "report.export"],

  // Admin
  "org:user:manage": ["org:user:manage", "user.manage"],
  "user.manage": ["org:user:manage", "user.manage"],
  "org:settings:manage": ["org:settings:manage", "settings.manage"],
  "settings.manage": ["org:settings:manage", "settings.manage"],
};

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

    const equivalentPerms =
      PERMISSION_EQUIVALENTS[requiredPermission] || [requiredPermission];

    const hasClerkPermission = equivalentPerms.some((perm) =>
      authContext.has({ permission: perm })
    );

    // Role-based permission mapping for default Clerk roles & custom roles
    const rolePermissions: Record<string, PermissionSlug[]> = {
      [ROLES.ADMIN]: Object.values(PERMISSIONS),
      [ROLES.QA_MANAGER]: Object.values(PERMISSIONS),
      [ROLES.QA_APPROVER]: [
        PERMISSIONS.COMPLAINT_CREATE,
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.COMPLAINT_EDIT,
        PERMISSIONS.COMPLAINT_ASSIGN,
        PERMISSIONS.COMPLAINT_INVESTIGATE,
        PERMISSIONS.COMPLAINTS_INVESTIGATE,
        PERMISSIONS.COMPLAINT_CLOSE,
        PERMISSIONS.COMPLAINTS_APPROVE_CLOSE,
        PERMISSIONS.CAPA_CREATE,
        PERMISSIONS.CAPA_EDIT,
        PERMISSIONS.CAPA_APPROVE,
        PERMISSIONS.CAPA_CLOSE,
        PERMISSIONS.CAPA_APPROVE_CLOSE,
        PERMISSIONS.VIGILANCE_MANAGE,
        PERMISSIONS.VIGILANCE_VIEW,
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.SYSTEM_AUDIT_READ,
        PERMISSIONS.ESIGNATURE_SIGN,
        PERMISSIONS.REPORT_EXPORT,
      ],
      [ROLES.QA_REVIEWER]: [
        PERMISSIONS.COMPLAINT_CREATE,
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.COMPLAINT_EDIT,
        PERMISSIONS.COMPLAINT_INVESTIGATE,
        PERMISSIONS.COMPLAINTS_INVESTIGATE,
        PERMISSIONS.CAPA_CREATE,
        PERMISSIONS.CAPA_EDIT,
        PERMISSIONS.VIGILANCE_VIEW,
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.SYSTEM_AUDIT_READ,
        PERMISSIONS.ESIGNATURE_SIGN,
        PERMISSIONS.REPORT_EXPORT,
      ],
      [ROLES.QUALITY_ENGINEER]: [
        PERMISSIONS.COMPLAINT_CREATE,
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.COMPLAINT_EDIT,
        PERMISSIONS.COMPLAINT_INVESTIGATE,
        PERMISSIONS.COMPLAINTS_INVESTIGATE,
        PERMISSIONS.CAPA_CREATE,
        PERMISSIONS.CAPA_EDIT,
        PERMISSIONS.VIGILANCE_VIEW,
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.SYSTEM_AUDIT_READ,
        PERMISSIONS.ESIGNATURE_SIGN,
        PERMISSIONS.REPORT_EXPORT,
      ],
      [ROLES.COMPLAINT_INVESTIGATOR]: [
        PERMISSIONS.COMPLAINT_CREATE,
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.COMPLAINT_EDIT,
        PERMISSIONS.COMPLAINT_INVESTIGATE,
        PERMISSIONS.COMPLAINTS_INVESTIGATE,
        PERMISSIONS.CAPA_CREATE,
        PERMISSIONS.CAPA_EDIT,
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.SYSTEM_AUDIT_READ,
        PERMISSIONS.ESIGNATURE_SIGN,
        PERMISSIONS.REPORT_EXPORT,
      ],
      [ROLES.CAPA_OWNER]: [
        PERMISSIONS.COMPLAINT_CREATE,
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.CAPA_CREATE,
        PERMISSIONS.CAPA_EDIT,
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.SYSTEM_AUDIT_READ,
        PERMISSIONS.ESIGNATURE_SIGN,
        PERMISSIONS.REPORT_EXPORT,
      ],
      [ROLES.VIGILANCE_LEAD]: [
        PERMISSIONS.COMPLAINT_CREATE,
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.COMPLAINT_EDIT,
        PERMISSIONS.COMPLAINT_INVESTIGATE,
        PERMISSIONS.COMPLAINTS_INVESTIGATE,
        PERMISSIONS.VIGILANCE_MANAGE,
        PERMISSIONS.VIGILANCE_VIEW,
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.SYSTEM_AUDIT_READ,
        PERMISSIONS.ESIGNATURE_SIGN,
        PERMISSIONS.REPORT_EXPORT,
      ],
      [ROLES.MEMBER]: [
        PERMISSIONS.COMPLAINT_CREATE,
        PERMISSIONS.COMPLAINTS_CREATE,
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.SYSTEM_AUDIT_READ,
        PERMISSIONS.REPORT_EXPORT,
      ],
      [ROLES.READ_ONLY]: [
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.SYSTEM_AUDIT_READ,
        PERMISSIONS.VIGILANCE_VIEW,
      ],
    };

    const userRolePerms = authContext.orgRole
      ? rolePermissions[authContext.orgRole] ?? []
      : [];

    const hasRolePermission = equivalentPerms.some((perm) =>
      userRolePerms.includes(perm as PermissionSlug)
    );

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
