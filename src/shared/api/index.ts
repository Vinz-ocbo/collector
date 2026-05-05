/**
 * API client placeholder. Backend endpoints (auth, collection sync, Scryfall proxy)
 * will be wired here. The client must NEVER call Scryfall directly in production.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  const data: unknown = await response.json();
  return data as T;
}
