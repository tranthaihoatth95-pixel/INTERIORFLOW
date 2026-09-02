'use client';

/**
 * components/home/widgets/UpcomingList.tsx — [marker: DongStudio] "Lịch/mốc 2 tuần tới"
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.10) — kiểu DayTicker (Fantastical, NC
 * nguyên tắc #3): CHỈ hiện ngày CÓ mốc, bỏ hẳn ngày trống — không vẽ 14 ô đều tăm tắp.
 */

import { useRouter } from 'next/navigation';
import { useT, useLang } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import { goToProjectStage } from './nav';
import type { HomeSummary } from './types';

function fmtDayHeader(iso: string, en: boolean): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const weekday = d.toLocaleDateString(en ? 'en-US' : 'vi-VN', { weekday: 'short' });
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return en ? `${weekday} ${dd}/${mm}` : `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dd}/${mm}`;
}

/** Cùng lý do `todayHasSignal` (TodayStrip.tsx) — MỘT nơi định nghĩa "ô G có gì để hiện". */
export function upcomingHasSignal(summary: HomeSummary): boolean {
  return summary.upcoming.length > 0;
}

export default function UpcomingList({ summary, index }: { summary: HomeSummary; index?: string }) {
  const tr = useT();
  const lang = useLang();
  const router = useRouter();
  const days = summary.upcoming;
  if (!upcomingHasSignal(summary)) return null;

  return (
    <WidgetCard dense index={index} title={tr('Sắp tới', 'Upcoming')} bodyClassName="overflow-y-auto">
      {/* 🔴 R-3b (02/09) — XẾP DỌC, THÔI XẾP NGANG.
          Bản cũ là `flex gap-4 overflow-x-auto` với mỗi ngày `w-40 shrink-0` (160px cứng). Ô này
          là 2×1 — RỘNG và THẤP — nên hai cột ngày cạnh nhau không bao giờ vừa: máy đo trên ảnh
          18:28 ra `{chieu:'ngang', sw:688, cw:321}`, và mắt thấy chữ bị cắt GIỮA CÂU
          ("THỬ· Cột mốc — chỉ có."). `truncate` trên từng nút KHÔNG cứu được, vì thứ tràn là
          cả hàng cột, không phải chữ trong một nút.
          ⚠️ `overflow-x-auto` càng làm nó khó thấy: nó biến TRÀN thành CUỘN NGANG — không vỡ
          bố cục, nhưng người dùng phải cuộn ngang trong một ô cao 86px để đọc hết, và ai chỉ
          nhìn ảnh thì tưởng nội dung chỉ có bấy nhiêu. Đó là lý do lỗi này sống lâu.
          ⇒ Một cột dọc: ngày là nhãn, việc là hàng, mỗi hàng tự cắt bằng `…`. Bề ngang thành
          ràng buộc CỨNG (không còn đường tràn ngang), chiều cao thì `WidgetCard` đã có
          `overflow-y-auto` — cuộn DỌC là thứ ai cũng biết làm, cuộn ngang thì không. */}
      <div className="flex flex-col gap-2.5">
        {days.map((day) => (
          <div key={day.date} className="min-w-0">
            {/* v3 (ⓖ "hover ngày → tooltip tên việc") — tooltip native liệt kê MỌI việc trong
                ngày, kể cả phần bị "+N việc khác" gấp gọn bên dưới. */}
            <div
              className="mb-1.5 text-[length:var(--fs-2xs)] font-semibold tracking-[.01em] text-[var(--t4)]"
              title={day.items.map((t) => t.title).join('\n')}
            >
              {fmtDayHeader(day.date, lang === 'en')}
            </div>
            <ul className="space-y-1">
              {day.items.slice(0, 4).map((t) => (
                <li key={t.id} className="min-w-0">
                  {/* `block` + `min-w-0` là hai thứ làm `truncate` chạy THẬT. `truncate` chỉ là
                      `overflow:hidden` + `text-overflow:ellipsis` + `white-space:nowrap`; trên
                      một phần tử co được theo nội dung thì nó không có gì để cắt, nên chữ cứ
                      tràn ra. Đây là lý do bản cũ ĐÃ CÓ `truncate` mà vẫn cắt giữa chữ. */}
                  <button
                    type="button"
                    onClick={() => goToProjectStage(router, t.projectId, t.stage)}
                    className="block w-full min-w-0 truncate rounded-[var(--r-2)] px-2 py-1 text-left text-[length:var(--fs-xs)] text-[var(--t2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
                    title={t.projectName ? `${t.title} · ${t.projectName}` : t.title}
                  >
                    {t.title}
                  </button>
                </li>
              ))}
              {day.items.length > 4 && (
                <li className="px-2 text-[length:var(--fs-2xs)] text-[var(--t4)]">
                  {tr(`+${day.items.length - 4} việc khác`, `+${day.items.length - 4} more`)}
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
