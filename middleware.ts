import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "hotel-desk-dev-secret-change-in-production")

const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/db-test",  
  "/login",
  "/diagram",
  "/activity-diagram",
  "/class-diagram",
  "/er-diagram",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // Protect API routes (except public auth routes)
  if (pathname.startsWith("/api/")) {
    const token = req.cookies.get("session")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await jwtVerify(token, SECRET)
      return NextResponse.next()
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }
  }

  // Protect hotel app routes
  if (pathname.startsWith("/hotel")) {
    const token = req.cookies.get("session")?.value
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      return NextResponse.redirect(loginUrl)
    }

    try {
      await jwtVerify(token, SECRET)
      return NextResponse.next()
    } catch {
      const loginUrl = new URL("/login", req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*", "/hotel/:path*"],
}
