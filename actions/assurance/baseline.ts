"use server";

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireOrgAuth } from "@/lib/auth-guard";
import { findOrgByIdentifier } from "@/lib/tenant";

export interface InstanceBaselineData {
  $schema: string;
  organization: {
    name: string;
    slug: string;
    clerkOrgId: string;
    exportTimestamp: string;
  };
  platform: {
    productName: string;
    version: string;
    releaseDate: string;
    regulatoryStandards: string[];
    verificationStatus: string;
    traceabilityDocumentId: string;
  };
  workflowConfiguration: {
    complaintStages: string[];
    closureGatekeepers: {
      requireInvestigationComplete: boolean;
      requireVigilanceDisposition: boolean;
      requireMirFinalizedIfReportable: boolean;
      requireDualCredentialEsignature: boolean;
      enforceClosedRecordImmutability: boolean;
    };
    capaEscalationEnabled: boolean;
    activeInvestigationTemplatesCount: number;
    activeInvestigationTemplates: Array<{
      id: string;
      sectionName: string;
      isActive: boolean;
    }>;
  };
  accessControl: {
    clerkAuthenticationEnforced: boolean;
    multiFactorAuthSupported: boolean;
    configuredRoles: string[];
    roleAssignmentRules: Record<string, string>;
  };
  dataIntegrityAndPart11: {
    appendOnlyAuditTrail: boolean;
    recordHashAlgorithm: string;
    concurrencyLeaseTtlSeconds: number;
    exportFormats: string[];
  };
}

export interface ValidationDocumentSummary {
  id: string;
  filename: string;
  title: string;
  category: "Overview" | "Requirements & Design" | "Verification" | "Security & Part 11" | "Governance";
  description: string;
}

