// Declares the bindings available on `env` at runtime, matching wrangler.jsonc.
// Imports only the specific types needed from @cloudflare/workers-types rather
// than referencing the whole package, since its ambient globals (Request,
// Response, fetch, ...) conflict with the DOM types Next.js needs elsewhere.
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    PHOTOS: R2Bucket;
    SESSION_SECRET: string;
  }
}

export {};
