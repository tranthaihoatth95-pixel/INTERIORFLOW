'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, LogOut, PanelsTopLeft, Boxes, ClipboardList, ScrollText, Info } from 'lucide-react';
import { resetAllRolloutLayouts } from '@/components/studio/Rollout';
import { useFlowStore } from '@/lib/store';
import { AiDependencySettings } from '@/components/settings/AiDependencySettings';
import { GuModelSettings } from '@/components/settings/GuModelSettings';
import { ExperienceSettings } from '@/components/settings/ExperienceSettings';
import { LockScreenSettings } from '@/components/settings/LockScreenSettings';
import { UnitsScaleSettings } from '@/components/settings/UnitsScaleSettings';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { SETTINGS_MOCK_CSS } from '../_lib/settings-mock-css';
import { useSettingsLocalState } from '../_lib/local-state';
import { CanvasWallpaper } from './CanvasWallpaper';
import { ProfileCard } from './ProfileCard';
import { AppearanceCard } from './AppearanceCard';
import { StorageCard } from './StorageCard';

/**
 * VẬT MẪU mock-settings-polished.html — port markup/CSS 1:1 (xem settings-mock-css.ts). Icon =
 * lucide-react (docs/LUAT-GIAO-DIEN-BAT-BUOC.md L4), không glyph. AI/Gu/Trải nghiệm (mock không
 * vẽ) dời xuống khu "Nâng cao" — tính năng thật, KHÔNG xoá (L6).
 */
function ResetPanelLayoutRow() {
  const [done, setDone] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <PanelsTopLeft size={14} /> Bố cục panel
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--t2)' }}>
          Panel nào lỡ thu/kéo mất chỗ — đưa mọi panel về bố cục mặc định.
        </p>
      </div>
      <button
        type="button"
        className="ghost"
        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => {
          resetAllRolloutLayouts();
          setDone(true);
          window.setTimeout(() => setDone(false), 2500);
        }}
      >
        {done ? <><Check size={18} /> Đã đặt lại</> : 'Đặt lại bố cục panel'}
      </button>
    </div>
  );
}

/** VIỆC 3 (04/08, `docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md`) — lối vào MÀN QUẢN LÝ KHO VẬT LIỆU
 * (`/materials`). Đặt ở "Nâng cao" cùng cách `ResetPanelLayoutRow` — kho vật liệu là dữ liệu
 * thương mại dùng chung studio, gần với "cấu hình vận hành" hơn là cài đặt cá nhân/giao diện. */
function MaterialsWarehouseRow() {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Boxes size={14} /> Kho vật liệu
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--t2)' }}>
          Thêm/sửa/xoá vật liệu, giá, nhà cung cấp — nhập cả bằng Excel/CSV.
        </p>
      </div>
      <button
        type="button"
        className="ghost"
        style={{ flexShrink: 0 }}
        onClick={() => router.push('/materials')}
      >
        Mở kho vật liệu
      </button>
    </div>
  );
}

/** 08/08 (`docs/DOI-CHIEU-42-SPEC-2026-08-08.md §1#4`) — lối vào MÀN "BẢNG VIỆC" (`/tasks`, nền
 * `Task`/`WorkflowState` đã migrate xong nhưng chưa có client nào gọi — màn này là client đầu
 * tiên). Đặt cạnh `MaterialsWarehouseRow` — cùng nhóm "Nâng cao", cùng khuôn 1 dòng mô tả + 1 nút. */
function TaskBoardRow() {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <ClipboardList size={14} /> Bảng việc
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--t2)' }}>
          Việc theo dự án, chia cột trạng thái — thêm/sửa/xoá/đổi trạng thái.
        </p>
      </div>
      <button
        type="button"
        className="ghost"
        style={{ flexShrink: 0 }}
        onClick={() => router.push('/tasks')}
      >
        Mở bảng việc
      </button>
    </div>
  );
}

/** `docs/LICENSE-NOTES.md §2/§4` — "Ngay (~0 chi phí)": trang "Third-party licenses" phải vào
 * được từ Cài đặt VÀ từ màn About. Đặt cạnh `MaterialsWarehouseRow` — cùng nhóm "Nâng cao", cùng
 * cách 1 dòng mô tả + 1 nút. `AboutRow` là lối vào THỨ HAI (qua `/settings/about`, tự dẫn tiếp
 * sang licenses) — không mồ côi, N6 đã kiểm bằng mắt 2 nơi gọi này. */
