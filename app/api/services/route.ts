import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDb()
    const result = await db.request().query("SELECT * FROM hotel.Services ORDER BY name")
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("GET /api/services error:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, unitPrice, category } = body

    const db = await getDb()
    const result = await db.request()
      .input("name", sql.NVarChar, name)
      .input("unitPrice", sql.Decimal(10, 2), unitPrice)
      .input("category", sql.NVarChar, category)
      .query(`
        INSERT INTO hotel.Services (name, unitPrice, category)
        OUTPUT INSERTED.*
        VALUES (@name, @unitPrice, @category)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/services error:", error)
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}
