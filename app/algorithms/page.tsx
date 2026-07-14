"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { algorithms, CUBE_TYPE_TO_PUZZLE, type Algorithm, type CubeType, type MethodType } from "@/lib/algorithms"
import { AlgorithmDetailDialog } from "@/components/algorithm-detail-dialog"
import { CaseDiagram } from "@/components/case-diagram"
import { cn } from "@/lib/utils"
import { Check, Copy, Play, Search, Sparkles, Star, X } from "lucide-react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

type Progress = "learning" | "learned"
type AlgoProgress = Record<string, Progress>
/** Signed-out users only ever see "all". */
type Lens = "all" | "favorites" | "learning" | "learned"

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

/**
 * Solve order, so sections read as a path through the solve rather than as
 * data order. The beginner last layer ("Third Layer") comes before 2-Look
 * OLL/PLL, which are the step up from it.
 */
const CATEGORY_ORDER = [
  "Cross",
  "Layer 1",
  "First Layer",
  "F2L",
  "Second Layer",
  "Third Layer",
  "2-Look OLL",
  "2-Look PLL",
  "Winter Variation",
  "OLL",
  "OH OLL",
  "CLL",
  "EG-1",
  "COLL",
  "PBL",
  "PLL",
  "OH PLL",
  "Last Layer",
  "OLL Parity",
  "PLL + Parity",
  "Tips",
]

/** Sort by a reference list, keeping anything unlisted at the end in its original order. */
function order<T>(values: T[], reference: T[]): T[] {
  const rank = (value: T) => {
    const index = reference.indexOf(value)
    return index === -1 ? reference.length : index
  }
  return [...values].sort((a, b) => rank(a) - rank(b))
}

