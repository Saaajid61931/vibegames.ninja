import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { createRateLimitResponse, enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit"
import { logServerError } from "@/lib/server-log"
import { registerSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const rateLimit = enforceRateLimit({
      request,
      policy: RATE_LIMIT_POLICIES.register,
      keyPrefix: "api-register",
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "Too many registration attempts. Please wait before trying again.")
    }

    const body = await request.json().catch(() => null)
    
    // Validate input
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, username } = result.data

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      )
    }

    // Check if username already exists or is reserved
    const [existingUsername, existingStudioProfile, existingRedirect] = await Promise.all([
      prisma.user.findUnique({
        where: { username },
      }),
      prisma.studioProfile.findUnique({
        where: { handle: username },
        select: { id: true },
      }),
      prisma.usernameRedirect.findUnique({
        where: { oldUsername: username },
        select: { id: true },
      }),
    ])

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      )
    }

    if (existingStudioProfile || existingRedirect) {
      return NextResponse.json(
        { error: "Username is reserved" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPassword,
        role: "CREATOR", // New users are creators by default
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    })

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const fields = Array.isArray(error.meta?.target)
        ? error.meta.target.join(",")
        : String(error.meta?.target || "")
      const message = fields.includes("username")
        ? "Username already taken"
        : "Email already registered"

      return NextResponse.json({ error: message }, { status: 409 })
    }

    logServerError("Registration error", error, {
      route: "/api/auth/register",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
