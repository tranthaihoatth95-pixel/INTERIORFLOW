'use client';

/**
 * components/tasks/GanttChart.tsx — DẢI GANTT của màn "Bảng việc" (tab Tiến độ).
 *
 * Mặt tiền của `lib/tasks/gantt.ts` (01/09) — trước bản này là mã mồ côi: 0 nơi import, tức cái
 * thước đã dựng xong mà không mặt nào đọc.
 *
 * ── VÌ SAO TAB "TIẾN ĐỘ" TRỐNG SUỐT TỪ 08/08 ──────────────────────────────────────────────────
 * `TaskBoardScreen` ghi thẳng trong docstring: *"Tab Bảng/Tiến độ/Lịch: chỉ 'Bảng' có thật bản 1
 * — không vẽ nút giả (luật §9)"*. Đúng luật. Nay Tiến độ có thật vì đã có thứ nó cần: một dải
 * biết TỪ CHỐI vẽ.
 *
 * ── ĐIỀU MÀN NÀY KHÔNG LÀM ────────────────────────────────────────────────────────────────────
 *  ⛔ Không gán ngầm "hôm nay" cho việc thiếu ngày. Đó là chỗ mọi phần mềm Gantt nói dối: vẽ một
 *     thanh trông rất thật từ một dữ liệu không có. Ở đây việc thiếu ngày đi xuống khối "chưa xếp
 *     được" KÈM LÝ DO, và người đọc biết ngay phải điền gì.
 *  ⛔ Không bịa cửa sổ thời gian. Không việc nào xếp được ⇒ `cuaSo` là `null` ⇒ màn nói thẳng,
 *     không rơi về "tuần này".
 *  ⛔ Không tự đọc `Date.now()` trong lúc dựng: mốc "bây giờ" là THAM SỐ của `viecTre()`, và màn
 *     này nói rõ nó lấy giờ ở đâu (giờ máy, đọc một lần sau khi gắn — cũng là cách tránh lệch
 *     server/client lúc hydrate).
 */

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';
import type { TaskRow } from '@/lib/server/tasks';
import { dungGantt, viecTre, type ThanhGantt } from '@/lib/tasks/gantt';
import { EmptyState } from '@/components/ui/EmptyState';

const MOT_NGAY_MS = 86_400_000;

export interface GanttChartProps {
  /** Danh sách việc ĐANG HIỆN (đã qua lọc/tìm của màn bảng) — cùng một nguồn với các cột. */
  tasks: readonly TaskRow[];
}

export function GanttChart({ tasks }: GanttChartProps) {
  const tr = useT();
  const en = useLang() === 'en';
  const dai = useMemo(() => dungGantt(tasks), [tasks]);

  /* Giờ máy đọc MỘT LẦN sau khi gắn. Đọc trong lúc dựng sẽ khiến bản server và bản client ra hai
     kết quả khác nhau (việc trễ / chưa trễ) — đúng loại lệch hydrate đã bắt được ở viewport 3D. */
  const [bayGio, setBayGio] = useState<number | null>(null);
  useEffect(() => setBayGio(Date.now()), []);
  const idTre = useMemo(
    () => new Set(bayGio === null ? [] : viecTre(dai, bayGio).map((b) => b.id)),
    [dai, bayGio],
  );

  const ngay = (ms: number) =>
    new Date(ms).toLocaleDateString(en ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (!dai.cuaSo) {
    /* RỖNG CÓ LÝ DO — khác hẳn "chưa có việc nào": có việc, nhưng không việc nào có đủ ngày để
       đứng lên một trục thời gian. Nói ra được là sửa được. */
    return (
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'grid', alignContent: 'center', justifyItems: 'center', gap: 18, padding: 24 }}>
        <EmptyState
          ghost="rows"
          icon={<CalendarClock size={18} />}
          title={tr('Chưa việc nào xếp được lên trục thời gian', 'No task can be placed on a timeline yet')}
          desc={tr(
            'Dải tiến độ chỉ vẽ việc CÓ HẠN. Việc thiếu ngày không được gán ngầm “hôm nay” rồi vẽ một thanh trông như thật — nó nằm nguyên ở danh sách dưới cho tới khi có ngày.',
            'The timeline only draws tasks that have a due date. A task without dates is never silently given “today” and drawn as a real bar — it stays in the list below until it has dates.',
          )}
        />
        {dai.khongXepDuoc.length > 0 && <KhoiChuaXep dai={dai.khongXepDuoc} tr={tr} />}
      </div>
    );
  }

  const { cuaSo } = dai;
  const soNgay = Math.max(1, Math.round(cuaSo.soNgay));
  // vạch mốc: đầu · giữa · cuối cửa sổ. Không chia theo tuần/tháng — cửa sổ suy từ DỮ LIỆU nên
  // độ dài của nó tuỳ dự án, một lưới cố định sẽ hoặc dày đặc hoặc trống trơn.
  const moc = [0, 0.5, 1];
  const viTriGioMs = bayGio !== null && bayGio >= cuaSo.batDau && bayGio <= cuaSo.ketThuc
    ? ((bayGio - cuaSo.batDau) / Math.max(1, cuaSo.ketThuc - cuaSo.batDau)) * 100
    : null;

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16, display: 'grid', gap: 14, alignContent: 'start' }}>
      {/* ── đầu dải: cửa sổ THẬT, suy từ dữ liệu ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>
          {ngay(cuaSo.batDau)} → {ngay(cuaSo.ketThuc)}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--t4)', fontVariantNumeric: 'tabular-nums' }}>
          {tr(
            `${soNgay} ngày · ${dai.thanh.length} việc trên trục`,
            `${soNgay} day(s) · ${dai.thanh.length} task(s) on the timeline`,
          )}
        </span>
        {idTre.size > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 9px', borderRadius: 6, background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />
            {tr(`${idTre.size} việc quá hạn theo giờ máy`, `${idTre.size} past due by machine clock`)}
          </span>
        )}
      </div>

      {/* ── lưới ── */}
      <div style={{ position: 'relative', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--panel)', overflow: 'hidden' }}>
        {/* vạch mốc + nhãn ngày */}
        <div style={{ position: 'relative', height: 26, borderBottom: '1px solid var(--border)' }}>
          {moc.map((m) => (
            <span
              key={m}
              style={{
                position: 'absolute', top: 6, left: `calc(${m * 100}% ${m === 0 ? '+ 10px' : m === 1 ? '- 10px' : ''})`,
                transform: m === 0 ? 'none' : m === 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                fontSize: 10.5, color: 'var(--t4)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
              }}
            >
              {ngay(cuaSo.batDau + (cuaSo.ketThuc - cuaSo.batDau) * m)}
            </span>
          ))}
        </div>

        <div style={{ display: 'grid' }}>
          {dai.thanh.map((b) => (
            <Hang key={b.id} b={b} tre={idTre.has(b.id)} viTriGio={viTriGioMs} tr={tr} ngay={ngay} />
          ))}
        </div>
      </div>

      {dai.khongXepDuoc.length > 0 && <KhoiChuaXep dai={dai.khongXepDuoc} tr={tr} />}
    </div>
  );
}

