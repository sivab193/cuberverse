"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth, isFirebaseConfigured } from "@/lib/firebase"
import { getAuthErrorMessage, isUserNotFound } from "@/lib/auth-errors"
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth"

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)

  const clearMessages = () => {
    setError("")
    setNotice("")
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    // Same response whether or not the address is registered, so this can't be
    // used to discover which emails have accounts.
    const sent = `If an account exists for ${email}, a reset link is on its way. Check your inbox and spam folder.`
    try {
      await sendPasswordResetEmail(auth, email)
      setNotice(sent)
    } catch (err) {
      if (isUserNotFound(err)) setNotice(sent)
      else setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navigation />

      <main className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-24">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
            {resetting ? "Reset your password" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground">
            {resetting
              ? "We'll email you a link to choose a new one"
              : "Sign in to track your progress"}
          </p>
        </div>

        {!isFirebaseConfigured && (
          <Card className="mb-6 border-destructive/50 p-4">
            <p className="text-sm text-destructive">
              Accounts are not available: Firebase is not configured for this deployment. See{" "}
              <code className="font-mono">.env.example</code> for the required environment variables.
            </p>
          </Card>
        )}

        <Card className="p-4 sm:p-6">
          {resetting ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="email-reset">Email</Label>
                <Input
                  id="email-reset"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {notice && <p className="text-sm text-green-500">{notice}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  clearMessages()
                  setResetting(false)
                }}
              >
                Back to sign in
              </Button>
            </form>
          ) : (
            <Tabs defaultValue="signin" onValueChange={clearMessages}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="email-signin">Email</Label>
                    <Input
                      id="email-signin"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="password-signin">Password</Label>
                      <button
                        type="button"
                        onClick={() => {
                          clearMessages()
                          setResetting(true)
                        }}
                        className="text-sm text-primary underline-offset-2 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password-signin"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {notice && <p className="text-sm text-green-500">{notice}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password-signup">Password</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {notice && <p className="text-sm text-green-500">{notice}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </main>
    </div>
  )
}
