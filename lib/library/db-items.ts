'use client';

/**
 * lib/library/db-items.ts — nguồn kệ THẬT cho Thư viện sheet (12/08, entry `library-data-that`).
 *
 * Đọc DB `LibraryAsset` qua `GET /api/library` (kiến trúc có sẵn — cùng route mà `/library/ingest`
 * POST vào), map từng asset thành `SheetItem` để `itemsFor()` trộn với món built-in. KHÔNG còn
 * `ITEMS_BY_SHELF` bịa: kệ nào kho chưa có gì thì để trống, UI hiện empty-state có nút nhập.
 *
 * QUY ƯỚC TAG (điều khiển được từ dữ liệu, không sửa code):
 *   · `shelf:<id>`  — ép món vào đúng kệ (vd `shelf:render-preset`). Không có thì suy từ `usage`.
 *   · `thumb:<kind>` — ép LOẠI ô xem trước (`ThumbKind`, vd `thumb:light-gold`). Không có thì suy
 *     từ tên/category theo từ khoá; suy không ra thì rơi về loại trung tính, KHÔNG bịa vật liệu.
 *   · `code:<X>`    — mã hiển thị; thiếu thì dẫn xuất ổn định từ id (`LIB-XXXXXX`).
 */

import { useCallback, useEffect, useState } from 'react';
import { mechanicOfShelf, type SheetItem } from './shelves';
import type { ThumbKind } from './thumb-kinds';

/** Trường mình dùng từ payload `GET /api/library` — route trả nhiều hơn, chỉ khai phần cần. */
export interface LibraryApiAsset {
  id: string;
  name: string;
  category: string;
  tags: string;
  usage: string;
  url: string;
}

const THUMB_KINDS: ThumbKind[] = [
  'wood', 'stone', 'metal', 'paint', 'fabric', 'glass',
  'block', 'furniture', 'sanitary', 'misc', 'page', 'sheet',
  'light-gold', 'light-overcast', 'light-night', 'light-dawn', 'light-studio',
];

function tagList(tags: string): string[] {
  return tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
}

