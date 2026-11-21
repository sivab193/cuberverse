/**
 * Filters for the competitions page: city, registration status, and the
 * free-text search. All three are stored in localStorage as one JSON object
 * so a visitor's filters are still there when they come back.
 *
 * The country is NOT part of this — it already has its own storage key
 * (`cuberverse.competitions.country`) and is also synced to the user profile.
 */

import { registrationStatus, type WcaCompetition } from "@/lib/wca"

export type RegistrationFilter = "all" | "open" | "not_yet_open" | "closed"

export interface CompetitionFilters {
  /** Exact city name, or "" for all cities. */
  city: string
  registration: RegistrationFilter
  /** Free-text search over name, city, and venue. */
  query: string
}

export const DEFAULT_FILTERS: CompetitionFilters = {
  city: "",
  registration: "all",
  query: "",
}

export const FILTERS_STORAGE_KEY = "cuberverse.competitions.filters"

export const REGISTRATION_FILTER_LABELS: Record<RegistrationFilter, string> = {
  all: "Any registration status",
  open: "Registration open",
  not_yet_open: "Opens soon",
  closed: "Registration closed",
}

export function isRegistrationFilter(value: unknown): value is RegistrationFilter {
  return value === "all" || value === "open" || value === "not_yet_open" || value === "closed"
}

/** Sorted unique non-empty cities in the loaded competitions. */
export function citiesFromCompetitions(competitions: WcaCompetition[]): string[] {
  const cities = new Set<string>()
  for (const comp of competitions) {
    const city = (comp.city ?? "").trim()
    if (city) cities.add(city)
  }
  return [...cities].sort((a, b) => a.localeCompare(b))
}

export function hasActiveFilters(filters: CompetitionFilters): boolean {
  return filters.city !== "" || filters.registration !== "all" || filters.query.trim() !== ""
}

/**
 * Merge a newly loaded page into the accumulated list: dedupe by id (the
 * WCA list can shift between requests if a competition is announced
 * mid-load) and keep everything soonest-first.
 */
export function appendCompetitionsPage(
  prev: WcaCompetition[],
  page: WcaCompetition[],
): WcaCompetition[] {
  const seen = new Set(prev.map((comp) => comp.id))
  const merged = [...prev]
  for (const comp of page) {
    if (!seen.has(comp.id)) {
      seen.add(comp.id)
      merged.push(comp)
    }
  }
  return merged.sort((a, b) => a.start_date.localeCompare(b.start_date))
}

/**
 * Apply the filters. All active filters must match (AND).
 *
 * A cancelled competition is never "open" (or "opens soon") for
 * registration, and it isn't "closed" either — it only shows under "all".
 * Competitions with unknown registration dates behave the same way.
 */
export function filterCompetitions(
  competitions: WcaCompetition[],
  filters: CompetitionFilters,
  now = new Date(),
): WcaCompetition[] {
  const needle = filters.query.trim().toLowerCase()
  return competitions.filter((comp) => {
    if (filters.city && (comp.city ?? "") !== filters.city) return false
    if (filters.registration !== "all") {
      if (comp.cancelled_at) return false
      if (registrationStatus(comp, now) !== filters.registration) return false
    }
    if (needle) {
      const matches = (value: string | null | undefined) =>
        (value ?? "").toLowerCase().includes(needle)
      if (!matches(comp.name) && !matches(comp.city) && !matches(comp.venue)) return false
    }
    return true
  })
}

// ---- persistence -------------------------------------------------------------

// StorageLike instead of Storage so tests can pass a fake without jsdom.
type StorageLike = Pick<Storage, "getItem" | "setItem">

function defaultStorage(): StorageLike | null {
  return typeof localStorage !== "undefined" ? localStorage : null
}

/** Parse a stored filters blob. Anything invalid falls back to defaults. */
export function parseStoredFilters(raw: string | null): CompetitionFilters {
  if (!raw) return { ...DEFAULT_FILTERS }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_FILTERS }
    const obj = parsed as Record<string, unknown>
    return {
      city: typeof obj.city === "string" ? obj.city : "",
      registration: isRegistrationFilter(obj.registration) ? obj.registration : "all",
      query: typeof obj.query === "string" ? obj.query : "",
    }
  } catch {
    return { ...DEFAULT_FILTERS }
  }
}

export function loadStoredFilters(
  storage: StorageLike | null = defaultStorage(),
): CompetitionFilters {
  if (!storage) return { ...DEFAULT_FILTERS }
  try {
    return parseStoredFilters(storage.getItem(FILTERS_STORAGE_KEY))
  } catch {
    return { ...DEFAULT_FILTERS }
  }
}

export function saveStoredFilters(
  filters: CompetitionFilters,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return
  try {
    storage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
  } catch {
    // Storage full or unavailable (e.g. private mode) — filters just
    // don't persist. Never break the page over it.
  }
}
