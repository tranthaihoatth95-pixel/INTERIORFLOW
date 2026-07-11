/**
 * lib/cad/block-library.ts — LOADER thư viện block CAD tải từ `public/cad-library/manifest.json`.
 *
 * KHÔNG đụng `lib/cad/furniture.ts` (thư viện block "vẽ tay" cũ, dùng BlockEntity + BLOCK_MAP)
 * hay `components/cad/**`. Đây là một NGUỒN BLOCK ĐỘC LẬP: mỗi block là 1 file .dxf thật, được
 * `lib/cad/dxf.ts` (parser sẵn có, chỉ IMPORT không sửa) parse thành `Doc`, rồi "làm phẳng"
 * (translate/rotate/scale) thành các `Entity` chuẩn (line/polyline/circle/arc/text) — CÙNG
 * kiểu dữ liệu app đã vẽ tay được, nên chèn thẳng vào `doc.entities` là hiển thị đúng trên
 * CadCanvas hiện có mà KHÔNG cần sửa panel/renderer nào (không phụ thuộc BLOCK_MAP).
 *
 * Cách agent CAD / phiên chính nối vào panel "Thư viện nội thất" thật (sau này):
 *   1. `const manifest = await loadManifest()`
 *   2. Hiển thị `groupByCategory(manifest)` trong panel (thay/song song BLOCKS của furniture.ts)
 *   3. Khi user click 1 block + click vào canvas tại điểm `at`:
 *        `const entities = await insertBlockById(manifest, blockId, at, { rot, layer: currentLayer })`
 *        rồi gọi `useCadStore.getState().addEntity(...)` cho từng entity (hoặc 1 action mới
 *        "addEntities" nếu muốn 1 bước undo cho cả block).
 */

import type { Doc, Entity, Pt } from './model';
import { parseDxf } from './dxf';

export interface LibraryBlockMeta {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  /** kích thước bao (mm) */
  w: number;
  h: number;
  /** đường dẫn public tới file .dxf */
  file: string;
  /** đường dẫn public tới thumbnail .svg */
  thumb: string;
  source: string;
  license: string;
}

export interface LibraryCategory {
  slug: string;
  label: string;
}

export interface LibraryManifest {
  version: number;
  generatedAt: string;
  unit: 'mm' | string;
  count: number;
  categories: LibraryCategory[];
  blocks: LibraryBlockMeta[];
}

/* ───────────────────────── tải manifest + doc (có cache) ───────────────────────── */

let manifestPromise: Promise<LibraryManifest> | null = null;

/** Tải `manifest.json` (cache trong bộ nhớ theo phiên trang — gọi lại nhiều lần không tốn request). */
export function loadManifest(baseUrl = ''): Promise<LibraryManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${baseUrl}/cad-library/manifest.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Không tải được manifest thư viện block (HTTP ${r.status})`);
        return r.json() as Promise<LibraryManifest>;
      })
      .catch((err) => {
        manifestPromise = null; // cho phép retry ở lần gọi sau
        throw err;
      });
  }
  return manifestPromise;
}

/** Xoá cache manifest (hữu ích khi dev sinh lại thư viện và muốn tải bản mới). */
export function resetManifestCache(): void {
  manifestPromise = null;
  docCache.clear();
}

const docCache = new Map<string, Doc>();

/** Tải + parse 1 file .dxf của block (cache theo id). */
export async function loadBlockDoc(meta: LibraryBlockMeta, baseUrl = ''): Promise<Doc> {
  const cached = docCache.get(meta.id);
  if (cached) return cached;
  const res = await fetch(`${baseUrl}${meta.file}`);
  if (!res.ok) throw new Error(`Không tải được block '${meta.id}' (HTTP ${res.status})`);
  const text = await res.text();
  const doc = parseDxf(text);
  docCache.set(meta.id, doc);
  return doc;
}

/* ───────────────────────── làm phẳng block → Entity chèn thẳng vào Doc ───────────────────────── */

let uidSeq = 0;
function genId(prefix = 'lib'): string {
  uidSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${uidSeq}`;
}

export interface InsertOptions {
  /** góc xoay, radian (mặc định 0) */
  rot?: number;
  /** tỉ lệ theo X (mặc định 1; âm = lật gương ngang) */
  sx?: number;
  /** tỉ lệ theo Y (mặc định = sx, tức scale đều) */
  sy?: number;
  /** id layer đích trong Doc nhận entity — mặc định 'l-furniture' (layer "Nội thất" chuẩn của model.ts) */
  layer?: string;
}

