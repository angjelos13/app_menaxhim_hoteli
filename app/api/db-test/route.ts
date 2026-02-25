import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDb();
    const r = await pool.request().query("SELECT DB_NAME() AS db, SUSER_SNAME() AS login, GETDATE() AS now");
    return NextResponse.json(r.recordset[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "DB error" }, { status: 500 });
  }
}