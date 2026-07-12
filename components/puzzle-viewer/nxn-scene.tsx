"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import { FACE_FRAMES, FAMILY_FACE, PUZZLES, type Face, type ParsedMove } from "@/lib/puzzle"
import { BODY_COLOR, STICKER_COLORS, easeInOut } from "./materials"
import type { PuzzleController } from "./use-puzzle-controller"

const FACES: Face[] = ["U", "R", "F", "D", "L", "B"]

interface CubieDef {
  /** Grid position: coordinates in {-(n-1)/2 … (n-1)/2}. */
  grid: THREE.Vector3
  stickers: { face: Face; color: string }[]
}

interface NxnGeometry {
  cubies: CubieDef[]
  /** stickerCubie[i] = index of the cubie sticker i belongs to. */
  stickerCubie: number[]
  /** Local transform of each sticker relative to its cubie center. */
  stickerLocal: THREE.Matrix4[]
  stickerColors: THREE.Color[]
}

function buildGeometry(n: number): NxnGeometry {
  const half = (n - 1) / 2
  const cubies: CubieDef[] = []

  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        const gx = x - half
        const gy = y - half
        const gz = z - half
        const onShell =
          Math.abs(gx) === half || Math.abs(gy) === half || Math.abs(gz) === half
        if (!onShell) continue

        const stickers: { face: Face; color: string }[] = []
        for (const face of FACES) {
          const normal = FACE_FRAMES[face].normal
          const coord = gx * normal[0] + gy * normal[1] + gz * normal[2]
          if (coord === half) {
            stickers.push({ face, color: STICKER_COLORS[face] })
          }
        }
        cubies.push({ grid: new THREE.Vector3(gx, gy, gz), stickers })
      }
    }
  }

  const stickerCubie: number[] = []
  const stickerLocal: THREE.Matrix4[] = []
  const stickerColors: THREE.Color[] = []
  const zAxis = new THREE.Vector3(0, 0, 1)

  cubies.forEach((cubie, cubieIndex) => {
    for (const sticker of cubie.stickers) {
      const normal = new THREE.Vector3(...FACE_FRAMES[sticker.face].normal)
      const quaternion = new THREE.Quaternion().setFromUnitVectors(zAxis, normal)
      const local = new THREE.Matrix4().compose(
        normal.clone().multiplyScalar(0.5),
        quaternion,
        new THREE.Vector3(1, 1, 1),
      )
      stickerCubie.push(cubieIndex)
      stickerLocal.push(local)
      stickerColors.push(new THREE.Color(sticker.color))
    }
  })

  return { cubies, stickerCubie, stickerLocal, stickerColors }
}

/** Exact 90° grid rotation about a face's outward axis (same maps as lib/puzzle). */
function rotateGrid(v: THREE.Vector3, face: Face, times: number): void {
  for (let t = 0; t < times; t++) {
    const { x, y, z } = v
    switch (face) {
      case "R":
        v.set(x, z, -y)
        break
      case "L":
        v.set(x, -z, y)
        break
      case "U":
        v.set(-z, y, x)
        break
      case "D":
        v.set(z, y, -x)
        break
      case "F":
        v.set(y, -x, z)
        break
      case "B":
        v.set(-y, x, z)
        break
    }
  }
}

function isAffected(grid: THREE.Vector3, move: ParsedMove, n: number): boolean {
  const face = FAMILY_FACE[move.family]
  const normal = FACE_FRAMES[face].normal
  const half = (n - 1) / 2
  const coord = grid.x * normal[0] + grid.y * normal[1] + grid.z * normal[2]
  const outer = half - (move.fromLayer - 1)
  const inner = half - (move.toLayer - 1)
  return coord <= outer + 1e-6 && coord >= inner - 1e-6
}

