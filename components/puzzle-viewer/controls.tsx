"use client"

import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePuzzleControllerState, type PuzzleController } from "./use-puzzle-controller"

const SPEEDS = [0.5, 1, 2, 3]

export interface PuzzleControlsProps {
  controller: PuzzleController
  /** Called by the reset button; defaults to seeking back to the start of the timeline. */
  onReset?: () => void
}

export function PuzzleControls({ controller, onReset }: PuzzleControlsProps) {
  const state = usePuzzleControllerState(controller)
  const disabled = state.total === 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          title="Back to start"
          onClick={() => (onReset ? onReset() : controller.seekTo(0))}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Step back"
          disabled={disabled || state.position === 0}
          onClick={() => controller.stepBack()}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          title={state.playing ? "Pause" : "Play"}
          disabled={disabled}
          onClick={() => (state.playing ? controller.pause() : controller.play())}
        >
          {state.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Step forward"
          disabled={disabled || state.position >= state.total}
          onClick={() => controller.stepForward()}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <div className="ml-2 min-w-16 text-center font-mono text-sm text-muted-foreground">
          {state.position} / {state.total}
        </div>
      </div>

      <input
        type="range"
        aria-label="Scrub through moves"
        className="w-full accent-primary"
        min={0}
        max={Math.max(state.total, 1)}
        step={1}
        disabled={disabled}
        value={state.position}
        onChange={(e) => controller.seekTo(Number(e.target.value))}
      />

      <div className="flex items-center justify-center gap-1">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            onClick={() => controller.setSpeed(speed)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              state.speed === speed
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  )
}
