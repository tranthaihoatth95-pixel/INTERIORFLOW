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

export default function SettingsPage() {
  return <PixelSettingsShell />;
}
