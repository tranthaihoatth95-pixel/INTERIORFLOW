/**
 * lib/cad/element-infer.ts — SUY `elementType` TỪ TÊN LAYER (A5 · GAP `G-M1-09`, 06/08).
 *
 * Vì sao có file này: đo trên hồ sơ mặt bằng thật, **0/12.274 entity có `elementType`** sau khi
 * nạp DXF ⇒ toàn bộ mặt bằng là đường rời, app không biết đâu là cột/tường/lõi, nên mọi ràng
 * buộc chia khu ("không cắt vách ngang cột") không có gì để bám.
 *
 * ⛔ **ĐÂY LÀ BỘ SUY DUY NHẤT — không viết bộ thứ ba.** Trước file này repo đã có 2 chỗ đoán theo
 * tên layer, và CẢ HAI GIỮ NGUYÊN, không bị file này đụng vào:
 *   1. `lib/three/cad-to-obj.ts` `wallLayerIds()` (`/tường|wall/i`) — suy TẠM lúc dựng 3D cho
 *      entity CHƯA có `elementType`. Sau A5 nó gần như không còn phải chạy (entity nạp từ DXF đã
 *      có `elementType`), nhưng vẫn phải còn cho `.idf` cũ. Luật của nó KHÔNG đổi.
 *   2. `lib/cad/dxf-plan.ts` `DEFAULT_STRUCTURE_LAYERS`/`DEFAULT_CORE_LAYERS`/`DEFAULT_GRID_LAYERS`
 *      — đó là DANH SÁCH LAYER cho việc khác (khoanh cụm vẽ chính / lõi cứng), không phải bảng
 *      ánh xạ sang `ElementType`. Hai việc khác nhau, cố ý không trộn.
 *
 * ⚠️ **TÊN LAYER LÀ QUY ƯỚC CỦA TỪNG BỘ HỒ SƠ, KHÔNG PHẢI CHUẨN NGÀNH** (đúng cảnh báo đầu
 * `dxf-plan.ts`). Vì vậy bảng luật là **THAM SỐ truyền đè được** (`inferElementTypes(doc, rules)`),
 * KHÔNG hardcode vào thuật toán. Bộ mặc định dưới đây rút từ tên layer gặp thật + từ khoá Việt/Anh
 * phổ thông; studio khác dùng quy ước khác thì truyền bảng của họ vào, không phải sửa code.
 *
 * ⛔ **LUẬT K3 — SUY ĐOÁN PHẢI LỘ RA.** Mọi entity được gán ở đây đều mang kèm `inferred: true`
 * (`Base.inferred`, `model.ts`). Entity ĐÃ CÓ `elementType` (người khai, hoặc XDATA `IF_ELEMTYPE`
 * đọc lại từ file do chính IF ghi) thì **KHÔNG BAO GIỜ bị đè** — khai báo thắng suy đoán.
 *
 * THUẦN (không React/DOM) — test: `node_modules/.bin/sucrase-node lib/cad/element-infer.test.ts`
 */

import type { Doc, ElementType, Entity } from './model';

/** Một luật suy: tên layer chứa TOKEN nào thì entity trên layer đó là loại gì. */
export interface ElementInferRule {
  /** nhãn tiếng Việt để báo cáo/nhật ký — KHÔNG dùng để so khớp. */
  label: string;
  /**
   * Kết quả gán. `null` có nghĩa riêng của `ElementType`: "đã kiểm, KHÔNG phải phần tử BIM"
   * (layer ghi chú/kích thước/khung tên) — khác hẳn `undefined` = "chưa xét".
   */
  elementType: ElementType;
  /**
   * Token so khớp. Tên layer được chuẩn hoá (bỏ dấu tiếng Việt, thường hoá) rồi CẮT theo
   * `-` `_` `.` khoảng trắng; khớp khi CÓ ÍT NHẤT MỘT token của layer TRÙNG KHÍT một token ở đây.
   *
   * Cố ý so TRÙNG KHÍT token, KHÔNG so chuỗi con — đó đúng là con đường đã đẻ ra bug ghép cột
   * `G-M3-06` ("Phòng" lọt vào ô "Cao" vì khớp chuỗi con bằng chữ cái đơn).
   */
  tokens: string[];
}

/**
 * Bảng luật MẶC ĐỊNH. **Thứ tự có ý nghĩa: luật ĐẦU TIÊN khớp thì thắng.**
 *
 * Ghi chú/kích thước đứng TRƯỚC có chủ đích: layer kiểu `A-Wall-Dim` là chữ ghi trên tường, không
 * phải tường — annotation phải thắng.
 *
 * Cố ý KHÔNG có luật cho `stair` (thang) · `wc` · `louv` (lam): `ElementType` của IF hiện KHÔNG
 * có IfcStair/IfcSanitaryTerminal/IfcShadingDevice, mà phiếu cấm khai enum mới. Gán bừa chúng
 * vào `slab`/`furniture` là bịa ngữ nghĩa ⇒ để `undefined` (chưa xét) — đúng K3. Việc khoanh lõi
 * cứng (thang/WC) đã có đường riêng ở `dxf-plan.ts` `DEFAULT_CORE_LAYERS`.
 *
 * Cũng cố ý KHÔNG có token `hatch`: đo trên hồ sơ thật, layer `A-Hatch` chứa poché tường chứ
 * không phải ghi chú. Gán nó `null` ("không phải phần tử BIM") sẽ CHẶN luôn đường đùn tường 3D
 * (`cad-to-obj.ts` nghe `elementType` trước tên layer) — đúng kiểu "sửa 1 chỗ vỡ chỗ khác". Vùng
 * tô là KỸ THUẬT THỂ HIỆN, không phải một loại cấu kiện; để `undefined` là câu trả lời đúng.
 */
