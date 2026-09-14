# 07. Test Evidence & Automated Execution Receipts

**Document ID:** SQ-DOC-007  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Regulatory Standards:** 21 CFR 820.198, 21 CFR Part 11, ISO 13485:2016 Clause 4.1.6  

---

## 1. Overview & Purpose

This directory serves as the controlled repository for software verification and validation (V&V) execution records, automated test results, and release test evidence.

Under FDA Computer Software Assurance (CSA), automated test execution outputs (e.g., test suite JSON logs, execution timestamps, pass/fail tallies, and git commit SHA bindings) constitute formal objective evidence of software verification.

---

## 2. Directory Structure

```
software-quality/07-test-evidence/
├── README.md                           # This document (Evidence protocol)
├── latest-execution-summary.json       # Machine-readable output from Vitest
└── release-v1.0.0-evidence.md          # Formal sign-off evidence for baseline release
```

---

## 3. Evidence Generation Protocol

To regenerate and stamp test evidence prior to any production release:

1. Ensure the PostgreSQL test database is reachable.
2. Execute the automated verification & traceability pipeline:
   ```bash
   npm run test:traceability
   ```
3. The script executes the entire Vitest suite, verifies 100% of requirement mappings, generates `latest-execution-summary.json`, and updates `05-traceability.md`.
4. Capture the git commit hash and append the summary into the release record in `08-release-history.md`.
