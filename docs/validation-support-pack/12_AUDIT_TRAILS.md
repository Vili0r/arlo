# 12. 21 CFR Part 11 Audit Trail Specification

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-12  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Regulatory Standards:** 21 CFR Part 11.10(e), ISO 13485:2016 Clause 4.2.5  

---

## 1. Regulatory Requirement

Under **21 CFR Part 11.10(e)**, computerized systems must employ secure, computer-generated, time-stamped audit trails to independently record the date and time of operator entries and actions that create, modify, or delete electronic records.

---

## 2. Audit Trail Data Model

Audit records are stored in the dedicated `AuditLog` database table. The table is append-only: application permissions do not permit `UPDATE` or `DELETE` operations on this table.

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  orgId       String   // Multi-tenant partition key
  complaintId String?  // Optional foreign key to parent complaint
  entityType  String   // "Complaint", "Investigation", "CAPA", "MIR"
  entityId    String   // Identifier of mutated record
  action      String   // "CREATE", "UPDATE", "STATUS_CHANGE", "ESIGNATURE"
  actorId     String   // Clerk User ID
  actorEmail  String?  // Snapshotted actor email
  actorRole   String?  // Snapshotted role at time of action
  diff        Json?    // Detailed field-level changes { field, old, new }
  reason      String?  // Optional user-supplied rationale
  createdAt   DateTime @default(now()) // Contemporaneous server timestamp
}
```

---

## 3. Captured Audit Events

The system automatically emits audit events on:
- **Record Intake:** Initial complaint creation, initial subrecords provisioning.
- **Field Modifications:** Edits to complaint priority, description, complainant info, device model, or lot number.
- **Stage Transitions:** Moving from `INTAKE` $\rightarrow$ `INVESTIGATION` $\rightarrow$ `VIGILANCE` $\rightarrow$ `CLOSED`.
- **Investigation Updates:** Checklist task checks, root-cause assignment, investigation completion.
- **Vigilance Decisions:** Reportability changes, MIR Initial/Final form state updates.
- **CAPA Linking:** Bidirectional complaint-to-CAPA linkage initiation and removal.
- **Electronic Signatures:** Formal Part 11 approval sign-offs with manifest meaning.

---

## 4. Audit History Drawer & Inspection Review

Users and regulatory auditors inspect the audit trail through the **Audit History Drawer** component (`components/audit/audit-history-drawer.tsx`):
- Entries are rendered in reverse-chronological order.
- Each entry visually displays **WHO** (actor name/email), **WHAT** (action and field diffs showing before and after values), **WHEN** (UTC timestamp formatted to local timezone), and **WHY** (stated reason or approval meaning).
- Export bundles include the complete, unmodified audit trail history in JSON and CSV formats.
