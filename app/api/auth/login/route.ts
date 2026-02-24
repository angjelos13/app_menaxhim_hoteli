import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.request()
      .input("username", sql.NVarChar, username)
      .query("SELECT userId, username, passwordHash, role, isActive FROM hotel.Users WHERE username = @username")

    const user = result.recordset[0]
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 })
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await createSession({
      userId: String(user.userId),
      username: user.username,
      role: user.role,
    })

    const response = NextResponse.json({
      user: {
        id: String(user.userId),
        username: user.username,
        role: user.role,
      },
    })

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
