'use client';

/**
 * components/materials/MaterialImpactPreview.tsx — Cổng R1 mục 4: "Material Impact preview".
 *
 * Bước XEM TRƯỚC chèn vào GIỮA "người dùng chọn vật liệu mới" và "ghi vào Doc" (KS3 duyệt từng
 * phần). Panel chỉ ĐỌC `inspectMaterialImpact()` (lib/materials/impact.ts) trên Doc hiện tại và
 * liệt kê nơi tiêu thụ với con số THẬT — nó KHÔNG tự ghi gì: bấm "Áp dụng" mới gọi `onApply` của
 * nơi cắm, và nơi cắm giữ NGUYÊN đường ghi + undo sẵn có (KS4). Không có tham chiếu nào thì vẫn
 * hiện panel với dòng "Không nơi nào khác dùng vật liệu này" — không giấu.
 *
 * Luật K4 (docs/00-CHOT.md): panel kính nổi PHẢI portal ra body, không lồng trong chrome kính —
 * MaterialPalette (nơi cắm đầu tiên) chính là một panel kính, lồng con vào là backdrop-filter chết.
 * Con số: chỉ hiện số impact.ts THẬT SỰ đếm được (số tham chiếu trong Doc theo từng nơi tiêu thụ).
 * Nơi tiêu thụ nào chỉ có cờ "phải đọc lại" mà không có số đếm riêng (Trình bày) thì ghi chữ
 * "đọc lại từ Doc" — không bịa số trang/slide (luật "không nút giả, không số giả").
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Palette, PencilRuler, Presentation, Ruler, Table2, Undo2 } from 'lucide-react';
import type { Doc } from '@/lib/cad/model';
import { inspectMaterialImpact, type MaterialImpact } from '@/lib/materials/impact';
import { useT } from '@/lib/i18n';

export interface MaterialImpactPreviewProps {
  doc: Doc;
  /** Các specId (ProductSpec.id) sắp bị thay — rỗng = đối tượng đang chọn chưa gán vật liệu. */
  specIds: readonly string[];
  /** Tên vật liệu MỚI người dùng vừa chọn — chỉ để hiển thị, nhãn lấy từ nơi cắm, không tự bịa. */
  nextName: string;
  /** Áp cho ĐÚNG những vật đang chọn. */
  onApply: () => void;
  onCancel: () => void;
  /**
   * G4 · MOAT (04/09) — nút thứ hai: áp cho MỌI chỗ trong dự án đang dùng vật liệu này
   * (`replaceMaterialReferences` không truyền `entityIds`, gồm cả `wallTypes`).
   *
   * Chỉ hiện khi nơi cắm CÓ đường đó VÀ phạm vi rộng thật sự lớn hơn tập đang chọn — bày một nút
   * "toàn dự án" đổi đúng bằng số vật đang chọn là bày một lựa chọn giả. Bảng phía trên chính là
   * con số của phạm vi rộng, nên người bấm biết trước mình vừa đụng vào bao nhiêu chỗ.
   */
  onApplyProject?: () => void;
  /** Số vật đang chọn — để nhãn nút nói đúng phạm vi hẹp, không nói chung chung. */
  selectedCount?: number;
}

interface ConsumerRow {
  key: string;
  icon: React.ComponentType<{ size?: number | string }>;
  labelVi: string;
  labelEn: string;
  /** Số tham chiếu trong Doc mà nơi tiêu thụ này đọc — null = chỉ có cờ, không có số đếm thật. */
  count: number | null;
  active: boolean;
}

/** Gộp impact của nhiều specId (đối tượng chọn có thể mang nhiều vật liệu khác nhau). */
function buildRows(impacts: MaterialImpact[]): ConsumerRow[] {
  const sum = (pick: (i: MaterialImpact) => number) => impacts.reduce((acc, i) => acc + pick(i), 0);
  const any = (pick: (i: MaterialImpact) => boolean) => impacts.some(pick);

  const entityRefs = sum((i) => i.counts.surface + i.counts.component);
  const wallRefs = sum((i) => i.counts['wall-default'] + i.counts['wall-layer']);
  const allRefs = sum((i) => i.totalReferences);
  const elevationRefs = wallRefs + sum((i) => i.counts.component);
  const boardSpecs = impacts.filter((i) => i.totalReferences > 0).length;

  return [
    { key: 'drawing2d', icon: PencilRuler, labelVi: 'Bản vẽ 2D', labelEn: '2D drawing', count: allRefs, active: any((i) => i.consumers.drawing2d) },
    { key: 'model3d', icon: Box, labelVi: 'Mô hình 3D', labelEn: '3D model', count: allRefs, active: any((i) => i.consumers.model3d) },
    { key: 'boq', icon: Table2, labelVi: 'BOQ / dự toán', labelEn: 'BOQ / estimate', count: entityRefs, active: any((i) => i.consumers.boq) },
    { key: 'elevations', icon: Ruler, labelVi: 'Mặt đứng', labelEn: 'Elevations', count: elevationRefs, active: any((i) => i.consumers.elevations) },
    { key: 'materialBoard', icon: Palette, labelVi: 'Bảng vật liệu', labelEn: 'Material board', count: boardSpecs, active: any((i) => i.consumers.materialBoard) },
    // Trình bày đọc lại Doc nhưng impact.ts không đếm được số trang/slide → không bịa số.
    { key: 'presenting', icon: Presentation, labelVi: 'Hồ sơ trình bày', labelEn: 'Presentation', count: null, active: any((i) => i.consumers.presenting) },
  ];
}

