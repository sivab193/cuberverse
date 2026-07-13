/**
 * Generate lib/algorithms/sets.gen.ts from the jperm.net algorithm data.
 *
 * Source: .gen/jperm-data.json — extracted from jperm.net's per-set data
 * files (algsetAlgs in /lib/<set>.js), normalized to {name, group, prob,
 * algs[]} per case. Credit: algorithms curated by Dylan Wang (J Perm),
 * https://jperm.net.
 *
 * The 3x3 PLL/OLL sets are enriched with the descriptions, difficulties and
 * recognition notes from the previously authored lib/algorithms/333-*.ts
 * files (also keeping their ids, which preserve pre-overhaul user progress).
 *
 * Every algorithm is normalized (visual parentheses stripped, the 4x4 [*]
 * parity placeholder inlined, X3 -> X') and parse-checked against
 * lib/puzzle notation before being emitted.
 *
 * Run from the repo root:  node <path-to-tsx>/cli.mjs .gen/jperm-import.mts
 */
import { readFileSync, writeFileSync } from "node:fs"
import { parseSequence } from "../lib/puzzle/notation"
import type { PuzzleId } from "../lib/puzzle/types"
import type { Algorithm, CubeType, MethodType } from "../lib/algorithms/schema"
import { pll333 } from "../lib/algorithms/333-pll"
import { oll333 } from "../lib/algorithms/333-oll"

interface JpermCase {
  name: string
  group: string | null
  prob: number | null
  algs: string[]
}

interface JpermSet {
  name: string
  description: string
  puzzle: number
  count: number
  algs: JpermCase[]
}

const data = JSON.parse(readFileSync(".gen/jperm-data.json", "utf8")) as Record<string, JpermSet>

const PARITY: Record<string, string> = {
  "4x4oll": "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
  "4x4pll": "2R2 U2 2R2 Uw2 2R2 Uw2",
}

/**
 * Two alternative algorithms are mistyped on jperm.net: applied to a solved
 * cube they don't reproduce their own case. Each has exactly one repair (a
 * search over single- and two-token edits) that provably reaches the same
 * state as the case's primary algorithm, up to rotation and AUF — that
 * unique repair is used here. Keyed by the source string.
 */
const CORRECTIONS: Record<string, string> = {
  // OH PLL H perm: the `u` must be `u'`.
  "x' R r U2 R' r' u U' R2 U D": "x' R r U2 R' r' u' U' R2 U D",
  // Winter Variation "Oriented": the 3rd `l` must be `l'` and the `U'` a `U`.
  "y l D l U' l D' l'": "y l D l' U l D' l'",
}

