"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { ExternalLink, Link2, Loader2, Medal, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  countryFlag,
  eventName,
  fetchWcaPerson,
  formatWcaResult,
  sortEventIds,
  type WcaPersonInfo,
} from "@/lib/wca"
import { isWcaOAuthConfigured, startWcaAuth } from "@/lib/wca-oauth"
import { fetchUserProfile, unlinkWcaProfile } from "@/lib/user-profile"

export interface WcaProfileCardProps {
  uid: string
}

/**
 * Dashboard card for linking a WCA account via WCA OAuth and showing the
 * official profile: avatar, competition count, medals, and personal
 * records with national rankings. Linking is verified — the user signs in
 * on worldcubeassociation.org and we read their identity from /api/v0/me.
 * Only the WCA ID is stored (in the user's Firestore profile); profile
 * data comes live from the public WCA API.
 */
export function WcaProfileCard({ uid }: WcaProfileCardProps) {
  const [wcaId, setWcaId] = useState<string | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [info, setInfo] = useState<WcaPersonInfo | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchUserProfile(uid)
      .then((profile) => {
        if (cancelled) return
        setWcaId(profile.wcaId ?? null)
        setProfileLoaded(true)
      })
      .catch(() => setProfileLoaded(true))
    return () => {
      cancelled = true
    }
  }, [uid])

  useEffect(() => {
    if (!wcaId) {
      setInfo(null)
      return
    }
    let cancelled = false
    setError(null)
    fetchWcaPerson(wcaId)
      .then((data) => {
        if (!cancelled) setInfo(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load WCA profile")
      })
    return () => {
      cancelled = true
    }
  }, [wcaId])

  const unlink = useCallback(async () => {
    setBusy(true)
    try {
      await unlinkWcaProfile(uid)
      setWcaId(null)
      setInfo(null)
    } finally {
      setBusy(false)
    }
  }, [uid])

  if (!profileLoaded) {
    return (
      <Card className="flex items-center justify-center p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading WCA profile…
      </Card>
    )
  }

  if (!wcaId) {
    return (
      <Card className="p-6">
        <h2 className="mb-1 text-xl font-semibold">WCA Profile</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Connect your World Cube Association account to see your official records, rankings,
          and medals here. You&apos;ll sign in on worldcubeassociation.org — we never see your
          password, and only your WCA ID is stored.
        </p>
        {isWcaOAuthConfigured ? (
          <Button onClick={() => startWcaAuth()}>
            <Link2 className="mr-2 h-4 w-4" />
            Connect WCA account
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            WCA sign-in isn&apos;t configured on this deployment yet (missing{" "}
            <code className="rounded bg-secondary px-1">NEXT_PUBLIC_WCA_CLIENT_ID</code> — see
            the README).
          </p>
        )}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          {info?.person.avatar && !info.person.avatar.is_default ? (
            <Image
              src={info.person.avatar.thumb_url}
              alt={`${info.person.name}'s WCA avatar`}
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary text-2xl">
              {info ? countryFlag(info.person.country_iso2) : "…"}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{info?.person.name ?? wcaId}</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{wcaId}</span>
              {info && (
                <>
                  {" · "}
                  {countryFlag(info.person.country_iso2)} {info.person.country_iso2}
                  {" · "}
                  {info.competition_count} competitions
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`https://www.worldcubeassociation.org/persons/${wcaId}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              WCA page
            </Button>
          </a>
          <Button variant="ghost" size="sm" onClick={unlink} disabled={busy} title="Unlink WCA account">
            <Unlink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {info && (
        <>
          <div className="mb-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Medal className="h-4 w-4 text-yellow-500" /> {info.medals.gold}
            </span>
            <span className="flex items-center gap-1.5">
              <Medal className="h-4 w-4 text-slate-400" /> {info.medals.silver}
            </span>
            <span className="flex items-center gap-1.5">
              <Medal className="h-4 w-4 text-amber-700" /> {info.medals.bronze}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Event</th>
                  <th className="py-2 pr-4 font-medium">Single</th>
                  <th className="py-2 pr-4 font-medium">NR</th>
                  <th className="py-2 pr-4 font-medium">Average</th>
                  <th className="py-2 font-medium">NR</th>
                </tr>
              </thead>
              <tbody>
                {sortEventIds(Object.keys(info.personal_records)).map((event) => {
                  const pr = info.personal_records[event]
                  return (
                    <tr key={event} className="border-b border-border/50">
                      <td className="py-2 pr-4">{eventName(event)}</td>
                      <td className="py-2 pr-4 font-mono font-semibold">
                        {pr.single ? formatWcaResult(event, pr.single.best, "single") : "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {pr.single ? pr.single.country_rank || "—" : "—"}
                      </td>
                      <td className="py-2 pr-4 font-mono font-semibold">
                        {pr.average ? formatWcaResult(event, pr.average.best, "average") : "—"}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {pr.average ? pr.average.country_rank || "—" : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
