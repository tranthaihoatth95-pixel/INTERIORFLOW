/**
 * lib/cad/zone.test.ts — Zone tool (24/07, GAP-COLOR-FILL N1/N2):
 *  [1] round-trip .idf với zone (oval + polygon) / ellipse / arrow / hatch.opacity
 *  [2] BACKWARD-COMPAT: .idf CŨ (không có entity/field mới) vẫn import được nguyên vẹn
 *  [3] hình học zone: zoneBoundaryPoints / zoneCentroid / entityBox
 *  [4] phép biến hình: translate / rotate / mirror / scale cho 3 entity mới
 *  [5] DXF export chứa HATCH SOLID + TEXT nhãn cho zone, polyline cho ellipse/arrow
 * Chạy: node_modules/.bin/sucrase-node lib/cad/zone.test.ts
 */
import { exportIdf, importIdf } from './idf';
import type { IdfSheetData } from './idf';
import {
  emptyDoc, entityBox, zoneBoundaryPoints, zoneCentroid, ZONE_GROUP_META, ZONE_GROUPS,
} from './model';
import type { Doc, ZoneEntity, EllipseEntity, ArrowEntity, HatchEntity } from './model';
import { newId } from './store';
import { translateEntity, rotateEntity, mirrorEntity } from './geometry';
import { scaleEntitiesAbout } from './modify';
import { exportDxf } from './dxf';

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
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

function buildZoneDoc(): Doc {
  const doc = emptyDoc();
  const lay = doc.layers[0].id;
  const zoneOval: ZoneEntity = {
    id: newId('e'), type: 'zone', layer: lay,
    ellipse: { c: { x: 2000, y: 1500 }, rx: 1800, ry: 900 },
    label: 'PHÒNG KHÁCH', labelEn: 'Living', group: 'social', opacity: 0.4,
  };
  const zonePoly: ZoneEntity = {
    id: newId('e'), type: 'zone', layer: lay,
    polygon: [{ x: 0, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 2000 }, { x: 0, y: 2000 }],
    label: 'BẾP', group: 'wet', opacity: 0.35, labelPos: { x: 1500, y: 900 },
  };
  const ellipse: EllipseEntity = { id: newId('e'), type: 'ellipse', layer: lay, c: { x: 500, y: 500 }, rx: 400, ry: 200, rot: Math.PI / 6 };
  const arrow: ArrowEntity = {
    id: newId('e'), type: 'arrow', layer: lay, lineType: 'dashed',
    path: [{ x: 0, y: 0 }, { x: 1000, y: 500 }, { x: 2500, y: 700 }], headEnd: true, headStart: true, headSize: 300,
  };
  const hatch: HatchEntity = {
    id: newId('e'), type: 'hatch', layer: lay, pattern: 'SOLID', solid: true, opacity: 0.55,
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }],
  };
  doc.entities.push(zoneOval, zonePoly, ellipse, arrow, hatch);
  doc.siteImage = { src: 'data:image/png;base64,iVBORw0KGgo=', x: -1000, y: -1000, w: 8000, h: 6000, opacity: 0.6, visible: true };
  return doc;
}

