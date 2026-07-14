import { describe, expect, it } from "vitest"
import { algorithms, CUBE_TYPE_TO_PUZZLE } from "@/lib/algorithms"
import { NxnCube, PyraminxPuzzle, invertMoves, parseSequence } from "@/lib/puzzle"

/**
 * The algorithms page draws every case from the algorithm's inverse (see
 * components/case-diagram.tsx). These lock down the sticker reading that
 * diagram relies on, and that no shipped algorithm can break the page.
 */
describe("case diagrams", () => {
  it("reads U as clockwise-from-above: F's top row goes to L", () => {
    const cube = NxnCube.solved(3)
    cube.applyMoves(parseSequence("U", "333"))
    expect(cube.getSticker("L", 0, 0)).toBe("F")
    expect(cube.getSticker("B", 0, 0)).toBe("L")
    expect(cube.getSticker("R", 0, 0)).toBe("B")
    expect(cube.getSticker("F", 0, 0)).toBe("R")
  })

  it("reads the U grid as row 0 = back, col 0 = left", () => {
    const cube = NxnCube.solved(3)
    cube.applyMoves(parseSequence("F", "333"))
    // F turns clockwise from the front, so L feeds U's front row (row 2).
    expect(cube.getSticker("U", 2, 0)).toBe("L")
    expect(cube.getSticker("U", 2, 2)).toBe("L")
    expect(cube.getSticker("U", 0, 0)).toBe("U")
  })

  it("puts Sune's case on the U face: centre, four edges, one corner", () => {
    const cube = NxnCube.solved(3)
    cube.applyMoves(invertMoves(parseSequence("R U R' U R U2 R'", "333")))
    const up = Array.from({ length: 9 }, (_, i) => cube.getSticker("U", Math.floor(i / 3), i % 3))
    expect(up.filter((color) => color === "U")).toHaveLength(6)
  })

  it("builds a case for every shipped algorithm", () => {
    for (const algo of algorithms) {
      const puzzle = CUBE_TYPE_TO_PUZZLE[algo.cubeType]
      expect(() => {
        const moves = invertMoves(parseSequence(algo.algorithm, puzzle))
        if (puzzle === "pyraminx") {
          PyraminxPuzzle.solved().applyMoves(moves)
        } else {
          NxnCube.solved(Number(algo.cubeType[0])).applyMoves(moves)
        }
      }, `${algo.id} (${algo.algorithm})`).not.toThrow()
    }
  })
})
