import { describe, expect, it } from "vitest"
import { PyraminxPuzzle } from "@/lib/puzzle/pyraminx"
import { invertMoves, parseSequence } from "@/lib/puzzle/notation"
import { PYRAMINX_FACE_ORDER } from "@/lib/puzzle/types"

function randomAlg(length: number): string {
  const faces = ["U", "L", "R", "B", "u", "l", "r", "b"]
  const tokens: string[] = []
  for (let i = 0; i < length; i++) {
    const face = faces[Math.floor(Math.random() * faces.length)]
    tokens.push(Math.random() < 0.5 ? face : `${face}'`)
  }
  return tokens.join(" ")
}

describe("PyraminxPuzzle", () => {
  it("starts solved", () => {
    expect(PyraminxPuzzle.solved().isSolved()).toBe(true)
  })

  it("every vertex turn and tip has order 3", () => {
    for (const family of ["U", "L", "R", "B", "u", "l", "r", "b"]) {
      const puzzle = PyraminxPuzzle.solved()
      puzzle.applyMoves(parseSequence(`${family} ${family} ${family}`, "pyraminx"))
      expect(puzzle.isSolved(), `${family}^3 should be identity`).toBe(true)
    }
  })

  it("a turn followed by its inverse is identity", () => {
    for (const family of ["U", "L", "R", "B", "u", "l", "r", "b"]) {
      const puzzle = PyraminxPuzzle.solved()
      puzzle.applyMoves(parseSequence(`${family} ${family}'`, "pyraminx"))
      expect(puzzle.isSolved()).toBe(true)
    }
  })

  it("alg followed by its inverse is identity (randomized)", () => {
    for (let trial = 0; trial < 20; trial++) {
      const alg = randomAlg(15)
      const moves = parseSequence(alg, "pyraminx")
      const puzzle = PyraminxPuzzle.solved()
      puzzle.applyMoves(moves)
      puzzle.applyMoves(invertMoves(moves))
      expect(puzzle.isSolved(), `alg: ${alg}`).toBe(true)
    }
  })

  it("a vertex turn moves exactly 12 stickers", () => {
    const puzzle = PyraminxPuzzle.solved()
    puzzle.applyMoves(parseSequence("U", "pyraminx"))

    let changed = 0
    for (const face of PYRAMINX_FACE_ORDER) {
      for (let i = 0; i < 9; i++) {
        if (puzzle.getSticker(face, i) !== face) changed++
      }
    }
    // U turns the top 4 stickers (tip + row 1) of F, R and L faces; 8 of the
    // 12 change color (each face keeps its own color on 4/12 in a 3-cycle
    // only when colors coincide — here all 12 move but 4 land on same-color
    // faces only if faces share colors, which they don't, so all 12 differ).
    expect(changed).toBe(12)
  })

  it("a tip turn moves exactly 3 stickers and leaves the rest alone", () => {
    const puzzle = PyraminxPuzzle.solved()
    puzzle.applyMoves(parseSequence("u", "pyraminx"))

    let changed = 0
    for (const face of PYRAMINX_FACE_ORDER) {
      for (let i = 0; i < 9; i++) {
        if (puzzle.getSticker(face, i) !== face) changed++
      }
    }
    expect(changed).toBe(3)
    // The D face does not touch the U vertex
    for (let i = 0; i < 9; i++) {
      expect(puzzle.getSticker("D", i)).toBe("D")
    }
  })

  it("tips are independent of vertex layers below them", () => {
    // Turning U then u' then U' then u returns tips and layers consistently:
    // u and U commute because the tip is a subset of the U layer... they
    // share the axis, so U u U' u' must be identity.
    const puzzle = PyraminxPuzzle.solved()
    puzzle.applyMoves(parseSequence("U u U' u'", "pyraminx"))
    expect(puzzle.isSolved()).toBe(true)

    // Tips on different vertices never interact
    const puzzle2 = PyraminxPuzzle.solved()
    puzzle2.applyMoves(parseSequence("u l r b u' l' r' b'", "pyraminx"))
    expect(puzzle2.isSolved()).toBe(true)
  })

  it("U turn does not touch the D face", () => {
    const puzzle = PyraminxPuzzle.solved()
    puzzle.applyMoves(parseSequence("U", "pyraminx"))
    for (let i = 0; i < 9; i++) {
      expect(puzzle.getSticker("D", i)).toBe("D")
    }
  })

  it("U turn cycles F row to the L face", () => {
    const puzzle = PyraminxPuzzle.solved()
    puzzle.applyMoves(parseSequence("U", "pyraminx"))
    // F's top 4 stickers came from the R face (F→L→R→F cycle means R's
    // stickers land on F)
    expect(puzzle.getSticker("F", 0)).toBe("R")
    expect(puzzle.getSticker("F", 1)).toBe("R")
    expect(puzzle.getSticker("F", 2)).toBe("R")
    expect(puzzle.getSticker("F", 3)).toBe("R")
    // L's top 4 stickers came from F
    expect(puzzle.getSticker("L", 0)).toBe("F")
    // R's top came from L
    expect(puzzle.getSticker("R", 0)).toBe("L")
  })

  it("clone is independent of the original", () => {
    const puzzle = PyraminxPuzzle.solved()
    const copy = puzzle.clone()
    copy.applyMoves(parseSequence("R", "pyraminx"))
    expect(puzzle.isSolved()).toBe(true)
    expect(copy.isSolved()).toBe(false)
  })

  it("facelet string is 36 characters in F R L D order", () => {
    const s = PyraminxPuzzle.solved().toFaceletString()
    expect(s).toBe("F".repeat(9) + "R".repeat(9) + "L".repeat(9) + "D".repeat(9))
  })
})
