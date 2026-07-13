import { faceLetters, type SolvablePuzzleId } from "@/lib/solver/state-mapping"
import { validateFacelets } from "@/lib/solver/validate"
import { NxnCube } from "@/lib/puzzle/nxn"
import { parseSequence } from "@/lib/puzzle/notation"
import { FACE_ORDER } from "@/lib/puzzle/types"
import type { RGB } from "./sampling"

/**
 * Color classification for scanned faces.
 *
 * Colors are compared in HSV cone space (hue/saturation as a disc scaled by
 * value), which separates white from the chromatic colors without special
 * cases and is robust to overall brightness shifts.
 *
 * - 3x3: the six face-center samples ARE the calibration — every sticker is
 *   assigned to the nearest center color. Lighting-independent.
 * - 2x2 / pyraminx (no fixed centers): samples are clustered into equal-size
 *   groups (balanced k-means), clusters are named by the nearest standard
 *   color, and if the resulting state is invalid we retry the naming under
 *   every whole-puzzle rotation — so holding the puzzle "wrong" still scans.
 */

interface ConePoint {
  x: number
  y: number
  z: number
}

export function rgbToCone({ r, g, b }: RGB): ConePoint {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const v = max
  const s = max === 0 ? 0 : (max - min) / max
  let h = 0
  if (max !== min) {
    if (max === rn) h = ((gn - bn) / (max - min)) % 6
    else if (max === gn) h = (bn - rn) / (max - min) + 2
    else h = (rn - gn) / (max - min) + 4
    h *= 60
    if (h < 0) h += 360
  }
  const rad = (h * Math.PI) / 180
  return { x: s * v * Math.cos(rad), y: s * v * Math.sin(rad), z: v }
}

function coneDistance(a: ConePoint, b: ConePoint): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = (a.z - b.z) * 0.6 // value matters less than chroma
  return dx * dx + dy * dy + dz * dz
}

/** Standard scheme reference colors (used only to NAME clusters, not to match stickers). */
const REFERENCE_RGB: Record<string, RGB> = {
  U: { r: 240, g: 240, b: 240 },
  R: { r: 200, g: 30, b: 40 },
  F: { r: 40, g: 170, b: 70 },
  D: { r: 235, g: 210, b: 40 },
  L: { r: 240, g: 130, b: 30 },
  B: { r: 30, g: 80, b: 200 },
}

/** Pyraminx faces reuse the viewer scheme: F green, R blue, L red, D yellow. */
const PYRAMINX_REFERENCE: Record<string, RGB> = {
  F: { r: 40, g: 170, b: 70 },
  R: { r: 30, g: 80, b: 200 },
  L: { r: 200, g: 30, b: 40 },
  D: { r: 235, g: 210, b: 40 },
}

function nearest(point: ConePoint, centroids: { key: string; cone: ConePoint }[]): string {
  let best = centroids[0].key
  let bestDist = Infinity
  for (const c of centroids) {
    const d = coneDistance(point, c.cone)
    if (d < bestDist) {
      bestDist = d
      best = c.key
    }
  }
  return best
}

