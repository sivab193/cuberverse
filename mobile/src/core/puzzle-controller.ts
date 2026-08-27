import { useMemo, useSyncExternalStore } from 'react';
import { createPuzzle, invertMoves, parseSequence, type ParsedMove, type PuzzleId, type PuzzleModel } from '@shared/puzzle';

export interface PuzzleControllerState { position: number; total: number; playing: boolean; speed: number; generation: number }
const RATE = 2.4;

export class PuzzleController {
  baseMoves: ParsedMove[] = []; moves: ParsedMove[] = []; animPos = 0; playing = false; speed = 1; generation = 0; seekTarget: number | null = null;
  private model: PuzzleModel; private modelPos = 0; private listeners = new Set<() => void>(); private cache: PuzzleControllerState | null = null;
  constructor(readonly puzzle: PuzzleId) { this.model = createPuzzle(puzzle); }
  setBase(alg: string | ParsedMove[]) { this.baseMoves = typeof alg === 'string' ? parseSequence(alg, this.puzzle) : [...alg]; this.moves = []; this.animPos = 0; this.modelPos = 0; this.playing = false; this.model.reset(); this.model.applyMoves(this.baseMoves); this.generation++; this.emit(); }
  setTimeline(alg: string | ParsedMove[]) { this.moves = typeof alg === 'string' ? parseSequence(alg, this.puzzle) : [...alg]; this.animPos = 0; this.modelPos = 0; this.playing = false; this.seekTarget = null; this.generation++; this.emit(); }
  play() { if (!this.moves.length) return; if (this.animPos >= this.moves.length) this.seekTo(0); this.playing = true; this.seekTarget = null; this.emit(); }
  pause() { this.playing = false; this.seekTarget = null; this.emit(); }
  stepForward() { this.playing = false; this.seekTarget = Math.min(Math.floor(this.animPos) + 1, this.moves.length); this.emit(); }
  stepBack() { this.playing = false; this.seekTarget = Math.max(Math.ceil(this.animPos) - 1, 0); this.emit(); }
  seekTo(position: number) { this.playing = false; this.seekTarget = null; this.animPos = Math.max(0, Math.min(position, this.moves.length)); this.syncModel(); this.emit(); }
  snapshot() { this.syncModel(); return this.model.clone(); }
  tick(delta: number) { const before = Math.floor(this.animPos); const wasPlaying = this.playing; const amount = RATE * this.speed * delta; if (this.playing) { this.animPos = Math.min(this.animPos + amount, this.moves.length); if (this.animPos >= this.moves.length) this.playing = false; } else if (this.seekTarget !== null) { this.animPos = this.animPos < this.seekTarget ? Math.min(this.animPos + amount, this.seekTarget) : Math.max(this.animPos - amount, this.seekTarget); if (this.animPos === this.seekTarget) this.seekTarget = null; } if (Math.floor(this.animPos) !== before || wasPlaying !== this.playing) { this.syncModel(); this.emit(); } }
  private syncModel() { const target = Math.floor(this.animPos); while (this.modelPos < target) { this.model.applyMove(this.moves[this.modelPos]); this.modelPos++; } while (this.modelPos > target) { this.modelPos--; this.model.applyMoves(invertMoves([this.moves[this.modelPos]])); } }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  getState = (): PuzzleControllerState => this.cache ??= { position: Math.floor(this.animPos), total: this.moves.length, playing: this.playing, speed: this.speed, generation: this.generation };
  private emit() { this.cache = null; this.listeners.forEach((listener) => listener()); }
}

const SERVER: PuzzleControllerState = { position: 0, total: 0, playing: false, speed: 1, generation: 0 };
export const usePuzzleController = (puzzle: PuzzleId) => useMemo(() => new PuzzleController(puzzle), [puzzle]);
export const usePuzzleControllerState = (controller: PuzzleController) => useSyncExternalStore(controller.subscribe, controller.getState, () => SERVER);
