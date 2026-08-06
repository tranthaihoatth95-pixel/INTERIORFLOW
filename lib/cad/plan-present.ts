/**
 * lib/cad/plan-present.ts — ỐNG KÍNH THỨ HAI CỦA MẶT BẰNG (VIỆC 1, phiên S4).
 *
 * Mặt bằng kỹ thuật (đen trắng) và mặt bằng cho khách xem (có màu, cây, người) là **CÙNG MỘT
 * `Doc`, HAI CÁCH HIỂN THỊ**. File này là cách hiển thị thứ hai.
 *
 * ⛔ **K1 — KHÔNG NHÂN ĐÔI `Doc`.** `presentProjection()` trả về một `Doc` **PHÙ DU**, tính lại
 * mỗi lần vẽ, **KHÔNG BAO GIỜ** đi vào store / `.idf` / IndexedDB. Không có hàm `syncXtoY` nào ở
 * đây và cũng không được thêm. Tiền lệ đã có sẵn trong repo, làm đúng khuôn đó:
 * `components/cad/CadCanvas.tsx:2282` dựng `docToDraw` phù du cho preview lúc kéo grip.
 * Mọi entity trang trí do file này sinh ra mang tiền tố id `PRESENT_ID_PREFIX` — có
 * `isPresentDecor()` + `stripPresentDecor()` để nơi nào lỡ ghi vào store thì lọc lại được.
 *
 * ⛔ **§0f TB1 — ĐÚNG TRƯỚC KHI ĐẸP.** Chế độ trình bày **KHÔNG đổi kích thước, KHÔNG đổi vị trí**
 * bất cứ thứ gì có sẵn trong `Doc`. Nó chỉ đổi **màu · bề dày nét · kiểu nét**, và **CỘNG THÊM**
 * lớp trang trí phái sinh (thảm · cây · người · đảo nền) tính từ chính hình học đang có.
 * Phép thử TB4: đổi bàn 1400×700 → 1600×800 thì cụm to ra ⇒ thảm/đảo tự nở theo, cây tự dịch —
 * vì mọi thứ đo từ `entityBox()` của cụm chứ không phải toạ độ gõ tay.
 *
 * ⛔ **LUẬT TRUNG TÍNH TT1–TT5.** Không hex thương hiệu nào, không tên studio nào. Toàn bộ bảng
 * màu là **THAM SỐ TRUYỀN ĐÈ ĐƯỢC** (`PresentPalette`), `NEUTRAL_PRESENT_PALETTE` chỉ là mặc
 * định trung tính (xám + một sắc lá). Studio muốn bảng khác thì truyền vào, không sửa file này.
 *
 * ⛔ **§0h HG3.** Kích thước dùng ở đây là **dữ kiện ngành** (chậu cây 600–1200, vai người ~450) —
 * được phép. Không có tên phòng ban, số liệu hay chuẩn nội bộ của bất kỳ dự án nào.
 *
 * ▸ NGUỒN: `docs/00-PHAN-TICH-NGUON-THAM-CHIEU.md` mục 4 (ảnh `B1`, `B2`). Công thức nguyên văn:
 *   nền sàn xám rất nhạt · tường/lõi đen đặc · cây xanh là ĐIỂM MÀU DUY NHẤT rải theo cụm, tán
 *   tự do bất đối xứng · người nhìn từ trên đặt vài chỗ · thảm định vùng hình tròn NÉT ĐỨT phủ
 *   dưới cụm ghế · đường cong hữu cơ. Biến thể `B2`: mỗi cụm là một ĐẢO trên nền be, nhãn tên
 *   phòng ngay trên đảo.
 *
 * ▸ §0e KS2 — CÙNG ĐẦU VÀO → CÙNG KẾT QUẢ. Tuyệt đối **không `Math.random()`**: mọi nhiễu hữu cơ
 *   sinh từ `mulberry32(hash32(<khoá ổn định>))`, khoá lấy từ id entity. Mở lại bản vẽ ra đúng
 *   tán cây cũ, không "mỗi lần một kiểu".
 *
 * Hàm THUẦN, không DOM, không React. Test:
 *   `node_modules/.bin/sucrase-node lib/cad/plan-present.test.ts`
 */

import type { Doc, Entity, Layer, Pt } from './model';
import { entityBox } from './model';
import { BLOCK_MAP } from './furniture';

/* ═══════════════════════ 0 · BẢNG MÀU + CỠ — THAM SỐ, KHÔNG PHẢI HẰNG SỐ CHÔN ═══════════════════════ */

/**
 * Bảng màu chế độ trình bày. **Mọi trường đều truyền đè được** (TT). Không trường nào được phép
 * mang hex thương hiệu của bất kỳ studio nào — mặc định dưới đây là xám trung tính + một sắc lá.
 */
