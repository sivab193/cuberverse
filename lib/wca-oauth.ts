/**
 * WCA OAuth (implicit grant) for verified account linking.
 *
 * The WCA explicitly supports `response_type=token` for "pure client side
 * javascript applications", which fits this static site: no client secret,
 * no server. The access token comes back in the URL fragment, is used once
 * to call `/api/v0/me`, and is never stored — we persist only the WCA ID.
 *
 * Setup (one-time): register an application at
 * https://www.worldcubeassociation.org/oauth/applications with redirect URI
 * `<site origin>/wca-callback` and scope `public`, then set
 * NEXT_PUBLIC_WCA_CLIENT_ID to the application ID.
 */

const WCA_ORIGIN = "https://www.worldcubeassociation.org"

export const WCA_CLIENT_ID = process.env.NEXT_PUBLIC_WCA_CLIENT_ID ?? ""

export const isWcaOAuthConfigured = WCA_CLIENT_ID !== ""

const STATE_STORAGE_KEY = "cuberverse.wca.oauth.state"

function redirectUri(): string {
  return `${window.location.origin}/wca-callback`
}

/** Begin the OAuth dance: remember a state nonce and go to the WCA. */
export function startWcaAuth(): void {
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  sessionStorage.setItem(STATE_STORAGE_KEY, state)
  const params = new URLSearchParams({
    client_id: WCA_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "token",
    scope: "public",
    state,
  })
  window.location.assign(`${WCA_ORIGIN}/oauth/authorize?${params}`)
}

export interface WcaCallbackResult {
  accessToken?: string
  error?: string
}

/** Parse the URL fragment the WCA redirected back with, validating state. */
export function parseWcaCallback(hash: string): WcaCallbackResult {
  const params = new URLSearchParams(hash.replace(/^#/, ""))
  const expectedState = sessionStorage.getItem(STATE_STORAGE_KEY)
  sessionStorage.removeItem(STATE_STORAGE_KEY)

  const error = params.get("error")
  if (error) {
    return {
      error:
        error === "access_denied"
          ? "You declined the connection on the WCA site."
          : `The WCA returned an error: ${params.get("error_description") ?? error}`,
    }
  }
  const accessToken = params.get("access_token")
  if (!accessToken) {
    return { error: "No access token in the WCA response — try connecting again." }
  }
  const state = params.get("state")
  if (!expectedState || state !== expectedState) {
    return { error: "The sign-in attempt didn't match this browser session — try again." }
  }
  return { accessToken }
}

export interface WcaMe {
  wca_id: string | null
  name: string
  country_iso2: string | null
}

/** Fetch the authenticated WCA account. The token is used only for this call. */
export async function fetchWcaMe(accessToken: string): Promise<WcaMe> {
  const res = await fetch(`${WCA_ORIGIN}/api/v0/me`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`WCA API error ${res.status}`)
  }
  const data = (await res.json()) as { me?: WcaMe } & WcaMe
  const me = data.me ?? data
  return {
    wca_id: me.wca_id ?? null,
    name: me.name,
    country_iso2: me.country_iso2 ?? null,
  }
}
