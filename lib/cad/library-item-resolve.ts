/**
 * lib/cad/library-item-resolve.ts — món trên kệ Thư viện → thứ THẢ ĐƯỢC xuống bản vẽ (G-M3-14).
 *
 * Vì sao có file này (đo được 06/08, và chính `LibrarySheet.tsx:38` đã tự ghi chú từ 05/08):
 * ```bash
 * grep -rn "if:library-instantiate\|LIBRARY_INSTANTIATE_EVENT" app components lib
 * # → 1 chỗ PHÁT (components/library/LibrarySheet.tsx:138) · 0 chỗ NGHE
 * ```
 * Thả món từ Thư viện — cửa được chốt 04/08 là "cửa DUY NHẤT" — chỉ hiện toast *"Đã tạo bản làm
 * việc"* rồi thôi: **không có gì rơi xuống bản vẽ**, mà lời báo lại nói như đã xong. Riêng kệ
 * "cụm bàn" chạy thật vì `ClusterPanel` gọi thẳng `addEntities()`.
 *
 * File này CHỈ làm phần THUẦN: đối chiếu món trên kệ với hai kho hình có thật, để tầng UI biết
 * thả cái gì. Không tự fetch, không đụng store — nhờ vậy test được bằng sucrase-node.
 *
 * Hai kho hình (N7 — đã có, không dựng thêm kho thứ ba):
 *  ① `BLOCKS` (`lib/cad/furniture.ts`) — 46 block vector dựng sẵn. Thả ra **`BlockEntity` thật**,
 *    GIỮ ĐƯỢC DANH TÍNH (đếm được, chọn được, gán `specId` được) ⇒ ƯU TIÊN đường này.
 *  ② `public/cad-library/manifest.json` — 54 block .dxf. Thả ra đường rời (`flattenBlockEntities`)
 *    ⇒ mất danh tính, đúng bệnh G-M3-10 chưa sửa. Chỉ dùng khi ① không có món tương ứng, và
 *    tầng UI PHẢI nói rõ điều đó thay vì im lặng.
 *
 * Không khớp được kho nào ⇒ trả `null` để UI báo THẬT ("chưa có hình cho món này"), tuyệt đối
 * không thả bừa một cái hộp mang tên món khác.
 */

import { BLOCKS, type BlockDef } from './furniture';
import type { LibraryBlockMeta, LibraryManifest } from './block-library';
import { matchSpec } from '../library/spec-panel';

/** Hình lát tối thiểu của món trên kệ (`SheetItem` của `lib/library/shelves.ts`) — chỉ nhận 3
 * trường cần cho việc đối chiếu, để module này không phụ thuộc tầng UI. */
export interface LibraryItemRef {
  name: string;
  code: string;
  /** loại ô xem trước trên kệ ('block' | 'furniture' | 'material' | …) — dùng để LOẠI SỚM món
   * không phải hình vẽ (vd vật liệu, preset), tránh cố khớp rồi khớp nhầm. */
  kind?: string;
}

/** Bản ghi kho vật liệu tối thiểu cần để đối chiếu — khớp DTO thật của `GET /api/specs`
 * (`lib/server/specs.ts` `specToDto`), chỉ khai 2 trường dùng tới để module này không phụ thuộc
 * tầng server. */
export interface SpecRef {
  id: string;
  sku?: string | null;
}

export type ResolvedLibraryItem =
  | { via: 'blockdef'; def: BlockDef; keepsIdentity: true; approximate: boolean; specId?: string }
  | { via: 'manifest'; meta: LibraryBlockMeta; keepsIdentity: false; approximate: boolean; specId?: string };

/** Loại món trên kệ CÓ THỂ là hình vẽ thả xuống bản vẽ được. Vật liệu/hatch/preset/theme thì
 * KHÔNG (chúng đi đường "áp lên vật đang chọn" — `LIBRARY_APPLY_EVENT`, việc khác). */
export const DROPPABLE_ITEM_KINDS = ['block', 'furniture', 'symbol', 'cluster', 'sanitary', 'misc'] as const;

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** Chuẩn hoá để so tên: bỏ dấu tiếng Việt, đ→d, thường hoá, bỏ mọi ký tự không phải chữ/số.
 * "Sofa 3 chỗ" → "sofa3cho" · "SOFA-3S" → "sofa3s" · "Bàn làm việc 1400×700" → "banlamviec1400700". */
