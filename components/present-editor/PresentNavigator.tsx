'use client';

/**
 * components/present-editor/PresentNavigator.tsx — ổ ② Navigator cho chặng Trình bày (VIỆC 2
 * mở rộng 03/08). Danh sách TRANG thật (SPEC-HA-TANG-UI-IF §4: "Trình bày · Deck | Trang")
 * CHƯA nối được trong đợt này: `deck`/`current` sống là state cục bộ sâu trong
 * `PresentEditor.tsx` (qua `PresentSheets.tsx`), không có store dùng chung để Navigator (anh em
 * của `PresentEditor`, không phải cha/con) đọc được mà không state-lift xuyên nhiều lớp — việc
 * riêng, rủi ro cao hơn lợi ích trong 1 lượt cùng 4 Navigator khác. `SlideStrip.tsx` (dải
 * thumbnail ngang, đã có, nhận `deck`/`current` qua props) vẫn là nơi chuyển trang thật hiện
 * nay — không đụng.
 *
 * Để trống trung thực thay vì giả (đúng tinh thần "Layer State" của CAD Navigator — khai báo rõ
 * CHƯA có, không phải quên).
 *
 * Cửa chọn loại hồ sơ giờ nằm trước canvas. Navigator chỉ là lối tắt BOQ cho hồ sơ đang mở;
 * không liệt kê Văn bản/Video vì hai editor đó chưa tồn tại — tránh tạo menu có nút giả.
 */

import { FileSpreadsheet, ListTree } from 'lucide-react';
import { useT } from '@/lib/i18n';

export interface PresentNavigatorProps {
  boqActive?: boolean;
  onOpenBoq?: () => void;
  /** Đợt 4 (`docs/phieu-giao/editor-bang-bieu-mau.md`) — lối tắt "Bảng thống kê", cùng khuôn
   * `boqActive`/`onOpenBoq` (BOQ chỉ mở lại được từ màn chọn loại hồ sơ nếu không có lối tắt này). */
  scheduleActive?: boolean;
  onOpenSchedule?: () => void;
  /**
   * Hồ sơ đang mở đã có trang chưa. `false` = màn giữa đang là thư viện mẫu ⇒ KHÔNG có dải
   * thumbnail để trỏ tới. Bỏ trống = không biết ⇒ giữ nguyên câu cũ (không đoán hộ nơi gọi).
   */
  coHoSo?: boolean;
}

function NavShortcutButton({ active, onClick, icon, label }: { active?: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: 'calc(100% - 16px)', margin: '0 8px',
        height: 'var(--row, 28px)', padding: '0 10px', borderRadius: 'var(--r-2)', cursor: 'pointer', textAlign: 'left',
        border: 0, background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--t2)', fontWeight: active ? 600 : 400, fontSize: 12,
      }}
      title={label}
    >
      {icon}
      {label}
    </button>
  );
}

export function PresentNavigator({ boqActive, onOpenBoq, scheduleActive, onOpenSchedule, coHoSo }: PresentNavigatorProps) {
  const tr = useT();
  return (
    <div>
      {/* 20/08 — CHỈ DẪN PHẢI CÓ THỨ ĐỂ TRỎ VÀO. Đo trên app thật (tiền cảnh, dự án chưa có hồ
          sơ): ổ này in "Chuyển trang ở dải thumbnail dưới canvas" trong khi **chưa có canvas
          nào và 0 trang** — câu đúng ngữ pháp, trỏ vào hư không. Nay tách hai trạng thái:
          chưa có hồ sơ ⇒ nói ổ này SẼ liệt kê gì (đúng luật X2: khai rõ chưa có, không chặn);
          đã có hồ sơ ⇒ giữ nguyên câu cũ vì lúc đó dải thumbnail có thật. */}
      <div className="px-3 py-4 text-center text-[12px] leading-relaxed text-[var(--t4)]">
        {coHoSo === false
          ? tr(
              'Chưa chọn hồ sơ — chọn một mẫu ở giữa màn, danh sách trang sẽ hiện ở đây.',
              'No document yet — pick a template in the middle and the page list appears here.',
            )
          : tr(
              'Chuyển trang ở dải thumbnail dưới canvas.',
              'Switch pages in the thumbnail strip below the canvas.',
            )}
      </div>
      {onOpenBoq && (
        <NavShortcutButton
          active={boqActive}
          onClick={onOpenBoq}
          icon={<FileSpreadsheet size={14} style={{ flexShrink: 0 }} />}
          label={tr('Bảng khối lượng (BOQ)', 'Bill of quantities')}
        />
      )}
      {onOpenSchedule && (
        <NavShortcutButton
          active={scheduleActive}
          onClick={onOpenSchedule}
          icon={<ListTree size={14} style={{ flexShrink: 0 }} />}
          label={tr('Bảng thống kê', 'Schedule')}
        />
      )}
    </div>
  );
}
