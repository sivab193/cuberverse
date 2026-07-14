import Image from "next/image"
import Link from "next/link"
import { Box, ExternalLink, MapPin, Trophy } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { DetailList, type DetailListItem } from "@/components/detail-list"
import {
  OWNER_WCA_ID,
  countryFlag,
  eventName,
  fetchWcaPersonCompetitionsIsr,
  fetchWcaPersonIsr,
  formatWcaResult,
  sortEventIds,
  type WcaCompetition,
  type WcaPersonInfo,
} from "@/lib/wca"

/** Records only change when a competition happens; an hour is plenty. */
export const revalidate = 3600

const WCA_PROFILE_URL = `https://www.worldcubeassociation.org/persons/${OWNER_WCA_ID}`

export const metadata = {
  title: "WCA Profile",
  description:
    "My official World Cube Association record, live from the WCA API: every competition, every personal best, and zero medals.",
}

/** The WCA API being down must not take the page down with it. */
async function load(): Promise<{ info: WcaPersonInfo | null; comps: WcaCompetition[] }> {
  const [info, comps] = await Promise.all([
    fetchWcaPersonIsr(OWNER_WCA_ID).catch(() => null),
    fetchWcaPersonCompetitionsIsr(OWNER_WCA_ID).catch(() => [] as WcaCompetition[]),
  ])
  return { info, comps }
}

const monthYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })

export default async function WcaPage() {
  const { info, comps } = await load()

  const recordItems: DetailListItem[] = info
    ? sortEventIds(Object.keys(info.personal_records)).map((event) => {
        const pr = info.personal_records[event]
        const single = pr.single ? formatWcaResult(event, pr.single.best, "single") : "—"
        const average = pr.average ? formatWcaResult(event, pr.average.best, "average") : "—"
        return {
          id: event,
          icon: Box,
          title: <span className="font-medium">{eventName(event)}</span>,
          note: [
            pr.single?.country_rank && `NR ${pr.single.country_rank.toLocaleString()} single`,
            pr.average?.country_rank && `NR ${pr.average.country_rank.toLocaleString()} average`,
          ]
            .filter(Boolean)
            .join(" · "),
          meta: (
            <span className="font-mono">
              <span className="text-foreground">{single}</span>
              <span className="mx-1.5 opacity-40">/</span>
              {average}
            </span>
          ),
        }
      })
    : []

  const compItems: DetailListItem[] = comps.map((comp) => ({
    id: comp.id,
    icon: MapPin,
    href: comp.url,
    title: comp.name,
    note: `${comp.city} ${countryFlag(comp.country_iso2)}`,
    meta: monthYear(comp.start_date),
  }))

  return (
    <div>
      <Navigation />

      <header className="relative isolate overflow-hidden border-b border-border">
        <div className="bg-bloom absolute inset-0 -z-10" aria-hidden="true" />
        <div className="bg-grid absolute inset-0 -z-10 opacity-40" aria-hidden="true" />

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          {info ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
              {info.person.avatar && !info.person.avatar.is_default ? (
                <Image
                  src={info.person.avatar.url}
                  alt=""
                  width={96}
                  height={96}
                  unoptimized
                  className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-border sm:h-24 sm:w-24"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl sm:h-24 sm:w-24">
                  {countryFlag(info.person.country_iso2)}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                  {info.person.name}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span className="font-mono">{info.person.wca_id}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {countryFlag(info.person.country_iso2)} {info.person.country_iso2}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Competing since 2017</span>
                </p>
                <a
                  href={WCA_PROFILE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Official WCA page
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">WCA Profile</h1>
              <p className="mt-3 text-muted-foreground">
                Couldn&apos;t reach the WCA API just now.{" "}
                <a
                  href={WCA_PROFILE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  View the profile on worldcubeassociation.org
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </header>

      {info && (
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <Stat value={info.competition_count} label="Competitions" tint="text-primary" />
              <Stat
                value={Object.keys(info.personal_records).length}
                label="Events"
                tint="text-accent"
              />
              <Stat
                value={
                  info.personal_records["333"]?.single
                    ? formatWcaResult("333", info.personal_records["333"].single.best, "single")
                    : "—"
                }
                label="3x3 best"
                tint="text-chart-3"
              />
              <Stat value={info.medals.total} label="Medals" tint="text-muted-foreground" />
            </dl>

            {/* The medal count is zero, and that is the whole point — say it out
                loud rather than quietly hiding an empty row. */}
            {info.medals.total === 0 && (
              <p className="mt-6 flex items-start gap-2.5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
                <Trophy className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  No medals, and that was never the plan. I compete because it&apos;s a reason to
                  travel and to sit in a room full of people who care about the same strange thing.{" "}
                  <Link href="/about" className="text-foreground underline-offset-4 hover:underline">
                    The longer version
                  </Link>
                  .
                </span>
              </p>
            )}
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Personal records</h2>
            <p className="mb-5 mt-2 text-sm text-muted-foreground">
              Single / average, with my national ranking in India. Live from the public WCA API.
            </p>
            <DetailList
              label={`Personal bests · ${OWNER_WCA_ID}`}
              action={{ label: "On the WCA", href: WCA_PROFILE_URL }}
              items={recordItems}
            />
          </section>

          {compItems.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Every competition I&apos;ve entered
              </h2>
              <p className="mb-5 mt-2 text-sm text-muted-foreground">
                Tamil Nadu to Illinois and back. None of them won; all of them worth the trip.
              </p>
              <DetailList label="Competitions · oldest first" items={compItems} />
            </section>
          )}
        </main>
      )}
    </div>
  )
}

function Stat({
  value,
  label,
  tint,
}: {
  value: string | number
  label: string
  tint: string
}) {
  return (
    <div>
      <dd className={`text-3xl font-bold tabular-nums sm:text-4xl ${tint}`}>{value}</dd>
      <dt className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</dt>
    </div>
  )
}
