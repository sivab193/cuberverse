import { describe, expect, it } from "vitest"
import { generateScramble, scrambleToString } from "@/lib/scramble"

const AXIS: Record<string, string> = { R: "x", L: "x", U: "y", D: "y", F: "z", B: "z" }

describe("generateScramble", () => {
  it("generates the requested number of 3x3 moves from the 3x3 move set", () => {
    for (let i = 0; i < 50; i++) {
      const scramble = generateScramble("3x3", 20)
      expect(scramble).toHaveLength(20)
      for (const move of scramble) {
        expect(move).toMatch(/^[RLUDFB](2|')?$/)
      }
    }
  })

  it("only uses R, U, F faces for 2x2", () => {
    for (let i = 0; i < 50; i++) {
      const scramble = generateScramble("2x2", 10)
      expect(scramble).toHaveLength(10)
      for (const move of scramble) {
        expect(move).toMatch(/^[RUF](2|')?$/)
      }
    }
  })

  it("uses pyraminx notation (face turns then optional tips) for pyraminx", () => {
    for (let i = 0; i < 50; i++) {
      const scramble = generateScramble("pyraminx", 9)
      const faceMoves = scramble.filter((m) => /^[ULRB]'?$/.test(m))
      const tipMoves = scramble.filter((m) => /^[ulrb]'?$/.test(m))
      expect(faceMoves).toHaveLength(9)
      expect(tipMoves.length).toBeLessThanOrEqual(4)
      expect(faceMoves.length + tipMoves.length).toBe(scramble.length)
      // no double turns on pyraminx
      for (const move of scramble) {
        expect(move).not.toContain("2")
      }
      // tips come after all face moves
      const firstTip = scramble.findIndex((m) => /^[ulrb]/.test(m))
      if (firstTip !== -1) {
        expect(scramble.slice(firstTip).every((m) => /^[ulrb]/.test(m))).toBe(true)
      }
    }
  })

  it("never repeats a face and never plays three same-axis moves in a row", () => {
    for (let i = 0; i < 100; i++) {
      const scramble = generateScramble("3x3", 25)
      for (let j = 1; j < scramble.length; j++) {
        expect(scramble[j][0]).not.toBe(scramble[j - 1][0])
        if (j >= 2) {
          const axes = [scramble[j - 2], scramble[j - 1], scramble[j]].map((m) => AXIS[m[0]])
          expect(new Set(axes).size).toBeGreaterThan(1)
        }
      }
    }
  })

  it("falls back to sensible defaults per cube type when length is omitted", () => {
    expect(generateScramble("2x2")).toHaveLength(10)
    expect(generateScramble("3x3")).toHaveLength(20)
    const pyraminx = generateScramble("pyraminx")
    expect(pyraminx.filter((m) => /^[ULRB]/.test(m))).toHaveLength(9)
    expect(generateScramble("unknown-type")).toHaveLength(20)
  })
})

describe("scrambleToString", () => {
  it("joins moves with spaces", () => {
    expect(scrambleToString(["R", "U'", "F2"])).toBe("R U' F2")
  })
})
