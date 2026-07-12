/**
 * Vendor the `cubing` solver/scramble ESM chain into public/vendor/cubing.
 *
 * Why: cubing.js spawns a module Web Worker via `import.meta.resolve(...)`
 * relative to its own module URL. Bundlers (Turbopack included) rewrite
 * module URLs, so worker instantiation fails when cubing is bundled. Serving
 * cubing's own ESM files verbatim from our origin keeps every relative
 * import and the worker entry resolvable, independent of the bundler.
 *
 * Bare specifiers (`cubing/alg`, `random-uint-below`, ...) are rewritten to
 * relative paths because module workers cannot rely on document import maps.
 *
 * Run automatically before `dev`/`build`; skips work when up to date.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, posix, resolve } from "node:path"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const outDir = join(projectRoot, "public", "vendor", "cubing")
const stampFile = join(outDir, ".vendored.json")

// cubing's exports map hides package.json, so locate the package directly
// (realpath because pnpm links it into the store).
const cubingRoot = realpathSync(join(projectRoot, "node_modules", "cubing"))
const cubingPkg = JSON.parse(readFileSync(join(cubingRoot, "package.json"), "utf8"))
const cubingDist = join(cubingRoot, "dist", "lib", "cubing")
// random-uint-below is ESM-only (no require condition), so resolve by hand
// from cubing's own node_modules.
const rubRoot = realpathSync(join(dirname(cubingRoot), "random-uint-below"))
const rubPkg = JSON.parse(readFileSync(join(rubRoot, "package.json"), "utf8"))
const rubEsm = join(rubRoot, rubPkg.exports["."].import)

const stamp = { cubing: cubingPkg.version, script: 3 }
if (existsSync(stampFile)) {
  try {
    const prev = JSON.parse(readFileSync(stampFile, "utf8"))
    if (prev.cubing === stamp.cubing && prev.script === stamp.script) {
      process.exit(0)
    }
  } catch {
    // fall through and re-vendor
  }
}

rmSync(outDir, { recursive: true, force: true })

// Entry points we (or cubing's worker) load at runtime.
const entries = [
  "search/index.js",
  "scramble/index.js",
  "puzzles/index.js",
  "kpuzzle/index.js",
  "alg/index.js",
  "chunks/search-worker-entry.js",
]

// Bare specifier -> vendored path (posix, relative to outDir root).
const bareTargets = {
  "cubing/alg": "alg/index.js",
  "cubing/kpuzzle": "kpuzzle/index.js",
  "cubing/notation": "notation/index.js",
  "cubing/puzzles": "puzzles/index.js",
  "cubing/scramble": "scramble/index.js",
  "cubing/search": "search/index.js",
  "random-uint-below": "vendor-deps/random-uint-below.js",
}

const importRe = /((?:from|import)\s*\(?\s*)"([^"]+)"/g
const seen = new Set()
const queue = [...entries]
while (queue.length > 0) {
  const rel = posix.normalize(queue.shift())
  if (seen.has(rel)) continue
  seen.add(rel)
  const srcPath = join(cubingDist, rel)
  if (!existsSync(srcPath)) {
    throw new Error(`vendor-cubing: missing file in cubing dist: ${rel}`)
  }
  const src = readFileSync(srcPath, "utf8")
  const fileDir = posix.dirname(rel)
  const out = src.replace(importRe, (whole, prefix, spec) => {
    if (spec.startsWith(".")) {
      queue.push(posix.normalize(posix.join(fileDir, spec)))
      return whole
    }
    const target = bareTargets[spec]
    if (!target) {
      throw new Error(`vendor-cubing: unmapped bare import "${spec}" in ${rel}`)
    }
    if (target !== "vendor-deps/random-uint-below.js") queue.push(target)
    let relPath = posix.relative(fileDir === "." ? "" : fileDir, target)
    if (!relPath.startsWith(".")) relPath = `./${relPath}`
    return `${prefix}"${relPath}"`
  })
  const dest = join(outDir, rel)
  mkdirSync(dirname(dest), { recursive: true })
  // Drop sourceMappingURL comments; we don't vendor the maps.
  writeFileSync(dest, out.replace(/^\/\/# sourceMappingURL=.*$/m, ""))
}

mkdirSync(join(outDir, "vendor-deps"), { recursive: true })
cpSync(rubEsm, join(outDir, "vendor-deps", "random-uint-below.js"))

writeFileSync(stampFile, JSON.stringify(stamp))
console.log(`vendor-cubing: vendored ${seen.size + 1} files (cubing ${cubingPkg.version}) -> public/vendor/cubing`)
