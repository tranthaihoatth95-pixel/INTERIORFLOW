/**
 * lib/boq/compute.ts — BOQ ENGINE (02/08): quét `Doc` → gộp vùng tô theo vật liệu → thành tiền.
 * THUẦN (không React/DOM/Prisma) — test bằng sucrase-node như `lib/cad/schedule.ts`.
 *
 * Dùng lại hình học có sẵn (`polygonArea` — `lib/cad/hatch.ts`), KHÔNG tự viết engine hình học
 * mới (đúng chỉ đạo gốc). Xem `lib/boq/model.ts` đầu file để biết phạm vi v1 đã khoá.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * 06/08 — G-M3-09 "BÁO GIÁ THIẾU ÂM THẦM". Trước hôm nay hàm này CHỈ quét `e.type === 'hatch'`:
 * một bản vẽ có cụm bàn 8 chỗ + 1 con ghế đã gán `specId` + 1 vùng tô sàn cho ra **1 dòng (sàn),
 * errors: []** — con ghế không có dòng, KHÔNG có lỗi, bảng vẫn trông "đủ". Nay quét THÊM món rời.
 *
 * PHẠM VI QUÉT — quyết định có căn cứ, không quét bừa (`grep -n specId lib/cad/model.ts`):
 *   · `HatchEntity.specId`   (dòng 563) → dòng `kind:'area'`  — như cũ.
 *   · `BlockEntity.specId`   (dòng 519) → dòng `kind:'count'` — MỚI.
 *   · `WallTypeLayer.specId` (dòng 630) và `WallType.specId` (dòng 657) → **KHÔNG quét**: đó là
 *     `Doc.wallTypes` (định nghĩa TYPE dùng chung), KHÔNG phải entity trên bản vẽ. Muốn ra khối
 *     lượng từ chúng phải tính diện tích/thể tích từng LỚP cấu tạo của từng đoạn tường (chiều dài
 *     × chiều cao × bề dày lớp) — engine đó chưa tồn tại, và đoán bừa là tính khống. Ghi thành
 *     việc còn thiếu, KHÔNG âm thầm bỏ (xem `docs/GAP-IF.md` G-M3-09).
 *
 * VÌ SAO KHÔNG TÁI DÙNG `buildSchedule()` (`lib/cad/schedule.ts`) dù nó đã đếm block + đọc specId:
 *   (1) nó gộp theo KHOÁ BLOCK (`block:sofa3:king-1800`) rồi chỉ giữ `specId` ĐẦU TIÊN gặp — sai
 *       trục cho báo giá (2 block khác nhau có thể cùng 1 mã hàng; cùng 1 block có thể gán 2 mã
 *       khác nhau ⇒ gộp theo block là tính sai tiền);
 *   (2) `schedule.ts` import `newId` từ `lib/cad/store.ts` (Zustand `'use client'`) — kéo nó vào
 *       đây là phá tính THUẦN của module này (điều kiện để `*.test.ts` chạy được bằng sucrase-node).
 * ⇒ đếm tại chỗ, ~15 dòng, không dựng lại cỗ máy nào của `schedule.ts`.
 */

import type { Doc, HatchEntity, BlockEntity, Pt } from '../cad/model';
// Import TƯƠNG ĐỐI, KHÔNG alias '@/': file này là module THUẦN, chạy test thẳng bằng
// `sucrase-node` (xem docstring đầu tệp) — sucrase KHÔNG giải alias, dùng '@/' là 5 tệp test
// chết ngay với `Cannot find module`. Cùng quy ước đã ghi ở `lib/server/mime-sniff.ts`.
import { idfcIdentityEnabled } from '../cad/idfc-identity-flag';
import { polygonArea, pointInPolygon } from '../cad/hatch';
import { BLOCK_MAP } from '../cad/furniture';
import { isCountUnit, normalizeQty, FFE_DEFAULT_UNIT } from '../ffe/item';
import type { BoqError, BoqResult, BoqRow, MaterialSpecLite } from './model';

const MM2_PER_M2 = 1_000_000;

/* ───────────── vòng KIỂM PHẢN BIỆN 06/08: 3 chốt chặn "số sai trông như đúng" ───────────── */

/** Đơn vị ĐO — gán cho một món ĐẶT RỜI là khai sai: "1 cái × giá mỗi m²" là tiền bịa. Cố ý là
 * danh sách NGẮN và tường minh (không regex đoán): chỉ chặn thứ chắc chắn sai, còn đơn vị lạ thì
 * đi nhánh `unknown-unit` (giữ nguyên chữ người dùng + cảnh báo), KHÔNG chặn oan. */
const MEASURE_UNITS = new Set([
  'm2', 'm²', 'm3', 'm³', 'm', 'md', 'ml', 'met', 'mét', 'metre', 'meter', 'sqm', 'cbm',
  'kg', 'tan', 'tấn', 'ton', 'lit', 'lít', 'l',
]);

/** Đơn vị DIỆN TÍCH — tập con của `MEASURE_UNITS`, là đơn vị DUY NHẤT hợp với cách tính của
 * nhánh VÙNG TÔ (cộng m² rồi nhân đơn giá). Đơn vị đo khác (m dài, m³, kg, lít…) mà đem nhân với
 * số mét vuông là tiền bịa — xem nhánh vùng tô bên dưới. */
const AREA_UNITS = new Set(['m2', 'm²', 'sqm']);

function normUnitLoose(u: string): string {
  return u.normalize('NFC').toLowerCase().trim();
}

