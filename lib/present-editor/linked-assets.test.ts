/**
 * lib/present-editor/linked-assets.test.ts — kiểm "tài sản liên kết" (PS-3). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/linked-assets.test.ts
 *
 * Thuần (không DOM) — dựng deck tối thiểu tay, không cần present-editor thật.
 */
import {
  createAssetFromElement,
  attachElementToAsset,
  detachElement,
  setLinkedAssetSrc,
  listLinkedAssets,
  countAssetUsage,
} from './linked-assets';
import type { EditorDeck, ImageElement, EditorSlide } from './model';
import { DEFAULT_ADJUST, FULL_CROP } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
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
    slides: [
      slide('s1', [img('i1', 'src-a.png')]),
      slide('s2', [img('i2', 'src-b.png')]),
    ],
  };
}

function testCreateAsset() {
  console.log('\n[1] createAssetFromElement — tạo asset từ ảnh đang chọn, gắn assetId vào chính nó');
  const deck = makeDeck();
  const next = createAssetFromElement(deck, 's1', 'i1', 'Logo');
  const assetIds = Object.keys(next.linkedAssets ?? {});
  ok('tạo đúng 1 asset', assetIds.length === 1);
  const assetId = assetIds[0];
  const el1 = next.slides[0].elements[0] as ImageElement;
  ok('element gắn đúng assetId vừa tạo', el1.assetId === assetId);
  ok('asset lấy src từ element gốc', next.linkedAssets![assetId].src === 'src-a.png');
  ok('deck gốc KHÔNG bị đổi (thuần)', deck.slides[0].elements[0].kind === 'image' && (deck.slides[0].elements[0] as ImageElement).assetId === undefined);
  ok('id sai / không phải ảnh → trả nguyên deck', createAssetFromElement(deck, 's1', 'no-such-id') === deck);
}

function testAttachAndSync() {
  console.log('\n[2] attachElementToAsset + setLinkedAssetSrc — sửa 1 nơi, cập nhật MỌI slide');
  let deck = makeDeck();
  deck = createAssetFromElement(deck, 's1', 'i1', 'Ảnh render');
  const assetId = Object.keys(deck.linkedAssets!)[0];

  // gắn element ở slide KHÁC (s2/i2) vào CÙNG asset — đồng bộ src ngay khi gắn.
  deck = attachElementToAsset(deck, 's2', 'i2', assetId);
  const el2 = deck.slides[1].elements[0] as ImageElement;
  ok('element ở slide khác nhận đúng src của asset khi gắn', el2.src === 'src-a.png');
  ok('element ở slide khác gắn đúng assetId', el2.assetId === assetId);
  ok('usage đếm đúng 2 chỗ dùng', countAssetUsage(deck, assetId) === 2);

  // sửa nguồn 1 lần (mô phỏng ghi ảnh đã edit qua /photo-editor) → CẢ 2 slide đổi.
  deck = setLinkedAssetSrc(deck, assetId, 'src-edited.png');
  const e1 = deck.slides[0].elements[0] as ImageElement;
  const e2 = deck.slides[1].elements[0] as ImageElement;
  ok('slide 1 cập nhật src mới', e1.src === 'src-edited.png');
  ok('slide 2 (element khác, cùng assetId) CŨNG cập nhật', e2.src === 'src-edited.png');
  ok('registry asset cũng cập nhật src', deck.linkedAssets![assetId].src === 'src-edited.png');

  ok('gắn assetId không tồn tại → trả nguyên deck', attachElementToAsset(deck, 's1', 'i1', 'no-such-asset') === deck);
}

function testDetach() {
  console.log('\n[3] detachElement — tách ra, GIỮ src hiện có, không đụng asset/element khác');
  let deck = makeDeck();
  deck = createAssetFromElement(deck, 's1', 'i1');
  const assetId = Object.keys(deck.linkedAssets!)[0];
  deck = attachElementToAsset(deck, 's2', 'i2', assetId);
  deck = setLinkedAssetSrc(deck, assetId, 'src-shared.png');

  deck = detachElement(deck, 's2', 'i2');
  const e1 = deck.slides[0].elements[0] as ImageElement;
  const e2 = deck.slides[1].elements[0] as ImageElement;
  ok('element gỡ liên kết mất assetId', e2.assetId === undefined);
  ok('element gỡ liên kết GIỮ src hiện có (không rollback)', e2.src === 'src-shared.png');
  ok('element còn lại KHÔNG bị ảnh hưởng', e1.assetId === assetId && e1.src === 'src-shared.png');
  ok('usage giảm còn 1', countAssetUsage(deck, assetId) === 1);
}

function testListOrder() {
  console.log('\n[4] listLinkedAssets — mới sửa gần nhất lên trước (tất định)');
  let deck = makeDeck();
  deck = createAssetFromElement(deck, 's1', 'i1', 'A');
  const idA = Object.keys(deck.linkedAssets!)[0];
  deck = createAssetFromElement(deck, 's2', 'i2', 'B');
  const idB = Object.keys(deck.linkedAssets!).find((k) => k !== idA)!;
  // "sửa" A sau B → A phải lên đầu danh sách.
  deck = setLinkedAssetSrc(deck, idA, 'src-a2.png');
  const list = listLinkedAssets(deck);
  ok('asset sửa gần nhất đứng đầu', list[0].id === idA);
  ok('đủ 2 asset', list.length === 2);
  ok('deck không linkedAssets → danh sách rỗng', listLinkedAssets(makeDeck()).length === 0);
}

testCreateAsset();
testAttachAndSync();
testDetach();
testListOrder();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
