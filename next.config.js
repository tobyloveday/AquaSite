/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;

// Lets `next dev` read Cloudflare bindings (D1, etc.) from wrangler.jsonc
// via local Miniflare emulation, so no live Cloudflare account is needed
// for local development. No-ops in production.
const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
initOpenNextCloudflareForDev();
