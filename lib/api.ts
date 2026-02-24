export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
    },
  })

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data as T
}
