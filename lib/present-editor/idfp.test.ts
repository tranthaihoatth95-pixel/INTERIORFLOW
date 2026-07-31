/**
 * lib/present-editor/idfp.test.ts — round-trip exportIdfp/importIdfp (B2, 31/07, mã `4.1.b`),
 * cùng khuôn lib/cad/idf.test.ts. Chạy: node_modules/.bin/sucrase-node lib/present-editor/idfp.test.ts
 */
import {
  exportIdfp, importIdfp, IDFP_VERSION, migrateIdfp, lastImportIdfpError, __setCurrentIdfpVersionForTest,
} from './idfp';
import type { IdfpSheetData } from './idfp';
import type { EditorDeck, EditorSlide, ImageElement, TextElement, EmbeddedFont } from './model';
import { DEFAULT_ADJUST, FULL_CROP } from './model';
import type { BrandKit } from './brand-kit';
import { DEFAULT_BRAND_WATERMARK } from './brand-kit';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const FONT_DATA_URL = 'data:font/woff2;base64,d09GMgABAAAAAA==';

function img(id: string, src: string): ImageElement {
  return { id, kind: 'image', frame: { x: 0, y: 0, w: 50, h: 50, rotation: 0 }, src, adjust: { ...DEFAULT_ADJUST }, crop: { ...FULL_CROP } };
}

function txt(id: string, text: string): TextElement {
  return {
    id, kind: 'text', frame: { x: 0, y: 0, w: 50, h: 20, rotation: 0 }, text,
    fontSize: 5, color: '#111', align: 'left', bold: false, italic: false,
  };
}

function slide(id: string, elements: EditorSlide['elements']): EditorSlide {
  return { id, background: '#fff', elements };
}

function embeddedFont(label: string): EmbeddedFont {
  return { label, stack: `"${label}", sans-serif`, face: label.replace(/\s+/g, ''), dataUrl: FONT_DATA_URL, bytes: 12345 };
}

function buildDeck(seed: string): EditorDeck {
  return {
    id: `deck-${seed}`,
    brand: 'Lumen Villa',
    project: 'Dự án demo',
    fonts: 'Editorial',
    palette: ['#211e1a', '#efe9dc'],
    slides: [slide(`s-${seed}-1`, [img(`i-${seed}`, 'data:image/png;base64,iVBORw0KGgo='), txt(`t-${seed}`, `Slide ${seed}`)])],
    stagePreset: '16:9',
    customFonts: [embeddedFont(`Font ${seed}`)],
  };
}

function buildBrandKit(): BrandKit {
  return {
    id: 'bk-1',
    name: 'Dự án demo',
    logo: 'data:image/png;base64,bG9nbw==',
    palette: ['#211e1a', '#efe9dc', '#c9b79a'],
    fonts: 'Elegant',
    watermark: { ...DEFAULT_BRAND_WATERMARK },
    updatedAt: 1700000000000,
  };
}

/* ── 1) round-trip 1 sheet: slide/element/font nhúng/khổ trình bày đầy đủ ── */
function testSingleSheetRoundtrip() {
  console.log('\n[1] 1 sheet — round-trip slide/ảnh nhúng/font nhúng-theo-deck/khổ trình bày 1:1');
  const deck = buildDeck('a');
  const sheets: IdfpSheetData[] = [{ id: 'presheet-0', name: 'Trang 1', deck }];
  const json = exportIdfp(sheets, null, { projectName: 'Dự án demo' });

  ok('JSON hợp lệ (parse không lỗi)', (() => { try { JSON.parse(json); return true; } catch { return false; } })());
  ok('có field idfpVersion đúng', JSON.parse(json).idfpVersion === IDFP_VERSION);

  const parsed = importIdfp(json);
  ok('import thành công (không null)', parsed !== null);
  if (!parsed) return;
  ok('meta.projectName giữ đúng', parsed.meta.projectName === 'Dự án demo');
  ok('đúng 1 sheet', parsed.sheets.length === 1);
  const back = parsed.sheets[0];
  ok('sheet id/name giữ nguyên', back.id === 'presheet-0' && back.name === 'Trang 1');
  ok('đúng 1 slide', back.deck.slides.length === 1);

  const backImg = back.deck.slides[0].elements.find((e) => e.kind === 'image') as ImageElement | undefined;
  ok('ảnh nhúng (dataURL) giữ nguyên byte', backImg?.src === 'data:image/png;base64,iVBORw0KGgo=');

  ok('khổ trình bày per-sheet (stagePreset) giữ đúng', back.deck.stagePreset === '16:9');

  ok('font nhúng-theo-deck (customFonts) giữ đủ 1 font', back.deck.customFonts?.length === 1);
  const font = back.deck.customFonts?.[0];
  ok('font dataUrl giữ NGUYÊN VẸN (đây là điều Hoà nhấn mạnh — mở máy khác không sai chữ)', font?.dataUrl === FONT_DATA_URL);
  ok('font label/face/bytes giữ đúng', font?.label === 'Font a' && font?.face === 'Fonta' && font?.bytes === 12345);
}

