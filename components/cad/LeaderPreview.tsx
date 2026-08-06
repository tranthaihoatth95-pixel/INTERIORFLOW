'use client';

/**
 * components/cad/LeaderPreview.tsx — XEM TRƯỚC LEADER (§0e KS1, phiên S4).
 *
 * S5 cố tình cho `Checkpoint.preview` nhận **ReactNode chứ không nhận string**: bước xem trước
 * phải là **SẢN PHẨM THẬT**, không phải câu *"đã tạo xong 12 đối tượng"*. File này vẽ đúng hình
 * học sắp ghi vào `Doc` — cùng `anchor`/`knee`/`landingEnd`/`textAt` mà `leadersToEntities()`
 * sẽ dùng, không phải hình minh hoạ vẽ lại.
 *
 * Chỉ vẽ nhánh ĐÃ TICK ⇒ bỏ tick một nhãn là thấy nó biến mất khỏi bản xem trước ngay (KS3).
 * Điểm chỉ vẽ bằng chấm nhỏ, **không mũi tên** — đúng ISO 128-22 như chính leader.
 */

import type { LeaderLayout } from '@/lib/cad/plan-leader';
import { leaderKey } from '@/lib/cad/plan-leader';

export function LeaderPreview({
  layout,
  selected,
  width = 260,
  height = 150,
}: {
  layout: LeaderLayout;
  /** khoá các leader đang được tick; `null` = vẽ hết. */
  selected: string[] | null;
  width?: number;
  height?: number;
}) {
  const keep = selected ? new Set(selected) : null;
  const shown = layout.placed.filter((p, i) => !keep || keep.has(leaderKey(p, i)));

  if (!shown.length) {
    return (
      <div
        style={{ width, height, display: 'grid', placeItems: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--t5)', fontSize: 11, lineHeight: 1.5 }}
      >
        Không nhãn nào được chọn
      </div>
    );
  }

  // khung nhìn ôm trọn mọi điểm của các leader đang hiện (world mm, Y-up → SVG lật Y)
  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of shown) {
    for (const pt of [p.anchor, p.knee, p.landingEnd, p.textAt]) { xs.push(pt.x); ys.push(pt.y); }
  }
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
  const pad = Math.max(w, h) * 0.12;
  const vb = `${minX - pad} ${-(maxY + pad)} ${w + pad * 2} ${h + pad * 2}`;
  const unit = Math.max(w, h) / 160; // nét/chấm quy về px màn hình bất kể tỉ lệ bản vẽ

  return (
    <svg
      width={width}
      height={height}
      viewBox={vb}
      style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--field)' }}
      role="img"
      aria-label={`Xem trước ${shown.length} nhãn leader`}
    >
      {shown.map((p, i) => (
        <g key={`${p.id ?? i}`} stroke="var(--t2)" strokeWidth={unit} fill="none">
          {/* Y lật: world Y-up → SVG Y-down */}
          <polyline points={`${p.anchor.x},${-p.anchor.y} ${p.knee.x},${-p.knee.y} ${p.landingEnd.x},${-p.landingEnd.y}`} />
          <circle cx={p.anchor.x} cy={-p.anchor.y} r={unit * 1.8} fill="var(--t2)" stroke="none" />
          <text
            x={p.textAt.x}
            y={-p.textAt.y}
            fontSize={unit * 9}
            fill="var(--t2)"
            stroke="none"
            style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
          >
            {p.labelDisplay}
          </text>
        </g>
      ))}
    </svg>
  );
}
