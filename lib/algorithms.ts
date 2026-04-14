export type CubeType = "2x2" | "3x3" | "pyraminx"
export type MethodType = "CFOP" | "Beginners"

export interface Algorithm {
  id: string
  name: string
  cubeType: CubeType
  method: MethodType
  category: string
  algorithm: string
  setup?: string
  description: string
  visualization?: string
}

export const algorithms: Algorithm[] = [
  // 3x3 CFOP Algorithms - OLL
  {
    id: "oll-sune",
    name: "Sune",
    cubeType: "3x3",
    method: "CFOP",
    category: "OLL",
    algorithm: "R U R' U R U2 R'",
    description: "Most common OLL case - headlights on right",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "oll-antisune",
    name: "Anti-Sune",
    cubeType: "3x3",
    method: "CFOP",
    category: "OLL",
    algorithm: "R U2 R' U' R U' R'",
    description: "Headlights on left",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "oll-1",
    name: "OLL 1",
    cubeType: "3x3",
    method: "CFOP",
    category: "OLL",
    algorithm: "R U2 R2 F R F' U2 R' F R F'",
    description: "Cross pattern on top",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "oll-2",
    name: "OLL 2 (T-shape)",
    cubeType: "3x3",
    method: "CFOP",
    category: "OLL",
    algorithm: "F R U R' U' F'",
    description: "T-shape pattern - most common for making yellow cross",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "oll-pi",
    name: "OLL Pi",
    cubeType: "3x3",
    method: "CFOP",
    category: "OLL",
    algorithm: "R U2 R2 U' R2 U' R2 U2 R",
    description: "Pi shape on top",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "oll-h",
    name: "OLL H",
    cubeType: "3x3",
    method: "CFOP",
    category: "OLL",
    algorithm: "R U R' U R U' R' U R U2 R'",
    description: "H shape pattern",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "oll-l",
    name: "OLL L",
    cubeType: "3x3",
    method: "CFOP",
    category: "OLL",
    algorithm: "F R' F' r U R U' r'",
    description: "L shape pattern",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },

  // 3x3 CFOP Algorithms - PLL
  {
    id: "pll-tperm",
    name: "T Perm",
    cubeType: "3x3",
    method: "CFOP",
    category: "PLL",
    algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'",
    description: "Swaps two adjacent edges and two adjacent corners",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "pll-aa",
    name: "Aa Perm",
    cubeType: "3x3",
    method: "CFOP",
    category: "PLL",
    algorithm: "x R' U R' D2 R U' R' D2 R2 x'",
    description: "Cycles three corners clockwise",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "pll-ab",
    name: "Ab Perm",
    cubeType: "3x3",
    method: "CFOP",
    category: "PLL",
    algorithm: "x R2 D2 R U R' D2 R U' R x'",
    description: "Cycles three corners counter-clockwise",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "pll-uperm",
    name: "U Perm (Ua)",
    cubeType: "3x3",
    method: "CFOP",
    category: "PLL",
    algorithm: "R U' R U R U R U' R' U' R2",
    description: "Swaps two adjacent edges on one side",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "pll-ub",
    name: "U Perm (Ub)",
    cubeType: "3x3",
    method: "CFOP",
    category: "PLL",
    algorithm: "R2 U R U R' U' R' U' R' U R'",
    description: "Swaps two adjacent edges on opposite side",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "pll-yperm",
    name: "Y Perm",
    cubeType: "3x3",
    method: "CFOP",
    category: "PLL",
    algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    description: "Diagonal corner swap",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "pll-ja",
    name: "J Perm (Ja)",
    cubeType: "3x3",
    method: "CFOP",
    category: "PLL",
    algorithm: "x R2 F R F' R U2 r' U r U2 x'",
    description: "Swaps two adjacent corners and two edges",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "pll-jb",
    name: "J Perm (Jb)",
    cubeType: "3x3",
    method: "CFOP",
    category: "PLL",
    algorithm: "R U R' F' R U R' U' R' F R2 U' R'",
    description: "Opposite J perm case",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "pll-h",
    name: "H Perm",
    cubeType: "3x3",
    method: "CFOP",
    category: "PLL",
    algorithm: "M2 U M2 U2 M2 U M2",
    description: "Swaps opposite edges on two sides",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "pll-z",
    name: "Z Perm",
    cubeType: "3x3",
    method: "CFOP",
    category: "PLL",
    algorithm: "M' U M2 U M2 U M' U2 M2",
    description: "Diagonal edge swap",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },

  // 3x3 CFOP - F2L (Just a few common cases)
  {
    id: "f2l-1",
    name: "F2L Case 1",
    cubeType: "3x3",
    method: "CFOP",
    category: "F2L",
    algorithm: "U R U' R'",
    description: "Basic corner-edge pair insertion",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "f2l-2",
    name: "F2L Case 2",
    cubeType: "3x3",
    method: "CFOP",
    category: "F2L",
    algorithm: "R U R'",
    description: "Corner above edge - both facing out",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "f2l-3",
    name: "F2L Case 3",
    cubeType: "3x3",
    method: "CFOP",
    category: "F2L",
    algorithm: "U' R U' R' U R U R'",
    description: "Corner and edge separated",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },
  {
    id: "f2l-4",
    name: "F2L Case 4",
    cubeType: "3x3",
    method: "CFOP",
    category: "F2L",
    algorithm: "R U' R'",
    description: "Simple insertion from top",
    visualization: "YYYYYYBBB-BBRRR-RRR-GGG-GGGOOO-OOO",
  },

  // 3x3 Beginners Method
  {
    id: "beginner-middle",
    name: "Second Layer - To Right Side",
    cubeType: "3x3",
    method: "Beginners",
    category: "Second Layer",
    algorithm: "U R U' R' U' F' U F",
    description: "Insert middle layer edges to the right side",
  },
  {
    id: "beginner-middle-left",
    name: "Second Layer - To Left Side",
    cubeType: "3x3",
    method: "Beginners",
    category: "Second Layer",
    algorithm: "U' L' U L U F U' F'",
    description: "Insert middle layer edges to the left side",
  },
  {
    id: "beginner-third-layer-plus",
    name: "Third Layer - Plus on reverse side",
    cubeType: "3x3",
    method: "Beginners",
    category: "Third Layer",
    algorithm: "F R U R' U' F'",
    description: "Make a plus on the reverse side",
  },
  {
    id: "beginner-alignment-plus",
    name: "Alignment of plus",
    cubeType: "3x3",
    method: "Beginners",
    category: "Third Layer",
    algorithm: "R U R' U R U U R'",
    description: "Align the plus correctly",
  },
  {
    id: "beginner-correction-corners",
    name: "Correction of corner pieces",
    cubeType: "3x3",
    method: "Beginners",
    category: "Third Layer",
    algorithm: "U R U' L' U R' U' L",
    description: "Correctly place the corner pieces",
  },
  {
    id: "beginner-final-part",
    name: "Final Part",
    cubeType: "3x3",
    method: "Beginners",
    category: "Third Layer",
    algorithm: "R' D' R D",
    description: "Orient the corner pieces to finish the cube (repeat for all corners)",
  },

  // 2x2 Beginners Method
  {
    id: "2x2-layer",
    name: "First Layer",
    cubeType: "2x2",
    method: "Beginners",
    category: "Layer 1",
    algorithm: "R U R' U'",
    description: "Solve the first layer - basic insertion",
  },
  {
    id: "2x2-oll",
    name: "Orient Top Layer",
    cubeType: "2x2",
    method: "Beginners",
    category: "OLL",
    algorithm: "R U R' U R U2 R'",
    description: "Orient last layer on 2x2",
  },
  {
    id: "2x2-pbl",
    name: "Permute Both Layers",
    cubeType: "2x2",
    method: "Beginners",
    category: "PBL",
    algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'",
    description: "Permute both layers to solve",
  },
  {
    id: "2x2-adjacent",
    name: "Adjacent Corner Swap",
    cubeType: "2x2",
    method: "Beginners",
    category: "PBL",
    algorithm: "R U' R U R U R U' R' U' R2",
    description: "Swap two adjacent corners",
  },

  // Pyraminx Beginners Method
  {
    id: "pyra-tips",
    name: "Solve Tips",
    cubeType: "pyraminx",
    method: "Beginners",
    category: "Tips",
    algorithm: "U, L, R, B rotations",
    description: "First solve all 4 tips by turning them individually",
  },
  {
    id: "pyra-top-layer",
    name: "Top Layer Edges",
    cubeType: "pyraminx",
    method: "Beginners",
    category: "Layer 1",
    algorithm: "R' L R L'",
    description: "Solve top 3 edges",
  },
  {
    id: "pyra-last-layer",
    name: "Last Layer",
    cubeType: "pyraminx",
    method: "Beginners",
    category: "LL",
    algorithm: "R U R' U R U R'",
    description: "Complete the last layer of pyraminx",
  },
  {
    id: "pyra-v",
    name: "V Algorithm",
    cubeType: "pyraminx",
    method: "Beginners",
    category: "LL",
    algorithm: "R' L R L' U L' U L",
    description: "V-case for last layer",
  },
]

export function getAlgorithmsByMethod(method: MethodType): Algorithm[] {
  return algorithms.filter((algo) => algo.method === method)
}

export function getAlgorithmsByCube(cubeType: CubeType): Algorithm[] {
  return algorithms.filter((algo) => algo.cubeType === cubeType)
}

export function getAlgorithmsByCategory(category: string): Algorithm[] {
  return algorithms.filter((algo) => algo.category === category)
}
