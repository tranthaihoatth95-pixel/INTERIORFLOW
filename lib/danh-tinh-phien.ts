'use client';

/**
 * lib/danh-tinh-phien.ts — GIEO ĐỊNH DANH TỪ PHIÊN MÁY CHỦ vào bộ đệm cục bộ.
 *
 * ⛔ BỆNH ĐÃ CHỮA (P0 mất dữ liệu, 04/09): người dùng ĐANG ĐĂNG NHẬP hợp lệ mở THẲNG một
 * route studio (`/projects/[id]/cad`, `/projects/[id]/present` — tab mới, bookmark, F5) rồi
 * làm việc. `lastUserId` trong localStorage rỗng vì trình duyệt đó chưa từng đi qua Home
 * hay màn đăng nhập ⇒ `getLastUserId()` trả null ⇒ `CadSheets`/`PresentSheets`/autosave 3D
 * rơi vào nhánh "thuần in-memory" ⇒ **KHÔNG ghi một byte nào xuống IndexedDB, và KHÔNG báo lỗi.**
 *
 * GỐC BỆNH KHÔNG PHẢI THIẾU THÔNG TIN — máy chủ BIẾT người này là ai (cookie phiên hợp lệ,
 * `/api/auth/me` trả 200 kèm user). Gốc bệnh là **lưu trữ neo vào nguồn YẾU (localStorage)
 * trong khi nguồn MẠNH (phiên máy chủ) nằm ngay đó.** Nên chữa ở TẦNG NGUỒN:
 *
 *   · phiên máy chủ = NGUỒN SỰ THẬT của định danh
 *   · `interiorflow.lastUserId` (localStorage) = BỘ ĐỆM của nguồn đó
 *
 * ⚠️ CẤM VÁ ĐIỂM. Đây là lần thứ ba cùng họ bệnh (⌘Z, Delete đều từng vá điểm rồi mọc lại).
 * TUYỆT ĐỐI không thêm một chỗ gọi `getLastUserId()` nào nữa để "chữa" chỗ mới — mọi đường tiêu
 * thụ đã có sẵn tự đúng khi bộ đệm được gieo. Đường nào ĐỌC MỘT LẦN lúc mount (3 đường GHI dưới
 * đây) thì dùng `danhTinhChoLuot()`, đừng tự chế cách chờ riêng.
 *
 * 🔒 KHÔNG ĐỔI HÌNH DẠNG KHOÁ. Vẫn đúng `interiorflow.lastUserId`, vẫn đúng một chuỗi id trần
 * (`lib/resume.ts`). Dữ liệu cũ đọc lại được nguyên vẹn, không cần bảng nâng cấp.
 *
 * ⛔ THÀ KHÔNG LƯU CÒN HƠN LƯU NHẦM CHỖ NGƯỜI KHÁC: chỉ ghi khi máy chủ khẳng định 200 + có
 * `user.id`. 401 (chưa đăng nhập) · 503 (hạ tầng lỗi, `SessionWatch` lo báo) · mạng đứt · hết giờ
 * · JSON hỏng ⇒ KHÔNG ghi gì, KHÔNG ném lỗi, app chạy tiếp y như cũ.
 */

import { getLastUserId, setLastUserId } from './resume';

/**
 * HẠN HỎI MÁY CHỦ. Có timeout là BẮT BUỘC: ba đường ghi `await` hàm này trước khi khôi phục
 * sheet, nên máy chủ treo mà không có hạn giờ sẽ **biến một lỗi mất-dữ-liệu thành một lỗi
 * treo-app** — đổi bệnh chứ không chữa bệnh.
 *
 * Vì sao 8 giây chứ không phải 1-2: hết giờ ⇒ rơi về nhánh không-có-user ⇒ **mất dữ liệu**, đúng
 * thứ đang chữa. Còn đợi lâu chỉ làm chậm lượt khôi phục sheet — mà đường đó vốn đã bất đồng bộ
 * (`loadSheets` + `ensureProjectScope` cũng chờ mạng). Nên cán cân cố ý lệch về phía KIÊN NHẪN:
 * đủ rộng để máy chủ chậm/khởi động nguội không bao giờ chạm, vẫn có trần để không treo vĩnh viễn.
 * ⚠️ Hạ số này xuống là ĐÁNH ĐỔI LẤY RỦI RO MẤT DỮ LIỆU, không phải "tối ưu tốc độ".
 */
export const HAN_HOI_MS = 8000;

