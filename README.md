# ResourceDrop

ResourceDrop is a modern, full-stack Next.js web application designed for secure project management, team collaboration, and automated resource provisioning. It allows administrators to create projects, invite team members, securely distribute documents, and manage incoming requests for third-party resources (like GitHub, AWS, and GCP access).

## 🚀 Features

- **Role-Based Access Control (RBAC):** Strict isolation between `ADMIN` and `TEAM_MEMBER` roles.
- **Secure Authentication:** Custom email/password authentication using Auth.js (NextAuth v5) and Argon2 hashing.
- **Invitation System:** Secure, time-limited token-based email invitations for onboarding new members.
- **Resource Request Engine:** Members can request access to external platforms (AWS, GitHub, VPN, etc.), which admins can approve and provision securely.
- **Direct-to-Edge Document Uploads:** Direct client uploads utilizing Vercel Blob to securely attach files to projects without proxying large files through the Node server.
- **Comprehensive Audit Logging:** Advanced tracking of all system actions (user creation, project assignments, auth events) filterable by Date, Actor, and Target Entity.
- **Transactional Emails:** Asynchronous, fire-and-forget email delivery for lifecycle events (invitations, project assignments, request updates) via Brevo.
- **Daily Digest Cron Jobs:** Automated daily emails notifying admins of pending resource requests requiring attention.
- **Performance Optimized:** Uses Vercel Speed Insights, React Compiler, parallelized query waterfalls, and a serverless database connection pooler.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions, React Compiler enabled)
- **Styling:** Tailwind CSS v4, Base UI, Lucide Icons
- **Database:** Neon Serverless Postgres (`@neondatabase/serverless`)
- **ORM:** Prisma v7
- **Storage:** Vercel Blob
- **Email:** Brevo API
- **Auth:** Auth.js (NextAuth v5)
- **Validation:** Zod & React Hook Form
- **Analytics:** Vercel Speed Insights

---

## 💻 Local Development Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
- Node.js (v20+)
- A Neon Serverless Postgres Database (or standard Postgres)
- A Vercel Blob Store (Public access)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and populate it with the required configuration:

```env
# Database (Neon Serverless using the -pooler connection string)
DATABASE_URL="postgresql://user:password@ep-your-db-pooler.region.aws.neon.tech/resourcedrop?sslmode=require"

# Direct Database Connection (For Prisma migrations/pushes)
DIRECT_URL="postgresql://user:password@ep-your-db.region.aws.neon.tech/resourcedrop?sslmode=require"

# Authentication (Generate via `npx auth secret`)
AUTH_SECRET="your-auth-secret"

# App URL (Optional, defaults to localhost locally, inferred automatically on Vercel)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Vercel Blob Storage Config
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_token..."

# Email Configuration (Brevo)
BREVO_API_KEY="your-brevo-api-key"
EMAIL_FROM_ADDRESS="noreply@resourcedrop.com"

# Cron Jobs
CRON_SECRET="your-secure-cron-secret"
```

### 4. Database Setup
Push the Prisma schema to your database and run the initial seed to create the default Admin account.

```bash
# Apply schema to DB (use push instead of migrate for Neon)
npx prisma db push

# Run the seed script
npm run seed
```
*(Check `prisma/seed.ts` for the default admin credentials generated).*

### 5. Start the Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser to log in.

---

## 🏗️ Architecture & Key Concepts

### Server Actions & Data Fetching
ResourceDrop heavily utilizes **React Server Components (RSC)** and **Next.js Server Actions**. All write operations (creating projects, submitting requests) happen securely on the server via `actions.ts` files, eliminating the need for traditional client-side API routes.

### Direct-to-Edge Uploads (Vercel Blob)
To prevent the Node.js server from bottlenecking during large file transfers, document uploads use the Vercel Blob `@vercel/blob/client` SDK:
1. Client requests a secure, temporary client token from the server via `/api/projects/[id]/upload-url`.
2. Server validates authorization and generates the upload token.
3. Client uploads the file directly to Vercel's global edge network.
4. Client receives the public blob URL and saves it to the database via Server Actions.

### Audit Logging
Every significant state change is tracked via `logAuditAction()` in `src/lib/audit.ts`.
Audit logs are append-only. To ensure UI speed, they are separated from the main transaction paths, and failure to write an audit log does not crash the system. 

### Fire-and-Forget Emails
The system uses an asynchronous email queue wrapper (`sendEmail` in `src/lib/email/index.ts`). If the Brevo API goes down, the `catch` block swallows the error so that core database transactions (like assigning a user to a project) are not rolled back.

### Daily Digest Cron Job
The `/api/cron/pending-requests` route acts as a webhook. It requires an `Authorization: Bearer <CRON_SECRET>` header to execute. In production, Vercel Cron automatically triggers this route every 24 hours at 9:00 AM Pakistan Time (configured via `vercel.json`).

---

## 📜 Scripts
- `npm run dev` - Starts the development server.
- `npm run build` - Compiles the application for production.
- `npm run start` - Starts the production server.
- `npm run lint` - Runs ESLint across the codebase.
- `npm run seed` - Populates the database with initial required data (roles, admin).

## 📄 License
This project is licensed under the MIT License.
