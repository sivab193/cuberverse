export type Move = string

export type ScrambleCubeType = "2x2" | "3x3" | "pyraminx"

const FACES_3X3 = ["R", "L", "U", "D", "F", "B"]
const FACES_2X2 = ["R", "U", "F"]
const FACES_PYRAMINX = ["U", "L", "R", "B"]
const PYRAMINX_TIPS = ["u", "l", "r", "b"]

const SUFFIXES = ["", "'", "2"]
const PYRAMINX_SUFFIXES = ["", "'"]

// Opposite faces share an axis; avoid same face twice in a row and
// three same-axis moves in a row (e.g. R L R).
const AXIS_OF: Record<string, string> = {
  R: "x",
  L: "x",
  U: "y",
  D: "y",
  F: "z",
  B: "z",
}

const DEFAULT_LENGTHS: Record<ScrambleCubeType, number> = {
  "2x2": 10,
  "3x3": 20,
  pyraminx: 9,
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateFaceTurnScramble(faces: string[], suffixes: string[], length: number): Move[] {
  const scramble: Move[] = []
  let lastFace = ""
  let secondLastFace = ""

  for (let i = 0; i < length; i++) {
    let face: string
    do {
      face = pick(faces)
    } while (
      face === lastFace ||
      (AXIS_OF[face] !== undefined &&
        AXIS_OF[face] === AXIS_OF[lastFace] &&
        AXIS_OF[face] === AXIS_OF[secondLastFace])
    )

    scramble.push(face + pick(suffixes))
    secondLastFace = lastFace
    lastFace = face
  }

  return scramble
}

function generatePyraminxScramble(length: number): Move[] {
  const scramble = generateFaceTurnScramble(FACES_PYRAMINX, PYRAMINX_SUFFIXES, length)

  // WCA-style: random tip moves appended at the end (each tip at most once)
  for (const tip of PYRAMINX_TIPS) {
    const roll = Math.floor(Math.random() * 3)
    if (roll === 1) scramble.push(tip)
    else if (roll === 2) scramble.push(tip + "'")
  }

  return scramble
}

export function generateScramble(cubeType = "3x3", length?: number): Move[] {
  const type = (cubeType as ScrambleCubeType) in DEFAULT_LENGTHS ? (cubeType as ScrambleCubeType) : "3x3"
  const moveCount = length ?? DEFAULT_LENGTHS[type]

  switch (type) {
    case "2x2":
      return generateFaceTurnScramble(FACES_2X2, SUFFIXES, moveCount)
    case "pyraminx":
      return generatePyraminxScramble(moveCount)
    default:
      return generateFaceTurnScramble(FACES_3X3, SUFFIXES, moveCount)
  }
}

export function scrambleToString(scramble: Move[]): string {
  return scramble.join(" ")
}
