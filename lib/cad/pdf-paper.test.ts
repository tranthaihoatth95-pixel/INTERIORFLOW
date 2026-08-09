import { buildPaperSheetPdf, buildSheetSetPdf } from './pdf';
import { emptyDoc } from './model';
import type { Sheet } from './model';

let pass = 0;
function ok(label: string, yes: boolean) {
  if (!yes) throw new Error(`FAIL: ${label}`);
  pass += 1;
  console.log(`  ok  - ${label}`);
}

const doc = emptyDoc();
doc.entities.push({ id: 'line-1', type: 'line', layer: doc.layers[0].id, a: { x: 0, y: 0 }, b: { x: 5000, y: 0 } });
const sheet: Sheet = {
  id: 'paper-1', name: 'Mặt bằng', number: 'A-01', paper: 'A3', orientation: 'landscape',
  titleBlock: { project: 'Dự án', drawnBy: 'An', date: '', revision: '01' },
  viewports: [{ id: 'vp-1', rectOnPaper: { x: 20, y: 20, w: 120, h: 80 }, centerMm: { x: 2500, y: 0 }, scale: 50, locked: true }],
};

async function main() {
  const pdf = await buildPaperSheetPdf(doc, sheet);
  const PT_TO_MM = 25.4 / 72;
  const media = (pdf as unknown as { internal: { getPageInfo(n: number): { pageContext: { mediaBox: { topRightX: number; topRightY: number } } } } }).internal.getPageInfo(1).pageContext.mediaBox;
  ok('tờ Paper A3 ngang xuất đúng 420×297mm', Math.round(media.topRightX * PT_TO_MM) === 420 && Math.round(media.topRightY * PT_TO_MM) === 297);

  const page = (pdf as unknown as { internal: { pages: string[][] } }).internal.pages[1].join('\n');
  ok('PDF có clip theo đúng ô nhìn', page.includes('W'));
  const pathLines = page.split('\n').filter((line) => / [ml]$/.test(line));
  const x1 = Number(pathLines[0]?.split(' ')[0]);
  const x2 = Number(pathLines[1]?.split(' ')[0]);
  ok('đường 5000mm ở 1:50 thành đúng 100mm trên giấy', Math.abs((x2 - x1) * PT_TO_MM - 100) < 0.001);

  const set = await buildSheetSetPdf([{ id: sheet.id, name: sheet.name, doc, paperSheet: sheet }]);
  const totalPages = (set as unknown as { internal: { pages: unknown[] } }).internal.pages.length - 1;
  ok('bộ hồ sơ Paper có mục lục + một tờ', totalPages === 2);
  ok('xuất không mutate Doc/layer nguồn', doc.layers[0].visible && doc.entities.length === 1);
  console.log(`\n${pass} pass, 0 fail`);
}

void main();
