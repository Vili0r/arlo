/**
 * EU MDR 2017/745 Vigilance Ruleset
 *
 * Implements European Union Medical Device Regulation (EU) 2017/745 Articles 87-90
 * and preserves the existing EU Decision Tree Questionnaire logic (Q1 - Q17).
 *
 * CRITICAL REQUIREMENTS:
 * 1. Preserves existing EU DT questions & behavior.
 * 2. Cites EU MDR Article 87, MEDDEV 2.12/1 rev 8, and MDCG guidance.
 * 3. Does NOT collapse UNKNOWN into NOT_REPORTABLE.
 */

import { DeclarativeRule, RulesetDefinition } from "../types";

export const EU_MDR_RULES: DeclarativeRule[] = [
  // -------------------------------------------------------------
  // CAUSALITY EXCLUSION (EU DT Q1)
  // -------------------------------------------------------------
  {
    ruleId: "EU-EXCL-CAUSALITY-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Device Not Suspected of Causing/Contributing to Event",
    description: "If the device is definitively determined to not have caused or contributed to the event, it is not an incident under EU MDR.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_001",
        operator: "EQUALS",
        value: "NO",
      },
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "NON_REPORTABLE",
      reason: "Device is not suspected to have caused or contributed to the event (EU MDR Art 2(64) incident definition unmet).",
      priority: 100,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745",
      articleOrSection: "Article 2(64)",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2017/745/oj",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: ABNORMAL USE (EU DT Q2)
  // -------------------------------------------------------------
  {
    ruleId: "EU-EXCL-ABNORMAL-USE-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Event Caused by Abnormal Use",
    description: "Abnormal use (deliberate disregard of clear instructions/contraindications) is excluded from reporting under EU MDR Article 87.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "USE_002",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "EXCLUSION_ABNORMAL_USE",
      reason: "Event was caused by abnormal use. Excluded from vigilance reporting pursuant to EU MDR Art 87 & MEDDEV 2.12/1 rev 8 § 5.1.3.",
      priority: 90,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745 / MEDDEV 2.12/1 rev 8",
      articleOrSection: "Article 87(1) / MEDDEV 2.12/1 § 5.1.3",
      sourceUrl: "https://health.ec.europa.eu/medical-devices-dialogue/guidance_en",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: PATIENT UNDERLYING CONDITION SOLE CAUSE (EU DT Q6)
  // -------------------------------------------------------------
  {
    ruleId: "EU-EXCL-PATIENT-CONDITION-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Event Caused Entirely by Patient Underlying Condition",
    description: "Device performed as intended and did not cause event; event resulted solely from patient clinical condition.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "CAUSALITY_004",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "EXCLUSION_PATIENT_CONDITION",
      reason: "Evidence indicates event was caused by patient condition; device performed as intended and did not cause event (EU MDR Art 87).",
      priority: 85,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745 / MEDDEV 2.12/1 rev 8",
      articleOrSection: "Article 87 / § 5.1.2",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: EXPIRED SHELF/SERVICE LIFE AS SOLE CAUSE (EU DT Q7, Q8, Q9)
  // -------------------------------------------------------------
  {
    ruleId: "EU-EXCL-EXPIRED-DEVICE-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Device Beyond Labeled Expiry / Service Life as Sole Cause",
    description: "Device used beyond labeled expiry/shelf/service life, exceedance is sole cause, and failure mode is usual for expired device.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "DEVICE_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "DEVICE_004",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "DEVICE_006",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "EXCLUSION_EXPIRED_DEVICE",
      reason: "Failure resulted exclusively from use beyond labeled expiry/service-life with normal degradation failure mode (MEDDEV 2.12/1 rev 8 § 5.1.4).",
      priority: 85,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745 / MEDDEV 2.12/1 rev 8",
      articleOrSection: "MEDDEV 2.12/1 rev 8 § 5.1.4",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: FORESEEABLE CLINICALLY ACCEPTABLE LABELED SIDE EFFECT (EU DT Q10)
  // -------------------------------------------------------------
  {
    ruleId: "EU-EXCL-LABELED-SIDE-EFFECT-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Foreseeable, Clinically Acceptable Labeled Side Effect Documented in DMR",
    description: "Known side effect documented in risk management and labeling, clinically acceptable in patient benefit context.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "EXPECTEDNESS_001",
        operator: "EQUALS",
        value: "YES",
      },
      {
        questionId: "EXPECTEDNESS_005",
        operator: "EQUALS",
        value: "NO",
      },
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "EXCLUSION_LABELED_SIDE_EFFECT",
      reason: "Event is a labeled side effect considered foreseeable and clinically acceptable, documented in DMR/risk management without trend deviation (EU MDR Art 87(1)).",
      priority: 80,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745",
      articleOrSection: "Article 87(1) & Article 88",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: DESIGN FEATURE SAFEGUARD (EU DT Q13)
  // -------------------------------------------------------------
  {
    ruleId: "EU-EXCL-DESIGN-SAFEGUARD-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Design Feature Protected Fault from Becoming Hazard",
    description: "A built-in design feature or interlock protected against the fault becoming a hazard before any harm occurred.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "DEVICE_007",
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
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "EXCLUSION_DESIGN_SAFEGUARD",
      reason: "A design feature protected against fault becoming a hazard without resulting in serious injury or death (MEDDEV 2.12/1 rev 8 § 5.1.5).",
      priority: 75,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745 / MEDDEV 2.12/1 rev 8",
      articleOrSection: "MEDDEV 2.12/1 rev 8 § 5.1.5",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION: DEFECT DETECTED PRIOR TO USE (EU DT Q14)
  // -------------------------------------------------------------
  {
    ruleId: "EU-EXCL-DETECTABLE-PRIOR-TO-USE-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Defect Detectable Prior to Use and Would Always Be Found",
    description: "Defect found prior to use and would always be found prior to use if it recurs.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "DEVICE_005",
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
    ],
    result: {
      candidateReportability: "NOT_REPORTABLE",
      reportingCategory: "EXCLUSION_PRE_USE_DETECTION",
      reason: "Defect was found prior to use and would always be detected prior to use if it recurs (MEDDEV 2.12/1 rev 8 § 5.1.6).",
      priority: 75,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745 / MEDDEV 2.12/1 rev 8",
      articleOrSection: "MEDDEV 2.12/1 rev 8 § 5.1.6",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // EXCLUSION / MODIFICATION: PERIODIC SUMMARY REPORTING (EU DT Q11 / Q16)
  // -------------------------------------------------------------
  {
    ruleId: "EU-EXCL-PERIODIC-SUMMARY-REPORTING-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Periodic Summary Reporting (PSR) Agreement in Place",
    description: "Event or event type is subject to an approved periodic summary reporting agreement with the coordinating competent authority.",
    matchType: "ALL",
    conditions: [
      {
        questionId: "REG_001",
        operator: "EQUALS",
        value: "YES",
      },
    ],
    result: {
      candidateReportability: "EXEMPT",
      reportingCategory: "PERIODIC_SUMMARY_REPORTING",
      reason: "Event type is subject to an active Periodic Summary Reporting (PSR) agreement under EU MDR Art 87(9). Expedited individual report exempt.",
      priority: 70,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745",
      articleOrSection: "Article 87(9)",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: SERIOUS PUBLIC HEALTH THREAT (EU DT Q3 -> 2 DAYS)
  // -------------------------------------------------------------
  {
    ruleId: "EU-RULE-PUBLIC-HEALTH-THREAT-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Serious Public Health Threat",
    description: "In the event of a serious public health threat, report immediately and not later than 2 calendar days.",
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
      reason: "The incident indicates a serious public health threat. Immediate notification required.",
      deadlineDays: 2,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "EU-MDR-2-DAY",
      requiredForm: "MIR Form (EUDAMED / Competent Authority)",
      submissionMethod: "EUDAMED / National CA Portal",
      priority: 50,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745",
      articleOrSection: "Article 87(3)",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2017/745/oj",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: DEATH OR UNANTICIPATED SERIOUS DETERIORATION (EU DT Q4 -> 10 DAYS)
  // -------------------------------------------------------------
  {
    ruleId: "EU-RULE-DEATH-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Serious Incident Resulting in Death",
    description: "In the event of death, report immediately and not later than 10 calendar days after manufacturer awareness.",
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
      reason: "Incident resulted in death with suspected device causality. 10-day expedited report mandatory under EU MDR Art 87(4).",
      deadlineDays: 10,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "EU-MDR-10-DAY",
      requiredForm: "MIR Form (EUDAMED / Competent Authority)",
      submissionMethod: "EUDAMED / National CA Portal",
      priority: 40,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745",
      articleOrSection: "Article 87(4)",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2017/745/oj",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: SERIOUS DETERIORATION IN HEALTH (EU DT Q4 -> 15 DAYS)
  // -------------------------------------------------------------
  {
    ruleId: "EU-RULE-SERIOUS-DETERIORATION-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Serious Incident Resulting in Serious Deterioration in Health",
    description: "Report immediately and not later than 15 calendar days after manufacturer awareness.",
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
      reason: "Incident resulted in serious deterioration in health with suspected device causality. 15-day report mandatory under EU MDR Art 87(5).",
      deadlineDays: 15,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "EU-MDR-15-DAY",
      requiredForm: "MIR Form (EUDAMED / Competent Authority)",
      submissionMethod: "EUDAMED / National CA Portal",
      priority: 30,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745",
      articleOrSection: "Article 87(5)",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2017/745/oj",
      effectiveDate: "2021-05-26",
    },
  },

  // -------------------------------------------------------------
  // TRIGGER: POTENTIAL / RECURRENCE SERIOUS INCIDENT (EU DT Q5 -> 15 DAYS)
  // -------------------------------------------------------------
  {
    ruleId: "EU-RULE-RECURRENCE-POTENTIAL-001",
    jurisdiction: "EU",
    version: "EU_MDR_2026_01",
    title: "Potential Serious Incident upon Recurrence",
    description: "Device malfunction or deterioration that did not cause harm, but could lead to death or serious deterioration if it recurred.",
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
      reason: "Recurrence of this event could directly or indirectly lead to death or serious deterioration in health (EU MDR Art 2(65) & Art 87(5)).",
      deadlineDays: 15,
      deadlineType: "CALENDAR_DAYS",
      deadlineCalculationRule: "EU-MDR-15-DAY",
      requiredForm: "MIR Form (EUDAMED / Competent Authority)",
      submissionMethod: "EUDAMED / National CA Portal",
      priority: 25,
    },
    regulatoryReference: {
      jurisdiction: "EU",
      regulator: "European Commission / Competent Authorities",
      regulationOrGuidance: "EU MDR 2017/745",
      articleOrSection: "Article 2(65) & Article 87(5)",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2017/745/oj",
      effectiveDate: "2021-05-26",
    },
  },
];

export const EU_MDR_RULESET: RulesetDefinition = {
  jurisdiction: "EU",
  regulator: "European Commission / EU Competent Authorities",
  regulatoryFramework: "EU MDR (Regulation (EU) 2017/745)",
  version: "EU_MDR_2026_01",
  effectiveFrom: "2021-05-26",
  description: "European Union Medical Device Regulation vigilance decision ruleset incorporating MEDDEV 2.12/1 rev 8 guidelines and EU DT questions Q1-Q17.",
  rules: EU_MDR_RULES,
  defaultDeadlineType: "CALENDAR_DAYS",
};
