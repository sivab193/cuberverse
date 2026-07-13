import { describe, expect, it } from "vitest"
import {
  NotationError,
  invertAlg,
  invertMoves,
  movesToString,
  parseMove,
  parseSequence,
} from "@/lib/puzzle/notation"

describe("NxN notation parser", () => {
  it("parses basic face turns with modifiers", () => {
    expect(parseMove("R", "333")).toEqual({ family: "R", fromLayer: 1, toLayer: 1, amount: 1 })
    expect(parseMove("U'", "333")).toEqual({ family: "U", fromLayer: 1, toLayer: 1, amount: -1 })
    expect(parseMove("F2", "333")).toEqual({ family: "F", fromLayer: 1, toLayer: 1, amount: 2 })
    expect(parseMove("B2'", "333")).toEqual({ family: "B", fromLayer: 1, toLayer: 1, amount: -2 })
  })

  it("parses wide moves", () => {
    expect(parseMove("Rw", "444")).toEqual({ family: "R", fromLayer: 1, toLayer: 2, amount: 1 })
    expect(parseMove("3Rw'", "555")).toEqual({ family: "R", fromLayer: 1, toLayer: 3, amount: -1 })
    expect(parseMove("3Uw2", "777")).toEqual({ family: "U", fromLayer: 1, toLayer: 3, amount: 2 })
  })

  it("treats lowercase letters as 2-layer wide moves", () => {
    expect(parseMove("r", "444")).toEqual(parseMove("Rw", "444"))
    expect(parseMove("u'", "333")).toEqual(parseMove("Uw'", "333"))
  })

  it("parses single inner-layer moves", () => {
    expect(parseMove("3R", "555")).toEqual({ family: "R", fromLayer: 3, toLayer: 3, amount: 1 })
    expect(parseMove("2L'", "444")).toEqual({ family: "L", fromLayer: 2, toLayer: 2, amount: -1 })
  })

  it("parses slice moves: middle layer on odd cubes, middle pair on even", () => {
    expect(parseMove("M", "333")).toEqual({ family: "M", fromLayer: 2, toLayer: 2, amount: 1 })
    expect(parseMove("E'", "555")).toEqual({ family: "E", fromLayer: 3, toLayer: 3, amount: -1 })
    // Big-cube convention (used by jperm.net 4x4 algs): M turns both middle layers.
    expect(parseMove("M", "444")).toEqual({ family: "M", fromLayer: 2, toLayer: 3, amount: 1 })
    expect(parseMove("S2", "666")).toEqual({ family: "S", fromLayer: 3, toLayer: 4, amount: 2 })
  })

  it("parses rotations as all-layer moves", () => {
    expect(parseMove("x", "333")).toEqual({ family: "x", fromLayer: 1, toLayer: 3, amount: 1 })
    expect(parseMove("y2", "777")).toEqual({ family: "y", fromLayer: 1, toLayer: 7, amount: 2 })
    expect(parseMove("z'", "222")).toEqual({ family: "z", fromLayer: 1, toLayer: 2, amount: -1 })
  })

  it("rejects invalid tokens", () => {
    expect(() => parseMove("Q", "333")).toThrow(NotationError)
    expect(() => parseMove("R3", "333")).toThrow(NotationError)
    expect(() => parseMove("8Rw", "333")).toThrow(NotationError)
    expect(() => parseMove("0R", "333")).toThrow(NotationError)
    expect(() => parseMove("3x", "333")).toThrow(NotationError)
    expect(() => parseMove("2M", "555")).toThrow(NotationError)
    expect(() => parseMove("", "333")).toThrow(NotationError)
  })

  it("reports the token and position in sequence errors", () => {
    try {
      parseSequence("R U Q' F", "333")
      expect.unreachable("should have thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(NotationError)
      expect((error as NotationError).token).toBe("Q'")
      expect((error as NotationError).index).toBe(2)
    }
  })

  it("round-trips parse → toString", () => {
    const cases = ["R", "R'", "R2", "Rw", "3Rw'", "3R2", "M", "E'", "S2", "x", "y'", "z2"]
    for (const token of cases) {
      expect(movesToString(parseSequence(token, "555"))).toBe(token)
    }
  })

  it("normalizes lowercase wide notation to w form", () => {
    expect(movesToString(parseSequence("r u' f2", "555"))).toBe("Rw Uw' Fw2")
  })
})

describe("pyraminx notation parser", () => {
  it("parses vertex turns and tips", () => {
    expect(parseMove("U", "pyraminx")).toEqual({ family: "U", fromLayer: 1, toLayer: 2, amount: 1 })
    expect(parseMove("R'", "pyraminx")).toEqual({ family: "R", fromLayer: 1, toLayer: 2, amount: -1 })
    expect(parseMove("u", "pyraminx")).toEqual({ family: "u", fromLayer: 1, toLayer: 1, amount: 1 })
    expect(parseMove("b'", "pyraminx")).toEqual({ family: "b", fromLayer: 1, toLayer: 1, amount: -1 })
  })

  it("rejects cube-only notation", () => {
    expect(() => parseMove("U2", "pyraminx")).toThrow(NotationError)
    expect(() => parseMove("F", "pyraminx")).toThrow(NotationError)
    expect(() => parseMove("M", "pyraminx")).toThrow(NotationError)
    expect(() => parseMove("Rw", "pyraminx")).toThrow(NotationError)
  })

  it("round-trips pyraminx algs", () => {
    const alg = "U R' L B l' r b u'"
    expect(movesToString(parseSequence(alg, "pyraminx"), "pyraminx")).toBe(alg)
  })
})

describe("inversion", () => {
  it("inverts move sequences in reverse order with negated amounts", () => {
    const moves = parseSequence("R U2 F'", "333")
    const inverted = invertMoves(moves)
    expect(movesToString(inverted)).toBe("F U2' R'")
  })

  it("inverts algs as strings", () => {
    expect(invertAlg("R U R' U'", "333")).toBe("U R U' R'")
    expect(invertAlg("U R' l", "pyraminx")).toBe("l' R U'")
  })
})
