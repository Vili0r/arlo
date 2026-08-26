const fs = require('fs');
const filePath = 'lib/constants/qms-options.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const newCategories = `export const IMDRF_ANNEX_C_CATEGORIES: OptionItem[] = [
  { value: "C01", label: "C01 - Biological Problem Identified" },
  { value: "C02", label: "C02 - Electrical Problem Identified" },
  { value: "C03", label: "C03 - Electromagnetic Compatibility Problem Identified" },
  { value: "C04", label: "C04 - Interoperability Problem Identified" },
  { value: "C05", label: "C05 - Labeling and Instructions for Use/Maintenance" },
  { value: "C06", label: "C06 - Material and/or Chemical Problem Identified" },
  { value: "C07", label: "C07 - Mechanical Problem Identified" },
  { value: "C08", label: "C08 - Optical Problem Identified" },
  { value: "C09", label: "C09 - Clinical Imaging Problem Identified" },
  { value: "C10", label: "C10 - Software Problem Identified" },
  { value: "C11", label: "C11 - Thermal Problem" },
  { value: "C12", label: "C12 - Protective System Problem Identified" },
  { value: "C13", label: "C13 - Operational Problem Identified" },
  { value: "C14", label: "C14 - Patient Sample Problem" },
  { value: "C15", label: "C15 - Environment Problem Identified" },
  { value: "C16", label: "C16 - Manufacturing Process Problem Identified" },
  { value: "C17", label: "C17 - Maintenance Problem Identified" },
  { value: "C18", label: "C18 - Transport/Storage Problem Identified" },
  { value: "C19", label: "C19 - No Device Problem Found" },
  { value: "C20", label: "C20 - No Findings Available" },
  { value: "C21", label: "C21 - Results Pending Completion of Investigation" },
  { value: "C22", label: "C22 - Appropriate Investigation Findings Term/Code not Available" },
  { value: "C23", label: "C23 - Usage Problem Identified" },
  { value: "C24", label: "C24 - Malfunction Observed Without Conclusive Finding" }
];

