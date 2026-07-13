import { describe, expect, it } from "vitest"
import { NxnCube } from "@/lib/puzzle/nxn"
import { invertMoves, parseSequence } from "@/lib/puzzle/notation"
import type { PuzzleId } from "@/lib/puzzle/types"

const NXN_PUZZLES: { id: PuzzleId; n: number }[] = [
  { id: "222", n: 2 },
  { id: "333", n: 3 },
  { id: "444", n: 4 },
  { id: "555", n: 5 },
  { id: "666", n: 6 },
  { id: "777", n: 7 },
]

function randomAlg(n: number, length: number): string {
  const faces = ["U", "R", "F", "D", "L", "B"]
  const suffixes = ["", "'", "2"]
  const tokens: string[] = []
  for (let i = 0; i < length; i++) {
    const face = faces[Math.floor(Math.random() * faces.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    const maxDepth = Math.floor(n / 2)
    const depth = 1 + Math.floor(Math.random() * Math.max(1, maxDepth))
    if (depth === 1) {
      tokens.push(face + suffix)
    } else if (depth === 2) {
      tokens.push(`${face}w${suffix}`)
    } else {
      tokens.push(`${depth}${face}w${suffix}`)
    }
  }
  return tokens.join(" ")
}

describe("NxnCube", () => {
  it("starts solved for every size", () => {
    for (const { n } of NXN_PUZZLES) {
      expect(NxnCube.solved(n).isSolved()).toBe(true)
    }
  })

  it("R4 is identity on every size", () => {
    for (const { id, n } of NXN_PUZZLES) {
      const cube = NxnCube.solved(n)
      cube.applyMoves(parseSequence("R R R R", id))
      expect(cube.isSolved()).toBe(true)
    }
  })

  it("a single move unsolves the cube", () => {
    for (const { id, n } of NXN_PUZZLES) {
      const cube = NxnCube.solved(n)
      cube.applyMoves(parseSequence("R", id))
      expect(cube.isSolved()).toBe(false)
    }
  })

  it("sexy move × 6 is identity", () => {
    for (const { id, n } of NXN_PUZZLES) {
      const cube = NxnCube.solved(n)
      for (let i = 0; i < 6; i++) {
        cube.applyMoves(parseSequence("R U R' U'", id))
      }
      expect(cube.isSolved()).toBe(true)
    }
  })

  it("alg followed by its inverse is identity (randomized, incl. wide moves)", () => {
    for (const { id, n } of NXN_PUZZLES) {
      for (let trial = 0; trial < 10; trial++) {
        const alg = randomAlg(n, 25)
        const moves = parseSequence(alg, id)
        const cube = NxnCube.solved(n)
        cube.applyMoves(moves)
        cube.applyMoves(invertMoves(moves))
        expect(cube.isSolved(), `size ${n}, alg: ${alg}`).toBe(true)
      }
    }
  })

  it("whole-cube rotations keep the cube solved", () => {
    for (const { id, n } of NXN_PUZZLES) {
      const cube = NxnCube.solved(n)
      cube.applyMoves(parseSequence("x y z x' y2 z'", id))
      expect(cube.isSolved()).toBe(true)
    }
  })

  it("matches the known facelet string after R on 3x3", () => {
    const cube = NxnCube.solved(3)
    cube.applyMoves(parseSequence("R", "333"))
    expect(cube.toFaceletString()).toBe(
      "UUFUUFUUF" + "RRRRRRRRR" + "FFDFFDFFD" + "DDBDDBDDB" + "LLLLLLLLL" + "UBBUBBUBB",
    )
  })

  it("matches the known facelet string after the superflip", () => {
    const cube = NxnCube.solved(3)
    cube.applyMoves(
      parseSequence("U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2", "333"),
    )
    expect(cube.toFaceletString()).toBe(
      "UBULURUFU" + "RURFRBRDR" + "FUFLFRFDF" + "DFDLDRDBD" + "LULBLFLDL" + "BUBRBLBDB",
    )
  })

  it("M follows the L direction and only moves the middle layer on 3x3", () => {
    const withM = NxnCube.solved(3)
    withM.applyMoves(parseSequence("M", "333"))

    // M ≡ the middle slice turned like L: equivalent to L' R x'... verify via
    // the equivalent identity M = Lw' L ... simpler: M' followed by M is
    // identity, and M leaves both R and L faces untouched.
    expect(withM.isSolved()).toBe(false)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        expect(withM.getSticker("R", row, col)).toBe("R")
        expect(withM.getSticker("L", row, col)).toBe("L")
      }
    }

    // M x 4 = identity
    withM.applyMoves(parseSequence("M M M", "333"))
    expect(withM.isSolved()).toBe(true)

    // Rw ≡ R M' on odd cubes: both should produce identical states
    const a = NxnCube.solved(3)
    a.applyMoves(parseSequence("Rw", "333"))
    const b = NxnCube.solved(3)
    b.applyMoves(parseSequence("R M'", "333"))
    expect(a.toFaceletString()).toBe(b.toFaceletString())
  })

  it("E and S follow D and F directions respectively", () => {
    const e = NxnCube.solved(3)
    e.applyMoves(parseSequence("Dw", "333"))
    const e2 = NxnCube.solved(3)
    e2.applyMoves(parseSequence("D E", "333"))
    expect(e.toFaceletString()).toBe(e2.toFaceletString())

    const s = NxnCube.solved(3)
    s.applyMoves(parseSequence("Fw", "333"))
    const s2 = NxnCube.solved(3)
    s2.applyMoves(parseSequence("F S", "333"))
    expect(s.toFaceletString()).toBe(s2.toFaceletString())
  })

  it("3Rw2 on 5x5 affects exactly layers 1-3", () => {
    const cube = NxnCube.solved(5)
    cube.applyMoves(parseSequence("3Rw2", "555"))

    // Layers 1-3 from the R face: columns 4, 3, 2 of U (colDir of U is +x).
    // Columns 0-1 of U must be untouched, columns 2-4 must show D colors.
    for (let row = 0; row < 5; row++) {
      expect(cube.getSticker("U", row, 0)).toBe("U")
      expect(cube.getSticker("U", row, 1)).toBe("U")
      expect(cube.getSticker("U", row, 2)).toBe("D")
      expect(cube.getSticker("U", row, 3)).toBe("D")
      expect(cube.getSticker("U", row, 4)).toBe("D")
    }
    // L face untouched, R face turned 180° (still uniform R)
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        expect(cube.getSticker("L", row, col)).toBe("L")
        expect(cube.getSticker("R", row, col)).toBe("R")
      }
    }
  })

  it("x rotation equals turning every layer from R", () => {
    const viaRotation = NxnCube.solved(4)
    viaRotation.applyMoves(parseSequence("x", "444"))
    const viaLayers = NxnCube.solved(4)
    viaLayers.applyMoves(parseSequence("4Rw", "444"))
    expect(viaRotation.toFaceletString()).toBe(viaLayers.toFaceletString())
  })

  it("clone is independent of the original", () => {
    const cube = NxnCube.solved(3)
    const copy = cube.clone()
    copy.applyMoves(parseSequence("R", "333"))
    expect(cube.isSolved()).toBe(true)
    expect(copy.isSolved()).toBe(false)
  })

  it("facelet string length is 6N² with N² per face", () => {
    for (const { n } of NXN_PUZZLES) {
      const s = NxnCube.solved(n).toFaceletString()
      expect(s).toHaveLength(6 * n * n)
      expect(s.slice(0, n * n)).toBe("U".repeat(n * n))
    }
  })
})
