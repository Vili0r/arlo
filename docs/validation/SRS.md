# Software Requirements Specification (SRS)

**System Name:** Arlo Complaint Management & Vigilance & CAPA Management SaaS  
**Document ID:** SRS-ARLO-001  
**Version:** 1.0.0  
**Parent Document:** [URS.md](file:///Users/viliorcuni/Desktop/arlo/docs/validation/URS.md)

---

## 1. Scope & Traceability
This document defines the functional and software requirements for Arlo. Each software requirement (SRS) traces directly to a parent User Requirement (URS) and specifies testable acceptance criteria.

---

## 2. Detailed Software Requirements

### URS-001: Complaint Intake & Unique Identification
- **SRS-001 (Complaint Creation & Atomic Subrecord Provisioning):**  
  The system shall execute a database transaction creating the primary `Complaint` record and automatically provision linked `VigilanceDecisionTree`, `Investigation`, `CustomerCommunication`, and `AuditLog` records with matching `complaintId` and `orgId`.
- **SRS-002 (Complaint Input Validation):**  
  The system shall validate all complaint intake inputs, rejecting requests missing mandatory fields (`shortDescription`, `priority`, `customerName`, or contact details) with descriptive validation errors.
- **SRS-003 (Deterministic Unique Identifier Generation):**  
  The system shall generate unique complaint numbers formatted as `CMP-<YYYY>-<XXXX>`, partitioned by organization and calendar year, incrementing monotonically without collision.

### URS-002: Complaint Stage Progression & Gatekeeping
- **SRS-004 (Complaint Stage Lifecycle Gates):**  
  The system shall enforce sequential state transitions (`INTAKE` $\rightarrow$ `INVESTIGATION` $\rightarrow$ `VIGILANCE` $\rightarrow$ `CLOSED`). Invalid transitions or closure attempts without completing prerequisites shall be rejected.
- **SRS-020 (Complaint Update & Status Maintenance):**  
  The system shall allow authorized users to update active complaint records, updating modified fields, recording an audit log entry, and maintaining transactional consistency.

### URS-003: Investigation Lifecycle & Template Support
- **SRS-007 (Investigation Stage Progression & Task Tracking):**  
  The system shall track investigation states (`NOT_STARTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`) and enforce completion of assigned tasks and root-cause summaries before marking the investigation complete.
- **SRS-008 (Investigation Concurrency Lock Management):**  
  The system shall enforce exclusive record-level locks during investigation editing, preventing conflicting simultaneous updates.

### URS-004: Vigilance Decision Tree & Regulatory Incident Reporting (MIR)
- **SRS-009 (Vigilance Decision Tree & Reportability Transitions):**  
  The system shall evaluate device malfunction, serious injury, or death inputs through a decision tree, transitioning vigilance status between `PENDING`, `REPORTABLE`, and `NOT_REPORTABLE` with documented rationale.
- **SRS-010 (MIR Subfolder Lifecycle & Complaint Closure Blockers):**  
  The system shall track Initial and Final MIR forms. If an incident is marked `REPORTABLE`, the system shall prevent closing the parent complaint until all required MIR submissions are finalized.
- **SRS-023 (MIR Concurrency Lock Management):**  
  The system shall manage exclusive edit locks on MIR forms to prevent data corruption during regulatory report authoring.

### URS-005: Customer Communication & Follow-up
- **SRS-011 (Communication Stage Progression):**  
  The system shall track communication records through defined stages (`NEW` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED`) with author attribution and timestamps.
- **SRS-012 (Customer Summary Report Generation):**  
  The system shall compile complaint intake details, investigation outcomes, and resolution notes into a sanitized customer report.
- **SRS-021 (Communication Update & Notes Maintenance):**  
  The system shall support updating communication notes and status with audit trail tracking.
- **SRS-022 (Communication Concurrency Lock Management):**  
  The system shall prevent concurrent edits on customer communication threads via active lock leases.

### URS-006: CAPA Integration
- **SRS-016 (Complaint-to-CAPA Traceability & Subrecord Audit):**  
  The system shall record bidirectional relationships between complaints and CAPA records, capturing modifications across all phase subrecords in the audit trail.
- **SRS-024 (CAPA 6-Phase Lifecycle & Planning-Implementation Separation):**  
  The system shall govern CAPA progression across 6 distinct phases: `INITIATION` $\rightarrow$ `INVESTIGATION` $\rightarrow$ `PLANNING` $\rightarrow$ `IMPLEMENTATION` $\rightarrow$ `EFFECTIVENESS` $\rightarrow$ `CLOSED`. The system shall enforce separate subrecords for `CapaPlanning` (capturing CAPA plan due date, action plan, effectiveness check plan, approvals, and attachments) and `CapaImplementation` (capturing date due, action plan execution, effectiveness check plan, effectiveness date due, validate comments, action plan summary, approvals, and attachments).
- **SRS-025 (CAPA Due-Date Immutability & Stage Extension Governance):**  
  The system shall enforce due-date immutability across all CAPA phases: as soon as a due date is established for a phase (`Initiation`, `Investigation`, `Planning`, `Implementation`, or `Effectiveness`), direct modification of that date field via regular form updates shall be strictly blocked. Any modification of a set phase due date shall require a formal extension request under Controls, capturing justification, risk evaluation rationale, and formal approval before updating the target phase due date.
- **SRS-026 (CAPA Investigation Phase Locking & Approver Gatekeeping):**  
  When a CAPA is in the `INVESTIGATION` phase, the system shall lock all fields and tabs before (`Initiation`) and after (`Planning`, `Implementation`, `Effectiveness`) that phase, while maintaining `Investigation` and `Controls` active and editable. The system shall enforce designated phase approver verification, strictly prohibiting advancing the CAPA lifecycle to the next phase unless the current phase has received formal approval recorded in the 21 CFR Part 11 audit trail.

### URS-007: Device Sample Management
- **SRS-013 (Device Sample Tracking & Condition Evaluation):**  
  The system shall support tracking sample return status, tracking numbers, physical condition, and evaluation conclusions.

### URS-008: Closed Record Immutability & Modification Protection
- **SRS-005 (Closed Complaint Immutability Guard):**  
  The system shall intercept and reject any mutation targeting a complaint in `CLOSED` status, throwing an immutable record violation unless explicitly unlocked by an authorized administrative override.

### URS-009: Record Concurrency Control & Active Locking
- **SRS-014 (Generic Entity Concurrency Locking Engine):**  
  The system shall provide a multi-entity lease locking mechanism (`acquireLock`, `refreshLock`, `releaseLock`) with automated TTL expiry and conflict detection.

### URS-010: 21 CFR Part 11 Electronic Audit Trail
- **SRS-015 (Chronological Audit History Retrieval):**  
  The system shall retrieve and render append-only audit trail logs in chronological order, displaying user attribution, timestamps, and human-readable field diffs.

### URS-011: 21 CFR Part 11 Electronic Signatures
- **SRS-017 (Dual-Credential E-Signature Verification & Immutability):**  
  The system shall authenticate e-signature requests via user credentials, validate signature meaning (`APPROVAL`, `REVIEW`, `AUTHOR`), compute a SHA-256 integrity hash of the signed payload, and record the immutable signature.

### URS-012: Multi-Tenant Isolation & Role-Based Access Control (RBAC)
- **SRS-006 (Multi-Tenant Data Isolation):**  
  The system shall strictly partition all database operations by `orgId`, ensuring zero data leakage between customer tenants.
- **SRS-018 (Role-Based Access Control Enforcement):**  
  The system shall enforce RBAC permissions (`complaints:create`, `complaints:edit`, `complaints:close`, `audit:view`, `export:generate`) on server actions and API routes.

### URS-013: Data Exports & Regulatory Inspection Support
- **SRS-019 (Regulatory Export Bundle Generation):**  
  The system shall export compliant CSV and JSON datasets containing complaints, investigations, and audit trails formatted for regulatory inspection.
