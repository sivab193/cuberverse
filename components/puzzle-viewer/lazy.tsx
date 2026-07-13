"use client"

import dynamic from "next/dynamic"
import type { PuzzleViewerProps } from "./viewer"

/**
 * Client-only lazy wrapper around the three.js viewer so pages don't pull
 * ~160KB of WebGL code into their initial bundle (and so the Canvas never
 * renders during prerendering).
 */
export const LazyPuzzleViewer = dynamic<PuzzleViewerProps>(() => import("./viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center rounded-xl border bg-secondary/20 text-sm text-muted-foreground">
      Loading 3D viewer…
    </div>
  ),
})