const CUBE_LABEL = (cube: CubeType) => (cube === "pyraminx" ? "Pyraminx" : cube.toUpperCase())

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
  const [lens, setLens] = useState<Lens>("all")
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
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [selectedCube, selectedMethod, router])

  // Signing out must not strand you on an empty "my favorites" view.
  useEffect(() => {
    if (!user) setLens("all")
  }, [user])

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
    const next = new Set(favorites)
    if (next.has(algoId)) next.delete(algoId)
    else next.add(algoId)
    setFavorites(next) // optimistic — a failed write is logged, not blocking
    try {
      await setDoc(doc(db, "favorites", user.uid), { algoIds: Array.from(next) })
    } catch (error) {
      console.error("Error updating favorites:", error)
      setFavorites(favorites)
    }
  }

  /** none → learning → learned → none. Previously only settable on the dashboard. */
  const cycleProgress = async (algoId: string) => {
    if (!user) return
    const current = algoProgress[algoId]
    const next: AlgoProgress = { ...algoProgress }
    if (current === undefined) next[algoId] = "learning"
    else if (current === "learning") next[algoId] = "learned"
    else delete next[algoId]

    setAlgoProgress(next)
    try {
      await setDoc(doc(db, "algoProgress", user.uid), next)
    } catch (error) {
      console.error("Error updating algo progress:", error)
      setAlgoProgress(algoProgress)
    }
  }

  const inMethod = useMemo(
    () => algorithms.filter((a) => a.cubeType === selectedCube && a.method === selectedMethod),
    [selectedCube, selectedMethod],
  )

  const counts = useMemo(
    () => ({
      all: inMethod.length,
      favorites: inMethod.filter((a) => favorites.has(a.id)).length,
      learning: inMethod.filter((a) => algoProgress[a.id] === "learning").length,
      learned: inMethod.filter((a) => algoProgress[a.id] === "learned").length,
    }),
    [inMethod, favorites, algoProgress],
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return inMethod.filter((algo) => {
      if (lens === "favorites" && !favorites.has(algo.id)) return false
      if (lens === "learning" && algoProgress[algo.id] !== "learning") return false
      if (lens === "learned" && algoProgress[algo.id] !== "learned") return false
      if (!needle) return true
      return (
        algo.name.toLowerCase().includes(needle) ||
        algo.algorithm.toLowerCase().includes(needle) ||
        (algo.group ?? "").toLowerCase().includes(needle) ||
        algo.category.toLowerCase().includes(needle)
      )
    })
  }, [inMethod, search, lens, favorites, algoProgress])

  /** Category → group → algorithms. Categories follow solve order; groups keep dataset order. */
  const sections = useMemo(() => {
    const byCategory = new Map<string, Map<string, Algorithm[]>>()
    for (const algo of filtered) {
      const groups = byCategory.get(algo.category) ?? new Map<string, Algorithm[]>()
      const key = algo.group ?? ""
      groups.set(key, [...(groups.get(key) ?? []), algo])
      byCategory.set(algo.category, groups)
    }
    return order([...byCategory.keys()], CATEGORY_ORDER).map(
      (category) => [category, byCategory.get(category)!] as const,
    )
  }, [filtered])

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000)
  }

  const learnedPct = counts.all > 0 ? Math.round((counts.learned / counts.all) * 100) : 0

  const lenses: { key: Lens; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "favorites", label: "Favorites", count: counts.favorites },
    { key: "learning", label: "Learning", count: counts.learning },
    { key: "learned", label: "Learned", count: counts.learned },
  ]

  return (
    <div>
      <Navigation />

      {/* ---------- Header ---------- */}
      <header className="relative isolate overflow-hidden border-b border-border">
        <div className="bg-bloom absolute inset-0 -z-10" aria-hidden="true" />
        <div className="bg-grid absolute inset-0 -z-10 opacity-40" aria-hidden="true" />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Every case plays back in 3D
          </div>

          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Algorithm Library
          </h1>

          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {algorithms.length} algorithms across {cubeTypes.length} puzzles, each drawn as the case
            it solves. Algorithms courtesy of{" "}
            <a
              href="https://jperm.net"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline decoration-primary/50 underline-offset-4 transition-colors hover:decoration-primary"
            >
              J Perm
            </a>
            .
          </p>

          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-4">
            <Stat label="Algorithms" value={algorithms.length} />
            <Stat label="Puzzles" value={cubeTypes.length} />
            <Stat
              label={`${CUBE_LABEL(selectedCube)} · ${selectedMethod}`}
              value={counts.all}
              accent
            />
            {user && counts.all > 0 && (
              <Stat label="Learned" value={`${learnedPct}%`} accent />
            )}
          </dl>
        </div>
      </header>

      {/* ---------- Filters (sticky) ---------- */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            {/* Puzzle + method. Too many to fit a phone, so they scroll edge-to-edge. */}
            <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {cubeTypes.map((cube) => (
                <Chip
                  key={cube}
                  active={selectedCube === cube}
                  onClick={() => setSelectedCube(cube)}
                >
                  {CUBE_LABEL(cube)}
                </Chip>
              ))}
              <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
              {methods.map((method) => (
                <Chip
                  key={method}
                  active={selectedMethod === method}
                  variant="method"
                  onClick={() => setSelectedMethod(method)}
                >
                  {method}
                </Chip>
              ))}
            </div>

            <div className="relative shrink-0 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases or moves…"
                aria-label="Search algorithms"
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {user && (
            <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
              {lenses.map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLens(key)}
                  aria-pressed={lens === key}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    lens === key
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                  <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Results ---------- */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {sections.length > 0 ? (
          sections.map(([category, groups]) => {
            const total = [...groups.values()].reduce((n, list) => n + list.length, 0)
            return (
              <section key={category} className="mb-12 last:mb-0 sm:mb-16">
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{category}</h2>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {total}
                  </span>
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </div>

                {[...groups.entries()].map(([group, groupAlgos]) => (
                  <div key={group || "__ungrouped"} className="mb-8 last:mb-0">
                    {group && (
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group}
                      </h3>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {groupAlgos.map((algo) => (
                        <AlgorithmCard
                          key={algo.id}
                          algo={algo}
                          status={algoProgress[algo.id]}
                          favorite={favorites.has(algo.id)}
                          signedIn={Boolean(user)}
                          copied={copiedId === algo.id}
                          onOpen={() => setDetail(algo)}
                          onCopy={() => copyToClipboard(algo.algorithm, algo.id)}
                          onFavorite={() => toggleFavorite(algo.id)}
                          onCycleProgress={() => cycleProgress(algo.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )
          })
        ) : (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-base font-medium">No cases here</p>
            <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted-foreground">
              {search
                ? `Nothing matches "${search}" in ${CUBE_LABEL(selectedCube)} ${selectedMethod}.`
                : lens !== "all"
                  ? `You haven't marked any ${CUBE_LABEL(selectedCube)} ${selectedMethod} cases as ${lens}.`
                  : `No algorithms for ${CUBE_LABEL(selectedCube)} using the ${selectedMethod} method yet.`}
            </p>
            {(search || lens !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-5"
                onClick={() => {
                  setSearch("")
                  setLens("all")
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </main>

      <AlgorithmDetailDialog algorithm={detail} onOpenChange={(open) => !open && setDetail(null)} />
    </div>
  )
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div>
      <dd
        className={cn(
          "text-2xl font-bold tabular-nums sm:text-3xl",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </dd>
      <dt className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
    </div>
  )
}

function Chip({
  active,
  onClick,
  variant = "cube",
  children,
}: {
  active: boolean
  onClick: () => void
  variant?: "cube" | "method"
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? variant === "cube"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-accent/40 bg-accent/15 text-accent"
          : "border-border bg-card text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

const STATUS_STYLE: Record<Progress, string> = {
  learning: "border-chart-5/40 bg-chart-5/15 text-chart-5",
  learned: "border-success/40 bg-success/15 text-success",
}

interface AlgorithmCardProps {
  algo: Algorithm
  status?: Progress
  favorite: boolean
  signedIn: boolean
  copied: boolean
  onOpen: () => void
  onCopy: () => void
  onFavorite: () => void
  onCycleProgress: () => void
}

function AlgorithmCard({
  algo,
  status,
  favorite,
  signedIn,
  copied,
  onOpen,
  onCopy,
  onFavorite,
  onCycleProgress,
}: AlgorithmCardProps) {
  const moves = algo.algorithm.split(/\s+/).filter(Boolean).length

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors",
        status === "learned"
          ? "border-success/35 hover:border-success/60"
          : "border-border hover:border-primary/50",
      )}
    >
      {/* The diagram is the case, so it's also the way into the 3D player. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Watch ${algo.name} in 3D`}
        className="bg-case relative flex h-32 items-center justify-center border-b border-border/60 p-4 transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <CaseDiagram
          puzzle={CUBE_TYPE_TO_PUZZLE[algo.cubeType]}
          algorithm={algo.algorithm}
          category={algo.category}
          className="h-full w-full drop-shadow-md"
        />

        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/55 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg">
            <Play className="h-3 w-3 fill-current" />
            Watch in 3D
          </span>
        </span>

        {status && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
              STATUS_STYLE[status],
            )}
          >
            {status}
          </span>
        )}

        {signedIn && (
          <span
            role="button"
            tabIndex={0}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorite}
            onClick={(e) => {
              e.stopPropagation()
              onFavorite()
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return
              e.preventDefault()
              e.stopPropagation()
              onFavorite()
            }}
            className={cn(
              "absolute right-2 top-2 z-10 cursor-pointer rounded-md p-1.5 transition-colors hover:bg-secondary",
              favorite
                ? "text-chart-5"
                : "text-muted-foreground opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
            )}
          >
            <Star className={cn("h-4 w-4", favorite && "fill-current")} />
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h4 className="min-w-0 truncate font-semibold" title={algo.name}>
            {algo.name}
          </h4>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {moves} {moves === 1 ? "move" : "moves"}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="mb-3 block w-full break-words rounded-lg bg-secondary/70 p-2.5 text-left font-mono text-[13px] leading-relaxed transition-colors hover:bg-secondary"
        >
          {algo.algorithm}
        </button>

        {(algo.probability || algo.alternatives?.length) && (
          <p className="mb-3 text-xs text-muted-foreground">
            {[
              algo.probability && `Odds ${algo.probability}`,
              algo.alternatives?.length &&
                `${algo.alternatives.length} alt${algo.alternatives.length > 1 ? "s" : ""}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          {signedIn ? (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onCycleProgress}
              title="Cycle: not started → learning → learned"
            >
              {status === "learned" ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-success" />
                  Learned
                </>
              ) : status === "learning" ? (
                "Learning"
              ) : (
                "Mark as learning"
              )}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1" onClick={onOpen}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Watch in 3D
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onCopy}
            aria-label={`Copy ${algo.name}`}
            title="Copy algorithm"
            className="shrink-0"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </article>
  )
}

export default function AlgorithmsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <Navigation />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
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
