/**
 * Japan PMDA (Pharmaceuticals and Medical Devices Agency) Vigilance Ruleset
 *
 * Implements Pharmaceuticals and Medical Devices Act (PMD Act) Article 68-10:
 * - Reporting categories based on:
 *   - Seriousness (Death, Serious Disability, Injury)
 *   - Expectedness (Labeled/Predictable vs Unexpected/Unpredicted)
 *   - Device Malfunction vs Health Damage
 *   - Domestic vs Foreign occurrences
 * - Statutory timelines:
 *   - 7-Day: Unpredicted death or serious health damage; or unpredicted malfunction with death risk.
 *   - 15-Day: Predicted death/serious harm; unpredicted other malfunction with harm risk.
 *   - 30-Day: Predicted other malfunctions or periodic summary.
 */

import { DeclarativeRule, RulesetDefinition } from "../types";

export const JP_PMDA_RULES: DeclarativeRule[] = [
  // -------------------------------------------------------------
  // TRIGGER: 7-DAY REPORT - UNPREDICTED DEATH OR SERIOUS INJURY
  // -------------------------------------------------------------
  {
    ruleId: "PMDA-MDR-7DAY-UNPREDICTED-DEATH-001",
    jurisdiction: "JP_PMDA",
    version: "PMDA_MDR_2026_01",
    title: "7-Day Report: Unpredicted Death or Serious Harm",
    description: "Event resulting in death or serious injury that is not predictable / not described in package insert or labeling.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "OUTCOME_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "EXPECTEDNESS_001",
        operator: "EQUALS",
        value: "NO",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "UNPREDICTED_DEATH",
      reason: "Unpredicted death related to medical device. Mandatory 7-calendar-day expedited report to PMDA under PMD Act Article 68-10.",
      deadlineDays: 7,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "PMDA-7-CALENDAR-DAY",
      requiredForm: "PMDA Medical Device Malfunction & Adverse Event Report (Form 1)",
      submissionMethod: "PMDA Electronic Reporting System",
      priority: 95,
    },
    regulatoryReference: {
      jurisdiction: "JP_PMDA",
      regulator: "Pharmaceuticals and Medical Devices Agency (PMDA) / MHLW",
      regulationOrGuidance: "PMD Act (Act on Securing Quality, Efficacy and Safety of Products)",
      articleOrSection: "Article 68-10 / MHLW Ordinance No. 228",
      sourceUrl: "https://www.pmda.go.jp/english/",
      effectiveDate: "2014-11-25",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: 15-DAY REPORT - PREDICTED DEATH OR UNPREDICTED SERIOUS INJURY
  // -------------------------------------------------------------
  {
    ruleId: "PMDA-MDR-15DAY-PREDICTED-DEATH-001",
    jurisdiction: "JP_PMDA",
    version: "PMDA_MDR_2026_01",
    title: "15-Day Report: Predicted Death or Serious Health Damage",
    description: "Device-related death or serious injury that was predictable / described in package insert.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "OUTCOME_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "EXPECTEDNESS_001",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "PREDICTED_DEATH",
      reason: "Predicted death related to medical device. Mandatory 15-calendar-day report under PMD Act Article 68-10.",
      deadlineDays: 15,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "PMDA-15-CALENDAR-DAY",
      requiredForm: "PMDA Medical Device Malfunction & Adverse Event Report",
      submissionMethod: "PMDA Electronic Reporting System",
      priority: 85,
    },
    regulatoryReference: {
      jurisdiction: "JP_PMDA",
      regulator: "Pharmaceuticals and Medical Devices Agency (PMDA) / MHLW",
      regulationOrGuidance: "PMD Act",
      articleOrSection: "Article 68-10 § 15-day",
      effectiveDate: "2014-11-25",
    },
  },
  {
    ruleId: "PMDA-MDR-15DAY-MALFUNCTION-RECURRENCE-002",
    jurisdiction: "JP_PMDA",
    version: "PMDA_MDR_2026_01",
    title: "15-Day Report: Device Malfunction with Risk of Serious Harm on Recurrence",
    description: "Malfunction where occurrence of serious harm is feared upon recurrence.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "MALFUNCTION_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "MALFUNCTION_004",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "MALFUNCTION_SERIOUS_RISK",
      reason: "Malfunction of device where occurrence of serious harm is feared if recurred. Mandatory 15-day report to PMDA.",
      deadlineDays: 15,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "PMDA-15-CALENDAR-DAY",
      requiredForm: "PMDA Medical Device Malfunction & Adverse Event Report",
      submissionMethod: "PMDA Electronic Reporting System",
      priority: 80,
    },
    regulatoryReference: {
      jurisdiction: "JP_PMDA",
      regulator: "Pharmaceuticals and Medical Devices Agency (PMDA) / MHLW",
      regulationOrGuidance: "PMD Act",
      articleOrSection: "Article 68-10 § Malfunction 15-day",
      effectiveDate: "2014-11-25",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: 30-DAY REPORT - PREDICTED MALFUNCTION OR MINOR INJURY
  // -------------------------------------------------------------
  {
    ruleId: "PMDA-MDR-30DAY-OTHER-MALFUNCTION-001",
    jurisdiction: "JP_PMDA",
    version: "PMDA_MDR_2026_01",
    title: "30-Day Report: Predicted Device Malfunction / Other Health Damage",
    description: "Other predictable malfunction or non-severe harm reportable within 30 days.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "MALFUNCTION_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "EXPECTEDNESS_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "OUTCOME_001",
        operator: "EQUALS",
        value: "NO",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "OTHER_MALFUNCTION",
      reason: "Predictable malfunction reportable within 30 days under PMDA regulations.",
      deadlineDays: 30,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "PMDA-30-CALENDAR-DAY",
      requiredForm: "PMDA Medical Device Malfunction & Adverse Event Report",
      submissionMethod: "PMDA Electronic Reporting System",
      priority: 60,
    },
    regulatoryReference: {
      jurisdiction: "JP_PMDA",
      regulator: "Pharmaceuticals and Medical Devices Agency (PMDA) / MHLW",
      regulationOrGuidance: "PMD Act",
      articleOrSection: "Article 68-10 § 30-day",
      effectiveDate: "2014-11-25",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: NON-REPORTABLE UNDER PMDA
  // -------------------------------------------------------------
  {
    ruleId: "PMDA-MDR-NON-REPORTABLE-001",
    jurisdiction: "JP_PMDA",
    version: "PMDA_MDR_2026_01",
    title: "Non-Reportable under PMDA: No Device Causality and No Malfunction",
    description: "Device functioned as intended, did not malfunction, and did not cause patient injury.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_001",
        operator: "EQUALS",
        value: "NO",
      },
      {
        questionId: "MALFUNCTION_001",
        operator: "EQUALS",
        value: "NO",
      },
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "NON_REPORTABLE",
      reason: "Device did not malfunction and is not causal to harm. PMDA reporting criteria not triggered.",
      priority: 50,
    },
    regulatoryReference: {
      jurisdiction: "JP_PMDA",
      regulator: "Pharmaceuticals and Medical Devices Agency (PMDA) / MHLW",
      regulationOrGuidance: "PMD Act",
      articleOrSection: "Article 68-10",
      effectiveDate: "2014-11-25",
    },
  },
];

export const JP_PMDA_RULESET: RulesetDefinition = {
  jurisdiction: "JP_PMDA",
  regulator: "Pharmaceuticals and Medical Devices Agency (PMDA)",
  regulatoryFramework: "PMD Act Article 68-10 / MHLW Ordinance No. 228",
  version: "PMDA_MDR_2026_01",
  effectiveFrom: "2014-11-25",
  description: "Japan PMDA vigilance reporting ruleset distinguishing unpredicted vs predicted events, seriousness tiers, and 7/15/30 day statutory timelines.",
  rules: JP_PMDA_RULES,
  defaultDeadlineType: "CALENDAR_DAYS",
};
