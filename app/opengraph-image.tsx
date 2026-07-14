import { ImageResponse } from "next/og"
import { algorithms } from "@/lib/algorithms"

/**
 * The card unfurlers show for cuberverse links (WhatsApp, Slack, iMessage,
 * Twitter). Applies to every route that doesn't define its own.
 *
 * Rendered with next/og at build time, so it stays in sync with the algorithm
 * count instead of being a stale PNG someone has to remember to re-export.
 */
export const alt = "CuberVerse — every cube algorithm, drawn as the case it solves"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const BG = "#14141d"
const FG = "#fafafa"
const MUTED = "#9ca3b4"
const PRIMARY = "#6366f1"
const ACCENT = "#22d3ee"

/** A last-layer diagram, the same shape the site draws on every card. */
function CaseTile({ cells, top }: { cells: string[]; top: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 6, paddingLeft: 4, paddingRight: 4 }}>
        {top.map((color, i) => (
          <div key={i} style={{ width: 40, height: 16, background: color, borderRadius: 3 }} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: 152,
          gap: 6,
          padding: 6,
          background: "#0b0e17",
          borderRadius: 10,
        }}
      >
        {cells.map((color, i) => (
          <div key={i} style={{ width: 40, height: 40, background: color, borderRadius: 5 }} />
        ))}
      </div>
    </div>
  )
}

const W = "#f1f5f9"
const Y = "#fde047"
const G = "#4ade80"
const R = "#ef4444"
const B = "#3b82f6"
const O = "#fb923c"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BG,
          backgroundImage: `radial-gradient(60% 80% at 12% 0%, rgba(99,102,241,0.28), transparent 70%), radial-gradient(50% 70% at 92% 10%, rgba(34,211,238,0.18), transparent 70%)`,
          padding: 72,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 660 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: ACCENT,
                display: "flex",
              }}
            />
            <div style={{ fontSize: 24, color: MUTED, letterSpacing: 1 }}>CUBERVERSE</div>
          </div>

          <div style={{ fontSize: 68, color: FG, fontWeight: 700, lineHeight: 1.08 }}>
            Every algorithm, drawn as the case it solves.
          </div>

          {/* Satori needs an explicit display on any element with >1 child, and
              interpolating the count next to text makes two. */}
          <div style={{ display: "flex", fontSize: 28, color: MUTED, marginTop: 26 }}>
            {`${algorithms.length} algorithms across 4 puzzles — each one playable in 3D.`}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
            {["Scan & solve", "Timer", "WCA"].map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: MUTED,
                  border: "1px solid #2f3344",
                  borderRadius: 999,
                  padding: "8px 20px",
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {/* Sune and a T-perm — the two cases every cuber recognises instantly. */}
          <CaseTile
            top={[R, B, R]}
            cells={[W, W, Y, W, W, W, G, W, W]}
          />
          <CaseTile
            top={[O, G, O]}
            cells={[W, W, W, W, W, W, W, W, W]}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 72,
            bottom: 48,
            fontSize: 22,
            color: PRIMARY,
            display: "flex",
          }}
        >
          cv.siv19.dev
        </div>
      </div>
    ),
    size,
  )
}
