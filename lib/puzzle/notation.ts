import { PUZZLES, type ParsedMove, type PuzzleId } from "./types"

export class NotationError extends Error {
  constructor(
    message: string,
    public readonly token: string,
    public readonly index: number,
  ) {
    super(`${message} (token "${token}" at position ${index})`)
    this.name = "NotationError"
  }
}

const NXN_FACES = "URFDLB"
const NXN_TOKEN_RE = /^(\d+)?([URFDLB]|[urfdlb]|[MES]|[xyz])(w?)(2?)('?)$/
const PYRAMINX_TOKEN_RE = /^([ULRB]|[ulrb])(')?$/

function parseNxnToken(token: string, index: number, n: number): ParsedMove {
  const match = NXN_TOKEN_RE.exec(token)
  if (!match) {
    throw new NotationError("Unrecognized move", token, index)
  }
  const [, prefixStr, letter, wide, double, prime] = match
  const prefix = prefixStr ? Number.parseInt(prefixStr, 10) : undefined

  let amount = double ? 2 : 1
  if (prime) amount = -amount

  let family: string
  let fromLayer: number
  let toLayer: number

  if (NXN_FACES.includes(letter)) {
    family = letter
    if (wide) {
      toLayer = prefix ?? 2
      fromLayer = 1
      if (toLayer < 2 || toLayer > n) {
        throw new NotationError(`Wide move depth must be between 2 and ${n}`, token, index)
      }
    } else if (prefix !== undefined) {
      // Single inner layer, e.g. 3R
      if (prefix < 1 || prefix > n) {
        throw new NotationError(`Layer index must be between 1 and ${n}`, token, index)
      }
      fromLayer = prefix
      toLayer = prefix
    } else {
      fromLayer = 1
      toLayer = 1
    }
  } else if (NXN_FACES.toLowerCase().includes(letter)) {
    // Lowercase face letter is shorthand for a 2-layer wide move (SiGN)
    if (prefix !== undefined || wide) {
      throw new NotationError("Lowercase wide moves take no prefix or w", token, index)
    }
    family = letter.toUpperCase()
    fromLayer = 1
    toLayer = 2
  } else if ("MES".includes(letter)) {
    if (prefix !== undefined || wide) {
      throw new NotationError("Slice moves take no prefix or w", token, index)
    }
    family = letter
    if (n % 2 === 0) {
      // Even cubes have no single middle layer; by the common big-cube
      // convention (e.g. jperm.net's 4x4 algs) M/E/S turn the middle pair.
      fromLayer = n / 2
      toLayer = n / 2 + 1
    } else {
      fromLayer = (n + 1) / 2
      toLayer = (n + 1) / 2
    }
  } else {
    // x y z rotations
    if (prefix !== undefined || wide) {
      throw new NotationError("Rotations take no prefix or w", token, index)
    }
    family = letter
    fromLayer = 1
    toLayer = n
  }

  return { family, fromLayer, toLayer, amount }
}

function parsePyraminxToken(token: string, index: number): ParsedMove {
  const match = PYRAMINX_TOKEN_RE.exec(token)
  if (!match) {
    throw new NotationError("Unrecognized pyraminx move", token, index)
  }
  const [, letter, prime] = match
  const isTip = letter === letter.toLowerCase()
  return {
    family: letter,
    fromLayer: 1,
    toLayer: isTip ? 1 : 2,
    amount: prime ? -1 : 1,
  }
}

export function parseMove(token: string, puzzle: PuzzleId, index = 0): ParsedMove {
  const meta = PUZZLES[puzzle]
  if (meta.kind === "pyraminx") {
    return parsePyraminxToken(token, index)
  }
  return parseNxnToken(token, index, meta.n)
}

export function parseSequence(input: string, puzzle: PuzzleId): ParsedMove[] {
  const tokens = input.trim().split(/\s+/).filter(Boolean)
  return tokens.map((token, index) => parseMove(token, puzzle, index))
}

export function invertMoves(moves: ParsedMove[]): ParsedMove[] {
  return [...moves].reverse().map((move) => ({ ...move, amount: -move.amount }))
}

export function invertAlg(alg: string, puzzle: PuzzleId): string {
  return movesToString(invertMoves(parseSequence(alg, puzzle)), puzzle)
}

export function moveToString(move: ParsedMove, puzzle?: PuzzleId): string {
  const { family, fromLayer, toLayer, amount } = move

  // Pyraminx moves and slice/rotation families keep their letter as-is
  let base: string
  if (
    puzzle === "pyraminx" ||
    family === family.toLowerCase() ||
    "MES".includes(family) ||
    "xyz".includes(family)
  ) {
    base = family
  } else if (fromLayer === 1 && toLayer === 1) {
    base = family
  } else if (fromLayer === 1 && toLayer === 2) {
    base = `${family}w`
  } else if (fromLayer === 1) {
    base = `${toLayer}${family}w`
  } else if (fromLayer === toLayer) {
    base = `${fromLayer}${family}`
  } else {
    base = family
  }

  const magnitude = Math.abs(amount)
  const suffix = `${magnitude === 2 ? "2" : ""}${amount < 0 ? "'" : ""}`
  return base + suffix
}

export function movesToString(moves: ParsedMove[], puzzle?: PuzzleId): string {
  return moves.map((move) => moveToString(move, puzzle)).join(" ")
}
