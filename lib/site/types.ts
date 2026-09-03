/**
 * lib/site/types.ts — KIỂU THUẦN của "La bàn dự án" (Compass / Site Intelligence).
 *
 * Vị trí trong bản đồ: Blueprint §B (bảng Domain) ghi "Location / Site — [GAP] ProjectProfile 0
 * trường vị trí (chốt 15/08)". Slice này lấp GAP đó ở TẦNG lib thuần, KHÔNG đụng Prisma (schema là
 * cửa của Hoà) — dữ liệu sống local-first (xem `./store.ts`), cờ `dongBo: 'local-only'` nói thẳng.
 *
 * Nguyên tắc (docs/SPEC-HIEU-BOI-CANH-2026-08-15.md §2 "VỊ TRÍ CÔNG TRÌNH quyết định cả bộ" + trục
 * thứ ba "BIẾN SỐ NGỮ CẢNH — máy gợi ý, người thêm"):
 *   1. Bắt đầu từ một GHIM TƯỜNG MINH (người dùng đặt / khảo sát đo) — không có ghim thì KHÔNG suy gì.
 *   2. Mọi điều suy ra đều là `SiteFact` mang `trangThai` 3 nấc (đúng tên đã có ở `lib/distill/types`)
 *      + nguồn + độ tin cậy. Máy KHÔNG BAO GIỜ tự gán `verified` — chỉ người bấm xác nhận mới thành.
 *   3. Thiên văn (mặt trời) là phép tính tất định từ ghim ⇒ tin cậy cao nhưng vẫn là `inferred`
 *      (nó là hệ quả của toạ độ, không phải điều đo tại chỗ). Khí hậu/gió/vật liệu địa phương chỉ
 *      đến từ: bằng chứng khảo sát (measured) · gói vùng có nguồn (inferred) · người xác nhận
 *      (verified). Không có nguồn nào ⇒ KHUYẾT, ghi rõ "cần khảo sát", KHÔNG bịa.
 *   4. Đây là CẦU sang ArchiNote/khảo sát hiện trường (`./survey-bridge.ts`), không phải một hệ dự án
 *      thứ hai: chỉ có projectId + ghim + bằng chứng, không lặp lại ProjectProfile.
 *
 * THUẦN: không import React/DOM/Prisma. Import tương đối để test `sucrase-node` chạy thẳng.
 */
import type { TrangThaiNguon } from '../distill/types';

export type { TrangThaiNguon };

/** Nguồn của một sự kiện/giá trị trong la bàn — cố ý là union đóng để UI có nhãn cho từng loại. */
export type LoaiNguonSite =
  | 'ghim-tay' // người dùng đặt ghim/nhập tay
  | 'khao-sat' // bằng chứng khảo sát hiện trường (ảnh, số đo, ghi chú)
  | 'thien-van' // tính tất định từ toạ độ + ngày (mặt trời)
  | 'suy-vi-do' // suy từ vĩ độ thuần (dải khí hậu) — tin cậy thấp
  | 'goi-vung' // gói dữ liệu vùng do studio nạp, có nguồn dẫn
  | 'nguoi-xac-nhan'; // KTS bấm xác nhận / sửa tay

export interface NguonSite {
  loai: LoaiNguonSite;
  /** id truy ngược được: evidenceId · packId · tên thuật toán. Không rỗng. */
  ref: string;
  ghiChu?: string;
  /** Nguồn ngoài (gói vùng) có kiểm chứng được không — bắt buộc khai, không mặc định true. */
  kiemChungDuoc?: boolean;
}

/** Một sự thật về địa điểm, LUÔN mang nguồn + nấc tin cậy. */
export interface SiteFact<T> {
  value: T;
  trangThai: TrangThaiNguon;
  nguon: NguonSite;
  /** 0..1 — máy tự chấm theo loại nguồn; người xác nhận ⇒ 1. */
  doTinCay: number;
  /** ISO thời điểm tính/ghi — để tính cũ (`./stale.ts`). */
  tai: string;
}

/** Nguồn của ghim: tay · khảo sát (GPS máy đo) · địa chỉ (geocode — CHƯA có adapter, chỉ khai kiểu). */
export type NguonGhim = 'ghim-tay' | 'khao-sat' | 'dia-chi';

