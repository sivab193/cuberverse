import { useFrame } from '@react-three/fiber';
import { FACE_FRAMES, FACE_ORDER, PUZZLES, type Face } from '@shared/puzzle';

import type { PuzzleController } from '@/core/puzzle-controller';
import { usePuzzleControllerState } from '@/core/puzzle-controller';

const COLORS: Record<string, string> = { U: '#f1f5f9', D: '#fde047', F: '#4ade80', B: '#3b82f6', R: '#ef4444', L: '#fb923c' };
const ROTATION: Record<Face, [number, number, number]> = { F: [0, 0, 0], B: [0, Math.PI, 0], R: [0, Math.PI / 2, 0], L: [0, -Math.PI / 2, 0], U: [-Math.PI / 2, 0, 0], D: [Math.PI / 2, 0, 0] };

export function PuzzleScene({ controller }: { controller: PuzzleController }) {
  usePuzzleControllerState(controller);
  useFrame((_, delta) => controller.tick(Math.min(delta, 0.1)));
  const facelets = controller.snapshot().toFaceletString();
  if (controller.puzzle === 'pyraminx') return <PyraminxState facelets={facelets} />;
  return <CubeState n={PUZZLES[controller.puzzle].n} facelets={facelets} />;
}

function CubeState({ n, facelets }: { n: number; facelets: string }) {
  const half = (n - 1) / 2; const scale = 2.9 / n;
  return <group scale={scale} rotation={[0.35, -0.55, 0]}><mesh><boxGeometry args={[n, n, n]} /><meshStandardMaterial color="#10141f" roughness={0.5} /></mesh>{FACE_ORDER.flatMap((face, faceIndex) => { const frame = FACE_FRAMES[face]; return Array.from({ length: n * n }, (_, index) => { const row = Math.floor(index / n); const col = index % n; const position: [number, number, number] = [0, 1, 2].map((axis) => frame.normal[axis] * (n / 2 + 0.012) + frame.rowDir[axis] * (row - half) + frame.colDir[axis] * (col - half)) as [number, number, number]; return <mesh key={`${face}-${index}`} position={position} rotation={ROTATION[face]}><planeGeometry args={[0.88, 0.88]} /><meshStandardMaterial color={COLORS[facelets[faceIndex * n * n + index]] ?? '#666'} roughness={0.25} /></mesh>; }); })}</group>;
}

function PyraminxState({ facelets }: { facelets: string }) {
  const colors = [facelets[4], facelets[13], facelets[22], facelets[31]].map((letter) => COLORS[letter] ?? '#777');
  return <group rotation={[0.15, -0.4, 0]} scale={1.7}><mesh><tetrahedronGeometry args={[1.5, 0]} /><meshStandardMaterial color={colors[0]} vertexColors={false} roughness={0.3} /></mesh></group>;
}
