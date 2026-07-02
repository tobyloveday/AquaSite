# AquaSite

Site progress photo capture for civil engineering, water, wastewater, highways and infrastructure projects.

See `AquaSite_Product_Specification.md` (in the repo root, once you add it) for the full product spec, architecture, database design and user journeys.

## What's in this starter

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- A basic `manifest.json` so the app is installable as a PWA on Android and iPhone
- Empty `lib/` and `components/` folders ready for the real features (auth, camera capture, map, offline sync, etc.)

## Running it locally

You'll need [Node.js](https://nodejs.org) installed (LTS version).

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## Deploying

This is designed to deploy to **Cloudflare Pages**, connected directly to this GitHub repo — pushes to `main` deploy automatically.

## Status

This is the initial scaffold only. No login, project management, camera capture, offline storage, or map yet — those get built next, following the architecture in the product spec.
