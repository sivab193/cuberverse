"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, isFirebaseConfigured } from "@/lib/firebase"
import { fetchWcaMe, parseWcaCallback } from "@/lib/wca-oauth"
import { updateUserProfile } from "@/lib/user-profile"

/**
 * OAuth redirect target: the WCA sends the user back here with an access
 * token in the URL fragment. We validate it, read /api/v0/me once, store
 * the verified WCA ID on the signed-in user's profile, and bounce back to
 * the dashboard. The token itself is never persisted.
 */
export default function WcaCallbackPage() {
  const router = useRouter()
  const [user, authLoading] = useAuthState(auth)
  const [error, setError] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("Accounts aren't configured on this deployment, so WCA linking is unavailable.")
      return
    }
    if (authLoading || ran.current) return
    ran.current = true
    ;(async () => {
      if (!user) {
        setError(
          "You need to be signed in to Cuberverse to link a WCA account. Sign in, then start the connection again from the dashboard.",
        )
        return
      }
      const parsed = parseWcaCallback(window.location.hash)
      if (parsed.error || !parsed.accessToken) {
        setError(parsed.error ?? "Missing access token.")
        return
      }
      // Remove the token from the address bar as early as possible.
      window.history.replaceState(null, "", window.location.pathname)
      try {
        const me = await fetchWcaMe(parsed.accessToken)
        if (!me.wca_id) {
          setError(
            `Your WCA account (${me.name}) doesn't have a WCA ID yet — you get one after competing in an official competition.`,
          )
          return
        }
        await updateUserProfile(user.uid, {
          wcaId: me.wca_id,
          ...(me.country_iso2 ? { countryIso2: me.country_iso2 } : {}),
        })
        router.replace("/dashboard")
      } catch {
        setError("Couldn't verify the connection with the WCA — try again in a moment.")
      }
    })()
  }, [user, authLoading, router])

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="mx-auto max-w-xl px-6 py-24">
        <Card className="p-8 text-center">
          {error ? (
            <>
              <h1 className="mb-3 text-xl font-semibold">WCA connection failed</h1>
              <p className="mb-6 text-sm text-muted-foreground">{error}</p>
              <Link href="/dashboard">
                <Button variant="outline">Back to dashboard</Button>
              </Link>
            </>
          ) : (
            <p className="flex items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Linking your WCA account…
            </p>
          )}
        </Card>
      </main>
    </div>
  )
}
