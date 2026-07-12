/**
 * Derive the sticker <-> facelet correspondence between cubing.js KPuzzle
 * patterns and our lib/puzzle facelet models, for 3x3, 2x2 and pyraminx.
 *
 * A KPuzzle "sticker" is (orbit, slot, orientationIndex). For every probe
 * move we know its action on K-stickers (from the KPuzzle transformation)
 * and its action on facelets (by labeling our model's stickers uniquely).
 * The unknown bijection M: sticker -> facelet must commute with every move:
 * M(moveK(s)) = moveF(M(s)). We anchor one sticker per reachability
 * component, propagate, and keep the (unique) candidate that reproduces our
 * model's facelet colors over random scrambles.
 *
 * Emits lib/solver/kpattern-tables.gen.ts. Run from the repo root:
 *   node <path-to-tsx>/cli.mjs .gen/kpattern-map-gen.ts
 */
import { writeFileSync } from "node:fs"
import { puzzles } from "cubing/puzzles"
import type { KPuzzle } from "cubing/kpuzzle"
import { NxnCube } from "../lib/puzzle/nxn"
import { PyraminxPuzzle } from "../lib/puzzle/pyraminx"
import { parseSequence } from "../lib/puzzle/notation"
import { FACE_ORDER, PYRAMINX_FACE_ORDER, type Face, type PuzzleId } from "../lib/puzzle/types"

interface FaceletModel {
  count: number
  faceOf: (f: number) => string
  /** Facelet permutation of a move as content-flow: result[dest] = src. */
  movePermutation: (move: string) => number[]
  /** Facelet colors (face letters) after applying an alg to solved. */
  faceletsAfter: (alg: string) => string[]
}

function nxnModel(n: number, puzzleId: PuzzleId): FaceletModel {
  const count = 6 * n * n
  const readAll = (cube: NxnCube): string[] => {
    const out: string[] = []
    for (const face of FACE_ORDER) {
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) out.push(cube.getSticker(face, r, c))
      }
    }
    return out
  }
  const writeAll = (cube: NxnCube, values: string[]): void => {
    let i = 0
    for (const face of FACE_ORDER) {
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) cube.setSticker(face, r, c, values[i++] as Face)
      }
    }
  }
  return {
    count,
    faceOf: (f) => FACE_ORDER[Math.floor(f / (n * n))],
    movePermutation: (move) => {
      const cube = NxnCube.solved(n)
      writeAll(cube, [...Array(count).keys()].map(String))
      cube.applyMoves(parseSequence(move, puzzleId))
      const after = readAll(cube)
      const perm = new Array<number>(count)
      after.forEach((label, dest) => {
        perm[dest] = Number(label)
      })
      return perm
    },
    faceletsAfter: (alg) => {
      const cube = NxnCube.solved(n)
      cube.applyMoves(parseSequence(alg, puzzleId))
      return readAll(cube)
    },
  }
}

function pyraminxModel(): FaceletModel {
  const count = 36
  const readAll = (p: PyraminxPuzzle): string[] => {
    const out: string[] = []
    for (const face of PYRAMINX_FACE_ORDER) {
      for (let i = 0; i < 9; i++) out.push(p.getSticker(face, i))
    }
    return out
  }
  return {
    count,
    faceOf: (f) => PYRAMINX_FACE_ORDER[Math.floor(f / 9)],
    movePermutation: (move) => {
      const p = PyraminxPuzzle.solved()
      let i = 0
      for (const face of PYRAMINX_FACE_ORDER) {
        for (let k = 0; k < 9; k++) p.setSticker(face, k, String(i++))
      }
      p.applyMoves(parseSequence(move, "pyraminx"))
      const after = readAll(p)
      const perm = new Array<number>(count)
      after.forEach((label, dest) => {
        perm[dest] = Number(label)
      })
      return perm
    },
    faceletsAfter: (alg) => {
      const p = PyraminxPuzzle.solved()
      p.applyMoves(parseSequence(alg, "pyraminx"))
      return readAll(p)
    },
  }
}

