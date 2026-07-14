import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { algorithms } from "@/lib/algorithms"
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Presentation,
} from "lucide-react"

/**
 * Public link to the real Drive folder, or "" to hide the link entirely.
 *
 * Deliberately a link and not an iframe: Drive's embeddedfolderview endpoint
 * is undocumented and has silently started rendering blank before, and it
 * would drop Google's chrome into the middle of the page.
 */
const DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/0B3LEx1FbxlAmZ01PQm9YSkZjbHM?resourcekey=0-EfI_49dbt65TaxYl4VFDeQ&usp=sharing"

/**
 * The origin story. The file list below is real — these are the decks and
 * handouts actually used to teach, still sitting in a Drive folder called
 * "Rubik's Old Stuff", oldest first.
 */
const OLD_FILES = [
  { name: "Moves.png", date: "Dec 2012", icon: ImageIcon, note: "The first one. Just the notation." },
  { name: "Professional.pdf", date: "Feb 2014", icon: FileText },
  { name: "ADVANCED.ppt", date: "Feb 2014", icon: Presentation },
  { name: "GEOGMAP.pdf", date: "Mar 2014", icon: FileText },
  {
    name: "3x3 Cube Solution.pptx",
    date: "Nov 2018",
    icon: Presentation,
    note: "Six years of edits later, still the one I sent people.",
  },
]

export const metadata = {
  title: "About — CuberVerse",
  description:
    "CuberVerse started in 2012 with a PNG of the moves, and 60+ people taught one deck at a time.",
}

export default function AboutPage() {
  return (
    <div>
      <Navigation />

      {/* ---------- Hero ---------- */}
      <header className="relative isolate overflow-hidden border-b border-border">
        <div className="bg-bloom absolute inset-0 -z-10" aria-hidden="true" />
        <div className="bg-grid absolute inset-0 -z-10 opacity-40" aria-hidden="true" />

        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Teaching this since 2012
          </div>

          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            It started with a PNG of the moves.
          </h1>

          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            CuberVerse isn&apos;t a project I started last month. It&apos;s the thing I&apos;ve
            been building, in one form or another, since I was a kid with a cube and a slide deck.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        {/* ---------- Story ---------- */}
        <div className="space-y-6 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>
            In December 2012 I saved a file called{" "}
            <span className="font-mono text-sm text-foreground">Moves.png</span> — a picture of the
            notation, because I kept forgetting which way <span className="font-mono">R&apos;</span>{" "}
            went. That file still exists. It&apos;s the oldest thing in a Google Drive folder
            I&apos;ve never renamed from &ldquo;Rubik&apos;s Old Stuff&rdquo;.
          </p>
          <p>
            Once I could solve it, people asked me to teach them. So I made a deck. Then a better
            deck. Then a PDF, because not everyone could open a{" "}
            <span className="font-mono text-sm text-foreground">.ppt</span>. I&apos;d sit next to
            someone, hand them a cube, and walk them through it — cross, corners, middle layer,
            last layer — and then send them the file so they had something to go back to when they
            inevitably got stuck on step four.
          </p>
          <p className="text-foreground">
            I&apos;ve taught at least{" "}
            <strong className="font-semibold">60 people</strong>
            {" to solve a Rubik’s Cube that way. One at a time, from a slide deck, over more than a decade."}
          </p>
          <p>
            CuberVerse is that deck, finally built properly. Every algorithm is drawn as the case it
            actually solves and plays back on a 3D cube, so nobody has to squint at a diagram and
            guess. It&apos;s the thing I wish I could have sent people in 2012.
          </p>
        </div>

        {/* ---------- Stats ---------- */}
        <dl className="mt-14 grid grid-cols-3 gap-4 rounded-xl border border-border bg-card p-6 sm:gap-6 sm:p-8">
          {[
            { value: "2012", label: "Where it started", tint: "text-primary" },
            { value: "60+", label: "People taught", tint: "text-accent" },
            { value: `${algorithms.length}`, label: "Algorithms now", tint: "text-chart-3" },
          ].map(({ value, label, tint }) => (
            <div key={label}>
              <dd className={`text-2xl font-bold tabular-nums sm:text-4xl ${tint}`}>{value}</dd>
              <dt className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</dt>
            </div>
          ))}
        </dl>

        {/* ---------- The old files ---------- */}
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">The originals</h2>
          <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
            Still sitting in Drive, untouched. Every one of these taught somebody to solve a cube.
          </p>

          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <p className="truncate font-mono text-xs text-muted-foreground">
                My Drive / Rubik&apos;s Old Stuff
              </p>
              {DRIVE_FOLDER_URL && (
                <a
                  href={DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Open the folder
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <ul className="divide-y divide-border">
              {OLD_FILES.map(({ name, date, icon: Icon, note }) => (
                <li
                  key={name}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40 sm:gap-4 sm:px-5"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm text-foreground">{name}</p>
                    {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
                  </div>
                  <p className="shrink-0 text-xs tabular-nums text-muted-foreground">{date}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="mt-14 rounded-xl border border-border bg-card p-6 text-center sm:mt-16 sm:p-10">
          <h2 className="text-balance text-xl font-bold tracking-tight sm:text-2xl">
            Person number sixty-one?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            The beginner method is the same one I&apos;ve taught for a decade — cross, corners,
            middle layer, last layer. Except now every step shows you the exact case you&apos;re
            looking at, and plays it out in 3D.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/algorithms?cube=3x3&method=Beginners">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                <BookOpen className="h-5 w-5" />
                Learn to solve it
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
