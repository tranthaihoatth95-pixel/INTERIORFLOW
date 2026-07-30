/**
 * lib/breakpoints.ts — 7.1.20 (30/07): NGUỒN DUY NHẤT cho ngưỡng bề rộng màn hình toàn app.
 *
 * GỐC VẤN ĐỀ (đã đo, không phải đoán): 2 hệ ngưỡng chạy song song không khớp nhau.
 *   1. Tailwind mặc định (640/768/1024/1280/1536) — dùng qua className (`sm:`/`md:`/`lg:`/`xl:`),
 *      đếm thực tế: sm 52 lần · lg 12 · md 5 · xl 1 · 2xl 0. `tailwind.config.ts` KHÔNG khai
 *      `screens` riêng ⇒ đây LÀ hệ chính thức duy nhất của app.
 *   2. 5 ngưỡng tự viết rải rác trong JS/CSS, KHÔNG khớp mốc nào ở hệ 1:
 *        700px  (lib/render-studio/tool-mode-ui.ts — SMALL_SCREEN_MAX_WIDTH)
 *        900px  (app/projects/[id]/notebook/page.tsx — @media)
 *        720px  (app/foldable.css — dải "square unfolded")
 *        520px  (app/foldable.css — dải "narrow folded")
 *        1100px (app/globals.css — ẩn nhãn micro StageSwitcher)
 *      700 nằm lửng giữa 640-768; 900 lửng giữa 768-1024 — không mốc nào trùng mốc nào, và vì
 *      hệ Tailwind gần như chỉ dùng `sm`+`lg` (52+12 lần) trong khi `md`/`xl` gần như bỏ trống,
 *      app THỰC CHẤT chỉ có 2 trạng thái đang được test kỹ (<640 và ≥640) — dải 1024-1279 gần
 *      như trống, đúng chỗ loạt lỗi layout gần đây lộ ra (xem docs/VERIFY-7.3.31.md).
 *
 * QUYẾT ĐỊNH (Hoà chốt 30/07, KHÔNG đổi): giữ NGUYÊN 640/768/1024/1280/1536 — chuẩn ngành, đổi
 * sẽ dịch ~70 chỗ dùng Tailwind class cùng lúc. Sửa 5 ngưỡng tự viết về ĐÚNG các mốc này, không
 * giữ số lẻ nào — mọi nơi khác cần đọc breakpoint trong JS PHẢI import từ đây, không tự viết số.
 *
 * 4 DẢI CHÍNH THỨC (khớp yêu cầu Hoà: <8" cảm ứng / tablet-laptop / desktop full):
 *   < 640      điện thoại                        1 cột, tối ưu ngón tay
 *   640–1023   tablet 8–11"                       2 cột
 *   1024–1279  laptop 13" / cửa sổ không full      2–3 cột, NGÂN SÁCH BỀ RỘNG CHẶT
 *   ≥ 1280     desktop                            3 cột, bản chuyên nghiệp đầy đủ
 *
 * LUẬT VERIFY MỚI (áp cho MỌI ticket giao diện từ 30/07, không riêng ticket này): đo bằng số ở
 * ĐỦ 5 mốc — 640 · 768 · 1024 · 1180 · 1440. **1180 BẮT BUỘC** — đây là bề rộng Hoà THẬT SỰ chạy
 * hàng ngày (cửa sổ không full trên MacBook), nằm giữa `lg` và `xl`, đúng dải "ngân sách bề rộng
 * CHẶT" — loạt lỗi layout gần đây (docs/VERIFY-7.3.31.md) lộ ra đúng ở dải này; test riêng ở
 * 1024/1440 KHÔNG bắt được. Ghi 1180 vào mọi bảng đo từ nay, không chỉ 3 mốc cũ.
 */

import { useEffect, useState } from 'react';

export const BP = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

export type BreakpointKey = keyof typeof BP;

/** true nếu bề rộng viewport < ngưỡng — dùng ngoài React (event handler, code không phải hook).
 * SSR-safe: `window` chưa có thì coi như KHÔNG hẹp (tránh flash sai layout lúc hydrate). */
export function isNarrowerThan(px: number): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < px;
}

function computeBp(): BreakpointKey | 'xs' {
  if (typeof window === 'undefined') return 'xs';
  const w = window.innerWidth;
  if (w >= BP.xxl) return 'xxl';
  if (w >= BP.xl) return 'xl';
  if (w >= BP.lg) return 'lg';
  if (w >= BP.md) return 'md';
  if (w >= BP.sm) return 'sm';
  return 'xs';
}

/**
 * Hook đọc dải breakpoint HIỆN TẠI (mốc LỚN NHẤT viewport đã đạt — vd 1180px → 'lg', đã qua
 * `lg`=1024 nhưng chưa tới `xl`=1280). Cùng khuôn `useIsSmallScreenForCanvas()`
 * (tool-mode-ui.ts) — resize listener, không dùng matchMedia để nhất quán cách làm sẵn có trong
 * repo. JS (hook này) và CSS (Tailwind class) LUÔN đọc chung hằng số `BP` — không bao giờ lệch
 * số như 5 ngưỡng cũ đã sửa.
 */
export function useBreakpoint(): BreakpointKey | 'xs' {
  const [bp, setBp] = useState<BreakpointKey | 'xs'>(() => computeBp());
  useEffect(() => {
    const check = () => setBp(computeBp());
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return bp;
}