function LegalRows() {
  const router = useRouter();
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <ScrollText size={14} /> Giấy phép bên thứ ba
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--t2)' }}>
            IF dùng một số mã nguồn mở — quan trọng nhất là GNU LibreDWG (GPL-3.0).
          </p>
        </div>
        <button type="button" className="ghost" style={{ flexShrink: 0 }} onClick={() => router.push('/settings/licenses')}>
          Xem giấy phép
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Info size={14} /> Giới thiệu InteriorFlow
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--t2)' }}>
            Phiên bản đang chạy, giấy phép bên thứ ba.
          </p>
        </div>
        <button type="button" className="ghost" style={{ flexShrink: 0 }} onClick={() => router.push('/settings/about')}>
          Mở
        </button>
      </div>
    </>
  );
}

export function PixelSettingsShell() {
  const router = useRouter();
  const user = useFlowStore((s) => s.user);
  const setUser = useFlowStore((s) => s.setUser);
  const { state, setWallpaper, setReducedMotion, setAutoBackup } = useSettingsLocalState();

  return (
    <div className="if-settings-outer">
      <RawStyle css={SETTINGS_MOCK_CSS} />
      <CanvasWallpaper />
      {/* LibrarySheet KHÔNG mount lẻ ở đây nữa (bản g4 cũ phải tự mount vì trang không qua
          StageShell) — nay `/settings` bọc trong AppShell, sheet mount 1 lần ở đó cho CẢ 5 màn. */}
      <div className="if-settings-app">
        {/* Rail (`components/LeftRail.tsx`) — XOÁ 03/08: `/settings` nay bọc trong `<AppShell>`
            (`app/settings/page.tsx`), Navigator = `SettingsNavigator` (nhảy neo tới từng nhóm,
            id khớp `#group-*` dưới đây). */}

        <div className="main">
          <button type="button" className="backlink" onClick={() => router.back()}>
            <ArrowLeft size={14} /> Quay lại
          </button>

          <h1>Cài đặt</h1>
          <div className="sub">Tài khoản · giao diện · nơi lưu file — áp cho cả app, màu dự án vẫn thuộc Brand Kit</div>

          <div id="group-profile" className="cols" style={{ scrollMarginTop: 16 }}>
            <ProfileCard />
            <div id="group-appearance" style={{ display: 'contents' }}>
              <AppearanceCard wallpaper={state.wallpaper} onPickWallpaper={setWallpaper} />
            </div>
            <div id="group-storage" style={{ display: 'contents' }}>
              <StorageCard
                reducedMotion={state.reducedMotion}
                autoBackup={state.autoBackup}
                onToggleReducedMotion={() => setReducedMotion(!state.reducedMotion)}
                onToggleAutoBackup={() => setAutoBackup(!state.autoBackup)}
              />
            </div>
          </div>

          {user && (
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/auth/me', { method: 'DELETE' });
                setUser(null);
                router.push('/');
              }}
              className="ghost"
              style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <LogOut size={18} /> Đăng xuất
            </button>
          )}

          <div id="group-advanced" style={{ marginTop: 32, maxWidth: 1000, scrollMarginTop: 16 }}>
            {/* V-1 cấm CHỮ HOA TOÀN PHẦN trên chuỗi CÓ DẤU ("Nâng cao" có â) — nhiều bộ chữ
                cắt mất dấu ở dạng hoa. Rail đã tự gỡ `uppercase` ngày 26/08 vì đúng lý do này;
                màn Cài đặt thì sót. Nhấn bằng ĐỘ ĐẬM + cỡ, không bằng chữ hoa.
                `letterSpacing` cũng bỏ: giãn chữ là mẹo đi kèm chữ hoa, hết hoa thì hết cần. */}
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>Nâng cao</h2>
            <p style={{ margin: '4px 0 12px', fontSize: 11, color: 'var(--t2)' }}>
              Chưa có trong bản mẫu pixel — giữ nguyên tính năng cũ, chưa đổi giao diện.
            </p>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* CHINH-5 bàn giao G4: nút nối `resetAllRolloutLayouts()` (export sẵn từ
                  components/studio/Rollout.tsx — G4 chỉ GỌI, không sửa file CHINH). Xoá mọi khoá
                  bố cục rollout đã nhớ (mở/đóng · thứ tự kéo · ghim) → panel về mặc định,
                  đúng SPEC-PANEL-ROLLOUT §2b "luôn nhìn thấy được". */}
              <ResetPanelLayoutRow />
              <MaterialsWarehouseRow />
              <TaskBoardRow />
              <LegalRows />
              <AiDependencySettings />
              <GuModelSettings />
              <ExperienceSettings />
              <LockScreenSettings />
              {/* Phiếu P-A `docs/phieu-giao/P-A-don-vi-ty-le.md` — cùng khuôn <section>+tr() với
                  4 nhóm phía trên, đặt cuối vì là bổ sung mới nhất trong "Nâng cao". */}
              <UnitsScaleSettings />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
