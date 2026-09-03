/**
 * lib/vision/image-spec.ts — IMAGE → SPEC ("Đọc ảnh ra phiếu thông số"), lát v0. THUẦN, test được.
 *
 * Marker: ImageSpec — một ảnh (render/ảnh chụp/ảnh tham khảo) → PHIẾU CÓ CẤU TRÚC gồm 6 mục
 * (không gian · trần/tường/sàn · đồ nội thất · bảng màu · ánh sáng · bố cục), MỖI DÒNG mang
 * xuất xứ + cờ 3 nấc + độ tin cậy KHI ĐO ĐƯỢC:
 *
 *   origin 'pixel' → trangThai 'measured'  — số đọc thẳng từ pixel/hình học (tất định, 0 AI,
 *                                            chạy 10 lần ra 10 kết quả giống nhau).
 *   origin 'vlm'   → trangThai 'inferred'  — máy suy bằng model thị giác, CHỜ người duyệt.
 *                                            `confidence` = null: model không cho số tin cậy
 *                                            đo được → KHÔNG bịa % (luật thanh tiến trình 16/08).
 *   origin 'user'  → trangThai 'verified'  — người đã sửa/xác nhận tay, thắng máy [T5].
 *
 * Nguyên tắc [Đ2] nhìn-vào-trong: KHÔNG viết thuật toán thị giác mới —
 *   · bảng màu     = `quantizeIdMap` (median-cut, lib/render-core/idmask-core)
 *   · bố cục       = `calibrateFromImage` + `horizonFromCalib` (lib/vision, điểm tụ Manhattan)
 *   · PBR nháp     = `inferPbrFromCategory` (lib/materials) cho từng vật liệu máy đọc được
 *   · phiếu 4 cấp  = `emptyReferenceSheet` (lib/grounded-render) — spec CHIẾU xuống phiếu,
 *                    không đẻ phiếu thứ hai; cấp ②④ nay có nguồn điền (đóng nợ "chờ route").
 *
 * Import TƯƠNG ĐỐI để test chạy bằng sucrase-node (cùng quy ước lib/grounded-render).
 */
import type { RgbaImage } from './single-view-metrology';
import { calibrateFromImage } from './single-view-metrology';
import { horizonFromCalib } from './horizon';
import { quantizeIdMap } from '../render-core/idmask-core';
import { inferPbrFromCategory, type InferredPbr } from '../materials/pbr-from-category';
import type { TrangThaiNguon } from '../distill/types';
import { emptyReferenceSheet, REGION_IDS, type ReferenceSheet, type ReferenceSheetLine, type RegionId } from '../grounded-render/types';

/* ───────────────────────────── kiểu ───────────────────────────── */

export type SpecOrigin = 'pixel' | 'vlm' | 'user';

export type SpecSection = 'khong-gian' | 'tran-tuong-san' | 'do-noi-that' | 'bang-mau' | 'anh-sang' | 'bo-cuc';

export const SPEC_SECTION_META: Array<{ section: SpecSection; label: string; labelEn: string }> = [
  { section: 'khong-gian', label: 'Không gian', labelEn: 'Space' },
  { section: 'tran-tuong-san', label: 'Trần / tường / sàn', labelEn: 'Ceiling / walls / floor' },
  { section: 'do-noi-that', label: 'Đồ nội thất & vật liệu', labelEn: 'Furniture & materials' },
  { section: 'bang-mau', label: 'Bảng màu', labelEn: 'Palette' },
  { section: 'anh-sang', label: 'Ánh sáng', labelEn: 'Light' },
  { section: 'bo-cuc', label: 'Bố cục & phối cảnh', labelEn: 'Composition & perspective' },
];

