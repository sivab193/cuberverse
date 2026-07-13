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
 * One notation-guide tab: clickable move reference on the left, a sticky
 * live 3D viewer on the right. Every listed move animates on the puzzle.
 */
export function NotationTab({ puzzle, sections, example }: NotationTabProps) {
  const controller = usePuzzleController(puzzle)

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="grid gap-6 lg:col-span-2">
        {sections.map((section) => (
          <Card key={section.title} className="p-6">
            <h2 className="mb-2 text-2xl font-semibold">{section.title}</h2>
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
                    className={`rounded px-3 py-1 font-mono text-lg font-bold ${
                      section.tone ?? "bg-primary text-primary-foreground"
                    }`}
                  >
                    {move.code}
                  </code>
                  <div>
                    <p className="font-semibold">{move.name}</p>
                    <p className="text-sm text-muted-foreground">{move.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ))}

        <Card className="bg-secondary/50 p-6">
          <h3 className="mb-3 text-lg font-semibold">Example Algorithm</h3>
          <button onClick={() => controller.applyMoves(example.alg)} className="group w-full text-left">
            <code className="mb-2 block rounded bg-background px-4 py-3 font-mono text-lg transition-colors group-hover:bg-primary/10">
              {example.alg}
            </code>
            <p className="text-sm text-muted-foreground">{example.label}</p>
          </button>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Interactive Viewer</h3>
              <Button
                variant="outline"
                size="icon"
                onClick={() => controller.resetAll()}
                title="Reset puzzle"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <LazyPuzzleViewer controller={controller} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Drag to rotate the camera. Click moves on the left to animate.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
