'use client';

/**
 * components/render-studio/SectionPreviewOverlay.tsx — chỗ DUYỆT của việc cắt lớp (S2 BUILD#1).
 *
 * ⛔ **KHÔNG tự đẻ khung duyệt.** Khung là `components/studio/Checkpoint.tsx` (S5 dựng 05/08, luật
 * ghi thẳng trong docstring file đó: *"S2 (3D) · S3 · S4 gắn vào ĐÚNG file này — KHÔNG phiên nào
 * tự đẻ khung duyệt riêng"*). File này chỉ đóng 2 vai:
 *   ① VỎ NỔI — portal + lớp phủ + canh giữa, vì panel trái chỉ rộng 256px, không đủ để "thấy được
 *     sản phẩm" như §0e đòi. Vỏ KHÔNG chứa nút quyết định nào; mọi nút [Nhận]/[Làm lại]/[Sửa tham
 *     số] + tick từng phần + seed + nhãn hoàn tác đều của `Checkpoint`.
 *   ② NỘI DUNG `preview` — SVG vẽ ĐÚNG đám entity sắp ghi (không phải ảnh minh hoạ, không phải câu
 *     "đã tạo xong 69 nét"). `CheckpointProps.preview` là `ReactNode` chính vì mục đích này.
 *
 * 🔴 LỖI TÔI ĐÃ MẮC (ghi lại theo yêu cầu "lỗi đã mắc trong phiên"): bản đầu tôi tự dựng modal
 * riêng có nút Nhận/Huỷ — đúng thứ S5 vừa cấm. Phát hiện khi đọc `docs/CHECKLIST-TONG.md` để ghi ô
 * §9, thấy dòng changelog của S5. Đã thay bằng khung chung.
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Entity, Pt } from '@/lib/cad/model';
import { SECTION_CUT_LAYER, SECTION_VIEW_LAYER, SECTION_FAR_LAYER, SECTION_LAYERS, type SectionReport } from '@/lib/three/section-entities';
import { Checkpoint, selectedIds, toggleItem, type CheckpointItem, type CheckpointParam } from '@/components/studio/Checkpoint';
import { useT } from '@/lib/i18n';
import type { SectionLayerNames } from './SectionExtractPanel';

const MAU: Record<string, string> = {
  [SECTION_CUT_LAYER]: SECTION_LAYERS[0].color,
  [SECTION_VIEW_LAYER]: SECTION_LAYERS[1].color,
  [SECTION_FAR_LAYER]: SECTION_LAYERS[2].color,
};
const DAY: Record<string, number> = {
  [SECTION_CUT_LAYER]: 2.2,
  [SECTION_VIEW_LAYER]: 1.1,
  [SECTION_FAR_LAYER]: 0.6,
};

function pointsOf(e: Entity): Pt[] | null {
  if (e.type === 'polyline' || e.type === 'hatch') return e.points;
  return null;
}

export function SectionPreviewOverlay({
  report,
  label,
  layerNames,
  params,
  seed,
  soEntityTruoc,
  onNhan,
  onLamLai,
  onSuaThamSo,
  onHuy,
}: {
  report: SectionReport;
  label: string;
  layerNames: SectionLayerNames;
  params: CheckpointParam[];
  /** Cắt lớp TẤT ĐỊNH — cùng (khối, trục, cao độ) ra y hệt. Nên seed = chính bộ tham số đó, KHÔNG
   * truyền `null` (null làm `formatSeed` nói "chạy lại có thể ra khác" — sai với hàm thuần này). */
  seed: string;
  soEntityTruoc: number;
  /** chỉ nhận đúng những nhóm người dùng còn tick (KS3 — `Checkpoint` ép trả `ids`). */
  onNhan: (entities: Entity[]) => void;
  onLamLai: () => void;
  onSuaThamSo: () => void;
  onHuy: () => void;
}) {
  const tr = useT();

  const [items, setItems] = useState<CheckpointItem[]>(() => {
    const dem = (k: string) => report.entities.filter((e) => e.layer === k).length;
    return [
      { id: SECTION_CUT_LAYER, label: layerNames.cut, detail: tr(`${dem(SECTION_CUT_LAYER)} nét · bề dày 0.70mm`, `${dem(SECTION_CUT_LAYER)} lines · 0.70mm`), why: tr(`${report.cutLoops} vòng kín dò được từ hình học khối`, `${report.cutLoops} closed loops traced from the geometry`), selected: true },
      { id: SECTION_VIEW_LAYER, label: layerNames.view, detail: tr(`${dem(SECTION_VIEW_LAYER)} nét · bề dày 0.35mm`, `${dem(SECTION_VIEW_LAYER)} lines · 0.35mm`), why: tr('Phần nhìn thấy phía sau mặt phẳng cắt', 'Geometry visible behind the cutting plane'), selected: true },
      { id: SECTION_FAR_LAYER, label: layerNames.far, detail: tr(`${dem(SECTION_FAR_LAYER)} nét · bề dày 0.18mm`, `${dem(SECTION_FAR_LAYER)} lines · 0.18mm`), why: tr('Sâu hơn ngưỡng xa — quy ước dựng hình, không phải trị số tiêu chuẩn', 'Deeper than the far threshold — a drafting convention, not a standard value'), selected: true },
    ].filter((it) => dem(it.id) > 0);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onHuy(); } };
    window.addEventListener('keydown', onKey, true); // esc-only: chỉ xử Escape đóng lớp — đúng chuẩn dialog, không cần né ô nhập
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onHuy]);

  const { viewBox, veHatch, veLine } = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of report.entities) {
      for (const p of pointsOf(e) ?? []) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
    if (!Number.isFinite(minX)) return { viewBox: '0 0 100 100', veHatch: [], veLine: [] };
    const pad = Math.max(maxX - minX, maxY - minY) * 0.04 || 10;
    // SVG trục y HƯỚNG XUỐNG, bản vẽ CAD hướng LÊN ⇒ lật, không thì mặt cắt hiện lộn ngược.
    const flip = (p: Pt) => `${p.x},${maxY + minY - p.y}`;
    const h: { d: string; fill: string }[] = [];
    const l: { d: string; stroke: string; w: number }[] = [];
    for (const e of report.entities) {
      const pts = pointsOf(e);
      if (!pts?.length) continue;
      const d = pts.map(flip).join(' ');
      if (e.type === 'hatch') h.push({ d, fill: MAU[e.layer] ?? '#888' });
      else l.push({ d, stroke: MAU[e.layer] ?? '#888', w: DAY[e.layer] ?? 1 });
    }
    return { viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`, veHatch: h, veLine: l };
  }, [report]);

  const trong = report.entities.length === 0;

  const preview = trong ? (
    <p style={{ padding: '32px 0', textAlign: 'center', fontSize: 12, lineHeight: 1.6, color: 'var(--t4)' }}>
      {tr(
        'Mặt phẳng này không cắt trúng khối nào — đổi cao độ hoặc hướng rồi làm lại.',
        'This plane does not intersect any geometry — change the height or direction and retry.',
      )}
    </p>
  ) : (
    <div style={{ background: 'var(--field)', borderRadius: 'var(--radius-md)', padding: 10 }}>
      <svg viewBox={viewBox} style={{ display: 'block', width: '100%', maxHeight: '44vh' }} preserveAspectRatio="xMidYMid meet">
        {veHatch.map((h, i) => (
          <polygon key={`h${i}`} points={h.d} fill={h.fill} fillOpacity={0.5} />
        ))}
        {veLine.map((l, i) => (
          <polyline key={`l${i}`} points={l.d} fill="none" stroke={l.stroke} strokeWidth={l.w} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {report.cutOpenChains > 0 && (
        <p style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.6, color: 'var(--warning)' }}>
          {tr(
            `${report.cutOpenChains} chuỗi hở — chỗ đó không tô đặc (poché) được, hình học khối chưa kín.`,
            `${report.cutOpenChains} open chains — poché can't fill there, the geometry isn't watertight.`,
          )}
        </p>
      )}
      {report.warnings.map((w, i) => (
        <p key={i} style={{ marginTop: 4, fontSize: 10, lineHeight: 1.6, color: 'var(--t4)' }}>• {w}</p>
      ))}
    </div>
  );

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <button type="button" aria-label={tr('Huỷ', 'Cancel')} onClick={onHuy} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', border: 0, padding: 0 }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 760, maxHeight: '100%', overflow: 'auto' }}>
        <button
          type="button"
          onClick={onHuy}
          aria-label={tr('Đóng', 'Close')}
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 1, display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8, border: 0, background: 'transparent', color: 'var(--t3)', cursor: 'pointer' }}
        >
          <X size={15} />
        </button>
        <Checkpoint
          phase="preview"
          title={label}
          preview={preview}
          items={items}
          onItemsChange={setItems}
          params={params}
          seed={seed}
          undoLabel={tr(
            `bản vẽ trước khi nhận mặt cắt (${soEntityTruoc} đối tượng)`,
            `the drawing before accepting this section (${soEntityTruoc} objects)`,
          )}
          onAccept={(ids) => {
            const giu = new Set(ids);
            onNhan(report.entities.filter((e) => giu.has(e.layer)));
          }}
          onRetry={onLamLai}
          onEditParams={onSuaThamSo}
        />
      </div>
    </div>,
    document.body,
  );
}

/** Re-export để panel không phải nhớ import từ hai chỗ khi dựng `items`. */
export { selectedIds, toggleItem };
