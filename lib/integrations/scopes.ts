/**
 * lib/integrations/scopes.ts — SO SÁNH SCOPE thuần (không DB, không fetch). Vì sao cần: token
 * `ms365` có thể đến từ HAI cửa — đăng nhập Microsoft (`app/api/auth/microsoft`, scope tối thiểu
 * `openid profile email User.Read offline_access`) và kết nối tích hợp (`/api/integrations/ms365/
 * connect`, thêm `Calendars.Read Mail.Read`). Cùng một hàng IntegrationAccount, khác quyền. Gọi
 * Graph lịch bằng token login ⇒ 403 im lặng. Lớp này biến "im lặng" thành trạng thái `thieu-scope`
 * nói rõ scope nào thiếu + đường nối lại.
 */

/** Chuẩn hoá chuỗi scope (space-separated, không phân biệt hoa/thường, bỏ tiền tố URL Graph). */
export function tachScope(raw: string | null | undefined): Set<string> {
  const out = new Set<string>();
  for (const s of (raw ?? '').split(/[\s,]+/)) {
    const t = s.trim();
    if (!t) continue;
    out.add(chuanHoaScope(t));
  }
  return out;
}

export function chuanHoaScope(s: string): string {
  // Microsoft trả 'https://graph.microsoft.com/Calendars.Read' hoặc 'Calendars.Read' tuỳ tenant.
  const cut = s.replace(/^https:\/\/graph\.microsoft\.com\//i, '');
  return cut.toLowerCase();
}

/** Scope còn thiếu so với yêu cầu. Rỗng = đủ. */
export function scopeThieu(granted: string | null | undefined, required: string[]): string[] {
  const co = tachScope(granted);
  return required.filter((r) => !co.has(chuanHoaScope(r)));
}

/**
 * Có nên GHI ĐÈ token đã lưu bằng token mới không? Ca thật: người dùng đã nối lịch (Calendars.Read),
 * hôm sau đăng nhập lại bằng Microsoft ⇒ callback login lưu token chỉ có User.Read ⇒ lịch chết.
 * Luật: chỉ ghi đè khi bản mới KHÔNG mất scope nào bản cũ đang có (bản mới ⊇ bản cũ). Bản cũ rỗng
 * (không biết) ⇒ ghi đè (giữ hành vi cũ).
 */
export function nenGhiDeToken(scopeCu: string | null | undefined, scopeMoi: string | null | undefined): boolean {
  const cu = tachScope(scopeCu);
  if (cu.size === 0) return true;
  const moi = tachScope(scopeMoi);
  for (const s of cu) {
    if (s === 'openid' || s === 'profile' || s === 'email' || s === 'offline_access') continue;
    if (!moi.has(s)) return false;
  }
  return true;
}
