/**
 * Australia TGA (Therapeutic Goods Administration) Vigilance Ruleset
 *
 * Implements Australian Medical Device Incident Reporting (MDIR) requirements
 * under Therapeutic Goods (Medical Devices) Regulations 2002 & ARGMD:
 * - 48-Hour Report: Serious public health threat
 * - 10-Calendar-Day Report: Death or serious deterioration in state of health
 * - 30-Calendar-Day Report: Other reportable incidents (recurrence harm, device defects)
 */

import { DeclarativeRule, RulesetDefinition } from "../types";

export const AU_TGA_RULES: DeclarativeRule[] = [
  // -------------------------------------------------------------
  // TRIGGER: 48-HOUR REPORT - SERIOUS PUBLIC HEALTH THREAT
  // -------------------------------------------------------------
  {
    ruleId: "TGA-MDIR-48HR-PUBLIC-HEALTH-001",
    jurisdiction: "AU_TGA",
    version: "TGA_MDIR_2026_01",
    title: "48-Hour Report: Serious Public Health Threat",
    description: "Any hazard arising from medical device that poses a serious threat to public health.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "OUTCOME_008",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "REPORTABLE",
      reportingCategory: "SERIOUS_PUBLIC_HEALTH_THREAT",
      reason: "Event constitutes a serious threat to public health. Expedited 48-hour notification required under TGA regulations.",
      deadlineHours: 48,
      deadlineDays: 2,
      deadlineType: "HOURS",
      deadlineCalculationRule: "TGA-48-HOUR",
      requiredForm: "TGA Medical Device Incident Report (MDIR)",
      submissionMethod: "TGA Business Services (TBS) Portal / MDIR Online",
      priority: 100,
    },
    regulatoryReference: {
      jurisdiction: "AU_TGA",
      regulator: "Therapeutic Goods Administration (TGA)",
      regulationOrGuidance: "Therapeutic Goods (Medical Devices) Regulations 2002",
      articleOrSection: "Part 5 / ARGMD Incident Reporting § 48h",
      sourceUrl: "https://www.tga.gov.au/resources/resource/guidance/medical-device-incident-reporting-investigation-scheme-iris",
      effectiveDate: "2002-10-04",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: 10-DAY REPORT - DEATH OR SERIOUS DETERIORATION
  // -------------------------------------------------------------
  {
    ruleId: "TGA-MDIR-10DAY-DEATH-001",
    jurisdiction: "AU_TGA",
    version: "TGA_MDIR_2026_01",
    title: "10-Calendar-Day Report: Death Resulting from Device Incident",
    description: "Incident led to death of a patient or user in Australia.",
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
      reason: "Incident resulted in death with device causality. 10-calendar-day report mandatory under TGA ARGMD guidance.",
      deadlineDays: 10,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "TGA-10-CALENDAR-DAY",
      requiredForm: "TGA Medical Device Incident Report (MDIR)",
      submissionMethod: "TGA Business Services (TBS) Portal",
      priority: 85,
    },
    regulatoryReference: {
      jurisdiction: "AU_TGA",
      regulator: "Therapeutic Goods Administration (TGA)",
      regulationOrGuidance: "Therapeutic Goods (Medical Devices) Regulations 2002",
      articleOrSection: "ARGMD Vigilance Reporting § 10-day",
      effectiveDate: "2002-10-04",
    },
  },
  {
    ruleId: "TGA-MDIR-10DAY-DETERIORATION-002",
    jurisdiction: "AU_TGA",
    version: "TGA_MDIR_2026_01",
    title: "10-Calendar-Day Report: Serious Deterioration in Health",
    description: "Incident led to a serious deterioration in the state of health of a patient or user.",
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
      reason: "Incident resulted in serious deterioration in health with device causality. 10-calendar-day report mandatory under TGA ARGMD guidance.",
      deadlineDays: 10,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "TGA-10-CALENDAR-DAY",
      requiredForm: "TGA Medical Device Incident Report (MDIR)",
      submissionMethod: "TGA Business Services (TBS) Portal",
      priority: 80,
    },
    regulatoryReference: {
      jurisdiction: "AU_TGA",
      regulator: "Therapeutic Goods Administration (TGA)",
      regulationOrGuidance: "Therapeutic Goods (Medical Devices) Regulations 2002",
      articleOrSection: "ARGMD Vigilance Reporting § 10-day",
      effectiveDate: "2002-10-04",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: 30-DAY REPORT - RECURRENCE HARM / NEAR-MISS / DEFECT
  // -------------------------------------------------------------
  {
    ruleId: "TGA-MDIR-30DAY-RECURRENCE-001",
    jurisdiction: "AU_TGA",
    version: "TGA_MDIR_2026_01",
    title: "30-Calendar-Day Report: Potential Harm on Recurrence or Malfunction",
    description: "Malfunction or incident that might lead to death or serious injury if it recurred.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_001",
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
      reportingCategory: "POTENTIAL_SERIOUS_INCIDENT",
      reason: "Incident or malfunction which could result in death or serious deterioration if it recurred. 30-calendar-day report required under TGA ARGMD.",
      deadlineDays: 30,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "TGA-30-CALENDAR-DAY",
      requiredForm: "TGA Medical Device Incident Report (MDIR)",
      submissionMethod: "TGA Business Services (TBS) Portal",
      priority: 60,
    },
    regulatoryReference: {
      jurisdiction: "AU_TGA",
      regulator: "Therapeutic Goods Administration (TGA)",
      regulationOrGuidance: "Therapeutic Goods (Medical Devices) Regulations 2002",
      articleOrSection: "ARGMD Vigilance Reporting § 30-day",
      effectiveDate: "2002-10-04",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: NOT REPORTABLE UNDER TGA
  // -------------------------------------------------------------
  {
    ruleId: "TGA-MDIR-NON-REPORTABLE-001",
    jurisdiction: "AU_TGA",
    version: "TGA_MDIR_2026_01",
    title: "Non-Reportable Incident under TGA",
    description: "Device performed as intended or defect did not pose public health threat or injury risk.",
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
      reason: "Device did not cause or contribute to adverse outcome and did not malfunction (TGA ARGMD criteria unmet).",
      priority: 50,
    },
    regulatoryReference: {
      jurisdiction: "AU_TGA",
      regulator: "Therapeutic Goods Administration (TGA)",
      regulationOrGuidance: "Therapeutic Goods (Medical Devices) Regulations 2002",
      articleOrSection: "ARGMD General Exclusions",
      effectiveDate: "2002-10-04",
    },
  },
];

export const AU_TGA_RULESET: RulesetDefinition = {
  jurisdiction: "AU_TGA",
  regulator: "Therapeutic Goods Administration (TGA)",
  regulatoryFramework: "Therapeutic Goods (Medical Devices) Regulations 2002 / ARGMD",
  version: "TGA_MDIR_2026_01",
  effectiveFrom: "2002-10-04",
  description: "Australia TGA medical device incident reporting ruleset supporting 48-hour public health threat, 10-day serious harm, and 30-day recurrence workflows.",
  rules: AU_TGA_RULES,
  defaultDeadlineType: "CALENDAR_DAYS",
};
