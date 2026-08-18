# ResourceDrop

ResourceDrop is a modern, full-stack Next.js web application designed for secure project management, team collaboration, and automated resource provisioning. It allows administrators to create projects, invite team members, securely distribute documents, and manage incoming requests for third-party resources (like GitHub, AWS, and GCP access).

## 🚀 Features

- **Role-Based Access Control (RBAC):** Strict isolation between `ADMIN` and `TEAM_MEMBER` roles.
- **Secure Authentication:** Custom email/password authentication using Auth.js (NextAuth v5) and Argon2 hashing.
- **Invitation System:** Secure, time-limited token-based email invitations for onboarding new members.
- **Resource Request Engine:** Members can request access to external platforms (AWS, GitHub, VPN, etc.), which admins can approve and provision securely.
- **Presigned Document Uploads:** Direct-to-storage document uploads utilizing MinIO (S3-compatible storage) to securely attach files to projects without hitting the Node server.
- **Comprehensive Audit Logging:** Advanced tracking of all system actions (user creation, project assignments, auth events) filterable by Date, Actor, and Target Entity.
- **Transactional Emails:** Asynchronous, fire-and-forget email delivery for lifecycle events (invitations, project assignments, request updates) via Brevo.
- **Daily Digest Cron Jobs:** Automated daily emails notifying admins of pending resource requests requiring attention.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions, React Compiler enabled)
- **Styling:** Tailwind CSS v4, Base UI, Lucide Icons, Framer Motion
- **Database:** PostgreSQL
- **ORM:** Prisma v7
- **Storage:** MinIO / AWS S3
- **Email:** Brevo API
- **Auth:** Auth.js (NextAuth v5)
- **Validation:** Zod & React Hook Form

---

## 💻 Local Development Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
- Node.js (v20+)
- PostgreSQL
- MinIO (or an AWS S3 bucket)

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables
Create a \`.env\` file in the root directory and populate it with the required configuration:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/resourcedrop"

# Authentication (Generate via \`npx auth secret\`)
AUTH_SECRET="your-auth-secret"

# MinIO / S3 Storage Config
MINIO_INTERNAL_ENDPOINT="localhost"
MINIO_PUBLIC_ENDPOINT="localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="resourcedrop"
MINIO_USE_SSL="false"

# Email Configuration (Brevo)
BREVO_API_KEY="your-brevo-api-key"

EMAIL_FROM_ADDRESS="noreply@resourcedrop.com"

# Cron Jobs
CRON_SECRET="your-secure-cron-secret"
\`\`\`

### 4. Database Setup
Push the Prisma schema to your local database and run the initial seed to create the default Admin account.

\`\`\` npm run seed
# Apply schema to DB
npx prisma db push

# Run the seed script
npm run seed
\`\`\`
*(Check `prisma/seed.ts` for the default admin credentials generated).*

### 5. Start the Development Server
\`\`\`
npm run dev
\`\`\`

Visit \`http://localhost:3000\` in your browser to log in.

---

## 🏗️ Architecture & Key Concepts

### Server Actions & Data Fetching
ResourceDrop heavily utilizes **React Server Components (RSC)** and **Next.js Server Actions**. All write operations (creating projects, submitting requests) happen securely on the server via `actions.ts` files, eliminating the need for traditional client-side API routes.

### Presigned Uploads
To prevent the Node.js server from bottlenecking during large file transfers, document uploads use the **Presigned URL** pattern:
1. Client requests a secure, temporary upload URL from the server.
2. Server validates authorization and generates a time-limited S3/MinIO URL.
3. Client uploads the file directly to the storage bucket.
4. Client notifies the server that the upload is complete.

### Audit Logging
Every significant state change is tracked via `logAuditAction()` in `src/lib/audit.ts`.
Audit logs are append-only. To ensure UI speed, they are separated from the main transaction paths, and failure to write an audit log does not crash the system.

### Fire-and-Forget Emails
The system uses an asynchronous email queue wrapper (`sendEmail` in `src/lib/email/index.ts`). If the Brevo API goes down, the `catch` block swallows the error so that core database transactions (like assigning a user to a project) are not rolled back.

### Daily Digest Cron Job
The `/api/cron/pending-requests` route acts as a webhook. It requires an `Authorization: Bearer <CRON_SECRET>` header to execute. In production, Vercel Cron automatically triggers this route every 24 hours at 9:00 AM (configured via `vercel.json`).

---

## 📜 Scripts
- \`npm run dev\` - Starts the development server.
- \`npm run build\` - Compiles the application for production.
- \`npm run start\` - Starts the production server.
- \`npm run lint\` - Runs ESLint across the codebase.
- \`npm run seed\` - Populates the database with initial required data (roles, admin).

## 📄 License
This project is licensed under the MIT License.
