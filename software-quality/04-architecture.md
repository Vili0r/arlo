# 04. Technical, Authentication & Security Architecture

**Document ID:** SQ-DOC-004  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Standards:** FDA 21 CFR Part 11, ISO 13485:2016, SOC 2 Security Principles  

---

## 1. System Architecture Overview

Arlo is engineered using a modern, type-safe full-stack Next.js architecture hosted on secure cloud infrastructure with PostgreSQL as the relational data store:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / USER AGENT                             │
│       Next.js App Router (React 19 Server & Client Components)         │
│               Tailwind CSS / Lucide / Radix UI Primitives              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (TLS 1.3)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               AUTHENTICATION & IDENTITY LAYER (CLERK)                   │
│   • Multi-Factor Authentication (MFA) & Secure Session Tokens (JWT)   │
│   • Tenant Organization Scoping & User Role Assignment                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Validated Session & Org Claims
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                APPLICATION / BUSINESS LOGIC LAYER                      │
│                  (Next.js Server Actions & API)                        │
│                                                                        │
│   1. Identity Verification (`auth()`)                                  │
│   2. Org Scoping & Membership (`requireOrgAuth`)                       │
│   3. Role & Permission Guard (`requirePermission`)                     │
│   4. Active Record Lease Check (`assertRecordNotLocked`)               │
│   5. State Machine Gate Check (`isTransitionAllowed`)                  │
│   6. Segregation of Duties & Re-auth (`verifyCredentials` for Part 11) │
│   7. Transactional Execution (`prisma.$transaction`)                   │
│   8. Immutable Audit Trail Emission (`createAuditLog` + `diff`)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Parameterized SQL via Prisma ORM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (POSTGRESQL)                        │
│   • Multi-Tenant Tables with Mandatory `orgId` Foreign Keys            │
│   • Immutable, Append-Only `AuditLog` and `ESignature` Tables          │
│   • Row Versioning / Concurrency Lease Locks                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Authorization Pipeline (Clerk Integration)

For high-risk regulated operations (e.g. Complaint Closure, CAPA Approval, MIR Authorization), Arlo enforces a rigorous multi-stage security pipeline. It is not sufficient that "Clerk said the user is logged in"; the system requires six independent gates before executing any mutation:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  HIGH-RISK OPERATION VERIFICATION PIPELINE                    │
│                                                                              │
│  [Step 1: Authenticated]                                                     │
│   Clerk verifies JWT session token, validity timestamp, and device fingerprint│
│                                      │                                       │
│                                      ▼                                       │
│  [Step 2: Correct Organization]                                              │
│   Verify active `orgId` matches the tenant record; strictly isolated         │
│                                      │                                       │
│                                      ▼                                       │
│  [Step 3: Authorized Role & Permission]                                      │
│   Inspect user's role and granular permission token (e.g. `org:capa:approve`) │
│                                      │                                       │
│                                      ▼                                       │
│  [Step 4: Correct Workflow State]                                            │
│   Finite State Machine validates current status allows this transition       │
│                                      │                                       │
│                                      ▼                                       │
│  [Step 5: Segregation of Duties]                                             │
│   Enforce author != approver; re-authenticate dual credentials (Part 11)     │
│                                      │                                       │
│                                      ▼                                       │
│  [Step 6: Immutable Audit Record]                                            │
│   Record before/after snapshot, user ID, timestamp, and SHA-256 state hash    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Identity & Session Verification
Clerk provides secure, SOC 2 Type II compliant identity management. Every incoming server action invokes `auth()` from `@clerk/nextjs/server` to extract the cryptographically signed user session. Unauthenticated requests are rejected immediately with a 401 Unauthorized.

### 2.2 Organization Scoping (`requireOrgAuth`)
In `lib/auth-guard.ts`, the `requireOrgAuth(targetOrgId)` utility extracts the user's active organization ID from the verified Clerk session token and compares it against the requested entity's `orgId`:
```typescript
const { userId, orgId } = await auth();
if (!userId || !orgId) {
  throw new Error("UNAUTHORIZED: Active organization context required");
}
if (targetOrgId && orgId !== targetOrgId) {
  throw new Error("FORBIDDEN: Cross-tenant access attempted");
}
```
All database queries executed via Prisma explicitly include `where: { orgId }`, preventing horizontal privilege escalation across medical device manufacturer accounts.

