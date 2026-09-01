'use client';

/**
 * components/tasks/GanttChart.tsx — DẢI GANTT của màn "Bảng việc" (tab Tiến độ).
 *
 * Mặt tiền của `lib/tasks/gantt.ts` (01/09) — trước bản đó là mã mồ côi: 0 nơi import.
 *
 * ── VÌ SAO TAB "TIẾN ĐỘ" TRỐNG SUỐT TỪ 08/08 ──────────────────────────────────────────────────
 * `TaskBoardScreen` ghi thẳng trong docstring: *"Tab Bảng/Tiến độ/Lịch: chỉ 'Bảng' có thật bản 1
 * — không vẽ nút giả (luật §9)"*. Đúng luật. Nay Tiến độ có thật vì đã có thứ nó cần: một dải
 * biết TỪ CHỐI vẽ.
 *
 * ── ĐIỀU MÀN NÀY KHÔNG LÀM ────────────────────────────────────────────────────────────────────
 *  ⛔ Không gán ngầm "hôm nay" cho việc thiếu ngày. Đó là chỗ mọi phần mềm Gantt nói dối: vẽ một
 *     thanh trông rất thật từ dữ liệu không có. Ở đây việc thiếu ngày xuống khối "chưa xếp được"
 *     KÈM LÝ DO, người đọc biết ngay phải điền gì.
 *  ⛔ Không bịa cửa sổ thời gian. Không việc nào xếp được ⇒ `cuaSo` là `null` ⇒ nói thẳng, không
 *     rơi về "tuần này".
 *  ⛔ **Không vẽ % tiến độ.** `TaskRow` KHÔNG có trường tiến độ (`grep progress|percent|tienDo`
 *     trong `lib/server/tasks.ts` ⇒ 0). Tô một thanh "xong 60%" từ hư không đúng là thứ cả module
 *     này sinh ra để chống — thiếu thì nói thiếu, không vẽ. Người phụ trách thì CÓ thật
 *     (`assigneeIds`) nên có hiện, dùng lại `initialsOf` của bảng việc.
 *  ⛔ Không tự đọc `Date.now()` lúc dựng: mốc "bây giờ" là THAM SỐ của `viecTreChuaXong()`, đọc
 *     một lần sau khi gắn (cũng là cách tránh lệch server/client lúc hydrate).
 *
 * ── MÀU MANG NGHĨA, VÀ NGHĨA ĐÓ PHẢI ĐÚNG (sửa 02/09, mắt Hoà) ─────────────────────────────────
 * Bản đầu tô đỏ theo `viecTre()` = "hạn đã trôi qua", nên việc ĐÃ XONG cũng đỏ như việc đang
 * cháy — báo động giả có quy mô. Nay ba nghĩa, ba màu, cùng bộ token bảng việc đang dùng
 * (`stateDotVar`): xong → `--success` dịu · trễ thật → `--danger` · còn lại → `--accent`.
 * Luật "trễ thật" lấy từ `viecTreChuaXong()`, cùng luật `board.countOverdue()` đã có — không đẻ
 * luật thứ hai (luật 6), và hết cảnh hai ô trên CÙNG một màn đếm theo hai kiểu.
 */

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';
import type { TaskRow, WorkflowStateRow } from '@/lib/server/tasks';
import { initialsOf } from '@/lib/tasks/board';
import { chiaNgay, dungGantt, viecTreChuaXong, type ThanhGantt } from '@/lib/tasks/gantt';
import { EmptyState } from '@/components/ui/EmptyState';

const MOT_NGAY_MS = 86_400_000;
/** Bề rộng cột tên. Rộng hơn bản đầu (220) vì tên việc thật dài — cắt quá tay thì cột tên
 *  thành một dãy dấu ba chấm, tức mất đúng thứ người ta vào đây để đọc. */
const COT_TEN = 280;

type Sac = 'xong' | 'tre' | 'chay';
const MAU: Record<Sac, string> = { xong: 'var(--success)', tre: 'var(--danger)', chay: 'var(--accent)' };

export interface GanttChartProps {
  /** Việc ĐANG HIỆN (đã qua lọc/tìm của màn bảng) — cùng nguồn với các cột, không truy vấn riêng. */
  tasks: readonly TaskRow[];
  /** Cột trạng thái của dự án — chỉ dùng để biết cột nào là ĐÃ XONG. Bỏ trống ⇒ không cột nào
   *  được coi là xong, và dải sẽ báo trễ rộng tay hơn (thà báo thừa còn hơn giấu). */
  states?: readonly WorkflowStateRow[];
}

