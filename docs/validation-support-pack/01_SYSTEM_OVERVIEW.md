# 01. System Architecture & Overview

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-01  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  

---

## 1. System Description

Arlo is a high-reliability, multi-tenant cloud Software-as-a-Service (SaaS) application designed specifically for medical device manufacturers and regulated life-sciences organizations. It centralizes complaint handling, vigilance reporting (including EU MDR MIR forms), root cause investigations, and corrective and preventive actions (CAPA).

### Key Technical Attributes:
- **Deployment Model:** Fully managed multi-tenant Cloud SaaS
- **Application Framework:** Next.js 16 (React 19 Server Components & Server Actions)
- **Identity & Authentication:** Clerk Identity Provider (OIDC/JWT with MFA support)
- **Primary Database:** PostgreSQL with Prisma ORM
- **Object Storage:** Secure Cloud Blob Storage for document and sample photo attachments
- **Record Concurrency:** Active distributed lease-locking engine preventing colliding edits

---

## 2. High-Level Architecture Diagram

```
                             CUSTOMER USERS (Web Browser)
                                         │
                                         ▼ HTTPS / TLS 1.3
                                ┌─────────────────┐
                                │ CLERK IDENTITY  │
                                │ Authentication  │
                                │ MFA & Sessions  │
                                └────────┬────────┘
                                         │ Validated JWT Session
                                         ▼
                     ┌───────────────────────────────────────┐
                     │          NEXT.JS APPLICATION          │
                     │          (Server Components)          │
                     ├───────────────────┬───────────────────┤
                     │   Tenant Context  │   RBAC Guard      │
                     │  (orgId Scoping)  │  (requireOrgAuth) │
                     └───────────────────┼───────────────────┘
                                         │
     ┌───────────────────────────────────┼───────────────────────────────────┐
     ▼                                   ▼                                   ▼
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│    COMPLAINTS    │            │  INVESTIGATIONS  │            │  CAPA ESCALATION │
│  • Unique Intake │            │  • Root Cause    │            │  • Linked Action │
│  • Stage Gates   │            │  • Checklists    │            │  • Approvals     │
│  • Vigilance MIR │            │  • Concurrency   │            │  • Effectiveness │
└────────┬─────────┘            └────────┬─────────┘            └────────┬─────────┘
         │                               │                               │
         └───────────────────────────────┼───────────────────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │     21 CFR PART 11 AUDIT SUBSYSTEM    │
                     │  • Append-only immutable log          │
                     │  • Dual-credential E-Signatures       │
                     │  • SHA-256 payload fingerprinting     │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │          POSTGRESQL DATABASE          │
                     │    All tables partitioned by orgId    │
                     └───────────────────────────────────────┘
```

---

## 3. Technology Stack & Component Inventory

| Component Layer | Technology | Primary Role in System |
| :--- | :--- | :--- |
| **Client / Web UI** | React 19, Tailwind CSS, Lucide Icons, Shadcn UI | Accessible, high-contrast, responsive interface for complaint intake, review, and signing. |
| **Application Server** | Next.js 16 (Node.js runtime) | Type-safe Server Actions enforcing transactional boundaries, business logic, and audit trail emission. |
| **Authentication Provider**| Clerk (`@clerk/nextjs`) | Enterprise federated authentication, user credential management, session issuance, and MFA. |
| **Data Persistence** | PostgreSQL + Prisma ORM | Relational data persistence with strict foreign key constraints, unique indexing, and tenant isolation. |
| **File Storage** | Cloud Object Storage (Vercel Blob) | Encrypted storage of complaint attachments, investigation photos, and customer correspondence. |
| **Automated Verification** | Vitest Engine | Continuous unit, integration, and RBAC verification test suites executing in CI/CD. |

---

## 4. Multi-Tenant Partitioning Model

Arlo enforces logical tenant isolation at the application and database layers:
1. Every authenticated user session is scoped to an active Clerk Organization (`orgId`).
2. Every business entity in the database (`Complaint`, `Investigation`, `CAPA`, `AuditLog`) contains a mandatory foreign key `orgId`.
3. Every database operation passes through the `requireOrgAuth` security helper (`lib/auth-guard.ts`), which injects the verified `orgId` into the query filter:
   ```typescript
   // Deterministic multi-tenant query filter
   where: {
     id: entityId,
     orgId: authContext.orgId // Prevents cross-tenant access
   }
   ```
4. Cross-tenant leakage is tested and prevented by dedicated automated isolation tests (`tests/complaint-multi-tenant-isolation.test.ts`).
