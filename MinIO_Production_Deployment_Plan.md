# MinIO Production Deployment Plan

This document outlines the operational requirements for transitioning our local MinIO development environment into a production-ready deployment. 

In production, MinIO handles sensitive user uploads and project resources. Therefore, it requires strict adherence to security, rotation, and data recovery practices.

---

## 1. TLS Termination

MinIO natively supports TLS, but the industry standard and most reliable pattern is to **terminate TLS at the load balancer or reverse proxy** rather than configuring certificates directly inside the MinIO container.

**Implementation Strategy:**
*   **Reverse Proxy:** Deploy a reverse proxy (e.g., NGINX, Traefik, AWS ALB, or Cloudflare Tunnel) in front of the MinIO container.
*   **Certificates:** The proxy handles the SSL/TLS certificates (e.g., via Let's Encrypt / Certbot) and enforces `HTTPS`.
*   **Internal Routing:** The proxy terminates the secure connection and forwards the traffic over plain HTTP to the internal MinIO container on port `9000` (API) and `9001` (Console) across a private, isolated Docker network.
*   **Configuration:** The Next.js application's `MINIO_PUBLIC_ENDPOINT` environment variable will be updated to point to the secure `https://s3.yourdomain.com` proxy URL. The `MINIO_USE_SSL` variable in the backend will be set to `true`.

---

## 2. Credential Rotation

In development, we use hardcoded credentials in the `docker-compose.yml`. **This is strictly prohibited in production.**

**Implementation Strategy:**
*   **Secret Management:** Inject `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` into the MinIO container at runtime using a secure secrets manager (e.g., Docker Swarm Secrets, AWS Secrets Manager, GitHub Actions Secrets for CI/CD deployments).
*   **Rotation Procedure:** 
    1. Generate a new cryptographically secure access key and secret key pair.
    2. Update the values in the deployment platform's secret manager.
    3. Update the corresponding `.env` variables (`MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`) for the Next.js application.
    4. Perform a rolling restart of the MinIO container, followed by the Next.js application, so they both pick up the new credentials simultaneously with zero downtime.

> [!WARNING]
> Do not commit production credentials to any `.env` file tracked in version control.

---

## 3. Volume Backup and Disaster Recovery

A container failure should never result in data loss. The Docker volume holding the MinIO `/data` directory must be treated as critical state.

**Implementation Strategy:**
*   **Active Mirroring (Preferred):** Use the MinIO Client (`mc`) to run a scheduled cron job (e.g., nightly) that executes `mc mirror` to replicate the production bucket to a completely isolated, off-site storage bucket (like an actual AWS S3 bucket or a secondary region).
    ```bash
    mc mirror --overwrite prod-minio/resourcedrop-bucket backup-s3/resourcedrop-bucket-backup
    ```
*   **Infrastructure Snapshots:** If deploying on a cloud provider (AWS, DigitalOcean, GCP), configure the underlying block storage volume (e.g., AWS EBS) attached to the `/data` mount to take automated daily snapshots.
*   **High Availability (Future Phase):** If upload volume scales significantly, transition the single-node MinIO container to a **MinIO Distributed Mode** deployment across 4+ drives, which provides erasure coding. This guarantees data survival even if up to half the drives in the cluster fail simultaneously.
