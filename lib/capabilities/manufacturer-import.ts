/**
 * lib/capabilities/manufacturer-import.ts — **LỚP ĐIỀU PHỐI THUẦN** của đường NGUỒN HÃNG → IDFC.
 *
 * Bản thiết kế đã chốt: `docs/memory/sessions/2026-08-20/06-manufacturer-idfc-import/README.md`.
 * File này KHÔNG chạm DB, KHÔNG đọc đĩa, KHÔNG gọi mạng — vì thế test được thẳng bằng
 * `sucrase-node` (import RELATIVE, không alias `@/`). Phần ghi DB nằm ở
 * `manufacturer-import-apply.ts` cạnh bên.
 *
 * ══ [Đ2] NHÌN VÀO TRONG TRƯỚC — dùng lại gì, và vì sao KHÔNG đẻ cái mới ══════════════════════
 *   · `ProductSpec`        — bản ghi sản phẩm hãng (brand·sku·vendor·w/d/hUp·materials). REUSE.
 *   · `ExternalRef`        — khoá danh tính hãng (`system` + `externalId`, unique). REUSE.
 *                            ⇒ **KHÔNG thêm cột nào vào `ProductSpec`** cho lượt này.
 *   · `AssetRepresentation`— nhiều cách thể hiện của MỘT danh tính, mang sẵn `truthLevel`
 *                            (`measured|inferred|verified`) + `provenance`. REUSE.
 *   · `promoteProjectFile` — cửa ghi DUY NHẤT `ProjectFile → LibraryAsset`. REUSE, không viết
 *                            cửa ghi thứ hai.
 *   · thẻ `nguon:`/`license:` (`lib/library/gallery-tags.ts`) — chỗ để `sourceUrl`/xuất xứ đi
 *                            qua, đúng chốt ② "không đẻ cột identity mới lượt này".
 *   · `exportIdfc`/`importIdfc` (`lib/cad/idfc.ts`) — khuôn gói `.idfc`. REUSE.
 *
 * ══ 🔴 BA LUẬT CỨNG CỦA FILE NÀY ═════════════════════════════════════════════════════════════
 * ① **CẤM BỊA.** Không có mã sản phẩm thật ⇒ `ma = null` và tên rơi về `TEN_UNG_VIEN`
 *    ("Ứng viên sản phẩm"). TUYỆT ĐỐI không sinh SKU từ tên tệp/hash/thời gian — một mã bịa ra
 *    trông y hệt mã thật, và nó sẽ đi thẳng vào hồ sơ giao khách.
 * ② **Chuẩn hoá ≠ vẽ lại.** Được đổi ĐƠN VỊ · gốc toạ độ · tên · danh mục · siêu dữ liệu.
 *    CẤM đổi âm thầm: hình học · KÍCH THƯỚC · hoàn thiện của hãng · danh tính sản phẩm.
 *    `doiVeMm()` chỉ đổi đơn vị theo hệ số NGUYÊN (mm×1 · cm×10 · m×1000) — không làm tròn,
 *    không "ước lượng". Đơn vị không đổi được chính xác (inch) ⇒ **để trống + cảnh báo**.
 * ③ **Mức sự thật là DỮ LIỆU, không phải lời hứa.** Tệp do hãng cấp ⇒ `measured`. Thứ IF tự
 *    sinh ra từ tệp của hãng ⇒ `inferred` + `provenance` mang `derived-from:<repId>`. Đây chính
 *    là cách máy đảm bảo "không trình bản vẽ dẫn xuất như bản vẽ của hãng" — xem `dungRepDanXuat`.
 *
 * ══ ⛔ RANH GIỚI ĐÃ ĐO, KHÔNG LÁCH ═══════════════════════════════════════════════════════════
 *   · KHÔNG cào dữ liệu, KHÔNG vượt đăng nhập/tường phí. Lượt này CHỈ **đường B — gói tệp người
 *     dùng đã có sẵn**; đường URL đụng điều khoản truy cập từng hãng (việc pháp lý, không phải
 *     việc code) nên cố ý chưa mở.
 *   · **DWG/DXF chưa vào được** — hai cửa cùng đóng, đo tại nguồn 20/08:
 *       (a) cửa nạp `ProjectFile` chỉ nhận thứ `sniffKind` nhận ra (PNG/JPEG/GIF/WEBP/AVIF/PDF)
 *           — `app/api/project-files/_lib/luu-file.ts` tự khai giới hạn này;
 *       (b) `lib/cad/dwg.ts` đọc DWG bằng **Web Worker** (libredwg-web) ⇒ không chạy được ở máy
 *           chủ.
 *     ⇒ Nới whitelist magic-bytes là một quyết định AN TOÀN, phải đi bằng phiếu riêng.
 */

