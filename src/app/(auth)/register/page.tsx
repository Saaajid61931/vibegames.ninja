"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getProviders, signIn } from "next-auth/react"
import { ArrowRight, AtSign, Lock, Mail, User, Eye, EyeOff } from "lucide-react"
import { NinjaConsole } from "@/components/icons/ninja-console"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  })
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed.")
        return
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push("/creator")
        router.refresh()
      }
    } catch {
      setError("Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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

        <Card variant="arcade">
          <CardHeader variant="arcade" className="text-center">
            <CardTitle className="font-arcade text-sm text-white">CREATE AN ACCOUNT</CardTitle>
            <CardDescription className="font-arcade text-xs text-text-secondary">START PUBLISHING GAMES IN THE ARCADE</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 border-2 border-arcade-red bg-arcade-red/10 text-arcade-red font-arcade text-xs text-center uppercase">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label variant="arcade">Full Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    id="name"
                    type="text"
                    variant="arcade"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label variant="arcade">Username</Label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    id="username"
                    type="text"
                    variant="arcade"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      }))
                    }
                    placeholder="johndoe"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label variant="arcade">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    id="email"
                    type="email"
                    variant="arcade"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label variant="arcade">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    variant="arcade"
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Min 8 characters"
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
                {loading ? "Creating account..." : "Create account"}
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
                      onClick={() => signIn(provider.id, { callbackUrl: "/creator" })}
                    >
                      {provider.name}
                    </Button>
                  ))}
                </div>
              </>
            )}

            <p className="mt-6 text-center text-sm font-arcade text-text-secondary uppercase text-xs">
              Already have an account?{" "}
              <Link href="/login" className="text-arcade-yellow hover:underline ml-1">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
