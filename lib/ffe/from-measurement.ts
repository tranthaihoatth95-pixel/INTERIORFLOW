/**
 * lib/ffe/from-measurement.ts — đọc kết quả cổng `measurement` của khối "Ghi kích thước"
 * (`vision.measureobject`, `lib/nodes/defs/metrology.ts`) thành các trường của MỘT `FfeItem`.
 *
 * Vì sao cần: khối đo xuất ra CHỮ — một cục JSON `TieredMeasurement` (`lib/vision/single-view-
 * metrology.ts`) — chứ không xuất ra món. Trước 06/08 không ai đọc cục JSON đó thành dòng bảng
 * nên người dùng phải nhìn màn hình rồi gõ lại 3 con số vào Excel (G-M3-01).
 *
 * ⛔ KHÔNG import `lib/vision/**` vào đây (vùng file khác + file đó kéo theo cả bộ tính hình học).
 * Chỉ khai lại ĐÚNG hình dạng cần đọc, và đọc PHÒNG THỦ: thiếu trường nào thì bỏ trường đó, tuyệt
 * đối không ném lỗi giữa lượt chạy (JSON đến từ node khác, phiên bản có thể lệch).
 *
 * File THUẦN: không React/DOM/fetch.
 */
import type { FfeConfidence } from './item';

/** Đúng hình dạng `MeasurementValue` bên `single-view-metrology.ts` — khai lại, không import. */
interface MeasuredValueShape {
  valueMm?: unknown;
  toleranceMm?: unknown;
  kind?: unknown;
  basis?: unknown;
}

/** Phần của `TieredMeasurement` + phần `vision.measureobject` bọc thêm (aiTier/warnings…). */
interface MeasurementPayloadShape {
  width?: MeasuredValueShape;
  depth?: MeasuredValueShape;
  height?: MeasuredValueShape;
  tierLabel?: unknown;
  confidencePercent?: unknown;
}

/** Các trường suy được từ 1 lần đo — ghép vào `makeFfeItem({...})`. */
export interface MeasurementFields {
  w?: number;
  d?: number;
  hUp?: number;
  confidence?: FfeConfidence;
  confidenceBasis?: string;
}

function mm(v: MeasuredValueShape | undefined): number | undefined {
  const n = typeof v?.valueMm === 'number' ? v.valueMm : NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

/**
 * Mức tin của CẢ MÓN = mức YẾU NHẤT trong 3 chiều — một món có rộng/cao đo được nhưng sâu chỉ
 * suy đoán thì cả dòng vẫn là SUY ĐOÁN, không được khoe 🟢. (Luật K3: suy thì gắn cờ, không giấu.)
 * Không chiều nào đọc được ⇒ `undefined` (chưa biết), KHÁC 'inferred' (đã suy ra được số).
 */
export function parseMeasurementPayload(raw: unknown): MeasurementFields {
  if (typeof raw !== 'string' || !raw.trim().startsWith('{')) return {};
  let p: MeasurementPayloadShape;
  try {
    p = JSON.parse(raw) as MeasurementPayloadShape;
  } catch {
    return {};
  }
  const out: MeasurementFields = {
    w: mm(p.width),
    d: mm(p.depth),
    hUp: mm(p.height),
  };
  const kinds = [p.width?.kind, p.depth?.kind, p.height?.kind].filter(
    (k): k is 'measured' | 'inferred' => k === 'measured' || k === 'inferred',
  );
  if (kinds.length > 0) {
    out.confidence = kinds.includes('inferred') ? 'inferred' : 'measured';
    const tier = typeof p.tierLabel === 'string' ? p.tierLabel : '';
    const pct = typeof p.confidencePercent === 'number' ? `${Math.round(p.confidencePercent)}%` : '';
    const basis = [tier, pct && `độ tin ${pct}`].filter(Boolean).join(' · ');
    if (basis) out.confidenceBasis = basis;
  }
  return out;
}

/** Tách chuỗi người dùng gõ ("gỗ sồi, vải lanh") thành mảng vật liệu — dùng chung cho node lẫn
 * cửa nhập bảng, để hai đường vào KHÔNG tách kiểu khác nhau. */
export function splitMaterials(raw: string | null | undefined): string[] | undefined {
  if (!raw) return undefined;
  const arr = raw
    .split(/[,;/|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length > 0 ? arr : undefined;
}

/** Chuẩn hoá mã màu người gõ: '#abc' / 'abc' / '#AABBCC' → '#aabbcc'. Không đúng dạng ⇒
 * `undefined` (thà không có màu còn hơn có màu sai — swatch sai gây đặt nhầm hàng). */
export function normalizeColorHex(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  if (/^[0-9a-f]{6}$/.test(s)) return `#${s}`;
  return undefined;
}
