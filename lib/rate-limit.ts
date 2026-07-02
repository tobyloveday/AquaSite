import type { D1Database } from "@cloudflare/workers-types";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

type AttemptRow = {
  failed_count: number;
  locked_until: string | null;
};

export type LockoutStatus = { locked: false } | { locked: true; retryAfterSeconds: number };

export async function checkLoginLockout(db: D1Database, email: string): Promise<LockoutStatus> {
  const row = await db
    .prepare("SELECT failed_count, locked_until FROM login_attempts WHERE email = ?")
    .bind(email)
    .first<AttemptRow>();

  if (row?.locked_until) {
    const lockedUntilMs = Date.parse(row.locked_until);
    if (lockedUntilMs > Date.now()) {
      return { locked: true, retryAfterSeconds: Math.ceil((lockedUntilMs - Date.now()) / 1000) };
    }
  }
  return { locked: false };
}

export async function recordFailedLogin(db: D1Database, email: string): Promise<void> {
  const row = await db
    .prepare("SELECT failed_count, locked_until FROM login_attempts WHERE email = ?")
    .bind(email)
    .first<AttemptRow>();

  const previousLockExpired = !!row?.locked_until && Date.parse(row.locked_until) <= Date.now();
  const startingFresh = !row || previousLockExpired;
  const nextCount = startingFresh ? 1 : row.failed_count + 1;
  const lockedUntil =
    nextCount >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null;

  await db
    .prepare(
      `INSERT INTO login_attempts (email, failed_count, locked_until, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(email) DO UPDATE SET
         failed_count = excluded.failed_count,
         locked_until = excluded.locked_until,
         updated_at = excluded.updated_at`
    )
    .bind(email, nextCount, lockedUntil)
    .run();
}

export async function clearLoginAttempts(db: D1Database, email: string): Promise<void> {
  await db.prepare("DELETE FROM login_attempts WHERE email = ?").bind(email).run();
}
