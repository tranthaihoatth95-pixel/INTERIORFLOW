/**
 * lib/voice/chuan-hoa.ts — chuẩn hoá chữ tiếng Việt để so khớp, và tách con số.
 *
 * VÌ SAO PHẢI BỎ DẤU: bộ nhận dạng trả về dấu không ổn định ("tường" ↔ "tương"), và nhãn lệnh
 * trong sổ có dấu đầy đủ. So khớp trên bản BỎ DẤU + thường hoá là cách rẻ nhất để một câu nói
 * lệch dấu vẫn tìm đúng lệnh — mà KHÔNG cần bảng ánh xạ riêng nào.
 *
 * ⛔ CHỈ dùng để SO KHỚP. Nguyên văn có dấu luôn được giữ nguyên trong `BanChu.van` và trong
 *    nội dung ghi chú — bỏ dấu rồi lưu là làm hỏng dữ liệu người dùng (luật chữ Việt 7.1.23:
 *    dấu chồng mang nghĩa).
 *
 * File THUẦN, import tương đối.
 */

/**
 * Bỏ dấu tiếng Việt. Dùng NFD tách dấu rồi xoá dải combining marks; `đ`/`Đ` KHÔNG phải dấu phụ
 * (nó là chữ cái riêng) nên phải thay tay — đây là cái bẫy kinh điển của mọi hàm bỏ dấu ẩu.
 */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Chuẩn hoá để so khớp: bỏ dấu · thường hoá · bỏ dấu câu · gộp khoảng trắng.
 * Giữ lại CHỮ SỐ (cần cho "tường 200") và dấu chấm thập phân trong số.
 */
export function chuanHoa(s: string): string {
  return boDau(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}. ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Những chữ mở đầu KHÔNG mang nghĩa lệnh — người nói hay đệm vào ("vẽ tường", "chạy lệnh xoá").
 * Cố ý NGẮN và chỉ gồm động từ đệm: mỗi chữ thêm vào đây là một cơ hội nuốt mất nghĩa thật.
 * ⚠️ "mở" KHÔNG có trong danh sách: "mở" trong IF là điều hướng ("mở vật liệu"), không phải
 * tiếng đệm — nuốt nó đi sẽ khiến câu điều hướng giả vờ khớp một lệnh vẽ.
 */
const TIENG_DEM = ['lenh', 've', 'tao', 'chay', 'lam', 'dung', 'them', 'bat dau'];

/** Gỡ tiếng đệm ở đầu câu (lặp cho tới khi không gỡ được nữa). Trả về câu ĐÃ chuẩn hoá. */
export function goTiengDem(daChuanHoa: string): string {
  let s = daChuanHoa;
  let doi = true;
  while (doi) {
    doi = false;
    for (const d of TIENG_DEM) {
      if (s === d) return s; // câu chỉ có mỗi tiếng đệm — giữ nguyên, để nơi gọi báo không hiểu
      if (s.startsWith(d + ' ')) {
        s = s.slice(d.length + 1);
        doi = true;
        break;
      }
    }
  }
  return s;
}

export interface TachSo {
  /** Phần chữ còn lại sau khi bóc các con số ở CUỐI câu. */
  readonly chu: string;
  /** Các con số bóc được, theo đúng thứ tự xuất hiện. */
  readonly so: string[];
}

/**
 * Bóc con số ở CUỐI câu — khuôn AutoCAD "O 150", "W 200", và cũng đúng khuôn nói tự nhiên
 * ("tường dày 120"). CHỈ bóc ở cuối: số nằm giữa câu thường là một phần của tên ("cung tròn 3
 * điểm", "đường tròn 3 điểm"), bóc bừa là mất nghĩa.
 */
export function tachSoCuoi(daChuanHoa: string): TachSo {
  const tu = daChuanHoa.split(' ').filter(Boolean);
  const so: string[] = [];
  while (tu.length > 0 && /^\d+(\.\d+)?$/.test(tu[tu.length - 1])) {
    so.unshift(tu.pop() as string);
  }
  return { chu: tu.join(' '), so };
}

/**
 * Số ĐẦU TIÊN trong câu (bất kể vị trí) — dùng cho ý định thiết kế ("tường này dày 120").
 * `null` khi không có số nào: thiếu số thì KHÔNG được đoán, phải báo `thieu-so`.
 */
export function soDauTien(daChuanHoa: string): number | null {
  const m = daChuanHoa.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}
