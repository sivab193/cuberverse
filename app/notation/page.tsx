"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotationTab, type MoveSection } from "@/components/notation-tab"
import type { PuzzleId } from "@/lib/puzzle"

const SECONDARY = "bg-secondary"
const ACCENT = "bg-accent"
const MUTED = "bg-muted"

const SECTIONS_333: MoveSection[] = [
  {
    title: "Basic Face Moves",
    note: "Click on any move to visualize it on the cube.",
    moves: [
      { code: "R", name: "Right", description: "Turn the right face 90° clockwise" },
      { code: "L", name: "Left", description: "Turn the left face 90° clockwise" },
      { code: "U", name: "Up", description: "Turn the top face 90° clockwise" },
      { code: "D", name: "Down", description: "Turn the bottom face 90° clockwise" },
      { code: "F", name: "Front", description: "Turn the front face 90° clockwise" },
      { code: "B", name: "Back", description: "Turn the back face 90° clockwise" },
    ],
  },
  {
    title: "Move Modifiers",
    tone: SECONDARY,
    moves: [
      { code: "R'", name: "Prime (Apostrophe)", description: "Counter-clockwise: turn 90° in the opposite direction" },
      { code: "R2", name: "Double Turn", description: "Turn the face 180° (two quarter turns)" },
      { code: "r", name: "Wide Turn (lowercase)", description: "Turn two layers at once" },
    ],
  },
  {
    title: "Middle & Slice Moves",
    tone: ACCENT,
    moves: [
      { code: "M", name: "Middle", description: "Middle layer between L and R (turns in direction of L)" },
      { code: "E", name: "Equatorial", description: "Middle layer between U and D (turns in direction of D)" },
      { code: "S", name: "Standing", description: "Middle layer between F and B (turns in direction of F)" },
    ],
  },
  {
    title: "Rotation Moves",
    tone: MUTED,
    moves: [
      { code: "x", name: "X Rotation", description: "Rotate the entire cube on the R axis" },
      { code: "y", name: "Y Rotation", description: "Rotate the entire cube on the U axis" },
      { code: "z", name: "Z Rotation", description: "Rotate the entire cube on the F axis" },
    ],
  },
]

const SECTIONS_222: MoveSection[] = [
  {
    title: "Face Moves",
    note: "The 2x2 uses the same notation as the 3x3 — most scrambles only need R, U and F since every move on a 2x2 also \"moves\" the opposite face.",
    moves: [
      { code: "R", name: "Right", description: "Turn the right face 90° clockwise" },
      { code: "U", name: "Up", description: "Turn the top face 90° clockwise" },
      { code: "F", name: "Front", description: "Turn the front face 90° clockwise" },
      { code: "L", name: "Left", description: "Turn the left face 90° clockwise" },
      { code: "D", name: "Down", description: "Turn the bottom face 90° clockwise" },
      { code: "B", name: "Back", description: "Turn the back face 90° clockwise" },
    ],
  },
  {
    title: "Modifiers",
    tone: SECONDARY,
    moves: [
      { code: "R'", name: "Prime", description: "Counter-clockwise turn (e.g. R', U', F')" },
      { code: "R2", name: "Double", description: "180° turn (e.g. R2, U2, F2)" },
    ],
  },
]

const SECTIONS_PYRAMINX: MoveSection[] = [
  {
    title: "Face Turns",
    note: "Each letter turns the two layers around one vertex of the pyramid, a third of a full turn.",
    moves: [
      { code: "U", name: "Upper", description: "Turn the top two layers clockwise" },
      { code: "R", name: "Right", description: "Turn the right two layers clockwise" },
      { code: "L", name: "Left", description: "Turn the left two layers clockwise" },
      { code: "B", name: "Back", description: "Turn the back two layers clockwise" },
    ],
  },
  {
    title: "Tips (lowercase)",
    tone: ACCENT,
    moves: [
      { code: "u", name: "Upper Tip", description: "Turn just the top tip piece" },
      { code: "r", name: "Right Tip", description: "Turn just the right tip piece" },
      { code: "l", name: "Left Tip", description: "Turn just the left tip piece" },
      { code: "b", name: "Back Tip", description: "Turn just the back tip piece" },
    ],
  },
  {
    title: "Modifiers",
    tone: SECONDARY,
    moves: [
      { code: "U'", name: "Prime (Apostrophe)", description: "Counter-clockwise turn — works for faces and tips" },
    ],
  },
]

