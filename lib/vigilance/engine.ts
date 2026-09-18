/**
 * Configurable Global Medical Device Reportability Engine
 *
 * Deterministic evaluation core:
 * Takes canonical factual answers + jurisdiction ruleset -> returns jurisdiction assessment
 * with triggered rules, supporting questions, unresolved questions, statutory deadline,
 * and comprehensive regulatory rationale.
 */

import {
  CanonicalAnswerValue,
  StoredQuestionAnswer,
  CANONICAL_QUESTION_MAP,
} from "./question-bank";
import {
  ConditionOperator,
  DeclarativeRule,
  GlobalVigilanceEvaluationResult,
  JurisdictionAssessment,
  JurisdictionCode,
  ReportabilityStatus,
  RuleCondition,
  RulesetDefinition,
} from "./types";
import { GLOBAL_RULESETS } from "./rules";
import { calculateRegulatoryDeadline } from "./deadline-calculator";

export interface EvaluationOptions {
  awarenessDate?: Date | string | null;
  rulesetVersionOverride?: string;
  incidentId?: string;
  // If true, evaluate only APPROVED answers; if false, evaluate APPROVED and SUGGESTED
  approvedOnly?: boolean;
}

/**
 * Checks if a single condition matches the given question answers map
 */
function evaluateCondition(
  condition: RuleCondition,
  answerMap: Map<string, StoredQuestionAnswer>
): { matches: boolean; isUnresolved: boolean } {
  const stored = answerMap.get(condition.questionId);
  const val = stored ? stored.answer : "NOT_YET_DETERMINED";

  // Check if answer is missing or unresolved
  if (!stored || val === "UNKNOWN" || val === "NOT_YET_DETERMINED") {
    if (condition.operator === "IS_UNKNOWN_OR_UNDETERMINED") {
      return { matches: true, isUnresolved: false };
    }
    if (
      condition.operator === "IN" &&
      Array.isArray(condition.value) &&
      (condition.value.includes("UNKNOWN") || condition.value.includes("NOT_YET_DETERMINED"))
    ) {
      return { matches: condition.value.includes(val), isUnresolved: false };
    }
    return { matches: false, isUnresolved: true };
  }

  switch (condition.operator) {
    case "EQUALS":
      return { matches: val === condition.value, isUnresolved: false };
    case "NOT_EQUALS":
      return { matches: val !== condition.value, isUnresolved: false };
    case "IN":
      return {
        matches: Array.isArray(condition.value) && condition.value.includes(val),
        isUnresolved: false,
      };
    case "NOT_IN":
      return {
        matches: Array.isArray(condition.value) && !condition.value.includes(val),
        isUnresolved: false,
      };
    case "IS_UNKNOWN_OR_UNDETERMINED":
      return {
        matches: false,
        isUnresolved: false,
      };
    default:
      return { matches: false, isUnresolved: false };
  }
}

/**
 * Evaluates a specific jurisdiction against canonical answers
 */
