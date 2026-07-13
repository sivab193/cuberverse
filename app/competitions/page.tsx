"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CalendarDays, ExternalLink, Loader2, MapPin, Search, Users } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import { fetchUserProfile, updateUserProfile } from "@/lib/user-profile"
import {
  countryFlag,
  eventName,
  fetchUpcomingCompetitions,
  fetchWcaCountries,
  registrationStatus,
  sortEventIds,
  type WcaCompetition,
  type WcaCountry,
} from "@/lib/wca"

const COUNTRY_STORAGE_KEY = "cuberverse.competitions.country"

function RegistrationBadge({ comp }: { comp: WcaCompetition }) {
  if (comp.cancelled_at) return <Badge variant="outline">Cancelled</Badge>
  switch (registrationStatus(comp)) {
    case "open":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Registration open</Badge>
    case "not_yet_open":
      return <Badge variant="secondary">Registration opens soon</Badge>
    case "closed":
      return <Badge variant="outline">Registration closed</Badge>
    default:
      return null
  }
}

function CompetitionCard({ comp }: { comp: WcaCompetition }) {
  const events = sortEventIds(comp.event_ids)
  const shown = events.slice(0, 8)
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 break-words text-base font-semibold sm:text-lg">
          {comp.short_display_name}
        </h3>
        <RegistrationBadge comp={comp} />
      </div>
      <div className="mb-3 space-y-1 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0" />
          {comp.date_range}
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">
            {comp.city} — {comp.venue.replace(/\[|\]|\(.*?\)/g, "")}
          </span>
        </p>
        {comp.competitor_limit && (
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" />
            {comp.competitor_limit} competitor limit
          </p>
        )}
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {shown.map((event) => (
          <Badge key={event} variant="outline" className="text-xs">
            {eventName(event)}
          </Badge>
        ))}
        {events.length > shown.length && (
          <Badge variant="outline" className="text-xs">
            +{events.length - shown.length} more
          </Badge>
        )}
      </div>
      <a href={comp.url} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm">
          <ExternalLink className="mr-2 h-4 w-4" />
          Details &amp; registration
        </Button>
      </a>
    </Card>
  )
}

export default function CompetitionsPage() {
  const [user] = useAuthState(auth)
  const [countries, setCountries] = useState<WcaCountry[]>([])
  const [country, setCountry] = useState<string>("")
  const [competitions, setCompetitions] = useState<WcaCompetition[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("")
  const requestSeq = useRef(0)

  useEffect(() => {
    fetchWcaCountries().then(setCountries).catch(() => setError("Couldn't load the country list from the WCA API."))
  }, [])

  // Initial country: linked WCA profile > saved choice > none.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (user) {
        try {
          const profile = await fetchUserProfile(user.uid)
          if (!cancelled && profile.countryIso2) {
            setCountry((current) => current || profile.countryIso2!)
            return
          }
        } catch {
          // fall through to local storage
        }
      }
      const saved = localStorage.getItem(COUNTRY_STORAGE_KEY)
      if (!cancelled && saved) setCountry((current) => current || saved)
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const loadPage = useCallback(
    async (iso2: string, pageNumber: number, append: boolean) => {
      const seq = ++requestSeq.current
      setLoading(true)
      setError(null)
      try {
        const result = await fetchUpcomingCompetitions(iso2, pageNumber)
        if (seq !== requestSeq.current) return
        setCompetitions((prev) => (append ? [...prev, ...result.competitions] : result.competitions))
        setHasMore(result.hasMore)
        setPage(pageNumber)
      } catch {
        if (seq === requestSeq.current) setError("Couldn't load competitions from the WCA API — try again in a moment.")
      } finally {
        if (seq === requestSeq.current) setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!country) return
    setCompetitions([])
    void loadPage(country, 1, false)
  }, [country, loadPage])

  const changeCountry = (iso2: string) => {
    setCountry(iso2)
    localStorage.setItem(COUNTRY_STORAGE_KEY, iso2)
    if (user) void updateUserProfile(user.uid, { countryIso2: iso2 }).catch(() => {})
  }

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    if (!needle) return competitions
    return competitions.filter(
      (comp) =>
        comp.name.toLowerCase().includes(needle) ||
        comp.city.toLowerCase().includes(needle) ||
        comp.venue.toLowerCase().includes(needle),
    )
  }, [competitions, filter])

  return (
    <div>
      <Navigation />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Competitions</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Upcoming WCA competitions near you — pick your country, then filter by city or state
            to find ones you can attend.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <Select value={country} onValueChange={changeCountry}>
            {/* SelectTrigger is w-fit by default — without w-full it collapses on mobile. */}
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Choose your country" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {countries.map((c) => (
                <SelectItem key={c.iso2} value={c.iso2}>
                  {countryFlag(c.iso2)} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name, city, or state…"
              className="pl-9"
              disabled={competitions.length === 0}
            />
          </div>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {error}
          </p>
        )}

        {!country && !error && (
          <Card className="p-8 text-center text-muted-foreground">
            Choose your country above to see upcoming competitions.
            {!user && " Sign in and link your WCA ID on the dashboard to set this automatically."}
          </Card>
        )}

        {country && !loading && !error && visible.length === 0 && competitions.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            No upcoming competitions announced in this country yet — check back later or try a
            neighboring country.
          </Card>
        )}

        {country && visible.length === 0 && competitions.length > 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            No competitions match “{filter}”.
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((comp) => (
            <CompetitionCard key={comp.id} comp={comp} />
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading competitions…
          </div>
        )}

        {!loading && hasMore && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => loadPage(country, page + 1, true)}>
              Load more
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
