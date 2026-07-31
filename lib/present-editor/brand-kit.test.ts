/**
 * lib/present-editor/brand-kit.test.ts — kiểm PHẦN THUẦN của Brand Kit (PS-1). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/brand-kit.test.ts
 *
 * Chỉ test hàm thuần (áp/gieo kit vào deck) — không đụng localStorage (node không có window;
 * các hàm read/write tự guard `window` nên import module vẫn chạy được).
 */
import {
  applyBrandKitToDeck,
  seedDeckWithBrandKit,
  watermarkFromKit,
  draftKitFromDeck,
  buildBrandKitExport,
  parseBrandKitExport,
  mergeBrandKits,
  type BrandKit,
} from './brand-kit';
import { makeText, type EditorDeck } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

const KIT: BrandKit = {
  id: 'k1',
  name: 'TTT',
  logo: 'data:image/png;base64,AAAA',
  palette: ['#ffffff', '#a8c0d0', '#3a7bd5', '#2b5c8a', '#1a2b3a', '#0b1016'],
  fonts: 'Modern',
  watermark: { corner: 'br', sizePct: 12, opacity: 0.8, marginPct: 3 },
  updatedAt: 0,
};

function deck(): EditorDeck {
  return {
    id: 'd',
    brand: 'X',
    project: 'p',
    fonts: 'Editorial',
    palette: ['#efe9dc', '#c2ad86', '#8a6a3a', '#6e4a2e', '#3b352f', '#28211a'],
    slides: [
      {
        id: 's1',
        background: '#efe9dc',
        elements: [makeText({ id: 't1', text: 'Hi', role: 'title', color: '#28211a' })],
      },
    ],
  };
}

/** Deck NHIỀU slide (nền sáng + nền tối xen kẽ) — bẫy đúng bug "chỉ áp 1 slide". */
function multiSlideDeck(): EditorDeck {
  return {
    id: 'd2',
    brand: 'X',
    project: 'p',
    fonts: 'Editorial',
    palette: ['#efe9dc', '#c2ad86', '#8a6a3a', '#6e4a2e', '#3b352f', '#28211a'],
    slides: [
      {
        id: 's1',
        background: '#efe9dc', // sáng
        elements: [makeText({ id: 't1', text: 'Slide 1', role: 'title', color: '#28211a' })],
      },
      {
        id: 's2',
        background: '#28211a', // tối
        elements: [makeText({ id: 't2', text: 'Slide 2', role: 'title', color: '#efe9dc' })],
      },
      {
        id: 's3',
        background: '#efe9dc', // sáng
        elements: [makeText({ id: 't3', text: 'Slide 3', role: 'title', color: '#28211a' })],
      },
    ],
  };
}

function testWatermarkFromKit() {
  console.log('\n[1] watermarkFromKit');
  const wm = watermarkFromKit(KIT, true);
  ok('dựng watermark từ logo kit', !!wm && wm.src === KIT.logo && wm.enabled === true);
  ok('không logo → undefined', watermarkFromKit({ logo: null, watermark: KIT.watermark }, true) === undefined);
}

function testApply() {
  console.log('\n[2] applyBrandKitToDeck — áp lại theme cả deck');
  const d = deck();
  const out = applyBrandKitToDeck(d, KIT);
  ok('font đổi theo kit', out.fonts === 'Modern');
  ok('palette đổi theo kit', out.palette[0] === '#ffffff');
  ok('nền sáng ↦ light mới', out.slides[0].background === '#ffffff');
  ok('chữ tối ↦ dark mới', (out.slides[0].elements[0] as { color: string }).color === '#0b1016');
  ok('watermark gắn logo kit (bật vì deck chưa có, kit có logo)', out.watermark?.src === KIT.logo && out.watermark?.enabled === true);
  ok('KHÔNG side-effect deck gốc', d.fonts === 'Editorial' && d.palette[0] === '#efe9dc');
}

/**
 * [2b] Bug đã báo (audit 18/07): nút "Áp lại theme cho cả deck" nghi chỉ đổi màu slide ĐANG
 * CHỌN. applyBrandKitToDeck (phần thuần, KHÔNG phụ thuộc slide đang chọn trên UI) phải nhuộm
 * TẤT CẢ slide trong deck.slides — verify bằng deck 3 slide (sáng/tối/sáng xen kẽ).
 */
function testApplyAllSlides() {
  console.log('\n[2b] applyBrandKitToDeck — PHẢI nhuộm MỌI slide, không riêng 1 slide');
  const d = multiSlideDeck();
  const out = applyBrandKitToDeck(d, KIT);
  ok('còn đủ 3 slide', out.slides.length === 3);
  ok('slide 1 (sáng) đổi nền theo kit', out.slides[0].background === '#ffffff');
  ok('slide 2 (tối) đổi nền theo kit (khác slide 1)', out.slides[1].background === '#0b1016');
  ok('slide 3 (sáng, giống slide 1) CŨNG đổi — không bị bỏ sót', out.slides[2].background === '#ffffff');
  ok(
    'màu chữ tiêu đề slide 2 (sáng trên nền tối) đổi đúng, giữ tương phản',
    (out.slides[1].elements[0] as { color: string }).color === '#ffffff',
  );
  ok(
    'màu chữ tiêu đề slide 3 đổi giống slide 1 (cùng vai trò)',
    (out.slides[2].elements[0] as { color: string }).color ===
      (out.slides[0].elements[0] as { color: string }).color,
  );
}

