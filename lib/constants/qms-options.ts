// =============================================================================
// MedTech Quality Management System (QMS) Standard Controlled Vocabularies
// Reference: IMDRF Adverse Event Terminology (Annexes A, E, F), ISO 13485, FDA 21 CFR
// Official IMDRF Source: https://www.imdrf.org/working-groups/adverse-event-terminology
// =============================================================================

export interface OptionItem {
  value: string;
  label: string;
  category?: string;
}

export const CUSTOMER_TYPES: OptionItem[] = [
  { value: "Hospital / Healthcare Facility", label: "Hospital / Healthcare Facility" },
  { value: "Ambulatory Surgery Center (ASC)", label: "Ambulatory Surgery Center (ASC)" },
  { value: "Clinic / Physician Office", label: "Clinic / Physician Office" },
  { value: "Clinical Laboratory / Pathology", label: "Clinical Laboratory / Pathology" },
  { value: "Home Health / Patient Direct", label: "Home Health / Patient Direct" },
  { value: "Distributor / Wholesaler", label: "Distributor / Wholesaler" },
  { value: "Contract Manufacturer / OEM Partner", label: "Contract Manufacturer / OEM Partner" },
  { value: "Pharmacy / Drugstore", label: "Pharmacy / Drugstore" },
  { value: "Emergency Medical Services (EMS)", label: "Emergency Medical Services (EMS)" },
  { value: "Academic / Research Institution", label: "Academic / Research Institution" },
  { value: "Government / Military Health", label: "Government / Military Health" },
  { value: "Other", label: "Other" },
];

export const REGIONS: OptionItem[] = [
  { value: "North America (US & Canada)", label: "North America (US & Canada)" },
  { value: "European Union (EU & EEA)", label: "European Union (EU & EEA)" },
  { value: "United Kingdom (MHRA)", label: "United Kingdom (MHRA)" },
  { value: "Asia-Pacific (APAC)", label: "Asia-Pacific (APAC)" },
  { value: "Latin America (LATAM)", label: "Latin America (LATAM)" },
  { value: "Middle East & Africa (MEA)", label: "Middle East & Africa (MEA)" },
  { value: "Global / Multi-Region", label: "Global / Multi-Region" },
];

export const COUNTRIES: OptionItem[] = [
  { value: "United States", label: "United States (US)" },
  { value: "Canada", label: "Canada (CA)" },
  { value: "United Kingdom", label: "United Kingdom (UK)" },
  { value: "Germany", label: "Germany (DE)" },
  { value: "France", label: "France (FR)" },
  { value: "Switzerland", label: "Switzerland (CH)" },
  { value: "Japan", label: "Japan (JP)" },
  { value: "Australia", label: "Australia (AU)" },
  { value: "Netherlands", label: "Netherlands (NL)" },
  { value: "Belgium", label: "Belgium (BE)" },
  { value: "Italy", label: "Italy (IT)" },
  { value: "Spain", label: "Spain (ES)" },
  { value: "Sweden", label: "Sweden (SE)" },
  { value: "Ireland", label: "Ireland (IE)" },
  { value: "Austria", label: "Austria (AT)" },
  { value: "Denmark", label: "Denmark (DK)" },
  { value: "Norway", label: "Norway (NO)" },
  { value: "Finland", label: "Finland (FI)" },
  { value: "Singapore", label: "Singapore (SG)" },
  { value: "South Korea", label: "South Korea (KR)" },
  { value: "China", label: "China (CN)" },
  { value: "India", label: "India (IN)" },
  { value: "Brazil", label: "Brazil (BR)" },
  { value: "Mexico", label: "Mexico (MX)" },
  { value: "Israel", label: "Israel (IL)" },
  { value: "New Zealand", label: "New Zealand (NZ)" },
  { value: "South Africa", label: "South Africa (ZA)" },
  { value: "Saudi Arabia", label: "Saudi Arabia (SA)" },
  { value: "United Arab Emirates", label: "United Arab Emirates (AE)" },
];

