'use client';

/**
 * /settings — Cài đặt chung. Từ 02/08 (G4, docs/mocks/mock-settings-polished.html): giao diện
 * dựng lại theo vật mẫu pixel Hoà chốt (Hồ sơ · Giao diện · Nơi lưu file — 3 card, layout mới).
 * Lịch sử trước 02/08: 2.2.61 (chỉ AI) → 7.3.30 (4 nhóm Tài khoản/Giao diện/AI/Trải nghiệm,
 * `docs/TICKET-SETTINGS-GOM-CAU-HINH-2026-07-29.md` §5) → B1 (+ nhóm Lưu trữ, `4.1.a`).
 *
 * AI/Gu/Trải nghiệm (mock không vẽ) dời xuống khu "Nâng cao" trong PixelSettingsShell — GIỮ
 * NGUYÊN logic, không xoá tính năng đang chạy thật (xem comment trong PixelSettingsShell.tsx).
 */

import { PixelSettingsShell } from './_components/PixelSettingsShell';
import { SettingsNavigator } from './_components/SettingsNavigator';
import { AppShell } from '@/components/studio/AppShell';
import { useT } from '@/lib/i18n';

/**
 * Hoà chỉ đạo 03/08: `/settings` bọc trong CÙNG `<AppShell>` như CAD/Render/Present (rail
 * capsule biến mất khỏi CẢ app, không chỉ 3 chặng) — Navigator = danh sách nhóm cài đặt
 * (`SettingsNavigator`, nhảy neo trong `PixelSettingsShell`). Không có "thư viện" hay "thêm"
 * hợp lý cho trang này — nút "+" mờ (`onNavigatorAdd` undefined), "Thư viện" đi `/library`
 * (giống các chặng khác).
 */
export default function SettingsPage() {
  const tr = useT();
  return (
    <AppShell
      active="render"
      navigator={<SettingsNavigator />}
      navigatorAddLabel={tr('Cài đặt', 'Settings')}
      navigatorCollapsedLabel={tr('Cài đặt', 'Settings')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PixelSettingsShell />
      </div>
    </AppShell>
  );
}
