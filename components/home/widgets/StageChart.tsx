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
 * chạy tự động lúc mount, không cần JS/interval. ②~~"hover cột hiện số"~~ **BỎ 17/08 (P-X ④.V3)**:
 * số nay LUÔN HIỆN — giấu sau hover thì tablet và bàn phím không bao giờ đọc được, và nó để lại
 * đúng dải trống mà Hoà chỉ. Không còn state hover nào trong file. ③ nhãn số dùng `font-mono` (gu Swiss — số là nhân
 * vật, xem `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md`). ⚪ NGHI NỢ: bản "exploded axon 3 lớp
 * xếp tầng" (2D→3D→Trình chiếu) — đúng gu #4 nhưng KHÔNG kịp trong đợt này, ghi lại để làm sau,
 * bar chart hiện tại vẫn đọc đúng số liệu, không sai dữ liệu.
 */

import { STAGE_TINT } from '@/lib/phases';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import type { HomeSummary } from './types';

/** Một ô chặng: rộng `W`, cột cao tối đa `H`, cách nhau `GAP` — toạ độ viewBox, không phải px màn. */
const W = 64;
const H = 96;
const GAP = 28;
/** Dải trên dành cho SỐ luôn hiện · dải dưới dành cho tên chặng. Đường gốc nằm giữa hai dải. */
const TOP = 14;
const BASE_Y = TOP + H;
const VB_H = BASE_Y + 22;

/**
 * Cùng lý do `todayHasSignal` (TodayStrip.tsx) — MỘT nơi định nghĩa "ô E có gì để hiện".
 *
 * v4 (13/08, phiếu home-bento-v4.md ④.1) — ngưỡng SIẾT lại: "≥2 dự án có hoạt động". Dữ liệu
 * hiện có (`stageChart[].projects`, từ `buildStageCounts`) chỉ đếm dự án theo `currentStage`,
 * KHÔNG có cờ "có hoạt động" riêng theo từng dự án (không bịa thêm trường mới ngoài vùng file
 * phiếu này cho phép sửa) — mỗi dự án chỉ rơi vào ĐÚNG MỘT chặng nên TỔNG `projects` qua 3 chặng
 * = tổng số dự án của studio; dùng số đó làm ngưỡng gần đúng cho "đủ dự án để biểu đồ đáng một ô"
 * (một biểu đồ phân bố 3 cột với 1 dự án duy nhất không nói lên điều gì — luôn dồn hết vào 1 cột).
 */
export function stageChartHasSignal(summary: HomeSummary): boolean {
  return summary.stageChart.reduce((s, r) => s + r.projects, 0) >= 2;
}

export default function StageChart({ summary, index }: { summary: HomeSummary; index?: string }) {
  const tr = useT();
  const rows = summary.stageChart;

  if (!stageChartHasSignal(summary)) return null; // chưa có dự án nào — biểu đồ 3 cột rỗng không nói gì

  const maxVal = Math.max(1, ...rows.map((r) => Math.max(r.projects, r.openTasks)));
  const svgWidth = rows.length * W + (rows.length - 1) * GAP;

  return (
    <WidgetCard dense index={index} title={tr('Biểu đồ chặng', 'Stage overview')} bodyClassName="flex min-h-0 flex-col">
      {/* V3 (17/08, P-X ④.V3) — TRƯỚC: svg khoá cứng `height={H+24}` = 112px trong ô cao ~279px ⇒
          ~37% chiều cao ô là khoảng trắng chết (đúng ô Hoà chỉ: "một cột, hai cột rỗng, dưới là
          khoảng trắng lớn"). NAY: svg nhận `height="100%"` trong khung `flex-1`, giữ nguyên tỉ lệ
          (`meet`, không kéo méo chữ) nên cột CAO LÊN theo ô thay vì để trống. */}
      <div className="min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${svgWidth} ${VB_H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={tr('Biểu đồ chặng', 'Stage overview')}
        >
          {/* Đường gốc — chi tiết MANG TIN: có nó thì chặng 0 dự án đọc ra "đứng ở vạch 0", không
              đọc nhầm thành "thiếu dữ liệu". Trước đây cột 0 biến mất không dấu vết. */}
          <line x1={0} y1={BASE_Y} x2={svgWidth} y2={BASE_Y} stroke="var(--border)" strokeWidth="1" />
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
                <rect
                  className="stage-chart-bar"
                  x={px}
                  y={BASE_Y - pH}
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
                  y={BASE_Y - tH}
                  width={barW}
                  height={tH}
                  rx={4}
                  fill={color}
                  opacity={0.32}
                  style={{ transformOrigin: 'bottom', transformBox: 'fill-box' }}
                />
                {/* Số LUÔN HIỆN — trước đây chỉ hiện khi rê chuột, tức trên tablet/bàn phím thì
                    KHÔNG BAO GIỜ đọc được (luật "tablet không giấu sau hover"). Đưa số ra ngoài
                    vừa trả lại thông tin, vừa lấp đúng dải trống phía trên cột. */}
                <text
                  x={x + W / 2}
                  y={Math.max(11, BASE_Y - Math.max(pH, tH) - 4)}
                  textAnchor="middle"
                  fontFamily="var(--font-mono, ui-monospace, monospace)"
                  fontSize="10"
                  fontWeight={600}
                  fill="var(--t2)"
                >
                  {r.projects}/{r.openTasks}
                </text>
                <text x={x + W / 2} y={BASE_Y + 16} textAnchor="middle" fontSize="10.5" fill="var(--t3)">
                  {tr(r.label, r.labelEn)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-1 flex shrink-0 items-center gap-4 text-[length:var(--fs-2xs)] text-[var(--t3)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: 'var(--t3)' }} />
          {tr('dự án', 'projects')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-[2px] opacity-40" style={{ background: 'var(--t3)' }} />
          {tr('việc mở', 'open tasks')}
        </span>
      </div>
      <style jsx>{`
        .stage-chart-bar {
          animation: stage-chart-grow var(--nhip-bang) cubic-bezier(0.32, 0.72, 0, 1) both;
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
