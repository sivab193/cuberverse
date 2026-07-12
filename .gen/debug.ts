import { NxnCube } from "../lib/puzzle/nxn"
import { parseSequence } from "../lib/puzzle/notation"

type Face = "U" | "R" | "F" | "D" | "L" | "B"
const FACES: Face[] = ["U", "R", "F", "D", "L", "B"]

const FREE = new Set<string>()
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) FREE.add(`U:${r}:${c}`)
for (const f of ["F", "R", "B", "L"]) for (let c = 0; c < 3; c++) FREE.add(`${f}:0:${c}`)
for (const s of ["F:1:2", "F:2:2", "R:1:0", "R:2:0", "D:0:2"]) FREE.add(s)

const cube = NxnCube.solved(3)
cube.applyMoves(parseSequence("R U' R'", "333"))

console.log("Facelets after R U' R':", cube.toFaceletString())
for (const face of FACES) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const color = cube.getSticker(face, r, c)
      if (color !== face) {
        console.log(`${face}(${r},${c}) = ${color}  free=${FREE.has(`${face}:${r}:${c}`)}`)
      }
    }
  }
}
