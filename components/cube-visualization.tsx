"use client"

import { useEffect, useRef } from "react"

interface CubeVisualizationProps {
  algorithm: string
}

export function CubeVisualization({ algorithm }: CubeVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw a simplified top-view representation of the cube
    const drawCube = () => {
      const size = 30
      const padding = 5
      const colors = {
        Y: "#fbbf24", // yellow
        W: "#f3f4f6", // white
        R: "#ef4444", // red
        O: "#f97316", // orange
        B: "#3b82f6", // blue
        G: "#22c55e", // green
        X: "#6b7280", // gray (unknown)
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw 3x3 top view (simplified representation)
      // This is a basic representation - you would parse the algorithm and determine actual colors
      const topFace = [
        ["Y", "Y", "Y"],
        ["Y", "Y", "Y"],
        ["Y", "Y", "Y"],
      ]

      // Draw the squares
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const x = col * (size + padding)
          const y = row * (size + padding)
          const color = colors[topFace[row][col] as keyof typeof colors]

          ctx.fillStyle = color
          ctx.fillRect(x, y, size, size)
          ctx.strokeStyle = "#1f2937"
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, size, size)
        }
      }
    }

    drawCube()
  }, [algorithm])

  return (
    <div className="mb-4 flex justify-center rounded-lg bg-secondary/50 p-4">
      <canvas ref={canvasRef} width="110" height="110" className="rounded" />
    </div>
  )
}