/** Diện tích m² của 1 vùng tô. `<3` đỉnh ⇒ 0 (không phải đa giác). */
function hatchAreaM2(h: HatchEntity): number {
  if (!h.points || h.points.length < 3) return 0;
  return polygonArea(h.points) / MM2_PER_M2;
}

/**
 * Kiểm GIÁ + HAO HỤT trước khi nhân. Trả câu lỗi tiếng Việt, hoặc `null` nếu số dùng được.
 * Tách riêng `priceVnd === null` ("chưa có giá", ngữ nghĩa hợp lệ của Prisma) khỏi "số hỏng":
 *  - `null`                       → caller phát `missing-priceVnd` (đã có từ trước);
 *  - `undefined`/`NaN`/`Infinity` → `invalid-price` (JSON hỏng, Decimal chưa Number()-hoá…);
 *  - số ÂM                        → `invalid-price` (nối được thẳng từ cửa nhập Excel: ô `-100000`
 *    hiện vẫn được `buildImportRows` nhận).
 * Trước chốt này, cả 3 ca cuối cho ra thành tiền ÂM hoặc `NaN` với `errors: []`.
 */
function priceProblem(spec: MaterialSpecLite): string | null {
  const p = spec.priceVnd as number | null | undefined;
  if (p !== null && !Number.isFinite(p)) {
    return `đơn giá không phải là số (nhận được: ${String(p)})`;
  }
  if (typeof p === 'number' && p < 0) {
    return `đơn giá ÂM (${p.toLocaleString('vi-VN')}đ)`;
  }
  const w = spec.wastagePercent as number | null | undefined;
  if (w !== null && w !== undefined && !Number.isFinite(w)) {
    return `hao hụt % không phải là số (nhận được: ${String(w)})`;
  }
  if (typeof w === 'number' && w < 0) {
    return `hao hụt % ÂM (${w}%)`;
  }
  return null;
}

/** Làm tròn m² về 2 chữ số thập phân — đủ độ chính xác cho báo giá, tránh số lẻ dài vô nghĩa
 * khi hiện lên bảng/XLSX.
 *
 * LUẬT SỐ HỌC CỦA BẢNG (06/08 vòng 3, sửa cho khớp sự thật): **mọi con số in ra bảng đều tự
 * kiểm tay được**.
 *  · từng dòng: `thanhTien = round(m2 ĐÃ LÀM TRÒN × (1 + hao hụt%) × đơn giá)` — lấy máy tính bấm
 *    đúng ba số in trên dòng đó phải ra đúng cột thành tiền (± làm tròn về đồng);
 *  · tổng: `totalAmount` cộng từ `thanhTien` ĐÃ làm tròn của từng dòng (không cộng số thô rồi mới
 *    làm tròn tổng) — cộng tay cả cột ra đúng số tổng.
 * Trước bản vá, dòng nhân từ diện tích THÔ nên bảng in "10 m² · 1.000.000đ · 9.998.244đ" (lệch
 * 1.756đ so với 10 × 1.000.000) mà không ghi chú gì — người đọc báo giá không có cách nào biết
 * mình bấm máy sai hay bảng sai. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Thành tiền làm tròn về đồng (VND không có đơn vị nhỏ hơn 1đ trong thực tế báo giá). */
function roundVnd(n: number): number {
  return Math.round(n);
}

/**
 * Câu lỗi khi phép nhân TRÀN (`Infinity`/`NaN`) dù mọi đầu vào đều là số hữu hạn — vd
 * `wastagePercent = 1e308`. Nói rõ ba số đã nhân để người dùng biết số nào bịa ra kết quả đó.
 * (06/08 vòng 3: trước đây `thanhTien: Infinity` lọt ra với `errors: []`, và `buildXlsxBuffer`
 * ném lỗi bằng tiếng lập trình viên đúng lúc người dùng bấm "Xuất .xlsx".)
 */
function overflowMessage(what: string, name: string, qty: number, wastage: number, price: number): string {
  return `${what} "${name}": phép tính thành tiền TRÀN SỐ (khối lượng ${qty} × hao hụt ${wastage}% × đơn giá ${price}) — kết quả không còn là một số tiền có thật nên KHÔNG tính vào BOQ. Kiểm lại đơn giá và hao hụt % trong kho vật liệu (một trong hai đang lớn bất thường), rồi tính lại.`;
}

/** Tâm hình học ĐƠN GIẢN (trung bình cộng toạ độ đỉnh) — KHÔNG phải centroid diện-tích-trọng-số
 * chuẩn, nhưng đủ chính xác cho đa giác lồi/gần-lồi (quad phòng do CAD sinh ra) — dùng làm điểm
 * đại diện cho phép kiểm chồng lấn bên dưới, không cần chính xác tuyệt đối. */
function polygonCentroid(poly: Pt[]): Pt {
  let sx = 0;
  let sy = 0;
  for (const p of poly) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / poly.length, y: sy / poly.length };
}

