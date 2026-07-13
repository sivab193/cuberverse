/**
 * Client for the public WCA (World Cube Association) REST API.
 *
 * The API allows cross-origin requests (`access-control-allow-origin: *`),
 * so everything here runs in the browser — no server proxy, no credentials.
 * Users link their account by WCA ID (e.g. 2009ZEMD01); all data shown is
 * public, exactly what appears on their worldcubeassociation.org profile.
 */

const WCA_API = "https://www.worldcubeassociation.org/api/v0"

export const WCA_ID_PATTERN = /^\d{4}[A-Z]{4}\d{2}$/

export function isValidWcaId(id: string): boolean {
  return WCA_ID_PATTERN.test(id)
}

// ---- types (subset of the API payloads we use) ------------------------------

export interface WcaAvatar {
  url: string
  thumb_url: string
  is_default: boolean
}

export interface WcaPerson {
  name: string
  wca_id: string
  gender: string
  url: string
  country_iso2: string
  avatar: WcaAvatar | null
}

export interface WcaRankedResult {
  best: number
  world_rank: number
  continent_rank: number
  country_rank: number
}

export interface WcaPersonalRecord {
  single?: WcaRankedResult
  average?: WcaRankedResult
}

export interface WcaMedals {
  gold: number
  silver: number
  bronze: number
  total: number
}

export interface WcaPersonInfo {
  person: WcaPerson
  competition_count: number
  personal_records: Record<string, WcaPersonalRecord>
  medals: WcaMedals
}

export interface WcaCompetition {
  id: string
  name: string
  short_display_name: string
  start_date: string
  end_date: string
  date_range: string
  registration_open: string | null
  registration_close: string | null
  cancelled_at: string | null
  competitor_limit: number | null
  venue: string
  city: string
  country_iso2: string
  url: string
  event_ids: string[]
}

export interface WcaCountry {
  id: string
  name: string
  iso2: string
  continent_id: string
}

// ---- event metadata ----------------------------------------------------------

/** Official (and legacy) WCA event names in customary display order. */
export const WCA_EVENT_NAMES: Record<string, string> = {
  "333": "3x3",
  "222": "2x2",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  "333bf": "3x3 Blindfolded",
  "333fm": "Fewest Moves",
  "333oh": "3x3 One-Handed",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  "444bf": "4x4 Blindfolded",
  "555bf": "5x5 Blindfolded",
  "333mbf": "3x3 Multi-Blind",
  // Retired events that still appear in old personal records.
  "333ft": "3x3 With Feet",
  magic: "Magic",
  mmagic: "Master Magic",
  "333mbo": "3x3 Multi-Blind (old)",
}

// Explicit array: Object.keys would reorder the integer-like ids numerically.
const EVENT_ORDER = [
  "333", "222", "444", "555", "666", "777",
  "333bf", "333fm", "333oh",
  "clock", "minx", "pyram", "skewb", "sq1",
  "444bf", "555bf", "333mbf",
  "333ft", "magic", "mmagic", "333mbo",
]

export function eventName(eventId: string): string {
  return WCA_EVENT_NAMES[eventId] ?? eventId
}

export function sortEventIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const ia = EVENT_ORDER.indexOf(a)
    const ib = EVENT_ORDER.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })
}

// ---- result formatting ---------------------------------------------------------

function formatCentiseconds(centi: number): string {
  const minutes = Math.floor(centi / 6000)
  const seconds = Math.floor((centi % 6000) / 100)
  const hundredths = centi % 100
  const frac = hundredths.toString().padStart(2, "0")
  if (minutes === 0) return `${seconds}.${frac}`
  const hours = Math.floor(minutes / 60)
  const mm = minutes % 60
  if (hours === 0) return `${mm}:${seconds.toString().padStart(2, "0")}.${frac}`
  return `${hours}:${mm.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${frac}`
}

/**
 * Render a raw WCA result value for an event.
 *
 * Values are centiseconds for timed events; moves for FMC singles (and
 * moves x100 for FMC averages); and an encoded DDTTTTTMM for multi-blind
 * (DD = 99 - points, TTTTT = seconds, MM = missed cubes).
 */
export function formatWcaResult(eventId: string, value: number, kind: "single" | "average"): string {
  if (value === -1) return "DNF"
  if (value === -2) return "DNS"
  if (value <= 0) return "—"

  if (eventId === "333fm") {
    return kind === "single" ? String(value) : (value / 100).toFixed(2)
  }
  if (eventId === "333mbf" || eventId === "333mbo") {
    const dd = Math.floor(value / 10000000)
    const seconds = Math.floor(value / 100) % 100000
    const missed = value % 100
    const points = 99 - dd
    const solved = points + missed
    const attempted = solved + missed
    const mm = Math.floor(seconds / 60)
    const ss = seconds % 60
    return `${solved}/${attempted} ${mm}:${ss.toString().padStart(2, "0")}`
  }
  return formatCentiseconds(value)
}

/** Flag emoji from an ISO2 country code (regional indicator symbols). */
export function countryFlag(iso2: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso2)) return ""
  return String.fromCodePoint(
    ...[...iso2.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65),
  )
}

// ---- API calls -------------------------------------------------------------

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${WCA_API}${path}`, { headers: { Accept: "application/json" } })
  if (!res.ok) {
    throw new Error(
      res.status === 404 ? "Not found on worldcubeassociation.org" : `WCA API error ${res.status}`,
    )
  }
  return (await res.json()) as T
}

const personCache = new Map<string, Promise<WcaPersonInfo>>()

export function fetchWcaPerson(wcaId: string): Promise<WcaPersonInfo> {
  const id = wcaId.trim().toUpperCase()
  let promise = personCache.get(id)
  if (!promise) {
    promise = getJson<WcaPersonInfo>(`/persons/${encodeURIComponent(id)}`)
    personCache.set(id, promise)
    promise.catch(() => personCache.delete(id))
  }
  return promise
}

let countriesCache: Promise<WcaCountry[]> | null = null

export function fetchWcaCountries(): Promise<WcaCountry[]> {
  countriesCache ??= getJson<WcaCountry[]>("/countries").then((countries) =>
    [...countries].sort((a, b) => a.name.localeCompare(b.name)),
  )
  return countriesCache
}

export interface CompetitionsPage {
  competitions: WcaCompetition[]
  hasMore: boolean
}

const COMPS_PER_PAGE = 25

/** Upcoming (and ongoing) competitions in a country, soonest first. */
export async function fetchUpcomingCompetitions(
  countryIso2: string,
  page = 1,
): Promise<CompetitionsPage> {
  const today = new Date().toISOString().slice(0, 10)
  const params = new URLSearchParams({
    country_iso2: countryIso2,
    start: today,
    sort: "start_date",
    page: String(page),
    per_page: String(COMPS_PER_PAGE),
  })
  const competitions = await getJson<WcaCompetition[]>(`/competitions?${params}`)
  return { competitions, hasMore: competitions.length === COMPS_PER_PAGE }
}

export type RegistrationStatus = "not_yet_open" | "open" | "closed" | "unknown"

export function registrationStatus(comp: WcaCompetition, now = new Date()): RegistrationStatus {
  if (!comp.registration_open || !comp.registration_close) return "unknown"
  const open = new Date(comp.registration_open)
  const close = new Date(comp.registration_close)
  if (now < open) return "not_yet_open"
  if (now <= close) return "open"
  return "closed"
}