/** Balanced k-means: every cluster ends up with exactly `groupSize` members. */
function balancedClusters(
  points: ConePoint[],
  k: number,
  groupSize: number,
  seeds?: ConePoint[],
): number[] {
  let centroids: ConePoint[]
  if (seeds) {
    centroids = [...seeds]
  } else {
    // k-means++-style init: first centroid = brightest point, then max-min.
    centroids = [points.reduce((a, b) => (a.z > b.z ? a : b))]
    while (centroids.length < k) {
      let far = points[0]
      let farDist = -1
      for (const p of points) {
        const d = Math.min(...centroids.map((c) => coneDistance(p, c)))
        if (d > farDist) {
          farDist = d
          far = p
        }
      }
      centroids.push(far)
    }
  }

  let assignment = new Array<number>(points.length).fill(-1)
  for (let iter = 0; iter < 12; iter++) {
    // Balanced assignment: globally cheapest (point, cluster) pairs first.
    const pairs: { p: number; c: number; d: number }[] = []
    for (let p = 0; p < points.length; p++) {
      for (let c = 0; c < k; c++) {
        pairs.push({ p, c, d: coneDistance(points[p], centroids[c]) })
      }
    }
    pairs.sort((a, b) => a.d - b.d)
    const next = new Array<number>(points.length).fill(-1)
    const sizes = new Array<number>(k).fill(0)
    for (const { p, c } of pairs) {
      if (next[p] !== -1 || sizes[c] >= groupSize) continue
      next[p] = c
      sizes[c]++
    }
    const changed = next.some((c, i) => c !== assignment[i])
    assignment = next
    // Recompute centroids.
    for (let c = 0; c < k; c++) {
      let x = 0
      let y = 0
      let z = 0
      for (let p = 0; p < points.length; p++) {
        if (assignment[p] !== c) continue
        x += points[p].x
        y += points[p].y
        z += points[p].z
      }
      centroids[c] = { x: x / groupSize, y: y / groupSize, z: z / groupSize }
    }
    if (!changed) break
  }
  return assignment
}

/** Name clusters with face letters via greedy nearest-reference matching (bijective). */
function nameClusters(
  centroids: ConePoint[],
  reference: Record<string, RGB>,
): string[] {
  const letters = Object.keys(reference)
  const refCones = letters.map((letter) => ({ letter, cone: rgbToCone(reference[letter]) }))
  const pairs: { c: number; letter: string; d: number }[] = []
  centroids.forEach((cone, c) => {
    for (const ref of refCones) {
      pairs.push({ c, letter: ref.letter, d: coneDistance(cone, ref.cone) })
    }
  })
  pairs.sort((a, b) => a.d - b.d)
  const names = new Array<string>(centroids.length).fill("")
  const used = new Set<string>()
  for (const { c, letter } of pairs) {
    if (names[c] !== "" || used.has(letter)) continue
    names[c] = letter
    used.add(letter)
  }
  return names
}

// ---- whole-puzzle rotations (for relabeling when held "wrong") -------------

/** All 24 cube orientations as letter permutations: rotated[face] = letter now at that face. */
function cubeOrientationMaps(): Record<string, string>[] {
  const words: string[] = []
  for (const tilt of ["", "x", "x2", "x'", "z", "z'"]) {
    for (const spin of ["", "y", "y2", "y'"]) {
      words.push([tilt, spin].filter(Boolean).join(" "))
    }
  }
  return words.map((word) => {
    const cube = NxnCube.solved(3)
    if (word) cube.applyMoves(parseSequence(word, "333"))
    const map: Record<string, string> = {}
    for (const face of FACE_ORDER) {
      map[face] = cube.getSticker(face, 1, 1)
    }
    return map
  })
}

/** All 12 tetrahedron orientations for the pyraminx, as face-letter maps. */
function pyraminxOrientationMaps(): Record<string, string>[] {
  type V = "U" | "R" | "L" | "B"
  const faceOf = (set: string): string => {
    const sorted = [...set].sort().join("")
    const table: Record<string, string> = {
      LRU: "F",
      BRU: "R",
      BLU: "L",
      BLR: "D",
    }
    return table[sorted]
  }
  // Vertex images of one third-turn around each vertex (from the model's geometry).
  const generators: Record<V, V>[] = [
    { U: "U", R: "L", L: "B", B: "R" },
    { U: "B", R: "R", L: "U", B: "L" },
    { U: "R", R: "B", L: "L", B: "U" },
    { U: "L", R: "U", L: "R", B: "B" },
  ]
  const identity: Record<V, V> = { U: "U", R: "R", L: "L", B: "B" }
  const compose = (a: Record<V, V>, b: Record<V, V>): Record<V, V> => ({
    U: b[a.U],
    R: b[a.R],
    L: b[a.L],
    B: b[a.B],
  })
  const seen = new Map<string, Record<V, V>>()
  const key = (m: Record<V, V>) => `${m.U}${m.R}${m.L}${m.B}`
  const queue: Record<V, V>[] = [identity]
  seen.set(key(identity), identity)
  while (queue.length > 0) {
    const m = queue.pop()!
    for (const g of generators) {
      const next = compose(m, g)
      if (!seen.has(key(next))) {
        seen.set(key(next), next)
        queue.push(next)
      }
    }
  }
  const faceSets: Record<string, string> = { F: "ULR", R: "URB", L: "UBL", D: "LRB" }
  return [...seen.values()].map((m) => {
    const map: Record<string, string> = {}
    for (const face of ["F", "R", "L", "D"]) {
      const image = [...faceSets[face]].map((v) => m[v as V]).join("")
      map[faceOf(image)] = face
    }
    return map
  })
}

