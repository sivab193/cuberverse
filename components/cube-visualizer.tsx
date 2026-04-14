"use client"

import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'

// Colors based on standard Rubik's cube
const colors = {
  right: '#ef4444', // Red
  left: '#f97316',  // Orange
  top: '#ffffff',   // White
  bottom: '#eab308', // Yellow
  front: '#22c55e', // Green
  back: '#3b82f6',  // Blue
  inside: '#111827' // Dark gray
}

const materialRight = new THREE.MeshStandardMaterial({ color: colors.right, roughness: 0.1 })
const materialLeft = new THREE.MeshStandardMaterial({ color: colors.left, roughness: 0.1 })
const materialTop = new THREE.MeshStandardMaterial({ color: colors.top, roughness: 0.1 })
const materialBottom = new THREE.MeshStandardMaterial({ color: colors.bottom, roughness: 0.1 })
const materialFront = new THREE.MeshStandardMaterial({ color: colors.front, roughness: 0.1 })
const materialBack = new THREE.MeshStandardMaterial({ color: colors.back, roughness: 0.1 })
const materialInside = new THREE.MeshStandardMaterial({ color: colors.inside, roughness: 0.9 })

const boxGeometry = new THREE.BoxGeometry(0.96, 0.96, 0.96)

type CubieData = {
  id: number
  initialPosition: THREE.Vector3
  materials: THREE.Material[]
}

const CUBIES: CubieData[] = []
let idCount = 0
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      CUBIES.push({
        id: idCount++,
        initialPosition: new THREE.Vector3(x, y, z),
        materials: [
          x === 1 ? materialRight : materialInside,
          x === -1 ? materialLeft : materialInside,
          y === 1 ? materialTop : materialInside,
          y === -1 ? materialBottom : materialInside,
          z === 1 ? materialFront : materialInside,
          z === -1 ? materialBack : materialInside,
        ],
      })
    }
  }
}

