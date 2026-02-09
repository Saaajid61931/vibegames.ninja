import type { Metadata, Viewport } from "next"
import { Press_Start_2P, Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: "VibeGames.ai - AI Arcade",
    template: "%s | VibeGames.ai"
  },
  description: "AI-made HTML5 arcade games. Build, publish, and play.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1219",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-5524404299427340" />
      </head>
      <body className={`${pressStart.variable} ${inter.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
