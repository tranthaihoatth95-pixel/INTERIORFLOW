/**
 * lib/present-editor/linked-asset-recipe.test.ts — kiểm T2 (SPEC-TRINH-ONG-KINH-DU-LIEU §3). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/linked-asset-recipe.test.ts
 *
 * Thuần (không DOM) — `renderRecipeImage` gọi `renderDocToDataURL`/`renderZoneMapToDataURL`
 * (lib/cad/render.ts), cả hai tự trả `''` khi `typeof document === 'undefined'` (đúng môi trường
 * sucrase-node) — test ở đây chỉ xác nhận KHÔNG throw + trả đúng kiểu string, không dựng canvas thật.
 */
import {
  computeCadPlanFingerprint,
  renderRecipeImage,
  attachRecipeToAsset,
  isLinkedAssetStale,
  applyRecipeRefresh,
} from './linked-asset-recipe';
import { setLinkedAssetSrc, createAssetFromElement } from './linked-assets';
import type { EditorDeck, ImageElement, EditorSlide, LinkedAssetRecipe } from './model';
import { DEFAULT_ADJUST, FULL_CROP } from './model';
import type { Doc, Entity } from '../cad/model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function hatch(id: string, x: number, y: number, specId?: string): Entity {
  return {
    id,
    type: 'hatch',
    layer: 'L',
    specId,
    points: [
      { x, y },
      { x: x + 1000, y },
      { x: x + 1000, y: y + 1000 },
      { x, y: y + 1000 },
    ],
  } as unknown as Entity;
}

function makeDoc(entities: Entity[]): Doc {
  return { entities, layers: [] };
}

function img(id: string, src: string, extra: Partial<ImageElement> = {}): ImageElement {
  return {
    id,
    kind: 'image',
    frame: { x: 0, y: 0, w: 50, h: 50, rotation: 0 },
    src,
    adjust: { ...DEFAULT_ADJUST },
    crop: { ...FULL_CROP },
    ...extra,
  };
}

function slide(id: string, elements: EditorSlide['elements']): EditorSlide {
  return { id, background: '#fff', elements };
}

function makeDeck(): EditorDeck {
  return {
    id: 'd1',
    brand: 'B',
    project: 'P',
    fonts: { heading: 'a', body: 'b' } as any,
    palette: ['#000'],
    slides: [slide('s1', [img('i1', 'plan-v1.png')])],
  };
}

function recipeFor(fingerprint: string, extra: Partial<LinkedAssetRecipe> = {}): LinkedAssetRecipe {
  return { kind: 'cad-plan', projectId: 'proj-1', widthPx: 2000, fingerprint, ...extra };
}

console.log('\n[1] computeCadPlanFingerprint — cùng Doc ra cùng vân tay, đổi toạ độ ra vân tay khác');
{
  const docA = makeDoc([hatch('h1', 0, 0)]);
  const docA2 = makeDoc([hatch('h1', 0, 0)]);
  const docB = makeDoc([hatch('h1', 500, 0)]); // đổi toạ độ = đổi diện tích/hình dạng
  ok('cùng nội dung Doc -> cùng vân tay', computeCadPlanFingerprint(docA) === computeCadPlanFingerprint(docA2));
  ok('đổi toạ độ -> vân tay khác', computeCadPlanFingerprint(docA) !== computeCadPlanFingerprint(docB));
  ok('doc rỗng vẫn ra chuỗi (không throw)', typeof computeCadPlanFingerprint(makeDoc([])) === 'string');
}

console.log('\n[2] renderRecipeImage — dispatch đúng kind, không throw ngoài DOM (môi trường test)');
{
  const doc = makeDoc([hatch('h1', 0, 0)]);
  const planImg = renderRecipeImage(doc, recipeFor('fp1', { kind: 'cad-plan' }));
  const zoneImg = renderRecipeImage(doc, recipeFor('fp1', { kind: 'zone-map' }));
  ok('cad-plan trả string (rỗng ngoài DOM, không throw)', typeof planImg === 'string');
  ok('zone-map trả string (rỗng ngoài DOM, không throw)', typeof zoneImg === 'string');
}