function parseMove(move: string) {
  move = move.trim()
  const baseMove = move[0]
  const isPrime = move.includes("'")
  const isDouble = move.includes("2")

  let axis: 'x' | 'y' | 'z' = 'x'
  let layer: number | 'all' = 1
  let angle = 0

  switch (baseMove) {
    case 'R': axis = 'x'; layer = 1; angle = -Math.PI / 2; break
    case 'L': axis = 'x'; layer = -1; angle = Math.PI / 2; break
    case 'M': axis = 'x'; layer = 0; angle = Math.PI / 2; break
    case 'x': axis = 'x'; layer = 'all'; angle = -Math.PI / 2; break

    case 'U': axis = 'y'; layer = 1; angle = -Math.PI / 2; break
    case 'D': axis = 'y'; layer = -1; angle = Math.PI / 2; break
    case 'E': axis = 'y'; layer = 0; angle = Math.PI / 2; break
    case 'y': axis = 'y'; layer = 'all'; angle = -Math.PI / 2; break

    case 'F': axis = 'z'; layer = 1; angle = -Math.PI / 2; break
    case 'B': axis = 'z'; layer = -1; angle = Math.PI / 2; break
    case 'S': axis = 'z'; layer = 0; angle = -Math.PI / 2; break
    case 'z': axis = 'z'; layer = 'all'; angle = -Math.PI / 2; break

    default:
      console.warn('Unknown move', move)
      axis = 'x'; layer = 2; angle = 0 // Will affect nothing
      break
  }

  if (isPrime) angle *= -1
  if (isDouble) angle *= 2

  return { axis, layer, angle }
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

type CurrentMove = {
  axis: 'x' | 'y' | 'z'
  layer: number | 'all'
  angle: number
  t: number
  duration: number
  affected: number[]
  startPositions: THREE.Vector3[]
  targetPositions: THREE.Vector3[]
  startQuaternions: THREE.Quaternion[]
  targetQuaternions: THREE.Quaternion[]
}

function CubeGroup({ sequence, sequenceId, resetId }: { sequence: string[], sequenceId: number, resetId: number }) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const logicalCubies = useRef(
    CUBIES.map((c) => ({
      logicalPosition: c.initialPosition.clone(),
      logicalQuaternion: new THREE.Quaternion(),
    }))
  )

  const moveQueue = useRef<string[]>([])
  const currentMove = useRef<CurrentMove | null>(null)

  useEffect(() => {
    if (sequence.length > 0 && sequenceId > 0) {
      moveQueue.current.push(...sequence)
    }
  }, [sequence, sequenceId])

  useEffect(() => {
    if (resetId > 0) {
      moveQueue.current = []
      currentMove.current = null

      logicalCubies.current.forEach((lc, i) => {
        lc.logicalPosition.copy(CUBIES[i].initialPosition)
        lc.logicalQuaternion.identity()

        const mesh = meshRefs.current[i]
        if (mesh) {
          mesh.position.copy(lc.logicalPosition)
          mesh.quaternion.copy(lc.logicalQuaternion)
        }
      })
    }
  }, [resetId])

  useFrame((_, delta) => {
    if (!currentMove.current && moveQueue.current.length > 0) {
      const moveStr = moveQueue.current.shift()!
      const { axis, layer, angle } = parseMove(moveStr)

      const affected: number[] = []
      const startPositions: THREE.Vector3[] = []
      const targetPositions: THREE.Vector3[] = []
      const startQuaternions: THREE.Quaternion[] = []
      const targetQuaternions: THREE.Quaternion[] = []

      const axisVector = new THREE.Vector3()
      if (axis === 'x') axisVector.set(1, 0, 0)
      if (axis === 'y') axisVector.set(0, 1, 0)
      if (axis === 'z') axisVector.set(0, 0, 1)

      const moveQuat = new THREE.Quaternion().setFromAxisAngle(axisVector, angle)

      logicalCubies.current.forEach((cubie, i) => {
        const pos = cubie.logicalPosition
        if (layer === 'all' || Math.round(pos[axis]) === layer) {
          affected.push(i)
          startPositions.push(pos.clone())
          startQuaternions.push(cubie.logicalQuaternion.clone())

          const targetPos = pos.clone().applyAxisAngle(axisVector, angle)
          targetPos.x = Math.round(targetPos.x)
          targetPos.y = Math.round(targetPos.y)
          targetPos.z = Math.round(targetPos.z)
          targetPositions.push(targetPos)

          const targetQuat = moveQuat.clone().multiply(cubie.logicalQuaternion).normalize()
          targetQuaternions.push(targetQuat)
        }
      })

      let duration = 0.3
      if (Math.abs(angle) > Math.PI / 2 + 0.1) duration = 0.4

      currentMove.current = {
        axis,
        layer,
        angle,
        t: 0,
        duration,
        affected,
        startPositions,
        targetPositions,
        startQuaternions,
        targetQuaternions,
      }
    }

    if (currentMove.current) {
      const move = currentMove.current
      // Cap delta to prevent huge jumps if tab was inactive
      const safeDelta = Math.min(delta, 0.1)
      move.t += safeDelta / move.duration

      if (move.t >= 1) {
        // Snap to target
        move.affected.forEach((index, i) => {
          const mesh = meshRefs.current[index]
          if (mesh) {
            mesh.position.copy(move.targetPositions[i])
            mesh.quaternion.copy(move.targetQuaternions[i])
          }
          logicalCubies.current[index].logicalPosition.copy(move.targetPositions[i])
          logicalCubies.current[index].logicalQuaternion.copy(move.targetQuaternions[i])
        })
        currentMove.current = null
      } else {
        const ease = easeInOut(move.t)
        move.affected.forEach((index, i) => {
          const mesh = meshRefs.current[index]
          if (mesh) {
            mesh.position.copy(move.startPositions[i]).lerp(move.targetPositions[i], ease)
            mesh.quaternion.copy(move.startQuaternions[i]).slerp(move.targetQuaternions[i], ease)
          }
        })
      }
    }
  })

  return (
    <group>
      {CUBIES.map((c, i) => (
        <mesh
          key={c.id}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
          position={logicalCubies.current[i].logicalPosition}
          quaternion={logicalCubies.current[i].logicalQuaternion}
          geometry={boxGeometry}
          material={c.materials}
        />
      ))}
    </group>
  )
}

interface CubeVisualizerProps {
  sequence: string[]
  sequenceId: number
  resetId: number
}

export function CubeVisualizer({ sequence, sequenceId, resetId }: CubeVisualizerProps) {
  return (
    <div className="h-[400px] w-full rounded-xl border bg-secondary/20 overflow-hidden relative">
      <Canvas camera={{ position: [4, 4, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <Environment preset="city" />
        <CubeGroup sequence={sequence} sequenceId={sequenceId} resetId={resetId} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={12} />
      </Canvas>
    </div>
  )
}
