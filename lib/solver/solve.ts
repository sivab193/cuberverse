import { validateFacelets } from "./validate"
import type { MappingError, SolvablePuzzleId } from "./state-mapping"
import {
  loadCubingKpuzzle,
  loadCubingPuzzles,
  loadCubingSearch,
} from "./cubing-loader"

/**
 * Async solving facade: scanned facelets in, near-optimal solution out.
 *
 * 3x3 uses cubing's two-phase solver (~20 moves), 2x2 and pyraminx are
 * solved optimally. All search runs in a Web Worker spawned by cubing's
 * vendored build (see cubing-loader.ts); nothing blocks the UI thread.
 */

export type SolveResult =
  | { ok: true; solution: string; moveCount: number }
  | { ok: false; errors: MappingError[] }

interface CubingModules {
  kpuzzleMod: typeof import("cubing/kpuzzle")
  puzzlesMod: typeof import("cubing/puzzles")
  searchMod: typeof import("cubing/search")
}

const PUZZLE_LOADER_KEY: Record<SolvablePuzzleId, "3x3x3" | "2x2x2" | "pyraminx"> = {
  "333": "3x3x3",
  "222": "2x2x2",
  pyraminx: "pyraminx",
}

/** Core implementation with injectable cubing modules (unit-testable in Node). */
export async function solveFaceletsWith(
  modules: CubingModules,
  puzzle: SolvablePuzzleId,
  facelets: string,
): Promise<SolveResult> {
  const validated = validateFacelets(puzzle, facelets)
  if (!validated.ok) return validated

  const { kpuzzleMod, puzzlesMod, searchMod } = modules
  const kpuzzle = await puzzlesMod.puzzles[PUZZLE_LOADER_KEY[puzzle]].kpuzzle()
  const pattern = new kpuzzleMod.KPattern(kpuzzle, validated.patternData)

  let solution: { toString(): string }
  switch (puzzle) {
    case "333":
      solution = await searchMod.experimentalSolve3x3x3IgnoringCenters(pattern)
      break
    case "222":
      solution = await searchMod.experimentalSolve2x2x2(pattern)
      break
    case "pyraminx":
      solution = await searchMod.solvePyraminx(pattern)
      break
  }

  const solutionStr = solution.toString().trim()
  return {
    ok: true,
    solution: solutionStr,
    moveCount: solutionStr === "" ? 0 : solutionStr.split(/\s+/).length,
  }
}

/** Browser facade: loads the vendored cubing build on first use. */
export async function solveFacelets(
  puzzle: SolvablePuzzleId,
  facelets: string,
): Promise<SolveResult> {
  const [kpuzzleMod, puzzlesMod, searchMod] = await Promise.all([
    loadCubingKpuzzle(),
    loadCubingPuzzles(),
    loadCubingSearch(),
  ])
  return solveFaceletsWith({ kpuzzleMod, puzzlesMod, searchMod }, puzzle, facelets)
}
