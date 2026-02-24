import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")

    const db = await getDb()
    let query = "SELECT * FROM hotel.Customers WHERE 1=1"
    const request = db.request()

    if (search) {
      query += " AND (fullName LIKE @search OR email LIKE @search OR phone LIKE @search)"
      request.input("search", sql.NVarChar, `%${search}%`)
    }

    query += " ORDER BY fullName"
    const result = await request.query(query)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("GET /api/customers error:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, phone, email, idCardNo } = body

    const db = await getDb()
    const result = await db.request()
      .input("fullName", sql.NVarChar, fullName)
      .input("phone", sql.NVarChar, phone)
      .input("email", sql.NVarChar, email)
      .input("idCardNo", sql.NVarChar, idCardNo)
      .query(`
        INSERT INTO hotel.Customers (fullName, phone, email, idCardNo)
        OUTPUT INSERTED.*
        VALUES (@fullName, @phone, @email, @idCardNo)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/customers error:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
