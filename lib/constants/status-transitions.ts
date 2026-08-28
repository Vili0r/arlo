import {
  ComplaintStatus,
  InvestigationStatus,
  VigilanceStatus,
} from "@prisma/client";

// =============================================================================
// Status Transition Configuration for 21 CFR Part 11 Compliance
//
// Defines the allowed lifecycle transitions, display metadata, and stepper
// ordering for each regulated entity type. Changes to transition rules
// must be validated and documented per ISO 13485 change control.
// =============================================================================

export type EntityType = "Complaint" | "Investigation" | "Vigilance";

export interface StatusStepConfig {
  /** The enum value stored in the database */
  value: string;
  /** Human-readable label for the UI stepper */
  label: string;
  /** Short description shown on hover / in the modal */
  description: string;
  /** Tailwind color class for the stepper dot */
  color: string;
  /** Which statuses this status can transition TO */
  allowedNextStatuses: string[];
  /** Which statuses this status can REVERT back to */
  allowedPreviousStatuses?: string[];
  /** Optional flag indicating if this is a branch/alternative status outside the main linear path */
  isBranch?: boolean;
}

export interface EntityStatusConfig {
  entityType: EntityType;
  /** Prisma model name used for DB queries */
  modelName: "complaint" | "investigation" | "vigilanceDecisionTree";
  /** The field name that holds the status */
  statusField: "status";
  /** Ordered array of steps for the horizontal stepper */
  steps: StatusStepConfig[];
}

// -----------------------------------------------------------------------------
// Meaning of Signature Options (21 CFR Part 11 § 11.50)
// -----------------------------------------------------------------------------

export const SIGNATURE_MEANINGS = [
  "I am the author of this change",
  "I am approving this change",
  "I have reviewed and verified this change",
  "I am the responsible quality manager",
] as const;

export type SignatureMeaning = (typeof SIGNATURE_MEANINGS)[number];

// -----------------------------------------------------------------------------
// Complaint Lifecycle
// OPEN → UNDER_INVESTIGATION → PENDING_REVIEW → CLOSED
// REOPENED branches back into UNDER_INVESTIGATION
// -----------------------------------------------------------------------------

export const COMPLAINT_STATUS_CONFIG: EntityStatusConfig = {
  entityType: "Complaint",
  modelName: "complaint",
  statusField: "status",
  steps: [
    {
      value: ComplaintStatus.OPEN,
      label: "Open",
      description: "Complaint has been logged and is awaiting triage.",
      color: "bg-blue-500",
      allowedNextStatuses: [ComplaintStatus.UNDER_INVESTIGATION],
      allowedPreviousStatuses: [],
    },
    {
      value: ComplaintStatus.UNDER_INVESTIGATION,
      label: "Under Investigation",
      description:
        "Investigation is actively underway by the assigned investigator.",
      color: "bg-amber-500",
      allowedNextStatuses: [ComplaintStatus.PENDING_REVIEW],
      allowedPreviousStatuses: [ComplaintStatus.OPEN],
    },
    {
      value: ComplaintStatus.PENDING_REVIEW,
      label: "Pending Review",
      description:
        "Investigation is complete. Awaiting QA Manager review and sign-off.",
      color: "bg-orange-500",
      allowedNextStatuses: [ComplaintStatus.CLOSED],
      allowedPreviousStatuses: [ComplaintStatus.UNDER_INVESTIGATION],
    },
    {
      value: ComplaintStatus.CLOSED,
      label: "Closed",
      description:
        "Complaint has been resolved and closed with final disposition.",
      color: "bg-green-500",
      allowedNextStatuses: [ComplaintStatus.REOPENED],
      allowedPreviousStatuses: [],
    },
    {
      value: ComplaintStatus.REOPENED,
      label: "Reopened",
      description:
        "Complaint was reopened due to new evidence or regulatory requirement.",
      color: "bg-red-500",
      isBranch: true,
      allowedNextStatuses: [ComplaintStatus.UNDER_INVESTIGATION],
      allowedPreviousStatuses: [ComplaintStatus.CLOSED],
    },
  ],
};

// -----------------------------------------------------------------------------
// Investigation Lifecycle
// NOT_STARTED → IN_PROGRESS → COMPLETED
// NOT_REQUIRED is an alternative terminal branch from NOT_STARTED
// -----------------------------------------------------------------------------

