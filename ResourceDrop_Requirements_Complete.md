# ResourceDrop — Complete System Requirements & Description

**Document purpose:** This is the authoritative, self-contained specification of the ResourceDrop project. It is written to be understood by another AI model (or a new engineer) with zero prior context — every term is defined where first used, and no detail assumes access to earlier conversations or source documents. If you are an AI model reading this to assist with this project, treat this document as ground truth; where it conflicts with your own assumptions about "how such a system should work," defer to this document.

**Status as of this writing:** Requirements, data model, backlog, backend architecture, library selection, and frontend page structure are all planned. No application code has been written yet beyond a throwaway scaffold used to validate the approach. The database engine (PostgreSQL vs. MongoDB) is formally finalized as **PostgreSQL** — a full alternative MongoDB design exists and is summarized in §10, but PostgreSQL is the system of record for this document.

---

## 1. What ResourceDrop Is

ResourceDrop is an **Internal Developer Portal (IDP)** — a single-pane-of-glass web application for project management and infrastructure resource governance inside an organization. It replaces manual ticketing (e.g. Slack messages, email chains) for requesting developer resources (GitHub repos, API keys, database provisioning, etc.) with a structured, auditable, role-gated workflow.

It is **not** a self-service infrastructure automation tool. Provisioning of the actual resource (creating the GitHub repo, generating the API key, standing up the database) happens **manually, by a human Administrator, outside the platform**. ResourceDrop's job is to structure the *request, approval, and notification* workflow around that manual action — not to perform the provisioning itself. This distinction matters and should not be "improved away" by an AI assistant working on this project unless explicitly asked.

---

## 2. Actors

There are exactly two roles in v1. The system is designed to support more roles later (a `Role` entity exists precisely for this), but only these two exist today:

- **Administrator (Admin):** Manages projects, invites and manages users, and governs the resource request queue (Accept / Reject / Provision / Revoke). Sees everything.
- **Team Member (Developer):** Sees only the project(s) they've been explicitly assigned to, their teammates on those projects, and the project's requirement documents. Submits and tracks their own resource requests.

Access control is strict RBAC. A Team Member must never be able to read or act on data belonging to a project they are not a member of — this is enforced not just by role, but by **row-level scoping** (checking actual project membership on every relevant query), because role-only checks do not prevent one Team Member from accessing another's project by guessing an ID.

---

## 3. Core Workflows

### 3.1 Identity, Invitation & Onboarding (closed-loop, invite-only — there is no open self-registration)

1. An Admin enters a new user's email (and username, and assigns their global role) into the platform.
2. The system generates a secure, single-use invitation token, stores only a hash of it, and sets the new user's account status to `INVITED`.
3. An automated email is sent (via SMTP) containing a registration link with the token.
4. The invited user opens the link, lands on a registration page with their email pre-filled and **immutable** (cannot be changed), and sets a password.
5. On successful registration, the account status becomes `ACTIVE`, the token is invalidated, and the user can log in.
6. Invitation tokens expire (7 days is the assumed default — not contractually fixed, but reasonable and already assumed in prior planning). An expired or already-used token must produce a clear, specific error — not a generic failure.
7. Upon login, the user is routed to a different dashboard depending on role: Admins to the Admin area, Team Members to their personal workspace.

### 3.2 The Administrator Experience

