/**
 * lib/site/types.ts — NGỮ CẢNH DỰ ÁN (Project Site Intelligence) · TẦNG MIỀN.
 *
 * ⭐ MỘT SỰ THẬT DUY NHẤT. Site Profile thuộc **PROJECT**, không thuộc 2D/3D/Present/Vật liệu/AI.
 * Cấm đẻ `SiteState` riêng cho từng môi trường — mọi nơi ĐỌC từ đây.
 *
 * 🔴 VÌ SAO FILE NÀY RA ĐỜI — có ca hỏng THẬT đang sống trong repo, không phải lo xa:
 *   `components/render-studio/scene3d-ui.ts:61-62` tự thú: *"VỊ TRÍ CÔNG TRÌNH VÀ HƯỚNG BẮC CHƯA
 *   CÓ CHỖ LƯU TRONG `Doc` … nên chúng sống ở đây, MẤT KHI ĐÓNG APP"*, và `LightTab.tsx:350` nói
 *   với người dùng *"Not stored in the project file yet — re-enter each session"*.
 *   ⇒ Hôm nay 3D đang giữ vĩ độ/kinh độ/hướng Bắc trong **state giao diện của riêng nó**. Đó đúng
 *   là "3DLocation" mà luật cấm. File này là chỗ đứng đúng; 3D sẽ ĐỌC, thôi SỞ HỮU.
 *
 * [Đ2] NHÌN VÀO TRONG TRƯỚC — những thứ KHÔNG dựng lại vì đã có:
 *   · Hình học mặt trời tất định → `lib/three/lighting.ts#sunFromDateTime` (thuật toán NOAA, đã
 *     có test đối chiếu bảng). **KHÔNG hỏi LLM tính góc nắng** (§41) và không viết bản thứ hai.
 *   · Từ vựng độ tin cậy → `lib/idfc-import/from-photo.ts#ProvenanceFlag`
 *     (`measured|inferred|verified`, ~509 chỗ dùng). §16 đề nghị 5 nấc riêng; ta **KHÔNG đẻ bộ
 *     thứ tư** (đúng luật cấm ở `lib/capabilities/image-to-3d.ts:61`) mà ÁNH XẠ vào bộ sẵn có:
 *       VERIFIED            → `verified`  (đã đối chiếu nguồn kiểm chứng được)
 *       USER SUPPLIED       → `measured`  (người khai thẳng — quan sát trực tiếp)
 *       STRONG / INDICATIVE / NEEDS VERIFICATION → `inferred` + `ghiChu` nói rõ còn thiếu gì
 *   · Vùng chuẩn ngành → `lib/cad/standards/registry.ts#StandardRegion` (VN/US/EU/INTL).
 *   · Khoá hệ ngoài trung tính → `ExternalRef.system` (chuỗi tự do, không enum).
 *
 * ══════════ HOÀ NHÁNH 05/09 — TỆP NÀY MANG **HAI** BỘ KIỂU, CỐ Ý ══════════
 * Hai nhánh cùng dựng "địa điểm" nhưng cho hai hình dạng dữ liệu khác nhau, và CẢ HAI đang
 * có người gọi thật (`HoSoDiaDiem` → API `app/api/projects/[id]/site/*` + `LightTab`;
 * `SiteContext` → `components/site/useSiteContext.ts` + `SiteCompassPanel`). Không bộ nào
 * thay được bộ kia, nên giữ cả hai — 0 tên trùng nhau nên chúng đứng chung được. Phần dưới
 * (§ La bàn dự án) giữ nguyên lời của nhánh integration:
 *
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

import type { ProvenanceFlag } from '@/lib/idfc-import/from-photo';
import type { TrangThaiNguon } from '../distill/types';

export type { ProvenanceFlag };
export type { TrangThaiNguon };

/* ═══════════════ NGUỒN GỐC (§15) ═══════════════ */

/**
 * Mọi SỰ THẬT đến từ bên ngoài phải truy được về nguồn. Thiếu nguồn thì nó KHÔNG được đứng ở
 * hạng `verified` — đó là ràng buộc, không phải lời khuyên (xem `nguonHopLe`).
 */
export interface NguonGoc {
  tieuDe: string;
  /** Nhà xuất bản/cơ quan — trống khi là người dùng tự khai. */
  nhaXuatBan?: string;
  url?: string;
  /** ISO. Lúc LẤY về, không phải lúc nguồn được viết ra. */
  layLuc: string;
  loai: 'nguoi-dung' | 'nha-cung-cap' | 'tai-lieu' | 'do-dac' | 'tinh-toan';
  /** Phạm vi địa lý của bằng chứng (§14) — cấm gọi cả ba là "gần dự án". */
  pham_vi: PhamViDiaLy;
}

/** §14 — bằng chứng phải biết mình ở thang địa lý nào. */
export type PhamViDiaLy = 'cong-truong' | 'lan-can' | 'thanh-pho' | 'vung' | 'vung-khi-hau';