export function GanttChart({ tasks, states = [] }: GanttChartProps) {
  const tr = useT();
  const en = useLang() === 'en';
  const dai = useMemo(() => dungGantt(tasks), [tasks]);

  const idDaXong = useMemo(
    () => new Set(states.filter((s) => s.isDone).map((s) => s.id)),
    [states],
  );
  const trangThai = useMemo(() => new Map(tasks.map((t) => [t.id, t.statusId])), [tasks]);
  const nguoiLam = useMemo(() => new Map(tasks.map((t) => [t.id, t.assigneeIds])), [tasks]);

  /* Giờ máy đọc MỘT LẦN sau khi gắn. Đọc trong lúc dựng thì bản server và bản client ra hai kết
     quả khác nhau (việc trễ / chưa trễ) — đúng loại lệch hydrate đã bắt được ở viewport 3D. */
  const [bayGio, setBayGio] = useState<number | null>(null);
  useEffect(() => setBayGio(Date.now()), []);
  const idTre = useMemo(
    () => new Set(bayGio === null ? [] : viecTreChuaXong(dai, bayGio, trangThai, idDaXong).map((b) => b.id)),
    [dai, bayGio, trangThai, idDaXong],
  );

  const ngay = (ms: number) =>
    new Date(ms).toLocaleDateString(en ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const sac = (b: ThanhGantt): Sac => {
    if (idTre.has(b.id)) return 'tre';
    const tt = trangThai.get(b.id);
    return tt && idDaXong.has(tt) ? 'xong' : 'chay';
  };

  if (!dai.cuaSo) {
    /* RỖNG CÓ LÝ DO — khác hẳn "chưa có việc nào": CÓ việc, nhưng không việc nào đủ ngày để đứng
       lên một trục thời gian. Nói ra được là sửa được. */
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
  const oNgay = chiaNgay(cuaSo);
  const nhip = Math.max(1, cuaSo.ketThuc - cuaSo.batDau);
  const viTriGio = bayGio !== null && bayGio >= cuaSo.batDau && bayGio <= cuaSo.ketThuc
    ? ((bayGio - cuaSo.batDau) / nhip) * 100
    : null;
  /* Nhãn ngày thưa dần khi cửa sổ dài — 47 ngày mà ghi đủ 47 nhãn thì thành một vệt mực. */
  const buocNhan = soNgay <= 14 ? 1 : soNgay <= 45 ? 7 : 14;

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16, display: 'grid', gap: 12, alignContent: 'start' }}>
      {/* ── đầu dải: cửa sổ THẬT (suy từ dữ liệu) + chú giải ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>
          {ngay(cuaSo.batDau)} → {ngay(cuaSo.ketThuc)}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--t4)', fontVariantNumeric: 'tabular-nums' }}>
          {tr(`${soNgay} ngày · ${dai.thanh.length} việc trên trục`, `${soNgay} day(s) · ${dai.thanh.length} task(s) on the timeline`)}
        </span>
        {idTre.size > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 9px', borderRadius: 6, background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />
            {tr(`${idTre.size} việc trễ hạn chưa xong`, `${idTre.size} overdue and unfinished`)}
          </span>
        )}
        <ChuGiai tr={tr} />
      </div>

      {/* ── lưới ─────────────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--panel)', overflow: 'hidden' }}>
        {/* trục ngày */}
        <div style={{ position: 'relative', height: 24, borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'absolute', left: COT_TEN, right: 0, top: 0, bottom: 0 }}>
            {oNgay.map((o, i) =>
              i % buocNhan === 0 ? (
                <span
                  key={o.ms}
                  style={{
                    position: 'absolute', left: `${o.traiPhanTram}%`, top: 5, fontSize: 10,
                    color: 'var(--t4)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                    transform: o.traiPhanTram > 92 ? 'translateX(-100%)' : 'none',
                  }}
                >
                  {new Date(o.ms).toLocaleDateString(en ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit' })}
                </span>
              ) : null,
            )}
            {viTriGio !== null && (
              <span
                style={{
                  position: 'absolute', left: `${viTriGio}%`, top: 4, transform: 'translateX(-50%)',
                  fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: 'var(--danger)',
                  background: 'var(--panel)', padding: '0 4px', whiteSpace: 'nowrap',
                }}
              >
                {tr('HÔM NAY', 'TODAY')}
              </span>
            )}
          </div>
        </div>

        {/* thân: nền lưới + vạch hôm nay là MỘT đường xuyên suốt, nằm dưới các hàng */}
        <div style={{ position: 'relative' }}>
          <div aria-hidden style={{ position: 'absolute', left: COT_TEN, right: 0, top: 0, bottom: 0, pointerEvents: 'none' }}>
            {oNgay.map((o) => (
              <div
                key={o.ms}
                style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${o.traiPhanTram}%`, width: `${o.rongPhanTram}%`,
                  background: o.cuoiTuan ? 'color-mix(in srgb, var(--t1) 4%, transparent)' : 'transparent',
                  borderLeft: o.dauTuan ? '1px solid var(--border)' : 'none',
                }}
              />
            ))}
            {viTriGio !== null && (
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${viTriGio}%`, width: 1, background: 'var(--danger)', opacity: 0.75 }} />
            )}
          </div>

          {dai.thanh.map((b) => (
            <Hang key={b.id} b={b} sac={sac(b)} nguoi={nguoiLam.get(b.id) ?? []} tr={tr} ngay={ngay} />
          ))}
        </div>
      </div>

      {dai.khongXepDuoc.length > 0 && <KhoiChuaXep dai={dai.khongXepDuoc} tr={tr} />}
    </div>
  );
}