export interface PresentPalette {
  /** nền sàn — xám RẤT nhạt (`B1`). */
  floor: string;
  /** tường · lõi cứng · cột — đen đặc (`B1`). */
  structure: string;
  /** đồ đạc — nét xám trung, nhạt hơn tường để tường nổi lên. */
  furniture: string;
  /** cửa/cửa sổ — cùng họ đồ đạc, nhạt hơn một nấc. */
  opening: string;
  /** chữ · kích thước · ghi chú. */
  annotation: string;
  /** ĐIỂM MÀU DUY NHẤT của bản vẽ: cây xanh. */
  plant: string;
  /** người nhìn từ trên — xám trung tính, KHÔNG dùng màu thứ hai (giữ "điểm màu duy nhất"). */
  person: string;
  /** thảm định vùng — nét đứt mảnh. */
  rug: string;
  /** nền đảo (biến thể `B2`) — be nhạt. */
  island: string;
  /** nhãn tên khu đặt trên đảo. */
  islandLabel: string;
}

/**
 * Mặc định TRUNG TÍNH. Xám thang xanh-lạnh rất nhẹ + một sắc lá; không trùng hex thương hiệu nào.
 * Đây là **giá trị khởi điểm**, không phải chuẩn — studio truyền `palette` riêng thì file này
 * không cần biết studio đó là ai.
 */
export const NEUTRAL_PRESENT_PALETTE: PresentPalette = {
  floor: '#ecebe8',
  structure: '#1c1c1c',
  furniture: '#8a8a86',
  opening: '#b2b2ad',
  annotation: '#6a6a66',
  plant: '#5f8f5a',
  person: '#9a9a95',
  rug: '#b8b4ab',
  island: '#e6dfd2',
  islandLabel: '#5a5348',
};

/**
 * Cỡ hình trang trí (mm). **Dữ kiện ngành, không phải số của dự án nào** (§0h HG3). Truyền đè
 * được để hồ sơ tỉ lệ khác nhau vẫn cân — TB4: đổi số ở đây thì cả bản vẽ tự cập nhật.
 */
export interface PresentDecorSpec {
  /** bán kính tán cây (mm) — hai trị để rải xen kẽ to/nhỏ, tán tự do bất đối xứng. */
  plantRadiusMm: [number, number];
  /** số lá của một tán — càng nhiều càng tròn; 7–9 cho cảm giác vẽ tay. */
  plantLobes: number;
  /** biên độ méo tán (0–1) — 0 là hình tròn hoàn hảo (sai gu `B1`), 0.28 là "tự do". */
  plantWobble: number;
  /** bán kính vai người nhìn từ trên (mm). */
  personShoulderMm: number;
  /** bán kính đầu người nhìn từ trên (mm). */
  personHeadMm: number;
  /** thảm nới ra ngoài bao cụm bao nhiêu mm mỗi phía. */
  rugPaddingMm: number;
  /** biên độ méo thảm (0–1) — thảm tròn/tự do, không phải hình chữ nhật. */
  rugWobble: number;
  /** đảo nền (`B2`) nới ra ngoài bao cụm bao nhiêu mm mỗi phía. */
  islandPaddingMm: number;
  /** cỡ chữ nhãn đảo (mm-world). */
  islandLabelMm: number;
  /** cụm nhỏ hơn số món này thì KHÔNG trải thảm/không dựng đảo (một cái ghế lẻ không cần thảm). */
  minItemsPerCluster: number;
  /**
   * Khoảng cách gom cụm (mm) — hai món cách xa hơn thì thuộc hai cụm.
   *
   * 🔴 BẮT ĐƯỢC LÚC VERIFY TRÊN APP THẬT (05/08): để 2200 thì trong căn hộ ~60 m² **mọi món đồ
   * đều cách nhau dưới 2,2 m** ⇒ phòng khách + bàn ăn + bếp + giường gộp thành MỘT cụm ⇒ một
   * tấm thảm phủ kín cả căn, sai hẳn công thức `B1` (thảm nằm DƯỚI TỪNG cụm ghế). Hạ về **900**
   * = bề rộng lối đi một người (`lib/cad/standards/neufert.ts` `neufert-circulation-one-person`
   * `minWidthMm: 750`, làm tròn lên nấc 900 của lối đi chính): hai món mà **lọt được một người
   * đi giữa** thì thuộc hai cụm khác nhau. Đây là trị số có căn cứ nghề, không phải số chỉnh cho
   * vừa mắt.
   */
  clusterGapMm: number;
}

