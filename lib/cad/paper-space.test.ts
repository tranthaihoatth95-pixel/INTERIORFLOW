import { clampViewportRect, docForViewport, moveViewportRect, patchSheetViewport, removeSheetViewport, resizeViewportRect, setViewportLayerVisibility, viewportLayerVisible, viewportWorldBox } from './paper-space';
import type { Doc, Sheet } from './model';

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
const clamped = clampViewportRect({ x: -20, y: 290, w: 500, h: 5 }, 420, 297);
ok('rect luôn nằm trong giấy và giữ kích thước tối thiểu', clamped.x === 8 && clamped.y >= 8 && clamped.w === 404 && clamped.h === 35);
const moved = moveViewportRect({ x: 20, y: 20, w: 100, h: 80 }, 500, -50, 420, 297);
ok('kéo viewport bị chặn ở mép giấy', moved.x === 312 && moved.y === 8);
const resized = resizeViewportRect({ x: 20, y: 20, w: 100, h: 80 }, -90, 500, 420, 297);
ok('resize giữ min và không tràn giấy', resized.w === 35 && resized.h === 269);
ok('không xoá viewport cuối cùng', removeSheetViewport(sheet, 'vp1') === sheet);
const two = { ...sheet, viewports: [...sheet.viewports, { ...sheet.viewports[0], id: 'vp2' }] };
ok('xoá đúng viewport khi tờ còn ô khác', removeSheetViewport(two, 'vp1').viewports[0].id === 'vp2');
const doc: Doc = {
  entities: [],
  layers: [
    { id: 'wall', name: 'Tường', color: '#ffffff', visible: true, locked: false },
    { id: 'furniture', name: 'Nội thất', color: '#ffffff', visible: false, locked: false },
  ],
};
const overridden = setViewportLayerVisibility(setViewportLayerVisibility(sheet.viewports[0], 'wall', false), 'furniture', true);
ok('override tắt lớp đang hiện trong riêng ô nhìn', !viewportLayerVisible(overridden, 'wall', true));
ok('override bật lớp đang ẩn trong riêng ô nhìn', viewportLayerVisible(overridden, 'furniture', false));
ok('đổi lớp không mutate viewport gốc', sheet.viewports[0].layerOverrides === undefined);
const viewportDoc = docForViewport(doc, overridden);
ok('Doc render nhận đúng hai override', !viewportDoc.layers[0].visible && viewportDoc.layers[1].visible);
ok('Doc nguồn không bị đổi trạng thái lớp', doc.layers[0].visible && !doc.layers[1].visible);
console.log(`\n${pass} pass, 0 fail`);
