/**
 * lib/present-editor/custom-templates.test.ts — kiểm PHẦN THUẦN của template tự lưu (PS-2). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/custom-templates.test.ts
 *
 * Trọng tâm: build lại slide từ template tự lưu — GIỮ khung % + phần trống KHÔNG ctx cấp
 * (đúng quy ước BUILTIN_TEMPLATES), FILL đúng slot khi ctx có (title/kicker/body/ảnh theo thứ
 * tự + ảnh nền là slot cuối), NHUỘM LẠI màu theo palette hiện hành (tái dùng theme-roles).
 * Không đụng localStorage (node không có window; read/write tự guard nên vẫn chạy được).
 */
import {
  saveCustomTemplate,
  getCustomTemplates,
  deleteCustomTemplate,
  buildFromCustomTemplate,
  toEditorTemplate,
  type CustomTemplate,
} from './custom-templates';
import { makeText, makeImage, type EditorSlide } from './model';

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

const OLD_PALETTE = ['#efe9dc', '#c2ad86', '#8a6a3a', '#6e4a2e', '#3b352f', '#28211a']; // kem→than
const NEW_PALETTE = ['#ffffff', '#a8c0d0', '#3a7bd5', '#2b5c8a', '#1a2b3a', '#0b1016']; // trắng→xanh

/** slide "chụp" mẫu: kicker + title + body + 2 ảnh + ảnh nền — đủ mọi loại slot. */
function capturedSlide(): EditorSlide {
  return {
    id: 's_captured',
    background: '#efe9dc', // light cũ
    backgroundImage: 'https://ref/bg.jpg',
    elements: [
      makeText({ id: 'k1', text: 'CONCEPT GỐC', role: 'kicker', color: '#8a6a3a', frame: { x: 6, y: 10, w: 40, h: 5, rotation: 0 } }),
      makeText({ id: 't1', text: 'Tiêu đề gốc', role: 'title', color: '#28211a', frame: { x: 6, y: 16, w: 60, h: 14, rotation: 0 } }),
      makeText({ id: 'b1', text: '• Ý gốc 1\n• Ý gốc 2', role: 'body', color: '#28211a', frame: { x: 6, y: 34, w: 60, h: 30, rotation: 0 } }),
      makeImage('https://ref/img0.jpg', { id: 'im0', frame: { x: 55, y: 10, w: 40, h: 40, rotation: 0 } }),
      makeImage('https://ref/img1.jpg', { id: 'im1', frame: { x: 55, y: 55, w: 40, h: 40, rotation: 0 } }),
    ],
    templateId: undefined,
  };
}

function testSaveGetDelete() {
  console.log('\n[1] save/get/delete — im lặng khi không có window (Node), vẫn trả object hợp lệ');
  const ct = saveCustomTemplate({ name: '  Bìa dự án khách sạn  ', slide: capturedSlide(), palette: OLD_PALETTE });
  ok('có id', typeof ct.id === 'string' && ct.id.length > 0);
  ok('tên đã trim', ct.name === 'Bìa dự án khách sạn');
  ok('sao sâu slide (không cùng tham chiếu)', ct.slide !== capturedSlide());
  ok('palette đã lưu', ct.palette.length === 6);
  // Node không có window ⇒ persist no-op ⇒ danh sách rỗng (đúng behavior guard, không throw).
  ok('getCustomTemplates() không throw khi không có window', Array.isArray(getCustomTemplates()));
  ok('tên rỗng → fallback "Mẫu của tôi"', saveCustomTemplate({ name: '  ', slide: capturedSlide(), palette: OLD_PALETTE }).name === 'Mẫu của tôi');
  ok('deleteCustomTemplate không throw khi không có window', (() => { deleteCustomTemplate(ct.id); return true; })());
}

function testBuildEmptyCtx() {
  console.log('\n[2] buildFromCustomTemplate — ctx rỗng → giữ NGUYÊN nội dung/ảnh đã chụp');
  const ct: CustomTemplate = {
    id: 'ct1',
    name: 'Mẫu A',
    thumb: null,
    slide: capturedSlide(),
    palette: OLD_PALETTE,
    createdAt: 0,
    updatedAt: 0,
  };
  const out = buildFromCustomTemplate(ct, {});
  const kicker = out.elements.find((e) => e.kind === 'text' && (e as { role?: string }).role === 'kicker') as { text: string } | undefined;
  const title = out.elements.find((e) => e.kind === 'text' && (e as { role?: string }).role === 'title') as { text: string } | undefined;
  const body = out.elements.find((e) => e.kind === 'text' && (e as { role?: string }).role === 'body') as { text: string } | undefined;
  const images = out.elements.filter((e) => e.kind === 'image') as { src: string }[];
  ok('kicker giữ nguyên', kicker?.text === 'CONCEPT GỐC');
  ok('title giữ nguyên', title?.text === 'Tiêu đề gốc');
  ok('body giữ nguyên', body?.text === '• Ý gốc 1\n• Ý gốc 2');
  ok('2 ảnh giữ nguyên đúng thứ tự', images[0]?.src === 'https://ref/img0.jpg' && images[1]?.src === 'https://ref/img1.jpg');
  ok('ảnh nền giữ nguyên (không có ctx.images)', out.backgroundImage === 'https://ref/bg.jpg');
  ok('khung % giữ nguyên (frame không đổi)', JSON.stringify(out.elements[0].frame) === JSON.stringify(ct.slide.elements[0].frame));
  ok('templateId gắn tiền tố mine_', out.templateId === 'mine_ct1');
  ok('id phần tử ĐỔI MỚI (không trùng slide gốc — tránh id đụng khi ghép nhiều slide)', out.elements[0].id !== ct.slide.elements[0].id);
  ok('id slide mới (không trùng slide gốc)', out.id !== ct.slide.id);
}