import { exportIdfc, type IdfcGeom2d, type IdfcKind, type IdfcMeta } from '../cad/idfc';

/* ══════════════════════ ① TỪ VỰNG ═══════════════════════════════════════════════════════════ */

/** Cách thể hiện — CÙNG vocabulary `AssetRepresentation.kind` (chuỗi tự do có chủ đích). */
export type RepKind = 'plan' | 'elevation' | 'section' | 'model3d' | 'image' | 'datasheet';

export const REP_KINDS: readonly RepKind[] = ['plan', 'elevation', 'section', 'model3d', 'image', 'datasheet'];

/** Mức sự thật — dùng lại NGUYÊN ba nấc đang chạy, không đẻ thang thứ hai. */
export type TruthLevel = 'measured' | 'inferred' | 'verified';

/** Tên khi CHƯA BIẾT sản phẩm là gì. Không bịa tên hãng, không bịa mã. */
export const TEN_UNG_VIEN = 'Ứng viên sản phẩm';
/** Giá trị hiển thị cho ô trống — dùng ở tầng trình bày, KHÔNG ghi vào DB. */
export const CHUA_RO = 'Chưa rõ';

/* ══════════════════════ ② PHÂN LOẠI TỆP TRONG GÓI ═══════════════════════════════════════════ */

export interface TepGoi {
  /** id `ProjectFile` — tệp người dùng đã tự nạp vào dự án bằng cửa Files sẵn có. */
  projectFileId: string;
  name: string;
  /** MIME do MÁY CHỦ sniff magic-bytes (`ProjectFile.mime`), không phải nhãn client khai. */
  mime: string;
}

export interface TepDaPhanLoai extends TepGoi {
  repKind: RepKind;
  /** Vì sao xếp vào loại đó — để người duyệt bác được, không phải hộp đen. */
  vìSao: string;
  truthLevel: TruthLevel;
}

/** Từ khoá tên tệp → loại thể hiện. Song ngữ vì hồ sơ hãng lẫn hồ sơ Việt đều gặp. */
const DAU_HIEU: { kind: RepKind; tu: string[] }[] = [
  { kind: 'plan', tu: ['plan', 'topview', 'top-view', 'mat-bang', 'matbang', 'mặt bằng', 'bang-ve-mb'] },
  { kind: 'elevation', tu: ['elevation', 'front', 'side', 'mat-dung', 'matdung', 'mặt đứng'] },
  { kind: 'section', tu: ['section', 'mat-cat', 'matcat', 'mặt cắt'] },
  { kind: 'model3d', tu: ['3d', 'model', 'obj', 'glb', 'gltf', 'skp', 'khoi-3d'] },
  { kind: 'datasheet', tu: ['datasheet', 'spec', 'specification', 'tech', 'thong-so', 'thông số', 'catalog'] },
];

function chuanTen(s: string): string {
  return s.toLowerCase().replace(/[_\s]+/g, '-');
}

/**
 * Xếp một tệp vào cách thể hiện. **Tên tệp thắng MIME** khi tên nói rõ — vì hãng đặt tên có chủ
 * đích ("chair-plan.pdf" đúng là mặt bằng dù nó là PDF). Không dấu hiệu nào ⇒ rơi về loại suy từ
 * MIME (`pdf → datasheet`, ảnh → `image`), và **nói rõ là suy**, không giấu.
 */
export function phanLoaiTep(tep: TepGoi): TepDaPhanLoai {
  const ten = chuanTen(tep.name);
  for (const d of DAU_HIEU) {
    const hit = d.tu.find((t) => ten.includes(t));
    if (hit) {
      return { ...tep, repKind: d.kind, vìSao: `tên tệp chứa "${hit}"`, truthLevel: 'measured' };
    }
  }
  const suy: RepKind = tep.mime === 'application/pdf' ? 'datasheet' : 'image';
  return { ...tep, repKind: suy, vìSao: `suy từ MIME "${tep.mime}" — tên tệp không nói loại`, truthLevel: 'measured' };
}

