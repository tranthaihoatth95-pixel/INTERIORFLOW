'use client';

/**
 * components/studio/VitalsAperture.tsx — KHẨU ĐỘ VITALS ở mép trên (Experience System điều 7,
 * Hoà duyệt mắt 20/08). Vitals nằm VẬT LÝ trong vỏ app như một khẩu độ sống, KHÔNG phải popover
 * gắn thêm lên trên.
 *
 * BA MỨC — mỗi mức trả lời MỘT câu khác nhau (không phải một thứ to/nhỏ ba cỡ, luật 16/08
 * "ba nấc là ba công năng"):
 *   ① Ambient  — *"Vitals đang sống, và có/không có gì đó"* · nhỏ, im, LUÔN THẤY ở mọi màn.
 *   ② Peek     — *"tôi nên biết gì"* · tối đa 3 tín hiệu THẬT; rê vào (có trễ) · focus · bấm ·
 *                nhấn giữ trên cảm ứng.
 *   ③ Engage   — *"nói chuyện với nó"* · mở ĐÚNG bề mặt chat Vitals đã có
 *                (`VitalsChatSurface`, tách ra từ `VitalsPill.tsx` — không dựng tấm thứ hai).
 *
 * [Đ2] LOOK INSIDE trước khi dựng — bốn mảnh Vitals sẵn có, xử lý từng mảnh:
 *   · `VitalsIcon.tsx`        → DÙNG LẠI (glyph, mọi mức).
 *   · `VitalsStateBadge.tsx`  → DÙNG LẠI `VitalsStateDot` + bộ `VitalsState` (idle/answering/
 *                               alert) làm ngôn ngữ trạng thái. KHÔNG đẻ bảng trạng thái thứ hai.
 *   · `VitalsChatBubble.tsx`  → thuộc VitalsGesture, không đụng.
 *   · `VitalsGesture.tsx`     → 🔴 **BẢN CŨ, ĐÃ MỒ CÔI** — nơi mount DUY NHẤT của nó là
 *     `StageSwitcher.tsx`, mà StageSwitcher đã bị gỡ khỏi header 17/08 và `grep` toàn repo cho
 *     thấy KHÔNG route nào còn mount nó. Hệ quả đo được: chip "Vitals" ở `StatusBar.tsx` gọi
 *     `openVitals()` tới một panel không còn mount ⇒ **bấm vào không ra gì**. Khẩu độ này KHÔNG
 *     hồi sinh nó; nó thay chỗ đứng đó. Đóng dấu lỗi thời để ở ngay đầu `VitalsGesture.tsx`.
 *
 * 🔴 LUẬT CỨNG CỦA MỨC PEEK — CHỈ DỮ LIỆU THẬT. Việc chọn nói gì nằm ở lõi thuần
 * `vitals-tin-hieu.ts` và bị khoá bằng test (`chonTinHieu({}) === []`). Không có dữ liệu thì
 * KHÔNG có dòng nào — thà một tín hiệu thật còn hơn ba tín hiệu giả.
 *
 * ⛔ RANH GIỚI: Vitals = *"tôi nên biết gì"* (thường trực, im, người dùng chủ động ghé).
 * Toast/action strip = *"vừa xảy ra gì"* (thoáng qua, tự bật). Khẩu độ này KHÔNG BAO GIỜ tự bung
 * — mọi mức đều do người dùng ra cử chỉ. Tự bung là biến nó thành toast.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFlowStore } from '@/lib/store';
import { useCadStore } from '@/lib/cad/store';
import { summarizeDoc } from '@/lib/ai/doc-context';
import { topViolations } from '@/lib/ai/violations-context';
import { useT } from '@/lib/i18n';
import { useDismissable } from '@/lib/useDismissable';
import VitalsIcon from '@/components/studio/VitalsIcon';
import { VitalsStateDot } from '@/components/studio/VitalsStateBadge';
import { VitalsChatSurface } from '@/components/home/widgets/VitalsPill';
import { chonTinHieu, trangThaiAmbient, type TinHieu } from '@/components/studio/vitals-tin-hieu';
import { NHAN_GIU_MS, SLOP_PX, TRE_RE_VAO_MS } from '@/components/studio/cu-chi-nhan-giu';

type Muc = 'ambient' | 'peek' | 'engage';

const RONG_TAM = 268;

/**
 * Đo số mục quy chuẩn cần xem trên bản vẽ ĐANG MỞ. Trả `undefined` = **chưa/không đo được**,
 * khác hẳn `0` = đã đo và sạch (xem `vitals-tin-hieu.ts`).
 *
 * Ngưỡng an toàn KHÔNG do file này đặt ra: tái dùng nguyên guard đã có ở
 * `VitalsGesture.buildVitalsDocPayload` — `summarizeDoc` tự bật `areasSkipped` khi bản vẽ vượt
 * `MAX_ROOMS_FOR_AREA`, và khi nó đã phải bỏ đo diện tích thì ta CŨNG bỏ kiểm quy chuẩn (bộ
 * kiểm đi qua đúng `findRoomLabels` đó, cùng rủi ro treo). Không đẻ ngưỡng thứ hai.
 *
 * Gọi LƯỜI — chỉ chạy lúc mở Peek, không chạy theo từng nét vẽ.
 */
