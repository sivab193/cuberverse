"use client"

import { useCallback, useRef, useState } from "react"
import { Camera, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SCAN_STEPS } from "@/lib/scanner/geometry"
import type { RGB } from "@/lib/scanner/sampling"
import type { SolvablePuzzleId } from "@/lib/solver/state-mapping"
import { CameraView, type CameraViewHandle } from "./camera-view"

export interface ScanFlowProps {
  puzzle: SolvablePuzzleId
  /** All faces captured, in scan order. */
  onComplete: (faceSamples: RGB[][]) => void
  /** Camera unavailable — the page should fall back to manual entry. */
  onCameraError: (message: string) => void
}

/**
 * Guided face-by-face capture: shows which face to present and how, then
 * captures a color sample per sticker on each press.
 */
export function ScanFlow({ puzzle, onComplete, onCameraError }: ScanFlowProps) {
  const steps = SCAN_STEPS[puzzle]
  const cameraRef = useRef<CameraViewHandle>(null)
  const [captured, setCaptured] = useState<RGB[][]>([])

  const current = captured.length
  const done = current >= steps.length

  const capture = useCallback(() => {
    const samples = cameraRef.current?.capture()
    if (!samples) return
    const next = [...captured, samples]
    setCaptured(next)
    if (next.length >= steps.length) onComplete(next)
  }, [captured, steps.length, onComplete])

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-medium">
          {done ? "All faces captured" : `Face ${current + 1} of ${steps.length}: ${steps[current].face}`}
        </p>
        {!done && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {steps[current].instruction}
          </p>
        )}
      </div>

      <CameraView ref={cameraRef} puzzle={puzzle} onCameraError={onCameraError} />

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          title="Retake previous face"
          disabled={current === 0}
          onClick={() => setCaptured(captured.slice(0, -1))}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="lg" disabled={done} onClick={capture}>
          <Camera className="mr-2 h-4 w-4" />
          Capture {`${!done ? steps[current].face : ""}`} face
        </Button>
      </div>

      <div className="flex justify-center gap-1.5">
        {steps.map((step, i) => (
          <span
            key={step.face}
            className={`h-1.5 w-6 rounded-full ${i < current ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>
    </div>
  )
}
