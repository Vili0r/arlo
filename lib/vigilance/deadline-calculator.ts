/**
 * Regulatory Statutory Deadline Calculator
 *
 * Computes exact reporting due dates based on:
 * - Manufacturer awareness date
 * - Statutory days/hours count
 * - Calendar days vs Business days
 * - Jurisdiction-specific calculation conventions
 *
 * CRITICAL PRINCIPLE:
 * Deadlines are never hardcoded in UI components.
 * They are deterministic functions of awareness date, ruleset version, and statutory rules.
 */

import { DeadlineType, JurisdictionCode, RegulatoryDeadline } from "./types";

export interface DeadlineCalculationParams {
  jurisdiction: JurisdictionCode;
  awarenessDate: Date | string;
  deadlineDays?: number;
  deadlineHours?: number;
  deadlineType?: DeadlineType;
  calculationRule?: string;
  rulesetVersion: string;
}

/**
 * Calculates a regulatory deadline
 */
export function calculateRegulatoryDeadline(
  params: DeadlineCalculationParams
): RegulatoryDeadline {
  const awareness =
    typeof params.awarenessDate === "string"
      ? new Date(params.awarenessDate)
      : new Date(params.awarenessDate.getTime());

  if (isNaN(awareness.getTime())) {
    throw new Error("Invalid awareness date provided for deadline calculation");
  }

  const deadlineType = params.deadlineType || "CALENDAR_DAYS";
  let targetDate = new Date(awareness.getTime());

  if (deadlineType === "HOURS" && params.deadlineHours) {
    targetDate.setHours(targetDate.getHours() + params.deadlineHours);
  } else if (deadlineType === "BUSINESS_DAYS" && params.deadlineDays) {
    // Add business days (skipping Saturdays and Sundays)
    let added = 0;
    while (added < params.deadlineDays) {
      targetDate.setDate(targetDate.getDate() + 1);
      const day = targetDate.getDay();
      // 0 = Sunday, 6 = Saturday
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
  } else if (params.deadlineDays) {
    // Standard calendar days
    targetDate.setDate(targetDate.getDate() + params.deadlineDays);
  }

  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = diffMs < 0;

  return {
    jurisdiction: params.jurisdiction,
    awarenessDate: awareness.toISOString(),
    deadline: targetDate.toISOString(),
    deadlineType: deadlineType,
    calculationRule:
      params.calculationRule || `${params.jurisdiction}-${params.deadlineDays || params.deadlineHours}-${deadlineType}`,
    rulesetVersion: params.rulesetVersion,
    status: isOverdue ? "OVERDUE" : "OPEN",
    daysRemaining,
    isOverdue,
  };
}
