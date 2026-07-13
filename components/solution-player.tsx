"use client"

import { useEffect, useMemo } from "react"
import { LazyPuzzleViewer } from "@/components/puzzle-viewer/lazy"
import { PuzzleControls } from "@/components/puzzle-viewer/controls"
import {
  usePuzzleController,
  usePuzzleControllerState,
} from "@/components/puzzle-viewer/use-puzzle-controller"
import { invertMoves, parseSequence, type PuzzleId } from "@/lib/puzzle"

export interface SolutionPlayerProps {
  puzzle: PuzzleId
  /** Solution alg in our notation; the shown puzzle starts at its inverse (= the scanned state). */
  solution: string
  /** Height box for the 3D viewer — override where vertical space is tight (e.g. in a dialog). */
  viewerClassName?: string
}

/**
 * 3D playback of a solve: the puzzle starts in the scanned state (the
 * solution's inverse applied to solved) and the timeline plays the solution,
 * with each move highlighted as it goes by.
 */
export function SolutionPlayer({ puzzle, solution, viewerClassName }: SolutionPlayerProps) {
  const controller = usePuzzleController(puzzle)
  const state = usePuzzleControllerState(controller)

  const moves = useMemo(() => parseSequence(solution, puzzle), [solution, puzzle])
  const moveStrings = useMemo(() => solution.split(/\s+/).filter(Boolean), [solution])

  useEffect(() => {
    controller.setBase(invertMoves(moves))
    controller.applyMoves(moves, { instant: true })
    controller.seekTo(0)
  }, [controller, moves])

  return (
    <div className="space-y-4">
      <div
        className={`w-full overflow-hidden rounded-xl border bg-card ${
          viewerClassName ?? "h-64 sm:h-80 md:h-96"
        }`}
      >
        <LazyPuzzleViewer controller={controller} />
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {moveStrings.map((move, i) => (
          <button
            key={i}
            type="button"
            onClick={() => controller.seekTo(i)}
            className={`rounded px-2 py-1 font-mono text-sm transition-colors ${
              i === state.position && state.position < state.total
                ? "bg-primary text-primary-foreground"
                : i < state.position
                  ? "bg-secondary/50 text-muted-foreground"
                  : "bg-secondary text-secondary-foreground"
            }`}
          >
            {move}
          </button>
        ))}
      </div>

      <PuzzleControls controller={controller} />
    </div>
  )
}
