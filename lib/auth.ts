import { getCloudflareContext } from "@opennextjs/cloudflare";

const PBKDF2_ITERATIONS = 100_000;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionUser = {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "field_user";
};

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  return Array.from(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
}

// --- Password hashing ---
// Uses Web Crypto PBKDF2 (not bcrypt/argon2) because those need native Node
// bindings that aren't available in the Cloudflare Workers runtime.

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = await pbkdf2(password, fromHex(saltHex));
  return timingSafeEqual(new Uint8Array(hash), fromHex(hashHex));
}

// --- Session cookies ---
// Stateless: a JSON payload + HMAC signature, base64url-encoded. No server-side
// session table yet — this is the simplest thing that satisfies "session
// persists across app restarts". Revocable server-side sessions can replace
// this later if we need to force-expire a session before it times out.

const SESSION_COOKIE_NAME = "aquasite_session";

async function getSessionSecret(): Promise<string> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return env.SESSION_SECRET;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toHex(signature);
}

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

export async function createSessionCookieValue(user: SessionUser): Promise<string> {
  const secret = await getSessionSecret();
  const payload = JSON.stringify({ ...user, exp: Date.now() + SESSION_DURATION_MS });
  const encoded = base64UrlEncode(payload);
  const signature = await hmacSign(encoded, secret);
  return `${encoded}.${signature}`;
}

export async function verifySessionCookieValue(
  value: string | undefined
): Promise<SessionUser | null> {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;

  const secret = await getSessionSecret();
  const expected = await hmacSign(encoded, secret);
  if (!timingSafeEqual(fromHex(expected), fromHex(signature))) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as SessionUser & { exp: number };
    if (payload.exp < Date.now()) return null;
    const { exp: _exp, ...user } = payload;
    return user;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = {
  name: SESSION_COOKIE_NAME,
  maxAgeSeconds: SESSION_DURATION_MS / 1000,
};
