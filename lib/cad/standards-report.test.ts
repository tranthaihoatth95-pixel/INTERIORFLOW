/**
 * lib/cad/standards-report.test.ts — kiểm trích TÊN DỰ ÁN / người vẽ từ khung tên (thuần, không
 * đụng jsPDF/window). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/standards-report.test.ts
 */
import { extractProjectName, extractDrawnBy } from './standards-report';
import { emptyDoc } from './model';
import type { Doc, TextEntity } from './model';
import { titleBlockTTT } from './commands';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function txt(at: { x: number; y: number }, text: string, h = 100): TextEntity {
  return { id: `t-${text}-${at.x}-${at.y}`, type: 'text', layer: 'l-text', at, text, h };
}

// [1] Khung tên chuẩn titleBlockTTT → trích đúng info.project.
{
  const doc: Doc = emptyDoc();
  const tb = titleBlockTTT({ x: 5000, y: 0 }, {
    project: 'Căn hộ Sunrise A1203', drawing: 'MB', scale: '1:100',
    author: 'Nguyễn Văn A', checker: 'Trần B', drawingNo: 'IF-01', date: '2026-07-25',
  }, 'l-wall', 'l-text', 100);
  doc.entities.push(...tb);
  // titleBlockTTT viết HOA tên dự án vào entity → trích ra đúng chuỗi HOA đó (phản ánh bản vẽ).
  ok('[1] trích tên dự án từ titleBlockTTT', extractProjectName(doc) === 'CĂN HỘ SUNRISE A1203');
  ok('[1b] trích người vẽ từ titleBlockTTT', extractDrawnBy(doc) === 'Nguyễn Văn A');
}

// [2] Không có khung tên → chuỗi rỗng (không đoán mò).
{
  const doc: Doc = emptyDoc();
  doc.entities.push(txt({ x: 0, y: 0 }, 'PHÒNG NGỦ'));
  ok('[2] không khung tên → project rỗng', extractProjectName(doc) === '');
  ok('[2b] không khung tên → drawnBy rỗng', extractDrawnBy(doc) === '');
}

// [3] Nhãn "DỰ ÁN · PROJECT" nhưng giá trị placeholder 'DỰ ÁN' → coi như chưa nhập (rỗng).
{
  const doc: Doc = emptyDoc();
  doc.entities.push(txt({ x: 100, y: 200 }, 'DỰ ÁN · PROJECT', 24));
  doc.entities.push(txt({ x: 100, y: 150 }, 'DỰ ÁN', 50)); // value dưới nhãn nhưng là placeholder
  ok('[3] placeholder DỰ ÁN → rỗng', extractProjectName(doc) === '');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