/**
 * BOQ v2 (Việc 3a, 02/08) — 2 vùng tô có "chồng lấn thật" không? Heuristic: TÂM đa giác này nằm
 * TRONG đa giác kia (hoặc ngược lại), dùng lại `pointInPolygon` có sẵn ở `lib/cad/hatch.ts`
 * (KHÔNG viết engine giao đa giác mới — hatch.ts/geometry.ts chưa có hàm cắt/giao đa giác thật,
 * viết mới là việc lớn ngoài phạm vi "logic thuần" của đợt này).
 *
 * Vì sao dùng TÂM chứ không dùng ĐỈNH: 2 phòng chỉ CHUNG 1 CẠNH TƯỜNG (ca thực tế phổ biến nhất
 * — 2 vùng tô liền kề, mép trùng toạ độ) có đỉnh nằm ĐÚNG TRÊN biên của nhau — kiểm tra "đỉnh
 * nằm trong đa giác kia" sẽ báo nhầm chồng lấn (false positive) ở MỌI cặp phòng liền kề, hỏng
 * nhiều hơn sửa. Tâm 2 đa giác chỉ liền kề (không chồng lấn diện tích) không bao giờ rơi vào
 * nhau — test [7b] `compute.test.ts` khoá đúng hành vi "liền kề không báo nhầm" này.
 *
 * GIỚI HẠN đã biết (ghi rõ, không giấu): bắt đúng ca "đè hẳn lên nhau" (lỗi vẽ nhầm thường gặp
 * nhất — copy/paste sai chỗ, vẽ lại đè lên vùng cũ). KHÔNG bắt được ca chồng lấn kiểu "cắt chéo
 * góc" mà CẢ HAI tâm đều nằm ngoài nhau (2 hình chữ nhật chỉ đè 1 góc nhỏ) — cần polygon
 * intersection thật để bắt đủ mọi kiểu, ngoài phạm vi lần này (xem BAO-CAO-PHU.md).
 */
function overlaps(a: HatchEntity, b: HatchEntity): boolean {
  const ca = polygonCentroid(a.points);
  const cb = polygonCentroid(b.points);
  return pointInPolygon(ca, b.points) || pointInPolygon(cb, a.points);
}

/** Mọi cặp (i,j) chồng lấn trong 1 nhóm cùng specId — O(n²), đủ nhanh cho số vùng tô/vật liệu
 * thực tế của 1 dự án (hàng chục, không phải hàng nghìn). */
function findOverlappingPairs(group: HatchEntity[]): [HatchEntity, HatchEntity][] {
  const pairs: [HatchEntity, HatchEntity][] = [];
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      if (overlaps(group[i], group[j])) pairs.push([group[i], group[j]]);
    }
  }
  return pairs;
}

/** Lớp GHI CHÚ của bản vẽ — block nằm trên các lớp này là KÝ HIỆU (mũi tên bắc, tag cao độ, ký
 * hiệu mặt cắt…), không phải hàng hoá. Khớp đúng bộ layer chuẩn khai ở `lib/cad/model.ts`
 * (`l-dim` Kích thước · `l-text` Ghi chú · `l-axis` Trục) + tiền tố `l-anno`/`l-symbol` cho lớp
 * người dùng tự đặt. Dùng LỚP chứ không đoán theo tên block: tên block là chuỗi tự do (file DXF
 * của mỗi văn phòng đặt một kiểu), còn lớp là thứ người vẽ CHỦ ĐỘNG chọn. */
const ANNOTATION_LAYER_PREFIXES = ['l-dim', 'l-text', 'l-axis', 'l-anno', 'l-symbol'];

export type BoqBlockClass = 'goods' | 'opening' | 'symbol';

/**
 * Block này có phải HÀNG HOÁ đếm tiền không?
 *  - `'opening'` — cửa/cửa sổ: đã gắn vào tường (`hostId`) HOẶC `BlockDef.hosted` khai trong thư
 *    viện (`lib/cad/furniture.ts:46`). Chúng là CẤU KIỆN của tường (`hosting.ts` khoét lỗ thật),
 *    tính tiền qua bảng thống kê cửa/cửa sổ, không phải qua dòng "món rời" của BOQ.
 *  - `'symbol'` — block nằm trên lớp ghi chú (xem `ANNOTATION_LAYER_PREFIXES`).
 *  - `'goods'` — còn lại (kể cả block key LẠ từ file DXF: một cái ghế nhập từ DXF vẫn phải được
 *    tính tiền; loại nó ra vì "không biết key" chính là bug âm thầm mà cả vòng này đang chữa).
 * Đọc `BLOCK_MAP` là ĐỌC — không sửa `lib/cad/furniture.ts`.
 */
export function classifyBlock(b: BlockEntity): BoqBlockClass {
  // 🔴 VÁ VÒNG 2 (kiểm phản biện 06/08) — **KHAI BÁO THẮNG SUY ĐOÁN**. Bản trước xếp loại TRƯỚC
  // khi nhìn `specId`, nên một cái ghế đã gán mã hàng + đơn giá mà nằm trên lớp ghi chú (hoặc bị
  // `hosting.ts` gắn `hostId` nhầm) thì **rơi khỏi cả rows lẫn errors**: đo được `rows=0,
  // errors=0, total=0` trong khi cùng cái ghế đó trên `l-furniture` ra 2.450.000đ. Tức là bản vá
  // chống-thiếu-âm-thầm lại tự đẻ một đường thiếu-âm-thầm mới, chỉ đổi chỗ.
  // `specId` là thứ NGƯỜI DÙNG CHỦ ĐỘNG gán ("món này là hàng, giá đây") — nó phải thắng mọi suy
  // đoán theo lớp/thư viện. Phân loại theo lớp chỉ còn dùng cho block CHƯA gán mã, đúng mục đích
  // ban đầu của nó: lọc bớt ký hiệu khỏi câu cảnh báo "chưa gán mã hàng".
  // Hệ quả có chủ ý: studio CÓ bán cửa ⇒ cửa đã gán `specId` nay lên BOQ (trước bị loại thẳng).
  if (b.specId && b.specId.trim()) return 'goods';
  if (b.hostId) return 'opening';
  if (BLOCK_MAP[b.block]?.hosted) return 'opening';
  const layer = (b.layer ?? '').toLowerCase();
  if (ANNOTATION_LAYER_PREFIXES.some((p) => layer === p || layer.startsWith(`${p}-`))) return 'symbol';
  return 'goods';
}

