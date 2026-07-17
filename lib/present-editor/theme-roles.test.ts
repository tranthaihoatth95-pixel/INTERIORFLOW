/**
 * lib/present-editor/theme-roles.test.ts — kiểm NHUỘM LẠI theme theo vai trò (PS-1 / G.6). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/theme-roles.test.ts
 *
 * Trọng tâm: re-map màu theo VAI TRÒ (light↦light, dark↦dark…), KHÔNG phải find-and-replace hex;
 * xử lý đúng slide nền TỐI (title sáng phải vẫn sáng sau khi nhuộm), giữ transparent/nội dung/toạ độ.
 */
import {
  paletteRoles,
  nearestRole,
  remapColor,
  rethemeDeck,
} from './theme-roles';
import { makeText, makeShape, type EditorDeck } from './model';

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

const OLD = ['#efe9dc', '#c2ad86', '#8a6a3a', '#6e4a2e', '#3b352f', '#28211a']; // kem→than
const NEW = ['#ffffff', '#a8c0d0', '#3a7bd5', '#2b5c8a', '#1a2b3a', '#0b1016']; // trắng→xanh

function testRoles() {
  console.log('\n[1] paletteRoles — suy vai trò theo độ sáng + bão hoà');
  const r = paletteRoles(OLD);
  ok('dark = màu tối nhất', r.dark === '#28211a');
  ok('light = màu sáng nhất', r.light === '#efe9dc');
  ok('accent nằm trong dải giữa (không phải dark/light)', r.accent !== r.dark && r.accent !== r.light);
  ok('palette rỗng → fallback không vỡ', paletteRoles([]).light.length === 7);
  ok('palette undefined → fallback', paletteRoles(undefined).dark.length === 7);
}

function testNearest() {
  console.log('\n[2] nearestRole — phân loại màu về vai trò gần nhất');
  const r = paletteRoles(OLD);
  ok('màu sáng → light', nearestRole('#efe9dc', r) === 'light');
  ok('màu rất tối → dark', nearestRole('#28211a', r) === 'dark');
  ok('gần dark hơn light', nearestRole('#221f1a', r) === 'dark');
}

function testRemapColor() {
  console.log('\n[3] remapColor — thay theo vai trò, giữ màu không hợp lệ');
  const from = paletteRoles(OLD);
  const to = paletteRoles(NEW);
  ok('light(kem) ↦ light(trắng) của palette mới', remapColor('#efe9dc', from, to) === '#ffffff');
  ok('dark(than) ↦ dark(xanh-đen) mới', remapColor('#28211a', from, to) === '#0b1016');
  ok('transparent giữ nguyên', remapColor('transparent', from, to) === 'transparent');
  ok('chuỗi hỏng giữ nguyên', remapColor('not-a-color', from, to) === 'not-a-color');
}

function makeDeck(): EditorDeck {
  return {
    id: 'd1',
    brand: 'TTT',
    project: 'test',
    fonts: 'Editorial',
    palette: [...OLD],
    slides: [
      {
        id: 's-light',
        background: '#efe9dc', // nền SÁNG
        elements: [
          makeText({ id: 't1', text: 'Tiêu đề', role: 'title', color: '#28211a' }), // chữ TỐI
          makeShape('rect', { id: 'sh1', fill: '#8a6a3a', stroke: 'transparent' }),
          makeShape('line', { id: 'sh2', fill: 'transparent', stroke: '#6e4a2e' }),
        ],
      },
      {
        id: 's-dark',
        background: '#28211a', // nền TỐI
        elements: [
          makeText({ id: 't2', text: 'Cover', role: 'title', color: '#efe9dc' }), // chữ SÁNG
        ],
      },
    ],
  };
}

function testRethemeDeck() {
  console.log('\n[4] rethemeDeck — nhuộm cả deck, xử lý đúng nền tối/sáng');
  const deck = makeDeck();
  const out = rethemeDeck(deck, NEW);

  ok('deck.palette cập nhật sang palette mới', JSON.stringify(out.palette) === JSON.stringify(NEW));
  ok('KHÔNG side-effect: deck gốc giữ palette cũ', deck.palette[0] === '#efe9dc');
  ok('KHÔNG side-effect: màu chữ gốc nguyên vẹn', (deck.slides[0].elements[0] as { color: string }).color === '#28211a');

  // Slide nền sáng: nền↦light mới, chữ tối↦dark mới.
  ok('nền sáng ↦ light mới (trắng)', out.slides[0].background === '#ffffff');
  const t1 = out.slides[0].elements[0] as { color: string };
  ok('chữ tối ↦ dark mới', t1.color === '#0b1016');

  // Shape: fill remap, transparent giữ; stroke remap.
  const sh1 = out.slides[0].elements[1] as { fill: string; stroke: string };
  ok('shape fill được nhuộm (đổi khác cũ)', sh1.fill !== '#8a6a3a' && sh1.fill.startsWith('#'));
  ok('shape stroke transparent giữ nguyên', sh1.stroke === 'transparent');
  const sh2 = out.slides[0].elements[2] as { fill: string; stroke: string };
  ok('line fill transparent giữ nguyên', sh2.fill === 'transparent');
  ok('line stroke được nhuộm', sh2.stroke !== '#6e4a2e' && sh2.stroke.startsWith('#'));

  // Slide nền TỐI: nền↦dark mới, chữ SÁNG↦light mới (KHÔNG bị đảo thành chữ tối trên nền tối).
  ok('nền tối ↦ dark mới', out.slides[1].background === '#0b1016');
  const t2 = out.slides[1].elements[0] as { color: string };
  ok('chữ sáng trên nền tối ↦ light mới (giữ tương phản)', t2.color === '#ffffff');

  // Bố cục/nội dung giữ nguyên.
  ok('nội dung chữ giữ nguyên', (out.slides[1].elements[0] as { text: string }).text === 'Cover');
  ok('số slide/element giữ nguyên', out.slides.length === 2 && out.slides[0].elements.length === 3);
}

testRoles();
testNearest();
testRemapColor();
testRethemeDeck();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
