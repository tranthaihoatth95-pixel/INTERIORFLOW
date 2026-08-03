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
 * TODO(H4): `PHIEU-PRESENT-G4.md` V6/H4 "màn chọn 5 loại hồ sơ" CHƯA xong — mục "Bảng khối
 * lượng (BOQ)" dưới đây là chỗ TẠM treo theo đúng chỉ dẫn B1 của `PHIEU-TRINH-BOQ-EDITOR.md`;
 * khi H4 xong thì BOQ trở thành 1 trong 5 thẻ loại hồ sơ ở đó, xoá mục tạm này.
 */

import { FileSpreadsheet } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function PresentNavigator({ boqActive, onOpenBoq }: { boqActive?: boolean; onOpenBoq?: () => void }) {
  const tr = useT();
  return (
    <div>
      <div className="px-3 py-4 text-center text-[12px] leading-relaxed text-[var(--t4)]">
        {tr(
          'Danh sách trang sống trong dải thumbnail dưới canvas — Navigator trang riêng sẽ nối sau.',
          'Page list lives in the thumbnail strip below the canvas — a dedicated Navigator page list is planned.',
        )}
      </div>
      {onOpenBoq && (
        <button
          type="button"
          onClick={onOpenBoq}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: 'calc(100% - 16px)', margin: '0 8px',
            height: 'var(--row, 28px)', padding: '0 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
            border: 0, background: boqActive ? 'var(--accent-soft)' : 'transparent',
            color: boqActive ? 'var(--accent)' : 'var(--t2)', fontWeight: boqActive ? 600 : 400, fontSize: 12,
          }}
          title={tr('Bảng khối lượng (BOQ) — tạm treo ở đây, chờ màn chọn 5 loại hồ sơ (H4)', 'Bill of quantities — parked here until the 5-document-type picker (H4) ships')}
        >
          <FileSpreadsheet size={14} style={{ flexShrink: 0 }} />
          {tr('Bảng khối lượng (BOQ)', 'Bill of quantities')}
        </button>
      )}
    </div>
  );
}