function bigCubeSections(size: PuzzleId): MoveSection[] {
  const threeLayer = size === "666" || size === "777"
  return [
    {
      title: "Face Moves",
      note: "Big cubes use the same face moves as the 3x3 — the letters always turn the outermost layer.",
      moves: [
        { code: "R", name: "Right", description: "Turn the outer right layer 90° clockwise" },
        { code: "U", name: "Up", description: "Turn the outer top layer 90° clockwise" },
        { code: "F", name: "Front", description: "Turn the outer front layer 90° clockwise" },
      ],
    },
    {
      title: "Wide Moves",
      tone: ACCENT,
      moves: [
        { code: "Rw", name: "Right Wide", description: "Turn the two outer right layers together" },
        { code: "Uw", name: "Up Wide", description: "Turn the two outer top layers together" },
        ...(threeLayer
          ? [
              { code: "3Rw", name: "Three-layer Wide", description: "Turn the three outer right layers together" },
              { code: "3Uw", name: "Three-layer Wide (top)", description: "Turn the three outer top layers together" },
            ]
          : []),
        { code: "3R", name: "Inner Layer", description: "Turn only the third layer from the right" },
      ],
    },
    {
      title: "Modifiers",
      tone: SECONDARY,
      moves: [
        { code: "Rw'", name: "Prime", description: "Counter-clockwise version of any move" },
        { code: "Rw2", name: "Double", description: "180° version of any move" },
      ],
    },
  ]
}

const BIG_CUBES: { id: PuzzleId; label: string }[] = [
  { id: "444", label: "4x4" },
  { id: "555", label: "5x5" },
  { id: "666", label: "6x6" },
  { id: "777", label: "7x7" },
]

function BigCubesTab() {
  const [size, setSize] = useState<PuzzleId>("444")
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-2">
        {BIG_CUBES.map((cube) => (
          <button
            key={cube.id}
            onClick={() => setSize(cube.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              size === cube.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
            }`}
          >
            {cube.label}
          </button>
        ))}
      </div>
      <NotationTab
        key={size}
        puzzle={size}
        sections={bigCubeSections(size)}
        example={{
          alg: "Rw U2 Rw' U2 3R F Rw2 U' Rw'",
          label: "Click to animate a wide-move sequence",
        }}
      />
    </div>
  )
}

export default function NotationPage() {
  return (
    <div>
      <Navigation />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Cube Notation Guide</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Learn what each letter and symbol means when solving different cubes — every move is
            clickable and animates on a live 3D puzzle
          </p>
        </div>

        <Tabs defaultValue="3x3" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="3x3" className="py-1.5">
              3x3 Cube
            </TabsTrigger>
            <TabsTrigger value="2x2" className="py-1.5">
              2x2 Cube
            </TabsTrigger>
            <TabsTrigger value="big" className="py-1.5">
              Big Cubes
            </TabsTrigger>
            <TabsTrigger value="pyraminx" className="py-1.5">
              Pyraminx
            </TabsTrigger>
          </TabsList>

          <TabsContent value="3x3" className="mt-6">
            <NotationTab
              puzzle="333"
              sections={SECTIONS_333}
              example={{
                alg: "R U R' U' R' F R2 U' R' U' R U R' F'",
                label: "Click to animate this algorithm (T-Perm)",
              }}
            />
          </TabsContent>

          <TabsContent value="2x2" className="mt-6">
            <NotationTab
              puzzle="222"
              sections={SECTIONS_222}
              example={{
                alg: "R U R' U' F' U F R2",
                label: "Click to animate a short 2x2 sequence",
              }}
            />
          </TabsContent>

          <TabsContent value="big" className="mt-6">
            <BigCubesTab />
          </TabsContent>

          <TabsContent value="pyraminx" className="mt-6">
            <NotationTab
              puzzle="pyraminx"
              sections={SECTIONS_PYRAMINX}
              example={{
                alg: "U R' L B l' r' b u",
                label: "Click to animate — note the mix of face turns and tips",
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
