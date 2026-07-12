/**
 * Flat algorithm collection consumed by the app (algorithms page, home
 * stats, dashboard progress).
 *
 * The data lives in lib/algorithms/: sets.gen.ts is generated from
 * jperm.net's algorithm sets (see .gen/jperm-import.mts) and extras.ts
 * holds the hand-authored beginner-method and pyraminx sets. Everything is
 * parse-checked and semantically validated by
 * lib/algorithms/__tests__/data-integrity.test.ts.
 */

export type { Algorithm, CubeType, MethodType } from "./algorithms/schema"
export { CUBE_TYPE_TO_PUZZLE } from "./algorithms/schema"
export { ALGORITHM_SETS, type AlgorithmSet } from "./algorithms/sets.gen"

import type { Algorithm } from "./algorithms/schema"
import { GENERATED_ALGORITHMS } from "./algorithms/sets.gen"
import { extraAlgorithms } from "./algorithms/extras"

export const algorithms: Algorithm[] = [...GENERATED_ALGORITHMS, ...extraAlgorithms]
