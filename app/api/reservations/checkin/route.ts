import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { reservationId } = await req.json()

    const db = await getDb()
    const transaction = db.transaction()
    await transaction.begin()

    try {
      // Update reservation status
      const resResult = await transaction.request()
        .input("reservationId", sql.Int, reservationId)
        .query(`
          UPDATE hotel.Reservations SET status = 'CheckedIn'
          OUTPUT INSERTED.*
          WHERE reservationId = @reservationId AND status = 'Confirmed'
        `)

      if (resResult.recordset.length === 0) {
        await transaction.rollback()
        return NextResponse.json({ error: "Reservation not found or not in Confirmed status" }, { status: 400 })
      }

      const reservation = resResult.recordset[0]

      // Update room status to Occupied
      if (reservation.roomId) {
        await transaction.request()
          .input("roomId", sql.Int, reservation.roomId)
          .query("UPDATE hotel.Rooms SET status = 'Occupied' WHERE roomId = @roomId")
      }

      // Update table status to Occupied
      if (reservation.tableId) {
        await transaction.request()
          .input("tableId", sql.Int, reservation.tableId)
          .query("UPDATE hotel.Tables SET status = 'Occupied' WHERE tableId = @tableId")
      }

      await transaction.commit()
      return NextResponse.json(reservation)
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  } catch (error) {
    console.error("POST /api/reservations/checkin error:", error)
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 })
  }
}