console.log('\n[3] attachRecipeToAsset — additive, không đụng src/name, no-op khi assetId lạ');
{
  let deck = makeDeck();
  deck = createAssetFromElement(deck, 's1', 'i1', 'Mặt bằng tầng 1');
  const assetId = Object.keys(deck.linkedAssets!)[0];
  const recipe = recipeFor('fp-start');
  const next = attachRecipeToAsset(deck, assetId, recipe);
  ok('asset nhận đúng recipe', next.linkedAssets![assetId].recipe?.fingerprint === 'fp-start');
  ok('src KHÔNG đổi (chỉ thêm recipe)', next.linkedAssets![assetId].src === 'plan-v1.png');
  ok('name KHÔNG đổi', next.linkedAssets![assetId].name === 'Mặt bằng tầng 1');
  ok('assetId lạ -> trả NGUYÊN deck (===)', attachRecipeToAsset(deck, 'no-such-asset', recipe) === deck);
}

console.log('\n[4] isLinkedAssetStale — chỉ true khi CÓ recipe + CÓ vân tay + khác nhau');
{
  const withRecipe: any = { id: 'a1', src: 'x', updatedAt: 1, recipe: recipeFor('fp-old') };
  const noRecipe: any = { id: 'a2', src: 'x', updatedAt: 1 };
  const emptyFingerprint: any = { id: 'a3', src: 'x', updatedAt: 1, recipe: recipeFor('') };
  ok('không có recipe -> false (ảnh render 3D/ảnh chụp, không phải lỗi)', isLinkedAssetStale(noRecipe, 'fp-new') === false);
  ok('asset null/undefined -> false', isLinkedAssetStale(null, 'fp-new') === false && isLinkedAssetStale(undefined, 'fp-new') === false);
  ok('recipe.fingerprint rỗng (chưa đo được lúc tạo) -> false', isLinkedAssetStale(emptyFingerprint, 'fp-new') === false);
  ok('liveFingerprint null (chưa xác định Doc) -> false, KHÔNG báo sai', isLinkedAssetStale(withRecipe, null) === false);
  ok('vân tay TRÙNG -> false (chưa đổi)', isLinkedAssetStale(withRecipe, 'fp-old') === false);
  ok('vân tay KHÁC -> true (cờ cũ bật)', isLinkedAssetStale(withRecipe, 'fp-new') === true);
}

console.log('\n[5] applyRecipeRefresh — cập nhật MỌI element cùng assetId + patch fingerprint đúng vân tay mới');
{
  let deck = makeDeck();
  deck = createAssetFromElement(deck, 's1', 'i1', 'Mặt bằng');
  const assetId = Object.keys(deck.linkedAssets!)[0];
  deck = attachRecipeToAsset(deck, assetId, recipeFor('fp-v1'));
  // gắn thêm 1 element ở slide khác cùng asset (mô phỏng dùng chung nhiều slide).
  deck = {
    ...deck,
    slides: [...deck.slides, slide('s2', [img('i2', 'plan-v1.png', { assetId })])],
  };

  const refreshed = applyRecipeRefresh(deck, assetId, 'plan-v2.png', 'fp-v2');
  const e1 = refreshed.slides[0].elements[0] as ImageElement;
  const e2 = refreshed.slides[1].elements[0] as ImageElement;
  ok('slide 1 nhận src mới', e1.src === 'plan-v2.png');
  ok('slide 2 (cùng assetId, KHÁC slide) CŨNG nhận src mới', e2.src === 'plan-v2.png');
  ok('registry src cập nhật', refreshed.linkedAssets![assetId].src === 'plan-v2.png');
  ok('recipe.fingerprint patch đúng vân tay MỚI (hết cũ)', refreshed.linkedAssets![assetId].recipe?.fingerprint === 'fp-v2');
  ok('recipe.kind/projectId/widthPx GIỮ NGUYÊN (chỉ patch fingerprint)', refreshed.linkedAssets![assetId].recipe?.projectId === 'proj-1');
  ok('sau refresh, so lại với CHÍNH vân tay mới -> hết stale', isLinkedAssetStale(refreshed.linkedAssets![assetId], 'fp-v2') === false);

  // asset không có recipe -> applyRecipeRefresh vẫn đổi src, KHÔNG bịa recipe.
  let deck2 = makeDeck();
  deck2 = createAssetFromElement(deck2, 's1', 'i1');
  const assetId2 = Object.keys(deck2.linkedAssets!)[0];
  const refreshed2 = applyRecipeRefresh(deck2, assetId2, 'no-recipe.png', 'fp-x');
  ok('asset không recipe: src vẫn đổi', refreshed2.linkedAssets![assetId2].src === 'no-recipe.png');
  ok('asset không recipe: KHÔNG tự bịa recipe', refreshed2.linkedAssets![assetId2].recipe === undefined);
}