interface OrbitInfo {
  name: string
  numPieces: number
  /** Effective orientation count (1 if the definition ignores orientation). */
  numOri: number
}

type StickerId = number // orbitIndex * 10000 + slot * 10 + ori (small spaces)

function sid(orbit: number, slot: number, ori: number): StickerId {
  return orbit * 10000 + slot * 10 + ori
}

interface PuzzleSpec {
  key: string
  model: FaceletModel
  probeMoves: string[]
  randomMovePool: string[]
}

async function derive(spec: PuzzleSpec, kpuzzle: KPuzzle) {
  const { model } = spec
  const defOrbits = kpuzzle.definition.orbits
  const defaultData = kpuzzle.defaultPattern().patternData

  const orbits: OrbitInfo[] = defOrbits.map((o) => {
    const orientationMod = (
      defaultData[o.orbitName] as { orientationMod?: number[] }
    ).orientationMod
    const ignoresOri = orientationMod !== undefined && orientationMod.every((m) => m === 1)
    return {
      name: o.orbitName,
      numPieces: o.numPieces,
      numOri: ignoresOri ? 1 : o.numOrientations,
    }
  })

  const totalStickers = orbits.reduce((sum, o) => sum + o.numPieces * o.numOri, 0)
  if (totalStickers !== model.count) {
    throw new Error(
      `${spec.key}: sticker count mismatch (kpuzzle ${totalStickers} vs facelets ${model.count})`,
    )
  }

  // Per-move permutations on both sides.
  const kPerms = new Map<string, Map<StickerId, StickerId>>()
  const fPerms = new Map<string, number[]>()
  for (const move of spec.probeMoves) {
    const t = kpuzzle.algToTransformation(move).transformationData
    const kmap = new Map<StickerId, StickerId>()
    orbits.forEach((orbit, oi) => {
      const { permutation, orientationDelta } = t[orbit.name]
      for (let slot = 0; slot < orbit.numPieces; slot++) {
        const src = permutation[slot]
        for (let ori = 0; ori < orbit.numOri; ori++) {
          kmap.set(sid(oi, src, ori), sid(oi, slot, (ori + orientationDelta[slot]) % orbit.numOri))
        }
      }
    })
    kPerms.set(move, kmap)
    fPerms.set(move, model.movePermutation(move))
  }

  // Reachability components on the K side.
  const allStickers: StickerId[] = []
  orbits.forEach((orbit, oi) => {
    for (let slot = 0; slot < orbit.numPieces; slot++) {
      for (let ori = 0; ori < orbit.numOri; ori++) allStickers.push(sid(oi, slot, ori))
    }
  })
  const componentOf = new Map<StickerId, number>()
  const components: StickerId[][] = []
  for (const start of allStickers) {
    if (componentOf.has(start)) continue
    const comp: StickerId[] = []
    const queue = [start]
    componentOf.set(start, components.length)
    while (queue.length > 0) {
      const s = queue.pop()!
      comp.push(s)
      for (const kmap of kPerms.values()) {
        const next = kmap.get(s)!
        if (!componentOf.has(next)) {
          componentOf.set(next, components.length)
          queue.push(next)
        }
      }
    }
    components.push(comp)
  }

  // Random verification algs (shared across components).
  const algs: string[] = []
  for (let i = 0; i < 60; i++) {
    const moves: string[] = []
    for (let j = 0; j < 20; j++) {
      const base = spec.randomMovePool[Math.floor(Math.random() * spec.randomMovePool.length)]
      moves.push(Math.random() < 0.5 ? base : `${base}'`)
    }
    algs.push(moves.join(" "))
  }
  const kStates = algs.map((alg) => kpuzzle.defaultPattern().applyAlg(alg).patternData)
  const fStates = algs.map((alg) => model.faceletsAfter(alg))

  // Solve each component: anchor -> BFS propagate -> verify against algs.
  const mapping = new Map<StickerId, number>()
  const usedFacelets = new Set<number>()

  for (const comp of components) {
    const anchor = comp[0]

    // Fixed singleton stickers (3x3 centers): every face move fixes them, so
    // commutation and color checks can't tell them apart. But a face move
    // twists exactly its own center, which shows up in the raw (pre-
    // orientationMod) orientationDelta.
    if (comp.length === 1) {
      const orbitIdx = Math.floor(anchor / 10000)
      const slot = Math.floor((anchor % 10000) / 10)
      const orbitName = orbits[orbitIdx].name
      const twistingMoves = spec.probeMoves.filter(
        (m) =>
          kpuzzle.algToTransformation(m).transformationData[orbitName].orientationDelta[slot] !==
          0,
      )
      if (twistingMoves.length !== 1) {
        throw new Error(
          `${spec.key}: fixed sticker in ${orbitName} slot ${slot} twisted by ${twistingMoves.length} probe moves, expected exactly 1`,
        )
      }
      const face = twistingMoves[0]
      const candidates: number[] = []
      for (let f = 0; f < model.count; f++) {
        if (usedFacelets.has(f) || model.faceOf(f) !== face) continue
        if (spec.probeMoves.every((m) => fPerms.get(m)![f] === f)) candidates.push(f)
      }
      if (candidates.length !== 1) {
        throw new Error(
          `${spec.key}: expected exactly 1 fixed ${face}-facelet for ${orbitName} slot ${slot}, found ${candidates.length}`,
        )
      }
      mapping.set(anchor, candidates[0])
      usedFacelets.add(candidates[0])
      continue
    }

    const survivors: Map<StickerId, number>[] = []

    for (let f0 = 0; f0 < model.count; f0++) {
      if (usedFacelets.has(f0)) continue
      const local = new Map<StickerId, number>([[anchor, f0]])
      const reverse = new Map<number, StickerId>([[f0, anchor]])
      const queue: StickerId[] = [anchor]
      let ok = true
      while (ok && queue.length > 0) {
        const s = queue.pop()!
        const f = local.get(s)!
        for (const [move, kmap] of kPerms) {
          const s2 = kmap.get(s)!
          const fPerm = fPerms.get(move)!
          // content-flow: fPerm[dest] = src, so dest of f is its index lookup
          const f2 = fPerm.indexOf(f)
          const existing = local.get(s2)
          if (existing !== undefined) {
            if (existing !== f2) {
              ok = false
              break
            }
          } else if (reverse.has(f2)) {
            ok = false
            break
          } else {
            local.set(s2, f2)
            reverse.set(f2, s2)
            queue.push(s2)
          }
        }
      }
      if (!ok || local.size !== comp.length) continue

      // Verify: predicted facelet colors must match the model on every alg.
      // Prediction needs the whole-orbit mapping for piece lookups; within a
      // component pieces stay inside it for our probe groups, so `local`
      // suffices.
      let verified = true
      for (let a = 0; a < algs.length && verified; a++) {
        const pat = kStates[a]
        for (const s of comp) {
          const orbitIdx = Math.floor(s / 10000)
          const slot = Math.floor((s % 10000) / 10)
          const ori = s % 10
          const orbit = orbits[orbitIdx]
          const { pieces, orientation } = pat[orbit.name]
          const srcOri = (((ori - orientation[slot]) % orbit.numOri) + orbit.numOri) % orbit.numOri
          const srcSticker = sid(orbitIdx, pieces[slot], srcOri)
          const srcFacelet = local.get(srcSticker)
          if (srcFacelet === undefined) {
            verified = false
            break
          }
          const predicted = model.faceOf(srcFacelet)
          if (fStates[a][local.get(s)!] !== predicted) {
            verified = false
            break
          }
        }
      }
      if (verified) survivors.push(local)
    }

    // A global orientation-index shift commutes with every move and yields
    // the identical facelets->pattern function, so up to numOri survivors
    // that differ only by such a shift are all equally correct.
    const anchorOrbitIdx = Math.floor(anchor / 10000)
    const anchorOrbit = orbits[anchorOrbitIdx]
    const shiftOf = (s: StickerId, d: number): StickerId =>
      sid(
        Math.floor(s / 10000),
        Math.floor((s % 10000) / 10),
        ((s % 10) + d) % anchorOrbit.numOri,
      )
    const equivalent = survivors.every((m) => {
      for (let d = 0; d < anchorOrbit.numOri; d++) {
        let match = true
        for (const [s, f] of survivors[0]) {
          if (m.get(shiftOf(s, d)) !== f) {
            match = false
            break
          }
        }
        if (match) return true
      }
      return false
    })
    if (survivors.length === 0 || survivors.length > anchorOrbit.numOri || !equivalent) {
      throw new Error(
        `${spec.key}: component of size ${comp.length} (anchor orbit ${anchorOrbit.name}) has ${survivors.length} consistent mappings that are not shift-equivalent`,
      )
    }
    for (const [s, f] of survivors[0]) {
      mapping.set(s, f)
      usedFacelets.add(f)
    }
  }

  if (mapping.size !== model.count || usedFacelets.size !== model.count) {
    throw new Error(`${spec.key}: mapping is not a bijection`)
  }

  // Emit per-orbit tables: facelet[piece][ori].
  return orbits.map((orbit, oi) => ({
    name: orbit.name,
    numOrientations: orbit.numOri,
    facelet: Array.from({ length: orbit.numPieces }, (_, piece) =>
      Array.from({ length: orbit.numOri }, (_, ori) => mapping.get(sid(oi, piece, ori))!),
    ),
  }))
}

