import {
  ComplaintStatus,
  InvestigationStatus,
  VigilanceStatus,
  CommunicationStatus,
} from "@prisma/client";

// =============================================================================
// Status Transition Configuration for 21 CFR Part 11 Compliance
//
// Defines the allowed lifecycle transitions, display metadata, and stepper
// ordering for each regulated entity type. Changes to transition rules
// must be validated and documented per ISO 13485 change control.
// =============================================================================

export type EntityType =
  | "Complaint"
  | "Investigation"
  | "Vigilance"
  | "CustomerCommunication";

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
  modelName:
    | "complaint"
    | "investigation"
    | "vigilanceDecisionTree"
    | "customerCommunication";
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
// OPEN → IN_PROGRESS → PENDING_RESPONSE → CLOSED
// REOPENED branches back into IN_PROGRESS
// -----------------------------------------------------------------------------

const COMPLAINT_IN_PROGRESS =
  (ComplaintStatus as Record<string, string>).IN_PROGRESS || "IN_PROGRESS";
const COMPLAINT_PENDING_RESPONSE =
  (ComplaintStatus as Record<string, string>).PENDING_RESPONSE ||
  "PENDING_RESPONSE";

export const COMPLAINT_STATUS_CONFIG: EntityStatusConfig = {
  entityType: "Complaint",
  modelName: "complaint",
  statusField: "status",
  steps: [
    {
      value: ComplaintStatus.OPEN,
      label: "Open",
      description:
        "Complaint has been logged and is awaiting triage and assignment.",
      color: "bg-blue-500",
      allowedNextStatuses: [COMPLAINT_IN_PROGRESS],
      allowedPreviousStatuses: [],
    },
    {
      value: COMPLAINT_IN_PROGRESS,
      label: "In Progress",
      description:
        "Complaint workflows, investigations, and communications are actively underway.",
      color: "bg-amber-500",
      allowedNextStatuses: [COMPLAINT_PENDING_RESPONSE],
      allowedPreviousStatuses: [ComplaintStatus.OPEN],
    },
    {
      value: COMPLAINT_PENDING_RESPONSE,
      label: "Pending Response",
      description:
        "Workflows completed. Awaiting final customer communication or regulatory sign-off.",
      color: "bg-orange-500",
      allowedNextStatuses: [ComplaintStatus.CLOSED],
      allowedPreviousStatuses: [COMPLAINT_IN_PROGRESS],
    },
    {
      value: ComplaintStatus.CLOSED,
      label: "Closed",
      description:
        "Complaint has been resolved and closed. All direct linkages are verified completed.",
      color: "bg-green-500",
      allowedNextStatuses: [ComplaintStatus.REOPENED],
      allowedPreviousStatuses: [
        COMPLAINT_PENDING_RESPONSE,
        COMPLAINT_IN_PROGRESS,
      ],
    },
    {
      value: ComplaintStatus.REOPENED,
      label: "Reopened",
      description:
        "Complaint was reopened due to new evidence, follow-up recurrence, or regulatory requirement.",
      color: "bg-red-500",
      isBranch: true,
      allowedNextStatuses: [COMPLAINT_IN_PROGRESS],
      allowedPreviousStatuses: [ComplaintStatus.CLOSED],
    },
  ],
};

// -----------------------------------------------------------------------------
// Investigation Lifecycle
// NOT_STARTED → IN_PROGRESS → UNDER_REVIEW → COMPLETED
// NOT_REQUIRED is an alternative terminal branch from NOT_STARTED
// -----------------------------------------------------------------------------