/**
 * computeBoq — hàm lõi. `specs` do caller tự tra (vd qua `GET /api/specs?kind=material`) và
 * truyền vào, KHÔNG fetch bên trong (giữ THUẦN).
 *
 * Luật lỗi (không tính bừa):
 *  - hai đối tượng CÙNG `id` → chỉ tính bản gặp đầu tiên, bản sau bỏ + 1 `BoqError`
 *    reason='invalid-geometry' (06/08 vòng 3 — trước đó cộng đôi im lặng; vì sao dùng chung lý do
 *    `invalid-geometry` thay vì lý do riêng: xem docblock của nó trong `./model.ts`).
 *  - `HatchEntity` không có `specId` (hoặc chuỗi rỗng) → gộp chung 1 `BoqError`
 *    reason='missing-specId', KHÔNG vào rows/totalAmount.
 *  - `BlockEntity` (món rời) không có `specId` → gộp chung 1 `BoqError`
 *    reason='missing-specId-item' (06/08, G-M3-09 — trước đó những món này biến mất ÂM THẦM).
 *  - có `specId` nhưng không khớp spec nào trong `specs[]` → 1 `BoqError` reason='spec-not-found'
 *    mỗi specId lạ (gộp theo specId, không phải theo từng entity — nhiều vùng cùng 1 specId lạ
 *    ra CHUNG 1 lỗi liệt kê đủ entityIds).
 *  - spec khớp nhưng `priceVnd === null` ("chưa có giá", đúng ngữ nghĩa Prisma schema) → 1
 *    `BoqError` reason='missing-priceVnd' mỗi specId.
 *
 * HAO HỤT trên món ĐẾM: áp CÙNG công thức với vùng tô (`qty × (1+hao hụt%) × đơn giá`) — không
 * làm tròn lên thành "số cái phải mua" (đó là bước `qty_order`/CEILING theo `packagingSpec`, một
 * việc khác chưa có nơi tiêu thụ). Đa số `ProductSpec` món rời để `wastagePercent` null ⇒ 0% ⇒
 * không đổi gì; ai khai 5% thì hiểu là dự phòng tiền, và cột "Hao hụt %" hiện ngay trên bảng nên
 * không có gì bị giấu.
 */
