import sql from "mssql"

const config: sql.config = {
  user: process.env.MSSQL_USER || "",
  password: process.env.MSSQL_PASSWORD || "",
  server: process.env.MSSQL_SERVER || "localhost",
  database: process.env.MSSQL_DATABASE || "HotelManagementDB",
  port: parseInt(process.env.MSSQL_PORT || "1433"),
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === "true",
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getDb(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool
  }
  pool = await sql.connect(config)
  return pool
}

export { sql }
