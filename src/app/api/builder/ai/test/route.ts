import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { BuilderAiProviderError, testBuilderAiConnection } from "@/lib/builder/ai-client"
import { normalizeBuilderAiSettings } from "@/lib/builder/ai-providers"
import type { BuilderAiConnectionResponse } from "@/lib/builder/types"
import { getRequestOrigin } from "@/lib/builder/urls"
import { builderAiTestSchema } from "@/lib/builder/validations"
import { logServerError } from "@/lib/server-log"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = builderAiTestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid AI provider settings" },
        { status: 400 },
      )
    }

    const settings = normalizeBuilderAiSettings(parsed.data.aiSettings)
    if (settings.providerId === "local") {
      return NextResponse.json<BuilderAiConnectionResponse>({
        ok: true,
        providerId: "local",
        providerLabel: "Local Builder",
        model: "",
        message: "Local builder is ready with no external connection required.",
      })
    }

    const result = await testBuilderAiConnection({
      settings,
      origin: getRequestOrigin(request),
    })

    return NextResponse.json<BuilderAiConnectionResponse>(result)
  } catch (error) {
    if (error instanceof BuilderAiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    logServerError("Builder AI connection test failed", error, {
      route: "/api/builder/ai/test",
      method: "POST",
    })

    return NextResponse.json({ error: "Failed to test the selected AI provider" }, { status: 500 })
  }
}