export interface SitePin {
  lat: number; // -90..90
  lng: number; // -180..180
  /** mét, tuỳ chọn — có thì mang từ khảo sát/bản đồ, không suy. */
  caoDoM?: number;
  /** Lệch múi giờ (phút, so UTC). Không có ⇒ máy ước từ kinh độ, gắn cờ `muiGioUocTinh`. */
  muiGioPhut?: number;
  nhan?: string;
  nguon: NguonGhim;
  tai: string;
}

/** Bằng chứng khảo sát — mỗi mảnh là MỘT quan sát có id, có giờ; không gộp thành "kết luận". */
export type SurveyEvidence =
  | { id: string; kind: 'anh'; ref: string; huongDo?: number; ghiChu?: string; tai: string }
  | {
      id: string;
      kind: 'so-do';
      loai: 'gio-toc-do' | 'gio-huong' | 'nhiet-do' | 'do-am' | 'tieng-on' | 'muc-ngap';
      giaTri: number;
      donVi: string;
      ghiChu?: string;
      tai: string;
    }
  | { id: string; kind: 'ghi-chu'; text: string; tai: string }
  | {
      id: string;
      kind: 'ngu-canh';
      loai: MaBienSoNguCanh;
      text: string;
      tai: string;
    };

/** Biến số ngữ cảnh (spec §2 trục thứ ba) — bảng đóng theo spec, mở thêm khi có nơi tiêu thụ. */
export type MaBienSoNguCanh =
  | 'ven-bien'
  | 'vung-ngap'
  | 'co-mua-dong'
  | 'nong-am'
  | 'huong-tay-nang'
  | 'tap-quan'
  | 'vat-lieu-tai-cho';

/** Một biến số ngữ cảnh đã được ĐỀ XUẤT (máy) hoặc ĐÃ NHẬN (người). */
export interface BienSoNguCanh {
  ma: MaBienSoNguCanh;
  /** inferred = máy gợi ý chờ nhận · measured = từ bằng chứng đo · verified = người đã nhận. */
  trangThai: TrangThaiNguon;
  nguon: NguonSite;
  lyDo: string;
  tai: string;
}

export type DaiKhiHau = 'nhiet-doi' | 'can-nhiet-doi' | 'on-doi' | 'han-doi';

export interface GioChuDao {
  /** hướng gió tới (độ, 0 = Bắc, 90 = Đông). */
  huongDo: number;
  /** m/s, tuỳ chọn. */
  tocDoMs?: number;
  /** mùa/tháng áp dụng, tự do: "mùa hè (5-9)". */
  mua?: string;
}

/** Câu chuyện bối cảnh/vật liệu địa phương — mỗi câu có nguồn, không có nguồn thì không tồn tại. */
export interface SiteStory {
  id: string;
  chuDe: 'vat-lieu' | 'khi-hau' | 'tap-quan' | 'boi-canh';
  text: string;
  fact: SiteFact<string>;
}

export interface SolarSummary {
  ngay: string; // YYYY-MM-DD (giờ địa phương theo ghim)
  binhMinh: string | null; // HH:MM giờ địa phương, null = mặt trời không mọc/lặn (vùng cực)
  hoangHon: string | null;
  giuaTrua: string; // solar noon HH:MM
  doDaiNgayPhut: number | null;
  doCaoGiuaTruaDo: number;
  phuongViBinhMinhDo: number | null;
  phuongViHoangHonDo: number | null;
  /** Phương vị lúc giữa trưa: ~180 (Nam) ở vĩ độ > xích vĩ, ~0 (Bắc) khi mặt trời qua thiên đỉnh về phía bắc — vùng nhiệt đới hai mùa hai phía. */
  phuongViGiuaTruaDo: number;
  /** Mùa hè/đông (theo bán cầu) — độ cao giữa trưa hai điểm chí, để vẽ đường mặt trời. */
  chiHe: { doCaoGiuaTruaDo: number; doDaiNgayPhut: number | null };
  chiDong: { doCaoGiuaTruaDo: number; doDaiNgayPhut: number | null };
  muiGioPhut: number;
  muiGioUocTinh: boolean;
}

