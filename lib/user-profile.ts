import { deleteField, doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"

/**
 * Per-user profile document (`users/{uid}`), separate from solves and
 * algorithm progress. Currently holds the linked WCA ID and the country
 * used for competition suggestions.
 */
export interface UserProfile {
  wcaId?: string
  countryIso2?: string
}

export async function fetchUserProfile(uid: string): Promise<UserProfile> {
  const snapshot = await getDoc(doc(db, "users", uid))
  return snapshot.exists() ? (snapshot.data() as UserProfile) : {}
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
  await setDoc(doc(db, "users", uid), patch, { merge: true })
}

export async function unlinkWcaProfile(uid: string): Promise<void> {
  await setDoc(doc(db, "users", uid), { wcaId: deleteField() }, { merge: true })
}
