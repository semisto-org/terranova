// Type declarations for the JS API helper (lib/api.js).
// Keeps `apiRequest<T>(...)` call sites type-safe without converting the runtime file.

export function getCsrfToken(): string

// Default to `any` so existing untyped call sites keep their prior behavior
// (lib/api.js is plain JS → previously every call returned `any`). Passing an
// explicit type argument (`apiRequest<Photo>(...)`) opts into type safety.
export function apiRequest<T = any>(
  path: string,
  options?: RequestInit
): Promise<T>