/* ── [1] round-trip .idf với entity mới ── */
function testRoundtrip() {
  console.log('\n[1] round-trip .idf — zone/ellipse/arrow/hatch.opacity/siteImage');
  const doc = buildZoneDoc();
  const sheets: IdfSheetData[] = [{ id: 's0', name: 'Zone map', doc }];
  const parsed = importIdf(exportIdf(sheets, { projectName: 'Zone demo' }));
  ok('import thành công', parsed !== null);
  if (!parsed) return;
  const back = parsed.sheets[0].doc;
  ok('đủ 5 entity', back.entities.length === 5);
  const zo = back.entities.find((e) => e.type === 'zone' && e.ellipse) as ZoneEntity | undefined;
  ok('zone oval giữ ellipse boundary', !!zo && !!zo.ellipse && zo.ellipse.rx === 1800 && zo.ellipse.ry === 900);
  ok('zone oval giữ label/labelEn/group/opacity', !!zo && zo.label === 'PHÒNG KHÁCH' && zo.labelEn === 'Living' && zo.group === 'social' && zo.opacity === 0.4);
  const zp = back.entities.find((e) => e.type === 'zone' && e.polygon) as ZoneEntity | undefined;
  ok('zone polygon giữ 4 đỉnh + labelPos', !!zp && zp.polygon!.length === 4 && !!zp.labelPos && zp.labelPos.x === 1500);
  const el = back.entities.find((e) => e.type === 'ellipse') as EllipseEntity | undefined;
  ok('ellipse giữ c/rx/ry/rot', !!el && el.rx === 400 && el.ry === 200 && near(el.rot ?? 0, Math.PI / 6));
  const ar = back.entities.find((e) => e.type === 'arrow') as ArrowEntity | undefined;
  ok('arrow giữ path 3 điểm + 2 đầu mũi tên + headSize', !!ar && ar.path.length === 3 && ar.headStart === true && ar.headEnd === true && ar.headSize === 300);
  const ha = back.entities.find((e) => e.type === 'hatch') as HatchEntity | undefined;
  ok('hatch giữ opacity per-entity 0.55', !!ha && ha.opacity === 0.55);
  ok('siteImage giữ world bounds + opacity', !!back.siteImage && back.siteImage.w === 8000 && back.siteImage.opacity === 0.6 && back.siteImage.visible === true);
}

/* ── [2] backward-compat: .idf cũ không có field/entity mới ── */
function testBackwardCompat() {
  console.log('\n[2] backward-compat — .idf cũ (trước zone tool) vẫn mở được');
  const oldDoc = emptyDoc();
  oldDoc.entities.push(
    { id: 'e-1', type: 'line', layer: 'l-wall', a: { x: 0, y: 0 }, b: { x: 3000, y: 0 } },
    { id: 'e-2', type: 'hatch', layer: 'l-wall', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], solid: true },
  );
  // JSON dựng TAY đúng schema idfVersion 1 CŨ (không siteImage, không opacity, không zone).
  const oldJson = JSON.stringify({
    idfVersion: 1,
    meta: { projectName: 'Cũ', createdAt: '2026-07-01T00:00:00Z', modifiedAt: '2026-07-01T00:00:00Z', appVersion: 'interiorflow-1.0.0' },
    sheets: [{ id: 's0', name: 'Bản vẽ 1', doc: { entities: oldDoc.entities, layers: oldDoc.layers } }],
  });
  const parsed = importIdf(oldJson);
  ok('.idf cũ import không lỗi', parsed !== null);
  if (!parsed) return;
  const back = parsed.sheets[0].doc;
  ok('giữ nguyên 2 entity cũ', back.entities.length === 2);
  const ha = back.entities.find((e) => e.type === 'hatch') as HatchEntity | undefined;
  ok('hatch cũ KHÔNG có opacity (render sẽ dùng 0.9 như cũ)', !!ha && ha.opacity === undefined);
  ok('doc cũ không có siteImage', back.siteImage === undefined);
  // export lại rồi import lần nữa — vẫn ổn (không "nâng cấp ngầm" phá schema)
  const round2 = importIdf(exportIdf([{ id: 's0', name: 'Bản vẽ 1', doc: back }]));
  ok('re-export .idf cũ vẫn round-trip được', round2 !== null && round2.sheets[0].doc.entities.length === 2);
}

