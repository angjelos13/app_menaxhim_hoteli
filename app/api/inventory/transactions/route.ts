import { NextRequest, NextResponse } from "next/server"
import { getDb, sql } from "@/lib/db"
import { verifySession } from "@/lib/auth"

type TxType = "Inflow" | "Outflow"

export async function POST(req: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const itemId = Number(body.itemId)
  const quantity = Number(body.quantity)
  const type = body.type as TxType
  const notes = typeof body.notes === "string" ? body.notes : null

  const recordedBy = Number(session.userId)
  if (!Number.isInteger(recordedBy) || recordedBy <= 0) {
    return NextResponse.json({ error: "Invalid session userId" }, { status: 400 })
  }

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json({ error: "itemId is required and must be a positive integer" }, { status: 400 })
  }

  if (type !== "Inflow" && type !== "Outflow") {
    return NextResponse.json({ error: "type must be 'Inflow' or 'Outflow'" }, { status: 400 })
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "quantity must be a positive integer" }, { status: 400 })
  }

  const db = await getDb()
  const transaction = db.transaction()

  try {
    await transaction.begin()

    // 1) Verify item exists + get current qty
    const itemRes = await transaction.request()
      .input("itemId", sql.Int, itemId)
      .query(`
        SELECT itemId, quantityOnHand
        FROM hotel.InventoryItems
        WHERE itemId = @itemId
      `)

    const item = itemRes.recordset?.[0]
    if (!item) {
      await transaction.rollback()
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    // 2) Prevent negative stock on Outflow
    if (type === "Outflow" && quantity > Number(item.quantityOnHand)) {
      await transaction.rollback()
      return NextResponse.json({ error: "Not enough stock for outflow" }, { status: 409 })
    }

    // 3) Insert transaction
    const insertRes = await transaction.request()
      .input("itemId", sql.Int, itemId)
      .input("recordedBy", sql.Int, recordedBy)
      .input("type", sql.NVarChar(20), type)
      .input("quantity", sql.Int, quantity)
      .input("notes", sql.NVarChar(sql.MAX), notes)
      .query(`
        INSERT INTO hotel.InventoryTransactions (itemId, recordedBy, type, quantity, dateTime, notes)
        OUTPUT INSERTED.*
        VALUES (@itemId, @recordedBy, @type, @quantity, GETDATE(), @notes)
      `)

    // 4) Update qty on hand
    const quantityChange = type === "Inflow" ? quantity : -quantity
    const updateRes = await transaction.request()
      .input("itemId", sql.Int, itemId)
      .input("qty", sql.Int, quantityChange)
      .query(`
        UPDATE hotel.InventoryItems
        SET quantityOnHand = quantityOnHand + @qty
        WHERE itemId = @itemId
      `)

    if ((updateRes.rowsAffected?.[0] ?? 0) === 0) {
      throw new Error("Failed to update InventoryItems (0 rows affected)")
    }

    await transaction.commit()
    return NextResponse.json(insertRes.recordset[0], { status: 201 })
  } catch (error: any) {
    try { await transaction.rollback() } catch {}
    console.error("POST /api/inventory/transactions error:", error)
    return NextResponse.json(
      { error: error?.message ?? "Failed to record transaction" },
      { status: 500 }
    )
  }
}