function testSeed() {
  console.log('\n[3] seedDeckWithBrandKit — deck mới tự nạp kit (không nhuộm)');
  const d = deck();
  const out = seedDeckWithBrandKit(d, KIT);
  ok('palette + font theo kit', out.palette[0] === '#ffffff' && out.fonts === 'Modern');
  ok('KHÔNG nhuộm slide (giữ màu nướng cũ vì deck mới thường trắng)', out.slides[0].background === '#efe9dc');
  ok('watermark từ logo kit', out.watermark?.src === KIT.logo);
}

function testDraft() {
  console.log('\n[4] draftKitFromDeck');
  const dk = draftKitFromDeck(deck(), 'TTT');
  ok('lấy palette/font từ deck', dk.palette.length === 6 && dk.fonts === 'Editorial');
  ok('id rỗng (kit mới)', dk.id === '');
}

const KIT2: BrandKit = { ...KIT, id: 'k2', name: 'Studio Khác', palette: ['#000000', '#111111', '#222222', '#333333', '#444444', '#555555'] };

/**
 * [5] Xuất/nhập .json (0b, 31/07, mã 7.1.25) — buildBrandKitExport/parseBrandKitExport/
 * mergeBrandKits đều THUẦN (không đụng localStorage) nên test trực tiếp được ở đây.
 */
function testExportImport() {
  console.log('\n[5] Xuất/nhập Brand Kit .json — buildBrandKitExport / parseBrandKitExport / mergeBrandKits');

  const pkg = buildBrandKitExport([KIT, KIT2], KIT.id);
  ok('gói xuất mang đủ 2 kit', pkg.kits.length === 2);
  ok('activeId hợp lệ được giữ', pkg.activeId === KIT.id);
  ok('activeId KHÔNG thuộc danh sách kit → bỏ về null', buildBrandKitExport([KIT], 'khong-ton-tai').activeId === null);
  ok('version = 1', pkg.version === 1);

  const roundTrip = parseBrandKitExport(JSON.stringify(pkg));
  ok('round-trip JSON giữ đủ kit', roundTrip !== null && roundTrip.kits.length === 2);
  ok('round-trip giữ activeId', roundTrip?.activeId === KIT.id);

  ok('JSON hỏng (không parse được) → null, không ném', parseBrandKitExport('{ khong phai json') === null);
  ok('version sai → null', parseBrandKitExport(JSON.stringify({ version: 2, kits: [KIT] })) === null);
  ok('thiếu mảng kits → null', parseBrandKitExport(JSON.stringify({ version: 1 })) === null);
  ok('mọi kit trong gói đều hỏng → null (không có kit hợp lệ nào)', parseBrandKitExport(JSON.stringify({ version: 1, kits: [{ id: 'x' }] })) === null);

  const withOneBad = parseBrandKitExport(JSON.stringify({ version: 1, kits: [KIT, { id: 'x' }] }));
  ok('1 kit hỏng bị lọc bỏ, kit hợp lệ còn lại vẫn giữ (không sập cả gói)', withOneBad !== null && withOneBad.kits.length === 1 && withOneBad.kits[0].id === KIT.id);

  // overwrite — thay TOÀN BỘ bằng gói nhập (người dùng đã CHỌN tường minh ở hộp thoại, không phải im lặng).
  const existing = { kits: [KIT2], activeId: KIT2.id };
  const incoming = buildBrandKitExport([KIT], KIT.id);
  const ow = mergeBrandKits(existing, incoming, 'overwrite');
  ok('overwrite: chỉ còn kit của gói nhập', ow.kits.length === 1 && ow.kits[0].id === KIT.id);
  ok('overwrite: addedCount = số kit trong gói', ow.addedCount === 1);

  // merge — cộng thêm, id chưa có thì giữ nguyên id.
  const mergeNew = mergeBrandKits({ kits: [KIT2], activeId: KIT2.id }, buildBrandKitExport([KIT], KIT.id), 'merge');
  ok('merge (id mới): giữ kit cũ + thêm kit mới → 2 kit', mergeNew.kits.length === 2);
  ok('merge (id mới): giữ nguyên id kit nhập vào (không trùng)', mergeNew.kits.some((k) => k.id === KIT.id));
  ok('merge: giữ active hiện có (không bị gói nhập ghi đè)', mergeNew.activeId === KIT2.id);

  // merge — id TRÙNG với kit đang có → KHÔNG ghi đè, cấp id mới (bản sao).
  const dupPkg = buildBrandKitExport([{ ...KIT2, name: 'Studio Khác (từ máy kia)' }], KIT2.id);
  const mergeDup = mergeBrandKits({ kits: [KIT2], activeId: KIT2.id }, dupPkg, 'merge');
  ok('merge (id trùng): KHÔNG ghi đè kit đang có — vẫn 2 kit (kit cũ + bản sao)', mergeDup.kits.length === 2);
  ok('merge (id trùng): kit cũ giữ nguyên, không bị đổi tên', mergeDup.kits.some((k) => k.id === KIT2.id && k.name === KIT2.name));
  ok('merge (id trùng): kit nhập vào được cấp ID MỚI (không trùng id cũ)', mergeDup.kits.filter((k) => k.id === KIT2.id).length === 1);
  ok('merge (id trùng): addedCount vẫn đếm là 1 kit mới thêm', mergeDup.addedCount === 1);

  // kho rỗng ban đầu → merge nhận active của gói nhập.
  const mergeEmpty = mergeBrandKits({ kits: [], activeId: null }, buildBrandKitExport([KIT], KIT.id), 'merge');
  ok('merge vào kho RỖNG: nhận active từ gói nhập', mergeEmpty.activeId === KIT.id);
}

testWatermarkFromKit();
testApply();
testApplyAllSlides();
testSeed();
testDraft();
testExportImport();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
