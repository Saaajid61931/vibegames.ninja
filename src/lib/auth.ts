import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Provider } from "next-auth/providers"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { loginSchema } from "@/lib/validations"

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsedCredentials = loginSchema.safeParse({
        email: credentials?.email,
        password: credentials?.password,
      })

      if (!parsedCredentials.success) {
        throw new Error("Invalid credentials")
      }

      const { email, password } = parsedCredentials.data

      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user || !user.password) {
        throw new Error("Invalid credentials")
      }

      const isValid = await bcrypt.compare(
        password,
        user.password
      )

      if (!isValid) {
        throw new Error("Invalid credentials")
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        username: user.username,
      }
    },
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? "USER"
        token.username = (user as { username?: string }).username
        token.name = user.name
        token.image = user.image
      }

      if (trigger === "update") {
        const updatedSession = session as { name?: string | null; username?: string | null; image?: string | null } | undefined

        if (typeof updatedSession?.name !== "undefined") {
          token.name = updatedSession.name
        }

        if (typeof updatedSession?.username !== "undefined") {
          token.username = updatedSession.username ?? undefined
        }

        if (typeof updatedSession?.image !== "undefined") {
          token.image = updatedSession.image
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string
        ;(session.user as { role: string }).role = token.role as string
        ;(session.user as { username?: string | null }).username = typeof token.username === "string" ? token.username : null
        session.user.name = typeof token.name === "string" ? token.name : null
        session.user.image = typeof token.image === "string" ? token.image : null
      }
      return session
    },
  },
})