function testBuildFillCtx() {
  console.log('\n[3] buildFromCustomTemplate — ctx có nội dung/ảnh mới → FILL đúng slot');
  const ct: CustomTemplate = {
    id: 'ct2',
    name: 'Mẫu B',
    thumb: null,
    slide: capturedSlide(),
    palette: OLD_PALETTE,
    createdAt: 0,
    updatedAt: 0,
  };
  const out = buildFromCustomTemplate(ct, {
    kicker: 'dự án mới',
    title: 'Tiêu đề mới',
    body: ['Ý mới 1', 'Ý mới 2', 'Ý mới 3'],
    images: ['https://new/a.jpg', 'https://new/b.jpg', 'https://new/c.jpg'],
  });
  const kicker = out.elements.find((e) => e.kind === 'text' && (e as { role?: string }).role === 'kicker') as { text: string } | undefined;
  const title = out.elements.find((e) => e.kind === 'text' && (e as { role?: string }).role === 'title') as { text: string } | undefined;
  const body = out.elements.find((e) => e.kind === 'text' && (e as { role?: string }).role === 'body') as { text: string } | undefined;
  const images = out.elements.filter((e) => e.kind === 'image') as { src: string }[];
  ok('kicker viết hoa toàn bộ (đúng quy ước builtin)', kicker?.text === 'DỰ ÁN MỚI');
  ok('title thay bằng ctx.title', title?.text === 'Tiêu đề mới');
  ok('body nối bullet "• " (đúng quy ước textBlocks builtin)', body?.text === '• Ý mới 1\n• Ý mới 2\n• Ý mới 3');
  ok('2 ảnh đầu (theo thứ tự element) lấy từ ctx.images[0..1]', images[0]?.src === 'https://new/a.jpg' && images[1]?.src === 'https://new/b.jpg');
  ok('ảnh nền = ctx.images[2] (slot SAU 2 ảnh element)', out.backgroundImage === 'https://new/c.jpg');
}

function testImageCycling() {
  console.log('\n[4] Ô ảnh vòng lại khi ctx.images ít hơn số slot (đúng quy ước imgAt)');
  const ct: CustomTemplate = {
    id: 'ct3',
    name: 'Mẫu C',
    thumb: null,
    slide: capturedSlide(),
    palette: OLD_PALETTE,
    createdAt: 0,
    updatedAt: 0,
  };
  const out = buildFromCustomTemplate(ct, { images: ['https://one/only.jpg'] });
  const images = out.elements.filter((e) => e.kind === 'image') as { src: string }[];
  ok('cả 2 ô ảnh element đều lấy ảnh duy nhất (vòng lại theo modulo)', images[0]?.src === 'https://one/only.jpg' && images[1]?.src === 'https://one/only.jpg');
  ok('ảnh nền cũng vòng lại về ảnh duy nhất', out.backgroundImage === 'https://one/only.jpg');
}

function testRecolor() {
  console.log('\n[5] Nhuộm lại màu theo palette hiện hành (tái dùng theme-roles, không viết lại)');
  const ct: CustomTemplate = {
    id: 'ct4',
    name: 'Mẫu D',
    thumb: null,
    slide: capturedSlide(),
    palette: OLD_PALETTE,
    createdAt: 0,
    updatedAt: 0,
  };
  const same = buildFromCustomTemplate(ct, {});
  ok('KHÔNG truyền ctx.palette → giữ màu đã chụp (from===to)', same.background === '#efe9dc');
  const rethemed = buildFromCustomTemplate(ct, { palette: NEW_PALETTE });
  ok('nền light(kem) ↦ light(trắng) mới', rethemed.background === '#ffffff');
  const title = rethemed.elements.find((e) => e.kind === 'text' && (e as { role?: string }).role === 'title') as { color: string } | undefined;
  ok('chữ dark(than) ↦ dark(xanh-đen) mới', title?.color === '#0b1016');
}

function testToEditorTemplate() {
  console.log('\n[6] toEditorTemplate — bọc thành EditorTemplate group "mine"');
  const ct: CustomTemplate = {
    id: 'ct5',
    name: 'Mẫu E',
    thumb: 'data:image/png;base64,ZZZ',
    slide: capturedSlide(),
    palette: OLD_PALETTE,
    createdAt: 0,
    updatedAt: 0,
  };
  const t = toEditorTemplate(ct);
  ok('group = mine', t.group === 'mine');
  ok('id gắn tiền tố mine_', t.id === 'mine_ct5');
  ok('name giữ nguyên', t.name === 'Mẫu E');
  ok('thumb giữ nguyên', t.thumb === ct.thumb);
  const built = t.build({ title: 'X' });
  const title = built.elements.find((e) => e.kind === 'text' && (e as { role?: string }).role === 'title') as { text: string } | undefined;
  ok('build(ctx) hoạt động qua wrapper', title?.text === 'X');
}

testSaveGetDelete();
testBuildEmptyCtx();
testBuildFillCtx();
testImageCycling();
testRecolor();
testToEditorTemplate();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