export function NxnScene({ controller }: { controller: PuzzleController }) {
  const n = PUZZLES[controller.puzzle].n
  const geometry = useMemo(() => buildGeometry(n), [n])

  const bodyGeometry = useMemo(() => new RoundedBoxGeometry(0.94, 0.94, 0.94, 3, 0.08), [])
  const stickerGeometry = useMemo(() => new RoundedBoxGeometry(0.82, 0.82, 0.1, 2, 0.04), [])
  useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      stickerGeometry.dispose()
    }
  }, [bodyGeometry, stickerGeometry])

  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const stickerRef = useRef<THREE.InstancedMesh>(null)
  const lastRendered = useRef<{ animPos: number; generation: number } | null>(null)

  // Assign per-instance sticker colors once per geometry
  useEffect(() => {
    const mesh = stickerRef.current
    if (!mesh) return
    geometry.stickerColors.forEach((color, i) => mesh.setColorAt(i, color))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    lastRendered.current = null
  }, [geometry])

  useFrame((_, delta) => {
    controller.tick(Math.min(delta, 0.1))

    const bodies = bodyRef.current
    const stickers = stickerRef.current
    if (!bodies || !stickers) return

    const { animPos, generation } = controller
    const last = lastRendered.current
    if (last && last.animPos === animPos && last.generation === generation) return
    lastRendered.current = { animPos, generation }

    const allMoves = [...controller.baseMoves, ...controller.moves]
    const baseCount = controller.baseMoves.length
    const committed = baseCount + Math.floor(animPos)
    const fraction = animPos - Math.floor(animPos)
    const partialMove = fraction > 0 ? allMoves[committed] : undefined

    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const moveQuaternion = new THREE.Quaternion()
    const axis = new THREE.Vector3()
    const matrix = new THREE.Matrix4()
    const cubieMatrices: THREE.Matrix4[] = []
    const scale = new THREE.Vector3(1, 1, 1)

    for (const cubie of geometry.cubies) {
      position.copy(cubie.grid)
      quaternion.identity()

      for (let k = 0; k < committed; k++) {
        const move = allMoves[k]
        if (!isAffected(position, move, n)) continue
        const face = FAMILY_FACE[move.family]
        const times = ((move.amount % 4) + 4) % 4
        rotateGrid(position, face, times)
        axis.set(...FACE_FRAMES[face].normal)
        moveQuaternion.setFromAxisAngle(axis, (-move.amount * Math.PI) / 2)
        quaternion.premultiply(moveQuaternion)
      }
      // Snap accumulated grid coordinates to the exact half-step lattice
      position.set(
        Math.round(position.x * 2) / 2,
        Math.round(position.y * 2) / 2,
        Math.round(position.z * 2) / 2,
      )

      if (partialMove && isAffected(position, partialMove, n)) {
        const face = FAMILY_FACE[partialMove.family]
        axis.set(...FACE_FRAMES[face].normal)
        moveQuaternion.setFromAxisAngle(
          axis,
          ((-partialMove.amount * Math.PI) / 2) * easeInOut(fraction),
        )
        quaternion.premultiply(moveQuaternion)
        position.applyQuaternion(moveQuaternion)
      }

      matrix.compose(position, quaternion, scale)
      cubieMatrices.push(matrix.clone())
    }

    cubieMatrices.forEach((m, i) => bodies.setMatrixAt(i, m))
    bodies.instanceMatrix.needsUpdate = true

    const stickerMatrix = new THREE.Matrix4()
    for (let i = 0; i < geometry.stickerCubie.length; i++) {
      stickerMatrix.multiplyMatrices(
        cubieMatrices[geometry.stickerCubie[i]],
        geometry.stickerLocal[i],
      )
      stickers.setMatrixAt(i, stickerMatrix)
    }
    stickers.instanceMatrix.needsUpdate = true
  })

  // Normalize world size across cube sizes so the camera never moves
  const groupScale = 3 / n

  return (
    <group scale={groupScale}>
      <instancedMesh
        key={`bodies-${n}`}
        ref={bodyRef}
        args={[bodyGeometry, undefined, geometry.cubies.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial color={BODY_COLOR} roughness={0.4} metalness={0.15} />
      </instancedMesh>
      <instancedMesh
        key={`stickers-${n}`}
        ref={stickerRef}
        args={[stickerGeometry, undefined, geometry.stickerCubie.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial roughness={0.25} metalness={0.05} />
      </instancedMesh>
    </group>
  )
}
