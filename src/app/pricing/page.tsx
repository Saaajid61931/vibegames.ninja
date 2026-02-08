import Link from "next/link"
import { Check, Crown, Sparkles, Trophy } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      icon: Sparkles,
      color: "text-[#0080ff]",
      cta: "Start Free",
      href: "/register",
      features: [
        "Unlimited uploads",
        "65% revenue share",
        "Basic analytics",
        "Community support",
      ],
    },
    {
      name: "Creator Pro",
      price: "$15",
      period: "per month",
      icon: Crown,
      color: "text-[#ffff00]",
      cta: "Upgrade",
      href: "/register?plan=pro",
      featured: true,
      features: [
        "Everything in Free",
        "75% revenue share",
        "Advanced analytics",
        "Priority moderation",
        "No platform branding",
      ],
    },
    {
      name: "Studio",
      price: "Custom",
      period: "contact us",
      icon: Trophy,
      color: "text-[#00ff40]",
      cta: "Talk to us",
      href: "/register",
      features: [
        "Everything in Pro",
        "85% revenue share",
        "Team workflows",
        "Priority support",
        "Custom integrations",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#0d0d15]">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <section className="mb-12 text-center">
          <Badge variant="arcade" className="mb-4">Arcade Plans</Badge>
          <h1 className="font-pixel text-2xl text-white md:text-4xl">Choose Your Cabinet</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#4a4a6a] font-arcade">
            Start free, ship games, and scale your earnings as your audience grows.
          </p>
        </section>

        <section className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <Card key={plan.name} className={plan.featured ? "border-[#ffff00] shadow-[6px_6px_0_#ffff00]" : undefined}>
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between">
                    <Icon className={`h-6 w-6 ${plan.color}`} />
                    {plan.featured ? <Badge variant="warning">Most Popular</Badge> : null}
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.period}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-6 font-pixel text-xl text-white">{plan.price}</p>
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[#4a4a6a] font-arcade text-lg">
                        <Check className="mt-1 h-4 w-4 text-[#00ff40]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="block">
                    <Button className="w-full" variant={plan.featured ? "arcade" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </section>
      </main>
      <Footer />
    </div>
  )
}
