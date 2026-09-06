/**
 * lib/three/danh-tinh-2d-len-3d.test.ts — ĐI TRỌN DÂY: chọn vật liệu ở 2D → entity → `docToObjScene`
 * → `SceneGroup.matId` → khoá gộp → tra ra ảnh vân.
 *
 * ⛔ VÌ SAO PHẢI ĐI TRỌN, không test từng khúc: hai lượt V8 trước bị bác vì đúng cái bệnh "thêm
 * trường không ai ghi, không ai đọc". Mỗi khúc test riêng đều xanh mà cả dây vẫn có thể đứt ở
 * ĐÚNG một mối. Ca đắt nhất ở đây là mối cuối — `cad-to-obj` có chép `matId` sang `SceneGroup`
 * không: thiếu nó thì vật liệu studio tự nhập (có `matId`, `specId` là cuid) KHÔNG BAO GIỜ lên
 * được 3D, tức "chạy với hàng mẫu, chết với hàng thật".
 *
 * Chạy: node_modules/.bin/sucrase-node lib/three/danh-tinh-2d-len-3d.test.ts
 */
import type { Doc, Entity } from '../cad/model';
import { docToObjScene, toScene3DData } from './cad-to-obj';
import { buildMergedGeometries } from './obj-scene-to-geometry';
import { matIdCuaNhom } from '../materials/danh-tinh-vat-lieu';
import { nguonVatLieuMacDinh } from './vat-lieu-nhom';
import { VAT_LIEU_HAT_GIONG } from '../materials/hat-giong';
import { exportIdf, importIdf } from '../cad/idf';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, chiTiet?: string) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}${chiTiet ? ` — ${chiTiet}` : ''}`); }
}

const SOI = VAT_LIEU_HAT_GIONG.find((v) => v.name.includes('sồi'))!;
const OC_CHO = VAT_LIEU_HAT_GIONG.find((v) => v.name.includes('óc chó'))!;

/** Mặt sàn khai báo — đúng loại `lib/boq/compute.ts` quét ra m², nên 3D và BOQ đọc CÙNG hình học. */
function san(id: string, x0: number, x1: number, matId?: string, specId?: string): Entity {
  return {
    id, type: 'hatch', layer: 'SAN', elementType: 'slab',
    points: [{ x: x0, y: 0 }, { x: x1, y: 0 }, { x: x1, y: 3000 }, { x: x0, y: 3000 }],
    pattern: 'SOLID', solid: true,
    ...(matId ? { matId } : {}),
    ...(specId ? { specId } : {}),
  } as Entity;
}

const doc: Doc = {
  entities: [
    // ① studio tự nhập: CÓ `matId` (UUID), `specId` là cuid ⇒ chỉ `matId` cứu được nó
    san('s1', 0, 3000, SOI.matId, 'clx1abc23def45ghi67jkl890'),
    // ② hàng hạt giống chọn ở 2D: chỉ có `specId = hat-giong:<uuid>` (đường sáng cũ)
    san('s2', 3000, 6000, undefined, `hat-giong:${OC_CHO.matId}`),
    // ③ chưa gán vật liệu — phải KHÔNG nhận danh tính nào, và không được làm hỏng hai ca trên
    san('s3', 6000, 9000),
  ],
  layers: [{ name: 'SAN', color: '#888888', visible: true, locked: false }],
} as unknown as Doc;

console.log('docToObjScene — matId của entity phải sang được SceneGroup');
const scene = docToObjScene(doc);
const nhomSan = scene.groups.filter((g) => g.name.startsWith('Slab') || g.name.toLowerCase().includes('slab') || g.positions.length > 0);
ok('dựng ra ít nhất 3 nhóm hình học', nhomSan.length >= 3, String(scene.groups.length));

const theoMatId = scene.groups.map((g) => matIdCuaNhom(g)).filter((x): x is string => !!x);
ok('ca ① studio (matId thẳng, specId là cuid) tra ra ĐÚNG UUID', theoMatId.includes(SOI.matId),
  JSON.stringify(scene.groups.map((g) => ({ n: g.name, m: g.matId, s: g.specId }))));
ok('ca ② hạt giống (chỉ specId) vẫn tra ra ĐÚNG UUID', theoMatId.includes(OC_CHO.matId));
ok('đúng 2 nhóm có danh tính — ca ③ không tự nhận vơ', theoMatId.length === 2, String(theoMatId.length));

console.log('\nkhoá gộp — hai mặt sàn khác vật liệu KHÔNG được gộp làm một');
const built = buildMergedGeometries(toScene3DData(scene));
const matIds = built.map((b) => b.matId).filter((x): x is string => !!x);
ok('hai nhóm mang hai matId khác nhau đi qua được bước gộp',
  new Set(matIds).size === 2 && matIds.includes(SOI.matId) && matIds.includes(OC_CHO.matId),
  JSON.stringify(built.map((b) => ({ n: b.name, m: b.matId }))));

console.log('\nmối cuối — matId đó tra ra ẢNH VÂN THẬT (máy sạch, 0 CSDL)');
const nguon = nguonVatLieuMacDinh();
for (const b of built) {
  if (!b.matId) continue;
  const pbr = nguon.pbrMap?.[b.matId];
  ok(`nhóm ${b.matId.slice(0, 8)}… ra ảnh vân + tỉ lệ vật lý`,
    !!pbr?.baseColorMapUrl && !!pbr?.uvScaleMm, JSON.stringify({ url: pbr?.baseColorMapUrl, uv: pbr?.uvScaleMm }));
}

console.log('\nvòng đời .idf — danh tính phải SỐNG SÓT qua lưu → mở lại');
{
  /* ⛔ Không có ca này thì cả dây trên chỉ đúng TRONG MỘT PHIÊN: người dùng chọn vật liệu, thấy
     3D lên vân, lưu, đóng app, mở lại — và mọi thứ phẳng trở lại. Đó là kiểu hỏng tệ nhất vì nó
     chỉ lộ ra ở lần mở SAU, xa chỗ gây lỗi. `lib/cad/idf.ts` không whitelist trường entity (đã
     kiểm), nhưng "đã kiểm bằng mắt" không phải là máy canh — ca này mới là. */
  const lai = importIdf(exportIdf([{ id: 'sh1', name: 'S1', doc }]));
  const ents = (lai?.sheets?.[0]?.doc?.entities ?? []) as { id: string; matId?: string; specId?: string }[];
  const s1 = ents.find((e) => e.id === 's1');
  const s2 = ents.find((e) => e.id === 's2');
  const s3 = ents.find((e) => e.id === 's3');
  ok('mở lại đủ 3 entity', ents.length === 3, String(ents.length));
  ok('`matId` sống sót qua .idf', s1?.matId === SOI.matId, String(s1?.matId));
  ok('`specId` vẫn sống sót như trước (không hồi quy)', s2?.specId === `hat-giong:${OC_CHO.matId}`, String(s2?.specId));
  ok('entity chưa gán vẫn KHÔNG có matId sau khi mở lại (không bịa lúc parse)', s3?.matId === undefined);
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
