"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { PUZZLES } from "@/lib/puzzle"
import { NxnScene } from "./nxn-scene"
import { PyraminxScene } from "./pyraminx-scene"
import type { PuzzleController } from "./use-puzzle-controller"

export interface PuzzleViewerProps {
  controller: PuzzleController
  className?: string
}

export function PuzzleViewer({ controller, className }: PuzzleViewerProps) {
  const meta = PUZZLES[controller.puzzle]

  // Fills its parent by default — callers own the (responsive) height. A fixed
  // height here would overflow the smaller boxes it gets rendered into.
  return (
    <div className={className ?? "h-full w-full"}>
      <Canvas camera={{ position: [4.4, 3.6, 5.6], fov: 42 }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[10, 12, 8]} intensity={1.6} />
        <directionalLight position={[-8, 6, -10]} intensity={0.7} />
        <directionalLight position={[0, -10, 4]} intensity={0.4} />
        {meta.kind === "pyraminx" ? (
          <PyraminxScene controller={controller} />
        ) : (
          <NxnScene key={meta.n} controller={controller} />
        )}
        <OrbitControls enablePan={false} minDistance={4.5} maxDistance={14} />
      </Canvas>
    </div>
  )
}

export default PuzzleViewer