// ---- public API ------------------------------------------------------------

/**
 * Classify all scanned faces into a facelet string.
 *
 * `faceSamples` is one RGB array per scan step, in SCAN_STEPS order (which
 * equals canonical facelet-string face order).
 */
export function classifyScan(puzzle: SolvablePuzzleId, faceSamples: RGB[][]): string {
  const cones = faceSamples.map((face) => face.map(rgbToCone))

  if (puzzle === "333") {
    // Centers calibrate: face i's center sample seeds that letter's cluster,
    // then balanced k-means over all 54 stickers sharpens the boundaries
    // (every color appears exactly 9 times on a real cube).
    const flat = cones.flat()
    const letters = faceLetters(puzzle)
    const seeds = letters.map((_, i) => cones[i][4])
    const assignment = balancedClusters(flat, letters.length, 9, seeds)
    // Cluster identity: the cluster that owns face i's center sticker is
    // letter i (centers cannot move on a 3x3).
    const clusterLetter = new Map<number, string>()
    letters.forEach((letter, i) => {
      clusterLetter.set(assignment[i * 9 + 4], letter)
    })
    if (clusterLetter.size === letters.length) {
      return assignment.map((c) => clusterLetter.get(c)!).join("")
    }
    // Two centers fell into one cluster (severely off scan) — fall back to
    // plain nearest-center classification; review UI will catch the rest.
    const centroids = letters.map((letter, i) => ({ key: letter, cone: cones[i][4] }))
    return flat.map((p) => nearest(p, centroids)).join("")
  }

  const flat = cones.flat()
  const letters = faceLetters(puzzle)
  const groupSize = flat.length / letters.length
  const assignment = balancedClusters(flat, letters.length, groupSize)
  const centroids: ConePoint[] = letters.map((_, c) => {
    let x = 0
    let y = 0
    let z = 0
    flat.forEach((p, i) => {
      if (assignment[i] !== c) return
      x += p.x
      y += p.y
      z += p.z
    })
    return { x: x / groupSize, y: y / groupSize, z: z / groupSize }
  })
  const names = nameClusters(
    centroids,
    puzzle === "pyraminx" ? PYRAMINX_REFERENCE : REFERENCE_RGB,
  )
  const base = assignment.map((c) => names[c]).join("")

  // If naming produced an invalid state, the puzzle may simply be held in a
  // different orientation than the reference scheme — try all rotations.
  if (validateFacelets(puzzle, base).ok) return base
  const maps = puzzle === "pyraminx" ? pyraminxOrientationMaps() : cubeOrientationMaps()
  for (const map of maps) {
    const relabeled = [...base].map((ch) => map[ch] ?? ch).join("")
    if (validateFacelets(puzzle, relabeled).ok) return relabeled
  }
  return base
}

export type FreeScan333Result =
  | { ok: true; facelets: string }
  | { ok: false; message: string }