export function computeBoq(doc: Doc, specs: MaterialSpecLite[]): BoqResult {
  const specById = new Map(specs.map((s) => [s.id, s]));

  /* ───────── KHỬ TRÙNG `id` (06/08 vòng 3) ─────────
     `Doc.entities` là mảng, KHÔNG có ràng buộc id duy nhất. Gộp nhiều sheet
     (`mergeIdfSheetsToDoc`), nhập file, hay một lần undo lỗi đều có thể để lọt hai bản ghi cùng
     id. Trước đây `computeBoq` cộng cả hai: đo được 2 hatch cùng id ⇒ **18 m² thay vì 9**, 2
     block cùng id ⇒ **qty 2 thay vì 1**, `errors: []`. Không phải "vẽ chồng" (đã có
     `overlapping-region` cho ca đó) mà là MỘT đối tượng bị đếm hai lần.
     Luật: giữ bản GẶP ĐẦU TIÊN, bỏ các bản sau, và NÓI RA đã bỏ mấy bản — không im. */
  const scanned = doc.entities.filter(
    (e): e is HatchEntity | BlockEntity => e.type === 'hatch' || e.type === 'block',
  );
  const seenEntityIds = new Set<string>();
  const duplicateEntityIds: string[] = [];
  const uniqueScanned: (HatchEntity | BlockEntity)[] = [];
  for (const e of scanned) {
    if (seenEntityIds.has(e.id)) {
      duplicateEntityIds.push(e.id);
      continue;
    }
    seenEntityIds.add(e.id);
    uniqueScanned.push(e);
  }

  const hatches = uniqueScanned.filter((e): e is HatchEntity => e.type === 'hatch');
  const allBlocks = uniqueScanned.filter((e): e is BlockEntity => e.type === 'block');
  // ⑤ (KIỂM PHẢN BIỆN 06/08) — KHÔNG phải block nào cũng là "hàng hoá đếm tiền". Bản vẽ thật có
  // hàng chục block cửa/cửa sổ + ký hiệu; gom hết vào lỗi "chưa gán mã hàng" thì lỗi luôn nổ với
  // số to và người dùng học cách bỏ qua đúng cái cảnh báo mình vừa dựng lên.
  const blocks = allBlocks.filter((b) => classifyBlock(b) === 'goods');
  const skippedOpenings = allBlocks.filter((b) => classifyBlock(b) === 'opening').length;
  const skippedSymbols = allBlocks.filter((b) => classifyBlock(b) === 'symbol').length;

  const missingSpecIdIds: string[] = [];
  const missingSpecIdItemIds: string[] = [];
  /** group theo specId — Map giữ thứ tự gặp lần đầu, để rows/errors ra ổn định (không phụ thuộc
   * thứ tự duyệt Map nội bộ khác implementation). */
  const bySpecId = new Map<string, HatchEntity[]>();
  /** cùng nguyên tắc, cho MÓN RỜI — tách Map riêng vì m² và cái KHÔNG cộng chung.
   * Kiểu nới thành `{ id }` (BlockEntity thoả) để nhận thêm **cụm nét rời từ `.idfc`** bên dưới:
   * vòng dựng dòng chỉ dùng `e.id` và `group.length`, không cần gì hơn. */
  const itemsBySpecId = new Map<string, { id: string }[]>();

  for (const h of hatches) {
    const specId = h.specId && h.specId.trim() ? h.specId : undefined;
    if (!specId) {
      missingSpecIdIds.push(h.id);
      continue;
    }
    const group = bySpecId.get(specId);
    if (group) group.push(h);
    else bySpecId.set(specId, [h]);
  }

  for (const b of blocks) {
    const specId = b.specId && b.specId.trim() ? b.specId : undefined;
    if (!specId) {
      missingSpecIdItemIds.push(b.id);
      continue;
    }
    const group = itemsBySpecId.get(specId);
    if (group) group.push(b);
    else itemsBySpecId.set(specId, [b]);
  }

  /* ───────── ⚙️ IDFC-INTEGRITY-001 · CỤM NÉT RỜI TỪ `.idfc` ─────────
     Món `.idfc` không dựng được `BlockEntity` (lý do ở `Base.specId`), nên nó xuống bản vẽ dưới
     dạng NHIỀU nét rời cùng chung một `srcInsertId`. Trước lát này, **0/60 món mầm `.idfc` lên
     được BOQ**: chúng vào bản vẽ rồi biến mất khỏi bảng khối lượng, không lỗi, không dòng.

     Luật đếm: **một `srcInsertId` = MỘT món**, không phải 41 nét = 41 món. Đây là chỗ dễ sai
     nhất của lát này, nên nó là ca kiểm bắt buộc.

     Sau cờ `NEXT_PUBLIC_IF_IDFC_IDENTITY` (`lib/cad/idfc-identity-flag.ts` giải thích vì sao
     phải là biến NEXT_PUBLIC): cờ chưa đặt ⇒ BOQ ra y hệt hôm nay. */
  if (idfcIdentityEnabled()) {
    /** srcInsertId → specId. Map giữ thứ tự gặp đầu ⇒ dòng ra ổn định. */
    const cumTheoInsert = new Map<string, string>();
    for (const e of doc.entities) {
      if (e.type === 'hatch' || e.type === 'block') continue; // đã đếm ở đường cũ
      const ins = e.srcInsertId;
      const sid = e.specId && e.specId.trim() ? e.specId : undefined;
      if (!ins || !sid) continue;
      // Gặp lại cùng bản chèn ⇒ bỏ qua: nét thứ hai của cùng một món KHÔNG phải món thứ hai.
      if (!cumTheoInsert.has(ins)) cumTheoInsert.set(ins, sid);
    }
    for (const [ins, sid] of cumTheoInsert) {
      const group = itemsBySpecId.get(sid);
      // Định danh dòng lỗi theo BẢN CHÈN, không theo nét — người dùng chọn được cả cụm bằng
      // `expandIdsByInsertGroup`, nên id bản chèn là thứ chỉ được vào đúng vật.
      if (group) group.push({ id: ins });
      else itemsBySpecId.set(sid, [{ id: ins }]);
    }
  }

  const rows: BoqRow[] = [];
  const errors: BoqError[] = [];

  if (duplicateEntityIds.length) {
    const unique = Array.from(new Set(duplicateEntityIds));
    errors.push({
      reason: 'invalid-geometry',
      entityIds: unique,
      message: `${duplicateEntityIds.length} đối tượng trên bản vẽ mang id TRÙNG với đối tượng khác (${unique.length} id: ${unique.slice(0, 5).join(', ')}${unique.length > 5 ? '…' : ''}) — mỗi id chỉ được tính MỘT lần nên bản gặp sau đã bị bỏ. Nếu đây thật sự là hai món/hai vùng tô khác nhau thì bản vẽ đang thiếu mất khối lượng của bản bị bỏ: vẽ lại (hoặc copy–paste lại) đối tượng đó để nó nhận id mới rồi tính lại BOQ.`,
    });
  }

  if (missingSpecIdIds.length) {
    errors.push({
      reason: 'missing-specId',
      entityIds: missingSpecIdIds,
      message: `${missingSpecIdIds.length} vùng tô chưa gán vật liệu (specId) — không tính vào BOQ. Gán vật liệu cho vùng tô trước khi xuất bảng khối lượng.`,
    });
  }

  if (missingSpecIdItemIds.length) {
    // Nói luôn đã BỎ QUA những gì, để con số trong câu lỗi đối chiếu được với mắt người đọc bản
    // vẽ (họ đếm thấy 12 block mà lỗi báo 5 thì phải giải thích được 7 cái kia đi đâu).
    const skipped: string[] = [];
    if (skippedOpenings) skipped.push(`${skippedOpenings} cửa/cửa sổ`);
    if (skippedSymbols) skipped.push(`${skippedSymbols} ký hiệu bản vẽ`);
    const skipNote = skipped.length
      ? ` (đã bỏ qua ${skipped.join(' và ')} — không phải hàng hoá đếm tiền)`
      : '';
    errors.push({
      reason: 'missing-specId-item',
      entityIds: missingSpecIdItemIds,
      message: `${missingSpecIdItemIds.length} món rời (bàn/ghế/đèn… đặt trên bản vẽ) chưa gán mã hàng (specId) — KHÔNG có dòng nào trong báo giá, tiền của chúng đang bị thiếu${skipNote}. Chọn từng món rồi gán vật liệu/mã hàng từ kho, hoặc xoá nếu chỉ là hình minh hoạ.`,
    });
  }

  for (const [specId, groupRaw] of bySpecId) {
    const spec = specById.get(specId);

    // ④ hình học rỗng — TÁCH ra trước khi cộng diện tích. Vùng tô dưới 3 đỉnh (hoặc đỉnh thẳng
    // hàng) cho `polygonArea` = 0 ⇒ trước đây ra dòng "0.00 m² · 0đ" mà KHÔNG lỗi nào. Vùng tô
    // TỐT trong cùng nhóm vẫn được tính bình thường — chỉ vùng hỏng bị loại + báo.
    const group = groupRaw.filter((h) => hatchAreaM2(h) > 0);
    const degenerate = groupRaw.filter((h) => hatchAreaM2(h) <= 0);
    if (degenerate.length) {
      errors.push({
        reason: 'invalid-geometry',
        entityIds: degenerate.map((e) => e.id),
        matId: specId,
        message: `${degenerate.length} vùng tô của "${spec?.name ?? specId}" không có diện tích (dưới 3 đỉnh hoặc các đỉnh thẳng hàng) — KHÔNG tính vào BOQ. Vẽ lại vùng tô đó hoặc xoá đi; nếu để nguyên, bảng sẽ thiếu tiền của phần diện tích này mà không thấy dòng nào sai.`,
      });
    }
    if (!group.length) continue;

    const entityIds = group.map((e) => e.id);

    if (!spec) {
      errors.push({
        reason: 'spec-not-found',
        entityIds,
        matId: specId,
        message: `${entityIds.length} vùng tô neo vào specId "${specId}" nhưng không tìm thấy vật liệu này trong danh sách ProductSpec truyền vào — có thể vật liệu đã bị xoá/đổi. Không tính vào BOQ.`,
      });
      continue;
    }

    const badPrice = priceProblem(spec);
    if (badPrice) {
      errors.push({
        reason: 'invalid-price',
        entityIds,
        matId: specId,
        message: `Vật liệu "${spec.name}" có ${badPrice} — KHÔNG tính vào BOQ (tính tiếp sẽ ra thành tiền âm hoặc không phải số, mà tổng vẫn trông bình thường). Sửa lại giá trong kho vật liệu rồi tính lại.`,
      });
      continue;
    }

    if (spec.priceVnd === null) {
      errors.push({
        reason: 'missing-priceVnd',
        entityIds,
        matId: specId,
        message: `Vật liệu "${spec.name}" (${entityIds.length} vùng tô) chưa có đơn giá (priceVnd null trong ProductSpec) — không đoán giá, không tính vào BOQ. Bổ sung giá qua ATLAS sync rồi tính lại.`,
      });
      continue;
    }

    /* 🔴 VÁ VÒNG 2 (kiểm phản biện 06/08) — CHIỀU ĐỐI XỨNG bị bỏ quên. Vòng MÓN RỜI đã chặn ca
       "đơn giá mỗi m² × số cái", nhưng vòng VÙNG TÔ này chưa kiểm đơn vị lần nào ⇒ gán nhầm mã
       một cái ghế (unit 'cái') cho vùng tô sàn vẫn ra tiền: đo được **9 m² × 2.450.000 =
       22.050.000đ với errors: []**. Chiều này còn dễ xảy ra hơn chiều kia (chọn nhầm mã trong
       danh sách kho khi tô sàn). Cùng một luật: đơn vị không khớp cách tính ⇒ KHÔNG tính, báo rõ. */
    /* ĐƠN VỊ của nhánh VÙNG TÔ — 3 nhánh, ĐỐI XỨNG với nhánh món rời bên dưới (06/08 vòng 3).
       Bản trước chỉ chặn đơn vị ĐẾM, nên đơn vị ĐO KHÁC diện tích vẫn nhân im lặng: đo được
       vùng tô 3000×3000 với `unit='m'` → **qty 9, unit "m2", 900.000đ, errors: []**; y hệt với
       'm3' và 'thùng'. "9 m² × đơn giá mỗi MÉT DÀI" là tiền bịa hệt như "1 cái × đơn giá mỗi m²".
         (a) đơn vị DIỆN TÍCH ('m2'/'m²'/'sqm') hoặc RỖNG (chưa khai) → tính như cũ;
         (b) đơn vị ĐẾM hoặc đơn vị ĐO khác diện tích ('m','md','m3','kg','lít'…) → CHẶN;
         (c) đơn vị LẠ ('thùng','kiện'…) → VẪN tính theo m² nhưng cảnh báo, giữ nguyên chữ người
             dùng viết (cùng luật với món rời: không nuốt thông tin ATLAS đã gửi). */
    const areaUnit = (spec.unit ?? '').trim();
    const areaUnitNorm = normUnitLoose(areaUnit);
    if (areaUnit && !AREA_UNITS.has(areaUnitNorm)) {
      if (isCountUnit(areaUnit) || MEASURE_UNITS.has(areaUnitNorm)) {
        const cachTinh = isCountUnit(areaUnit)
          ? `đếm từng ${areaUnit}, không phải tính theo diện tích`
          : `đo theo ${areaUnit}, không phải theo diện tích`;
        errors.push({
          reason: 'unit-mismatch',
          entityIds,
          matId: specId,
          message: `${entityIds.length} vùng tô đang neo vào "${spec.name}" — mã này khai đơn vị "${areaUnit}" (${cachTinh}). Vùng tô chỉ ra được SỐ MÉT VUÔNG, nhân nó với đơn giá mỗi ${areaUnit} sẽ ra con số vô nghĩa nên KHÔNG tính vào BOQ. Sửa ở MỘT trong hai chỗ: đổi đơn vị của mã "${spec.sku || spec.name}" trong kho vật liệu về m², hoặc gỡ mã này khỏi vùng tô (nếu đây là món đặt rời thì đặt nó thành KHỐI trên bản vẽ, BOQ sẽ đếm theo ${areaUnit}).`,
        });
        continue;
      }
      errors.push({
        reason: 'unknown-unit',
        entityIds,
        matId: specId,
        message: `Vật liệu "${spec.name}" khai đơn vị "${areaUnit}" — IF chưa biết đơn vị này nên vẫn tính theo DIỆN TÍCH vùng tô (m²) và ghi "m2" trong bảng. Dòng VẪN được tính; hãy đối chiếu đơn giá có đúng là giá cho mỗi mét vuông không, nếu không thì sửa đơn vị trong kho vật liệu.`,
      });
    }

    // Việc 3a (02/08) — chồng lấn trước khi cộng diện tích: 2+ vùng CÙNG vật liệu đè lên nhau
    // sẽ tính khống nếu cứ cộng thẳng — báo lỗi thay vì đoán phần chồng lấn bao nhiêu (đúng
    // "luật lỗi" chung của hàm này, xem đầu file).
    const overlapPairs = findOverlappingPairs(group);
    if (overlapPairs.length > 0) {
      const ids = Array.from(new Set(overlapPairs.flatMap(([a, b]) => [a.id, b.id])));
      errors.push({
        reason: 'overlapping-region',
        entityIds: ids,
        matId: specId,
        message: `${overlapPairs.length} cặp vùng tô cùng vật liệu "${spec.name}" bị chồng lấn lên nhau — diện tích KHÔNG cộng gộp (tránh tính khống). Tách lại vùng tô hoặc xoá vùng thừa trong bản vẽ rồi tính lại BOQ.`,
      });
      continue;
    }

    const areaM2Raw = group.reduce((sum, h) => sum + polygonArea(h.points) / MM2_PER_M2, 0);
    const wastage = spec.wastagePercent ?? 0;
    const m2 = round2(areaM2Raw);
    /* 🔴 VÁ 06/08 vòng 3 — nhân từ `m2` ĐÃ LÀM TRÒN, không từ `areaM2Raw`. Trước đây bảng in
       "10 m² · 1.000.000đ · thành tiền 9.998.244đ" (vùng tô 3162×3162): mỗi dòng KHÔNG tự nhân
       ra được con số in ngay cạnh nó, lệch 1.756đ mà không một ghi chú. Docblock `round2` ở đầu
       file vốn hứa "Hoà mở bảng ra cộng tay từng dòng phải ra đúng tổng" — nay dòng cũng NHÂN
       tay ra đúng, không chỉ cộng. Đánh đổi có chủ ý: diện tích thật bị làm tròn 2 số lẻ trước
       khi tính tiền (sai số ≤ 0,005 m² mỗi dòng) — đổi lấy một bảng KIỂM TAY ĐƯỢC. */
    const thanhTien = roundVnd(m2 * (1 + wastage / 100) * spec.priceVnd);

    // Đầu vào hữu hạn vẫn có thể cho ra kết quả tràn (vd hao hụt 1e308) — `priceProblem` chỉ soi
    // ĐẦU VÀO. Không có chốt này thì `thanhTien: Infinity` lọt ra với `errors: []`. Dùng chung lý
    // do `invalid-price` (cùng việc phải làm: sửa giá/hao hụt trong kho) — xem `./model.ts`.
    if (!Number.isFinite(thanhTien)) {
      errors.push({
        reason: 'invalid-price',
        entityIds,
        matId: specId,
        message: overflowMessage('Vật liệu', spec.name, m2, wastage, spec.priceVnd),
      });
      continue;
    }

    rows.push({
      specId, // W0.2 (19/08) — tên đúng bản chất; `matId` dưới là alias deprecated, LUÔN BẰNG nó
      matId: specId,
      ten: spec.name,
      ncc: spec.vendor ?? '',
      ma: spec.sku ?? '',
      m2,
      qty: m2,
      unit: 'm2',
      kind: 'area',
      donGia: spec.priceVnd,
      haoHutPhanTram: wastage,
      thanhTien,
      entityIds,
    });
  }

  /* ───────── MÓN RỜI (G-M3-09, 06/08) — đếm cái/bộ, KHÔNG đo diện tích ───────── */
  for (const [specId, group] of itemsBySpecId) {
    const entityIds = group.map((e) => e.id);
    const spec = specById.get(specId);

    if (!spec) {
      errors.push({
        reason: 'spec-not-found',
        entityIds,
        matId: specId,
        message: `${entityIds.length} món rời neo vào specId "${specId}" nhưng không tìm thấy mã hàng này trong danh sách ProductSpec truyền vào — có thể món đã bị xoá/đổi mã. Không tính vào BOQ.`,
      });
      continue;
    }

    const badItemPrice = priceProblem(spec);
    if (badItemPrice) {
      errors.push({
        reason: 'invalid-price',
        entityIds,
        matId: specId,
        message: `Món "${spec.name}" có ${badItemPrice} — KHÔNG tính vào BOQ (tính tiếp sẽ ra thành tiền âm hoặc không phải số, mà tổng vẫn trông bình thường). Sửa lại giá trong kho vật liệu rồi tính lại.`,
      });
      continue;
    }

    if (spec.priceVnd === null) {
      errors.push({
        reason: 'missing-priceVnd',
        entityIds,
        matId: specId,
        message: `Món "${spec.name}" (${entityIds.length} cái trên bản vẽ) chưa có đơn giá (priceVnd null trong ProductSpec) — không đoán giá, không tính vào BOQ. Bổ sung giá trong kho vật liệu rồi tính lại.`,
      });
      continue;
    }

    /* ④ ĐƠN VỊ — 3 nhánh, mỗi nhánh nói ra được, không nhánh nào im lặng:
       (a) đơn vị ĐẾM ('cai'/'bo'/'set'…)  → dùng luôn, không lỗi.
       (b) đơn vị ĐO  ('m2'/'m'/'kg'…)     → CHẶN: "1 cái × đơn giá mỗi m²" là tiền bịa. Trước
           06/08-chiều, engine lẳng lặng đổi sang 'cai' rồi vẫn nhân — ra 472.500đ với errors:[].
       (c) đơn vị LẠ  ('thùng'/'kiện'…)    → GIỮ NGUYÊN chữ người dùng (không nuốt thành 'cai')
           + cảnh báo để họ đối chiếu đơn giá. Nuốt đơn vị là mất thông tin ATLAS đã gửi. */
    const rawUnit = (spec.unit ?? '').trim();
    if (rawUnit && !isCountUnit(rawUnit) && MEASURE_UNITS.has(normUnitLoose(rawUnit))) {
      errors.push({
        reason: 'unit-mismatch',
        entityIds,
        matId: specId,
        message: `Món "${spec.name}" (${entityIds.length} cái trên bản vẽ) khai đơn vị "${rawUnit}" — đó là đơn vị ĐO, không đếm được bằng cái. Nhân số món với đơn giá mỗi ${rawUnit} sẽ ra con số vô nghĩa nên KHÔNG tính vào BOQ. Sửa đơn vị trong kho vật liệu thành cái/bộ, hoặc gỡ mã này khỏi món trên bản vẽ (nếu đây thật sự là vật liệu tính theo ${rawUnit} thì nó phải là VÙNG TÔ, không phải món đặt rời).`,
      });
      continue;
    }

    let unit = FFE_DEFAULT_UNIT;
    if (isCountUnit(rawUnit)) {
      unit = rawUnit;
    } else if (rawUnit) {
      unit = rawUnit; // giữ nguyên chữ người dùng
      errors.push({
        reason: 'unknown-unit',
        entityIds,
        matId: specId,
        message: `Món "${spec.name}" khai đơn vị "${rawUnit}" — IF chưa biết đơn vị này nên ĐẾM theo số món trên bản vẽ (${entityIds.length}) và giữ nguyên chữ "${rawUnit}" trong bảng. Dòng VẪN được tính; hãy đối chiếu đơn giá có đúng là giá cho mỗi ${rawUnit} không.`,
      });
    }
    // `normalizeQty` ép số nguyên ≥ 0 cho đơn vị đếm (dùng CHUNG bộ luật của `lib/ffe/item.ts`,
    // không chế lại). group.length luôn là số nguyên dương ⇒ không bao giờ null, `?? group.length`
    // chỉ là chốt an toàn kiểu, không phải đường chạy thật.
    const qty = normalizeQty(group.length, unit) ?? group.length;
    const wastage = spec.wastagePercent ?? 0;
    const thanhTien = roundVnd(qty * (1 + wastage / 100) * spec.priceVnd);

    // Cùng chốt tràn số như nhánh vùng tô — áp CẢ HAI nhánh, không nhánh nào được ra `Infinity`.
    if (!Number.isFinite(thanhTien)) {
      errors.push({
        reason: 'invalid-price',
        entityIds,
        matId: specId,
        message: overflowMessage('Món', spec.name, qty, wastage, spec.priceVnd),
      });
      continue;
    }

    rows.push({
      specId, // W0.2 (19/08) — xem docblock `BoqRow.specId`
      matId: specId,
      ten: spec.name,
      ncc: spec.vendor ?? '',
      ma: spec.sku ?? '',
      m2: qty, // deprecated alias — xem docblock `BoqRow.m2`
      qty,
      unit,
      kind: 'count',
      donGia: spec.priceVnd,
      haoHutPhanTram: wastage,
      thanhTien,
      entityIds,
    });
  }

  // Cùng 1 specId dùng cho CẢ vùng tô lẫn món rời ⇒ 2 dòng trùng `matId`. Không gộp được (m² +
  // cái), cũng không im lặng: override sửa-tay đánh khoá theo `matId` nên sửa 1 dòng sẽ đổi cả 2.
  for (const specId of itemsBySpecId.keys()) {
    if (!bySpecId.has(specId)) continue;
    const spec = specById.get(specId);
    errors.push({
      reason: 'specId-both-kinds',
      entityIds: [...(bySpecId.get(specId) ?? []), ...(itemsBySpecId.get(specId) ?? [])].map((e) => e.id),
      matId: specId,
      message: `Mã "${spec?.name ?? specId}" đang được dùng vừa cho vùng tô (tính m²) vừa cho món rời (tính cái) — bảng sẽ có 2 dòng cùng mã và sửa tay 1 ô sẽ áp cho cả hai. Tách thành 2 mã riêng trong kho vật liệu để số liệu không dính nhau.`,
    });
  }

  /* W0.2 (19/08) — BẤT BIẾN NAMESPACE tại MỘT chỗ thay vì rải 12 chỗ push: mọi `BoqError` mang
     `matId` (tên cũ, thực chất là ProductSpec.id) đều mang thêm `specId` (tên đúng bản chất) với
     CÙNG giá trị. Lỗi push thêm về sau tự được phủ, không phụ thuộc người viết nhớ khai 2 field. */
  for (const e of errors) {
    if (e.matId !== undefined && e.specId === undefined) e.specId = e.matId;
  }

  const totalAmount = rows.reduce((sum, r) => sum + r.thanhTien, 0);

  return { rows, errors, totalAmount };
}