export const DEFAULT_DECOR_SPEC: PresentDecorSpec = {
  plantRadiusMm: [420, 620],
  plantLobes: 8,
  plantWobble: 0.28,
  personShoulderMm: 225,
  personHeadMm: 95,
  rugPaddingMm: 500,
  rugWobble: 0.12,
  islandPaddingMm: 900,
  islandLabelMm: 320,
  minItemsPerCluster: 3,
  clusterGapMm: 900,
};

/** Tiền tố id của MỌI entity phái sinh — dấu để không bao giờ lẫn vào `Doc` thật. */
export const PRESENT_ID_PREFIX = 'pv:';

export const isPresentDecor = (e: { id: string }): boolean => e.id.startsWith(PRESENT_ID_PREFIX);

/**
 * Lọc bỏ mọi entity phái sinh. **Chốt an toàn K1**: chỗ nào lỡ đưa doc phù du vào store thì gọi
 * hàm này trước. Không phải trang trí phòng thủ — `importDoc`/autosave đọc thẳng `doc.entities`.
 */
export const stripPresentDecor = <T extends { id: string }>(entities: T[]): T[] =>
  entities.filter((e) => !isPresentDecor(e));

/* ═══════════════════════ 0b · NGẪU NHIÊN TẤT ĐỊNH (§0e KS2) ═══════════════════════ */

/** FNV-1a 32-bit. Chuỗi ổn định → số ổn định. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — PRNG tất định, đủ tốt cho nhiễu hình học, KHÔNG dùng cho bảo mật. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ═══════════════════════ 1 · PHÂN VAI — K3: KHAI BÁO THẮNG SUY ĐOÁN ═══════════════════════ */

export type PresentRole = 'structure' | 'opening' | 'furniture' | 'annotation' | 'floor';

export interface RoleVerdict {
  role: PresentRole;
  /** true = phải SUY ĐOÁN (không có `elementType`), UI phải nói rõ. K3. */
  inferred: boolean;
  /** căn cứ — §0e KS5 "máy nói được vì sao". */
  why: string;
}

/**
 * Quy ước tên layer để suy vai khi entity CHƯA khai `elementType`.
 * ⚠️ **Đây là quy ước của BỘ HỒ SƠ, không phải chuẩn ngành** — mọi studio đặt tên layer một kiểu.
 * Vì thế nó là THAM SỐ truyền đè, không hardcode vào thuật toán (cùng lý do
 * `lib/cad/dxf-plan.ts:13` đã ghi cho danh sách layer của nó).
 */
export interface LayerRoleHints {
  structure: RegExp;
  opening: RegExp;
  annotation: RegExp;
  floor: RegExp;
}

/** Mặc định bắt theo TỪ KHOÁ chung của ngành (wall/column/door/dim…), không theo hồ sơ cụ thể nào. */
export const DEFAULT_LAYER_HINTS: LayerRoleHints = {
  structure: /(wall|column|col\b|core|stair|struct|tuong|cot|vach|loi)/i,
  opening: /(door|window|glass|cua|kinh)/i,
  annotation: /(dim|text|note|tag|label|anno|axis|truc|ghi[-_ ]?chu|kich[-_ ]?thuoc)/i,
  floor: /(floor|slab|san\b|nen)/i,
};

/**
 * BỎ DẤU TIẾNG VIỆT trước khi so tên layer.
 *
 * 🔴 BẮT ĐƯỢC LÚC VERIFY TRÊN APP THẬT (05/08): bản vẽ demo đặt tên layer **"Tường" · "Trục" ·
 * "Ghi chú"** — có dấu. Regex gợi ý viết không dấu (`tuong`/`truc`/`ghi chu`) nên **không khớp
 * cái nào**; 22 đường TRỤC rơi xuống nhánh mặc định và bị xếp thành ĐỒ ĐẠC, kéo cả lưới trục vào
 * cụm ⇒ thảm phủ kín bản vẽ. Bản vẽ tiếng Việt là ca THƯỜNG của sản phẩm này, không phải ngoại lệ.
 *
 * Dùng NFD + bỏ dấu thanh, và quy đ→d riêng (đ không phải chữ d có dấu nên NFD không tách được).
 */