/* ══════════════════════ ③ ĐỌC KÍCH THƯỚC — CHUẨN HOÁ, KHÔNG ĐỔI SỐ ══════════════════════════ */

export type DonVi = 'mm' | 'cm' | 'm';

/** Hệ số đổi về mm — NGUYÊN, nên phép đổi là chính xác tuyệt đối, không làm tròn. */
export const HE_SO_MM: Record<DonVi, number> = { mm: 1, cm: 10, m: 1000 };

/**
 * Đổi một số đo về mm. `mm → mm` trả về **CHÍNH SỐ ĐÓ** (luật ②: chuẩn hoá không được đổi kích
 * thước). Số không hữu hạn / âm ⇒ `null` (không đoán).
 */
export function doiVeMm(gia: number, donVi: DonVi): number | null {
  if (!Number.isFinite(gia) || gia <= 0) return null;
  return gia * HE_SO_MM[donVi];
}

export interface KichThuoc {
  w?: number;
  d?: number;
  hUp?: number;
  /** Chuỗi gốc đã đọc ra ba số này — để người duyệt đối chiếu tận gốc. */
  nguonChu: string;
  donViGoc: DonVi;
}

const DON_VI_RE = '(mm|cm|m)?';

/**
 * Đọc kích thước từ một đoạn chữ (tên tệp hoặc chữ trong PDF). Hai khuôn ĐƯỢC PHÉP, không hơn:
 *   ① có nhãn:   `W1200 D800 H750` · `R1200 S800 C750` (rộng/sâu/cao)
 *   ② ba số nối: `1200x800x750` · `1200×800×750`  → hiểu theo thứ tự **rộng × sâu × cao**
 * Bắt được INCH thì **không đổi** (25,4 không nguyên ⇒ đổi là làm tròn ⇒ đổi kích thước hãng):
 * trả `null` và caller ghi cảnh báo.
 *
 * KHÔNG có khuôn nào khớp ⇒ `null`. Đoán một con số kích thước là đoán vào BOQ.
 */
