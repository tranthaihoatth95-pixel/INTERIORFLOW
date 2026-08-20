'use client';

/**
 * components/studio/HoatDongChuong.tsx — CHUÔNG HOẠT ĐỘNG, cụm phải-trên (`CumPhaiTren.tsx`).
 *
 * Trả lời "cái gì đang chạy/sắp tới" (tiến độ) — KHÁC Vitals (`VitalsAperture.tsx`, trả lời
 * "tôi nên biết gì" — lời khuyên). Hai hệ tách biệt cả không gian lẫn nghĩa, brief cấm gộp.
 *
 * BA MỨC, cùng LUẬT MỌC-TỪ-NGUỒN đã chứng minh chạy đúng ở `VitalsAperture.tsx` — KHÔNG dựng
 * cơ chế panel-nổi thứ hai ([Đ2] EXTEND):
 *   ① gọn   — chấm/số tóm tắt trên nút chuông, luôn thấy.
 *   ② peek  — bấm → viên kính nhỏ nở ra TỪ TÂM nút chuông (`transform-origin` tại chỗ bấm,
 *              cùng `nhipToiBac('vien')` từ `lib/ui/nhip.ts` — nơi khai nhịp DUY NHẤT của app).
 *   ③ đầy đủ — bấm "Xem tất cả" trong peek → cột PHẢI, vật liệu `dac` (gần-đặc, KHÔNG kính —
 *              luật vật liệu §IX: dock nội dung dày phải ĐẶC để đọc được, kính chỉ ở lớp vỏ).
 *
 * NGUỒN DỮ LIỆU — [Đ2] CONNECT, không đẻ hàng đợi thứ ba: `useFlowStore.flowRuns` +
 * `useRenderQueue.jobs`, gộp qua lõi thuần `hoat-dong-luong.ts` (test độc lập ở đó).
 *
 * KHAI THẬT — hôm nay (20/08) app demo không có job thật đang chạy khi phiên này viết code:
 * nếu `window.__ifHoatDongDemo` bật (chỉ ngoài production, cùng khuôn `render-queue-store.ts`
 * dùng cho job `demo`), chèn THÊM một mục demo rõ nhãn "(demo)" vào nhóm "Đang chạy" — KHÔNG
 * BAO GIỜ tự bật một mình, và không thay thế dữ liệu thật khi có.
 */

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, ArrowRight } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useRenderQueue } from '@/components/render-studio/render-queue-store';
import { useT } from '@/lib/i18n';
import { useDismissable } from '@/lib/useDismissable';
import { DUONG_CONG, nhipToiBac, thoiLuong, giamChuyenDong } from '@/lib/ui/nhip';
import {
  gomHoatDong,
  tomTatGon,
  tongSoDangHoatDong,
  tuFlowRuns,
  tuRenderQueue,
  THU_TU_NHOM,
  NHAN_NHOM,
  type MucHoatDong,
} from '@/components/studio/hoat-dong-luong';
import LightBar from '@/components/ui/LightBar';

type Muc = 'gon' | 'peek' | 'day';

/** Mục demo — CHỈ khi cờ ngoài-production bật, KHÔNG có job thật nào chạy. Xem docstring trên. */
function mucDemo(): MucHoatDong[] {
  if (typeof window === 'undefined') return [];
  if (process.env.NODE_ENV === 'production') return [];
  if (!(window as unknown as Record<string, unknown>).__ifHoatDongDemo) return [];
  return [
    {
      id: 'demo:1',
      nguon: 'view',
      nhan: 'Phối cảnh phòng khách (demo)',
      chang: 'Thiết kế 3D',
      nangLuc: 'Sketch → Render',
      nhom: 'dangChay',
      coKetQua: false,
      canNguoiDuyet: false,
      thoiGian: Date.now(),
    },
  ];
}

function DongMuc({ m, tr }: { m: MucHoatDong; tr: (vi: string, en: string) => string }) {
  return (
    <li className="rounded-[var(--r-2)] px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-[length:var(--fs-ui)] text-[var(--t1)]">{m.nhan}</span>
        {m.canNguoiDuyet && (
          <span
            className="shrink-0 rounded-[var(--r-1)] px-1.5 py-0.5 text-[length:var(--fs-xs)]"
            style={{ background: 'color-mix(in srgb, var(--danger) 16%, transparent)', color: 'var(--danger)' }}
          >
            {tr('cần quyết', 'needs decision')}
          </span>
        )}
      </div>
      <div className="mt-0.5 truncate text-[length:var(--fs-xs)] text-[var(--t3)]">
        {m.chang}
        {m.nangLuc ? ` · ${m.nangLuc}` : ''}
      </div>
      {m.nhom === 'dangChay' && (
        <div className="mt-1.5">
          <LightBar value={undefined} height={5} soVach={28} hienSo={false} />
        </div>
      )}
      {m.loiDo && <div className="mt-1 text-[length:var(--fs-xs)] text-[var(--danger)]">{m.loiDo}</div>}
    </li>
  );
}

