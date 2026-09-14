# 04. Platform Requirements Specification

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-04  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  

---

## 1. Scope

This document specifies the customer-facing functional, security, and regulatory requirements implemented in Arlo v1.0.0. Each requirement defines measurable acceptance criteria traceable to automated verification tests.

---

## 2. Complaint Intake & Lifecycle Requirements

### REQ-CMP-001: Complaint Record Creation & Subrecord Provisioning
The system shall atomically create a new complaint record with its dependent subrecords (`Investigation`, `VigilanceDecisionTree`, `CustomerCommunication`, `AuditLog`) within a single database transaction.

### REQ-CMP-002: Mandatory Input Validation
The system shall validate all intake inputs, rejecting requests missing mandatory fields (`shortDescription`, `priority`, `customerName`, contact details) with explicit client feedback.

### REQ-CMP-003: Monotonic Unique Identifier Generation
The system shall generate a monotonic, non-colliding identifier formatted as `CMP-<YYYY>-<XXXX>` scoped by tenant and calendar year.

### REQ-CMP-004: Sequential Stage Progression Gates
The system shall enforce complaint lifecycle stages (`INTAKE` $\rightarrow$ `INVESTIGATION` $\rightarrow$ `VIGILANCE` $\rightarrow$ `CLOSED`). Invalid status transitions or attempts to bypass required stages shall be blocked.

### REQ-CMP-005: Closed Record Immutability Guard
The system shall intercept and reject any mutation attempt on a complaint in `CLOSED` status, throwing an immutable record violation.

---

## 3. Investigation & Vigilance Requirements

### REQ-INV-001: Root Cause Investigation & Task Checklists
The system shall support root-cause investigations, task checklist progression, and finding documentation before allowing an investigation to be marked as completed.

### REQ-INV-002: Record Concurrency Locking
The system shall enforce active lease locking during record editing, preventing conflicting concurrent edits and notifying active users of lock status.

### REQ-VIG-001: Vigilance Decision Tree Evaluation
The system shall evaluate device malfunction, serious injury, or death inputs through a decision tree, transitioning status between `PENDING`, `REPORTABLE`, and `NOT_REPORTABLE` with documented rationale.

### REQ-VIG-002: EU MDR Incident Report (MIR) Provisioning
The system shall support Initial and Final MIR forms. If an incident is marked `REPORTABLE`, the system shall prevent closing the parent complaint until all required MIR submissions are completed.

---

## 4. CAPA & Follow-up Requirements

### REQ-CAPA-001: Complaint-to-CAPA Escalation & Traceability
The system shall allow authorized users to escalate complaints into CAPA records, maintaining bidirectional links and recording linked status in the audit trail.

### REQ-COM-001: Customer Correspondence & Closure Letters
The system shall record customer communications and generate sanitized customer-facing closure summary letters.

### REQ-SMP-001: Physical Sample Evaluation
The system shall record receipt status, tracking numbers, physical condition, and evaluation conclusions for returned device samples.

---

## 5. Security & 21 CFR Part 11 Requirements

### REQ-SEC-001: Multi-Tenant Data Isolation
The system shall enforce strict data isolation between customer organizations (`orgId`), ensuring no customer can read or mutate data belonging to another organization.

### REQ-SEC-002: 21 CFR Part 11 Electronic Audit Trail
The system shall automatically record an append-only audit entry for every entity creation, modification, status transition, or signature, capturing the actor, timestamp, and field-level diff (`previousValue`, `newValue`).

### REQ-SEC-003: 21 CFR Part 11 Electronic Signatures
The system shall require dual-credential re-authentication for formal record closure, capture the manifest signature meaning (`APPROVAL`), and compute a SHA-256 integrity hash of the signed state.

### REQ-SEC-004: Role-Based Access Control (RBAC)
The system shall restrict administrative, investigative, and approval actions according to verified Clerk organization roles.

### REQ-SEC-005: Regulatory Data Export
The system shall support exporting complete complaint datasets, investigations, and audit logs into structured CSV and JSON bundles for regulatory inspections.