export interface SpecField {
  /** id ổn định 'muc.dong' — người sửa dòng nào máy biết dòng đó. */
  id: string;
  section: SpecSection;
  label: string;
  /** '' = TRỐNG — không nguồn nào nói tới, KHÔNG bịa. */
  value: string;
  /** 0..1 CHỈ khi đo được (pixel/hình học). null = không đo được — không bịa số. */
  confidence: number | null;
  origin: SpecOrigin;
  trangThai: TrangThaiNguon;
  /** id nguồn truy ngược được (imageId, 'pixel', 'vlm:<tier>:<model>', 'manual'). */
  nguon: string[];
  /** số liệu thô đi kèm để UI VẼ (swatch hex, y chân trời…) chứ không chỉ đọc chữ. */
  data?: Record<string, unknown>;
}

/** Tầng AI đã chạy cho phần suy — 'none' PHẢI kèm lý do đọc được (không im lặng). */
export type SpecAiInfo = { tier: 'cloud' | 'local'; model: string } | { tier: 'none'; reason: string };

export interface ImageSpec {
  version: 1;
  imageId: string;
  width: number;
  height: number;
  fields: SpecField[];
  ai: SpecAiInfo;
}

/* ───────────────────────────── tiện ích pixel ───────────────────────────── */

export function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Luma Rec.709, 0..1. */
function luma(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

const ORIGIN_STATE: Record<SpecOrigin, TrangThaiNguon> = { pixel: 'measured', vlm: 'inferred', user: 'verified' };

function field(
  id: string,
  section: SpecSection,
  label: string,
  value: string,
  origin: SpecOrigin,
  nguon: string[],
  confidence: number | null,
  data?: Record<string, unknown>,
): SpecField {
  return { id, section, label, value, confidence, origin, trangThai: ORIGIN_STATE[origin], nguon, ...(data ? { data } : {}) };
}

/** Thống kê một dải ảnh (hàng y0..y1, cột x0..x1) — trung bình màu + luma. Tất định. */
function bandStats(img: RgbaImage, x0: number, x1: number, y0: number, y1: number) {
  let r = 0, g = 0, b = 0, n = 0;
  const { width, data } = img;
  for (let y = Math.max(0, y0); y < Math.min(img.height, y1); y++) {
    for (let x = Math.max(0, x0); x < Math.min(width, x1); x++) {
      const o = (y * width + x) * 4;
      r += data[o] as number;
      g += data[o + 1] as number;
      b += data[o + 2] as number;
      n++;
    }
  }
  if (n === 0) return { r: 0, g: 0, b: 0, luma: 0, n: 0 };
  return { r: r / n, g: g / n, b: b / n, luma: luma(r / n, g / n, b / n), n };
}

/* ───────────────────────────── BẰNG CHỨNG PIXEL (0 AI) ───────────────────────────── */

export const PALETTE_K = 5;

/**
 * Đọc bằng chứng TẤT ĐỊNH từ pixel: bảng màu · ánh sáng (độ sáng · tương phản · nhiệt màu · hướng
 * sáng) · dải màu trên/giữa/dưới · khung ảnh · phối cảnh/chân trời (khi dò được điểm tụ).
 * Không dòng nào ở đây là "nhận dạng vật thể" — chỉ là số đo, và nhãn nói rõ như vậy.
 */
export function pixelEvidence(img: RgbaImage, imageId: string): SpecField[] {
  const out: SpecField[] = [];
  const src = [imageId, 'pixel'];
  const { width: w, height: h, data } = img;
  const n = w * h;
  if (w <= 0 || h <= 0 || data.length < n * 4) {
    throw new Error(`Ảnh không hợp lệ (${w}×${h}, ${data.length} byte) — không đọc được pixel.`);
  }

  // ① Bảng màu — median-cut đã có (tất định). Sắp theo tỉ lệ giảm dần.
  const q = quantizeIdMap(data, w, h, PALETTE_K);
  // Ảnh ít màu hơn k → median-cut trả box rỗng/trùng (share 0, hex trùng): GỘP theo hex, bỏ 0% —
  // không liệt kê màu không có trong ảnh (proof route 02/09 lộ "#beaa8c 0%" hai lần).
  const byHex = new Map<string, number>();
  q.palette.forEach((rgb, i) => {
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
    byHex.set(hex, (byHex.get(hex) ?? 0) + q.share[i]);
  });
  const swatches = [...byHex.entries()]
    .map(([hex, share]) => ({ hex, share }))
    .filter((s) => s.share >= 0.005)
    .sort((a, b) => b.share - a.share);
  out.push(
    field(
      'bang-mau.chu-dao',
      'bang-mau',
      `Bảng màu chủ đạo (${swatches.length} màu, median-cut)`,
      swatches.map((s) => `${s.hex} ${Math.round(s.share * 100)}%`).join(' · '),
      'pixel',
      src,
      1,
      { swatches },
    ),
  );

  // ② Ánh sáng — luma trung bình, độ lệch chuẩn, cân bằng ấm/lạnh, chênh sáng trái/phải + trên/dưới.
  let sumL = 0, sumL2 = 0, sumR = 0, sumB = 0;
  const stride = Math.max(1, Math.floor(n / 65536));
  let cnt = 0;
  for (let i = 0; i < n; i += stride) {
    const o = i * 4;
    const L = luma(data[o] as number, data[o + 1] as number, data[o + 2] as number);
    sumL += L;
    sumL2 += L * L;
    sumR += data[o] as number;
    sumB += data[o + 2] as number;
    cnt++;
  }
  const meanL = sumL / cnt;
  const stdL = Math.sqrt(Math.max(0, sumL2 / cnt - meanL * meanL));
  const warmth = (sumR - sumB) / cnt / 255; // >0 ấm, <0 lạnh
  const doSang = meanL < 0.3 ? 'tối' : meanL > 0.6 ? 'sáng' : 'vừa';
  out.push(field('anh-sang.do-sang', 'anh-sang', 'Độ sáng tổng thể', `${doSang} (luma trung bình ${meanL.toFixed(2)})`, 'pixel', src, 1, { meanLuma: meanL }));
  const tuongPhan = stdL < 0.12 ? 'thấp' : stdL > 0.25 ? 'cao' : 'vừa';
  out.push(field('anh-sang.tuong-phan', 'anh-sang', 'Tương phản', `${tuongPhan} (σ luma ${stdL.toFixed(2)})`, 'pixel', src, 1, { stdLuma: stdL }));
  const nhietMau = warmth > 0.04 ? 'ấm' : warmth < -0.04 ? 'lạnh' : 'trung tính';
  out.push(field('anh-sang.nhiet-mau', 'anh-sang', 'Nhiệt màu (cân bằng R−B)', `${nhietMau} (${warmth >= 0 ? '+' : ''}${warmth.toFixed(2)})`, 'pixel', src, 1, { warmth }));

  const third = Math.max(1, Math.floor(w / 3));
  const left = bandStats(img, 0, third, 0, h).luma;
  const right = bandStats(img, w - third, w, 0, h).luma;
  const top = bandStats(img, 0, w, 0, Math.max(1, Math.floor(h / 3))).luma;
  const bottom = bandStats(img, 0, w, h - Math.max(1, Math.floor(h / 3)), h).luma;
  const dLR = left - right;
  const dTB = top - bottom;
  const parts: string[] = [];
  if (Math.abs(dLR) > 0.06) parts.push(dLR > 0 ? 'sáng hơn phía trái' : 'sáng hơn phía phải');
  if (Math.abs(dTB) > 0.06) parts.push(dTB > 0 ? 'sáng hơn phía trên' : 'sáng hơn phía dưới');
  const huongConf = Math.min(1, Math.max(Math.abs(dLR), Math.abs(dTB)) / 0.25);
  out.push(
    field(
      'anh-sang.huong-sang',
      'anh-sang',
      'Hướng sáng (phân bố luma theo dải)',
      parts.length ? parts.join(', ') : 'phân bố đều — không rõ hướng',
      'pixel',
      src,
      Number(huongConf.toFixed(2)),
      { dLR, dTB },
    ),
  );

  // ③ Dải màu trên/giữa/dưới — VỊ TRÍ ẢNH, nhãn nói rõ không phải nhận dạng trần/sàn.
  const bandH = Math.max(1, Math.floor(h * 0.2));
  const bTop = bandStats(img, 0, w, 0, bandH);
  const bMid = bandStats(img, 0, w, Math.floor(h * 0.4), Math.floor(h * 0.6));
  const bBot = bandStats(img, 0, w, h - bandH, h);
  const hexOf = (s: { r: number; g: number; b: number }) => rgbToHex(s.r, s.g, s.b);
  out.push(
    field(
      'tran-tuong-san.dai-anh',
      'tran-tuong-san',
      'Màu trung bình dải ảnh trên / giữa / dưới (vị trí ảnh, chưa nhận dạng mặt)',
      `trên ${hexOf(bTop)} · giữa ${hexOf(bMid)} · dưới ${hexOf(bBot)}`,
      'pixel',
      src,
      1,
      { top: hexOf(bTop), mid: hexOf(bMid), bottom: hexOf(bBot) },
    ),
  );

  // ④ Khung ảnh.
  const ratio = w / h;
  const huong = ratio > 1.05 ? 'ngang' : ratio < 0.95 ? 'dọc' : 'vuông';
  out.push(field('bo-cuc.khung', 'bo-cuc', 'Khung ảnh', `${huong} ${w}×${h} (tỉ lệ ${ratio.toFixed(2)})`, 'pixel', src, 1, { width: w, height: h, ratio }));

  // ⑤ Phối cảnh + chân trời — hiệu chỉnh điểm tụ Manhattan sẵn có. Không dò được → dòng TRỐNG
  //    kèm lý do trong data (không bịa đường thay thế, đúng luật horizon.ts).
  const calib = calibrateFromImage(img);
  if ('needsManualScale' in calib) {
    out.push(field('bo-cuc.phoi-canh', 'bo-cuc', 'Phối cảnh (điểm tụ)', '', 'pixel', src, null, { reason: calib.reason }));
  } else {
    const f35 = (calib.focalLengthPx / Math.max(w, h)) * 36; // quy 35mm theo cạnh dài
    out.push(
      field(
        'bo-cuc.phoi-canh',
        'bo-cuc',
        'Phối cảnh (điểm tụ)',
        `3 điểm tụ Manhattan · tiêu cự ≈ ${Math.round(calib.focalLengthPx)}px (≈ ${Math.round(f35)}mm quy 35mm)`,
        'pixel',
        src,
        Number(calib.confidence.toFixed(2)),
        { focalLengthPx: calib.focalLengthPx, vanishingPoints: calib.vanishingPoints },
      ),
    );
    const hz = horizonFromCalib(calib);
    if (hz) {
      const yMid = (hz.y0 + hz.y1) / 2;
      out.push(
        field(
          'bo-cuc.chan-troi',
          'bo-cuc',
          'Đường chân trời (máy suy)',
          `y ≈ ${Math.round(yMid * 100)}% chiều cao ảnh${Math.abs(hz.y0 - hz.y1) > 0.02 ? ' (nghiêng)' : ''}`,
          'pixel',
          src,
          Number(hz.confidence.toFixed(2)),
          { y0: hz.y0, y1: hz.y1 },
        ),
      );
    }
  }
  return out;
}

/* ───────────────────────────── ĐỌC BẰNG MODEL THỊ GIÁC (VLM) ───────────────────────────── */

/** Shape JSON kỳ vọng từ VLM — bao trọn 4 khối của `draftReferenceSheetPrompt` + 3 khối mới. */
export interface VlmReading {
  tongThe: { tone: string; anhSang: string; nuocHinh: string };
  tranTuongSan: { tran: string; tuong: string; san: string };
  vatLieu: string[];
  chiTiet: string[];
  loaiPhong: string;
  phongCach: string;
  doNoiThat: string[];
}

/** Prompt cho VLM — CHỈ JSON, 7 khối, không markdown. Đây là bản ĐẦY ĐỦ của prompt 4 cấp. */
export function imageSpecPrompt(): string {
  return (
    'Bạn là chuyên gia nội thất. Đọc ảnh và CHỈ trả JSON thuần (không giải thích, không markdown, không ```): ' +
    '{"loaiPhong":"<loại không gian>","phongCach":"<phong cách>",' +
    '"tongThe":{"tone":"<tone & không khí>","anhSang":"<nguồn/hướng/nhiệt độ ánh sáng>","nuocHinh":"<nước hình/finish>"},' +
    '"tranTuongSan":{"tran":"<vật liệu + sắc độ trần>","tuong":"<vật liệu + sắc độ tường>","san":"<vật liệu + sắc độ sàn>"},' +
    '"vatLieu":["<vật liệu chính>","..."],' +
    '"doNoiThat":["<món đồ nội thất thấy được>","..."],' +
    '"chiTiet":["<chi tiết/cấu kiện/điểm nhấn đáng chú ý>","..."]} ' +
    '— không biết thì để chuỗi rỗng "" hoặc mảng rỗng [], KHÔNG đoán bừa.'
  );
}

const str = (v: unknown, max = 240): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arr = (v: unknown, max = 12): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, 120)).filter(Boolean).slice(0, max) : [];

