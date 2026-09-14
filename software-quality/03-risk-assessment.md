# 03. Software Risk Assessment & Assurance Strategy

**Document ID:** SQ-DOC-003  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Regulatory Framework:** FDA Computer Software Assurance (CSA) Draft Guidance, ISO 14971 (Risk Management principles applied to QMS software), ISO 13485:2016 Clause 4.1.6  

---

## 1. Risk-Based Validation Philosophy

In accordance with modern **FDA Computer Software Assurance (CSA)** principles and **ISO 13485:2016**, validation effort is proportional to software risk. Rather than executing burdensome, low-value documentation on every button or cosmetic element, Arlo focuses rigorous automated and manual testing on **direct regulatory, data integrity, and patient safety impact**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HIGH RISK (Critical Impact)                                             │
│ Direct impact on medical device regulatory records & patient safety:    │
│ • 21 CFR Part 11 Electronic Signatures & Re-authentication               │
│ • Immutable, Append-Only Audit Trail (No Deletes / Edits)               │
│ • Closed Record Tamper Protection                                       │
│ • CAPA Escalation & Closure Gates                                       │
│ • Multi-Tenant Data Isolation & RBAC Role Enforcement                   │
│ • Record Concurrency Control (Conflict Prevention)                     │
│ ──► ASSURANCE RIGOR: Automated Integration Tests + Negative Tests +     │
│     Security Boundary Assertions + Traceability Matrix Coverage         │
├─────────────────────────────────────────────────────────────────────────┤
│ MEDIUM RISK (Major Impact)                                              │
│ Core workflow operation and data processing:                            │
│ • Complaint Intake Validation & Form Boundaries                         │
│ • Investigation Checklist & Task Management                             │
│ • Vigilance Decision Tree & EU MDR MIR Generation                      │
│ • Customer Response Summaries & Device Sample Tracking                  │
│ ──► ASSURANCE RIGOR: Automated Functional Vitest Suites +               │
│     Boundary Value Testing                                              │
├─────────────────────────────────────────────────────────────────────────┤
│ LOW RISK (Minor Impact)                                                 │
│ Cosmetic and presentation layer:                                        │
│ • Layout responsiveness, Sidebar toggles, Dark/Light mode theme         │
│ • Tooltip text, Button styles, Table column widths                      │
│ ──► ASSURANCE RIGOR: Unscripted / Exploratory Testing in Dev & Review   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Risk Assessment Matrix & Mitigation Table

| Risk ID | Feature / Component | Risk Level | Potential Failure Mode | Quality / Regulatory Impact | Built-in Technical Mitigation | Verification Protocol |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **RSK-001** | **Electronic Signature (`lib/actions/esignature.ts`)** | **HIGH** | Signature accepted without valid re-authentication or payload hash tampering. | Violation of 21 CFR Part 11; unauthenticated regulatory decisions. | Mandatory Clerk password re-verification, explicit intent capture, SHA-256 state snapshot. | `tests/e-signature-recording.test.ts` (Positive & negative re-auth verification) |
| **RSK-002** | **Audit Trail Integrity (`lib/audit.ts`)** | **HIGH** | Edits or deletions occur without audit entry; audit records modified or purged. | Loss of regulatory inspection defense (21 CFR Part 11.10(e)). | Append-only database constraints; Prisma soft-delete only; zero delete endpoints. | `tests/audit-history-view.test.ts`<br>`tests/no-hard-deletes.test.ts` |
| **RSK-003** | **Closed Record Immutability (`assertComplaintMutable`)** | **HIGH** | Post-closure edits alter historical complaint evidence. | Regulatory citation for tampering with closed complaint files. | Server-side guard asserts status $\neq$ `CLOSED` on all mutation actions. | `tests/closed-complaint-modification-protection.test.ts` |
| **RSK-004** | **Multi-Tenant Isolation (`requireOrgAuth`)** | **HIGH** | User from Org A accesses or alters complaints belonging to Org B. | Severe data confidentiality breach; cross-contamination of QMS. | Global Prisma query filtering strictly enforced via `requireOrgAuth(orgId)`. | `tests/complaint-multi-tenant-isolation.test.ts` |
| **RSK-005** | **RBAC Authorization (`lib/auth-guard.ts`)** | **HIGH** | Unauthorized user closes complaint or approves CAPA without permission. | Segregation of duties violation; unauthorized quality releases. | Granular Clerk role & permission guards on all mutation actions. | `tests/new-roles-rbac.test.ts` |
| **RSK-006** | **Record Concurrency Lock (`lib/record-lock.ts`)** | **HIGH** | Concurrent users overwrite each other's investigation notes. | Lost regulatory data and contradictory findings. | TTL-based heartbeat lock leasing with preemption conflict detection. | `tests/investigation-concurrency-lock.test.ts`<br>`tests/entity-concurrency-lock.test.ts` |
| **RSK-007** | **Vigilance Decision & MIR Gate** | **HIGH** | Reportable adverse event closed without regulatory submission. | Regulatory enforcement for failure to file mandatory MDR/MIR. | Complaint closure blocked until all reportable MIR forms are marked finalized. | `tests/mir-subfolder-lifecycle-and-closure.test.ts` |
| **RSK-008** | **Complaint Creation & ID Monotonicity** | **MEDIUM** | Duplicate ID generated; incomplete sub-record initialization. | Orphaned investigation or vigilance records; numbering confusion. | Atomic database transaction + deterministic counter per tenant and year. | `tests/complaint-creation.test.ts`<br>`tests/unique-identifier-generation.test.ts` |
| **RSK-009** | **Customer Communications & Reports** | **MEDIUM** | Internal sensitive investigation notes leaked into customer letter. | Customer confusion or inappropriate disclosure. | Dedicated customer summary generator with explicit field whitelisting. | `tests/customer-report-generation.test.ts` |
| **RSK-010** | **UI Layout, Themes, & Tooltips** | **LOW** | Theme toggle glitch or tooltip truncation. | Minor cosmetic annoyance; zero impact on regulatory compliance. | Visual review during PR code review; no heavy validation scripts needed. | Exploratory developer review |
