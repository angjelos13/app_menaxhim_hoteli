import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")

    const db = await getDb()
    const request = db.request()

    let query = "SELECT * FROM hotel.InventoryItems WHERE 1=1"
    if (category) {
      query += " AND unit = @category"  // filter by category-like field
      request.input("category", sql.NVarChar, category)
    }

    query += " ORDER BY name"
    const result = await request.query(query)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("GET /api/inventory error:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, unit, quantityOnHand, minThreshold } = body

    const db = await getDb()
    const result = await db.request()
      .input("name", sql.NVarChar, name)
      .input("unit", sql.NVarChar, unit)
      .input("quantityOnHand", sql.Int, quantityOnHand)
      .input("minThreshold", sql.Int, minThreshold)
      .query(`
        INSERT INTO hotel.InventoryItems (name, unit, quantityOnHand, minThreshold)
        OUTPUT INSERTED.*
        VALUES (@name, @unit, @quantityOnHand, @minThreshold)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/inventory error:", error)
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 })
  }
}
