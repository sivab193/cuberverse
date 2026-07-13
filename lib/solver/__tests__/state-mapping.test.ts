import { describe, expect, it } from "vitest"
import * as kpuzzleMod from "cubing/kpuzzle"
import * as puzzlesMod from "cubing/puzzles"
import { NxnCube } from "@/lib/puzzle/nxn"
import { PyraminxPuzzle } from "@/lib/puzzle/pyraminx"
import { parseSequence } from "@/lib/puzzle/notation"
import { FACE_ORDER, PYRAMINX_FACE_ORDER } from "@/lib/puzzle/types"
import { patternDataFromFacelets, type SolvablePuzzleId } from "@/lib/solver/state-mapping"
import { validateFacelets } from "@/lib/solver/validate"

/**
 * Ground truth for the generated mapping tables: applying the same random
 * alg to our facelet models and to cubing's KPuzzle must produce, through
 * `patternDataFromFacelets`, exactly cubing's own pattern data.
 */

function nxnFacelets(n: number, puzzle: SolvablePuzzleId, alg: string): string {
  const cube = NxnCube.solved(n)
  cube.applyMoves(parseSequence(alg, puzzle === "pyraminx" ? "333" : puzzle))
  let out = ""
  for (const face of FACE_ORDER) {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out += cube.getSticker(face, r, c)
  }
  return out
}

function pyraminxFacelets(alg: string): string {
  const p = PyraminxPuzzle.solved()
  p.applyMoves(parseSequence(alg, "pyraminx"))
  let out = ""
  for (const face of PYRAMINX_FACE_ORDER) {
    for (let i = 0; i < 9; i++) out += p.getSticker(face, i)
  }
  return out
}

function randomAlg(pool: string[], length: number, rng: () => number): string {
  const moves: string[] = []
  for (let i = 0; i < length; i++) {
    const base = pool[Math.floor(rng() * pool.length)]
    moves.push(rng() < 0.5 ? base : `${base}'`)
  }
  return moves.join(" ")
}

// Deterministic PRNG so failures reproduce.
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CASES: {
  puzzle: SolvablePuzzleId
  loaderKey: "3x3x3" | "2x2x2" | "pyraminx"
  pool: string[]
  facelets: (alg: string) => string
}[] = [
  {
    puzzle: "333",
    loaderKey: "3x3x3",
    pool: ["U", "R", "F", "D", "L", "B"],
    facelets: (alg) => nxnFacelets(3, "333", alg),
  },
  {
    puzzle: "222",
    loaderKey: "2x2x2",
    pool: ["U", "R", "F", "D", "L", "B"],
    facelets: (alg) => nxnFacelets(2, "222", alg),
  },
  {
    puzzle: "pyraminx",
    loaderKey: "pyraminx",
    pool: ["U", "L", "R", "B", "u", "l", "r", "b"],
    facelets: pyraminxFacelets,
  },
]

describe("patternDataFromFacelets matches cubing's own patterns", () => {
  for (const c of CASES) {
    it(`${c.puzzle}: 40 random scrambles`, async () => {
      const kpuzzle = await puzzlesMod.puzzles[c.loaderKey].kpuzzle()
      const rng = mulberry32(0xc0ffee)
      for (let i = 0; i < 40; i++) {
        const alg = randomAlg(c.pool, 20, rng)
        const expected = kpuzzle.defaultPattern().applyAlg(alg).patternData
        const result = patternDataFromFacelets(c.puzzle, c.facelets(alg))
        expect(result.ok, `${c.puzzle} alg: ${alg}`).toBe(true)
        if (!result.ok) continue
        for (const orbit of kpuzzle.definition.orbits) {
          const got = result.patternData[orbit.orbitName]
          const want = expected[orbit.orbitName]
          expect(got.pieces, `${orbit.orbitName} pieces, alg: ${alg}`).toEqual([...want.pieces])
          const mod = (want as { orientationMod?: number[] }).orientationMod
          if (!mod || mod.some((m) => m !== 1)) {
            expect(got.orientation, `${orbit.orbitName} ori, alg: ${alg}`).toEqual([
              ...want.orientation,
            ])
          }
        }
      }
    })
  }
})

