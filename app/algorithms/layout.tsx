import type { Metadata } from "next"
import { algorithms } from "@/lib/algorithms"

/**
 * The page itself is a client component, which can't export metadata — so the
 * route's metadata lives here.
 */
export const metadata: Metadata = {
  title: "Algorithm Library",
  description: `${algorithms.length} Rubik's Cube algorithms for 3x3, 2x2, 4x4 and Pyraminx — CFOP, OLL, PLL, CLL, EG-1 and more. Every case is drawn as the state it solves and plays back in 3D.`,
}

export default function AlgorithmsLayout({ children }: { children: React.ReactNode }) {
  return children
}
