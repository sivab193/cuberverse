"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js"
import type { ParsedMove, PyraminxFace } from "@/lib/puzzle"
import { BODY_COLOR, PYRAMINX_COLORS, easeInOut } from "./materials"
import type { PuzzleController } from "./use-puzzle-controller"

/**
 * Geometry mirrors lib/puzzle/pyraminx.ts: a tetrahedron with vertices
 * U(1,1,1), R(1,-1,-1), L(-1,-1,1), B(-1,1,-1), cut by the planes
 * dot(p, vertex) = 5/3 (tips) and = 1/3 (two-layer vertex turns) into
 * 4 tips, 4 axial centers, and 6 edge pieces.
 */

const VERTICES: Record<string, THREE.Vector3> = {
  U: new THREE.Vector3(1, 1, 1),
  R: new THREE.Vector3(1, -1, -1),
  L: new THREE.Vector3(-1, -1, 1),
  B: new THREE.Vector3(-1, 1, -1),
}

const VERTEX_NAMES = ["U", "R", "L", "B"] as const
type VertexName = (typeof VERTEX_NAMES)[number]

/** [apex, bottom-left, bottom-right] corner names per face, matching lib/puzzle. */
const FACE_CORNERS: Record<PyraminxFace, [string, string, string]> = {
  F: ["U", "L", "R"],
  R: ["U", "R", "B"],
  L: ["U", "B", "L"],
  D: ["B", "L", "R"],
}

const TIP_THRESHOLD = 5 / 3
const LAYER_THRESHOLD = 1 / 3

interface PieceDef {
  /** Hull points of the piece body. */
  hull: THREE.Vector3[]
  /** Original centroid, used for move-membership tests. */
  centroid: THREE.Vector3
  /** Sticker triangles owned by this piece: world corners + face color. */
  stickers: { corners: THREE.Vector3[]; color: string; normal: THREE.Vector3 }[]
}

function lerp(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  return a.clone().lerp(b, t)
}

function centroidOf(points: THREE.Vector3[]): THREE.Vector3 {
  const c = new THREE.Vector3()
  for (const p of points) c.add(p)
  return c.divideScalar(points.length)
}

