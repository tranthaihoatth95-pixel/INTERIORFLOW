'use client';

/**
 * lib/cad/seed-demo-flag.ts — cờ "nạp mặt bằng demo" một lần, dùng cho nút Tầng 1
 * "Mở dự án mẫu để xem thử" (components/entry/WelcomeIntro.tsx).
 *
 * Cùng NGUYÊN LÝ với lib/cad/handoff.ts (stash sessionStorage → consume SAU khi route
 * CAD mount): WelcomeIntro tạo + mở 1 flow trống rồi điều hướng sang `/projects/[id]/cad`;
 * CadEditor.tsx đọc cờ này lúc mount, nếu có VÀ bản vẽ đang trống thì nạp buildDemoPlan()
 * (giống hệt openDemo() nội bộ CadEditor) rồi xoá cờ — không lặp lại nếu F5.
 */

const KEY = 'interiorflow.cadSeedDemo';

/** Gọi TRƯỚC khi điều hướng sang `/projects/[id]/cad`. */
export function requestCadDemoSeed(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* bỏ qua — best-effort, không seed được thì CadEditor mở bản trống bình thường */
  }
}

/** Đọc + XOÁ cờ (dùng 1 lần) — gọi trong CadEditor lúc mount. */
export function consumeCadDemoSeedRequest(): boolean {
  try {
    const v = sessionStorage.getItem(KEY) === '1';
    if (v) sessionStorage.removeItem(KEY);
    return v;
  } catch {
    return false;
  }
}
