import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { uploadUserAvatarToR2, validateR2Config } from "@/lib/storage"

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const r2Config = validateR2Config()
    if (!r2Config.valid) {
      return NextResponse.json(
        { error: `R2 storage is not configured. Missing: ${r2Config.missing.join(", ")}` },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const avatar = formData.get("avatar")

    if (!(avatar instanceof File)) {
      return NextResponse.json({ error: "INVALID_INPUT", message: "Avatar file is required." }, { status: 400 })
    }

    if (avatar.size === 0) {
      return NextResponse.json({ error: "INVALID_INPUT", message: "Avatar file cannot be empty." }, { status: 400 })
    }

    if (avatar.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Avatar must be smaller than 2MB." },
        { status: 400 }
      )
    }

    const nextImageUrl = await uploadUserAvatarToR2(session.user.id, avatar)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: nextImageUrl },
      select: {
        id: true,
        username: true,
        image: true,
      },
    })

    revalidateTag("games", "max")
    revalidateTag("featured", "max")
    revalidatePath("/")
    revalidatePath("/games")
    revalidatePath("/settings")

    if (updatedUser.username) {
      revalidatePath(`/creator/${updatedUser.username}`)
    }

    return NextResponse.json({
      image: updatedUser.image,
    })
  } catch (error) {
    console.error("Avatar upload error:", error)

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
