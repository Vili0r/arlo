import { describe, it, expect } from "vitest";
import { mirSchema, mirAttachmentSchema } from "@/lib/validations/mir";
import { MIRStatus } from "@prisma/client";

describe("MIR Schema Fields & Validation", () => {
  it("should validate all new fields in Section 1, 2, 3, 4, 5, and late reporting", () => {
    const validData = {
      status: MIRStatus.DRAFT,
      reportType: "INITIAL",
      mirNumber: "MIR-2026-001",

      // 1.2
      reportNextDate: new Date("2026-10-15"),
      expectedDayOfNextReport: new Date("2026-10-15"),

      // 1.3
      authorizedRepresentativeContact: "Dr. Jane Representative (+44 20 7946 0919)",
      arContact: "Jane Contact",
      submitterContact: "John Submitter (submitter@example.com)",

      // 2
      dateLotReleased: new Date("2025-01-10"),
      expiryDate: new Date("2028-01-10"),
      dateOfImplantFrom: new Date("2025-02-01"),
      dateOfImplantTo: new Date("2025-02-01"),
      dateOfExplantFrom: new Date("2025-08-01"),
      dateOfExplantTo: new Date("2025-08-01"),
      implantDuration: "6 months",
      implantFacilityName: "St. Mary Hospital",
      explantFacilityName: "General Infirmary",
      notifiedBodyId: "0123",
      notifiedBodyCerNoOfDevice: "CE-987654321",

      // 2.4
      devicePlacedOnMarket: true,
      mddClass: "Class IIb",
      mdrClass: "Class III",
      ivddClass: "List A",
      ivdrClass: "Class D",

      // 2.5 & 2.6
      marketDistributionOfDevice: "EEA and Switzerland",
      countriesDistributedTo: "FR, DE, IT, ES, UK",
      relevantAccessories: "Guidewire Model G-400",
      relevantAssociatedDevices: "Delivery Catheter DC-200",

      // 3.2
      imdrfA: ["A0101", "A0203"],
      patientStatusIntervention: "Surgical intervention required to remove component",

      // 3.3
      imdrf3: ["E0101"],
      imdrfE: ["E0101"],
      imdrfF: ["F02"],

      // 4.1
      initialManufacturerCapa: "CAPA-2026-088 initiated for batch containment",

      // 4.2
      reasonForNotReportable: "Does not meet serious threat threshold upon initial teardown",
      imdrfG: ["G0102"],
      anyActionTaken: "Quarantine of warehouse inventory from Lot B44",
      actionImplementationSchedule: "Target completion by Q4 2026",
      finalManufacturerComments: "Investigation concluded root cause was foreign particulate",

      // Section 5, Late reporting & Attachments
      businessComments: "Priority handling requested by customer account lead",
      lateReason: "Awaiting hospital explant return due to biological clearance",
      cidCapaForLateReportable: "CAPA-2026-092",
      commentsForLateReportable: "Delay justified due to third party lab testing queue",
      processStageForLateReportable: "Phase 2 Teardown",
      attachments: [
        {
          id: "att_123",
          fileName: "teardown_microscopy.pdf",
          fileUrl: "https://blob.vercel-storage.com/teardown_microscopy.pdf",
          fileSize: 1048576,
          mimeType: "application/pdf",
        },
      ],
    };

    const parseResult = mirSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.expectedDayOfNextReport).toEqual(new Date("2026-10-15"));
      expect(parseResult.data.authorizedRepresentativeContact).toBe("Dr. Jane Representative (+44 20 7946 0919)");
      expect(parseResult.data.submitterContact).toBe("John Submitter (submitter@example.com)");
      expect(parseResult.data.dateLotReleased).toEqual(new Date("2025-01-10"));
      expect(parseResult.data.expiryDate).toEqual(new Date("2028-01-10"));
      expect(parseResult.data.implantDuration).toBe("6 months");
      expect(parseResult.data.notifiedBodyCerNoOfDevice).toBe("CE-987654321");
      expect(parseResult.data.devicePlacedOnMarket).toBe(true);
      expect(parseResult.data.marketDistributionOfDevice).toBe("EEA and Switzerland");
      expect(parseResult.data.imdrfA).toEqual(["A0101", "A0203"]);
      expect(parseResult.data.patientStatusIntervention).toBe("Surgical intervention required to remove component");
      expect(parseResult.data.imdrfF).toEqual(["F02"]);
      expect(parseResult.data.initialManufacturerCapa).toBe("CAPA-2026-088 initiated for batch containment");
      expect(parseResult.data.reasonForNotReportable).toBe("Does not meet serious threat threshold upon initial teardown");
      expect(parseResult.data.imdrfG).toEqual(["G0102"]);
      expect(parseResult.data.anyActionTaken).toBe("Quarantine of warehouse inventory from Lot B44");
      expect(parseResult.data.actionImplementationSchedule).toBe("Target completion by Q4 2026");
      expect(parseResult.data.finalManufacturerComments).toBe("Investigation concluded root cause was foreign particulate");
      expect(parseResult.data.businessComments).toBe("Priority handling requested by customer account lead");
      expect(parseResult.data.lateReason).toBe("Awaiting hospital explant return due to biological clearance");
      expect(parseResult.data.cidCapaForLateReportable).toBe("CAPA-2026-092");
      expect(parseResult.data.commentsForLateReportable).toBe("Delay justified due to third party lab testing queue");
      expect(parseResult.data.processStageForLateReportable).toBe("Phase 2 Teardown");
      expect(parseResult.data.attachments).toHaveLength(1);
      expect(parseResult.data.attachments?.[0].fileName).toBe("teardown_microscopy.pdf");
    }
  });

  it("should validate mirAttachmentSchema independently", () => {
    const attachment = {
      fileName: "lab_report.pdf",
      fileUrl: "https://blob.example.com/lab.pdf",
      fileSize: 512000,
      mimeType: "application/pdf",
    };
    const parsed = mirAttachmentSchema.safeParse(attachment);
    expect(parsed.success).toBe(true);
  });
});
