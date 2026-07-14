import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Timer, BookOpen, TrendingUp, Zap, ScanLine, Trophy, ArrowRight } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { algorithms } from "@/lib/algorithms"

const FEATURES = [
  {
    icon: ScanLine,
    tint: "text-primary",
    title: "Scan & Solve",
    body: (
      <>
        Show your scrambled cube to the camera and watch a shortest-path solution play out on a 3D
        puzzle.{" "}
        <Link href="/solve" className="text-primary underline-offset-4 hover:underline">
          Try it
        </Link>
      </>
    ),
  },
  {
    icon: Timer,
    tint: "text-primary",
    title: "Smart Timer",
    body: "Hold-to-start timer with WCA scrambles, inspection, and Ao5 / Ao12 session stats for every solve.",
  },
  {
    icon: BookOpen,
    tint: "text-accent",
    title: "Algorithm Library",
    body: (
      <>
        Every case drawn as the state it solves, and playable in 3D — 3x3, 2x2, 4x4 and Pyraminx.{" "}
        <Link href="/algorithms" className="text-primary underline-offset-4 hover:underline">
          Browse
        </Link>
      </>
    ),
  },
  {
    icon: TrendingUp,
    tint: "text-chart-3",
    title: "Progress Tracking",
    body: "Mark cases as learning or learned, and watch your times bend downward on the stats page.",
  },
  {
    icon: Zap,
    tint: "text-chart-5",
    title: "Multiple Methods",
    body: "From beginner layer-by-layer to CFOP, one-handed, Ortega, CLL and EG-1. Pick your path.",
  },
  {
    icon: Trophy,
    tint: "text-chart-2",
    title: "WCA Integration",
    body: (
      <>
        Link your WCA account for official records, and find{" "}
        <Link href="/competitions" className="text-primary underline-offset-4 hover:underline">
          competitions near you
        </Link>
        .
      </>
    ),
  },
]

export default function HomePage() {
  const algorithmCount = algorithms.length
  const cubeTypeCount = new Set(algorithms.map((algo) => algo.cubeType)).size
  const methodCount = new Set(algorithms.map((algo) => algo.method)).size

  return (
    <div>
      <Navigation />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden border-b border-border">
        <div className="bg-bloom absolute inset-0 -z-10" aria-hidden="true" />
        <div className="bg-grid absolute inset-0 -z-10 opacity-40" aria-hidden="true" />

        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Master the cube.
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Track your progress.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            Your complete speed cubing companion. Learn algorithms, scan and solve a real cube,
            practice with the timer, and watch your times fall.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/timer">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                <Timer className="h-5 w-5" />
                Start Timer
              </Button>
            </Link>
            <Link href="/algorithms">
              <Button size="lg" variant="outline" className="w-full gap-2 bg-card/50 sm:w-auto">
                <BookOpen className="h-5 w-5" />
                Browse Algorithms
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4 sm:mt-20 sm:gap-8">
            {[
              { value: algorithmCount, label: "Algorithms", tint: "text-primary" },
              { value: cubeTypeCount, label: "Puzzles", tint: "text-accent" },
              { value: methodCount, label: "Methods", tint: "text-chart-3" },
            ].map(({ value, label, tint }) => (
              <div key={label}>
                <dd className={`text-3xl font-bold tabular-nums sm:text-5xl ${tint}`}>{value}</dd>
                <dt className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm sm:normal-case sm:tracking-normal">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, tint, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
                <Icon className={`h-5 w-5 ${tint}`} />
              </div>
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
