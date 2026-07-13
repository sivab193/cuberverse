"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SCAN_STEPS } from "@/lib/scanner/geometry"
import type { RGB } from "@/lib/scanner/sampling"
import type { SolvablePuzzleId } from "@/lib/solver/state-mapping"
import { CameraView, type CameraViewHandle } from "./camera-view"

export type ScanMode = "free-333" | "guided"

export interface ScanCapture {
  mode: ScanMode
  faceSamples: RGB[][]
}

export interface ScanFlowProps {
  puzzle: SolvablePuzzleId
  mode: ScanMode
  /** All faces captured by the live camera, in the mode's capture order. */
  onComplete: (capture: ScanCapture) => void
  /** Camera unavailable â€” the page should fall back to manual entry. */
  onCameraError: (message: string) => void
  /** Lets a 3x3 free scan fall back to the more prescriptive automatic path. */
  onModeChange?: (mode: ScanMode) => void
  notice?: string | null
}

const FRAME_INTERVAL_MS = 120
const STABLE_FRAME_COUNT = 5
const STABLE_DISTANCE = 8
const MOVEMENT_DISTANCE = 12
const SAME_CENTER_DISTANCE = 28

interface ScanSession {
  captured: RGB[][]
  stableFrames: RGB[][]
  lastCapture: RGB[] | null
  waitingForMovement: boolean
  complete: boolean
}

function sampleDistance(a: RGB[], b: RGB[]): number {
  if (a.length !== b.length || a.length === 0) return Infinity
  let total = 0
  for (let i = 0; i < a.length; i++) {
    total += Math.abs(a[i].r - b[i].r) + Math.abs(a[i].g - b[i].g) + Math.abs(a[i].b - b[i].b)
  }
  return total / (a.length * 3)
}

function exposure(samples: RGB[]): number {
  if (samples.length === 0) return 0
  return samples.reduce((total, { r, g, b }) => total + 0.2126 * r + 0.7152 * g + 0.0722 * b, 0) / samples.length
}

function averageFrames(frames: RGB[][]): RGB[] {
  const stickerCount = frames[0]?.length ?? 0
  return Array.from({ length: stickerCount }, (_, index) => {
    let r = 0
    let g = 0
    let b = 0
    for (const frame of frames) {
      r += frame[index].r
      g += frame[index].g
      b += frame[index].b
    }
    return { r: r / frames.length, g: g / frames.length, b: b / frames.length }
  })
}

/**
 * Automatic live scan. The camera samples at a low fixed rate, waits for a
 * stable/exposed view, averages several frames, and then captures it. The
 * 3x3 free mode de-duplicates faces through their center colors; guided mode
 * preserves the canonical scan order for every supported puzzle.
 */