/** Một sự thật có nguồn gốc. `T` là kiểu giá trị thật (số, chuỗi, đối tượng). */
export interface SuThat<T> {
  giaTri: T;
  co: ProvenanceFlag;
  nguon?: NguonGoc;
  /** Bắt buộc có nội dung khi `co === 'inferred'` — nói rõ còn thiếu gì để lên `verified`. */
  ghiChu?: string;
}

/** Một sự thật `verified` mà KHÔNG có nguồn là mâu thuẫn tự thân — máy chặn, không nhắc suông. */
export function nguonHopLe<T>(s: SuThat<T>): boolean {
  if (s.co === 'verified') return Boolean(s.nguon);
  if (s.co === 'inferred') return Boolean(s.ghiChu && s.ghiChu.trim());
  return true;
}

/* ═══════════════ VỊ TRÍ (§6 · §9) ═══════════════ */

/**
 * §6 — ĐỘ CHÍNH XÁC LÀ MỘT SỰ THẬT RIÊNG, không phải chú thích.
 * Cấm bày số liệu cấp thành phố như thể là số liệu tại công trường.
 * `chua-ro` là TRẠNG THÁI HỢP LỆ (§5) — không được dùng nó làm cớ chặn người dùng vào dự án.
 */
export type DoChinhXacViTri = 'cong-truong' | 'thanh-pho' | 'vung' | 'chua-ro';

/**
 * §7 — SỰ THẬT TRUNG TÍNH VỚI NHÀ CUNG CẤP BẢN ĐỒ. Đổi Google → Apple → thứ khác KHÔNG được
 * kéo theo di trú dữ liệu dự án. `nhaCungCap` chỉ là DẤU VẾT ai đã tra ra, không phải chủ sở hữu.
 */
export interface ViTriDuAn {
  viDo?: number;
  kinhDo?: number;
  diaChi?: string;
  phuong_xa?: string;
  tinh_thanh?: string;
  quocGia?: string;
  /** IANA, vd 'Asia/Ho_Chi_Minh'. */
  muiGio?: string;
  /**
   * 🔴 MÚI GIỜ PHẢI CÓ HẠNG RIÊNG — nó ĐỔI KẾT QUẢ NẮNG, nên không được lặng lẽ thành sự thật.
   * `measured` = người dùng/nhà cung cấp vị trí khai thẳng · `verified` = tra từ nguồn IANA thật
   * · `inferred` = **suy từ kinh độ** (xấp xỉ `lng/15`).
   * ⚠️ Suy từ kinh độ SAI ở mọi nước có ranh giới múi giờ theo chính trị (Trung Quốc một múi giờ
   * cho cả nước, Ấn Độ +5:30, Tây Ban Nha…). Vì vậy nó KHÔNG BAO GIỜ được coi là canonical, và
   * mọi trạng thái nắng tính từ nó bị kẹp trần `inferred` (xem `solar.ts#trangThaiNang`).
   * Thiếu trường này ⇒ đọc là `inferred`, KHÔNG đọc là "chắc đúng".
   */
  muiGioCo?: ProvenanceFlag;
  /** Ai/cái gì cho ra múi giờ đó — bắt buộc khi `muiGioCo === 'verified'`. */
  muiGioNguon?: NguonGoc;
  caoDoM?: number;
  doChinhXac: DoChinhXacViTri;
  /** Tên nhà cung cấp đã tra (chuỗi tự do, cố ý KHÔNG enum — cùng khuôn `ExternalRef.system`). */
  nhaCungCap?: string;
  /** Người dùng đã xác nhận đây đúng là chỗ đó chưa. Máy tra ra ≠ người gật. */
  nguoiDungXacNhan: boolean;
}

/* ═══════════════ HƯỚNG (§8) ═══════════════ */

/**
 * Độ, THEO CHIỀU KIM ĐỒNG HỒ TỪ HƯỚNG BẮC — CÙNG quy ước với `lighting.ts#SunPosition.azimuthDeg`
 * (0=Bắc · 90=Đông · 180=Nam · 270=Tây). Dùng khác quy ước là lật gương toàn bộ phân tích nắng,
 * nên nó được khoá bằng test chứ không bằng lời dặn.
 */
export interface HuongCongTrinh {
  /** Bắc thật. Thiếu ⇒ coi như 0 khi tính, nhưng phải BÁO là chưa khai, không im lặng. */
  bacThatDeg?: number;
  /** "Bắc dự án" — trục quy ước của bản vẽ, có thể lệch Bắc thật. */
  bacDuAnDeg?: number;
  /** Phương vị mặt đứng chính. */
  matDungChinhDeg?: number;
  huongNhinChinhDeg?: number;
  loiVaoDeg?: number;
}

/* ═══════════════ BA TẦNG SỰ THẬT (§3) — TUYỆT ĐỐI KHÔNG LÀM PHẲNG ═══════════════ */

