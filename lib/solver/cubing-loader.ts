/**
 * Runtime loader for the vendored `cubing` ESM build.
 *
 * The installed `cubing` package cannot be bundled for search/scramble use:
 * it spawns a module Web Worker via `import.meta.resolve(...)`, which breaks
 * once a bundler rewrites module URLs. Instead, `scripts/vendor-cubing.mjs`
 * copies cubing's own ESM files (bare imports rewritten) into
 * `public/vendor/cubing`, and this module imports them from that URL at
 * runtime — so every relative import and the worker entry resolve natively.
 *
 * Types still come from the installed package (erased at compile time), so
 * call sites keep full type safety. Client-only.
 */

const VENDOR_BASE = "/vendor/cubing"

// Indirection defeats bundler static analysis so the URL import is left to
// the browser at runtime.
const runtimeImport = new Function("u", "return import(u)") as (url: string) => Promise<unknown>

const cache = new Map<string, Promise<unknown>>()

function loadVendored<T>(subpath: string): Promise<T> {
  let promise = cache.get(subpath)
  if (!promise) {
    promise = runtimeImport(`${VENDOR_BASE}/${subpath}/index.js`)
    cache.set(subpath, promise)
  }
  return promise as Promise<T>
}

export function loadCubingSearch(): Promise<typeof import("cubing/search")> {
  return loadVendored("search")
}

export function loadCubingScramble(): Promise<typeof import("cubing/scramble")> {
  return loadVendored("scramble")
}

export function loadCubingPuzzles(): Promise<typeof import("cubing/puzzles")> {
  return loadVendored("puzzles")
}

export function loadCubingAlg(): Promise<typeof import("cubing/alg")> {
  return loadVendored("alg")
}

export function loadCubingKpuzzle(): Promise<typeof import("cubing/kpuzzle")> {
  return loadVendored("kpuzzle")
}
