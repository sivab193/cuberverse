/**
 * Generate the complete F2L case set with machine-verified solutions.
 *
 * A case is keyed by the (position, orientation) of the DFR corner and FR
 * edge only. Solutions are words over slot-safe primitives (basic inserts,
 * sledge/hedge) interleaved with U moves — every product provably preserves
 * the cross and the other three slots, and a word solves case C iff
 * inverse(word) applied to solved produces C's pair signature.
 */
import { NxnCube } from "../lib/puzzle/nxn"
import { parseSequence, invertMoves, movesToString } from "../lib/puzzle/notation"
import type { ParsedMove } from "../lib/puzzle/types"

type Face = "U" | "R" | "F" | "D" | "L" | "B"

const CORNER_SPOTS: { name: string; keys: [string, string, string] }[] = [
  { name: "slot", keys: ["D:0:2", "F:2:2", "R:2:0"] },
  { name: "ULB", keys: ["U:0:0", "L:0:0", "B:0:2"] },
  { name: "UBR", keys: ["U:0:2", "B:0:0", "R:0:2"] },
  { name: "URF", keys: ["U:2:2", "R:0:0", "F:0:2"] },
  { name: "UFL", keys: ["U:2:0", "F:0:0", "L:0:2"] },
]
const EDGE_SPOTS: { name: string; keys: [string, string] }[] = [
  { name: "slot", keys: ["F:1:2", "R:1:0"] },
  { name: "UB", keys: ["U:0:1", "B:0:1"] },
  { name: "UL", keys: ["U:1:0", "L:0:1"] },
  { name: "UR", keys: ["U:1:2", "R:0:1"] },
  { name: "UF", keys: ["U:2:1", "F:0:1"] },
]

function stickerAt(cube: NxnCube, key: string): string {
  const [face, r, c] = key.split(":")
  return cube.getSticker(face as Face, Number(r), Number(c))
}

/** Pair signature of a state, or null if the pair is not cleanly placed. */
function signature(cube: NxnCube): string | null {
  let corner: string | null = null
  for (const spot of CORNER_SPOTS) {
    const colors = spot.keys.map((k) => stickerAt(cube, k))
    if ([...colors].sort().join("") === "DFR") {
      corner = `${spot.name}:${colors.indexOf("D")}`
      break
    }
  }
  let edge: string | null = null
  for (const spot of EDGE_SPOTS) {
    const colors = spot.keys.map((k) => stickerAt(cube, k))
    if ([...colors].sort().join("") === "FR") {
      edge = `${spot.name}:${colors.indexOf("F")}`
      break
    }
  }
  if (!corner || !edge) return null
  return `${corner}|${edge}`
}

/** Check a sequence is slot-safe: cross + other slots + centers untouched. */
const FREE = new Set<string>()
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) FREE.add(`U:${r}:${c}`)
for (const f of ["F", "R", "B", "L"]) for (let c = 0; c < 3; c++) FREE.add(`${f}:0:${c}`)
for (const s of ["F:1:2", "F:2:2", "R:1:0", "R:2:0", "D:0:2"]) FREE.add(s)

function isSlotSafe(cube: NxnCube): boolean {
  for (const face of ["U", "R", "F", "D", "L", "B"] as Face[]) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (FREE.has(`${face}:${r}:${c}`)) continue
        if (cube.getSticker(face, r, c) !== face) return false
      }
    }
  }
  return true
}

const PRIMITIVES = [
  "R U R'",
  "R U' R'",
  "R U2 R'",
  "F' U F",
  "F' U' F",
  "F' U2 F",
  "R' F R F'",
  "F R' F' R",
]
const AUFS = ["", "U", "U'", "U2"]

// sanity: all primitives slot-safe
for (const p of PRIMITIVES) {
  const cube = NxnCube.solved(3)
  cube.applyMoves(parseSequence(p, "333"))
  if (!isSlotSafe(cube)) throw new Error(`primitive not slot-safe: ${p}`)
}

interface Found {
  solution: string
  length: number
}
const found = new Map<string, Found>()

function consider(word: string): void {
  const moves = parseSequence(word, "333")
  // The case solved by this word: apply inverse(word) to solved
  const cube = NxnCube.solved(3)
  cube.applyMoves(invertMoves(moves))
  const sig = signature(cube)
  if (!sig) return
  const existing = found.get(sig)
  if (!existing || moves.length < existing.length) {
    found.set(sig, { solution: movesToString(moves), length: moves.length })
  }
}

// Enumerate words: ([AUF] P)^k for k <= 4.
let count = 0
const stack: string[] = []
function rec(depth: number): void {
  for (const auf of AUFS) {
    for (const p of PRIMITIVES) {
      stack.push(auf ? `${auf} ${p}` : p)
      consider(stack.join(" "))
      count++
      if (depth + 1 < 4) rec(depth + 1)
      stack.pop()
    }
  }
}
rec(0)
console.error(`considered ${count} words; found ${found.size} exact signatures`)

// Group into cases up to AUF and keep the shortest solution per class.
function aufClassKey(solution: string): string {
  const cube = NxnCube.solved(3)
  cube.applyMoves(invertMoves(parseSequence(solution, "333")))
  let best: string | null = null
  for (const auf of AUFS) {
    const c = cube.clone()
    if (auf) c.applyMoves(parseSequence(auf, "333"))
    const s = signature(c)
    if (s && (best === null || s < best)) best = s
  }
  return best!
}

const classes = new Map<string, { sig: string; solution: string; length: number }>()
for (const [sig, { solution, length }] of found) {
  const classKey = aufClassKey(solution)
  const existing = classes.get(classKey)
  if (!existing || length < existing.length) {
    classes.set(classKey, { sig, solution, length })
  }
}

console.error(`${classes.size} distinct F2L cases up to AUF`)
const out = [...classes.values()]
  .map(({ sig, solution, length }) => ({ sig, solution, length }))
  .sort((a, b) => a.length - b.length || a.sig.localeCompare(b.sig))
console.log(JSON.stringify(out, null, 1))
