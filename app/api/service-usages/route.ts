import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get("invoiceId")

    const db = await getDb()
    const request = db.request()

    let query = `
      SELECT su.*, s.name AS serviceName, s.category
      FROM hotel.ServiceUsages su
      JOIN hotel.Services s ON su.serviceId = s.serviceId
      WHERE 1=1
    `

    if (invoiceId) {
      query += " AND su.invoiceId = @invoiceId"
      request.input("invoiceId", sql.Int, parseInt(invoiceId))
    }

    query += " ORDER BY su.dateTime DESC"
    const result = await request.query(query)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("GET /api/service-usages error:", error)
    return NextResponse.json({ error: "Failed to fetch service usages" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, serviceId, quantity } = await req.json()

    const db = await getDb()

    // Get service price
    const svc = await db.request()
      .input("serviceId", sql.Int, serviceId)
      .query("SELECT unitPrice FROM hotel.Services WHERE serviceId = @serviceId")

    if (svc.recordset.length === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const totalPrice = svc.recordset[0].unitPrice * quantity

    const result = await db.request()
      .input("invoiceId", sql.Int, invoiceId)
      .input("serviceId", sql.Int, serviceId)
      .input("quantity", sql.Int, quantity)
      .input("totalPrice", sql.Decimal(10, 2), totalPrice)
      .query(`
        INSERT INTO hotel.ServiceUsages (invoiceId, serviceId, quantity, dateTime, totalPrice)
        OUTPUT INSERTED.*
        VALUES (@invoiceId, @serviceId, @quantity, GETDATE(), @totalPrice)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/service-usages error:", error)
    return NextResponse.json({ error: "Failed to add service usage" }, { status: 500 })
  }
}
