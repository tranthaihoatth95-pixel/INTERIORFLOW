/**
 * lib/present-editor/linked-assets.ts — "Tài sản liên kết" (PS-3, gộp smart-object kiểu
 * Photoshop + component-instance kiểu Figma thành MỘT khái niệm, không dựng 2 engine).
 *
 * Nhiều `ImageElement` (trên nhiều slide khác nhau) trỏ chung 1 `assetId` (registry ở
 * `deck.linkedAssets`, xem model.ts). Sửa NGUỒN (`setLinkedAssetSrc`) 1 lần → mọi element
 * tham chiếu cùng assetId đồng loạt cập nhật `src`. Dùng khi ảnh render/logo/watermark lặp
 * lại nhiều slide (before/after, moodboard...): sửa 1 lần khỏi phải kéo lại tay từng slide.
 *
 * PHẦN THUẦN — không DOM, test bằng sucrase-node được (cùng khuôn brand-kit.ts/theme-roles.ts:
 * nhận deck, trả deck MỚI, không side-effect lên deck gốc).
 *
 * Phạm vi đã chốt (IF-PRESENT-SPRINT-PLAN mục PS-3): hoạt động với BẤT KỲ ImageElement nào
 * đã có (hoặc được gán ở đây) 1 id ổn định — vd ảnh Brand Kit, ảnh vừa chỉnh qua /photo-editor.
 * Ảnh hand-off từ Render stage giờ CŨNG có id ổn định (`render:<nodeId>[:index]`, xem
 * `deckImagesWithIdsFromNodes`/`renderImageId` ở lib/present-editor/handoff.ts): khi chèn ảnh
 * này vào slide, `components/present-editor/PresentEditor.tsx::onAddImageUrl` dùng thẳng id đó
 * làm `assetId` (qua `attachElementToAsset`/`setLinkedAssetSrc` ở dưới, KHÔNG mint id ngẫu
 * nhiên) — chèn CÙNG ảnh (cùng node nguồn) vào nhiều slide tự hội tụ về CÙNG 1 asset, không cần
 * bước "tạo asset" thủ công.
 */

import type { EditorDeck, EditorSlide, ImageElement, LinkedAsset } from './model';
import { newImgId } from '../img-id';

/**
 * id ổn định cho asset liên kết — KHÔNG gọi ở render body (chỉ trong handler).
 * Task #19: mint id ảnh chuẩn `img_…` (lib/img-id.ts) thay cho `asset_…` cũ. `assetId` là KHOÁ
 * thuần trong `deck.linkedAssets`, không nơi nào parse tiền tố → deck cũ (assetId `asset_…`/`render:…`)
 * vẫn hoạt động y nguyên (backward-compat).
 */
export function newAssetId(): string {
  return newImgId();
}

function findImageElement(deck: EditorDeck, slideId: string, elementId: string): ImageElement | null {
  const slide = deck.slides.find((s) => s.id === slideId);
  const el = slide?.elements.find((e) => e.id === elementId);
  return el && el.kind === 'image' ? el : null;
}

function mapSlideElements(
  slides: EditorSlide[],
  slideId: string,
  fn: (el: ImageElement) => ImageElement,
): EditorSlide[] {
  return slides.map((s) => {
    if (s.id !== slideId) return s;
    return {
      ...s,
      elements: s.elements.map((e) => (e.kind === 'image' ? fn(e) : e)),
    };
  });
}

/**
 * Tạo 1 asset MỚI từ ảnh đang chọn (dùng `src` hiện tại của element làm nguồn), rồi gắn
 * `assetId` vào chính element đó (nó là "instance" đầu tiên của asset vừa tạo). Không tìm
 * thấy element (id sai/không phải ảnh) → trả nguyên deck.
 */
export function createAssetFromElement(
  deck: EditorDeck,
  slideId: string,
  elementId: string,
  name?: string,
): EditorDeck {
  const el = findImageElement(deck, slideId, elementId);
  if (!el) return deck;
  const id = newAssetId();
  const asset: LinkedAsset = { id, src: el.src, name, updatedAt: Date.now() };
  return {
    ...deck,
    linkedAssets: { ...(deck.linkedAssets ?? {}), [id]: asset },
    slides: mapSlideElements(deck.slides, slideId, (e) =>
      e.id === elementId ? { ...e, assetId: id } : e,
    ),
  };
}

