# Requirements Traceability Matrix (RTM)

**System Name:** Arlo Complaint Management & Vigilance SaaS  
**Document ID:** RTM-ARLO-001  
**Generated At:** `2026-09-13T10:56:09.932Z`  
**Status:** ✅ VALIDATED (ALL TESTS PASS)  
**Standards:** FDA 21 CFR Part 820.198 / Part 11 | ISO 13485:2016 | IEC 62304 Class B

---

## 1. Traceability Summary

| Metric | Value |
| :--- | :--- |
| **Total User Requirements (URS)** | 13 |
| **Total Software Requirements (SRS)** | 23 |
| **Total Design Units (DESIGN)** | 19 |
| **Traceability Links Verified** | 24 |
| **Total Automated Tests Executed** | 271 |
| **Total Automated Tests Passing** | 271 |
| **Requirements Test Coverage** | **100%** |
| **Verification Gate** | **PASSED** |

---

## 2. Requirements Traceability Matrix

| URS ID | SRS / Functional Req | Design Specification | Code Implementation | Test ID | Verification Test Suite | Tests Run | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **URS-001**<br>_Complaint Intake & Identification_ | **SRS-001**<br>Complaint Creation & Atomic Subrecord Provisioning | **DESIGN-001**<br>Complaint Intake Engine | `lib/actions/complaints.ts` | **TEST-001** | [`tests/complaint-creation.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/complaint-creation.test.ts) | 3/3 | ✅ Pass |
| **URS-001**<br>_Complaint Intake & Identification_ | **SRS-002**<br>Complaint Input Validation (Mandatory Fields) | **DESIGN-002**<br>Validation Schema | `lib/actions/complaints.ts` | **TEST-001** | [`tests/complaint-creation.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/complaint-creation.test.ts) | 3/3 | ✅ Pass |
| **URS-001**<br>_Complaint Intake & Identification_ | **SRS-003**<br>Deterministic Unique Identifier Generation (CMP-YYYY-XXXX) | **DESIGN-003**<br>Numbering Service | `lib/utils.ts, lib/actions/complaints.ts` | **TEST-002** | [`tests/unique-identifier-generation.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/unique-identifier-generation.test.ts) | 9/9 | ✅ Pass |
| **URS-002**<br>_Complaint Lifecycle & Stage Progression_ | **SRS-004**<br>Complaint Stage Lifecycle Gates & State Transitions | **DESIGN-004**<br>Complaint State Machine | `lib/actions/complaints.ts` | **TEST-003** | [`tests/complaint-stage-transition.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/complaint-stage-transition.test.ts) | 12/12 | ✅ Pass |
| **URS-002**<br>_Complaint Lifecycle & Stage Progression_ | **SRS-020**<br>Complaint Record Updating & Field Maintenance | **DESIGN-004**<br>Complaint State Machine | `actions/complaint/updateComplaint.ts` | **TEST-019** | [`tests/complaint-update.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/complaint-update.test.ts) | 4/4 | ✅ Pass |
| **URS-003**<br>_Investigation Lifecycle & Template Support_ | **SRS-007**<br>Investigation Stage Progression & Task Tracking | **DESIGN-007**<br>Investigation Service | `lib/actions/investigations.ts` | **TEST-006** | [`tests/investigation-stage-transition.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/investigation-stage-transition.test.ts) | 29/29 | ✅ Pass |
| **URS-003**<br>_Investigation Lifecycle & Template Support_ | **SRS-008**<br>Investigation Concurrency Lock Management | **DESIGN-008**<br>Concurrency Lock Engine | `lib/record-lock.ts` | **TEST-007** | [`tests/investigation-concurrency-lock.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/investigation-concurrency-lock.test.ts) | 8/8 | ✅ Pass |
| **URS-004**<br>_Vigilance Decision Tree & Regulatory Incident Reporting (MIR)_ | **SRS-009**<br>Vigilance Decision Tree & Reportability Transitions | **DESIGN-009**<br>Vigilance Decision Service | `lib/actions/vigilance.ts` | **TEST-008** | [`tests/mir-stage-transition.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/mir-stage-transition.test.ts) | 23/23 | ✅ Pass |
| **URS-004**<br>_Vigilance Decision Tree & Regulatory Incident Reporting (MIR)_ | **SRS-010**<br>MIR Subfolder Lifecycle & Closure Validation | **DESIGN-010**<br>MIR Lifecycle Controller | `lib/actions/mir.ts` | **TEST-009** | [`tests/mir-subfolder-lifecycle-and-closure.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/mir-subfolder-lifecycle-and-closure.test.ts) | 15/15 | ✅ Pass |
| **URS-004**<br>_Vigilance Decision Tree & Regulatory Incident Reporting (MIR)_ | **SRS-023**<br>MIR Form Concurrency Locking | **DESIGN-008**<br>Concurrency Lock Engine | `lib/record-lock.ts` | **TEST-022** | [`tests/mir-concurrency-lock.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/mir-concurrency-lock.test.ts) | 12/12 | ✅ Pass |
| **URS-005**<br>_Customer Communication & Follow-up_ | **SRS-011**<br>Customer Communication Stage Progression | **DESIGN-011**<br>Communication Manager | `lib/actions/communications.ts` | **TEST-010** | [`tests/communication-stage-transition.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/communication-stage-transition.test.ts) | 19/19 | ✅ Pass |
| **URS-005**<br>_Customer Communication & Follow-up_ | **SRS-012**<br>Customer Summary Report Generation | **DESIGN-012**<br>Customer Report Generator | `lib/actions/customer-report.ts` | **TEST-011** | [`tests/customer-report-generation.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/customer-report-generation.test.ts) | 3/3 | ✅ Pass |
| **URS-005**<br>_Customer Communication & Follow-up_ | **SRS-021**<br>Communication Update & Notes Maintenance | **DESIGN-011**<br>Communication Manager | `lib/actions/communications.ts` | **TEST-020** | [`tests/communication-update.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/communication-update.test.ts) | 8/8 | ✅ Pass |
| **URS-005**<br>_Customer Communication & Follow-up_ | **SRS-022**<br>Communication Concurrency Lock Leases | **DESIGN-008**<br>Concurrency Lock Engine | `lib/record-lock.ts` | **TEST-021** | [`tests/communication-concurrency-lock.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/communication-concurrency-lock.test.ts) | 13/13 | ✅ Pass |
| **URS-006**<br>_CAPA Linking & Escalation_ | **SRS-016**<br>Complaint-to-CAPA Traceability & Subrecord Audit | **DESIGN-016**<br>Nested Audit Tracker | `lib/actions/capa.ts, lib/audit.ts` | **TEST-015** | [`tests/audit-trail-complaint-subrecords-capa.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/audit-trail-complaint-subrecords-capa.test.ts) | 22/22 | ✅ Pass |
| **URS-007**<br>_Device Sample Management_ | **SRS-013**<br>Device Sample Tracking & Condition Evaluation | **DESIGN-013**<br>Sample Management Service | `lib/actions/samples.ts` | **TEST-012** | [`tests/sample-management-update.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/sample-management-update.test.ts) | 3/3 | ✅ Pass |
| **URS-008**<br>_Closed Record Immutability & Modification Protection_ | **SRS-005**<br>Closed Complaint Immutability Guard | **DESIGN-005**<br>Immutability Guard | `actions/complaint/updateComplaint.ts` | **TEST-004** | [`tests/closed-complaint-modification-protection.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/closed-complaint-modification-protection.test.ts) | 11/11 | ✅ Pass |
| **URS-009**<br>_Record Concurrency Control & Active Locking_ | **SRS-014**<br>Generic Entity Concurrency Locking Engine | **DESIGN-014**<br>Entity Lock Registry | `hooks/use-record-lock.ts, lib/record-lock.ts` | **TEST-013** | [`tests/entity-concurrency-lock.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/entity-concurrency-lock.test.ts) | 14/14 | ✅ Pass |
| **URS-009**<br>_Record Concurrency Control & Active Locking_ | **SRS-014**<br>Complaint Concurrency Lock Heartbeats | **DESIGN-008**<br>Concurrency Lock Engine | `lib/record-lock.ts` | **TEST-023** | [`tests/complaint-concurrency-lock.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/complaint-concurrency-lock.test.ts) | 12/12 | ✅ Pass |
| **URS-010**<br>_21 CFR Part 11 Electronic Audit Trail_ | **SRS-015**<br>Chronological Audit History Retrieval & Rendering | **DESIGN-015**<br>Audit Trail Viewer | `components/audit/audit-history-drawer.tsx` | **TEST-014** | [`tests/audit-history-view.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/audit-history-view.test.ts) | 14/14 | ✅ Pass |
| **URS-011**<br>_21 CFR Part 11 Electronic Signatures_ | **SRS-017**<br>Dual-Credential E-Signature Verification & Immutability | **DESIGN-017**<br>21 CFR Part 11 E-Signature | `lib/actions/esignature.ts` | **TEST-016** | [`tests/e-signature-recording.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/e-signature-recording.test.ts) | 7/7 | ✅ Pass |
| **URS-012**<br>_Multi-Tenant Isolation & Role-Based Access Control (RBAC)_ | **SRS-006**<br>Multi-Tenant Data Isolation & Query Boundary | **DESIGN-006**<br>Multi-Tenant Partitioning | `lib/auth-guard.ts` | **TEST-005** | [`tests/complaint-multi-tenant-isolation.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/complaint-multi-tenant-isolation.test.ts) | 7/7 | ✅ Pass |
| **URS-012**<br>_Multi-Tenant Isolation & Role-Based Access Control (RBAC)_ | **SRS-018**<br>Role-Based Access Control (RBAC) Enforcement | **DESIGN-018**<br>RBAC Authorization Guard | `lib/auth-guard.ts` | **TEST-017** | [`tests/new-roles-rbac.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/new-roles-rbac.test.ts) | 13/13 | ✅ Pass |
| **URS-013**<br>_Data Exports & Regulatory Inspection Support_ | **SRS-019**<br>Regulatory Export Bundle Generation (CSV & JSON) | **DESIGN-019**<br>Regulatory Export Service | `lib/actions/exports.ts` | **TEST-018** | [`tests/exports-generation.test.ts`](file:////Users/viliorcuni/Desktop/arlo/tests/exports-generation.test.ts) | 10/10 | ✅ Pass |

---

## 3. Bidirectional Traceability Verification

### Forward Traceability (Requirements $\rightarrow$ Code $\rightarrow$ Verification)
- Every user requirement (URS) is decomposed into $\ge 1$ software requirement (SRS).
- Every software requirement (SRS) maps to an architectural design specification (DESIGN) and concrete implementation file(s).
- Every software requirement (SRS) has $\ge 1$ formal automated test suite passing in Vitest.

### Backward Traceability (Verification $\rightarrow$ Requirements)
- All 23 active automated test suites in `tests/` trace directly to an approved software requirement (SRS) and user requirement (URS).
- There are zero unmapped orphan test cases or unmapped regulatory requirements.

---
*This document is automatically generated by the Arlo Traceability Verification Engine (`scripts/traceability.mjs`).*
