"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LazyPuzzleViewer } from "@/components/puzzle-viewer/lazy"
import { usePuzzleController } from "@/components/puzzle-viewer/use-puzzle-controller"
import type { PuzzleId } from "@/lib/puzzle"

export interface MoveEntry {
  code: string
  name: string
  description: string
}

export interface MoveSection {
  title: string
  note?: string
  /** Tailwind class for the move chips in this section. */
  tone?: string
  moves: MoveEntry[]
}

export interface NotationTabProps {
  puzzle: PuzzleId
  sections: MoveSection[]
  example: { alg: string; label: string }
}

/**
 * One notation-guide tab: a clickable move reference plus a live 3D viewer.
 *
 * The viewer has to stay on screen while you pick moves, and on a phone the
 * reference is far too tall for both to fit. So below `lg` the layout is a
 * plain column with the viewer pinned to the top of the screen; at `lg` it
 * becomes the familiar two-column split with the viewer sticky beside the list.
 */
export function NotationTab({ puzzle, sections, example }: NotationTabProps) {
  const controller = usePuzzleController(puzzle)

  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:static lg:order-2 lg:col-span-1 lg:mx-0 lg:mb-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
        <div className="lg:sticky lg:top-6">
          <Card className="p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <h3 className="text-base font-semibold sm:text-lg">Interactive Viewer</h3>
              <Button
                variant="outline"
                size="icon"
                onClick={() => controller.resetAll()}
                title="Reset puzzle"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-40 w-full overflow-hidden rounded-xl border bg-secondary/20 sm:h-56 lg:h-[340px]">
              <LazyPuzzleViewer controller={controller} />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground sm:mt-3 sm:text-sm">
              <span className="lg:hidden">Drag to rotate. Tap any move below to animate it.</span>
              <span className="hidden lg:inline">
                Drag to rotate the camera. Click moves on the left to animate.
              </span>
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:col-span-2">
        {sections.map((section) => (
          <Card key={section.title} className="p-4 sm:p-6">
            <h2 className="mb-2 text-xl font-semibold sm:text-2xl">{section.title}</h2>
            {section.note && (
              <p className="mb-4 text-sm text-muted-foreground">{section.note}</p>
            )}
            <div className="grid gap-2 md:grid-cols-2">
              {section.moves.map((move) => (
                <button
                  key={move.code}
                  onClick={() => controller.applyMoves(move.code)}
                  className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-secondary/50"
                >
                  <code
                    className={`shrink-0 rounded px-3 py-1 font-mono text-base font-bold sm:text-lg ${
                      section.tone ?? "bg-primary text-primary-foreground"
                    }`}
                  >
                    {move.code}
                  </code>
                  <div className="min-w-0">
                    <p className="font-semibold">{move.name}</p>
                    <p className="text-sm text-muted-foreground">{move.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ))}

        <Card className="bg-secondary/50 p-4 sm:p-6">
          <h3 className="mb-3 text-lg font-semibold">Example Algorithm</h3>
          <button onClick={() => controller.applyMoves(example.alg)} className="group w-full text-left">
            <code className="mb-2 block break-words rounded bg-background px-3 py-3 font-mono text-sm leading-relaxed transition-colors group-hover:bg-primary/10 sm:px-4 sm:text-base md:text-lg">
              {example.alg}
            </code>
            <p className="text-sm text-muted-foreground">{example.label}</p>
          </button>
        </Card>
      </div>
    </div>
  )
}
