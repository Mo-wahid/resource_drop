import { randomBytes, createHash } from "crypto";

/**
 * Generate a cryptographically random invitation token.
 * Returns the raw token (for the email link) and its SHA-256 hash (for DB storage).
 */
export function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = hashToken(raw);
  return { raw, hash };
}

/**
 * Hash a raw token with SHA-256.
 * Used at acceptance time to look up the invitation by its stored hash.
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
