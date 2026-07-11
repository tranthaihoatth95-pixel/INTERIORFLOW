/**
 * Team API (nội bộ) — adapter REST GENERIC, slot chờ spec hệ thống của đội.
 * Base URL + bearer token đọc từ env (TEAM_API_BASE / TEAM_API_TOKEN), server-only.
 * Khi đội chốt spec (endpoint dự án/nhân sự/thông báo…), thêm hàm cụ thể gọi qua call().
 */
export function teamConfigured(): boolean {
  return !!(process.env.TEAM_API_BASE && process.env.TEAM_API_TOKEN);
}

export async function call(path: string, init?: RequestInit) {
  const base = (process.env.TEAM_API_BASE ?? '').replace(/\/$/, '');
  const token = process.env.TEAM_API_TOKEN;
  if (!base || !token) throw new Error('TEAM_API_BASE/TEAM_API_TOKEN chưa cấu hình.');
  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Team API ${res.status} @ ${path}`);
  return res.json();
}
