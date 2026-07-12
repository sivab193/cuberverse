import { describe, expect, it } from "vitest"
import { pll333 } from "@/lib/algorithms/333-pll"
import { oll333 } from "@/lib/algorithms/333-oll"
import { NxnCube } from "@/lib/puzzle/nxn"
import { parseSequence } from "@/lib/puzzle/notation"
import type { Face } from "@/lib/puzzle"

/**
 * Mechanical validation of the (in-progress) algorithm dataset. Currently
 * covers the authored 3x3 PLL and OLL sets; extend as further sets land
 * (see .gen/ for the machine-verified F2L and 2x2 case generators).
 *
 * Semantic checks apply the algorithm to a SOLVED cube. A last-layer alg
 * maps its case to solved, so applied to solved it produces the inverse
 * case — which must still be confined to the last layer.
 */

const ORIENTATIONS: string[] = (() => {
  const out: string[] = []
  for (const top of ["", "x", "x2", "x'", "z", "z'"]) {
    for (const spin of ["", "y", "y2", "y'"]) {
      out.push([top, spin].filter(Boolean).join(" "))
    }
  }
  return out
})()

/** Apply alg to a solved 3x3 and rotate the result back so centers are solved. */
function applyNormalized(alg: string): NxnCube {
  const cube = NxnCube.solved(3)
  cube.applyMoves(parseSequence(alg, "333"))
  for (const rotation of ORIENTATIONS) {
    const candidate = cube.clone()
    if (rotation) candidate.applyMoves(parseSequence(rotation, "333"))
    const centersSolved = (["U", "R", "F", "D", "L", "B"] as Face[]).every(
      (face) => candidate.getSticker(face, 1, 1) === face,
    )
    if (centersSolved) return candidate
  }
  throw new Error(`Could not normalize orientation after alg: ${alg}`)
}

/** Everything below the last layer is untouched (D face + side rows 1-2). */
function preservesF2L(cube: NxnCube): boolean {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (cube.getSticker("D", row, col) !== "D") return false
    }
  }
  for (const face of ["F", "R", "B", "L"] as Face[]) {
    for (let row = 1; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (cube.getSticker(face, row, col) !== face) return false
      }
    }
  }
  return true
}

/** F2L preserved AND the U face stays fully oriented (true for PLLs). */
function isLastLayerSafe(cube: NxnCube): boolean {
  if (!preservesF2L(cube)) return false
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (cube.getSticker("U", row, col) !== "U") return false
    }
  }
  return true
}

describe("algorithm dataset integrity (authored sets)", () => {
  const all = [...pll333, ...oll333]

  it("has unique ids", () => {
    const seen = new Set<string>()
    for (const algo of all) {
      expect(seen.has(algo.id), `duplicate id: ${algo.id}`).toBe(false)
      seen.add(algo.id)
    }
  })

  it("every algorithm parses", () => {
    for (const algo of all) {
      expect(() => parseSequence(algo.algorithm, "333"), `${algo.id}`).not.toThrow()
      for (const alt of algo.alternatives ?? []) {
        expect(() => parseSequence(alt, "333"), `${algo.id} alt`).not.toThrow()
      }
    }
  })

  it("all 21 PLLs permute only the U layer and preserve orientation", () => {
    expect(pll333.length).toBe(21)
    for (const algo of pll333) {
      const cube = applyNormalized(algo.algorithm)
      expect(isLastLayerSafe(cube), `${algo.id}: "${algo.algorithm}"`).toBe(true)
      expect(cube.isSolved(), `${algo.id} should actually permute something`).toBe(false)
      for (const alt of algo.alternatives ?? []) {
        expect(isLastLayerSafe(applyNormalized(alt)), `${algo.id} alt "${alt}"`).toBe(true)
      }
    }
  })

  it("all 57 OLLs preserve F2L", () => {
    // Applied to solved, an OLL yields its inverse case: F2L must be intact,
    // but the U face is (correctly) misoriented, so only F2L is checkable.
    expect(oll333.length).toBe(57)
    for (const algo of oll333) {
      const cube = applyNormalized(algo.algorithm)
      expect(preservesF2L(cube), `${algo.id}: "${algo.algorithm}"`).toBe(true)
      for (const alt of algo.alternatives ?? []) {
        expect(preservesF2L(applyNormalized(alt)), `${algo.id} alt "${alt}"`).toBe(true)
      }
    }
  })
})