/** Chú giải — không có nó thì màu chỉ là màu, người đọc phải tự đoán nghĩa. */
function ChuGiai({ tr }: { tr: (vi: string, en: string) => string }) {
  const o: [string, string][] = [
    [MAU.chay, tr('Đang làm', 'In progress')],
    [MAU.tre, tr('Trễ hạn', 'Overdue')],
    [MAU.xong, tr('Xong', 'Done')],
  ];
  return (
    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontSize: 10.5, color: 'var(--t4)' }}>
      {o.map(([mau, nhan]) => (
        <span key={nhan} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 5, borderRadius: 999, background: mau, opacity: nhan === tr('Xong', 'Done') ? 0.55 : 1 }} />
          {nhan}
        </span>
      ))}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 8, height: 8, transform: 'rotate(45deg)', borderRadius: 2, background: 'var(--t3)' }} />
        {tr('Cột mốc', 'Milestone')}
      </span>
    </span>
  );
}

/** Một hàng: tên việc + người phụ trách bên trái, thanh (hoặc cột mốc) trên rãnh bên phải. */
function Hang({
  b, sac, nguoi, tr, ngay,
}: {
  b: ThanhGantt;
  sac: Sac;
  nguoi: readonly string[];
  tr: (vi: string, en: string) => string;
  ngay: (ms: number) => string;
}) {
  const mau = MAU[sac];
  const mo = sac === 'xong' ? 0.55 : b.nguoc ? 0.7 : 1;
  const soNgay = Math.max(0, Math.round((b.ketThuc - b.batDau) / MOT_NGAY_MS));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${COT_TEN}px 1fr`, alignItems: 'center', height: 32, borderTop: '1px solid var(--border)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, padding: '0 12px' }}>
        <span
          title={b.tieuDe}
          style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {b.tieuDe}
        </span>
        {b.nguoc && (
          <span
            style={{ flex: 'none', fontSize: 9, fontWeight: 700, letterSpacing: '.04em', color: 'var(--danger)' }}
            title={tr('Ngày bắt đầu nằm SAU hạn — dữ liệu mâu thuẫn, vẫn vẽ nhưng phải nói ra', 'Start date is AFTER the due date — contradictory data, still drawn but flagged')}
          >
            {tr('NGƯỢC', 'REVERSED')}
          </span>
        )}
        {nguoi.length > 0 && (
          <span
            title={nguoi.join(', ')}
            style={{
              flex: 'none', width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: 'var(--field)', color: 'var(--t3)', fontSize: 8.5, fontWeight: 700,
            }}
          >
            {initialsOf(nguoi[0])}
          </span>
        )}
      </span>

      <div style={{ position: 'relative', height: '100%' }}>
        {b.laCotMoc ? (
          /* CỘT MỐC — việc chỉ có hạn, không có ngày bắt đầu. Vẽ một thanh dài ở đây là bịa ra
             một khoảng làm việc chưa ai khai. */
          <span
            title={`${tr('Cột mốc', 'Milestone')} · ${ngay(b.ketThuc)}`}
            style={{
              position: 'absolute', top: 'calc(50% - 5px)', left: `${b.traiPhanTram}%`, width: 10, height: 10,
              transform: 'translateX(-50%) rotate(45deg)', background: mau, opacity: mo, borderRadius: 2,
            }}
          />
        ) : (
          <div
            title={`${ngay(b.batDau)} → ${ngay(b.ketThuc)} · ${soNgay} ${tr('ngày', 'day(s)')}`}
            style={{
              position: 'absolute', top: 'calc(50% - 5px)', height: 10, borderRadius: 999,
              background: mau, opacity: mo,
              left: `${b.traiPhanTram}%`,
              // cửa sổ dẹt / bắt đầu trùng hạn ⇒ rongPhanTram = 0; vẫn phải THẤY được
              width: `max(6px, ${b.rongPhanTram}%)`,
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
