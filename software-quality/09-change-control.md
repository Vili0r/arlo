# 09. Software Development Lifecycle (SDLC) & Change Control Procedure

**Document ID:** SQ-DOC-009  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Regulatory Standards:** ISO 13485:2016 Clause 7.3.9 (Control of Design & Development Changes), FDA 21 CFR 820.30(i)  

---

## 1. Controlled SDLC Workflow

Arlo follows a controlled, risk-based, agile software development lifecycle designed to move quickly while maintaining rigorous compliance with medical device standards:

```
[1. PLAN / ISSUE]
  Define the user story, bug, or regulatory change.
        │
        ▼
[2. REQUIREMENTS & RISK IMPACT]
  Assign or update Requirement ID (REQ-xxx).
  Classify change risk: HIGH, MEDIUM, or LOW.
        │
        ▼
[3. DESIGN & IMPLEMENTATION]
  Write code in branch; adhere to architectural guards (`requireOrgAuth`, immutable audit).
        │
        ▼
[4. PEER CODE REVIEW (PR)]
  Pull request requires peer review & approval. Branch protection rules enforced.
        │
        ▼
[5. AUTOMATED VERIFICATION GATE]
  Automated Vitest test suites + Traceability check (`npm run test:traceability`).
  All tests must pass (zero tolerance for regressions).
        │
        ▼
[6. RELEASE SIGN-OFF & DEPLOYMENT]
  Record release in `08-release-history.md`.
  Tag git commit; deploy to staging/production.
        │
        ▼
[7. CUSTOMER NOTIFICATION]
  Publish release notes and validation support package to customers.
```

---

## 2. Change Risk Assessment & Gating Rules

Every change must be categorized before merge:

| Change Category | Examples | Required Verification & Approvals |
| :--- | :--- | :--- |
| **High Risk** | Changes to `lib/actions/esignature.ts`, `lib/auth-guard.ts`, `lib/audit.ts`, `lib/record-lock.ts`, database schema migrations (`prisma/schema.prisma`), stage progression logic. | • Peer Code Review<br>• Automated regression test suite pass<br>• Updated or added test case in `tests/`<br>• Traceability matrix updated<br>• QA / Regulatory Lead sign-off |
| **Medium Risk** | Changes to complaint intake forms, customer communication templates, export formatters, sample fields. | • Peer Code Review<br>• Automated test suite pass<br>• Unit/integration test update |
| **Low Risk** | Styling tweaks, dark mode adjustments, typo corrections in UI labels, documentation updates. | • Peer Code Review<br>• Automated build & lint check |

---

## 3. Pull Request (PR) Quality Checklist

Before any Pull Request is merged into the `main` branch, the developer must verify:

- [ ] **Requirement Trace:** Does this PR link to an existing or new requirement in `02-requirements.md`?
- [ ] **Risk Assessment:** Has the risk tier (High / Medium / Low) been documented in the PR description?
- [ ] **Automated Tests:** Are all 24 Vitest suites passing locally and in CI?
- [ ] **Audit Trail Preserved:** If an entity is updated or created, is an audit log record emitted?
- [ ] **Tenant Isolation:** Are all database queries partitioned by `orgId` via `requireOrgAuth`?
- [ ] **Closed Record Protection:** Does the change respect the immutability of closed complaints?
- [ ] **Traceability Matrix Updated:** Has `npm run test:traceability` run and updated `05-traceability.md`?
