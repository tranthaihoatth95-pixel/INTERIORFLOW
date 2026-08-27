/**
 * lib/ui/trang-thai-tai.ts — TỪ VỰNG CHUNG cho trạng thái tải dữ liệu (P0-2, 27/08).
 *
 * ── VÌ SAO CÓ TỆP NÀY ──────────────────────────────────────────────────────────────────────────
 * Lane `IF-UXUI-RUNTIME-001` đo trên app thật và chứng minh trục trạng thái **đã sập**:
 *   · `/projects` khi 401 in *"Máy vẫn có mạng nhưng dịch vụ dự án không trả lời"*. Tắt HẲN
 *     server rồi bấm Thử lại ⇒ **chữ y hệt, pixel y hệt**. Nguyên nhân ở mã: `loadProjectCards`
 *     ném `new Error('Không tải được…')` và **vứt mã trạng thái**, rồi `.catch(() =>
 *     setLoadError(true))` gộp mọi thất bại vào **một boolean**.
 *   · `/materials` và `/tasks` in thẳng **`HTTP 401`** ra mặt người dùng, cạnh câu "chưa có gì" —
 *     tức 401 và "kho rỗng" hiện **cùng một màn**.
 *
 * Năm trạng thái này **khác nhau về việc người dùng phải làm tiếp**, nên gộp chúng là lấy mất
 * đường đi tiếp:
 *   · `rong`        → "chưa có gì" ⇒ hãy TẠO cái đầu tiên.
 *   · `khong-quyen` → phiên hết hạn / không đủ quyền ⇒ hãy ĐĂNG NHẬP LẠI. Dữ liệu vẫn còn.
 *   · `ngoai-tuyen` → máy mất mạng ⇒ hãy nối mạng. **Không phải lỗi của app.**
 *   · `may-chu-loi` → app có mạng nhưng dịch vụ hỏng ⇒ hãy THỬ LẠI. Tệp trên máy không bị đụng.
 *   · `khong-doc-duoc` → trả lời về nhưng không hiểu được ⇒ nhiều khả năng bản app lệch bản máy chủ.
 *
 * ⛔ **CẤM in mã kỹ thuật ra mặt người dùng.** `HTTP 401` không nói cho người dùng biết phải làm
 * gì; nó chỉ nói cho lập trình viên. Mã đi vào chi tiết kỹ thuật (`ma`), câu chữ đi vào `nhan()`.
 *
 * Module THUẦN — không React, không DOM, không fetch. Test bằng `sucrase-node`.
 * Import TƯƠNG ĐỐI ở nơi test, alias `@/` ở component (đúng quy ước hai bên).
 */

export type LyDoHong = 'khong-quyen' | 'ngoai-tuyen' | 'may-chu-loi' | 'khong-doc-duoc';

export type TrangThaiTai<T> =
  | { k: 'dang-tai' }
  | { k: 'co-du-lieu'; data: T }
  | { k: 'rong' }
  | { k: 'hong'; lyDo: LyDoHong; ma?: number };

/** Thứ tối thiểu của `Response` mà hàm phân loại cần — để test được mà không cần `fetch` thật. */
export interface PhanHoiToiThieu {
  ok: boolean;
  status: number;
}

/**
 * Phân loại một lượt tải thất bại.
 *
 * `trucTuyen` là trạng thái mạng do app tự biết (`useTrangThaiMang`). Nó **đứng trước** mọi thứ
 * khác: mất mạng thì không có phản hồi nào để phân loại, và đổ cho máy chủ là đổ oan.
 *
 * `res === null` = `fetch` NÉM (mất mạng giữa chừng, DNS hỏng, server chết hẳn). Khi đó còn
 * `trucTuyen` để phân biệt: có mạng mà fetch ném ⇒ máy chủ; không mạng ⇒ ngoại tuyến.
 */
