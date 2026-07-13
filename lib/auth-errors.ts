import { FirebaseError } from "firebase/app"

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password. Please try again.",
  "auth/user-not-found": "No account found with this email. Try signing up instead.",
  "auth/wrong-password": "Incorrect email or password. Please try again.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/missing-email": "Enter your email address first.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
  "auth/weak-password": "Password is too weak — use at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/operation-not-allowed": "Email/password sign-in is not enabled for this app.",
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again."
  }
  return "Something went wrong. Please try again."
}

/**
 * True when Firebase says no account exists for the address. Password reset
 * uses this to stay silent rather than confirming which emails are registered.
 */
export function isUserNotFound(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "auth/user-not-found"
}
