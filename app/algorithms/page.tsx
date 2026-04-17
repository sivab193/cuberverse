"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { algorithms, type CubeType, type MethodType } from "@/lib/algorithms"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Star, StarOff } from "lucide-react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { CubeVisualization } from "@/components/cube-visualization"

interface AlgoProgress {
  [algoId: string]: "learning" | "learned"
}

function AlgorithmsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const defaultCube = (searchParams.get("cube") as CubeType) || "3x3"
  const defaultMethod = (searchParams.get("method") as MethodType) || "Beginners"

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedCube, setSelectedCube] = useState<CubeType>(defaultCube)
  const [selectedMethod, setSelectedMethod] = useState<MethodType>(defaultMethod)
  const [user] = useAuthState(auth)
  const [algoProgress, setAlgoProgress] = useState<AlgoProgress>({})
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Update URL when cube or method changes
  useEffect(() => {
    const params = new URLSearchParams()
    params.set("cube", selectedCube)
    params.set("method", selectedMethod)
    router.replace(`?${params.toString()}`)
  }, [selectedCube, selectedMethod, router])

  useEffect(() => {
    if (user) {
      fetchAlgoProgress()
      fetchFavorites()
    }
  }, [user])

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

  const fetchFavorites = async () => {
    if (!user) return

    try {
      const docRef = doc(db, "favorites", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setFavorites(new Set(docSnap.data().algoIds || []))
      }
    } catch (error) {
      console.error("Error fetching favorites:", error)
    }
  }

  const toggleFavorite = async (algoId: string) => {
    if (!user) return

    const newFavorites = new Set(favorites)
    if (newFavorites.has(algoId)) {
      newFavorites.delete(algoId)
    } else {
      newFavorites.add(algoId)
    }

    try {
      await setDoc(doc(db, "favorites", user.uid), { algoIds: Array.from(newFavorites) })
      setFavorites(newFavorites)
    } catch (error) {
      console.error("Error updating favorites:", error)
    }
  }

  const cubeTypes = Array.from(new Set(algorithms.map(a => a.cubeType))) as CubeType[]
  const methods = Array.from(new Set(algorithms.map(a => a.method))) as MethodType[]

  const filteredAlgorithms = algorithms.filter(
    (algo) => algo.cubeType === selectedCube && algo.method === selectedMethod,
  )

  const categories = Array.from(new Set(filteredAlgorithms.map((algo) => algo.category)))

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12">
          <h1 className="mb-4 text-balance text-4xl font-bold">Algorithm Library</h1>
          <p className="text-pretty text-lg text-muted-foreground">
            Browse our comprehensive collection of algorithms for speed cubing.
          </p>
        </div>

        {/* Cube Type Selection */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cube Type</h2>
          <div className="flex flex-wrap gap-2">
            {cubeTypes.map((cube) => (
              <Button
                key={cube}
                variant={selectedCube === cube ? "default" : "outline"}
                onClick={() => setSelectedCube(cube)}
              >
                {cube.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Method Selection */}
        <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as MethodType)} className="mb-8">
          <TabsList>
            {methods.map((method) => (
              <TabsTrigger key={method} value={method}>
                {method}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Algorithms by Category */}
        {categories.length > 0 ? (
          categories.map((category) => {
            const categoryAlgos = filteredAlgorithms.filter((algo) => algo.category === category)

            return (
              <div key={category} className="mb-12">
                <h2 className="mb-4 text-2xl font-bold">{category}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {categoryAlgos.map((algo) => (
                    <Card key={algo.id} className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{algo.name}</h3>
                            {algoProgress[algo.id] === "learned" && (
                              <Badge variant="default" className="bg-green-500 text-xs">
                                Learned
                              </Badge>
                            )}
                            {algoProgress[algo.id] === "learning" && (
                              <Badge variant="secondary" className="text-xs">
                                Learning
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{algo.cubeType}</Badge>
                            <Badge variant="outline">{algo.method}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {user && (
                            <Button size="sm" variant="ghost" onClick={() => toggleFavorite(algo.id)}>
                              {favorites.has(algo.id) ? (
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              ) : (
                                <StarOff className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(algo.algorithm, algo.id)}>
                            {copiedId === algo.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {algo.cubeType === "3x3" && <CubeVisualization algorithm={algo.algorithm} />}

                      <div className="mb-3 rounded-lg bg-secondary p-4 font-mono text-sm">{algo.algorithm}</div>

                      <p className="text-sm text-muted-foreground">{algo.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No algorithms available for {selectedCube} using {selectedMethod} method yet.
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}

export default function AlgorithmsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen"><Navigation /><main className="mx-auto max-w-7xl px-6 py-12"><div className="mb-12"><h1 className="mb-4 text-balance text-4xl font-bold">Algorithm Library</h1><p className="text-pretty text-lg text-muted-foreground">Loading algorithms...</p></div></main></div>}>
      <AlgorithmsContent />
    </Suspense>
  )
}
