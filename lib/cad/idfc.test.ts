/**
 * lib/cad/idfc.test.ts — V2 (vỏ chung + ruột union): round-trip v2 · NÂNG CẤP v1→v2 (lần đầu
 * IDFC_MIGRATIONS có entry thật — phần rủi ro nhất của phiếu M-IDFC-2) · union chặn ruột sai loại
 * · 3 ràng buộc. Chạy: node_modules/.bin/sucrase-node lib/cad/idfc.test.ts
 */
import {
  exportIdfc,
  importIdfc,
  migrateIdfc,
  lastImportIdfcError,
  __setCurrentIdfcVersionForTest,
  IDFC_VERSION,
  IDFC_KINDS,
  BODY_TYPE_OF_KIND,
  SELLABLE_KINDS,
} from './idfc';
import type { IdfcGeom2d } from './idfc';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const geom2d: IdfcGeom2d = {
  group: 'Phòng khách',
  w: 800,
  h: 450,
  prims: [{ k: 'poly', pts: [{ x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 450 }, { x: 0, y: 450 }], closed: true }],
};

console.log('V2 round-trip — component (furniture) đủ 3 mặt + vỏ chung mới');
{
  const json = exportIdfc({
    meta: { name: 'Ghế thử', code: 'CHAIR-T1', kind: 'furniture', scope: 'studio', tags: ['ghế'], room: 'Phòng khách' },
    body: { type: 'component', geom2d, geom3d: { heightMm: 720, matId: 'W-102' } },
    commerce: { brand: 'Thử', sku: 'CHAIR-T1', unit: 'cái', priceVnd: 1500000 },
  });
  ok('idfcVersion xuất = 2', JSON.parse(json).idfcVersion === IDFC_VERSION && IDFC_VERSION === 2);
  const back = importIdfc(json);
  ok('đọc lại được', back !== null);
  ok('kind ở META (trục ①)', back?.meta.kind === 'furniture');
  ok('scope/tags/room vỏ chung sống sót', back?.meta.scope === 'studio' && back?.meta.tags?.[0] === 'ghế' && back?.meta.room === 'Phòng khách');
  ok('ruột component giữ geom2d + geom3d', back?.body.type === 'component' && back.body.geom2d.w === 800 && back.body.geom3d?.matId === 'W-102');
  ok('commerce v2 KHÔNG mang field kind', back?.commerce !== undefined && !('kind' in (back!.commerce as object)));
  ok('giá sống sót', back?.commerce?.priceVnd === 1500000);
}

console.log('V2 round-trip — material (pbr là ruột chính)');
{
  const json = exportIdfc({
    meta: { name: 'Đá thử', code: 'STN-T1', kind: 'material' },
    body: { type: 'material', pbr: { typeId: 'da-tu-nhien', roughness: 0.5, metallic: 0 }, hatch2d: { hatchPattern: 'ANSI32' } },
  });
  const back = importIdfc(json);
  ok('đọc lại được, ruột material', back?.body.type === 'material');
  ok('pbr + hatch2d sống sót', back?.body.type === 'material' && back.body.pbr.roughness === 0.5 && back.body.hatch2d?.hatchPattern === 'ANSI32');
}

console.log('V2 round-trip — asset (KHÔNG có geom2d, đúng nghĩa union)');
{
  const json = exportIdfc({
    meta: { name: 'Ảnh mẫu', code: 'REF-001', kind: 'asset' },
    body: { type: 'asset', imageUrl: 'data:image/png;base64,AA==', caption: 'thử' },
  });
  const back = importIdfc(json);
  ok('đọc lại được, ruột asset', back?.body.type === 'asset' && back.body.imageUrl.startsWith('data:'));
}

console.log('UNION CHẶN RUỘT SAI LOẠI — điểm ăn tiền của v2 (interface phẳng không làm được)');
{
  const wrong = JSON.stringify({
    idfcVersion: 2,
    meta: { name: 'Video thử', code: 'VID-01', kind: 'video', createdAt: 'x', modifiedAt: 'x', appVersion: 'x' },
    body: { type: 'component', geom2d },
  });
  ok('video + ruột component ⇒ null', importIdfc(wrong) === null);
  ok('lý do nêu đúng loại và ruột', /video/.test(lastImportIdfcError() ?? '') && /component/.test(lastImportIdfcError() ?? ''));
  const noShots = JSON.stringify({
    idfcVersion: 2,
    meta: { name: 'V', code: 'VID-02', kind: 'video', createdAt: 'x', modifiedAt: 'x', appVersion: 'x' },
    body: { type: 'video' },
  });
  ok('video thiếu shots ⇒ null + lý do', importIdfc(noShots) === null && /shots|cảnh/.test(lastImportIdfcError() ?? ''));
  const badKind = JSON.stringify({
    idfcVersion: 2,
    meta: { name: 'X', code: 'X-01', kind: 'khong-co', createdAt: 'x', modifiedAt: 'x', appVersion: 'x' },
    body: { type: 'asset', imageUrl: 'a' },
  });
  ok('kind lạ ⇒ null + lý do', importIdfc(badKind) === null && /không hợp lệ/.test(lastImportIdfcError() ?? ''));
}

