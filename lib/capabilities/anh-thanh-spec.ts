/**
 * lib/capabilities/anh-thanh-spec.ts — bước CUỐI của lát cắt dọc "Ảnh → Spec":
 * ứng viên khối đã qua cửa duyệt → **một tờ spec lưu được**, mang đúng mức sự thật của từng ô.
 *
 * ── LOOK INSIDE (luật B25 NO-REBUILD — đo tại nguồn 20/08) ─────────────────────────────────────
 * ĐANG CÓ, DÙNG LẠI NGUYÊN — file này KHÔNG viết lại một dòng thuật toán nào:
 *   · `./image-to-3d` — trạng thái ứng viên · cửa duyệt · cổng BOQ · cờ 3 nấc. Ở đây chỉ ĐỌC.
 *   · `../cad/materials#MATERIALS` — kho vật liệu THỊ GIÁC đã có (id · tên · nhóm · màu chủ đạo).
 *     Đây là nơi DUY NHẤT lấy tên vật liệu. Cấm bịa tên vật liệu ngoài kho này.
 *   · `../idfc-import/from-photo#ProvenanceFlag` — bộ từ vựng `measured|inferred|verified`.
 *     REUSE nguyên, KHÔNG đẻ bộ thứ tư (đã đếm ~509 chỗ dùng bộ này trong repo).
 *   · `prisma/schema.prisma#AssetRepresentation` — chỗ LƯU. Không bảng mới, không cột mới.
 * ⇒ Thứ chưa tồn tại và là toàn bộ nội dung file này: **ngữ pháp sự thật cho vật liệu và sản
 *   phẩm**, cộng phép gói thành tờ spec. Thuần: không mạng, không DOM, không Prisma.
 *
 * ── BA LUẬT NGỮ PHÁP SỰ THẬT (Hoà chốt 15/08 + cửa duyệt 03) ───────────────────────────────────
 *  ① VẬT LIỆU: máy chỉ được ĐỀ XUẤT ỨNG VIÊN. Mọi ứng viên mang `inferred` và một câu `bangChung`
 *    nói rõ *vì sao nó có mặt trong danh sách*. Không có đường nào cho máy tự chọn.
 *  ② KHÔNG KHẲNG ĐỊNH THỨ ẢNH KHÔNG CHỨA. Loài gỗ · cấp · chống cháy · chống trượt · tiêu âm ·
 *    độ bền — ảnh phẳng **không mang** những thông tin đó, bất kể ảnh đẹp cỡ nào. Chúng ra ô
 *    "Chưa rõ" kèm việc phải làm (`thuocTinhKhongSuyDuoc`), KHÔNG bao giờ được máy điền.
 *  ③ SẢN PHẨM/NHÀ CUNG CẤP: **CẤM BỊA MÃ**. Máy chỉ trả `sanPhamChuaRo()`. Một mã SKU chỉ tồn
 *    tại khi NGƯỜI nhập và kèm nguồn tra được — `sanPhamNguoiNhap()` từ chối mã không nguồn.
 * Cả ba luật đều có test canh (`anh-thanh-spec.test.ts`) — nới một luật là test đỏ.
 */

import type { ProvenanceFlag } from '../idfc-import/from-photo';
import { MATERIALS } from '../cad/materials';
import {
  duocVaoBoq,
  nacThapNhat,
  nhanXuatXu,
  type CanCuSuThat,
  type CongBoq,
  type UngVienKhoi3D,
} from './image-to-3d';

/* ═══════════════════════════ ① VẬT LIỆU — ỨNG VIÊN, KHÔNG KHẲNG ĐỊNH ═══════════════════════════ */

export interface Mau {
  r: number;
  g: number;
  b: number;
}

export interface UngVienVatLieu {
  matId: string;
  ten: string;
  nhom: string;
  /** Màu chủ đạo của preset — để mặt tiền vẽ ô màu, KHÔNG phải bằng chứng tự thân. */
  mau: string;
  /** 0..100, chỉ có khi ĐÃ lấy được màu từ ảnh. `undefined` = không có bằng chứng nào để xếp hạng. */
  doGan?: number;
  /** Vì sao ứng viên này có mặt — câu cho người đọc, luôn nói rõ giới hạn. */
  bangChung: string;
  /** Luôn `inferred`. Ứng viên máy đề xuất không bao giờ là số/điều đã kiểm (luật ①). */
  mucSuThat: Extract<ProvenanceFlag, 'inferred'>;
  /** Khai tường minh để ai bỏ nó phải cố ý — cùng lối `NangLucGop.deXuat`. */
  ungVien: true;
}