/* ── [3] hình học zone ── */
function testZoneGeometry() {
  console.log('\n[3] hình học — zoneBoundaryPoints/zoneCentroid/entityBox/ZONE_GROUP_META');
  const doc = buildZoneDoc();
  const zo = doc.entities.find((e) => e.type === 'zone' && e.ellipse) as ZoneEntity;
  const zp = doc.entities.find((e) => e.type === 'zone' && e.polygon) as ZoneEntity;
  const bOval = zoneBoundaryPoints(zo, 32);
  ok('biên oval xấp xỉ 32 điểm', bOval.length === 32);
  ok('mọi điểm biên oval thoả pt trên ellipse (±1e-6)', bOval.every((p) => {
    const dx = (p.x - 2000) / 1800;
    const dy = (p.y - 1500) / 900;
    return near(dx * dx + dy * dy, 1, 1e-6);
  }));
  ok('biên polygon = chính polygon', zoneBoundaryPoints(zp) === zp.polygon);
  ok('centroid oval = tâm ellipse', near(zoneCentroid(zo).x, 2000) && near(zoneCentroid(zo).y, 1500));
  ok('centroid polygon = trung bình đỉnh', near(zoneCentroid(zp).x, 1500) && near(zoneCentroid(zp).y, 1000));
  const boxOval = entityBox(zo);
  ok('entityBox oval đúng bao hình', near(boxOval.minX, 200) && near(boxOval.maxX, 3800) && near(boxOval.minY, 600) && near(boxOval.maxY, 2400));
  const ar = doc.entities.find((e) => e.type === 'arrow') as ArrowEntity;
  const boxAr = entityBox(ar);
  ok('entityBox arrow bao trọn path', boxAr.minX === 0 && boxAr.maxX === 2500 && boxAr.maxY === 700);
  ok('đủ 6 nhóm ZONE_GROUP_META (VN hoá)', ZONE_GROUPS.length === 6 && ZONE_GROUPS.every((g) => !!ZONE_GROUP_META[g].vi && !!ZONE_GROUP_META[g].en && /^#/.test(ZONE_GROUP_META[g].color)));
}

/* ── [4] phép biến hình ── */
function testTransforms() {
  console.log('\n[4] biến hình — translate/rotate/mirror/scale cho zone/ellipse/arrow');
  const doc = buildZoneDoc();
  const zo = doc.entities.find((e) => e.type === 'zone' && e.ellipse) as ZoneEntity;
  const ar = doc.entities.find((e) => e.type === 'arrow') as ArrowEntity;
  const el = doc.entities.find((e) => e.type === 'ellipse') as EllipseEntity;

  const zt = translateEntity(zo, 100, -50) as ZoneEntity;
  ok('translate zone oval dời tâm ellipse', near(zt.ellipse!.c.x, 2100) && near(zt.ellipse!.c.y, 1450));
  const at = translateEntity(ar, 10, 20) as ArrowEntity;
  ok('translate arrow dời mọi điểm path', near(at.path[0].x, 10) && near(at.path[2].y, 720));

  const er = rotateEntity(el, { x: 0, y: 0 }, Math.PI / 2) as EllipseEntity;
  ok('rotate ellipse: tâm xoay quanh gốc + rot cộng dồn', near(er.c.x, -500) && near(er.c.y, 500) && near(er.rot ?? 0, Math.PI / 6 + Math.PI / 2));

  const zm = mirrorEntity(zo, { x: 0, y: 0 }, Math.PI / 2) as ZoneEntity; // trục dọc x=0
  ok('mirror zone oval qua trục dọc: tâm lật dấu X', near(zm.ellipse!.c.x, -2000) && near(zm.ellipse!.c.y, 1500));

  const [zs] = scaleEntitiesAbout([zo], { x: 0, y: 0 }, 2) as ZoneEntity[];
  ok('scale zone oval ×2: tâm + bán trục nhân đôi', near(zs.ellipse!.c.x, 4000) && near(zs.ellipse!.rx, 3600) && near(zs.ellipse!.ry, 1800));
  const [as2] = scaleEntitiesAbout([ar], { x: 0, y: 0 }, 0.5) as ArrowEntity[];
  ok('scale arrow ×0.5: path + headSize theo hệ số', near(as2.path[1].x, 500) && near(as2.headSize ?? 0, 150));
}

/* ── [5] DXF export ── */
function testDxfExport() {
  console.log('\n[5] DXF export — zone→HATCH SOLID+TEXT · ellipse/arrow→LWPOLYLINE');
  const doc = buildZoneDoc();
  const dxf = exportDxf(doc);
  ok('có entity HATCH (zone SOLID)', /\n0\nHATCH\n/.test(dxf) || dxf.includes('HATCH'));
  ok('có pattern SOLID', dxf.includes('SOLID'));
  ok('có TEXT nhãn zone "PHÒNG KHÁCH"', dxf.includes('PHÒNG KHÁCH'));
  ok('có LWPOLYLINE (ellipse/arrow xấp xỉ)', dxf.includes('LWPOLYLINE'));
  ok('kết thúc EOF hợp lệ', dxf.trimEnd().endsWith('EOF'));
}

testRoundtrip();
testBackwardCompat();
testZoneGeometry();
testTransforms();
testDxfExport();

console.log(`\nzone.test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