- **Project Initialization:** Admin creates a project with a unique name and a description, and uploads one or more requirement documents (PDF, Markdown, or DOCX), stored in object storage (S3 or an S3-compatible store — see §6). The file reference (not the file itself) is stored in the database.
- **Team Assignment:** Admin assigns existing active users to a project, and — critically — assigns each assignment a **project-scoped role** (distinct from the user's global role), since a user's permissions can differ per project.
- **User & Role Management:** Admin can suspend/reactivate user accounts, and manage the set of available roles (creating custom roles; built-in "system" roles cannot be edited or deleted).
- **Resource Governance Queue:** A centralized, filterable view of all resource requests. Admin actions:
  - **Accept** a Pending request.
  - **Reject** a Pending request (with an optional reason).
  - **Provision** an Accepted request — this is the step where the Admin, having manually created the actual resource outside the platform, records that fact in ResourceDrop (optionally attaching credential/config files), which is what triggers credential distribution and the "ready" notification to the requester.
  - **Revoke** a Provisioned resource — removes access/marks it inactive, notifies the affected user.
- Every state change is captured in an immutable history entry and triggers an automated email notification to the requester.

### 3.3 The Team Member Experience

- On login, sees only their assigned project(s) — never a global project list.
- Per project, can view: the project description, requirement documents (download via a short-lived, secure link — never a permanent public URL), and their fellow project members.
- Can browse a **global resource catalog** (categories → resource types, e.g. "Compute" → "GitHub Repo Setup", "API Keys", "Database Setup") and submit a request for a specific resource type against their project.
- Can **add a new resource type on the fly** if what they need isn't in the catalog — this immediately becomes available to every user in the global catalog (not just their own project). A new custom resource type must be assigned to a category (existing or new) — this is a hard requirement, not optional, because the underlying data model makes category assignment mandatory.
- Can view the full status and history of every request they've ever made, and can comment on an individual request (e.g. to answer an Admin's clarifying question).

### 3.4 Request Lifecycle (the state machine)

Every resource request moves through a strict, one-directional state machine:

```
PENDING → ACCEPTED → PROVISIONED
PENDING → REJECTED
PROVISIONED → REVOKED
```

Illegal transitions (e.g. approving an already-Rejected request, or provisioning something still Pending) must be rejected by the system, not merely discouraged by the UI. **This state machine must be enforced by exactly one code path in the entire system** — no endpoint or script should be able to mutate a request's status except through that single, tested function. This is treated as the single highest-risk area of the entire system, because every other feature (notifications, audit trail, provisioned-resource tracking) depends on this state machine being trustworthy.

Every transition:
1. Updates the request's status.
2. Appends an entry to that request's immutable status history (who changed it, from what, to what, when, and an optional note).
3. Triggers an automated SMTP email notification to the affected user.

All three of the above must succeed or fail together — a state change must never be recorded without its corresponding history entry and notification being queued, even if the notification's *delivery* later fails (delivery failure is handled separately — see §7).

---

## 4. Data Model (PostgreSQL — canonical)

The schema is finalized and should be treated as fixed unless the project has explicitly decided to change it. Entities (see the actual `schema.prisma` file for exact field types/constraints — this is the conceptual summary):

| Entity | Purpose | Key relationships |
|---|---|---|
| `User` | An account — email, username, password hash, invitation token (hashed), account status, global role, soft-delete flag | belongs to one `Role` |
| `Role` | Named permission set (e.g. ADMIN, TEAM_MEMBER); system roles are protected from edit/delete | referenced by `User.role_id` and `ProjectMember.project_role_id` |
| `Project` | A tracked project — name (unique), description, soft-delete flag | has many `ProjectDocument`, `ProjectMember`, `ResourceRequest` |
| `ProjectDocument` | An uploaded requirement file's metadata (S3 key, filename) | belongs to one `Project` |
| `ProjectMember` | Join entity: a user's membership on a project, with a project-scoped role | links `User` ↔ `Project`, references `Role` |
| `ResourceCategory` | Grouping for resource types (e.g. "Compute", "Storage") | has many `ResourceType` |
| `ResourceType` | A requestable resource kind; `is_custom` flags user-added types | belongs to one `ResourceCategory` |
| `ResourceRequest` | The core workflow entity — status, requester, project, resource type, notes, soft-delete flag | belongs to `Project`, `User` (requester), `ResourceType`; has many `RequestStatusHistory`, `RequestComment`, `Notification` |
| `RequestStatusHistory` | Immutable log of every status transition on a request | belongs to `ResourceRequest` |
| `RequestComment` | Free-text comments on a request (Admin ↔ Team Member communication) | belongs to `ResourceRequest`, `User` (author) |
| `ProvisionedResource` | Record of an actually-provisioned resource, created when a request reaches PROVISIONED; soft-delete flag marks revocation | belongs to `ResourceRequest`; has many `ResourceAttachment` |
| `ResourceAttachment` | File(s) attached to a provisioned resource (e.g. config, non-secret setup docs) | belongs to `ProvisionedResource` |
| `Notification` | A queued/sent notification to a user, tied to a request; tracks delivery type and delivery status | belongs to `User`, optionally `ResourceRequest` |
| `AuditLog` | Immutable record of sensitive actions (role changes, suspensions, provision/revoke) | free-standing, references actor and target |

