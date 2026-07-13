import { describe, expect, it } from "vitest"
import { classifyScan } from "@/lib/scanner/classify"
import { faceLetters, type SolvablePuzzleId } from "@/lib/solver/state-mapping"
import { validateFacelets } from "@/lib/solver/validate"
import { NxnCube } from "@/lib/puzzle/nxn"
import { PyraminxPuzzle } from "@/lib/puzzle/pyraminx"
import { parseSequence } from "@/lib/puzzle/notation"
import { FACE_ORDER, PYRAMINX_FACE_ORDER } from "@/lib/puzzle/types"
import type { RGB } from "@/lib/scanner/sampling"

/**
 * Simulate a camera scan: take a known scrambled state, render each sticker
 * as a "measured" RGB (a slightly noisy version of a realistic palette), and
 * check the classifier recovers the exact facelet string.
 */

// Deliberately NOT the classifier's reference palette — off-hue and dimmer,
// like a real cube under warm indoor light.
const MEASURED: Record<string, RGB> = {
  U: { r: 205, g: 208, b: 198 },
  R: { r: 168, g: 42, b: 55 },
  F: { r: 52, g: 138, b: 84 },
  D: { r: 198, g: 176, b: 52 },
  L: { r: 205, g: 118, b: 46 },
  B: { r: 40, g: 76, b: 158 },
}

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

function noisy(rgb: RGB, rng: () => number, amount: number): RGB {
  const jitter = () => (rng() - 0.5) * 2 * amount
  return {
    r: Math.min(255, Math.max(0, rgb.r + jitter())),
    g: Math.min(255, Math.max(0, rgb.g + jitter())),
    b: Math.min(255, Math.max(0, rgb.b + jitter())),
  }
}

function nxnScanSamples(n: number, puzzle: SolvablePuzzleId, alg: string, seed: number): {
  samples: RGB[][]
  expected: string
} {
  const rng = mulberry32(seed)
  const cube = NxnCube.solved(n)
  if (alg) cube.applyMoves(parseSequence(alg, puzzle))
  const samples: RGB[][] = []
  let expected = ""
  for (const face of FACE_ORDER) {
    const faceSamples: RGB[] = []
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const letter = cube.getSticker(face, r, c)
        expected += letter
        faceSamples.push(noisy(MEASURED[letter], rng, 18))
      }
    }
    samples.push(faceSamples)
  }
  return { samples, expected }
}

function pyraminxScanSamples(alg: string, seed: number): { samples: RGB[][]; expected: string } {
  const rng = mulberry32(seed)
  const p = PyraminxPuzzle.solved()
  if (alg) p.applyMoves(parseSequence(alg, "pyraminx"))
  // Pyraminx letters name different colors (F green, R blue, L red, D yellow).
  const measured: Record<string, RGB> = {
    F: MEASURED.F,
    R: MEASURED.B,
    L: MEASURED.R,
    D: MEASURED.D,
  }
  const samples: RGB[][] = []
  let expected = ""
  for (const face of PYRAMINX_FACE_ORDER) {
    const faceSamples: RGB[] = []
    for (let i = 0; i < 9; i++) {
      const letter = p.getSticker(face, i)
      expected += letter
      faceSamples.push(noisy(measured[letter], rng, 18))
    }
    samples.push(faceSamples)
  }
  return { samples, expected }
}

describe("classifyScan", () => {
  it("3x3: recovers a scrambled state from noisy colors", () => {
    const { samples, expected } = nxnScanSamples(
      3,
      "333",
      "R U R' U' F2 L D' B U2 R' D L2 F' U B2",
      1,
    )
    expect(classifyScan("333", samples)).toBe(expected)
  })

  it("2x2: recovers a scrambled state via clustering", () => {
    const { samples, expected } = nxnScanSamples(2, "222", "R U' F2 U R' F U2 R'", 2)
    const got = classifyScan("222", samples)
    expect(got).toBe(expected)
  })

  it("pyraminx: recovers a scrambled state via clustering", () => {
    const { samples, expected } = pyraminxScanSamples("U L' R B' u l' U R'", 3)
    expect(classifyScan("pyraminx", samples)).toBe(expected)
  })

  it("classified scans validate", () => {
    for (const [puzzle, seed] of [
      ["333", 4],
      ["222", 5],
    ] as const) {
      const n = puzzle === "333" ? 3 : 2
      const { samples } = nxnScanSamples(n, puzzle, "R U R' F' U2", seed)
      const result = validateFacelets(puzzle, classifyScan(puzzle, samples))
      expect(result.ok, puzzle).toBe(true)
    }
  })

  it("solved-color counts per face letter are balanced after classification", () => {
    const { samples } = nxnScanSamples(3, "333", "L2 B D' R F2 U'", 6)
    const got = classifyScan("333", samples)
    for (const letter of faceLetters("333")) {
      expect([...got].filter((ch) => ch === letter).length).toBe(9)
    }
  })
})