function buildPieces(): PieceDef[] {
  // Candidate hull points: tetra vertices, 1/3 and 2/3 points on each edge,
  // and the 4 face centroids.
  const candidates: THREE.Vector3[] = []
  for (const name of VERTEX_NAMES) candidates.push(VERTICES[name].clone())
  const edgePairs: [VertexName, VertexName][] = [
    ["U", "R"],
    ["U", "L"],
    ["U", "B"],
    ["R", "L"],
    ["R", "B"],
    ["L", "B"],
  ]
  for (const [a, b] of edgePairs) {
    candidates.push(lerp(VERTICES[a], VERTICES[b], 1 / 3))
    candidates.push(lerp(VERTICES[a], VERTICES[b], 2 / 3))
  }
  for (const face of Object.keys(FACE_CORNERS) as PyraminxFace[]) {
    const [a, b, c] = FACE_CORNERS[face]
    candidates.push(centroidOf([VERTICES[a], VERTICES[b], VERTICES[c]]))
  }

  const projections = (p: THREE.Vector3): Record<string, number> => {
    const out: Record<string, number> = {}
    for (const name of VERTEX_NAMES) out[name] = p.dot(VERTICES[name])
    return out
  }

  // A piece is the set of candidates satisfying its half-space constraints
  // (with tolerance, so boundary points are included in adjacent pieces).
  const EPS = 1e-6
  const collect = (test: (s: Record<string, number>) => boolean): THREE.Vector3[] =>
    candidates.filter((p) => test(projections(p)))

  const pieces: PieceDef[] = []

  for (const v of VERTEX_NAMES) {
    // Tip: s_v >= 5/3
    pieces.push(makePiece(collect((s) => s[v] >= TIP_THRESHOLD - EPS)))
    // Axial center: 1/3 <= s_v <= 5/3, all others <= 1/3
    pieces.push(
      makePiece(
        collect(
          (s) =>
            s[v] >= LAYER_THRESHOLD - EPS &&
            s[v] <= TIP_THRESHOLD + EPS &&
            VERTEX_NAMES.every((w) => w === v || s[w] <= LAYER_THRESHOLD + EPS),
        ),
      ),
    )
  }
  for (const [a, b] of edgePairs) {
    // Edge piece: both vertices' projections in [1/3, 5/3], others <= 1/3
    pieces.push(
      makePiece(
        collect(
          (s) =>
            s[a] >= LAYER_THRESHOLD - EPS &&
            s[a] <= TIP_THRESHOLD + EPS &&
            s[b] >= LAYER_THRESHOLD - EPS &&
            s[b] <= TIP_THRESHOLD + EPS &&
            VERTEX_NAMES.every((w) => w === a || w === b || s[w] <= LAYER_THRESHOLD + EPS),
        ),
      ),
    )
  }

  // Assign sticker triangles to pieces by centroid region
  for (const face of Object.keys(FACE_CORNERS) as PyraminxFace[]) {
    const [apexName, leftName, rightName] = FACE_CORNERS[face]
    const apex = VERTICES[apexName]
    const left = VERTICES[leftName]
    const right = VERTICES[rightName]
    const grid = (r: number, k: number): THREE.Vector3 =>
      new THREE.Vector3(
        ((3 - r) * apex.x + (r - k) * left.x + k * right.x) / 3,
        ((3 - r) * apex.y + (r - k) * left.y + k * right.y) / 3,
        ((3 - r) * apex.z + (r - k) * left.z + k * right.z) / 3,
      )

    const faceNormal = new THREE.Vector3()
      .subVectors(left, apex)
      .cross(new THREE.Vector3().subVectors(right, apex))
      .normalize()
    // Ensure the normal points away from the origin (outward)
    if (faceNormal.dot(apex) < 0) faceNormal.negate()

    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 2 * row + 1; i++) {
        let corners: THREE.Vector3[]
        if (i % 2 === 0) {
          const j = i / 2
          corners = [grid(row, j), grid(row + 1, j), grid(row + 1, j + 1)]
        } else {
          const j = (i - 1) / 2
          corners = [grid(row, j), grid(row, j + 1), grid(row + 1, j + 1)]
        }
        const stickerCentroid = centroidOf(corners)

        // Find the owning piece: the one whose region contains this centroid
        const s: Record<string, number> = {}
        for (const name of VERTEX_NAMES) s[name] = stickerCentroid.dot(VERTICES[name])
        const tipOwner = VERTEX_NAMES.find((v) => s[v] > TIP_THRESHOLD)
        const layerOwners = VERTEX_NAMES.filter((v) => s[v] > LAYER_THRESHOLD)

        let owner: PieceDef | undefined
        if (tipOwner) {
          owner = pieces[VERTEX_NAMES.indexOf(tipOwner) * 2]
        } else if (layerOwners.length === 1) {
          owner = pieces[VERTEX_NAMES.indexOf(layerOwners[0]) * 2 + 1]
        } else {
          const pairIndex = edgePairs.findIndex(
            ([a, b]) => layerOwners.includes(a) && layerOwners.includes(b),
          )
          owner = pieces[8 + pairIndex]
        }
        if (!owner) {
          throw new Error("Pyraminx sticker could not be assigned to a piece")
        }

        // Shrink the sticker toward its centroid and raise it off the body
        const shrunk = corners.map((c) =>
          c
            .clone()
            .lerp(stickerCentroid, 0.12)
            .addScaledVector(faceNormal, 0.02),
        )
        owner.stickers.push({ corners: shrunk, color: PYRAMINX_COLORS[face], normal: faceNormal })
      }
    }
  }

  return pieces
}

function makePiece(hull: THREE.Vector3[]): PieceDef {
  return { hull, centroid: centroidOf(hull), stickers: [] }
}

