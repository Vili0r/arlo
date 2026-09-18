/**
 * Global Medical Device Reportability Engine - Canonical Question Bank
 *
 * FACTUAL LAYER:
 * Canonical questions capture verifiable facts about the incident, device, causality,
 * patient outcome, recurrence potential, and regulatory context.
 *
 * CRITICAL COMPLIANCE PRINCIPLE:
 * Facts are global; rules are jurisdiction-specific.
 * Canonical questions do NOT decide reportability on their own.
 */

export type CanonicalAnswerValue =
  | "YES"
  | "NO"
  | "UNKNOWN"
  | "NOT_APPLICABLE"
  | "NOT_YET_DETERMINED";

export type CausalityLevel =
  | "confirmed"
  | "probable"
  | "reasonably_possible"
  | "unlikely"
  | "excluded"
  | "unknown";

export type SeverityLevel =
  | "none"
  | "minor"
  | "serious"
  | "death"
  | "unknown";

export type FactSource =
  | "USER"
  | "AI_SUGGESTED"
  | "INTEGRATION"
  | "INVESTIGATION_SUMMARY";

export type FactReviewStatus =
  | "DRAFT"
  | "SUGGESTED"
  | "APPROVED"
  | "REJECTED";

export interface QuestionDependency {
  parentQuestionId: string;
  expectedAnswer?: CanonicalAnswerValue | CanonicalAnswerValue[];
}

export type QuestionCategory =
  | "EVENT"
  | "CAUSALITY"
  | "OUTCOME"
  | "POTENTIAL"
  | "MALFUNCTION"
  | "USE"
  | "EXPECTEDNESS"
  | "DEVICE_STATUS"
  | "REGULATORY";

export interface CanonicalQuestionDefinition {
  id: string;
  category: QuestionCategory;
  categoryLabel: string;
  title: string;
  prompt: string;
  guidance?: string;
  supportsStructuredValue?: "causality" | "severity";
  dependencies?: QuestionDependency[];
  /**
   * Traceability to existing EU questionnaire items (Q1 to Q17)
   */
  legacyEuQuestionMapping?: string;
}

