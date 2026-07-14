import {
  NxnCube,
  PUZZLES,
  PyraminxPuzzle,
  invertMoves,
  parseSequence,
  type Face,
  type PuzzleId,
  type PyraminxFace,
} from "@/lib/puzzle"
import { BODY_COLOR, PYRAMINX_COLORS, STICKER_COLORS } from "@/components/puzzle-viewer/materials"

/**
 * Static 2D picture of the case an algorithm solves.
 *
 * The case is the algorithm's inverse applied to a solved puzzle — the same
 * state the 3D player starts from, so a card and its "Watch in 3D" dialog
 * always show the same cube. Colors come from the 3D viewer's scheme for the
 * same reason.
 *
 * Three projections, chosen by the case's solve stage:
 *  - "last-layer": the classic top-down diagram (U face plus the ring of
 *    side stickers touching it). What cubers actually recognize OLL/PLL by.
 *  - "isometric": U/F/R in a 3/4 view, for stages that involve more than the
 *    last layer (F2L, cross, PBL) where a top-down view would hide the case.
 *  - "pyraminx": the three faces meeting at the top vertex, side by side.
 */

const SQRT3_2 = Math.sqrt(3) / 2

/** Solve stages whose case is fully visible from the top. */
const LAST_LAYER_STAGES = [
  "OLL",
  "PLL",
  "COLL",
  "CLL",
  "EG-1",
  "Winter Variation",
  "Parity",
  "Third Layer",
  "Last Layer",
]

export type CaseView = "last-layer" | "isometric" | "pyraminx"

export function caseViewFor(puzzle: PuzzleId, category: string): CaseView {
  if (puzzle === "pyraminx") return "pyraminx"
  // "PBL" permutes both layers, so the bottom matters — it needs the 3/4 view
  // even though its name reads like a last-layer stage.
  if (category === "PBL") return "isometric"
  return LAST_LAYER_STAGES.some((stage) => category.includes(stage)) ? "last-layer" : "isometric"
}

/**
 * Sticker colors of the case, keyed by face. Building a cube costs a few
 * hundred integer ops, but a 57-case OLL grid re-renders on every keystroke
 * in the search box — so results are cached by puzzle + algorithm.
 */
const stateCache = new Map<string, string[][] | null>()

function caseStickers(puzzle: PuzzleId, alg: string): string[][] | null {
  const key = `${puzzle}:${alg}`
  const cached = stateCache.get(key)
  if (cached !== undefined) return cached

  let stickers: string[][] | null = null
  try {
    const moves = invertMoves(parseSequence(alg, puzzle))
    if (puzzle === "pyraminx") {
      const model = PyraminxPuzzle.solved()
      model.applyMoves(moves)
      stickers = (["F", "R", "L", "D"] as PyraminxFace[]).map((face) =>
        Array.from({ length: 9 }, (_, i) => model.getSticker(face, i)),
      )
    } else {
      const { n } = PUZZLES[puzzle]
      const cube = NxnCube.solved(n)
      cube.applyMoves(moves)
      stickers = (["U", "R", "F", "D", "L", "B"] as Face[]).map((face) =>
        Array.from({ length: n * n }, (_, i) =>
          cube.getSticker(face, Math.floor(i / n), i % n),
        ),
      )
    }
  } catch {
    // A case we can't parse simply gets no diagram rather than breaking the page.
    stickers = null
  }

  stateCache.set(key, stickers)
  return stickers
}

const CUBE_FACE_INDEX: Record<Face, number> = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 }
const PYRA_FACE_INDEX: Record<PyraminxFace, number> = { F: 0, R: 1, L: 2, D: 3 }

/** Shrink a polygon toward its centroid, which is what draws the gaps between stickers. */
function inset(points: [number, number][], factor: number): string {
  const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length
  const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length
  return points
    .map(([x, y]) => `${cx + (x - cx) * factor},${cy + (y - cy) * factor}`)
    .join(" ")
}

