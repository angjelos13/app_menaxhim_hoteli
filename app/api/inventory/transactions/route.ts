import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"
import { verifySession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId, type, quantity, notes } = await req.json()

    const db = await getDb()
    const transaction = db.transaction()
    await transaction.begin()

    try {
      // Insert transaction
      const result = await transaction.request()
        .input("itemId", sql.Int, itemId)
        .input("recordedBy", sql.Int, parseInt(session.userId))
        .input("type", sql.NVarChar, type)
        .input("quantity", sql.Int, quantity)
        .input("notes", sql.NVarChar, notes || null)
        .query(`
          INSERT INTO hotel.InventoryTransactions (itemId, recordedBy, type, quantity, dateTime, notes)
          OUTPUT INSERTED.*
          VALUES (@itemId, @recordedBy, @type, @quantity, GETDATE(), @notes)
        `)

      // Update quantity on hand
      const quantityChange = type === "Inflow" ? quantity : -quantity
      await transaction.request()
        .input("itemId", sql.Int, itemId)
        .input("qty", sql.Int, quantityChange)
        .query("UPDATE hotel.InventoryItems SET quantityOnHand = quantityOnHand + @qty WHERE itemId = @itemId")

      await transaction.commit()
      return NextResponse.json(result.recordset[0], { status: 201 })
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  } catch (error) {
    console.error("POST /api/inventory/transactions error:", error)
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 })
  }
}