export function normalizeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * 🔴 VÁ 06/08 — vòng kiểm phản biện phá được bản đầu: nó dùng `pool.find` (AI ĐỨNG TRƯỚC trong
 * `BLOCKS` thì ăn) với luật `bn.includes(name) || name.includes(bn)`. Dò có hệ thống 46 block ra
 * **3 cặp khoá lồng nhau, cả 3 đều để block SAI đứng trước**:
 *   · "Bàn trang điểm có gương" → **Bàn trà** (đúng phải là Bàn trang điểm — CÓ SẴN trong kho)
 *   · "Cửa sổ trượt loại A"     → **Cửa sổ** (đúng: Cửa sổ trượt)
 *   · "Cửa sổ cố định loại A"   → **Cửa sổ** (đúng: Cửa sổ cố định)
 * Nguy hiểm hơn không-khớp: `LibraryDropBridge` báo `Đã thả "Bàn trà"` với `keepsIdentity:true`,
 * entity vào Doc, đếm được, gán `specId` được ⇒ **lên BOQ như hàng thật**. Ca cửa sổ còn kéo theo
 * boolean khoét tường sai loại.
 *
 * Luật mới, theo đúng thứ tự chắc chắn giảm dần:
 *  ① trùng khít tên/id ⇒ nhận, `approximate:false`.
 *  ② tên trên kệ CHI TIẾT HƠN tên kho (`name.includes(bn)`) ⇒ nhận cái **DÀI NHẤT** (cụ thể nhất),
 *    không phải cái gặp trước. Đây là chỗ 3 cặp trên bị sai.
 *  ③ tên trên kệ NGẮN HƠN tên kho (`bn.includes(name)`) ⇒ mơ hồ thật sự ("Cửa sổ" khớp được cả
 *    trượt/cố định/thường). Chỉ nhận khi **DUY NHẤT MỘT** ứng viên; nhiều hơn ⇒ trả `null` để UI
 *    nói "chưa có hình", **thà không thả còn hơn thả nhầm**.
 * Khớp ở ② hoặc ③ đều gắn `approximate:true` để tầng UI nói rõ "khớp gần đúng", không im lặng.
 */
function matchByName<T extends { name: string; id: string }>(
  pool: T[],
  item: LibraryItemRef,
): { hit: T; approximate: boolean } | null {
  const name = normalizeKey(item.name);
  const code = normalizeKey(item.code);
  if (!name && !code) return null;

  const exact = pool.find((b) => normalizeKey(b.name) === name || normalizeKey(b.id) === code || normalizeKey(b.id) === name);
  if (exact) return { hit: exact, approximate: false };

  // Chặn dưới 4 ký tự để không cho "ghe" vồ bừa mọi thứ có chữ "ghe".
  if (name.length < 4) return null;

  // ② kệ chi tiết hơn kho → lấy tên kho DÀI NHẤT nằm trong tên kệ.
  const contained = pool
    .map((b) => ({ b, bn: normalizeKey(b.name) }))
    .filter(({ bn }) => bn.length >= 4 && name.includes(bn))
    .sort((x, y) => y.bn.length - x.bn.length);
  if (contained.length) return { hit: contained[0].b, approximate: true };

  // ③ kệ ngắn hơn kho → chỉ nhận khi không có đối thủ.
  const wider = pool.filter((b) => normalizeKey(b.name).includes(name));
  if (wider.length === 1) return { hit: wider[0], approximate: true };

  return null;
}

/**
 * Đối chiếu món trên kệ với hai kho hình. Ưu tiên `BLOCKS` (giữ danh tính) rồi mới tới manifest.
 * `manifest` null/undefined (chưa tải xong) ⇒ chỉ tra được kho ①, KHÔNG coi là "không có".
 *
 * `specs` (G-A-01, VIỆC 3 07/08) — kho vật liệu/thương mại thật (`GET /api/specs`), optional.
 * Khớp `item.code` ↔ `ProductSpec.sku` — CÙNG hàm `matchSpec()` mà cột thông số ④ của tấm Thư
 * viện đã dùng (`lib/library/spec-panel.ts`), để "món hiện thông số gì" và "món thả xuống mang
 * specId gì" LUÔN đồng nhất, không phải hai đường so khớp khác nhau ra hai kết quả lệch nhau.
 * Không truyền `specs` (caller cũ) ⇒ hành vi y nguyên, `specId` luôn `undefined`.
 */
export function resolveLibraryItem(
  item: LibraryItemRef,
  manifest?: LibraryManifest | null,
  specs?: readonly SpecRef[],
): ResolvedLibraryItem | null {
  if (item.kind && !(DROPPABLE_ITEM_KINDS as readonly string[]).includes(item.kind)) return null;

  const specId = specs?.length ? matchSpec(item.code, specs)?.id : undefined;

  const def = matchByName(BLOCKS, item);
  if (def) return { via: 'blockdef', def: def.hit, keepsIdentity: true, approximate: def.approximate, specId };

  if (manifest?.blocks?.length) {
    const meta = matchByName(manifest.blocks, item);
    if (meta) return { via: 'manifest', meta: meta.hit, keepsIdentity: false, approximate: meta.approximate, specId };
  }
  return null;
}

/** Câu báo cho người dùng khi KHÔNG khớp được — nói thật + chỉ đường làm tiếp, không đổ lỗi.
 * (`docs/SPEC-NGON-NGU-CHI-DAN.md`: hành động trước, không jargon, luôn kèm việc làm được.) */
export function unresolvedMessage(item: LibraryItemRef): string {
  return `Chưa có hình vẽ cho "${item.name}" — kho block chưa có món này. Dùng panel Nội thất để chọn block gần đúng.`;
}
