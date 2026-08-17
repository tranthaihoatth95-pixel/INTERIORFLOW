/**
 * lib/dna/distiller.ts — Distiller v1 RULE-BASED 0-key (phiếu ④.4).
 *
 * Đọc palette/caption/tags của các LibraryAsset đã CHỌN (xem lib/dna/README bên dưới về vì
 * sao "chọn tay" chứ không "tự quét theo dự án") → đề xuất 8 lớp Thẻ DNA qua `DistillEngine`
 * generic (`lib/distill/engine.ts`). KHÔNG gọi AI cần key — chỉ đọc tag/tự có sẵn trên
 * asset. Mọi giá trị sinh ra đều `trangThai: 'inferred'` (đúng luật của `distill()`); người
 * sửa/xác nhận ở UI mới chuyển field đó sang `'verified'` (xem `lib/dna/store.ts` `markLayerVerified`).
 *
 * QUY ƯỚC TAG — nối tiếp quy ước đã có ở `lib/library/db-items.ts` (`shelf:`, `thumb:`,
 * `code:`), thêm 4 tiền tố MỚI để rule-based có chỗ bấu vào mà không phải đoán chữ tự do
 * trong caption (đoán NLP trên caption tự do = dễ bịa, trái luật 12.3/X2):
 *   `style:<...>`    → lớp Ngôn ngữ không gian
 *   `material:<...>` → lớp Vật liệu (matId) — cũng nhận tiền tố `mat:` (ngắn, hay gõ tay)
 *   `light:<...>`    → lớp Ánh sáng
 *   `frame:<...>`    → lớp Khung hình
 * Ảnh KHÔNG có tag tương ứng thì lớp đó không nhận gì từ ảnh đó — đúng luật "thiếu nguồn để
 * trống, không đoán bừa". Palette (mảng hex có sẵn trên LibraryAsset) đổ thẳng vào lớp Màu +
 * tỷ lệ. `anhNguon` luôn nhận chính assetId (+ caption nếu có) của MỌI ảnh được chọn — đây là
 * lớp duy nhất mà "được chọn để chưng cất" ĐÃ LÀ tín hiệu đủ, không cần tag thêm.
 *
 * `yDo` (ý đồ) và `rangBuocDoTin` (ràng buộc/độ tin) CỐ TÌNH luôn trống ở rule-based — đây là
 * quyết định của người (nghe brief, đặt ràng buộc ngân sách/kết cấu), không suy được từ ảnh.
 * Hook AI (có key) nối sau qua `DnaAiEnricher` — CHƯA cài đặt ở v1 (luật 0-key của phiếu).
 */

import { distill, type DistillFieldSpec } from '../distill/engine';
import type { DistilledField, ProvenanceInput } from '../distill/types';
import { DNA_LAYER_KEYS, type DesignDnaLayers, type DnaLayerKey } from './types';

/** Hình dạng tối giản của 1 LibraryAsset cần cho distill — KHÔNG import type đầy đủ từ
 * `lib/library/db-items.ts` để tránh ràng buộc ngược vào shape route trả về; caller tự map. */
export interface DnaSourceAsset {
  id: string; // assetId (LibraryAsset.id / imgId — caller quyết định, chỉ cần ổn định)
  palette?: string[]; // hex[]
  caption?: string;
  tags?: string; // chuỗi phân cách dấu phẩy, ĐÚNG format cột `tags` của LibraryAsset
}

function tagList(tags: string | undefined): string[] {
  return (tags ?? '').split(',').map((t) => t.trim()).filter(Boolean);
}

function byPrefix(prefixes: string[]): (s: ProvenanceInput) => string[] {
  return (s) => {
    if (s.kind !== 'image') return [];
    return (s.tags ?? []).filter((t) => prefixes.some((p) => t.startsWith(p))).map((t) => {
      const p = prefixes.find((p) => t.startsWith(p))!;
      return t.slice(p.length);
    });
  };
}

/** Ép giá trị field form về mảng chuỗi — form.fields là `string | string[]`, ta gộp thẳng
 * bỏ chuỗi rỗng để `distill()` khử trùng lặp/gộp nguồn đồng nhất. */
function flatFormValues(v: string | string[] | undefined): string[] {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr.map((s) => String(s).trim()).filter(Boolean);
}

/**
 * Tuyến routing THEO NGUỒN (không đẻ trường kết quả mới, phiếu ③.2):
 *  - anhNguon        ← image.caption/id · asset(image).label/id
 *  - ngonNguKhongGian ← image tag `style:*` · form(poles) — mỗi trường của form thành 1 giá trị
 *                       `<key>: <value>` để giữ ngữ cảnh cực đã bấm
 *  - mauTyLe         ← image.palette (chỉ ảnh có palette hex thật, không suy)
 *  - vatLieuMatId    ← image tag `material:*`|`mat:*` · asset(material).id
 *  - anhSang         ← image tag `light:*`
 *  - khungHinh       ← image tag `frame:*`
 *  - yDo             ← sticky.text · form(ba-hoi) — mỗi trường (act1/act2/act3) thành 1 giá trị
 *  - rangBuocDoTin   ← LUÔN trống ở rule-based (quyết định của người)
 *
 * Nguồn không quen ⇒ extractor trả `[]` — đúng luật *"thiếu nguồn để trống, không đoán bừa"*.
 * sticky/form/asset chảy vào các lớp khác nhau THEO tuyến trên; nhiều nguồn cùng lớp thì
 * `distill()` gộp + khử trùng lặp; trạng thái vẫn `'inferred'` cho tới khi người xác nhận.
 */
