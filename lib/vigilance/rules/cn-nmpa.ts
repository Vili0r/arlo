/**
 * China NMPA (National Medical Products Administration) Vigilance Ruleset
 *
 * Implements State Council Decree No. 739 (Regulations on Supervision and Administration
 * of Medical Devices) & SAMR Order No. 1 (Adverse Event Monitoring and Re-evaluation):
 *
 * CRITICAL NMPA REGULATORY LOGIC:
 * - "Report when in doubt" (怀疑即报): Suspected medical device adverse events should be reported.
 * - Individual adverse event deadlines:
 *   - Death events: Report within 7 calendar days (immediate notification).
 *   - Severe injury / potential severe injury or death: Report within 15 calendar days.
 *   - Other adverse events: Periodic / monitoring evaluation.
 *
 * Note: NMPA "report when in doubt" applies ONLY within CN_NMPA ruleset.
 * It is NOT applied globally to other jurisdictions.
 */

import { DeclarativeRule, RulesetDefinition } from "../types";

export const CN_NMPA_RULES: DeclarativeRule[] = [
  // -------------------------------------------------------------
  // TRIGGER: 7-DAY REPORT - DEATH OR SUSPECTED DEATH EVENT
  // -------------------------------------------------------------
  {
    ruleId: "NMPA-MDR-7DAY-DEATH-001",
    jurisdiction: "CN_NMPA",
    version: "NMPA_MDR_2026_01",
    title: "7-Calendar-Day Report: Adverse Event Resulting in Death",
    description: "Medical device adverse event leading to death or suspected death of a patient/user.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "OUTCOME_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "EVENT_002",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "DEATH",
      reason: "Device-related adverse event resulted in death. Mandatory 7-calendar-day expedited report under NMPA Decree No. 739 / Order No. 1 Article 23.",
      deadlineDays: 7,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "NMPA-7-CALENDAR-DAY",
      requiredForm: "National Medical Device Adverse Event Monitoring System Report",
      submissionMethod: "NMPA Adverse Event Monitoring System (Online System)",
      priority: 90,
    },
    regulatoryReference: {
      jurisdiction: "CN_NMPA",
      regulator: "National Medical Products Administration (NMPA)",
      regulationOrGuidance: "State Council Decree No. 739 & SAMR Order No. 1",
      articleOrSection: "SAMR Order No. 1 Article 23(1)",
      sourceUrl: "https://www.nmpa.gov.cn",
      effectiveDate: "2019-01-01",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: 15-DAY REPORT - SEVERE INJURY / POSSIBLE SEVERE INJURY
  // -------------------------------------------------------------
  {
    ruleId: "NMPA-MDR-15DAY-SEVERE-INJURY-001",
    jurisdiction: "CN_NMPA",
    version: "NMPA_MDR_2026_01",
    title: "15-Calendar-Day Report: Severe Injury or Possible Severe Injury",
    description: "Medical device adverse event causing severe injury or where recurrence/deterioration could lead to severe harm.",
    matchType: "ANY",
    conditions: [
      {
        questionId: "OUTCOME_002",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "OUTCOME_003",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "POTENTIAL_003",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "SEVERE_INJURY",
      reason: "Adverse event caused or may cause severe injury under NMPA criteria. 15-calendar-day report mandatory under SAMR Order No. 1 Article 23(2).",
      deadlineDays: 15,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "NMPA-15-CALENDAR-DAY",
      requiredForm: "National Medical Device Adverse Event Monitoring System Report",
      submissionMethod: "NMPA Adverse Event Monitoring System (Online System)",
      priority: 75,
    },
    regulatoryReference: {
      jurisdiction: "CN_NMPA",
      regulator: "National Medical Products Administration (NMPA)",
      regulationOrGuidance: "SAMR Order No. 1",
      articleOrSection: "Article 23(2)",
      sourceUrl: "https://www.nmpa.gov.cn",
      effectiveDate: "2019-01-01",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: NMPA "REPORT WHEN IN DOUBT" (怀疑即报) - UNKNOWN CAUSALITY + SEVERE OUTCOME
  // -------------------------------------------------------------
  {
    ruleId: "NMPA-MDR-DOUBT-REPORTING-001",
    jurisdiction: "CN_NMPA",
    version: "NMPA_MDR_2026_01",
    title: "NMPA Report When in Doubt (怀疑即报): Suspected Event with Unknown Causality",
    description: "Under NMPA doctrine, if an adverse event occurred and device relationship cannot be ruled out (unknown), report as a suspected event.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "EVENT_003",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "CAUSALITY_001",
        operator: "IN",
        value: ["UNKNOWN", "NOT_YET_DETERMINED"],
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "SUSPECTED_ADVERSE_EVENT",
      reason: "NMPA principle of 'Report When in Doubt' (怀疑即报): Event relationship cannot be ruled out. Must report as a suspected adverse event within 15 days.",
      deadlineDays: 15,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "NMPA-15-CALENDAR-DAY",
      requiredForm: "National Medical Device Adverse Event Monitoring System Report",
      submissionMethod: "NMPA Adverse Event Monitoring System",
      priority: 70,
    },
    regulatoryReference: {
      jurisdiction: "CN_NMPA",
      regulator: "National Medical Products Administration (NMPA)",
      regulationOrGuidance: "SAMR Order No. 1 / NMPA Adverse Event Guidelines",
      articleOrSection: "Article 4 & Article 23",
      sourceUrl: "https://www.nmpa.gov.cn",
      effectiveDate: "2019-01-01",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: NOT A SUSPECTED EVENT & CAUSALITY EXCLUDED
  // -------------------------------------------------------------
  {
    ruleId: "NMPA-MDR-NON-REPORTABLE-001",
    jurisdiction: "CN_NMPA",
    version: "NMPA_MDR_2026_01",
    title: "Non-Reportable under NMPA: No Device Involvement and No Suspected AE",
    description: "Device did not malfunction and is excluded from being a cause of the event.",
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
      {
        questionId: "EVENT_003",
        operator: "EQUALS",
        value: "NO",
      },
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "NON_REPORTABLE",
      reason: "Confirmed no device causality, no device malfunction, and not a suspected medical device adverse event under NMPA rules.",
      priority: 50,
    },
    regulatoryReference: {
      jurisdiction: "CN_NMPA",
      regulator: "National Medical Products Administration (NMPA)",
      regulationOrGuidance: "State Council Decree No. 739",
      articleOrSection: "Chapter 5",
      effectiveDate: "2021-06-01",
    },
  },
];

export const CN_NMPA_RULESET: RulesetDefinition = {
  jurisdiction: "CN_NMPA",
  regulator: "National Medical Products Administration (NMPA)",
  regulatoryFramework: "State Council Decree No. 739 / SAMR Order No. 1",
  version: "NMPA_MDR_2026_01",
  effectiveFrom: "2021-06-01",
  description: "China NMPA medical device adverse event monitoring ruleset implementing suspected adverse event reporting and statutory 7/15 day timelines.",
  rules: CN_NMPA_RULES,
  defaultDeadlineType: "CALENDAR_DAYS",
};