/* ── 2) round-trip NHIỀU sheet ── */
function testMultiSheetRoundtrip() {
  console.log('\n[2] Nhiều sheet — round-trip TẤT CẢ sheet trong project, không lẫn dữ liệu');
  const sheets: IdfpSheetData[] = [
    { id: 'presheet-0', name: 'Trang 1', deck: buildDeck('a') },
    { id: 'presheet-1', name: 'Trang 2', deck: buildDeck('b') },
  ];
  const json = exportIdfp(sheets, null);
  const parsed = importIdfp(json);
  ok('import thành công', parsed !== null);
  if (!parsed) return;
  ok('đúng 2 sheet, đúng thứ tự', parsed.sheets.map((s) => s.name).join(',') === 'Trang 1,Trang 2');
  const p2 = parsed.sheets.find((s) => s.id === 'presheet-1')!;
  ok('sheet "Trang 2" giữ đúng font riêng (không lẫn Trang 1)', p2.deck.customFonts?.[0]?.label === 'Font b');
}

/* ── 3) Brand Kit snapshot — nhúng bản CHỤP, không phải tham chiếu sống ── */
function testBrandKitSnapshot() {
  console.log('\n[3] brandKitSnapshot — nhúng bản CHỤP tại thời điểm xuất');
  const kit = buildBrandKit();
  const json = exportIdfp([{ id: 'presheet-0', name: 'Trang 1', deck: buildDeck('a') }], kit);
  const parsed = importIdfp(json);
  ok('import thành công', parsed !== null);
  if (!parsed) return;
  ok('brandKitSnapshot giữ đúng id/name/palette', parsed.brandKitSnapshot?.id === 'bk-1' && parsed.brandKitSnapshot?.name === 'Dự án demo' && parsed.brandKitSnapshot?.palette.length === 3);
  ok('logo (dataURL) giữ nguyên', parsed.brandKitSnapshot?.logo === 'data:image/png;base64,bG9nbw==');

  // Snapshot là bản CHỤP — đổi kit gốc SAU khi export không ảnh hưởng file đã xuất (bằng chứng
  // "không phải tham chiếu sống": json là chuỗi bất biến, kit là object riêng biệt để test tường
  // minh việc mutate không lan sang đã export).
  kit.name = 'Đổi tên SAU khi xuất';
  const parsed2 = importIdfp(json);
  ok('đổi kit gốc SAU khi export KHÔNG ảnh hưởng file đã xuất (snapshot, không phải tham chiếu sống)', parsed2?.brandKitSnapshot?.name === 'Dự án demo');

  const jsonNoKit = exportIdfp([{ id: 'presheet-0', name: 'Trang 1', deck: buildDeck('a') }], null);
  ok('chưa có Brand Kit lúc xuất → brandKitSnapshot null (không bịa)', importIdfp(jsonNoKit)?.brandKitSnapshot === null);
}

