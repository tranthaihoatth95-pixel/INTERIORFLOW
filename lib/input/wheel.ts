/**
 * lib/input/wheel.ts — phân loại sự kiện `wheel` cho MỌI canvas của IF (CAD · Rendering · Presenting).
 *
 * VÌ SAO CẦN: trước đây mỗi chặng tự xử lý `onWheel` và đều coi MỌI cuộn = zoom. Đúng với chuột
 * lăn, SAI với trackpad — người dùng Mac/laptop cuộn 2 ngón để PAN thì canvas lại phóng to thu nhỏ
 * loạn xạ. Gom về một chỗ để 3 chặng cùng hành vi, sửa một lần ăn cả ba.
 *
 * KHÔNG có API trình duyệt nào cho biết "chuột hay trackpad". Phải suy đoán từ đặc trưng sự kiện.
 * Bảng đặc trưng thực đo (Chrome/Safari/Firefox, macOS + Windows):
 *
 *   Thiết bị / thao tác        deltaMode  |deltaY|      deltaX   ctrlKey  Ghi chú
 *   ─────────────────────────────────────────────────────────────────────────────────────
 *   Chuột lăn 1 nấc (Chrome)   0 (pixel)  ~100          0        false    bội số nguyên, đều
 *   Chuột lăn 1 nấc (Firefox)  1 (line)   3             0        false    ĐƠN VỊ DÒNG, phải quy đổi
 *   Trackpad cuộn 2 ngón       0 (pixel)  1–30, lẻ      thường≠0 false    liên tục, hay có phần thập phân
 *   Trackpad chụm (pinch)      0 (pixel)  1–10          0        TRUE     macOS+Windows đều set ctrlKey
 *   Ctrl + lăn chuột           0 hoặc 1   như chuột     0        TRUE     người dùng chủ động muốn zoom
 *
 * QUY ƯỚC KẾT QUẢ (chuẩn ngành — Figma/Miro/AutoCAD web):
 *   ctrlKey        → ZOOM (pinch trackpad, hoặc Ctrl+lăn cố ý)
 *   shiftKey       → PAN ngang
 *   giống trackpad → PAN 2 chiều
 *   còn lại        → ZOOM (chuột lăn — giữ đúng phản xạ CAD cũ)
 */

/* ── deltaMode: hằng số của WheelEvent (không phải mọi môi trường test đều có WheelEvent) ── */
export const DOM_DELTA_PIXEL = 0;
export const DOM_DELTA_LINE = 1;
export const DOM_DELTA_PAGE = 2;

/** Quy đổi 1 "dòng" ra px. Firefox trả deltaMode=1 với deltaY=3 cho 1 nấc chuột; 16px/dòng ⇒ 48px
 *  — xấp xỉ 1 nấc ~100px của Chrome ở mức chấp nhận được, và quan trọng hơn là KHÔNG còn bị hiểu
 *  nhầm 3px = cuộn trackpad tí hon (bug "zoom giật cục trên Firefox"). */
export const LINE_HEIGHT_PX = 16;
/** deltaMode=2 (trang) hiếm gặp; quy ước 1 trang ≈ 1 màn hình. */
export const PAGE_HEIGHT_PX = 400;

/**
 * Ngưỡng phân biệt chuột ↔ trackpad theo độ lớn 1 sự kiện (sau khi đã quy về px).
 * Chọn 40: chuột lăn cho ~100px/nấc (Chrome/Edge, từ WHEEL_DELTA=120 của Windows) hoặc 48px sau
 * quy đổi dòng (Firefox) — đều > 40. Trackpad cuộn êm cho 1–30px/sự kiện — đều < 40. Khoảng trống
 * 30↔48 đủ rộng để không chạm biên ở cả hai phía.
 */
export const MOUSE_STEP_MIN_PX = 40;

/** Đổi delta về px bất kể deltaMode (điểm chốt cho Firefox/line-mode). */
export function normalizeWheelDelta(e: WheelLike): { dx: number; dy: number } {
  const unit =
    e.deltaMode === DOM_DELTA_LINE ? LINE_HEIGHT_PX : e.deltaMode === DOM_DELTA_PAGE ? PAGE_HEIGHT_PX : 1;
  return { dx: (e.deltaX || 0) * unit, dy: (e.deltaY || 0) * unit };
}

