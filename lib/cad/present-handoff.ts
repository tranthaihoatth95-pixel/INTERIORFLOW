'use client';

/**
 * lib/cad/present-handoff.ts — Handoff CAD → Present ("Đưa sang Present").
 *
 * SONG SONG với CAD→Render (lib/cad/handoff.ts) — KHÔNG thay thế, không đụng nút/luồng đó.
 * CÙNG PATTERN sessionStorage + fallback module-singleton như lib/cad/handoff.ts (CAD→Render) và
 * lib/present-editor/handoff.ts (Render→Present): '/cad-editor' và '/present-editor' là 2 route
 * khác nhau, router.push điều hướng SPA nhưng state cục bộ của route cũ không mang theo được →
 * phải stash rồi consume SAU khi route đích mount xong.
 *
 * Khác handoff Render→Present (rổ ảnh nhiều tấm, human-in-loop kéo vào slide): ở đây CHỈ 1 ảnh
 * snapshot bản vẽ hiện tại → Present tự chèn thẳng vào 1 SLIDE MỚI (xem PresentEditor.tsx), giống
 * hệt hành vi "người dùng tự upload ảnh vào slide" — không đè slide/deck có sẵn.
 *
 * CONSUME-ONCE: đọc xong dọn cả 2 nguồn ngay → không double-insert khi PresentEditor remount.
 * Không có handoff ⇒ consume trả null ⇒ /present-editor y hệt trước (không phá luồng cũ).
 */

const KEY = 'interiorflow.cadPresentHandoff';

/** Fallback bộ nhớ khi sessionStorage hỏng/chặn (pattern B1 của lib/cad/handoff.ts). */
let memHandoff: string | null = null;

/** Stash 1 ảnh snapshot bản vẽ CAD (dataURL). Trả true nếu vào được sessionStorage (false = dùng mem). */
export function stashCadPresentHandoff(dataUrl: string): boolean {
  try {
    sessionStorage.setItem(KEY, dataUrl);
    memHandoff = null; // ưu tiên sessionStorage; dọn fallback cũ nếu có
    return true;
  } catch {
    memHandoff = dataUrl; // quota/chặn — giữ bộ nhớ, consume vẫn nhận được sau điều hướng SPA
    return false;
  }
}

/** Consume-ONCE: trả ảnh đã stash (hoặc null) rồi dọn cả 2 nguồn. Không có gì → null. */
export function consumeCadPresentHandoff(): string | null {
  let dataUrl: string | null = null;
  try {
    dataUrl = sessionStorage.getItem(KEY);
    if (dataUrl) sessionStorage.removeItem(KEY);
  } catch {
    // sessionStorage hỏng lúc đọc — vẫn thử fallback bộ nhớ bên dưới.
    dataUrl = null;
  }
  if (!dataUrl && memHandoff) dataUrl = memHandoff;
  memHandoff = null; // dọn ngay — tránh double-consume
  return dataUrl;
}
