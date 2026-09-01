import { describe, it, expect } from "vitest";
import {
  generateReportPlainText,
  type CustomerReportComplaintData,
} from "@/components/customer-report-modal";

describe("Customer Report Generation", () => {
  it("generates a complete customer report with all required information", () => {
    const complaintData: CustomerReportComplaintData = {
      complaintNumber: "CMP-2026-0001",
      shortDescription: "Infusion pump screen flickering during dosage configuration",
      customerName: "Memorial Sloan Kettering",
      customerType: "HOSPITAL",
      email: "dr.house@mskcc.org",
      country: "United States",
      countryEventOccurred: "United States",
      dateReceived: "2026-03-01T10:00:00.000Z",
      awarenessDate: "2026-03-01T08:00:00.000Z",
      productInformation: [
        {
          materialDescription: "Alaris Infusion Pump 8100",
          materialNumber: "REF-8100-US",
          serialNumber: "SN-998822",
          batchNumber: "LOT-2025-X01",
          udi: "(01)00884521098(17)261231(10)LOT-2025-X01(21)SN-998822",
          softwareVersion: "v4.2.1",
        },
      ],
      investigation: {
        summary: {
          report:
            "The returned unit was evaluated by our biomedical engineering team. Bench testing confirmed a loose ribbon cable connector between the main PCB and the display module. The connector was re-seated and secured with locking adhesive. No software bugs or component failures were observed. The unit meets all original manufacturing specifications after re-work.",
        },
      },
    };

    const reportText = generateReportPlainText(complaintData, "Acme Medical Systems");

    // Check Header & Reference
    expect(reportText).toContain("CUSTOMER INVESTIGATION REPORT & RESPONSE LETTER");
    expect(reportText).toContain("ACME MEDICAL SYSTEMS");
    expect(reportText).toContain("Complaint Reference: CMP-2026-0001");

    // Check 1. Complaint & Customer Overview
    expect(reportText).toContain("Short Description:      Infusion pump screen flickering during dosage configuration");
    expect(reportText).toContain("Customer Name:          Memorial Sloan Kettering (HOSPITAL)");
    expect(reportText).toContain("Reporter Email Address: dr.house@mskcc.org");
    expect(reportText).toContain("Country:                United States");

    // Check 2. Device Information (without IMDRF coding, lot number, UDI, or software version)
    expect(reportText).toContain("Description: Alaris Infusion Pump 8100");
    expect(reportText).toContain("Material / REF #: REF-8100-US");
    expect(reportText).toContain("Serial #: SN-998822");

    // Strictly ensure lot number, UDI, software version, and IMDRF codes are excluded from the customer report
    expect(reportText).not.toContain("Lot / Batch #");
    expect(reportText).not.toContain("UDI:");
    expect(reportText).not.toContain("Software Version:");
    expect(reportText).not.toContain("Annex");
    expect(reportText).not.toContain("asReportedCode");
    expect(reportText).not.toContain("IMDRF");

    // Check 3. Investigation Report & Conclusion (Main Body)
    expect(reportText).toContain(
      "The returned unit was evaluated by our biomedical engineering team. Bench testing confirmed a loose ribbon cable connector between the main PCB and the display module."
    );
  });

  it("handles fallback when no products are in productInformation array and investigation report is empty", () => {
    const complaintData: CustomerReportComplaintData = {
      complaintNumber: "CMP-2026-0002",
      shortDescription: "Sensor measurement delay",
      customerName: "Berlin Charite Hospital",
      email: "lab.admin@charite.de",
      country: "Germany",
      deviceModel: "Blood Gas Analyzer Model X",
      deviceSerialNumber: "SN-DE-4411",
      lotNumber: "BATCH-882",
      investigation: null,
    };

    const reportText = generateReportPlainText(complaintData);

    expect(reportText).toContain("Complaint Reference: CMP-2026-0002");
    expect(reportText).toContain("Short Description:      Sensor measurement delay");
    expect(reportText).toContain("Customer Name:          Berlin Charite Hospital");
    expect(reportText).toContain("Reporter Email Address: lab.admin@charite.de");
    expect(reportText).toContain("Country:                Germany");

    expect(reportText).toContain("Description: Blood Gas Analyzer Model X");
    expect(reportText).toContain("Serial #: SN-DE-4411");
    expect(reportText).not.toContain("Lot / Batch #");

    // Fallback for investigation body
    expect(reportText).toContain(
      "Investigation findings and conclusion have not been documented in the investigation file."
    );
  });

  it("handles multi-device complaints formatting each device cleanly", () => {
    const complaintData: CustomerReportComplaintData = {
      complaintNumber: "CMP-2026-0003",
      shortDescription: "Sterile packaging breach on multi-component kit",
      customerName: "St. Thomas Hospital",
      email: "supplies@st-thomas.nhs.uk",
      country: "United Kingdom",
      productInformation: [
        {
          materialDescription: "Catheter Tube Assembly",
          materialNumber: "REF-CAT-01",
          serialNumber: "SN-C-001",
          batchNumber: "LOT-C-99",
          udi: "UDI-001",
          softwareVersion: "N/A",
        },
        {
          materialDescription: "Guide Wire 0.035in",
          materialNumber: "REF-GW-35",
          serialNumber: "SN-GW-882",
          batchNumber: "LOT-GW-04",
          udi: "UDI-002",
          softwareVersion: "N/A",
        },
      ],
      investigation: {
        summary: {
          report: "Packaging seal integrity testing indicated heat seal temperature deviation at the packaging line.",
        },
      },
    };

    const reportText = generateReportPlainText(complaintData);

    expect(reportText).toContain("Device #1:");
    expect(reportText).toContain("Description: Catheter Tube Assembly");
    expect(reportText).toContain("Material / REF #: REF-CAT-01");

    expect(reportText).toContain("Device #2:");
    expect(reportText).toContain("Description: Guide Wire 0.035in");
    expect(reportText).toContain("Material / REF #: REF-GW-35");

    expect(reportText).toContain(
      "Packaging seal integrity testing indicated heat seal temperature deviation at the packaging line."
    );
  });
});