console.log('MIGRATION v1→v2 — file v1 CŨ (geom2d ở GỐC, kind trong commerce) đọc được nguyên vẹn');
{
  // fixture chép ĐÚNG cấu trúc exportIdfc v1 sinh ra (git history idfc.ts trước phiếu này)
  const v1Furniture = JSON.stringify({
    idfcVersion: 1,
    meta: { name: 'Ghế bành Pelican', code: 'FJ-PEL-01', createdAt: '2026-08-07T10:00:00Z', modifiedAt: '2026-08-07T10:00:00Z', appVersion: 'interiorflow-1.0.0' },
    geom2d,
    geom3d: { heightMm: 720, matId: 'FJ-PEL-01' },
    commerce: { kind: 'furniture', brand: 'House of Finn Juhl', sku: 'FJ-PEL-01', unit: 'cái', priceVnd: 120000000 },
  });
  const back = importIdfc(v1Furniture);
  ok('v1 furniture đọc được', back !== null);
  ok('kind chuyển từ commerce lên meta', back?.meta.kind === 'furniture');
  ok('geom2d chuyển vào ruột component, w/h/prims nguyên vẹn', back?.body.type === 'component' && back.body.geom2d.w === 800 && back.body.geom2d.prims.length === 1);
  ok('geom3d di theo', back?.body.type === 'component' && back.body.geom3d?.heightMm === 720);
  ok('commerce giữ giá, BỎ kind', back?.commerce?.priceVnd === 120000000 && !('kind' in (back!.commerce as object)));
}
{
  const v1Lighting = JSON.stringify({
    idfcVersion: 1,
    meta: { name: 'Đèn thả', code: 'LP-01', createdAt: 'x', modifiedAt: 'x', appVersion: 'x' },
    geom2d,
    commerce: { kind: 'lighting' },
  });
  ok('v1 lighting → v2 fixture (chốt 11.4 gộp)', importIdfc(v1Lighting)?.meta.kind === 'fixture');
}
{
  const v1Material = JSON.stringify({
    idfcVersion: 1,
    meta: { name: 'Đá travertine', code: 'SW-TRV-BE', createdAt: 'x', modifiedAt: 'x', appVersion: 'x' },
    geom2d,
    geom3d: { matId: 'SW-TRV-BE', pbr: { typeId: 'da-tu-nhien', roughness: 0.5 } },
    commerce: { kind: 'material', unit: 'm2', priceVnd: 2400000 },
  });
  const back = importIdfc(v1Material);
  ok('v1 material → ruột material, pbr lên ruột chính', back?.body.type === 'material' && back.body.pbr.roughness === 0.5);
  ok('geom2d cũ GIỮ ở symbol2d (KS4 — không vứt dữ liệu)', back?.body.type === 'material' && back.body.symbol2d?.w === 800);
  ok('giá m2 sống sót', back?.commerce?.unit === 'm2' && back?.commerce?.priceVnd === 2400000);
}
{
  const v1NoCommerce = JSON.stringify({
    idfcVersion: 1,
    meta: { name: 'Khối trơn', code: 'BLK-01', createdAt: 'x', modifiedAt: 'x', appVersion: 'x' },
    geom2d,
  });
  const back = importIdfc(v1NoCommerce);
  ok('v1 không commerce → furniture mặc định, vẫn đọc được', back?.meta.kind === 'furniture' && back?.body.type === 'component');
}

console.log('migrateIdfc trực tiếp — cùng khuôn idf.ts');
{
  const v1 = { idfcVersion: 1, meta: { name: 'A', code: 'A-1' }, geom2d, commerce: { kind: 'millwork' } };
  const m = migrateIdfc(v1, 1, 2);
  ok('nâng 1→2: idfcVersion 2 + kind millwork', (m as unknown as { idfcVersion: number })?.idfcVersion === 2 && m?.meta.kind === 'millwork');
  ok('đứt gãy (nâng tới version chưa có hàm) ⇒ null', migrateIdfc(v1, 1, 99) === null);
  ok('fromVersion > toVersion ⇒ null', migrateIdfc(v1, 3, 2) === null);
}

console.log('version tương lai — từ chối có lý do');
{
  const future = JSON.stringify({ idfcVersion: 99, meta: { name: 'X', code: 'X' }, body: { type: 'asset', imageUrl: 'a' } });
  ok('null + câu "bản IF mới hơn"', importIdfc(future) === null && /mới hơn/.test(lastImportIdfcError() ?? ''));
}

console.log('__setCurrentIdfcVersionForTest — cô lập, không rò giữa test');
{
  __setCurrentIdfcVersionForTest(1);
  const v2File = JSON.stringify({ idfcVersion: 2, meta: { name: 'X', code: 'X', kind: 'asset', createdAt: 'x', modifiedAt: 'x', appVersion: 'x' }, body: { type: 'asset', imageUrl: 'a' } });
  ok('app giả lập v1 gặp file v2 ⇒ từ chối (mới hơn)', importIdfc(v2File) === null);
  __setCurrentIdfcVersionForTest(IDFC_VERSION);
  ok('trả lại version thật thì đọc lại được', importIdfc(v2File) !== null);
}

console.log('bảng loại — bất biến khai báo (chốt 11.4)');
{
  ok('đủ 11 kind', IDFC_KINDS.length === 11);
  ok('mọi kind có ruột trong BODY_TYPE_OF_KIND', IDFC_KINDS.every((k) => typeof BODY_TYPE_OF_KIND[k] === 'string'));
  ok('lighting KHÔNG còn là kind', !(IDFC_KINDS as readonly string[]).includes('lighting'));
  ok('6 loại bán được đúng chốt', SELLABLE_KINDS.length === 6 && SELLABLE_KINDS.includes('soft') && !SELLABLE_KINDS.includes('page'));
}

console.log('JSON hỏng/thiếu — không throw');
{
  ok('chuỗi rác ⇒ null', importIdfc('{{{') === null);
  ok('thiếu meta.name ⇒ null + lý do', importIdfc(JSON.stringify({ idfcVersion: 2, meta: { code: 'X' }, body: { type: 'asset', imageUrl: 'a' } })) === null && /tên hoặc mã/.test(lastImportIdfcError() ?? ''));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