/** Chỉ cần đủ trường của WheelEvent — để test dựng object thường, không phải giả lập DOM. */
export interface WheelLike {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export type WheelIntent =
  | { kind: 'zoom'; factor: number; source: 'pinch' | 'mouse' }
  | { kind: 'pan'; dx: number; dy: number; source: 'trackpad' | 'shift' };

/**
 * Có "giống trackpad" không? Chỉ gọi khi KHÔNG có ctrlKey (ctrlKey đã là pinch → zoom).
 *
 * Ba dấu hiệu, chỉ cần trúng một:
 *  1. deltaX ≠ 0 — chuột thường không có trục ngang; có trục ngang ⇒ trackpad (hoặc chuột nghiêng
 *     bánh xe, mà nghiêng bánh xe thì PAN ngang cũng đúng ý người dùng).
 *  2. Bước nhỏ (< MOUSE_STEP_MIN_PX) — cuộn êm liên tục của trackpad.
 *  3. delta có phần thập phân — nấc chuột luôn nguyên; đà quán tính (momentum) của trackpad macOS
 *     sinh số lẻ. Bắt được cả cú vuốt MẠNH (delta lớn) mà 2 dấu hiệu trên bỏ sót.
 */
export function looksLikeTrackpad(e: WheelLike): boolean {
  const { dx, dy } = normalizeWheelDelta(e);
  if (dx !== 0) return true;
  if (!Number.isInteger(e.deltaY) || !Number.isInteger(e.deltaX)) return true;
  return Math.abs(dy) < MOUSE_STEP_MIN_PX;
}

/**
 * Độ nhạy zoom. factor = exp(-dy * k).
 * k của CHUỘT chọn sao cho 1 nấc chuẩn (dy = 100px) cho đúng 1.12 — bằng hằng số zoom CAD cũ
 * (`CadCanvas.onWheel`), nên cảm giác lăn chuột trong CAD KHÔNG đổi sau đợt tối ưu này.
 */
export const MOUSE_ZOOM_K = Math.log(1.12) / 100;
/** Pinch cho delta nhỏ hơn nhiều nên cần k lớn hơn thì mới "bắt tay" kịp cử chỉ chụm. */
export const PINCH_ZOOM_K = 0.01;

/** Chặn factor để một sự kiện đơn lẻ (đà quán tính mạnh) không nhảy zoom quá lố. */
const FACTOR_MIN = 1 / 3;
const FACTOR_MAX = 3;

function zoomFactor(dy: number, k: number): number {
  return Math.min(FACTOR_MAX, Math.max(FACTOR_MIN, Math.exp(-dy * k)));
}

/**
 * Phân loại 1 sự kiện wheel thành ý định thao tác.
 *
 * @param opts.invertZoom  đảo chiều zoom (một số người quen chiều ngược).
 * @param opts.zoomOnPlainWheel  false ⇒ lăn chuột trần KHÔNG zoom mà pan dọc (dùng cho trình dàn
 *   trang như Presenting, nơi cuộn = xem slide kế, zoom phải giữ Ctrl/⌘ — chuẩn Canva/Figma slide).
 */
export function classifyWheel(
  e: WheelLike,
  opts: { invertZoom?: boolean; zoomOnPlainWheel?: boolean } = {},
): WheelIntent {
  const { invertZoom = false, zoomOnPlainWheel = true } = opts;
  const { dx, dy } = normalizeWheelDelta(e);
  const sign = invertZoom ? -1 : 1;

  // 1) Pinch trackpad HOẶC Ctrl/⌘ + lăn ⇒ luôn zoom. Trình duyệt đặt ctrlKey=true cho cử chỉ chụm
  //    trên CẢ macOS lẫn Windows — đây là cách duy nhất nhận ra pinch từ sự kiện wheel.
  //    Độ nhạy vẫn phải phân biệt thiết bị: chụm cho delta nhỏ (cần k lớn), còn Ctrl+lăn chuột cho
  //    delta ~100 (dùng k lớn sẽ nhảy ~2.7× mỗi nấc — chóng mặt). Nên chọn k theo dạng sự kiện.
  if (e.ctrlKey || e.metaKey) {
    const k = looksLikeTrackpad(e) ? PINCH_ZOOM_K : MOUSE_ZOOM_K;
    return { kind: 'zoom', factor: zoomFactor(sign * dy, k), source: 'pinch' };
  }

  // 2) Shift + cuộn = pan ngang (quy ước chung của trình duyệt và mọi canvas editor).
  if (e.shiftKey) {
    // Chuột chỉ có trục dọc ⇒ khi giữ Shift thì dy chính là lượng pan ngang mong muốn.
    return { kind: 'pan', dx: dx !== 0 ? dx : dy, dy: 0, source: 'shift' };
  }

  // 3) Trackpad cuộn 2 ngón ⇒ pan, TUYỆT ĐỐI không zoom.
  if (looksLikeTrackpad(e)) {
    return { kind: 'pan', dx, dy, source: 'trackpad' };
  }

  // 4) Còn lại = chuột lăn. Mặc định zoom (phản xạ CAD); chặng dàn trang tắt cờ này để cuộn trang.
  if (!zoomOnPlainWheel) {
    return { kind: 'pan', dx, dy, source: 'trackpad' };
  }
  return { kind: 'zoom', factor: zoomFactor(sign * dy, MOUSE_ZOOM_K), source: 'mouse' };
}

/* ───────────────────────────── zoom quanh con trỏ ─────────────────────────────
 * Chặng CAD có sẵn `zoomAt` riêng (toạ độ world mm, trục Y lật) trong `lib/cad/model.ts`.
 * Hàm dưới đây dành cho viewport kiểu "translate + scale" của React Flow (chặng Rendering).
 */

/** Viewport kiểu React Flow: nội dung dịch (x, y) rồi phóng `zoom`. */
export interface PanZoomViewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Zoom quanh một điểm trên màn hình, giữ nguyên điểm nội dung đang nằm dưới con trỏ.
 * (px, py) tính theo goc trái-trên của vùng canvas.
 */
export function zoomAtPoint(
  v: PanZoomViewport,
  px: number,
  py: number,
  factor: number,
  minZoom = 0.15,
  maxZoom = 2.5,
): PanZoomViewport {
  const zoom = Math.max(minZoom, Math.min(maxZoom, v.zoom * factor));
  // Điểm nội dung dưới con trỏ: c = (p - v) / zoom. Giữ c cố định ⇒ v' = p - c * zoom'.
  return { zoom, x: px - ((px - v.x) / v.zoom) * zoom, y: py - ((py - v.y) / v.zoom) * zoom };
}

/* ───────────────────── nhường cuộn cho panel/thanh công cụ cuộn được ─────────────────────
 *
 * BUG THẬT đã sửa (19/07, user báo "cuộn chuột ở CAD Pro không hoạt động"): thanh công cụ pill có
 * `overflow-x:auto` và ở mode Pro thì TRÀN (55 nút, thừa ~835px) nên nó là một vùng cuộn thật, trải
 * hết bề ngang màn hình ngay trên canvas. Trình duyệt quy đổi deltaY thành cuộn NGANG cho phần tử
 * chỉ cuộn được theo trục ngang ⇒ lăn chuột ở dải đó làm TRƯỢT THANH CÔNG CỤ chứ không zoom canvas.
 * Ở mode Sketch pill chỉ 25 nút, không tràn (thừa 0px) nên không cướp cuộn — đó là lý do bug chỉ
 * thấy ở Pro.
 *
 * Cách sửa đúng (không phải chặn cứng): hỏi "phần tử dưới con trỏ có cuộn được THEO ĐÚNG TRỤC mà
 * người dùng đang cuộn không?".
 *   - Lăn chuột dọc trên pill  → pill không cuộn dọc được ⇒ KHÔNG nhường ⇒ canvas zoom. (hết bug)
 *   - Vuốt ngang trên pill     → pill cuộn ngang được ⇒ nhường ⇒ thanh công cụ trượt. (giữ tính năng)
 *   - Cuộn trên panel Lớp/Nội thất → panel cuộn dọc được ⇒ nhường ⇒ panel cuộn, canvas đứng yên.
 */

/** Phần tử này có thực sự cuộn được theo trục đang xét không (có overflow VÀ còn chỗ để cuộn)? */
function scrollableOnAxis(el: Element, axis: 'x' | 'y'): boolean {
  const st = getComputedStyle(el);
  const overflow = axis === 'x' ? st.overflowX : st.overflowY;
  if (overflow !== 'auto' && overflow !== 'scroll' && overflow !== 'overlay') return false;
  return axis === 'x' ? el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1;
}

/**
 * Tìm tổ tiên (kể cả chính `start`) sẽ nuốt cú cuộn này một cách CHÍNH ĐÁNG.
 * Trả về `null` ⇒ canvas được quyền xử lý (zoom/pan) và nên `preventDefault()`.
 *
 * @param stopAt dừng khi chạm phần tử này (thường là gốc vùng canvas) — không đi lên quá phạm vi.
 */
export function findScrollableAncestor(
  start: Element | null,
  dx: number,
  dy: number,
  stopAt?: Element | null,
): Element | null {
  // Trục người dùng đang cuộn: cái nào trội hơn. Cuộn chéo bằng nhau ⇒ coi là dọc.
  const axis: 'x' | 'y' = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  let node: Element | null = start;
  while (node && node !== stopAt) {
    if (node.nodeType === 1 && scrollableOnAxis(node, axis)) return node;
    node = node.parentElement;
  }
  return null;
}