/** Gói vùng — studio tự nạp (app trung tính, cùng cơ chế color-system-packs / neufert-tach-goi).
 * KHÔNG ship gói nào trong repo; test dùng fixture. Mọi trường có giá trị đều PHẢI có `nguon`. */
export interface SitePack {
  id: string;
  ten: string;
  /** hộp bao [latMin, latMax, lngMin, lngMax] — ghim rơi trong hộp thì gói áp. */
  hopBao: [number, number, number, number];
  nguon: { ten: string; url?: string; kiemChungDuoc: boolean; namBanHanh?: number };
  khiHau?: { dai: DaiKhiHau; moTa: string };
  gioChuDao?: GioChuDao[];
  bienSoGoiY?: { ma: MaBienSoNguCanh; lyDo: string }[];
  cauChuyen?: { chuDe: SiteStory['chuDe']; text: string }[];
}

export interface SiteDerived {
  matTroi: SiteFact<SolarSummary> | null;
  daiKhiHau: SiteFact<DaiKhiHau> | null;
  gio: SiteFact<GioChuDao[]> | null;
  cauChuyen: SiteStory[];
  /** Biến số máy đề xuất — CHỜ người nhận (`trangThai: 'inferred'`). */
  goiY: BienSoNguCanh[];
  /** Danh sách KHUYẾT — cái gì chưa có nguồn nào. Đây là đầu vào cho cầu khảo sát. */
  khuyet: KhuyetSite[];
  /** Ghim + số bằng chứng lúc suy — để phát hiện cũ khi ghim đổi/bằng chứng mới. */
  tinhTu: { pinKey: string; soBangChung: number; tai: string };
}

export type KhuyetSite = 'ghim' | 'khi-hau' | 'gio' | 'vat-lieu-tai-cho' | 'tap-quan' | 'mui-gio';

export interface SiteContext {
  v: 1;
  projectId: string;
  pin: SitePin | null;
  khaoSat: SurveyEvidence[];
  /** Biến số người ĐÃ nhận (verified) hoặc từ bằng chứng (measured). Gợi ý máy KHÔNG nằm đây. */
  bienSo: BienSoNguCanh[];
  suyDien: SiteDerived | null;
  /** Local-first: bản này chỉ nằm trên máy, chưa có kênh đồng bộ (schema chưa mở). */
  dongBo: 'local-only';
  capNhat: string;
}

export interface SiteStale {
  cu: boolean;
  lyDo: ('chua-suy' | 'ghim-doi' | 'bang-chung-moi' | 'qua-han' | 'ngoai-tuyen')[];
}

/** Độ tin cậy mặc định theo loại nguồn — MỘT bảng, mọi nơi đọc chung. */
export const DO_TIN_CAY_MAC_DINH: Record<LoaiNguonSite, number> = {
  'nguoi-xac-nhan': 1,
  'khao-sat': 0.9,
  'thien-van': 0.95,
  'goi-vung': 0.6,
  'ghim-tay': 0.8,
  'suy-vi-do': 0.35,
};

/** Nhãn song ngữ cho nấc tin cậy — dùng chung UI, không mỗi chỗ tự dịch. */
export const NHAN_TRANG_THAI: Record<TrangThaiNguon, { vi: string; en: string }> = {
  measured: { vi: 'Đo được', en: 'Measured' },
  inferred: { vi: 'Máy suy', en: 'Inferred' },
  verified: { vi: 'Đã xác nhận', en: 'Verified' },
};

export const NHAN_BIEN_SO: Record<MaBienSoNguCanh, { vi: string; en: string }> = {
  'ven-bien': { vi: 'Ven biển', en: 'Coastal' },
  'vung-ngap': { vi: 'Vùng ngập', en: 'Flood-prone' },
  'co-mua-dong': { vi: 'Có mùa đông', en: 'Has winter' },
  'nong-am': { vi: 'Nóng ẩm', en: 'Hot & humid' },
  'huong-tay-nang': { vi: 'Hướng Tây nắng gắt', en: 'Harsh west sun' },
  'tap-quan': { vi: 'Tập quán địa phương', en: 'Local custom' },
  'vat-lieu-tai-cho': { vi: 'Vật liệu tại chỗ', en: 'Local materials' },
};