// -----------------------------------------------------------------------------
// IMDRF Annex A: Level 1 Categories (High-Level Problem Classification)
// -----------------------------------------------------------------------------
export const IMDRF_ANNEX_A_CATEGORIES: OptionItem[] = [
  { value: "A01", label: "A01 - Electrical / Electronic Property Problem" },
  { value: "A02", label: "A02 - Calibration / Diagnostic / Output Measurement Problem" },
  { value: "A03", label: "A03 - Computer Software / Firmware Problem" },
  { value: "A04", label: "A04 - Connection / Coupling Problem" },
  { value: "A05", label: "A05 - Fluid / Gas / Hydraulic / Flow Problem" },
  { value: "A06", label: "A06 - Mechanical / Structural / Physical Integrity Problem" },
  { value: "A07", label: "A07 - Optical / Visual / Display / Imaging Problem" },
  { value: "A08", label: "A08 - Thermal / Temperature / Overheating Problem" },
  { value: "A09", label: "A09 - Packaging / Labeling / IFU Problem" },
  { value: "A10", label: "A10 - Biological / Chemical / Sterility / Particulate Contamination" },
  { value: "A11", label: "A11 - Human Factors / Use-Related / Ergonomic Problem" },
  { value: "A12", label: "A12 - Output / Energy / Radiation / Dose Delivery Problem" },
  { value: "A13", label: "A13 - Alarm / Alert System Problem" },
  { value: "A14", label: "A14 - Environmental / Electromagnetic Compatibility Problem" },
  { value: "A15", label: "A15 - Installation / Maintenance / Servicing Problem" },
];

// -----------------------------------------------------------------------------
// IMDRF Annex A: Level 2/3 Specific Problem Codes mapped by Level 1 Category
// -----------------------------------------------------------------------------
export const IMDRF_ANNEX_A_SUBCAT_MAP: Record<string, OptionItem[]> = {
  A01: [
    { value: "A0101", label: "A0101 - Power Source Problem / Unintended Power Loss" },
    { value: "A0102", label: "A0102 - Battery Problem (Discharge / Depletion / Leakage / Bulge)" },
    { value: "A0103", label: "A0103 - Electrical Arcing / Spark / Short Circuit" },
    { value: "A0104", label: "A0104 - High Impedance / Resistance Error" },
    { value: "A0105", label: "A0105 - Inadvertent Electrical Shock to Patient or User" },
    { value: "A0106", label: "A0106 - Circuit Board Failure / Trace Breakdown" },
    { value: "A0107", label: "A0107 - Grounding / Electrical Isolation Fault" },
  ],
  A02: [
    { value: "A0201", label: "A0201 - Calibration Error / Drift from Nominal" },
    { value: "A0202", label: "A0202 - False Positive Result" },
    { value: "A0203", label: "A0203 - False Negative Result" },
    { value: "A0204", label: "A0204 - Inaccurate Measurement / Sensor Reading Error" },
    { value: "A0205", label: "A0205 - Display / GUI Value Mismatch" },
    { value: "A0206", label: "A0206 - Artifact / Signal Noise Interference" },
  ],
  A03: [
    { value: "A0301", label: "A0301 - Software Crash / Freeze / System Lockup" },
    { value: "A0302", label: "A0302 - Software Algorithm / Computation / Logic Error" },
    { value: "A0303", label: "A0303 - Cybersecurity Vulnerability / Malicious Attack" },
    { value: "A0304", label: "A0304 - Wireless / Bluetooth / Network Data Transmission Failure" },
    { value: "A0305", label: "A0305 - Database / File Corruption / Data Loss" },
    { value: "A0306", label: "A0306 - User Interface Glitch / Graphic Rendering Failure" },
    { value: "A0307", label: "A0307 - Firmware Boot / Initialization Failure" },
  ],
  A04: [
    { value: "A0401", label: "A0401 - Unintended Disconnection / Loose Connection" },
    { value: "A0402", label: "A0402 - Luer Lock / Connector Thread Stripping" },
    { value: "A0403", label: "A0403 - Incompatible Fitting / Misconnection" },
    { value: "A0404", label: "A0404 - Leakage at Connection Joint" },
  ],
  A05: [
    { value: "A0501", label: "A0501 - Fluid / Blood / Medication Leakage" },
    { value: "A0502", label: "A0502 - Line Occlusion / Flow Blockage" },
    { value: "A0503", label: "A0503 - Over-Infusion / Delivery Rate Exceeded" },
    { value: "A0504", label: "A0504 - Under-Infusion / Insufficient Flow Rate" },
    { value: "A0505", label: "A0505 - Air Embolism / Gas Bubble in Infusion Line" },
    { value: "A0506", label: "A0506 - Valve Leakage / Backflow" },
    { value: "A0507", label: "A0507 - Pressure Relief / Safety Valve Failure" },
  ],
  A06: [
    { value: "A0601", label: "A0601 - Break / Fracture / Shatter" },
    { value: "A0602", label: "A0602 - Detachment / Unintended Separation of Device Parts" },
    { value: "A0603", label: "A0603 - Deformation / Bending / Warping / Kinking" },
    { value: "A0604", label: "A0604 - Material Wear / Degradation / Peeling / Delamination" },
    { value: "A0605", label: "A0605 - Jam / Stuck Mechanism / Drive Motor Stall" },
    { value: "A0606", label: "A0606 - Structural Collapse / Loss of Support" },
  ],
  A07: [
    { value: "A0701", label: "A0701 - Image Quality Degradation / Blurred Image" },
    { value: "A0702", label: "A0702 - Laser / Optical Lens Defect" },
    { value: "A0703", label: "A0703 - Light Source Failure / Insufficient Illumination" },
    { value: "A0704", label: "A0704 - Camera / Sensor Distortion Artifact" },
  ],
  A08: [
    { value: "A0801", label: "A0801 - Overheating / Excessive Enclosure Surface Temperature" },
    { value: "A0802", label: "A0802 - Thermal Cutout Failure / Inadequate Thermal Cutoff" },
    { value: "A0803", label: "A0803 - Inadequate Heating / Inadequate Patient Warming" },
    { value: "A0804", label: "A0804 - Inadequate Cooling / Refrigeration Failure" },
  ],
  A09: [
    { value: "A0901", label: "A0901 - Sterile Barrier Packaging Breach / Seal Failure" },
    { value: "A0902", label: "A0902 - Missing / Incorrect / Illegible Labeling or UDI Barcode" },
    { value: "A0903", label: "A0903 - Instructions for Use (IFU) Inadequate or Missing" },
    { value: "A0904", label: "A0904 - Damaged Packaging During Transit" },
  ],
  A10: [
    { value: "A1001", label: "A1001 - Foreign Particulate Matter Contamination" },
    { value: "A1002", label: "A1002 - Sterility Failure / Microbial / Endotoxin Contamination" },
    { value: "A1003", label: "A1003 - Chemical Degradation / Leachables / Outgassing" },
    { value: "A1004", label: "A1004 - Biocompatibility / Cytotoxicity Reaction" },
  ],
  A11: [
    { value: "A1101", label: "A1101 - User Interface Ambiguity / Misinterpretation of Data" },
    { value: "A1102", label: "A1102 - Inadvertent Setting Adjustment" },
    { value: "A1103", label: "A1103 - Incorrect Assembly by User" },
    { value: "A1104", label: "A1104 - Inappropriate Maintenance / Cleaning Procedure" },
  ],
  A12: [
    { value: "A1201", label: "A1201 - Overdose Energy / Radiation Delivery" },
    { value: "A1202", label: "A1202 - Underdose Energy / Radiation Delivery" },
    { value: "A1203", label: "A1203 - Energy Output Inaccurate / Waveform Discrepancy" },
  ],
  A13: [
    { value: "A1301", label: "A1301 - False Alarm Trigger (Nuisance Alarm)" },
    { value: "A1302", label: "A1302 - Failure to Alarm / Alarm Not Sounded During Fault" },
    { value: "A1303", label: "A1303 - Alarm Inaudible / Low Sound Volume / Concealed Visual Alarm" },
    { value: "A1304", label: "A1304 - Delayed Alarm Trigger" },
  ],
  A14: [
    { value: "A1401", label: "A1401 - Electromagnetic Interference (EMI) Susceptibility" },
    { value: "A1402", label: "A1402 - Humidity / Moisture Ingress Damage" },
    { value: "A1403", label: "A1403 - Electrostatic Discharge (ESD) Sensitivity" },
  ],
  A15: [
    { value: "A1501", label: "A1501 - Inadequate Installation / Assembly by Technician" },
    { value: "A1502", label: "A1502 - Inadequate Servicing / Calibration by Service Provider" },
  ],
};

