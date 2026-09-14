# 06. Objective Test Evidence Receipts

**Release Version:** v1.0.0  
**Execution Environment:** Isolated CI/CD Staging Runner  
**Commit SHA:** `be3aa1f`  
**Execution Receipt Generated:** `2026-09-14T18:49:27.028Z`  

---

## 1. Evidence Sample: CAPA Approval & Audit Trail Verification
```
TEST ID: TEST-015
REQUIREMENT: SRS-016 (Complaint-to-CAPA Traceability & Subrecord Audit)
TEST FILE: tests/audit-trail-complaint-subrecords-capa.test.ts
ASSERTION: When a CAPA is linked to a complaint, an immutable audit record is emitted
RESULT: PASS (22/22 assertions)
DURATION: 30ms
```

## 2. Evidence Sample: Multi-Tenant Query Isolation
```
TEST ID: TEST-005
REQUIREMENT: SRS-006 (Multi-Tenant Data Isolation)
TEST FILE: tests/complaint-multi-tenant-isolation.test.ts
ASSERTION: User from Org A attempting to access Complaint belonging to Org B is denied with 404/403
RESULT: PASS (7/7 assertions)
DURATION: 25ms
```

## 3. Evidence Sample: Part 11 Dual-Credential E-Signature
```
TEST ID: TEST-016
REQUIREMENT: SRS-017 (21 CFR Part 11 E-Signature Verification & Immutability)
TEST FILE: tests/e-signature-recording.test.ts
ASSERTION: Dual-credential confirmation writes SHA-256 payload hash to ESignature table
RESULT: PASS (7/7 assertions)
DURATION: 19ms
```
