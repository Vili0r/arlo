/**
 * US FDA 21 CFR Part 803 Medical Device Reporting (MDR) Ruleset
 *
 * Implements FDA manufacturer reporting requirements:
 * 1. 30-day Reports:
 *    - Device caused or contributed to death (21 CFR 803.50(a)(1))
 *    - Device caused or contributed to serious injury (21 CFR 803.50(a)(1))
 *    - Device malfunctioned AND recurrence would be likely to cause/contribute to death or serious injury (21 CFR 803.50(a)(2))
 * 2. 5-work-day Reports:
 *    - Remedial action initiated to prevent unreasonable risk of substantial harm (21 CFR 803.53(a))
 *    - FDA written request (21 CFR 803.53(b))
 */

import { DeclarativeRule, RulesetDefinition } from "../types";

export const US_FDA_RULES: DeclarativeRule[] = [
  // -------------------------------------------------------------
  // TRIGGER: 5-DAY MDR (Remedial action / Unreasonable risk)
  // -------------------------------------------------------------
  {
    ruleId: "FDA-MDR-5DAY-REMEDIAL-001",
    jurisdiction: "US_FDA",
    version: "FDA_MDR_2026_01",
    title: "5-Work-Day MDR: Remedial Action for Substantial Harm",
    description: "An MDR reportable event necessitates remedial action to prevent an unreasonable risk of substantial harm to the public health.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "REG_006",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "5_DAY_REMEDIAL_ACTION",
      reason: "Remedial action initiated to prevent unreasonable risk of substantial harm to public health (21 CFR 803.53(a)). 5-work-day report required.",
      deadlineDays: 5,
      deadlineType: "BUSINESS_DAYS",
      deadlineCalculationRule: "FDA-5-WORK-DAY",
      requiredForm: "FDA Form 3500A (eMDR)",
      submissionMethod: "FDA ESG / eSubmitter WebTrader",
      priority: 100,
    },
    regulatoryReference: {
      jurisdiction: "US_FDA",
      regulator: "Food and Drug Administration (CDRH)",
      regulationOrGuidance: "21 CFR Part 803",
      articleOrSection: "21 CFR 803.53(a)",
      sourceUrl: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-803",
      effectiveDate: "1996-04-11",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: 30-DAY MDR - DEATH
  // -------------------------------------------------------------
  {
    ruleId: "FDA-MDR-DEATH-001",
    jurisdiction: "US_FDA",
    version: "FDA_MDR_2026_01",
    title: "30-Calendar-Day MDR: Device-Related Death",
    description: "Information reasonably suggests that a device may have caused or contributed to a patient or user death.",
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
      reason: "Device may have caused or contributed to a death (21 CFR 803.50(a)(1)). 30-calendar-day MDR mandatory.",
      deadlineDays: 30,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "FDA-30-CALENDAR-DAY",
      requiredForm: "FDA Form 3500A (eMDR)",
      submissionMethod: "FDA ESG / eSubmitter WebTrader",
      priority: 80,
    },
    regulatoryReference: {
      jurisdiction: "US_FDA",
      regulator: "Food and Drug Administration (CDRH)",
      regulationOrGuidance: "21 CFR Part 803",
      articleOrSection: "21 CFR 803.50(a)(1)",
      sourceUrl: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-803",
      effectiveDate: "1996-04-11",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: 30-DAY MDR - SERIOUS INJURY
  // -------------------------------------------------------------
  {
    ruleId: "FDA-MDR-INJURY-001",
    jurisdiction: "US_FDA",
    version: "FDA_MDR_2026_01",
    title: "30-Calendar-Day MDR: Device-Related Serious Injury",
    description: "Information reasonably suggests that a device may have caused or contributed to a serious injury.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "OUTCOME_002",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "SERIOUS_INJURY",
      reason: "Device may have caused or contributed to a serious injury (21 CFR 803.50(a)(1)). 30-calendar-day MDR mandatory.",
      deadlineDays: 30,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "FDA-30-CALENDAR-DAY",
      requiredForm: "FDA Form 3500A (eMDR)",
      submissionMethod: "FDA ESG / eSubmitter WebTrader",
      priority: 75,
    },
    regulatoryReference: {
      jurisdiction: "US_FDA",
      regulator: "Food and Drug Administration (CDRH)",
      regulationOrGuidance: "21 CFR Part 803",
      articleOrSection: "21 CFR 803.50(a)(1) & 21 CFR 803.3",
      sourceUrl: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-803",
      effectiveDate: "1996-04-11",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: 30-DAY MDR - MALFUNCTION WITH RECURRENCE RISK
  // -------------------------------------------------------------
  {
    ruleId: "FDA-MDR-MALFUNCTION-RECURRENCE-001",
    jurisdiction: "US_FDA",
    version: "FDA_MDR_2026_01",
    title: "30-Calendar-Day MDR: Malfunction with Risk of Serious Harm on Recurrence",
    description: "Device malfunctioned and recurrence would be likely to cause or contribute to death or serious injury.",
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
      reportingCategory: "MALFUNCTION",
      reason: "The device malfunctioned and recurrence of the malfunction would be likely to cause or contribute to death or serious injury (21 CFR 803.50(a)(2)).",
      deadlineDays: 30,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "FDA-30-CALENDAR-DAY",
      requiredForm: "FDA Form 3500A (eMDR)",
      submissionMethod: "FDA ESG / eSubmitter WebTrader",
      priority: 70,
    },
    regulatoryReference: {
      jurisdiction: "US_FDA",
      regulator: "Food and Drug Administration (CDRH)",
      regulationOrGuidance: "21 CFR Part 803",
      articleOrSection: "21 CFR 803.50(a)(2)",
      sourceUrl: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-803",
      effectiveDate: "1996-04-11",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: MALFUNCTION WITHOUT RECURRENCE HARM RISK
  // -------------------------------------------------------------
  {
    ruleId: "FDA-MDR-MALFUNCTION-BENIGN-001",
    jurisdiction: "US_FDA",
    version: "FDA_MDR_2026_01",
    title: "Non-Reportable Malfunction: No Likelihood of Death or Serious Injury",
    description: "Device malfunctioned, but recurrence is not likely to cause or contribute to death or serious injury, and no harm occurred.",
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
        value: "NO",
      },
      {
        questionId: "OUTCOME_001",
        operator: "EQUALS",
        value: "NO",
      },
      {
        questionId: "OUTCOME_002",
        operator: "EQUALS",
        value: "NO",
      },
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "NON_REPORTABLE_MALFUNCTION",
      reason: "Device malfunctioned, but recurrence is not likely to cause or contribute to death or serious injury. Excluded from 21 CFR 803 MDR reporting.",
      priority: 60,
    },
    regulatoryReference: {
      jurisdiction: "US_FDA",
      regulator: "Food and Drug Administration (CDRH)",
      regulationOrGuidance: "21 CFR Part 803",
      articleOrSection: "21 CFR 803.50(a)(2)",
      effectiveDate: "1996-04-11",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: NO CAUSALITY AND NO REPORTABLE MALFUNCTION
  // -------------------------------------------------------------
  {
    ruleId: "FDA-MDR-NO-CAUSALITY-001",
    jurisdiction: "US_FDA",
    version: "FDA_MDR_2026_01",
    title: "Non-Reportable: Device Not Causal and No Malfunction",
    description: "The device did not cause or contribute to harm, did not malfunction, or is completely unrelated.",
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
      reason: "Device did not cause or contribute to death/serious injury and did not malfunction (21 CFR 803.50).",
      priority: 50,
    },
    regulatoryReference: {
      jurisdiction: "US_FDA",
      regulator: "Food and Drug Administration (CDRH)",
      regulationOrGuidance: "21 CFR Part 803",
      articleOrSection: "21 CFR 803.50",
      effectiveDate: "1996-04-11",
    },
  },
];

export const US_FDA_RULESET: RulesetDefinition = {
  jurisdiction: "US_FDA",
  regulator: "Food and Drug Administration (CDRH)",
  regulatoryFramework: "FDA 21 CFR Part 803 (MDR)",
  version: "FDA_MDR_2026_01",
  effectiveFrom: "1996-04-11",
  description: "United States FDA Medical Device Reporting ruleset distinguishing 5-day remedial action, 30-day death/injury, and malfunction recurrence risk.",
  rules: US_FDA_RULES,
  defaultDeadlineType: "CALENDAR_DAYS",
};
