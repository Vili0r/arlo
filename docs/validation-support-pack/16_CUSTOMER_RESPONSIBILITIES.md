# 16. Shared Responsibility Matrix & Customer Responsibilities

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-16  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Standards:** ISO 13485:2016 Clause 4.1.6, FDA CSA Guidance (Feb 2026), GAMP 5 2nd Edition  

---

## 1. Regulatory Rationale

Multi-tenant cloud SaaS systems rely on a shared-responsibility model. The software vendor validates the core platform software development lifecycle (SDLC), technical controls, and cloud infrastructure. The regulated customer evaluates the software for their specific intended use, establishes operational procedures, and administers user privileges.

---

## 2. Complete Shared Responsibility Matrix

| Quality System & Assurance Activity | Arlo SaaS Vendor | Customer Device Manufacturer |
| :--- | :---: | :---: |
| **Software Architecture & Core SDLC** | **LEAD (100%)** | Review Vendor Evidence |
| **Platform Unit, Integration & Regression Testing** | **LEAD (100%)** | Review Vendor Evidence |
| **21 CFR Part 11 Technical Controls (Audit & E-Sign)** | **LEAD (100%)** | Authorize Internal Signers |
| **Multi-Tenant Data Isolation & Query Boundaries** | **LEAD (100%)** | Enforce User Access Controls |
| **Cloud Infrastructure, Physical Security & Uptime** | **LEAD (100%)** | Review SOC2 / Vendor Audit |
| **Platform Requirements Traceability Matrix (RTM)** | **LEAD (100%)** | Adopt into Validation Master File |
| **Customer Specific Intended Use Evaluation** | Support via Pack A | **LEAD (100%)** |
| **Customer Quality SOPs (Complaints, CAPA, Vigilance)**| Non-applicable | **LEAD (100%)** |
| **Customer Organization User Roles & Privileges (Clerk)**| Provide RBAC Framework | **LEAD (100%)** |
| **Custom Investigation Checklists & Template Definition**| Provide Template Engine | **LEAD (100%)** |
| **Internal Employee Training & Qualifications** | Provide Documentation | **LEAD (100%)** |
| **Formal Statutory Submissions to Authorities (Eudamed/FDA)**| Generate MIR Form | **LEAD (100%)** |
| **Supplier Qualification of Arlo as an eQMS Vendor** | Provide Vendor Audit Pack | **LEAD (100%)** |
| **Final Computer Software Assurance Validation Conclusion** | Provide Evidence | **LEAD (100%)** |

---

## 3. Recommended Customer Validation Action Plan

To establish defensible validation in your medical device quality management system:

1. **Incorporate Pack A into Design History / Quality Records:**  
   Download the **Software Assurance & Validation Support Package** and file it in your Electronic Document Management System (eDMS) as vendor objective evidence.
2. **Export Pack B (Configuration Baseline):**  
   Navigate to `Settings` $\rightarrow$ `Software Assurance` in Arlo and download your organization's dynamic `instance-baseline.json`. This proves your configuration to auditors.
3. **Execute Intended Use Assessment:**  
   Document an internal validation summary sheet confirming that Arlo’s documented intended use matches your standard operating procedures for complaints and CAPAs.
4. **Approve User Access Baseline:**  
   Verify that QA Managers, Investigators, and Admins in Clerk are assigned strictly in accordance with their job descriptions and training.
