/**
 * lib/ui/keo-be-mat.ts — PHẦN TÍNH THUẦN của việc kéo cửa sổ nổi: HÚT MÉP + NHỚ CHỖ.
 *
 * ⛔ ĐÂY KHÔNG PHẢI BỘ KÉO THỨ HAI. Phần kẹp-trong-vùng đã có và vẫn là nguồn duy nhất:
 * `ghimTrongVung()` + `LO_RA` ở `lib/nodes/cua-so-cong-cu.ts` (lượt P-R). Tệp này chỉ THÊM hai
 * thứ P-R chưa có — hút mép và nhớ chỗ — rồi ghép lại thành một đường đi.
 *
 * [Đ2] Đã LOOK INSIDE trước khi viết: `grep "hut|snap|localStorage"` trong cả
 * `cua-so-cong-cu.ts` · `cua-so-cong-cu-ui.ts` · `CuaSoCongCu.tsx` = **0**. Hai việc này thật sự
 * chưa có; mọi thứ khác thì gọi lại.
 *
 * Không React/zustand ở đây để chạy được bằng `sucrase-node` (repo không có Jest/Vitest —
 * bài học 20/08: viết test bằng vitest là làm đỏ `npm test` của mọi phiên khác).
 */

// Đường dẫn TƯƠNG ĐỐI có chủ ý: `sucrase-node` KHÔNG resolve alias `@/…` ⇒ dùng alias là tự khoá
// tệp này khỏi mọi test. Cùng lý do đã ghi ở `lib/nodes/cua-so-cong-cu.ts`.
import { ghimTrongVung, type ViTriCuaSo } from '../nodes/cua-so-cong-cu';

/**
 * NGƯỠNG HÚT MÉP — nhỏ có chủ ý. Hoà chốt: *"hút NHẸ, không tự cắm dock hung hăng"*.
 * 12px ≈ dưới một lần rung tay: người cố ý đặt cửa sổ cách mép 20px thì nó ĐỨNG YÊN ở 20px,
 * không bị giật vào mép. Ngưỡng lớn (24-32px như nhiều app) đọc ra là "máy giành quyền quyết".
 */
export const NGUONG_HUT = 12;

/** Khoảng chừa khi đã hút vào mép — không dán sát 0, cửa sổ vẫn phải đọc ra là VẬT NỔI. */
export const LE_HUT = 8;

export interface MepHut {
  /** Mép đã hút vào, `null` nếu không hút mép nào. Dùng để BÁO CHO NGƯỜI DÙNG THẤY. */
  trai: boolean;
  phai: boolean;
  tren: boolean;
}

export interface KetQuaHut {
  viTri: ViTriCuaSo;
  mep: MepHut;
}

/**
 * Hút nhẹ về mép vùng làm việc khi đã đủ gần. KHÔNG hút mép DƯỚI: cửa sổ dán đáy che mất thanh
 * trạng thái / dock lệnh, mà đó là thứ luật cấm che vĩnh viễn.
 *
 * ⚠️ Trả về CẢ `mep` chứ không chỉ toạ độ: hút mà không báo thì người dùng thấy cửa sổ "tự nhảy"
 * — đúng cảm giác bị-ép mà Hoà cấm. Nơi dùng phải bày ra là nó đang bám mép.
 */
export function hutMep(
  viTri: ViTriCuaSo,
  cua: { w: number; h: number },
  vung: { w: number; h: number },
  nguong: number = NGUONG_HUT,
): KetQuaHut {
  let { x, y } = viTri;
  const mep: MepHut = { trai: false, phai: false, tren: false };

  if (Math.abs(x - LE_HUT) <= nguong) {
    x = LE_HUT;
    mep.trai = true;
  } else if (Math.abs(x + cua.w - (vung.w - LE_HUT)) <= nguong) {
    x = vung.w - LE_HUT - cua.w;
    mep.phai = true;
  }
  if (Math.abs(y - LE_HUT) <= nguong) {
    y = LE_HUT;
    mep.tren = true;
  }
  return { viTri: { x, y }, mep };
}

/**
 * MỘT ĐƯỜNG ĐI DUY NHẤT cho mọi lần dời cửa sổ (kéo chuột · phím mũi tên · khôi phục lúc mở):
 * hút mép TRƯỚC, kẹp trong vùng SAU.
 *
 * ⚠️ Thứ tự này quan trọng và dễ làm ngược: kẹp trước rồi hút thì cửa sổ đã bị kẹp ra sát biên
 * `LO_RA` lại bị hút thêm lần nữa — trôi khỏi chỗ người dùng thả. Hút trước, kẹp sau thì kẹp
 * luôn là tiếng nói cuối cùng ⇒ **không đường nào cho cửa sổ thoát khỏi màn**, kể cả khi ngưỡng
 * hút bị chỉnh to.
 */
