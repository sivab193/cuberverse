import { describe, expect, it } from "vitest"
import {
  appendCompetitionsPage,
  citiesFromCompetitions,
  DEFAULT_FILTERS,
  filterCompetitions,
  FILTERS_STORAGE_KEY,
  hasActiveFilters,
  loadStoredFilters,
  parseStoredFilters,
  saveStoredFilters,
  type CompetitionFilters,
} from "@/lib/competition-filters"
import type { WcaCompetition } from "@/lib/wca"

function makeComp(overrides: Partial<WcaCompetition> = {}): WcaCompetition {
  return {
    id: "Test2026",
    name: "Test 2026",
    short_display_name: "Test 2026",
    start_date: "2026-08-01",
    end_date: "2026-08-02",
    date_range: "Aug 1 - 2, 2026",
    registration_open: "2026-07-01T00:00:00.000Z",
    registration_close: "2026-07-20T00:00:00.000Z",
    cancelled_at: null,
    competitor_limit: 100,
    venue: "Community Hall",
    city: "Chennai",
    country_iso2: "IN",
    url: "https://example.com",
    event_ids: ["333"],
    ...overrides,
  }
}

// Registration windows: open Jul 1–20, so Jul 10 is "open", Jun 15 is
// "not yet open", Jul 25 is "closed".
const NOW_OPEN = new Date("2026-07-10T12:00:00.000Z")
const NOW_BEFORE = new Date("2026-06-15T12:00:00.000Z")
const NOW_AFTER = new Date("2026-07-25T12:00:00.000Z")

const COMPS = [
  makeComp({ id: "Chennai2026", name: "Chennai Open 2026", city: "Chennai" }),
  makeComp({ id: "Madurai2026", name: "Madurai Open 2026", city: "Madurai" }),
  makeComp({
    id: "Coimbatore2026",
    name: "Coimbatore Open 2026",
    city: "Coimbatore",
    venue: "PSG Tech Auditorium",
    registration_open: "2026-06-01T00:00:00.000Z",
    registration_close: "2026-06-20T00:00:00.000Z",
  }),
  makeComp({
    id: "Cancelled2026",
    name: "Cancelled Comp 2026",
    city: "Chennai",
    cancelled_at: "2026-07-05T00:00:00.000Z",
  }),
  makeComp({
    id: "NoDates2026",
    name: "No Dates Comp 2026",
    city: "Salem",
    registration_open: null,
    registration_close: null,
  }),
]

function ids(comps: WcaCompetition[]): string[] {
  return comps.map((c) => c.id)
}

describe("citiesFromCompetitions", () => {
  it("returns sorted unique non-empty cities", () => {
    expect(citiesFromCompetitions(COMPS)).toEqual([
      "Chennai",
      "Coimbatore",
      "Madurai",
      "Salem",
    ])
  })

  it("drops empty and whitespace-only cities", () => {
    const comps = [
      makeComp({ city: "" }),
      makeComp({ city: "   " }),
      makeComp({ city: "  Hosur " }),
    ]
    expect(citiesFromCompetitions(comps)).toEqual(["Hosur"])
  })

  it("returns an empty list for no competitions", () => {
    expect(citiesFromCompetitions([])).toEqual([])
  })
})

describe("hasActiveFilters", () => {
  it("is false for defaults and true when any filter is set", () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, city: "Chennai" })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, registration: "open" })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: "open" })).toBe(true)
    // Whitespace-only search is not an active filter.
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: "   " })).toBe(false)
  })
})

describe("appendCompetitionsPage", () => {
  const first = [
    makeComp({ id: "A", start_date: "2026-08-10" }),
    makeComp({ id: "B", start_date: "2026-08-01" }),
  ]
  const second = [
    makeComp({ id: "C", start_date: "2026-08-05" }),
    makeComp({ id: "B", start_date: "2026-08-01" }),
  ]

  it("merges pages soonest-first", () => {
    expect(ids(appendCompetitionsPage(first, second))).toEqual(["B", "C", "A"])
  })

  it("dedupes competitions already in the list", () => {
    const merged = appendCompetitionsPage(first, second)
    expect(merged).toHaveLength(3)
    expect(merged.filter((comp) => comp.id === "B")).toHaveLength(1)
  })

  it("handles an empty page", () => {
    expect(ids(appendCompetitionsPage(first, []))).toEqual(["B", "A"])
  })
})

