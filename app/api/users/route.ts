import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"
import { verifySession, hashPassword } from "@/lib/auth"

export async function GET() {
  try {
    const session = await verifySession()
    if (!session || session.role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDb()
    const result = await db.request()
      .query("SELECT userId, username, role, isActive FROM hotel.Users ORDER BY username")

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("GET /api/users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession()
    if (!session || session.role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { username, password, role } = await req.json()

    const db = await getDb()
    const passwordHash = hashPassword(password)

    const result = await db.request()
      .input("username", sql.NVarChar, username)
      .input("passwordHash", sql.NVarChar, passwordHash)
      .input("role", sql.NVarChar, role)
      .query(`
        INSERT INTO hotel.Users (username, passwordHash, role, isActive)
        OUTPUT INSERTED.userId, INSERTED.username, INSERTED.role, INSERTED.isActive
        VALUES (@username, @passwordHash, @role, 1)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/users error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifySession()
    if (!session || session.role !== "administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, role, isActive } = await req.json()

    const db = await getDb()
    const updates: string[] = []
    const request = db.request()
    request.input("userId", sql.Int, userId)

    if (role !== undefined) {
      updates.push("role = @role")
      request.input("role", sql.NVarChar, role)
    }
    if (isActive !== undefined) {
      updates.push("isActive = @isActive")
      request.input("isActive", sql.Bit, isActive)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const result = await request.query(`
      UPDATE hotel.Users SET ${updates.join(", ")}
      OUTPUT INSERTED.userId, INSERTED.username, INSERTED.role, INSERTED.isActive
      WHERE userId = @userId
    `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("PATCH /api/users error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
