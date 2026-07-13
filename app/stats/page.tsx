"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingDown, TrendingUp, Activity, Award } from "lucide-react"

interface Solve {
  time: number
  cubeType: string
  timestamp: Timestamp
}

export default function StatsPage() {
  const router = useRouter()
  const [user, loading] = useAuthState(auth)
  const [solves, setSolves] = useState<Solve[]>([])
  const [selectedCube, setSelectedCube] = useState<string>("all")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  const fetchSolves = useCallback(async () => {
    if (!user) return

    try {
      const q = query(collection(db, "solves"), where("userId", "==", user.uid), orderBy("timestamp", "desc"))
      const querySnapshot = await getDocs(q)
      const solvesData = querySnapshot.docs.map((doc) => doc.data() as Solve)
      setSolves(solvesData)
    } catch (error) {
      console.error("Error fetching solves:", error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchSolves()
    }
  }, [user, fetchSolves])

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

  const cubeTypes = Array.from(new Set(solves.map((solve) => solve.cubeType))).sort()

  const filteredSolves = selectedCube === "all" ? solves : solves.filter((solve) => solve.cubeType === selectedCube)

  // Prepare chart data
  const chartData = filteredSolves
    .slice()
    .reverse()
    .slice(-20)
    .map((solve, idx) => ({
      solve: idx + 1,
      time: solve.time / 1000, // Convert to seconds for chart
      timeMs: solve.time,
    }))

  // Calculate statistics
  const times = filteredSolves.map((s) => s.time)
  const bestTime = times.length > 0 ? Math.min(...times) : 0
  const worstTime = times.length > 0 ? Math.max(...times) : 0
  const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0

  const calculateAo = (count: number): number => {
    if (times.length < count) return 0
    const recent = times.slice(0, count)
    return recent.reduce((a, b) => a + b, 0) / count
  }

  const ao5 = calculateAo(5)
  const ao12 = calculateAo(12)
  const ao100 = calculateAo(100)

  // Calculate improvement percentage
  const recentAvg = times.length >= 10 ? times.slice(0, 10).reduce((a, b) => a + b, 0) / 10 : 0
  const olderAvg = times.length >= 20 ? times.slice(10, 20).reduce((a, b) => a + b, 0) / 10 : 0
  const improvement = olderAvg > 0 ? ((olderAvg - recentAvg) / olderAvg) * 100 : 0

  // Distribution data
  const timeRanges = [
    { range: "< 10s", count: 0 },
    { range: "10-15s", count: 0 },
    { range: "15-20s", count: 0 },
    { range: "20-30s", count: 0 },
    { range: "30-60s", count: 0 },
    { range: "> 60s", count: 0 },
  ]

  times.forEach((time) => {
    const seconds = time / 1000
    if (seconds < 10) timeRanges[0].count++
    else if (seconds < 15) timeRanges[1].count++
    else if (seconds < 20) timeRanges[2].count++
    else if (seconds < 30) timeRanges[3].count++
    else if (seconds < 60) timeRanges[4].count++
    else timeRanges[5].count++
  })

  if (loading || !user) {
    return (
      <div>
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground sm:px-6">
          Loading…
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Statistics &amp; Progress</h1>
          <p className="text-muted-foreground">Analyze your solving performance over time</p>
        </div>

        {/* Cube Type Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCube("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedCube === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            All Cubes
          </button>
          {cubeTypes.map((cube) => (
            <button
              key={cube}
              onClick={() => setSelectedCube(cube)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCube === cube ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {cube}
            </button>
          ))}
        </div>

        {filteredSolves.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No solves yet for this category. Start timing!</p>
          </Card>
        ) : (
          <>
            {/* Key Stats */}
            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
              <Card className="p-4 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4 shrink-0" />
                  <span className="text-xs sm:text-sm">Personal Best</span>
                </div>
                <div className="mb-1 font-mono text-2xl font-bold tabular-nums sm:text-3xl">
                  {formatTime(bestTime)}
                </div>
                <p className="text-xs text-muted-foreground">All-time record</p>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4 shrink-0" />
                  <span className="text-xs sm:text-sm">Average</span>
                </div>
                <div className="mb-1 font-mono text-2xl font-bold tabular-nums sm:text-3xl">
                  {formatTime(avgTime)}
                </div>
                <p className="text-xs text-muted-foreground">Overall average</p>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4 shrink-0" />
                  <span className="text-xs sm:text-sm">Ao5</span>
                </div>
                <div className="mb-1 font-mono text-2xl font-bold tabular-nums sm:text-3xl">
                  {ao5 > 0 ? formatTime(ao5) : "-"}
                </div>
                <p className="text-xs text-muted-foreground">Average of 5</p>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  {improvement >= 0 ? (
                    <TrendingDown className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <span className="text-xs sm:text-sm">Improvement</span>
                </div>
                <div className="mb-1 font-mono text-2xl font-bold tabular-nums sm:text-3xl">
                  {improvement > 0 ? "+" : ""}
                  {improvement.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Last 10 vs previous 10</p>
              </Card>
            </div>

            <Tabs defaultValue="progression" className="mb-8">
              <TabsList className="grid w-full grid-cols-3 sm:w-fit">
                <TabsTrigger value="progression">Progression</TabsTrigger>
                <TabsTrigger value="distribution">Distribution</TabsTrigger>
                <TabsTrigger value="averages">Averages</TabsTrigger>
              </TabsList>

              <TabsContent value="progression">
                <Card className="p-4 sm:p-6">
                  <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                    Time Progression (Last 20 Solves)
                  </h2>
                  {/* Chart colors come from the theme's oklch vars via
                      --color-*; hsl(var(--primary)) would be an invalid color. */}
                  <div className="h-64 w-full sm:h-80 lg:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis
                          dataKey="solve"
                          stroke="var(--color-muted-foreground)"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload[0]) {
                              return (
                                <div className="rounded-lg border bg-card p-2 shadow-lg">
                                  <p className="text-sm font-semibold">Solve #{payload[0].payload.solve}</p>
                                  <p className="text-sm text-muted-foreground">{formatTime(payload[0].payload.timeMs)}</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="time"
                          stroke="var(--color-primary)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-primary)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="distribution">
                <Card className="p-4 sm:p-6">
                  <h2 className="mb-4 text-lg font-semibold sm:text-xl">Time Distribution</h2>
                  <div className="h-64 w-full sm:h-80 lg:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timeRanges} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis
                          dataKey="range"
                          stroke="var(--color-muted-foreground)"
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={52}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          stroke="var(--color-muted-foreground)"
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload[0]) {
                              return (
                                <div className="rounded-lg border bg-card p-2 shadow-lg">
                                  <p className="text-sm font-semibold">{payload[0].payload.range}</p>
                                  <p className="text-sm text-muted-foreground">{payload[0].value} solves</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="count" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="averages">
                <Card className="p-4 sm:p-6">
                  <h2 className="mb-6 text-lg font-semibold sm:text-xl">Session Averages</h2>
                  <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
                    <div className="rounded-lg bg-secondary p-4 text-center sm:p-6">
                      <div className="mb-2 text-sm text-muted-foreground">Average of 5</div>
                      <div className="mb-1 font-mono text-3xl font-bold tabular-nums sm:text-4xl">
                        {ao5 > 0 ? formatTime(ao5) : "-"}
                      </div>
                      <p className="text-xs text-muted-foreground">Best recent average</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4 text-center sm:p-6">
                      <div className="mb-2 text-sm text-muted-foreground">Average of 12</div>
                      <div className="mb-1 font-mono text-3xl font-bold tabular-nums sm:text-4xl">
                        {ao12 > 0 ? formatTime(ao12) : "-"}
                      </div>
                      <p className="text-xs text-muted-foreground">Medium average</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4 text-center sm:p-6">
                      <div className="mb-2 text-sm text-muted-foreground">Average of 100</div>
                      <div className="mb-1 font-mono text-3xl font-bold tabular-nums sm:text-4xl">
                        {ao100 > 0 ? formatTime(ao100) : "-"}
                      </div>
                      <p className="text-xs text-muted-foreground">Session average</p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-4">
                      <span className="text-sm text-muted-foreground">Best Single</span>
                      <span className="font-mono font-semibold tabular-nums">{formatTime(bestTime)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-4">
                      <span className="text-sm text-muted-foreground">Worst Single</span>
                      <span className="font-mono font-semibold tabular-nums">{formatTime(worstTime)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-4">
                      <span className="text-sm text-muted-foreground">Total Solves</span>
                      <span className="font-mono font-semibold tabular-nums">{filteredSolves.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-4">
                      <span className="text-sm text-muted-foreground">Mean Time</span>
                      <span className="font-mono font-semibold tabular-nums">{formatTime(avgTime)}</span>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}