/* ── 4) file hỏng/sai định dạng → null, KHÔNG throw ── */
function testInvalidInput() {
  console.log('\n[4] File hỏng/sai định dạng → importIdfp trả null, không throw crash app');
  let threw = false;
  let r1: unknown;
  try {
    r1 = importIdfp('{ khong phai json hop le');
  } catch {
    threw = true;
  }
  ok('JSON hỏng: không throw', !threw);
  ok('JSON hỏng: trả null', r1 === null);

  ok('thiếu idfpVersion → null', importIdfp(JSON.stringify({ sheets: [] })) === null);
  ok('idfpVersion sai số → null', importIdfp(JSON.stringify({ idfpVersion: 99, sheets: [] })) === null);
  ok('sheets rỗng → null', importIdfp(JSON.stringify({ idfpVersion: 1, sheets: [] })) === null);
  ok('không phải object (số/null) → null', importIdfp('42') === null && importIdfp('null') === null);

  // 1 sheet hỏng (deck thiếu slides) lẫn 1 sheet tốt → giữ sheet tốt, bỏ sheet hỏng
  const mixed = JSON.stringify({
    idfpVersion: 1,
    meta: {},
    brandKitSnapshot: null,
    sheets: [
      { id: 's-bad', name: 'Hỏng', deck: { id: 'd-bad' } }, // thiếu slides
      { id: 's-good', name: 'Tốt', deck: buildDeck('good') },
    ],
  });
  const parsedMixed = importIdfp(mixed);
  ok('sheet hỏng bị bỏ qua, sheet tốt vẫn giữ (best-effort, không crash)', parsedMixed !== null && parsedMixed.sheets.length === 1 && parsedMixed.sheets[0].id === 's-good');

  // brandKitSnapshot hỏng (thiếu field bắt buộc) → coi như null, không làm hỏng cả file
  const badKit = JSON.stringify({
    idfpVersion: 1, meta: {}, brandKitSnapshot: { id: 'x' }, // thiếu name/palette
    sheets: [{ id: 's-good', name: 'Tốt', deck: buildDeck('good') }],
  });
  ok('brandKitSnapshot hỏng → coi như null, sheets vẫn đọc được (không crash cả file)', importIdfp(badKit)?.brandKitSnapshot === null);
}

/* ── 5) meta mặc định khi không truyền ── */
function testDefaultMeta() {
  console.log('\n[5] meta mặc định — projectName/appVersion/createdAt/modifiedAt luôn có giá trị hợp lệ');
  const json = exportIdfp([{ id: 'x', name: 'y', deck: buildDeck('x') }], null);
  const parsed = importIdfp(json);
  ok('projectName mặc định không rỗng', !!parsed?.meta.projectName);
  ok('appVersion mặc định không rỗng', !!parsed?.meta.appVersion);
  ok('createdAt là ISO string hợp lệ', !!parsed && !Number.isNaN(new Date(parsed.meta.createdAt).getTime()));
  ok('modifiedAt là ISO string hợp lệ', !!parsed && !Number.isNaN(new Date(parsed.meta.modifiedAt).getTime()));
}

/* ── 6) migration path — cùng khuôn idf.test.ts ── */
function testMigrationPath() {
  console.log('\n[6] Migration path — file idfpVersion cũ vẫn parse được khi app "bump" version (giả lập)');

  const up = migrateIdfp({ idfpVersion: 1, meta: {}, sheets: [] }, 1, 2);
  ok('migrateIdfp nâng 1→2 thành công (khung identity)', up !== null && (up as unknown as { idfpVersion: number }).idfpVersion === 2);
  ok('migrateIdfp: fromVersion CAO HƠN toVersion → null', migrateIdfp({ idfpVersion: 3 }, 3, 1) === null);
  ok('migrateIdfp: đứt gãy giữa đường → null', migrateIdfp({ idfpVersion: 5 }, 5, 7) === null);
  ok('migrateIdfp: không phải object → null', migrateIdfp('not-an-object', 1, 2) === null);

  const json = exportIdfp([{ id: 'presheet-0', name: 'Trang cũ', deck: buildDeck('old') }], null);
  ok('(sanity) file export ở đúng IDFP_VERSION thật', JSON.parse(json).idfpVersion === IDFP_VERSION);

  __setCurrentIdfpVersionForTest(2);
  try {
    const parsed = importIdfp(json);
    ok('file idfpVersion=1 VẪN PARSE ĐƯỢC khi app giả lập ở version 2', parsed !== null);
    ok('dữ liệu deck giữ nguyên sau khi migrate', parsed?.sheets[0]?.deck.slides.length === 1);
  } finally {
    __setCurrentIdfpVersionForTest(IDFP_VERSION);
  }

  const tooNew = importIdfp(JSON.stringify({ idfpVersion: 99, sheets: [] }));
  ok('file version CAO HƠN app → vẫn null', tooNew === null);
  ok('KHÔNG còn im lặng — lastImportIdfpError() có lý do cụ thể', (lastImportIdfpError() ?? '').includes('mới hơn'));
}

testSingleSheetRoundtrip();
testMultiSheetRoundtrip();
testBrandKitSnapshot();
testInvalidInput();
testDefaultMeta();
testMigrationPath();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