export function foldVietnamese(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Phân vai 1 entity. Thứ tự đúng luật K3:
 *   ① `elementType` KHAI BÁO  →  ② `wallKind` khai báo  →  ③ loại entity  →  ④ tên layer (SUY ĐOÁN)
 * Không bao giờ đảo ngược. Suy đoán thì `inferred: true` để UI hiện "suy đoán" chứ không im.
 */
export function classifyPresentRole(
  doc: Doc,
  e: Entity,
  hints: LayerRoleHints = DEFAULT_LAYER_HINTS,
): RoleVerdict {
  // ① khai báo BIM — thắng tuyệt đối
  switch (e.elementType) {
    case 'wall':
    case 'column':
    case 'beam':
      return { role: 'structure', inferred: false, why: `elementType='${e.elementType}'` };
    case 'slab':
      return { role: 'floor', inferred: false, why: "elementType='slab'" };
    case 'door':
    case 'window':
      return { role: 'opening', inferred: false, why: `elementType='${e.elementType}'` };
    case 'furniture':
      return { role: 'furniture', inferred: false, why: "elementType='furniture'" };
    case 'space':
      return { role: 'annotation', inferred: false, why: "elementType='space'" };
    default:
      break;
  }

  // ② tường đã phân loại trong/ngoài ⇒ chắc chắn là tường (dù chưa gán elementType)
  if (e.wallKind) return { role: 'structure', inferred: false, why: `wallKind='${e.wallKind}'` };

  // ③ loại entity nói lên vai
  if (e.type === 'dim' || e.type === 'text') {
    return { role: 'annotation', inferred: false, why: `type='${e.type}'` };
  }
  if (e.type === 'block') {
    return { role: 'furniture', inferred: false, why: "type='block'" };
  }

  // ④ tên layer — SUY ĐOÁN, phải gắn cờ. So trên bản BỎ DẤU để bản vẽ tiếng Việt cũng khớp.
  const layerName = doc.layers.find((l) => l.id === e.layer)?.name ?? e.layer;
  const folded = foldVietnamese(layerName);
  if (hints.annotation.test(folded)) return { role: 'annotation', inferred: true, why: `layer "${layerName}"` };
  if (hints.opening.test(folded)) return { role: 'opening', inferred: true, why: `layer "${layerName}"` };
  if (hints.structure.test(folded)) return { role: 'structure', inferred: true, why: `layer "${layerName}"` };
  if (hints.floor.test(folded)) return { role: 'floor', inferred: true, why: `layer "${layerName}"` };

  // hatch không rõ nguồn: poché tường là ca phổ biến nhất trong bản vẽ mặt bằng
  if (e.type === 'hatch') return { role: 'structure', inferred: true, why: 'hatch chưa khai — mặc định coi là poché' };

  return { role: 'furniture', inferred: true, why: 'không có căn cứ nào — xếp vào đồ đạc' };
}

/* ═══════════════════════ 2 · MÀU + NÉT THEO VAI ═══════════════════════ */

export interface RoleDrawSpec {
  color: string;
  /** bề dày nét mm-giấy. Theo phân cấp ISO 128-2 wide:medium:narrow = 4:2:1 (§0f TB2). */
  lineweightMm: number;
}

/**
 * Nét là THÔNG TIN, không phải style (§0f TB2). Chế độ trình bày vẫn giữ đúng thứ bậc đọc bản vẽ:
 * kết cấu đậm nhất, đồ đạc vừa, ghi chú mảnh nhất. Chỉ có MÀU là đổi.
 */
export function roleDrawSpec(role: PresentRole, palette: PresentPalette): RoleDrawSpec {
  switch (role) {
    case 'structure': return { color: palette.structure, lineweightMm: 0.7 };
    case 'floor': return { color: palette.floor, lineweightMm: 0.18 };
    case 'opening': return { color: palette.opening, lineweightMm: 0.25 };
    case 'furniture': return { color: palette.furniture, lineweightMm: 0.35 };
    case 'annotation': return { color: palette.annotation, lineweightMm: 0.18 };
  }
}

/* ═══════════════════════ 3 · GOM CỤM — ĐƠN VỊ BỐ TRÍ LÀ CỤM (nguồn mục 3) ═══════════════════════ */

export interface PresentCluster {
  /** khoá ổn định (sinh từ id các món trong cụm, đã sắp) — hạt giống PRNG. §0e KS2. */
  key: string;
  minX: number; minY: number; maxX: number; maxY: number;
  count: number;
  /** id các entity thuộc cụm — để truy ngược, không để vẽ. */
  memberIds: string[];
}

/**
 * BAO THẬT của một món đồ.
 *
 * 🔴 VÌ SAO KHÔNG DÙNG THẲNG `entityBox()`: với entity `block`, `entityBox` cố tình xấp xỉ **±1200mm
 * CỐ ĐỊNH cho mọi block** — `lib/cad/model.ts` ghi rõ *"xấp xỉ: block chuẩn ~2000mm… Đủ cho
 * zoom-extents"*. Đúng cho việc của nó, nhưng SAI cho việc gom cụm: cái ghế 440mm cũng đọc ra
 * 2400×2400 ⇒ ghế cách nhau 1,5m vẫn "chạm" nhau ⇒ cả căn hộ gộp thành một cụm ⇒ một tấm thảm
 * phủ kín sàn (đúng lỗi bắt được trên app thật 05/08).
 *
 * ⇒ Ở đây đọc kích thước THẬT từ `BLOCK_MAP` (`lib/cad/furniture.ts`), áp `sx/sy` và góc xoay.
 * ⛔ KHÔNG sửa `entityBox()` — zoom-extents đang dựa vào hành vi cũ, đổi là hồi quy chỗ khác.
 */
function itemBox(e: Entity): { minX: number; minY: number; maxX: number; maxY: number } {
  if (e.type !== 'block') return entityBox(e);
  const def = BLOCK_MAP[e.block];
  if (!def) return entityBox(e); // block lạ (nhập từ DXF) — không biết cỡ thật, giữ xấp xỉ cũ
  const hw = (def.w * Math.abs(e.sx)) / 2;
  const hh = (def.h * Math.abs(e.sy)) / 2;
  const c = Math.abs(Math.cos(e.rot));
  const s = Math.abs(Math.sin(e.rot));
  const ex = hw * c + hh * s; // nửa bề rộng bao trục-song-song của hcn đã xoay
  const ey = hw * s + hh * c;
  return { minX: e.at.x - ex, minY: e.at.y - ey, maxX: e.at.x + ex, maxY: e.at.y + ey };
}

const boxOfCluster = (b: PresentCluster) => ({ w: b.maxX - b.minX, h: b.maxY - b.minY });
const centerOfCluster = (b: PresentCluster): Pt => ({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 });

/**
 * Gom đồ đạc thành CỤM bằng loang khoảng cách bao (union theo `gapMm`). Đây là "đơn vị bố trí là
 * CỤM, không phải từng món" của nguồn tham chiếu mục 3 — thảm/đảo/cây bám theo cụm chứ không
 * theo từng cái ghế.
 *
 * Thuật toán O(n²) trên SỐ MÓN ĐỒ (không phải số entity) — mặt bằng nội thất một sàn thường
 * vài trăm món, chấp nhận được. Bản vẽ nhập từ DXF hàng vạn nét thì phần lớn rơi vào 'structure'
 * nên không vào đây.
 */
export function furnitureClusters(
  doc: Doc,
  opts: { gapMm?: number; hints?: LayerRoleHints } = {},
): PresentCluster[] {
  const gap = opts.gapMm ?? DEFAULT_DECOR_SPEC.clusterGapMm;
  const items = doc.entities
    // ⛔ CHỈ gom ĐỒ ĐẠC THẬT: block, hoặc entity KHAI BÁO `elementType='furniture'`.
    // KHÔNG gom thứ chỉ *đoán* là đồ đạc. Lý do (bắt được trên app thật 05/08): nhánh mặc định
    // của `classifyPresentRole` trả 'furniture' cho mọi hình không có căn cứ nào — nên một đường
    // kẻ vô danh dài 15m cũng thành "đồ đạc" và kéo giãn cụm ra cả bản vẽ. Cụm là để đặt thảm/
    // đảo/cây; đặt nhầm còn tệ hơn không đặt (K3 — không suy đoán thay người dùng).
    .filter((e) => e.type === 'block' || e.elementType === 'furniture')
    .map((e) => ({ id: e.id, b: itemBox(e) }))
    .filter((x) => Number.isFinite(x.b.minX) && Number.isFinite(x.b.maxX));

  const used = new Array(items.length).fill(false);
  const out: PresentCluster[] = [];

  for (let i = 0; i < items.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    let cur = { ...items[i].b };
    const ids = [items[i].id];
    let grew = true;
    while (grew) {
      grew = false;
      for (let j = 0; j < items.length; j++) {
        if (used[j]) continue;
        const b = items[j].b;
        const near =
          b.minX <= cur.maxX + gap && b.maxX >= cur.minX - gap &&
          b.minY <= cur.maxY + gap && b.maxY >= cur.minY - gap;
        if (!near) continue;
        cur = {
          minX: Math.min(cur.minX, b.minX), minY: Math.min(cur.minY, b.minY),
          maxX: Math.max(cur.maxX, b.maxX), maxY: Math.max(cur.maxY, b.maxY),
        };
        used[j] = true;
        ids.push(items[j].id);
        grew = true;
      }
    }
    ids.sort();
    out.push({ key: ids.join('|'), ...cur, count: ids.length, memberIds: ids });
  }

  // cụm to trước — để đảo lớn vẽ dưới, đảo nhỏ vẽ trên, không bị nuốt
  return out.sort((a, b) => (b.maxX - b.minX) * (b.maxY - b.minY) - (a.maxX - a.minX) * (a.maxY - a.minY));
}

/* ═══════════════════════ 4 · TRANG TRÍ PHÁI SINH ═══════════════════════ */

export interface PresentOptions {
  palette?: Partial<PresentPalette>;
  decor?: Partial<PresentDecorSpec>;
  hints?: LayerRoleHints;
  /** `'flat'` = công thức `B1` (nền sàn phẳng xám nhạt). `'islands'` = biến thể `B2` (đảo trên nền be). */
  ground?: 'flat' | 'islands' | 'none';
  showRugs?: boolean;
  showPlants?: boolean;
  showPeople?: boolean;
  /** layer để gán cho entity phái sinh — mặc định layer đầu tiên của doc. */
  decorLayer?: string;
  /** nhãn cho từng cụm ở chế độ `islands`, tra theo `PresentCluster.key`. KHÔNG tự đặt tên —
   * không có nhãn thì đảo để trống (K3: không bịa tên khu). */
  clusterLabels?: Record<string, string>;
}

export interface PresentReport {
  clusters: number;
  rugs: number;
  plants: number;
  people: number;
  islands: number;
  /** số entity phải SUY ĐOÁN vai — K3, UI phải hiện con số này chứ không giấu. */
  inferredRoles: number;
  totalEntities: number;
  notes: string[];
}

/** Đa giác hữu cơ tất định quanh tâm — dùng chung cho tán cây và thảm ("đường cong hữu cơ"). */
function organicPolygon(c: Pt, rx: number, ry: number, lobes: number, wobble: number, rnd: () => number): Pt[] {
  const pts: Pt[] = [];
  const n = Math.max(5, Math.round(lobes));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rnd() * 2 - 1) * wobble;
    pts.push({ x: c.x + Math.cos(a) * rx * k, y: c.y + Math.sin(a) * ry * k });
  }
  return pts;
}

