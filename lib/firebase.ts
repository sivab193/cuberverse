import { initializeApp, getApps } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'fake-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fake-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'fake-bucket',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'fake-sender-id',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'fake-app-id',
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
export const db = getFirestore(app)

// If missing env vars, mock it up locally (prevents crash on SSR)
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  try {
     connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
  } catch (e) {
     // Ignore
  }
}