/** Rút JSON từ chuỗi VLM (chịu được chữ thừa/```json). Lỗi → `{ error }` chữ rõ, KHÔNG phiếu rỗng lặng lẽ. */
export function parseVlmReading(raw: string): { reading?: VlmReading; error?: string } {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { error: 'Model thị giác không trả JSON (không tìm thấy {…}).' };
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(m[0]) as Record<string, unknown>;
  } catch {
    return { error: 'JSON từ model thị giác hỏng — không phân tích được.' };
  }
  const tt = (j.tongThe ?? {}) as Record<string, unknown>;
  const tts = (j.tranTuongSan ?? {}) as Record<string, unknown>;
  const reading: VlmReading = {
    tongThe: { tone: str(tt.tone), anhSang: str(tt.anhSang), nuocHinh: str(tt.nuocHinh) },
    tranTuongSan: { tran: str(tts.tran), tuong: str(tts.tuong), san: str(tts.san) },
    vatLieu: arr(j.vatLieu),
    chiTiet: arr(j.chiTiet),
    loaiPhong: str(j.loaiPhong ?? j.room),
    phongCach: str(j.phongCach ?? j.style),
    doNoiThat: arr(j.doNoiThat),
  };
  return { reading };
}

/**
 * Ghép bản đọc VLM vào danh sách dòng: mọi dòng origin 'vlm' · 'inferred' · confidence null ·
 * nguồn [imageId, 'vlm:<tier>:<model>']. Giá trị RỖNG thì KHÔNG tạo dòng (không có dòng giả).
 */
