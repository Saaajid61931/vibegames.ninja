import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { testOpenRouterConnection, OpenRouterBuilderError } from "@/lib/builder/openrouter"
import type { BuilderOpenRouterConnectionResponse } from "@/lib/builder/types"
import { DEFAULT_BUILDER_OPENROUTER_MODEL } from "@/lib/builder/types"
import { getRequestOrigin } from "@/lib/builder/urls"
import { builderOpenRouterTestSchema } from "@/lib/builder/validations"
import { logServerError } from "@/lib/server-log"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const openRouterApiKey = request.headers.get("x-openrouter-api-key")?.trim() || ""
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "Add your OpenRouter API key first." }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const parsed = builderOpenRouterTestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid OpenRouter settings" },
        { status: 400 },
      )
    }

    const model = parsed.data.openRouterModel?.trim() || DEFAULT_BUILDER_OPENROUTER_MODEL
    const result = await testOpenRouterConnection({
      apiKey: openRouterApiKey,
      model,
      origin: getRequestOrigin(request),
    })

    return NextResponse.json<BuilderOpenRouterConnectionResponse>(result)
  } catch (error) {
    if (error instanceof OpenRouterBuilderError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    logServerError("OpenRouter connection test failed", error, {
      route: "/api/builder/openrouter/test",
      method: "POST",
    })

    return NextResponse.json({ error: "Failed to test OpenRouter" }, { status: 500 })
  }
}