const SPECS: DistillFieldSpec<DnaLayerKey>[] = [
  {
    field: 'anhNguon',
    extract: (s) => {
      if (s.kind === 'image') return [s.caption && s.caption.trim() ? s.caption.trim() : s.id];
      if (s.kind === 'asset' && s.assetKind === 'image') return [s.label && s.label.trim() ? s.label.trim() : s.id];
      return [];
    },
  },
  {
    field: 'ngonNguKhongGian',
    extract: (s) => {
      if (s.kind === 'image') return byPrefix(['style:'])(s);
      if (s.kind === 'form' && s.formKind === 'poles') {
        const out: string[] = [];
        for (const key of Object.keys(s.fields)) {
          for (const v of flatFormValues(s.fields[key])) out.push(`${key}: ${v}`);
        }
        return out;
      }
      return [];
    },
  },
  { field: 'mauTyLe', extract: (s) => (s.kind === 'image' ? s.palette ?? [] : []) },
  {
    field: 'vatLieuMatId',
    extract: (s) => {
      if (s.kind === 'image') return byPrefix(['material:', 'mat:'])(s);
      if (s.kind === 'asset' && s.assetKind === 'material') return [s.id];
      return [];
    },
  },
  { field: 'anhSang', extract: byPrefix(['light:']) },
  { field: 'khungHinh', extract: byPrefix(['frame:']) },
  {
    field: 'yDo',
    extract: (s) => {
      if (s.kind === 'sticky') {
        const t = s.text.trim();
        return t ? [t] : [];
      }
      if (s.kind === 'form' && s.formKind === 'ba-hoi') {
        const out: string[] = [];
        for (const key of Object.keys(s.fields)) {
          for (const v of flatFormValues(s.fields[key])) out.push(v);
        }
        return out;
      }
      return [];
    },
  },
  // rangBuocDoTin CỐ TÌNH trống ở rule-based — quyết định của người, không suy từ ảnh/note.
  { field: 'rangBuocDoTin', extract: () => [] },
];

function toProvenance(a: DnaSourceAsset): ProvenanceInput {
  return { kind: 'image', id: a.id, palette: a.palette, caption: a.caption, tags: tagList(a.tags) };
}

/** Chưng cất rule-based từ danh sách ảnh ĐÃ CHỌN. Trả đủ 8 lớp (lớp không nguồn nào góp thì
 * trống — xem `emptyField()`). Không throw trên input rỗng. */
export function distillDnaFromAssets(assets: readonly DnaSourceAsset[]): DesignDnaLayers {
  return distillDnaFromSources(assets.map(toProvenance));
}

/**
 * Chưng cất rule-based từ danh sách nguồn HỖN HỢP đã chuẩn hoá về `ProvenanceInput`.
 * Đây là cửa mà cửa sổ Thảo Luận (Collab chặng 3D — xem `NC-COLLAB-CHANG-3D.md`) gọi thẳng
 * để gom ảnh + sticky + form + asset trong một lượt bấm "Chưng cất → Thẻ DNA" — luật
 * *[T5] CON NGƯỜI QUYẾT CUỐI* [TRIET-LY-IF.md:32]: hàm này chỉ chạy khi có nút bấm rõ ràng
 * từ tầng gọi, KHÔNG tự chạy theo mỗi thao tác.
 *
 * Không throw trên input rỗng — trả về đúng 8 lớp trống.
 */
export function distillDnaFromSources(sources: readonly ProvenanceInput[]): DesignDnaLayers {
  const out = distill(sources, SPECS);
  // đảm bảo đủ đúng 8 khoá theo DNA_LAYER_KEYS (distill() đã trả đủ theo SPECS — ràng buộc
  // này chỉ là chốt kiểu tĩnh, không đổi hành vi runtime).
  const layers = {} as DesignDnaLayers;
  for (const k of DNA_LAYER_KEYS) layers[k] = out[k];
  return layers;
}

/** Merge kết quả chưng cất MỚI vào thẻ đang có: field nào ĐANG `verified` thì GIỮ NGUYÊN
 * (người đã xác nhận thắng máy suy lại) — field còn lại (trống hoặc `inferred` cũ) bị THAY
 * bằng bản chưng cất mới. Đây là hành vi của nút "Chưng cất từ ảnh dự án" khi thẻ đã có sẵn
 * vài lớp do người sửa tay trước đó. */
export function mergeDistilledIntoCard(
  current: DesignDnaLayers,
  distilled: DesignDnaLayers,
): DesignDnaLayers {
  const out = {} as DesignDnaLayers;
  for (const k of DNA_LAYER_KEYS) {
    const cur = current[k];
    out[k] = cur && cur.trangThai === 'verified' ? cur : distilled[k];
  }
  return out;
}

/** Hook cho AI THẬT (cần key) nối sau — v1 KHÔNG cài đặt (luật 0-key của phiếu ④.4).
 * Chữ ký để lại đây để phiên sau cắm thẳng, không phải đổi shape `DesignDnaLayers`. */
export type DnaAiEnricher = (
  assets: readonly DnaSourceAsset[],
  current: DesignDnaLayers,
) => Promise<Partial<Record<DnaLayerKey, DistilledField<string>>>>;