export function mergeVlmReading(
  fields: SpecField[],
  r: VlmReading,
  meta: { imageId: string; tier: 'cloud' | 'local'; model: string },
): SpecField[] {
  const src = [meta.imageId, `vlm:${meta.tier}:${meta.model}`];
  const add = (id: string, section: SpecSection, label: string, value: string, data?: Record<string, unknown>) => {
    if (!value.trim()) return;
    out.push(field(id, section, label, value, 'vlm', src, null, data));
  };
  const out: SpecField[] = fields.filter((f) => f.origin !== 'vlm');
  add('khong-gian.loai-phong', 'khong-gian', 'Loại không gian', r.loaiPhong);
  add('khong-gian.phong-cach', 'khong-gian', 'Phong cách', r.phongCach);
  add('khong-gian.tone', 'khong-gian', 'Tone & không khí', r.tongThe.tone);
  add('khong-gian.nuoc-hinh', 'khong-gian', 'Nước hình / finish', r.tongThe.nuocHinh);
  add('anh-sang.mo-ta', 'anh-sang', 'Ánh sáng (máy đọc ảnh)', r.tongThe.anhSang);
  add('tran-tuong-san.tran', 'tran-tuong-san', 'Trần', r.tranTuongSan.tran);
  add('tran-tuong-san.tuong', 'tran-tuong-san', 'Tường', r.tranTuongSan.tuong);
  add('tran-tuong-san.san', 'tran-tuong-san', 'Sàn', r.tranTuongSan.san);
  add('do-noi-that.vat-lieu', 'do-noi-that', 'Vật liệu chính', r.vatLieu.join(' · '), { items: r.vatLieu });
  add('do-noi-that.danh-sach', 'do-noi-that', 'Đồ nội thất thấy được', r.doNoiThat.join(' · '), { items: r.doNoiThat });
  add('do-noi-that.chi-tiet', 'do-noi-that', 'Chi tiết / điểm nhấn', r.chiTiet.join(' · '), { items: r.chiTiet });
  return out;
}

