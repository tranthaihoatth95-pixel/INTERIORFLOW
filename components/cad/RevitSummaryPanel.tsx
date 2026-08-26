'use client';

/**
 * components/cad/RevitSummaryPanel.tsx — lớp BIM 2D của mode Chuyên. Additive 100%: đọc lại
 * field `elementType` đã
 * có sẵn từ B1 (24/07, `lib/cad/model.ts`) — KHÔNG thêm field/data mới, chỉ đổi CÁCH HIỂN THỊ khi
 * bật mode Revit (đúng luật "mode = đổi bố cục, không đổi Doc").
 *
 * Skeleton đúng nghĩa (`docs/TICKET-UI-HATANG-2026-08-02.md` "chưa cần đủ nội dung từng mode") —
 * hiện TRẠNG THÁI gán cấu kiện BIM toàn Doc (đã gán bao nhiêu/tổng, theo từng loại), CHƯA làm
 * B2-B4 (nhận IFC/va chạm/xuất IFC, `CHOT-HUONG-3D-2026-08-01.md`) — nền cho các bậc đó xây tiếp.
 * Gán trực tiếp 1 entity vẫn qua ô có sẵn trong `SelectionInfoPanel` (B1 24/07), không lặp lại.
 */

import { useMemo } from 'react';
import { Boxes } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { ELEMENT_TYPE_OPTIONS, type ElementType } from '@/lib/cad/model';

// left:12,top:70 đã bị ZonePanel chiếm (hiện khi tool zone/arrow, có thể trùng lúc đang ở mode
// Revit) — neo từ ĐÁY bên trái để không đè, đối xứng với CamPathPanel (đáy-phải, D5).
// 07/08 M-UI-CAD sửa VIỆC 3+4: đây là panel NHIỀU CHỮ nổi trên canvas — không nằm trong 4 chỗ
// kính lỏng cho phép (G9, `.glass-float`), nên bỏ hẳn backdrop blur và nâng nền lên ĐẶC 96%
// (đúng luật `.vitals-pop`/G2 cho lớp nổi nhiều chữ) thay vì chỉ chạm ngưỡng tối thiểu 92%.
const panel: React.CSSProperties = {
  position: 'absolute',
  left: 12,
  bottom: 90,
  zIndex: 21,
  width: 240,
  background: 'color-mix(in srgb, var(--panel) 96%, transparent)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 10,
};

/** Đếm entity đã gán TỪNG loại `ElementType` (kể cả `null` = "đã kiểm, không phải BIM") — chỉ
 * đếm entity Base có field này (Line/Polyline/Rect/Hatch/Block… mọi type đều kế thừa Base). */
function countByElementType(entities: { elementType?: ElementType }[]): { assigned: number; total: number; byType: Map<string, number> } {
  const byType = new Map<string, number>();
  let assigned = 0;
  for (const e of entities) {
    if (e.elementType === undefined) continue; // chưa gán — không tính
    assigned += 1;
    const key = e.elementType === null ? 'null' : e.elementType;
    byType.set(key, (byType.get(key) ?? 0) + 1);
  }
  return { assigned, total: entities.length, byType };
}

export default function RevitSummaryPanel() {
  const entities = useCadStore((s) => s.doc.entities);
  const { assigned, total, byType } = useMemo(() => countByElementType(entities), [entities]);
  const pct = total > 0 ? Math.round((assigned / total) * 100) : 0;

  return (
    <div style={panel}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Boxes size={14} color="var(--accent)" />
        <p style={{ fontSize: 11.5, lineHeight: 1.5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 650, color: 'var(--t3)' }}>Cấu kiện BIM</p>
      </div>
      <p style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--t2)', marginBottom: 8 }}>
        Đã gán {assigned}/{total} đối tượng ({pct}%)
      </p>
      <div style={{ height: 4, borderRadius: 999, background: 'var(--field)', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ELEMENT_TYPE_OPTIONS.map((o) => {
          const n = byType.get(o.value) ?? 0;
          if (n === 0) return null;
          return (
            <div key={o.value} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, lineHeight: 1.5 }}>
              <span style={{ color: 'var(--t3)' }}>{o.label.split(' · ')[0]}</span>
              <span style={{ color: 'var(--t2)', fontWeight: 600 }}>{n}</span>
            </div>
          );
        })}
        {assigned === 0 && <p style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--t3)' }}>Chọn đối tượng → gán &ldquo;Cấu kiện BIM&rdquo; ở panel bên phải để bắt đầu.</p>}
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 10, lineHeight: 1.5 }}>
        BIM 2D đang dùng được: phân loại cấu kiện, tầng và type. Nhận IFC + va chạm vẫn chưa làm.
      </p>
    </div>
  );
}