console.log('\n[6] setLinkedAssetSrc (linked-assets.ts) GIỮ recipe qua lần đổi src khác (vd sửa tay /photo-editor)');
{
  let deck = makeDeck();
  deck = createAssetFromElement(deck, 's1', 'i1');
  const assetId = Object.keys(deck.linkedAssets!)[0];
  deck = attachRecipeToAsset(deck, assetId, recipeFor('fp-keep'));
  const afterManualEdit = setLinkedAssetSrc(deck, assetId, 'edited-by-hand.png');
  ok('src đổi theo đường KHÁC (không qua applyRecipeRefresh)', afterManualEdit.linkedAssets![assetId].src === 'edited-by-hand.png');
  ok('recipe KHÔNG bị rơi mất (trước đây setLinkedAssetSrc từng bỏ field lạ)', afterManualEdit.linkedAssets![assetId].recipe?.fingerprint === 'fp-keep');
  ok('asset KHÔNG có recipe từ đầu vẫn hoạt động y hệt trước (recipe undefined, không lỗi)', setLinkedAssetSrc(makeDeck(), 'never-existed', 'x.png').linkedAssets!['never-existed'].recipe === undefined);
}

console.log('\n[7] Round-trip qua save/load (JSON, cùng cơ chế IndexedDB/sheets-persist dùng cho deck) + fingerprint đổi -> cờ cũ bật');
{
  let deck = makeDeck();
  deck = createAssetFromElement(deck, 's1', 'i1', 'Mặt bằng tầng 1');
  const assetId = Object.keys(deck.linkedAssets!)[0];
  deck = attachRecipeToAsset(deck, assetId, recipeFor('fp-round-trip', { sheetId: 'sheet-9' }));

  const roundTripped = JSON.parse(JSON.stringify(deck)) as EditorDeck;
  const asset = roundTripped.linkedAssets![assetId];
  ok('recipe sống sót qua JSON round-trip', asset.recipe !== undefined);
  ok('recipe.kind giữ nguyên', asset.recipe?.kind === 'cad-plan');
  ok('recipe.projectId giữ nguyên', asset.recipe?.projectId === 'proj-1');
  ok('recipe.sheetId giữ nguyên (field optional)', asset.recipe?.sheetId === 'sheet-9');
  ok('recipe.widthPx giữ nguyên', asset.recipe?.widthPx === 2000);
  ok('recipe.fingerprint giữ nguyên', asset.recipe?.fingerprint === 'fp-round-trip');

  // deck CŨ (trước T2, không có field recipe nào) round-trip vẫn y nguyên — additive, không phá.
  const oldDeck = makeDeck(); // linkedAssets rỗng, không recipe
  const oldRoundTripped = JSON.parse(JSON.stringify(oldDeck)) as EditorDeck;
  ok('deck cũ không có linkedAssets -> round-trip không tự sinh field lạ', oldRoundTripped.linkedAssets === undefined);

  // Doc "đổi" (vẽ thêm 1 vùng tô) sau khi ảnh đã round-trip -> vân tay mới khác vân tay đã lưu
  // -> isLinkedAssetStale phải bật cờ TRUE (đúng yêu cầu "fingerprint đổi -> cờ cũ bật").
  const docAtRenderTime = makeDoc([hatch('h1', 0, 0)]);
  const savedFingerprint = computeCadPlanFingerprint(docAtRenderTime);
  ok('fingerprint đã lưu khớp đúng lúc render (dựng fixture đúng)', savedFingerprint !== '');
  const assetRoundTripped = { ...asset, recipe: { ...asset.recipe!, fingerprint: savedFingerprint } };
  ok('trước khi sửa Doc -> chưa cũ', isLinkedAssetStale(assetRoundTripped, savedFingerprint) === false);

  const docAfterEdit = makeDoc([hatch('h1', 0, 0), hatch('h2', 2000, 0)]); // vẽ thêm 1 vùng tô
  const liveFingerprint = computeCadPlanFingerprint(docAfterEdit);
  ok('sửa Doc -> vân tay đổi', liveFingerprint !== savedFingerprint);
  ok('sau khi sửa Doc -> cờ cũ BẬT (isLinkedAssetStale = true)', isLinkedAssetStale(assetRoundTripped, liveFingerprint) === true);
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
