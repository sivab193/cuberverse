import type { Algorithm } from "./schema"

/**
 * Hand-authored sets that complement the imported jperm.net data
 * (sets.gen.ts): the beginner-method walkthrough steps carried over from the
 * original site (ids preserved so existing user progress survives), basic
 * F2L inserts, and a machine-verified pyraminx last-layer set — pyraminx
 * algorithms aren't covered by jperm.net, so these were found by
 * brute-force search on the lib/puzzle model (.gen/pyra-search).
 */

export const beginnerAlgorithms: Algorithm[] = [
  // --- 3x3 beginner method (legacy ids kept; earlier stages added so the
  //     method reads as a complete path: cross → corners → middle → last layer) ---
  {
    id: "beginner-daisy",
    name: "Daisy to Cross",
    cubeType: "3x3",
    method: "Beginners",
    category: "Cross",
    algorithm: "F2",
    difficulty: 1,
    description:
      "Build a daisy — four white edges around the yellow center — then drop each one into place.",
    recognition:
      "A white edge sits on the top face and its other color matches the center below it. Turn that face twice.",
  },
  {
    id: "beginner-cross-edge-up",
    name: "Lift an Edge into the Daisy",
    cubeType: "3x3",
    method: "Beginners",
    category: "Cross",
    algorithm: "F",
    difficulty: 1,
    description: "Bring a white edge from the middle or bottom up to the yellow center.",
    recognition:
      "A white edge is anywhere but the top. Turn its face until the edge reaches the top — if the slot above is taken, turn U first.",
  },
  {
    id: "beginner-corner-right",
    name: "First Layer Corner (Right)",
    cubeType: "3x3",
    method: "Beginners",
    category: "First Layer",
    algorithm: "R U R' U'",
    difficulty: 1,
    description:
      "The workhorse trigger. With the corner above its slot, repeat until the white sticker drops in.",
    recognition:
      "The white corner is in the top layer, directly above the slot it belongs in, on your right.",
  },
  {
    id: "beginner-corner-left",
    name: "First Layer Corner (Left)",
    cubeType: "3x3",
    method: "Beginners",
    category: "First Layer",
    algorithm: "L' U' L U",
    difficulty: 1,
    description: "Mirror of the right-hand trigger, for a corner above the left slot.",
    recognition: "The white corner sits above its slot on your left.",
  },
  {
    id: "beginner-corner-eject",
    name: "Free a Stuck Corner",
    cubeType: "3x3",
    method: "Beginners",
    category: "First Layer",
    algorithm: "R U R'",
    difficulty: 1,
    description: "Pops a corner out of the bottom layer so you can re-insert it the right way up.",
    recognition:
      "A white corner is already in the bottom layer but twisted, or in the wrong slot entirely.",
  },
  {
    id: "beginner-middle",
    name: "Second Layer — To Right Side",
    cubeType: "3x3",
    method: "Beginners",
    category: "Second Layer",
    algorithm: "U R U' R' U' F' U F",
    description: "Insert middle layer edges to the right side.",
  },
  {
    id: "beginner-middle-left",
    name: "Second Layer — To Left Side",
    cubeType: "3x3",
    method: "Beginners",
    category: "Second Layer",
    algorithm: "U' L' U L U F U' F'",
    description: "Insert middle layer edges to the left side.",
  },
  {
    id: "beginner-third-layer-plus",
    name: "Third Layer — Yellow Cross",
    cubeType: "3x3",
    method: "Beginners",
    category: "Third Layer",
    algorithm: "F R U R' U' F'",
    description: "Make a plus (cross) on the last layer.",
  },
  {
    id: "beginner-alignment-plus",
    name: "Align the Cross",
    cubeType: "3x3",
    method: "Beginners",
    category: "Third Layer",
    algorithm: "R U R' U R U2 R'",
    description: "Cycle the cross edges until they match the side centers.",
  },
  {
    id: "beginner-correction-corners",
    name: "Position the Corners",
    cubeType: "3x3",
    method: "Beginners",
    category: "Third Layer",
    algorithm: "U R U' L' U R' U' L",
    description: "Move last-layer corners to their correct positions.",
  },
  {
    id: "beginner-final-part",
    name: "Orient the Corners",
    cubeType: "3x3",
    method: "Beginners",
    category: "Third Layer",
    algorithm: "R' D' R D",
    description: "Repeat for each corner (with U turns in between) to finish the cube.",
  },

  // --- Basic F2L inserts (legacy ids; full 41-case F2L is a planned set) ---
  {
    id: "f2l-1",
    name: "F2L: Split Pair (Right)",
    cubeType: "3x3",
    method: "CFOP",
    category: "F2L",
    algorithm: "U R U' R'",
    description: "Basic corner-edge pair insertion.",
  },
  {
    id: "f2l-2",
    name: "F2L: Pair Over Slot",
    cubeType: "3x3",
    method: "CFOP",
    category: "F2L",
    algorithm: "R U R'",
    description: "Corner above edge — both facing out.",
  },
  {
    id: "f2l-3",
    name: "F2L: Separated Pair",
    cubeType: "3x3",
    method: "CFOP",
    category: "F2L",
    algorithm: "U' R U' R' U R U R'",
    description: "Corner and edge separated on top.",
  },
  {
    id: "f2l-4",
    name: "F2L: Simple Insert",
    cubeType: "3x3",
    method: "CFOP",
    category: "F2L",
    algorithm: "R U' R'",
    description: "Simple insertion from the top layer.",
  },

  // --- 2x2 beginner steps (legacy ids; full sets come from jperm data) ---
  {
    id: "2x2-layer",
    name: "First Layer",
    cubeType: "2x2",
    method: "Beginners",
    category: "Layer 1",
    algorithm: "R U R' U'",
    description: "Solve the first layer — repeat to drop corners in.",
  },
  {
    id: "2x2-adjacent",
    name: "Swap Adjacent Corners",
    cubeType: "2x2",
    method: "Beginners",
    category: "Last Layer",
    algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'",
    description: "Swap two adjacent top corners (T-perm).",
  },
]

