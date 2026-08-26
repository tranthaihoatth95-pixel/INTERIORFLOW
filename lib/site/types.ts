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
 */

import type { ProvenanceFlag } from '@/lib/idfc-import/from-photo';

export type { ProvenanceFlag };

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
