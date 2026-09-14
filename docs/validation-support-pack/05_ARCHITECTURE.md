# 05. Software Design Specification (SDS) & Architecture

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-05  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  

---

## 1. Architectural Principles

Arlo is designed following modern enterprise architecture standards with zero trust, defense-in-depth, and strict data boundary enforcement:

1. **Stateless Server Architecture:** Next.js Server Components and Server Actions run statelessly in isolated Node.js execution environments.
2. **Server-Side Authorization:** Every action validates authentication and organization membership on the server before database interaction.
3. **Database Transaction Atomicity:** Relational mutations and audit records are wrapped in Prisma `$transaction` blocks to ensure complete atomicity.

---

## 2. Request Lifecycle & Authorization Gate

For every customer request, the execution flow follows strict security gating:

```
                  CUSTOMER REQUEST (HTTPS)
                             │
                             ▼
               [ 1. CLERK SESSION VERIFIED ]
               Validates JWT signature & expiry
                             │
                             ▼
               [ 2. ORGANIZATION IDENTIFIED ]
               Extracts active Clerk `orgId`
                             │
                             ▼
               [ 3. RBAC PERMISSION CHECK ]
               Evaluates role via `requireOrgAuth`
                             │
                             ▼
             [ 4. TENANT SCOPE INJECTION ]
             Appends `orgId: authContext.orgId`
                             │
                             ▼
             [ 5. BUSINESS RULE & IMMUTABILITY ]
             Rejects if record is CLOSED
                             │
                             ▼
              [ 6. TRANSACTIONAL COMMIT ]
              Writes entity + emits AuditLog event
```

---

## 3. Key Design Modules

### 3.1 Tenant Isolation Engine (`lib/auth-guard.ts`)
The `requireOrgAuth` function acts as the central gatekeeper. If a session is missing or belongs to a different organization, execution halts immediately with an unauthorized error. No multi-tenant query can omit `orgId`.

### 3.2 Immutability Guard (`actions/complaint/updateComplaint.ts`)
When an update is requested, the system verifies the complaint’s current stage. If `status === "CLOSED"`, mutations are blocked at the database level:
```typescript
if (existingComplaint.status === ComplaintStatus.CLOSED) {
  throw new Error("Complaint is closed and cannot be modified.");
}
```

### 3.3 Active Lease-Locking Engine (`lib/record-lock.ts`)
To prevent data collisions when multiple quality engineers inspect the same record, Arlo uses a lease-based locking mechanism with automated expiration (TTL: 120 seconds) and continuous heartbeat refresh.