const specs: { spec: PuzzleSpec; loader: () => Promise<KPuzzle> }[] = [
  {
    spec: {
      key: "333",
      model: nxnModel(3, "333"),
      probeMoves: ["U", "R", "F", "D", "L", "B"],
      randomMovePool: ["U", "R", "F", "D", "L", "B"],
    },
    loader: () => puzzles["3x3x3"].kpuzzle(),
  },
  {
    spec: {
      key: "222",
      model: nxnModel(2, "222"),
      probeMoves: ["U", "R", "F", "D", "L", "B"],
      randomMovePool: ["U", "R", "F", "D", "L", "B"],
    },
    loader: () => puzzles["2x2x2"].kpuzzle(),
  },
  {
    spec: {
      key: "pyraminx",
      model: pyraminxModel(),
      probeMoves: ["U", "L", "R", "B", "u", "l", "r", "b"],
      randomMovePool: ["U", "L", "R", "B", "u", "l", "r", "b"],
    },
    loader: () => puzzles.pyraminx.kpuzzle(),
  },
]

async function main(): Promise<void> {
  const out: Record<
    string,
    { name: string; numOrientations: number; facelet: number[][] }[]
  > = {}
  for (const { spec, loader } of specs) {
    const kpuzzle = await loader()
    out[spec.key] = await derive(spec, kpuzzle)
    console.error(`${spec.key}: ok (${out[spec.key].map((o) => o.name).join(", ")})`)
  }

  const file = `/**
 * GENERATED by .gen/kpattern-map-gen.ts — do not edit by hand.
 *
 * For each puzzle and KPuzzle orbit: \`facelet[piece][ori]\` is the index in
 * our canonical facelet string (lib/puzzle toFaceletString order) of the
 * sticker that piece shows at that orientation index when solved. Derived
 * mechanically from cubing.js move transformations and verified against
 * random scrambles on both models.
 */

export interface OrbitTable {
  name: string
  numOrientations: number
  facelet: number[][]
}

export const KPATTERN_TABLES: Record<"333" | "222" | "pyraminx", OrbitTable[]> = {
${Object.entries(out)
  .map(
    ([key, orbitTables]) =>
      `  "${key}": [\n${orbitTables
        .map(
          (o) =>
            `    {\n      name: "${o.name}",\n      numOrientations: ${o.numOrientations},\n      facelet: [\n${o.facelet
              .map((row) => `        [${row.join(", ")}],`)
              .join("\n")}\n      ],\n    },`,
        )
        .join("\n")}\n  ],`,
  )
  .join("\n")}
}
`
  writeFileSync("lib/solver/kpattern-tables.gen.ts", file)
  console.error("wrote lib/solver/kpattern-tables.gen.ts")
}

void main()
