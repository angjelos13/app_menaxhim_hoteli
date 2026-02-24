import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const floor = searchParams.get("floor")

    const db = await getDb()
    let query = "SELECT * FROM hotel.Rooms WHERE 1=1"
    const request = db.request()

    if (status) {
      query += " AND status = @status"
      request.input("status", sql.NVarChar, status)
    }
    if (floor) {
      query += " AND FLOOR(CAST(roomNumber AS INT) / 100) = @floor"
      request.input("floor", sql.Int, parseInt(floor))
    }

    query += " ORDER BY roomNumber"
    const result = await request.query(query)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("GET /api/rooms error:", error)
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { roomNumber, type, pricePerNight, status } = body

    const db = await getDb()
    const result = await db.request()
      .input("roomNumber", sql.NVarChar, roomNumber)
      .input("type", sql.NVarChar, type)
      .input("pricePerNight", sql.Decimal(10, 2), pricePerNight)
      .input("status", sql.NVarChar, status || "Available")
      .query(`
        INSERT INTO hotel.Rooms (roomNumber, type, pricePerNight, status)
        OUTPUT INSERTED.*
        VALUES (@roomNumber, @type, @pricePerNight, @status)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/rooms error:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { roomId, status } = body

    const db = await getDb()
    const result = await db.request()
      .input("roomId", sql.Int, roomId)
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE hotel.Rooms SET status = @status
        OUTPUT INSERTED.*
        WHERE roomId = @roomId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("PATCH /api/rooms error:", error)
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 })
  }
}