const STATUS_UNDER_REVIEW =
  (InvestigationStatus as Record<string, string>).UNDER_REVIEW || "UNDER_REVIEW";

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
      label: "Under Investigation",
      description:
        "Active investigation — sample analysis, risk review, or data collection underway.",
      color: "bg-amber-500",
      allowedNextStatuses: [STATUS_UNDER_REVIEW],
      allowedPreviousStatuses: [InvestigationStatus.NOT_STARTED],
    },
    {
      value: STATUS_UNDER_REVIEW,
      label: "Under Review",
      description:
        "Investigation is submitted and awaiting formal review and sign-off by Quality Assurance.",
      color: "bg-purple-500",
      allowedNextStatuses: [InvestigationStatus.COMPLETED],
      allowedPreviousStatuses: [InvestigationStatus.IN_PROGRESS],
    },
    {
      value: InvestigationStatus.COMPLETED,
      label: "Completed",
      description:
        "Investigation is complete with summary signed, approved, and locked.",
      color: "bg-green-500",
      allowedNextStatuses: [],
      allowedPreviousStatuses: [
        STATUS_UNDER_REVIEW,
        InvestigationStatus.IN_PROGRESS,
      ],
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
// Customer Communication Lifecycle
// OPEN → IN_PROGRESS → CLOSED
// -----------------------------------------------------------------------------

export const CUSTOMER_COMMUNICATION_STATUS_CONFIG: EntityStatusConfig = {
  entityType: "CustomerCommunication",
  modelName: "customerCommunication",
  statusField: "status",
  steps: [
    {
      value: CommunicationStatus.OPEN,
      label: "Open",
      description:
        "Customer inquiry or clarification request has been logged and is pending action.",
      color: "bg-amber-500",
      allowedNextStatuses: [
        CommunicationStatus.IN_PROGRESS,
        CommunicationStatus.CLOSED,
      ],
      allowedPreviousStatuses: [],
    },
    {
      value: CommunicationStatus.IN_PROGRESS,
      label: "In Progress",
      description:
        "Inquiries dispatched to customer or customer response is actively being processed.",
      color: "bg-purple-500",
      allowedNextStatuses: [CommunicationStatus.CLOSED],
      allowedPreviousStatuses: [CommunicationStatus.OPEN],
    },
    {
      value: CommunicationStatus.CLOSED,
      label: "Closed",
      description:
        "Customer communication completed, clarification received and documented.",
      color: "bg-green-500",
      allowedNextStatuses: [],
      allowedPreviousStatuses: [
        CommunicationStatus.IN_PROGRESS,
        CommunicationStatus.OPEN,
      ],
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
  CustomerCommunication: CUSTOMER_COMMUNICATION_STATUS_CONFIG,
};

export function getStatusConfig(entityType: EntityType): EntityStatusConfig {
  return CONFIG_MAP[entityType];
}

export function getStepConfig(
  entityType: EntityType,
  status: string
): StatusStepConfig | undefined {
  const config = CONFIG_MAP[entityType];
  if (!config) return undefined;

  // Exact match
  const exact = config.steps.find((s) => s.value === status);
  if (exact) return exact;

  // Case-insensitive match
  const caseMatch = config.steps.find(
    (s) => s.value.toLowerCase() === (status || "").toLowerCase()
  );
  if (caseMatch) return caseMatch;

  // Fallback aliases for Complaint
  if (entityType === "Complaint") {
    if (status === "UNDER_INVESTIGATION" || status === "IN_PROGRESS") {
      return (
        config.steps.find((s) => s.value === "IN_PROGRESS") ||
        config.steps.find((s) => s.value === "UNDER_INVESTIGATION")
      );
    }
    if (status === "PENDING_REVIEW" || status === "PENDING_RESPONSE") {
      return (
        config.steps.find((s) => s.value === "PENDING_RESPONSE") ||
        config.steps.find((s) => s.value === "PENDING_REVIEW")
      );
    }
  }

  // Fallback for Investigation
  if (entityType === "Investigation") {
    if (status === "IN_PROGRESS" || status === "UNDER_INVESTIGATION") {
      return config.steps.find((s) => s.value === "IN_PROGRESS");
    }
    if (status === "UNDER_REVIEW" || status === "IN_REVIEW") {
      return config.steps.find((s) => s.value === "UNDER_REVIEW");
    }
  }

  return undefined;
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
  if (!step || !step.allowedNextStatuses) return [];
  const seen = new Set<string>();
  return step.allowedNextStatuses
    .map((targetVal) => getStepConfig(entityType, targetVal))
    .filter((s): s is StatusStepConfig => {
      if (!s || seen.has(s.value)) return false;
      seen.add(s.value);
      return true;
    });
}

export function getPreviousStatuses(
  entityType: EntityType,
  currentStatus: string
): StatusStepConfig[] {
  const step = getStepConfig(entityType, currentStatus);
  if (!step || !step.allowedPreviousStatuses) return [];
  const seen = new Set<string>();
  return step.allowedPreviousStatuses
    .map((targetVal) => getStepConfig(entityType, targetVal))
    .filter((s): s is StatusStepConfig => {
      if (!s || seen.has(s.value)) return false;
      seen.add(s.value);
      return true;
    });
}
