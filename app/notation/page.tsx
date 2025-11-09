import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NotationPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <h1 className="mb-3 text-4xl font-bold">Cube Notation Guide</h1>
          <p className="text-lg text-muted-foreground">
            Learn what each letter and symbol means when solving different cubes
          </p>
        </div>

        <Tabs defaultValue="3x3" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="3x3">3x3 Cube</TabsTrigger>
            <TabsTrigger value="2x2">2x2 Cube</TabsTrigger>
            <TabsTrigger value="pyraminx">Pyraminx</TabsTrigger>
          </TabsList>

          <TabsContent value="3x3" className="mt-6">
            <div className="grid gap-6">
              <Card className="p-6">
                <h2 className="mb-4 text-2xl font-semibold">Basic Face Moves</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        R
                      </code>
                      <div>
                        <p className="font-semibold">Right</p>
                        <p className="text-sm text-muted-foreground">Turn the right face 90° clockwise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        L
                      </code>
                      <div>
                        <p className="font-semibold">Left</p>
                        <p className="text-sm text-muted-foreground">Turn the left face 90° clockwise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        U
                      </code>
                      <div>
                        <p className="font-semibold">Up</p>
                        <p className="text-sm text-muted-foreground">Turn the top face 90° clockwise</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        D
                      </code>
                      <div>
                        <p className="font-semibold">Down</p>
                        <p className="text-sm text-muted-foreground">Turn the bottom face 90° clockwise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        F
                      </code>
                      <div>
                        <p className="font-semibold">Front</p>
                        <p className="text-sm text-muted-foreground">Turn the front face 90° clockwise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        B
                      </code>
                      <div>
                        <p className="font-semibold">Back</p>
                        <p className="text-sm text-muted-foreground">Turn the back face 90° clockwise</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="mb-4 text-2xl font-semibold">Move Modifiers</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-secondary px-3 py-1 font-mono text-lg font-bold">R'</code>
                      <div>
                        <p className="font-semibold">Prime (Apostrophe)</p>
                        <p className="text-sm text-muted-foreground">
                          Means counter-clockwise. Turn 90° in the opposite direction
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-secondary px-3 py-1 font-mono text-lg font-bold">R2</code>
                      <div>
                        <p className="font-semibold">Double Turn</p>
                        <p className="text-sm text-muted-foreground">Turn the face 180° (two times)</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-secondary px-3 py-1 font-mono text-lg font-bold">r</code>
                      <div>
                        <p className="font-semibold">Wide Turn (lowercase)</p>
                        <p className="text-sm text-muted-foreground">Turn two layers at once</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="mb-4 text-2xl font-semibold">Middle & Slice Moves</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-accent px-3 py-1 font-mono text-lg font-bold">M</code>
                      <div>
                        <p className="font-semibold">Middle</p>
                        <p className="text-sm text-muted-foreground">
                          Middle layer between L and R (turns in direction of L)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-accent px-3 py-1 font-mono text-lg font-bold">E</code>
                      <div>
                        <p className="font-semibold">Equatorial</p>
                        <p className="text-sm text-muted-foreground">
                          Middle layer between U and D (turns in direction of D)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-accent px-3 py-1 font-mono text-lg font-bold">S</code>
                      <div>
                        <p className="font-semibold">Standing</p>
                        <p className="text-sm text-muted-foreground">
                          Middle layer between F and B (turns in direction of F)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="mb-4 text-2xl font-semibold">Rotation Moves</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <code className="rounded bg-muted px-3 py-1 font-mono text-lg font-bold">x</code>
                    <div>
                      <p className="font-semibold">X Rotation</p>
                      <p className="text-sm text-muted-foreground">Rotate entire cube on R axis</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="rounded bg-muted px-3 py-1 font-mono text-lg font-bold">y</code>
                    <div>
                      <p className="font-semibold">Y Rotation</p>
                      <p className="text-sm text-muted-foreground">Rotate entire cube on U axis</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="rounded bg-muted px-3 py-1 font-mono text-lg font-bold">z</code>
                    <div>
                      <p className="font-semibold">Z Rotation</p>
                      <p className="text-sm text-muted-foreground">Rotate entire cube on F axis</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-secondary/50">
                <h3 className="mb-3 text-lg font-semibold">Example Algorithm</h3>
                <code className="mb-2 block rounded bg-background px-4 py-3 font-mono text-lg">
                  R U R' U' R' F R2 U' R' U' R U R' F'
                </code>
                <p className="text-sm text-muted-foreground">
                  This reads as: Right clockwise, Up clockwise, Right counter-clockwise, Up counter-clockwise...
                </p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="2x2" className="mt-6">
            <div className="grid gap-6">
              <Card className="p-6">
                <h2 className="mb-4 text-2xl font-semibold">2x2 Notation</h2>
                <p className="mb-6 text-muted-foreground">
                  The 2x2 cube uses the same notation as the 3x3 cube, but only has three face turns (R, U, F) plus
                  their opposites.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        R
                      </code>
                      <div>
                        <p className="font-semibold">Right</p>
                        <p className="text-sm text-muted-foreground">Turn the right face 90° clockwise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        U
                      </code>
                      <div>
                        <p className="font-semibold">Up</p>
                        <p className="text-sm text-muted-foreground">Turn the top face 90° clockwise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        F
                      </code>
                      <div>
                        <p className="font-semibold">Front</p>
                        <p className="text-sm text-muted-foreground">Turn the front face 90° clockwise</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-secondary px-3 py-1 font-mono text-lg font-bold">'</code>
                      <div>
                        <p className="font-semibold">Prime</p>
                        <p className="text-sm text-muted-foreground">Counter-clockwise turn (e.g., R', U', F')</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-secondary px-3 py-1 font-mono text-lg font-bold">2</code>
                      <div>
                        <p className="font-semibold">Double</p>
                        <p className="text-sm text-muted-foreground">180° turn (e.g., R2, U2, F2)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-secondary/50">
                <h3 className="mb-3 text-lg font-semibold">Example 2x2 Scramble</h3>
                <code className="mb-2 block rounded bg-background px-4 py-3 font-mono text-lg">
                  R U R' U' F' U F R2
                </code>
                <p className="text-sm text-muted-foreground">
                  2x2 scrambles are shorter since there are fewer pieces to permute
                </p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pyraminx" className="mt-6">
            <div className="grid gap-6">
              <Card className="p-6">
                <h2 className="mb-4 text-2xl font-semibold">Pyraminx Notation</h2>
                <p className="mb-6 text-muted-foreground">
                  The Pyraminx uses letters to represent turning each of its four tips and faces.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        U
                      </code>
                      <div>
                        <p className="font-semibold">Upper Face</p>
                        <p className="text-sm text-muted-foreground">Turn the top face clockwise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        R
                      </code>
                      <div>
                        <p className="font-semibold">Right Face</p>
                        <p className="text-sm text-muted-foreground">Turn the right face clockwise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        L
                      </code>
                      <div>
                        <p className="font-semibold">Left Face</p>
                        <p className="text-sm text-muted-foreground">Turn the left face clockwise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-primary px-3 py-1 font-mono text-lg font-bold text-primary-foreground">
                        B
                      </code>
                      <div>
                        <p className="font-semibold">Back Face</p>
                        <p className="text-sm text-muted-foreground">Turn the back face clockwise</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-accent px-3 py-1 font-mono text-lg font-bold">u</code>
                      <div>
                        <p className="font-semibold">Upper Tip (lowercase)</p>
                        <p className="text-sm text-muted-foreground">Turn just the tip piece</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-accent px-3 py-1 font-mono text-lg font-bold">r</code>
                      <div>
                        <p className="font-semibold">Right Tip</p>
                        <p className="text-sm text-muted-foreground">Turn just the tip piece</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-accent px-3 py-1 font-mono text-lg font-bold">l</code>
                      <div>
                        <p className="font-semibold">Left Tip</p>
                        <p className="text-sm text-muted-foreground">Turn just the tip piece</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <code className="rounded bg-accent px-3 py-1 font-mono text-lg font-bold">b</code>
                      <div>
                        <p className="font-semibold">Back Tip</p>
                        <p className="text-sm text-muted-foreground">Turn just the tip piece</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="mb-4 text-2xl font-semibold">Modifiers</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <code className="rounded bg-secondary px-3 py-1 font-mono text-lg font-bold">'</code>
                    <div>
                      <p className="font-semibold">Prime (Apostrophe)</p>
                      <p className="text-sm text-muted-foreground">
                        Counter-clockwise turn (works for both faces and tips)
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-secondary/50">
                <h3 className="mb-3 text-lg font-semibold">Example Pyraminx Scramble</h3>
                <code className="mb-2 block rounded bg-background px-4 py-3 font-mono text-lg">U R' L B l' r' b u</code>
                <p className="text-sm text-muted-foreground">
                  Notice the mix of uppercase (face turns) and lowercase (tip turns)
                </p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
