import { patchSheetViewport, viewportWorldBox } from './paper-space';
import type { Sheet } from './model';

let pass = 0;
function ok(label: string, yes: boolean) { if (!yes) throw new Error(`FAIL: ${label}`); pass += 1; console.log(`  ok  - ${label}`); }

const sheet: Sheet = {
  id: 's1', name: 'Mặt bằng', number: 'A-01', paper: 'A3', orientation: 'landscape',
  titleBlock: { project: '', drawnBy: '', date: '', revision: '' },
  viewports: [{ id: 'vp1', rectOnPaper: { x: 15, y: 15, w: 390, h: 267 }, centerMm: { x: 1000, y: 2000 }, scale: 100, locked: false }],
};

const box = viewportWorldBox(sheet.viewports[0]);
ok('1:100 đổi đúng mm giấy sang mm model', box.maxX - box.minX === 39000 && box.maxY - box.minY === 26700);
ok('box giữ đúng tâm model', (box.minX + box.maxX) / 2 === 1000 && (box.minY + box.maxY) / 2 === 2000);
const changed = patchSheetViewport(sheet, 'vp1', { scale: 50, locked: true });
ok('đổi tỉ lệ và khoá đúng viewport', changed.viewports[0].scale === 50 && changed.viewports[0].locked);
ok('không mutate Sheet gốc', sheet.viewports[0].scale === 100 && !sheet.viewports[0].locked);
console.log(`\n${pass} pass, 0 fail`);