function isAffected(centroid: THREE.Vector3, move: ParsedMove): boolean {
  const vertex = VERTICES[move.family.toUpperCase()]
  const threshold = move.toLayer === 1 ? TIP_THRESHOLD : LAYER_THRESHOLD
  return centroid.dot(vertex) > threshold
}

function stickerGeometry(corners: THREE.Vector3[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(9)
  corners.forEach((c, i) => {
    positions[i * 3] = c.x
    positions[i * 3 + 1] = c.y
    positions[i * 3 + 2] = c.z
  })
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geometry.setIndex([0, 1, 2])
  geometry.computeVertexNormals()
  return geometry
}

export function PyraminxScene({ controller }: { controller: PuzzleController }) {
  const pieces = useMemo(() => buildPieces(), [])

  const bodyGeometries = useMemo(
    () =>
      pieces.map((piece) => {
        // Shrink hull points slightly toward the piece centroid for gaps
        const shrunk = piece.hull.map((p) => p.clone().lerp(piece.centroid, 0.04))
        return new ConvexGeometry(shrunk)
      }),
    [pieces],
  )
  const stickerGeometries = useMemo(
    () => pieces.map((piece) => piece.stickers.map((s) => stickerGeometry(s.corners))),
    [pieces],
  )
  useEffect(() => {
    return () => {
      bodyGeometries.forEach((g) => g.dispose())
      stickerGeometries.forEach((list) => list.forEach((g) => g.dispose()))
    }
  }, [bodyGeometries, stickerGeometries])

  const groupRefs = useRef<(THREE.Group | null)[]>([])
  const lastRendered = useRef<{ animPos: number; generation: number } | null>(null)

  useFrame((_, delta) => {
    controller.tick(Math.min(delta, 0.1))

    const { animPos, generation } = controller
    const last = lastRendered.current
    if (last && last.animPos === animPos && last.generation === generation) return
    lastRendered.current = { animPos, generation }

    const allMoves = [...controller.baseMoves, ...controller.moves]
    const committed = controller.baseMoves.length + Math.floor(animPos)
    const fraction = animPos - Math.floor(animPos)
    const partialMove = fraction > 0 ? allMoves[committed] : undefined

    const quaternion = new THREE.Quaternion()
    const moveQuaternion = new THREE.Quaternion()
    const axis = new THREE.Vector3()
    const centroid = new THREE.Vector3()

    pieces.forEach((piece, index) => {
      const group = groupRefs.current[index]
      if (!group) return

      quaternion.identity()
      centroid.copy(piece.centroid)

      for (let k = 0; k < committed; k++) {
        const move = allMoves[k]
        if (!isAffected(centroid, move)) continue
        axis.copy(VERTICES[move.family.toUpperCase()]).normalize()
        moveQuaternion.setFromAxisAngle(axis, (-move.amount * 2 * Math.PI) / 3)
        quaternion.premultiply(moveQuaternion)
        centroid.applyQuaternion(moveQuaternion)
      }

      if (partialMove && isAffected(centroid, partialMove)) {
        axis.copy(VERTICES[partialMove.family.toUpperCase()]).normalize()
        moveQuaternion.setFromAxisAngle(
          axis,
          ((-partialMove.amount * 2 * Math.PI) / 3) * easeInOut(fraction),
        )
        quaternion.premultiply(moveQuaternion)
      }

      group.quaternion.copy(quaternion)
    })
  })

  return (
    <group scale={1.35} position={[0, -0.1, 0]}>
      {pieces.map((piece, index) => (
        <group
          key={index}
          ref={(el) => {
            groupRefs.current[index] = el
          }}
        >
          <mesh geometry={bodyGeometries[index]}>
            <meshStandardMaterial color={BODY_COLOR} roughness={0.4} metalness={0.15} />
          </mesh>
          {piece.stickers.map((sticker, stickerIndex) => (
            <mesh key={stickerIndex} geometry={stickerGeometries[index][stickerIndex]}>
              <meshStandardMaterial
                color={sticker.color}
                roughness={0.25}
                metalness={0.05}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
