import type { Algorithm } from "./schema"

const oll = (
  id: string,
  name: string,
  group: string,
  algorithm: string,
  description: string,
  extra?: Partial<Algorithm>,
): Algorithm => ({
  id,
  name,
  cubeType: "3x3",
  method: "CFOP",
  category: "OLL",
  group,
  algorithm,
  description,
  probability: extra?.probability ?? "1/54",
  ...extra,
})

/**
 * All 57 OLL cases, grouped by shape family. Verified: each preserves F2L
 * and leaves the U face fully oriented. IDs oll-sune, oll-antisune, oll-1,
 * oll-2, oll-pi, oll-h and oll-l are kept from the previous dataset so
 * existing user progress carries over.
 */
export const oll333: Algorithm[] = [
  // --- Dot cases (no edges oriented) ---
  oll("oll-1", "OLL 1 (Runway)", "Dot", "R U2 R2 F R F' U2 R' F R F'", "Dot case with no oriented stickers on the sides facing you.", { difficulty: 3 }),
  oll("oll-02", "OLL 2 (Zamboni)", "Dot", "F R U R' U' F' f R U R' U' f'", "Dot case — double F-sexy with a wide second half.", { difficulty: 3 }),
  oll("oll-03", "OLL 3", "Dot", "f R U R' U' f' U' F R U R' U' F'", "Dot with one corner oriented, lightning on the left.", { difficulty: 3 }),
  oll("oll-04", "OLL 4", "Dot", "f R U R' U' f' U F R U R' U' F'", "Mirror of OLL 3.", { difficulty: 3 }),
  oll("oll-17", "OLL 17", "Dot", "R U R' U R' F R F' U2 R' F R F'", "Dot with two diagonal corners oriented.", { difficulty: 3 }),
  oll("oll-18", "OLL 18", "Dot", "r U R' U R U2 r2 U' R U' R' U2 r", "Dot with two adjacent corners oriented facing front.", { difficulty: 4 }),
  oll("oll-19", "OLL 19", "Dot", "M U R U R' U' M' R' F R F'", "Dot with two adjacent corners oriented facing out.", { difficulty: 3 }),
  oll("oll-20", "OLL 20 (Checkers)", "Dot", "M U R U R' U' M2 U R U' r'", "Dot with all four corners oriented.", { difficulty: 3, probability: "1/216" }),

  // --- Square shapes ---
  oll("oll-05", "OLL 5 (Lefty Square)", "Square", "r' U2 R U R' U r", "Square block in the back-left.", { difficulty: 1 }),
  oll("oll-06", "OLL 6 (Righty Square)", "Square", "r U2 R' U' R U' r'", "Square block in the back-right.", { difficulty: 1 }),

  // --- Small lightning bolts ---
  oll("oll-07", "OLL 7 (Lightning)", "Small lightning", "r U R' U R U2 r'", "Small lightning bolt, wide Sune.", { difficulty: 1 }),
  oll("oll-08", "OLL 8 (Reverse Lightning)", "Small lightning", "r' U' R U' R' U2 r", "Mirror of OLL 7, wide Anti-Sune.", { difficulty: 1 }),
  oll("oll-11", "OLL 11", "Small lightning", "r U R' U R' F R F' R U2 r'", "Lightning bolt with an extra oriented corner.", { difficulty: 3 }),
  oll("oll-12", "OLL 12", "Small lightning", "F R U R' U' F' U F R U R' U' F'", "Mirror of OLL 11.", { difficulty: 3 }),

  // --- Fish shapes ---
  oll("oll-09", "OLL 9 (Kite)", "Fish", "R U R' U' R' F R2 U R' U' F'", "Fish shape pointing to the front-left.", { difficulty: 3 }),
  oll("oll-10", "OLL 10 (Anti-Kite)", "Fish", "R U R' U R' F R F' R U2 R'", "Fish shape pointing to the back-right.", { difficulty: 3 }),
  oll("oll-35", "OLL 35 (Fish Salad)", "Fish", "R U2 R2 F R F' R U2 R'", "Fish with the oriented corners diagonal.", { difficulty: 2 }),
  oll("oll-37", "OLL 37 (Mounted Fish)", "Fish", "F R' F' R U R U' R'", "Fish built around a solved corner-edge pair.", { difficulty: 1 }),

  // --- Knight move shapes ---
  oll("oll-13", "OLL 13 (Gun)", "Knight move", "F U R U' R2 F' R U R U' R'", "Knight-move shape, bar at the front-left.", { difficulty: 3 }),
  oll("oll-14", "OLL 14 (Anti-Gun)", "Knight move", "R' F R U R' F' R F U' F'", "Mirror of OLL 13.", { difficulty: 3 }),
  oll("oll-15", "OLL 15 (Squeegee)", "Knight move", "r' U' r R' U' R U r' U r", "Knight-move with bar at the back-left.", { difficulty: 2 }),
  oll("oll-16", "OLL 16 (Anti-Squeegee)", "Knight move", "r U r' R U R' U' r U' r'", "Mirror of OLL 15.", { difficulty: 2 }),

  // --- Cross (all edges oriented) ---
  oll("oll-h", "OLL 21 (Double Sune)", "Cross", "R U2 R' U' R U R' U' R U' R'", "Cross with no corners oriented — headlights on two sides.", { difficulty: 1, probability: "1/108" }),
  oll("oll-pi", "OLL 22 (Pi)", "Cross", "R U2 R2 U' R2 U' R2 U2 R", "Cross with no corners oriented — headlights on one side.", { difficulty: 1 }),
  oll("oll-23", "OLL 23 (Headlights)", "Cross", "R2 D R' U2 R D' R' U2 R'", "Cross with two back corners oriented.", { difficulty: 1 }),
  oll("oll-24", "OLL 24 (Chameleon)", "Cross", "r U R' U' r' F R F'", "Cross with two adjacent corners flipped outward.", { difficulty: 1 }),
  oll("oll-25", "OLL 25 (Bowtie)", "Cross", "F' r U R' U' r' F R", "Cross with two diagonal corners flipped.", { difficulty: 1 }),
  oll("oll-antisune", "OLL 26 (Anti-Sune)", "Cross", "R U2 R' U' R U' R'", "Cross with one oriented corner — headlights face left.", { difficulty: 1 }),
  oll("oll-sune", "OLL 27 (Sune)", "Cross", "R U R' U R U2 R'", "Cross with one oriented corner — the most famous OLL.", { difficulty: 1 }),

  // --- Corners oriented ---
  oll("oll-28", "OLL 28 (Stealth)", "Corners oriented", "r U R' U' M U R U' R'", "All corners oriented, two adjacent edges flipped.", { difficulty: 1, probability: "1/108" }),
  oll("oll-57", "OLL 57 (Mummy)", "Corners oriented", "R U R' U' M' U R U' r'", "All corners oriented, two opposite edges flipped.", { difficulty: 1, probability: "1/108" }),

  // --- Awkward shapes ---
  oll("oll-29", "OLL 29", "Awkward", "R U R' U' R U' R' F' U' F R U R'", "Awkward shape with the oriented corners adjacent.", { difficulty: 4 }),
  oll("oll-30", "OLL 30", "Awkward", "F U R U2 R' U' R U2 R' U' F'", "Mirror of OLL 29.", { difficulty: 3 }),
  oll("oll-41", "OLL 41", "Awkward", "R U R' U R U2 R' F R U R' U' F'", "Awkward shape — Sune into F-sexy.", { difficulty: 2 }),
  oll("oll-42", "OLL 42", "Awkward", "R' U' R U' R' U2 R F R U R' U' F'", "Mirror of OLL 41.", { difficulty: 2 }),

  // --- P shapes ---
  oll("oll-31", "OLL 31", "P", "R' U' F U R U' R' F' R", "P shape with the bar on the right, couch variant.", { difficulty: 2 }),
  oll("oll-32", "OLL 32", "P", "L U F' U' L' U L F L'", "Mirror of OLL 31.", { difficulty: 2 }),
  oll("oll-43", "OLL 43 (Anti-P)", "P", "F' U' L' U L F", "P shape pointing left — inverse F-sexy with the left hand.", { difficulty: 1 }),
  oll("oll-44", "OLL 44 (P)", "P", "F U R U' R' F'", "P shape pointing right — one-handed favourite.", { difficulty: 1 }),

  // --- T shapes ---
  oll("oll-33", "OLL 33 (Key)", "T", "R U R' U' R' F R F'", "T shape — sexy move plus sledgehammer.", { difficulty: 1 }),
  oll("oll-2", "OLL 45 (Suit Up)", "T", "F R U R' U' F'", "T shape — the classic F-sexy trigger everyone learns first.", { difficulty: 1 }),

  // --- C shapes ---
  oll("oll-34", "OLL 34 (City)", "C", "R U R2 U' R' F R U R U' F'", "C shape lying on its back.", { difficulty: 3 }),
  oll("oll-46", "OLL 46 (Seein' Headlights)", "C", "R' U' R' F R F' U R", "C shape standing upright.", { difficulty: 1 }),

  // --- W shapes ---
  oll("oll-36", "OLL 36 (Wario)", "W", "L' U' L U' L' U L U L F' L' F", "W shape running back-left to front-right.", { difficulty: 3 }),
  oll("oll-38", "OLL 38 (Mario)", "W", "R U R' U R U' R' U' R' F R F'", "Mirror of OLL 36.", { difficulty: 3 }),

  // --- Big lightning bolts ---
  oll("oll-39", "OLL 39 (Big Lightning)", "Big lightning", "L F' L' U' L U F U' L'", "Large lightning bolt with the tail at the back.", { difficulty: 2 }),
  oll("oll-40", "OLL 40 (Anti-Big Lightning)", "Big lightning", "R' F R U R' U' F' U R", "Mirror of OLL 39.", { difficulty: 2 }),

  // --- L shapes ---
  oll("oll-47", "OLL 47", "L", "F' L' U' L U L' U' L U F", "Small L with both bars facing away.", { difficulty: 3 }),
  oll("oll-l", "OLL 48", "L", "F R U R' U' R U R' U' F'", "Small L — double sexy inside F.", { difficulty: 1 }),
  oll("oll-49", "OLL 49", "L", "r U' r2 U r2 U r2 U' r", "Small L with the corner pointing back-right.", { difficulty: 3 }),
  oll("oll-50", "OLL 50", "L", "r' U r2 U' r2 U' r2 U r'", "Mirror of OLL 49.", { difficulty: 3 }),
  oll("oll-53", "OLL 53", "L", "r' U' R U' R' U R U' R' U2 r", "Small L with both flipped edges adjacent to the block.", { difficulty: 3 }),
  oll("oll-54", "OLL 54", "L", "r U R' U R U' R' U R U2 r'", "Mirror of OLL 53.", { difficulty: 3 }),

  // --- Line shapes ---
  oll("oll-51", "OLL 51 (Bottlecap)", "Line", "f R U R' U' R U R' U' f'", "Line with double sexy inside wide f.", { difficulty: 2 }),
  oll("oll-52", "OLL 52 (Rice Cooker)", "Line", "R U R' U R U' B U' B' R'", "Line with the flipped edges vertical.", { difficulty: 3 }),
  oll("oll-55", "OLL 55 (Highway)", "Line", "R U2 R2 U' R U' R' U2 F R F'", "Straight line through the middle, corners diagonal.", { difficulty: 4, probability: "1/108" }),
  oll("oll-56", "OLL 56 (Streetlights)", "Line", "r' U' r U' R' U R U' R' U R r' U r", "Straight line with all corners flipped outward.", { difficulty: 4, probability: "1/108" }),
]
