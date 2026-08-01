/**
 * lib/cad/plan-drawon.ts — V1 (bậc 1 `docs/SPEC-VIDEO-MAT-BANG.md` §1 "Draw-on plan"): xếp
 * `Entity[]` của 1 mặt bằng thành 5 đợt draw-on theo `elementType` (bảng §1.1), rồi tính mốc thời
 * gian cho TỪNG entity bằng cách TÁI DÙNG `computeElementRevealTimings()`
 * (`lib/present-editor/motion-present.ts:153`) — KHÔNG viết công thức stagger mới (§1.2).
 *
 * Hàm THUẦN — không import React/Next/DOM, test được bằng sucrase-node. `computeElementRevealTimings`
 * chỉ đọc `id`/`revealOrder`/`revealDelay`/`elementReveal` của mỗi phần tử (xem file đó) nên object
 * tối giản tự dựng ở đây ép kiểu an toàn khi gọi — KHÔNG cần dựng `SlideElement` đầy đủ (kind/frame…),
 * những field đó không được hàm dùng tới.
 *
 * Kỹ thuật VẼ THẬT (draw-on nét/xoay cửa/tô loang, `stroke-dashoffset`/`clip-path`) KHÔNG nằm ở
 * file này — đó là phần C (xem thử), chỉ làm sau khi A+B (file này + test) xanh, xem cây tính năng.
 */

import type { Doc, Entity, Layer } from './model';
import { computeElementRevealTimings, type ElementRevealTiming } from '../present-editor/motion-present';
import type { EditorSlide, ElementReveal } from '../present-editor/model';

/** 5 đợt draw-on cố định theo §1.1 — thứ tự mảng = thứ tự phát. */
export type DrawOnBatch = 'shell' | 'openings' | 'furniture' | 'zones' | 'annotations';

export const DRAW_ON_BATCH_ORDER: DrawOnBatch[] = ['shell', 'openings', 'furniture', 'zones', 'annotations'];

/** Nhãn tiếng Việt (§1.1 cột "Đợt/Gồm") — chỉ để log/debug, không dùng trong tính toán. */
export const DRAW_ON_BATCH_LABEL: Record<DrawOnBatch, string> = {
  shell: '① Vỏ (tường·cột·sàn)',
  openings: '② Lỗ mở (cửa đi·cửa sổ)',
  furniture: '③ Nội thất',
  zones: '④ Vùng',
  annotations: '⑤ Ghi chú (kích thước·chữ)',
};

/**
 * Thời lượng gợi ý mỗi đợt (giây) — bảng §1.1, cột "Thời lượng gợi ý". Đổi Ở ĐÂY nếu spec cập
 * nhật số (đừng viết số rời rạc nơi khác). Tổng 5 số = tổng thời lượng draw-on toàn mặt bằng —
 * xem `planDrawOn()` vì sao tổng này KHÔNG phụ thuộc số lượng entity.
 */
export const DRAW_ON_BATCH_DURATION_SEC: Record<DrawOnBatch, number> = {
  shell: 3.0,
  openings: 1.5,
  furniture: 2.5,
  zones: 1.0,
  annotations: 1.5,
};

/** Ngưỡng lineweight (mm) coi là "nét dày" theo ISO 128 — fallback §1.1 dòng cuối cho entity
 * KHÔNG có `elementType` (file `.idf` cũ). Khớp bậc "đậm" ở `model.ts:26`: "0.50/0.70 — đậm:
 * tường bị mặt phẳng cắt qua". */
const THICK_LINEWEIGHT_MM = 0.5;

/** lineweight mặc định của layer khi KHÔNG khai báo — khớp nguyên văn `model.ts:47-49`
 * ("Thiếu ⇒ 0.25"), không tự bịa số khác. */
const DEFAULT_LINEWEIGHT_MM = 0.25;

