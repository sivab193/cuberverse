import type { StickerShape } from "./geometry"

/**
 * Read mean sticker colors out of a live camera frame.
 *
 * The camera view renders the video with `object-fit: cover` in a square
 * container, so what the user sees is the centered square crop of the frame.
 * Sampling maps the normalized overlay coordinates into that same crop.
 */

export interface RGB {
  r: number
  g: number
  b: number
}

let sharedCanvas: HTMLCanvasElement | null = null

export function sampleVideoFrame(
  video: HTMLVideoElement,
  shapes: StickerShape[],
): RGB[] | null {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (vw === 0 || vh === 0) return null

  sharedCanvas ??= document.createElement("canvas")
  const canvas = sharedCanvas
  canvas.width = vw
  canvas.height = vh
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, vw, vh)

  const cropSide = Math.min(vw, vh)
  const cropX = (vw - cropSide) / 2
  const cropY = (vh - cropSide) / 2
  // Patch half-size: generous but safely inside a sticker at any resolution.
  const half = Math.max(2, Math.round(cropSide * 0.015))

  return shapes.map(({ cx, cy }) => {
    const px = Math.round(cropX + cx * cropSide)
    const py = Math.round(cropY + cy * cropSide)
    const x0 = Math.max(0, px - half)
    const y0 = Math.max(0, py - half)
    const w = Math.min(vw, px + half + 1) - x0
    const h = Math.min(vh, py + half + 1) - y0
    const data = ctx.getImageData(x0, y0, w, h).data
    let r = 0
    let g = 0
    let b = 0
    const count = data.length / 4
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
    }
    return { r: r / count, g: g / count, b: b / count }
  })
}
