# CuberVerse

**Live:** <https://cv.siv19.dev> · [The story behind it](https://cv.siv19.dev/about)

In December 2012 I saved a file called `Moves.png` — a picture of the notation, because I kept forgetting which way `R'` went. Once I could solve a cube, people asked me to teach them, so I made a slide deck. Then a better deck. Then a PDF, because not everyone could open a `.ppt`. I've taught at least **60 people** to solve a Rubik's Cube that way, one at a time, over more than a decade. ([The originals are still in Drive.](https://drive.google.com/drive/folders/0B3LEx1FbxlAmZ01PQm9YSkZjbHM?resourcekey=0-EfI_49dbt65TaxYl4VFDeQ&usp=sharing))

CuberVerse is that deck, finally built properly — learn algorithms, scan and solve a real cube, practice with a timer, and track your progress.

## Features

- **Algorithm Library** — 417 algorithms across 3x3, 2x2, 4x4 and Pyraminx (Beginners, CFOP, one-handed, Ortega, CLL, EG-1, Reduction, L4E). Every case is **drawn as the state it solves** — the diagram is computed from the algorithm's inverse on the puzzle model in `lib/puzzle`, not stored as an image — and any case can be played back move-by-move on the 3D puzzle. Filter by puzzle, method, favorites and learning status; mark cases learning/learned as you go.
- **Timer** — hold-space-to-start timer with auto-generated scrambles for 2x2, 3x3, and Pyraminx, plus Ao5/Ao12 session stats.
- **Notation Guide** — interactive guide with a 3D cube that animates each move as you click it.
- **Scan & Solve** — show a scrambled 3x3, 2x2, or Pyraminx to your camera (or enter the colors by hand) and get a shortest-path solution played back on the 3D puzzle. All processing happens in your browser; no photos are uploaded. The camera needs a secure context (HTTPS or localhost).
- **WCA Integration** — connect your World Cube Association account (via WCA OAuth — you sign in on worldcubeassociation.org) to see your official personal records, rankings, and medals on the dashboard, and browse upcoming WCA competitions in your country (filterable by city/state). Uses the public WCA API directly from the browser; only your WCA ID is stored.
- **Stats & Dashboard** — solve history, progression charts, distributions, and per-algorithm progress (requires an account).

## Stack

- [Next.js](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [three.js](https://threejs.org/) via [react-three-fiber](https://docs.pmnd.rs/react-three-fiber) for the 3D cube
- [cubing.js](https://js.cubing.net/cubing/) for in-browser solving (two-phase 3x3, optimal 2x2/Pyraminx)
- [Firebase](https://firebase.google.com/) (Auth + Firestore) for accounts, solves, and progress
- [Vitest](https://vitest.dev/) for unit tests

The puzzle model in `lib/puzzle` is the single source of truth for cube state: scrambles, the 3D viewer, the solver's input, and the algorithm-page case diagrams (`components/case-diagram.tsx`) all derive from it. Moves are integer rotations of exact sticker positions rather than hand-written cycle tables, so one code path covers 2x2–7x7 and the Pyraminx — and `lib/algorithms/__tests__/data-integrity.test.ts` mechanically proves every shipped algorithm honors its set's contract (a PLL only permutes the last layer, a Winter Variation alg only touches the last layer and the FR slot, and so on).

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

### WCA account linking (optional)

Verified WCA linking uses the WCA's OAuth implicit flow, which needs a one-time application registration:

1. Sign in on worldcubeassociation.org and open <https://www.worldcubeassociation.org/oauth/applications>.
2. Create an application with redirect URI `<your site origin>/wca-callback` (add `http://localhost:3000/wca-callback` for development) and scope `public`.
3. Put the Application ID in `.env.local` as `NEXT_PUBLIC_WCA_CLIENT_ID`.

No client secret is needed (the implicit flow is WCA's recommended flow for pure client-side apps), and the access token is used once to read the user's identity — only the WCA ID is stored.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Run unit tests once |
| `pnpm test:watch` | Run unit tests in watch mode |
