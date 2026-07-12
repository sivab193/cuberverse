"use client"

import { useMemo, useSyncExternalStore } from "react"
import {
  createPuzzle,
  invertMoves,
  parseSequence,
  type ParsedMove,
  type PuzzleId,
  type PuzzleModel,
} from "@/lib/puzzle"

export interface PuzzleControllerState {
  /** Index of the move currently animating (or about to). Integer part of the render position. */
  position: number
  /** Number of moves on the scrubbable timeline. */
  total: number
  playing: boolean
  speed: number
  /** Bumped whenever the base state or timeline is replaced (scene rebuild). */
  generation: number
}

/** Moves per second at speed 1. */
const BASE_MOVE_RATE = 2.4

/**
 * Imperative controller shared between the 3D viewer, transport controls, and
 * page code. The timeline is the single source of truth: `baseMoves` are
 * applied instantly (a setup/scramble the user does not scrub through) and
 * `moves` are the animated, scrubbable part. The controller also maintains a
 * facelet model (lib/puzzle) synced to the current position, so `isSolved()`
 * and `snapshot()` reflect exactly what is on screen.
 */
export class PuzzleController {
  readonly puzzle: PuzzleId

  /** Setup moves applied instantly before the timeline. */
  baseMoves: ParsedMove[] = []
  /** Scrubbable timeline moves. */
  moves: ParsedMove[] = []
  /** Float render position in [0, moves.length]; the fraction is mid-move animation progress. */
  animPos = 0
  playing = false
  speed = 1
  generation = 0

  /** When set, the scene animates animPos toward this integer (stepping). */
  seekTarget: number | null = null

  private model: PuzzleModel
  private modelPos = 0
  private listeners = new Set<() => void>()
  private stateCache: PuzzleControllerState | null = null

  constructor(puzzle: PuzzleId) {
    this.puzzle = puzzle
    this.model = createPuzzle(puzzle)
  }

  // ----- commands -------------------------------------------------------

  /** Replace everything with an instantly-applied base state (e.g. a scramble or case setup). */
  setBase(alg: string | ParsedMove[]): void {
    this.baseMoves = typeof alg === "string" ? parseSequence(alg, this.puzzle) : [...alg]
    this.moves = []
    this.animPos = 0
    this.modelPos = 0
    this.playing = false
    this.seekTarget = null
    this.model.reset()
    this.model.applyMoves(this.baseMoves)
    this.generation++
    this.emit()
  }

  /** Append moves to the timeline. Animated by default; `instant` jumps straight to the end. */
  applyMoves(alg: string | ParsedMove[], options?: { instant?: boolean }): void {
    const parsed = typeof alg === "string" ? parseSequence(alg, this.puzzle) : [...alg]
    if (parsed.length === 0) return
    this.moves.push(...parsed)
    if (options?.instant) {
      this.animPos = this.moves.length
      this.seekTarget = null
      this.playing = false
    } else {
      this.playing = true
      this.seekTarget = null
    }
    this.emit()
  }

  play(): void {
    if (this.moves.length === 0) return
    if (this.animPos >= this.moves.length) {
      this.animPos = 0
    }
    this.playing = true
    this.seekTarget = null
    this.emit()
  }

  pause(): void {
    this.playing = false
    this.seekTarget = null
    this.emit()
  }

  stepForward(): void {
    this.playing = false
    this.seekTarget = Math.min(Math.floor(this.animPos) + 1, this.moves.length)
    this.emit()
  }

  stepBack(): void {
    this.playing = false
    this.seekTarget = Math.max(Math.ceil(this.animPos) - 1, 0)
    this.emit()
  }

  /** Jump instantly to a timeline position (used by the scrub slider). */
  seekTo(position: number): void {
    this.playing = false
    this.seekTarget = null
    this.animPos = Math.max(0, Math.min(position, this.moves.length))
    this.emit()
  }

  /** Clear the timeline and base — back to a solved puzzle. */
  resetAll(): void {
    this.baseMoves = []
    this.moves = []
    this.animPos = 0
    this.modelPos = 0
    this.playing = false
    this.seekTarget = null
    this.model.reset()
    this.generation++
    this.emit()
  }

  setSpeed(speed: number): void {
    this.speed = speed
    this.emit()
  }

  // ----- queries ---------------------------------------------------------

  /** Facelet model reflecting the current integer position. Do not mutate. */
  snapshot(): PuzzleModel {
    this.syncModel()
    return this.model.clone()
  }

  isSolved(): boolean {
    this.syncModel()
    return this.model.isSolved()
  }

  private syncModel(): void {
    const target = Math.floor(this.animPos)
    while (this.modelPos < target) {
      this.model.applyMove(this.moves[this.modelPos])
      this.modelPos++
    }
    while (this.modelPos > target) {
      this.modelPos--
      this.model.applyMoves(invertMoves([this.moves[this.modelPos]]))
    }
  }

  // ----- animation driver (called from the 3D scene's frame loop) --------

  /** Advance the render position. Called from the 3D scene's frame loop. */
  tick(delta: number): void {
    const beforePosition = Math.floor(this.animPos)
    const beforePlaying = this.playing
    const rate = BASE_MOVE_RATE * this.speed * delta

    if (this.playing) {
      this.animPos = Math.min(this.animPos + rate, this.moves.length)
      if (this.animPos >= this.moves.length) {
        this.playing = false
      }
    } else if (this.seekTarget !== null) {
      if (this.animPos < this.seekTarget) {
        this.animPos = Math.min(this.animPos + rate, this.seekTarget)
      } else {
        this.animPos = Math.max(this.animPos - rate, this.seekTarget)
      }
      if (this.animPos === this.seekTarget) {
        this.seekTarget = null
      }
    }

    if (Math.floor(this.animPos) !== beforePosition || this.playing !== beforePlaying) {
      this.emit()
    }
  }

  // ----- subscription ----------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState = (): PuzzleControllerState => {
    if (!this.stateCache) {
      this.stateCache = {
        position: Math.floor(this.animPos),
        total: this.moves.length,
        playing: this.playing,
        speed: this.speed,
        generation: this.generation,
      }
    }
    return this.stateCache
  }

  private emit(): void {
    this.stateCache = null
    for (const listener of this.listeners) {
      listener()
    }
  }
}

const SERVER_STATE: PuzzleControllerState = {
  position: 0,
  total: 0,
  playing: false,
  speed: 1,
  generation: 0,
}

export function usePuzzleController(puzzle: PuzzleId): PuzzleController {
  return useMemo(() => new PuzzleController(puzzle), [puzzle])
}

export function usePuzzleControllerState(controller: PuzzleController): PuzzleControllerState {
  return useSyncExternalStore(controller.subscribe, controller.getState, () => SERVER_STATE)
}
