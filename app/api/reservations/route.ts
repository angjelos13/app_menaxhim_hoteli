import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"
import { verifySession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    const db = await getDb()
    const request = db.request()

    let query = `
      SELECT r.*, c.fullName AS guestName, c.email AS guestEmail, c.phone AS guestPhone, c.idCardNo,
             rm.roomNumber, t.tableNumber
      FROM hotel.Reservations r
      JOIN hotel.Customers c ON r.customerId = c.customerId
      LEFT JOIN hotel.Rooms rm ON r.roomId = rm.roomId
      LEFT JOIN hotel.Tables t ON r.tableId = t.tableId
      WHERE 1=1
    `

    if (status) {
      query += " AND r.status = @status"
      request.input("status", sql.NVarChar, status)
    }
    if (type) {
      query += " AND r.reservationType = @type"
      request.input("type", sql.NVarChar, type)
    }

    query += " ORDER BY r.createdAt DESC"
    const result = await request.query(query)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("GET /api/reservations error:", error)
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { customerId, roomId, tableId, startDate, endDate, reservationType } = body

    const db = await getDb()

    // Check availability
    if (reservationType === "Room" && roomId) {
      const check = await db.request()
        .input("roomId", sql.Int, roomId)
        .input("startDate", sql.Date, startDate)
        .input("endDate", sql.Date, endDate)
        .query(`
          SELECT COUNT(*) AS cnt FROM hotel.Reservations
          WHERE roomId = @roomId AND status IN ('Confirmed','CheckedIn')
            AND startDate < @endDate AND endDate > @startDate
        `)
      if (check.recordset[0].cnt > 0) {
        return NextResponse.json({ error: "Room is not available for these dates" }, { status: 409 })
      }
    }

    if (reservationType === "Table" && tableId) {
      const check = await db.request()
        .input("tableId", sql.Int, tableId)
        .input("startDate", sql.Date, startDate)
        .input("endDate", sql.Date, endDate)
        .query(`
          SELECT COUNT(*) AS cnt FROM hotel.Reservations
          WHERE tableId = @tableId AND status IN ('Confirmed','CheckedIn')
            AND startDate < @endDate AND endDate > @startDate
        `)
      if (check.recordset[0].cnt > 0) {
        return NextResponse.json({ error: "Table is not available for these dates" }, { status: 409 })
      }
    }

    const result = await db.request()
      .input("customerId", sql.Int, customerId)
      .input("roomId", sql.Int, roomId || null)
      .input("tableId", sql.Int, tableId || null)
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .input("reservationType", sql.NVarChar, reservationType)
      .input("status", sql.NVarChar, "Confirmed")
      .input("createdBy", sql.Int, parseInt(session.userId))
      .query(`
        INSERT INTO hotel.Reservations (customerId, roomId, tableId, startDate, endDate, reservationType, status, createdBy)
        OUTPUT INSERTED.*
        VALUES (@customerId, @roomId, @tableId, @startDate, @endDate, @reservationType, @status, @createdBy)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/reservations error:", error)
    return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { reservationId, status, startDate, endDate } = body

    const db = await getDb()
    const updates: string[] = []
    const request = db.request()
    request.input("reservationId", sql.Int, reservationId)

    if (status) {
      updates.push("status = @status")
      request.input("status", sql.NVarChar, status)
    }
    if (startDate) {
      updates.push("startDate = @startDate")
      request.input("startDate", sql.Date, startDate)
    }
    if (endDate) {
      updates.push("endDate = @endDate")
      request.input("endDate", sql.Date, endDate)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const result = await request.query(`
      UPDATE hotel.Reservations SET ${updates.join(", ")}
      OUTPUT INSERTED.*
      WHERE reservationId = @reservationId
    `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("PATCH /api/reservations error:", error)
    return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 })
  }
}