export interface CaseDiagramProps {
  puzzle: PuzzleId
  /** Algorithm in the app's notation. The diagram shows the state it solves. */
  algorithm: string
  /** Solve stage — picks the projection. */
  category: string
  className?: string
}

export function CaseDiagram({ puzzle, algorithm, category, className }: CaseDiagramProps) {
  const stickers = caseStickers(puzzle, algorithm)
  if (!stickers) return null

  const view = caseViewFor(puzzle, category)
  if (view === "pyraminx") return <PyraminxDiagram stickers={stickers} className={className} />

  const { n } = PUZZLES[puzzle]
  const at = (face: Face, row: number, col: number) =>
    STICKER_COLORS[stickers[CUBE_FACE_INDEX[face]][row * n + col] as Face]

  return view === "last-layer" ? (
    <LastLayerDiagram n={n} at={at} className={className} />
  ) : (
    <IsometricDiagram n={n} at={at} className={className} />
  )
}

type ColorAt = (face: Face, row: number, col: number) => string

/**
 * Top-down: the U face, ringed by the one row of each side face that touches
 * it. The side rows run in U's screen order — B is reversed and R is
 * back-to-front — because each face's own column axis is defined from its own
 * point of view (see FACE_FRAMES).
 */
function LastLayerDiagram({
  n,
  at,
  className,
}: {
  n: number
  at: ColorAt
  className?: string
}) {
  const pitch = 20
  const gap = 2
  const size = pitch - gap
  const flap = 10
  const split = 4 // space between the U grid and the flaps

  const origin = flap + split
  const span = n * pitch - gap
  const far = origin + span + split
  const total = far + flap

  const cells: React.ReactElement[] = []

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      cells.push(
        <rect
          key={`u-${row}-${col}`}
          x={origin + col * pitch}
          y={origin + row * pitch}
          width={size}
          height={size}
          rx={2.5}
          fill={at("U", row, col)}
        />,
      )
    }
  }

  for (let i = 0; i < n; i++) {
    const along = origin + i * pitch
    cells.push(
      <rect
        key={`b-${i}`}
        x={along}
        y={0}
        width={size}
        height={flap}
        rx={2}
        fill={at("B", 0, n - 1 - i)}
      />,
      <rect
        key={`f-${i}`}
        x={along}
        y={far}
        width={size}
        height={flap}
        rx={2}
        fill={at("F", 0, i)}
      />,
      <rect key={`l-${i}`} x={0} y={along} width={flap} height={size} rx={2} fill={at("L", 0, i)} />,
      <rect
        key={`r-${i}`}
        x={far}
        y={along}
        width={flap}
        height={size}
        rx={2}
        fill={at("R", 0, n - 1 - i)}
      />,
    )
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      className={className}
      role="img"
      aria-label="Case diagram, viewed from the top"
    >
      <rect
        x={origin - gap}
        y={origin - gap}
        width={span + gap * 2}
        height={span + gap * 2}
        rx={5}
        fill={BODY_COLOR}
      />
      {cells}
    </svg>
  )
}

/**
 * Three-quarter view of U, F and R.
 *
 * Coordinates (u, v, w) count cells along +x (right), down, and +z (toward
 * the viewer) from the back-top-left corner, so the cube's own row/col axes
 * map straight onto the projection.
 */
