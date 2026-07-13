import { PYRAMINX_FACE_ORDER, type ParsedMove, type PyraminxFace } from "./types"

/**
 * Pyraminx facelet model.
 *
 * The puzzle is a regular tetrahedron with vertices
 *   U = ( 1,  1,  1)   top
 *   R = ( 1, -1, -1)   front-bottom-right
 *   L = (-1, -1,  1)   front-bottom-left
 *   B = (-1,  1, -1)   back
 *
 * Faces (each subdivided into 9 triangular stickers):
 *   F = {U, L, R}   R-face = {U, R, B}   L-face = {U, B, L}   D = {L, R, B}
 *
 * Sticker layout per face, apex (row 0) first:
 *         0
 *       1 2 3
 *     4 5 6 7 8
 *
 * Each sticker's centroid is an exact rational point (denominator 9), and
 * the four vertex turns are the tetrahedral group's coordinate
 * permutations — so, as with the NxN model, moves are geometry, not
 * hand-written cycle tables. Layer membership falls out of the dot product
 * with the turn's vertex direction.
 */

type Vec = readonly [number, number, number]

const VERTICES: Record<string, Vec> = {
  U: [1, 1, 1],
  R: [1, -1, -1],
  L: [-1, -1, 1],
  B: [-1, 1, -1],
}

/** Face corner triples: [apex, bottom-left, bottom-right] viewed from outside. */
const FACE_CORNERS: Record<PyraminxFace, [Vec, Vec, Vec]> = {
  F: [VERTICES.U, VERTICES.L, VERTICES.R],
  R: [VERTICES.U, VERTICES.R, VERTICES.B],
  L: [VERTICES.U, VERTICES.B, VERTICES.L],
  D: [VERTICES.B, VERTICES.L, VERTICES.R],
}

/**
 * One clockwise third-turn viewed from outside each vertex (the WCA move
 * direction). These are the order-3 rotations of the tetrahedral group.
 */
const ROTATIONS: Record<string, (p: Vec) => Vec> = {
  U: ([x, y, z]) => [y, z, x],
  R: ([x, y, z]) => [-y, z, -x],
  L: ([x, y, z]) => [y, -z, -x],
  B: ([x, y, z]) => [-y, -z, x],
}

/**
 * Layer thresholds along a vertex axis: sticker centroids satisfy
 * dot(p, vertex) > 5/3 for the tip layer and > 1/3 for the two-layer
 * vertex turn (the vertex itself is at dot = 3, the opposite face at -1).
 */
const TIP_THRESHOLD = 5 / 3
const LAYER_THRESHOLD = 1 / 3

function dot(a: Vec, b: Vec): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/** Scale by 9 and round so exact rational positions become integer keys. */
function posKey(p: Vec): string {
  return `${Math.round(p[0] * 9)},${Math.round(p[1] * 9)},${Math.round(p[2] * 9)}`
}

interface StickerRef {
  face: PyraminxFace
  index: number
}

interface Geometry {
  positions: Vec[][]
  lookup: Map<string, StickerRef>
}

let cachedGeometry: Geometry | null = null

function stickerCentroids(corners: [Vec, Vec, Vec]): Vec[] {
  const [apex, left, right] = corners

  // Grid point (r, k): r rows down from the apex (0..3), k steps toward the
  // right corner (0..r).
  const grid = (r: number, k: number): Vec => [
    ((3 - r) * apex[0] + (r - k) * left[0] + k * right[0]) / 3,
    ((3 - r) * apex[1] + (r - k) * left[1] + k * right[1]) / 3,
    ((3 - r) * apex[2] + (r - k) * left[2] + k * right[2]) / 3,
  ]

  const centroid = (a: Vec, b: Vec, c: Vec): Vec => [
    (a[0] + b[0] + c[0]) / 3,
    (a[1] + b[1] + c[1]) / 3,
    (a[2] + b[2] + c[2]) / 3,
  ]

  const centroids: Vec[] = []
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 2 * row + 1; i++) {
      if (i % 2 === 0) {
        const j = i / 2
        centroids.push(centroid(grid(row, j), grid(row + 1, j), grid(row + 1, j + 1)))
      } else {
        const j = (i - 1) / 2
        centroids.push(centroid(grid(row, j), grid(row, j + 1), grid(row + 1, j + 1)))
      }
    }
  }
  return centroids
}

function getGeometry(): Geometry {
  if (cachedGeometry) return cachedGeometry

  const positions: Vec[][] = []
  const lookup = new Map<string, StickerRef>()

  for (const face of PYRAMINX_FACE_ORDER) {
    const centroids = stickerCentroids(FACE_CORNERS[face])
    positions.push(centroids)
    centroids.forEach((p, index) => {
      lookup.set(posKey(p), { face, index })
    })
  }

  cachedGeometry = { positions, lookup }
  return cachedGeometry
}

export class PyraminxPuzzle {
  /** faces[faceIndex][stickerIndex] = color character (face letter of solved position). */
  private faces: string[][]

  constructor() {
    this.faces = PYRAMINX_FACE_ORDER.map((face) => new Array<string>(9).fill(face))
  }

  static solved(): PyraminxPuzzle {
    return new PyraminxPuzzle()
  }

  clone(): PyraminxPuzzle {
    const copy = new PyraminxPuzzle()
    copy.faces = this.faces.map((face) => [...face])
    return copy
  }

  reset(): void {
    this.faces = PYRAMINX_FACE_ORDER.map((face) => new Array<string>(9).fill(face))
  }

  getSticker(face: PyraminxFace, index: number): string {
    return this.faces[PYRAMINX_FACE_ORDER.indexOf(face)][index]
  }

  setSticker(face: PyraminxFace, index: number, color: string): void {
    this.faces[PYRAMINX_FACE_ORDER.indexOf(face)][index] = color
  }

  isSolved(): boolean {
    return this.faces.every((face) => face.every((color) => color === face[0]))
  }

  /** Facelet string in F, R, L, D face order. */
  toFaceletString(): string {
    return this.faces.map((face) => face.join("")).join("")
  }

  applyMove(move: ParsedMove): void {
    const vertex = VERTICES[move.family.toUpperCase()]
    const rotate = ROTATIONS[move.family.toUpperCase()]
    if (!vertex || !rotate) {
      throw new Error(`Unknown move family for pyraminx: ${move.family}`)
    }
    const times = ((move.amount % 3) + 3) % 3
    if (times === 0) return

    const threshold = move.toLayer === 1 ? TIP_THRESHOLD : LAYER_THRESHOLD
    const { positions, lookup } = getGeometry()

    const updates: { faceIndex: number; index: number; color: string }[] = []

    for (let faceIndex = 0; faceIndex < PYRAMINX_FACE_ORDER.length; faceIndex++) {
      const facePositions = positions[faceIndex]
      for (let index = 0; index < facePositions.length; index++) {
        const p = facePositions[index]
        if (dot(p, vertex) <= threshold) continue

        let target = p
        for (let t = 0; t < times; t++) {
          target = rotate(target)
        }
        const dest = lookup.get(posKey(target))
        if (!dest) {
          throw new Error(`Internal error: rotated sticker position not found (${posKey(target)})`)
        }
        updates.push({
          faceIndex: PYRAMINX_FACE_ORDER.indexOf(dest.face),
          index: dest.index,
          color: this.faces[faceIndex][index],
        })
      }
    }

    for (const update of updates) {
      this.faces[update.faceIndex][update.index] = update.color
    }
  }

  applyMoves(moves: ParsedMove[]): void {
    for (const move of moves) {
      this.applyMove(move)
    }
  }
}
