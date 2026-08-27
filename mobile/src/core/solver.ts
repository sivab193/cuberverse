import Cube from 'cubejs';
import 'cubejs/lib/solve';
import { NxnCube, PyraminxPuzzle, parseSequence } from '@shared/puzzle';
import { patternDataFromFacelets, type KPatternOrbitData, type SolvablePuzzleId } from '@shared/solver/state-mapping';
import { validateFacelets } from '@shared/solver/validate';

export type NativeSolveResult = { ok: true; solution: string; moveCount: number } | { ok: false; message: string };
interface OrbitState { pieces: number[]; orientation: number[] }
interface MoveTransform { family: string; word: string; orbits: Record<string, OrbitState> }
interface CoordinateSolver { solve(pattern: Record<string, KPatternOrbitData>): string[] | null }

let cubeJsReady = false;
let solver222: CoordinateSolver | null = null;
let solverPyraMain: CoordinateSolver | null = null;
let solverPyraTips: CoordinateSolver | null = null;

export async function solveFaceletsNative(puzzle: SolvablePuzzleId, facelets: string): Promise<NativeSolveResult> {
  const validated = validateFacelets(puzzle, facelets);
  if (!validated.ok) return { ok: false, message: validated.errors[0]?.message ?? 'Invalid puzzle state.' };
  await new Promise<void>((resolve) => setTimeout(resolve, 30));
  let solution = '';
  if (puzzle === '333') {
    if (!cubeJsReady) { Cube.initSolver(); cubeJsReady = true; }
    solution = Cube.fromString(facelets).solve();
  } else if (puzzle === '222') {
    solver222 ??= create222Solver();
    const words = solver222.solve(validated.patternData);
    if (!words) return { ok: false, message: 'The native 2x2 search exceeded its depth limit.' };
    solution = words.join(' ');
  } else {
    solverPyraMain ??= createPyraminxMainSolver(); solverPyraTips ??= createPyraminxTipSolver();
    const main = solverPyraMain.solve(validated.patternData);
    if (!main) return { ok: false, message: 'The native Pyraminx search exceeded its depth limit.' };
    const tipOrientation = applyPyraminxMovesToOrbit(validated.patternData.CORNERS2.orientation, main, 'CORNERS2', 3);
    const tips = solverPyraTips.solve({ ...validated.patternData, CORNERS2: { ...validated.patternData.CORNERS2, orientation: tipOrientation } });
    if (!tips) return { ok: false, message: 'The native Pyraminx tip search exceeded its depth limit.' };
    solution = [...main, ...tips].join(' ');
  }
  const trimmed = solution.trim();
  return { ok: true, solution: trimmed, moveCount: trimmed ? trimmed.split(/\s+/).length : 0 };
}

function create222Solver(): CoordinateSolver {
  const words = ['U', 'U2', "U'", 'R', 'R2', "R'", 'F', 'F2', "F'", 'D', 'D2', "D'", 'L', 'L2', "L'", 'B', 'B2', "B'"];
  const transforms = words.map((word) => { const cube = NxnCube.solved(2); cube.applyMoves(parseSequence(word, '222')); const mapped = patternDataFromFacelets('222', cube.toFaceletString()); if (!mapped.ok) throw new Error('2x2 move table failed'); return { family: word[0], word, orbits: { orbit: mapped.patternData.CORNERS } }; });
  return buildCoordinateSolver({ transforms, orbits: [{ name: 'CORNERS', kind: 'permutation', size: 8 }, { name: 'CORNERS', kind: 'orientation', size: 8, base: 3, omitted: 1 }], maxDepth: 14 });
}

function pyraminxTransforms(words: string[], orbitName: 'EDGES' | 'CORNERS' | 'CORNERS2'): MoveTransform[] {
  return words.map((word) => { const puzzle = PyraminxPuzzle.solved(); puzzle.applyMoves(parseSequence(word, 'pyraminx')); const mapped = patternDataFromFacelets('pyraminx', puzzle.toFaceletString()); if (!mapped.ok) throw new Error('Pyraminx move table failed'); return { family: word[0].toUpperCase(), word, orbits: { orbit: mapped.patternData[orbitName] } }; });
}

function createPyraminxMainSolver(): CoordinateSolver {
  const words = ['U', "U'", 'R', "R'", 'L', "L'", 'B', "B'"];
  const edge = pyraminxTransforms(words, 'EDGES'); const corners = pyraminxTransforms(words, 'CORNERS');
  const transforms = edge.map((move, index) => ({ ...move, orbits: { orbit: move.orbits.orbit, other: corners[index].orbits.orbit } }));
  return buildCoordinateSolver({ transforms, orbits: [{ name: 'EDGES', source: 'orbit', kind: 'permutation', size: 6 }, { name: 'EDGES', source: 'orbit', kind: 'orientation', size: 6, base: 2, omitted: 1 }, { name: 'CORNERS', source: 'other', kind: 'orientation', size: 4, base: 3 }], maxDepth: 13 });
}

