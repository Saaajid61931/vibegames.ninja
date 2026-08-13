import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createRateLimitResponse, enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit"
import { passwordChangeSchema } from "@/lib/validations"
import { logServerError } from "@/lib/server-log"

export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const rateLimit = enforceRateLimit({
      request,
      userId: session.user.id,
      policy: RATE_LIMIT_POLICIES.passwordChanges,
      keyPrefix: "api-password-change",
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit,
        "Too many password attempts. Please wait before trying again."
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = passwordChangeSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid password input"
      return NextResponse.json({ error: "INVALID_INPUT", message }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "SESSION_EXPIRED", message: "Your session has expired. Please sign in again." },
        { status: 401 }
      )
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error: "PASSWORD_NOT_SET",
          message: "This account signs in with OAuth. Password setup is not available yet.",
        },
        { status: 400 }
      )
    }

    const isCurrentPasswordValid = await bcrypt.compare(parsed.data.currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "INVALID_PASSWORD", message: "Current password is incorrect." },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
      select: { id: true },
    })

    return NextResponse.json({ message: "Password updated." })
  } catch (error) {
    logServerError("Password update error", error, {
      route: "/api/account/password",
      method: "PATCH",
    })

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return NextResponse.json(
        {
          error: "DB_SCHEMA_MISMATCH",
          message: "Database schema is out of date. Run prisma db push and restart the server.",
        },
        { status: 500 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { error: "SESSION_EXPIRED", message: "Your session has expired. Please sign in again." },
        { status: 401 }
      )
    }

    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      return NextResponse.json({ error: "SYSTEM_ERROR", message: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
