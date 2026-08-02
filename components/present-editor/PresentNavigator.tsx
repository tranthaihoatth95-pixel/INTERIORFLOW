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
 */

import { useT } from '@/lib/i18n';

export function PresentNavigator() {
  const tr = useT();
  return (
    <div className="px-3 py-4 text-center text-[12px] leading-relaxed text-[var(--t4)]">
      {tr(
        'Danh sách trang sống trong dải thumbnail dưới canvas — Navigator trang riêng sẽ nối sau.',
        'Page list lives in the thumbnail strip below the canvas — a dedicated Navigator page list is planned.',
      )}
    </div>
  );
}
