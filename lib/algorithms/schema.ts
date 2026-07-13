import type { PuzzleId } from "@/lib/puzzle"

/** Display names used across the UI, timer solves, and URL state. */
export type CubeType = "2x2" | "3x3" | "4x4" | "5x5" | "6x6" | "7x7" | "pyraminx"

export type MethodType =
  | "Beginners"
  | "CFOP"
  | "OH"
  | "Ortega"
  | "CLL"
  | "EG-1"
  | "Reduction"
  | "L4E"

export interface Algorithm {
  id: string
  name: string
  cubeType: CubeType
  method: MethodType
  /** Solve stage, e.g. "OLL", "PLL", "F2L", "Parity", "Last Layer". */
  category: string
  /** Section within a category, e.g. an OLL shape family or PLL swap type. */
  group?: string
  algorithm: string
  alternatives?: string[]
  /** Chance of hitting this case, e.g. "1/18". */
  probability?: string
  /** 1 (trivial) … 5 (hard). */
  difficulty?: 1 | 2 | 3 | 4 | 5
  description: string
  /** How to recognize the case on the cube. */
  recognition?: string
}

export const CUBE_TYPE_TO_PUZZLE: Record<CubeType, PuzzleId> = {
  "2x2": "222",
  "3x3": "333",
  "4x4": "444",
  "5x5": "555",
  "6x6": "666",
  "7x7": "777",
  pyraminx: "pyraminx",
}
