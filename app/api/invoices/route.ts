import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reservationId = searchParams.get("reservationId")

    const db = await getDb()
    const request = db.request()

    let query = `
      SELECT i.*, c.fullName AS guestName, r.reservationType, r.startDate, r.endDate,
             rm.roomNumber, t.tableNumber
      FROM hotel.Invoices i
      JOIN hotel.Reservations r ON i.reservationId = r.reservationId
      JOIN hotel.Customers c ON r.customerId = c.customerId
      LEFT JOIN hotel.Rooms rm ON r.roomId = rm.roomId
      LEFT JOIN hotel.Tables t ON r.tableId = t.tableId
      WHERE 1=1
    `

    if (reservationId) {
      query += " AND i.reservationId = @reservationId"
      request.input("reservationId", sql.Int, parseInt(reservationId))
    }

    query += " ORDER BY i.invoiceDate DESC"
    const result = await request.query(query)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("GET /api/invoices error:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { reservationId } = await req.json()

    const db = await getDb()

    // Calculate totals from reservation + services
    const resData = await db.request()
      .input("reservationId", sql.Int, reservationId)
      .query(`
        SELECT r.*, rm.pricePerNight, DATEDIFF(day, r.startDate, r.endDate) AS nights
        FROM hotel.Reservations r
        LEFT JOIN hotel.Rooms rm ON r.roomId = rm.roomId
        WHERE r.reservationId = @reservationId
      `)

    if (resData.recordset.length === 0) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    const res = resData.recordset[0]
    const roomTotal = (res.pricePerNight || 0) * (res.nights || 0)

    // Get service usages total for this reservation's invoices
    const servicesData = await db.request()
      .input("reservationId", sql.Int, reservationId)
      .query(`
        SELECT ISNULL(SUM(su.totalPrice), 0) AS servicesTotal
        FROM hotel.ServiceUsages su
        JOIN hotel.Invoices inv ON su.invoiceId = inv.invoiceId
        WHERE inv.reservationId = @reservationId
      `)

    const servicesTotal = servicesData.recordset[0].servicesTotal
    const subtotal = roomTotal + servicesTotal
    const tax = Math.round(subtotal * 0.1 * 100) / 100
    const total = subtotal + tax

    const result = await db.request()
      .input("reservationId", sql.Int, reservationId)
      .input("subtotal", sql.Decimal(10, 2), subtotal)
      .input("tax", sql.Decimal(10, 2), tax)
      .input("total", sql.Decimal(10, 2), total)
      .query(`
        INSERT INTO hotel.Invoices (reservationId, invoiceDate, subtotal, tax, total, status)
        OUTPUT INSERTED.*
        VALUES (@reservationId, GETDATE(), @subtotal, @tax, @total, 'Pending')
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/invoices error:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
