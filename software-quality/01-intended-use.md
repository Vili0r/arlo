# 01. Intended Use & Regulatory Scope

**System Name:** Arlo Complaint Management & Vigilance & CAPA Management SaaS  
**Document ID:** SQ-DOC-001  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Classification:** Quality Management System (eQMS) Software Tool  
**Regulatory Standards:**  
- **FDA 21 CFR Part 820 / QMSR (incorporating ISO 13485:2016)**
- **FDA 21 CFR Part 11 (Electronic Records & Electronic Signatures)**
- **ISO 13485:2016 Clauses 4.1.6, 7.2.3, 8.2.2, 8.5.2, 8.5.3**
- **EU MDR 2017/745 Article 87 & Article 89 (Vigilance & Incident Reporting)**
- **IEC 62304 / FDA CSA (Computer Software Assurance) Risk-Based Framework**

---

## 1. Intended Use Statement

Arlo is a cloud-based electronic Quality Management System (eQMS) Software-as-a-Service (SaaS) application designed and developed to support medical device manufacturers in managing, documenting, and resolving:

1. **Customer Complaints:** Ingestion, validation, intake triage, and unique numbering (`CMP-YYYY-XXXX`) of feedback from end-users, clinicians, and patients per 21 CFR 820.198 and ISO 13485 Clause 8.2.2.
2. **Root-Cause Investigations:** Task assignment, checklists, finding documentation, and failure investigation tracking per ISO 13485 Clause 8.5.2.
3. **Regulatory Vigilance & Adverse Event Reporting:** Decision-tree driven reportability determination and generation of European Union Manufacturer Incident Reports (EU MDR MIR) and FDA Medical Device Reports (MDR) per EU MDR 2017/745 and 21 CFR 803.
4. **Customer Communication & Follow-up:** Documenting customer inquiries, sample return tracking, and generating customer-facing closure summaries.
5. **CAPA Escalation:** Direct linking of systemic or recurring complaint trends to Corrective and Preventive Action records per 21 CFR 820.100.
6. **Regulatory Audit Readiness & Electronic Records:** Enforcing 21 CFR Part 11 electronic records, tamper-evident audit trails, dual-credential electronic signatures, and deterministic export packages for Notified Body and FDA inspections.

---

## 2. Two Levels of Assurance Model

As a specialized SaaS provider for medical device manufacturers, Arlo operates under a two-tiered assurance model:

```
┌────────────────────────────────────────────────────────────────────────┐
│  LEVEL 1: VENDOR ASSURANCE (Arlo Software Vendor Responsibilities)     │
│  • Controlled Software Development Lifecycle (SDLC)                    │
│  • Automated Bidirectional Requirements Traceability                   │
│  • Automated Regression & Security Test Suites (Vitest)                │
│  • Immutable Audit Trail & E-Signature Architecture                   │
│  • High-Reliability Tenant Isolation & RBAC Controls                   │
│  • Controlled Release Management & Change Notification                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Delivered via Validation Package
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  LEVEL 2: CUSTOMER ASSURANCE (Medical Device Manufacturer Customer)    │
│  • Intended Use Verification against Internal SOPs                     │
│  • Organization Configuration & User Role Assignment (Clerk RBAC)      │
│  • Customer Acceptance Testing (Vendor-Assisted CSA Evidence)           │
│  • Ongoing Change Evaluation based on Arlo Release Notes               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. User Personas & Authorized Actors

| Persona | Role Slug (`lib/auth-guard.ts`) | Core Intended Responsibilities |
| :--- | :--- | :--- |
| **QA Manager / Approver** | `org:qa_manager`, `org:qa_approver` | Reviews investigation findings, executes formal Part 11 e-signatures, approves complaint closures, and authorizes CAPAs. |
| **Quality Engineer / Investigator** | `org:quality_engineer`, `org:complaint_investigator` | Performs root cause investigations, completes task checklists, evaluates physical samples, and records evidence. |
| **Vigilance Lead** | `org:vigilance_lead` | Executes vigilance decision trees, authors Initial and Final MIR forms, and manages statutory reporting deadlines. |
| **Customer Support / Intake** | `org:member`, `org:complaint_creator` | Receives external customer complaints, verifies mandatory fields, and initiates records. |
| **Auditor / Regulatory Inspector** | `org:read_only` | Views read-only complaint records, chronological audit history, and generates inspection export bundles. |
| **Tenant Administrator** | `org:admin` | Configures organization settings, manages user memberships and role assignments. |

---

## 4. System Boundaries & Exclusions

### In-Scope:
- Multi-tenant cloud application built on Next.js 16 (React 19 Server Components/Actions), Prisma ORM, PostgreSQL database, and Clerk Identity Provider.
- Core workflows: Complaint Intake, Investigation, Vigilance Decision Tree (MIR), Customer Communication, Sample Management, Audit Trail, E-Signature, and Regulatory Data Export.

### Out-of-Scope (Exclusions):
- **Medical Device Control / Direct Patient Monitoring:** Arlo is an administrative and quality system tool (eQMS), not a Software in a Medical Device (SiMD) or Software as a Medical Device (SaMD). It does not directly control physical medical hardware or make direct automated diagnostic decisions for patients.
- **Physical Sample Destruction:** Physical custody and destruction of defective devices remains the physical responsibility of the device manufacturer's laboratory personnel; Arlo only tracks documentation and custody metadata.