export const IMDRF_ANNEX_C_SUBCAT_MAP: Record<string, OptionItem[]> = {
  C01: [
    { value: "C0101", label: "C0101 - Biocompatibility Problem Identified" },
    { value: "C0102", label: "C0102 - Biological Contamination" },
    { value: "C010201", label: "C010201 - Endotoxin Contamination" },
    { value: "C010202", label: "C010202 - Microbial Contamination" },
    { value: "C0103", label: "C0103 - Material or Material Leachate Pyrogenic Problem" },
    { value: "C0104", label: "C0104 - Cytotoxicity Problem Identified" },
    { value: "C0105", label: "C0105 - Genotoxicity Problem Identified" },
    { value: "C010501", label: "C010501 - Carcinogenic Problem" },
    { value: "C010502", label: "C010502 - Mutagenic Problem" },
    { value: "C0106", label: "C0106 - Hematological Problem Identified" },
    { value: "C010601", label: "C010601 - Agglutination Problem" },
    { value: "C010602", label: "C010602 - Complement Activation Problem" },
    { value: "C010603", label: "C010603 - Platelet Activation Problem" },
    { value: "C010604", label: "C010604 - Problem Due to Thrombosis Activation" },
    { value: "C0107", label: "C0107 - Unintended Presence of Allergens" },
    { value: "C0108", label: "C0108 - Reproductive Toxicity Problem Identified" },
    { value: "C0109", label: "C0109 - Undesirable Presence of Endogenous Materials" }
  ],
  C02: [
    { value: "C0201", label: "C0201 - Electrical/Electronic Component Problem Identified" },
    { value: "C0202", label: "C0202 - Hardware Timing Problem Identified" },
    { value: "C0203", label: "C0203 - Impedance Problem Identified" },
    { value: "C0204", label: "C0204 - Insulation Problem Identified" },
    { value: "C0205", label: "C0205 - Open Circuit" },
    { value: "C0206", label: "C0206 - Current Leakage Problem" },
    { value: "C0207", label: "C0207 - Power Source Problem Identified" },
    { value: "C020701", label: "C020701 - Energy Storage System Problem" },
    { value: "C020702", label: "C020702 - Loss of Power Identified" },
    { value: "C020703", label: "C020703 - Power Fluctuation" },
    { value: "C0208", label: "C0208 - Short Circuit" },
    { value: "C0209", label: "C0209 - Signal Loss" },
    { value: "C0210", label: "C0210 - Corrupted Memory" }
  ],
  C03: [
    { value: "C0301", label: "C0301 - Conducted Interference" },
    { value: "C0302", label: "C0302 - Electrostatic Discharge Identified" },
    { value: "C0303", label: "C0303 - Inadequate Immunity" },
    { value: "C0304", label: "C0304 - Unintended Emission" },
    { value: "C0305", label: "C0305 - Radiofrequency Interference (RFI) Identified" }
  ],
  C04: [
    { value: "C0401", label: "C0401 - Communications Problem Identified" },
    { value: "C040101", label: "C040101 - Wired Communication Problem" },
    { value: "C040102", label: "C040102 - Wireless Communication Problem Identified" },
    { value: "C040103", label: "C040103 - Network Communication Problem" },
    { value: "C0402", label: "C0402 - Incompatible Component/Accessory" },
    { value: "C0403", label: "C0403 - Device not Compatible With Another Device" },
    { value: "C0404", label: "C0404 - Unintended Compatibility Identified" }
  ],
  C05: [
    { value: "C0501", label: "C0501 - Inadequate Labeling and/or Instructions for Use" },
    { value: "C0502", label: "C0502 - Incorrect Labeling and/or Instructions for Use" },
    { value: "C0503", label: "C0503 - Inadequate or Incorrect Instructions for Maintenance" }
  ],
  C06: [
    { value: "C0601", label: "C0601 - Degradation Problem Identified" },
    { value: "C0602", label: "C0602 - Inappropriate Material" },
    { value: "C060201", label: "C060201 - Improper Composition/Concentration" },
    { value: "C060202", label: "C060202 - Improper Physical Structure" },
    { value: "C060203", label: "C060203 - Molecular Structure Problem" },
    { value: "C0603", label: "C0603 - Inadequate Physicochemical Properties" },
    { value: "C0604", label: "C0604 - Incompatible Material" },
    { value: "C0605", label: "C0605 - Reactivity Problem Identified" },
    { value: "C0606", label: "C0606 - Tolerance Stack-Up" }
  ],
  C07: [
    { value: "C0701", label: "C0701 - Device Migration" },
    { value: "C0702", label: "C0702 - Friction Problem Identified" },
    { value: "C0703", label: "C0703 - Leakage/Seal" },
    { value: "C0704", label: "C0704 - Lubrication Problem Identified" },
    { value: "C0705", label: "C0705 - Stiffness Problem Identified" },
    { value: "C0706", label: "C0706 - Stress Problem Identified" },
    { value: "C070606", label: "C070606 - Wear Problem" },
    { value: "C0707", label: "C0707 - Incorrect Dimension" },
    { value: "C0708", label: "C0708 - Blockage Identified" }
  ],
  C08: [
    { value: "C0801", label: "C0801 - Optical Transmission Problem Identified" },
    { value: "C0802", label: "C0802 - Light Source Problem Identified" }
  ],
  C09: [
    { value: "C0901", label: "C0901 - Gradient Induced Field Problem" },
    { value: "C0902", label: "C0902 - Image Artifact" },
    { value: "C0903", label: "C0903 - Magnetically-Induced Movement" },
    { value: "C0904", label: "C0904 - Radiofrequency Induced Overheating" }
  ],
  C10: [
    { value: "C1001", label: "C1001 - Configuration Issue" },
    { value: "C1002", label: "C1002 - Design Error" },
    { value: "C100201", label: "C100201 - Data Compression Error" }
  ],
  C11: [
    { value: "C1101", label: "C1101 - Overheating Problem Identified" },
    { value: "C1102", label: "C1102 - Excessive Heating Identified" },
    { value: "C1103", label: "C1103 - Excessive Cooling Identified" },
    { value: "C1104", label: "C1104 - Inadequate Cooling Identified" }
  ],
  C12: [
    { value: "C1201", label: "C1201 - Fail-Safe Problem Identified" },
    { value: "C1202", label: "C1202 - Alarm System Problem Identified" },
    { value: "C1203", label: "C1203 - Problem of Device to Self-Test" },
    { value: "C1204", label: "C1204 - Problem to Auto Stop" },
    { value: "C1205", label: "C1205 - Premature Indicator Activation Identified" },
    { value: "C1206", label: "C1206 - Reset Problem Identified" },
    { value: "C1207", label: "C1207 - Shielding Problem" },
    { value: "C1208", label: "C1208 - Missing or Inadequate Safety Measures Identified" }
  ],
  C13: [
    { value: "C1301", label: "C1301 - Device Incorrectly Reprocessed" },
    { value: "C130101", label: "C130101 - Device Incorrectly Cleaned During Reprocessing" }
  ],
  C14: [
    { value: "C1401", label: "C1401 - New or Unknown Interferent" },
    { value: "C1402", label: "C1402 - Known Interferent" },
    { value: "C1403", label: "C1403 - Problem Related to Variant/Mutant" },
    { value: "C1404", label: "C1404 - Pre-Analytical Handling Problem" }
  ],
  C15: [
    { value: "C1501", label: "C1501 - Environmental Temperature Problem Identified" },
    { value: "C1502", label: "C1502 - Contamination of Device by Foreign Material from Environment" },
    { value: "C1503", label: "C1503 - Contamination of Environment by Device" },
    { value: "C1504", label: "C1504 - Environmental Pressure Problem Identified" },
    { value: "C1505", label: "C1505 - Ambient Light Problem Identified" },
    { value: "C1506", label: "C1506 - Environmental Humidity Problem Identified" }
  ],
  C16: [
    { value: "C1601", label: "C1601 - Assembly Problem Identified" },
    { value: "C1602", label: "C1602 - Sterilization Problem Identified" },
    { value: "C1603", label: "C1603 - Installation Problem Identified" },
    { value: "C1604", label: "C1604 - Maintenance of Manufacturing Machinery" },
    { value: "C1605", label: "C1605 - Packaging Problem Identified" },
    { value: "C160501", label: "C160501 - Packaging Compromised" },
    { value: "C160502", label: "C160502 - Packaging Materials Problem" },
    { value: "C160503", label: "C160503 - Packaging Contains Unintended Material" },
    { value: "C160504", label: "C160504 - Packaging Contains Incorrect or Incomplete Device" }
  ],
  C17: [
    { value: "C1701", label: "C1701 - Misadjustment/Misalignment Identified" }
  ],
  C18: [
    { value: "C1801", label: "C1801 - Transport Problem Identified" },
    { value: "C1802", label: "C1802 - Storage Problem Identified" }
  ],
  C19: [
    { value: "C1901", label: "C1901 - Unable to Exclude Device Problem" },
    { value: "C1902", label: "C1902 - Device Problem Excluded" }
  ],
  C23: [
    { value: "C2301", label: "C2301 - Insufficient Sample Volume" },
    { value: "C2302", label: "C2302 - Use of Non-Validated Controls Identified" }
  ]
};`;

const start1 = content.indexOf('export const IMDRF_ANNEX_C_CATEGORIES: OptionItem[] = [');
const end1 = content.indexOf('export const IMDRF_ANNEX_D_CATEGORIES', start1);

if (start1 === -1 || end1 === -1) {
    console.error('Could not find Annex C definition in file');
    process.exit(1);
}

const before = content.slice(0, start1);
const after = content.slice(end1);

fs.writeFileSync(filePath, before + newCategories + '\n\n' + after);
console.log('done');