/**
 * Sinh lớp trang trí từ chính hình học đang có. **Không đọc gì ngoài `Doc`** ⇒ đổi bản vẽ thì
 * trang trí tự đổi theo (§0f TB4), không có toạ độ nào gõ tay.
 *
 * Thứ tự trả về đã tính sẵn cho `drawEntities` (`lib/cad/render.ts:494` vẽ theo đúng thứ tự mảng
 * trong nhóm hình học): đảo → thảm  ⇒ nằm DƯỚI đồ đạc thật; cây/người trả riêng để nơi gọi xếp
 * lên TRÊN.
 */
export function derivePresentDecor(
  doc: Doc,
  opts: PresentOptions = {},
): { under: Entity[]; over: Entity[]; report: PresentReport } {
  const palette = { ...NEUTRAL_PRESENT_PALETTE, ...opts.palette };
  const spec = { ...DEFAULT_DECOR_SPEC, ...opts.decor };
  const ground = opts.ground ?? 'flat';
  const layer = opts.decorLayer ?? doc.layers[0]?.id ?? 'l-wall';
  const under: Entity[] = [];
  const over: Entity[] = [];
  const notes: string[] = [];

  let inferredRoles = 0;
  for (const e of doc.entities) if (classifyPresentRole(doc, e, opts.hints).inferred) inferredRoles++;

  /**
   * 🔴 BẮT ĐƯỢC LÚC VERIFY TRÊN APP THẬT (05/08): cây đặt ở GÓC cụm + đệm thảm, mà cụm nằm sát
   * tường thì góc đó **rơi ra NGOÀI nhà** — mặt bằng hiện chậu cây lơ lửng ngoài ban công không
   * có. Kẹp mọi vật trang trí vào trong khung kết cấu. Không có khung (bản vẽ chưa có tường) thì
   * không kẹp — thà để nguyên còn hơn dịch đồ đi theo một khung bịa ra (K3).
   */
  const bounds = structureBox(doc, opts.hints);
  const clampIn = (p: Pt, margin: number): Pt =>
    bounds
      ? {
          x: Math.min(Math.max(p.x, bounds.minX + margin), bounds.maxX - margin),
          y: Math.min(Math.max(p.y, bounds.minY + margin), bounds.maxY - margin),
        }
      : p;

  const clusters = furnitureClusters(doc, { gapMm: spec.clusterGapMm, hints: opts.hints });
  const usable = clusters.filter((c) => c.count >= spec.minItemsPerCluster);
  if (clusters.length && !usable.length) {
    notes.push(`Có ${clusters.length} cụm nhưng cụm nào cũng dưới ${spec.minItemsPerCluster} món — không trải thảm/dựng đảo (món lẻ không cần).`);
  }

  let rugs = 0, plants = 0, people = 0, islands = 0;

  for (const c of usable) {
    const rnd = mulberry32(hash32(c.key));
    const ctr = centerOfCluster(c);
    const { w, h } = boxOfCluster(c);

    // ── ĐẢO NỀN (biến thể B2): hình nền tự do ÔM LẤY cụm ──
    if (ground === 'islands') {
      const pad = spec.islandPaddingMm;
      const poly = organicPolygon(ctr, w / 2 + pad, h / 2 + pad, 11, 0.10, rnd);
      under.push({
        id: `${PRESENT_ID_PREFIX}island-fill-${c.key.slice(0, 24)}`,
        type: 'hatch', layer, pattern: 'SOLID', solid: true,
        color: palette.island, points: poly,
      });
      islands++;
      const label = opts.clusterLabels?.[c.key];
      if (label) {
        // nhãn tên khu đặt NGAY TRÊN đảo (đúng B2) — chỉ khi có nhãn thật, không tự bịa tên.
        over.push({
          id: `${PRESENT_ID_PREFIX}island-label-${c.key.slice(0, 24)}`,
          type: 'text', layer, color: palette.islandLabel,
          at: { x: c.minX - pad, y: c.maxY + pad * 0.35 },
          text: label, h: spec.islandLabelMm,
        });
      }
    }

    // ── THẢM ĐỊNH VÙNG: tròn/tự do NÉT ĐỨT phủ dưới cụm — đây là công cụ ZONING ──
    if (opts.showRugs !== false) {
      const pad = spec.rugPaddingMm;
      const poly = organicPolygon(ctr, w / 2 + pad, h / 2 + pad, 13, spec.rugWobble, rnd);
      under.push({
        id: `${PRESENT_ID_PREFIX}rug-${c.key.slice(0, 24)}`,
        type: 'polyline', layer, points: poly, closed: true,
        color: palette.rug, lineType: 'dashed', lineweight: 0.18,
      });
      rugs++;
    }

    // ── CÂY XANH: rải THEO CỤM, tán tự do bất đối xứng, là ĐIỂM MÀU DUY NHẤT ──
    if (opts.showPlants !== false) {
      // đặt ở góc cụm — chỗ KTS hay kê chậu; số lượng theo cỡ cụm, không phải số cố định (TB4)
      const nPlants = Math.max(1, Math.min(4, Math.round(Math.sqrt(c.count) / 1.4)));
      const corners: Pt[] = [
        { x: c.minX - spec.rugPaddingMm, y: c.minY - spec.rugPaddingMm },
        { x: c.maxX + spec.rugPaddingMm, y: c.minY - spec.rugPaddingMm },
        { x: c.maxX + spec.rugPaddingMm, y: c.maxY + spec.rugPaddingMm },
        { x: c.minX - spec.rugPaddingMm, y: c.maxY + spec.rugPaddingMm },
      ];
      for (let i = 0; i < nPlants; i++) {
        const r = spec.plantRadiusMm[i % 2];
        // kẹp vào trong nhà, chừa đúng bán kính tán để không có lá nào thò qua tường
        const at = clampIn(corners[Math.floor(rnd() * corners.length)], r);
        const poly = organicPolygon(at, r, r * (0.85 + rnd() * 0.3), spec.plantLobes, spec.plantWobble, rnd);
        over.push({
          id: `${PRESENT_ID_PREFIX}plant-${c.key.slice(0, 16)}-${i}`,
          type: 'polyline', layer, points: poly, closed: true,
          color: palette.plant, lineweight: 0.25,
        });
        plants++;
      }
    }

    // ── NGƯỜI NHÌN TỪ TRÊN: đặt VÀI CHỖ (cho cảm giác sống + cho tỉ lệ) ──
    if (opts.showPeople !== false) {
      // "vài chỗ" = 1 người cho mỗi ~4 món, trần 3 — không rải khắp nơi (nguồn mục 2: tiết chế)
      const nPeople = Math.max(1, Math.min(3, Math.round(c.count / 4)));
      for (let i = 0; i < nPeople; i++) {
        const at = clampIn({ x: c.minX + rnd() * w, y: c.minY + rnd() * h }, spec.personShoulderMm);
        over.push({
          id: `${PRESENT_ID_PREFIX}person-body-${c.key.slice(0, 16)}-${i}`,
          type: 'polyline', layer, closed: true, color: palette.person, lineweight: 0.18,
          points: organicPolygon(at, spec.personShoulderMm, spec.personShoulderMm * 0.62, 9, 0.06, rnd),
        });
        over.push({
          id: `${PRESENT_ID_PREFIX}person-head-${c.key.slice(0, 16)}-${i}`,
          type: 'circle', layer, c: at, r: spec.personHeadMm,
          color: palette.person, lineweight: 0.18,
        });
        people++;
      }
    }
  }

  // ── NỀN SÀN PHẲNG (công thức B1) ──
  if (ground === 'flat') {
    const declared = doc.entities.filter((e) => e.elementType === 'slab');
    if (declared.length) {
      notes.push(`Nền sàn lấy từ ${declared.length} entity khai báo \`elementType='slab'\` — không suy đoán.`);
    } else {
      const bb = structureBox(doc, opts.hints);
      if (bb) {
        under.unshift({
          id: `${PRESENT_ID_PREFIX}ground`,
          type: 'hatch', layer, pattern: 'SOLID', solid: true, color: palette.floor,
          points: [
            { x: bb.minX, y: bb.minY }, { x: bb.maxX, y: bb.minY },
            { x: bb.maxX, y: bb.maxY }, { x: bb.minX, y: bb.maxY },
          ],
        });
        notes.push('Bản vẽ KHÔNG khai `elementType=\'slab\'` — nền sàn đang là khung bao của lớp kết cấu (SUY ĐOÁN, K3). Khai slab thì nền sẽ đúng hình sàn thật.');
      } else {
        notes.push('Không dựng được nền sàn: bản vẽ chưa có entity nào xếp vào vai kết cấu.');
      }
    }
  }

  return {
    under,
    over,
    report: {
      clusters: clusters.length, rugs, plants, people, islands,
      inferredRoles, totalEntities: doc.entities.length, notes,
    },
  };
}

