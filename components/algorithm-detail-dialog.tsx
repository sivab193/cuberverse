"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SolutionPlayer } from "@/components/solution-player"
import { CUBE_TYPE_TO_PUZZLE, type Algorithm } from "@/lib/algorithms"

export interface AlgorithmDetailDialogProps {
  algorithm: Algorithm | null
  onOpenChange: (open: boolean) => void
}

/**
 * Case detail: the puzzle starts in the case (the algorithm's inverse applied
 * to solved) and the algorithm plays out on it in 3D, so you can watch, step,
 * and scrub the case being solved. The 3D viewer only mounts when a dialog is
 * open, keeping it off the page's initial bundle.
 */
export function AlgorithmDetailDialog({ algorithm, onOpenChange }: AlgorithmDetailDialogProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied((current) => (current === text ? null : current)), 2000)
  }

  return (
    <Dialog open={algorithm !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {algorithm && (
          <>
            <DialogHeader>
              <DialogTitle>{algorithm.name}</DialogTitle>
              <DialogDescription>{algorithm.description}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{algorithm.cubeType}</Badge>
              <Badge variant="outline">{algorithm.method}</Badge>
              <Badge variant="outline">{algorithm.category}</Badge>
              {algorithm.group && <Badge variant="outline">{algorithm.group}</Badge>}
              {algorithm.probability && (
                <Badge variant="outline">Odds {algorithm.probability}</Badge>
              )}
            </div>

            {algorithm.recognition && (
              <p className="rounded-lg bg-secondary/50 p-3 text-sm">
                <span className="font-semibold">Recognition: </span>
                {algorithm.recognition}
              </p>
            )}

            <SolutionPlayer
              puzzle={CUBE_TYPE_TO_PUZZLE[algorithm.cubeType]}
              solution={algorithm.algorithm}
              viewerClassName="h-56 sm:h-72"
            />

            <div className="space-y-2">
              <p className="text-sm font-semibold">
                {algorithm.alternatives?.length ? "Algorithms" : "Algorithm"}
              </p>
              {[algorithm.algorithm, ...(algorithm.alternatives ?? [])].map((alg, i) => (
                <div
                  key={alg}
                  className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3"
                >
                  <code className="min-w-0 break-words font-mono text-sm">{alg}</code>
                  <div className="flex shrink-0 items-center gap-1">
                    {i === 0 && <Badge className="text-xs">Main</Badge>}
                    <Button size="sm" variant="ghost" onClick={() => copy(alg)}>
                      {copied === alg ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
