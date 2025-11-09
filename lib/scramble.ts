export type Move = string

const moves3x3: string[] = [
  "R",
  "R'",
  "R2",
  "L",
  "L'",
  "L2",
  "U",
  "U'",
  "U2",
  "D",
  "D'",
  "D2",
  "F",
  "F'",
  "F2",
  "B",
  "B'",
  "B2",
]
const moves2x2: string[] = ["R", "R'", "R2", "U", "U'", "U2", "F", "F'", "F2"]

export function generateScramble(cubeType = "3x3", length = 20): Move[] {
  const moveSet = cubeType === "2x2" ? moves2x2 : moves3x3
  const scramble: Move[] = []
  let lastMove = ""
  let lastAxis = ""

  for (let i = 0; i < length; i++) {
    let move: string
    let moveAxis: string

    do {
      move = moveSet[Math.floor(Math.random() * moveSet.length)]
      moveAxis = move[0]
    } while (
      move === lastMove ||
      (moveAxis === lastAxis && ["R", "L"].includes(moveAxis)) ||
      (moveAxis === lastAxis && ["U", "D"].includes(moveAxis)) ||
      (moveAxis === lastAxis && ["F", "B"].includes(moveAxis))
    )

    scramble.push(move)
    lastMove = move
    lastAxis = moveAxis
  }

  return scramble
}

export function scrambleToString(scramble: Move[]): string {
  return scramble.join(" ")
}
