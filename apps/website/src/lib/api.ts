const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:3000"

type ApiResult<T> = {
  items?: T[]
  [key: string]: unknown
}

async function fetchJson<T>(path: string): Promise<ApiResult<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}) for ${path}`)
  }

  return response.json()
}

export async function fetchWebsiteHome() {
  return fetchJson<never>("/api/v1/website/home")
}

export async function fetchArticles() {
  return fetchJson<{ slug: string; title: string; summary: string; published_at: string }>(
    "/api/v1/website/articles"
  )
}

export async function fetchEvents() {
  return fetchJson<{ id: string; title: string; starts_at: string; city: string }>(
    "/api/v1/website/events"
  )
}

export async function fetchCourses() {
  return fetchJson<{ slug: string; title: string; duration_days: number; level: string }>(
    "/api/v1/website/courses"
  )
}
