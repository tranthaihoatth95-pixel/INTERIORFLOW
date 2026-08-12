'use client';

/**
 * components/home/widgets/StageChart.tsx — [marker: DongStudio] Ô E "Biểu đồ chặng" (bento v3,
 * docs/phieu-giao/home-bento-v3.md ④.2) — mỗi chặng 2D/3D/Trình chiếu một cột: số dự án đang ở
 * chặng đó + số việc mở. SVG THUẦN, không thư viện chart (đúng ràng buộc ⑤).
 *
 * Màu cột dùng `STAGE_TINT` (lib/phases.ts, đã có sẵn — dấu nhận diện thị giác chính thức của
 * từng chặng, KHÔNG bịa màu mới).
 *
 * v3 — ①"cột mọc lên 1 lần khi mount" (④.2 mục E): CSS `@keyframes` scaleY từ gốc ĐÁY
 * (`transform-origin: bottom`, `transform-box: fill-box`), KHÔNG animate opacity (luật G1) —
 * chạy tự động lúc mount, không cần JS/interval. ②"hover cột hiện số" — state hover đơn giản,
 * hiện số phía trên khi rê chuột đúng cột đó. ③ nhãn số dùng `font-mono` (gu Swiss — số là nhân
 * vật, xem `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md`). ⚪ NGHI NỢ: bản "exploded axon 3 lớp
 * xếp tầng" (2D→3D→Trình chiếu) — đúng gu #4 nhưng KHÔNG kịp trong đợt này, ghi lại để làm sau,
 * bar chart hiện tại vẫn đọc đúng số liệu, không sai dữ liệu.
 */

import { useState } from 'react';
import { STAGE_TINT, type Phase } from '@/lib/phases';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import type { HomeSummary } from './types';

const W = 64;
const H = 88;
const GAP = 28;

/** Cùng lý do `todayHasSignal` (TodayStrip.tsx) — MỘT nơi định nghĩa "ô E có gì để hiện". */
export function stageChartHasSignal(summary: HomeSummary): boolean {
  return summary.stageChart.reduce((s, r) => s + r.projects, 0) > 0;
}

export default function StageChart({ summary, index }: { summary: HomeSummary; index?: string }) {
  const tr = useT();
  const rows = summary.stageChart;
  const [hoverPhase, setHoverPhase] = useState<Phase | null>(null);

  if (!stageChartHasSignal(summary)) return null; // chưa có dự án nào — biểu đồ 3 cột rỗng không nói gì

  const maxVal = Math.max(1, ...rows.map((r) => Math.max(r.projects, r.openTasks)));
  const svgWidth = rows.length * W + (rows.length - 1) * GAP;

  return (
    <WidgetCard dense index={index} title={tr('Biểu đồ chặng', 'Stage overview')}>
      <svg viewBox={`0 0 ${svgWidth} ${H + 24}`} width="100%" height={H + 24} role="img" aria-label={tr('Biểu đồ chặng', 'Stage overview')}>
        {rows.map((r, i) => {
          const x = i * (W + GAP);
          const color = STAGE_TINT[r.phase];
          const pH = Math.round((r.projects / maxVal) * H);
          const tH = Math.round((r.openTasks / maxVal) * H);
          const barW = 20;
          const px = x + (W - barW * 2 - 6) / 2;
          const tx = px + barW + 6;
          const hovered = hoverPhase === r.phase;
          return (
            <g
              key={r.phase}
              onMouseEnter={() => setHoverPhase(r.phase)}
              onMouseLeave={() => setHoverPhase((p) => (p === r.phase ? null : p))}
              style={{ cursor: 'default' }}
            >
              {/* vùng bắt hover rộng hơn 2 cột mảnh — dễ trỏ đúng, không cần rê chính xác 20px */}
              <rect x={x} y={0} width={W} height={H} fill="transparent" />
              <rect
                className="stage-chart-bar"
                x={px}
                y={H - pH}
                width={barW}
                height={pH}
                rx={4}
                fill={color}
                opacity={0.9}
                style={{ transformOrigin: 'bottom', transformBox: 'fill-box' }}
              />
              <rect
                className="stage-chart-bar"
                x={tx}
                y={H - tH}
                width={barW}
                height={tH}
                rx={4}
                fill={color}
                opacity={0.32}
                style={{ transformOrigin: 'bottom', transformBox: 'fill-box' }}
              />
              {hovered && (
                <text x={x + W / 2} y={H - Math.max(pH, tH) - 6} textAnchor="middle" fontFamily="var(--font-mono, ui-monospace, monospace)" fontSize="10" fontWeight={600} fill="var(--t1)">
                  {r.projects}/{r.openTasks}
                </text>
              )}
              <text x={x + W / 2} y={H + 16} textAnchor="middle" fontSize="10.5" fill="var(--t3)">
                {tr(r.label, r.labelEn)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex items-center gap-4 text-[length:var(--fs-2xs)] text-[var(--t4)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: 'var(--t4)' }} />
          {tr('dự án', 'projects')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-[2px] opacity-40" style={{ background: 'var(--t4)' }} />
          {tr('việc mở', 'open tasks')}
        </span>
      </div>
      <style jsx>{`
        .stage-chart-bar {
          animation: stage-chart-grow 260ms cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        @keyframes stage-chart-grow {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .stage-chart-bar {
            animation: none !important;
          }
        }
      `}</style>
    </WidgetCard>
  );
}
