/**
 * lib/ho-so-song/types.ts — GÓI HỒ SƠ SỐNG (HoSoSong, P4 chuỗi nền DocCore).
 *
 * Một file `.zip` tự chứa toàn bộ hồ sơ dự án với 3 TẦNG THOÁI LUI [T1 — gói là ĐÍCH mới
 * của cùng nguồn, không phải nguồn thứ hai]:
 *   ① `index.html`  — viewer tự chứa, mở bằng mọi trình duyệt (loai `viewer`)
 *   ② `out/`        — file chuẩn ngành PDF/PNG/XLSX, mở bằng app phổ thông (loai `nganh`)
 *   ③ `data/` + `manifest.json` — JSON máy-đọc để NHẬP LẠI [T5] (loai `ruot`)
 * Bất kỳ tầng nào chết (browser đổi đời, app chết), tầng dưới vẫn sống.
 *
 * File này THUẦN KIỂU — không side effect, không import gì ngoài chính nó.
 * MARKER: HoSoSong.
 */

/** Ba tầng thoái lui của một kênh trong gói. */
export type HoSoSongLoaiKenh = 'viewer' | 'nganh' | 'ruot';

/** Một kênh (một file) trong gói — path tương đối tính từ gốc zip. */
export interface HoSoSongKenh {
  id: string;
  loai: HoSoSongLoaiKenh;
  path: string;
  mime: string;
  /** SHA-256 hex của đúng byte nội dung file — kiểm toàn vẹn không cần app. */
  sha256: string;
}

export interface HoSoSongProvenance {
  nguon: 'interiorflow';
  /** Số sheet/deck trong ruột JSON (0 nếu không gói deck). */
  soBan: number;
  /** Ai xuất — tên/id người dùng, optional (không bịa khi không biết). */
  nguoiXuat?: string;
}

export interface HoSoSongManifest {
  version: 1;
  projectId: string;
  tenDuAn: string;
  /** ISO 8601 — NHẬN TỪ CALLER (lib thuần không tự Date.now, để test tất định). */
  taoLuc: string;
  kenh: HoSoSongKenh[];
  provenance: HoSoSongProvenance;
}

/** Dữ liệu nhị phân chấp nhận từ caller — Blob (browser) hoặc bytes (node/test). */
export type HoSoSongBinary = Blob | ArrayBuffer | Uint8Array;

export interface HoSoSongImage {
  /** Tên file (không path) — sẽ nằm ở `out/images/<name>`. */
  name: string;
  data: HoSoSongBinary;
  /** Mặc định suy từ đuôi tên file (png/jpg), không đoán bừa loại khác. */
  mime?: string;
}

/** Một dòng tóm tắt BOQ cho viewer (bảng đọc-được, KHÔNG thay file xlsx tầng ②). */
export interface HoSoSongBoqDong {
  ten: string;
  qty: number;
  unit: string;
  thanhTien: number;
}

export interface HoSoSongBoqTomTat {
  rows: HoSoSongBoqDong[];
  tong: number;
}

/**
 * Đầu vào đóng gói — TOÀN BỘ artifact đã được SINH SẴN bởi các đường xuất hiện có
 * (một cỗ máy nhiều mặt tiền [T2]); pack KHÔNG tự render gì. Artifact nào thiếu thì
 * kênh đó KHÔNG có trong manifest (không chặn, không giả [T0]).
 */
export interface HoSoSongInput {
  projectId: string;
  tenDuAn: string;
  /** ISO 8601 — thời điểm xuất, caller cấp. */
  taoLuc: string;
  nguoiXuat?: string;
  /** Ruột máy-đọc (vd object `.idfp` đầy đủ) → `data/deck.json`. */
  deckJson?: unknown;
  /** File BOQ chuẩn ngành đã dựng sẵn → `out/boq.xlsx`. */
  boqXlsx?: HoSoSongBinary;
  /** Bảng tóm tắt BOQ cho viewer đọc — đi KÈM boqXlsx, không thay nó. */
  boqTomTat?: HoSoSongBoqTomTat;
  /** PDF hồ sơ đã dựng sẵn → `out/ho-so.pdf`. */
  pdf?: HoSoSongBinary;
  /** Ảnh trang deck/render đã có sẵn → `out/images/<name>`. */
  images?: HoSoSongImage[];
}
