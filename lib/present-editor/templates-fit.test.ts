/**
 * lib/present-editor/templates-fit.test.ts — L2 phiếu 03/08 (chữ chồng chữ slide "Triết lý").
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/templates-fit.test.ts
 *
 * Nghiệm thu của phiếu là "không cặp khối text nào chồng >2px" — đo trên DOM. Ở tầng thuần
 * (không DOM) tương đương: mọi khối text sinh ra phải nằm TRỌN trong khung của nó và các
 * khung không giao nhau. Test này giữ cả hai điều đó cho template `grid4-philosophy`.
 */
import { fitFontSize, BUILTIN_TEMPLATES } from './templates';
import { evaluateSlide } from './layout-check';
import type { TextElement } from './model';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log('  ok  -', m); } else { fail++; console.log('  FAIL-', m); } };

const tpl = (id: string) => BUILTIN_TEMPLATES.find((t) => t.id === id)!;

console.log('[1] fitFontSize — chữ ngắn giữ nguyên cỡ ưa thích, chữ dài bị co lại');
{
  ok(fitFontSize(20, 24, 12, 1.6) === 1.6, 'chữ ngắn (20 ký tự) giữ 1.6');
  const longer = fitFontSize(400, 24, 12, 1.6);
  ok(longer < 1.6, `chữ dài (400 ký tự) co xuống ${longer} < 1.6`);
  ok(fitFontSize(99999, 24, 12, 1.6) >= 1.1, 'chạm sàn thì trả sàn, không trả 0/âm');
}

console.log('[2] grid4-philosophy — bullet KHÔNG còn chuỗi cứng lặp 4 lần');
{
  const s = tpl('grid4-philosophy').build({
    kicker: 'Triết lý thiết kế',
    title: 'LUMEN VILLA — Moodboard',
    body: ['A', 'B', 'C', 'D'], // chỉ 4 nhãn cột, KHÔNG có ghi chú
    images: ['x.jpg'],
  });
  const texts = s.elements.filter((e): e is TextElement => e.kind === 'text');
  ok(!texts.some((t) => /Không gian chuẩn mực/.test(t.text)), 'không tự bịa nội dung mẫu');
  ok(texts.filter((t) => t.text.startsWith('•')).length === 0, 'thiếu dữ liệu → bỏ trống bullet, không lặp');
}

console.log('[3] Có ghi chú thật → mỗi cột một ý riêng, không khối nào chồng khối nào');
{
  const s = tpl('grid4-philosophy').build({
    body: ['A', 'B', 'C', 'D', 'ghi chú một', 'ghi chú hai', 'ghi chú ba', 'ghi chú bốn'],
    images: ['x.jpg'],
  });
  const bullets = s.elements.filter((e): e is TextElement => e.kind === 'text' && e.text.startsWith('•'));
  ok(bullets.length === 4, `4 cột có 4 bullet (thấy ${bullets.length})`);
  ok(new Set(bullets.map((b) => b.text)).size === 4, 'nội dung 4 bullet KHÁC nhau');

  const boxes = s.elements.map((e) => e.frame);
  let worst = 0;
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 0 && oy > 0) worst = Math.max(worst, Math.min(ox, oy));
    }
  ok(worst < 0.2, `không khung nào chồng nhau (chồng lớn nhất ${worst.toFixed(2)}% < 0.2%)`);
}

console.log('[4] Ghi chú DÀI bất thường vẫn không tràn khung (nguyên nhân gốc của chữ chồng chữ)');
{
  const long = 'Không gian chuẩn mực, ít mà đúng, bền vật liệu và bền cả công năng theo thời gian sử dụng thật';
  const s = tpl('grid4-philosophy').build({
    body: ['A', 'B', 'C', 'D', long, long, long, long],
    images: ['x.jpg'],
  });
  const rep = evaluateSlide(s, 'grid4-philosophy');
  ok(!rep.warnings.some((w) => w.metric === 'textOverflow'), 'layout-check KHÔNG báo chữ tràn khung');
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail) process.exit(1);
