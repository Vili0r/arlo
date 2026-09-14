# 10. Security Architecture & Identity Provider (Clerk)

**Product Name:** Arlo Quality Management Platform  
**Document Identifier:** VAL-PACK-1.0.0-DOC-10  
**Version:** 1.0.0  
**Effective Date:** 2026-09-14  

---

## 1. Authentication & Identity Architecture

Arlo utilizes **Clerk** as its identity and authentication infrastructure. This provides enterprise-grade identity controls, MFA, token rotation, and organization scoping:

```
    [ CUSTOMER USER ]
           │
           ▼ HTTPS (TLS 1.3)
    [ CLERK IDENTITY ]
      • User Authentication (Password / SAML SSO)
      • Multi-Factor Authentication (MFA / TOTP)
      • Cryptographically Signed JWT Sessions
      • Organization Membership Resolution (`orgId`)
           │
           ▼ Authenticated JWT Payload
    [ ARLO APPLICATION SERVER ]
      • Server-side token validation via `@clerk/nextjs/server`
      • Role extraction (`orgRole`)
      • Scoping of all Prisma DB queries to `orgId`
           │
           ▼
    [ ISOLATED CUSTOMER DATA ]
```

---

## 2. Division of Security Responsibilities

| Dimension | Managed by Clerk Identity Provider | Enforced by Arlo Application Server |
| :--- | :--- | :--- |
| **Authentication** | Password hashing (Argon2/bcrypt), credential validation, MFA challenges, session timeouts. | Validating session tokens on every server action. |
| **Organizations** | Customer tenant creation, user invitations, domain matching, enterprise SSO. | Storing and scoping all entities to `orgId`. |
| **Authorization** | Assigning organization roles (`org:admin`, `org:qa_manager`, `org:quality_engineer`). | Enforcing permissions per action (`requireOrgAuth`). |
| **Segregation of Duties**| Maintaining distinct user identities across roles. | Blocking investigators from approving their own investigations. |
| **Audit Context** | Providing actor identity (`userId`) and email. | Recording actor identity into immutable audit log rows. |

---

## 3. Role-Based Access Control (RBAC) Matrix

| System Permission | `org:admin` | `org:qa_manager` | `org:quality_engineer` | `org:vigilance_lead` | `org:member` | `org:read_only` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Create Complaint** | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| **Edit Investigation** | ✓ | ✓ | ✓ | — | — | — |
| **Vigilance Decision** | ✓ | ✓ | — | ✓ | — | — |
| **Part 11 E-Signature** | — | ✓ | — | — | — | — |
| **Close Complaint** | — | ✓ | — | — | — | — |
| **Initiate CAPA** | ✓ | ✓ | ✓ | — | — | — |
| **Generate Exports** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Manage Tenant Settings**| ✓ | — | — | — | — | — |

---

## 4. Network & Transport Encryption

- All communications require **HTTPS with TLS 1.3** encryption in transit.
- Database connections use SSL/TLS encryption (`sslmode=require`).
- Sensitive environment keys (`CLERK_SECRET_KEY`, `DATABASE_URL`) are isolated on server runtimes and never exposed to client browsers.