/**
 * Xếp 1 entity vào 1 trong 5 đợt — đọc kỹ trước khi sửa, đây là bản dịch TRỰC TIẾP của bảng §1.1:
 *
 *   - `type === 'zone'`         → luôn ④ Vùng, BẤT KỂ `elementType` (zone là 1 EntityType riêng,
 *     bảng §1.1 nêu đích danh "zone (polygon/ellipse)" cho đợt này).
 *   - `type === 'dim' | 'text'` → luôn ⑤ Ghi chú, BẤT KỂ `elementType` (bảng §1.1 nêu đích danh
 *     "dim · text · legend").
 *   - còn lại, xét `elementType`:
 *       'wall' | 'column' | 'slab'  → ① Vỏ (đúng chữ bảng §1.1)
 *       'door' | 'window'           → ② Lỗ mở (đúng chữ bảng §1.1)
 *       'furniture'                 → ③ Nội thất (đúng chữ bảng §1.1)
 *       'space'                     → ④ Vùng — ⚠️ SUY LUẬN, không phải chữ nguyên văn spec: bảng
 *         §1.1 chỉ nêu EntityType 'zone' cho đợt ④, không nhắc ElementType 'space'. 'space' (IfcSpace
 *         — "không gian/phòng") cùng ý nghĩa "vùng" và không có đợt nào khác hợp lý hơn — xếp vào
 *         ④, CẦN Cowork/Hoà xác nhận lại nếu ý định khác.
 *       'beam'                      → ① Vỏ — ⚠️ SPEC THIẾU: bảng §1.1 liệt "wall · column · slab"
 *         cho đợt ① nhưng KHÔNG nhắc 'beam' (IfcBeam, có trong `ElementType` ở `model.ts:82`) ở
 *         BẤT KỲ đợt nào. Beam là cấu kiện kết cấu/vỏ nhà cùng nhóm ý nghĩa với dầm/cột/sàn nên xếp
 *         tạm vào ①, nhưng đây là LỖ HỔNG SPEC thật, không phải suy diễn có căn cứ chắc như 'space'
 *         — BÁO rõ trong báo cáo, không tự ý coi là đã chốt.
 *       `null` | `undefined` (chưa gán / file cũ) → FALLBACK §1.1 dòng cuối theo lineweight layer:
 *         nét dày (`>= THICK_LINEWEIGHT_MM`) → ①, ngược lại → ⑤.
 *
 * Switch có `default` trả về ⑤ CHỈ để không bao giờ throw/bỏ sót nếu `ElementType` sau này thêm
 * giá trị mới mà quên cập nhật hàm này — KHÔNG nên bao giờ chạm nhánh đó với `ElementType` hiện
 * tại (đã liệt đủ 8 giá trị + null ở trên).
 */
export function classifyDrawOnBatch(entity: Entity, layerLineweightMm: number): DrawOnBatch {
  if (entity.type === 'zone') return 'zones';
  if (entity.type === 'dim' || entity.type === 'text') return 'annotations';

  switch (entity.elementType) {
    case 'wall':
    case 'column':
    case 'slab':
    case 'beam':
      return 'shell';
    case 'door':
    case 'window':
      return 'openings';
    case 'furniture':
      return 'furniture';
    case 'space':
      return 'zones';
    case null:
    case undefined:
      return layerLineweightMm >= THICK_LINEWEIGHT_MM ? 'shell' : 'annotations';
    default:
      return 'annotations';
  }
}

/** lineweight hiệu dụng của 1 entity: override riêng entity (hiếm) → lineweight layer → mặc định. */
function lineweightOf(entity: Entity, layerById: Map<string, Layer>): number {
  if (typeof entity.lineweight === 'number') return entity.lineweight;
  const layer = layerById.get(entity.layer);
  return layer?.lineweight ?? DEFAULT_LINEWEIGHT_MM;
}