export interface StoredQuestionAnswer {
  questionId: string;
  answer: CanonicalAnswerValue;
  structuredValue?: string | null; // e.g. causality level or severity level
  rationale?: string | null;
  evidence?: string[];
  answeredBy?: string | null;
  answeredAt?: string;
  source?: FactSource;
  confidence?: number | null; // 0.0 to 1.0 for AI extraction
  reviewStatus?: FactReviewStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export const CANONICAL_QUESTION_BANK: CanonicalQuestionDefinition[] = [
  // -------------------------------------------------------------
  // EVENT BASICS
  // -------------------------------------------------------------
  {
    id: "EVENT_001",
    category: "EVENT",
    categoryLabel: "Event Basics",
    title: "Event Occurrence",
    prompt: "Did an event occur?",
    guidance: "Record whether any tangible adverse event, incident, or malfunction occurred.",
  },
  {
    id: "EVENT_002",
    category: "EVENT",
    categoryLabel: "Event Basics",
    title: "Medical Device Involvement",
    prompt: "Does the event involve a medical device?",
    guidance: "Confirm that the incident involves a device manufactured, distributed, or commercialized by the organization.",
    dependencies: [{ parentQuestionId: "EVENT_001", expectedAnswer: "YES" }],
  },
  {
    id: "EVENT_003",
    category: "EVENT",
    categoryLabel: "Event Basics",
    title: "Suspected Adverse Event",
    prompt: "Is this a suspected medical-device adverse event?",
    guidance: "Critical for jurisdictions like China (NMPA) and Japan (PMDA) where suspected adverse events trigger initial filing.",
    dependencies: [{ parentQuestionId: "EVENT_002", expectedAnswer: "YES" }],
  },
  {
    id: "EVENT_004",
    category: "EVENT",
    categoryLabel: "Event Basics",
    title: "Device Malfunction / Failure / Deterioration",
    prompt: "Did the device malfunction, fail, or deteriorate?",
    guidance: "Any failure of a device to meet its performance specifications or perform as intended.",
    dependencies: [{ parentQuestionId: "EVENT_002", expectedAnswer: "YES" }],
  },
  {
    id: "EVENT_005",
    category: "EVENT",
    categoryLabel: "Event Basics",
    title: "Failure to Perform as Intended",
    prompt: "Did the device fail to perform as intended?",
    guidance: "Includes inadequacy in device design, manufacture, labeling, or instructions for use.",
    dependencies: [{ parentQuestionId: "EVENT_002", expectedAnswer: "YES" }],
  },

  // -------------------------------------------------------------
  // CAUSALITY
  // -------------------------------------------------------------
  {
    id: "CAUSALITY_001",
    category: "CAUSALITY",
    categoryLabel: "Causality Assessment",
    title: "Device Suspected Cause or Contribution",
    prompt: "Is the device suspected to have caused or contributed to the event?",
    guidance: "EU DT Q1: Core causality trigger for EU MDR, FDA MDR, and Health Canada.",
    legacyEuQuestionMapping: "EU DT Q1",
    supportsStructuredValue: "causality",
  },
  {
    id: "CAUSALITY_002",
    category: "CAUSALITY",
    categoryLabel: "Causality Assessment",
    title: "Causal Relationship Reasonably Possible",
    prompt: "Is a causal relationship reasonably possible?",
    guidance: "Under vigilance guidelines, a causal relationship should be presumed reasonably possible unless excluded.",
    dependencies: [{ parentQuestionId: "CAUSALITY_001", expectedAnswer: ["YES", "UNKNOWN", "NOT_YET_DETERMINED"] }],
    supportsStructuredValue: "causality",
  },
  {
    id: "CAUSALITY_003",
    category: "CAUSALITY",
    categoryLabel: "Causality Assessment",
    title: "Alternative Cause More Likely",
    prompt: "Is another cause more likely?",
    guidance: "Evaluate whether user error, non-device clinical intervention, or other external factor is the prevailing cause.",
  },
  {
    id: "CAUSALITY_004",
    category: "CAUSALITY",
    categoryLabel: "Causality Assessment",
    title: "Patient Underlying Condition as Sole/Likely Cause",
    prompt: "Is there evidence event was caused by patient condition (device performed as intended and did not cause event)?",
    guidance: "EU DT Q6: Pre-existing patient pathology or natural disease progression independent of device operation.",
    legacyEuQuestionMapping: "EU DT Q6",
  },
  {
    id: "CAUSALITY_005",
    category: "CAUSALITY",
    categoryLabel: "Causality Assessment",
    title: "Causality Currently Unknown",
    prompt: "Is causality currently unknown or pending full laboratory/technical evaluation?",
    guidance: "Preserves UNKNOWN as an active state. Does not silently interpret missing information as NO.",
  },

  // -------------------------------------------------------------
  // ACTUAL OUTCOME
  // -------------------------------------------------------------
  {
    id: "OUTCOME_001",
    category: "OUTCOME",
    categoryLabel: "Actual Patient/User Outcome",
    title: "Patient / User Death",
    prompt: "Did death occur?",
    guidance: "Outcome resulted directly or indirectly in the death of a patient, user, or other person.",
    legacyEuQuestionMapping: "EU DT Q4 (part 1)",
    supportsStructuredValue: "severity",
  },
  {
    id: "OUTCOME_002",
    category: "OUTCOME",
    categoryLabel: "Actual Patient/User Outcome",
    title: "Serious Injury (US FDA / Global)",
    prompt: "Did serious injury occur?",
    guidance: "FDA 21 CFR 803 definition: life-threatening, permanent impairment of body function/structure, or requires intervention to prevent permanent impairment.",
    supportsStructuredValue: "severity",
  },
  {
    id: "OUTCOME_003",
    category: "OUTCOME",
    categoryLabel: "Actual Patient/User Outcome",
    title: "Serious Deterioration in Health (EU MDR / Health Canada)",
    prompt: "Did event result directly/indirectly in temporary/permanent serious deterioration in health of patient/user/other person?",
    guidance: "EU MDR Art 2(65) / EU DT Q4: Life-threatening illness/injury, permanent impairment, hospitalization or prolongation, or medical/surgical intervention.",
    legacyEuQuestionMapping: "EU DT Q4 (part 2)",
    supportsStructuredValue: "severity",
  },
  {
    id: "OUTCOME_004",
    category: "OUTCOME",
    categoryLabel: "Actual Patient/User Outcome",
    title: "Permanent Impairment",
    prompt: "Did permanent impairment of a body function or permanent damage to a body structure occur?",
    guidance: "Irreversible physiological impairment or anatomical damage.",
  },
  {
    id: "OUTCOME_005",
    category: "OUTCOME",
    categoryLabel: "Actual Patient/User Outcome",
    title: "Temporary Impairment",
    prompt: "Did temporary impairment occur?",
    guidance: "Reversible medical impairment resolving with or without routine intervention.",
  },
  {
    id: "OUTCOME_006",
    category: "OUTCOME",
    categoryLabel: "Actual Patient/User Outcome",
    title: "Medical or Surgical Intervention Required",
    prompt: "Was medical or surgical intervention required to preclude permanent impairment or death?",
    guidance: "Critical threshold for FDA serious injury and EU MDR serious deterioration.",
  },
  {
    id: "OUTCOME_007",
    category: "OUTCOME",
    categoryLabel: "Actual Patient/User Outcome",
    title: "Hospitalization Required",
    prompt: "Was in-patient hospitalization or prolongation of existing hospitalization required?",
    guidance: "Standard criterion for serious adverse event across all major regulatory jurisdictions.",
  },
  {
    id: "OUTCOME_008",
    category: "OUTCOME",
    categoryLabel: "Actual Patient/User Outcome",
    title: "Serious Public Health Threat",
    prompt: "Could or did the event lead to a serious public health threat?",
    guidance: "EU DT Q3 / TGA: Event which could result in imminent risk of death, serious deterioration in health, or serious illness in a population.",
    legacyEuQuestionMapping: "EU DT Q3",
  },
  {
    id: "OUTCOME_009",
    category: "OUTCOME",
    categoryLabel: "Actual Patient/User Outcome",
    title: "Emergency Intervention Required",
    prompt: "Did the event require emergency intervention?",
    guidance: "Immediate acute clinical rescue intervention.",
  },
  {
    id: "OUTCOME_010",
    category: "OUTCOME",
    categoryLabel: "Actual Patient/User Outcome",
    title: "Clinically Significant Deterioration",
    prompt: "Was there a clinically significant deterioration?",
    guidance: "Objective worsening of health status noted by healthcare professionals.",
  },

  // -------------------------------------------------------------
  // POTENTIAL / RECURRENCE
  // -------------------------------------------------------------
  {
    id: "POTENTIAL_001",
    category: "POTENTIAL",
    categoryLabel: "Potential & Recurrence Risk",
    title: "Recurrence Potential: Death",
    prompt: "If the event recurred, could it directly or indirectly lead to death?",
    guidance: "EU DT Q5: Evaluates the potential worst-case outcome if the incident re-occurred under realistic clinical conditions.",
    legacyEuQuestionMapping: "EU DT Q5 (death)",
  },
  {
    id: "POTENTIAL_002",
    category: "POTENTIAL",
    categoryLabel: "Potential & Recurrence Risk",
    title: "Recurrence Potential: Serious Injury",
    prompt: "If the event recurred, could it cause serious injury?",
    guidance: "US FDA MDR recurrence test: Is recurrence likely to cause or contribute to serious injury?",
  },
  {
    id: "POTENTIAL_003",
    category: "POTENTIAL",
    categoryLabel: "Potential & Recurrence Risk",
    title: "Recurrence Potential: Serious Deterioration",
    prompt: "If event re-occurred, could it directly/indirectly lead to temporary/permanent serious deterioration?",
    guidance: "EU DT Q5 / Health Canada / TGA: Potential serious incident trigger for near-miss events.",
    legacyEuQuestionMapping: "EU DT Q5 (serious deterioration)",
  },
  {
    id: "POTENTIAL_004",
    category: "POTENTIAL",
    categoryLabel: "Potential & Recurrence Risk",
    title: "Recurrence Potential: Serious Public Health Threat",
    prompt: "If the event recurred, could it create a serious public health threat?",
    guidance: "Epidemiological / population-level recurrence risk.",
  },
  {
    id: "POTENTIAL_005",
    category: "POTENTIAL",
    categoryLabel: "Potential & Recurrence Risk",
    title: "Malfunction Recurrence Likely to Harm",
    prompt: "If the malfunction recurred, would it be likely to cause or contribute to death or serious injury?",
    guidance: "FDA 21 CFR 803.50(a)(2) malfunction reporting threshold.",
    dependencies: [{ parentQuestionId: "MALFUNCTION_001", expectedAnswer: "YES" }],
  },

  // -------------------------------------------------------------
  // MALFUNCTION
  // -------------------------------------------------------------
  {
    id: "MALFUNCTION_001",
    category: "MALFUNCTION",
    categoryLabel: "Device Malfunction",
    title: "Device Malfunction",
    prompt: "Did the device malfunction?",
    guidance: "Failure of a device to meet its performance specifications or otherwise perform as intended.",
  },
  {
    id: "MALFUNCTION_002",
    category: "MALFUNCTION",
    categoryLabel: "Device Malfunction",
    title: "Failure to Meet Specifications",
    prompt: "Did the device fail to meet its specifications?",
    guidance: "Physical, chemical, electrical, software, or labeling deviation from approved design specifications.",
    dependencies: [{ parentQuestionId: "MALFUNCTION_001", expectedAnswer: "YES" }],
  },
  {
    id: "MALFUNCTION_003",
    category: "MALFUNCTION",
    categoryLabel: "Device Malfunction",
    title: "Failure to Perform as Intended",
    prompt: "Did the device fail to perform as intended?",
    guidance: "Does not perform the intended medical function described in labeling or IFU.",
    dependencies: [{ parentQuestionId: "MALFUNCTION_001", expectedAnswer: "YES" }],
  },
  {
    id: "MALFUNCTION_004",
    category: "MALFUNCTION",
    categoryLabel: "Device Malfunction",
    title: "Recurrence Likely to Cause Serious Harm",
    prompt: "Would recurrence of the malfunction be likely to cause or contribute to serious harm?",
    guidance: "FDA MDR malfunction reporting test.",
    dependencies: [{ parentQuestionId: "MALFUNCTION_001", expectedAnswer: "YES" }],
  },
  {
    id: "MALFUNCTION_005",
    category: "MALFUNCTION",
    categoryLabel: "Device Malfunction",
    title: "Malfunction Previously Resulted in Serious Harm",
    prompt: "Has this malfunction or failure mode previously resulted in death or serious harm?",
    guidance: "Historical complaint / clinical data indicating catastrophic risk profile.",
    dependencies: [{ parentQuestionId: "MALFUNCTION_001", expectedAnswer: "YES" }],
  },

  // -------------------------------------------------------------
  // USE / ERROR
  // -------------------------------------------------------------
  {
    id: "USE_001",
    category: "USE",
    categoryLabel: "Use & Operational Context",
    title: "Used Outside Intended Use",
    prompt: "Was the device used outside its intended use (off-label)?",
    guidance: "Use of device in clinical indications, populations, or environments contrary to approved labeling.",
  },
  {
    id: "USE_002",
    category: "USE",
    categoryLabel: "Use & Operational Context",
    title: "Abnormal Use",
    prompt: "Was the event caused by abnormal use?",
    guidance: "EU DT Q2: Act or omission by user that is deliberate and contrary to clear warnings/instructions (IEC 62366 / MDR).",
    legacyEuQuestionMapping: "EU DT Q2",
  },
  {
    id: "USE_003",
    category: "USE",
    categoryLabel: "Use & Operational Context",
    title: "User Error",
    prompt: "Was there user error (use error)?",
    guidance: "EU DT Q15: Action or omission leading to an unexpected result during intended use.",
    legacyEuQuestionMapping: "EU DT Q15 (base)",
  },
  {
    id: "USE_004",
    category: "USE",
    categoryLabel: "Use & Operational Context",
    title: "Device Misuse",
    prompt: "Was there misuse of the device?",
    guidance: "Incorrect use by a clinician, patient, or third party.",
    dependencies: [{ parentQuestionId: "USE_003", expectedAnswer: "YES" }],
  },
  {
    id: "USE_005",
    category: "USE",
    categoryLabel: "Use & Operational Context",
    title: "Use Error Related to Ergonomics / Device Design",
    prompt: "Was the use error related to ergonomic features or device design?",
    guidance: "EU DT Q15 (Non-UK EU): If use error is due to poor ergonomics or UI, it remains reportable.",
    dependencies: [{ parentQuestionId: "USE_003", expectedAnswer: "YES" }],
    legacyEuQuestionMapping: "EU DT Q15 (ergonomics)",
  },
  {
    id: "USE_006",
    category: "USE",
    categoryLabel: "Use & Operational Context",
    title: "Inadequacy of Manufacturer Information / IFU",
    prompt: "Was the manufacturer's information or Instructions For Use (IFU) inadequate?",
    guidance: "EU DT Q15: Inadequate or confusing instructions that contributed to the error.",
    dependencies: [{ parentQuestionId: "USE_003", expectedAnswer: "YES" }],
    legacyEuQuestionMapping: "EU DT Q15 (IFU)",
  },
  {
    id: "USE_007",
    category: "USE",
    categoryLabel: "Use & Operational Context",
    title: "Used Contrary to Labeling",
    prompt: "Was the device used contrary to labeling?",
    guidance: "Contraindicated or improper clinical administration.",
  },

  // -------------------------------------------------------------
  // EXPECTEDNESS / LABELING
  // -------------------------------------------------------------
  {
    id: "EXPECTEDNESS_001",
    category: "EXPECTEDNESS",
    categoryLabel: "Expectedness & Labeling",
    title: "Known / Labeled Side Effect",
    prompt: "Is event a labeled side effect considered foreseeable and clinically acceptable in terms of patient benefit, and documented in DMR with appropriate risk management prior to occurrence?",
    guidance: "EU DT Q10: Expected, foreseeable side effect documented in Device Master Record / Risk Management file.",
    legacyEuQuestionMapping: "EU DT Q10",
  },
  {
    id: "EXPECTEDNESS_002",
    category: "EXPECTEDNESS",
    categoryLabel: "Expectedness & Labeling",
    title: "Expected Based on Labeling",
    prompt: "Is the event expected based on the device's approved labeling?",
    guidance: "Explicitly listed in precautions, warnings, or adverse reactions section of IFU.",
    dependencies: [{ parentQuestionId: "EXPECTEDNESS_001", expectedAnswer: ["YES", "UNKNOWN"] }],
  },
  {
    id: "EXPECTEDNESS_003",
    category: "EXPECTEDNESS",
    categoryLabel: "Expectedness & Labeling",
    title: "Clinically Acceptable in Context of Benefit",
    prompt: "Is the event clinically acceptable in the context of the intended patient benefit?",
    guidance: "Benefit-risk ratio remains favorable in accordance with ISO 14971.",
    dependencies: [{ parentQuestionId: "EXPECTEDNESS_001", expectedAnswer: "YES" }],
  },
  {
    id: "EXPECTEDNESS_004",
    category: "EXPECTEDNESS",
    categoryLabel: "Expectedness & Labeling",
    title: "Documented in Risk Management Prior to Occurrence",
    prompt: "Was the event documented in the risk-management documentation prior to occurrence?",
    guidance: "Risk was quantitatively and qualitatively assessed in the FMEA/Risk Assessment prior to event.",
    dependencies: [{ parentQuestionId: "EXPECTEDNESS_001", expectedAnswer: "YES" }],
  },
  {
    id: "EXPECTEDNESS_005",
    category: "EXPECTEDNESS",
    categoryLabel: "Expectedness & Labeling",
    title: "Frequency or Severity Outside Expected Range",
    prompt: "Is the frequency or severity of this event outside the expected range (trend signal)?",
    guidance: "EU MDR Art 88 / TGA / PMDA: An increase in frequency or severity of foreseeable side effects requires reporting as a trend.",
    dependencies: [{ parentQuestionId: "EXPECTEDNESS_001", expectedAnswer: "YES" }],
  },
  {
    id: "EXPECTEDNESS_006",
    category: "EXPECTEDNESS",
    categoryLabel: "Expectedness & Labeling",
    title: "Event More Severe than Described in Labeling",
    prompt: "Is the event more severe than described in labeling/risk documentation?",
    guidance: "Unanticipated severity triggers expedited reporting even if qualitative nature was anticipated.",
    dependencies: [{ parentQuestionId: "EXPECTEDNESS_001", expectedAnswer: "YES" }],
  },

  // -------------------------------------------------------------
  // DEVICE STATUS / EXPIRY / SAFEGUARDS
  // -------------------------------------------------------------
  {
    id: "DEVICE_001",
    category: "DEVICE_STATUS",
    categoryLabel: "Device Status & Safeguards",
    title: "Beyond Labeled Expiry / Service / Shelf Life",
    prompt: "Was device used outside labeled expiry, service-life, or shelf-life?",
    guidance: "EU DT Q7: Check physical product expiration date vs date of clinical use.",
    legacyEuQuestionMapping: "EU DT Q7",
  },
  {
    id: "DEVICE_002",
    category: "DEVICE_STATUS",
    categoryLabel: "Device Status & Safeguards",
    title: "Beyond Service Life",
    prompt: "Was the device beyond its defined service life?",
    guidance: "Number of operating cycles, hours, or years exceeding validated manufacturer service life.",
    dependencies: [{ parentQuestionId: "DEVICE_001", expectedAnswer: "YES" }],
  },
  {
    id: "DEVICE_003",
    category: "DEVICE_STATUS",
    categoryLabel: "Device Status & Safeguards",
    title: "Beyond Shelf Life",
    prompt: "Was the device beyond its defined shelf life?",
    guidance: "Exceeded sterile packaging or storage shelf life.",
    dependencies: [{ parentQuestionId: "DEVICE_001", expectedAnswer: "YES" }],
  },
  {
    id: "DEVICE_004",
    category: "DEVICE_STATUS",
    categoryLabel: "Device Status & Safeguards",
    title: "Exceeded Expiry/Life as Sole Cause",
    prompt: "Is exceeded expiry, shelf-life, or service-life the only cause of the failure?",
    guidance: "EU DT Q8: Exemption only applies if expiry exceedance is the exclusive causative factor.",
    dependencies: [{ parentQuestionId: "DEVICE_001", expectedAnswer: "YES" }],
    legacyEuQuestionMapping: "EU DT Q8",
  },
  {
    id: "DEVICE_005",
    category: "DEVICE_STATUS",
    categoryLabel: "Device Status & Safeguards",
    title: "Defect Detectable Prior to Use",
    prompt: "Was defect found prior to use and would always be found prior to use if it recurs?",
    guidance: "EU DT Q14: Clear visual or built-in test detection prior to patient contact.",
    legacyEuQuestionMapping: "EU DT Q14",
  },
  {
    id: "DEVICE_006",
    category: "DEVICE_STATUS",
    categoryLabel: "Device Status & Safeguards",
    title: "Failure Mode Usual for Expired Device",
    prompt: "Is failure mode usual for an expired device?",
    guidance: "EU DT Q9: Foreseeable degradation mode for expired components.",
    dependencies: [{ parentQuestionId: "DEVICE_001", expectedAnswer: "YES" }],
    legacyEuQuestionMapping: "EU DT Q9",
  },
  {
    id: "DEVICE_007",
    category: "DEVICE_STATUS",
    categoryLabel: "Device Status & Safeguards",
    title: "Design Feature Safeguard Prevented Hazard",
    prompt: "Did a design feature protect against fault becoming a hazard?",
    guidance: "EU DT Q13: Fail-safe mechanism, alarm, or interlock that successfully prevented harm.",
    legacyEuQuestionMapping: "EU DT Q13",
  },

  // -------------------------------------------------------------
  // REGULATORY / PROCESS & SPECIAL EXEMPTIONS
  // -------------------------------------------------------------
  {
    id: "REG_001",
    category: "REGULATORY",
    categoryLabel: "Regulatory Agreements & Process",
    title: "Periodic Summary Reporting Agreement",
    prompt: "Is event or event type subject to periodic summary reporting agreement with competent authority?",
    guidance: "EU DT Q11 / Q16: Formal written exemption allowing batched periodic reporting instead of individual expedited filings.",
    legacyEuQuestionMapping: "EU DT Q11 / Q16",
  },
  {
    id: "REG_002",
    category: "REGULATORY",
    categoryLabel: "Regulatory Agreements & Process",
    title: "Special Regulatory Reporting Requirement",
    prompt: "Is the event subject to a special regulatory reporting requirement?",
    guidance: "Condition of approval, 522 post-market surveillance study, or special order.",
  },
  {
    id: "REG_003",
    category: "REGULATORY",
    categoryLabel: "Regulatory Agreements & Process",
    title: "Potential Trend / Signal",
    prompt: "Is this event potentially a trend or statistical vigilance signal?",
    guidance: "EU MDR Art 88 trend reporting.",
  },
  {
    id: "REG_004",
    category: "REGULATORY",
    categoryLabel: "Regulatory Agreements & Process",
    title: "Field Safety Corrective Action (FSCA) / Recall Required",
    prompt: "Could this event require a field safety corrective action (FSCA) or recall?",
    guidance: "EU MDR Art 87(1)(b) FSCA / FDA 21 CFR 806 / 21 CFR 803 5-day trigger.",
  },
  {
    id: "REG_005",
    category: "REGULATORY",
    categoryLabel: "Regulatory Agreements & Process",
    title: "Another Regulatory Authority Notified",
    prompt: "Has another regulatory authority already been notified?",
    guidance: "Cross-border regulatory notification coordination.",
  },
  {
    id: "REG_006",
    category: "REGULATORY",
    categoryLabel: "Regulatory Agreements & Process",
    title: "Remedial Corrective Action Initiated",
    prompt: "Has remedial action necessary to prevent an unreasonable risk of substantial harm been initiated?",
    guidance: "FDA 21 CFR 803.53: Triggers mandatory 5-day expedited reporting.",
  },
  {
    id: "REG_007",
    category: "REGULATORY",
    categoryLabel: "Regulatory Agreements & Process",
    title: "Applicable Regulatory Reporting Exemption",
    prompt: "Is there an applicable statutory regulatory reporting exemption?",
    guidance: "Specific formal exemption granted by regulator.",
  },
  {
    id: "REG_008",
    category: "REGULATORY",
    categoryLabel: "Regulatory Agreements & Process",
    title: "In Vitro Diagnostic (IVD) Product",
    prompt: "Is this an In Vitro Diagnostic (IVD) product?",
    guidance: "EU DT Q17: Applicable under EU IVDR 2017/746 requirements.",
    legacyEuQuestionMapping: "EU DT Q17",
  },
  {
    id: "REG_009",
    category: "REGULATORY",
    categoryLabel: "Regulatory Agreements & Process",
    title: "Negligible Documented Risk",
    prompt: "For other events, has risk been found negligible and documented as acceptable in risk analysis?",
    guidance: "EU DT Q12: Documented risk evaluation under ISO 14971.",
    legacyEuQuestionMapping: "EU DT Q12",
  },
];

/**
 * Question lookup index by stable ID
 */
export const CANONICAL_QUESTION_MAP = new Map<string, CanonicalQuestionDefinition>(
  CANONICAL_QUESTION_BANK.map((q) => [q.id, q])
);