describe("filterCompetitions", () => {
  it("returns everything with default filters", () => {
    expect(ids(filterCompetitions(COMPS, DEFAULT_FILTERS, NOW_OPEN))).toEqual(ids(COMPS))
  })

  it("filters by exact city", () => {
    expect(
      ids(filterCompetitions(COMPS, { ...DEFAULT_FILTERS, city: "Chennai" }, NOW_OPEN)),
    ).toEqual(["Chennai2026", "Cancelled2026"])
    expect(
      ids(filterCompetitions(COMPS, { ...DEFAULT_FILTERS, city: "Nowhere" }, NOW_OPEN)),
    ).toEqual([])
  })

  it("filters by registration status against the given time", () => {
    expect(
      ids(filterCompetitions(COMPS, { ...DEFAULT_FILTERS, registration: "open" }, NOW_OPEN)),
    ).toEqual(["Chennai2026", "Madurai2026"])
    // Coimbatore's window (Jun 1–20) is already open by Jun 15, so it is
    // not "not yet open" — only the two July-window competitions are.
    expect(
      ids(
        filterCompetitions(
          COMPS,
          { ...DEFAULT_FILTERS, registration: "not_yet_open" },
          NOW_BEFORE,
        ),
      ),
    ).toEqual(["Chennai2026", "Madurai2026"])
    expect(
      ids(filterCompetitions(COMPS, { ...DEFAULT_FILTERS, registration: "closed" }, NOW_AFTER)),
    ).toEqual(["Chennai2026", "Madurai2026", "Coimbatore2026"])
  })

  it("excludes cancelled competitions from every registration bucket", () => {
    // Cancelled2026's window is open at NOW_OPEN, but it must not show as open.
    const open = filterCompetitions(
      COMPS,
      { ...DEFAULT_FILTERS, registration: "open" },
      NOW_OPEN,
    )
    expect(ids(open)).not.toContain("Cancelled2026")
    const closed = filterCompetitions(
      COMPS,
      { ...DEFAULT_FILTERS, registration: "closed" },
      NOW_AFTER,
    )
    expect(ids(closed)).not.toContain("Cancelled2026")
    // ...but it still shows under "all".
    expect(ids(filterCompetitions(COMPS, DEFAULT_FILTERS, NOW_OPEN))).toContain("Cancelled2026")
  })

  it("excludes competitions with unknown registration dates from every bucket", () => {
    const open = filterCompetitions(
      COMPS,
      { ...DEFAULT_FILTERS, registration: "open" },
      NOW_OPEN,
    )
    expect(ids(open)).not.toContain("NoDates2026")
    expect(ids(filterCompetitions(COMPS, DEFAULT_FILTERS, NOW_OPEN))).toContain("NoDates2026")
  })

  it("searches name, city, and venue case-insensitively", () => {
    expect(
      ids(filterCompetitions(COMPS, { ...DEFAULT_FILTERS, query: "madurai" }, NOW_OPEN)),
    ).toEqual(["Madurai2026"])
    expect(
      ids(filterCompetitions(COMPS, { ...DEFAULT_FILTERS, query: "PSG TECH" }, NOW_OPEN)),
    ).toEqual(["Coimbatore2026"])
    expect(
      ids(filterCompetitions(COMPS, { ...DEFAULT_FILTERS, query: "  chennai open " }, NOW_OPEN)),
    ).toEqual(["Chennai2026"])
  })

  it("combines filters with AND", () => {
    const filters: CompetitionFilters = {
      city: "Chennai",
      registration: "open",
      query: "open",
    }
    expect(ids(filterCompetitions(COMPS, filters, NOW_OPEN))).toEqual(["Chennai2026"])
  })
})

describe("parseStoredFilters", () => {
  it("parses a valid blob", () => {
    expect(
      parseStoredFilters('{"city":"Chennai","registration":"open","query":"cube"}'),
    ).toEqual({ city: "Chennai", registration: "open", query: "cube" })
  })

  it("falls back to defaults for missing, invalid, or mistyped input", () => {
    expect(parseStoredFilters(null)).toEqual(DEFAULT_FILTERS)
    expect(parseStoredFilters("")).toEqual(DEFAULT_FILTERS)
    expect(parseStoredFilters("not json")).toEqual(DEFAULT_FILTERS)
    expect(parseStoredFilters("[1,2]")).toEqual(DEFAULT_FILTERS)
    expect(parseStoredFilters('"just a string"')).toEqual(DEFAULT_FILTERS)
    expect(
      parseStoredFilters('{"city":42,"registration":"bogus","query":null}'),
    ).toEqual(DEFAULT_FILTERS)
  })

  it("keeps the valid fields and defaults the rest", () => {
    expect(parseStoredFilters('{"city":"Madurai","registration":"bogus"}')).toEqual({
      city: "Madurai",
      registration: "all",
      query: "",
    })
  })
})

describe("loadStoredFilters / saveStoredFilters", () => {
  function memoryStorage(initial: Record<string, string> = {}) {
    const store = new Map(Object.entries(initial))
    return {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      raw: store,
    }
  }

  it("round-trips through storage", () => {
    const storage = memoryStorage()
    const filters: CompetitionFilters = {
      city: "Chennai",
      registration: "closed",
      query: "open",
    }
    saveStoredFilters(filters, storage)
    expect(storage.raw.get(FILTERS_STORAGE_KEY)).toBe(JSON.stringify(filters))
    expect(loadStoredFilters(storage)).toEqual(filters)
  })

  it("returns defaults when storage is empty or unavailable", () => {
    expect(loadStoredFilters(memoryStorage())).toEqual(DEFAULT_FILTERS)
    expect(loadStoredFilters(null)).toEqual(DEFAULT_FILTERS)
  })

  it("never throws when storage is unavailable or broken", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied")
      },
      setItem: () => {
        throw new Error("denied")
      },
    }
    expect(() => saveStoredFilters(DEFAULT_FILTERS, broken)).not.toThrow()
    expect(loadStoredFilters(broken)).toEqual(DEFAULT_FILTERS)
    expect(() => saveStoredFilters(DEFAULT_FILTERS, null)).not.toThrow()
  })
})