describe("KPattern construction round-trip", () => {
  for (const c of CASES) {
    it(`${c.puzzle}: constructed pattern is identical to cubing's`, async () => {
      const kpuzzle = await puzzlesMod.puzzles[c.loaderKey].kpuzzle()
      const rng = mulberry32(0xbeef)
      for (let i = 0; i < 10; i++) {
        const alg = randomAlg(c.pool, 15, rng)
        const expected = kpuzzle.defaultPattern().applyAlg(alg)
        const result = patternDataFromFacelets(c.puzzle, c.facelets(alg))
        expect(result.ok).toBe(true)
        if (!result.ok) continue
        const pattern = new kpuzzleMod.KPattern(kpuzzle, result.patternData)
        expect(pattern.isIdentical(expected), `alg: ${alg}`).toBe(true)
      }
    })
  }
})

describe("validateFacelets", () => {
  it("accepts solved and scrambled legal states", () => {
    expect(validateFacelets("333", nxnFacelets(3, "333", "R U R' U'")).ok).toBe(true)
    expect(validateFacelets("222", nxnFacelets(2, "222", "R U2 F'")).ok).toBe(true)
    expect(validateFacelets("pyraminx", pyraminxFacelets("U L' R b")).ok).toBe(true)
  })

  it("rejects wrong color counts", () => {
    const bad = `${"U".repeat(10)}${nxnFacelets(3, "333", "").slice(10)}`
    const result = validateFacelets("333", bad)
    expect(result.ok).toBe(false)
  })

  it("rejects a twisted corner on 3x3", () => {
    // Twist the UFR corner in place: cycle its three sticker colors.
    const cube = NxnCube.solved(3)
    const u = cube.getSticker("U", 2, 2)
    const f = cube.getSticker("F", 0, 2)
    const r = cube.getSticker("R", 0, 0)
    cube.setSticker("U", 2, 2, r)
    cube.setSticker("F", 0, 2, u)
    cube.setSticker("R", 0, 0, f)
    let out = ""
    for (const face of FACE_ORDER) {
      for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) out += cube.getSticker(face, row, col)
    }
    const result = validateFacelets("333", out)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].message).toMatch(/twisted/i)
    }
  })

  it("rejects two swapped edges on 3x3", () => {
    // Swap UF and UR edges (both stickers) — parity violation.
    const cube = NxnCube.solved(3)
    const uf: [string, string] = [cube.getSticker("U", 2, 1), cube.getSticker("F", 0, 1)]
    const ur: [string, string] = [cube.getSticker("U", 1, 2), cube.getSticker("R", 0, 1)]
    cube.setSticker("U", 2, 1, ur[0])
    cube.setSticker("F", 0, 1, ur[1])
    cube.setSticker("U", 1, 2, uf[0])
    cube.setSticker("R", 0, 1, uf[1])
    let out = ""
    for (const face of FACE_ORDER) {
      for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) out += cube.getSticker(face, row, col)
    }
    const result = validateFacelets("333", out)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].message).toMatch(/swapped/i)
    }
  })

  it("rejects a mis-scanned sticker with the offending facelets highlighted", () => {
    // Swap a corner sticker with a center sticker (preserves color counts):
    // the UFR corner then shows two F colors — no such piece exists.
    const solved = nxnFacelets(3, "333", "")
    const chars = [...solved]
    const cornerIdx = 8 // U(2,2), part of the UFR corner
    const centerIdx = 22 // F(1,1), the F center
    ;[chars[cornerIdx], chars[centerIdx]] = [chars[centerIdx], chars[cornerIdx]]
    const result = validateFacelets("333", chars.join(""))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.facelets.length > 0)).toBe(true)
    }
  })
})
