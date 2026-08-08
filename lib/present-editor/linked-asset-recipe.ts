/**
 * lib/present-editor/linked-asset-recipe.ts — T2 của `docs/SPEC-TRINH-ONG-KINH-DU-LIEU.md` §3
 * ("Ảnh dẫn xuất phải mang công thức"). T1 (đã xong, `project-doc.ts`) cho chặng Trình bày đọc
 * Doc SỐNG cho BẢNG SỐ (BOQ) — việc này làm phần còn lại: ẢNH mặt bằng/zone-map dán vào deck
 * (nhóm 🟨 trong bảng phân loại §2) *nhìn* là ảnh nhưng SINH RA từ Doc, nên phải mang kèm công
 * thức để dựng lại + biết mình đang cũ, KHÔNG chỉ là pixel chết.
 *
 * Tái dùng cơ chế ĐÃ CÓ, không phát minh: `LinkedAsset`/`setLinkedAssetSrc` (linked-assets.ts,
 * PS-3) làm phần "sửa 1 lần, mọi slide dùng chung asset cập nhật theo" — module này chỉ thêm lớp
 * "công thức" bên trên đó. `boqFingerprint` (lib/boq/cache.ts) làm phép so sánh Doc rẻ đã có sẵn
 * (CHỈ IMPORT — không đụng file đó, đúng ranh giới việc này). `renderDocToDataURL`/
 * `renderZoneMapToDataURL` (lib/cad/render.ts) là 2 hàm xuất ảnh THUẦN đã có (CHỈ IMPORT — không
 * đụng lib/cad/**).
 *
 * KHÔNG tự động render lại khi Doc đổi (L5 — "không ghi ngược/tự đổi sau lưng"; người dùng bấm
 * "Làm mới từ bản vẽ" trong Inspector mới đổi). Module này chỉ cung cấp phép TÍNH — panel/nút bấm
 * ở components/present-editor/Inspector.tsx.
 */

import type { Doc } from '../cad/model';
import { renderDocToDataURL, renderZoneMapToDataURL } from '../cad/render';
import { boqFingerprint } from '../boq/cache';
import type { EditorDeck, LinkedAsset, LinkedAssetRecipe } from './model';
import { setLinkedAssetSrc } from './linked-assets';

/**
 * Vân tay Doc dùng cho recipe — thin wrapper quanh `boqFingerprint` (đo trên `doc.entities`,
 * cùng cơ chế BOQ đã dùng để phát hiện "bản vẽ đã đổi"). Đặt tên riêng ở ĐÂY (thay vì gọi thẳng
 * `boqFingerprint` khắp nơi trong present-editor) để: (1) cô lập import `lib/boq` vào ĐÚNG 1 file
 * — khớp ràng buộc "lib/boq chỉ import"; (2) nếu sau này recipe cần vân tay khác BOQ (vd tính cả
 * `siteImage`/`printScale` — thứ ảnh hưởng ẢNH nhưng không ảnh hưởng SỐ) chỉ sửa 1 chỗ.
 */
export function computeCadPlanFingerprint(doc: Doc): string {
  return boqFingerprint(doc);
}

/**
 * Dựng lại ảnh THEO ĐÚNG công thức đã lưu — dispatch theo `recipe.kind`, dùng nguyên `widthPx` đã
 * lưu (không đoán lại độ nét). `typeof document === 'undefined'` (server/test không DOM) → cả 2
 * hàm nguồn tự trả `''`, hàm này KHÔNG che giấu — trả nguyên `''` để caller tự quyết định (Inspector
 * báo lỗi rõ, không âm thầm giữ ảnh cũ).
 */
export function renderRecipeImage(doc: Doc, recipe: LinkedAssetRecipe): string {
  if (recipe.kind === 'zone-map') return renderZoneMapToDataURL(doc, recipe.widthPx);
  return renderDocToDataURL(doc, recipe.widthPx);
}

/**
 * Gắn/thay `recipe` cho 1 asset ĐÃ CÓ SẴN trong registry — additive, KHÔNG đụng `src`/`name`.
 * Dùng khi "Đưa sang Trình bày" đăng ký công thức cho ảnh vừa chèn (§3 T2 — nơi gọi hàm này CHƯA
 * nối, xem TECH-DEBT/báo cáo cuối: cần sửa ở CadEditor.tsx/PresentEditor.tsx, ngoài vùng file
 * được giao của việc này) hoặc khi lắp lại công thức cho asset cũ đã có sẵn (khôi phục thủ công).
 * assetId không tồn tại trong registry → trả NGUYÊN deck (không tạo asset rỗng, cùng quy ước
 * `attachElementToAsset`/`setLinkedAssetSrc` ở linked-assets.ts).
 */
export function attachRecipeToAsset(
  deck: EditorDeck,
  assetId: string,
  recipe: LinkedAssetRecipe,
): EditorDeck {
  const asset = deck.linkedAssets?.[assetId];
  if (!asset) return deck;
  return {
    ...deck,
    linkedAssets: { ...deck.linkedAssets, [assetId]: { ...asset, recipe } },
  };
}

/**
 * true = asset có công thức VÀ vân tay đã đổi so với lúc render gần nhất — hiện badge "cũ hơn
 * bản vẽ". KHÔNG có recipe (ảnh render 3D/ảnh chụp) hoặc chưa đo được `liveFingerprint` (vd
 * chưa xác định được dự án/Doc — xem `project-doc.ts`) → `false`, KHÔNG báo "cũ" khi không chắc
 * (thà im lặng còn hơn báo sai — cùng tinh thần R4 của spec: ảnh không phải hàm-của-Doc thì
 * KHÔNG được làm phiền).
 */
export function isLinkedAssetStale(
  asset: LinkedAsset | null | undefined,
  liveFingerprint: string | null,
): boolean {
  if (!asset?.recipe) return false;
  if (!asset.recipe.fingerprint) return false; // chưa đo được lúc tạo — không có gì để so
  if (liveFingerprint == null) return false;
  return asset.recipe.fingerprint !== liveFingerprint;
}

/**
 * Áp DATAURL + FINGERPRINT mới sau khi "Làm mới từ bản vẽ" đã render lại ảnh — cập nhật registry
 * (mọi element cùng assetId, qua `setLinkedAssetSrc` có sẵn) RỒI patch `recipe.fingerprint` về
 * đúng vân tay Doc vừa dùng để render (đóng vòng "đã làm mới, hết cũ"). asset không tồn tại hoặc
 * không có recipe → chỉ đổi src như `setLinkedAssetSrc` thường (KHÔNG bịa recipe ra từ hư không).
 */
export function applyRecipeRefresh(
  deck: EditorDeck,
  assetId: string,
  dataUrl: string,
  fingerprint: string,
): EditorDeck {
  const withSrc = setLinkedAssetSrc(deck, assetId, dataUrl);
  const asset = withSrc.linkedAssets?.[assetId];
  if (!asset?.recipe) return withSrc;
  return {
    ...withSrc,
    linkedAssets: {
      ...withSrc.linkedAssets,
      [assetId]: { ...asset, recipe: { ...asset.recipe, fingerprint } },
    },
  };
}