// Flattened list for fallback search/display
export const IMDRF_ANNEX_A_ALL_CODES: OptionItem[] = Object.values(
  IMDRF_ANNEX_A_SUBCAT_MAP
).flat();

// -----------------------------------------------------------------------------
// IMDRF Annex E: Health Effects - Clinical Signs and Symptoms
// -----------------------------------------------------------------------------
export const IMDRF_ANNEX_E_CODES: OptionItem[] = [
  { value: "E0101", label: "E0101 - Arrhythmia / Ventricular Fibrillation", category: "Cardiovascular" },
  { value: "E0102", label: "E0102 - Bradycardia", category: "Cardiovascular" },
  { value: "E0103", label: "E0103 - Tachycardia", category: "Cardiovascular" },
  { value: "E0104", label: "E0104 - Cardiac Arrest / Asystole", category: "Cardiovascular" },
  { value: "E0105", label: "E0105 - Hypotension / Circulatory Collapse", category: "Cardiovascular" },
  { value: "E0106", label: "E0106 - Hypertension", category: "Cardiovascular" },
  { value: "E0107", label: "E0107 - Myocardial Infarction / Ischemia", category: "Cardiovascular" },

  { value: "E0201", label: "E0201 - Dyspnea / Respiratory Distress", category: "Respiratory" },
  { value: "E0202", label: "E0202 - Hypoxia / Desaturation", category: "Respiratory" },
  { value: "E0203", label: "E0203 - Respiratory Arrest / Apnea", category: "Respiratory" },
  { value: "E0204", label: "E0204 - Pneumothorax", category: "Respiratory" },

  { value: "E0301", label: "E0301 - Loss of Consciousness / Syncope", category: "Neurological" },
  { value: "E0302", label: "E0302 - Stroke / Transient Ischemic Attack (TIA)", category: "Neurological" },
  { value: "E0303", label: "E0303 - Seizure / Convulsion", category: "Neurological" },
  { value: "E0304", label: "E0304 - Paralysis / Paresis", category: "Neurological" },
  { value: "E0305", label: "E0305 - Severe Pain / Burning Sensation", category: "Neurological" },

  { value: "E0401", label: "E0401 - Hemorrhage / Excessive Bleeding", category: "Hematological & Vascular" },
  { value: "E0402", label: "E0402 - Thrombosis / Thromboembolism", category: "Hematological & Vascular" },
  { value: "E0403", label: "E0403 - Air Embolism / Gas Embolus", category: "Hematological & Vascular" },
  { value: "E0404", label: "E0404 - Hematoma / Blood Extravasation", category: "Hematological & Vascular" },

  { value: "E0501", label: "E0501 - Burn / Thermal Tissue Injury", category: "Tissue & Skin" },
  { value: "E0502", label: "E0502 - Tissue Necrosis / Gangrene", category: "Tissue & Skin" },
  { value: "E0503", label: "E0503 - Perforation / Laceration of Vessel or Organ", category: "Tissue & Skin" },
  { value: "E0504", label: "E0504 - Skin Irritation / Rash / Erythema", category: "Tissue & Skin" },
  { value: "E0505", label: "E0505 - Foreign Body Granuloma / Reaction", category: "Tissue & Skin" },

  { value: "E0601", label: "E0601 - Sepsis / Septic Shock", category: "Infection & Immunity" },
  { value: "E0602", label: "E0602 - Localized Surgical Site Infection", category: "Infection & Immunity" },
  { value: "E0603", label: "E0603 - Fever / Pyrexia / Chills", category: "Infection & Immunity" },
  { value: "E0604", label: "E0604 - Anaphylaxis / Allergic Reaction", category: "Infection & Immunity" },

  { value: "E0701", label: "E0701 - Bone Fracture", category: "Musculoskeletal" },
  { value: "E0702", label: "E0702 - Joint Dislocation / Instability", category: "Musculoskeletal" },

  { value: "E1001", label: "E1001 - No Clinical Signs or Symptoms (Asymptomatic)", category: "General" },
];