export function datChoAnToan(
  viTri: ViTriCuaSo,
  cua: { w: number; h: number },
  vung: { w: number; h: number },
): KetQuaHut {
  const h = hutMep(viTri, cua, vung);
  return { viTri: ghimTrongVung(h.viTri, cua, vung), mep: h.mep };
}

/* ------------------------------------------------------------------ *
 * NHỚ CHỖ — localStorage THEO NGỮ CẢNH                                *
 * ------------------------------------------------------------------ */

/**
 * ⭐ LUẬT ĐÃ CHỐT 16/08, KHÔNG NGHĨ LẠI: **VẬT + DÂY CHUYỀN = lưu chung · CÁCH BÀY TRÊN MÀN =
 * lưu theo MÁY**. Vị trí và cỡ cửa sổ là *cách bày*, không phải nội dung tài liệu ⇒ vào
 * `localStorage`, **TUYỆT ĐỐI không vào `.idf`/DB**, và **không đẻ schema mới**.
 *
 * Đây cũng đúng lý do `cua-so-cong-cu-ui.ts` đã cố ý không nhét state vào `InteriorNodeData`.
 * Việc còn thiếu chỉ là: nay nó sống qua được lần tải lại trang.
 */
const TIEN_TO = 'if.cua-so.';

/**
 * Khoá lưu THEO NGỮ CẢNH — cùng một cửa sổ ở hai dự án / hai chặng là hai chỗ nhớ khác nhau.
 * ⛔ Cấm gõ toạ độ cứng theo từng màn; màn nào cũng đi qua đây.
 */
export function khoaNhoCho(nguCanh: string, khoa: string): string {
  return `${TIEN_TO}${nguCanh}.${khoa}`;
}

export interface ChoDaNho {
  viTri: ViTriCuaSo;
  co?: { w: number; h: number };
}

/**
 * Đọc chỗ đã nhớ. Hỏng/thiếu/không phải số ⇒ trả `null` để nơi dùng rơi về **mọc từ nguồn**.
 * Không bao giờ ném lỗi: localStorage có thể bị chặn (chế độ riêng tư, cấu hình doanh nghiệp),
 * và một cửa sổ không nhớ được chỗ vẫn phải mở ra được.
 */
export function docCho(nguCanh: string, khoa: string): ChoDaNho | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const s = localStorage.getItem(khoaNhoCho(nguCanh, khoa));
    if (!s) return null;
    const v = JSON.parse(s) as ChoDaNho;
    const so = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
    if (!v || !v.viTri || !so(v.viTri.x) || !so(v.viTri.y)) return null;
    if (v.co && (!so(v.co.w) || !so(v.co.h))) return { viTri: v.viTri };
    return v;
  } catch {
    return null;
  }
}

/** Ghi chỗ. Nuốt mọi lỗi (hết dung lượng · bị chặn) — nhớ-chỗ hỏng không được làm hỏng thao tác. */
export function ghiCho(nguCanh: string, khoa: string, cho: ChoDaNho): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(khoaNhoCho(nguCanh, khoa), JSON.stringify(cho));
  } catch {
    /* không làm gì — xem docstring */
  }
}

export function xoaCho(nguCanh: string, khoa: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(khoaNhoCho(nguCanh, khoa));
  } catch {
    /* không làm gì */
  }
}

/**
 * Chỗ nhớ có còn dùng được trên MÀN HÌNH HIỆN TẠI không.
 *
 * 🔴 CA THẬT PHẢI CHẶN: nhớ chỗ trên màn 27" rồi mở lại trên laptop 13" ⇒ cửa sổ nằm ngoài màn,
 * **không tài nào với tới**. Nhớ chỗ mà không kiểm lại vùng là tự tay dựng ra đúng cái hỏng mà
 * luật "không bao giờ để cửa sổ trôi ra ngoài với không tới được" đang cấm.
 * Không hợp lệ ⇒ nơi dùng bỏ chỗ nhớ, quay về mọc-từ-nguồn (bao giờ cũng trong màn).
 */
export function choConDungDuoc(
  cho: ChoDaNho,
  cua: { w: number; h: number },
  vung: { w: number; h: number },
): boolean {
  const g = ghimTrongVung(cho.viTri, cua, vung);
  return g.x === cho.viTri.x && g.y === cho.viTri.y;
}
