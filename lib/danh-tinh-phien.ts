'use client';

/**
 * lib/danh-tinh-phien.ts — GIEO ĐỊNH DANH TỪ PHIÊN MÁY CHỦ vào bộ đệm cục bộ.
 *
 * ⛔ BỆNH ĐÃ CHỮA (P0 mất dữ liệu, 04/09): người dùng ĐANG ĐĂNG NHẬP hợp lệ mở THẲNG một
 * route studio (`/projects/[id]/cad`, `/projects/[id]/present` — tab mới, bookmark, F5) rồi
 * làm việc. `lastUserId` trong localStorage rỗng vì trình duyệt đó chưa từng đi qua Home
 * hay màn đăng nhập ⇒ `getLastUserId()` trả null ⇒ `CadSheets`/`PresentSheets` rơi vào nhánh
 * "thuần in-memory" ⇒ **KHÔNG ghi một byte nào xuống IndexedDB, và KHÔNG báo lỗi.**
 *
 * GỐC BỆNH KHÔNG PHẢI THIẾU THÔNG TIN — máy chủ BIẾT người này là ai (cookie phiên hợp lệ,
 * `/api/auth/me` trả 200 kèm user). Gốc bệnh là **lưu trữ neo vào nguồn YẾU (localStorage)
 * trong khi nguồn MẠNH (phiên máy chủ) nằm ngay đó.** Nên chữa ở TẦNG NGUỒN:
 *
 *   · phiên máy chủ = NGUỒN SỰ THẬT của định danh
 *   · `interiorflow.lastUserId` (localStorage) = BỘ ĐỆM của nguồn đó
 *
 * ⚠️ CẤM VÁ ĐIỂM. Đây là lần thứ ba cùng họ bệnh (⌘Z, Delete đều từng vá điểm rồi mọc lại).
 * TUYỆT ĐỐI không thêm một chỗ gọi `getLastUserId()` nữa để "chữa" chỗ mới — mọi đường tiêu
 * thụ đã có sẵn tự đúng khi bộ đệm được gieo. Cần định danh ở chỗ mới ⇒ `await danhTinhSanSang()`.
 *
 * 🔒 KHÔNG ĐỔI HÌNH DẠNG KHOÁ. Vẫn đúng `interiorflow.lastUserId`, vẫn đúng một chuỗi id trần
 * (`lib/resume.ts`). Dữ liệu cũ đọc lại được nguyên vẹn, không cần bảng nâng cấp.
 *
 * ⛔ THÀ KHÔNG LƯU CÒN HƠN LƯU NHẦM CHỖ NGƯỜI KHÁC: chỉ ghi khi máy chủ khẳng định 200 + có
 * `user.id`. 401 (chưa đăng nhập) · 503 (hạ tầng lỗi, `SessionWatch` lo báo) · mạng đứt · JSON
 * hỏng ⇒ KHÔNG ghi gì, KHÔNG ném lỗi, app chạy tiếp y như cũ.
 */

import { getLastUserId, setLastUserId } from './resume';

/** Kết quả một lượt giải định danh — đủ để test phân biệt "im lặng" với "ghi bừa". */
export type KetQuaDanhTinh =
  /** Bộ đệm đã có sẵn — KHÔNG tốn request nào. */
  | { trangThai: 'da-co'; userId: string }
  /** Máy chủ xác nhận, vừa gieo vào bộ đệm. */
  | { trangThai: 'gieo-moi'; userId: string }
  /** Máy chủ nói rõ: chưa đăng nhập (401). Không ghi gì. */
  | { trangThai: 'chua-dang-nhap' }
  /** Không kết luận được (503 / mạng đứt / thân trả về lạ). Không ghi gì. */
  | { trangThai: 'khong-ket-luan'; lyDo: string };

/** Bề mặt tối thiểu của `Response` mà lõi cần — để test không phải dựng `fetch` thật. */
export interface DapAnMayChu {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export interface PhuThuocDanhTinh {
  docDem: () => string | null;
  ghiDem: (userId: string) => void;
  hoiMayChu: () => Promise<DapAnMayChu>;
}

/**
 * LÕI THUẦN (test được bằng sucrase-node, không cần DOM/mạng): đọc đệm trước, thiếu thì hỏi
 * máy chủ đúng MỘT lần rồi gieo. Mọi nhánh không chắc chắn đều KHÔNG ghi.
 */
export async function giaiDanhTinh(deps: PhuThuocDanhTinh): Promise<KetQuaDanhTinh> {
  const dem = deps.docDem();
  if (dem) return { trangThai: 'da-co', userId: dem };

  let dapAn: DapAnMayChu;
  try {
    dapAn = await deps.hoiMayChu();
  } catch {
    // Mạng đứt / máy chủ không với tới — KHÔNG kết luận là "chưa đăng nhập".
    return { trangThai: 'khong-ket-luan', lyDo: 'mang-dut' };
  }

  // 503 = hạ tầng lỗi, người dùng VẪN đang đăng nhập hợp lệ (xem app/api/auth/me/route.ts).
  if (dapAn.status === 503) return { trangThai: 'khong-ket-luan', lyDo: 'may-chu-loi' };
  if (!dapAn.ok) return { trangThai: 'chua-dang-nhap' };

  let than: unknown;
  try {
    than = await dapAn.json();
  } catch {
    return { trangThai: 'khong-ket-luan', lyDo: 'than-hong' };
  }

  const u = (than as { user?: { id?: unknown } } | null)?.user;
  const id = typeof u?.id === 'string' ? u.id.trim() : '';
  if (!id) return { trangThai: 'khong-ket-luan', lyDo: 'thieu-id' };

  deps.ghiDem(id);
  return { trangThai: 'gieo-moi', userId: id };
}

/** Một lượt duy nhất cho cả vòng đời tab — nhiều nơi gọi cũng chỉ MỘT request. */
let dangChay: Promise<KetQuaDanhTinh> | null = null;

/**
 * Gieo định danh cho tab hiện tại. Gọi được nhiều lần, nhiều nơi (single-flight).
 * Trả về promise để nơi nào CẦN CHẮC CHẮN có định danh thì `await` — thay vì đọc
 * `getLastUserId()` một phát rồi kết luận sai lúc vào thẳng URL.
 */
export function danhTinhSanSang(): Promise<KetQuaDanhTinh> {
  if (typeof window === 'undefined') {
    return Promise.resolve({ trangThai: 'khong-ket-luan', lyDo: 'khong-co-window' });
  }
  if (!dangChay) {
    dangChay = giaiDanhTinh({
      docDem: getLastUserId,
      ghiDem: setLastUserId,
      hoiMayChu: () => fetch('/api/auth/me'),
    });
  }
  return dangChay;
}

/** Chỉ dùng trong test — quên lượt đã chạy để ca sau bắt đầu sạch. */
export function quenLuotDanhTinh(): void {
  dangChay = null;
}