/** Khung bao của riêng lớp KẾT CẤU — không lấy bao toàn bản vẽ (ghi chú/khung tên nằm rất xa). */
export function structureBox(doc: Doc, hints?: LayerRoleHints):
  { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of doc.entities) {
    const r = classifyPresentRole(doc, e, hints).role;
    if (r !== 'structure' && r !== 'floor') continue;
    const b = entityBox(e);
    if (!Number.isFinite(b.minX)) continue;
    minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY);
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

/* ═══════════════════════ 5 · ỐNG KÍNH — Doc PHÙ DU, KHÔNG BAO GIỜ LƯU ═══════════════════════ */

export interface PresentProjection {
  /** `Doc` PHÙ DU chỉ để VẼ. ⛔ KHÔNG đưa vào store/`.idf`/IndexedDB. */
  doc: Doc;
  report: PresentReport;
}

/**
 * ỐNG KÍNH TRÌNH BÀY — nhận `Doc` thật, trả `Doc` phù du đã đổi **màu · nét** và cộng lớp trang trí.
 *
 * ⛔ Không đụng `x/y/points/at/r/w/h` của bất kỳ entity nào — chỉ ghi đè `color`/`lineweight`.
 * Đây chính là chỗ giữ lời hứa "không đổi kích thước, không đổi vị trí": nếu về sau ai thêm phép
 * biến đổi toạ độ vào đây thì test `plan-present.test.ts` sẽ đỏ.
 */
