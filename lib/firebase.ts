import { initializeApp, getApps } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const envConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/**
 * True when all required Firebase env vars are present. Pages that need
 * auth/Firestore should check this and render a setup notice instead of
 * making Firebase calls when it is false.
 */
export const isFirebaseConfigured = Boolean(
  envConfig.apiKey && envConfig.authDomain && envConfig.projectId && envConfig.appId,
)

if (!isFirebaseConfigured && typeof window !== "undefined") {
  const missing = Object.entries({
    NEXT_PUBLIC_FIREBASE_API_KEY: envConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: envConfig.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: envConfig.projectId,
    NEXT_PUBLIC_FIREBASE_APP_ID: envConfig.appId,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key)
  console.warn(
    `Firebase is not configured — accounts, solve history, and progress are disabled. Missing env vars: ${missing.join(", ")}. See .env.example.`,
  )
}

// getAuth() throws at module scope on a missing apiKey, which would break
// prerendering of every page that imports this module. When unconfigured,
// initialize with inert placeholders instead; isFirebaseConfigured gates
// all real usage.
const firebaseConfig = isFirebaseConfigured
  ? envConfig
  : {
      apiKey: "unconfigured",
      authDomain: "unconfigured.local",
      projectId: "unconfigured",
      storageBucket: "unconfigured",
      messagingSenderId: "0",
      appId: "unconfigured",
    }

// Initialize Firebase (singleton pattern). With missing config this still
// creates an app object so imports don't crash; isFirebaseConfigured gates
// actual usage.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
export const db = getFirestore(app)

// Local emulator support — opt-in only, never implicit.
if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true" && typeof window !== "undefined") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
}
