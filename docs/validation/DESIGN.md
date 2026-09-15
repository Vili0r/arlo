# Software Design Specification (SDS)

**System Name:** Arlo Complaint Management & Vigilance & CAPA Management SaaS  
**Document ID:** SDS-ARLO-001  
**Version:** 1.0.0  
**Parent Document:** [SRS.md](file:///Users/viliorcuni/Desktop/arlo/docs/validation/SRS.md)

---

## 1. Architectural Overview
Arlo is built on Next.js App Router (React 19 Server Components & Actions), Prisma ORM with PostgreSQL, Clerk for Multi-Tenant Identity & RBAC, and Vitest for automated verification.

---

## 2. Design Units & Modules

| Design ID | Component Name | Implementation Files | Responsibilities |
| :--- | :--- | :--- | :--- |
| **DESIGN-001** | Complaint Intake Engine | `lib/actions/complaints.ts`<br>`components/complaints-view.tsx` | Atomic transaction creating Complaint, Vigilance, Investigation, and Communication records. |
| **DESIGN-002** | Validation Schema | `lib/validations/` | Zod validation schemas enforcing mandatory complaint input parameters. |
| **DESIGN-003** | Numbering Service | `lib/utils.ts`<br>`lib/actions/complaints.ts` | Atomic sequence generator generating `CMP-YYYY-XXXX` per tenant and calendar year. |
| **DESIGN-004** | Complaint State Machine | `lib/actions/complaints.ts` | Finite state machine controlling transitions: INTAKE $\rightarrow$ INVESTIGATION $\rightarrow$ VIGILANCE $\rightarrow$ CLOSED. |
| **DESIGN-005** | Immutability Guard | `actions/complaint/updateComplaint.ts`<br>`lib/actions/complaints.ts` | Guard function `assertComplaintMutable` preventing mutation of closed complaint entities. |
| **DESIGN-006** | Multi-Tenant Partitioning | `lib/auth-guard.ts`<br>`prisma/schema.prisma` | Org authentication guard `requireOrgAuth` scoping all Prisma queries by `orgId`. |
| **DESIGN-007** | Investigation Service | `lib/actions/investigations.ts`<br>`components/custom-investigation-section.tsx` | Investigation status transitions, task checklists, and findings recording. |
| **DESIGN-008** | Concurrency Lock Engine | `lib/record-lock.ts`<br>`app/api/record-locks/` | TTL-based heartbeat leasing mechanism for conflict-free multi-user editing. |
| **DESIGN-009** | Vigilance Decision Service | `lib/actions/vigilance.ts`<br>`components/vigilance-view.tsx` | Evaluates adverse event criteria, manages reportability flags, and logs rationale. |
| **DESIGN-010** | MIR Lifecycle Controller | `lib/actions/mir.ts`<br>`components/final-mir-form.tsx` | Initial and Final MIR forms management with closure prerequisite validation. |
| **DESIGN-011** | Communication Manager | `lib/actions/communications.ts`<br>`components/communication-details.tsx` | Manages customer communication threads, stage transitions, and timestamps. |
| **DESIGN-012** | Customer Report Generator | `lib/actions/customer-report.ts`<br>`components/customer-report-modal.tsx` | Aggregates complaint data into clean, exportable customer summary letters. |
| **DESIGN-013** | Sample Management Service | `lib/actions/samples.ts`<br>`components/sample-management.tsx` | Tracks sample receipt, tracking numbers, physical condition, and lab findings. |
| **DESIGN-014** | Entity Lock Registry | `hooks/use-record-lock.ts`<br>`lib/record-lock.ts` | Polymorphic record locking supporting Complaint, Investigation, MIR, and Communications. |
| **DESIGN-015** | Audit Trail Viewer | `components/audit/audit-history-drawer.tsx`<br>`app/[orgSlug]/audit-trail/page.tsx` | Chronological audit log UI displaying user attribution, timestamps, and diff snapshots. |
| **DESIGN-016** | Nested Audit Tracker | `lib/audit.ts`<br>`utils/auditDiff.ts` | Automatically generates deep diffs and records audit logs across all related sub-entities. |
| **DESIGN-017** | 21 CFR Part 11 E-Signature | `lib/actions/esignature.ts`<br>`components/audit/ESignatureModal.tsx` | Dual-credential re-authentication, reason validation, and SHA-256 hash manifestation. |
| **DESIGN-018** | RBAC Authorization Guard | `lib/auth-guard.ts` | Evaluates Clerk roles and permission sets (`org:complaints:create`, `org:audit:view`, etc.). |
| **DESIGN-019** | Regulatory Export Service | `lib/actions/exports.ts`<br>`app/[orgSlug]/settings/exports/page.tsx` | Generates compliant CSV and JSON data packages for FDA and ISO 13485 audits. |
| **DESIGN-020** | CAPA Phase & Planning Architecture | `lib/actions/capa.ts`<br>`components/capa-edit-form.tsx` | Enforces 6-stage CAPA state machine (`INITIATION` $\rightarrow$ `INVESTIGATION` $\rightarrow$ `PLANNING` $\rightarrow$ `IMPLEMENTATION` $\rightarrow$ `EFFECTIVENESS` $\rightarrow$ `CLOSED`) with segregated `CapaPlanning` and `CapaImplementation` subrecords. |
