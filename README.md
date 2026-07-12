# CuberVerse

Your complete speed cubing companion — practice with a timer, learn algorithms, master notation, and track your progress.

## Features

- **Timer** — hold-space-to-start timer with auto-generated scrambles for 2x2, 3x3, and Pyraminx, plus Ao5/Ao12 session stats.
- **Algorithm Library** — browse algorithms by cube type and method (Beginners, CFOP), copy them, and mark your learning progress.
- **Notation Guide** — interactive guide with a 3D cube that animates each move as you click it.
- **Scan & Solve** — show a scrambled 3x3, 2x2, or Pyraminx to your camera (or enter the colors by hand) and get a shortest-path solution played back on the 3D puzzle. All processing happens in your browser; no photos are uploaded. The camera needs a secure context (HTTPS or localhost).
- **Stats & Dashboard** — solve history, progression charts, distributions, and per-algorithm progress (requires an account).

## Stack

- [Next.js](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [three.js](https://threejs.org/) via [react-three-fiber](https://docs.pmnd.rs/react-three-fiber) for the 3D cube
- [cubing.js](https://js.cubing.net/cubing/) for in-browser solving (two-phase 3x3, optimal 2x2/Pyraminx)
- [Firebase](https://firebase.google.com/) (Auth + Firestore) for accounts, solves, and progress
- [Vitest](https://vitest.dev/) for unit tests

> **Note:** `pnpm dev`/`pnpm build` first run `scripts/vendor-cubing.mjs`, which copies the cubing.js solver into `public/vendor/cubing` — its search workers must load un-bundled from our origin (bundlers break its module-worker instantiation). The copy is gitignored and regenerated on demand.

## Getting started

This project uses [pnpm](https://pnpm.io/) (via corepack — bundled with Node.js):

```bash
corepack enable pnpm
pnpm install
pnpm dev
```

Open http://localhost:3000.

### Firebase (optional)

Accounts, solve history, and algorithm progress need a Firebase project. Copy `.env.example` to `.env.local` and fill in the values from Firebase Console → Project settings → Your apps. Without them the site still runs — the account features are simply disabled.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Run unit tests once |
| `pnpm test:watch` | Run unit tests in watch mode |
