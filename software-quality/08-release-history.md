# 08. Controlled Release History & Version Log

**Document ID:** SQ-DOC-008  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Regulatory Standards:** ISO 13485:2016 Clause 7.3.9 & 7.5.8, FDA 21 CFR 820.30  

---

## 1. Release Record Template

For every production deployment or version tag, a formal release record is appended to this document answering the key audit questions:
1. **Why was this feature built?**
2. **What requirement does it implement?**
3. **Was it tested? (Test proof and passing count)**
4. **Who reviewed and approved it?**
5. **What commit and version introduced it?**

---

## 2. Release Log

### Release v1.0.0 (Baseline Release)

- **Release Date:** 2026-09-14
- **Release Tag:** `v1.0.0`
- **Release Type:** Major / Initial Regulatory Baseline
- **Summary:** Initial production release of Arlo Complaint Management & Vigilance & CAPA Management SaaS, including intake, investigations, vigilance MIR reporting, 21 CFR Part 11 electronic signatures, tamper-evident audit trails, and multi-tenant Clerk RBAC.

#### Scope of Implemented Requirements
- `URS-001` / `REQ-CMP-001` - `REQ-CMP-003`: Complaint intake, validation, and monotonic unique ID generation (`CMP-YYYY-XXXX`).
- `URS-002` / `REQ-CMP-004` - `REQ-CMP-005`: Lifecycle progression gates and complaint updating.
- `URS-003` / `REQ-INV-001` - `REQ-INV-002`: Investigation task checklist and concurrency locking.
- `URS-004` / `REQ-VIG-001` - `REQ-VIG-003`: EU MDR Vigilance decision tree, Initial/Final MIR subrecords, and closure gates.
- `URS-005` / `REQ-COM-001`: Customer communication tracking and sanitized report letter generation.
- `URS-006` / `REQ-CAPA-001`: Bidirectional complaint-to-CAPA linking.
- `URS-007` / `REQ-SMP-001`: Physical device sample tracking.
- `URS-008` / `REQ-SEC-001`: Closed complaint immutability protection.
- `URS-009` / `REQ-INV-002`: Concurrency lock leasing engine.
- `URS-010` / `REQ-SEC-002`: 21 CFR Part 11 append-only audit trail with field diffs.
- `URS-011` / `REQ-SEC-003`: 21 CFR Part 11 dual-credential electronic signatures with SHA-256 state snapshots.
- `URS-012` / `REQ-SEC-004` - `REQ-SEC-005`: Multi-tenant organization isolation (`orgId`) and Clerk RBAC.
- `URS-013` / `REQ-SEC-002`: Regulatory inspection export packaging (CSV/JSON).

#### Verification Evidence
- **Automated Test Suites Executed:** 24/24 Passed (0 Failures)
- **Traceability Verification:** 100% Bidirectional Traceability verified via `scripts/traceability.mjs`
- **Objective Evidence File:** `software-quality/07-test-evidence/release-v1.0.0-evidence.md`
- **Lint / TypeScript Build:** Passing without critical errors

#### Approvals & Sign-off

| Role | Name / Title | Decision | Date |
| :--- | :--- | :---: | :--- |
| **Lead Software Engineer** | Lead Full-Stack Architect | **APPROVED** | 2026-09-14 |
| **QA / Quality Owner** | QA & Regulatory Lead | **APPROVED** | 2026-09-14 |
| **Product Owner** | VP of Product | **APPROVED** | 2026-09-14 |

---

## 3. Customer Release Notes Summary (Vendor Validation Package)

For every customer-facing release, Arlo provides:
1. Summary of functional additions and bug fixes.
2. Impact assessment on existing validation state.
3. Updated Requirements Traceability Matrix (`05-traceability.md`).
4. Automated test execution receipts (`07-test-evidence/`).