/** Kết quả một lượt giải định danh — đủ để test phân biệt "im lặng" với "ghi bừa". */
export type KetQuaDanhTinh =
  /** Bộ đệm đã có sẵn — KHÔNG tốn request nào, xong ngay trong microtask. */
  | { trangThai: 'da-co'; userId: string }
  /** Máy chủ xác nhận, vừa gieo vào bộ đệm. */
  | { trangThai: 'gieo-moi'; userId: string }
  /** Máy chủ nói rõ: chưa đăng nhập (401). Không ghi gì. */
  | { trangThai: 'chua-dang-nhap' }
  /** Không kết luận được (503 / mạng đứt / hết giờ / thân lạ). Không ghi gì. */
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
  hoiMayChu: (signal?: AbortSignal) => Promise<DapAnMayChu>;
  /** Chuông báo hết giờ. Test bơm đồng hồ giả để khỏi chờ thật / khỏi để lại timer treo. */
  chuongHetGio: () => Promise<void>;
  /** Cắt request khi hết giờ — không để kết nối mồ côi chạy tiếp. */
  cat?: () => void;
}

/**
 * LÕI THUẦN (test được bằng sucrase-node, không cần DOM/mạng/timer thật): đọc đệm trước, thiếu
 * thì hỏi máy chủ đúng MỘT lần rồi gieo. Mọi nhánh không chắc chắn đều KHÔNG ghi.
 */
export async function giaiDanhTinh(deps: PhuThuocDanhTinh): Promise<KetQuaDanhTinh> {
  // ĐƯỜNG THƯỜNG (đi qua Home/đăng nhập): trả về NGAY, không chạm mạng, không chạm đồng hồ.
  // Đây là ràng buộc hiệu năng, không phải tối ưu vặt — ba đường ghi `await` hàm này.
  const dem = deps.docDem();
  if (dem) return { trangThai: 'da-co', userId: dem };

  type Dua =
    | { loai: 'dap'; r: DapAnMayChu }
    | { loai: 'loi' }
    | { loai: 'het-gio' };

  const dua: Dua = await Promise.race<Dua>([
    deps.hoiMayChu().then(
      (r) => ({ loai: 'dap', r }) as const,
      () => ({ loai: 'loi' }) as const,
    ),
    deps.chuongHetGio().then(() => ({ loai: 'het-gio' }) as const),
  ]);

  if (dua.loai === 'het-gio') {
    deps.cat?.();
    return { trangThai: 'khong-ket-luan', lyDo: 'het-gio' };
  }
  // Mạng đứt / máy chủ không với tới — KHÔNG kết luận là "chưa đăng nhập".
  if (dua.loai === 'loi') return { trangThai: 'khong-ket-luan', lyDo: 'mang-dut' };

  const dapAn = dua.r;
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
    const huy = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let hen: ReturnType<typeof setTimeout> | null = null;
    dangChay = giaiDanhTinh({
      docDem: getLastUserId,
      ghiDem: setLastUserId,
      hoiMayChu: () => fetch('/api/auth/me', huy ? { signal: huy.signal } : undefined),
      chuongHetGio: () =>
        new Promise<void>((res) => {
          hen = setTimeout(res, HAN_HOI_MS);
        }),
      cat: () => huy?.abort(),
    }).finally(() => {
      if (hen) clearTimeout(hen); // không để timer 8s giữ tab thức sau khi đã có câu trả lời
    });
  }
  return dangChay;
}

/**
 * DÙNG CHO ĐƯỜNG ĐỌC-MỘT-LẦN-LÚC-MOUNT (`CadSheets` · `PresentSheets` · autosave 3D).
 *
 * Vì sao ba đường đó KHÔNG tự lành khi chỉ gieo ở `AppChrome`: chúng đọc `getLastUserId()` ĐỒNG
 * BỘ trong effect mount với deps `[bucketId]`, mà `bucketId` lấy từ URL nên có sẵn ngay lượt
 * render đầu và KHÔNG BAO GIỜ đổi trên một deep-link ⇒ effect chạy đúng một lần. `AppChrome`
 * chạy trước nhưng chỉ KHỞI ĐỘNG request; `setLastUserId` xảy ra sau khi lượt flush effect đó
 * (gồm cả effect của chúng) đã chạy xong ⇒ thua cuộc chạy đua một cách TẤT ĐỊNH.
 *
 * `conSong` là cờ huỷ của chính lượt effect đó. ĐỔI DỰ ÁN GIỮA PHIÊN (`bucketId` đổi, component
 * KHÔNG remount) ⇒ effect cũ bị dọn ⇒ `conSong()` false ⇒ trả `tiepTuc:false` để lượt cũ DỪNG,
 * không ghi đè trạng thái của lượt mới. Không có cờ này thì lượt cũ chạy tiếp và nạp bản vẽ dự
 * án A xuống dưới URL dự án B.
 */
export async function danhTinhChoLuot(
  conSong: () => boolean,
): Promise<{ tiepTuc: boolean; userId: string | null }> {
  await danhTinhSanSang();
  if (!conSong()) return { tiepTuc: false, userId: null };
  return { tiepTuc: true, userId: getLastUserId() };
}

/** Chỉ dùng trong test — quên lượt đã chạy để ca sau bắt đầu sạch. */
export function quenLuotDanhTinh(): void {
  dangChay = null;
}
