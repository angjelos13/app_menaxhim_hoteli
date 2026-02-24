import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get("invoiceId")

    const db = await getDb()
    const request = db.request()

    let query = "SELECT * FROM hotel.Payments WHERE 1=1"
    if (invoiceId) {
      query += " AND invoiceId = @invoiceId"
      request.input("invoiceId", sql.Int, parseInt(invoiceId))
    }

    query += " ORDER BY paidAt DESC"
    const result = await request.query(query)
    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("GET /api/payments error:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, amount, method } = await req.json()

    const db = await getDb()
    const transaction = db.transaction()
    await transaction.begin()

    try {
      // Insert payment
      const payResult = await transaction.request()
        .input("invoiceId", sql.Int, invoiceId)
        .input("amount", sql.Decimal(10, 2), amount)
        .input("method", sql.NVarChar, method)
        .query(`
          INSERT INTO hotel.Payments (invoiceId, amount, method, paidAt, status)
          OUTPUT INSERTED.*
          VALUES (@invoiceId, @amount, @method, GETDATE(), 'Completed')
        `)

      // Check total paid vs invoice total
      const totals = await transaction.request()
        .input("invoiceId", sql.Int, invoiceId)
        .query(`
          SELECT i.total, ISNULL(SUM(p.amount), 0) AS totalPaid
          FROM hotel.Invoices i
          LEFT JOIN hotel.Payments p ON i.invoiceId = p.invoiceId
          WHERE i.invoiceId = @invoiceId
          GROUP BY i.total
        `)

      const { total, totalPaid } = totals.recordset[0]
      const newStatus = totalPaid >= total ? "Paid" : "Partial"

      await transaction.request()
        .input("invoiceId", sql.Int, invoiceId)
        .input("status", sql.NVarChar, newStatus)
        .query("UPDATE hotel.Invoices SET status = @status WHERE invoiceId = @invoiceId")

      await transaction.commit()
      return NextResponse.json(payResult.recordset[0], { status: 201 })
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  } catch (error) {
    console.error("POST /api/payments error:", error)
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
  }
}
