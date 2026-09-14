# 13. 21 CFR Part 11 Electronic Signature Assessment

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-13  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Regulatory Standards:** 21 CFR Part 11 Subpart C (Electronic Signatures), 21 CFR 11.50, 11.70  

---

## 1. Regulatory Assessment & Overview

Under FDA 21 CFR Part 11 Subpart C, electronic signatures must be the legally binding equivalent of traditional handwritten signatures. Arlo does not treat generic button clicks or form submissions as electronic signatures. Formal electronic signatures are executed through a dedicated, dual-credential re-authentication workflow.

---

## 2. Compliance Verification Matrix

| 21 CFR Part 11 Clause | Regulatory Requirement | Arlo Technical Implementation |
| :--- | :--- | :--- |
| **§11.50(a)(1)** | Printed name of the signer | The signer’s legal full name and verified email address are captured from the authenticated Clerk session and permanently manifested on the signed record. |
| **§11.50(a)(2)** | Date and time when signature was executed | Accurate, un-modifiable server-side timestamp (`DateTime @default(now())`) captured in UTC. |
| **§11.50(a)(3)** | The meaning associated with the signature | Explicit dropdown selection of approved statutory meanings: `APPROVAL`, `REVIEW`, `AUTHORSHIP`, `VERIFICATION`. |
| **§11.70** | Signature Linking & Tamper-Evidence | The signature record stores a cryptographic **SHA-256 hash** of the exact record payload at the second of signature. Any subsequent alteration invalidates hash verification. |
| **§11.200(a)(1)** | Dual distinct identification components | Signing requires both the active authenticated session component and an explicit re-authentication credential confirmation before execution. |

---

## 3. Electronic Signature Data Model

Electronic signatures are persisted in the `ESignature` table:

```prisma
model ESignature {
  id           String   @id @default(cuid())
  orgId        String   // Multi-tenant partition key
  entityType   String   // "Complaint", "CAPA", "MIR"
  entityId     String   // Linked entity identifier
  signerId     String   // Clerk user ID
  signerName   String   // Legal full name
  signerEmail  String   // Signer email address
  signerRole   String   // Role snapshot (e.g., "QA_MANAGER")
  meaning      String   // "APPROVAL", "REVIEW", etc.
  recordHash   String   // SHA-256 hash of signed record snapshot
  reason       String?  // Approval justification or comments
  signedAt     DateTime @default(now())
}
```

---

## 4. Verification Evidence

The electronic signature subsystem is verified by automated test suites (`tests/e-signature-recording.test.ts`), confirming:
1. Rejection of signature attempts by unauthorized roles.
2. Immutability of recorded signature entries.
3. Verification that modifying underlying complaint data breaks the recorded SHA-256 integrity hash.
