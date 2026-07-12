import { describe, expect, it } from "vitest"
import { ALGORITHM_SETS } from "@/lib/algorithms/sets.gen"
import { extraAlgorithms, pyraminxAlgorithms } from "@/lib/algorithms/extras"
import { algorithms } from "@/lib/algorithms"
import { CUBE_TYPE_TO_PUZZLE, type Algorithm } from "@/lib/algorithms/schema"
import { NxnCube } from "@/lib/puzzle/nxn"
import { PyraminxPuzzle } from "@/lib/puzzle/pyraminx"
import { parseSequence } from "@/lib/puzzle/notation"
import { FACE_ORDER, PYRAMINX_FACE_ORDER, type Face } from "@/lib/puzzle/types"

/**
 * Mechanical validation of the whole algorithm dataset ("tests prove the
 * data"). Every algorithm must parse; each set's algorithms are applied to
 * a solved puzzle and the resulting state (the case's inverse) must respect
 * the set's contract — e.g. a PLL may only permute the last layer, a Winter
 * Variation alg may only touch the last layer and the FR slot.
 *
 * States are checked up to whole-puzzle rotation: an algorithm may end with
 * the cube rotated (x/y/z), so we accept if ANY of the 24 orientations
 * satisfies the predicate.
 */

const ORIENTATION_WORDS = (() => {
  const words: string[] = []
  for (const tilt of ["", "x", "x2", "x'", "z", "z'"]) {
    for (const spin of ["", "y", "y2", "y'"]) {
      words.push([tilt, spin].filter(Boolean).join(" "))
    }
  }
  return words
})()

function statesUpToRotation(n: number, alg: string): NxnCube[] {
  const puzzle = `${n}${n}${n}` as "222" | "333" | "444"
  const base = NxnCube.solved(n)
  base.applyMoves(parseSequence(alg, puzzle))
  return ORIENTATION_WORDS.map((word) => {
    const cube = base.clone()
    if (word) cube.applyMoves(parseSequence(word, puzzle))
    return cube
  })
}

function someOrientation(n: number, alg: string, predicate: (cube: NxnCube) => boolean): boolean {
  return statesUpToRotation(n, alg).some(predicate)
}

/** All stickers outside the U layer (U face + top rows) match their face. */
function onlyLastLayer(n: number) {
  return (cube: NxnCube): boolean => {
    for (const face of ["F", "R", "B", "L"] as Face[]) {
      for (let row = 1; row < n; row++) {
        for (let col = 0; col < n; col++) {
          if (cube.getSticker(face, row, col) !== face) return false
        }
      }
    }
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (cube.getSticker("D", row, col) !== "D") return false
      }
    }
    return true
  }
}

/** onlyLastLayer plus a fully oriented U face (true for any PLL). */
function lastLayerPermutationOnly(n: number) {
  const inner = onlyLastLayer(n)
  return (cube: NxnCube): boolean => {
    if (!inner(cube)) return false
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (cube.getSticker("U", row, col) !== "U") return false
      }
    }
    return true
  }
}

/** Only the U layer and the FR slot may differ (Winter Variation contract). */
function onlyLastLayerAndFrSlot(cube: NxnCube): boolean {
  const free = new Set<string>(["F:1:2", "F:2:2", "R:1:0", "R:2:0", "D:0:2"])
  for (const face of FACE_ORDER) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (face === "U" || (face !== "D" && row === 0)) continue
        if (free.has(`${face}:${row}:${col}`)) continue
        if (cube.getSticker(face, row, col) !== face) return false
      }
    }
  }
  return true
}

/** 2x2: bottom layer fully solved (CLL / 2x2-OLL contract). */
function dLayerSolved(cube: NxnCube): boolean {
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      if (cube.getSticker("D", row, col) !== "D") return false
    }
  }
  for (const face of ["F", "R", "B", "L"] as Face[]) {
    for (let col = 0; col < 2; col++) {
      if (cube.getSticker(face, 1, col) !== face) return false
    }
  }
  return true
}

/** 2x2: both layers oriented (PBL contract). */
function bothLayersOriented(cube: NxnCube): boolean {
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      if (cube.getSticker("U", row, col) !== "U") return false
      if (cube.getSticker("D", row, col) !== "D") return false
    }
  }
  return true
}

/** 2x2: at least one face is a single color (EG-1 starts from a solved face). */
function someFaceUniform(cube: NxnCube): boolean {
  return FACE_ORDER.some((face) => {
    const color = cube.getSticker(face, 0, 0)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        if (cube.getSticker(face, row, col) !== color) return false
      }
    }
    return true
  })
}

interface SetContract {
  key: string
  count: number
  n?: 2 | 3 | 4
  predicate?: (cube: NxnCube) => boolean
}

