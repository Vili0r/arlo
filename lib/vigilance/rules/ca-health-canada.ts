/**
 * Health Canada Medical Devices Regulations (SOR/98-282) Ruleset
 *
 * Implements Mandatory Problem Reporting requirements (Sections 59-61.1):
 * - 10-day preliminary report: incident resulted in death or serious deterioration in health
 * - 30-day preliminary report: incident has not resulted in death/serious deterioration,
 *   but would be likely to do so if the incident recurred.
 */

import { DeclarativeRule, RulesetDefinition } from "../types";

export const HEALTH_CANADA_RULES: DeclarativeRule[] = [
  // -------------------------------------------------------------
  // TRIGGER: 10-DAY REPORT - DEATH OR SERIOUS DETERIORATION
  // -------------------------------------------------------------
  {
    ruleId: "HC-MDR-10DAY-DEATH-DETERIORATION-001",
    jurisdiction: "CA_HEALTH_CANADA",
    version: "HC_MDR_2026_01",
    title: "10-Calendar-Day Report: Death or Serious Deterioration in Health",
    description: "Incident resulted in death or serious deterioration in health of a patient, user, or other person in Canada or abroad.",
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
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "DEATH",
      reason: "Incident resulted in death with device causality. Mandatory 10-calendar-day preliminary report under SOR/98-282 Section 60(1)(a)(i).",
      deadlineDays: 10,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "HEALTH-CANADA-10-DAY",
      requiredForm: "Health Canada Medical Device Problem Report (Form FRM-0292)",
      submissionMethod: "Health Canada Portal / Email (mdvigilance-vigilancemateriel@hc-sc.gc.ca)",
      priority: 90,
    },
    regulatoryReference: {
      jurisdiction: "CA_HEALTH_CANADA",
      regulator: "Health Canada (Medical Devices Directorate)",
      regulationOrGuidance: "Medical Devices Regulations (SOR/98-282)",
      articleOrSection: "Section 59(1) & 60(1)(a)(i)",
      sourceUrl: "https://laws-lois.justice.gc.ca/eng/regulations/SOR-98-282/",
      effectiveDate: "1998-07-01",
    },
  },
  {
    ruleId: "HC-MDR-10DAY-DETERIORATION-002",
    jurisdiction: "CA_HEALTH_CANADA",
    version: "HC_MDR_2026_01",
    title: "10-Calendar-Day Report: Serious Deterioration in Health",
    description: "Incident resulted in a serious deterioration in the state of health of a patient, user, or other person.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "OUTCOME_003",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "SERIOUS_DETERIORATION",
      reason: "Incident resulted in serious deterioration in health with device causality. Mandatory 10-calendar-day preliminary report under SOR/98-282 Section 60(1)(a)(i).",
      deadlineDays: 10,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "HEALTH-CANADA-10-DAY",
      requiredForm: "Health Canada Medical Device Problem Report (Form FRM-0292)",
      submissionMethod: "Health Canada Portal / Email",
      priority: 85,
    },
    regulatoryReference: {
      jurisdiction: "CA_HEALTH_CANADA",
      regulator: "Health Canada (Medical Devices Directorate)",
      regulationOrGuidance: "Medical Devices Regulations (SOR/98-282)",
      articleOrSection: "Section 59(1) & 60(1)(a)(i)",
      sourceUrl: "https://laws-lois.justice.gc.ca/eng/regulations/SOR-98-282/",
      effectiveDate: "1998-07-01",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: 30-DAY REPORT - RECURRENCE POTENTIAL FOR DEATH / SERIOUS DETERIORATION
  // -------------------------------------------------------------
  {
    ruleId: "HC-MDR-30DAY-RECURRENCE-001",
    jurisdiction: "CA_HEALTH_CANADA",
    version: "HC_MDR_2026_01",
    title: "30-Calendar-Day Report: Recurrence Could Lead to Death or Serious Deterioration",
    description: "Incident did not lead to death/serious deterioration, but recurrence would be likely to do so.",
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
        value: "NO",
      },
      {
        questionId: "OUTCOME_003",
        operator: "EQUALS",
        value: "NO",
      },
      {
        questionId: "POTENTIAL_003",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "POTENTIAL_SERIOUS_DETERIORATION",
      reason: "Incident has not resulted in death or serious deterioration, but recurrence would be likely to do so (SOR/98-282 Section 60(1)(a)(ii)). 30-day report required.",
      deadlineDays: 30,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "HEALTH-CANADA-30-DAY",
      requiredForm: "Health Canada Medical Device Problem Report (Form FRM-0292)",
      submissionMethod: "Health Canada Portal / Email",
      priority: 70,
    },
    regulatoryReference: {
      jurisdiction: "CA_HEALTH_CANADA",
      regulator: "Health Canada (Medical Devices Directorate)",
      regulationOrGuidance: "Medical Devices Regulations (SOR/98-282)",
      articleOrSection: "Section 59(1) & 60(1)(a)(ii)",
      sourceUrl: "https://laws-lois.justice.gc.ca/eng/regulations/SOR-98-282/",
      effectiveDate: "1998-07-01",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: NON-REPORTABLE FAILURE
  // -------------------------------------------------------------
  {
    ruleId: "HC-MDR-NON-REPORTABLE-001",
    jurisdiction: "CA_HEALTH_CANADA",
    version: "HC_MDR_2026_01",
    title: "Non-Reportable Incident: No Harm and Recurrence Not Likely to Cause Harm",
    description: "Device issue resulted in neither harm nor potential for death/serious deterioration upon recurrence.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "OUTCOME_001",
        operator: "EQUALS",
        value: "NO",
      },
      {
        questionId: "OUTCOME_003",
        operator: "EQUALS",
        value: "NO",
      },
      {
        questionId: "POTENTIAL_001",
        operator: "EQUALS",
        value: "NO",
      },
      {
        questionId: "POTENTIAL_003",
        operator: "EQUALS",
        value: "NO",
      },
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "NON_REPORTABLE",
      reason: "Incident did not result in death/serious deterioration and recurrence is not likely to do so. Does not meet SOR/98-282 Section 59 threshold.",
      priority: 50,
    },
    regulatoryReference: {
      jurisdiction: "CA_HEALTH_CANADA",
      regulator: "Health Canada (Medical Devices Directorate)",
      regulationOrGuidance: "Medical Devices Regulations (SOR/98-282)",
      articleOrSection: "Section 59",
      effectiveDate: "1998-07-01",
    },
  },
];

export const HEALTH_CANADA_RULESET: RulesetDefinition = {
  jurisdiction: "CA_HEALTH_CANADA",
  regulator: "Health Canada (Medical Devices Directorate)",
  regulatoryFramework: "SOR/98-282 Mandatory Problem Reporting",
  version: "HC_MDR_2026_01",
  effectiveFrom: "1998-07-01",
  description: "Health Canada medical device problem reporting ruleset under Sections 59-61.1 of the Medical Devices Regulations.",
  rules: HEALTH_CANADA_RULES,
  defaultDeadlineType: "CALENDAR_DAYS",
};
