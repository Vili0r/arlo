"use server";

import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateVigilance(data: any) {
  const { orgId, userId } = await requireOrgAuth();
  
  if (data.orgSlug && data.id) {
     const vigilance = await prisma.vigilanceDecisionTree.findUnique({
       where: { id: data.id, orgId }
     });
     if (!vigilance) return;
     
     const updated = await prisma.vigilanceDecisionTree.update({
       where: { id: data.id, orgId },
       data: {
         status: data.status,
         reportable: data.reportable,
         ownerId: data.ownerId || null,
         approverId: data.approverId || null,
         targetRegion: data.targetRegion || null,
         decision: data.decision || null,
         reportType: data.reportType || null,
         awarenessDate: data.awarenessDate ? new Date(data.awarenessDate) : null,
         dueDate: data.dueDate ? new Date(data.dueDate) : null,
         rationale: data.rationale || null,
         cancelledRationale: data.cancelledRationale || null,
         notes: data.notes || null,
         ...(data.newAttachments && data.newAttachments.length > 0 && {
           attachments: {
             create: data.newAttachments.map((a: any) => ({
               fileUrl: a.fileUrl,
               fileName: a.fileName,
               fileSize: a.fileSize,
               mimeType: a.mimeType,
               uploadedById: userId,
               orgId: orgId,
               complaintId: vigilance.complaintId,
             }))
           }
         })
       }
     });
     
     revalidatePath(`/${data.orgSlug}/complaints/${updated.complaintId}/vigilance`);
     return updated;
  }
}
