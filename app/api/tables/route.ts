import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const db = await getDb()
    let query = "SELECT * FROM hotel.Tables WHERE 1=1"
    const request = db.request()

    if (status) {
      query += " AND status = @status"
      request.input("status", sql.NVarChar, status)
    }

    query += " ORDER BY tableNumber"
    const result = await request.query(query)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("GET /api/tables error:", error)
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tableNumber, capacity, status } = body

    const db = await getDb()
    const result = await db.request()
      .input("tableNumber", sql.NVarChar, tableNumber)
      .input("capacity", sql.Int, capacity)
      .input("status", sql.NVarChar, status || "Available")
      .query(`
        INSERT INTO hotel.Tables (tableNumber, capacity, status)
        OUTPUT INSERTED.*
        VALUES (@tableNumber, @capacity, @status)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/tables error:", error)
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { tableId, status } = body

    const db = await getDb()
    const result = await db.request()
      .input("tableId", sql.Int, tableId)
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE hotel.Tables SET status = @status
        OUTPUT INSERTED.*
        WHERE tableId = @tableId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("PATCH /api/tables error:", error)
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 })
  }
}