const CONTRACTS: SetContract[] = [
  { key: "pll", count: 21, n: 3, predicate: lastLayerPermutationOnly(3) },
  { key: "ohpll", count: 21, n: 3, predicate: lastLayerPermutationOnly(3) },
  { key: "2lookpll", count: 6, n: 3, predicate: lastLayerPermutationOnly(3) },
  { key: "oll", count: 57, n: 3, predicate: onlyLastLayer(3) },
  { key: "oholl", count: 57, n: 3, predicate: onlyLastLayer(3) },
  { key: "2lookoll", count: 10, n: 3, predicate: onlyLastLayer(3) },
  { key: "coll", count: 40, n: 3, predicate: onlyLastLayer(3) },
  { key: "wv", count: 27, n: 3, predicate: onlyLastLayerAndFrSlot },
  { key: "2x2oll", count: 7, n: 2, predicate: dLayerSolved },
  { key: "2x2cll", count: 42, n: 2, predicate: dLayerSolved },
  { key: "2x2pbl", count: 5, n: 2, predicate: bothLayersOriented },
  { key: "2x2eg-1", count: 43, n: 2, predicate: someFaceUniform },
  { key: "4x4oll", count: 27, n: 4, predicate: onlyLastLayer(4) },
  { key: "4x4pll", count: 22, n: 4, predicate: onlyLastLayer(4) },
]

function allAlgs(algo: Algorithm): string[] {
  return [algo.algorithm, ...(algo.alternatives ?? [])]
}

describe("algorithm dataset integrity", () => {
  it("has globally unique ids", () => {
    const seen = new Set<string>()
    for (const algo of algorithms) {
      expect(seen.has(algo.id), `duplicate id: ${algo.id}`).toBe(false)
      seen.add(algo.id)
    }
  })

  it("every algorithm (and alternative) parses for its puzzle", () => {
    for (const algo of algorithms) {
      const puzzle = CUBE_TYPE_TO_PUZZLE[algo.cubeType]
      for (const alg of allAlgs(algo)) {
        expect(() => parseSequence(alg, puzzle), `${algo.id}: "${alg}"`).not.toThrow()
      }
    }
  })

  for (const contract of CONTRACTS) {
    const set = ALGORITHM_SETS.find((s) => s.key === contract.key)

    it(`${contract.key}: has ${contract.count} cases and honors its contract`, () => {
      expect(set, contract.key).toBeDefined()
      expect(set!.algorithms.length).toBe(contract.count)
      if (!contract.predicate || !contract.n) return
      for (const algo of set!.algorithms) {
        for (const alg of allAlgs(algo)) {
          expect(
            someOrientation(contract.n, alg, contract.predicate),
            `${algo.id}: "${alg}" violates the ${contract.key} contract`,
          ).toBe(true)
        }
      }
    })
  }

  it("pyraminx last-layer set: distinct, minimal-looking, edge-only states", () => {
    const llCases = pyraminxAlgorithms.filter((a) => a.id.startsWith("pyra-ll-"))
    expect(llCases.length).toBe(11)
    const edgeSlots = new Set([1, 3]) // per-face indices of last-layer edge stickers
    const states = new Set<string>()
    for (const algo of llCases) {
      const p = PyraminxPuzzle.solved()
      p.applyMoves(parseSequence(algo.algorithm, "pyraminx"))
      for (const face of PYRAMINX_FACE_ORDER) {
        for (let i = 0; i < 9; i++) {
          if (face !== "D" && edgeSlots.has(i)) continue
          expect(
            p.getSticker(face, i),
            `${algo.id}: sticker ${face}${i} must stay solved`,
          ).toBe(face)
        }
      }
      const state = p.toFaceletString()
      expect(state.includes("U"), algo.id).toBe(false) // sanity: no foreign letters
      expect(states.has(state), `${algo.id} duplicates another case`).toBe(false)
      states.add(state)
      expect(p.isSolved(), `${algo.id} must not be the identity`).toBe(false)
    }
  })

  it("extras keep the legacy progress ids alive", () => {
    const ids = new Set(extraAlgorithms.map((a) => a.id))
    for (const id of [
      "beginner-middle",
      "beginner-middle-left",
      "beginner-third-layer-plus",
      "beginner-alignment-plus",
      "beginner-correction-corners",
      "beginner-final-part",
      "f2l-1",
      "f2l-2",
      "f2l-3",
      "f2l-4",
      "2x2-layer",
      "pyra-tips",
      "pyra-top-layer",
      "pyra-last-layer",
      "pyra-v",
    ]) {
      expect(ids.has(id), id).toBe(true)
    }
    // These legacy ids moved into the generated sets.
    const generatedIds = new Set(ALGORITHM_SETS.flatMap((s) => s.algorithms.map((a) => a.id)))
    for (const id of ["pll-tperm", "pll-uperm", "pll-h", "oll-sune", "oll-antisune", "oll-1", "2x2-oll"]) {
      expect(generatedIds.has(id), id).toBe(true)
    }
  })
})
