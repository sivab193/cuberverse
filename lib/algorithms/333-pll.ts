import type { Algorithm } from "./schema"

const pll = (
  id: string,
  name: string,
  group: string,
  algorithm: string,
  probability: string,
  description: string,
  extra?: Partial<Algorithm>,
): Algorithm => ({
  id,
  name,
  cubeType: "3x3",
  method: "CFOP",
  category: "PLL",
  group,
  algorithm,
  probability,
  description,
  ...extra,
})

/** All 21 PLL cases. Verified: each permutes only the U layer. */
export const pll333: Algorithm[] = [
  // --- Edges only ---
  pll("pll-h", "H Perm", "Edges only", "M2 U M2 U2 M2 U M2", "1/72",
    "Swaps both pairs of opposite edges.", { difficulty: 1, recognition: "All four side faces show bars with opposite-color centers." }),
  pll("pll-uperm", "Ua Perm", "Edges only", "R U' R U R U R U' R' U' R2", "1/18",
    "Cycles three edges counter-clockwise, leaving the back edge solved.", {
      difficulty: 1,
      alternatives: ["M2 U M U2 M' U M2"],
      recognition: "One solved side (headlights with matching edge) at the back.",
    }),
  pll("pll-ub", "Ub Perm", "Edges only", "R2 U R U R' U' R' U' R' U R'", "1/18",
    "Cycles three edges clockwise, leaving the back edge solved.", {
      difficulty: 1,
      alternatives: ["M2 U' M U2 M' U' M2"],
      recognition: "One solved side at the back, other edges cycled the opposite way to Ua.",
    }),
  pll("pll-z", "Z Perm", "Edges only", "M' U M2 U M2 U M' U2 M2", "1/36",
    "Swaps two pairs of adjacent edges.", { difficulty: 2, recognition: "Every side shows a two-color checker pattern." }),

  // --- Corners only ---
  pll("pll-aa", "Aa Perm", "Corners only", "x R' U R' D2 R U' R' D2 R2 x'", "1/18",
    "Cycles three corners clockwise.", { difficulty: 2, recognition: "Headlights on one side; the corner cycle runs clockwise." }),
  pll("pll-ab", "Ab Perm", "Corners only", "x R2 D2 R U R' D2 R U' R x'", "1/18",
    "Cycles three corners counter-clockwise.", { difficulty: 2, recognition: "Headlights on one side; cycle runs counter-clockwise." }),
  pll("pll-e", "E Perm", "Corners only", "x' R U' R' D R U R' D' R U R' D R U' R' D' x", "1/36",
    "Swaps both pairs of diagonal corners, edges stay solved.", { difficulty: 4, recognition: "No headlights anywhere; all edges match their centers." }),

  // --- Adjacent corner swap ---
  pll("pll-tperm", "T Perm", "Adjacent swap", "R U R' U' R' F R2 U' R' U' R U R' F'", "1/18",
    "Swaps two adjacent corners and two opposite edges.", { difficulty: 1, recognition: "Headlights on the left face only, with a bar on the right." }),
  pll("pll-f", "F Perm", "Adjacent swap", "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R", "1/18",
    "T Perm with the edge swap adjacent instead of opposite.", { difficulty: 4, recognition: "One solved column on the front; headlights facing you." }),
  pll("pll-ja", "Ja Perm", "Adjacent swap", "R' U L' U2 R U' R' U2 R L", "1/18",
    "Swaps two adjacent corners and two adjacent edges (left block).", { difficulty: 2, recognition: "A solved 2x1 block; the swap sits to its left." }),
  pll("pll-jb", "Jb Perm", "Adjacent swap", "R U R' F' R U R' U' R' F R2 U' R'", "1/18",
    "Mirror of Ja — solved block with the swap on the right.", { difficulty: 1, recognition: "A solved 2x1 block; the swap sits to its right." }),
  pll("pll-ra", "Ra Perm", "Adjacent swap", "R U' R' U' R U R D R' U' R D' R' U2 R'", "1/18",
    "Adjacent corner swap with an opposite edge swap variant.", { difficulty: 3, recognition: "Headlights on the left; edge bar hidden at the back." }),
  pll("pll-rb", "Rb Perm", "Adjacent swap", "R2 F R U R U' R' F' R U2 R' U2 R", "1/18",
    "Mirror of Ra.", { difficulty: 3, recognition: "Headlights on the right; edge bar hidden at the back." }),
  pll("pll-ga", "Ga Perm", "Adjacent swap", "R2 U R' U R' U' R U' R2 U' D R' U R D'", "1/18",
    "Double 3-cycle: corners clockwise, edges counter-clockwise.", { difficulty: 3, recognition: "Headlights on one side; no solved edge bar." }),
  pll("pll-gb", "Gb Perm", "Adjacent swap", "R' U' R U D' R2 U R' U R U' R U' R2 D", "1/18",
    "Double 3-cycle: corners counter-clockwise, edges clockwise.", { difficulty: 3, recognition: "Headlights adjacent to the solved-ish corner pair." }),
  pll("pll-gc", "Gc Perm", "Adjacent swap", "R2 U' R U' R U R' U R2 U D' R U' R' D", "1/18",
    "Inverse of Ga.", { difficulty: 3, recognition: "Headlights pattern mirrored from Ga." }),
  pll("pll-gd", "Gd Perm", "Adjacent swap", "R U R' U' D R2 U' R U' R' U R' U R2 D'", "1/18",
    "Inverse of Gb.", { difficulty: 3, recognition: "Headlights pattern mirrored from Gb." }),

  // --- Diagonal corner swap ---
  pll("pll-yperm", "Y Perm", "Diagonal swap", "F R U' R' U' R U R' F' R U R' U' R' F R F'", "1/18",
    "Swaps two diagonal corners and two adjacent edges.", { difficulty: 2, recognition: "No headlights; one pair of adjacent faces each show a corner-edge bar." }),
  pll("pll-v", "V Perm", "Diagonal swap", "R' U R' U' y R' F' R2 U' R' U R' F R F", "1/18",
    "Diagonal corner swap with adjacent edge swap.", { difficulty: 3, recognition: "No headlights; a solved 2x1 block points at the swapped corners." }),
  pll("pll-na", "Na Perm", "Diagonal swap", "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'", "1/72",
    "Swaps diagonal corners and opposite edges (left-leaning).", { difficulty: 4, recognition: "Both left and right faces show identical two-color bars." }),
  pll("pll-nb", "Nb Perm", "Diagonal swap", "R' U R U' R' F' U' F R U R' F R' F' R U' R", "1/72",
    "Mirror of Na.", { difficulty: 4, recognition: "Same as Na but leaning the other way." }),
]
