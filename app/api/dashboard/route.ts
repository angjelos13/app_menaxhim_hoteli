import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDb()

    // Room stats
    const roomStats = await db.request().query(`
      SELECT
        COUNT(*) AS totalRooms,
        SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) AS occupiedRooms,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS availableRooms,
        SUM(CASE WHEN status = 'Cleaning' THEN 1 ELSE 0 END) AS cleaningRooms,
        SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenanceRooms
      FROM [hotel].[Rooms]
    `)

    // Table stats
    const tableStats = await db.request().query(`
      SELECT
        COUNT(*) AS totalTables,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS availableTables,
        SUM(CASE WHEN status = 'Reserved' THEN 1 ELSE 0 END) AS reservedTables,
        SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) AS occupiedTables
      FROM [hotel].[Tables]
    `)

    // Active guests (checked-in reservations)
    const activeGuests = await db.request().query(`
      SELECT COUNT(*) AS count FROM hotel.Reservations WHERE status = 'CheckedIn'
    `)

    // Today's arrivals
    const todayArrivals = await db.request().query(`
      SELECT COUNT(*) AS count FROM hotel.Reservations
      WHERE CAST(startDate AS DATE) = CAST(GETDATE() AS DATE) AND status = 'Confirmed'
    `)

    // Today's departures
    const todayDepartures = await db.request().query(`
      SELECT COUNT(*) AS count FROM hotel.Reservations
      WHERE CAST(endDate AS DATE) = CAST(GETDATE() AS DATE) AND status = 'CheckedIn'
    `)

    // Revenue (paid invoices)
    const revenue = await db.request().query(`
      SELECT ISNULL(SUM(total), 0) AS totalRevenue FROM hotel.Invoices WHERE status = 'Paid'
    `)

    // Low stock items
    const lowStock = await db.request().query(`
      SELECT name, quantityOnHand, minThreshold, unit
      FROM hotel.InventoryItems
      WHERE quantityOnHand <= minThreshold
      ORDER BY (CAST(quantityOnHand AS FLOAT) / NULLIF(minThreshold, 0)) ASC
    `)

    // Recent reservations
    const recentReservations = await db.request().query(`
      SELECT TOP 5 r.reservationId, r.reservationType, r.status, r.startDate, r.endDate,
                   c.fullName AS guestName, rm.roomNumber, t.tableNumber
      FROM [hotel].[Reservations] r
      JOIN [hotel].[Customers] c ON r.customerId = c.customerId
      LEFT JOIN [hotel].[Rooms] rm ON r.roomId = rm.roomId
      LEFT JOIN [hotel].[Tables] t ON r.tableId = t.tableId
      ORDER BY r.createdAt DESC
    `)

    return NextResponse.json({
      rooms: roomStats.recordset[0],
      tables: tableStats.recordset[0],
      activeGuests: activeGuests.recordset[0].count,
      todayArrivals: todayArrivals.recordset[0].count,
      todayDepartures: todayDepartures.recordset[0].count,
      revenue: revenue.recordset[0].totalRevenue,
      lowStockItems: lowStock.recordset,
      recentReservations: recentReservations.recordset,
    })
 } catch (error: any) {
  console.error("GET /api/dashboard error:", error)
  return NextResponse.json(
    { error: "Failed to fetch dashboard data", detail: error?.message ?? String(error) },
    { status: 500 }
  )
}
}
