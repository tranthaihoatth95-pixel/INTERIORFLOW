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
 *   ③ Engage   — *"nói chuyện với nó"* · mở ĐÚNG bề mặt chat Vitals đã có.
 *
 * 🔴 BẢN THÍCH NGHI 04/09 (nhánh `integration/2026-09-04`) — KHÁC bản gốc ở checkpoint
 * `2026-08-24-control-plane` ba chỗ, mỗi chỗ vì một lý do ĐO ĐƯỢC trên nhánh này:
 *   ① **Engage = `VitalsGesturePanel`**, không phải `VitalsChatSurface` (tệp đó chưa có ở đây).
 *      Đây KHÔNG phải đường lùi tạm: nó đúng việc phải làm — `VitalsGesturePanel` là panel chat
 *      Vitals THẬT đang mồ côi (chỗ mount duy nhất `StageSwitcher.tsx` đã gỡ khỏi header 17/08),
 *      và khẩu độ này nhận nuôi nó. Hành vi giữ, chỗ đứng đổi.
 *   ② **Bỏ tín hiệu `dia-diem`** — nguồn của nó là `/api/projects/[id]/site`, nhánh này CHƯA có
 *      route đó (`grep` = 0). Giữ mà gọi thì mọi dự án đều rơi `nguồn hỏng` ⇒ khẩu độ nói
 *      "chưa đo được" ở khắp nơi: một lời nói dối đối xứng với F-02, chỉ ngược dấu. Lõi thuần
 *      `vitals-tin-hieu.ts` GIỮ NGUYÊN nhánh `dia-diem` (đã có test) — chỉ nơi vẽ thôi cấp nguồn.
 *   ③ **Bỏ tín hiệu `demo-flow`** — `lib/studio/demo-spine.ts` chưa có ở nhánh này.
 *
 * ⭐ HAI HÀNH VI CỦA `VitalsRightEdgeHost` (Slice 12) ĐƯỢC HẤP THU VÀO ĐÂY, không xoá mù:
 *   · **⌘J / Ctrl+J** — đăng ký DUY NHẤT ở tệp này (đã gỡ khỏi `StageSwitcher` + host cũ).
 *   · **Ô gõ nhanh ở `StatusBar`** — nó gọi `useVitalsUi.open(câu hỏi, autoSend)`; khẩu độ nghe
 *     `panelOpen` của kho dùng chung rồi tự nhảy sang Engage kèm `initialInput`. Trước lát này
 *     `open()` gọi tới một panel không còn mount ⇒ **gõ Enter là mất câu hỏi**.
 * Chỗ đứng "nút RỜI cạnh trục phải" thì BỎ — `CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` §7 chốt
 * Vitals nằm VẬT LÝ ở mép trên. Một vật, MỘT chỗ đứng.
 *
 * [Đ2] LOOK INSIDE trước khi dựng — bốn mảnh Vitals sẵn có, xử lý từng mảnh:
 *   · `VitalsIcon.tsx`        → THÔI DÙNG ở khẩu độ (20/08): hình thái ambient nay là LÕI +
 *                               QUỸ ĐẠO (`VitalsQuyDao.tsx`) vì cả ba mức phải mọc ra từ một
 *                               TÂM nhìn thấy được. Glyph cũ vẫn sống trong panel chat.
 *   · `VitalsStateBadge.tsx`  → DÙNG LẠI `VitalsStateDot` + bộ `VitalsState` (idle/answering/
 *                               alert) làm ngôn ngữ trạng thái. KHÔNG đẻ bảng trạng thái thứ hai.
 *   · `VitalsChatBubble.tsx`  → thuộc VitalsGesture, không đụng.
 *   · `VitalsGesture.tsx`     → **MỒ CÔI, NAY VỀ ĐÂY LÀM MỨC ③.** Nơi mount duy nhất của nó là
 *     `StageSwitcher.tsx`, mà StageSwitcher đã bị gỡ khỏi header 17/08 ⇒ `grep` toàn repo cho
 *     thấy KHÔNG route nào còn mount nó. Hệ quả đo được: ô gõ nhanh ở `StatusBar.tsx` gọi
 *     `openVitals()` tới một panel không còn mount ⇒ **gõ Enter là mất câu hỏi**. Khẩu độ này
 *     KHÔNG dựng tấm chat thứ hai — nó cho tấm cũ một chỗ đứng đúng.
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
import { useVungLamViec } from '@/components/ui/useVungLamViec';
import { viTriO, viTriTamXo } from '@/lib/ui/vung-lam-viec';
import VitalsGesturePanel from '@/components/studio/VitalsGesture';
import { useVitalsUi } from '@/lib/vitals-ui';
import { laPhimChinh } from '@/lib/kbd'; // MỘT nguồn phím chính: ⌘ trên macOS · Ctrl nơi khác
import {
  chonTinHieu, trangThaiAmbient, mucKhauDo, nhanKhauDo, domKhauDo,
  type TinHieu, type VitalsStage,
} from '@/components/studio/vitals-tin-hieu';

type Muc = 'ambient' | 'peek' | 'engage';

