'use client';

/**
 * lib/cad/present-handoff.ts — Handoff CAD → Present ("Đưa sang Present").
 *
 * SONG SONG với CAD→Render (lib/cad/handoff.ts) — KHÔNG thay thế, không đụng nút/luồng đó.
 * CÙNG PATTERN sessionStorage + fallback module-singleton như lib/cad/handoff.ts (CAD→Render) và
 * lib/present-editor/handoff.ts (Render→Present): '/cad-editor' và '/present-editor' là 2 route
 * khác nhau, router.push điều hướng SPA nhưng state cục bộ của route cũ không mang theo được →
 * phải stash rồi consume SAU khi route đích mount xong.
 *
 * IF2-nền (23/07) — payload nay là OBJECT có `version` + `snapshot` giống CAD→Render, để đóng
 * băng dữ liệu ở thời điểm bàn giao (xem IF1_IF2_BIGPICTURE.md §2). Payload cũ (chuỗi dataURL
 * trần) VẪN parse được — hàm consume tự nhận diện shape.
 *
 * ~~CONSUME-ONCE: đọc xong dọn cả 2 nguồn ngay → không double-insert khi PresentEditor remount.~~
 * ⛔ **HẾT HIỆU LỰC 06/09** — xem khối ngay dưới. Câu này đúng về mục đích (chống chèn đôi) nhưng
 * cách nó đạt mục đích ấy chính là thứ làm MẤT dữ liệu. Vai chống-chèn-đôi nay do
 * `PresentEditor` giữ bằng cờ ref + id slide suy từ lô hàng, KHÔNG bằng cách xoá nguồn sớm.
 * Không có handoff ⇒ peek/consume trả null ⇒ /present-editor y hệt trước (không phá luồng cũ).
 *
 * 🔴 TÁCH ĐÔI "ĐỌC" VÀ "BUÔNG TAY" (06/09 — sửa MẤT DỮ LIỆU, đo được, không phải lo xa).
 * Đường cũ chỉ có `consume` = đọc-và-xoá trong CÙNG một nhịp. Nhưng lúc đó slide mới chỉ nằm
 * trong BỘ NHỚ của editor; deck chỉ ghi bền sau autosave (debounce 1,2 s + chờ-rảnh tới 1,5 s).
 * Trục thời gian đo trên app thật (`scripts/nghiem-thu-ban-lam-viec/tai-hien-mat-slide.mjs`):
 *
 *     ms 5739  handoff CÒN (133.956 byte trong sessionStorage)
 *     ms 7987  handoff = 0   ← đã xoá, bản DUY NHẤT của tờ bản vẽ biến mất
 *     ms 9273  IndexedDB mới có slide  ← bền từ đây
 *
 * ⇒ có một CỬA SỔ ~1,3–3,5 s mà tờ bản vẽ **không tồn tại ở đâu bền cả**. Nạp lại trang, đóng
 * tab, mất điện, hay một lỗi render trong khoảng đó là mất trắng — và không có đường lấy lại vì
 * nguồn đã bị xoá. Nay: `peek` (đọc, GIỮ) → chèn → chỉ `clear` khi bản ghi chứa slide đó đã
 * thật sự nằm trong IndexedDB. `consume` giữ nguyên cho caller cũ/test.
 */

import type { CadRole } from './store';

const KEY = 'interiorflow.cadPresentHandoff';

export interface CadPresentHandoffPayload {
  version: number;
  dataUrl: string;
  snapshot: string | null;
  timestamp: number;
  fromRole: CadRole | null;
  toRole: CadRole | null;
  /**
   * Dự án đã gửi tờ này. Có từ 06/09, cùng lượt với `peek`/`clear`: khi handoff được GIỮ LẠI cho
   * tới lúc ghi bền, nó có thể còn sống lúc người dùng mở Trình chiếu của **dự án khác** — thiếu
   * trường này thì tờ bản vẽ rơi nhầm nhà. `null` = payload cũ ⇒ nhận như trước (không chặn).
   */
  projectId: string | null;
}

let versionCounter = 0;

/** Fallback bộ nhớ khi sessionStorage hỏng/chặn (pattern B1 của lib/cad/handoff.ts). */
let memHandoff: CadPresentHandoffPayload | null = null;