export function phanLoaiHong(res: PhanHoiToiThieu | null, trucTuyen: boolean): { lyDo: LyDoHong; ma?: number } {
  if (!trucTuyen) return { lyDo: 'ngoai-tuyen' };
  if (!res) return { lyDo: 'may-chu-loi' };
  // 401 (chưa/hết phiên) và 403 (có phiên, không đủ quyền) khác nhau về NGUYÊN NHÂN nhưng giống
  // nhau về VIỆC PHẢI LÀM: đăng nhập lại / xin quyền. Gộp ở tầng UI là đúng; giữ `ma` để chi tiết
  // kỹ thuật vẫn tra được.
  if (res.status === 401 || res.status === 403) return { lyDo: 'khong-quyen', ma: res.status };
  return { lyDo: 'may-chu-loi', ma: res.status };
}

/** Thân phản hồi về được nhưng không parse/không đúng hình dạng. */
export const HONG_KHONG_DOC_DUOC: { lyDo: LyDoHong } = { lyDo: 'khong-doc-duoc' };

export interface NhanTrangThai {
  tieuDe: string;
  moTa: string;
  /** Nhãn nút hành động. `null` = trạng thái này KHÔNG có hành động thử lại (vd: mất mạng). */
  hanhDong: string | null;
}

/**
 * Câu chữ cho người dùng — song ngữ, **không mã kỹ thuật**, và mỗi trạng thái nói một VIỆC KHÁC
 * NHAU phải làm. Nếu hai trạng thái ra cùng một câu thì việc tách chúng ở tầng kiểu là vô nghĩa —
 * đó đúng là bệnh đang chữa.
 *
 * `doiTuong` để câu chữ nói đúng thứ đang thiếu ("dự án" / "vật liệu" / "việc").
 */
export function nhan(lyDo: LyDoHong, doiTuong: { vi: string; en: string }, en: boolean): NhanTrangThai {
  switch (lyDo) {
    case 'khong-quyen':
      return en
        ? {
            tieuDe: 'Sign-in required',
            moTa: `Your session expired or does not have access to these ${doiTuong.en}. Your data is untouched — sign in again to see it.`,
            hanhDong: 'Sign in again',
          }
        : {
            tieuDe: 'Cần đăng nhập lại',
            moTa: `Phiên đã hết hạn hoặc không có quyền xem ${doiTuong.vi} này. Dữ liệu vẫn còn nguyên — đăng nhập lại là thấy.`,
            hanhDong: 'Đăng nhập lại',
          };
    case 'ngoai-tuyen':
      return en
        ? {
            tieuDe: 'No network',
            moTa: `This machine is offline, so ${doiTuong.en} could not be loaded. Nothing is wrong with the app or your files.`,
            hanhDong: null, // không có gì để "thử lại" — nối mạng rồi nó tự về
          }
        : {
            tieuDe: 'Máy đang mất mạng',
            moTa: `Máy không có mạng nên chưa tải được ${doiTuong.vi}. App và tệp trên máy đều không sao.`,
            hanhDong: null,
          };
    case 'may-chu-loi':
      return en
        ? {
            tieuDe: `Could not load ${doiTuong.en}`,
            moTa: 'The app is online but the service did not answer. Your files on this machine are untouched.',
            hanhDong: 'Try again',
          }
        : {
            tieuDe: `Không tải được ${doiTuong.vi}`,
            moTa: 'Máy vẫn có mạng nhưng dịch vụ không trả lời. Tệp trên máy bạn không bị đụng tới.',
            hanhDong: 'Thử lại',
          };
    case 'khong-doc-duoc':
      return en
        ? {
            tieuDe: 'Unreadable answer',
            moTa: 'The service answered, but the app could not read it. This app version may be out of step with the server.',
            hanhDong: 'Try again',
          }
        : {
            tieuDe: 'Không đọc được câu trả lời',
            moTa: 'Dịch vụ có trả lời nhưng app không hiểu được. Nhiều khả năng bản app đang lệch với máy chủ.',
            hanhDong: 'Thử lại',
          };
  }
}
