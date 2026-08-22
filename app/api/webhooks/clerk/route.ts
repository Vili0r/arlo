import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditAction, Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  let evt;

  try {
    // Automatically verifies signature using CLERK_WEBHOOK_SIGNING_SECRET
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("[CLERK_WEBHOOK_VERIFY_ERROR]", err);
    return new NextResponse("Webhook verification failed", { status: 400 });
  }

  const eventType = evt.type;

  try {
    // -------------------------------------------------------------
    // USER EVENTS
    // -------------------------------------------------------------
    if (eventType === "user.created" || eventType === "user.updated") {
      const {
        id,
        email_addresses,
        first_name,
        last_name,
        image_url,
      } = evt.data;

      const email = email_addresses?.[0]?.email_address;
      if (!email) {
        return new NextResponse("Missing primary email address", {
          status: 400,
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      const user = await prisma.user.upsert({
        where: { id },
        create: {
          id,
          email,
          firstName: first_name ?? null,
          lastName: last_name ?? null,
          imageUrl: image_url ?? null,
        },
        update: {
          email,
          firstName: first_name ?? null,
          lastName: last_name ?? null,
          imageUrl: image_url ?? null,
          deletedAt: null, // restore if previously marked deleted
        },
      });

      // Find any organization the user belongs to for audit log context
      const member = await prisma.organizationMember.findFirst({
        where: { userId: id },
      });

      if (member?.orgId) {
        await prisma.auditLog.create({
          data: {
            orgId: member.orgId,
            entityType: "User",
            entityId: id,
            action: existingUser ? AuditAction.UPDATE : AuditAction.CREATE,
            changedById: id,
            previousData: existingUser
              ? (existingUser as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            newData: user as unknown as Prisma.InputJsonValue,
            reason: `Clerk Webhook: ${eventType}`,
          },
        });
      }

      return NextResponse.json({ success: true, userId: user.id });
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      if (id) {
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (existingUser) {
          // Soft-delete user (no hard delete)
          await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
          });

          const member = await prisma.organizationMember.findFirst({
            where: { userId: id },
          });

          if (member?.orgId) {
            await prisma.auditLog.create({
              data: {
                orgId: member.orgId,
                entityType: "User",
                entityId: id,
                action: AuditAction.SOFT_DELETE,
                changedById: id,
                previousData:
                  existingUser as unknown as Prisma.InputJsonValue,
                newData: {
                  deletedAt: new Date().toISOString(),
                } as Prisma.InputJsonValue,
                reason: "Clerk Webhook: user.deleted (soft delete)",
              },
            });
          }
        }
      }
      return NextResponse.json({ success: true });
    }

    // -------------------------------------------------------------
    // ORGANIZATION EVENTS
    // -------------------------------------------------------------
    if (
      eventType === "organization.created" ||
      eventType === "organization.updated"
    ) {
      const { id, name, slug, image_url, created_by } = evt.data;

      const existingOrg = await prisma.organization.findUnique({
        where: { id },
      });

      const org = await prisma.organization.upsert({
        where: { id },
        create: {
          id,
          name,
          slug: slug ?? null,
          imageUrl: image_url ?? null,
        },
        update: {
          name,
          slug: slug ?? null,
          imageUrl: image_url ?? null,
          deletedAt: null,
        },
      });

      if (created_by) {
        // Ensure the creator User row exists
        const userExists = await prisma.user.findUnique({
          where: { id: created_by },
        });

        if (userExists) {
          await prisma.auditLog.create({
            data: {
              orgId: id,
              entityType: "Organization",
              entityId: id,
              action: existingOrg ? AuditAction.UPDATE : AuditAction.CREATE,
              changedById: created_by,
              previousData: existingOrg
                ? (existingOrg as unknown as Prisma.InputJsonValue)
                : Prisma.JsonNull,
              newData: org as unknown as Prisma.InputJsonValue,
              reason: `Clerk Webhook: ${eventType}`,
            },
          });
        }
      }

      return NextResponse.json({ success: true, orgId: org.id });
    }

    if (eventType === "organization.deleted") {
      const { id } = evt.data;
      if (id) {
        const existingOrg = await prisma.organization.findUnique({
          where: { id },
        });

        if (existingOrg) {
          await prisma.organization.update({
            where: { id },
            data: { deletedAt: new Date() },
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    // -------------------------------------------------------------
    // ORGANIZATION MEMBERSHIP EVENTS (Roles & RBAC)
    // -------------------------------------------------------------
    if (
      eventType === "organizationMembership.created" ||
      eventType === "organizationMembership.updated"
    ) {
      const { organization, public_user_data, role } = evt.data;
      const orgId = organization.id;
      const userId = public_user_data.user_id;

      // Ensure user and organization records exist in local DB
      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email:
            public_user_data.identifier ||
            `${userId}@placeholder.local`,
          firstName: public_user_data.first_name ?? null,
          lastName: public_user_data.last_name ?? null,
          imageUrl: public_user_data.image_url ?? null,
        },
        update: {
          firstName: public_user_data.first_name ?? null,
          lastName: public_user_data.last_name ?? null,
          imageUrl: public_user_data.image_url ?? null,
        },
      });

      await prisma.organization.upsert({
        where: { id: orgId },
        create: {
          id: orgId,
          name: organization.name,
          slug: organization.slug ?? null,
          imageUrl: organization.image_url ?? null,
        },
        update: {
          name: organization.name,
          slug: organization.slug ?? null,
          imageUrl: organization.image_url ?? null,
        },
      });

      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          orgId_userId: { orgId, userId },
        },
      });

      const member = await prisma.organizationMember.upsert({
        where: {
          orgId_userId: { orgId, userId },
        },
        create: {
          orgId,
          userId,
          role,
        },
        update: {
          role,
        },
      });

      await prisma.auditLog.create({
        data: {
          orgId,
          entityType: "OrganizationMember",
          entityId: member.id,
          action: existingMember ? AuditAction.UPDATE : AuditAction.CREATE,
          changedById: userId,
          previousData: existingMember
            ? (existingMember as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          newData: member as unknown as Prisma.InputJsonValue,
          reason: `Clerk Webhook: ${eventType} (Role assigned: ${role})`,
        },
      });

      return NextResponse.json({ success: true, memberId: member.id });
    }

    if (eventType === "organizationMembership.deleted") {
      const { organization, public_user_data } = evt.data;
      const orgId = organization.id;
      const userId = public_user_data.user_id;

      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          orgId_userId: { orgId, userId },
        },
      });

      if (existingMember) {
        await prisma.organizationMember.delete({
          where: {
            orgId_userId: { orgId, userId },
          },
        });

        await prisma.auditLog.create({
          data: {
            orgId,
            entityType: "OrganizationMember",
            entityId: existingMember.id,
            action: AuditAction.SOFT_DELETE,
            changedById: userId,
            previousData:
              existingMember as unknown as Prisma.InputJsonValue,
            newData: { removed: true } as Prisma.InputJsonValue,
            reason: "Clerk Webhook: organizationMembership.deleted",
          },
        });
      }

      return NextResponse.json({ success: true });
    }

    // Default response for unhandled events
    return NextResponse.json({ received: true, type: eventType });
  } catch (error) {
    console.error(`[CLERK_WEBHOOK_HANDLER_ERROR] for ${eventType}:`, error);
    return new NextResponse("Internal Server Error processing webhook", {
      status: 500,
    });
  }
}