**Enums:** `AccountStatus` (INVITED, ACTIVE, SUSPENDED), `RequestStatus` (PENDING, ACCEPTED, PROVISIONED, REJECTED, REVOKED), `DeliveryType` (EMAIL, IN_APP, or BOTH), `DeliveryStatus` (PENDING, SENT, FAILED).

**Soft deletes:** `User`, `Project`, `ProvisionedResource`, and `ResourceRequest` use a `deleted_at` timestamp rather than hard deletion. Every read query against these entities must filter out soft-deleted rows by default — this must be enforced structurally (e.g. an ORM-level extension/middleware), not left to per-query discipline, since a single forgotten filter is a real and quiet class of bug.

---

## 5. Explicitly Out of Scope (v1)

These were considered (they exist in comparable IDPs like Backstage and Port.io) but are **not** part of this project's committed scope, even though some of their supporting data structures already exist in the schema for forward-compatibility:

- **Credential vaulting** (e.g. AWS Secrets Manager integration) — credentials are not fetched from a vault in v1; the notification simply tells the user a resource is ready, and provisioning/credential-sharing details are handled by the Admin's attached files/notes.
- **Automated infrastructure provisioning** (e.g. opening PRs for infra-as-code, running Node.js scripts to auto-create software assets) — all actual provisioning remains a manual, human action by the Admin outside the platform, as stated in §1.
- Note: `AuditLog` exists in the schema and is recommended to actually be used for security-sensitive actions even though full compliance-grade audit logging was listed as "out of scope" — this is a deliberate, low-cost forward step, not scope creep.

---

## 6. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Application framework | Next.js (TypeScript) | Route Handlers used for the API layer, not (necessarily) Server Actions — see §8 |
| Database | PostgreSQL | Accessed via Prisma ORM |
| Object storage | Amazon S3, **or any S3-API-compatible store** | Presigned URLs for both upload and download; never proxy file bytes through the app server. Locally, or where real AWS access isn't yet available, MinIO (self-hosted, Docker) is the equivalent, requiring zero code changes — only an endpoint config differs. Cloudflare R2 and Backblaze B2 are equally valid S3-compatible hosted alternatives. |
| Auth | Auth.js (NextAuth v5), credentials provider against the `User` table; argon2id for password hashing | Sessions via signed, httpOnly cookies |
| Schema validation | Zod | Used at every API boundary; shares inferred types with Prisma |
| Background jobs | **BullMQ** (Redis-backed queue) | Required because email/notification delivery must never block a request handler. BullMQ needs a persistent Redis instance plus a long-running worker process — will not run inside a Vercel-style serverless function. |
| Email | Nodemailer (SMTP) + React Email for templates | Locally, Mailhog catches emails without sending anything real |
| Rate limiting | `rate-limiter-flexible` or `@upstash/ratelimit`, Redis-backed store | Same Redis instance as the job queue |
| Infrastructure | Redis | Backs both the job queue (BullMQ) and rate limiting |
| Logging / errors | Pino (structured logs) + Sentry | |
| Testing | Vitest, Testcontainers (real Postgres in tests), Supertest, Playwright | |

**Explicit choice:** Redis (via BullMQ for jobs, and a Redis-backed store for rate limiting) is a committed infrastructure dependency for this project — a Postgres-backed alternative (pg-boss / `rate-limiter-flexible` with a Postgres store) was considered earlier in planning specifically to avoid operating Redis, but that direction was superseded by this decision. An AI assistant should build against Redis/BullMQ as the current standard, not the earlier Postgres-only approach.

---

## 7. Reliability Requirements (non-functional, but binding)

These are treated as requirements, not aspirations:

1. **One function owns every request status transition.** No other code path may write to a request's status field.
2. **Every multi-entity write is transactional.** E.g., a status change + its history entry + its notification must be written atomically — never partially.
3. **No external call (SMTP send, S3 confirmation) blocks a request handler.** Emails are always sent via an enqueued background job, never inline.
4. **Row-level authorization on every query that returns project- or request-scoped data** — not just role-based route gating.
5. **File uploads are confirmed server-side** (e.g. a HEAD request to storage) before a database row is created referencing them — never trust a client's unconfirmed claim that an upload succeeded.
6. **Presigned URLs are short-lived and generated fresh per request** — never stored or cached long-term.
7. **Failed background jobs retry with backoff and land in a visible failed/dead-letter state** rather than silently disappearing.

---

## 8. API Surface (summary — ~34 endpoints total)

Full endpoint-by-endpoint detail exists in a separate API plan document; this is the structural summary an AI model needs to reason about the system correctly:

- **Auth:** login, logout, session check (handled by Auth.js).
- **Onboarding:** create invitation (Admin), verify invitation token, complete registration.
- **Access control:** role CRUD, user suspend/reactivate, user listing.
- **Projects:** CRUD, document upload (2-step: get presigned URL, then confirm), member assignment (with project-role).
- **Team workspace (read):** project detail, document download, member list, resource catalog browse, provisioned-resource list, attachment download.
- **Requests:** create, list own, admin queue (filterable), approve, reject, provision, revoke, status history, comments (read/write), custom resource-type creation.
- **Notifications:** list own, mark read (single and bulk).
- **Cross-cutting:** audit log read (Admin), health/readiness checks.

Every mutating endpoint that changes request status routes through the single state-machine function described in §3.4 / §7.

---

## 9. Frontend Structure (summary)

Two distinct navigation areas gated by role, converging on one shared "request thread" view:

- **Public:** login, invitation-based registration.
- **Admin area (8 pages):** dashboard, projects list/detail, users & roles, request governance queue, request detail (with approve/reject/provision/revoke actions), audit log.
- **Team Member area (5 pages):** dashboard (their projects), project detail (docs/team/catalog/provisioned resources), my requests, request detail (read + comment, no governance actions).
- **Shared:** notification bell (dropdown, not a page — jumps directly to the relevant request), account/password settings.
- The request detail page is **one shared component** across both roles, differentiated only by which action buttons render for the viewer's role — not two separately maintained pages.

---

## 10. Alternative Data Layer (MongoDB) — considered, not adopted

A complete non-relational redesign was evaluated as an alternative to §4, in case relational database access is ever unavailable. Summary for context, not current direction:

- `resourceRequests` would become a single aggregate document embedding its own status history, comments, and eventual provisioned-resource record — collapsing 4 relational tables into 1 collection and making most status-transition writes single-document atomic operations.
- `projectMembers` would remain a separate, dual-referenced collection (not embedded either direction) because it's queried from both the "who's on this project" and "which projects can this user access" directions equally.
- The catalog (`resourceCategories`/`resourceTypes`) stays referenced and relies on an application-level cache for read performance, same as the relational plan.
- The core trade-off: referential integrity (foreign-key-style guarantees) stops being enforced by the database and becomes an application-layer discipline — this was the deciding factor in staying with PostgreSQL for this project, given how relationship-heavy and workflow-driven the domain is.

**This section exists for completeness only.** Unless explicitly instructed otherwise, an AI model working on this project should build against §4 (PostgreSQL), not this section.

---

## 11. Guidance for AI Models Working on This Project

If you are an AI assistant picking up work on ResourceDrop from this document alone:

- Treat the state machine in §3.4 and the "one function owns every transition" rule in §7 as inviolable — this is the single most load-bearing constraint in the whole system.
- Redis is a committed infrastructure dependency (job queue via BullMQ, rate limiting) — do not revert to the earlier Postgres-only approach (pg-boss / Postgres-backed rate limiting) without flagging it as a deliberate architectural change; that direction was superseded.
- Do not treat "Out of Scope" items in §5 as implicitly approved just because supporting schema fields exist for some of them — they are forward-compatible placeholders, not features to build unprompted.
- The schema in §4 is finalized; propose changes rather than assuming you may alter it.
- Prefer asking which environment (local Docker/MinIO, or real cloud infra) is currently active before writing environment-specific code — this project has intentionally been built to make that swap require only configuration changes, and that property should be preserved.
