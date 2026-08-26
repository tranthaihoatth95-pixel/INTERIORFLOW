/**
 * lib/home/trang-thai.ts — [marker: bonTrangThai] BỐN TRẠNG THÁI của một ô Home, tính THUẦN.
 *
 * VÌ SAO CÓ FILE NÀY (LANE A 20/08): đo trên app thật 1280×720 thì Home có ĐÚNG MỘT trạng thái
 * được thiết kế — "có dữ liệu". Ba trạng thái còn lại rơi vào hai cái bẫy đã ghi trong phiếu:
 *   · ĐANG TẢI  → `ProjectSelect.loadingBlock` là một pill 44px lơ lửng giữa ô cao 400px
 *                 ("vòng xoay trong hộp trắng khổng lồ" — đúng chữ trong phiếu).
 *   · NGOẠI TUYẾN → KHÔNG TỒN TẠI. `grep navigator.onLine components/home lib/home` = 0.
 *                 Rớt mạng thì mọi fetch `.catch(() => {})` nuốt im lặng ⇒ màn đọc ra y hệt
 *                 "studio này chưa có gì", tức NÓI SAI với người dùng.
 *
 * ⛔ RANH GIỚI: file này KHÔNG fetch, KHÔNG đọc `navigator`, KHÔNG đụng React. Nó chỉ nhận bốn
 * dữ kiện rồi trả về MỘT trạng thái — nhờ vậy test được toàn bộ 16 tổ hợp mà không cần trình
 * duyệt. Nơi đọc `navigator.onLine` là `useTrangThaiMang()` bên dưới (hook mỏng, một chỗ duy
 * nhất) — không rải `navigator.onLine` khắp widget.
 */

import { useEffect, useState } from 'react';

/** Bốn trạng thái phải KHÁC NHAU trên màn + trạng thái thứ năm là "có dữ liệu". */
export type TrangThaiO = 'dangTai' | 'song' | 'trong' | 'loi' | 'ngoaiTuyen';

export interface DuKienO {
  /** Lượt tải đầu chưa trả lời (dữ liệu vẫn là `null`, KHÔNG phải mảng rỗng). */
  dangTai: boolean;
  /** Lượt tải đã trả lời nhưng hỏng (HTTP lỗi, JSON hỏng, ngoại lệ). */
  loi: boolean;
  /** Đã có câu trả lời hợp lệ và nó RỖNG — đây là sự thật, không phải thiếu giao diện. */
  rong: boolean;
  /** Trình duyệt báo có mạng hay không (`navigator.onLine`). */
  trucTuyen: boolean;
}

/**
 * THỨ TỰ ƯU TIÊN — cố ý, và đây là phần dễ làm sai nhất:
 *
 * ① `dangTai` thắng tất cả. Đang tải mà báo "mất mạng" là đoán mò: chưa có câu trả lời thì
 *    chưa biết gì cả.
 * ② `ngoaiTuyen` thắng `loi`. Cùng một lượt fetch hỏng, nhưng NGUYÊN NHÂN khác nhau nên
 *    ĐƯỜNG HỒI PHỤC khác nhau: mất mạng thì bấm "Thử lại" mười lần cũng vô ích — thứ người
 *    dùng cần biết là *việc cục bộ nào vẫn làm được*. Gộp hai cái này vào một màn "Lỗi" là
 *    đưa người dùng vào vòng bấm-lại vô nghĩa.
 * ③ `loi` thắng `rong`. Không tải được ≠ không có gì. Đây đúng là chỗ Home hôm nay nói sai:
 *    fetch hỏng → dữ liệu ở nguyên `null`/rỗng → màn hiện "trống" như thể studio chưa có dự
 *    án nào. Nói studio trắng tay trong khi thật ra chỉ là rớt mạng là lỗi NẶNG hơn lỗi bố cục.
 * ④ `rong` là một trạng thái ĐƯỢC THIẾT KẾ, không phải phần còn thiếu.
 */
export function tinhTrangThai(d: DuKienO): TrangThaiO {
  if (d.dangTai) return 'dangTai';
  if (!d.trucTuyen) return 'ngoaiTuyen';
  if (d.loi) return 'loi';
  if (d.rong) return 'trong';
  return 'song';
}

/** Trạng thái nào cần một khối thay-cho-nội-dung (thay vì render dữ liệu thật). */
export function canKhoiThayThe(t: TrangThaiO): boolean {
  return t !== 'song';
}

/**
 * Hook mỏng đọc `navigator.onLine` — MỘT chỗ duy nhất trong Home chạm vào nó.
 *
 * ⚠️ Mặc định `true` khi SSR **và ở khung hình đầu sau khi mount**: `navigator.onLine` không
 * đọc được lúc dựng HTML trên máy chủ, mà đoán "mất mạng" rồi khung sau lật lại thành "có
 * mạng" là một cú nháy sai — thà im lặng cho tới khi biết chắc.
 *
 * ⚠️ `navigator.onLine === true` chỉ nghĩa là *có card mạng*, KHÔNG bảo đảm ra được Internet
 * (Wi-Fi cổng chặn vẫn báo online). Vì thế nó dùng để PHÂN BIỆT NGUYÊN NHÂN khi fetch đã hỏng,
 * không dùng để chặn fetch. `false` thì gần như chắc chắn là mất mạng — chiều đó đáng tin.
 */
export function useTrangThaiMang(): boolean {
  const [trucTuyen, setTrucTuyen] = useState(true);
  useEffect(() => {
    const doc = () => setTrucTuyen(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
    doc();
    window.addEventListener('online', doc);
    window.addEventListener('offline', doc);
    return () => {
      window.removeEventListener('online', doc);
      window.removeEventListener('offline', doc);
    };
  }, []);
  return trucTuyen;
}
