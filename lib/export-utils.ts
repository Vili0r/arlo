/**
 * Utility functions for exporting tabular records to XLS (Excel XML) and TXT (Tab-delimited)
 */

export interface ExportColumn {
  key: string;
  label: string;
}

/**
 * Escapes characters for XML generation
 */
export function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats any field value into a human-readable display string
 */
export function formatExportValue(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  if (typeof val === "boolean") {
    return val ? "Yes" : "No";
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      return val
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            const rec = item as Record<string, unknown>;
            const display =
              rec.name ||
              rec.title ||
              rec.materialDescription ||
              rec.serialNumber;
            return display ? String(display) : JSON.stringify(item);
          }
          return String(item);
        })
        .filter(Boolean)
        .join("; ");
    }
    // Handle nested user/author object
    const obj = val as Record<string, unknown>;
    if (obj.firstName || obj.lastName || obj.email) {
      const name = [obj.firstName, obj.lastName].filter(Boolean).join(" ");
      return name ? `${name} (${String(obj.email || "")})` : String(obj.email || "");
    }
    return JSON.stringify(val);
  }

  // Check if string is an ISO timestamp
  const strVal = String(val);
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(strVal) &&
    !isNaN(Date.parse(strVal))
  ) {
    const d = new Date(strVal);
    return d.toISOString().replace("T", " ").substring(0, 19);
  }

  return strVal;
}

/**
 * Generates SpreadsheetML XML string for Microsoft Excel (.xls)
 */
export function generateXlsXmlString(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  sheetName = "Export"
): string {
  const safeSheetName = escapeXml(sheetName.substring(0, 31));

  const headerCells = columns
    .map(
      (col) =>
        `    <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(
          col.label
        )}</Data></Cell>`
    )
    .join("\n");

  const dataRows = data
    .map((row) => {
      const cells = columns
        .map((col) => {
          const rawVal = row[col.key];
          const formatted = formatExportValue(rawVal);
          // Check if numeric
          const isNumeric =
            typeof rawVal === "number" && !isNaN(rawVal);
          const cellType = isNumeric ? "Number" : "String";
          const cellValue = isNumeric ? String(rawVal) : escapeXml(formatted);

          return `    <Cell ss:StyleID="DataCell"><Data ss:Type="${cellType}">${cellValue}</Data></Cell>`;
        })
        .join("\n");

      return `   <Row>\n${cells}\n   </Row>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#334155"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${safeSheetName}">
  <Table>
   <Row ss:Height="24">
${headerCells}
   </Row>
${dataRows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

/**
 * Generates tab-delimited text string (.txt)
 */
export function generateTxtString(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  delimiter = "\t"
): string {
  const headerLine = columns.map((col) => col.label).join(delimiter);

  const dataLines = data.map((row) => {
    return columns
      .map((col) => {
        const val = formatExportValue(row[col.key]);
        // Sanitize newlines and tabs to keep each record on a single line
        return val.replace(/[\r\n]+/g, " ").replace(/\t/g, " ");
      })
      .join(delimiter);
  });

  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Creates an XLS Blob
 */
export function generateXlsBlob(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  sheetName = "Export"
): Blob {
  const xml = generateXlsXmlString(data, columns, sheetName);
  return new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
}

/**
 * Creates a TXT Blob
 */
export function generateTxtBlob(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  delimiter = "\t"
): Blob {
  const txt = generateTxtString(data, columns, delimiter);
  return new Blob([txt], {
    type: "text/plain;charset=utf-8",
  });
}

/**
 * Triggers browser download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}