export const INVESTIGATION_STATUS_CONFIG: EntityStatusConfig = {
  entityType: "Investigation",
  modelName: "investigation",
  statusField: "status",
  steps: [
    {
      value: InvestigationStatus.NOT_STARTED,
      label: "Not Started",
      description: "Investigation has been created but work has not begun.",
      color: "bg-zinc-500",
      allowedNextStatuses: [
        InvestigationStatus.IN_PROGRESS,
        InvestigationStatus.NOT_REQUIRED,
      ],
      allowedPreviousStatuses: [],
    },
    {
      value: InvestigationStatus.IN_PROGRESS,
      label: "In Progress",
      description:
        "Active investigation — sample analysis, risk review, or data collection underway.",
      color: "bg-amber-500",
      allowedNextStatuses: [InvestigationStatus.COMPLETED],
      allowedPreviousStatuses: [InvestigationStatus.NOT_STARTED],
    },
    {
      value: InvestigationStatus.COMPLETED,
      label: "Completed",
      description:
        "Investigation is complete with summary signed and locked.",
      color: "bg-green-500",
      allowedNextStatuses: [],
      allowedPreviousStatuses: [InvestigationStatus.IN_PROGRESS],
    },
    {
      value: InvestigationStatus.NOT_REQUIRED,
      label: "Not Required",
      description:
        "Investigation has been determined as not required with documented rationale.",
      color: "bg-zinc-400",
      isBranch: true,
      allowedNextStatuses: [],
      allowedPreviousStatuses: [InvestigationStatus.NOT_STARTED],
    },
  ],
};

// -----------------------------------------------------------------------------
// Vigilance Lifecycle
// PENDING → REPORTABLE / NOT_REPORTABLE → SUBMITTED
// -----------------------------------------------------------------------------

export const VIGILANCE_STATUS_CONFIG: EntityStatusConfig = {
  entityType: "Vigilance",
  modelName: "vigilanceDecisionTree",
  statusField: "status",
  steps: [
    {
      value: VigilanceStatus.PENDING,
      label: "Pending",
      description:
        "Vigilance assessment is pending initial reportability decision.",
      color: "bg-zinc-500",
      allowedNextStatuses: [
        VigilanceStatus.REPORTABLE,
        VigilanceStatus.NOT_REPORTABLE,
      ],
      allowedPreviousStatuses: [],
    },
    {
      value: VigilanceStatus.REPORTABLE,
      label: "Reportable",
      description:
        "Event has been determined as reportable to the competent authority.",
      color: "bg-red-500",
      allowedNextStatuses: [VigilanceStatus.SUBMITTED],
      allowedPreviousStatuses: [VigilanceStatus.PENDING],
    },
    {
      value: VigilanceStatus.NOT_REPORTABLE,
      label: "Not Reportable",
      description:
        "Event has been assessed and determined as non-reportable with rationale.",
      color: "bg-green-500",
      isBranch: true,
      allowedNextStatuses: [],
      allowedPreviousStatuses: [VigilanceStatus.PENDING],
    },
    {
      value: VigilanceStatus.SUBMITTED,
      label: "Submitted",
      description:
        "Vigilance report has been submitted to the regulatory authority.",
      color: "bg-purple-500",
      allowedNextStatuses: [],
      allowedPreviousStatuses: [VigilanceStatus.REPORTABLE],
    },
  ],
};

// -----------------------------------------------------------------------------
// Lookup helpers
// -----------------------------------------------------------------------------

const CONFIG_MAP: Record<EntityType, EntityStatusConfig> = {
  Complaint: COMPLAINT_STATUS_CONFIG,
  Investigation: INVESTIGATION_STATUS_CONFIG,
  Vigilance: VIGILANCE_STATUS_CONFIG,
};

export function getStatusConfig(entityType: EntityType): EntityStatusConfig {
  return CONFIG_MAP[entityType];
}

export function getStepConfig(
  entityType: EntityType,
  status: string
): StatusStepConfig | undefined {
  return CONFIG_MAP[entityType].steps.find((s) => s.value === status);
}

export function isTransitionAllowed(
  entityType: EntityType,
  currentStatus: string,
  targetStatus: string
): boolean {
  const step = getStepConfig(entityType, currentStatus);
  if (!step) return false;
  return (
    step.allowedNextStatuses.includes(targetStatus) ||
    (step.allowedPreviousStatuses?.includes(targetStatus) ?? false)
  );
}

export function isRevertTransition(
  entityType: EntityType,
  currentStatus: string,
  targetStatus: string
): boolean {
  const step = getStepConfig(entityType, currentStatus);
  return step?.allowedPreviousStatuses?.includes(targetStatus) ?? false;
}

export function getNextStatuses(
  entityType: EntityType,
  currentStatus: string
): StatusStepConfig[] {
  const step = getStepConfig(entityType, currentStatus);
  if (!step) return [];
  const config = getStatusConfig(entityType);
  return config.steps.filter((s) =>
    step.allowedNextStatuses.includes(s.value)
  );
}

export function getPreviousStatuses(
  entityType: EntityType,
  currentStatus: string
): StatusStepConfig[] {
  const step = getStepConfig(entityType, currentStatus);
  if (!step || !step.allowedPreviousStatuses) return [];
  const config = getStatusConfig(entityType);
  return config.steps.filter((s) =>
    step.allowedPreviousStatuses?.includes(s.value)
  );
}