function IsometricDiagram({
  n,
  at,
  className,
}: {
  n: number
  at: ColorAt
  className?: string
}) {
  const s = 22
  const project = (u: number, v: number, w: number): [number, number] => [
    (u - w) * SQRT3_2 * s,
    ((u + w) * 0.5 + v) * s,
  ]

  const face = (
    key: string,
    brightness: number,
    quads: { corners: [number, number, number][]; fill: string }[],
  ) => (
    <g key={key} style={{ filter: `brightness(${brightness})` }}>
      {quads.map((quad, i) => (
        <polygon
          key={i}
          points={inset(
            quad.corners.map(([u, v, w]) => project(u, v, w)),
            0.9,
          )}
          fill={quad.fill}
        />
      ))}
    </g>
  )

  const u: { corners: [number, number, number][]; fill: string }[] = []
  const f: { corners: [number, number, number][]; fill: string }[] = []
  const r: { corners: [number, number, number][]; fill: string }[] = []

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      // U rows run back (0) to front (n-1); columns run left to right.
      u.push({
        corners: [
          [col, 0, row],
          [col + 1, 0, row],
          [col + 1, 0, row + 1],
          [col, 0, row + 1],
        ],
        fill: at("U", row, col),
      })
      f.push({
        corners: [
          [col, row, n],
          [col + 1, row, n],
          [col + 1, row + 1, n],
          [col, row + 1, n],
        ],
        fill: at("F", row, col),
      })
      // R's columns run front to back, so they walk w downward from n.
      r.push({
        corners: [
          [n, row, n - col],
          [n, row, n - col - 1],
          [n, row + 1, n - col - 1],
          [n, row + 1, n - col],
        ],
        fill: at("R", row, col),
      })
    }
  }

  const width = 2 * n * SQRT3_2 * s
  const height = 2 * n * s
  const pad = 3

  return (
    <svg
      viewBox={`${-width / 2 - pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`}
      className={className}
      role="img"
      aria-label="Case diagram, three-quarter view"
    >
      <polygon
        points={[
          project(0, 0, 0),
          project(n, 0, 0),
          project(n, n, 0),
          project(n, n, n),
          project(0, n, n),
          project(0, 0, n),
        ]
          .map(([x, y]) => `${x},${y}`)
          .join(" ")}
        fill={BODY_COLOR}
        stroke={BODY_COLOR}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {face("u", 1, u)}
      {face("f", 0.82, f)}
      {face("r", 0.66, r)}
    </svg>
  )
}

/**
 * The three faces around the top vertex, laid out side by side. Each face is
 * nine triangles: row r holds 2r+1 of them, alternating point-up (even) and
 * point-down (odd) — the same indexing the pyraminx model uses.
 */
function PyraminxDiagram({ stickers, className }: { stickers: string[][]; className?: string }) {
  const w = 70
  const h = w * SQRT3_2
  const gap = 6

  const faces: PyraminxFace[] = ["L", "F", "R"]

  return (
    <svg
      viewBox={`0 0 ${w * 3 + gap * 2} ${h}`}
      className={className}
      role="img"
      aria-label="Case diagram, the three faces around the top vertex"
    >
      {faces.map((face, index) => {
        const offset = index * (w + gap)
        // Grid point r rows down from the apex, k steps toward the right corner.
        const point = (r: number, k: number): [number, number] => [
          offset + (w / 2) * (1 - r / 3) + (k * w) / 3,
          (r * h) / 3,
        ]

        const triangles: React.ReactElement[] = []
        let sticker = 0
        for (let row = 0; row < 3; row++) {
          for (let i = 0; i < 2 * row + 1; i++) {
            const j = Math.floor(i / 2)
            const corners: [number, number][] =
              i % 2 === 0
                ? [point(row, j), point(row + 1, j), point(row + 1, j + 1)]
                : [point(row, j), point(row, j + 1), point(row + 1, j + 1)]
            triangles.push(
              // `i` restarts every row, so key off the sticker index instead.
              <polygon
                key={sticker}
                points={inset(corners, 0.88)}
                fill={PYRAMINX_COLORS[stickers[PYRA_FACE_INDEX[face]][sticker] as PyraminxFace]}
              />,
            )
            sticker++
          }
        }

        return (
          <g key={face}>
            <polygon
              points={[point(0, 0), point(3, 0), point(3, 3)]
                .map(([x, y]) => `${x},${y}`)
                .join(" ")}
              fill={BODY_COLOR}
              stroke={BODY_COLOR}
              strokeWidth={3}
              strokeLinejoin="round"
            />
            {triangles}
          </g>
        )
      })}
    </svg>
  )
}