/* ── CỬ CHỈ: TRỄ RÊ VÀO + NHẤN GIỮ ───────────────────────────────────────────────────────────
 * Bản gốc đọc ba số này từ `components/studio/cu-chi-nhan-giu.ts` (chưa có ở nhánh này). Giá trị
 * GIỮ NGUYÊN nguồn cũ — `components/ui/Tooltip.tsx:33,37` (`TOOLTIP_LONG_PRESS_MS` 500 ·
 * `LONG_PRESS_SLOP_PX` 8): cùng một cử chỉ thì phải cùng một con số, không đẻ nhịp thứ hai.
 * ⚠️ CỐ Ý KHÔNG import từ `Tooltip.tsx`: tiền tố `TOOLTIP_` nói rõ hằng số đó THUỘC VỀ tooltip
 * (đính chính 16/08, `00-CHOT`) — Vitals không phải tooltip. Chỗ đúng cho chúng là một tệp cử chỉ
 * dùng chung; tệp đó nằm ngoài phạm vi ghi của phiếu này, nên tạm khai tại chỗ kèm dòng này.
 */
/** Nhấn giữ trên cảm ứng (ms) — "tablet không được giấu sau hover" (luật §8). */
const NHAN_GIU_MS = 500;
/** Ngón trượt quá ngần này (px) = đang cuộn, không phải đang hỏi. */
const SLOP_PX = 8;
/** Trễ khi rê chuột vào — "kiểu tai thỏ MacBook": đi ngang qua KHÔNG được kích hoạt. */
const TRE_RE_VAO_MS = 140;

const RONG_TAM = 268;
/** Bề rộng tấm Engage — khớp `width` mà `VitalsGesturePanel` tự đặt (`min(380px, 100vw-24px)`).
 *  Chỉ dùng để TÍNH CHỖ RƠI cho đúng tâm; panel vẫn tự lo bề rộng thật của nó. */
const RONG_ENGAGE = 380;
/** `VitalsGesturePanel` tự đặt `top: calc(100% + 10px)`; lùi hộp cha đúng 10px ⇒ khe hở = 0. */
const KHE_PANEL_PX = 10;
/** Bề rộng Ổ — chỗ DÀNH RIÊNG trong header. Cố định: ổ mà co giãn thì tâm nhảy theo nội dung. */
const O_RONG = 112;
/** Ổ thò lên quá mép trên vài pixel ⇒ mắt đọc ra là KHE CẮT VÀO vỏ, không phải nút đặt lên vỏ. */
const O_THO = 3;
/** Quãng rơi của Peek/Engage khi hé mở. Khe hở neo↔tấm vẫn = 0 — đây là quãng ĐI, không phải khe. */
const ROI_PX = 10;

/**
 * ⭐ ĐƯỜNG RANH NAV↔CANVAS — Hoà chốt 23/08 (`docs/design-campaign/dna/WORKSPACE-SPEC-2026-08-23.md`
 * thành phần ⑤): *"Vitals nằm trên ĐƯỜNG RANH giữa navigation và canvas · **hover ở BẤT KỲ ĐIỂM
 * NÀO** trên đường đó để mở insight ngắn"*.
 *
 * 🔴 ĐÂY LÀ ĐỔI BẢN CHẤT, KHÔNG PHẢI DỜI TOẠ ĐỘ: trước 23/08 khẩu độ neo vào **một ĐIỂM** — ô
 * 112px, chỉ rê trúng đúng ô đó mới mở. Nay cả **ĐOẠN ĐƯỜNG** ngang mặt canvas là vùng nhạy.
 * Ô 112px GIỮ NGUYÊN (nó là chỗ nhìn thấy được, là tâm để Peek mọc ra); phần thêm chỉ là một
 * dải nhạy VÔ HÌNH chạy dọc đường ranh, mở đúng cùng một tấm Peek, mọc từ đúng cùng một tâm.
 *
 * ⛔ VÌ SAO KHÔNG DỰNG MỘT `<div>` PHỦ LÊN ĐƯỜNG RANH (đã cân, đã loại): một dải DOM đặt ở đó sẽ
 * **nuốt cú bấm** của thứ nằm dưới — mép dưới của dải ngữ cảnh trong header, và vài pixel đầu của
 * canvas (ở chặng 2D đó là vùng vẽ thật, nuốt một cú đặt điểm là hỏng nét). Nên dải này KHÔNG có
 * thân: nó là một phép đo trên `pointermove`, không có phần tử nào chắn đường.
 */
/** Dải nhạy: bao nhiêu px PHÍA TRÊN đường ranh (trong header). */
const RANH_TREN_PX = 5;
/** Dải nhạy: bao nhiêu px PHÍA DƯỚI đường ranh (mép trên canvas). Nông hơn phía trên — canvas là
 * chỗ làm việc thật, lấn sâu vào là quấy rầy. */
const RANH_DUOI_PX = 4;
/** Chừa hai đầu đoạn: sát mép cột thì con trỏ đang đi tới panel bên, không phải đang hỏi Vitals. */
const RANH_LE_PX = 8;

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

