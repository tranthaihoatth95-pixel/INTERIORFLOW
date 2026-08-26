/**
 * lib/idfc-seed/index.ts — KHO MẦM Thư viện: hàm THUẦN đọc `seed.generated.ts`.
 *
 * ▸ VÌ SAO CÓ (Lane B, 22/08): kệ "Cấu kiện (.idfc)" của `LibrarySheet` đọc `idfc-store`
 *   (IndexedDB per-máy) — máy mới mở ra là **0 món**. Toàn bộ tài sản thật của repo (54 block
 *   .dxf + 13 preset vật liệu + 6 cụm bàn sinh bằng hàm) nằm ngoài kệ, không ai thấy.
 *   Kho mầm là phần "hàng có sẵn khi cài app", đứng TRƯỚC kho của studio.
 *
 * ▸ [Đ2] KHÔNG PHẢI KHO THỨ HAI. Món ở đây là đúng `ParsedIdfc` — CÙNG kiểu, CÙNG kệ, CÙNG
 *   đường hiển thị với món studio tự nhập. Khác đúng một điều: nó **chỉ đọc**
 *   (`laKhoMam: true`), vì nó đi kèm bản cài chứ không thuộc studio.
 *
 * ▸ MỘT VẬT — NHIỀU MẶT (§11). Một `.idfc` là MỘT danh tính (`meta.code`) lộ ra nhiều MẶT:
 *   mặt 2D (`geom2d.prims`) · mặt 3D (`geom3d`) · mặt vật liệu (`pbr`/`hatch2d`/`matId`) ·
 *   mặt ảnh xem trước · mặt thương mại (`commerce`).
 *   `matBieuDienCua()` **ĐỌC RA** danh sách mặt từ chính dữ liệu — không phải nhãn khai tay,
 *   nên không có cách nào khoe một mặt mà đằng sau trống.
 *
 * ▸ ⛔ Kho mầm KHÔNG BAO GIỜ đè kho studio: studio nhập một `.idfc` cùng mã ⇒ **bản của
 *   studio thắng** (`tronKhoMam`). Người dùng sửa được thứ app phát cho, không bị khoá.
 */

import type { ParsedIdfc } from '../cad/idfc';
import { SEED_IDFC_ITEMS, SEED_PROVENANCE } from './seed.generated';
import type { MatBieuDien, SeedProvenance } from './types';

export { SEED_IDFC_ITEMS, SEED_PROVENANCE };
export { MAT_LABEL } from './types';
export type { MatBieuDien, SeedProvenance, DoTinCay } from './types';

/** Hình lát tối thiểu để trộn — mọi thứ có `meta.code` đều trộn được, không buộc phải là StoredIdfc. */
interface CoMaCode {
  meta: { code: string };
}

/** Gia phả của một món mầm — `undefined` nếu mã không thuộc kho mầm (vd món studio tự nhập). */
export function giaPhaCua(code: string): SeedProvenance | undefined {
  return SEED_PROVENANCE[code];
}

/** Ảnh xem trước THẬT (đường dẫn public) của món mầm; `undefined` khi nguồn không kèm ảnh. */
export function anhXemTruocCua(code: string): string | undefined {
  return SEED_PROVENANCE[code]?.anhXemTruoc;
}

/** Món này có phải hàng đi kèm bản cài không (⇒ chỉ đọc). */
export function laKhoMam(code: string): boolean {
  return code in SEED_PROVENANCE;
}

/**
 * CÁC MẶT một danh tính lộ ra — SUY TỪ DỮ LIỆU, không khai tay.
 * Thứ tự cố định để giao diện không nhảy giữa các món.
 */
export function matBieuDienCua(item: ParsedIdfc): MatBieuDien[] {
  const out: MatBieuDien[] = [];
  const body = item.body;

  // ① mặt 2D — chỉ tính khi THẬT SỰ có hình (prims rỗng = không có mặt 2D, dù trường tồn tại).
  const geom2d =
    body.type === 'component' ? body.geom2d : body.type === 'material' ? body.symbol2d : undefined;
  if ((geom2d?.prims.length ?? 0) > 0) out.push('2d');
  // Vật liệu có ký hiệu hatch cũng là một mặt 2D dùng được trên bản vẽ.
  else if (body.type === 'material' && body.hatch2d) out.push('2d');

  // ② mặt 3D — cao đùn, hoặc PBR gắn thẳng vào cấu kiện.
  if (body.type === 'component' && body.geom3d && (body.geom3d.heightMm !== undefined || body.geom3d.pbr || body.geom3d.matId)) {
    out.push('3d');
  }
  if (body.type === 'material' && Object.keys(body.pbr ?? {}).length > 0) out.push('3d');

  // ③ mặt vật liệu — bản thân nó LÀ vật liệu, hoặc nó TRỎ TỚI một vật liệu (matId).
  if (body.type === 'material') out.push('vat-lieu');
  else if (body.type === 'component' && body.geom3d?.matId) out.push('vat-lieu');

  // ④ mặt ảnh — chỉ tính khi gia phả có tệp ảnh thật.
  if (anhXemTruocCua(item.meta.code)) out.push('anh');

  // ⑤ mặt thương mại — CHỈ khi có dữ liệu thật; kho mầm hiện 0 món (repo không có nguồn giá).
  if (item.commerce && Object.keys(item.commerce).length > 0) out.push('thuong-mai');

  return out;
}

/**
 * Trộn kho mầm với kho studio. Khoá gộp là `meta.code` (danh tính món) —
 * **studio thắng**, đúng luật "bản chèn/bản của studio đè bản phát kèm, không ngược lại".
 * Giữ nguyên thứ tự: mầm trước, món studio-mới sau (studio thấy hàng mình nhập ở cuối, ổn định).
 */
export function tronKhoMam<T extends CoMaCode>(khoStudio: readonly T[]): (ParsedIdfc | T)[] {
  const cuaStudio = new Map(khoStudio.map((s) => [s.meta.code, s]));
  const out: (ParsedIdfc | T)[] = [];
  for (const mam of SEED_IDFC_ITEMS) out.push(cuaStudio.get(mam.meta.code) ?? mam);
  for (const s of khoStudio) if (!SEED_PROVENANCE[s.meta.code]) out.push(s);
  return out;
}
