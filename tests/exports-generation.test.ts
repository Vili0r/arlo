import { describe, it, expect } from "vitest";
import {
  generateXlsXmlString,
  generateTxtString,
  formatExportValue,
  escapeXml,
  type ExportColumn,
} from "@/lib/export-utils";

/**
 * @traceability
 * URS: URS-013 (Data Exports & Regulatory Inspection Support)
 * SRS: SRS-019 (Regulatory Export Bundle Generation)
 * Design: DESIGN-019 (Regulatory Export Service)
 * Test ID: TEST-018
 */
describe("[TEST-018] Export Utilities", () => {
  const sampleData = [
    {
      complaintNumber: "CMP-2026-0001",
      shortDescription: "Needle breakage during infusion & fluid leak",
      status: "OPEN",
      priority: "HIGH",
      isAdverseEvent: true,
      quantity: 5,
      notes: "Line 1\nLine 2\r\nLine 3",
      assignedUser: { firstName: "Jane", lastName: "Doe", email: "jane@example.com" },
      dateLogged: "2026-03-01T14:30:00.000Z",
    },
    {
      complaintNumber: "CMP-2026-0002",
      shortDescription: "Packaging seal broken <alert>",
      status: "CLOSED",
      priority: "LOW",
      isAdverseEvent: false,
      quantity: 1,
      notes: "Clean note",
      assignedUser: null,
      dateLogged: "2026-03-02T10:00:00.000Z",
    },
  ];

  const fullColumns: ExportColumn[] = [
    { key: "complaintNumber", label: "Complaint Number" },
    { key: "shortDescription", label: "Short Description" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "isAdverseEvent", label: "Adverse Event" },
    { key: "quantity", label: "Quantity" },
    { key: "notes", label: "Notes" },
    { key: "assignedUser", label: "Assigned To" },
  ];

  const subsetColumns: ExportColumn[] = [
    { key: "complaintNumber", label: "Complaint Number" },
    { key: "status", label: "Status" },
  ];

  describe("escapeXml", () => {
    it("escapes special XML characters properly", () => {
      expect(escapeXml("Tom & Jerry <cartoon> 'quotes' \"double\"")).toBe(
        "Tom &amp; Jerry &lt;cartoon&gt; &apos;quotes&apos; &quot;double&quot;"
      );
    });

    it("handles empty strings", () => {
      expect(escapeXml("")).toBe("");
    });
  });

  describe("formatExportValue", () => {
    it("formats null and undefined as empty string", () => {
      expect(formatExportValue(null)).toBe("");
      expect(formatExportValue(undefined)).toBe("");
    });

    it("formats booleans as Yes / No", () => {
      expect(formatExportValue(true)).toBe("Yes");
      expect(formatExportValue(false)).toBe("No");
    });

    it("formats nested user object as Name (Email)", () => {
      expect(
        formatExportValue({ firstName: "Alice", lastName: "Smith", email: "alice@hospital.org" })
      ).toBe("Alice Smith (alice@hospital.org)");
    });

    it("formats date strings into clean timestamps", () => {
      const result = formatExportValue("2026-03-01T14:30:00.000Z");
      expect(result).toBe("2026-03-01 14:30:00");
    });
  });

  describe("generateXlsXmlString", () => {
    it("generates valid SpreadsheetML structure with all selected columns", () => {
      const xml = generateXlsXmlString(sampleData, fullColumns, "Complaints");

      // Verify Excel XML root and namespaces
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<?mso-application progid="Excel.Sheet"?>');
      expect(xml).toContain('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"');
      expect(xml).toContain('<Worksheet ss:Name="Complaints">');

      // Verify Header row contains all column labels
      expect(xml).toContain('<Data ss:Type="String">Complaint Number</Data>');
      expect(xml).toContain('<Data ss:Type="String">Short Description</Data>');
      expect(xml).toContain('<Data ss:Type="String">Adverse Event</Data>');
      expect(xml).toContain('<Data ss:Type="String">Assigned To</Data>');

      // Verify Data rows
      expect(xml).toContain('<Data ss:Type="String">CMP-2026-0001</Data>');
      expect(xml).toContain('<Data ss:Type="String">Needle breakage during infusion &amp; fluid leak</Data>');
      expect(xml).toContain('<Data ss:Type="String">Packaging seal broken &lt;alert&gt;</Data>');
      expect(xml).toContain('<Data ss:Type="String">Yes</Data>');
      expect(xml).toContain('<Data ss:Type="String">No</Data>');
      expect(xml).toContain('<Data ss:Type="Number">5</Data>');
      expect(xml).toContain('<Data ss:Type="String">Jane Doe (jane@example.com)</Data>');
    });

    it("respects deselected fields and only includes selected columns", () => {
      const xml = generateXlsXmlString(sampleData, subsetColumns, "Filtered");

      expect(xml).toContain('<Data ss:Type="String">Complaint Number</Data>');
      expect(xml).toContain('<Data ss:Type="String">Status</Data>');

      // Deselected fields should NOT be in the XML
      expect(xml).not.toContain('<Data ss:Type="String">Short Description</Data>');
      expect(xml).not.toContain('<Data ss:Type="String">Adverse Event</Data>');
      expect(xml).not.toContain('<Data ss:Type="String">Assigned To</Data>');
      expect(xml).not.toContain("Needle breakage");
    });
  });

  describe("generateTxtString", () => {
    it("generates tab-delimited text with header row", () => {
      const txt = generateTxtString(sampleData, fullColumns);
      const lines = txt.split("\r\n");

      // Header row
      expect(lines[0]).toBe(
        "Complaint Number\tShort Description\tStatus\tPriority\tAdverse Event\tQuantity\tNotes\tAssigned To"
      );

      // Data row 1
      expect(lines[1]).toContain("CMP-2026-0001");
      expect(lines[1]).toContain("Needle breakage during infusion & fluid leak");
      expect(lines[1]).toContain("Yes");
      expect(lines[1]).toContain("Jane Doe (jane@example.com)");

      // Check newline sanitation in Notes: no extra split lines
      expect(lines.length).toBe(3); // 1 header + 2 data rows
      expect(lines[1]).toContain("Line 1 Line 2 Line 3");
    });

    it("respects deselected columns in TXT export", () => {
      const txt = generateTxtString(sampleData, subsetColumns);
      const lines = txt.split("\r\n");

      expect(lines[0]).toBe("Complaint Number\tStatus");
      expect(lines[1]).toBe("CMP-2026-0001\tOPEN");
      expect(lines[2]).toBe("CMP-2026-0002\tCLOSED");
      expect(lines.length).toBe(3);
    });
  });
});
