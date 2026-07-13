import { KPATTERN_TABLES, type OrbitTable } from "./kpattern-tables.gen"

/**
 * Convert a facelet string (lib/puzzle canonical order) into cubing.js
 * KPattern data by identifying each physical piece from its sticker colors.
 *
 * Pure and dependency-free: the returned plain data is fed to
 * `new KPattern(kpuzzle, data)` by the solver facade, and is also what the
 * validators inspect. Piece identification doubles as the first line of
 * validation — a mis-scanned sticker usually produces a color combination
 * that matches no real piece, which we report with the offending facelets.
 */

export type SolvablePuzzleId = keyof typeof KPATTERN_TABLES

export const SOLVABLE_PUZZLES = Object.keys(KPATTERN_TABLES) as SolvablePuzzleId[]

export interface KPatternOrbitData {
  pieces: number[]
  orientation: number[]
  orientationMod?: number[]
}

export type KPatternData = Record<string, KPatternOrbitData>

export interface MappingError {
  /** Facelet indices involved, for highlighting in the review UI. */
  facelets: number[]
  message: string
}

export type MappingResult =
  | { ok: true; patternData: KPatternData }
  | { ok: false; errors: MappingError[] }

export function faceletCount(puzzle: SolvablePuzzleId): number {
  return KPATTERN_TABLES[puzzle].reduce(
    (sum, orbit) => sum + orbit.facelet.length * orbit.numOrientations,
    0,
  )
}

/** Expected color letters (face names) for a puzzle's facelet string. */
export function faceLetters(puzzle: SolvablePuzzleId): string[] {
  return puzzle === "pyraminx" ? ["F", "R", "L", "D"] : ["U", "R", "F", "D", "L", "B"]
}

function faceOfFacelet(puzzle: SolvablePuzzleId, facelet: number): string {
  const perFace = puzzle === "pyraminx" ? 9 : puzzle === "222" ? 4 : 9
  return faceLetters(puzzle)[Math.floor(facelet / perFace)]
}

/** solvedColors[piece][ori] = face letter piece shows at that sticker when solved. */
function solvedColors(puzzle: SolvablePuzzleId, orbit: OrbitTable): string[][] {
  return orbit.facelet.map((row) => row.map((f) => faceOfFacelet(puzzle, f)))
}

export function patternDataFromFacelets(
  puzzle: SolvablePuzzleId,
  facelets: string,
): MappingResult {
  const expectedLength = faceletCount(puzzle)
  if (facelets.length !== expectedLength) {
    return {
      ok: false,
      errors: [
        {
          facelets: [],
          message: `Expected ${expectedLength} stickers for this puzzle, got ${facelets.length}.`,
        },
      ],
    }
  }

  const errors: MappingError[] = []
  const patternData: KPatternData = {}

  for (const orbit of KPATTERN_TABLES[puzzle]) {
    const k = orbit.numOrientations
    const solved = solvedColors(puzzle, orbit)
    const pieces: number[] = []
    const orientation: number[] = []
    const seenPieces = new Map<number, number>() // piece -> slot that claimed it

    for (let slot = 0; slot < orbit.facelet.length; slot++) {
      const slotFacelets = orbit.facelet[slot]
      const observed = slotFacelets.map((f) => facelets[f])

      let found: { piece: number; ori: number } | null = null
      outer: for (let piece = 0; piece < solved.length; piece++) {
        for (let ori = 0; ori < k; ori++) {
          let matches = true
          for (let j = 0; j < k; j++) {
            if (observed[j] !== solved[piece][(((j - ori) % k) + k) % k]) {
              matches = false
              break
            }
          }
          if (matches) {
            found = { piece, ori }
            break outer
          }
        }
      }

      if (!found) {
        errors.push({
          facelets: slotFacelets,
          message: `No ${orbitLabel(orbit.name)} has colors ${observed.join("/")} — one of these stickers is scanned wrong.`,
        })
        pieces.push(-1)
        orientation.push(0)
        continue
      }

      const priorSlot = seenPieces.get(found.piece)
      if (priorSlot !== undefined) {
        errors.push({
          facelets: [...orbit.facelet[priorSlot], ...slotFacelets],
          message: `The ${orbitLabel(orbit.name)} with colors ${solved[found.piece].join("/")} appears twice — one of the highlighted stickers is scanned wrong.`,
        })
      } else {
        seenPieces.set(found.piece, slot)
      }
      pieces.push(found.piece)
      orientation.push(found.ori)
    }

    patternData[orbit.name] = { pieces, orientation }
    if (orbit.name === "CENTERS") {
      patternData[orbit.name].orientationMod = pieces.map(() => 1)
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, patternData }
}

function orbitLabel(orbitName: string): string {
  switch (orbitName) {
    case "EDGES":
      return "edge piece"
    case "CORNERS":
      return "corner piece"
    case "CORNERS2":
      return "tip"
    case "CENTERS":
      return "center"
    default:
      return "piece"
  }
}
