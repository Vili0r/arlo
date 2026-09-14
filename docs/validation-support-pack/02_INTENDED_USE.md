# 02. Software Intended Use & Boundaries

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-02  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  

---

## 1. Regulatory Classification

Arlo is an **electronic Quality Management System (eQMS) software application** categorized as software used in the implementation of a medical device manufacturer’s quality system under **FDA 21 CFR Part 820 / QMSR** and **ISO 13485:2016 Clause 4.1.6**.

Arlo is **NOT** a medical device, is **NOT** Software in a Medical Device (SiMD), and is **NOT** Software as a Medical Device (SaMD).

---

## 2. Intended Use Statement

The Arlo Quality Management Platform is intended to support medical device manufacturers and regulated life-sciences organizations in the:
1. Intake, validation, and unique identification (`CMP-YYYY-XXXX`) of customer feedback and product complaints.
2. Structured assignment, concurrency-locked tracking, and documentation of root cause failure investigations.
3. Decision-tree guided evaluation of statutory reportability and generation of European Union Manufacturer Incident Reports (EU MDR MIR) and FDA Medical Device Reports (MDR).
4. Customer communication tracking and sanitized customer closure summary report generation.
5. Bidirectional linking and lifecycle escalation of complaints to Corrective and Preventive Action (CAPA) records.
6. Execution of 21 CFR Part 11 compliant dual-credential electronic signatures and append-only tamper-evident audit trails.
7. Exportation of regulatory inspection bundles (CSV/JSON) for Notified Body and FDA inspections.

---

## 3. Explicit Boundaries of the System

### Functions IN-SCOPE (Validated by Vendor):
- Complaint intake schema validation and monotonic identifier generation.
- Stage-gate enforcement (`INTAKE` $\rightarrow$ `INVESTIGATION` $\rightarrow$ `VIGILANCE` $\rightarrow$ `CLOSED`).
- Regulatory vigilance decision logic and MIR subfolder provisioning.
- Investigation template management and checklist progress gates.
- CAPA creation, escalation linking, and status tracking.
- Concurrency lock lease lifecycle (acquire, heartbeat refresh, release, automated expiry).
- Closed record immutability guards (preventing mutations on closed complaints).
- 21 CFR Part 11 electronic audit trail recording with before/after state diffs.
- Dual-credential e-signature recording with SHA-256 payload integrity hash.
- Logical multi-tenant organization data isolation (`orgId`).

### Functions OUT-OF-SCOPE (Exclusions):
- **Medical Diagnosis & Clinical Treatment:** The software does not provide diagnostic insights, treatment recommendations, or direct clinical decision support.
- **Direct Patient Monitoring or Device Control:** The software does not interface with or control physical medical device hardware.
- **Physical Custody of Defective Samples:** The software records metadata and tracking numbers for returned physical samples; physical sample custody, laboratory containment, and disposal are customer site responsibilities.
- **Statutory Regulatory Submissions:** While Arlo generates structured MIR forms, the final transmission/submission to national competent authorities (e.g., Eudamed, FDA ESG) remains an authorized human customer responsibility.