/* ───────────────────────────── spec: dựng · sửa tay · mã hoá ───────────────────────────── */

export function buildImageSpec(opts: { imageId: string; width: number; height: number; fields: SpecField[]; ai: SpecAiInfo }): ImageSpec {
  return { version: 1, imageId: opts.imageId, width: opts.width, height: opts.height, fields: opts.fields, ai: opts.ai };
}

/** Người sửa một dòng → dòng đó thành 'user'/'verified'/nguon ['manual'] (thắng máy [T5]).
 * Dòng chưa có (id mới) thì thêm vào đúng section suy từ tiền tố id. Trả spec MỚI, không mutate. */
export function setFieldByUser(spec: ImageSpec, id: string, value: string, label?: string): ImageSpec {
  const fields = spec.fields.slice();
  const i = fields.findIndex((f) => f.id === id);
  if (i >= 0) {
    const f = fields[i];
    fields[i] = { ...f, value, origin: 'user', trangThai: 'verified', confidence: null, nguon: ['manual'] };
  } else {
    const section = (id.split('.')[0] as SpecSection) || 'khong-gian';
    fields.push(field(id, section, label ?? id, value, 'user', ['manual'], null));
  }
  return { ...spec, fields };
}

export function encodeImageSpec(spec: ImageSpec): string {
  return JSON.stringify(spec, null, 2);
}

