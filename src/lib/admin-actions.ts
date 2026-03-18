import { NextResponse } from "next/server"

export function createAdminActionSuccessResponse() {
  return NextResponse.json({ success: true })
}
