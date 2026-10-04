export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(data.message || 'The request could not be completed.', response.status)
  }
  return data as T
}

export async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return apiWrite<T>(path, 'POST', body)
}

export async function apiPatch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return apiWrite<T>(path, 'PATCH', body)
}

async function apiWrite<T>(path: string, method: 'POST' | 'PATCH', body: Record<string, unknown>): Promise<T> {
  if (import.meta.env.MODE === 'preview') {
    throw new ApiError('Account features are disabled in this frontend preview.', 503)
  }
  const csrfResponse = await fetch('/api/v1/auth/csrf', { credentials: 'same-origin' })
  const { token } = await readResponse<{ token: string }>(csrfResponse)
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    body: JSON.stringify(body),
  })
  return readResponse<T>(response)
}

export async function apiGet<T>(path: string): Promise<T> {
  if (import.meta.env.MODE === 'preview') {
    throw new ApiError('Account features are disabled in this frontend preview.', 503)
  }
  const response = await fetch(path, { credentials: 'same-origin' })
  return readResponse<T>(response)
}

export async function getCurrentSession() {
  if (import.meta.env.MODE === 'preview') return null
  const response = await fetch('/api/v1/auth/session', { credentials: 'same-origin' })
  if (response.status === 401) return null
  return readResponse<{ user: { id: string; email: string; fullName: string } }>(response)
}

export function getSafeRedirectPath() {
  const path = sessionStorage.getItem('seatswap_redirect_after_login')
  sessionStorage.removeItem('seatswap_redirect_after_login')
  return path && path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
    ? path
    : '/dashboard.html'
}