function doQuyChuan(): number | undefined {
  try {
    const doc = useCadStore.getState().doc;
    if (!doc || !Array.isArray(doc.entities) || doc.entities.length === 0) return undefined;
    if (summarizeDoc(doc, {}).areasSkipped) return undefined;
    const v = topViolations(doc);
    return v.countsBySeverity.error + v.countsBySeverity.warning;
  } catch {
    // Bộ kiểm gặp hình học lạ → KHÔNG bịa số 0, và KHÔNG làm hỏng cả khẩu độ.
    return undefined;
  }
}

export function VitalsAperture() {
  const tr = useT();
  const [muc, setMuc] = useState<Muc>('ambient');
  /**
   * Peek mở do RÊ VÀO thì phải tự thu khi chuột đi khỏi; Peek mở do BẤM/FOCUS/NHẤN GIỮ thì GHIM
   * lại (người dùng đã ra quyết định, không được giật mất khi tay rời chuột).
   * Phát hiện khi thử trên app thật: thiếu phân biệt này thì rê vào → tấm bung → bấm một cái là
   * ĐÓNG NGAY (toggle), nhìn ra như "bấm không ra gì" — đúng loại lỗi chỉ lộ khi thao tác thật.
   */
  const [ghim, setGhim] = useState(false);
  const [neo, setNeo] = useState<{ top: number; right: number } | null>(null);
  const [quyChuan, setQuyChuan] = useState<number | undefined>(undefined);
  const nutRef = useRef<HTMLButtonElement>(null);
  const tamRef = useRef<HTMLDivElement>(null);
  const dongHo = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dongHoRoi = useRef<ReturnType<typeof setTimeout> | null>(null);
  const diemGiu = useRef<{ x: number; y: number } | null>(null);

  // Hàng đợi chạy DUY NHẤT của app — nguồn ①②. Đọc mảng rồi đếm tại chỗ (mảng chỉ đổi tham
  // chiếu khi có lượt chạy vào/ra, không đổi theo từng khung hình).
  const flowRuns = useFlowStore((s) => s.flowRuns);
  const dangChay = flowRuns.filter((r) => r.status === 'running' || r.status === 'queued');
  const tinHieu: TinHieu[] = chonTinHieu({
    dangChay: dangChay.length,
    nhanDangChay: dangChay.find((r) => r.status === 'running')?.label,
    chayLoi: flowRuns.filter((r) => r.status === 'error').length,
    chuanCanXem: quyChuan,
  });
  const trangThai = trangThaiAmbient(tinHieu);

  const huyHen = () => {
    if (dongHo.current) clearTimeout(dongHo.current);
    dongHo.current = null;
  };
  const huyRoi = () => {
    if (dongHoRoi.current) clearTimeout(dongHoRoi.current);
    dongHoRoi.current = null;
  };

  const doNeo = useCallback(() => {
    const el = nutRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setNeo({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
  }, []);

  const moPeek = useCallback(
    (ghimLai: boolean) => {
      doNeo();
      setQuyChuan(doQuyChuan()); // đo LƯỜI, đúng lúc mở
      if (ghimLai) setGhim(true);
      setMuc((m) => (m === 'engage' ? m : 'peek'));
    },
    [doNeo],
  );

  const dong = useCallback(() => {
    setGhim(false);
    setMuc('ambient');
  }, []);

  /** Chuột rời khỏi CẢ nút lẫn tấm: Peek chưa ghim thì thu lại. Có khoảng ân hạn vì tấm được
   * portal ra `body` (luật K4) nên nó KHÔNG phải con của nút — đi từ nút sang tấm là một lần
   * "rời" thật sự, không có ân hạn thì tấm biến mất ngay khi vừa với tới. */
  const RA_KHOI_MS = 140;
  const henThu = () => {
    huyRoi();
    dongHoRoi.current = setTimeout(() => {
      setMuc((m) => (m === 'peek' ? 'ambient' : m));
    }, RA_KHOI_MS);
  };
  /** Chỉ hẹn thu khi chưa ghim — ghim rồi thì chỉ Esc / bấm ra ngoài mới đóng. */
  const roiVung = (e: { pointerType: string }) => {
    if (e.pointerType !== 'mouse' || ghim) return;
    huyHen();
    henThu();
  };
  const vaoVung = () => huyRoi();

  useLayoutEffect(() => {
    if (muc !== 'ambient') doNeo();
  }, [muc, doNeo]);

  useEffect(
    () => () => {
      huyHen();
      huyRoi();
    },
    [],
  );

  useDismissable({ open: muc !== 'ambient', onDismiss: dong, refs: [nutRef, tamRef] });

  // Esc: Engage → về Ambient do chính `VitalsChatSurface` lo; Peek thì đóng ở đây.
  useEffect(() => {
    if (muc !== 'peek') return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong();
    };
    window.addEventListener('keydown', onEsc); // esc-only: chỉ xử Escape đóng lớp — đúng chuẩn dialog, không cần né ô nhập
    return () => window.removeEventListener('keydown', onEsc);
  }, [muc, dong]);

  const nhanTrangThai =
    trangThai === 'answering'
      ? tr('đang chạy', 'running')
      : trangThai === 'alert'
        ? tr('có việc cần xem', 'needs attention')
        : tr('không có tín hiệu', 'no signals');

  return (
    <div className="relative shrink-0" data-vitals-aperture="">
      <button
        ref={nutRef}
        type="button"
        // BẤM = Peek GHIM (không nhảy thẳng vào chat): xem trước rồi mới quyết có mở không.
        // Bấm lần nữa lúc đã ghim thì đóng — vẫn có lối tắt bằng bàn phím/cảm ứng.
        onClick={() => (ghim && muc === 'peek' ? dong() : moPeek(true))}
        // Bàn phím KHÔNG có "rê vào" ⇒ focus mở ngay, không trễ, và GHIM (tablet/bàn phím không
        // được giấu sau hover — luật hover/focus §8).
        onFocus={() => moPeek(true)}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse') return;
          vaoVung();
          huyHen();
          // TRỄ: chuột đi ngang qua không được kích hoạt ("kiểu tai thỏ MacBook", chốt 16/08).
          dongHo.current = setTimeout(() => moPeek(false), TRE_RE_VAO_MS);
        }}
        onPointerLeave={roiVung}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return;
          diemGiu.current = { x: e.clientX, y: e.clientY };
          huyHen();
          dongHo.current = setTimeout(() => moPeek(true), NHAN_GIU_MS);
        }}
        onPointerMove={(e) => {
          const g = diemGiu.current;
          if (!g) return;
          if (Math.abs(e.clientX - g.x) > SLOP_PX || Math.abs(e.clientY - g.y) > SLOP_PX) {
            diemGiu.current = null;
            huyHen(); // đang cuộn, không phải đang hỏi
          }
        }}
        onPointerUp={() => {
          diemGiu.current = null;
          huyHen();
        }}
        onPointerCancel={() => {
          diemGiu.current = null;
          huyHen();
        }}
        aria-expanded={muc !== 'ambient'}
        aria-haspopup="dialog"
        aria-label={tr(`Vitals — ${nhanTrangThai}`, `Vitals — ${nhanTrangThai}`)}
        className="flex items-center gap-1.5 rounded-[var(--r-full)] px-2.5 py-1 transition-colors duration-[120ms] hover:bg-[var(--hover)]"
        style={{ background: muc !== 'ambient' ? 'var(--hover)' : 'transparent' }}
      >
        <VitalsIcon size={14} className="shrink-0" style={{ color: 'var(--accent)' }} />
        {/* NT-8: ký hiệu luôn có nhãn. "Vitals" là TÊN của thứ này, không phải "chữ nhiều". */}
        <span className="text-[length:var(--fs-xs)] font-medium text-[var(--t2)]">Vitals</span>
        {/* Chấm ambient — cỗ máy trạng thái SẴN CÓ, không phải chấm tự vẽ. */}
        <VitalsStateDot state={trangThai} size={6} />
        {/* Số chỉ hiện khi CÓ tín hiệu thật; kênh chữ đi kèm nằm trong `aria-label` ở trên nên
            người không phân biệt được chấm vẫn nghe được trạng thái. */}
        {tinHieu.length > 0 && (
          <span className="text-[length:var(--fs-xs)] tabular-nums text-[var(--t3)]">{tinHieu.length}</span>
        )}
      </button>

      {muc !== 'ambient' && neo && typeof document !== 'undefined'
        ? createPortal(
            // PORTAL ra body — luật K4 (02/08): tấm nổi không được lồng trong chrome kính.
            <div
              ref={tamRef}
              role="dialog"
              aria-label="Vitals"
              onPointerEnter={vaoVung}
              onPointerLeave={roiVung}
              style={{ position: 'fixed', top: neo.top, right: neo.right, zIndex: 60 }}
            >
              {muc === 'peek' ? (
                <div
                  style={{ width: RONG_TAM }}
                  className="nen-mo-panel overflow-hidden rounded-[var(--r-3)] border border-[var(--border)] p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-center gap-1.5 px-1 pb-1.5">
                    <VitalsIcon size={12} style={{ color: 'var(--accent)' }} />
                    <span className="text-[length:var(--fs-xs)] uppercase tracking-wide text-[var(--t4)]">Vitals</span>
                  </div>

                  {tinHieu.length === 0 ? (
                    // Câu này nói về KHẨU ĐỘ, không nói về sức khoẻ hồ sơ. Cố ý KHÔNG viết
                    // "bản vẽ không có lỗi": bộ kiểm chỉ bắt được thứ đo được, "0 vi phạm" ≠
                    // "đạt chuẩn" (luật đã ghi thành chữ ở `violationsPromptBlock`).
                    <p className="px-1 pb-1 text-[length:var(--fs-xs)] leading-relaxed text-[var(--t3)]">
                      {tr('Không có tín hiệu nào.', 'No signals.')}
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {tinHieu.map((t) => (
                        <li
                          key={t.loai}
                          className="flex items-start gap-2 rounded-[var(--r-2)] px-1.5 py-1.5"
                          style={{ background: 'var(--field)' }}
                        >
                          <span className="mt-[3px] shrink-0">
                            <VitalsStateDot state={t.loai === 'dang-chay' ? 'answering' : 'alert'} size={6} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[length:var(--fs-xs)] text-[var(--t1)]">{t.nhan}</span>
                            {t.chiTiet && (
                              <span className="block truncate text-[length:var(--fs-xs)] text-[var(--t4)]">{t.chiTiet}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      huyRoi();
                      setGhim(true);
                      setMuc('engage');
                    }}
                    className="mt-1.5 w-full rounded-[var(--r-2)] px-2 py-1.5 text-left text-[length:var(--fs-xs)] text-[var(--t2)] transition-colors duration-[120ms] hover:bg-[var(--hover)]"
                  >
                    {tr('Mở Vitals…', 'Open Vitals…')}
                  </button>
                </div>
              ) : (
                <VitalsChatSurface onClose={dong} />
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default VitalsAperture;