const SECTIONS = new Set<string>(SPEC_SECTION_META.map((m) => m.section));
const ORIGINS = new Set<string>(['pixel', 'vlm', 'user']);

/** Chuỗi (có thể do người sửa) → spec. `{ error }` chữ rõ khi hỏng — không trả spec rỗng lặng lẽ. */
export function decodeImageSpec(text: string): { spec?: ImageSpec; error?: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: 'Phiếu thông số không phải JSON hợp lệ.' };
  }
  const j = raw as Partial<ImageSpec>;
  if (j.version !== 1 || !Array.isArray(j.fields)) return { error: 'Phiếu thông số sai cấu trúc (cần {version:1, fields:[…]}).' };
  const fields: SpecField[] = [];
  for (const f of j.fields as Partial<SpecField>[]) {
    if (typeof f.id !== 'string' || !SECTIONS.has(String(f.section))) return { error: `Dòng hỏng (id "${String(f.id)}").` };
    const origin: SpecOrigin = ORIGINS.has(String(f.origin)) ? (f.origin as SpecOrigin) : 'vlm';
    const conf = typeof f.confidence === 'number' && Number.isFinite(f.confidence) ? Math.max(0, Math.min(1, f.confidence)) : null;
    fields.push({
      id: f.id,
      section: f.section as SpecSection,
      label: typeof f.label === 'string' ? f.label : f.id,
      value: typeof f.value === 'string' ? f.value : '',
      confidence: origin === 'pixel' ? conf : null,
      origin,
      trangThai: ORIGIN_STATE[origin],
      nguon: Array.isArray(f.nguon) ? f.nguon.map(String) : [],
      ...(f.data && typeof f.data === 'object' ? { data: f.data as Record<string, unknown> } : {}),
    });
  }
  const ai: SpecAiInfo =
    j.ai && (j.ai.tier === 'cloud' || j.ai.tier === 'local') && typeof (j.ai as { model?: unknown }).model === 'string'
      ? { tier: j.ai.tier, model: (j.ai as { model: string }).model }
      : { tier: 'none', reason: (j.ai as { reason?: string } | undefined)?.reason ?? 'không rõ tầng AI' };
  return {
    spec: {
      version: 1,
      imageId: typeof j.imageId === 'string' ? j.imageId : 'anh',
      width: Number(j.width) || 0,
      height: Number(j.height) || 0,
      fields,
      ai,
    },
  };
}

