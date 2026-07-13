"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { generateScramble, scrambleToString } from "@/lib/scramble"
import { loadCubingScramble } from "@/lib/solver/cubing-loader"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, Timestamp, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import { RefreshCw, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type TimerState = "idle" | "ready" | "running" | "stopped"

const CUBE_TYPES = ["2x2", "3x3", "4x4", "5x5", "6x6", "7x7", "pyraminx"] as const

/** WCA event ids for cubing.js random-state scrambles. */
const EVENT_IDS: Record<string, string> = {
  "2x2": "222",
  "3x3": "333",
  "4x4": "444",
  "5x5": "555",
  "6x6": "666",
  "7x7": "777",
  pyraminx: "pyram",
}

/** WCA random-state scramble, falling back to local random moves offline. */
async function fetchScramble(cubeType: string): Promise<string> {
  try {
    const { randomScrambleForEvent } = await loadCubingScramble()
    const alg = await randomScrambleForEvent(EVENT_IDS[cubeType] ?? "333")
    return alg.toString()
  } catch {
    return scrambleToString(generateScramble(cubeType))
  }
}

export default function TimerPage() {
  const [user] = useAuthState(auth)
  const [scramble, setScramble] = useState<string>("")
  const [cubeType, setCubeType] = useState<string>("3x3")
  const [time, setTime] = useState<number>(0)
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [times, setTimes] = useState<number[]>([])
  // Drives the on-screen hint only ("tap and hold" vs "hold SPACE"); both
  // input paths stay wired up regardless, for hybrid touch laptops.
  const [isTouch, setIsTouch] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  // Prefetched scramble so the next one appears instantly after a solve.
  const prefetchRef = useRef<{ cubeType: string; promise: Promise<string> } | null>(null)
  const scrambleSeq = useRef(0)

  const newScramble = useCallback(() => {
    const seq = ++scrambleSeq.current
    setScramble("")
    const prefetched = prefetchRef.current
    const promise =
      prefetched && prefetched.cubeType === cubeType ? prefetched.promise : fetchScramble(cubeType)
    prefetchRef.current = { cubeType, promise: fetchScramble(cubeType) }
    void promise.then((next) => {
      if (seq === scrambleSeq.current) setScramble(next)
    })
  }, [cubeType])

  useEffect(() => {
    newScramble()
  }, [newScramble])

  const saveTime = useCallback(
    async (timeMs: number) => {
      try {
        await addDoc(collection(db, "solves"), {
          userId: user?.uid,
          time: timeMs,
          cubeType,
          scramble,
          timestamp: Timestamp.now(),
        })
      } catch (error) {
        console.error("Error saving time:", error)
      }
    },
    [user, cubeType, scramble],
  )

  const startTimer = useCallback(() => {
    setTimerState("running")
    startTimeRef.current = Date.now()
    setTime(0)

    intervalRef.current = setInterval(() => {
      setTime(Date.now() - startTimeRef.current)
    }, 10)
  }, [])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setTimerState("stopped")

    const finalTime = Date.now() - startTimeRef.current
    setTimes((prev) => [...prev, finalTime])

    // Save to Firebase if user is logged in
    if (user) {
      saveTime(finalTime)
    }

    setTimeout(() => {
      newScramble()
    }, 100)
  }, [user, saveTime, newScramble])

  const handleSpacePress = useCallback(() => {
    if (timerState === "idle" || timerState === "stopped") {
      setTimerState("ready")
    } else if (timerState === "running") {
      stopTimer()
    }
  }, [timerState, stopTimer])

  const handleSpaceRelease = useCallback(() => {
    if (timerState === "ready") {
      startTimer()
    }
  }, [timerState, startTimer])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        handleSpacePress()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        handleSpaceRelease()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleSpacePress, handleSpaceRelease])

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches)
  }, [])

  // Touch/mouse equivalent of holding SPACE: press to arm, release to start,
  // press again to stop. Without this the timer is keyboard-only, which makes
  // it unusable on a phone.
  const handlePadDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    // Keep receiving the release even if the finger slides off the pad.
    e.currentTarget.setPointerCapture(e.pointerId)
    handleSpacePress()
  }

  const handlePadUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    handleSpaceRelease()
  }

  // Gesture interrupted (call, notification, browser gesture): disarm rather
  // than starting a solve the user never began.
  const handlePadCancel = () => {
    setTimerState((state) => (state === "ready" ? "idle" : state))
  }

  const clearAllSolves = async () => {
    // Clear local state
    setTimes([])

    // Clear from Firebase if user is logged in
    if (user) {
      try {
        const q = query(collection(db, "solves"), where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)

        const deletePromises = querySnapshot.docs.map((document) => deleteDoc(doc(db, "solves", document.id)))

        await Promise.all(deletePromises)
      } catch (error) {
        console.error("Error clearing solves from Firebase:", error)
      }
    }
  }

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = Math.floor((ms % 1000) / 10)

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
    }
    return `${seconds}.${milliseconds.toString().padStart(2, "0")}`
  }

  const calculateAverage = (arr: number[], count: number): string => {
    if (arr.length < count) return "-"
    const recent = arr.slice(-count)
    const avg = recent.reduce((a, b) => a + b, 0) / count
    return formatTime(avg)
  }

  const getTimerColor = () => {
    if (timerState === "ready") return "text-green-500"
    if (timerState === "running") return "text-foreground"
    return "text-muted-foreground"
  }

  return (
    <div>
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Timer Section */}
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-6 md:p-8">
              <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
                <Select value={cubeType} onValueChange={setCubeType}>
                  <SelectTrigger className="w-28 sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CUBE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "pyraminx" ? "Pyraminx" : type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="sm" onClick={newScramble} title="New scramble">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Scramble Display — big-cube scrambles run long, so it must wrap. */}
              <div className="mb-4 rounded-lg bg-secondary p-3 text-center sm:mb-6 sm:p-6">
                <p className="break-words font-mono text-sm leading-relaxed sm:text-base md:text-lg">
                  {scramble || <span className="text-muted-foreground">Generating scramble…</span>}
                </p>
              </div>

              {/* Timer Display doubles as the touch pad. touch-none keeps the
                  hold gesture from scrolling or pull-to-refreshing the page. */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Timer. Press and hold, then release to start."
                onPointerDown={handlePadDown}
                onPointerUp={handlePadUp}
                onPointerCancel={handlePadCancel}
                onContextMenu={(e) => e.preventDefault()}
                className={`mb-4 flex min-h-[38vh] cursor-pointer touch-none select-none flex-col items-center justify-center rounded-xl border border-dashed px-2 text-center transition-colors [-webkit-touch-callout:none] sm:mb-6 sm:min-h-0 sm:border-transparent sm:py-6 ${
                  timerState === "ready"
                    ? "border-green-500/60 bg-green-500/10"
                    : "border-border/60 hover:bg-secondary/30"
                }`}
              >
                <div
                  className={`font-mono text-[clamp(2.75rem,15vw,6rem)] font-bold tabular-nums leading-none transition-colors ${getTimerColor()}`}
                >
                  {formatTime(time)}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {timerState === "idle" &&
                    (isTouch ? "Tap and hold here to start" : "Press and hold SPACE to start")}
                  {timerState === "ready" && (isTouch ? "Release to begin" : "Release SPACE to begin")}
                  {timerState === "running" && (isTouch ? "Tap to stop" : "Press SPACE to stop")}
                  {timerState === "stopped" &&
                    (isTouch ? "Tap and hold for the next solve" : "Press SPACE for next solve")}
                </p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="rounded-lg bg-secondary p-2 text-center sm:p-4">
                  <div className="text-xs text-muted-foreground sm:text-sm">Best</div>
                  <div className="mt-1 font-mono text-base font-bold tabular-nums sm:text-xl md:text-2xl">
                    {times.length > 0 ? formatTime(Math.min(...times)) : "-"}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-2 text-center sm:p-4">
                  <div className="text-xs text-muted-foreground sm:text-sm">Ao5</div>
                  <div className="mt-1 font-mono text-base font-bold tabular-nums sm:text-xl md:text-2xl">
                    {calculateAverage(times, 5)}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-2 text-center sm:p-4">
                  <div className="text-xs text-muted-foreground sm:text-sm">Ao12</div>
                  <div className="mt-1 font-mono text-base font-bold tabular-nums sm:text-xl md:text-2xl">
                    {calculateAverage(times, 12)}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Times */}
          <div>
            <Card className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold sm:text-xl">Recent Solves</h2>
                {times.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear All Solves?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your past solves. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={clearAllSolves}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              {times.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No solves yet</p>
              ) : (
                <div className="space-y-2">
                  {times
                    .slice(-10)
                    .reverse()
                    .map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                        <span className="text-sm text-muted-foreground">#{times.length - idx}</span>
                        <span className="font-mono font-semibold">{formatTime(t)}</span>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
