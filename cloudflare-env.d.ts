// Declares the bindings available on `env` at runtime, matching wrangler.jsonc.
// Regenerate/extend by hand as bindings are added (kept out of git; see .gitignore).
interface CloudflareEnv {
  DB: D1Database;
  SESSION_SECRET: string;
}
