import { z } from "zod";
import { CapaType, CapaPhase, ExtensionRequestStatus } from "@prisma/client";

export const AttachmentInputSchema = z.object({
  id: z.string().optional(),
  fileUrl: z.string().url("Invalid file URL"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().nullable().optional(),
  mimeType: z.string().nullable().optional(),
});

export const ExtensionRequestInputSchema = z.object({
  id: z.string().optional(),
  targetPhase: z.nativeEnum(CapaPhase),
  requestedDueDate: z.union([z.date(), z.string()]),
  justification: z.string().min(1, "Justification is required"),
  riskEvaluationRationale: z.string().nullable().optional(),
  status: z.nativeEnum(ExtensionRequestStatus).default(ExtensionRequestStatus.PENDING),
  requesterId: z.string().min(1, "Requester is required"),
  primaryApproverId: z.string().nullable().optional(),
  secondaryApproverId: z.string().nullable().optional(),
});

export const CapaInitiationInputSchema = z.object({
  problemStatement: z.string().min(1, "Problem statement is required"),
  containmentAction: z.string().nullable().optional(),
  dateDue: z.union([z.date(), z.string(), z.null()]).optional(),
  source: z.string().nullable().optional(),
  repeatCapa: z.boolean().default(false),
  capaReference: z.string().nullable().optional(),
  existingCapa: z.boolean().default(false),
  existingOpenCapaReference: z.string().nullable().optional(),
  existingCapaDueDate: z.union([z.date(), z.string(), z.null()]).optional(),
  processOrProduct: z.string().nullable().optional(),
  affectedArea: z.string().nullable().optional(),
  productDetails: z.string().nullable().optional(),
  relatedProcess: z.string().nullable().optional(),
  severityRanking: z.string().nullable().optional(),
  severityRationale: z.string().nullable().optional(),
  occurrenceRanking: z.string().nullable().optional(),
  occurrenceRationale: z.string().nullable().optional(),
  riskCategory: z.string().nullable().optional(),
  capaRequired: z.boolean().default(true),
  capaType: z.string().nullable().optional(),
  capaSummary: z.string().nullable().optional(),
  fscaRequired: z.boolean().default(false),
  fscaRefNumber: z.string().nullable().optional(),
  primaryApproverId: z.string().nullable().optional(),
  secondaryApproverId: z.string().nullable().optional(),
  completedById: z.string().nullable().optional(),
  completedAt: z.union([z.date(), z.string(), z.null()]).optional(),
  attachments: z.array(AttachmentInputSchema).default([]),
});

export const CapaInvestigationInputSchema = z.object({
  containmentSummary: z.string().nullable().optional(),
  investigationSummary: z.string().nullable().optional(),
  rootCauseDescription: z.string().nullable().optional(),
  rootCauseTools: z.array(z.string()).default([]),
  impactProductQuality: z.boolean().default(false),
  impactProductQualityRationale: z.string().nullable().optional(),
  planDueDate: z.union([z.date(), z.string(), z.null()]).optional(),
  investigatorId: z.string().nullable().optional(),
  primaryApproverId: z.string().nullable().optional(),
  secondaryApproverId: z.string().nullable().optional(),
  attachments: z.array(AttachmentInputSchema).default([]),
});

export const CapaImplementationInputSchema = z.object({
  actionPlan: z.string().nullable().optional(),
  actionPlanSummary: z.string().nullable().optional(),
  riskEvaluation: z.string().nullable().optional(),
  implementationDueDate: z.union([z.date(), z.string(), z.null()]).optional(),
  effectivenessCheckPlan: z.string().nullable().optional(),
  effectivenessDueDate: z.union([z.date(), z.string(), z.null()]).optional(),
  primaryApproverId: z.string().nullable().optional(),
  secondaryApproverId: z.string().nullable().optional(),
  attachments: z.array(AttachmentInputSchema).default([]),
});

export const CapaEffectivenessInputSchema = z.object({
  effectivenessVerificationSummary: z.string().nullable().optional(),
  ineffectiveJustification: z.string().nullable().optional(),
  dateDue: z.union([z.date(), z.string(), z.null()]).optional(),
  primaryApproverId: z.string().nullable().optional(),
  secondaryApproverId: z.string().nullable().optional(),
  attachments: z.array(AttachmentInputSchema).default([]),
});

export const CreateCapaSchema = z.object({
  shortDescription: z.string().min(1, "Short description is required"),
  type: z.nativeEnum(CapaType).default(CapaType.CORRECTIVE),
  currentPhase: z.nativeEnum(CapaPhase).default(CapaPhase.INITIATION),
  ownerId: z.string().min(1, "CAPA Owner is required"),
  cancellationRequested: z.boolean().default(false),
  cancellationJustification: z.string().nullable().optional(),

  // Phase Models
  initiation: CapaInitiationInputSchema,
  investigation: CapaInvestigationInputSchema.optional(),
  implementation: CapaImplementationInputSchema.optional(),
  effectiveness: CapaEffectivenessInputSchema.optional(),

  // 1:N Extension Requests & Root Attachments
  extensionRequests: z.array(ExtensionRequestInputSchema).default([]),
  attachments: z.array(AttachmentInputSchema).default([]),
});

export type CreateCapaFormValues = z.infer<typeof CreateCapaSchema>;
