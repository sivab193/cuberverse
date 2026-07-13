import { NxnCube } from "./nxn"
import { PyraminxPuzzle } from "./pyraminx"
import { parseSequence } from "./notation"
import { PUZZLES, type ParsedMove, type PuzzleId } from "./types"

export * from "./types"
export * from "./notation"
export { NxnCube, FACE_FRAMES, FAMILY_FACE, ROTATIONS, type Vec } from "./nxn"
export { PyraminxPuzzle } from "./pyraminx"

/** Common interface over all puzzle models. */
export interface PuzzleModel {
  readonly puzzle: PuzzleId
  applyMove(move: ParsedMove): void
  applyMoves(moves: ParsedMove[]): void
  applyAlg(alg: string): void
  isSolved(): boolean
  reset(): void
  clone(): PuzzleModel
  toFaceletString(): string
}

class NxnModel implements PuzzleModel {
  constructor(
    readonly puzzle: PuzzleId,
    readonly cube: NxnCube,
  ) {}

  applyMove(move: ParsedMove): void {
    this.cube.applyMove(move)
  }

  applyMoves(moves: ParsedMove[]): void {
    this.cube.applyMoves(moves)
  }

  applyAlg(alg: string): void {
    this.cube.applyMoves(parseSequence(alg, this.puzzle))
  }

  isSolved(): boolean {
    return this.cube.isSolved()
  }

  reset(): void {
    this.cube.reset()
  }

  clone(): PuzzleModel {
    return new NxnModel(this.puzzle, this.cube.clone())
  }

  toFaceletString(): string {
    return this.cube.toFaceletString()
  }
}

class PyraminxModel implements PuzzleModel {
  readonly puzzle: PuzzleId = "pyraminx"

  constructor(readonly pyraminx: PyraminxPuzzle) {}

  applyMove(move: ParsedMove): void {
    this.pyraminx.applyMove(move)
  }

  applyMoves(moves: ParsedMove[]): void {
    this.pyraminx.applyMoves(moves)
  }

  applyAlg(alg: string): void {
    this.pyraminx.applyMoves(parseSequence(alg, this.puzzle))
  }

  isSolved(): boolean {
    return this.pyraminx.isSolved()
  }

  reset(): void {
    this.pyraminx.reset()
  }

  clone(): PuzzleModel {
    return new PyraminxModel(this.pyraminx.clone())
  }

  toFaceletString(): string {
    return this.pyraminx.toFaceletString()
  }
}

export function createPuzzle(puzzle: PuzzleId): PuzzleModel {
  const meta = PUZZLES[puzzle]
  if (meta.kind === "pyraminx") {
    return new PyraminxModel(PyraminxPuzzle.solved())
  }
  return new NxnModel(puzzle, NxnCube.solved(meta.n))
}