export function VitalsAperture({ stage }: {
  /**
   * Chặng đang mở — `VitalsGesturePanel` gửi kèm để backend chọn system prompt, và in lên đầu
   * tấm chat. Nơi mount (`AppChrome`) suy ra bằng `changTheoDuong(pathname)`.
   * ⚠️ CỐ Ý là `VitalsStage` chứ không phải `Phase`: `'gallery'` = **không ở chặng nào**. Kiểu
   * `Phase` không diễn đạt được điều đó, nên nơi gọi buộc phải nói dối — xem khối chú thích
   * `changTheoDuong` ở `vitals-tin-hieu.ts` để biết lời nói dối đó đã hiện lên màn thế nào.
   */
  stage: VitalsStage;
}) {
  const tr = useT();
  const [muc, setMuc] = useState<Muc>('ambient');
  /* ⭐ KHO DÙNG CHUNG `lib/vitals-ui.ts` — ĐÂY LÀ CHỖ HAI HÀNH VI SLICE 12 VỀ ĐẬU.
     Mức Engage KHÔNG có trạng thái mở/đóng riêng: nó soi gương `panelOpen` của kho. Lý do là
     một lỗi đã sống thật — `StatusBar` gọi `open()` vào một panel không còn mount, gõ Enter là
     MẤT CÂU HỎI. Có hai nguồn "đang mở" thì lỗi đó tái phát ở dạng khác; một nguồn thì không. */
  const panelOpen = useVitalsUi((s) => s.panelOpen);
  const initialInput = useVitalsUi((s) => s.initialInput);
  const autoSend = useVitalsUi((s) => s.autoSend);
  const consumeInitial = useVitalsUi((s) => s.consumeInitial);
  const moKho = useVitalsUi((s) => s.open);
  const dongKho = useVitalsUi((s) => s.close);
  /**
   * Peek mở do RÊ VÀO thì phải tự thu khi chuột đi khỏi; Peek mở do BẤM/FOCUS/NHẤN GIỮ thì GHIM
   * lại (người dùng đã ra quyết định, không được giật mất khi tay rời chuột).
   * Phát hiện khi thử trên app thật: thiếu phân biệt này thì rê vào → tấm bung → bấm một cái là
   * ĐÓNG NGAY (toggle), nhìn ra như "bấm không ra gì" — đúng loại lỗi chỉ lộ khi thao tác thật.
   */
  const [ghim, setGhim] = useState(false);
  /**
   * 🔴 GƯƠNG `ref` CỦA `ghim` — SỬA MỘT LỖI THẬT (22/08), không phải mẹo test.
   * `roiVung` đọc `ghim` qua CLOSURE của lần render hiện tại. `setGhim(true)` là bất đồng bộ, nên
   * nếu con trỏ rời nút TRƯỚC khi React kịp commit, closure vẫn thấy `ghim === false` ⇒ hẹn thu
   * ⇒ **tấm vừa mở đã đóng**. Người dùng bấm rồi đưa chuột đi nhanh (hoặc bấm bằng bàn phím/máy)
   * là trúng ngay ca này — đo được: `aria-expanded` về `false` sau ~140ms.
   * `ref` cập nhật ĐỒNG BỘ nên `roiVung` luôn đọc giá trị THẬT ở thời điểm sự kiện.
   */
  const ghimRef = useRef(false);
  const datGhim = useCallback((v: boolean) => {
    ghimRef.current = v;
    setGhim(v);
  }, []);
  /** Neo = hộp thật của Ổ. `tren` là mép DƯỚI của ổ ⇒ khe hở neo↔tấm = 0 theo định nghĩa. */
  const [neo, setNeo] = useState<{ tren: number; trai: number; tam: number } | null>(null);
  /** Đã sang khung hình thứ hai chưa — mốc để trạng thái "đóng" kịp vẽ trước khi nở ra. */
  const [daNo, setDaNo] = useState(false);
  const [quyChuan, setQuyChuan] = useState<number | undefined>(undefined);
  const nutRef = useRef<HTMLButtonElement>(null);
  /** Hộp của Ổ — nguồn DUY NHẤT của mọi toạ độ ở đây. */
  const oRef = useRef<HTMLDivElement>(null);
  const tamRef = useRef<HTMLDivElement>(null);
  const dongHo = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dongHoRoi = useRef<ReturnType<typeof setTimeout> | null>(null);
  const diemGiu = useRef<{ x: number; y: number } | null>(null);

  // Hàng đợi chạy DUY NHẤT của app — nguồn ①②. Đọc mảng rồi đếm tại chỗ (mảng chỉ đổi tham
  // chiếu khi có lượt chạy vào/ra, không đổi theo từng khung hình).
  const flowRuns = useFlowStore((s) => s.flowRuns);
  const dangChay = flowRuns.filter((r) => r.status === 'running' || r.status === 'queued');
  // Chế độ hiển thị Demo (Hoà chốt 21/08) — TUỲ CHỌN, bật ở chuông Hoạt động. Tắt thì hai số này
  // là undefined ⇒ `chonTinHieu` tự im (đúng luật "không đo không nói"), Vitals không đổi gì.
  /* ⛔ TÍN HIỆU `dia-diem` (Ngữ cảnh dự án) CẮT KHỎI NHÁNH NÀY — xem docstring đầu tệp mục ②.
     Nguồn của nó là `/api/projects/[id]/site`, route CHƯA tồn tại ở đây. Cắt ở NƠI VẼ, không cắt
     ở lõi: `vitals-tin-hieu.ts` vẫn giữ nguyên nhánh + test, nên khi route về thì chỉ cần cấp
     lại `diaDiemCanXem`/`diaDiemMien` cho `chonTinHieu`, không phải dựng lại gì. */

  const tinHieu: TinHieu[] = chonTinHieu({
    dangChay: dangChay.length,
    nhanDangChay: dangChay.find((r) => r.status === 'running')?.label,
    chayLoi: flowRuns.filter((r) => r.status === 'error').length,
    chuanCanXem: quyChuan,
  });
  const trangThai = trangThaiAmbient(tinHieu);
  /**
   * Đo được hay chưa. Trên nhánh này cả HAI nguồn còn lại đều là trạng thái CỤC BỘ đọc trực
   * tiếp (`flowRuns` trong kho · bộ kiểm quy chuẩn chạy tại chỗ) — không có lượt hỏi mạng nào
   * để hỏng, nên "đã đo" là khẳng định đúng, không phải mặc định cho tiện.
   * ⚠️ Ngay khi cắm lại một nguồn ĐI QUA MẠNG (vd `dia-diem`), PHẢI trả cờ này về sức khoẻ thật
   * của nguồn đó — nếu không, khẩu độ nói "không có gì cần xem" trên một tiền đề đã chết, đúng
   * bệnh F-02 (calm giả) mà `mucKhauDo` sinh ra để diệt.
   */
  const daDoDuoc = true;
  const mucTin = mucKhauDo(trangThai, daDoDuoc);

  const huyHen = () => {
    if (dongHo.current) clearTimeout(dongHo.current);
    dongHo.current = null;
  };
  const huyRoi = () => {
    if (dongHoRoi.current) clearTimeout(dongHoRoi.current);
    dongHoRoi.current = null;
  };

  /**
   * ⭐ NEO ĐỌC TỪ CHÍNH Ổ, KHÔNG TỰ TÍNH TOẠ ĐỘ MÀN. Trước đây hàm này lấy `getBoundingClientRect`
   * của nút rồi tính `top`/`right` — tức Vitals **bám vào cụm phải-trên**, đúng cái hệ Hoà nói nó
   * không được sống trong. Nay ổ là một chỗ DÀNH RIÊNG trong header, và neo chỉ là *đọc lại* hộp
   * của ổ đó. Không còn nhánh nào tự chế toạ độ.
   */
  const doNeo = useCallback(() => {
    const el = oRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setNeo({ tren: r.bottom, trai: r.left, tam: r.left + r.width / 2 });
  }, []);

  /**
   * ⛔ HOÀ CẤM 05/09 — "HỘP RỖNG". Peek TỪNG mở ra một tấm chỉ để nói *"Không có tín hiệu nào."*
   * Ba luật cùng cấm nó, không phải chuyện gu:
   *   · N-10 cờ đỏ — *hộp rỗng khổng lồ*;
   *   · khuôn thông điệp TRỐNG (`SPEC-NGON-NGU-CHI-DAN`) — trống thì phải **hành động được**,
   *     không phải một câu chết + một dòng chữ;
   *   · chính định nghĩa Peek ở §17 — *MỘT tín hiệu lớn + một dòng ngữ cảnh + một hành động*.
   *     KHÔNG có tín hiệu ⇒ Peek không có ruột ⇒ **không được mở**.
   *
   * Hai lối vào xử KHÁC NHAU, cố ý:
   *   · rê chuột, 0 tín hiệu → **không mở gì**. Ổ vẫn thở ở Ambient, không hộp nào bật ra.
   *   · BẤM,      0 tín hiệu → nhảy **thẳng Engage** (Vitals thật, có ô hỏi). Nút KHÔNG chết —
   *     và đây vốn đã là chỗ duy nhất nút "Mở Vitals…" trong tấm cũ dẫn tới, nên không mất
   *     đường nào; chỉ bỏ một trạm trung gian rỗng.
   */
  const moPeek = useCallback(
    (ghimLai: boolean) => {
      if (tinHieu.length === 0) {
        if (ghimLai) {
          doNeo();
          moKho();
        }
        return;
      }
      doNeo();
      setQuyChuan(doQuyChuan()); // đo LƯỜI, đúng lúc mở
      if (ghimLai) datGhim(true);
      setMuc((m) => (m === 'engage' ? m : 'peek'));
    },
    [doNeo, datGhim, moKho, tinHieu.length],
  );

  const dong = useCallback(() => {
    datGhim(false);
    setDaNo(false);
    setMuc('ambient');
    // Đóng CẢ kho dùng chung — nếu không, `panelOpen` còn `true` và hiệu ứng đồng bộ dưới đây
    // mở lại Engage ngay lập tức (vòng lặp mở-đóng, đúng loại lỗi chỉ lộ khi thao tác thật).
    dongKho();
  }, [datGhim, dongKho]);

  /**
   * ĐỒNG BỘ MỘT CHIỀU: kho `panelOpen` → mức Engage. Mọi lối vào Engage đều đi qua `open()` của
   * kho (⌘J · ô gõ nhanh StatusBar · nút "Mở Vitals…"), nên không có luồng mở thứ hai.
   */
  useEffect(() => {
    if (panelOpen) {
      doNeo();
      datGhim(true);
      setDaNo(false);
      setMuc('engage');
    } else {
      setMuc((m) => (m === 'engage' ? 'ambient' : m));
    }
  }, [panelOpen, doNeo, datGhim]);

  /**
   * ⌘J / Ctrl+J — ĐĂNG KÝ DUY NHẤT TRONG APP. Trước 04/09 tổ hợp này đăng ký ở `StageSwitcher`
   * (không còn mount ⇒ chết) và ở `VitalsRightEdgeHost` (chưa từng được mount). Cả hai đã gỡ.
   *
   * 🔴 CỐ Ý **KHÔNG** CHÉP GUARD "NÉ Ô NHẬP" CỦA `StageSwitcher` — đo trên app thật 04/09 cho
   * thấy guard đó biến ⌘J thành đường MỘT CHIỀU: panel vừa mở là tự đưa con trỏ vào ô nhập
   * (`VitalsGesture.tsx` focus ô khi `open`), nên cú ⌘J thứ hai rơi đúng nhánh "đang ở INPUT →
   * bỏ qua" ⇒ **mở được mà không đóng được**. Đo được: sau lần bấm thứ hai, `[data-vitals-chat]`
   * vẫn còn trong DOM.
   * Luật `keydown-ne-o-nhap` nhắm vào phím TRẦN (gõ chữ "j" trong ô tìm không được mở panel);
   * một tổ hợp có ⌘/Ctrl thì không bao giờ là ký tự người dùng đang gõ, nên nó không thuộc phạm
   * vi luật đó. Vẫn `preventDefault()` để không rơi vào phím tắt trình duyệt.
   *
   * 🔴 `capture: true` — BẮT BUỘC, không phải cho chắc. Ô nhập của `VitalsGesture.tsx:765` gọi
   * `e.stopPropagation()` cho MỌI phím, nên ở pha nổi thì listener trên `window` KHÔNG BAO GIỜ
   * thấy ⌘J khi con trỏ đang ở trong ô — đo được: bỏ guard rồi mà lần bấm thứ hai vẫn không
   * đóng. Pha BẮT chạy từ `window` xuống mục tiêu nên nó tới trước cú chặn đó.
   * (Cùng lý do và cùng cách `lib/useDismissable.ts:13` đã dùng cho Escape — không phát minh
   * cơ chế mới, chỉ dùng lại cách của hệ.)
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (laPhimChinh(e) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        if (useVitalsUi.getState().panelOpen) dong();
        else moKho();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [dong, moKho]);

  /* §14 CHUYỂN ĐỘNG TỪ GỐC — bề mặt NỞ RA TỪ CHÍNH TÂM LÕI quỹ đạo, không mọc từ hư không.
     Bật cờ ở khung hình SAU để trình duyệt có thế nội suy (không nhảy thẳng). */
  useLayoutEffect(() => {
    if (muc === 'ambient' || !neo) return;
    const id = requestAnimationFrame(() => setDaNo(true));
    return () => cancelAnimationFrame(id);
  }, [muc, neo]);

  const giam = giamChuyenDong();
  const msNo = thoiLuong(nhipToiBac(muc === 'engage' ? 'bang' : 'vien'), giam);
  /**
   * §14 — tấm nở ra từ CHÍNH TÂM Ổ và **rơi xuống** một quãng ngắn, như mép trên HÉ MỞ.
   * ⚠️ `translateY` là quãng ĐI của nhịp mở, KHÔNG phải khe hở: `top` của tấm luôn đúng bằng mép
   * dưới của ổ, nên lúc đứng yên khoảng cách neo↔tấm = 0. Có khe là nó đọc ra thành popover.
   */
  const kieuMoc = (): React.CSSProperties => ({
    transformOrigin: '50% 0%',
    transform: daNo ? 'translateY(0) scale(1)' : `translateY(-${ROI_PX}px) scale(0.97)`,
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
    if (e.pointerType !== 'mouse' || ghimRef.current) return;
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

  // Esc: Engage → `VitalsGesturePanel` tự lo (nó có `useDismissable` riêng, gọi `onClose`=`dong`);
  // Peek thì đóng ở đây.
  useEffect(() => {
    if (muc !== 'peek') return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong();
    };
    window.addEventListener('keydown', onEsc); // esc-only: chỉ xử Escape đóng lớp — đúng chuẩn dialog, không cần né ô nhập
    return () => window.removeEventListener('keydown', onEsc);
  }, [muc, dong]);

  /* ⭐ Ổ NEO VÀO TÂM VÙNG LÀM VIỆC — không phải tâm cửa sổ. Bề rộng cột trái đọc từ hộp DOM
     thật (`useVungLamViec`), nên nó tự đúng ở cả ba nấc sidebar và cả khi inspector phải mọc ra.
     Không có mốc đo (màn chưa dùng `AppShell`, vd trang đăng nhập) ⇒ `vung === null` ⇒ ổ KHÔNG
     hiện. Cố ý không lùi về tâm cửa sổ: đứng sai mà im lặng là thứ luật này sinh ra để diệt. */
  const vung = useVungLamViec();
  const oViTri = vung
    ? viTriO({
        trai: vung.trai,
        rong: vung.rong,
        khungRong: typeof window === 'undefined' ? 1440 : window.innerWidth,
        oRong: O_RONG,
        // Cụm phải-trên: đo thật nếu có mặt, không thì lùi về mép phải khung trừ một khoảng an toàn.
        cumPhaiTrai:
          (typeof document === 'undefined'
            ? null
            : document.querySelector('[data-marker="cumPhaiTren"]')?.getBoundingClientRect().left) ??
          (typeof window === 'undefined' ? 1240 : window.innerWidth - 200),
        cumTraiPhai:
          (typeof document === 'undefined'
            ? null
            : document.querySelector('[data-if-cum-trai-tren]')?.getBoundingClientRect().right) ?? 0,
      })
    : null;

  /* ⭐ ĐƯỜNG RANH LÀ VÙNG NHẠY (Hoà 23/08 ⑤) — xem khối hằng số đầu tệp để biết vì sao đây là
     phép đo trên `pointermove` chứ không phải một dải DOM phủ lên mép canvas.
     Ba điều kiện để KHÔNG quấy rầy: chỉ chuột (bút/ngón vẫn đi đường nhấn-giữ trên ô) · có TRỄ
     như cũ (`TRE_RE_VAO_MS`, "kiểu tai thỏ MacBook" — đi ngang qua không kích hoạt) · chỉ trong
     bề ngang CANVAS, chừa hai đầu. Rời dải thì thu lại theo đúng đường `henThu` sẵn có, trừ khi
     con trỏ đang ở trên chính ô hoặc trên tấm — hai chỗ đó đã có luật đóng/mở riêng. */
  const [reRanh, setReRanh] = useState(false);
  useEffect(() => {
    if (!vung) return;
    let dangTrong = false;
    const trongHop = (el: Element | null, x: number, y: number) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const o = oRef.current?.getBoundingClientRect();
      if (!o) return;
      const ranhY = o.bottom; // mép dưới ổ = ĐÚNG đường ranh nav↔canvas
      const trong =
        e.clientY >= ranhY - RANH_TREN_PX &&
        e.clientY <= ranhY + RANH_DUOI_PX &&
        e.clientX >= vung.trai + RANH_LE_PX &&
        e.clientX <= vung.trai + vung.rong - RANH_LE_PX;
      if (trong === dangTrong) return;
      dangTrong = trong;
      setReRanh(trong);
      if (trong) {
        huyRoi();
        huyHen();
        dongHo.current = setTimeout(() => moPeek(false), TRE_RE_VAO_MS);
        return;
      }
      huyHen();
      // Rời dải để ĐI VÀO ô/tấm thì không phải là "rời Vitals" — hai chỗ đó tự lo đóng/mở.
      if (ghimRef.current) return;
      if (trongHop(oRef.current, e.clientX, e.clientY)) return;
      if (trongHop(tamRef.current, e.clientX, e.clientY)) return;
      henThu();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
    // `henThu`/`huyHen`/`huyRoi` chỉ chạm ref + setState ⇒ bản đóng gói của lượt vẽ đầu vẫn đúng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vung, moPeek]);

  // Nhãn và `data-vitals-state` sinh từ CÙNG `muc` — hai bề mặt tính riêng thì chúng sẽ lệch,
  // và chúng đã lệch (DOM nói `calm`, trình đọc màn hình nghe "không có tín hiệu").
  const nhanTrangThai = nhanKhauDo(mucTin, tr('vi', 'en') === 'en');

  /* ① của thang nhường chỗ — ghi trần bề rộng cho cụm trái (đầu đề dự án) lên chính `<header>`.
     Ổ là con `absolute` của header, nên `offsetParent` CHÍNH LÀ header; không phải đi tìm bằng
     selector. Ghi một biến CSS thay vì nâng state lên cha: cha (`AppChrome`) chỉ cần đọc, không
     cần vẽ lại — và nếu khẩu độ không mount thì biến không tồn tại, cụm trái về `100%` như cũ. */
  useLayoutEffect(() => {
    const cha = oRef.current?.offsetParent;
    if (!(cha instanceof HTMLElement)) return;
    if (oViTri) cha.style.setProperty('--if-tran-cum-trai', `${oViTri.tranCumTrai}px`);
    else cha.style.removeProperty('--if-tran-cum-trai');
  }, [oViTri]);

  if (!oViTri) return null;

  return (
    <>
    {/* ⭐ ĐOẠN ĐƯỜNG SÁNG LÊN — cho người dùng THẤY cái đang nhạy, thay vì bắt họ đoán.
        Sáng ĐỨNG YÊN (không chạy) — đúng phân vai ba tầng ánh sáng đã chốt 16/08: viền sáng
        đứng yên = *con trỏ đang ở đây* · viền CHẠY = *đang render*. `pointerEvents:none` là
        điều kiện sống của cả cơ chế: nó chỉ được LÀ MỘT VỆT SÁNG, không bao giờ được là một
        vật chắn đường. Giảm chuyển động ⇒ hiện/tắt thẳng, không nội suy. */}
    <div
      aria-hidden
      data-if-ranh-vitals=""
      style={{
        position: 'absolute',
        left: vung ? vung.trai + RANH_LE_PX : 0,
        width: vung ? Math.max(0, vung.rong - RANH_LE_PX * 2) : 0,
        bottom: -1,
        height: 2,
        zIndex: 30,
        pointerEvents: 'none',
        background: 'var(--accent)',
        opacity: reRanh ? 0.5 : 0,
        transition: giamChuyenDong() ? 'none' : `opacity ${thoiLuong(nhipToiBac('vien'), false)}ms ${DUONG_CONG}`,
      }}
    />
    {/* ⭐⭐ Ổ THẬT — CHỖ DÀNH RIÊNG trong vỏ app, KHÔNG phải một nút nhét vào cụm phải-trên.
       · `position:absolute` trong `<header>` (header đã `relative`) ⇒ ổ có toạ độ RIÊNG, không
         bị dòng flex của header đẩy đi khi cụm bên cạnh dài/ngắn ra.
       · `top: -O_THO` ⇒ ổ **thò lên quá mép trên vài pixel**: mắt đọc ra là KHE CẮT VÀO vỏ,
         không phải một nút đặt LÊN vỏ. Đây là điểm khác biệt giữa "gắn vật lý" và "gắn thêm".
       · bo góc chỉ ở HAI GÓC DƯỚI ⇒ nó ăn thẳng vào mép trên, không có cạnh trên để nhìn thấy.
       ⛔ Không có nhãn "Vitals" lơ lửng ở đây: nhãn nằm trong `aria-label` + trong tấm Peek. */}
    <div
      ref={oRef}
      data-vitals-aperture=""
      data-if-o-vitals=""
      style={{
        position: 'absolute',
        left: oViTri.trai,
        top: -O_THO,
        width: O_RONG,
        bottom: 0,
        zIndex: 31,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 3,
        background: 'var(--field)',
        borderLeft: '1px solid var(--vien-mo)',
        borderRight: '1px solid var(--vien-mo)',
        borderBottom: '1px solid var(--vien-mo)',
        borderRadius: '0 0 var(--r-3) var(--r-3)',
      }}
    >
      <button
        ref={nutRef}
        type="button"
        // BẤM = Peek GHIM (không nhảy thẳng vào chat): xem trước rồi mới quyết có mở không.
        // Bấm lần nữa lúc đã ghim thì đóng — vẫn có lối tắt bằng bàn phím/cảm ứng.
        onClick={() => (ghim && muc === 'peek' ? dong() : moPeek(true))}
        /**
         * 🔴 FOCUS MỞ NHƯNG **KHÔNG GHIM** — sửa một lỗi thật (22/08), lần theo vết sự kiện:
         *   pointerenter → state=peek (hover mở, chưa ghim)
         *   focus        → moPeek(TRUE) ⇒ GHIM
         *   click        → `ghim && muc==='peek'` ⇒ dong() ⇒ **ĐÓNG**
         * Tức là MỌI cú bấm chuột lên khẩu độ đều mở-rồi-đóng ngay trong cùng một cử chỉ: người
         * dùng bấm và thấy… không có gì. Bấm là cách tự nhiên nhất, và nó là cách DUY NHẤT hỏng.
         * Gốc bệnh: `focus` đi TRƯỚC `click`, nên nó ghim hộ, biến cú bấm thành cú bấm-lần-hai.
         * Nay focus chỉ MỞ (không trễ — bàn phím/tablet không được giấu sau hover, luật §8), việc
         * GHIM để dành cho hành động chủ động: bấm chuột hoặc Enter/Space.
         */
        onFocus={() => moPeek(false)}
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
        /**
         * TRẠNG THÁI NGỮ NGHĨA ĐỌC ĐƯỢC — không phải UI chỉ-để-test.
         * Nó là một chỗ DUY NHẤT nói khẩu độ đang ở đâu, dùng cho trợ năng, gỡ lỗi và kiểm tự
         * động; trước đây trạng thái chỉ nằm trong closure React nên một lỗi đóng-ngay-khi-mở
         * sống được mà không ai thấy.
         */
        /* 🔴 P0 `L2-03` — bản cũ tự tính `trangThai === 'alert' ? 'attention' : 'calm'`, tức
           DOM nói `calm` trong khi `aria-label` nói "không có tín hiệu". Hai bề mặt của MỘT nút
           nói hai chuyện. Nay cả hai sinh từ `mucTin` — lệch được nữa thì phải lệch ở một chỗ. */
        data-vitals-state={muc === 'ambient' ? domKhauDo(mucTin) : muc}
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
        {/* ⛔ KHÔNG có nhãn chữ "Vitals" ở đây (Hoà chốt 20/08: cấm nhãn lơ lửng trong header).
            Căng với NT-8 "ký hiệu luôn có nhãn" — giải bằng: chính Ổ là vật mang tên, và tên đó
            đi qua `aria-label` (bàn phím/trình đọc màn hình vẫn nghe đủ) + hiện thành chữ ngay
            khi Peek mở. Đây KHÔNG phải icon trần đặt bừa: nó ngồi trong một khe cắt vào vỏ,
            khe đó là affordance mạnh hơn một chữ nhỏ cạnh icon. */}
        {/* Số chỉ hiện khi CÓ tín hiệu thật; kênh chữ đi kèm nằm trong `aria-label` ở trên nên
            người không phân biệt được chấm vẫn nghe được trạng thái. */}
        {tinHieu.length > 0 && (
          <span className="text-[length:var(--fs-xs)] tabular-nums text-[var(--t3)]">{tinHieu.length}</span>
        )}
      </button>

      {/* ⛔ CỔNG CHỐNG HỘP RỖNG (Hoà cấm 05/09). `moPeek` đã chặn ở lối vào, nhưng tín hiệu
          có thể TẮT trong lúc tấm đang mở (lượt render xong, cảnh báo hết hạn) — lúc đó tấm
          sẽ tự rỗng ra. Chặn ở cả hai đầu nên không có khung hình nào lọt. Engage KHÔNG chịu
          điều kiện này: nó là chỗ ĐỌC và HỎI, rỗng tín hiệu vẫn có việc để làm. */}
      {muc !== 'ambient' && (muc === 'engage' || tinHieu.length > 0) && neo && typeof document !== 'undefined'
        ? createPortal(
            // PORTAL ra body — luật K4 (02/08): tấm nổi không được lồng trong chrome kính.
            <div
              ref={tamRef}
              role="dialog"
              aria-label="Vitals"
              onPointerEnter={vaoVung}
              onPointerLeave={roiVung}
              /* ⭐ TẤM RƠI TỪ ĐÁY Ổ — `top` đúng bằng mép dưới ổ ⇒ **khe hở = 0**, và `left`
                 lấy theo TÂM Ổ. Cả hai đến từ `viTriTamXo`, không tính tay tại chỗ.
                 Đóng: Engage → Peek → Ambient, cùng một gốc — người dùng không bao giờ mất dấu
                 chỗ nó thuộc về. */
              style={{
                position: 'fixed',
                zIndex: 60,
                ...(() => {
                  const t = viTriTamXo(
                    { tam: neo.tam, day: neo.tren },
                    muc === 'engage' ? RONG_ENGAGE : RONG_TAM,
                    window.innerWidth,
                  );
                  return { top: t.tren, left: t.trai };
                })(),
              }}
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
                  /* Vật liệu: nền ĐẶC theo token + viền + bóng nổi. Bản gốc dùng
                     `.be-mat-noi--kinh` (kho vật liệu `lib/ui/vat-lieu.ts`) — kho đó chưa có ở
                     nhánh này, nên khai bằng ĐÚNG token của hệ, không tự chế màu (luật ③). */
                  style={{
                    width: RONG_TAM,
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-pop)',
                    ...kieuMoc(),
                  }}
                  className="overflow-hidden rounded-[var(--r-3)] p-2"
                >
                  {/* ⛔ NHÁNH "0 tín hiệu" ĐÃ XOÁ 05/09 (Hoà cấm hộp rỗng). KHÔNG để lại nhánh JSX
                      không bao giờ chạy: một khối UI không bao giờ hiện là thứ phiên sau tưởng
                      đã có rồi — đúng cơ chế đẻ ra luật N8. Điều kiện `tinHieu.length > 0` nay
                      nằm ở CỔNG PORTAL bên trên, nên tới được đây là chắc chắn có tín hiệu. */}
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

                  {/* ⛔ Ở BẢN GỐC còn một khối CHI TIẾT (cái gì · vì sao · nguồn · ảnh hưởng +
                      2 nút) cho tín hiệu `dia-diem`. Cắt cùng lúc với nguồn của nó — giữ lại
                      thì đó là một nhánh JSX không bao giờ đúng, và một khối UI không bao giờ
                      hiện là thứ phiên sau tưởng đã có rồi (đúng cơ chế đẻ ra luật N8). */}

                  {/* MỘT hành động nhỏ. Không phải hàng nút. */}
                  <button
                    type="button"
                    onClick={() => {
                      huyRoi();
                      // Đi qua kho dùng chung — MỘT lối vào Engage, xem hiệu ứng đồng bộ ở trên.
                      moKho();
                    }}
                    className="mt-2 w-full rounded-[var(--r-2)] border border-[var(--border)] px-2 py-1.5 text-center text-[length:var(--fs-xs)] font-medium text-[var(--t2)] transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)]"
                  >
                    {tr('Mở Vitals…', 'Open Vitals…')}
                  </button>
                </div>
              ) : (
                /* ⭐ ENGAGE — cùng tâm đó nở tiếp thành bề mặt ĐỌC ĐƯỢC: `VitalsGesturePanel`,
                   panel chat Vitals THẬT (nền `.vitals-pop` đặc, đúng luật vật liệu "chỗ đọc lâu
                   + có ô nhập thì KHÔNG đeo kính"). Đây là CHỖ MOUNT DUY NHẤT của nó trong app.
                   ⛔ Không bọc thêm lớp chuyển động nào ở đây: panel tự có nhịp mở/đóng riêng
                   (framer-motion, đã tôn `prefers-reduced-motion`) — bọc thêm là hai nhịp chồng.
                   ⚠️ Panel tự đặt `top: calc(100% + 10px)` so với hộp cha, nên hộp cha lùi lên
                   đúng 10px để mép trên panel TRÙNG mép dưới ổ ⇒ khe hở = 0 (có khe là mắt đọc ra
                   "popover gắn lên", không phải "mép trên hé mở"). */
                <div style={{ position: 'relative', width: RONG_ENGAGE, height: 0, marginTop: -KHE_PANEL_PX }}>
                  <VitalsGesturePanel
                    originPx={null}
                    open
                    direction="down"
                    stage={stage}
                    initialInput={initialInput}
                    autoSend={autoSend}
                    onConsumeInitial={consumeInitial}
                    onClose={dong}
                  />
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
    </>
  );
}

export default VitalsAperture;
