/**
 * lib/theme-toggle.ts — logic chu kỳ đổi theme (auto → sáng → tối → auto), dùng chung cho
 * Header.tsx (app chính), StudioBar.tsx (CAD/Present/Photo-editor) và trang /settings mới
 * (7.3.30, 30/07). Trước đó mỗi nơi tự tính `next`/icon riêng — cùng 1 logic, 3 bản chép tay.
 *
 * State (`themePref`/`setThemePref`) đã dùng chung 1 Zustand store từ trước — file này chỉ
 * gom nốt phần TÍNH TOÁN (bước kế tiếp trong chu kỳ + icon tương ứng), không đổi hành vi.
 * Header/StudioBar mỗi nơi vẫn giữ NGUYÊN lớp trình bày riêng (Tailwind+motion vs inline
 * style) — hai mặt tiền khác route, không hiện đồng thời cho cùng 1 người dùng, không cần
 * ép về 1 component thị giác duy nhất.
 */

import { Sun, Moon, SunMoon, type LucideIcon } from 'lucide-react';
import type { ThemePref } from '@/lib/store';

export function nextThemePref(pref: ThemePref): ThemePref {
  return pref === 'auto' ? 'light' : pref === 'light' ? 'dark' : 'auto';
}

export function themeIconFor(pref: ThemePref): LucideIcon {
  return pref === 'auto' ? SunMoon : pref === 'light' ? Sun : Moon;
}

export function themeLabelVi(pref: ThemePref): string {
  return pref === 'auto' ? 'Tự động' : pref === 'light' ? 'Sáng' : 'Tối';
}
