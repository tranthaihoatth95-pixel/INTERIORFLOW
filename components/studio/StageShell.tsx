'use client';

/**
 * components/studio/StageShell.tsx — KHUNG XƯƠNG CHUNG 3 chặng (ƯU TIÊN 1, 03/08 —
 * `docs/SPEC-APP-SHELL-CHUNG.md` §3/§5, Figma `InteriorFlow · Design System` trang
 * "Shell · 3 chặng"). Trước đây mỗi chặng tự dựng shell: CAD/Presenting KHÔNG có rail
 * (lệch nặng nhất §1), Dashboard/FlowsPanel chỉ mount ở HomeScreen nên nút rail chết ở
 * chặng khác. Nay: MỘT shell — sửa 1 chỗ, cả 3 chặng theo.
 *
 * Cấu trúc (§3):
 *   HEADER (AppChrome — logo·tên dự án·segmented 3 chặng)
 *   RAIL trái (LeftRail + avatar + AccountMenu) | VÙNG LÀM VIỆC (children) | INSPECTOR (slot)
 *   THANH ĐÁY (statusBar slot — StatusBar chứa Vitals; zoom/pan sống trong canvas từng chặng)
 *
 * Slot theo spec: `inspector` (khung phải chung — bước 3), `bottomExtra` (phần riêng đáy,
 * đặt cạnh statusBar), `toolbar` để chặng nào cần thì truyền (hiện các chặng đã có toolbar
 * riêng trong children — slot khai sẵn cho bước sau, không ép dời ngay: additive).
 *
 * Dashboard + FlowsPanel mount TẠI ĐÂY (cả hai tự gate `dashboardOpen`/`panel==='flows'`
 * bên trong) → nút rail "Tổng quan"/"Dự án & Flow" sống ở MỌI chặng, không chỉ Render.
 * HomeScreen (render) cũng dùng StageShell nên 2 component này KHÔNG còn mount riêng ở đó
 * (tránh mount đôi — Dashboard overlay z-50 sẽ chồng 2 lớp).
 */

import type { ReactNode } from 'react';
import { AppChrome, type AppChromeActive } from '@/components/studio/AppChrome';
import { LeftRail } from '@/components/LeftRail';
import { Dashboard } from '@/components/Dashboard';
import { FlowsPanel } from '@/components/FlowsPanel';

interface Props {
  active: AppChromeActive;
  children: ReactNode;
  /** Khung Inspector phải dùng chung (bước 3) — width 280 theo Figma, bo/nhịp thống nhất. */
  inspector?: ReactNode;
  /** `<StatusBar stage=… />` của chặng (Vitals sống trong đó — mỗi chặng truyền props riêng
   * như `hidden={playing}` ở Presenting, nên nhận slot thay vì tự dựng). */
  statusBar?: ReactNode;
  /** Phần riêng của chặng nằm cạnh thanh đáy (spec §3 "bottomExtra") — chưa chặng nào dùng,
   * khai sẵn cho bước sau. */
  bottomExtra?: ReactNode;
  /** Toolbar riêng chặng — khai sẵn theo spec; hiện toolbar các chặng vẫn sống trong
   * children (additive, chưa ép dời). */
  toolbar?: ReactNode;
}

export function StageShell({ active, children, inspector, statusBar, bottomExtra, toolbar }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <AppChrome active={active} />
      <div className="relative flex min-h-0 flex-1">
        <LeftRail active={active} />
        <div className="relative flex min-w-0 flex-1 flex-col">
          {toolbar}
          {children}
        </div>
        {inspector && (
          <aside
            className="flex min-h-0 shrink-0 flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--panel)]"
            style={{ width: 280 }}
          >
            {inspector}
          </aside>
        )}
      </div>
      {bottomExtra}
      {statusBar}
      {/* Overlay/panel dùng chung — tự gate state bên trong, mount 1 lần cho cả 3 chặng */}
      <Dashboard />
      <FlowsPanel />
    </div>
  );
}
