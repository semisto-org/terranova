function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta ? meta.getAttribute('content') : ''
}

export async function apiRequest(path, options = {}) {
  const body = options.body
  const isFormData = body instanceof FormData
  const headers = {
    'X-CSRF-Token': getCsrfToken(),
    ...(options.headers || {}),
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(path, {
    headers,
    ...options,
  })

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login'
      throw new Error('Session expiree')
    }

    let message = `${response.status} ${response.statusText}`
    try {
      const data = await response.json()
      if (data?.error) message = data.error
    } catch (_) {
      // no-op
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}