/** Một hàng: tên việc bên trái, thanh (hoặc cột mốc) trên rãnh bên phải. */
function Hang({
  b, tre, viTriGio, tr, ngay,
}: {
  b: ThanhGantt;
  tre: boolean;
  viTriGio: number | null;
  tr: (vi: string, en: string) => string;
  ngay: (ms: number) => string;
}) {
  const mau = tre ? 'var(--danger)' : b.nguoc ? 'var(--t3)' : 'var(--accent)';
  const soNgay = Math.max(0, Math.round((b.ketThuc - b.batDau) / MOT_NGAY_MS));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 220px) 1fr', alignItems: 'center', gap: 10, padding: '0 12px', height: 34, borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.tieuDe}>
        {b.tieuDe}
        {b.nguoc && (
          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 650, color: 'var(--danger)' }} title={tr('Ngày bắt đầu nằm SAU hạn — dữ liệu mâu thuẫn, vẫn vẽ nhưng phải nói ra', 'Start date is AFTER the due date — contradictory data, still drawn but flagged')}>
            {tr('NGƯỢC', 'REVERSED')}
          </span>
        )}
      </span>

      <div style={{ position: 'relative', height: 18 }}>
        {/* rãnh */}
        <div style={{ position: 'absolute', inset: '6px 0', borderRadius: 3, background: 'var(--field)' }} />
        {viTriGio !== null && (
          <div aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: `${viTriGio}%`, width: 1, background: 'color-mix(in srgb, var(--danger) 55%, transparent)' }} />
        )}
        {b.laCotMoc ? (
          /* CỘT MỐC — việc chỉ có hạn, không có ngày bắt đầu. Vẽ một thanh dài ở đây là bịa ra
             một khoảng làm việc chưa ai khai. */
          <span
            title={`${tr('Cột mốc', 'Milestone')} · ${ngay(b.ketThuc)}`}
            style={{
              position: 'absolute', top: 4, left: `${b.traiPhanTram}%`, width: 10, height: 10,
              transform: 'translateX(-50%) rotate(45deg)', background: mau, borderRadius: 2,
            }}
          />
        ) : (
          <div
            title={`${ngay(b.batDau)} → ${ngay(b.ketThuc)} · ${soNgay} ${tr('ngày', 'day(s)')}`}
            style={{
              // thanh dạng viên nang (`--r-full`) — gu IF: pill bo full, không bo số lẻ
              position: 'absolute', top: 4, height: 10, borderRadius: 999, background: mau,
              left: `${b.traiPhanTram}%`,
              // cửa sổ dẹt (mọi việc cùng một mốc) ⇒ rongPhanTram = 0; vẫn phải THẤY được thanh
              width: `max(6px, ${b.rongPhanTram}%)`,
              opacity: b.nguoc ? 0.65 : 1,
            }}
          />
        )}
      </div>
    </div>
  );
}

/** Khối "chưa xếp được" — mỗi việc một LÝ DO đọc được, không phải một con số tổng. */
function KhoiChuaXep({
  dai, tr,
}: {
  dai: { id: string; tieuDe: string; lyDo: string }[];
  tr: (vi: string, en: string) => string;
}) {
  return (
    <div style={{ width: '100%', maxWidth: 880, borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '7px 12px', fontSize: 11, fontWeight: 650, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)', background: 'var(--field)' }}>
        {tr(`${dai.length} việc chưa xếp được — không vẽ thanh giả`, `${dai.length} task(s) not placed — no fake bars`)}
      </div>
      <ul style={{ margin: 0, padding: '8px 12px', listStyle: 'none', display: 'grid', gap: 5 }}>
        {dai.map((v) => (
          <li key={v.id} style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.55 }}>
            <b style={{ fontWeight: 600, color: 'var(--t1)' }}>{v.tieuDe}</b>
            <span style={{ color: 'var(--t4)' }}> — {v.lyDo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