/** translate → rotate → scale THEO ĐÚNG thứ tự `blockLocalToWorld` của lib/cad/render.ts
 *  (scale trước, rồi rotate, rồi translate) để hành vi giống hệt block "vẽ tay" cũ. */
function transformPt(p: Pt, at: Pt, rot: number, sx: number, sy: number): Pt {
  const x = p.x * sx;
  const y = p.y * sy;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return { x: at.x + x * cos - y * sin, y: at.y + x * sin + y * cos };
}

/**
 * Làm phẳng toàn bộ entity của 1 block (đã parse từ DXF, toạ độ local quanh gốc 0,0) thành
 * mảng `Entity` mới đã áp transform tại điểm `at` — id mới, layer gán theo `opts.layer`.
 * Kết quả sẵn sàng `doc.entities.push(...)` hoặc gọi action `addEntity` của store CAD hiện có.
 */
export function flattenBlockEntities(blockDoc: Doc, at: Pt, opts: InsertOptions = {}): Entity[] {
  const rot = opts.rot ?? 0;
  const sx = opts.sx ?? 1;
  const sy = opts.sy ?? sx;
  const layer = opts.layer ?? 'l-furniture';
  const scaleMag = Math.max(Math.abs(sx), Math.abs(sy));

  const out: Entity[] = [];
  for (const e of blockDoc.entities) {
    switch (e.type) {
      case 'line':
        out.push({ id: genId(), type: 'line', layer, color: e.color, a: transformPt(e.a, at, rot, sx, sy), b: transformPt(e.b, at, rot, sx, sy) });
        break;
      case 'polyline':
        out.push({
          id: genId(),
          type: 'polyline',
          layer,
          color: e.color,
          closed: e.closed,
          points: e.points.map((p) => transformPt(p, at, rot, sx, sy)),
        });
        break;
      case 'circle':
        out.push({ id: genId(), type: 'circle', layer, color: e.color, c: transformPt(e.c, at, rot, sx, sy), r: e.r * scaleMag });
        break;
      case 'arc':
        out.push({
          id: genId(),
          type: 'arc',
          layer,
          color: e.color,
          c: transformPt(e.c, at, rot, sx, sy),
          r: e.r * scaleMag,
          a1: e.a1 + rot,
          a2: e.a2 + rot,
        });
        break;
      case 'text':
        out.push({ id: genId(), type: 'text', layer, color: e.color, at: transformPt(e.at, at, rot, sx, sy), text: e.text, h: e.h * scaleMag });
        break;
      case 'rect': {
        // phòng trường hợp DXF nguồn khác chứa RECT (parser hiện không sinh loại này) → quy về polyline.
        const pts = [
          { x: e.x, y: e.y },
          { x: e.x + e.w, y: e.y },
          { x: e.x + e.w, y: e.y + e.h },
          { x: e.x, y: e.y + e.h },
        ].map((p) => transformPt(p, at, rot, sx, sy));
        out.push({ id: genId(), type: 'polyline', layer, color: e.color, points: pts, closed: true });
        break;
      }
      default:
        // 'dim' / 'block' lồng nhau — block thư viện tự dựng không sinh ra các loại này.
        break;
    }
  }
  return out;
}

/** Tải + làm phẳng 1 block theo id trong manifest — tiện dùng trực tiếp từ UI. */
export async function insertBlockById(
  manifest: LibraryManifest,
  id: string,
  at: Pt,
  opts?: InsertOptions,
  baseUrl = '',
): Promise<Entity[]> {
  const meta = manifest.blocks.find((b) => b.id === id);
  if (!meta) throw new Error(`Không tìm thấy block '${id}' trong manifest thư viện`);
  const blockDoc = await loadBlockDoc(meta, baseUrl);
  return flattenBlockEntities(blockDoc, at, opts);
}

/* ───────────────────────── tiện ích duyệt/tìm kiếm ───────────────────────── */

export function groupByCategory(manifest: LibraryManifest): Map<string, LibraryBlockMeta[]> {
  const map = new Map<string, LibraryBlockMeta[]>();
  for (const b of manifest.blocks) {
    if (!map.has(b.category)) map.set(b.category, []);
    map.get(b.category)!.push(b);
  }
  return map;
}

export function searchBlocks(manifest: LibraryManifest, query: string): LibraryBlockMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return manifest.blocks;
  return manifest.blocks.filter(
    (b) => b.name.toLowerCase().includes(q) || b.category.includes(q) || b.categoryLabel.toLowerCase().includes(q),
  );
}