const PYRAMINX_LL: { alg: string; description: string }[] = [
  { alg: "L U R U' R' L'", description: "Cycle all three top edges (variant 1)." },
  { alg: "L R U R' U' L'", description: "Cycle all three top edges (variant 2)." },
  { alg: "R U B U' B' R'", description: "Cycle all three top edges (variant 3)." },
  { alg: "R B U B' U' R'", description: "Cycle all three top edges (variant 4)." },
  { alg: "B U L U' L' B'", description: "Cycle all three top edges (variant 5)." },
  { alg: "B L U L' U' B'", description: "Cycle all three top edges (variant 6)." },
  { alg: "L U L' U L U L'", description: "Cycle top edges clockwise with flips (Sune-like)." },
  { alg: "L U' L' U' L U' L'", description: "Cycle top edges counter-clockwise with flips (anti-Sune-like)." },
  { alg: "U L U' R U' R' U L'", description: "Cycle with two flipped edges (variant 1)." },
  { alg: "U R U' B U' B' U R'", description: "Cycle with two flipped edges (variant 2)." },
  { alg: "U B U' L U' L' U B'", description: "Cycle with two flipped edges (variant 3)." },
]

export const pyraminxAlgorithms: Algorithm[] = [
  {
    id: "pyra-tips",
    name: "Solve the Tips",
    cubeType: "pyraminx",
    method: "Beginners",
    category: "Tips",
    algorithm: "u l r b",
    description: "Turn each tip individually to match its center — always the last (or first) step.",
  },
  {
    id: "pyra-top-layer",
    name: "First Layer Edges",
    cubeType: "pyraminx",
    method: "Beginners",
    category: "Layer 1",
    algorithm: "R' L R L'",
    description: "Insert bottom-layer edges around the solved centers.",
  },
  {
    id: "pyra-last-layer",
    name: "Last Layer Cycle",
    cubeType: "pyraminx",
    method: "Beginners",
    category: "Last Layer",
    algorithm: "R U R' U R U R'",
    description: "Cycle the last-layer edges to finish.",
  },
  {
    id: "pyra-v",
    name: "V Case",
    cubeType: "pyraminx",
    method: "Beginners",
    category: "Last Layer",
    algorithm: "R' L R L' U L' U L",
    description: "V-shaped last-layer case.",
  },
  // Machine-verified shortest solutions for every distinct last-layer edge
  // state (11 cases, brute-force search over the lib/puzzle model).
  ...PYRAMINX_LL.map(
    ({ alg, description }, i): Algorithm => ({
      id: `pyra-ll-${i + 1}`,
      name: `Last Layer Case ${i + 1}`,
      cubeType: "pyraminx",
      method: "L4E",
      category: "Last Layer",
      group: alg.split(" ").length <= 6 ? "Pure cycles" : "Cycles with flips",
      algorithm: alg,
      description: `${description} Optimal (${alg.split(" ").length} moves, machine-verified).`,
    }),
  ),
]

export const extraAlgorithms: Algorithm[] = [
  ...beginnerAlgorithms,
  ...pyraminxAlgorithms,
]