/** 1 đợt đã xếp xong — id entity theo đúng thứ tự sẽ phát (mảng gốc, KHÔNG sắp lại trong đợt ở
 * bản V1 này; xem ghi chú "CHƯA LÀM" ở `planDrawOn()` về thứ tự so-le-theo-khoảng-cách-tới-cửa
 * của đợt Nội thất). */
export interface DrawOnGroup {
  batch: DrawOnBatch;
  entityIds: string[];
  /** mốc bắt đầu đợt (giây, tính từ lúc draw-on bắt đầu). */
  startSec: number;
  durationSec: number;
}

/** Kiểu build-in GẦN ĐÚNG cho từng đợt — chỉ để thoả kiểu dữ liệu `ElementReveal` mà
 * `computeElementRevealTimings()` đòi hỏi (hàm dùng chung với Present, không biết khái niệm
 * "vẽ nét"/"tô loang"). Kỹ thuật vẽ THẬT là việc của phần C:
 *   - furniture ≈ 'rise' (mờ-lên + trồi, ĐÚNG khớp §1.1)
 *   - annotations ≈ 'fade' (mờ-lên, ĐÚNG khớp §1.1)
 *   - shell/openings/zones: không giá trị nào trong 4 giá trị `ElementReveal` khớp "vẽ nét"/"xoay
 *     90°"/"tô loang" — dùng 'none' làm placeholder trung tính, phần C tự quyết kỹ thuật vẽ theo
 *     `batchOf` (KHÔNG đọc field `reveal` cho 3 đợt này). */
const BATCH_ELEMENT_REVEAL: Record<DrawOnBatch, ElementReveal> = {
  shell: 'none',
  openings: 'none',
  furniture: 'rise',
  zones: 'none',
  annotations: 'fade',
};

/** Phần tử tối giản feed vào `computeElementRevealTimings()` — chỉ 4 field hàm đó thật sự đọc. */
interface DrawOnFeedElement {
  id: string;
  revealOrder: number;
  revealDelay: number;
  elementReveal: ElementReveal;
}

export interface PlanDrawOnResult {
  /** 5 đợt theo đúng thứ tự phát, kèm mốc bắt đầu/thời lượng. */
  groups: DrawOnGroup[];
  /** tổng thời lượng draw-on (giây) = tổng `DRAW_ON_BATCH_DURATION_SEC` — CỐ ĐỊNH, không phụ
   * thuộc số lượng entity (xem comment `planDrawOn()`). */
  totalDurationSec: number;
  /** cấu trúc "feed thẳng" — đã gọi xong `computeElementRevealTimings()`, không cần gọi lại. */
  slide: { elements: DrawOnFeedElement[] };
  /** kết quả TÁI DÙNG `computeElementRevealTimings()` — id → {reveal, delaySec}. */
  timings: ElementRevealTiming[];
  /** tra nhanh entity id → đợt, cho phần C chọn kỹ thuật vẽ đúng theo `batch`. */
  batchOf: Record<string, DrawOnBatch>;
}