export interface PresentStashOptions {
  snapshot?: string | null;
  fromRole?: CadRole | null;
  toRole?: CadRole | null;
  /** Dự án đang mở lúc gửi — xem docstring `projectId` của payload. */
  projectId?: string | null;
}

/** Stash 1 ảnh snapshot bản vẽ CAD (dataURL). Trả true nếu vào được sessionStorage (false = dùng mem). */
export function stashCadPresentHandoff(dataUrl: string, opts?: PresentStashOptions): boolean {
  versionCounter += 1;
  const payload: CadPresentHandoffPayload = {
    version: versionCounter,
    dataUrl,
    snapshot: opts?.snapshot ?? null,
    timestamp: Date.now(),
    fromRole: opts?.fromRole ?? null,
    toRole: opts?.toRole ?? null,
    projectId: opts?.projectId ?? null,
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
    memHandoff = null; // ưu tiên sessionStorage; dọn fallback cũ nếu có
    return true;
  } catch {
    memHandoff = payload; // quota/chặn — giữ bộ nhớ, consume vẫn nhận được sau điều hướng SPA
    return false;
  }
}

/** Tự nhận diện shape: dataURL trần (legacy) → wrap version 0; JSON payload mới → parse thẳng. */
function normalizePayload(raw: string | null): CadPresentHandoffPayload | null {
  if (!raw) return null;
  if (raw.startsWith('data:')) {
    return { version: 0, dataUrl: raw, snapshot: null, timestamp: 0, fromRole: null, toRole: null, projectId: null };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CadPresentHandoffPayload>;
    if (typeof parsed.dataUrl !== 'string') return null;
    return {
      version: typeof parsed.version === 'number' ? parsed.version : 0,
      dataUrl: parsed.dataUrl,
      snapshot: typeof parsed.snapshot === 'string' ? parsed.snapshot : null,
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : 0,
      fromRole: (parsed.fromRole as CadRole | null) ?? null,
      toRole: (parsed.toRole as CadRole | null) ?? null,
      projectId: typeof parsed.projectId === 'string' ? parsed.projectId : null,
    };
  } catch {
    return null;
  }
}

/**
 * Consume-ONCE: trả ảnh đã stash (hoặc null) rồi dọn cả 2 nguồn. Không có gì → null.
 *
 * ⚠️ @deprecated CHO ĐƯỜNG CHÈN SLIDE — 06/09. Đây chính là hàm đã gây MẤT TỜ BẢN VẼ: nó xoá bản
 * duy nhất ngay lúc đọc, trong khi slide còn ~1,3–3,5 s nữa mới ghi bền (số đo ở docstring đầu
 * tệp). Đường đúng cho mọi nơi CHÈN dữ liệu bàn giao vào tài liệu:
 * `peekCadPresentHandoffPayload()` → chèn → `clearCadPresentHandoff()` **sau khi** có biên nhận
 * đã ghi. Giữ hàm này cho test và cho caller chỉ cần đọc-rồi-vứt, KHÔNG cần dữ liệu sống sót.
 */
export function consumeCadPresentHandoff(): string | null {
  const p = consumeCadPresentHandoffPayload();
  return p ? p.dataUrl : null;
}

/**
 * ĐỌC MÀ GIỮ — không xoá gì. Dùng cặp với `clearCadPresentHandoff()` khi người gọi phải bảo đảm
 * hàng đã hạ cánh trước lúc buông tay (xem docstring đầu tệp).
 */
export function peekCadPresentHandoffPayload(): CadPresentHandoffPayload | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  return normalizePayload(raw) ?? memHandoff;
}

/** BUÔNG TAY — dọn cả 2 nguồn. Gọi SAU khi chắc chắn tờ bản vẽ đã ghi bền, không sớm hơn. */
export function clearCadPresentHandoff(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode — fallback bộ nhớ ở dưới vẫn dọn */
  }
  memHandoff = null;
}

/** Consume-ONCE — trả payload đầy đủ (version/snapshot/timestamp/roles). = peek + clear. */
export function consumeCadPresentHandoffPayload(): CadPresentHandoffPayload | null {
  const payload = peekCadPresentHandoffPayload();
  clearCadPresentHandoff();
  return payload;
}

/** Test-only helper — reset version counter + mem fallback. */
export function __resetCadPresentHandoffForTest(): void {
  versionCounter = 0;
  memHandoff = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
