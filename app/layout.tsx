import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const SITE_URL = 'https://cv.siv19.dev'
const SITE_NAME = 'CuberVerse'
const DESCRIPTION =
  'Learn every Rubik\'s Cube algorithm as the case it actually solves — drawn from the algorithm itself and playable in 3D. Plus a camera cube scanner, a solver, and a WCA-scramble timer.'

/**
 * metadataBase is what makes relative og:image paths resolve to absolute URLs.
 * Without it, link unfurlers (WhatsApp, Slack, iMessage) fall back to showing
 * the bare domain — which is exactly what they used to do here.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Master the cube`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Rubik\'s Cube',
    'speedcubing',
    'CFOP',
    'OLL',
    'PLL',
    'cube algorithms',
    'cube timer',
    'cube solver',
    'WCA',
  ],
  authors: [{ name: 'Sivaganesh Balaganesh', url: 'https://siv19.dev' }],
  creator: 'Sivaganesh Balaganesh',
  // Deliberately no title/description here: a child's openGraph inherits the
  // parent's fields wholesale, so setting them would stamp the site-wide title
  // onto every page's link preview. Left unset, Next fills og:title and
  // og:description from each page's own title/description.
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true },
}

// No maximumScale/userScalable limits — pinch-zoom stays available.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1a1a24',
}

import { Footer } from '@/components/footer'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      {/* min-h-dvh (not vh) so mobile browser chrome doesn't push the footer below the fold. */}
      <body className={`font-sans antialiased flex min-h-dvh flex-col`}>
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
