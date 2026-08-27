import { describe, expect, it } from '@jest/globals';
import { NxnCube, PyraminxPuzzle, parseSequence } from '@shared/puzzle';
import { solveFaceletsNative } from '../solver';

describe('native solver adapter', () => {
  it('solves a 3x3 facelet state', async () => {
    const cube = NxnCube.solved(3);
    cube.applyMoves(parseSequence("R U R' F2 D L2", '333'));
    const result = await solveFaceletsNative('333', cube.toFaceletString());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    cube.applyMoves(parseSequence(result.solution, '333'));
    expect(cube.isSolved()).toBe(true);
  });

  it('solves a 2x2 facelet state', async () => {
    const cube = NxnCube.solved(2);
    cube.applyMoves(parseSequence("R U R' F2 U'", '222'));
    const result = await solveFaceletsNative('222', cube.toFaceletString());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    cube.applyMoves(parseSequence(result.solution, '222'));
    expect(cube.isSolved()).toBe(true);
  });

  it('solves a Pyraminx facelet state including tips', async () => {
    const puzzle = PyraminxPuzzle.solved();
    puzzle.applyMoves(parseSequence("R U' L B r u'", 'pyraminx'));
    const result = await solveFaceletsNative('pyraminx', puzzle.toFaceletString());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    puzzle.applyMoves(parseSequence(result.solution, 'pyraminx'));
    expect(puzzle.isSolved()).toBe(true);
  });
});
