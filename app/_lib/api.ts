/**
 * Server-side proxy helper for forwarding requests to the backend.
 * Reads the accessToken cookie and forwards it to the backend.
 */

import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8321/api/v1';

export async function proxyRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    searchParams?: Record<string, string>;
  } = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const { method = 'GET', body, searchParams } = options;

  // Build URL with query params
  let url = `${BACKEND_URL}${path}`;
  if (searchParams) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  // Get access token from cookie store
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  const headers: Record<string, string> = {};
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
    headers['Cookie'] = `accessToken=${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };
  if (body !== undefined) {
    if (body instanceof FormData) {
      fetchOptions.body = body;
    } else {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(url, fetchOptions);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error(`[proxyRequest] ${method} ${url} failed:`, err);
    return { ok: false, status: 500, data: { message: 'Backend connection failed' } };
  }
}

/** Map backend UPPERCASE enums to lowercase used by the UI */
export function normalizeRole(role: string): string {
  const map: Record<string, string> = {
    ADMIN: 'admin',
    PROJECT_MANAGER: 'project_manager',
    TEAM_MEMBER: 'team_member',
  };
  return map[role] ?? role.toLowerCase();
}

export function denormalizeRole(role: string): string {
  const map: Record<string, string> = {
    admin: 'ADMIN',
    project_manager: 'PROJECT_MANAGER',
    team_member: 'TEAM_MEMBER',
  };
  return map[role] ?? role.toUpperCase();
}

export function normalizeStatus(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ON_HOLD: 'on_hold',
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
  };
  return map[status] ?? status.toLowerCase();
}

export function denormalizeStatus(status: string): string {
  const map: Record<string, string> = {
    active: 'ACTIVE',
    completed: 'COMPLETED',
    on_hold: 'ON_HOLD',
    todo: 'TODO',
    in_progress: 'IN_PROGRESS',
  };
  return map[status] ?? status.toUpperCase();
}

export function normalizePriority(priority: string): string {
  const map: Record<string, string> = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  };
  return map[priority] ?? priority.toLowerCase();
}

export function denormalizePriority(priority: string): string {
  const map: Record<string, string> = {
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  };
  return map[priority] ?? priority.toUpperCase();
}

/** Generate avatar initials from user name */
export function makeAvatar(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? 'U').toUpperCase();
}