function createPyraminxTipSolver(): CoordinateSolver {
  const words = ['u', "u'", 'r', "r'", 'l', "l'", 'b', "b'"];
  return buildCoordinateSolver({ transforms: pyraminxTransforms(words, 'CORNERS2'), orbits: [{ name: 'CORNERS2', kind: 'orientation', size: 4, base: 3 }], maxDepth: 8 });
}

function applyPyraminxMovesToOrbit(initial: number[], words: string[], orbitName: 'CORNERS2', base: number) {
  let orientation = [...initial];
  for (const word of words) {
    const transform = pyraminxTransforms([word], orbitName)[0].orbits.orbit;
    orientation = applyOrientation(orientation, transform, base);
  }
  return orientation;
}

type OrbitConfig = { name: string; source?: string; kind: 'permutation' | 'orientation'; size: number; base?: number; omitted?: number };
function buildCoordinateSolver({ transforms, orbits, maxDepth }: { transforms: MoveTransform[]; orbits: OrbitConfig[]; maxDepth: number }): CoordinateSolver {
  const transitionTables = orbits.map((config) => buildTransitions(config, transforms));
  const distances = transitionTables.map((table) => buildDistances(table));
  return { solve(pattern) { const start = orbits.map((config) => config.kind === 'permutation' ? rankPermutation(pattern[config.name].pieces) : encodeOrientation(pattern[config.name].orientation, config.base!, config.omitted ?? 0)); if (start.every((value) => value === 0)) return []; for (let depth = Math.max(...start.map((value, index) => distances[index][value])); depth <= maxDepth; depth++) { const path: string[] = []; if (search(start, depth, '', path, transforms, transitionTables, distances)) return path; } return null; } };
}

function search(state: number[], remaining: number, previousFamily: string, path: string[], transforms: MoveTransform[], tables: Uint32Array[][], distances: Int8Array[]): boolean {
  const heuristic = Math.max(...state.map((value, index) => distances[index][value])); if (heuristic > remaining) return false; if (remaining === 0) return state.every((value) => value === 0);
  for (let move = 0; move < transforms.length; move++) { if (transforms[move].family === previousFamily) continue; const next = state.map((value, index) => tables[index][move][value]); path.push(transforms[move].word); if (search(next, remaining - 1, transforms[move].family, path, transforms, tables, distances)) return true; path.pop(); }
  return false;
}

function buildTransitions(config: OrbitConfig, transforms: MoveTransform[]): Uint32Array[] {
  const stateCount = config.kind === 'permutation' ? factorial(config.size) : Math.pow(config.base!, config.size - (config.omitted ?? 0));
  return transforms.map((transform) => { const table = new Uint32Array(stateCount); const moveOrbit = transform.orbits[config.source ?? 'orbit']; for (let coordinate = 0; coordinate < stateCount; coordinate++) { if (config.kind === 'permutation') { const old = unrankPermutation(coordinate, config.size); table[coordinate] = rankPermutation(applyPermutation(old, moveOrbit.pieces)); } else { const old = decodeOrientation(coordinate, config.size, config.base!, config.omitted ?? 0); table[coordinate] = encodeOrientation(applyOrientation(old, moveOrbit, config.base!), config.base!, config.omitted ?? 0); } } return table; });
}

function buildDistances(tables: Uint32Array[]): Int8Array {
  const distances = new Int8Array(tables[0].length); distances.fill(-1); distances[0] = 0; const queue = new Uint32Array(distances.length); let head = 0; let tail = 1; queue[0] = 0;
  while (head < tail) { const state = queue[head++]; const nextDepth = distances[state] + 1; for (const table of tables) { const next = table[state]; if (distances[next] !== -1) continue; distances[next] = nextDepth; queue[tail++] = next; } }
  return distances;
}

const factorial = (value: number) => { let result = 1; for (let i = 2; i <= value; i++) result *= i; return result; };
function rankPermutation(values: number[]) { let rank = 0; for (let i = 0; i < values.length; i++) { let smaller = 0; for (let j = i + 1; j < values.length; j++) if (values[j] < values[i]) smaller++; rank = rank * (values.length - i) + smaller; } return rank; }
function unrankPermutation(rank: number, size: number) { const choices = Array.from({ length: size }, (_, index) => index); const result: number[] = []; for (let i = 0; i < size; i++) { const unit = factorial(size - 1 - i); const index = Math.floor(rank / unit); result.push(choices.splice(index, 1)[0]); rank %= unit; } return result; }
const applyPermutation = (old: number[], map: number[]) => map.map((source) => old[source]);
function encodeOrientation(values: number[], base: number, omitted: number) { let coordinate = 0; for (let i = 0; i < values.length - omitted; i++) coordinate = coordinate * base + values[i]; return coordinate; }
function decodeOrientation(coordinate: number, size: number, base: number, omitted: number) { const values = new Array<number>(size).fill(0); let sum = 0; for (let i = size - omitted - 1; i >= 0; i--) { values[i] = coordinate % base; sum += values[i]; coordinate = Math.floor(coordinate / base); } if (omitted) values[size - 1] = (base - (sum % base)) % base; return values; }
function applyOrientation(old: number[], move: OrbitState, base: number) { return move.pieces.map((source, destination) => (old[source] + move.orientation[destination]) % base); }
