"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface AuthUser {
  id: string | number
  username: string
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({}),
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (res.ok) return res.json()
        return { user: null }
      })
      .then((data) => {
        setUser(data.user ?? null)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      return { error: data.error || "Login failed" }
    }

    const data = await res.json()
    setUser({
      id: data.user.id,
      username: data.user.username,
      role: data.user.role,
    })
    return {}
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
