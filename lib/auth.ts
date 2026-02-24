import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import crypto from "crypto"

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "hotel-desk-dev-secret-change-in-production")

export interface SessionPayload {
  userId: string
  username: string
  role: string
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET)
  return token
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function checkRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole)
}
