export async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<{ data: T }> {
  const res = await fetch(url, {
    credentials: "include", 
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  })

  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login"
    throw new Error("Unauthorized")
  }

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error((json as any)?.error || `Request failed (${res.status})`)
  }

  return { data: json as T }
}