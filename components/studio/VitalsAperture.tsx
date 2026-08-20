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
 *   · `VitalsIcon.tsx`        → THÔI DÙNG ở khẩu độ (20/08): hình thái ambient nay là LÕI +
 *                               QUỸ ĐẠO (`VitalsQuyDao.tsx`) vì cả ba mức phải mọc ra từ một
 *                               TÂM nhìn thấy được. Glyph cũ vẫn sống ở `VitalsChatSurface`.
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
import { VitalsStateDot } from '@/components/studio/VitalsStateBadge';
import VitalsQuyDao from '@/components/studio/VitalsQuyDao';
import { DUONG_CONG, giamChuyenDong, nhipToiBac, thoiLuong } from '@/lib/ui/nhip';
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
  const [neo, setNeo] = useState<{ top: number; right: number; tamPhai: number } | null>(null);
  /** Đã sang khung hình thứ hai chưa — mốc để trạng thái "đóng" kịp vẽ trước khi nở ra. */
  const [daNo, setDaNo] = useState(false);
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
    setNeo({
      top: r.bottom + 8,
      /* Kẹp để mép TRÁI của tấm không lọt ra ngoài màn hẹp: neo theo mép phải nút thì trên
         khung 333px (pane hẹp) tấm 268px tràn sang trái −21px — đo được trên app thật 20/08. */
      right: Math.min(
        Math.max(8, window.innerWidth - r.right),
        Math.max(8, window.innerWidth - RONG_TAM - 8),
      ),
      // Khoảng cách từ MÉP PHẢI của tấm tới TÂM LÕI quỹ đạo. Tấm neo mép phải trùng mép phải
      // nút, nên đây chính là nửa bề rộng nút — và đó là gốc để bề mặt nở ra (§14).
      tamPhai: r.width / 2,
    });
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
    setDaNo(false);
    setMuc('ambient');
  }, []);

  /* §14 CHUYỂN ĐỘNG TỪ GỐC — bề mặt NỞ RA TỪ CHÍNH TÂM LÕI quỹ đạo, không mọc từ hư không.
     Bật cờ ở khung hình SAU để trình duyệt có thế nội suy (không nhảy thẳng). */
  useLayoutEffect(() => {
    if (muc === 'ambient' || !neo) return;
    const id = requestAnimationFrame(() => setDaNo(true));
    return () => cancelAnimationFrame(id);
  }, [muc, neo]);

  const giam = giamChuyenDong();
  const msNo = thoiLuong(nhipToiBac(muc === 'engage' ? 'bang' : 'vien'), giam);
  const kieuMoc = (goc: number): React.CSSProperties => ({
    transformOrigin: `calc(100% - ${goc}px) 0%`,
    transform: daNo ? 'scale(1)' : 'scale(0.94)',
    opacity: daNo ? 1 : 0,
    transition:
      msNo === 0
        ? 'none'
        : `transform ${msNo}ms ${DUONG_CONG}, opacity ${Math.round(msNo * 0.8)}ms ${DUONG_CONG}`,
  });

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
        {/* ⭐ AMBIENT = LÕI + QUỸ ĐẠO, gần như KHÔNG vật liệu: nền trong suốt, nét mảnh, đơn
            sắc lúc nghỉ. Đây là chỗ cả ba mức mọc ra, nên nó phải là một TÂM nhìn thấy được.
            Trạng thái đọc bằng ĐỘ SÁNG + CHUYỂN ĐỘNG của chính lõi (§18), không phải bằng một
            chấm gắn thêm — chấm cũ đã bỏ vì nó nói lại đúng điều lõi đã nói. */}
        <VitalsQuyDao trangThai={trangThai} co={18} className="shrink-0" />
        {/* NT-8: ký hiệu luôn có nhãn. "Vitals" là TÊN của thứ này, không phải "chữ nhiều". */}
        <span className="text-[length:var(--fs-xs)] font-medium text-[var(--t2)]">Vitals</span>
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
                /* ⭐ PEEK — quỹ đạo nở ra từ ĐÚNG TÂM đó thành một VIÊN KÍNH MỎNG theo ngữ cảnh.
                   Vật liệu: `kinh` (vai trò `vitals-peek`, một trong 5 vai trò duy nhất được
                   đeo kính — `lib/ui/vat-lieu.ts`). Kính ÔM SÁT nội dung: không có nấc thứ hai,
                   không nhồi thêm hàng cho đầy tấm.
                   §17 — MỘT TÍN HIỆU LỚN + một dòng ngữ cảnh + một hành động nhỏ.
                   ⛔ CẤM biến thành bảng phân tích doanh nghiệp: không biểu đồ, không %, không
                   "so với tuần trước". Trần 3 dòng đã khoá ở `vitals-tin-hieu.ts`. */
                <div
                  style={{ width: RONG_TAM, ...kieuMoc(neo.tamPhai) }}
                  className="be-mat-noi be-mat-noi--kinh overflow-hidden rounded-[var(--r-3)] p-2"
                >
                  {tinHieu.length === 0 ? (
                    // Câu này nói về KHẨU ĐỘ, không nói về sức khoẻ hồ sơ. Cố ý KHÔNG viết
                    // "bản vẽ không có lỗi": bộ kiểm chỉ bắt được thứ đo được, "0 vi phạm" ≠
                    // "đạt chuẩn" (luật đã ghi thành chữ ở `violationsPromptBlock`).
                    <p className="px-1.5 py-1 text-[length:var(--fs-xs)] leading-relaxed text-[var(--t3)]">
                      {tr('Không có tín hiệu nào.', 'No signals.')}
                    </p>
                  ) : (
                    <>
                      {/* TÍN HIỆU LỚN — số đứng riêng, cỡ lớn; chữ đi kèm ngắn. */}
                      <div className="flex items-baseline gap-2 px-1.5 pt-0.5">
                        <span className="text-[26px] font-semibold leading-none tabular-nums text-[var(--t1)]">
                          {tinHieu[0].so}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[length:var(--fs-xs)] text-[var(--t2)]">
                          {tinHieu[0].nhan.replace(/^\d+\s*/, '')}
                        </span>
                      </div>
                      {/* MỘT dòng ngữ cảnh — ưu tiên dữ kiện thật (tên lượt chạy), không có thì
                          nói VÌ SAO BỊ GẮN CỜ. Cả hai đều là chuỗi từ nguồn, không bịa. */}
                      <p className="mt-1 px-1.5 text-[length:var(--fs-xs)] leading-relaxed text-[var(--t3)]">
                        {tinHieu[0].chiTiet ?? tinHieu[0].viSao}
                      </p>

                      {/* Tín hiệu còn lại (tối đa 2) — một dòng, nhỏ. Chúng có mặt để người dùng
                          biết còn gì khác, không để so sánh. */}
                      {tinHieu.length > 1 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {tinHieu.slice(1).map((t) => (
                            <li
                              key={t.loai}
                              title={t.viSao}
                              className="flex items-center gap-2 rounded-[var(--r-2)] px-1.5 py-1"
                            >
                              <VitalsStateDot state={t.loai === 'dang-chay' ? 'answering' : 'alert'} size={5} />
                              <span className="min-w-0 flex-1 truncate text-[length:var(--fs-xs)] text-[var(--t2)]">
                                {t.nhan}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}

                  {/* MỘT hành động nhỏ. Không phải hàng nút. */}
                  <button
                    type="button"
                    onClick={() => {
                      huyRoi();
                      setGhim(true);
                      setDaNo(false);
                      setMuc('engage');
                    }}
                    className="mt-1.5 w-full rounded-[var(--r-2)] px-2 py-1.5 text-left text-[length:var(--fs-xs)] text-[var(--t2)] transition-colors duration-[120ms] hover:bg-[var(--hover)]"
                  >
                    {tr('Mở Vitals…', 'Open Vitals…')}
                  </button>
                </div>
              ) : (
                /* ⭐ ENGAGE — cùng tâm đó nở tiếp thành bề mặt ĐỌC ĐƯỢC. `VitalsChatSurface` đã
                   là nền ĐẶC (`--card` + `--border`), đúng luật vật liệu: chỗ đọc lâu + có ô
                   nhập thì KHÔNG đeo kính. Ở đây chỉ bọc một lớp CHUYỂN ĐỘNG, cố ý KHÔNG bọc
                   `BeMatNoi` — bọc vào là kính chồng lên mặt đặc, đúng thứ luật cấm.
                   ⛔ Nó không phải hộp thoại chatbot rời: không overlay, không giữa màn, mọc
                   ra từ chính lõi quỹ đạo và thu về đó. */
                <div style={kieuMoc(neo.tamPhai)}>
                  <VitalsChatSurface onClose={dong} />
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default VitalsAperture;
