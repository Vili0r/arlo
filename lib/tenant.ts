import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Converts an organization name into a clean, URL-safe subdomain slug.
 * e.g. "cvmed" -> "cvmed", "CV Med Devices" -> "cv-med-devices"
 */
export function slugifyOrgName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolves the clean subdomain based on the organization name.
 * Falls back to Clerk org.slug or org.id if name is not available.
 */
export async function getOrgSubdomain(orgId: string): Promise<string> {
  try {
    const clerk = await clerkClient();
    const org = await clerk.organizations.getOrganization({
      organizationId: orgId,
    });

    if (org?.name) {
      const nameSlug = slugifyOrgName(org.name);
      if (nameSlug) return nameSlug;
    }

    if (org?.slug) return org.slug;
  } catch (error) {
    console.warn(`[getOrgSubdomain] Could not fetch org ${orgId} from Clerk API:`, error);
  }

  // Fallback to local DB
  const dbOrg = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (dbOrg?.name) {
    const nameSlug = slugifyOrgName(dbOrg.name);
    if (nameSlug) return nameSlug;
  }

  return dbOrg?.slug || orgId;
}

/**
 * Looks up an Organization in the local database matching the subdomain identifier
 * (by slug, name, or orgId).
 */
export async function findOrgByIdentifier(identifier: string) {
  if (!identifier) return null;

  return prisma.organization.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { name: { equals: identifier, mode: "insensitive" } },
        { id: identifier },
      ],
      deletedAt: null,
    },
  });
}