/**
 * Xếp TOÀN BỘ entity của 1 Doc thành 5 đợt draw-on + tính mốc thời gian từng entity.
 *
 * MÔ HÌNH THỜI GIAN (quyết định thiết kế, KHÔNG phải chữ nguyên văn spec — spec chỉ ghi "thời
 * lượng gợi ý" mỗi đợt, không nói rõ có cộng dồn theo số lượng entity hay không):
 *
 *   Mỗi đợt có 1 CỬA SỔ THỜI LƯỢNG CỐ ĐỊNH (`DRAW_ON_BATCH_DURATION_SEC`) — entity trong đợt được
 *   RẢI ĐỀU trong cửa sổ đó bằng `revealDelay` TƯỜNG MINH, KHÔNG dùng auto-stagger mặc định của
 *   `computeElementRevealTimings()` (vốn cộng dồn theo SỐ LƯỢNG phần tử — đúng cho 1 slide Present
 *   vài chục phần tử, nhưng 1 mặt bằng khách sạn có thể ~2000 entity: nếu mỗi entity cộng thêm
 *   0.02-0.06s như slide thường, RIÊNG 1 đợt đã có thể dài hàng chục giây).
 *
 *   Lý do chọn "rải đều trong cửa sổ cố định": video giới thiệu cần thời lượng DỰ ĐOÁN ĐƯỢC — mặt
 *   bằng biệt thự (~50 entity) và mặt bằng khách sạn (~2000 entity) nên ra video DÀI GẦN NHƯ NHAU,
 *   không phải bản sau dài gấp 40 lần. Hệ quả: `totalDurationSec` LUÔN bằng tổng 5 số trong
 *   `DRAW_ON_BATCH_DURATION_SEC` (hiện 9.5s), bất kể mặt bằng có 10 hay 10.000 entity.
 *
 *   ⚠️ Đây là lựa chọn của code chính, CHƯA được Cowork/Hoà xác nhận — nếu ý định spec là thời
 *   lượng PHẢI giãn theo độ chi tiết mặt bằng (mặt bằng phức tạp thì video dài hơn), mô hình này
 *   sai và cần đổi hướng. Nêu rõ để duyệt lại, không tự chốt.
 *
 * CHƯA LÀM (nêu rõ, không giấu): §1.1 ghi đợt Nội thất "so le theo khoảng cách tới cửa chính" —
 * bản này CHƯA tính khoảng cách, entity trong mỗi đợt giữ nguyên THỨ TỰ MẢNG GỐC của `doc.entities`
 * (giống 4 đợt còn lại). Đổi thứ tự trong 1 đợt không đụng public shape của hàm này, làm sau được.
 */
export function planDrawOn(doc: Pick<Doc, 'entities' | 'layers'>): PlanDrawOnResult {
  const layerById = new Map(doc.layers.map((l) => [l.id, l] as const));
  const byBatch = new Map<DrawOnBatch, Entity[]>(DRAW_ON_BATCH_ORDER.map((b) => [b, [] as Entity[]]));

  for (const entity of doc.entities) {
    const lw = lineweightOf(entity, layerById);
    const batch = classifyDrawOnBatch(entity, lw);
    byBatch.get(batch)!.push(entity);
  }

  const elements: DrawOnFeedElement[] = [];
  const groups: DrawOnGroup[] = [];
  const batchOf: Record<string, DrawOnBatch> = {};

  let cursorSec = 0;
  let order = 0;
  for (const batch of DRAW_ON_BATCH_ORDER) {
    const list = byBatch.get(batch)!;
    const durationSec = DRAW_ON_BATCH_DURATION_SEC[batch];
    const startSec = cursorSec;
    list.forEach((entity, i) => {
      const revealDelay = list.length <= 1 ? startSec : startSec + (i / list.length) * durationSec;
      elements.push({ id: entity.id, revealOrder: order, revealDelay, elementReveal: BATCH_ELEMENT_REVEAL[batch] });
      batchOf[entity.id] = batch;
      order += 1;
    });
    groups.push({ batch, entityIds: list.map((e) => e.id), startSec, durationSec });
    cursorSec += durationSec;
  }

  // Ép kiểu tối thiểu: computeElementRevealTimings() chỉ đọc 4 field ở DrawOnFeedElement (xem
  // JSDoc hàm đó) — KHÔNG cần dựng SlideElement đầy đủ (kind/frame/...), những field đó không
  // được hàm dùng tới. Đây là lý do CẦN ép kiểu thay vì để TypeScript tự suy — tránh viết lại
  // SlideElement giả chỉ để thoả trình biên dịch.
  const timings = computeElementRevealTimings({
    elements: elements as unknown as EditorSlide['elements'],
  });

  return { groups, totalDurationSec: cursorSec, slide: { elements }, timings, batchOf };
}
