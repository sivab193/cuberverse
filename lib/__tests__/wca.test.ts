import { describe, expect, it } from "vitest"
import {
  countryFlag,
  eventName,
  formatWcaResult,
  isValidWcaId,
  registrationStatus,
  sortEventIds,
  type WcaCompetition,
} from "@/lib/wca"

describe("isValidWcaId", () => {
  it("accepts real-shaped ids and rejects everything else", () => {
    expect(isValidWcaId("2009ZEMD01")).toBe(true)
    expect(isValidWcaId("2023ABCD99")).toBe(true)
    expect(isValidWcaId("2009zemd01")).toBe(false)
    expect(isValidWcaId("2009ZEMD1")).toBe(false)
    expect(isValidWcaId("ZEMD012009")).toBe(false)
    expect(isValidWcaId("")).toBe(false)
  })
})

describe("formatWcaResult", () => {
  it("formats centiseconds", () => {
    expect(formatWcaResult("333", 347, "single")).toBe("3.47")
    expect(formatWcaResult("333", 71, "single")).toBe("0.71")
    expect(formatWcaResult("333", 6000, "single")).toBe("1:00.00")
    expect(formatWcaResult("555bf", 8 * 6000 + 1234, "single")).toBe("8:12.34")
    expect(formatWcaResult("333bf", 3600 * 100 + 61 * 100, "single")).toBe("1:01:01.00")
  })

  it("handles DNF/DNS/absent", () => {
    expect(formatWcaResult("333", -1, "single")).toBe("DNF")
    expect(formatWcaResult("333", -2, "single")).toBe("DNS")
    expect(formatWcaResult("333", 0, "single")).toBe("—")
  })

  it("formats fewest moves (moves for single, hundredths for average)", () => {
    expect(formatWcaResult("333fm", 24, "single")).toBe("24")
    expect(formatWcaResult("333fm", 2433, "average")).toBe("24.33")
  })

  it("decodes multi-blind DDTTTTTMM", () => {
    // 9 points (99-90), 3120 s = 52:00, 2 missed -> 11/13 52:00
    expect(formatWcaResult("333mbf", 900312002, "single")).toBe("11/13 52:00")
    // Perfect 2/2 in 5:30 -> dd=97, 330 s, 0 missed
    expect(formatWcaResult("333mbf", 970033000, "single")).toBe("2/2 5:30")
  })
})

describe("event helpers", () => {
  it("names known events and passes unknown through", () => {
    expect(eventName("333oh")).toBe("3x3 One-Handed")
    expect(eventName("pyram")).toBe("Pyraminx")
    expect(eventName("weird")).toBe("weird")
  })

  it("sorts events into customary order", () => {
    expect(sortEventIds(["pyram", "333", "222", "333bf"])).toEqual([
      "333",
      "222",
      "333bf",
      "pyram",
    ])
  })
})

describe("countryFlag", () => {
  it("builds regional-indicator flags", () => {
    expect(countryFlag("IN")).toBe("🇮🇳")
    expect(countryFlag("AU")).toBe("🇦🇺")
    expect(countryFlag("bad!")).toBe("")
  })
})

describe("registrationStatus", () => {
  const base: WcaCompetition = {
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
    venue: "Venue",
    city: "City, State",
    country_iso2: "IN",
    url: "https://example.com",
    event_ids: ["333"],
  }

  it("classifies by the current time", () => {
    expect(registrationStatus(base, new Date("2026-06-15"))).toBe("not_yet_open")
    expect(registrationStatus(base, new Date("2026-07-10"))).toBe("open")
    expect(registrationStatus(base, new Date("2026-07-25"))).toBe("closed")
    expect(registrationStatus({ ...base, registration_open: null }, new Date())).toBe("unknown")
  })
})
