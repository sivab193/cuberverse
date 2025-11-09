"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { generateScramble, scrambleToString } from "@/lib/scramble"
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

export default function TimerPage() {
  const [user] = useAuthState(auth)
  const [scramble, setScramble] = useState<string>("")
  const [cubeType, setCubeType] = useState<string>("3x3")
  const [time, setTime] = useState<number>(0)
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [times, setTimes] = useState<number[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    newScramble()
  }, [cubeType])

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
  }, [timerState])

  const newScramble = () => {
    const scrambleLength = cubeType === "2x2" ? 11 : 20
    const newScrambleArray = generateScramble(cubeType, scrambleLength)
    setScramble(scrambleToString(newScrambleArray))
  }

  const handleSpacePress = () => {
    if (timerState === "idle" || timerState === "stopped") {
      setTimerState("ready")
    } else if (timerState === "running") {
      stopTimer()
    }
  }

  const handleSpaceRelease = () => {
    if (timerState === "ready") {
      startTimer()
    }
  }

  const startTimer = () => {
    setTimerState("running")
    startTimeRef.current = Date.now()
    setTime(0)

    intervalRef.current = setInterval(() => {
      setTime(Date.now() - startTimeRef.current)
    }, 10)
  }

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setTimerState("stopped")

    const finalTime = Date.now() - startTimeRef.current
    setTimes([...times, finalTime])

    // Save to Firebase if user is logged in
    if (user) {
      saveTime(finalTime)
    }

    setTimeout(() => {
      newScramble()
    }, 100)
  }

  const saveTime = async (timeMs: number) => {
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
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Timer Section */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <Select value={cubeType} onValueChange={setCubeType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2x2">2x2</SelectItem>
                    <SelectItem value="3x3">3x3</SelectItem>
                    <SelectItem value="pyraminx">Pyraminx</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="sm" onClick={newScramble}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Scramble Display */}
              <div className="mb-12 rounded-lg bg-secondary p-6 text-center">
                <p className="text-lg font-mono leading-relaxed">{scramble}</p>
              </div>

              {/* Timer Display */}
              <div className="mb-8 text-center">
                <div className={`font-mono text-8xl font-bold transition-colors ${getTimerColor()}`}>
                  {formatTime(time)}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {timerState === "idle" && "Press and hold SPACE to start"}
                  {timerState === "ready" && "Release SPACE to begin"}
                  {timerState === "running" && "Press SPACE to stop"}
                  {timerState === "stopped" && "Press SPACE for next solve"}
                </p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-secondary p-4 text-center">
                  <div className="text-sm text-muted-foreground">Best</div>
                  <div className="mt-1 font-mono text-2xl font-bold">
                    {times.length > 0 ? formatTime(Math.min(...times)) : "-"}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-4 text-center">
                  <div className="text-sm text-muted-foreground">Ao5</div>
                  <div className="mt-1 font-mono text-2xl font-bold">{calculateAverage(times, 5)}</div>
                </div>
                <div className="rounded-lg bg-secondary p-4 text-center">
                  <div className="text-sm text-muted-foreground">Ao12</div>
                  <div className="mt-1 font-mono text-2xl font-bold">{calculateAverage(times, 12)}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Times */}
          <div>
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Solves</h2>
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