/** Rotate one row-major 3x3 face grid clockwise by a quarter turn. */
function rotateFace333(face: string): string {
  return [6, 3, 0, 7, 4, 1, 8, 5, 2].map((index) => face[index]).join("")
}

function faceRotations333(face: string): string[] {
  const rotations = [face]
  for (let i = 1; i < 4; i++) rotations.push(rotateFace333(rotations[i - 1]))
  return rotations
}

/**
 * Assemble a freely captured 3x3 scan.
 *
 * Unlike `classifyScan`, the six input faces may arrive in any order and at
 * any in-plane rotation. We use their centers to identify colors, then try
 * the 4^6 possible grid rotations. A candidate is accepted only when the
 * existing physical-state validator agrees that it is a real cube state.
 *
 * This deliberately reports ambiguity instead of guessing: solving the wrong
 * valid state would be much worse than asking the user to use guided scan.
 */
export function classifyFreeScan333(faceSamples: RGB[][]): FreeScan333Result {
  if (faceSamples.length !== 6 || faceSamples.some((face) => face.length !== 9)) {
    return {
      ok: false,
      message: "Show all six 3x3 faces before finishing the automatic scan.",
    }
  }

  const cones = faceSamples.map((face) => face.map(rgbToCone))
  const centers = cones.map((face) => face[4])
  const names = nameClusters(centers, REFERENCE_RGB)
  const flat = cones.flat()

  // Balanced clustering preserves the exactly-nine-of-each-color property
  // while the captured centers provide lighting-specific calibration.
  const assignment = balancedClusters(flat, 6, 9, centers)
  const clusterLetters = new Map<number, string>()
  for (let face = 0; face < 6; face++) {
    const cluster = assignment[face * 9 + 4]
    if (clusterLetters.has(cluster)) {
      return {
        ok: false,
        message: "Two captured faces look like the same center color. Rotate to a different face and try again.",
      }
    }
    clusterLetters.set(cluster, names[face])
  }

  if (clusterLetters.size !== 6 || new Set(names).size !== 6) {
    return {
      ok: false,
      message: "The camera could not distinguish all six center colors. Try more even lighting or use guided scan.",
    }
  }

  if (assignment.some((cluster) => !clusterLetters.has(cluster))) {
    return {
      ok: false,
      message: "The camera could not classify every sticker. Try scanning again in steadier light.",
    }
  }
  const classified = assignment.map((cluster) => clusterLetters.get(cluster)!).join("")

  const faces = new Map<string, string>()
  for (let i = 0; i < 6; i++) {
    const label = names[i]
    const face = classified.slice(i * 9, (i + 1) * 9)
    if (face[4] !== label || faces.has(label)) {
      return {
        ok: false,
        message: "A captured face could not be matched to a unique center color. Try guided scan.",
      }
    }
    faces.set(label, face)
  }

  const order = faceLetters("333")
  const options = order.map((face) => {
    const captured = faces.get(face)
    return captured ? faceRotations333(captured) : []
  })
  if (options.some((rotations) => rotations.length !== 4)) {
    return {
      ok: false,
      message: "One of the six center colors is missing. Show that face again or use guided scan.",
    }
  }

  const validStates = new Set<string>()
  const build = (index: number, selected: string[]): void => {
    if (validStates.size > 1) return
    if (index === options.length) {
      const candidate = selected.join("")
      if (validateFacelets("333", candidate).ok) validStates.add(candidate)
      return
    }
    for (const rotation of options[index]) {
      selected.push(rotation)
      build(index + 1, selected)
      selected.pop()
      if (validStates.size > 1) return
    }
  }
  build(0, [])

  if (validStates.size === 1) return { ok: true, facelets: [...validStates][0] }
  return {
    ok: false,
    message:
      validStates.size === 0
        ? "Those six faces do not form a solvable cube state. Check the lighting and scan again."
        : "The camera found more than one possible face orientation. Use guided scan for this cube.",
  }
}