function hexToMau(hex: string): Mau | null {
  const h = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/** Khoảng cách RGB thô, 0..1. Cố ý KHÔNG gọi là "độ chính xác" — nó chỉ là gần màu. */
function khoangCachMau(a: Mau, b: Mau): number {
  const d = Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
  return Math.min(1, d / Math.hypot(255, 255, 255));
}

export interface DauVaoVatLieu {
  /** Màu trung bình vùng món trong ảnh, nếu mặt tiền lấy được. Không có thì danh sách không xếp hạng. */
  mauAnh?: Mau;
  /** Trần số ứng viên trả về — mặc định 6 (đủ để chọn, chưa tới mức phải cuộn). */
  toiDa?: number;
}

/**
 * Ứng viên vật liệu cho một ảnh.
 *
 * 🔴 Bằng chứng DUY NHẤT máy có từ một ảnh phẳng là **màu**. Nó KHÔNG nói được đây là gỗ gì, dày
 * bao nhiêu, cấp mấy — nên câu `bangChung` phải nói đúng chừng đó và không hơn. Không có màu thì
 * trả danh sách KHÔNG xếp hạng, và nói thẳng là chưa đọc được gì từ ảnh: một danh sách xếp hạng
 * bằng con số bịa còn tệ hơn một danh sách thật thà không thứ tự.
 */
export function ungVienVatLieu(input: DauVaoVatLieu = {}): UngVienVatLieu[] {
  const toiDa = input.toiDa ?? 6;
  const co = input.mauAnh;
  const rows = MATERIALS.map((m) => {
    const mm = hexToMau(m.color);
    const doGan = co && mm ? Math.round((1 - khoangCachMau(co, mm)) * 100) : undefined;
    return {
      matId: m.id,
      ten: m.name,
      nhom: String(m.category),
      mau: m.color,
      doGan,
      bangChung:
        doGan == null
          ? 'Chưa đọc được vật liệu từ ảnh — danh sách lấy nguyên từ kho vật liệu, không xếp hạng.'
          : `Gần màu trung bình vùng món trong ảnh (${doGan}%). Màu không nói được loại vật liệu.`,
      mucSuThat: 'inferred' as const,
      ungVien: true as const,
    };
  });
  if (co) rows.sort((a, b) => (b.doGan ?? 0) - (a.doGan ?? 0));
  return rows.slice(0, toiDa);
}

/* ═══════════════════════════ ② THỨ ẢNH KHÔNG BAO GIỜ NÓI ĐƯỢC ═══════════════════════════ */

export interface ThuocTinhChuaRo {
  ten: string;
  /** Luôn là câu "Chưa rõ" — ô này KHÔNG có đường nào để máy điền. */
  giaTri: 'Chưa rõ';
  canLam: string;
}

/**
 * Sáu ô mà một tấm ảnh **không thể** trả lời. Hiện chúng ra là cố ý (§9: *"cấm xoá ô trống cho
 * gọn mắt — ô trống là bằng chứng còn việc"*): người dùng thấy ngay tờ spec còn thiếu gì, thay vì
 * thấy một tờ spec trông đã đầy đủ nhờ máy điền bừa.
 */
export function thuocTinhKhongSuyDuoc(): ThuocTinhChuaRo[] {
  return [
    { ten: 'Loài gỗ / gốc vật liệu', giaTri: 'Chưa rõ', canLam: 'Tra tài liệu nhà cung cấp hoặc xem mẫu thật.' },
    { ten: 'Cấp / mác vật liệu', giaTri: 'Chưa rõ', canLam: 'Lấy từ chứng chỉ hoặc catalogue.' },
    { ten: 'Chống cháy', giaTri: 'Chưa rõ', canLam: 'Cần chứng chỉ thử nghiệm — không suy từ ảnh.' },
    { ten: 'Chống trượt', giaTri: 'Chưa rõ', canLam: 'Cần hệ số R/độ nhám từ nhà sản xuất.' },
    { ten: 'Tiêu âm', giaTri: 'Chưa rõ', canLam: 'Cần chỉ số hút âm đo trong phòng thử.' },
    { ten: 'Độ bền / bảo hành', giaTri: 'Chưa rõ', canLam: 'Lấy từ hợp đồng hoặc phiếu bảo hành.' },
  ];
}

/* ═══════════════════════════ ③ SẢN PHẨM — CẤM BỊA MÃ ═══════════════════════════ */

export interface UngVienSanPham {
  ten: string;
  sku?: string;
  nhaCungCap?: string;
  /** Nguồn tra được (URL trang hãng · số hợp đồng · tên catalogue). KHÔNG có ⇒ không có mã. */
  nguon?: string;
  mucSuThat: 'chuaRo' | 'verified';
  nguoiNhap?: string;
}

/** Máy chỉ được trả đúng thứ này. Không tham số nào mở ra một cái mã. */
export function sanPhamChuaRo(): UngVienSanPham {
  return { ten: 'Chưa rõ', mucSuThat: 'chuaRo' };
}

export type KetQuaSanPham = { ok: true; sanPham: UngVienSanPham } | { ok: false; lyDo: string };

/**
 * NGƯỜI nhập sản phẩm. Có mã thì bắt buộc có nguồn tra được — mã không nguồn là mã bịa, chỉ khác
 * ở chỗ người gõ thay vì máy gõ, và nó sẽ đi thẳng vào hồ sơ giao khách.
 */
export function sanPhamNguoiNhap(input: {
  ten: string;
  sku?: string;
  nhaCungCap?: string;
  nguon?: string;
  nguoiNhap: string;
}): KetQuaSanPham {
  const ten = input.ten?.trim();
  if (!ten) return { ok: false, lyDo: 'Chưa có tên sản phẩm.' };
  if (!input.nguoiNhap?.trim()) return { ok: false, lyDo: 'Phải có người nhập — dữ liệu không chủ là dữ liệu không tra được.' };
  const sku = input.sku?.trim();
  const nguon = input.nguon?.trim();
  if (sku && !nguon) {
    return { ok: false, lyDo: 'Có mã sản phẩm thì phải kèm nguồn tra được (trang hãng, catalogue, hợp đồng).' };
  }
  return {
    ok: true,
    sanPham: {
      ten,
      sku: sku || undefined,
      nhaCungCap: input.nhaCungCap?.trim() || undefined,
      nguon: nguon || undefined,
      mucSuThat: 'verified',
      nguoiNhap: input.nguoiNhap.trim(),
    },
  };
}

/* ═══════════════════════════ ④ GÓI THÀNH TỜ SPEC ═══════════════════════════ */

export interface OKichThuoc {
  ten: 'Rộng' | 'Sâu' | 'Cao';
  valueMm: number;
  toleranceMm: number;
  flag: ProvenanceFlag;
  flagMay: ProvenanceFlag;
  canCu: CanCuSuThat;
  canCuMay: CanCuSuThat;
  basis: string;
  /** Chữ hiện trên màn — mặt tiền KHÔNG tự chế nhãn khác (một nguồn cho cách gọi). */
  nhan: string;
  /** Xuất xứ đã thành chữ (`nhanXuatXu`) — đi kèm số vào mọi bản in/hồ sơ. */
  xuatXu: string;
}

export interface SpecTuAnh {
  ungVienId: string;
  nguon: UngVienKhoi3D['nguon'];
  doiTuong: string;
  tierLabel: string;
  confidencePercent: number;
  kichThuoc: OKichThuoc[];
  mucSuThat: ProvenanceFlag;
  boq: CongBoq;
  vatLieu?: UngVienVatLieu;
  sanPham: UngVienSanPham;
  chuaRo: ThuocTinhChuaRo[];
  nguoiXacNhan: string;
}

/**
 * Nhãn hiển thị của một ô số — CHỖ DUY NHẤT quyết định "≈" và chữ "suy ra" xuất hiện.
 *
 * 🔴 SỬA NGHĨA 20/08: `verified` KHÔNG còn là một nhãn duy nhất. Hai đường lên `verified` là hai
 * chuyện khác hẳn nhau với người đọc hồ sơ — **NGƯỜI NHẬP** (người tự đưa số) ≠ **ĐÃ KIỂM** (người
 * đối chiếu với một tham chiếu đáng tin). Gộp chúng lại là xoá mất đúng thứ người đọc cần biết.
 * `canCu` để tuỳ chọn cho tương thích ngược; thiếu nó thì nhãn lùi về cách gọi trung tính.
 */
export function nhanKichThuoc(valueMm: number, flag: ProvenanceFlag, canCu?: CanCuSuThat): string {
  const mm = Math.round(valueMm);
  if (flag === 'inferred') return `≈ ${mm} mm · SUY RA`;
  if (flag === 'verified') {
    if (canCu === 'human-override') return `${mm} mm · NGƯỜI NHẬP`;
    if (canCu === 'human-confirmed') return `${mm} mm · ĐÃ KIỂM`;
    return `${mm} mm · NGƯỜI XÁC NHẬN`;
  }
  return `${mm} mm · ĐO ĐƯỢC`;
}

/**
 * Gói ứng viên ĐÃ DUYỆT thành tờ spec. Ném lỗi nếu chưa duyệt — spec là thứ đi ra ngoài, không
 * nhận bản nháp (cùng luật `bieuDienCuaUngVien`).
 */
export function taoSpecTuUngVien(
  uv: UngVienKhoi3D,
  opts: { vatLieu?: UngVienVatLieu; sanPham?: UngVienSanPham },
): SpecTuAnh {
  if (uv.trangThai !== 'daNhan') {
    throw new Error('Chưa duyệt thì chưa có spec — máy sinh là đề xuất, không phải sự thật.');
  }
  const o = (ten: OKichThuoc['ten'], k: UngVienKhoi3D['rong']): OKichThuoc => ({
    ten,
    valueMm: k.valueMm,
    toleranceMm: k.toleranceMm,
    flag: k.flag,
    flagMay: k.flagMay,
    canCu: k.canCu,
    canCuMay: k.canCuMay,
    basis: k.basis,
    nhan: nhanKichThuoc(k.valueMm, k.flag, k.canCu),
    xuatXu: nhanXuatXu(k.canCu),
  });
  const kichThuoc = [o('Rộng', uv.rong), o('Sâu', uv.sau), o('Cao', uv.cao)];
  return {
    ungVienId: uv.id,
    nguon: uv.nguon,
    doiTuong: uv.categoryLabel,
    tierLabel: uv.tierLabel,
    confidencePercent: uv.confidencePercent,
    kichThuoc,
    mucSuThat: nacThapNhat(kichThuoc.map((k) => k.flag)),
    boq: duocVaoBoq(uv),
    vatLieu: opts.vatLieu,
    sanPham: opts.sanPham ?? sanPhamChuaRo(),
    chuaRo: thuocTinhKhongSuyDuoc(),
    nguoiXacNhan: uv.nguoiXacNhan ?? '',
  };
}

/* ═══════════════════════════ ⑤ HÌNH DẠNG ĐỂ LƯU ═══════════════════════════ */

/** `AssetRepresentation.kind` — chuỗi tự do CÓ CHỦ ĐÍCH, cùng lối `ExternalRef.system`. */
export const KIND_SPEC = 'spec-from-image' as const;

export interface BanGhiBieuDien {
  assetId: string;
  kind: typeof KIND_SPEC;
  /**
   * Con trỏ LOGIC tới biểu diễn. 🔴 KHAI THẬT: hôm nay chưa có kho blob cho tờ spec, nên đây là
   * một con trỏ ổn định chứ chưa phải đường dẫn tệp. Nội dung thật nằm ở `provenance` — đúng vai
   * cột đó (*"sinh từ đâu, bằng năng lực nào, tham số gì"*), vì mọi ô trong tờ spec này đều là
   * một câu trả lời cho *"con số/chữ này ở đâu ra"*.
   */
  payloadRef: string;
  truthLevel: ProvenanceFlag;
  provenance: string;
  verifiedBy: string | null;
}

export function banGhiBieuDien(spec: SpecTuAnh): BanGhiBieuDien {
  const coNguoiKy = spec.kichThuoc.some((k) => k.flag === 'verified');
  return {
    assetId: spec.nguon.id,
    kind: KIND_SPEC,
    payloadRef: `if:image-to-3d/${spec.ungVienId}`,
    truthLevel: spec.mucSuThat,
    provenance: JSON.stringify({
      nangLuc: 'image-to-3d',
      doiTuong: spec.doiTuong,
      phuongPhap: spec.tierLabel,
      doTin: spec.confidencePercent,
      kichThuoc: spec.kichThuoc.map((k) => ({
        ten: k.ten,
        mm: Math.round(k.valueMm),
        flag: k.flag,
        flagMay: k.flagMay,
        // 🔴 CĂN CỨ phải nằm trong bản LƯU, không chỉ trên màn: đây là chỗ duy nhất còn tra được
        // "số này do người nhập hay máy đo" sau khi mọi giao diện đã đổi.
        canCu: k.canCu,
        canCuMay: k.canCuMay,
        xuatXu: k.xuatXu,
        basis: k.basis,
      })),
      boq: spec.boq,
      vatLieu: spec.vatLieu
        ? { matId: spec.vatLieu.matId, ten: spec.vatLieu.ten, mucSuThat: spec.vatLieu.mucSuThat, bangChung: spec.vatLieu.bangChung }
        : null,
      sanPham: spec.sanPham,
      chuaRo: spec.chuaRo.map((c) => c.ten),
    }),
    // `verifiedBy` đi CÙNG `truthLevel='verified'` (schema). Có người ký lẻ một chiều thì vẫn ghi
    // tên — nhưng `truthLevel` vẫn là nấc THẤP NHẤT, không ăn theo chữ ký.
    verifiedBy: coNguoiKy ? spec.nguoiXacNhan || null : null,
  };
}
