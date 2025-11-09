"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Timer, BookOpen, LogIn, LogOut, TrendingUp, Book } from "lucide-react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"

export function Navigation() {
  const [user] = useAuthState(auth)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="font-mono text-xl font-bold text-primary-foreground">SC</span>
          </div>
          <span className="text-xl font-bold">SpeedCube</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/algorithms"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <BookOpen className="h-4 w-4" />
            Algorithms
          </Link>
          <Link
            href="/timer"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Timer className="h-4 w-4" />
            Timer
          </Link>
          <Link
            href="/notation"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Book className="h-4 w-4" />
            Notation
          </Link>
          {user && (
            <>
              <Link
                href="/stats"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <TrendingUp className="h-4 w-4" />
                Stats
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <User className="h-4 w-4" />
                Dashboard
              </Link>
            </>
          )}
        </div>

        <div>
          {user ? (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Link href="/auth">
              <Button size="sm">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