export function evaluateJurisdictionRuleset(
  ruleset: RulesetDefinition,
  answers: StoredQuestionAnswer[],
  options: EvaluationOptions = {}
): JurisdictionAssessment {
  const answerMap = new Map<string, StoredQuestionAnswer>();
  for (const a of answers) {
    if (options.approvedOnly && a.reviewStatus && a.reviewStatus !== "APPROVED") {
      continue;
    }
    answerMap.set(a.questionId, a);
  }

  const triggeredRules: DeclarativeRule[] = [];
  const candidateUnresolvedQuestionIds = new Set<string>();

  // Sort rules by priority descending
  const sortedRules = [...ruleset.rules].sort(
    (a, b) => (b.result.priority ?? 0) - (a.result.priority ?? 0)
  );

  for (const rule of sortedRules) {
    const matchType = rule.matchType || "ALL";
    let ruleMatches = false;
    let ruleHasUnresolved = false;

    if (matchType === "ALL") {
      let allMatch = true;
      for (const cond of rule.conditions) {
        const { matches, isUnresolved } = evaluateCondition(cond, answerMap);
        if (isUnresolved) {
          ruleHasUnresolved = true;
          candidateUnresolvedQuestionIds.add(cond.questionId);
        }
        if (!matches) {
          allMatch = false;
        }
      }
      ruleMatches = allMatch;
    } else {
      // matchType === "ANY"
      for (const cond of rule.conditions) {
        const { matches, isUnresolved } = evaluateCondition(cond, answerMap);
        if (isUnresolved) {
          candidateUnresolvedQuestionIds.add(cond.questionId);
        }
        if (matches) {
          ruleMatches = true;
          break;
        }
      }
    }

    if (ruleMatches) {
      triggeredRules.push(rule);
    }
  }

  // Determine winning rule
  const primaryTriggered = triggeredRules[0];

  let status: ReportabilityStatus = "NOT_REPORTABLE";
  let reportingCategory: string | null = null;
  let reportingReason: string | null = null;
  let deadlineStr: string | null = null;
  let deadlineTypeStr: string | null = null;
  let deadlineDaysVal: number | null = null;
  let requiredForm: string | null = null;
  let submissionMethod: string | null = null;
  let reviewerRequired = false;

  const supportingQuestionIds = new Set<string>();
  for (const rule of triggeredRules) {
    for (const c of rule.conditions) {
      supportingQuestionIds.add(c.questionId);
    }
  }

  // Check if core questions are UNKNOWN or NOT_YET_DETERMINED
  const coreCausality = answerMap.get("CAUSALITY_001");
  const isCausalityUnknown =
    !coreCausality ||
    coreCausality.answer === "UNKNOWN" ||
    coreCausality.answer === "NOT_YET_DETERMINED";

  if (primaryTriggered) {
    status = primaryTriggered.result.candidateReportability;
    reportingCategory = primaryTriggered.result.reportingCategory || null;
    reportingReason = primaryTriggered.result.reason;
    deadlineTypeStr = primaryTriggered.result.deadlineType || ruleset.defaultDeadlineType || "CALENDAR_DAYS";
    deadlineDaysVal = primaryTriggered.result.deadlineDays || null;
    requiredForm = primaryTriggered.result.requiredForm || null;
    submissionMethod = primaryTriggered.result.submissionMethod || null;
    reviewerRequired = primaryTriggered.result.reviewerRequired || false;

    // Calculate deadline if reportable and awarenessDate is provided
    if (status === "REPORTABLE" && options.awarenessDate && deadlineDaysVal) {
      try {
        const calc = calculateRegulatoryDeadline({
          jurisdiction: ruleset.jurisdiction,
          awarenessDate: options.awarenessDate,
          deadlineDays: deadlineDaysVal,
          deadlineHours: primaryTriggered.result.deadlineHours,
          deadlineType: primaryTriggered.result.deadlineType,
          calculationRule: primaryTriggered.result.deadlineCalculationRule,
          rulesetVersion: ruleset.version,
        });
        deadlineStr = calc.deadline;
      } catch (err) {
        console.warn(`[Vigilance Engine] Failed to calculate deadline for ${ruleset.jurisdiction}:`, err);
      }
    }
  } else {
    // If no rules triggered and core questions are unknown/pending, do NOT silently produce NOT_REPORTABLE!
    if (isCausalityUnknown) {
      status = "PENDING_INFORMATION";
      reportingCategory = "PENDING_CAUSALITY";
      reportingReason = "Assessment cannot be finalized: Device causality is unknown or not yet determined.";
      reviewerRequired = true;
      candidateUnresolvedQuestionIds.add("CAUSALITY_001");
    } else {
      status = "NOT_REPORTABLE";
      reportingCategory = "NON_REPORTABLE";
      reportingReason = `No statutory reporting criteria triggered under ${ruleset.regulatoryFramework}.`;
    }
  }

  const unresolvedQuestionsList = Array.from(candidateUnresolvedQuestionIds);

  return {
    jurisdiction: ruleset.jurisdiction,
    regulator: ruleset.regulator,
    regulatoryFramework: ruleset.regulatoryFramework,
    rulesetVersion: ruleset.version,
    assessedAt: new Date().toISOString(),
    status,
    reportingCategory,
    reportingReason,
    awarenessDate: options.awarenessDate ? new Date(options.awarenessDate).toISOString() : null,
    deadline: deadlineStr,
    deadlineType: deadlineTypeStr,
    deadlineDays: deadlineDaysVal,
    requiredForm,
    submissionMethod,
    triggeredRules: triggeredRules.map((r) => r.ruleId),
    supportingQuestions: Array.from(supportingQuestionIds),
    unresolvedQuestions: unresolvedQuestionsList,
    reviewerRequired,
    ruleExplanations: triggeredRules.map((r) => ({
      ruleId: r.ruleId,
      title: r.title,
      reason: r.result.reason,
      regulatoryReference: r.regulatoryReference,
    })),
  };
}

/**
 * Global Multi-Jurisdiction Assessment Evaluator
 */
export function evaluateAllJurisdictions(
  answers: StoredQuestionAnswer[],
  targetJurisdictions: JurisdictionCode[] = [
    "EU",
    "US_FDA",
    "CA_HEALTH_CANADA",
    "AU_TGA",
    "CN_NMPA",
    "JP_PMDA",
  ],
  options: EvaluationOptions = {}
): GlobalVigilanceEvaluationResult {
  const jurisdictionAssessments: Record<string, JurisdictionAssessment> = {};

  for (const jCode of targetJurisdictions) {
    const ruleset = GLOBAL_RULESETS[jCode];
    if (ruleset && ruleset.rules.length > 0) {
      jurisdictionAssessments[jCode] = evaluateJurisdictionRuleset(ruleset, answers, options);
    }
  }

  return {
    incidentId: options.incidentId,
    assessedAt: new Date().toISOString(),
    answers,
    jurisdictionAssessments,
  };
}
