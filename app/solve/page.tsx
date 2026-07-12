"use client"

import { useCallback, useMemo, useState } from "react"
import { Camera, Keyboard, Loader2, ScanLine, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScanFlow } from "@/components/scanner/scan-flow"
import { ColorReview } from "@/components/scanner/color-review"
import { SolutionPlayer } from "@/components/solution-player"
import { classifyScan } from "@/lib/scanner/classify"
import type { RGB } from "@/lib/scanner/sampling"
import {
  faceletCount,
  faceLetters,
  type MappingError,
  type SolvablePuzzleId,
} from "@/lib/solver/state-mapping"
import { validateFacelets } from "@/lib/solver/validate"
import { solveFacelets } from "@/lib/solver/solve"

const PUZZLE_CHOICES: { id: SolvablePuzzleId; name: string; hint: string }[] = [
  { id: "333", name: "3x3", hint: "~20 move solution" },
  { id: "222", name: "2x2", hint: "optimal solution" },
  { id: "pyraminx", name: "Pyraminx", hint: "optimal solution" },
]

function solvedFacelets(puzzle: SolvablePuzzleId): string {
  const perFace = faceletCount(puzzle) / faceLetters(puzzle).length
  return faceLetters(puzzle)
    .map((letter) => letter.repeat(perFace))
    .join("")
}

type Step = "pick" | "scan" | "review" | "done"

export default function SolvePage() {
  const [puzzle, setPuzzle] = useState<SolvablePuzzleId>("333")
  const [step, setStep] = useState<Step>("pick")
  const [facelets, setFacelets] = useState("")
  const [cameraMessage, setCameraMessage] = useState<string | null>(null)
  const [solving, setSolving] = useState(false)
  const [solveError, setSolveError] = useState<string | null>(null)
  const [solution, setSolution] = useState<string | null>(null)

  const errors: MappingError[] = useMemo(() => {
    if (step !== "review" || facelets === "") return []
    const result = validateFacelets(puzzle, facelets)
    return result.ok ? [] : result.errors
  }, [step, puzzle, facelets])

  const startScan = (id: SolvablePuzzleId) => {
    setPuzzle(id)
    setCameraMessage(null)
    setStep("scan")
  }

  const startManual = (id: SolvablePuzzleId) => {
    setPuzzle(id)
    setCameraMessage(null)
    setFacelets(solvedFacelets(id))
    setStep("review")
  }

  const handleScanComplete = useCallback(
    (faceSamples: RGB[][]) => {
      setFacelets(classifyScan(puzzle, faceSamples))
      setStep("review")
    },
    [puzzle],
  )

  const handleCameraError = useCallback(
    (message: string) => {
      setCameraMessage(message)
      setFacelets(solvedFacelets(puzzle))
      setStep("review")
    },
    [puzzle],
  )

  const solve = async () => {
    setSolving(true)
    setSolveError(null)
    try {
      const result = await solveFacelets(puzzle, facelets)
      if (result.ok) {
        if (result.moveCount === 0) {
          setSolveError("This puzzle is already solved!")
        } else {
          setSolution(result.solution)
          setStep("done")
        }
      } else {
        setSolveError(result.errors[0]?.message ?? "This state can't be solved.")
      }
    } catch (err) {
      setSolveError(
        err instanceof Error ? `Solver error: ${err.message}` : "Solver failed unexpectedly.",
      )
    } finally {
      setSolving(false)
    }
  }

  const reset = () => {
    setStep("pick")
    setFacelets("")
    setSolution(null)
    setSolveError(null)
    setCameraMessage(null)
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="mb-3 text-4xl font-bold">Scan &amp; Solve</h1>
          <p className="text-lg text-muted-foreground">
            Show your scrambled puzzle to the camera and get a shortest-path solution played
            back in 3D. Everything runs on your device — no photos leave the browser.
          </p>
        </div>

        {step === "pick" && (
          <div className="grid gap-4 sm:grid-cols-3">
            {PUZZLE_CHOICES.map((choice) => (
              <Card key={choice.id} className="flex flex-col items-center gap-3 p-6">
                <ScanLine className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="text-xl font-semibold">{choice.name}</p>
                  <p className="text-sm text-muted-foreground">{choice.hint}</p>
                </div>
                <div className="mt-2 flex w-full flex-col gap-2">
                  <Button onClick={() => startScan(choice.id)}>
                    <Camera className="mr-2 h-4 w-4" />
                    Scan with camera
                  </Button>
                  <Button variant="outline" onClick={() => startManual(choice.id)}>
                    <Keyboard className="mr-2 h-4 w-4" />
                    Enter colors manually
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {step === "scan" && (
          <Card className="p-6">
            <ScanFlow
              puzzle={puzzle}
              onComplete={handleScanComplete}
              onCameraError={handleCameraError}
            />
            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm" onClick={reset}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {step === "review" && (
          <Card className="space-y-4 p-6">
            <div>
              <h2 className="text-xl font-semibold">Check the colors</h2>
              <p className="text-sm text-muted-foreground">
                {cameraMessage ??
                  "Fix any stickers the camera misread, then solve. Problem stickers are outlined in red."}
              </p>
            </div>

            <ColorReview
              puzzle={puzzle}
              facelets={facelets}
              onChange={setFacelets}
              errors={errors}
            />

            {errors.length > 0 && (
              <ul className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                {errors.map((error, i) => (
                  <li key={i}>{error.message}</li>
                ))}
              </ul>
            )}
            {solveError && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                {solveError}
              </p>
            )}

            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={reset}>
                Start over
              </Button>
              <Button disabled={errors.length > 0 || solving} onClick={solve}>
                {solving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Solving…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Solve it
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {step === "done" && solution && (
          <Card className="space-y-4 p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                Solution: {solution.split(/\s+/).length} moves
              </h2>
              <p className="text-sm text-muted-foreground">
                The 3D puzzle below starts from your scanned state — press play or step through.
              </p>
            </div>

            <SolutionPlayer puzzle={puzzle} solution={solution} />

            <div className="flex justify-center">
              <Button variant="outline" onClick={reset}>
                Scan another puzzle
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
