# 06. Software Verification & Validation (V&V) Test Plan

**Document ID:** SQ-DOC-006  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Regulatory Standards:** FDA Computer Software Assurance (CSA), ISO 13485:2016 Clause 4.1.6, IEC 62304  

---

## 1. Test Strategy & Philosophy

Arlo's Verification & Validation approach emphasizes **continuous, automated, executable test evidence** over static paperwork. Test suites are integrated directly into development and continuous integration pipelines. Every code change executes the full verification suite before deployment.

### Testing Levels
1. **Automated Unit & Integration Tests (Vitest):**
   - Covers business logic, state machines, Zod validation schemas, and database transactions.
   - Tests run in isolated test databases or transactional mock environments.
2. **Security & Boundary Enforcement Tests:**
   - Multi-tenant boundary penetration tests (`complaint-multi-tenant-isolation.test.ts`).
   - Closed record immutability tests (`closed-complaint-modification-protection.test.ts`).
   - Audit trail tamper-resistance tests (`audit-history-view.test.ts`, `no-hard-deletes.test.ts`).
   - Role-Based Access Control matrix tests (`new-roles-rbac.test.ts`).
   - Concurrency lock lease preemption tests (`*-concurrency-lock.test.ts`).
3. **Automated Traceability Verification:**
   - Automated script (`scripts/traceability.mjs`) parses all software requirements, runs test suites, matches test results to requirements, and generates the live Traceability Matrix (`05-traceability.md`).

---

## 2. Test Suites Inventory

The repository contains 24 automated test suites covering all regulated modules:

| Test ID | Test Suite File | Coverage Scope | Target Requirement |
| :--- | :--- | :--- | :--- |
| **TEST-001** | `tests/complaint-creation.test.ts` | Intake transaction & subrecord provisioning | REQ-CMP-001, REQ-CMP-002 |
| **TEST-002** | `tests/unique-identifier-generation.test.ts` | Sequential `CMP-YYYY-XXXX` numbering & no collisions | REQ-CMP-003 |
| **TEST-003** | `tests/complaint-stage-transition.test.ts` | Sequential state transitions & prerequisites | REQ-CMP-004 |
| **TEST-004** | `tests/closed-complaint-modification-protection.test.ts` | Immutability guard on closed complaints | REQ-SEC-001 |
| **TEST-005** | `tests/complaint-multi-tenant-isolation.test.ts` | Strict multi-tenant query isolation | REQ-SEC-004 |
| **TEST-006** | `tests/investigation-stage-transition.test.ts` | Investigation task checklist progression | REQ-INV-001 |
| **TEST-007** | `tests/investigation-concurrency-lock.test.ts` | Exclusive lease locking on investigations | REQ-INV-002 |
| **TEST-008** | `tests/mir-stage-transition.test.ts` | Vigilance decision tree transitions & rationale | REQ-VIG-001 |
| **TEST-009** | `tests/mir-subfolder-lifecycle-and-closure.test.ts` | Reportable incident blocking closure until MIR done | REQ-VIG-002 |
| **TEST-010** | `tests/communication-stage-transition.test.ts` | Communication lifecycle progression | REQ-COM-001 |
| **TEST-011** | `tests/customer-report-generation.test.ts` | Customer summary letter export generation | REQ-COM-001 |
| **TEST-012** | `tests/sample-management-update.test.ts` | Device sample tracking and condition updates | REQ-SMP-001 |
| **TEST-013** | `tests/audit-history-view.test.ts` | Chronological audit logs & diff snapshots | REQ-SEC-002 |
| **TEST-014** | `tests/audit-trail-complaint-subrecords-capa.test.ts` | Multi-entity subrecord audit linking | REQ-SEC-002 |
| **TEST-015** | `tests/e-signature-recording.test.ts` | Dual-credential re-auth & Part 11 signing | REQ-SEC-003 |
| **TEST-016** | `tests/new-roles-rbac.test.ts` | Granular permission evaluation & role checks | REQ-SEC-005 |
| **TEST-017** | `tests/exports-generation.test.ts` | Regulatory inspection export packaging | REQ-SEC-002 |
| **TEST-018** | `tests/no-hard-deletes.test.ts` | Prohibition of hard SQL deletions on audit records | REQ-SEC-002 |
| **TEST-019** | `tests/complaint-update.test.ts` | Complaint field updates & audit emissions | REQ-CMP-005 |
| **TEST-020** | `tests/complaint-concurrency-lock.test.ts` | Complaint record lease lock enforcement | REQ-INV-002 |
| **TEST-021** | `tests/communication-update.test.ts` | Communication notes updates | REQ-COM-001 |
| **TEST-022** | `tests/communication-concurrency-lock.test.ts` | Communication lease locking | REQ-INV-002 |
| **TEST-023** | `tests/mir-concurrency-lock.test.ts` | MIR regulatory report lease locking | REQ-VIG-003 |
| **TEST-024** | `tests/entity-concurrency-lock.test.ts` | Generic polymorphic concurrency lock engine | REQ-INV-002 |

---

## 3. Execution & Acceptance Criteria

### Pass Criteria for Release
1. **Zero Failing Tests:** All 24 test suites must exit with return code `0`.
2. **100% Requirements Coverage:** Every requirement in `02-requirements.md` must be mapped to at least one passing test suite.
3. **Traceability Verification:** `npm run test:traceability` must confirm 100% bidirectional traceability.
4. **Clean Lint & Type Checks:** `npm run lint` and TypeScript compilation must complete without fatal errors.
