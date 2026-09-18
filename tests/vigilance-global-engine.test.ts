import { describe, it, expect } from "vitest";
import { evaluateJurisdictionRuleset, evaluateAllJurisdictions } from "@/lib/vigilance/engine";
import { EU_MDR_RULESET } from "@/lib/vigilance/rules/eu-mdr";
import { US_FDA_RULESET } from "@/lib/vigilance/rules/us-fda";
import { HEALTH_CANADA_RULESET } from "@/lib/vigilance/rules/ca-health-canada";
import { AU_TGA_RULESET } from "@/lib/vigilance/rules/au-tga";
import { CN_NMPA_RULESET } from "@/lib/vigilance/rules/cn-nmpa";
import { JP_PMDA_RULESET } from "@/lib/vigilance/rules/jp-pmda";
import { StoredQuestionAnswer } from "@/lib/vigilance/question-bank";

/**
 * Helper to build quick question answers list
 */
function createAnswers(record: Record<string, string>): StoredQuestionAnswer[] {
  return Object.entries(record).map(([questionId, answer]) => ({
    questionId,
    answer: answer as any,
    reviewStatus: "APPROVED",
  }));
}

describe("Global Medical Device Reportability Engine - Unit & Compliance Tests", () => {
  /* ========================================================================= */
  /* EU MDR (Articles 87-90 & EU Decision Tree Questions)                      */
  /* ========================================================================= */
  describe("EU MDR Vigilance Ruleset", () => {
    it("EU DT Q1: should determine NOT_REPORTABLE when device is not suspected of causing/contributing (CAUSALITY_001 = NO)", () => {
      const answers = createAnswers({
        EVENT_001: "YES",
        EVENT_002: "YES",
        CAUSALITY_001: "NO",
        OUTCOME_001: "YES", // Even if death occurred, unrelated device is not reportable
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers);
      expect(assessment.status).toBe("NOT_REPORTABLE");
      expect(assessment.triggeredRules).toContain("EU-EXCL-CAUSALITY-001");
      expect(assessment.reportingReason).toContain("EU MDR Art 2(64)");
    });

    it("EU DT Q4: should determine REPORTABLE (10-day deadline) for death with suspected device causality", () => {
      const awarenessDate = "2026-09-01T10:00:00.000Z";
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_001: "YES",
        OUTCOME_003: "NO",
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers, { awarenessDate });
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("DEATH");
      expect(assessment.deadlineDays).toBe(10);
      expect(assessment.deadline).toBe("2026-09-11T10:00:00.000Z");
      expect(assessment.triggeredRules).toContain("EU-RULE-DEATH-001");
    });

    it("EU DT Q4: should determine REPORTABLE (15-day deadline) for serious deterioration in health", () => {
      const awarenessDate = "2026-09-01T10:00:00.000Z";
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_001: "NO",
        OUTCOME_003: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers, { awarenessDate });
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("SERIOUS_DETERIORATION");
      expect(assessment.deadlineDays).toBe(15);
      expect(assessment.deadline).toBe("2026-09-16T10:00:00.000Z");
      expect(assessment.triggeredRules).toContain("EU-RULE-SERIOUS-DETERIORATION-001");
    });

    it("EU DT Q3: should determine REPORTABLE (2-day deadline) for serious public health threat", () => {
      const awarenessDate = "2026-09-01T10:00:00.000Z";
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_008: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers, { awarenessDate });
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("SERIOUS_PUBLIC_HEALTH_THREAT");
      expect(assessment.deadlineDays).toBe(2);
      expect(assessment.deadline).toBe("2026-09-03T10:00:00.000Z");
      expect(assessment.triggeredRules).toContain("EU-RULE-PUBLIC-HEALTH-THREAT-001");
    });

    it("EU DT Q5: should determine REPORTABLE (15-day) for potential serious incident on recurrence", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_001: "NO",
        OUTCOME_003: "NO",
        POTENTIAL_003: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("POTENTIAL_SERIOUS_INCIDENT");
      expect(assessment.deadlineDays).toBe(15);
      expect(assessment.triggeredRules).toContain("EU-RULE-RECURRENCE-POTENTIAL-001");
    });

    it("EU DT Q2: should exempt reporting if caused by abnormal use", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        USE_002: "YES",
        OUTCOME_003: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers);
      expect(assessment.status).toBe("NOT_REPORTABLE");
      expect(assessment.reportingCategory).toBe("EXCLUSION_ABNORMAL_USE");
      expect(assessment.triggeredRules).toContain("EU-EXCL-ABNORMAL-USE-001");
    });

    it("EU DT Q7, Q8, Q9: should exempt reporting if expired device is the sole cause with normal degradation", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        DEVICE_001: "YES",
        DEVICE_004: "YES",
        DEVICE_006: "YES",
        OUTCOME_003: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers);
      expect(assessment.status).toBe("NOT_REPORTABLE");
      expect(assessment.reportingCategory).toBe("EXCLUSION_EXPIRED_DEVICE");
      expect(assessment.triggeredRules).toContain("EU-EXCL-EXPIRED-DEVICE-001");
    });

    it("EU DT Q10: should exempt reporting if labeled side effect foreseeable and clinically acceptable in DMR", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        EXPECTEDNESS_001: "YES",
        EXPECTEDNESS_005: "NO", // No trend signal deviation
        OUTCOME_003: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers);
      expect(assessment.status).toBe("NOT_REPORTABLE");
      expect(assessment.reportingCategory).toBe("EXCLUSION_LABELED_SIDE_EFFECT");
      expect(assessment.triggeredRules).toContain("EU-EXCL-LABELED-SIDE-EFFECT-001");
    });

    it("EU DT Q11 / Q16: should mark EXEMPT if Periodic Summary Reporting agreement is in place", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        REG_001: "YES",
        OUTCOME_003: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers);
      expect(assessment.status).toBe("EXEMPT");
      expect(assessment.reportingCategory).toBe("PERIODIC_SUMMARY_REPORTING");
      expect(assessment.triggeredRules).toContain("EU-EXCL-PERIODIC-SUMMARY-REPORTING-001");
    });

    it("EU DT Q14: should exempt reporting if defect was found prior to use and would always be found", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        DEVICE_005: "YES",
        OUTCOME_001: "NO",
        OUTCOME_003: "NO",
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers);
      expect(assessment.status).toBe("NOT_REPORTABLE");
      expect(assessment.reportingCategory).toBe("EXCLUSION_PRE_USE_DETECTION");
      expect(assessment.triggeredRules).toContain("EU-EXCL-DETECTABLE-PRIOR-TO-USE-001");
    });

    it("First-Class UNKNOWN Handling: should output PENDING_INFORMATION and identify missing information when causality is UNKNOWN", () => {
      const answers = createAnswers({
        CAUSALITY_001: "UNKNOWN",
        OUTCOME_001: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(EU_MDR_RULESET, answers);
      expect(assessment.status).toBe("PENDING_INFORMATION");
      expect(assessment.reviewerRequired).toBe(true);
      expect(assessment.unresolvedQuestions).toContain("CAUSALITY_001");
    });
  });

  /* ========================================================================= */
  /* US FDA (21 CFR Part 803)                                                 */
  /* ========================================================================= */
  describe("US FDA MDR Ruleset", () => {
    it("should trigger 30-day MDR for device-caused death", () => {
      const awarenessDate = "2026-09-01T10:00:00.000Z";
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_001: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(US_FDA_RULESET, answers, { awarenessDate });
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("DEATH");
      expect(assessment.deadlineDays).toBe(30);
      expect(assessment.deadlineType).toBe("CALENDAR_DAYS");
      expect(assessment.deadline).toBe("2026-10-01T10:00:00.000Z");
      expect(assessment.triggeredRules).toContain("FDA-MDR-DEATH-001");
    });

    it("should trigger 30-day MDR for device-caused serious injury", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_002: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(US_FDA_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("SERIOUS_INJURY");
      expect(assessment.deadlineDays).toBe(30);
      expect(assessment.triggeredRules).toContain("FDA-MDR-INJURY-001");
    });

    it("should trigger 30-day MDR for malfunction where recurrence is likely to cause death/serious injury", () => {
      const answers = createAnswers({
        MALFUNCTION_001: "YES",
        MALFUNCTION_004: "YES",
        OUTCOME_001: "NO",
        OUTCOME_002: "NO",
      });

      const assessment = evaluateJurisdictionRuleset(US_FDA_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("MALFUNCTION");
      expect(assessment.triggeredRules).toContain("FDA-MDR-MALFUNCTION-RECURRENCE-001");
    });

    it("should determine NOT_REPORTABLE for malfunction without recurrence harm risk", () => {
      const answers = createAnswers({
        MALFUNCTION_001: "YES",
        MALFUNCTION_004: "NO",
        OUTCOME_001: "NO",
        OUTCOME_002: "NO",
      });

      const assessment = evaluateJurisdictionRuleset(US_FDA_RULESET, answers);
      expect(assessment.status).toBe("NOT_REPORTABLE");
      expect(assessment.reportingCategory).toBe("NON_REPORTABLE_MALFUNCTION");
      expect(assessment.triggeredRules).toContain("FDA-MDR-MALFUNCTION-BENIGN-001");
    });

    it("should trigger 5-work-day report when remedial action is initiated to prevent unreasonable risk of harm", () => {
      // 2026-09-01 is a Tuesday. 5 business days skips the weekend (Sept 5-6) -> Sept 8
      const awarenessDate = "2026-09-01T10:00:00.000Z";
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        REG_006: "YES",
        OUTCOME_001: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(US_FDA_RULESET, answers, { awarenessDate });
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("5_DAY_REMEDIAL_ACTION");
      expect(assessment.deadlineDays).toBe(5);
      expect(assessment.deadlineType).toBe("BUSINESS_DAYS");
      expect(assessment.deadline).toBe("2026-09-08T10:00:00.000Z");
      expect(assessment.triggeredRules).toContain("FDA-MDR-5DAY-REMEDIAL-001");
    });
  });

  /* ========================================================================= */
  /* HEALTH CANADA (SOR/98-282)                                               */
  /* ========================================================================= */
  describe("Health Canada Ruleset", () => {
    it("should require 10-day preliminary report for incident resulting in death or serious deterioration", () => {
      const awarenessDate = "2026-09-01T10:00:00.000Z";
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_001: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(HEALTH_CANADA_RULESET, answers, { awarenessDate });
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.deadlineDays).toBe(10);
      expect(assessment.deadline).toBe("2026-09-11T10:00:00.000Z");
      expect(assessment.triggeredRules).toContain("HC-MDR-10DAY-DEATH-DETERIORATION-001");
    });

    it("should require 30-day report when no harm occurred but recurrence could cause serious deterioration", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_001: "NO",
        OUTCOME_003: "NO",
        POTENTIAL_003: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(HEALTH_CANADA_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.deadlineDays).toBe(30);
      expect(assessment.triggeredRules).toContain("HC-MDR-30DAY-RECURRENCE-001");
    });
  });

  /* ========================================================================= */
  /* AUSTRALIA TGA                                                            */
  /* ========================================================================= */
  describe("Australia TGA Ruleset", () => {
    it("should require 48-hour report for public health threat", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_008: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(AU_TGA_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("SERIOUS_PUBLIC_HEALTH_THREAT");
      expect(assessment.deadlineType).toBe("HOURS");
      expect(assessment.deadlineDays).toBe(2);
    });

    it("should require 10-day report for death or serious deterioration", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_001: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(AU_TGA_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.deadlineDays).toBe(10);
    });

    it("should require 30-day report for recurrence risk / near-miss", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_001: "NO",
        OUTCOME_003: "NO",
        POTENTIAL_003: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(AU_TGA_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.deadlineDays).toBe(30);
    });
  });

  /* ========================================================================= */
  /* CHINA NMPA                                                               */
  /* ========================================================================= */
  describe("China NMPA Ruleset", () => {
    it("should require 7-day report for death events", () => {
      const answers = createAnswers({
        EVENT_002: "YES",
        OUTCOME_001: "YES",
      });

      const assessment = evaluateJurisdictionRuleset(CN_NMPA_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.deadlineDays).toBe(7);
      expect(assessment.triggeredRules).toContain("NMPA-MDR-7DAY-DEATH-001");
    });

    it("NMPA 'Report when in doubt' (怀疑即报): should trigger reportable for suspected adverse event with unknown causality", () => {
      const answers = createAnswers({
        EVENT_003: "YES",
        CAUSALITY_001: "UNKNOWN",
      });

      const assessment = evaluateJurisdictionRuleset(CN_NMPA_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("SUSPECTED_ADVERSE_EVENT");
      expect(assessment.deadlineDays).toBe(15);
      expect(assessment.triggeredRules).toContain("NMPA-MDR-DOUBT-REPORTING-001");
    });
  });

  /* ========================================================================= */
  /* JAPAN PMDA                                                               */
  /* ========================================================================= */
  describe("Japan PMDA Ruleset", () => {
    it("should require 7-day report for UNPREDICTED death", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_001: "YES",
        EXPECTEDNESS_001: "NO", // Unpredicted
      });

      const assessment = evaluateJurisdictionRuleset(JP_PMDA_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("UNPREDICTED_DEATH");
      expect(assessment.deadlineDays).toBe(7);
    });

    it("should require 15-day report for PREDICTED death", () => {
      const answers = createAnswers({
        CAUSALITY_001: "YES",
        OUTCOME_001: "YES",
        EXPECTEDNESS_001: "YES", // Predicted
      });

      const assessment = evaluateJurisdictionRuleset(JP_PMDA_RULESET, answers);
      expect(assessment.status).toBe("REPORTABLE");
      expect(assessment.reportingCategory).toBe("PREDICTED_DEATH");
      expect(assessment.deadlineDays).toBe(15);
    });
  });

  /* ========================================================================= */
  /* MULTI-JURISDICTION DIVERGENCE TEST                                       */
  /* Proves that THE SAME INCIDENT produces different results across regions.   */
  /* ========================================================================= */
  describe("Multi-Jurisdiction Divergence on Same Incident", () => {
    it("Scenario A: Malfunction with Recurrence Risk but No Immediate Harm (Near-Miss)", () => {
      // Malfunction occurred, recurrence could cause serious injury, no actual harm.
      const incidentAnswers = createAnswers({
        EVENT_001: "YES",
        EVENT_002: "YES",
        CAUSALITY_001: "YES",
        OUTCOME_001: "NO",
        OUTCOME_002: "NO",
        OUTCOME_003: "NO",
        MALFUNCTION_001: "YES",
        MALFUNCTION_004: "YES",
        POTENTIAL_003: "YES",
      });

      const globalResult = evaluateAllJurisdictions(incidentAnswers);

      // EU MDR: 15-day reportable under potential serious incident rule
      expect(globalResult.jurisdictionAssessments["EU"].status).toBe("REPORTABLE");
      expect(globalResult.jurisdictionAssessments["EU"].deadlineDays).toBe(15);

      // US FDA: 30-day reportable under 21 CFR 803.50(a)(2) malfunction
      expect(globalResult.jurisdictionAssessments["US_FDA"].status).toBe("REPORTABLE");
      expect(globalResult.jurisdictionAssessments["US_FDA"].deadlineDays).toBe(30);

      // Health Canada: 30-day reportable under SOR/98-282 section 60(1)(a)(ii)
      expect(globalResult.jurisdictionAssessments["CA_HEALTH_CANADA"].status).toBe("REPORTABLE");
      expect(globalResult.jurisdictionAssessments["CA_HEALTH_CANADA"].deadlineDays).toBe(30);

      // Same incident -> Different reporting categories and deadlines!
      expect(globalResult.jurisdictionAssessments["EU"].deadlineDays).not.toBe(
        globalResult.jurisdictionAssessments["US_FDA"].deadlineDays
      );
    });

    it("Scenario B: Death Event (Deadlines differ: EU 10d vs FDA 30d vs NMPA 7d vs TGA 10d)", () => {
      const incidentAnswers = createAnswers({
        EVENT_001: "YES",
        EVENT_002: "YES",
        CAUSALITY_001: "YES",
        OUTCOME_001: "YES",
        EXPECTEDNESS_001: "NO",
      });

      const globalResult = evaluateAllJurisdictions(incidentAnswers);

      expect(globalResult.jurisdictionAssessments["EU"].status).toBe("REPORTABLE");
      expect(globalResult.jurisdictionAssessments["EU"].deadlineDays).toBe(10);

      expect(globalResult.jurisdictionAssessments["US_FDA"].status).toBe("REPORTABLE");
      expect(globalResult.jurisdictionAssessments["US_FDA"].deadlineDays).toBe(30);

      expect(globalResult.jurisdictionAssessments["CN_NMPA"].status).toBe("REPORTABLE");
      expect(globalResult.jurisdictionAssessments["CN_NMPA"].deadlineDays).toBe(7);

      expect(globalResult.jurisdictionAssessments["JP_PMDA"].status).toBe("REPORTABLE");
      expect(globalResult.jurisdictionAssessments["JP_PMDA"].deadlineDays).toBe(7);

      expect(globalResult.jurisdictionAssessments["AU_TGA"].status).toBe("REPORTABLE");
      expect(globalResult.jurisdictionAssessments["AU_TGA"].deadlineDays).toBe(10);
    });

    it("Scenario C: Abnormal Use with Serious Deterioration", () => {
      // In EU, abnormal use is an explicit statutory exclusion from vigilance.
      const incidentAnswers = createAnswers({
        EVENT_001: "YES",
        EVENT_002: "YES",
        CAUSALITY_001: "YES",
        OUTCOME_003: "YES",
        USE_002: "YES", // abnormal use
      });

      const globalResult = evaluateAllJurisdictions(incidentAnswers);

      // EU MDR excludes abnormal use
      expect(globalResult.jurisdictionAssessments["EU"].status).toBe("NOT_REPORTABLE");
      expect(globalResult.jurisdictionAssessments["EU"].reportingCategory).toBe("EXCLUSION_ABNORMAL_USE");
    });
  });
});
