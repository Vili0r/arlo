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

// -----------------------------------------------------------------------------
// IMDRF Annex B: Cause Investigation - Type of Investigation
// -----------------------------------------------------------------------------
export const IMDRF_ANNEX_B_CATEGORIES: OptionItem[] = [
  { value: "B01", label: "B01 - Testing of Actual/Suspected Device" },
  { value: "B02", label: "B02 - Testing of Device from Same Lot/Batch Retained by Manufacturer" },
  { value: "B03", label: "B03 - Testing of Device from Same Lot/Batch Returned from User" },
  { value: "B04", label: "B04 - Testing of Device from Other Lot/Batch Retained by Manufacturer" },
  { value: "B05", label: "B05 - Testing of Device from Other Lot/Batch Returned from User" },
  { value: "B06", label: "B06 - Testing of Model Variant" },
  { value: "B07", label: "B07 - Testing of Raw/Starting Materials" },
  { value: "B09", label: "B09 - Testing of Patient Sample or Reference Material Using Reference Method" },
  { value: "B10", label: "B10 - Testing of Patient Sample or Reference Material Using Competitor's Device" },
  { value: "B11", label: "B11 - Historical Data Analysis" },
  { value: "B14", label: "B14 - Analysis of Production Records" },
  { value: "B15", label: "B15 - Analysis of Information Provided by User/Third Party" },
  { value: "B16", label: "B16 - Device not Manufactured by Reporting Manufacturer" },
  { value: "B17", label: "B17 - Device not Returned" },
  { value: "B18", label: "B18 - Device Discarded" },
  { value: "B19", label: "B19 - Incomplete Device Returned" },
  { value: "B20", label: "B20 - Device not Accessible for Testing" },
  { value: "B21", label: "B21 - Type of Investigation not Yet Determined" },
  { value: "B22", label: "B22 - Insufficient Information Available" },
  { value: "B23", label: "B23 - Specimen Requested But not Provided" },
  { value: "B24", label: "B24 - Event History Log Review" },
  { value: "B25", label: "B25 - Particulate Testing" },
  { value: "B26", label: "B26 - Testing of Patient Sample Using Manufacturer's Device" },
  { value: "B27", label: "B27 - Testing of Reference Material Using Manufacturer's Device" },
  { value: "B28", label: "B28 - Device Lost in Transit" },
  { value: "B29", label: "B29 - Device Data not Available for Required Analysis" },
  { value: "B30", label: "B30 - Analysis of Images" },
  { value: "B31", label: "B31 - Labeling Review" },
  { value: "B32", label: "B32 - Analysis of Service/Maintenance Records" },
  { value: "B33", label: "B33 - Incorrect Manufacturer Attribution" },
  { value: "B34", label: "B34 - Software Code Analysis" },
];

export const IMDRF_ANNEX_B_SUBCAT_MAP: Record<string, OptionItem[]> = {};

export const IMDRF_ANNEX_C_CATEGORIES: OptionItem[] = [
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
};

export const IMDRF_ANNEX_D_CATEGORIES: OptionItem[] = [
  { value: "D01", label: "D01 - Cause Traced to Device Design" },
  { value: "D02", label: "D02 - Cause Traced to Component Failure" },
  { value: "D03", label: "D03 - Cause Traced to Manufacturing" },
  { value: "D04", label: "D04 - Cause Traced to Transport/Storage" },
  { value: "D05", label: "D05 - Cause Traced to Infrastructure" },
  { value: "D06", label: "D06 - Cause Traced to Environment" },
  { value: "D07", label: "D07 - Cause Traced to Maintenance" },
  { value: "D08", label: "D08 - Cause Traced to Training" },
  { value: "D09", label: "D09 - Cause Traced to Labeling" },
  { value: "D10", label: "D10 - Cause Traced to Non-Device Related Factors" },
  { value: "D11", label: "D11 - Cause Traced to User" },
  { value: "D12", label: "D12 - Known Inherent Risk of Device" },
  { value: "D13", label: "D13 - Falsified Device" },
  { value: "D16", label: "D16 - Conclusion Not Yet Available" },
  { value: "D17", label: "D17 - Appropriate Term/Code Not Available" },
  { value: "D18", label: "D18 - Cause Traced to Software Coding" },
  { value: "D19", label: "D19 - Cause Traced to AI Training or Validation Process" },
  { value: "D20", label: "D20 - Cause Traced to Another Device" },
  { value: "D21", label: "D21 - Cause Traced to Health Disparities" }
];

