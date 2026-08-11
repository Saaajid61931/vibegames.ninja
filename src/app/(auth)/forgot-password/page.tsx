import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, LifeBuoy, ShieldAlert } from "lucide-react"
import { NinjaConsole } from "@/components/icons/ninja-console"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Password recovery guidance for VibeGames.Ninja accounts.",
  robots: { index: false },
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-12 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <NinjaConsole className="h-8 w-8 text-arcade-yellow" />
          <span className="heading-pixel-sm text-white">
            <span className="text-arcade-yellow">VIBE</span>GAMES
          </span>
        </Link>

        <Card variant="arcade">
          <CardHeader variant="arcade" className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center border-2 border-arcade-yellow bg-arcade-yellow/10 text-arcade-yellow">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="mt-4 font-arcade text-sm text-white uppercase">Password reset is not live yet</CardTitle>
            <CardDescription className="font-arcade text-xs text-text-secondary uppercase mt-2">
              The sign-in flow should not have dropped you on a missing page. This route now gives
              you a safe recovery path instead of a 404.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-border-strong bg-surface-2 p-4 text-xs font-arcade text-text-secondary uppercase">
              <p>
                If you normally use Google, choose the Google sign-in button on the login page.
              </p>
              <p className="mt-3">
                If you still have access on another signed-in device, change your password from
                account settings there.
              </p>
            </div>

            <div className="border-2 border-border-strong bg-canvas p-4 text-xs font-arcade text-text-secondary uppercase">
              <div className="flex items-start gap-3">
                <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-arcade-yellow" />
                <p>
                  A full reset-email flow can be added next, but this page keeps the auth flow from
                  breaking in the meantime.
                </p>
              </div>
            </div>

            <Button asChild variant="arcade-outline" className="w-full font-arcade uppercase">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
