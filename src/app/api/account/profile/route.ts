import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { profileSettingsSchema } from "@/lib/validations"

export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = profileSettingsSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid profile data"
      return NextResponse.json({ error: "INVALID_INPUT", message }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 })
    }

    const nextUsername = parsed.data.username || null

    if (currentUser.username && !nextUsername) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Username cannot be blank once it has been set." },
        { status: 400 }
      )
    }

    const usernameChanged = Boolean(nextUsername && nextUsername !== currentUser.username)

    if (usernameChanged && nextUsername) {
      const [existingUser, existingStudioProfile, existingRedirect] = await Promise.all([
        prisma.user.findUnique({
          where: { username: nextUsername },
          select: { id: true },
        }),
        prisma.studioProfile.findUnique({
          where: { handle: nextUsername },
          select: { id: true },
        }),
        prisma.usernameRedirect.findUnique({
          where: { oldUsername: nextUsername },
          select: { userId: true },
        }),
      ])

      if (existingUser) {
        return NextResponse.json(
          { error: "USERNAME_TAKEN", message: "That username is already taken." },
          { status: 409 }
        )
      }

      if (existingStudioProfile) {
        return NextResponse.json(
          { error: "USERNAME_RESERVED", message: "That username is reserved by a studio profile." },
          { status: 409 }
        )
      }

      if (existingRedirect && existingRedirect.userId !== currentUser.id) {
        return NextResponse.json(
          { error: "USERNAME_RESERVED", message: "That username is reserved by a previous creator handle." },
          { status: 409 }
        )
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: parsed.data.name,
          username: nextUsername,
          bio: parsed.data.bio || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          image: true,
          bio: true,
        },
      })

      if (usernameChanged && nextUsername && currentUser.username) {
        await tx.usernameRedirect.upsert({
          where: { oldUsername: currentUser.username },
          create: {
            oldUsername: currentUser.username,
            userId: currentUser.id,
          },
          update: {
            userId: currentUser.id,
          },
        })

        await tx.usernameRedirect.deleteMany({
          where: {
            oldUsername: nextUsername,
            userId: currentUser.id,
          },
        })
      }

      return updated
    })

    revalidateTag("games", "max")
    revalidateTag("featured", "max")
    revalidatePath("/")
    revalidatePath("/games")
    revalidatePath("/creator")
    revalidatePath("/settings")

    if (currentUser.username) {
      revalidatePath(`/creator/${currentUser.username}`)
    }

    if (updatedUser.username) {
      revalidatePath(`/creator/${updatedUser.username}`)
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Profile update error:", error)

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

    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      return NextResponse.json({ error: "SYSTEM_ERROR", message: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
