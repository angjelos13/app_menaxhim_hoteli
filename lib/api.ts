export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    })

    if (res.status === 401) {
      window.location.href = "/login"
      return { error: "Unauthorized" }
    }

    const data = await res.json()

    if (!res.ok) {
      return { error: data.error || `Request failed (${res.status})` }
    }

    return { data }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" }
  }
}
