'use client';

/**
 * lib/photo-editor/handoff.ts — Handoff Present ⇄ /photo-editor (PS-3, "round-trip").
 *
 * Khác CAD→Render (`lib/cad/handoff.ts`) và Render→Present (`lib/present-editor/handoff.ts`):
 * 2 cặp đó là ĐIỀU HƯỚNG CÙNG TAB (router.push SPA) nên sessionStorage đơn thuần đủ dùng.
 * `/photo-editor` mở bằng `window.open(..., '_blank')` → TAB THẬT KHÁC, nên 2 chiều cần
 * 2 cơ chế khác nhau:
 *
 *  - CHIỀU VÀO (Present → photo-editor): tab mới do `window.open` tạo ra ĐƯỢC CLONE
 *    sessionStorage của tab mở nó tại đúng thời điểm mở (hành vi chuẩn HTML5, Chrome/Firefox
 *    đều làm vậy khi cùng origin) — nên stash NGAY TRƯỚC `window.open()` vẫn đọc được bằng
 *    sessionStorage ở trang mới, giữ ĐÚNG pattern cũ (consume-once + mem-fallback B1).
 *
 *  - CHIỀU VỀ (photo-editor → Present, ghi ảnh đã edit): 2 tab đã TÁCH BIỆT từ lúc mở
 *    (theo spec, sessionStorage của chúng không còn dùng chung sau khi clone — ghi bên này
 *    bên kia không thấy). Dùng `localStorage` (CHIA SẺ thật giữa mọi tab cùng origin) — Present
 *    tab lắng nghe sự kiện `storage` (bắn tự động ở TAB KHÁC khi giá trị đổi) để tự nhận, KHÔNG
 *    cần theo dõi window reference / postMessage (bền hơn nếu người dùng đổi thứ tự tab, đóng
 *    mở lại /photo-editor, hay Present tab bị mất tham chiếu window vì lý do khác).
 *    Consume-once: Present đọc xong PHẢI gọi `clearPhotoEditorReturn()` ngay (tránh áp lại khi
 *    thấy sự kiện `storage` cũ/trùng, và tránh giữ dataURL lớn trong localStorage lâu dài).
 *
 * Phần đọc/ghi tách THUẦN khỏi phần lắng nghe sự kiện (DOM) — test bằng sucrase-node được
 * (cùng khuôn `lib/present-editor/handoff.test.ts`; polyfill Storage tối thiểu cho phần
 * localStorage vì Node không có sẵn).
 */

const IN_KEY = 'interiorflow.photoEditorHandoffIn';
const RETURN_KEY = 'interiorflow.photoEditorHandoffReturn';

/** "Địa chỉ" 1 ảnh trên deck Present — đủ để ghi ảnh đã edit về ĐÚNG element khi trả lại. */
export interface PhotoHandoffTarget {
  slideId: string;
  elementId: string;
  /** ảnh đang liên kết tài sản chung (PS-3) — ghi về sẽ cập nhật MỌI element cùng assetId. */
  assetId?: string;
}

export interface PhotoHandoffIn {
  src: string;
  target: PhotoHandoffTarget;
}

export interface PhotoHandoffReturn {
  dataUrl: string;
  target: PhotoHandoffTarget;
  ts: number;
}

/* ------------------------------- CHIỀU VÀO ------------------------------- */

/** fallback bộ nhớ khi sessionStorage hỏng/chặn (pattern B1, giống 2 handoff kia). */
let memIn: PhotoHandoffIn | null = null;

/**
 * Gọi NGAY TRƯỚC `window.open('/photo-editor', ...)`. Trả true nếu vào được sessionStorage
 * (tab mới sẽ clone được); false = rơi xuống mem-fallback (chỉ đọc được nếu SPA, không cross-tab
 * thật — chấp nhận vì đây là trường hợp hiếm sessionStorage bị chặn hẳn).
 */
export function stashPhotoEditorIn(src: string, target: PhotoHandoffTarget): boolean {
  if (!src || !target?.slideId || !target?.elementId) return false;
  const payload: PhotoHandoffIn = { src, target };
  try {
    sessionStorage.setItem(IN_KEY, JSON.stringify(payload));
    memIn = null; // ưu tiên sessionStorage; dọn fallback cũ nếu có
    return true;
  } catch {
    memIn = payload;
    return false;
  }
}

/** Gọi khi `/photo-editor` mount. CONSUME-ONCE: null = không có handoff (mở biệt lập). */
export function consumePhotoEditorIn(): PhotoHandoffIn | null {
  let payload: PhotoHandoffIn | null = null;
  try {
    const raw = sessionStorage.getItem(IN_KEY);
    if (raw) {
      sessionStorage.removeItem(IN_KEY);
      payload = JSON.parse(raw) as PhotoHandoffIn;
    }
  } catch {
    payload = null; // storage hỏng lúc đọc / JSON hỏng — thử fallback bộ nhớ bên dưới
  }
  if (!payload && memIn) payload = memIn;
  memIn = null; // dọn ngay — tránh double-consume
  return payload && payload.src && payload.target?.slideId && payload.target?.elementId ? payload : null;
}

/* ------------------------------- CHIỀU VỀ ------------------------------- */

/**
 * Ghi ảnh đã edit (PNG dataURL, đã composite bằng `exportDoc`) vào localStorage. Present tab
 * (khác tab) sẽ tự nhận qua sự kiện `storage`. Trả false nếu localStorage hỏng/đầy (dataURL
 * ảnh lớn) — KHÔNG có mem-fallback vì đây là 2 tab khác nhau, biến module-level không chia sẻ.
 */
export function writePhotoEditorReturn(dataUrl: string, target: PhotoHandoffTarget): boolean {
  if (!dataUrl || !target?.slideId || !target?.elementId) return false;
  const payload: PhotoHandoffReturn = { dataUrl, target, ts: Date.now() };
  try {
    localStorage.setItem(RETURN_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/** Đọc (KHÔNG dọn) bản ghi trả về hiện có — null nếu chưa có/hỏng. */
export function readPhotoEditorReturn(): PhotoHandoffReturn | null {
  try {
    const raw = localStorage.getItem(RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PhotoHandoffReturn;
    return parsed && parsed.dataUrl && parsed.target?.slideId && parsed.target?.elementId ? parsed : null;
  } catch {
    return null;
  }
}

/** Dọn bản ghi trả về sau khi Present đã áp xong — CONSUME-ONCE + tránh giữ dataURL lớn. */
export function clearPhotoEditorReturn(): void {
  try {
    localStorage.removeItem(RETURN_KEY);
  } catch {
    /* ignore */
  }
}

/** Key localStorage dùng cho sự kiện `storage` (so khớp `e.key` ở listener phía Present). */
export const PHOTO_EDITOR_RETURN_KEY = RETURN_KEY;
