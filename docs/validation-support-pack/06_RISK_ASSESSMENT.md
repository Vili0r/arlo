# 06. Software Platform Risk Assessment (FMEA)

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-06  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Regulatory Standards:** ISO 14971:2019 Principles applied to Quality Software, FDA CSA Guidance (Feb 2026)  

---

## 1. Risk-Based Software Assurance Methodology

In accordance with FDA Computer Software Assurance (CSA) guidelines, software functions are evaluated based on their direct impact on device safety and quality management system compliance.

Arlo distinguishes between **Vendor Platform Risk** (software defects, data isolation, audit trail loss) and **Customer Business Process Risk** (customer clinical decisions, SOP adherence, training).

---

## 2. Platform Failure Mode and Effects Analysis (FMEA)

| Function | Potential Failure Mode | Severity | Likelihood | Risk Level | Assurance & Mitigation Controls | Verification Test |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **Authentication** | Unauthorized access / session hijacking | High | Low | **Medium** | Clerk token verification, session timeout, MFA support. | `tests/new-roles-rbac.test.ts` |
| **Tenant Isolation** | Cross-tenant data leakage (`orgId` bleed) | Critical | Very Low | **High** | Mandatory server-side query scoping in `requireOrgAuth`. | `tests/complaint-multi-tenant-isolation.test.ts` |
| **Audit Trail** | Unrecorded edit or lost field diff | Critical | Low | **High** | Atomic database transactions emitting audit events on all mutations. | `tests/audit-history-view.test.ts` |
| **Complaint Closure** | Closure without required investigation | High | Low | **High** | Sequential state machine lifecycle gates enforcing prerequisites. | `tests/complaint-stage-transition.test.ts` |
| **Closed Immutability** | Modification of closed quality record | Critical | Low | **High** | Database guard checking `CLOSED` status before mutation. | `tests/closed-complaint-modification-protection.test.ts` |
| **E-Signatures** | Fraudulent sign-off or forged credentials | Critical | Low | **High** | Dual-credential re-authentication + SHA-256 state snapshot. | `tests/e-signature-recording.test.ts` |
| **Concurrent Editing**| Overwrite collision between investigators | Medium | Medium | **Medium** | Active lease-locking engine with TTL and UI lock notifications. | `tests/investigation-concurrency-lock.test.ts` |
| **Vigilance Gates** | Closing reportable complaint without MIR | Critical | Low | **High** | Pre-closure validation blocking closure if MIR is pending. | `tests/mir-subfolder-lifecycle-and-closure.test.ts` |
| **Data Export** | Incomplete export for FDA inspection | High | Low | **Medium** | Standardized JSON/CSV export bundling complaints & audit trail. | `tests/exports-generation.test.ts` |

---

## 3. Residual Risk Evaluation

All identified high and medium platform risks have been mitigated by architectural design controls and verified by automated regression test suites. The residual platform risk for Arlo v1.0.0 is determined to be **ACCEPTABLE** for deployment in medical device quality management environments.