/**
 * §3B — KẾT LUẬN SUY RA. Bắt buộc biết NÓ SINH RA TỪ SỰ THẬT NÀO (`tuSuThat`); một Insight
 * không truy được về Fact thì không phải suy luận, chỉ là một câu nói.
 */
export interface KetLuanSuyRa {
  id: string;
  tieuDe: string;
  dienGiai: string;
  /** Khoá của các sự thật đã sinh ra kết luận này. RỖNG LÀ KHÔNG HỢP LỆ. */
  tuSuThat: string[];
  mucDo: 'rui-ro' | 'co-hoi' | 'luu-y';
}

/**
 * §3C — ĐỀ XUẤT THIẾT KẾ. **KHÔNG phải sự thật dự án.** Nó chỉ trở thành ngữ cảnh được duyệt khi
 * có một hành động của CON NGƯỜI (§4). Đây là ranh giới quan trọng nhất của cả tính năng.
 */
export interface DeXuatThietKe {
  id: string;
  tieuDe: string;
  dienGiai: string;
  /** Kết luận nào dẫn tới đề xuất này. */
  tuKetLuan: string[];
  trangThai: TrangThaiDeXuat;
  /** Lịch sử quyết định — bị từ chối vẫn GIỮ LẠI (§3C), chỉ thôi ảnh hưởng AI phía sau. */
  quyetDinh?: QuyetDinhNguoiDung;
}

export type TrangThaiDeXuat = 'cho-duyet' | 'da-nhan' | 'da-tu-choi';

export interface QuyetDinhNguoiDung {
  boi: string;
  luc: string;
  lyDo?: string;
}

/* ═══════════════ HỒ SƠ ĐỊA ĐIỂM ═══════════════ */

export interface HoSoDiaDiem {
  duAnId: string;
  /** Tăng khi cấu trúc đổi — chỗ móc bảng nâng cấp về sau, không phải số trang trí. */
  phienBan: number;
  viTri: ViTriDuAn;
  huong: HuongCongTrinh;
  /** Sự thật vật lý/khí hậu — Pha 2 đổ vào, Pha 1 để rỗng chứ KHÔNG bịa. */
  suThat: Record<string, SuThat<unknown>>;
  ketLuan: KetLuanSuyRa[];
  deXuat: DeXuatThietKe[];
  /**
   * ⭐ KHOÁ SỰ THẬT ĐÃ THÀNH CŨ — §32. Ghi vào hồ sơ (không phải state UI) vì nó là TRẠNG THÁI
   * MIỀN: đóng app mở lại thì việc "phân tích nắng cần tính lại" vẫn còn nguyên. Đây cũng là
   * nguồn DUY NHẤT nuôi tín hiệu Vitals — Vitals KHÔNG được tự suy ra sự chú ý từ state giao diện.
   */
  daCu?: string[];
  taoLuc: string;
  suaLuc: string;
}

/** Hồ sơ rỗng hợp lệ — `chua-ro` là trạng thái thật, KHÔNG phải lỗi (§5 · §36). */
export function hoSoRong(duAnId: string, luc: string): HoSoDiaDiem {
  return {
    duAnId,
    phienBan: 1,
    viTri: { doChinhXac: 'chua-ro', nguoiDungXacNhan: false },
    huong: {},
    suThat: {},
    ketLuan: [],
    deXuat: [],
    taoLuc: luc,
    suaLuc: luc,
  };
}

/** Có đủ toạ độ để chạy được hình học mặt trời hay chưa. */
export function coToaDo(h: HoSoDiaDiem): boolean {
  return typeof h.viTri.viDo === 'number' && typeof h.viTri.kinhDo === 'number';
}

/**
 * §27 — NGỮ CẢNH CHO AI CHỈ GỒM THỨ ĐÃ ĐƯỢC DUYỆT.
 * Đề xuất `cho-duyet` và `da-tu-choi` KHÔNG BAO GIỜ được bơm vào như sự thật. Đây là nơi DUY NHẤT
 * quyết định điều đó, để không nơi nào tự chế luật riêng.
 */
export function deXuatDuocDuyet(h: HoSoDiaDiem): DeXuatThietKe[] {
  return h.deXuat.filter((d) => d.trangThai === 'da-nhan');
}

/**
 * §4 — AI ĐỀ XUẤT, NGƯỜI QUYẾT. Chuyển trạng thái đề xuất PHẢI đi qua đây, và phải có người.
 * Trả `null` khi thiếu người quyết ⇒ nơi gọi không thể "nhận" giúp máy.
 */
export function apQuyetDinh(
  d: DeXuatThietKe,
  trangThai: Extract<TrangThaiDeXuat, 'da-nhan' | 'da-tu-choi'>,
  boi: string,
  luc: string,
  lyDo?: string,
): DeXuatThietKe | null {
  if (!boi.trim()) return null;
  return { ...d, trangThai, quyetDinh: { boi, luc, lyDo } };
}

/* ═════════════════════ LA BÀN DỰ ÁN (Compass / Site Intelligence) ═════════════════════ */


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
