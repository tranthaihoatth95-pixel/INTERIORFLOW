'use client';

/**
 * components/home/widgets/ContributionGrid.tsx — [marker: DongStudio] "Lưới tích luỹ studio"
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.7) — kiểu GitHub-graph, ô ngày × ~10 tuần,
 * đậm theo hoạt động thật (Task xong + Flow cập nhật, tính ở `lib/home/aggregate.ts`).
 *
 * ⛔ CẤM ngôn ngữ streak/phạt (ràng buộc ⑤) — không có số "chuỗi ngày", không tô đỏ ngày trống,
 * không đếm ngược. Chỉ MỘT câu trung tính: tổng hoạt động trong khung đang xem.
 *
 * v2 (13/08 home-dong-studio-v2.md ④.4 lỗi #5) — đo trên app thật: lưới hiện dù chỉ 16 hoạt
 * động/10 tuần, trái luật "widget-mỏng-tự-ẩn" (một lưới gần trắng trông như lỗi/trống, không
 * như "studio đang thở"). Thêm `shouldShowActivityGrid` (lib/home/aggregate.ts, có test) —
 * hiện khi ĐỦ DÀY: tổng ≥30 HOẶC trải qua ≥4 tuần có hoạt động.
 */

import { useT, useLang } from '@/lib/i18n';
import { shouldShowActivityGrid } from '@/lib/home/aggregate';
import WidgetCard from './WidgetCard';
import type { HomeSummary } from './types';

const CELL = 11;
const GAP = 3;

/** 4 nấc đậm nhạt theo mật độ hoạt động — accent tím pha loãng dần, KHÔNG màu mới ngoài token. */
function cellColor(count: number, max: number): string {
  if (count <= 0) return 'var(--field)';
  const ratio = count / Math.max(1, max);
  if (ratio > 0.66) return 'var(--accent)';
  if (ratio > 0.33) return 'var(--accent-strong)';
  return 'var(--accent-soft)';
}

export default function ContributionGrid({ summary }: { summary: HomeSummary }) {
  const tr = useT();
  const lang = useLang();
  const days = summary.activityDays;
  const total = days.reduce((s, d) => s + d.count, 0);
  if (days.length === 0 || !shouldShowActivityGrid(days)) return null; // chưa đủ dày để đáng một ô riêng

  const max = Math.max(1, ...days.map((d) => d.count));
  // Gom theo cột-tuần: ngày đầu tiên trong mảng không nhất thiết là Chủ Nhật — đệm ô trống ĐẦU
  // tuần đầu tiên bằng offset theo getDay() để lưới thẳng hàng thứ-trong-tuần theo chiều dọc.
  const firstDate = new Date(days[0].date);
  const leadingBlank = Number.isNaN(firstDate.getTime()) ? 0 : firstDate.getDay();
  const cells: ({ date: string; count: number } | null)[] = [
    ...Array.from({ length: leadingBlank }, () => null),
    ...days,
  ];
  const weeks = Math.ceil(cells.length / 7);
  const width = weeks * (CELL + GAP);
  const height = 7 * (CELL + GAP);

  const fmtDay = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <WidgetCard title={tr('Lưới tích luỹ studio', 'Studio activity')}>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={tr('Lưới tích luỹ studio', 'Studio activity')}>
          {cells.map((c, i) => {
            const col = Math.floor(i / 7);
            const row = i % 7;
            if (!c) return null;
            return (
              <rect
                key={c.date}
                x={col * (CELL + GAP)}
                y={row * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2.5}
                fill={cellColor(c.count, max)}
              >
                <title>{`${fmtDay(c.date)} · ${c.count}`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-[length:var(--fs-2xs)] text-[var(--t4)]">
        {tr(`${total} hoạt động trong ~10 tuần qua`, `${total} activity in the last ~10 weeks`)}
      </p>
    </WidgetCard>
  );
}
