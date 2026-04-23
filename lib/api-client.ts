'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Get the current session's Bearer token.
 * Returns null if the user is not authenticated.
 */
async function getToken(): Promise<string | null> {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

/**
 * Authenticated fetch — automatically injects Authorization: Bearer <token>.
 * Falls back to unauthenticated request if no session exists (for public routes).
 */
export async function apiFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const token = await getToken();

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (
    options.body &&
    typeof options.body === 'string' &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, { ...options, headers });
}

/**
 * Convenience wrapper — returns parsed JSON directly.
 * Throws if the response is not ok.
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const res = await apiFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = any>(url: string, body: unknown): Promise<T> {
  const res = await apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiPatch<T = any>(url: string, body: unknown): Promise<T> {
  const res = await apiFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await apiFetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