export const IMDRF_ANNEX_D_SUBCAT_MAP: Record<string, OptionItem[]> = {
  D01: [
    { value: "D0101", label: "D0101 - Design Inadequate for Purpose" },
    { value: "D0102", label: "D0102 - Human Factors Engineering - Device Difficult to Operate" },
    { value: "D0103", label: "D0103 - Human Factors Engineering - Device Difficult to Assemble" },
    { value: "D0104", label: "D0104 - Human Factors Engineering - Device Difficult to Reprocess" },
    { value: "D0105", label: "D0105 - Missing or Inadequate Safety Measures" },
    { value: "D0106", label: "D0106 - Inadequate Design Validation" },
    { value: "D0107", label: "D0107 - Cybersecurity Deficiency" },
    { value: "D0108", label: "D0108 - Software Design Deficiency" }
  ],
  D02: [
    { value: "D0201", label: "D0201 - Component Failure" },
    { value: "D0202", label: "D0202 - Component Specification Problem" }
  ],
  D03: [
    { value: "D0301", label: "D0301 - Manufacturing Process Problem" },
    { value: "D0302", label: "D0302 - Quality Control Deficiency" },
    { value: "D0303", label: "D0303 - Manufacturing Specification Problem" }
  ],
  D04: [
    { value: "D0401", label: "D0401 - Transport Problem" },
    { value: "D0402", label: "D0402 - Storage Problem" }
  ],
  D05: [
    { value: "D0501", label: "D0501 - Infrastructure Problem" }
  ],
  D06: [
    { value: "D0601", label: "D0601 - Environmental Condition Problem" }
  ],
  D07: [
    { value: "D0701", label: "D0701 - Maintenance Problem" }
  ],
  D08: [
    { value: "D0801", label: "D0801 - Inadequate Training" }
  ],
  D09: [
    { value: "D0901", label: "D0901 - Inadequate Labeling" },
    { value: "D0902", label: "D0902 - Incorrect Labeling" }
  ],
  D10: [
    { value: "D1001", label: "D1001 - Patient Condition" },
    { value: "D1002", label: "D1002 - Procedure" },
    { value: "D1003", label: "D1003 - Adverse Event Related to Commutability" }
  ],
  D11: [
    { value: "D1101", label: "D1101 - Failure to Follow Instructions" },
    { value: "D1102", label: "D1102 - Unintended Use Error Caused or Contributed to Event" },
    { value: "D1103", label: "D1103 - Intentional Off-Label, Unapproved or Contraindicated Use" },
    { value: "D1104", label: "D1104 - Shelf Life/Expiration Date Exceeded" },
    { value: "D1105", label: "D1105 - Device Life Exceeded" },
    { value: "D1106", label: "D1106 - Reuse of Single Use Device" },
    { value: "D1107", label: "D1107 - Intentional Damage or Intentional Misuse" },
    { value: "D1108", label: "D1108 - Reasonably Foreseeable Misuse" }
  ]
};

export const IMDRF_ANNEX_G_CATEGORIES: OptionItem[] = [
  { value: "G01", label: "G01 - Biological and Chemical" },
  { value: "G02", label: "G02 - Electrical and Magnetic" },
  { value: "G03", label: "G03 - Measurement" },
  { value: "G04", label: "G04 - Mechanical" },
  { value: "G05", label: "G05 - Optical" },
  { value: "G06", label: "G06 - Safety" },
  { value: "G07", label: "G07 - Other Terms/Codes Related to Components" }
];