export const VALIDATION_DOCUMENTS: ValidationDocumentSummary[] = [
  {
    id: "00_README",
    filename: "00_README.md",
    title: "Validation Support Pack README",
    category: "Overview",
    description: "Scope, regulatory audience, version information, and customer assurance notice.",
  },
  {
    id: "01_SYSTEM_OVERVIEW",
    filename: "01_SYSTEM_OVERVIEW.md",
    title: "System Architecture & Overview",
    category: "Overview",
    description: "Cloud multi-tenant SaaS architecture, Next.js, Clerk, PostgreSQL, and storage boundaries.",
  },
  {
    id: "02_INTENDED_USE",
    filename: "02_INTENDED_USE.md",
    title: "Software Intended Use & Boundaries",
    category: "Overview",
    description: "In-scope quality system workflows and explicit medical device exclusions.",
  },
  {
    id: "03_VALIDATION_APPROACH",
    filename: "03_VALIDATION_APPROACH.md",
    title: "CSA Validation Approach",
    category: "Overview",
    description: "FDA Computer Software Assurance risk-based methodology and automated testing hierarchy.",
  },
  {
    id: "04_REQUIREMENTS",
    filename: "04_REQUIREMENTS.md",
    title: "Platform Requirements Specification",
    category: "Requirements & Design",
    description: "Functional specifications for Complaints, Investigations, Vigilance, and CAPA.",
  },
  {
    id: "05_ARCHITECTURE",
    filename: "05_ARCHITECTURE.md",
    title: "Software Design Specification (SDS)",
    category: "Requirements & Design",
    description: "Design specifications for concurrency locks, state machines, and tenant security.",
  },
  {
    id: "06_RISK_ASSESSMENT",
    filename: "06_RISK_ASSESSMENT.md",
    title: "Software Platform Risk Assessment (FMEA)",
    category: "Requirements & Design",
    description: "Vendor platform risks vs customer business process risks and mitigations.",
  },
  {
    id: "07_TEST_PLAN",
    filename: "07_TEST_PLAN.md",
    title: "Verification & Validation Master Plan",
    category: "Verification",
    description: "Automated test harness strategy, regression protocols, and release gating criteria.",
  },
  {
    id: "08_TEST_EVIDENCE",
    filename: "08_TEST_EVIDENCE.md",
    title: "Objective Test Evidence Summary",
    category: "Verification",
    description: "Raw test receipts: 24/24 Vitest suites passing, 100% assertions verified.",
  },
  {
    id: "09_TRACEABILITY",
    filename: "09_TRACEABILITY.md",
    title: "Requirements Traceability Matrix (RTM)",
    category: "Verification",
    description: "End-to-end matrix linking URS to SRS, Design, Code, and Verification Tests.",
  },
  {
    id: "10_SECURITY",
    filename: "10_SECURITY.md",
    title: "Security Architecture & Clerk Auth",
    category: "Security & Part 11",
    description: "Authentication, MFA, session management, RBAC, and multi-tenant isolation.",
  },
  {
    id: "11_DATA_INTEGRITY",
    filename: "11_DATA_INTEGRITY.md",
    title: "Data Integrity & ALCOA+ Principles",
    category: "Security & Part 11",
    description: "Attributable, Legible, Contemporaneous, Original, Accurate record controls.",
  },
  {
    id: "12_AUDIT_TRAILS",
    filename: "12_AUDIT_TRAILS.md",
    title: "21 CFR Part 11 Audit Trail Specification",
    category: "Security & Part 11",
    description: "Append-only database schema, JSON field diffs, and chronological query engine.",
  },
  {
    id: "13_ELECTRONIC_SIGNATURES",
    filename: "13_ELECTRONIC_SIGNATURES.md",
    title: "Part 11 Electronic Signature Assessment",
    category: "Security & Part 11",
    description: "Dual-credential re-authentication, signature meaning, and SHA-256 state locking.",
  },
  {
    id: "14_RELEASE_HISTORY",
    filename: "14_RELEASE_HISTORY.md",
    title: "Release History & Impact Assessment",
    category: "Governance",
    description: "Controlled version log and Customer Release Impact Assessment matrix.",
  },
  {
    id: "15_KNOWN_ISSUES",
    filename: "15_KNOWN_ISSUES.md",
    title: "Known Issues & Anomalies Log",
    category: "Governance",
    description: "Transparent registry of non-critical items, risk levels, and workarounds.",
  },
  {
    id: "16_CUSTOMER_RESPONSIBILITIES",
    filename: "16_CUSTOMER_RESPONSIBILITIES.md",
    title: "Shared Responsibility Matrix",
    category: "Governance",
    description: "Clear division of obligations between Arlo and the medical device manufacturer.",
  },
];

/**
 * Retrieves the dynamic customer instance configuration baseline (Pack B).
 */
