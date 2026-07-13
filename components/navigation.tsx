"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  User,
  Timer,
  BookOpen,
  LogIn,
  LogOut,
  TrendingUp,
  Book,
  ScanLine,
  Trophy,
  Menu,
  X,
} from "lucide-react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"

const PUBLIC_LINKS = [
  { href: "/algorithms", label: "Algorithms", icon: BookOpen },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/notation", label: "Notation", icon: Book },
  { href: "/solve", label: "Solver", icon: ScanLine },
  { href: "/competitions", label: "Competitions", icon: Trophy },
]

const AUTHED_LINKS = [
  { href: "/stats", label: "Stats", icon: TrendingUp },
  { href: "/dashboard", label: "Dashboard", icon: User },
]

export function Navigation() {
  const [user] = useAuthState(auth)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const links = user ? [...PUBLIC_LINKS, ...AUTHED_LINKS] : PUBLIC_LINKS

  // Safety net: close on navigation (clicking the current page's own link
  // doesn't change the pathname, so links also close it directly).
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
    setOpen(false)
  }

  const authControl = (fullWidth = false) =>
    user ? (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className={fullWidth ? "w-full" : undefined}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    ) : (
      <Link href="/auth" onClick={() => setOpen(false)} className={fullWidth ? "block" : undefined}>
        <Button size="sm" className={fullWidth ? "w-full" : undefined}>
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </Link>
    )

  return (
    <nav className="relative z-50 border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary sm:h-10 sm:w-10">
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-lg font-bold sm:text-xl">CuberVerse</span>
        </Link>

        {/* Full nav only once seven links + the auth button genuinely fit.
            Icons come back at xl, where there's room for them. */}
        <div className="hidden items-center gap-4 lg:flex xl:gap-6">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="hidden h-4 w-4 xl:block" />
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:block">{authControl()}</div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <>
          {/* Sits inside the nav's stacking context, so the panel stays above it. */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-card shadow-xl lg:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              ))}
              <div className="border-t border-border pt-3">{authControl(true)}</div>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
