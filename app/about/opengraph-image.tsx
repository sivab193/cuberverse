import { ImageResponse } from "next/og"

/** The card for /about — the link that gets shared, so it leads with the story. */
export const alt = "It started with a PNG of the moves — CuberVerse"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const MUTED = "#9ca3b4"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#14141d",
          backgroundImage:
            "radial-gradient(60% 80% at 12% 0%, rgba(99,102,241,0.28), transparent 70%), radial-gradient(50% 70% at 92% 10%, rgba(34,211,238,0.18), transparent 70%)",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, background: "#22d3ee" }} />
          <div style={{ fontSize: 22, color: MUTED, letterSpacing: 1 }}>CUBERVERSE · ABOUT</div>
        </div>

        <div style={{ fontSize: 72, color: "#fafafa", fontWeight: 700, lineHeight: 1.08, maxWidth: 940 }}>
          It started with a PNG of the moves.
        </div>

        <div style={{ fontSize: 30, color: MUTED, marginTop: 28, maxWidth: 900, lineHeight: 1.4 }}>
          I&apos;ve taught 60+ people to solve a Rubik&apos;s Cube since 2012 — first from a slide
          deck, now from this.
        </div>

        <div style={{ display: "flex", gap: 56, marginTop: 52 }}>
          {[
            { value: "2012", label: "Where it started" },
            { value: "60+", label: "People taught" },
            { value: "8", label: "Competitions" },
            { value: "0", label: "Medals" },
          ].map(({ value, label }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 46, color: "#818cf8", fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 20, color: MUTED, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
