/**
 * Global Medical Device Reportability Rulesets Registry
 *
 * Provides a unified registry of supported regulatory frameworks:
 * - EU MDR (European Union)
 * - US FDA (United States)
 * - Health Canada (Canada)
 * - TGA (Australia)
 * - NMPA (China)
 * - PMDA (Japan)
 *
 * Easily extensible to UK MHRA, ANVISA, COFEPRIS, ANMAT, INVIMA, ISP.
 */

import { JurisdictionCode, RulesetDefinition } from "../types";
import { EU_MDR_RULESET } from "./eu-mdr";
import { US_FDA_RULESET } from "./us-fda";
import { HEALTH_CANADA_RULESET } from "./ca-health-canada";
import { AU_TGA_RULESET } from "./au-tga";
import { CN_NMPA_RULESET } from "./cn-nmpa";
import { JP_PMDA_RULESET } from "./jp-pmda";

export const GLOBAL_RULESETS: Record<JurisdictionCode, RulesetDefinition> = {
  EU: EU_MDR_RULESET,
  US_FDA: US_FDA_RULESET,
  CA_HEALTH_CANADA: HEALTH_CANADA_RULESET,
  AU_TGA: AU_TGA_RULESET,
  CN_NMPA: CN_NMPA_RULESET,
  JP_PMDA: JP_PMDA_RULESET,

  // Future extensions with clear regulatory-review markers:
  GB_MHRA: {
    jurisdiction: "GB_MHRA",
    regulator: "Medicines and Healthcare products Regulatory Agency (MHRA)",
    regulatoryFramework: "Medical Devices Regulations 2002 (SI 2002 No 618 as amended)",
    version: "MHRA_2026_01",
    effectiveFrom: "2021-01-01",
    description: "United Kingdom MHRA vigilance reporting framework.",
    rules: [],
  },
  BR_ANVISA: {
    jurisdiction: "BR_ANVISA",
    regulator: "Agência Nacional de Vigilância Sanitária (ANVISA)",
    regulatoryFramework: "RDC No. 67/2009 & RDC No. 551/2021 Technovigilance",
    version: "ANVISA_2026_01",
    effectiveFrom: "2021-09-15",
    description: "Brazil ANVISA technovigilance and serious adverse event reporting framework.",
    rules: [],
  },
  MX_COFEPRIS: {
    jurisdiction: "MX_COFEPRIS",
    regulator: "COFEPRIS (Comisión Federal para la Protección contra Riesgos Sanitarios)",
    regulatoryFramework: "NOM-240-SSA1-2012 Technovigilance",
    version: "COFEPRIS_2026_01",
    effectiveFrom: "2013-01-02",
    description: "Mexico technovigilance regulations under NOM-240-SSA1-2012.",
    rules: [],
  },
  AR_ANMAT: {
    jurisdiction: "AR_ANMAT",
    regulator: "ANMAT (Administración Nacional de Medicamentos, Alimentos y Tecnología Médica)",
    regulatoryFramework: "Disposición ANMAT 3802/2004",
    version: "ANMAT_2026_01",
    effectiveFrom: "2004-06-25",
    description: "Argentina technovigilance reporting requirements.",
    rules: [],
  },
  CO_INVIMA: {
    jurisdiction: "CO_INVIMA",
    regulator: "INVIMA (Instituto Nacional de Vigilancia de Medicamentos y Alimentos)",
    regulatoryFramework: "Resolución 4816 de 2008 Technovigilance",
    version: "INVIMA_2026_01",
    effectiveFrom: "2008-11-27",
    description: "Colombia National Technovigilance Program.",
    rules: [],
  },
  CL_ISP: {
    jurisdiction: "CL_ISP",
    regulator: "ISP (Instituto de Salud Pública de Chile)",
    regulatoryFramework: "Decreto Supremo No. 825 & Technovigilance Guidelines",
    version: "ISP_2026_01",
    effectiveFrom: "2010-01-01",
    description: "Chile medical device vigilance reporting framework.",
    rules: [],
  },
};

export function getRuleset(jurisdiction: JurisdictionCode): RulesetDefinition | undefined {
  return GLOBAL_RULESETS[jurisdiction];
}

export function getAllRulesets(): RulesetDefinition[] {
  return Object.values(GLOBAL_RULESETS);
}
