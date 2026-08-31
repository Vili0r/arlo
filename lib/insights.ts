export type InsightCardId =
  | "VIGILANCE_SLA"
  | "MY_APPROVALS"
  | "MY_INVESTIGATIONS"
  | "MY_TASKS"
  | "CAPA_PIPELINE"
  | "SAMPLE_STATUS"
  | "CUSTOMER_COMMUNICATION"
  | "AUDIT_ACTIVITY";

export interface InsightCardMeta {
  id: InsightCardId;
  title: string;
  subtitle: string;
  description: string;
  category: "Compliance & Vigilance" | "My Worklist" | "Quality Operations";
  badge: string;
  recommendedRoles: string[];
}

export const INSIGHT_CARD_CATALOG: Record<InsightCardId, InsightCardMeta> = {
  VIGILANCE_SLA: {
    id: "VIGILANCE_SLA",
    title: "Regulatory Vigilance Deadlines",
    subtitle: "5d / 15d / 30d Statutory Countdowns",
    description:
      "Tracks impending regulatory reporting deadlines under FDA 21 CFR 803 and EU MDR Article 87 based on complaint awareness dates.",
    category: "Compliance & Vigilance",
    badge: "EU MDR / FDA",
    recommendedRoles: ["org:admin", "org:qa_manager", "org:vigilance_lead"],
  },
  MY_APPROVALS: {
    id: "MY_APPROVALS",
    title: "Pending Approvals & Sign-Offs",
    subtitle: "21 CFR Part 11 Electronic Signature Queue",
    description:
      "Records awaiting sign-off where you are designated as the approving authority, enforcing separation of duties from investigators.",
    category: "My Worklist",
    badge: "Part 11",
    recommendedRoles: ["org:admin", "org:qa_manager"],
  },
  MY_INVESTIGATIONS: {
    id: "MY_INVESTIGATIONS",
    title: "My Active Investigations",
    subtitle: "Assigned Complaints & Root Cause Work",
    description:
      "Complaints where you are the assigned investigator with pending sample evaluations, risk reviews, or investigation summaries.",
    category: "My Worklist",
    badge: "ISO 13485",
    recommendedRoles: ["org:complaint_investigator", "org:qa_manager"],
  },
  MY_TASKS: {
    id: "MY_TASKS",
    title: "Assigned Action Tasks",
    subtitle: "Sub-Tasks & Correction Follow-Ups",
    description:
      "Open action items and follow-up sub-tasks assigned to you, prioritized by upcoming and overdue target dates.",
    category: "My Worklist",
    badge: "Tasks",
    recommendedRoles: [
      "org:complaint_investigator",
      "org:capa_owner",
      "org:member",
    ],
  },
  CAPA_PIPELINE: {
    id: "CAPA_PIPELINE",
    title: "CAPA Phase Progression",
    subtitle: "Active CAPAs by Milestone Lifecycle",
    description:
      "Real-time pipeline breakdown across Action Planning, Implementation, Effectiveness Verification, and Final Review.",
    category: "Quality Operations",
    badge: "CAPA",
    recommendedRoles: ["org:capa_owner", "org:qa_manager", "org:admin"],
  },
  SAMPLE_STATUS: {
    id: "SAMPLE_STATUS",
    title: "Sample Evaluation Pipeline",
    subtitle: "Physical Device Return & Lab Triage",
    description:
      "Live status of physical complaint samples: in transit, received, decontamination, and lab evaluation progress.",
    category: "Quality Operations",
    badge: "Lab",
    recommendedRoles: ["org:complaint_investigator", "org:qa_manager"],
  },
  CUSTOMER_COMMUNICATION: {
    id: "CUSTOMER_COMMUNICATION",
    title: "Customer Follow-Up Queue",
    subtitle: "Pending Inquiries & Feedback",
    description:
      "Customer communication threads awaiting manufacturer replies or customer response to clarification inquiries.",
    category: "Quality Operations",
    badge: "PMS",
    recommendedRoles: ["org:complaint_investigator", "org:member"],
  },
  AUDIT_ACTIVITY: {
    id: "AUDIT_ACTIVITY",
    title: "Live Audit Trail Feed",
    subtitle: "21 CFR Part 11 Immutable Log",
    description:
      "Recent system modifications, status transitions, and electronic signatures across all team members.",
    category: "Compliance & Vigilance",
    badge: "Audit",
    recommendedRoles: ["org:admin", "org:qa_manager", "org:member"],
  },
};

export const ROLE_PRESETS: Record<
  string,
  { label: string; description: string; defaultCards: InsightCardId[] }
> = {
  "org:admin": {
    label: "Administrator / QA Director",
    description:
      "Focus on statutory reporting deadlines, pending sign-offs, and CAPA milestone health.",
    defaultCards: ["MY_APPROVALS", "VIGILANCE_SLA", "CAPA_PIPELINE"],
  },
  "org:qa_manager": {
    label: "QA Manager",
    description:
      "Focus on 21 CFR Part 11 sign-offs, regulatory reporting clocks, and open investigation progress.",
    defaultCards: ["MY_APPROVALS", "VIGILANCE_SLA", "MY_INVESTIGATIONS"],
  },
  "org:complaint_investigator": {
    label: "Complaint Investigator",
    description:
      "Focus on your assigned complaint investigations, pending lab samples, and action tasks.",
    defaultCards: ["MY_INVESTIGATIONS", "MY_TASKS", "SAMPLE_STATUS"],
  },
  "org:capa_owner": {
    label: "CAPA Owner / Process Lead",
    description:
      "Focus on CAPA phase progression milestones and assigned corrective action tasks.",
    defaultCards: ["CAPA_PIPELINE", "MY_TASKS", "VIGILANCE_SLA"],
  },
  "org:vigilance_lead": {
    label: "Vigilance & Regulatory Lead",
    description:
      "Focus on statutory reporting deadlines, regulatory decisions, and Part 11 sign-offs.",
    defaultCards: ["VIGILANCE_SLA", "MY_APPROVALS", "AUDIT_ACTIVITY"],
  },
  "org:member": {
    label: "Quality Team Member",
    description:
      "Focus on assigned follow-up tasks, customer inquiries, and recent activity.",
    defaultCards: ["MY_TASKS", "CUSTOMER_COMMUNICATION", "AUDIT_ACTIVITY"],
  },
};

export function getDefaultCardsForRole(role?: string | null): InsightCardId[] {
  if (role && ROLE_PRESETS[role]) {
    return ROLE_PRESETS[role].defaultCards;
  }
  return ["MY_APPROVALS", "VIGILANCE_SLA", "MY_INVESTIGATIONS"];
}