export default function MaterialImpactPreview({
  doc, specIds, nextName, onApply, onCancel, onApplyProject, selectedCount,
}: MaterialImpactPreviewProps) {
  const tr = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey); // esc-only: chỉ xử Escape đóng lớp — đúng chuẩn dialog, không cần né ô nhập
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const impacts = useMemo(
    () => Array.from(new Set(specIds.filter(Boolean))).map((id) => inspectMaterialImpact(doc, id)),
    [doc, specIds],
  );
  const total = impacts.reduce((acc, i) => acc + i.totalReferences, 0);
  const rows = useMemo(() => buildRows(impacts), [impacts]);

  if (!mounted) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal
      aria-label={tr('Ảnh hưởng khi đổi vật liệu', 'Impact of changing this material')}
      style={scrim}
      onClick={onCancel}
    >
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>
          {tr('Ảnh hưởng khi đổi', 'Impact of this change')}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, marginBottom: 10 }}>
          {tr('Đổi sang', 'Switching to')} <b style={{ color: 'var(--t2)' }}>{nextName}</b>
          {total > 0
            ? tr(` — ${total} tham chiếu trong dự án đọc lại.`, ` — ${total} references in this project update.`)
            : ''}
        </div>

        {total === 0 ? (
          <div style={emptyBox}>
            {tr('Không nơi nào khác dùng vật liệu này.', 'No other place uses this material.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.key} style={{ ...rowStyle, opacity: row.active ? 1 : 0.45 }}>
                  <span style={{ display: 'grid', placeItems: 'center', color: row.active ? 'var(--accent)' : 'var(--t4)' }}>
                    <Icon size={14} />
                  </span>
                  <span style={{ flex: 1, fontSize: 11.5, color: 'var(--t2)' }}>{tr(row.labelVi, row.labelEn)}</span>
                  <span style={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: row.active ? 'var(--t1)' : 'var(--t4)', fontWeight: 600 }}>
                    {!row.active
                      ? tr('không đổi', 'unchanged')
                      : row.count === null
                        ? tr('đọc lại từ Doc', 'reloads from Doc')
                        : tr(`${row.count} tham chiếu`, `${row.count} refs`)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--t4)', marginBottom: 12 }}>
          <Undo2 size={14} />
          {tr('Áp xong vẫn hoàn tác được (⌘Z).', 'You can still undo afterwards (⌘Z).')}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={onCancel} style={ghostBtn} className="if-impact-ghost">
            {tr('Huỷ', 'Cancel')}
          </button>
          {/* Phạm vi HẸP luôn là mặc định (autoFocus) — đổi ít là bước lùi được rẻ nhất. Phạm vi
              RỘNG phải bấm có chủ ý, và nhãn nói thẳng con số nó sẽ đụng. */}
          <button type="button" onClick={onApply} style={applyBtn} className="if-impact-apply" autoFocus>
            {typeof selectedCount === 'number' && selectedCount > 0
              ? tr(`Chỉ ${selectedCount} vùng đang chọn`, `Only ${selectedCount} selected`)
              : tr('Áp dụng', 'Apply')}
          </button>
          {onApplyProject && (
            <button type="button" onClick={onApplyProject} style={ghostBtn} className="if-impact-ghost">
              {total > 0
                ? tr(`Toàn dự án (${total} chỗ)`, `Whole project (${total})`)
                : tr('Toàn dự án', 'Whole project')}
            </button>
          )}
        </div>
      </div>
      {/* Hover chỉ đổi nền var(--nhip-bam), không scale (SPEC-HOVER-FOCUS-IDF: nút = đổi nền, cấm zoom). */}
      <style>{`
        .if-impact-ghost { transition: background var(--nhip-bam) ease; }
        .if-impact-ghost:hover { background: var(--hover); }
        .if-impact-apply { transition: background var(--nhip-bam) ease; }
        .if-impact-apply:hover { background: color-mix(in srgb, var(--accent) 88%, #000); }
      `}</style>
    </div>,
    document.body,
  );
}

const scrim: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 70, // trên MaterialPalette (45) và modal vật liệu (60)
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(10, 8, 6, 0.35)',
};
const card: React.CSSProperties = {
  width: 'min(340px, calc(100vw - 32px))',
  padding: 14,
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 12px 40px rgba(0,0,0,.28)',
};
const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '5px 6px',
  borderRadius: 10,
};
const emptyBox: React.CSSProperties = {
  padding: '10px 12px',
  marginBottom: 10,
  borderRadius: 10,
  border: '1px dashed var(--border)',
  background: 'var(--field)',
  fontSize: 11.5,
  lineHeight: 1.5,
  color: 'var(--t3)',
};
const ghostBtn: React.CSSProperties = {
  height: 30,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--t2)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
const applyBtn: React.CSSProperties = {
  height: 30,
  padding: '0 14px',
  borderRadius: 10,
  border: 0,
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
