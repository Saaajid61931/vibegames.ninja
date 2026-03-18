import { NextResponse } from "next/server"
import { BUILDER_QUICK_ACTIONS } from "@/lib/builder/types"
import { getBuilderTemplates } from "@/lib/builder/templates"

export async function GET() {
  return NextResponse.json({
    templates: getBuilderTemplates(),
    quickActions: BUILDER_QUICK_ACTIONS,
  })
}
