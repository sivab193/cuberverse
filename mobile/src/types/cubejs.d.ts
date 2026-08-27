declare module 'cubejs' {
  export default class Cube {
    static initSolver(): void;
    static fromString(facelets: string): Cube;
    solve(maxDepth?: number): string;
  }
}

declare module 'cubejs/lib/solve';
