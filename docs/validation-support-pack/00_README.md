# Software Assurance & Validation Support Package

**Product Name:** Arlo Quality Management Platform  
**System Classification:** Electronic Quality Management System (eQMS) Cloud SaaS  
**Version:** 1.0.0  
**Release Date:** 2026-09-14  
**Document Identifier:** VAL-PACK-1.0.0-README  
**Vendor:** Arlo Medical Inc.  

---

## 1. Package Purpose

This **Software Assurance & Validation Support Package** provides medical device manufacturers, quality assurance leaders, regulatory affairs specialists, and auditors with comprehensive objective evidence regarding the development, testing, security, and release controls of the Arlo eQMS platform.

This package is designed in alignment with:
- **FDA 21 CFR Part 820 / QMSR (Quality Management System Regulation)**
- **FDA 21 CFR Part 11 (Electronic Records & Electronic Signatures)**
- **ISO 13485:2016 Clauses 4.1.6, 7.2.3, 8.2.2, 8.5.2, 8.5.3**
- **EU MDR 2017/745 Articles 87 & 89 (Vigilance & Incident Reporting)**
- **FDA Computer Software Assurance (CSA) Guidance (February 2026)**

---

## 2. Shared Responsibility & Regulatory Scope

> [!IMPORTANT]
> **CUSTOMER SOFTWARE ASSURANCE NOTICE**  
> This package supports the customer's internal software assurance and computerized systems validation activities. Arlo is a configurable Cloud SaaS platform. The customer remains responsible for assessing and establishing confidence in:
> - **Intended Use** within the customer's specific quality system
> - **Standard Operating Procedures (SOPs)** governing complaints, CAPA, and vigilance
> - **Customer-Specific Workflows & Configuration**
> - **User Access Management & Role Assignments**
> - **Training of Internal Personnel**
> - **Final Validation Conclusion and System Acceptance**

Arlo provides objective evidence of controlled vendor development, automated regression testing, and cryptographic data integrity. The customer's internal validation leverages this evidence under the **FDA Computer Software Assurance (CSA)** risk-based framework.

---

## 3. Package Manifest

This package consists of the following 16 modular assurance documents:

| Document ID | Title | Summary |
| :--- | :--- | :--- |
| **01_SYSTEM_OVERVIEW** | System Architecture & Topology | Multi-tenant SaaS architecture, Next.js, Clerk, PostgreSQL, and system boundaries. |
| **02_INTENDED_USE** | Software Intended Use & Boundaries | In-scope complaint/CAPA/vigilance functions and explicit medical device exclusions. |
| **03_VALIDATION_APPROACH** | CSA Validation Philosophy | Risk-based Computer Software Assurance, automated testing hierarchy, and gating rules. |
| **04_REQUIREMENTS** | System Requirements Specification | Customer-relevant functional requirements for complaints, investigations, and CAPA. |
| **05_ARCHITECTURE** | Software Design Specification (SDS) | Implementation architecture for concurrency locks, state machines, and tenant security. |
| **06_RISK_ASSESSMENT** | Software Platform Risk Assessment | Vendor platform FMEA (isolation, audit failure, unauthorized access) vs customer risk. |
| **07_TEST_PLAN** | Verification Master Plan | Automated test strategy, execution environments, and regression protocols. |
| **08_TEST_EVIDENCE** | Objective Test Evidence Summary | Verifiable Vitest automated test suite receipts, pass counts, and execution metrics. |
| **09_TRACEABILITY** | Requirements Traceability Matrix (RTM) | Complete bidirectional mapping from User Requirements to Automated Tests and Results. |
| **10_SECURITY** | Security & Authentication Architecture | Clerk authentication, multi-factor authentication, session management, and RBAC. |
| **11_DATA_INTEGRITY** | Data Integrity & ALCOA+ Principles | Attributable, Legible, Contemporaneous, Original, Accurate record lifecycle controls. |
| **12_AUDIT_TRAILS** | 21 CFR Part 11 Audit Trail Specification | Append-only audit logging schema, JSON field diffs, and query mechanics. |
| **13_ELECTRONIC_SIGNATURES** | Electronic Signature Assessment | Part 11 dual-credential re-authentication, signature meaning, and SHA-256 state locks. |
| **14_RELEASE_HISTORY** | Release History & Impact Assessment | Controlled version log and Customer Release Impact Assessment matrix. |
| **15_KNOWN_ISSUES** | Known Issues & Anomalies Log | Transparent disclosure of known non-critical items, risk levels, and workarounds. |
| **16_CUSTOMER_RESPONSIBILITIES** | Shared Responsibility Matrix | Clear boundary matrix delineating Arlo responsibilities vs Customer responsibilities. |

---

## 4. Package Artifacts: Pack A vs. Pack B

Regulated customers receive two companion assurance artifacts:

1. **Pack A — Platform Validation Pack (This Document Suite):**  
   Authored and maintained by Arlo engineering. Uniform across all client tenants for version `1.0.0`. Contains vendor SDLC evidence, automated test runs, and architecture specifications.

2. **Pack B — Customer Instance Pack (Live Configuration Baseline):**  
   Exported on-demand directly from your Arlo tenant (`Settings` $\rightarrow$ `Software Assurance`). Captures your organization's specific active roles, custom workflow stages, investigation templates, and user assignment baselines.

Together, **Pack A + Pack B + Customer SOPs = Defensible Regulatory Software Assurance.**
