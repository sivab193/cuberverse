"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { faceShapes } from "@/lib/scanner/geometry"
import { sampleVideoFrame, type RGB } from "@/lib/scanner/sampling"
import type { SolvablePuzzleId } from "@/lib/solver/state-mapping"

export interface CameraViewHandle {
  /** Sample the current frame; null if the camera is not ready. */
  capture: () => RGB[] | null
}

export interface CameraViewProps {
  puzzle: SolvablePuzzleId
  /** Called once if the camera cannot be started (denied / unavailable). */
  onCameraError: (message: string) => void
}

/**
 * Live rear-camera preview cropped to a square, with the sticker sampling
 * grid overlaid so the user can line the face up before capturing.
 */
export const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(
  function CameraView({ puzzle, onCameraError }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [ready, setReady] = useState(false)
    const shapes = faceShapes(puzzle)

    useImperativeHandle(ref, () => ({
      capture: () => {
        const video = videoRef.current
        if (!video || !ready) return null
        return sampleVideoFrame(video, shapes)
      },
    }))

    useEffect(() => {
      let stream: MediaStream | null = null
      let cancelled = false
      ;(async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 1280 } },
            audio: false,
          })
          if (cancelled) {
            for (const track of stream.getTracks()) track.stop()
            return
          }
          const video = videoRef.current
          if (video) {
            video.srcObject = stream
            await video.play()
            setReady(true)
          }
        } catch (err) {
          if (!cancelled) {
            onCameraError(
              err instanceof DOMException && err.name === "NotAllowedError"
                ? "Camera access was denied. Allow camera access or enter the colors manually."
                : "No camera available. You can enter the colors manually instead.",
            )
          }
        }
      })()
      return () => {
        cancelled = true
        if (stream) {
          for (const track of stream.getTracks()) track.stop()
        }
      }
    }, [onCameraError])

    return (
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
        <svg
          viewBox="0 0 1 1"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {shapes.map((shape, i) => (
            <polygon
              key={i}
              points={shape.points.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={0.006}
            />
          ))}
        </svg>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Starting camera…
          </div>
        )}
      </div>
    )
  },
)
