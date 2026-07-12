"use client"

import { useState } from "react"
import { faceShapes, SCAN_STEPS } from "@/lib/scanner/geometry"
import { faceLetters, type MappingError, type SolvablePuzzleId } from "@/lib/solver/state-mapping"
import { STICKER_COLORS, PYRAMINX_COLORS } from "@/components/puzzle-viewer/materials"
import type { Face, PyraminxFace } from "@/lib/puzzle"

export interface ColorReviewProps {
  puzzle: SolvablePuzzleId
  /** Current facelet letters (canonical order). */
  facelets: string
  onChange: (next: string) => void
  /** Validation errors; their facelet indices are highlighted. */
  errors?: MappingError[]
}

function displayColor(puzzle: SolvablePuzzleId, letter: string): string {
  if (puzzle === "pyraminx") return PYRAMINX_COLORS[letter as PyraminxFace] ?? "#333"
  return STICKER_COLORS[letter as Face] ?? "#333"
}

/**
 * Tap-to-correct review of a scan: one mini face-diagram per scanned face.
 * Pick a color from the palette, then tap any stickers that were misread.
 */
export function ColorReview({ puzzle, facelets, onChange, errors = [] }: ColorReviewProps) {
  const letters = faceLetters(puzzle)
  const [brush, setBrush] = useState(letters[0])
  const shapes = faceShapes(puzzle)
  const perFace = shapes.length
  const steps = SCAN_STEPS[puzzle]
  const flagged = new Set(errors.flatMap((e) => e.facelets))

  const setSticker = (index: number) => {
    if (facelets[index] === brush) return
    onChange(`${facelets.slice(0, index)}${brush}${facelets.slice(index + 1)}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {letters.map((letter) => (
          <button
            key={letter}
            type="button"
            aria-label={`Paint with ${letter}`}
            aria-pressed={brush === letter}
            onClick={() => setBrush(letter)}
            className={`h-9 w-9 rounded-lg border-2 transition-transform ${
              brush === letter ? "scale-110 border-primary" : "border-border"
            }`}
            style={{ backgroundColor: displayColor(puzzle, letter) }}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          pick a color, then tap stickers to fix them
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {steps.map((step, faceIdx) => (
          <div key={step.face} className="space-y-1">
            <p className="text-center text-xs font-medium text-muted-foreground">
              {step.face} face
            </p>
            <svg viewBox="0 0 1 1" className="w-full">
              {shapes.map((shape, i) => {
                const index = faceIdx * perFace + i
                return (
                  <polygon
                    key={i}
                    role="button"
                    aria-label={`Sticker ${index}`}
                    points={shape.points.map(([x, y]) => `${x},${y}`).join(" ")}
                    fill={displayColor(puzzle, facelets[index])}
                    stroke={flagged.has(index) ? "#ef4444" : "rgba(0,0,0,0.5)"}
                    strokeWidth={flagged.has(index) ? 0.02 : 0.008}
                    className="cursor-pointer"
                    onClick={() => setSticker(index)}
                  />
                )
              })}
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}
