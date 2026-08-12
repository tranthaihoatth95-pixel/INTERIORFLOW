'use client';

/**
 * components/home/widgets/StageChart.tsx — [marker: DongStudio] "Biểu đồ chặng"
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.6) — mỗi chặng 2D/3D/Trình chiếu một cột:
 * số dự án đang ở chặng đó + số việc mở. SVG THUẦN, không thư viện chart (đúng ràng buộc ⑤).
 *
 * Màu cột dùng `STAGE_TINT` (lib/phases.ts, đã có sẵn — dấu nhận diện thị giác chính thức của
 * từng chặng, KHÔNG bịa màu mới).
 */

import { STAGE_TINT } from '@/lib/phases';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import type { HomeSummary } from './types';

const W = 64;
const H = 88;
const GAP = 28;

export default function StageChart({ summary }: { summary: HomeSummary }) {
  const tr = useT();
  const rows = summary.stageChart;

  const totalProjects = rows.reduce((s, r) => s + r.projects, 0);
  if (totalProjects === 0) return null; // chưa có dự án nào — biểu đồ 3 cột rỗng không nói gì

  const maxVal = Math.max(1, ...rows.map((r) => Math.max(r.projects, r.openTasks)));
  const svgWidth = rows.length * W + (rows.length - 1) * GAP;

  return (
    <WidgetCard title={tr('Biểu đồ chặng', 'Stage overview')}>
      <svg viewBox={`0 0 ${svgWidth} ${H + 24}`} width="100%" height={H + 24} role="img" aria-label={tr('Biểu đồ chặng', 'Stage overview')}>
        {rows.map((r, i) => {
          const x = i * (W + GAP);
          const color = STAGE_TINT[r.phase];
          const pH = Math.round((r.projects / maxVal) * H);
          const tH = Math.round((r.openTasks / maxVal) * H);
          const barW = 20;
          const px = x + (W - barW * 2 - 6) / 2;
          const tx = px + barW + 6;
          return (
            <g key={r.phase}>
              <rect x={px} y={H - pH} width={barW} height={pH} rx={4} fill={color} opacity={0.9} />
              <rect x={tx} y={H - tH} width={barW} height={tH} rx={4} fill={color} opacity={0.32} />
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
    </WidgetCard>
  );
}
