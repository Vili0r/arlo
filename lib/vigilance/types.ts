/**
 * Types & Interfaces for the Global Medical Device Reportability Engine
 */

import { CanonicalAnswerValue, StoredQuestionAnswer } from "./question-bank";

export type JurisdictionCode =
  | "EU"
  | "US_FDA"
  | "CA_HEALTH_CANADA"
  | "AU_TGA"
  | "CN_NMPA"
  | "JP_PMDA"
  | "GB_MHRA"
  | "BR_ANVISA"
  | "MX_COFEPRIS"
  | "AR_ANMAT"
  | "CO_INVIMA"
  | "CL_ISP";

export type ReportabilityStatus =
  | "REPORTABLE"
  | "NOT_REPORTABLE"
  | "PENDING_INFORMATION"
  | "REQUIRES_REVIEW"
  | "EXEMPT"
  | "NOT_APPLICABLE";

export type DeadlineType = "CALENDAR_DAYS" | "BUSINESS_DAYS" | "HOURS" | "IMMEDIATE";

export interface RegulatoryReference {
  jurisdiction: JurisdictionCode;
  regulator: string;
  regulationOrGuidance: string;
  articleOrSection?: string;
  sourceUrl?: string;
  effectiveDate: string;
  reviewDate?: string;
  notes?: string;
  requiresRegulatoryValidation?: boolean;
}

export type ConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "IN"
  | "NOT_IN"
  | "IS_UNKNOWN_OR_UNDETERMINED";

export interface RuleCondition {
  questionId: string;
  operator: ConditionOperator;
  value?: CanonicalAnswerValue | CanonicalAnswerValue[];
}

export interface RuleAction {
  candidateReportability: ReportabilityStatus;
  reportingCategory?: string;
  reason: string;
  deadlineDays?: number;
  deadlineHours?: number;
  deadlineType?: DeadlineType;
  deadlineCalculationRule?: string;
  requiredForm?: string;
  submissionMethod?: string;
  reviewerRequired?: boolean;
  priority?: number; // Higher number takes precedence among conflicting rules
}

export interface DeclarativeRule {
  ruleId: string;
  jurisdiction: JurisdictionCode;
  version: string;
  title: string;
  description: string;
  conditions: RuleCondition[];
  // If matchType is "ALL" (default), every condition must match. If "ANY", at least one.
  matchType?: "ALL" | "ANY";
  result: RuleAction;
  regulatoryReference: RegulatoryReference;
}

export interface RulesetDefinition {
  jurisdiction: JurisdictionCode;
  regulator: string;
  regulatoryFramework: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  description: string;
  rules: DeclarativeRule[];
  defaultDeadlineType?: DeadlineType;
}

export interface RegulatoryDeadline {
  jurisdiction: JurisdictionCode;
  incidentId?: string;
  awarenessDate: string;
  deadline: string;
  deadlineType: string;
  calculationRule: string;
  rulesetVersion: string;
  status: "OPEN" | "MET" | "OVERDUE" | "NOT_APPLICABLE";
  daysRemaining?: number;
  isOverdue?: boolean;
}

export interface JurisdictionAssessment {
  jurisdiction: JurisdictionCode;
  regulator: string;
  regulatoryFramework: string;
  rulesetVersion: string;
  assessedAt: string;

  status: ReportabilityStatus;
  reportingCategory?: string | null;
  reportingReason?: string | null;

  awarenessDate?: string | null;
  deadline?: string | null;
  deadlineType?: string | null;
  deadlineDays?: number | null;

  requiredForm?: string | null;
  submissionMethod?: string | null;

  triggeredRules: string[];
  supportingQuestions: string[];
  unresolvedQuestions: string[];
  reviewerRequired: boolean;

  approvedBy?: string | null;
  approvedAt?: string | null;

  // Rich explainability items
  ruleExplanations: Array<{
    ruleId: string;
    title: string;
    reason: string;
    regulatoryReference: RegulatoryReference;
  }>;
}

export interface GlobalVigilanceEvaluationResult {
  incidentId?: string;
  assessedAt: string;
  answers: StoredQuestionAnswer[];
  jurisdictionAssessments: Record<string, JurisdictionAssessment>;
}
