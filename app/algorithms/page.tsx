"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { algorithms, type Algorithm, type CubeType, type MethodType } from "@/lib/algorithms"
import { AlgorithmDetailDialog } from "@/components/algorithm-detail-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Search, Star, StarOff, Play } from "lucide-react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

interface AlgoProgress {
  [algoId: string]: "learning" | "learned"
}

const CUBE_ORDER: CubeType[] = ["3x3", "2x2", "4x4", "5x5", "6x6", "7x7", "pyraminx"]
const METHOD_ORDER: MethodType[] = [
  "Beginners",
  "CFOP",
  "OH",
  "Ortega",
  "CLL",
  "EG-1",
  "Reduction",
  "L4E",
]

function order<T>(values: T[], reference: T[]): T[] {
  return [...values].sort((a, b) => reference.indexOf(a) - reference.indexOf(b))
}

function AlgorithmsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedCube, setSelectedCube] = useState<CubeType>(
    (searchParams.get("cube") as CubeType) || "3x3",
  )
  const [selectedMethod, setSelectedMethod] = useState<MethodType>(
    (searchParams.get("method") as MethodType) || "CFOP",
  )
  const [search, setSearch] = useState("")
  const [detail, setDetail] = useState<Algorithm | null>(null)
  const [user] = useAuthState(auth)
  const [algoProgress, setAlgoProgress] = useState<AlgoProgress>({})
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const cubeTypes = useMemo(
    () => order(Array.from(new Set(algorithms.map((a) => a.cubeType))), CUBE_ORDER),
    [],
  )

  // Methods available for the selected cube (a 2x2 has no CFOP, etc.).
  const methods = useMemo(
    () =>
      order(
        Array.from(
          new Set(algorithms.filter((a) => a.cubeType === selectedCube).map((a) => a.method)),
        ),
        METHOD_ORDER,
      ),
    [selectedCube],
  )

  // Keep the method valid when the cube changes.
  useEffect(() => {
    if (methods.length > 0 && !methods.includes(selectedMethod)) {
      setSelectedMethod(methods[0])
    }
  }, [methods, selectedMethod])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set("cube", selectedCube)
    params.set("method", selectedMethod)
    router.replace(`?${params.toString()}`)
  }, [selectedCube, selectedMethod, router])

  const fetchAlgoProgress = useCallback(async () => {
    if (!user) return
    try {
      const docSnap = await getDoc(doc(db, "algoProgress", user.uid))
      if (docSnap.exists()) setAlgoProgress(docSnap.data() as AlgoProgress)
    } catch (error) {
      console.error("Error fetching algo progress:", error)
    }
  }, [user])

  const fetchFavorites = useCallback(async () => {
    if (!user) return
    try {
      const docSnap = await getDoc(doc(db, "favorites", user.uid))
      if (docSnap.exists()) setFavorites(new Set(docSnap.data().algoIds || []))
    } catch (error) {
      console.error("Error fetching favorites:", error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchAlgoProgress()
      fetchFavorites()
    }
  }, [user, fetchAlgoProgress, fetchFavorites])

  const toggleFavorite = async (algoId: string) => {
    if (!user) return
    const newFavorites = new Set(favorites)
    if (newFavorites.has(algoId)) newFavorites.delete(algoId)
    else newFavorites.add(algoId)
    try {
      await setDoc(doc(db, "favorites", user.uid), { algoIds: Array.from(newFavorites) })
      setFavorites(newFavorites)
    } catch (error) {
      console.error("Error updating favorites:", error)
    }
  }

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return algorithms.filter((algo) => {
      if (algo.cubeType !== selectedCube || algo.method !== selectedMethod) return false
      if (!needle) return true
      return (
        algo.name.toLowerCase().includes(needle) ||
        algo.algorithm.toLowerCase().includes(needle) ||
        (algo.group ?? "").toLowerCase().includes(needle) ||
        algo.category.toLowerCase().includes(needle)
      )
    })
  }, [selectedCube, selectedMethod, search])

  /** Category -> group -> algorithms, preserving dataset order. */
  const sections = useMemo(() => {
    const byCategory = new Map<string, Map<string, Algorithm[]>>()
    for (const algo of filtered) {
      const groups = byCategory.get(algo.category) ?? new Map<string, Algorithm[]>()
      const key = algo.group ?? ""
      const list = groups.get(key) ?? []
      list.push(algo)
      groups.set(key, list)
      byCategory.set(algo.category, groups)
    }
    return byCategory
  }, [filtered])

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="mb-3 text-balance text-4xl font-bold">Algorithm Library</h1>
          <p className="text-pretty text-lg text-muted-foreground">
            {algorithms.length} algorithms across {cubeTypes.length} puzzles — every case plays
            back on a 3D puzzle. Algorithms courtesy of{" "}
            <a
              href="https://jperm.net"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              J Perm
            </a>
            .
          </p>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Puzzle
          </h2>
          <div className="flex flex-wrap gap-2">
            {cubeTypes.map((cube) => (
              <Button
                key={cube}
                variant={selectedCube === cube ? "default" : "outline"}
                onClick={() => setSelectedCube(cube)}
              >
                {cube === "pyraminx" ? "Pyraminx" : cube.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={selectedMethod}
            onValueChange={(value) => setSelectedMethod(value as MethodType)}
          >
            <TabsList>
              {methods.map((method) => (
                <TabsTrigger key={method} value={method}>
                  {method}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative lg:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cases or moves…"
              className="pl-9"
            />
          </div>
        </div>

        {sections.size > 0 ? (
          [...sections.entries()].map(([category, groups]) => (
            <section key={category} className="mb-12">
              <h2 className="mb-4 text-2xl font-bold">
                {category}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  ({[...groups.values()].reduce((n, list) => n + list.length, 0)})
                </span>
              </h2>

              {[...groups.entries()].map(([group, groupAlgos]) => (
                <div key={group || "__ungrouped"} className="mb-6">
                  {group && (
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {group}
                    </h3>
                  )}
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {groupAlgos.map((algo) => (
                      <Card key={algo.id} className="flex flex-col p-5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                              <h4 className="font-semibold">{algo.name}</h4>
                              {algoProgress[algo.id] === "learned" && (
                                <Badge className="bg-green-600 text-xs text-white">Learned</Badge>
                              )}
                              {algoProgress[algo.id] === "learning" && (
                                <Badge variant="secondary" className="text-xs">
                                  Learning
                                </Badge>
                              )}
                            </div>
                            {algo.probability && (
                              <p className="text-xs text-muted-foreground">
                                Odds {algo.probability}
                                {algo.alternatives?.length
                                  ? ` · ${algo.alternatives.length} alt${algo.alternatives.length > 1 ? "s" : ""}`
                                  : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            {user && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Favorite"
                                onClick={() => toggleFavorite(algo.id)}
                              >
                                {favorites.has(algo.id) ? (
                                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                ) : (
                                  <StarOff className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Copy algorithm"
                              onClick={() => copyToClipboard(algo.algorithm, algo.id)}
                            >
                              {copiedId === algo.id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <button
                          onClick={() => setDetail(algo)}
                          className="mb-3 block w-full rounded-lg bg-secondary p-3 text-left font-mono text-sm transition-colors hover:bg-secondary/70"
                          title="Watch this case in 3D"
                        >
                          {algo.algorithm}
                        </button>

                        <p className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground">
                          {algo.description}
                        </p>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => setDetail(algo)}
                        >
                          <Play className="mr-2 h-3.5 w-3.5" />
                          Watch in 3D
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {search
                ? `No algorithms match "${search}".`
                : `No algorithms for ${selectedCube} using the ${selectedMethod} method yet.`}
            </p>
          </Card>
        )}
      </main>

      <AlgorithmDetailDialog algorithm={detail} onOpenChange={(open) => !open && setDetail(null)} />
    </div>
  )
}

export default function AlgorithmsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <Navigation />
          <main className="mx-auto max-w-7xl px-6 py-12">
            <h1 className="mb-4 text-balance text-4xl font-bold">Algorithm Library</h1>
            <p className="text-pretty text-lg text-muted-foreground">Loading algorithms…</p>
          </main>
        </div>
      }
    >
      <AlgorithmsContent />
    </Suspense>
  )
}