### 2.3 Role-Based Access Control (RBAC) & Segregation of Duties
Roles are defined in `lib/auth-guard.ts`:
- `ADMIN` (`org:admin`)
- `QA_MANAGER` (`org:qa_manager`)
- `QA_APPROVER` (`org:qa_approver`)
- `QA_REVIEWER` (`org:qa_reviewer`)
- `QUALITY_ENGINEER` (`org:quality_engineer`)
- `COMPLAINT_INVESTIGATOR` (`org:complaint_investigator`)
- `CAPA_OWNER` (`org:capa_owner`)
- `VIGILANCE_LEAD` (`org:vigilance_lead`)
- `READ_ONLY` (`org:read_only`)

High-risk actions enforce segregation of duties: for example, a Quality Engineer who authors an investigation cannot act as the sole QA Approver for closing the complaint or approving a CAPA.

### 2.4 21 CFR Part 11 Electronic Signature Verification
For regulated approvals, `lib/actions/esignature.ts` enforces dual-credential re-authentication:
1. **User Identity:** Extracted from active session.
2. **Password Re-Verification:** The user must enter their current password, which is verified against Clerk's backend authentication service.
3. **Meaning of Signature:** The signer must select a valid regulatory intent (e.g., `APPROVAL`, `REVIEW`, `AUTHOR`).
4. **Data Integrity Manifestation:** A SHA-256 cryptographic digest of the record's current state is generated and written into the immutable `ESignature` database record alongside the signer's name, email, role, and UTC timestamp.

### 2.5 Tamper-Evident Audit Trail
Whenever an entity is modified:
1. The before-state is retrieved from PostgreSQL.
2. The mutation is executed inside a Prisma transaction (`prisma.$transaction`).
3. `generateAuditDiff(before, after)` calculates the exact field-level differences.
4. An append-only `AuditLog` row is created storing the entity ID, entity type, action (`CREATE`, `UPDATE`, `STAGE_TRANSITION`, `STATUS_CHANGE`), old/new JSON payloads, user ID, user display name, and timestamp.
5. The application code contains zero SQL delete statements or API endpoints for audit log records.

---

## 3. CAPA Lifecycle & Subrecord Architecture

The Corrective and Preventive Action (CAPA) module follows a 6-phase gated lifecycle compliant with 21 CFR 820.100 and ISO 13485:2016 8.5.2/8.5.3:

```
[INITIATION] ──▶ [INVESTIGATION] ──▶ [PLANNING] ──▶ [IMPLEMENTATION] ──▶ [EFFECTIVENESS] ──▶ [CLOSED]
```

### 3.1 Subrecord Data Segregation
To ensure strict separation between proposed plans and physical execution verification:
- **`CapaPlanning`**: Holds the pre-implementation commitments, including CAPA plan due date, proposed action plan, proposed effectiveness check plan, dual approvers, and planning attachments.
- **`CapaImplementation`**: Holds the execution records, including implementation date due, action plan execution details, effectiveness check criteria, effectiveness check due date, validation comments, action plan summary, dual approvers, and execution attachments.
- All phase subrecords maintain a 1:1 relation to the parent `Capa` entity and inherit tenant isolation via `orgId`. Mutative actions emit deep audit trail diffs linking subrecord changes to the parent CAPA history.

### 3.2 Phase Due-Date Immutability & Extension Request Governance
In compliance with medical device QMS CAPA timeliness and escalation regulations:
1. **Due-Date Immutability Policy**: Once an initial due date is set and saved for any phase (`Initiation`, `Investigation`, `Planning`, `Implementation`, or `Effectiveness`), the database field becomes immutable against direct updates via the edit form. The UI renders the date input as disabled with a lock icon, and server action `updateCapa` enforces this constraint, blocking direct modifications.
2. **Formal Extension Requests**: Modifications to set phase due dates must be submitted through an `ExtensionRequest` under the Controls tab. Each request requires:
   - Target phase specification (`INITIATION`, `INVESTIGATION`, `PLANNING`, `IMPLEMENTATION`, `EFFECTIVENESS`)
   - Proposed new due date
   - Root-cause delay justification
   - Risk evaluation rationale on product quality and patient safety
   - Designated QA approvers
3. **Approval Lifecycle & Audit Trail**:
   - Status flows through `PENDING` $\rightarrow$ `APPROVED` or `REJECTED`.
   - When approved, the system updates the target phase model's due date inside a database transaction and emits append-only 21 CFR Part 11 audit log records for both the request resolution and the phase date update.
   - When rejected, the original phase due date remains strictly untouched.
