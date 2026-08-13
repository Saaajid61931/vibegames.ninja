"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getProviders, signIn } from "next-auth/react"
import { ArrowRight, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { NinjaConsole } from "@/components/icons/ninja-console"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/creator"
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [oauthProviders, setOauthProviders] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    let active = true

    const loadProviders = async () => {
      const providers = await getProviders()
      if (!active || !providers) {
        return
      }

      const order = ["google", "github"]
      const resolved = order
        .map((id) => providers[id])
        .filter((provider): provider is NonNullable<typeof provider> => Boolean(provider))
        .map((provider) => ({ id: provider.id, name: provider.name }))

      setOauthProviders(resolved)
    }

    void loadProviders()

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (!result?.ok || result.error) {
        setError("Invalid email or password.")
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="arcade">
      <CardHeader variant="arcade" className="text-center">
        <CardTitle className="font-arcade text-sm text-white">WELCOME BACK</CardTitle>
        <CardDescription className="font-arcade text-xs text-text-secondary">SIGN IN TO YOUR ACCOUNT TO CONTINUE</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="p-3 border-2 border-arcade-red bg-arcade-red/10 text-arcade-red font-arcade text-xs text-center uppercase">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label variant="arcade">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                id="email"
                type="email"
                variant="arcade"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                placeholder="you@example.com"
                autoComplete="email"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label variant="arcade">Password</Label>
              <Link href="/forgot-password" className="text-xs font-arcade text-arcade-yellow hover:underline uppercase">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                maxLength={72}
                variant="arcade"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" variant="arcade" className="w-full gap-2 font-arcade uppercase" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {oauthProviders.length > 0 && (
          <>
            <div className="relative my-6 font-arcade">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-border-strong" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-canvas px-2 text-text-secondary uppercase text-xs">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {oauthProviders.map((provider) => (
                <Button
                  key={provider.id}
                  type="button"
                  variant="arcade-outline"
                  className="font-arcade uppercase"
                  onClick={() => signIn(provider.id, { callbackUrl })}
                >
                  {provider.name}
                </Button>
              ))}
            </div>
          </>
        )}

        <p className="mt-6 text-center text-sm font-arcade text-text-secondary uppercase text-xs">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-arcade-yellow hover:underline ml-1">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-12 text-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <NinjaConsole className="h-8 w-8 text-arcade-yellow" />
          <span className="heading-pixel-sm text-white">
            <span className="text-arcade-yellow">VIBE</span>GAMES
          </span>
        </Link>

        <Suspense fallback={<div className="font-arcade text-center text-white">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