/* ───────────────────────────── CHIẾU RA CHỖ DÙNG ───────────────────────────── */

export function originLabel(f: SpecField): string {
  if (f.origin === 'user') return 'đã sửa tay';
  if (f.origin === 'pixel') return f.confidence === null ? 'đo pixel — không dò được' : `đo pixel${f.confidence < 1 ? ` · tin cậy ${Math.round(f.confidence * 100)}%` : ''}`;
  return 'máy suy — chờ duyệt';
}

/** Spec → văn bản người đọc, nhóm 6 mục; dòng trống ghi rõ + lý do nếu có. */
export function specToText(spec: ImageSpec): string {
  const out: string[] = [];
  const ai = spec.ai.tier === 'none' ? `Tầng AI: không chạy — ${spec.ai.reason}` : `Tầng AI: ${spec.ai.tier} · ${spec.ai.model}`;
  out.push(`Ảnh ${spec.imageId} · ${spec.width}×${spec.height} · ${ai}`);
  for (const m of SPEC_SECTION_META) {
    const fs = spec.fields.filter((f) => f.section === m.section);
    if (fs.length === 0) continue;
    out.push(m.label);
    for (const f of fs) {
      const reason = !f.value && f.data && typeof f.data.reason === 'string' ? ` — ${f.data.reason}` : '';
      out.push(`  ${f.label}: ${f.value || `(trống${reason})`}  [${originLabel(f)}]`);
    }
  }
  return out.join('\n');
}

function val(spec: ImageSpec, id: string): SpecField | undefined {
  return spec.fields.find((f) => f.id === id);
}

/**
 * Spec → PHIẾU ĐỌC 4 CẤP của Grounded Render (lib/grounded-render). Điền ĐỦ 4 cấp khi có nguồn:
 * cấp ①③ từ VLM/người, cấp ② từ VLM, cấp ④ từ VLM; thêm dòng ánh sáng/bảng màu/bố cục từ pixel.
 * Cờ phiếu chỉ có 'inferred'|'verified' (đọc ảnh không bao giờ 'measured' theo hợp đồng phiếu) —
 * dòng 'user' → 'verified', còn lại 'inferred'. Không chép nội dung phiếu, chỉ chiếu.
 */
