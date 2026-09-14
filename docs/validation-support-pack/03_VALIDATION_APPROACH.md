# 03. Computer Software Assurance (CSA) Validation Approach

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-03  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  

---

## 1. Regulatory Context: FDA CSA vs. Traditional CSV

Historically, Computer System Validation (CSV) focused heavily on generating static documentation, paper binders, and manual screenshots of software execution. In contrast, the **FDA's February 2026 Guidance on Computer Software Assurance for Production and Quality System Software** encourages a modern, risk-based paradigm:
- Focus testing effort on features with direct impact on device quality and patient safety.
- Leverage automated test execution receipts, continuous integration, and digital verification.
- Establish confidence through objective electronic evidence rather than redundant manual re-testing.

Arlo adheres strictly to this risk-based CSA framework.

---

## 2. Arlo Software Assurance Lifecycle

```
    [ 1. REQUIREMENTS ]
         │ Customer-relevant functional & regulatory requirements specified
         ▼
    [ 2. RISK ANALYSIS ]
         │ FMEA failure modes evaluated: High, Medium, or Low platform risk
         ▼
    [ 3. SECURE DESIGN ]
         │ Tenant isolation (`orgId`), RBAC guards, atomic database transactions
         ▼
    [ 4. PEER CODE REVIEW ]
         │ Mandatory branch protection & code review prior to merge
         ▼
    [ 5. AUTOMATED VERIFICATION ]
         │ Automated Vitest suites run in CI/CD against all requirements
         ▼
    [ 6. TRACEABILITY ENGINE ]
         │ scripts/traceability.mjs validates 100% bidirectional coverage
         ▼
    [ 7. CONTROLLED RELEASE ]
         │ Semver tagged, release notes generated, validation pack updated
```

---

## 3. Shared Responsibility Model

Software assurance in a multi-tenant cloud environment is a collaborative partnership between the SaaS vendor and the regulated device manufacturer:

```
┌────────────────────────────────────────────────────────────────────────┐
│ ARLO VENDOR ASSURANCE RESPONSIBILITY                                  │
│  ✓ Core Software SDLC & Architecture                                   │
│  ✓ Automated Regression Test Suites & Proof of Execution              │
│  ✓ Multi-Tenant Security & Organization Boundary Integrity             │
│  ✓ 21 CFR Part 11 Audit Trail & E-Signature Mechanics                  │
│  ✓ High-Availability Cloud Infrastructure & Automated Backups          │
│  ✓ Requirements Traceability Matrix Generation                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Pack A Delivered to Customer
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ CUSTOMER ASSURANCE RESPONSIBILITY                                      │
│  ✓ Verification that Arlo matches Internal Quality Procedures (SOPs)   │
│  ✓ Determination of Organization Roles and User Access (Clerk)         │
│  ✓ Configuration of Custom Investigation Templates and Workflows       │
│  ✓ User Training & Operational Readiness                               │
│  ✓ Internal Supplier Qualification of Arlo as a Critical eQMS Vendor   │
│  ✓ Final Formal Validation Conclusion & Release Sign-Off               │
└────────────────────────────────────────────────────────────────────────┘
```

This model is recognized and accepted by global regulatory authorities including the US FDA, Notified Bodies (TÜV SÜD, BSI, DEKRA), and competent authorities under ISO 13485:2016.