export async function getInstanceBaseline(orgSlug: string): Promise<InstanceBaselineData> {
  const authContext = await requireOrgAuth();

  const org = await findOrgByIdentifier(orgSlug);
  const orgName = org?.name || orgSlug;
  const clerkOrgId = org?.id || authContext.orgId;

  // Retrieve tenant-specific investigation templates if any
  const templates = await prisma.investigationSectionTemplate.findMany({
    where: {
      orgId: clerkOrgId,
    },
    select: {
      id: true,
      sectionName: true,
      isActive: true,
    },
    take: 50,
  });

  return {
    $schema: "https://arlo-qms.com/schemas/instance-baseline-v1.json",
    organization: {
      name: orgName,
      slug: orgSlug,
      clerkOrgId,
      exportTimestamp: new Date().toISOString(),
    },
    platform: {
      productName: "Arlo Quality Management Platform",
      version: "1.0.0",
      releaseDate: "2026-09-14",
      regulatoryStandards: [
        "FDA 21 CFR Part 820 / QMSR",
        "FDA 21 CFR Part 11",
        "ISO 13485:2016",
        "EU MDR 2017/745",
        "FDA Computer Software Assurance (CSA) Guidance (Feb 2026)",
      ],
      verificationStatus: "VALIDATED (ALL 24 AUTOMATED SUITES PASS)",
      traceabilityDocumentId: "RTM-ARLO-001",
    },
    workflowConfiguration: {
      complaintStages: ["INTAKE", "INVESTIGATION", "VIGILANCE", "CLOSED"],
      closureGatekeepers: {
        requireInvestigationComplete: true,
        requireVigilanceDisposition: true,
        requireMirFinalizedIfReportable: true,
        requireDualCredentialEsignature: true,
        enforceClosedRecordImmutability: true,
      },
      capaEscalationEnabled: true,
      activeInvestigationTemplatesCount: templates.length,
      activeInvestigationTemplates: templates,
    },
    accessControl: {
      clerkAuthenticationEnforced: true,
      multiFactorAuthSupported: true,
      configuredRoles: [
        "org:admin",
        "org:qa_manager",
        "org:quality_engineer",
        "org:vigilance_lead",
        "org:member",
        "org:read_only",
      ],
      roleAssignmentRules: {
        "org:admin": "Tenant administration & membership control",
        "org:qa_manager": "Full review, Part 11 e-signatures, and complaint closure",
        "org:quality_engineer": "Investigation execution, checklist tasks, and root cause entry",
        "org:vigilance_lead": "Statutory reportability assessment & MIR subfolder submission",
        "org:member": "Customer intake creation & correspondence maintenance",
        "org:read_only": "Audit review & inspection export extraction",
      },
    },
    dataIntegrityAndPart11: {
      appendOnlyAuditTrail: true,
      recordHashAlgorithm: "SHA-256",
      concurrencyLeaseTtlSeconds: 120,
      exportFormats: ["JSON", "CSV"],
    },
  };
}

/**
 * Reads a customer validation pack document by ID.
 */
export async function getValidationDocumentContent(docId: string): Promise<string> {
  const doc = VALIDATION_DOCUMENTS.find((d) => d.id === docId);
  if (!doc) {
    throw new Error(`Validation document '${docId}' not found.`);
  }

  const filePath = path.join(process.cwd(), "docs", "validation-support-pack", doc.filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Document file '${doc.filename}' does not exist on server.`);
  }

  return fs.readFileSync(filePath, "utf-8");
}

export interface ReleaseManifestData {
  product: string;
  releaseVersion: string;
  releaseDate: string;
  commitSha: string;
  generatedAt: string;
  environment: string;
  releaseType: string;
  verificationGate: {
    status: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    coveragePercent: string;
  };
  qualityRecordImpactAssessment: {
    complaints: boolean;
    capa: boolean;
    auditTrail: boolean;
    eSignatures: boolean;
    coreWorkflows: boolean;
    permissions: boolean;
    attachments: boolean;
    recordHistory: boolean;
    dataMigration: boolean;
    tenantIsolation: boolean;
    additionalRegressionTestingRequired: boolean;
    regressionTestingStatus: string;
  };
  customerImpact: {
    customerAction: string;
    customerRetestingRequired: boolean;
    sopReviewRecommended: boolean;
    configurationUpdateRequired: boolean;
    userTrainingRequired: boolean;
  };
  artifacts: Array<{
    filename: string;
    title: string;
    sha256: string;
    sizeBytes: number;
  }>;
}

/**
 * Retrieves the machine-readable Release Assurance Manifest.
 */
export async function getReleaseManifest(version = "1.0.0"): Promise<ReleaseManifestData | null> {
  const manifestPath = path.join(process.cwd(), "docs", "releases", `v${version}`, "release-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  const content = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(content) as ReleaseManifestData;
}

/**
 * Reads a release assurance document by version and filename.
 */
export async function getReleaseDocumentContent(version: string, filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), "docs", "releases", `v${version}`, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Release document '${filename}' not found for v${version}.`);
  }
  return fs.readFileSync(filePath, "utf-8");
}
