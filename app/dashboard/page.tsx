"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, doc, setDoc, getDoc } from "firebase/firestore"
import { algorithms } from "@/lib/algorithms"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Clock, TrendingUp, BookOpen } from "lucide-react"

interface Solve {
  time: number
  cubeType: string
  timestamp: any
}

interface AlgoProgress {
  [algoId: string]: "learning" | "learned"
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, loading] = useAuthState(auth)
  const [solves, setSolves] = useState<Solve[]>([])
  const [algoProgress, setAlgoProgress] = useState<AlgoProgress>({})

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchSolves()
      fetchAlgoProgress()
    }
  }, [user])

  const fetchSolves = async () => {
    if (!user) return

    try {
      const q = query(collection(db, "solves"), where("userId", "==", user.uid), orderBy("timestamp", "desc"))
      const querySnapshot = await getDocs(q)
      const solvesData = querySnapshot.docs.map((doc) => doc.data() as Solve)
      setSolves(solvesData)
    } catch (error) {
      console.error("Error fetching solves:", error)
    }
  }

  const fetchAlgoProgress = async () => {
    if (!user) return

    try {
      const docRef = doc(db, "algoProgress", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setAlgoProgress(docSnap.data() as AlgoProgress)
      }
    } catch (error) {
      console.error("Error fetching algo progress:", error)
    }
  }

  const updateAlgoProgress = async (algoId: string, status: "learning" | "learned" | null) => {
    if (!user) return

    try {
      const newProgress = { ...algoProgress }

      if (status === null) {
        delete newProgress[algoId]
      } else {
        newProgress[algoId] = status
      }

      await setDoc(doc(db, "algoProgress", user.uid), newProgress)
      setAlgoProgress(newProgress)
    } catch (error) {
      console.error("Error updating algo progress:", error)
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

  const bestTime = solves.length > 0 ? Math.min(...solves.map((s) => s.time)) : 0
  const totalSolves = solves.length
  const learningCount = Object.values(algoProgress).filter((s) => s === "learning").length
  const learnedCount = Object.values(algoProgress).filter((s) => s === "learned").length

  if (loading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and improvement</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card className="p-6">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Best Time</span>
            </div>
            <div className="font-mono text-3xl font-bold">{bestTime > 0 ? formatTime(bestTime) : "-"}</div>
          </Card>

          <Card className="p-6">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Total Solves</span>
            </div>
            <div className="font-mono text-3xl font-bold">{totalSolves}</div>
          </Card>

          <Card className="p-6">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Learning</span>
            </div>
            <div className="font-mono text-3xl font-bold">{learningCount}</div>
          </Card>

          <Card className="p-6">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm">Learned</span>
            </div>
            <div className="font-mono text-3xl font-bold">{learnedCount}</div>
          </Card>
        </div>

        <Tabs defaultValue="solves">
          <TabsList>
            <TabsTrigger value="solves">Recent Solves</TabsTrigger>
            <TabsTrigger value="algorithms">Algorithm Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="solves">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Recent Solves</h2>
              {solves.length === 0 ? (
                <p className="text-center text-muted-foreground">No solves yet. Start timing!</p>
              ) : (
                <div className="space-y-2">
                  {solves.slice(0, 20).map((solve, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-secondary p-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">#{idx + 1}</span>
                        <Badge variant="outline">{solve.cubeType}</Badge>
                      </div>
                      <span className="font-mono text-lg font-semibold">{formatTime(solve.time)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="algorithms">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Algorithm Progress</h2>
              <div className="space-y-4">
                {algorithms.map((algo) => {
                  const status = algoProgress[algo.id]

                  return (
                    <div key={algo.id} className="flex items-center justify-between rounded-lg bg-secondary p-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-semibold">{algo.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {algo.category}
                          </Badge>
                        </div>
                        <p className="font-mono text-sm text-muted-foreground">{algo.algorithm}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={status === "learning" ? "default" : "outline"}
                          onClick={() => updateAlgoProgress(algo.id, status === "learning" ? null : "learning")}
                        >
                          Learning
                        </Button>
                        <Button
                          size="sm"
                          variant={status === "learned" ? "default" : "outline"}
                          onClick={() => updateAlgoProgress(algo.id, status === "learned" ? null : "learned")}
                        >
                          Learned
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
