import type { Metadata, Viewport } from "next"
import { Press_Start_2P, Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - AI Arcade`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI games",
    "HTML5 games",
    "browser games",
    "AI generated games",
    "arcade games",
    "indie games",
    "game creators",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: `${SITE_NAME} - AI Arcade`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: `${SITE_NAME} - AI Arcade`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - AI Arcade`,
    description: SITE_DESCRIPTION,
    images: ["/icon.svg"],
  },
  alternates: {
    canonical: "/",
  },
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
    <html lang="en" suppressHydrationWarning>
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