function taggedValue(tags: string[], prefix: string): string | null {
  const hit = tags.find((t) => t.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

/** Kệ đích của 1 asset — tag `shelf:` thắng; thiếu thì suy từ `usage` (RefUsage của route). */
export function shelfOfAsset(a: Pick<LibraryApiAsset, 'tags' | 'usage'>): string {
  const explicit = taggedValue(tagList(a.tags), 'shelf:');
  if (explicit) return explicit;
  switch (a.usage) {
    case 'material':
      return 'common-atlas';
    // ref-render / slide / layout / brief / cad / furniture… đều là ẢNH THAM CHIẾU khi chưa khai
    // kệ riêng — về kệ "Ảnh & tài sản", không đoán thành template/preset (N4: không bịa phân loại).
    default:
      return 'common-asset';
  }
}

/** Từ khoá → loại vật liệu; chỉ dùng cho asset usage=material (kệ vật liệu cần loại để lên nhóm). */
function materialKindOf(text: string): ThumbKind {
  const s = text.toLowerCase();
  if (/(go |gỗ|wood|oak|walnut|soi|óc chó)/.test(s)) return 'wood';
  if (/(đá|da tu nhien|stone|marble|granite|gach|gạch|terrazzo|tile)/.test(s)) return 'stone';
  if (/(sơn|son |paint|vữa|plaster|stucco)/.test(s)) return 'paint';
  if (/(vải|vai |fabric|linen|nhung|velvet|da thuộc|leather)/.test(s)) return 'fabric';
  if (/(kim loại|metal|thép|thep|đồng|inox|nhôm|brass|steel)/.test(s)) return 'metal';
  if (/(kính|kinh |glass)/.test(s)) return 'glass';
  // Không suy ra được → 'paint' là loại trung tính nhất của kệ vật liệu (vân phẳng, không vẽ vân
  // gỗ/đá sai bản chất). Ảnh thật (imageUrl) vẫn thắng nên loại này hầu như không lộ ra.
  return 'paint';
}

export function thumbKindOfAsset(a: Pick<LibraryApiAsset, 'tags' | 'usage' | 'name' | 'category'>): ThumbKind {
  const explicit = taggedValue(tagList(a.tags), 'thumb:');
  if (explicit && (THUMB_KINDS as string[]).includes(explicit)) return explicit as ThumbKind;
  if (a.usage === 'material') return materialKindOf(`${a.name} ${a.category} ${a.tags}`);
  if (a.usage === 'furniture') return 'furniture';
  return 'sheet'; // ảnh tham chiếu/layout — khung trung tính, ảnh thật đè lên
}

/** Map 1 asset DB → SheetItem. Thuần, test được không cần fetch. */
export function assetToSheetItem(a: LibraryApiAsset): SheetItem {
  const tags = tagList(a.tags);
  const shelfId = shelfOfAsset(a);
  // `mo3d:<id biểu diễn>` — cửa nhận diện cấu kiện ghi vào lúc lưu. Hai tệp nằm CẠNH NHAU dưới
  // cùng một đoạn đường nên MTLLoader phân giải được texture tương đối, không phải viết lại .mtl.
  // ⚠️ ĐỌC TỪ CHUỖI GỐC, không qua `tags` — `tagList()` hạ chữ thường, mà đây là một ID phải giữ
  // nguyên byte. Prisma `cuid()` hiện toàn chữ thường nên hạ chữ chưa gây hại, nhưng một id có
  // hoa là hỏng câm: URL trả 404 và không ai biết vì sao.
  const rep3d =
    a.tags
      .split(',')
      .map((t) => t.trim())
      .find((t) => t.startsWith('mo3d:'))
      ?.slice(5) ?? null;
  return {
    id: `db:${a.id}`,
    shelfId,
    name: a.name,
    code: taggedValue(tags, 'code:')?.toUpperCase() ?? `LIB-${a.id.slice(-6).toUpperCase()}`,
    kind: thumbKindOfAsset(a),
    // Kho `/api/library` là kho dùng chung cả team ⇒ tầng STUDIO (đúng nghĩa ScopeLevel).
    scope: 'studio',
    mechanic: mechanicOfShelf(shelfId),
    imageUrl: a.url,
    ...(rep3d
      ? {
          model3d: {
            glbUrl: `/api/idfc-import/tep/${rep3d}/mon.obj`,
            mtlUrl: `/api/idfc-import/tep/${rep3d}/mon.mtl`,
          },
        }
      : {}),
  };
}

/** Trần món/kệ khi hiển thị — kho thật đang có >1.500 ảnh ref; lưới sheet chưa ảo hoá (mỗi món là
 * 1 <button> nền ảnh) nên đổ hết là nghẽn tab. Lấy MỚI NHẤT trước (API đã sort desc). Số đếm trên
 * kệ dùng đúng số đã hiển thị — không khai số to hơn số bày ra. TODO (entry sau): ảo hoá lưới rồi
 * bỏ trần. */
const MAX_PER_SHELF = 240;

export function mapAssets(assets: LibraryApiAsset[]): SheetItem[] {
  const perShelf = new Map<string, number>();
  const out: SheetItem[] = [];
  for (const a of assets) {
    const item = assetToSheetItem(a);
    const n = perShelf.get(item.shelfId) ?? 0;
    if (n >= MAX_PER_SHELF) continue;
    perShelf.set(item.shelfId, n + 1);
    out.push(item);
  }
  return out;
}

/**
 * Hook cho `LibrarySheet` — tải kho khi sheet MỞ lần đầu, cache trong phiên; `refresh()` để nạp
 * lại sau khi nhập thêm. Lỗi mạng/401 ⇒ danh sách rỗng (kệ hiện empty-state), không chặn sheet.
 */
export function useLibraryDbItems(open: boolean): { dbItems: SheetItem[]; dbLoaded: boolean; refreshDb: () => void } {
  const [dbItems, setDbItems] = useState<SheetItem[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    if (!open || dbLoaded) return;
    let cancelled = false;
    fetch('/api/library')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.assets)) setDbItems(mapAssets(data.assets as LibraryApiAsset[]));
      })
      .catch(() => {
        // offline/401 — kho coi như rỗng, empty-state nói tiếp phần còn lại
      })
      .finally(() => {
        if (!cancelled) setDbLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, dbLoaded]);

  const refreshDb = useCallback(() => setDbLoaded(false), []);
  return { dbItems, dbLoaded, refreshDb };
}
