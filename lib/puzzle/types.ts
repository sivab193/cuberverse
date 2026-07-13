export type PuzzleId = "222" | "333" | "444" | "555" | "666" | "777" | "pyraminx"

export type Face = "U" | "R" | "F" | "D" | "L" | "B"

/** Order of faces in a facelet string — matches the Kociemba convention. */
export const FACE_ORDER: Face[] = ["U", "R", "F", "D", "L", "B"]

export type PyraminxFace = "F" | "R" | "L" | "D"

export const PYRAMINX_FACE_ORDER: PyraminxFace[] = ["F", "R", "L", "D"]

/**
 * A single parsed move.
 *
 * For NxN puzzles, `family` is one of U R F D L B M E S x y z and
 * `fromLayer`..`toLayer` is the 1-based range of layers turned, counted from
 * the family's face inward (rotations span 1..N, slices are the middle
 * layer). `amount` is in signed quarter turns: 1 = 90° clockwise viewed from
 * the family's face, -1 = counterclockwise, ±2 = half turn.
 *
 * For pyraminx, `family` is U L R B (vertex turns, layers 1..2) or u l r b
 * (tip turns, layers 1..1) and `amount` is ±1 (a third of a turn).
 */
export interface ParsedMove {
  family: string
  fromLayer: number
  toLayer: number
  amount: number
}

export interface PuzzleMeta {
  id: PuzzleId
  name: string
  kind: "nxn" | "pyraminx"
  /** Cube dimension; 0 for non-cubic puzzles. */
  n: number
  defaultScrambleLength: number
}

export const PUZZLES: Record<PuzzleId, PuzzleMeta> = {
  "222": { id: "222", name: "2x2", kind: "nxn", n: 2, defaultScrambleLength: 10 },
  "333": { id: "333", name: "3x3", kind: "nxn", n: 3, defaultScrambleLength: 20 },
  "444": { id: "444", name: "4x4", kind: "nxn", n: 4, defaultScrambleLength: 45 },
  "555": { id: "555", name: "5x5", kind: "nxn", n: 5, defaultScrambleLength: 60 },
  "666": { id: "666", name: "6x6", kind: "nxn", n: 6, defaultScrambleLength: 80 },
  "777": { id: "777", name: "7x7", kind: "nxn", n: 7, defaultScrambleLength: 100 },
  pyraminx: { id: "pyraminx", name: "Pyraminx", kind: "pyraminx", n: 0, defaultScrambleLength: 9 },
}

export const PUZZLE_IDS = Object.keys(PUZZLES) as PuzzleId[]
