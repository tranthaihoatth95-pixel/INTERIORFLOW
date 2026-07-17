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

testWatermarkFromKit();
testApply();
testSeed();
testDraft();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
