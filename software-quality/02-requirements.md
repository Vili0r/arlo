# 02. Product Requirements Specification

**Document ID:** SQ-DOC-002  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Regulatory Standards:** FDA 21 CFR 820.198, 21 CFR Part 11, ISO 13485:2016, EU MDR 2017/745  

---

## 1. Requirement Taxonomy & Hierarchy

Arlo maintains a structured requirement hierarchy linking high-level User Requirements (URS) to testable Software Requirements (SRS) with explicit Risk Classification:

```
[URS: User Requirement] ───► [SRS: Software Requirement] ───► [Design / Code] ───► [Test Suite]
```

### Risk Classification Tiers (FDA CSA Model)
- **HIGH RISK (Critical):** Core regulatory and data integrity functions (Electronic signatures, tamper-evident audit trail, record immutability, role permissions, multi-tenant isolation, concurrency locks). Failure directly impacts regulatory compliance or product safety decisions.
- **MEDIUM RISK (Major):** Business workflow functions (Complaint intake validation, investigation checklist transitions, customer communication threads, report/export generation, sample tracking).
- **LOW RISK (Minor):** Non-regulatory usability features (Dashboard widgets, UI layout, themes, tooltips).

---

## 2. Requirements Matrix

### 2.1 Complaint Intake & Identification (URS-001)

| Req ID | Requirement Statement | Risk | Regulatory Anchor | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **REQ-CMP-001** | The system shall create complaints and atomically provision linked sub-records (`Vigilance`, `Investigation`, `Communication`, `AuditLog`). | **High** | 21 CFR 820.198(a)<br>ISO 13485 8.2.2 | Complaint and all dependent sub-records created in a single atomic database transaction. |
| **REQ-CMP-002** | The system shall enforce mandatory input validation (`shortDescription`, `priority`, `customerName`, contact details) rejecting empty inputs. | **Medium** | 21 CFR 820.198(e) | Zod schema validation blocks invalid form submissions with descriptive error messages. |
| **REQ-CMP-003** | The system shall generate deterministic, unique identifiers formatted as `CMP-YYYY-XXXX` sequentially per tenant and calendar year. | **High** | 21 CFR 820.198(e) | Monotonic counter guarantees zero collisions or duplicate identifiers under concurrent creation. |

### 2.2 Complaint Lifecycle & Gatekeeping (URS-002)

| Req ID | Requirement Statement | Risk | Regulatory Anchor | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **REQ-CMP-004** | The system shall enforce sequential state transitions (`INTAKE` $\rightarrow$ `INVESTIGATION` $\rightarrow$ `VIGILANCE` $\rightarrow$ `CLOSED`). | **High** | 21 CFR 820.198 | Stage skips or premature closures are blocked by server-side state machine guards. |
| **REQ-CMP-005** | The system shall allow authorized updates to active complaints while capturing all delta changes in the audit trail. | **Medium** | ISO 13485 8.2.2 | Field updates write audit log records with before/after diffs and author attribution. |

### 2.3 Investigation Lifecycle & Concurrency (URS-003)

| Req ID | Requirement Statement | Risk | Regulatory Anchor | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **REQ-INV-001** | The system shall track investigation states (`NOT_STARTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`) requiring task checklist resolution. | **Medium** | ISO 13485 8.5.2 | Cannot mark investigation complete while checklist tasks remain open or unaddressed. |
| **REQ-INV-002** | The system shall provide active, lease-based concurrency locking on investigation records to prevent conflicting overwrites. | **High** | 21 CFR Part 11<br>Data Integrity | A user editing an investigation holds an exclusive lease; second user receives a locked notification. |

### 2.4 Vigilance & Regulatory Reporting (URS-004)

| Req ID | Requirement Statement | Risk | Regulatory Anchor | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **REQ-VIG-001** | The system shall evaluate adverse event criteria (death, serious deterioration, malfunction) and assign reportability status (`PENDING`, `REPORTABLE`, `NOT_REPORTABLE`). | **High** | EU MDR Art 87<br>21 CFR 803 | Algorithmic evaluation requires rationale documentation before status can be finalized. |
| **REQ-VIG-002** | The system shall prevent complaint closure if reportable vigilance incidents lack finalized MIR forms. | **High** | EU MDR Art 89 | Complaint state machine rejects `CLOSED` transition if MIR forms are incomplete. |
| **REQ-VIG-003** | The system shall provide lease-based concurrency locking for MIR regulatory report editing. | **High** | Data Integrity | Prevents dual concurrent edits on active Initial or Final MIR documents. |

### 2.5 Customer Communication & Sample Tracking (URS-005, URS-007)

| Req ID | Requirement Statement | Risk | Regulatory Anchor | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **REQ-COM-001** | The system shall maintain communication threads and generate formal customer closure summary letters. | **Medium** | ISO 13485 7.2.3 | Generates sanitized customer communication export documents. |
| **REQ-SMP-001** | The system shall track physical sample receipt, carrier tracking numbers, and physical evaluation findings. | **Medium** | 21 CFR 820.198(g) | Tracks sample condition and evaluation history linked to complaint. |

### 2.6 Immutability, Audit Trail & E-Signatures (URS-008, URS-010, URS-011)

| Req ID | Requirement Statement | Risk | Regulatory Anchor | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **REQ-SEC-001** | Closed records shall be immutable; system shall reject any mutation targeting a `CLOSED` complaint or subrecord. | **High** | 21 CFR Part 11<br>21 CFR 820.198 | Server action throws `assertComplaintMutable` error on any modification attempt to closed entities. |
| **REQ-SEC-002** | The system shall maintain an append-only, tamper-evident audit trail capturing user ID, timestamp, action, and field diffs. | **High** | 21 CFR 11.10(e) | Audit log records cannot be edited or deleted; every change logs old and new values. |
| **REQ-SEC-003** | Status transitions on regulated records shall require dual-credential re-authentication (email/ID + password) and explicit signature reason. | **High** | 21 CFR 11.200 | Clerk re-authentication validates credentials; records SHA-256 hash snapshot of signed entity state. |

### 2.7 Tenant Isolation & RBAC (URS-012)

| Req ID | Requirement Statement | Risk | Regulatory Anchor | Acceptance Criteria |
| :--- | :--- | :---: | :--- | :--- |
| **REQ-SEC-004** | All database transactions shall be strictly partitioned by `orgId`. Cross-tenant queries shall be prevented. | **High** | Tenant Security<br>Data Privacy | Prisma queries enforce `orgId` scoping via `requireOrgAuth`; cross-org access attempts throw 403 Forbidden. |
| **REQ-SEC-005** | The system shall enforce role-based permissions (`complaint:close`, `audit:view`, `esignature:sign`) on server actions. | **High** | ISO 13485 4.1.6 | Unauthorized roles are blocked before action execution with permission denied response. |