export const DEFAULT_ELEMENT_INFER_RULES: ElementInferRule[] = [
  {
    label: 'ghi chú · không phải phần tử BIM',
    elementType: null,
    tokens: [
      'dim', 'dims', 'dimension', 'dimtruc', 'text', 'txt', 'note', 'notes', 'ghichu',
      'anno', 'annotation', 'label', 'leader', 'title', 'khungten', 'tenban',
      'axis', 'truc', 'grid', 'luoi', 'defpoints',
    ],
  },
  { label: 'cột', elementType: 'column', tokens: ['col', 'cols', 'column', 'columns', 'cot'] },
  { label: 'dầm', elementType: 'beam', tokens: ['beam', 'beams', 'dam'] },
  { label: 'cửa đi', elementType: 'door', tokens: ['door', 'doors', 'cuadi'] },
  { label: 'cửa sổ', elementType: 'window', tokens: ['window', 'windows', 'cuaso'] },
  // 'par' = partition (vách ngăn) — bộ hồ sơ thật dùng `A-Par-Glass`/`E-Par-Glass` cho vách kính.
  { label: 'tường · vách', elementType: 'wall', tokens: ['wall', 'walls', 'tuong', 'vach', 'partition', 'par'] },
  { label: 'sàn', elementType: 'slab', tokens: ['slab', 'slabs', 'floor', 'san'] },
  { label: 'phòng · không gian', elementType: 'space', tokens: ['room', 'rooms', 'phong', 'space'] },
  { label: 'nội thất', elementType: 'furniture', tokens: ['furn', 'furniture', 'noithat', 'ffe', 'fnt'] },
];

/** Bỏ dấu tiếng Việt + thường hoá. `đ` không nằm trong dải dấu tổ hợp nên phải xử riêng. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

/** Cắt tên layer thành token: `'A-Par_Glass 2'` → `['a','par','glass','2']`. */
export function layerTokens(layerName: string): string[] {
  return normalize(layerName).split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Luật ĐẦU TIÊN khớp tên layer — `undefined` = không luật nào khớp (KHÔNG đoán bừa).
 * Tách riêng khỏi `inferElementTypes` để test được từng tên layer mà không phải dựng cả `Doc`.
 */
export function matchElementRule(
  layerName: string,
  rules: ElementInferRule[] = DEFAULT_ELEMENT_INFER_RULES,
): ElementInferRule | undefined {
  const toks = new Set(layerTokens(layerName));
  if (!toks.size) return undefined;
  for (const r of rules) {
    for (const t of r.tokens) if (toks.has(t)) return r;
  }
  return undefined;
}

/** Kết quả một lượt suy — số liệu để báo cáo nạp nói thẳng "đã đoán bao nhiêu, đoán ra gì". */
export interface ElementInferResult {
  doc: Doc;
  /** số entity VỪA được gán ở lượt này (đều mang `inferred: true`). */
  inferredCount: number;
  /** số entity ĐÃ CÓ `elementType` khai báo từ trước ⇒ được giữ nguyên, không đè. */
  declaredCount: number;
  /** `elementType` (hoặc `'null'`) → số entity vừa gán. */
  byType: Record<string, number>;
  /** tên layer → nhãn luật đã khớp. Để người dùng soi "layer này bị đoán thành gì". */
  byLayer: Record<string, string>;
}

/**
 * Gán `elementType` + `inferred: true` cho mọi entity mà layer khớp luật.
 *
 * Trả `Doc` MỚI (không sửa tại chỗ) — cùng khuôn `syncHostedOpenings` (`hosting.ts`). Entity không
 * khớp luật nào, hoặc đã có `elementType` sẵn, đều trả về NGUYÊN OBJECT CŨ (giữ tham chiếu) để
 * không tạo rác cho bản vẽ hàng vạn hình.
 */
export function inferElementTypes(
  doc: Doc,
  rules: ElementInferRule[] = DEFAULT_ELEMENT_INFER_RULES,
): ElementInferResult {
  const nameOf = new Map(doc.layers.map((l) => [l.id, l.name]));
  const ruleCache = new Map<string, ElementInferRule | undefined>();
  const byType: Record<string, number> = {};
  const byLayer: Record<string, string> = {};
  let inferredCount = 0;
  let declaredCount = 0;

  const entities: Entity[] = doc.entities.map((e) => {
    // Khai báo THẮNG suy đoán — không đè, không đếm vào `inferredCount`.
    if (e.elementType !== undefined) { declaredCount += 1; return e; }
    const layerName = nameOf.get(e.layer) ?? e.layer;
    if (!ruleCache.has(layerName)) ruleCache.set(layerName, matchElementRule(layerName, rules));
    const rule = ruleCache.get(layerName);
    if (!rule) return e;
    const key = rule.elementType === null ? 'null' : rule.elementType;
    byType[key] = (byType[key] ?? 0) + 1;
    byLayer[layerName] = rule.label;
    inferredCount += 1;
    return { ...e, elementType: rule.elementType, inferred: true } as Entity;
  });

  return { doc: { ...doc, entities }, inferredCount, declaredCount, byType, byLayer };
}
