/**
 * Full-space BFS of the 2x2 (DLB corner fixed by using only R/U/F moves).
 * Collects every state with the D layer solved (CLL cases) or both layers
 * oriented (PBL cases), classifies them up to AUF + y-rotation, and extracts
 * an optimal solution for each class by greedy descent on BFS distance.
 */
import { NxnCube } from "../lib/puzzle/nxn"
import { parseSequence, movesToString } from "../lib/puzzle/notation"

type Face = "U" | "R" | "F" | "D" | "L" | "B"
const MOVE_STRS = ["R", "R'", "R2", "U", "U'", "U2", "F", "F'", "F2"]
const MOVES = MOVE_STRS.map((m) => ({ str: m, move: parseSequence(m, "222")[0] }))

function stateOf(cube: NxnCube): string {
  return cube.toFaceletString()
}
function cubeOf(state: string): NxnCube {
  const cube = NxnCube.solved(2)
  let i = 0
  for (const face of ["U", "R", "F", "D", "L", "B"] as Face[]) {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) cube.setSticker(face, r, c, state[i++])
  }
  return cube
}

const dist = new Map<string, number>()
const solvedState = stateOf(NxnCube.solved(2))
dist.set(solvedState, 0)
let frontier: string[] = [solvedState]
let depth = 0
while (frontier.length > 0) {
  depth++
  const next: string[] = []
  for (const state of frontier) {
    const cube = cubeOf(state)
    for (const { move } of MOVES) {
      const c = cube.clone()
      c.applyMove(move)
      const s = stateOf(c)
      if (!dist.has(s)) {
        dist.set(s, depth)
        next.push(s)
      }
    }
  }
  console.error(`depth ${depth}: +${next.length} states (total ${dist.size})`)
  frontier = next
}

// Optimal solution via greedy descent
function solve(state: string): string {
  const path: string[] = []
  let current = state
  let d = dist.get(state)!
  while (d > 0) {
    const cube = cubeOf(current)
    let advanced = false
    for (const { str, move } of MOVES) {
      const c = cube.clone()
      c.applyMove(move)
      const s = stateOf(c)
      if (dist.get(s) === d - 1) {
        path.push(str)
        current = s
        d--
        advanced = true
        break
      }
    }
    if (!advanced) throw new Error("descent stuck")
  }
  return path.join(" ")
}

// Collect CLL states (D layer fully solved) and orientation info
function dLayerSolved(cube: NxnCube): boolean {
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) if (cube.getSticker("D", r, c) !== "D") return false
  for (const f of ["F", "R", "B", "L"] as Face[]) {
    for (let c = 0; c < 2; c++) if (cube.getSticker(f, 1, c) !== f) return false
  }
  return true
}
function bothOriented(cube: NxnCube): boolean {
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      if (cube.getSticker("U", r, c) !== "U") return false
      if (cube.getSticker("D", r, c) !== "D") return false
    }
  }
  return true
}

const AUF = ["", "U", "U'", "U2"].map((m) => (m ? parseSequence(m, "222") : []))
const YROT = ["", "y", "y2", "y'"].map((m) => (m ? parseSequence(m, "222") : []))

// y rotation moves the fixed DLB corner — normalize by re-anchoring: after a
// y rotation the D layer is still solved-looking (uniform colors) only if we
// recolor. Instead, classify up to AUF only, then merge classes that have
// identical U-face orientation pattern + relative permutation by comparing
// color-relabeled signatures.
function relabelSignature(cube: NxnCube): string {
  // Relabel side colors so F is whatever color is at F(1,0) etc. — since the
  // D layer is solved, side colors are canonical already; to mod out y we
  // relabel colors: map F->1, R->2, B->3, L->4 cyclically starting from each
  // side, take the min.
  const faces: Face[] = ["F", "R", "B", "L"]
  const strs: string[] = []
  for (let start = 0; start < 4; start++) {
    const map: Record<string, string> = { U: "U", D: "D" }
    for (let i = 0; i < 4; i++) {
      map[faces[(start + i) % 4]] = "abcd"[i]
    }
    // signature: U face + row 0 of sides in rotated reading order
    let sig = ""
    // U face read rotated: rotate U coordinates by start quarter turns
    const uCoords: [number, number][][] = [
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
      [
        [1, 0],
        [0, 0],
        [1, 1],
        [0, 1],
      ],
      [
        [1, 1],
        [1, 0],
        [0, 1],
        [0, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [0, 0],
        [1, 0],
      ],
    ]
    for (const [r, c] of uCoords[start]) sig += map[cube.getSticker("U", r, c)]
    for (let i = 0; i < 4; i++) {
      const face = faces[(start + i) % 4]
      sig += map[cube.getSticker(face, 0, 0)] + map[cube.getSticker(face, 0, 1)]
    }
    strs.push(sig)
  }
  return strs.sort()[0]
}

interface CaseOut {
  kind: string
  classKey: string
  solution: string
  length: number
  uPattern: string
}

const classes = new Map<string, CaseOut>()
for (const [state, d] of dist) {
  if (d === 0) continue
  const cube = cubeOf(state)
  const isCll = dLayerSolved(cube)
  const isPbl = bothOriented(cube)
  if (!isCll && !isPbl) continue

  // class key: min over AUF of relabeled signature
  let best: string | null = null
  for (const auf of AUF) {
    const c = cube.clone()
    c.applyMoves(auf)
    const sig = relabelSignature(c)
    if (best === null || sig < best) best = sig
  }
  const kind = isCll && isPbl ? "PBL" : isCll ? "CLL" : "PBL-both"
  const key = `${kind}|${best}`
  const existing = classes.get(key)
  if (!existing || d < existing.length) {
    // U orientation pattern: which U positions show U color
    const uPattern = [0, 1, 2, 3]
      .map((i) => (cube.getSticker("U", Math.floor(i / 2), i % 2) === "U" ? "o" : "x"))
      .join("")
    classes.set(key, { kind, classKey: best!, solution: solve(state), length: d, uPattern })
  }
}

console.error(`classes: ${classes.size}`)
const out = [...classes.values()].sort(
  (a, b) => a.kind.localeCompare(b.kind) || a.length - b.length,
)
console.log(JSON.stringify(out, null, 1))