export function docKichThuoc(chu: string): KichThuoc | null {
  const s = chu.replace(/,/g, '.');
  if (/\d\s*(?:"|inch|in\b)/i.test(s)) return null;

  // ① có nhãn
  const co = (nhan: string) => {
    const re = new RegExp(`(?:^|[^a-z])${nhan}\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)\\s*${DON_VI_RE}`, 'i');
    const m = re.exec(s);
    return m ? { so: parseFloat(m[1]), dv: (m[2] || '').toLowerCase() as DonVi | '', khop: m[0].trim() } : null;
  };
  const w = co('w') ?? co('r');
  const d = co('d') ?? co('s');
  const h = co('h') ?? co('c');
  if (w || d || h) {
    const dv = (w?.dv || d?.dv || h?.dv || 'mm') as DonVi;
    // `nguonChu` = ĐÚNG những mẩu chữ đã khớp, không phải cả tài liệu — người duyệt cần soi đúng
    // chỗ máy đọc ra số, chứ không phải đọc lại 20.000 ký tự.
    const out: KichThuoc = { nguonChu: [w?.khop, d?.khop, h?.khop].filter(Boolean).join(' · '), donViGoc: dv };
    const dat = (v: { so: number; dv: DonVi | '' } | null) => (v ? doiVeMm(v.so, (v.dv || dv) as DonVi) ?? undefined : undefined);
    out.w = dat(w);
    out.d = dat(d);
    out.hUp = dat(h);
    if (out.w === undefined && out.d === undefined && out.hUp === undefined) return null;
    return out;
  }

  // ② ba số nối
  const m3 = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*[x×]\\s*(\\d+(?:\\.\\d+)?)\\s*[x×]\\s*(\\d+(?:\\.\\d+)?)\\s*${DON_VI_RE}`, 'i').exec(s);
  if (m3) {
    const dv = ((m3[4] || 'mm').toLowerCase() as DonVi);
    return {
      w: doiVeMm(parseFloat(m3[1]), dv) ?? undefined,
      d: doiVeMm(parseFloat(m3[2]), dv) ?? undefined,
      hUp: doiVeMm(parseFloat(m3[3]), dv) ?? undefined,
      nguonChu: m3[0].trim(),
      donViGoc: dv,
    };
  }
  return null;
}

/* ══════════════════════ ④ ĐỌC MÃ SẢN PHẨM — CHỈ KHI CÓ NHÃN RÕ ══════════════════════════════ */

/**
 * Mã sản phẩm CHỈ được nhận khi đứng sau một NHÃN rõ ràng (`Art. no` · `Item no` · `SKU` ·
 * `Mã sản phẩm` · `Model`). Cố ý KHÔNG nhận "chuỗi trông giống mã" trong tên tệp — đó chính là
 * đường ngắn nhất dẫn tới một SKU bịa.
 */
export function docMaSanPham(chu: string): string | null {
  const re = /(?:art(?:icle)?\.?\s*(?:no\.?|number)|item\s*(?:no\.?|code)|sku|model\s*(?:no\.?)?|mã\s*(?:sản\s*phẩm|hàng)?)\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9._/-]{2,31})/i;
  const m = re.exec(chu);
  if (!m) return null;
  const ma = m[1].replace(/[.\-_/]+$/, '');
  return ma.length >= 3 ? ma : null;
}

/* ══════════════════════ ⑤ PHIẾU ỨNG VIÊN SẢN PHẨM ═══════════════════════════════════════════ */

/** Người dùng gõ tay khi lập gói — thứ MÁY KHÔNG ĐƯỢC ĐOÁN thì người khai. Tất cả optional. */
export interface KhaiTay {
  hang?: string;
  ten?: string;
  boSuuTap?: string;
  bienThe?: string;
  ma?: string;
  vatLieu?: string[];
  kind?: IdfcKind;
  /** Xuất xứ gói: đường dẫn thư mục, tên catalogue giấy, email hãng gửi… chuỗi tự do. */
  nguon?: string;
  /** Giấy phép sử dụng tài liệu — người lập gói khai, máy không suy. */
  giayPhep?: string;
}

export interface PhieuUngVien {
  /** NGUỒN */
  nguon: { kieu: 'goi-tep'; moTa: string | null; giayPhep: string | null; soTep: number };
  /** DANH TÍNH */
  hang: string | null;
  ten: string;
  boSuuTap: string | null;
  bienThe: string | null;
  ma: string | null;
  kind: IdfcKind;
  /** CÁC CÁCH THỂ HIỆN */
  cachTheHien: TepDaPhanLoai[];
  /** KÍCH THƯỚC (mm) */
  kichThuoc: KichThuoc | null;
  /** VẬT LIỆU */
  vatLieu: string[];
  /** XUẤT XỨ — vì sao từng ô có giá trị đó. Người duyệt truy được tận gốc. */
  xuatXu: string[];
  /** CẢNH BÁO — thiếu gì, không chắc gì. Rỗng KHÔNG có nghĩa là "đã kiểm". */
  canhBao: string[];
  /** true = đủ điều kiện neo danh tính hãng vào `ExternalRef` (cần cả hãng lẫn mã). */
  neoDuocDanhTinh: boolean;
}

export interface DauVaoPhieu {
  tep: TepGoi[];
  khai?: KhaiTay;
  /** Chữ đọc được từ tài liệu (vd text PDF trích bằng `unpdf` ở tầng route). Rỗng cũng được. */
  chuTaiLieu?: string;
}

/**
 * Dựng PHIẾU ỨNG VIÊN SẢN PHẨM — thứ trình ra cửa người duyệt. **Không ghi gì cả.**
 *
 * Thứ tự ưu tiên mọi ô: **người khai > chữ trong tài liệu > tên tệp > để trống**. Không bao giờ
 * có nấc thứ tư tên là "đoán".
 */
export function dungPhieuUngVien(i: DauVaoPhieu): PhieuUngVien {
  const khai = i.khai ?? {};
  const cachTheHien = i.tep.map(phanLoaiTep);
  const xuatXu: string[] = [];
  const canhBao: string[] = [];

  const tenTepGop = i.tep.map((t) => t.name).join(' | ');
  const chu = [i.chuTaiLieu ?? '', tenTepGop].filter(Boolean).join('\n');

  // ── MÃ ────────────────────────────────────────────────────────────────────────────────────
  let ma: string | null = null;
  if (khai.ma && khai.ma.trim()) {
    ma = khai.ma.trim();
    xuatXu.push(`mã: người lập gói khai tay ("${ma}")`);
  } else {
    const doc = docMaSanPham(chu);
    if (doc) {
      ma = doc;
      xuatXu.push(`mã: đọc từ tài liệu, có nhãn rõ ("${doc}")`);
    } else {
      canhBao.push('Chưa rõ mã sản phẩm — KHÔNG sinh mã thay thế. Không có mã thì không neo được danh tính hãng.');
    }
  }

  // ── HÃNG / TÊN ────────────────────────────────────────────────────────────────────────────
  const hang = khai.hang?.trim() || null;
  if (hang) xuatXu.push(`hãng: người lập gói khai tay ("${hang}")`);
  else canhBao.push('Chưa rõ hãng — không suy từ tên tệp.');

  const ten = khai.ten?.trim() || TEN_UNG_VIEN;
  if (khai.ten?.trim()) xuatXu.push(`tên: người lập gói khai tay`);
  else canhBao.push(`Chưa rõ tên sản phẩm — tạm để "${TEN_UNG_VIEN}".`);

  // ── KÍCH THƯỚC ────────────────────────────────────────────────────────────────────────────
  const kichThuoc = docKichThuoc(chu);
  if (kichThuoc) {
    xuatXu.push(`kích thước: đọc từ "${kichThuoc.nguonChu}" (đơn vị gốc ${kichThuoc.donViGoc}, quy về mm bằng hệ số nguyên)`);
  } else {
    canhBao.push('Chưa đọc được kích thước — để trống. Không suy kích thước từ ảnh (ảnh phẳng không đo được).');
    if (/\d\s*(?:"|inch|in\b)/i.test(chu)) {
      canhBao.push('Tài liệu ghi đơn vị inch — quy đổi sẽ làm tròn, tức đổi kích thước của hãng. Người duyệt gõ lại số mm.');
    }
  }

  // ── VẬT LIỆU ──────────────────────────────────────────────────────────────────────────────
  const vatLieu = (khai.vatLieu ?? []).map((v) => v.trim()).filter(Boolean);
  if (vatLieu.length) xuatXu.push('vật liệu: người lập gói khai tay');
  else canhBao.push('Chưa có vật liệu/hoàn thiện — để trống (hoàn thiện của hãng KHÔNG được suy).');

  // ── CÁCH THỂ HIỆN ─────────────────────────────────────────────────────────────────────────
  if (!cachTheHien.length) canhBao.push('Gói không có tệp nào.');
  const suy = cachTheHien.filter((t) => t.vìSao.startsWith('suy từ MIME'));
  if (suy.length) canhBao.push(`${suy.length} tệp xếp loại bằng suy đoán từ MIME — người duyệt xác nhận lại loại.`);
  if (!cachTheHien.some((t) => t.repKind === 'plan' || t.repKind === 'model3d')) {
    canhBao.push('Gói chưa có mặt bằng/khối 3D của hãng — vật này chưa dựng được hình học, chỉ dùng để trình bày.');
  }

  const kind: IdfcKind = khai.kind ?? 'furniture';
  if (!khai.kind) xuatXu.push('danh mục: mặc định "furniture" — người duyệt đổi nếu sai');

  return {
    nguon: {
      kieu: 'goi-tep',
      moTa: khai.nguon?.trim() || null,
      giayPhep: khai.giayPhep?.trim() || null,
      soTep: i.tep.length,
    },
    hang,
    ten,
    boSuuTap: khai.boSuuTap?.trim() || null,
    bienThe: khai.bienThe?.trim() || null,
    ma,
    kind,
    cachTheHien,
    kichThuoc,
    vatLieu,
    xuatXu,
    canhBao: khai.giayPhep?.trim()
      ? canhBao
      : [...canhBao, 'Chưa khai giấy phép sử dụng tài liệu hãng — bắt buộc khai trước khi đưa vào hồ sơ giao khách.'],
    neoDuocDanhTinh: !!(hang && ma),
  };
}

/* ══════════════════════ ⑥ MỨC SỰ THẬT — DẪN XUẤT PHẢI MANG CỜ `inferred` ════════════════════ */

export interface RepGhi {
  kind: RepKind;
  payloadRef: string;
  truthLevel: TruthLevel;
  /** JSON chuỗi — cùng lối `palette`. */
  provenance: string;
}

/** Tệp DO HÃNG CẤP ⇒ `measured`, provenance ghi rõ tệp gốc. */
export function dungRepGoc(tep: TepDaPhanLoai, boiCanh: { hang: string | null; goi: string | null }): RepGhi {
  return {
    kind: tep.repKind,
    payloadRef: `projectfile:${tep.projectFileId}`,
    truthLevel: 'measured',
    provenance: JSON.stringify({
      loai: 'tep-hang',
      tepGoc: tep.name,
      projectFileId: tep.projectFileId,
      mime: tep.mime,
      xepLoaiVi: tep.vìSao,
      hang: boiCanh.hang,
      goi: boiCanh.goi,
    }),
  };
}

/**
 * Thứ **IF tự sinh ra** từ tệp của hãng (vd mặt bằng suy từ khối 3D). LUÔN `inferred`, LUÔN mang
 * `derived-from:<repId>`. Đây là chỗ lời hứa "không trình bản vẽ dẫn xuất như bản vẽ của hãng"
 * biến thành dữ liệu máy đọc được — và có test khoá.
 */
export function dungRepDanXuat(i: {
  kind: RepKind;
  payloadRef: string;
  repGocId: string;
  bangNangLuc: string;
  thamSo?: Record<string, unknown>;
}): RepGhi {
  return {
    kind: i.kind,
    payloadRef: i.payloadRef,
    truthLevel: 'inferred',
    provenance: JSON.stringify({
      loai: 'if-sinh',
      derivedFrom: `derived-from:${i.repGocId}`,
      bangNangLuc: i.bangNangLuc,
      thamSo: i.thamSo ?? {},
    }),
  };
}

/* ══════════════════════ ⑦ GÓI `.idfc` — TỪ CHỐI KHI KHÔNG CÓ HÌNH HỌC ══════════════════════ */

export type KetQuaIdfc = { ok: true; json: string } | { ok: false; lyDo: string };

/**
 * Dựng `.idfc` từ phiếu đã duyệt.
 *
 * 🔴 **TỪ CHỐI khi thiếu hình học** thay vì dựng một hộp chữ nhật từ w×d. Vẽ hộp từ hai số đo là
 * **VẼ LẠI sản phẩm**, và cái hộp đó sẽ đi tiếp vào bản vẽ như thể là hình của hãng. Đây là ca
 * luật ② nhắm vào. Hình học chỉ đến từ tệp hình học của hãng (DWG/DXF) — hôm nay cửa đó còn đóng
 * (xem đầu file), nên đường này trả `ok:false` với lý do đọc được.
 */
export function dungIdfcTuPhieu(phieu: PhieuUngVien, geom2d?: IdfcGeom2d): KetQuaIdfc {
  if (!phieu.ma) {
    return { ok: false, lyDo: 'Chưa có mã sản phẩm thật — `.idfc` bắt buộc có `meta.code`, và mã KHÔNG được bịa.' };
  }
  if (!geom2d) {
    return {
      ok: false,
      lyDo:
        'Chưa có hình học 2D của hãng — không dựng `.idfc`. (Từ chối có chủ đích: suy hộp chữ nhật từ w×d là vẽ lại sản phẩm.)',
    };
  }
  const meta: Partial<IdfcMeta> & Pick<IdfcMeta, 'name' | 'code' | 'kind'> = {
    name: phieu.ten,
    code: phieu.ma,
    kind: phieu.kind,
    scope: 'studio',
    tags: [phieu.hang ? `hang:${phieu.hang}` : '', phieu.boSuuTap ? `bosuutap:${phieu.boSuuTap}` : ''].filter(Boolean),
  };
  return {
    ok: true,
    json: exportIdfc({
      meta,
      body: {
        type: 'component',
        geom2d,
        geom3d: phieu.kichThuoc?.hUp ? { heightMm: phieu.kichThuoc.hUp } : undefined,
      },
      commerce: {
        brand: phieu.hang ?? undefined,
        sku: phieu.ma,
        materials: phieu.vatLieu.length ? phieu.vatLieu : undefined,
      },
    }),
  };
}

/* ══════════════════════ ⑧ KHOÁ DANH TÍNH HÃNG ══════════════════════════════════════════════ */

/**
 * `system` của `ExternalRef` = tên hãng đã chuẩn hoá (chuỗi tự do, cố ý không enum ⇒ thêm hãng
 * mới KHÔNG phải migrate). `externalId` = mã hãng **giữ nguyên hoa/thường** — nhiều hãng phân
 * biệt (`AB-12a` ≠ `AB-12A`), hạ chữ thường là làm hỏng khoá.
 */
export function khoaDanhTinhHang(hang: string, ma: string): { system: string; externalId: string } | null {
  const system = hang.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const externalId = ma.trim();
  if (!system || !externalId) return null;
  return { system, externalId };
}
