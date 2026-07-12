import type { Face, PyraminxFace } from "@/lib/puzzle"

/** Standard cube color scheme (white top, green front). */
export const STICKER_COLORS: Record<Face, string> = {
  U: "#f1f5f9",
  D: "#fde047",
  F: "#4ade80",
  B: "#3b82f6",
  R: "#ef4444",
  L: "#fb923c",
}

/** Standard pyraminx color scheme (yellow bottom, green front). */
export const PYRAMINX_COLORS: Record<PyraminxFace, string> = {
  F: "#4ade80",
  R: "#3b82f6",
  L: "#ef4444",
  D: "#fde047",
}

export const BODY_COLOR = "#10141f"

/** Eased animation progress within a single move. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