export function HoatDongChuong() {
  const tr = useT();
  const [muc, setMuc] = useState<Muc>('gon');
  const nutRef = useRef<HTMLButtonElement>(null);
  const tamRef = useRef<HTMLDivElement>(null);
  const [neo, setNeo] = useState<{ top: number; right: number } | null>(null);
  const [daNo, setDaNo] = useState(false);

  const flowRuns = useFlowStore((s) => s.flowRuns);
  const nodes = useFlowStore((s) => s.nodes);
  const jobs = useRenderQueue((s) => s.jobs);

  const loaiNode = useMemo(() => {
    const m = new Map(nodes.map((n) => [n.id, n.type ?? n.data?.defType]));
    return (id: string) => m.get(id) as string | undefined;
  }, [nodes]);

  // Không dùng useMemo cho phần gộp: danh sách nhỏ (job/lượt chạy hiện có, tối đa vài chục),
  // và cờ demo `__ifHoatDongDemo` có thể bật/tắt bất cứ lúc nào ngoài vòng đời React (console/
  // devtool) — memo hoá theo [flowRuns, jobs] sẽ bỏ lỡ thay đổi đó cho tới khi có job thật.
  const gom = gomHoatDong([...tuFlowRuns(flowRuns, loaiNode), ...tuRenderQueue(jobs), ...mucDemo()]);

  const tomTat = tomTatGon(gom, tr);
  const tongDang = tongSoDangHoatDong(gom);

  useLayoutEffect(() => {
    if (muc === 'gon') return;
    const el = nutRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setNeo({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    const id = requestAnimationFrame(() => setDaNo(true));
    return () => cancelAnimationFrame(id);
  }, [muc]);

  const dong = () => {
    setDaNo(false);
    setMuc('gon');
  };

  useDismissable({ open: muc !== 'gon', onDismiss: dong, refs: [nutRef, tamRef] });

  const giam = giamChuyenDong();
  const msPeek = thoiLuong(nhipToiBac('vien'), giam);
  const msDay = thoiLuong(nhipToiBac('bang'), giam);

  return (
    <div className="relative shrink-0">
      <button
        ref={nutRef}
        type="button"
        onClick={() => setMuc((m) => (m === 'gon' ? 'peek' : 'gon'))}
        aria-expanded={muc !== 'gon'}
        aria-haspopup="dialog"
        aria-label={
          tongDang > 0
            ? tr(`Hoạt động — ${tomTat}`, `Activity — ${tomTat}`)
            : tr('Hoạt động — không có gì đang chạy', 'Activity — nothing running')
        }
        className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--r-full)] transition-colors duration-[120ms] hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        style={{ background: muc !== 'gon' ? 'var(--hover)' : 'transparent' }}
      >
        <span className="relative">
          <Bell size={16} className="text-[var(--t2)]" />
          {tongDang > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-[var(--r-full)] px-[3px] text-[9px] font-semibold tabular-nums leading-none"
              style={{
                background: gom.canXem.length || gom.loi.length ? 'var(--danger)' : 'var(--accent)',
                color: '#fff',
              }}
            >
              {tongDang}
            </span>
          )}
        </span>
      </button>

      {muc !== 'gon' &&
        neo &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tamRef}
            role="dialog"
            aria-label={tr('Hoạt động', 'Activity')}
            style={{
              position: 'fixed',
              top: neo.top,
              right: neo.right,
              zIndex: 60,
              transformOrigin: '90% 0%',
              transform: daNo ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
              opacity: daNo ? 1 : 0,
              transition:
                msPeek === 0 ? 'none' : `transform ${msPeek}ms ${DUONG_CONG}, opacity ${Math.round(msPeek * 0.8)}ms ${DUONG_CONG}`,
            }}
          >
            {muc === 'peek' ? (
              <div
                className="be-mat-noi be-mat-noi--kinh overflow-hidden rounded-[var(--r-3)] p-2"
                style={{ width: 280 }}
              >
                {tongDang === 0 && gom.sanSang.length === 0 && gom.vuaXong.length === 0 ? (
                  <p className="px-1.5 py-1 text-[length:var(--fs-xs)] leading-relaxed text-[var(--t3)]">
                    {tr('Không có gì đang chạy hoặc chờ.', 'Nothing running or waiting.')}
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {THU_TU_NHOM.flatMap((n) => gom[n])
                      .slice(0, 4)
                      .map((m) => (
                        <DongMuc key={m.id} m={m} tr={tr} />
                      ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setMuc('day')}
                  className="mt-1 flex w-full items-center justify-between rounded-[var(--r-2)] px-1.5 py-1 text-[length:var(--fs-xs)] text-[var(--t2)] transition-colors duration-[120ms] hover:bg-[var(--hover)]"
                >
                  {tr('Xem tất cả', 'View all')}
                  <ArrowRight size={12} />
                </button>
              </div>
            ) : (
              <div
                className="be-mat-noi be-mat-noi--dac flex max-h-[80vh] flex-col overflow-hidden rounded-[var(--r-3)]"
                style={{ width: 340 }}
              >
                <div className="flex items-center justify-between border-b border-[var(--vien-mo)] px-3 py-2">
                  <span className="text-[length:var(--fs-ui)] font-semibold text-[var(--t1)]">
                    {tr('Hoạt động', 'Activity')}
                  </span>
                  <button
                    type="button"
                    onClick={dong}
                    className="text-[length:var(--fs-xs)] text-[var(--t3)] hover:text-[var(--t1)]"
                  >
                    {tr('Đóng', 'Close')}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-2">
                  {THU_TU_NHOM.map((n) =>
                    gom[n].length === 0 ? null : (
                      <div key={n} className="mb-3">
                        <div className="px-1.5 pb-1 text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--t3)]">
                          {tr(NHAN_NHOM[n].vi, NHAN_NHOM[n].en)} · {gom[n].length}
                        </div>
                        <ul className="space-y-0.5">
                          {gom[n].map((m) => (
                            <DongMuc key={m.id} m={m} tr={tr} />
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                  {tongDang === 0 && gom.sanSang.length === 0 && gom.vuaXong.length === 0 && (
                    <p className="px-1.5 py-2 text-[length:var(--fs-xs)] leading-relaxed text-[var(--t3)]">
                      {tr('Chưa có việc nào chạy trong dự án này.', 'Nothing has run in this project yet.')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default HoatDongChuong;
