import type { SolvablePuzzleId } from "@/lib/solver/state-mapping"

/**
 * Face-scan geometry shared by the camera overlay, the sampler, and the
 * review grid: for each scannable puzzle, the position and outline of every
 * sticker of one face, in normalized [0,1] coordinates of a square viewport.
 *
 * Sticker order matches lib/puzzle facelet order within a face, assuming the
 * face is presented as instructed in SCAN_STEPS — so concatenating scans in
 * scan order yields the canonical facelet string directly.
 */

export interface StickerShape {
  /** Sampling center. */
  cx: number
  cy: number
  /** Outline polygon, as [x, y] pairs. */
  points: [number, number][]
}

function square(cx: number, cy: number, half: number): [number, number][] {
  return [
    [cx - half, cy - half],
    [cx + half, cy - half],
    [cx + half, cy + half],
    [cx - half, cy + half],
  ]
}

function nxnShapes(n: number): StickerShape[] {
  const inset = 0.16
  const cell = (1 - 2 * inset) / n
  const shapes: StickerShape[] = []
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const cx = inset + (col + 0.5) * cell
      const cy = inset + (row + 0.5) * cell
      shapes.push({ cx, cy, points: square(cx, cy, cell * 0.42) })
    }
  }
  return shapes
}

type Vec2 = [number, number]

function lerp3(a: Vec2, b: Vec2, c: Vec2, wa: number, wb: number, wc: number): Vec2 {
  return [
    (wa * a[0] + wb * b[0] + wc * c[0]) / 3,
    (wa * a[1] + wb * b[1] + wc * c[1]) / 3,
  ]
}

function shrinkToward(points: Vec2[], center: Vec2, factor: number): [number, number][] {
  return points.map(([x, y]) => [
    center[0] + (x - center[0]) * factor,
    center[1] + (y - center[1]) * factor,
  ])
}

/**
 * Triangular face: apex at top, matching the pyraminx model's row layout
 * (row 0 = apex sticker, then 3, then 5).
 */
function pyraminxShapes(): StickerShape[] {
  const apex: Vec2 = [0.5, 0.1]
  const left: Vec2 = [0.04, 0.9]
  const right: Vec2 = [0.96, 0.9]
  // grid(r, k) as in lib/puzzle/pyraminx.ts
  const grid = (r: number, k: number): Vec2 => lerp3(apex, left, right, 3 - r, r - k, k)

  const shapes: StickerShape[] = []
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 2 * row + 1; i++) {
      let corners: Vec2[]
      if (i % 2 === 0) {
        const j = i / 2
        corners = [grid(row, j), grid(row + 1, j), grid(row + 1, j + 1)]
      } else {
        const j = (i - 1) / 2
        corners = [grid(row, j), grid(row, j + 1), grid(row + 1, j + 1)]
      }
      const cx = (corners[0][0] + corners[1][0] + corners[2][0]) / 3
      const cy = (corners[0][1] + corners[1][1] + corners[2][1]) / 3
      shapes.push({ cx, cy, points: shrinkToward(corners, [cx, cy], 0.82) })
    }
  }
  return shapes
}

const SHAPES: Record<SolvablePuzzleId, StickerShape[]> = {
  "333": nxnShapes(3),
  "222": nxnShapes(2),
  pyraminx: pyraminxShapes(),
}

export function faceShapes(puzzle: SolvablePuzzleId): StickerShape[] {
  return SHAPES[puzzle]
}

export interface ScanStep {
  /** Face letter in the canonical facelet order for this puzzle. */
  face: string
  instruction: string
}

/**
 * Faces in canonical facelet-string order, with how to present each one to
 * the camera so grid position (row, col) lands on the right facelet index.
 */
export const SCAN_STEPS: Record<SolvablePuzzleId, ScanStep[]> = {
  "333": [
    { face: "U", instruction: "Point the camera down at the top face. Keep the front of the cube toward the bottom of the frame." },
    { face: "R", instruction: "Show the right face straight on. Keep the top of the cube up." },
    { face: "F", instruction: "Show the front face straight on. Keep the top of the cube up." },
    { face: "D", instruction: "Point the camera up at the bottom face. Keep the front of the cube toward the top of the frame." },
    { face: "L", instruction: "Show the left face straight on. Keep the top of the cube up." },
    { face: "B", instruction: "Show the back face straight on. Keep the top of the cube up." },
  ],
  "222": [
    { face: "U", instruction: "Point the camera down at the top face. Keep the front of the cube toward the bottom of the frame." },
    { face: "R", instruction: "Show the right face straight on. Keep the top of the cube up." },
    { face: "F", instruction: "Show the front face straight on. Keep the top of the cube up." },
    { face: "D", instruction: "Point the camera up at the bottom face. Keep the front of the cube toward the top of the frame." },
    { face: "L", instruction: "Show the left face straight on. Keep the top of the cube up." },
    { face: "B", instruction: "Show the back face straight on. Keep the top of the cube up." },
  ],
  pyraminx: [
    { face: "F", instruction: "Hold the pyraminx with a flat face toward the camera and the sharp point up." },
    { face: "R", instruction: "Rotate the puzzle one third to the left (right face comes to the front). Point stays up." },
    { face: "L", instruction: "Rotate one third to the left again (the original left face is now in front). Point stays up." },
    { face: "D", instruction: "Rotate one third left to return to the start, then tip the puzzle toward you so the bottom faces the camera. The rear point should be at the top of the frame." },
  ],
}