export function ScanFlow({
  puzzle,
  mode,
  onComplete,
  onCameraError,
  onModeChange,
  notice,
}: ScanFlowProps) {
  const steps = SCAN_STEPS[puzzle]
  const cameraRef = useRef<CameraViewHandle>(null)
  const onCompleteRef = useRef(onComplete)
  const sessionRef = useRef<ScanSession>({
    captured: [],
    stableFrames: [],
    lastCapture: null,
    waitingForMovement: false,
    complete: false,
  })
  const [captured, setCaptured] = useState<RGB[][]>([])
  const [status, setStatus] = useState("Point one face into the guide and hold it steady.")
  const statusRef = useRef(status)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const setLiveStatus = useCallback((next: string) => {
    if (statusRef.current === next) return
    statusRef.current = next
    setStatus(next)
  }, [])

  const describeNext = useCallback(
    (count: number) => {
      if (mode === "free-333") {
        return count === 0
          ? "Show any face in the guide and hold it steady. Then rotate slowly through the rest."
          : `Face captured. Rotate to a new face (${count} of ${steps.length}).`
      }
      return count >= steps.length
        ? "All faces captured. Checking the cube state…"
        : `Captured. Next: ${steps[count].instruction}`
    },
    [mode, steps],
  )

  const commitCapture = useCallback(
    (samples: RGB[]) => {
      const session = sessionRef.current
      if (session.complete || session.captured.length >= steps.length) return
      const next = [...session.captured, samples]
      session.captured = next
      session.stableFrames = []
      session.lastCapture = samples
      session.waitingForMovement = next.length < steps.length
      setCaptured(next)
      setLiveStatus(describeNext(next.length))

      if (next.length === steps.length) {
        session.complete = true
        // Let the progress state paint before parent state unmounts this view.
        window.setTimeout(() => onCompleteRef.current({ mode, faceSamples: next }), 0)
      }
    },
    [describeNext, mode, setLiveStatus, steps.length],
  )

  const processFrame = useCallback(
    (samples: RGB[]) => {
      const session = sessionRef.current
      if (session.complete || session.captured.length >= steps.length) return

      const light = exposure(samples)
      if (light < 35) {
        session.stableFrames = []
        setLiveStatus("It is too dark to read the stickers. Move into better light.")
        return
      }
      if (light > 248) {
        session.stableFrames = []
        setLiveStatus("The view is overexposed. Reduce glare or move out of direct light.")
        return
      }

      if (session.waitingForMovement && session.lastCapture) {
        if (sampleDistance(samples, session.lastCapture) < MOVEMENT_DISTANCE) {
          setLiveStatus(
            mode === "free-333"
              ? `Rotate to a different face (${session.captured.length} of ${steps.length} captured).`
              : `Rotate to the next face: ${steps[session.captured.length].face}.`,
          )
          return
        }
        session.waitingForMovement = false
        session.stableFrames = []
      }

      const previous = session.stableFrames.at(-1)
      session.stableFrames = previous && sampleDistance(previous, samples) > STABLE_DISTANCE
        ? [samples]
        : [...session.stableFrames, samples].slice(-STABLE_FRAME_COUNT)

      if (session.stableFrames.length < STABLE_FRAME_COUNT) {
        setLiveStatus("Hold still while the camera reads this face…")
        return
      }

      const averaged = averageFrames(session.stableFrames)
      if (mode === "free-333") {
        const center = averaged[4]
        const duplicate = session.captured.some((face) => sampleDistance([face[4]], [center]) < SAME_CENTER_DISTANCE)
        if (duplicate) {
          session.stableFrames = []
          session.lastCapture = averaged
          session.waitingForMovement = true
          setLiveStatus("That face is already captured. Rotate to a new center color.")
          return
        }
      }
      commitCapture(averaged)
    },
    [commitCapture, mode, setLiveStatus, steps],
  )

  useEffect(() => {
    const interval = window.setInterval(() => {
      const samples = cameraRef.current?.capture()
      if (samples) processFrame(samples)
    }, FRAME_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [processFrame])

  const retakePrevious = useCallback(() => {
    const session = sessionRef.current
    if (session.captured.length === 0 || session.complete) return
    session.captured = session.captured.slice(0, -1)
    session.stableFrames = []
    session.lastCapture = null
    session.waitingForMovement = false
    setCaptured(session.captured)
    setLiveStatus(describeNext(session.captured.length))
  }, [describeNext, setLiveStatus])

  const captureManually = useCallback(() => {
    const samples = cameraRef.current?.capture()
    const session = sessionRef.current
    if (!samples || session.complete) return
    if (mode === "free-333" && session.captured.some((face) => sampleDistance([face[4]], [samples[4]]) < SAME_CENTER_DISTANCE)) {
      setLiveStatus("That face is already captured. Rotate to a different face first.")
      return
    }
    commitCapture(samples)
  }, [commitCapture, mode, setLiveStatus])

  const current = captured.length
  const done = current >= steps.length
  const freeScan = mode === "free-333"

  return (
    <div className="space-y-4">
      <div className="text-center" aria-live="polite">
        <p className="text-sm font-medium">
          {freeScan
            ? done
              ? "All six faces captured"
              : `Automatic scan: ${current} of ${steps.length} faces captured`
            : done
              ? "All faces captured"
              : `Automatic guided scan: face ${current + 1} of ${steps.length} (${steps[current].face})`}
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {notice ?? (freeScan
            ? "Start anywhere. Keep one face inside the guide, hold steady for a moment, then rotate the cube to show the next face."
            : steps[current]?.instruction)}
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">{status}</p>
      </div>

      <CameraView ref={cameraRef} puzzle={puzzle} onCameraError={onCameraError} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          title="Retake previous face"
          aria-label="Retake previous face"
          disabled={current === 0 || done}
          onClick={retakePrevious}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={done} onClick={captureManually}>
          <Camera className="mr-2 h-4 w-4" />
          Capture now
        </Button>
        {freeScan && onModeChange && (
          <Button variant="ghost" size="sm" onClick={() => onModeChange("guided")}>
            Use guided scan
          </Button>
        )}
      </div>

      <div className="flex justify-center gap-1.5" aria-label={`${current} of ${steps.length} faces captured`}>
        {steps.map((step, i) => (
          <span
            key={freeScan ? i : step.face}
            className={`h-1.5 w-6 rounded-full ${i < current ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>
    </div>
  )
}