function normalizeAlg(raw: string, setKey: string): string {
  return (CORRECTIONS[raw] ?? raw)
    .replaceAll("[*]", PARITY[setKey] ?? "")
    .replace(/[()[\]]/g, " ")
    .replace(/([A-Za-z]w?)3(?='|\s|$)/g, "$1'") // X3 == X'
    .replace(/\s+/g, " ")
    .trim()
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

interface SetConfig {
  key: string
  setName: string
  cubeType: CubeType
  puzzle: PuzzleId
  method: MethodType
  category: string
  idPrefix: string
  caseName?: (name: string) => string
  /** Case name -> fixed id (for ids that must survive from older datasets). */
  idOverrides?: Record<string, string>
}

const SETS: SetConfig[] = [
  { key: "pll", setName: "PLL", cubeType: "3x3", puzzle: "333", method: "CFOP", category: "PLL", idPrefix: "pll", caseName: (n) => `${n} Perm` },
  { key: "oll", setName: "OLL", cubeType: "3x3", puzzle: "333", method: "CFOP", category: "OLL", idPrefix: "oll", caseName: (n) => `OLL ${n}` },
  { key: "coll", setName: "COLL", cubeType: "3x3", puzzle: "333", method: "CFOP", category: "COLL", idPrefix: "coll", caseName: (n) => `COLL ${n}` },
  { key: "wv", setName: "Winter Variation", cubeType: "3x3", puzzle: "333", method: "CFOP", category: "Winter Variation", idPrefix: "wv" },
  { key: "2lookoll", setName: "2-Look OLL", cubeType: "3x3", puzzle: "333", method: "Beginners", category: "2-Look OLL", idPrefix: "2look-oll" },
  { key: "2lookpll", setName: "2-Look PLL", cubeType: "3x3", puzzle: "333", method: "Beginners", category: "2-Look PLL", idPrefix: "2look-pll" },
  { key: "oholl", setName: "One-Handed OLL", cubeType: "3x3", puzzle: "333", method: "OH", category: "OH OLL", idPrefix: "oh-oll", caseName: (n) => `OH OLL ${n}` },
  { key: "ohpll", setName: "One-Handed PLL", cubeType: "3x3", puzzle: "333", method: "OH", category: "OH PLL", idPrefix: "oh-pll", caseName: (n) => `OH ${n} Perm` },
  { key: "2x2oll", setName: "2x2 OLL", cubeType: "2x2", puzzle: "222", method: "Ortega", category: "OLL", idPrefix: "2x2oll", idOverrides: { Sune: "2x2-oll" } },
  { key: "2x2pbl", setName: "2x2 PBL", cubeType: "2x2", puzzle: "222", method: "Ortega", category: "PBL", idPrefix: "2x2pbl" },
  { key: "2x2cll", setName: "2x2 CLL", cubeType: "2x2", puzzle: "222", method: "CLL", category: "CLL", idPrefix: "2x2cll", caseName: (n) => `CLL ${n}` },
  { key: "2x2eg-1", setName: "2x2 EG-1", cubeType: "2x2", puzzle: "222", method: "EG-1", category: "EG-1", idPrefix: "2x2eg1", caseName: (n) => `EG-1 ${n}` },
  { key: "4x4oll", setName: "4x4 OLL Parity", cubeType: "4x4", puzzle: "444", method: "Reduction", category: "OLL Parity", idPrefix: "4x4oll", caseName: (n) => `OLL Parity: ${n}` },
  { key: "4x4pll", setName: "4x4 PLL Parity", cubeType: "4x4", puzzle: "444", method: "Reduction", category: "PLL + Parity", idPrefix: "4x4pll", caseName: (n) => `4x4 PLL ${n}` },
]

// Enrichment from the previously authored, mechanically verified sets.
const pllByShortName = new Map(pll333.map((a) => [a.name.replace(/ Perm$/, ""), a]))
const ollByNumber = new Map(
  oll333.map((a) => [Number(/OLL (\d+)/.exec(a.name)?.[1] ?? -1), a]),
)

const emitted: { config: SetConfig; algorithms: Algorithm[]; description: string }[] = []
let parseFailures = 0

for (const config of SETS) {
  const set = data[config.key]
  if (!set) throw new Error(`missing set in jperm data: ${config.key}`)

  const probTotal = set.algs.reduce((sum, c) => sum + (c.prob ?? 0), 0)
  const usedIds = new Set<string>()
  const usedNames = new Set<string>()

  const algorithms: Algorithm[] = set.algs.map((c) => {
    const normalized = c.algs.map((a) => normalizeAlg(a, config.key))
    for (const alg of normalized) {
      try {
        parseSequence(alg, config.puzzle)
      } catch (err) {
        parseFailures++
        console.error(`PARSE FAIL [${config.key} / ${c.name}]: "${alg}" — ${err}`)
      }
    }

    let enriched: Algorithm | undefined
    if (config.key === "pll") enriched = pllByShortName.get(c.name)
    if (config.key === "oll") enriched = ollByNumber.get(Number(c.name))

    let name = enriched?.name ?? config.caseName?.(c.name) ?? c.name
    if (usedNames.has(name)) {
      let n = 2
      while (usedNames.has(`${name} ${n}`)) n++
      name = `${name} ${n}`
    }
    usedNames.add(name)

    let id = enriched?.id ?? config.idOverrides?.[c.name] ?? `${config.idPrefix}-${slug(name.replace(new RegExp(`^${config.idPrefix}`, "i"), ""))}`
    if (usedIds.has(id)) {
      let n = 2
      while (usedIds.has(`${id}-${n}`)) n++
      id = `${id}-${n}`
    }
    usedIds.add(id)

    let probability: string | undefined
    if (c.prob && probTotal > 0) {
      const g = gcd(c.prob, probTotal)
      probability = `${c.prob / g}/${probTotal / g}`
    }

    const [algorithm, ...alternatives] = normalized
    return {
      id,
      name,
      cubeType: config.cubeType,
      method: config.method,
      category: config.category,
      ...(c.group ? { group: c.group.replace(/^\d+: /, "") } : {}),
      algorithm,
      ...(alternatives.length > 0 ? { alternatives } : {}),
      ...(probability ? { probability } : {}),
      ...(enriched?.difficulty ? { difficulty: enriched.difficulty } : {}),
      description: enriched?.description ?? `${name} — ${set.name} case.`,
      ...(enriched?.recognition ? { recognition: enriched.recognition } : {}),
    }
  })

  emitted.push({ config, algorithms, description: set.description })
}

if (parseFailures > 0) {
  throw new Error(`${parseFailures} algorithms failed to parse — aborting`)
}

const header = `/**
 * GENERATED by .gen/jperm-import.mts — do not edit by hand.
 *
 * Algorithm data sourced from jperm.net (curated by Dylan Wang / J Perm),
 * normalized to lib/puzzle notation and mechanically validated by
 * lib/algorithms/__tests__/data-integrity.test.ts. 3x3 PLL/OLL entries are
 * enriched with descriptions/recognition from lib/algorithms/333-*.ts.
 */

import type { Algorithm } from "./schema"

export interface AlgorithmSet {
  /** Stable key, e.g. "pll", "2x2cll". */
  key: string
  name: string
  description: string
  algorithms: Algorithm[]
}
`

const body = emitted
  .map(
    ({ config, algorithms, description }) =>
      `export const ${varName(config.key)}: AlgorithmSet = ${JSON.stringify(
        { key: config.key, name: config.setName, description, algorithms },
        null,
        2,
      )}\n`,
  )
  .join("\n")

function varName(key: string): string {
  return `set_${key.replace(/[^a-z0-9]/g, "_")}`
}

const footer = `
export const ALGORITHM_SETS: AlgorithmSet[] = [
${emitted.map(({ config }) => `  ${varName(config.key)},`).join("\n")}
]

export const GENERATED_ALGORITHMS: Algorithm[] = ALGORITHM_SETS.flatMap(
  (set) => set.algorithms,
)
`

writeFileSync("lib/algorithms/sets.gen.ts", header + "\n" + body + footer)
const total = emitted.reduce((sum, e) => sum + e.algorithms.length, 0)
console.error(
  `wrote lib/algorithms/sets.gen.ts: ${emitted.length} sets, ${total} algorithms`,
)