// -----------------------------------------------------------------------------
// IMDRF Annex F: Health Effects - Health Impact / Patient Outcome
// -----------------------------------------------------------------------------
export const IMDRF_ANNEX_F_CODES: OptionItem[] = [
  { value: "F0101", label: "F0101 - Patient Death", category: "Fatal" },
  { value: "F0201", label: "F0201 - Life-Threatening Illness or Injury", category: "Critical" },
  { value: "F0301", label: "F0301 - Permanent Impairment of Body Function", category: "Permanent Disability" },
  { value: "F0302", label: "F0302 - Permanent Damage to Body Structure", category: "Permanent Disability" },
  { value: "F0401", label: "F0401 - Initial Hospitalization Required", category: "Hospitalization" },
  { value: "F0402", label: "F0402 - Prolongation of Existing Hospitalization", category: "Hospitalization" },
  { value: "F0501", label: "F0501 - Surgical Procedure / Revision Required", category: "Intervention" },
  { value: "F0502", label: "F0502 - Device Explant / Removal Required", category: "Intervention" },
  { value: "F0503", label: "F0503 - Medical Intervention / Drug Administration", category: "Intervention" },
  { value: "F0504", label: "F0504 - Cardiopulmonary Resuscitation (CPR) / Defibrillation", category: "Intervention" },
  { value: "F0601", label: "F0601 - Minor / Reversible Injury", category: "Minor" },
  { value: "F0602", label: "F0602 - Temporary Discomfort / Minor Pain", category: "Minor" },
  { value: "F0701", label: "F0701 - Transfer to Intensive Care Unit (ICU)", category: "Hospitalization" },
  { value: "F0801", label: "F0801 - No Adverse Health Impact / Near Miss", category: "No Harm" },
];