export const IMDRF_ANNEX_G_SUBCAT_MAP: Record<string, OptionItem[]> = {
  G01: [
    { value: "G01001", label: "G01001 - Absorber" },
    { value: "G01002", label: "G01002 - Cautery Tip" },
    { value: "G01003", label: "G01003 - Device Ingredient or Reagent" },
    { value: "G01004", label: "G01004 - Gas Scavenging" },
    { value: "G01005", label: "G01005 - Monomer Liquid" },
    { value: "G01006", label: "G01006 - Test Strip" },
    { value: "G01007", label: "G01007 - Polymer Powder" }
  ],
  G02: [
    { value: "G02001", label: "G02001 - Antenna" },
    { value: "G02002", label: "G02002 - Battery" },
    { value: "G02003", label: "G02003 - Battery Charger" },
    { value: "G02004", label: "G02004 - Cable, Electrical" },
    { value: "G0200401", label: "G0200401 - Cable Grip/Tie" },
    { value: "G0200402", label: "G0200402 - Cable Sleeve" },
    { value: "G02005", label: "G02005 - Circuit Board" },
    { value: "G02006", label: "G02006 - Circuit Breaker" },
    { value: "G02007", label: "G02007 - Computer Hardware" },
    { value: "G0200701", label: "G0200701 - Computer Processor" },
    { value: "G0200702", label: "G0200702 - Memory/Storage" },
    { value: "G0200703", label: "G0200703 - Network Interface" },
    { value: "G02008", label: "G02008 - Computer Software" },
    { value: "G0200801", label: "G0200801 - Driver" },
    { value: "G0200802", label: "G0200802 - Software Interface" },
    { value: "G0200803", label: "G0200803 - User Interface" },
    { value: "G0200804", label: "G0200804 - Firmware" },
    { value: "G02009", label: "G02009 - Cooling Module" },
    { value: "G02010", label: "G02010 - Device Programmer" },
    { value: "G02011", label: "G02011 - Device Reader" },
    { value: "G02012", label: "G02012 - Discrete Electrical Component" },
    { value: "G0201201", label: "G0201201 - Capacitor" },
    { value: "G0201202", label: "G0201202 - Fuse" },
    { value: "G0201203", label: "G0201203 - Inductor" },
    { value: "G0201204", label: "G0201204 - Resistor" },
    { value: "G0201205", label: "G0201205 - Solenoid" },
    { value: "G0201206", label: "G0201206 - Transducer" },
    { value: "G0201207", label: "G0201207 - Semiconductor" },
    { value: "G0201208", label: "G0201208 - Feedthrough Capacitor" },
    { value: "G02013", label: "G02013 - IC (Integrated Circuit) Chip" },
    { value: "G02014", label: "G02014 - Display" },
    { value: "G0201401", label: "G0201401 - Indicator" },
    { value: "G0201402", label: "G0201402 - Screen" },
    { value: "G02015", label: "G02015 - Electrical Lead/Wire" },
    { value: "G0201501", label: "G0201501 - Electrode" },
    { value: "G0201502", label: "G0201502 - Ground Strap/Wire" },
    { value: "G0201503", label: "G0201503 - Wiring Harness" },
    { value: "G02016", label: "G02016 - Electrical Mixer" },
    { value: "G02017", label: "G02017 - Electrical Port" },
    { value: "G02018", label: "G02018 - Emitter" },
    { value: "G02019", label: "G02019 - Headphone/Headset" },
    { value: "G02020", label: "G02020 - Heater" },
    { value: "G02021", label: "G02021 - Hub" },
    { value: "G02022", label: "G02022 - Inverter" },
    { value: "G02023", label: "G02023 - Magnet" },
    { value: "G02024", label: "G02024 - Oscillator" },
    { value: "G02025", label: "G02025 - Patient Lead" },
    { value: "G0202501", label: "G0202501 - Lead Conductor" },
    { value: "G0202502", label: "G0202502 - Patient Electrode" },
    { value: "G02026", label: "G02026 - Power Cord" },
    { value: "G02027", label: "G02027 - Power Supply" },
    { value: "G02028", label: "G02028 - Pressure Transducer Probe" },
    { value: "G02029", label: "G02029 - Printer" },
    { value: "G02030", label: "G02030 - Receiver" },
    { value: "G02031", label: "G02031 - Receiver Stimulator Unit" },
    { value: "G02032", label: "G02032 - Scanner" },
    { value: "G02033", label: "G02033 - Speaker/Sounder" },
    { value: "G02034", label: "G02034 - Switch/Relay" },
    { value: "G0203401", label: "G0203401 - Power Switch" },
    { value: "G0203402", label: "G0203402 - Relay" },
    { value: "G02035", label: "G02035 - Telemetry" },
    { value: "G02036", label: "G02036 - Temperature Compensator" },
    { value: "G02037", label: "G02037 - Thermostat" },
    { value: "G02038", label: "G02038 - Transformer" },
    { value: "G02039", label: "G02039 - Transmitter" },
    { value: "G02040", label: "G02040 - User Input Device" },
    { value: "G0204001", label: "G0204001 - Joystick" },
    { value: "G0204002", label: "G0204002 - Keyboard/Keypad" },
    { value: "G0204003", label: "G0204003 - Microphone" },
    { value: "G0204004", label: "G0204004 - Touchscreen" },
    { value: "G02041", label: "G02041 - Solder Joint" }
  ],
  G03: [
    { value: "G03001", label: "G03001 - Analyzer" },
    { value: "G0300101", label: "G0300101 - Oxygen Analyzer" },
    { value: "G03002", label: "G03002 - Aperture" },
    { value: "G03003", label: "G03003 - Calibrator" },
    { value: "G03004", label: "G03004 - Clock" },
    { value: "G03005", label: "G03005 - Counter" },
    { value: "G03006", label: "G03006 - Cuvette" },
    { value: "G03007", label: "G03007 - Gauges/Meters" },
    { value: "G0300701", label: "G0300701 - Flowmeter" },
    { value: "G0300702", label: "G0300702 - Manometer" },
    { value: "G0300703", label: "G0300703 - Thermometer" },
    { value: "G03008", label: "G03008 - Marker" },
    { value: "G03009", label: "G03009 - Pipette" },
    { value: "G03010", label: "G03010 - Pointer" },
    { value: "G03011", label: "G03011 - Scale" },
    { value: "G03012", label: "G03012 - Sensor" },
    { value: "G0301201", label: "G0301201 - Bubble Sensor" },
    { value: "G0301202", label: "G0301202 - O2 Sensor" },
    { value: "G0301203", label: "G0301203 - Photodetector" },
    { value: "G0301204", label: "G0301204 - Pressure Sensor" },
    { value: "G0301205", label: "G0301205 - Sensor Probe" },
    { value: "G0301206", label: "G0301206 - Temperature Sensor" },
    { value: "G03013", label: "G03013 - Timer" },
    { value: "G03014", label: "G03014 - Control Material" },
    { value: "G03015", label: "G03015 - Swab" },
    { value: "G03016", label: "G03016 - Tray" }
  ],
  G04: [
    { value: "G04001", label: "G04001 - Access Port" },
    { value: "G04002", label: "G04002 - Actuator" },
    { value: "G04003", label: "G04003 - Adapter (Adaptor)" },
    { value: "G04004", label: "G04004 - Air Eliminator" },
    { value: "G04005", label: "G04005 - Anchor" },
    { value: "G0400501", label: "G0400501 - Fixation Tines" },
    { value: "G04006", label: "G04006 - Applicator" },
    { value: "G04007", label: "G04007 - Automatic Injection System" },
    { value: "G04008", label: "G04008 - Bag" },
    { value: "G04009", label: "G04009 - Ball" },
    { value: "G04010", label: "G04010 - Balloon" },
    { value: "G04011", label: "G04011 - Bearings" },
    { value: "G04012", label: "G04012 - Bellows" },
    { value: "G04013", label: "G04013 - Belt" },
    { value: "G04014", label: "G04014 - Bottle" },
    { value: "G04015", label: "G04015 - Breathing Circuit" },
    { value: "G04016", label: "G04016 - Brush" },
    { value: "G04017", label: "G04017 - Bushing" },
    { value: "G04018", label: "G04018 - Cable, Mechanical/Structural" },
    { value: "G04019", label: "G04019 - Cannula" },
    { value: "G0401901", label: "G0401901 - Cannula Hub" },
    { value: "G04020", label: "G04020 - Cap" },
    { value: "G04021", label: "G04021 - Carrier" },
    { value: "G04022", label: "G04022 - Caster" },
    { value: "G04023", label: "G04023 - Catheter" },
    { value: "G0402301", label: "G0402301 - Catheter Hub" },
    { value: "G04024", label: "G04024 - Cell" },
    { value: "G04025", label: "G04025 - Chain" },
    { value: "G04026", label: "G04026 - Chamber" },
    { value: "G04027", label: "G04027 - Chassis/Frame" },
    { value: "G04028", label: "G04028 - Clutch" },
    { value: "G04029", label: "G04029 - Coating Material" },
    { value: "G04030", label: "G04030 - Coil" },
    { value: "G0403001", label: "G0403001 - Fixation Helix" },
    { value: "G04031", label: "G04031 - Collimator" },
    { value: "G04032", label: "G04032 - Concentrator" },
    { value: "G04033", label: "G04033 - Cone" },
    { value: "G04034", label: "G04034 - Connector/Coupler" },
    { value: "G0403401", label: "G0403401 - Connector Pin" },
    { value: "G0403402", label: "G0403402 - Male" },
    { value: "G0403403", label: "G0403403 - Female" },
    { value: "G04035", label: "G04035 - Controller" },
    { value: "G04036", label: "G04036 - Compressor" },
    { value: "G04037", label: "G04037 - Cover" },
    { value: "G04038", label: "G04038 - Cuff" },
    { value: "G04039", label: "G04039 - Cup" },
    { value: "G04040", label: "G04040 - Cusp/Leaflet" },
    { value: "G04041", label: "G04041 - Cutter/Blade" },
    { value: "G04042", label: "G04042 - Cylinder" },
    { value: "G04043", label: "G04043 - Device Collapser" },
    { value: "G04044", label: "G04044 - Device Deployer" },
    { value: "G04045", label: "G04045 - Diaphragm" },
    { value: "G04046", label: "G04046 - Dome" },
    { value: "G04047", label: "G04047 - Ejector" },
    { value: "G04048", label: "G04048 - Equipment Pole" },
    { value: "G04049", label: "G04049 - Extender" },
    { value: "G04050", label: "G04050 - Fabric" },
    { value: "G04051", label: "G04051 - Fan/Blower" },
    { value: "G04052", label: "G04052 - Fastener" },
    { value: "G0405201", label: "G0405201 - Adhesive" },
    { value: "G0405202", label: "G0405202 - Bolt" },
    { value: "G0405203", label: "G0405203 - Clamp" },
    { value: "G0405204", label: "G0405204 - Clip" },
    { value: "G0405205", label: "G0405205 - Fixation Wire" },
    { value: "G0405206", label: "G0405206 - Latch" },
    { value: "G0405207", label: "G0405207 - Nail" },
    { value: "G0405208", label: "G0405208 - Nut" },
    { value: "G0405209", label: "G0405209 - Pin" },
    { value: "G0405210", label: "G0405210 - Prong" },
    { value: "G0405211", label: "G0405211 - Retainer" },
    { value: "G0405212", label: "G0405212 - Rivet" },
    { value: "G0405213", label: "G0405213 - Screw" },
    { value: "G0405214", label: "G0405214 - Staple" },
    { value: "G04065", label: "G04065 - Sewing Ring" },
    { value: "G04066", label: "G04066 - Heat Exchanger" },
    { value: "G04067", label: "G04067 - Hinge" },
    { value: "G04068", label: "G04068 - Holder" },
    { value: "G04069", label: "G04069 - Hose" },
    { value: "G04070", label: "G04070 - Housing" },
    { value: "G04071", label: "G04071 - Humidifier" },
    { value: "G04072", label: "G04072 - Hydraulic System" },
    { value: "G04073", label: "G04073 - Impeller" },
    { value: "G04074", label: "G04074 - Inserter" },
    { value: "G04075", label: "G04075 - Insulation" },
    { value: "G04076", label: "G04076 - Isolator" },
    { value: "G04077", label: "G04077 - Jaw" },
    { value: "G04078", label: "G04078 - Joint" },
    { value: "G04079", label: "G04079 - Knob" },
    { value: "G04080", label: "G04080 - Label" },
    { value: "G04082", label: "G04082 - Lever" },
    { value: "G0408201", label: "G0408201 - Foot Pedal" },
    { value: "G04083", label: "G04083 - Liner" },
    { value: "G04084", label: "G04084 - Magazine/Cassette" },
    { value: "G04085", label: "G04085 - Manifold" },
    { value: "G04086", label: "G04086 - Mask" },
    { value: "G04087", label: "G04087 - Mechanical Mixer" },
    { value: "G04088", label: "G04088 - Membrane" },
    { value: "G04089", label: "G04089 - Mesh" },
    { value: "G04090", label: "G04090 - Motor(s)" },
    { value: "G04091", label: "G04091 - Mount" },
    { value: "G04092", label: "G04092 - Needle" },
    { value: "G04093", label: "G04093 - Nozzle" },
    { value: "G04094", label: "G04094 - Packaging" },
    { value: "G04095", label: "G04095 - Pad" },
    { value: "G04096", label: "G04096 - Panel" },
    { value: "G04097", label: "G04097 - Plate" },
    { value: "G04098", label: "G04098 - Plug" },
    { value: "G04099", label: "G04099 - Plunger" },
    { value: "G04100", label: "G04100 - Post" },
    { value: "G04101", label: "G04101 - Potting" },
    { value: "G04102", label: "G04102 - Probe" },
    { value: "G04103", label: "G04103 - Processor" },
    { value: "G04104", label: "G04104 - Pulley" },
    { value: "G04105", label: "G04105 - Pump" },
    { value: "G04106", label: "G04106 - Pusher" },
    { value: "G04107", label: "G04107 - Rachet" },
    { value: "G04108", label: "G04108 - Rail" },
    { value: "G0410801", label: "G0410801 - Side Rail" },
    { value: "G04109", label: "G04109 - Regulator" },
    { value: "G04110", label: "G04110 - Reservoir" },
    { value: "G04111", label: "G04111 - Ring" },
    { value: "G04112", label: "G04112 - Rod/Shaft" },
    { value: "G04113", label: "G04113 - Seal" },
    { value: "G04114", label: "G04114 - Shock Absorber" },
    { value: "G04115", label: "G04115 - Sleeve" },
    { value: "G04116", label: "G04116 - Slide" },
    { value: "G04117", label: "G04117 - Socket" },
    { value: "G04118", label: "G04118 - Spacer" },
    { value: "G04119", label: "G04119 - Spring" },
    { value: "G04120", label: "G04120 - Stand" },
    { value: "G04121", label: "G04121 - Steering Wire" },
    { value: "G04122", label: "G04122 - Stent" },
    { value: "G04123", label: "G04123 - Stopcock" },
    { value: "G04124", label: "G04124 - Stopper" },
    { value: "G04125", label: "G04125 - Strain Relief" },
    { value: "G04126", label: "G04126 - Stylet" },
    { value: "G04127", label: "G04127 - Syringe" },
    { value: "G04128", label: "G04128 - Table" },
    { value: "G04129", label: "G04129 - Tip" },
    { value: "G04130", label: "G04130 - Tool" },
    { value: "G04131", label: "G04131 - Translational Motion Component" },
    { value: "G04132", label: "G04132 - Trap" },
    { value: "G04133", label: "G04133 - Trocar" },
    { value: "G04134", label: "G04134 - Tube" },
    { value: "G0413401", label: "G0413401 - Capillary Tube" },
    { value: "G04135", label: "G04135 - Valve(s)" },
    { value: "G0413501", label: "G0413501 - Control Valve" },
    { value: "G0413502", label: "G0413502 - Luer Valve" },
    { value: "G0413503", label: "G0413503 - One-Way Valve" },
    { value: "G0413504", label: "G0413504 - Control Clamp" },
    { value: "G04136", label: "G04136 - Vaporiser" },
    { value: "G04137", label: "G04137 - Vibrator" },
    { value: "G04138", label: "G04138 - Washer" },
    { value: "G04139", label: "G04139 - Weld" },
    { value: "G04140", label: "G04140 - Wheel" },
    { value: "G04141", label: "G04141 - Window" },
    { value: "G04142", label: "G04142 - Shutter" },
    { value: "G04143", label: "G04143 - Spike" }
  ],
  G05: [
    { value: "G05001", label: "G05001 - Camera" },
    { value: "G05002", label: "G05002 - Film" },
    { value: "G05003", label: "G05003 - Imager" },
    { value: "G05004", label: "G05004 - Laser" },
    { value: "G05005", label: "G05005 - LED (Light Emitting Diode)" },
    { value: "G05006", label: "G05006 - Lenses" },
    { value: "G05007", label: "G05007 - Light Source" },
    { value: "G0500701", label: "G0500701 - Bulb" },
    { value: "G05008", label: "G05008 - Mirror" },
    { value: "G05009", label: "G05009 - Optical Fiber" }
  ],
  G06: [
    { value: "G06001", label: "G06001 - Alarm" },
    { value: "G0600101", label: "G0600101 - Alarm, Audible" },
    { value: "G0600102", label: "G0600102 - Alarm, Visual" },
    { value: "G06002", label: "G06002 - Emergency Button Or Switch" },
    { value: "G06003", label: "G06003 - Fail-Safe System" },
    { value: "G06004", label: "G06004 - Locking Mechanism" },
    { value: "G06005", label: "G06005 - Protector/Shield" },
    { value: "G06006", label: "G06006 - Safety Interlock" },
    { value: "G0600601", label: "G0600601 - Needle Stick Prevention Mechanism" },
    { value: "G06007", label: "G06007 - Safety Valve" }
  ],
  G07: [
    { value: "G07001", label: "G07001 - Part/Component/Sub-Assembly Term not Applicable" },
    { value: "G07002", label: "G07002 - Appropriate Component Term/Code not Available" },
    { value: "G07003", label: "G07003 - Insufficient Component Information" }
  ]
};

