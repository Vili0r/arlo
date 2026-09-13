# User Requirements Specification (URS)

**System Name:** Arlo Complaint Management & Vigilance SaaS  
**Document ID:** URS-ARLO-001  
**Version:** 1.0.0  
**Regulatory Context:** FDA 21 CFR Part 820.198 (Complaint Files), 21 CFR Part 11 (Electronic Records & Signatures), ISO 13485:2016 (Clause 8.2.2 Complaint Handling, 8.5 Improvement), EU MDR 2017/745 (Vigilance & Incident Reporting).

---

## 1. Scope & Purpose
This document defines the high-level user and business requirements for Arlo, an electronic Quality Management System (eQMS) specialized for medical device complaint handling, vigilance investigations, adverse event reporting, and CAPA integration.

---

## 2. User Requirements

### URS-001: Complaint Intake & Unique Identification
- **Statement:** The system shall allow authorized quality personnel to intake medical device complaints, capturing reporter contact details, awareness dates, patient impact, product/batch info, and automatically generate a deterministic, unique complaint identifier (`CMP-YYYY-XXXX`).
- **Rationale:** FDA 21 CFR 820.198(e) requires maintaining uniform records of complaints with unique identifiers and intake metadata.
- **Priority:** High

### URS-002: Complaint Stage Progression & Gatekeeping
- **Statement:** The system shall enforce sequential lifecycle progression (`INTAKE` $\rightarrow$ `INVESTIGATION` $\rightarrow$ `VIGILANCE` $\rightarrow$ `CLOSURE`) with explicit validation checks preventing premature or out-of-order stage transitions.
- **Rationale:** Good Manufacturing Practice (GMP) requires systematic progression before a complaint can be closed.
- **Priority:** High

### URS-003: Investigation Lifecycle & Template Support
- **Statement:** The system shall provide structured root cause investigation capabilities, investigator assignment, task checklists, and configurable investigation templates.
- **Rationale:** ISO 13485:2016 8.5.2 requires determining the root cause of nonconformities and complaints.
- **Priority:** High

### URS-004: Vigilance Decision Tree & Regulatory Incident Reporting (MIR)
- **Statement:** The system shall guide users through a structured vigilance decision tree to determine medical device reportability, generate Initial and Final Manufacturer Incident Reports (MIR), and manage regulatory reporting deadlines under EU MDR/IVDR and FDA MDR.
- **Rationale:** EU MDR 2017/745 Article 87 & FDA 21 CFR 803 mandate timely reporting of serious incidents.
- **Priority:** High

### URS-005: Customer Communication & Follow-up
- **Statement:** The system shall record customer communications, track follow-up inquiries, and generate formal customer-facing response letters/reports.
- **Rationale:** ISO 13485:2016 7.2.3 requires customer communication processes regarding product feedback and complaints.
- **Priority:** Medium

### URS-006: CAPA (Corrective and Preventive Action) Linking
- **Statement:** The system shall support linking complaints to CAPA records and ensure audit traceability when a complaint escalates into a CAPA.
- **Rationale:** 21 CFR 820.100 and ISO 13485:2016 8.5.2/8.5.3 require integration between complaint feedback and CAPA.
- **Priority:** High

### URS-007: Device Sample Management
- **Statement:** The system shall track the receipt, physical inspection, testing, and return of defective device samples associated with complaints.
- **Rationale:** 21 CFR 820.198 requires documentation of whether a device sample was evaluated.
- **Priority:** Medium

### URS-008: Closed Record Immutability & Modification Protection
- **Statement:** Once a complaint reaches `CLOSED` status, the system shall prohibit unauthorized modifications or deletions of the complaint and its sub-records to prevent data tampering.
- **Rationale:** 21 CFR Part 11 and data integrity principles require that closed regulatory records remain immutable.
- **Priority:** Critical

### URS-009: Record Concurrency Control & Active Locking
- **Statement:** The system shall provide real-time concurrency locking to prevent conflicting simultaneous edits on complaints, investigations, communications, and MIR reports by different users.
- **Rationale:** Prevents race conditions, data corruption, and overwriting of critical regulatory documentation.
- **Priority:** High

### URS-010: 21 CFR Part 11 Electronic Audit Trail
- **Statement:** The system shall maintain an append-only, tamper-evident audit trail capturing every creation, update, stage transition, and deletion, recording the exact user, timestamp, entity ID, and field-level before/after diffs.
- **Rationale:** 21 CFR Part 11.10(e) mandates secure, computer-generated, time-stamped audit trails.
- **Priority:** Critical

### URS-011: 21 CFR Part 11 Electronic Signatures
- **Statement:** The system shall require dual-credential re-authentication (email/ID + password) and an explicit signature reason/meaning (e.g., APPROVAL, REVIEW) when executing approvals, generating a cryptographically secure audit snapshot.
- **Rationale:** 21 CFR Part 11 Subpart B & C mandates signature manifestations, intent, and password re-verification.
- **Priority:** Critical

### URS-012: Multi-Tenant Isolation & Role-Based Access Control (RBAC)
- **Statement:** The system shall enforce strict data isolation between customer organizations and provide fine-grained permissions for complaint actions, audits, templates, and administrative tasks.
- **Rationale:** Prevents unauthorized cross-tenant data access and enforces principle of least privilege.
- **Priority:** Critical

### URS-013: Data Exports & Regulatory Inspection Support
- **Statement:** The system shall generate structured, complete data exports (CSV, JSON, PDF) of complaints, investigations, and audit trails for regulatory inspectors (FDA, Notified Bodies).
- **Rationale:** 21 CFR 820.180 and 21 CFR Part 11.10(b) require ready access and copyable records for review.
- **Priority:** High
