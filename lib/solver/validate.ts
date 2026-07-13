import {
  faceletCount,
  faceLetters,
  patternDataFromFacelets,
  type KPatternData,
  type MappingError,
  type SolvablePuzzleId,
} from "./state-mapping"

/**
 * Full validation pipeline for a scanned facelet string: color counts, piece
 * identification (via state mapping), then the puzzle's physical invariants
 * (twist, flip, permutation parity). Errors are ordered from most to least
 * actionable and carry facelet indices for highlighting.
 */

export type ValidationResult =
  | { ok: true; patternData: KPatternData }
  | { ok: false; errors: MappingError[] }

function permutationParity(pieces: number[]): number {
  let parity = 0
  const seen = new Array<boolean>(pieces.length).fill(false)
  for (let i = 0; i < pieces.length; i++) {
    if (seen[i]) continue
    let cycleLength = 0
    let j = i
    while (!seen[j]) {
      seen[j] = true
      j = pieces[j]
      cycleLength++
    }
    parity ^= (cycleLength - 1) & 1
  }
  return parity
}

function sumMod(values: number[], mod: number): number {
  return values.reduce((a, b) => a + b, 0) % mod
}

export function validateFacelets(
  puzzle: SolvablePuzzleId,
  facelets: string,
): ValidationResult {
  // 1. Color counts.
  const expectedLength = faceletCount(puzzle)
  const perFace = expectedLength / faceLetters(puzzle).length
  const counts = new Map<string, number>()
  for (const ch of facelets) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  const countErrors: MappingError[] = []
  for (const face of faceLetters(puzzle)) {
    const count = counts.get(face) ?? 0
    if (count !== perFace) {
      countErrors.push({
        facelets: [],
        message: `Expected ${perFace} stickers of each color, but found ${count} of "${face}".`,
      })
    }
  }
  for (const ch of counts.keys()) {
    if (!faceLetters(puzzle).includes(ch)) {
      countErrors.push({
        facelets: [...facelets].flatMap((c, i) => (c === ch ? [i] : [])),
        message: `Unknown color "${ch}" in the scan.`,
      })
    }
  }
  if (facelets.length !== expectedLength || countErrors.length > 0) {
    if (facelets.length !== expectedLength) {
      countErrors.unshift({
        facelets: [],
        message: `Expected ${expectedLength} stickers, got ${facelets.length}.`,
      })
    }
    return { ok: false, errors: countErrors }
  }

  // 2. Piece identification.
  const mapped = patternDataFromFacelets(puzzle, facelets)
  if (!mapped.ok) return mapped
  const data = mapped.patternData

  // 3. Physical invariants.
  const errors: MappingError[] = []
  if (puzzle === "333") {
    const centers = data.CENTERS.pieces
    if (centers.some((p, i) => p !== i)) {
      errors.push({
        facelets: [],
        message:
          "The centers are not in the standard color arrangement — this scan can't come from a normal 3x3.",
      })
    }
    if (sumMod(data.CORNERS.orientation, 3) !== 0) {
      errors.push({
        facelets: [],
        message:
          "A corner is twisted: this state is impossible to reach with legal moves. Re-check the corner stickers.",
      })
    }
    if (sumMod(data.EDGES.orientation, 2) !== 0) {
      errors.push({
        facelets: [],
        message:
          "An edge is flipped: this state is impossible to reach with legal moves. Re-check the edge stickers.",
      })
    }
    if (
      errors.length === 0 &&
      permutationParity(data.CORNERS.pieces) !== permutationParity(data.EDGES.pieces)
    ) {
      errors.push({
        facelets: [],
        message:
          "Two pieces are swapped: this state is impossible to reach with legal moves. Two stickers were probably mixed up.",
      })
    }
  } else if (puzzle === "222") {
    if (sumMod(data.CORNERS.orientation, 3) !== 0) {
      errors.push({
        facelets: [],
        message:
          "A corner is twisted: this state is impossible to reach with legal moves. Re-check the corner stickers.",
      })
    }
  } else {
    // Pyraminx: axial corners and tips never change position — if they look
    // permuted, the puzzle was scanned in a non-standard orientation.
    for (const orbitName of ["CORNERS", "CORNERS2"] as const) {
      if (data[orbitName].pieces.some((p, i) => p !== i)) {
        errors.push({
          facelets: [],
          message:
            "The center pieces don't match the standard orientation — hold the pyraminx as shown in the scan guide and rescan.",
        })
        break
      }
    }
    if (sumMod(data.EDGES.orientation, 2) !== 0) {
      errors.push({
        facelets: [],
        message:
          "An edge is flipped: this state is impossible to reach with legal moves. Re-check the edge stickers.",
      })
    }
    if (errors.length === 0 && permutationParity(data.EDGES.pieces) !== 0) {
      errors.push({
        facelets: [],
        message:
          "Two edges are swapped: this state is impossible to reach with legal moves. Two stickers were probably mixed up.",
      })
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, patternData: data }
}