export function presentProjection(doc: Doc, opts: PresentOptions = {}): PresentProjection {
  const palette = { ...NEUTRAL_PRESENT_PALETTE, ...opts.palette };
  const { under, over, report } = derivePresentDecor(doc, { ...opts, palette });

  // Layer giữ nguyên id/tên/visible — chỉ đổi màu để entity KHÔNG override màu vẫn ăn bảng mới.
  const layers: Layer[] = doc.layers.map((l) => ({ ...l, color: palette.annotation }));

  const recolored: Entity[] = doc.entities.map((e) => {
    const { role } = classifyPresentRole(doc, e, opts.hints);
    const spec = roleDrawSpec(role, palette);
    // ⚠️ ghi đè `color`: bản vẽ nhập từ DXF mang màu ACI TRÊN TỪNG ENTITY, đổi màu layer không đủ.
    return { ...e, color: spec.color, lineweight: spec.lineweightMm } as Entity;
  });

  return {
    doc: { ...doc, layers, entities: [...under, ...recolored, ...over] },
    report,
  };
}

/* ── bộ nhớ đệm 1 ô: canvas vẽ ~60fps, chiếu lại hàng vạn entity mỗi khung là giật ── */
let memoKey: string | null = null;
let memoDoc: Doc | null = null;
let memoOut: PresentProjection | null = null;

/**
 * Bản có nhớ của `presentProjection()`. Khoá = tham chiếu `Doc` + chuỗi hoá options.
 * `Doc` trong store là bất biến (mọi mutation tạo object mới) nên so tham chiếu là đủ và đúng.
 */
export function presentProjectionMemo(doc: Doc, opts: PresentOptions = {}): PresentProjection {
  const key = JSON.stringify(opts);
  if (memoOut && memoDoc === doc && memoKey === key) return memoOut;
  memoOut = presentProjection(doc, opts);
  memoDoc = doc;
  memoKey = key;
  return memoOut;
}

/** Xoá bộ nhớ đệm — dùng trong test để đo đúng lần tính lại. */
export function __clearPresentMemo(): void {
  memoKey = null; memoDoc = null; memoOut = null;
}
