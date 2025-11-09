import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Timer, BookOpen, TrendingUp, Zap } from "lucide-react"
import { Navigation } from "@/components/navigation"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* Hero Section */}
        <div className="mb-24 text-center">
          <h1 className="mb-6 text-balance text-6xl font-bold leading-tight">
            Master the Cube.
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Track Your Progress.
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
            Your complete speed cubing companion. Learn algorithms, practice with our timer, and track your improvement
            over time.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/timer">
              <Button size="lg" className="gap-2">
                <Timer className="h-5 w-5" />
                Start Timer
              </Button>
            </Link>
            <Link href="/algorithms">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                <BookOpen className="h-5 w-5" />
                Browse Algorithms
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Timer className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Smart Timer</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional timer with scrambles and detailed statistics for every solve.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <BookOpen className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Algorithm Library</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Comprehensive collection of algorithms for multiple cubes and methods.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
              <TrendingUp className="h-6 w-6 text-chart-3" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Progress Tracking</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track which algorithms you've mastered and monitor your improvement.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-chart-5/10">
              <Zap className="h-6 w-6 text-chart-5" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Multiple Methods</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CFOP, Roux, ZZ, and more. Find the method that works best for you.
            </p>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-5xl font-bold text-primary">50+</div>
            <p className="text-muted-foreground">Algorithms Available</p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-5xl font-bold text-accent">6</div>
            <p className="text-muted-foreground">Cube Types Supported</p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-5xl font-bold text-chart-3">5</div>
            <p className="text-muted-foreground">Solving Methods</p>
          </div>
        </div>
      </main>
    </div>
  )
}