/**
 * Gắn 1 element (đã có) vào asset ĐÃ CÓ SẴN — đồng bộ ngay `src` của element về đúng `src`
 * hiện tại của asset (nó trở thành 1 "instance" mới) + bỏ crop cũ (không còn khớp ảnh mới).
 * assetId không tồn tại trong registry → trả nguyên deck (không tạo asset rỗng).
 */
export function attachElementToAsset(
  deck: EditorDeck,
  slideId: string,
  elementId: string,
  assetId: string,
): EditorDeck {
  const asset = deck.linkedAssets?.[assetId];
  if (!asset) return deck;
  return {
    ...deck,
    slides: mapSlideElements(deck.slides, slideId, (e) =>
      e.id === elementId
        ? { ...e, assetId, src: asset.src, crop: { x: 0, y: 0, w: 1, h: 1 } }
        : e,
    ),
  };
}

/**
 * Gỡ liên kết — element GIỮ NGUYÊN `src` hiện có (tách ra thành ảnh độc lập), registry và
 * các element khác cùng assetId không đổi.
 */
export function detachElement(deck: EditorDeck, slideId: string, elementId: string): EditorDeck {
  return {
    ...deck,
    slides: mapSlideElements(deck.slides, slideId, (e) =>
      e.id === elementId ? { ...e, assetId: undefined } : e,
    ),
  };
}

/**
 * SỬA NGUỒN 1 LẦN → cập nhật registry + MỌI `ImageElement` (ở BẤT KỲ slide nào) đang có
 * cùng `assetId`. Đây là lõi "smart object / component instance" của PS-3. `assetId` chưa
 * có trong registry → tạo mới bản ghi (không có element nào tham chiếu thì chỉ registry đổi,
 * vô hại — element gắn assetId này sau vẫn nhận đúng src).
 */
export function setLinkedAssetSrc(deck: EditorDeck, assetId: string, src: string): EditorDeck {
  const prev = deck.linkedAssets?.[assetId];
  // T2 (SPEC-TRINH-ONG-KINH-DU-LIEU §3) — GIỮ `recipe` qua mỗi lần đổi src (vd round-trip
  // /photo-editor không liên quan gì tới recipe). Trước khi có field này hàm luôn bỏ field lạ
  // (không tồn tại) nên hành vi CŨ (asset không recipe) không đổi; recipe.fingerprint chỉ được
  // cập nhật CÓ CHỦ Ý qua applyRecipeRefresh() (lib/present-editor/linked-asset-recipe.ts), không
  // phải ở đây — đổi src bằng đường khác (vd sửa tay) KHÔNG ngầm coi là "đã làm mới theo công thức".
  const asset: LinkedAsset = { id: assetId, name: prev?.name, src, updatedAt: Date.now(), recipe: prev?.recipe };
  return {
    ...deck,
    linkedAssets: { ...(deck.linkedAssets ?? {}), [assetId]: asset },
    slides: deck.slides.map((s) => ({
      ...s,
      elements: s.elements.map((e) => (e.kind === 'image' && e.assetId === assetId ? { ...e, src } : e)),
    })),
  };
}

/** Danh sách asset để hiển thị trong panel chọn — mới sửa gần đây lên trước (tất định). */
export function listLinkedAssets(deck: EditorDeck): LinkedAsset[] {
  return Object.values(deck.linkedAssets ?? {}).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Đếm số element (mọi slide) đang tham chiếu 1 assetId — hiển thị "dùng ở N chỗ". */
export function countAssetUsage(deck: EditorDeck, assetId: string): number {
  let n = 0;
  for (const s of deck.slides) {
    for (const e of s.elements) {
      if (e.kind === 'image' && e.assetId === assetId) n += 1;
    }
  }
  return n;
}
