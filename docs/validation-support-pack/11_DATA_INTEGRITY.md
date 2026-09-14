# 11. Data Integrity & ALCOA+ Principles

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-11  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Regulatory Standards:** FDA Data Integrity Guidance (21 CFR Part 211/820), WHO TRS 996 Annex 5 (ALCOA+)  

---

## 1. ALCOA+ Data Integrity Framework

Arlo enforces ALCOA+ principles across all quality record lifecycles:

| Principle | Regulatory Requirement | Arlo Architectural Implementation |
| :--- | :--- | :--- |
| **Attributable** | Every record or action must trace to the individual who created or modified it. | Every operation extracts the authenticated Clerk `userId` and writes it to `authorId`, `createdBy`, or `actorId`. System actions are uniquely flagged. |
| **Legible** | Records and audit trails must remain readable throughout their retention lifecycle. | Data stored in standard relational schema (PostgreSQL) and UTF-8 JSON; human-readable diffs rendered in the UI audit drawer. |
| **Contemporaneous** | Recorded at the exact moment of activity. | Timestamps generated automatically by server system time (`new Date()`) and PostgreSQL `now()` in UTC ISO-8601 format. Client-supplied clock values are ignored. |
| **Original** | Primary record or a verified true copy. | PostgreSQL relational tables maintain original record states; append-only audit trail logs every successive delta without in-place destruction. |
| **Accurate** | Truthful, verified, and protected against unintentional or malicious corruption. | Strong validation schemas (Zod) on all inputs; database foreign key constraints; closed-complaint immutability locks preventing post-closure changes. |
| **Complete** | No missing data, orphaned steps, or unrecorded deletions. | Subrecords (`Investigation`, `Vigilance`, `Comms`) created atomically in transaction; soft deletions or status changes recorded in audit logs. |
| **Consistent** | Chronological sequencing without gaps or conflicting edits. | Monotonic sequence counters for `CMP-YYYY-XXXX`; lease-based concurrency locking preventing race conditions. |
| **Enduring** | Stored safely on media capable of lasting for the entire retention period. | Managed cloud database with automated daily snapshots, point-in-time recovery (PITR), and geographic redundancy. |
| **Available** | Readily accessible for review and regulatory audit. | On-demand regulatory export bundles (JSON/CSV) generated in seconds for FDA or Notified Body inspectors. |

---

## 2. Closed Record Immutability Protection

A core requirement of 21 CFR Part 820.198 is that once a quality record is reviewed, approved, and closed, it cannot be quietly modified:
1. When a complaint reaches `status = "CLOSED"`, any subsequent call to `updateComplaint` is intercepted.
2. The server action throws an explicit error: `"Complaint is closed and cannot be modified."`
3. This behavior is continuously verified by automated tests (`tests/closed-complaint-modification-protection.test.ts`).
