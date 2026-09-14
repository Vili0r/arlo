# 02. Change Impact Assessment & Quality Record Impact

**Release Version:** v1.0.0  
**Document ID:** REL-CHG-001  
**Evaluation Standard:** FDA CSA Risk-Based Change Control, ISO 13485:2016 Clause 7.3.9  

---

## 1. Quality Record Impact Assessment

Because Arlo handles regulated medical device quality records, every release must explicitly assess its impact across ten critical dimensions:

| Quality Dimension | Release Impact | Risk Level | Required Verification & Controls |
| :--- | :---: | :---: | :--- |
| **1. Complaint Records** | **YES** | High | Input validation, sequential stage gate transitions, monotonic IDs. |
| **2. CAPA Records** | **YES** | High | Escalation linking, subrecord audit trails, phase progression. |
| **3. Audit Trails** | **YES** | Critical | Append-only database triggers, JSON field diffs, UTC timestamps. |
| **4. Approvals & E-Signatures** | **YES** | Critical | Dual-credential re-authentication, statutory meaning, SHA-256 state hash. |
| **5. Core Workflows** | **YES** | High | Sequential gates: INTAKE ➔ INVESTIGATION ➔ VIGILANCE ➔ CLOSED. |
| **6. User Permissions** | **YES** | High | Server-side role validation in `requireOrgAuth` (Clerk RBAC). |
| **7. Attachments & Storage** | **YES** | Medium | Secure object storage (Vercel Blob), MIME-type verification. |
| **8. Record History & Retention** | **YES** | Critical | Soft-deletion architecture (`deletedAt`), no destructive drops. |
| **9. Data Migration Integrity** | **YES** | High | Prisma schema migrations verified in isolated staging DB. |
| **10. Organization Isolation** | **YES** | Critical | Mandatory tenant query scoping (`where: { orgId }`). |

---

## 2. Change Item Classification

| Change ID | Title | Module | Platform Risk | Customer Action |
| :--- | :--- | :--- | :---: | :--- |
| **CHG-001** | Complaint Intake & Unique Numbering Engine | Complaints | High | Adopt standard intake SOP |
| **CHG-002** | Investigation Checklists & Concurrency Leasing | Investigations | Medium | Configure custom templates |
| **CHG-003** | EU MDR Vigilance Decision Tree & MIR Forms | Vigilance | High | Review reportability tree |
| **CHG-004** | Dual-Credential Part 11 Electronic Signatures | E-Signatures | Critical | Authorize QA signers |
| **CHG-005** | Multi-Tenant Data Isolation Guard | Security | Critical | Setup Clerk user roles |
