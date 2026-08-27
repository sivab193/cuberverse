# CuberVerse universal app

The React Native version of CuberVerse lives in this directory. It targets Android, iOS, and static web from one Expo Router codebase. The current release is deliberately account-free: core features work offline, while public WCA records and the competition calendar refresh when a connection is available and then remain cached.

## Included

- 417+ shared algorithms for 2x2–7x7 and Pyraminx, with filters, collapsible sections, favorites, learning status, case diagrams, and 3D playback
- local timer, generated scrambles, solve history, Ao5, and Ao12
- manual 3x3/2x2/Pyraminx solving with native in-process solvers and playback
- guided camera scanning with all image sampling and color classification performed on-device
- interactive notation guide
- the owner’s public WCA profile (`2017BALA04`) and upcoming competition browser using the official public API

There is no Firebase, signup, account database, WCA OAuth token, or image upload in this app. AsyncStorage holds timer data, learning progress, preferences, and WCA cache entries on the device.

## Run locally

Use a current Node.js LTS release, then:

```bash
cd mobile
npm install
npm start
```

Press `a` for Android, `i` for iOS, or `w` for web. The camera and native 3D renderer are best tested in a development build or production build, not only in a browser.

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run export:web
```

## Build and publish

After installing the EAS CLI and signing in to an Expo account:

```bash
eas build --platform android --profile preview
eas build --platform android --profile production
```

`preview` produces an installable Android APK. `production` produces the store-oriented build. A static web export is written to `dist/` by `npm run export:web` and can be deployed to any static host.

## Architecture

- `src/app/` — Expo Router routes and native navigation
- `src/components/` — universal UI, algorithm diagrams, and platform-specific Three.js canvases
- `src/core/` — local persistence, WCA client/cache, scanner sampling, solvers, and puzzle playback controller
- `../lib/` — shared algorithm dataset, exact puzzle model, scanner geometry/classification, and facelet validation used by both projects

Metro watches the repository parent so those pure TypeScript modules stay the single source of truth. Website-only Next.js, DOM, Firebase, and worker code is not imported into the native bundle.

## Offline boundary

Algorithms, notation, timer, solve history, manual solving, playback, and camera classification do not need a network connection. WCA profile data and competitions need the network on their first load; later launches can show the last successful cached response. Public WCA requests use no OAuth or client secret.
