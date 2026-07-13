import { FACE_ORDER, type Face, type ParsedMove } from "./types"

/**
 * NxN cube facelet model.
 *
 * Every sticker has an exact integer 3D position: the two in-face axes take
 * odd values -(N-1), -(N-3), …, N-1 (doubled grid coordinates) and the
 * face-normal axis is ±N. Moves are integer rotation matrices applied to the
 * affected stickers' positions, and positions map uniquely back to
 * (face, row, col) — so one code path handles any layer of any size cube
 * with no hand-written strip cycles.
 *
 * Face orientations follow the Kociemba facelet convention, so
 * `toFaceletString()` on a 3x3 is directly usable with standard solvers.
 */

export type Vec = readonly [number, number, number]

interface FaceFrame {
  normal: Vec
  rowDir: Vec
  colDir: Vec
}

export const FACE_FRAMES: Record<Face, FaceFrame> = {
  U: { normal: [0, 1, 0], rowDir: [0, 0, 1], colDir: [1, 0, 0] },
  D: { normal: [0, -1, 0], rowDir: [0, 0, -1], colDir: [1, 0, 0] },
  F: { normal: [0, 0, 1], rowDir: [0, -1, 0], colDir: [1, 0, 0] },
  B: { normal: [0, 0, -1], rowDir: [0, -1, 0], colDir: [-1, 0, 0] },
  R: { normal: [1, 0, 0], rowDir: [0, -1, 0], colDir: [0, 0, -1] },
  L: { normal: [-1, 0, 0], rowDir: [0, -1, 0], colDir: [0, 0, 1] },
}

/** One clockwise quarter turn viewed from outside the given face. */
export const ROTATIONS: Record<Face, (p: Vec) => Vec> = {
  R: ([x, y, z]) => [x, z, -y],
  L: ([x, y, z]) => [x, -z, y],
  U: ([x, y, z]) => [-z, y, x],
  D: ([x, y, z]) => [z, y, -x],
  F: ([x, y, z]) => [y, -x, z],
  B: ([x, y, z]) => [-y, x, z],
}

/** Face whose rotation direction each move family follows. */
export const FAMILY_FACE: Record<string, Face> = {
  U: "U",
  R: "R",
  F: "F",
  D: "D",
  L: "L",
  B: "B",
  M: "L",
  E: "D",
  S: "F",
  x: "R",
  y: "U",
  z: "F",
}

function dot(a: Vec, b: Vec): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

interface StickerRef {
  face: Face
  row: number
  col: number
}

interface Geometry {
  /** Position of each sticker, indexed [faceIndex][row * n + col]. */
  positions: Vec[][]
  /** Position key → sticker location. */
  lookup: Map<string, StickerRef>
}

function posKey(p: Vec): string {
  return `${p[0]},${p[1]},${p[2]}`
}

const geometryCache = new Map<number, Geometry>()

function getGeometry(n: number): Geometry {
  const cached = geometryCache.get(n)
  if (cached) return cached

  const positions: Vec[][] = []
  const lookup = new Map<string, StickerRef>()

  for (const face of FACE_ORDER) {
    const { normal, rowDir, colDir } = FACE_FRAMES[face]
    const facePositions: Vec[] = []
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const r = 2 * row - (n - 1)
        const c = 2 * col - (n - 1)
        const p: Vec = [
          normal[0] * n + rowDir[0] * r + colDir[0] * c,
          normal[1] * n + rowDir[1] * r + colDir[1] * c,
          normal[2] * n + rowDir[2] * r + colDir[2] * c,
        ]
        facePositions.push(p)
        lookup.set(posKey(p), { face, row, col })
      }
    }
    positions.push(facePositions)
  }

  const geometry = { positions, lookup }
  geometryCache.set(n, geometry)
  return geometry
}

/**
 * 1-based layer index of a sticker along the given axis, counted from the
 * axis face inward. Stickers on the axis face itself are layer 1; stickers
 * on the opposite face are layer N.
 */
function layerOf(axisCoord: number, n: number): number {
  if (axisCoord === n) return 1
  if (axisCoord === -n) return n
  return (n + 1 - axisCoord) / 2
}

export class NxnCube {
  readonly n: number
  /** faces[faceIndex][row * n + col] = color character (face letter of solved position). */
  private faces: string[][]

  constructor(n: number) {
    if (!Number.isInteger(n) || n < 2 || n > 7) {
      throw new Error(`Unsupported cube size: ${n}`)
    }
    this.n = n
    this.faces = FACE_ORDER.map((face) => new Array<string>(n * n).fill(face))
  }

  static solved(n: number): NxnCube {
    return new NxnCube(n)
  }

  clone(): NxnCube {
    const copy = new NxnCube(this.n)
    copy.faces = this.faces.map((face) => [...face])
    return copy
  }

  reset(): void {
    this.faces = FACE_ORDER.map((face) => new Array<string>(this.n * this.n).fill(face))
  }

  getSticker(face: Face, row: number, col: number): string {
    return this.faces[FACE_ORDER.indexOf(face)][row * this.n + col]
  }

  setSticker(face: Face, row: number, col: number, color: string): void {
    this.faces[FACE_ORDER.indexOf(face)][row * this.n + col] = color
  }

  isSolved(): boolean {
    return this.faces.every((face) => face.every((color) => color === face[0]))
  }

  /** Facelet string in URFDLB face order, each face row-major. */
  toFaceletString(): string {
    return this.faces.map((face) => face.join("")).join("")
  }

  applyMove(move: ParsedMove): void {
    const axisFace = FAMILY_FACE[move.family]
    if (!axisFace) {
      throw new Error(`Unknown move family for NxN cube: ${move.family}`)
    }
    const rotate = ROTATIONS[axisFace]
    const times = ((move.amount % 4) + 4) % 4
    if (times === 0) return

    const { n } = this
    const { positions, lookup } = getGeometry(n)
    const axisNormal = FACE_FRAMES[axisFace].normal

    const updates: { faceIndex: number; index: number; color: string }[] = []

    for (let faceIndex = 0; faceIndex < FACE_ORDER.length; faceIndex++) {
      const facePositions = positions[faceIndex]
      for (let index = 0; index < facePositions.length; index++) {
        const p = facePositions[index]
        const layer = layerOf(dot(p, axisNormal), n)
        if (layer < move.fromLayer || layer > move.toLayer) continue

        let target = p
        for (let t = 0; t < times; t++) {
          target = rotate(target)
        }
        const dest = lookup.get(posKey(target))
        if (!dest) {
          throw new Error(`Internal error: rotated sticker position not found (${posKey(target)})`)
        }
        updates.push({
          faceIndex: FACE_ORDER.indexOf(dest.face),
          index: dest.row * n + dest.col,
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