export function specToReferenceSheet(spec: ImageSpec): ReferenceSheet {
  const sheet = emptyReferenceSheet(spec.imageId);
  const byId = new Map<string, ReferenceSheetLine>(sheet.lines.map((l) => [l.id, l]));
  const put = (lineId: string, f: SpecField | undefined, muc: ReferenceSheetLine['muc'], label: string) => {
    if (!f || !f.value.trim()) return;
    const line = byId.get(lineId);
    const flag = f.origin === 'user' ? 'verified' : 'inferred';
    if (line) {
      line.value = f.value;
      line.flag = flag;
      line.nguon = f.nguon;
    } else {
      const nl: ReferenceSheetLine = { id: lineId, muc, label, value: f.value, flag, nguon: f.nguon };
      sheet.lines.push(nl);
      byId.set(lineId, nl);
    }
  };
  put('tong-the.tone', val(spec, 'khong-gian.tone'), 'tong-the', 'Tone & không khí');
  put('tong-the.phong-cach', val(spec, 'khong-gian.phong-cach'), 'tong-the', 'Phong cách');
  put('tong-the.loai-phong', val(spec, 'khong-gian.loai-phong'), 'tong-the', 'Loại không gian');
  put('tong-the.anh-sang', val(spec, 'anh-sang.mo-ta'), 'tong-the', 'Ánh sáng (máy đọc)');
  put('tong-the.nhiet-mau', val(spec, 'anh-sang.nhiet-mau'), 'tong-the', 'Nhiệt màu (đo pixel)');
  put('tong-the.bang-mau', val(spec, 'bang-mau.chu-dao'), 'tong-the', 'Bảng màu (đo pixel)');
  put('tong-the.phoi-canh', val(spec, 'bo-cuc.phoi-canh'), 'tong-the', 'Phối cảnh (đo hình học)');
  put('tran-tuong-san.tran', val(spec, 'tran-tuong-san.tran'), 'tran-tuong-san', 'Trần');
  put('tran-tuong-san.tuong', val(spec, 'tran-tuong-san.tuong'), 'tran-tuong-san', 'Tường');
  put('tran-tuong-san.san', val(spec, 'tran-tuong-san.san'), 'tran-tuong-san', 'Sàn');
  put('vat-lieu.chinh', val(spec, 'do-noi-that.vat-lieu'), 'vat-lieu', 'Vật liệu chính');
  put('chi-tiet.diem-nhan', val(spec, 'do-noi-that.chi-tiet'), 'chi-tiet', 'Chi tiết / điểm nhấn');
  put('chi-tiet.do-noi-that', val(spec, 'do-noi-that.danh-sach'), 'chi-tiet', 'Đồ nội thất thấy được');
  return sheet;
}

export interface MaterialDraft {
  ten: string;
  /** PBR nháp — LUÔN suyDoan:true (rule of thumb, chưa đo). */
  pbr: InferredPbr;
  nguon: string[];
}

/** Vật liệu máy/người đọc được → PBR nháp cho chặng 3D (khởi tạo, chưa phải đo). Không có → []. */
export function materialDrafts(spec: ImageSpec): MaterialDraft[] {
  const f = val(spec, 'do-noi-that.vat-lieu');
  if (!f || !f.value.trim()) return [];
  const items = Array.isArray(f.data?.items) && f.origin !== 'user'
    ? (f.data!.items as string[])
    : f.value.split(/\s*[·,;]\s*/).map((s) => s.trim()).filter(Boolean);
  return items.map((ten) => ({ ten, pbr: inferPbrFromCategory(ten), nguon: f.nguon }));
}

export interface RegionInstruction {
  regionId: RegionId;
  label: string;
  instruction: string;
  nguon: string[];
}

/** Trần/tường/sàn đã đọc → chỉ dẫn cho từng MẢNG của Render bám ý (RegionId sẵn có). Trống → bỏ. */
export function regionInstructions(spec: ImageSpec): RegionInstruction[] {
  const map: Array<[string, RegionId[]]> = [
    ['tran-tuong-san.san', ['san']],
    ['tran-tuong-san.tuong', ['tuong-trai', 'tuong-phai', 'tuong-cuoi']],
    ['tran-tuong-san.tran', ['tran']],
  ];
  const out: RegionInstruction[] = [];
  for (const [id, regions] of map) {
    const f = val(spec, id);
    if (!f || !f.value.trim()) continue;
    for (const regionId of regions) {
      const meta = REGION_IDS.find((r) => r.id === regionId);
      out.push({ regionId, label: meta?.label ?? regionId, instruction: f.value, nguon: f.nguon });
    }
  }
  return out;
}
