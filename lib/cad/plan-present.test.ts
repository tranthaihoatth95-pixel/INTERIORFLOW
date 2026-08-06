/**
 * lib/cad/plan-present.test.ts — test ống kính trình bày (VIỆC 1, phiên S4).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/plan-present.test.ts`
 *
 * Ba lời hứa PHẢI có test canh, không phải chỉ ghi trong docstring:
 *  [A] KHÔNG đổi kích thước / KHÔNG đổi vị trí (§0f TB1) — canh từng trường toạ độ.
 *  [B] KHÔNG nhân đôi `Doc` (K1) — `Doc` gốc bất biến sau khi chiếu.
 *  [C] Cùng đầu vào → cùng kết quả (§0e KS2) — chạy 2 lần ra byte y hệt.
 */

import type { Doc, Entity } from './model';
import {
  presentProjection, derivePresentDecor, classifyPresentRole, furnitureClusters,
  roleDrawSpec, stripPresentDecor, isPresentDecor, structureBox,
  NEUTRAL_PRESENT_PALETTE, PRESENT_ID_PREFIX, __clearPresentMemo, presentProjectionMemo,
} from './plan-present';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`); }
};

/* ── bản vẽ giả: 1 tường khai báo · 1 sàn · 3 khối đồ gần nhau · 1 chữ ── */
function mkDoc(): Doc {
  const entities: Entity[] = [
    { id: 'w1', type: 'line', layer: 'L1', elementType: 'wall', a: { x: 0, y: 0 }, b: { x: 6000, y: 0 } },
    { id: 's1', type: 'rect', layer: 'L1', elementType: 'slab', x: 0, y: 0, w: 6000, h: 4000 },
    { id: 'b1', type: 'block', layer: 'L2', block: 'desk', at: { x: 1000, y: 1000 }, rot: 0, sx: 1, sy: 1 },
    { id: 'b2', type: 'block', layer: 'L2', block: 'desk', at: { x: 1800, y: 1000 }, rot: 0, sx: 1, sy: 1 },
    { id: 'b3', type: 'block', layer: 'L2', block: 'officeChair', at: { x: 1400, y: 1600 }, rot: 0, sx: 1, sy: 1 },
    { id: 't1', type: 'text', layer: 'L3', at: { x: 500, y: 3000 }, text: 'GHI CHU', h: 200 },
  ];
  return {
    id: 'd', name: 'test', unit: 'mm',
    layers: [
      { id: 'L1', name: 'A-Wall', color: '#ff0000', visible: true, locked: false },
      { id: 'L2', name: 'A-Furniture', color: '#00ff00', visible: true, locked: false },
      { id: 'L3', name: 'A-Text', color: '#0000ff', visible: true, locked: false },
    ],
    entities,
  } as unknown as Doc;
}

console.log('\n[1] Phân vai — K3: khai báo thắng suy đoán');
{
  const doc = mkDoc();
  const w = classifyPresentRole(doc, doc.entities[0]);
  ok('tường khai elementType ⇒ structure, KHÔNG inferred', w.role === 'structure' && !w.inferred, JSON.stringify(w));
  const s = classifyPresentRole(doc, doc.entities[1]);
  ok('slab khai báo ⇒ floor, KHÔNG inferred', s.role === 'floor' && !s.inferred);
  const b = classifyPresentRole(doc, doc.entities[2]);
  ok('block ⇒ furniture', b.role === 'furniture');
  const t = classifyPresentRole(doc, doc.entities[5]);
  ok('text ⇒ annotation', t.role === 'annotation');

  // entity KHÔNG khai gì, chỉ có tên layer → phải gắn cờ inferred
  const bare: Entity = { id: 'x', type: 'line', layer: 'L1', a: { x: 0, y: 0 }, b: { x: 1, y: 1 } } as Entity;
  const v = classifyPresentRole({ ...doc, entities: [bare] } as Doc, bare);
  ok('suy từ tên layer ⇒ inferred=true (K3 bắt phải nói rõ)', v.role === 'structure' && v.inferred, JSON.stringify(v));
  ok('có why (KS5 — máy nói được vì sao)', !!v.why && v.why.length > 0);
}

console.log('\n[2] Nét là THÔNG TIN — thứ bậc ISO giữ nguyên ở chế độ trình bày (§0f TB2)');
{
  const p = NEUTRAL_PRESENT_PALETTE;
  const st = roleDrawSpec('structure', p).lineweightMm;
  const fu = roleDrawSpec('furniture', p).lineweightMm;
  const an = roleDrawSpec('annotation', p).lineweightMm;
  ok('kết cấu đậm hơn đồ đạc', st > fu, `${st} vs ${fu}`);
  ok('đồ đạc đậm hơn ghi chú', fu > an, `${fu} vs ${an}`);
  ok('cây là điểm màu, khác mọi màu nét công trình',
    p.plant !== p.structure && p.plant !== p.furniture && p.plant !== p.annotation);
}

console.log('\n[3] ⛔ KHÔNG ĐỔI KÍCH THƯỚC, KHÔNG ĐỔI VỊ TRÍ (§0f TB1) — lời hứa lớn nhất');
{
  const doc = mkDoc();
  const before = JSON.stringify(doc.entities);
  const out = presentProjection(doc, { ground: 'flat' });

  ok('Doc GỐC không bị sửa (K1 — chiếu là thuần)', JSON.stringify(doc.entities) === before);

  // đối chiếu TỪNG entity gốc trong bản chiếu: mọi trường KHÁC color/lineweight phải y hệt
  let drift = '';
  for (const orig of doc.entities) {
    const proj = out.doc.entities.find((e) => e.id === orig.id)!;
    const a = { ...orig } as Record<string, unknown>;
    const b = { ...proj } as Record<string, unknown>;
    delete a.color; delete a.lineweight; delete b.color; delete b.lineweight;
    if (JSON.stringify(a) !== JSON.stringify(b)) drift += `${orig.id} `;
  }
  ok('mọi trường HÌNH HỌC giữ nguyên tuyệt đối', drift === '', `lệch ở: ${drift}`);

  const projW = out.doc.entities.find((e) => e.id === 'w1')!;
  ok('nhưng MÀU thì đã đổi (ống kính có tác dụng)', projW.color === NEUTRAL_PRESENT_PALETTE.structure);
}

console.log('\n[4] ⛔ KHÔNG NHÂN ĐÔI Doc — entity phái sinh phải tách được ra (K1)');
{
  const doc = mkDoc();
  const out = presentProjection(doc, { ground: 'islands' });
  const decor = out.doc.entities.filter(isPresentDecor);
  ok('có sinh trang trí', decor.length > 0);
  ok('mọi trang trí mang tiền tố pv:', decor.every((e) => e.id.startsWith(PRESENT_ID_PREFIX)));
  const stripped = stripPresentDecor(out.doc.entities);
  ok('lọc xong còn ĐÚNG số entity gốc', stripped.length === doc.entities.length,
    `${stripped.length} vs ${doc.entities.length}`);
  ok('không entity gốc nào bị coi nhầm là trang trí', doc.entities.every((e) => !isPresentDecor(e)));
}

console.log('\n[5] Cùng đầu vào → cùng kết quả (§0e KS2 — cấm Math.random)');
{
  const a = presentProjection(mkDoc(), { ground: 'islands' });
  const b = presentProjection(mkDoc(), { ground: 'islands' });
  ok('chạy 2 lần ra hình học y hệt',
    JSON.stringify(a.doc.entities.filter(isPresentDecor)) === JSON.stringify(b.doc.entities.filter(isPresentDecor)));
}

console.log('\n[6] Cụm — đơn vị bố trí là CỤM, không phải từng món');
{
  const doc = mkDoc();
  const cs = furnitureClusters(doc);
  ok('3 món gần nhau gom thành 1 cụm', cs.length === 1 && cs[0].count === 3, JSON.stringify(cs.map((c) => c.count)));

  // đẩy 1 món ra rất xa ⇒ phải tách thành 2 cụm
  const far = { ...doc, entities: [...doc.entities, { id: 'b9', type: 'block', layer: 'L2', block: 'desk', at: { x: 90000, y: 90000 }, rot: 0, sx: 1, sy: 1 } as Entity] } as Doc;
  ok('món ở xa tách thành cụm riêng', furnitureClusters(far).length === 2);
}

console.log('\n[7] TB4 — đổi dữ liệu thì cái đẹp TỰ cập nhật, không phải sửa tay');
{
  const doc = mkDoc();
  const small = derivePresentDecor(doc, { ground: 'none', showPlants: false, showPeople: false });
  const rugSmall = small.under.find((e) => e.id.includes('rug'))!;

  // dời một cái bàn ra xa hơn ⇒ cụm to ra ⇒ thảm PHẢI to theo
  const bigDoc = {
    ...doc,
    entities: doc.entities.map((e) => (e.id === 'b2' ? { ...e, at: { x: 3200, y: 1000 } } : e)),
  } as Doc;
  const big = derivePresentDecor(bigDoc, { ground: 'none', showPlants: false, showPeople: false });
  const rugBig = big.under.find((e) => e.id.includes('rug'))!;

  const spanX = (e: Entity) => {
    const pts = (e as Extract<Entity, { type: 'polyline' }>).points;
    return Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
  };
  ok('cụm rộng ra ⇒ thảm tự rộng ra', spanX(rugBig) > spanX(rugSmall), `${spanX(rugBig).toFixed(0)} vs ${spanX(rugSmall).toFixed(0)}`);
}

console.log('\n[8] Thảm là NÉT ĐỨT (công cụ zoning) · cây là điểm màu · người có mặt');
{
  const { under, over } = derivePresentDecor(mkDoc(), { ground: 'flat' });
  const rug = under.find((e) => e.id.includes('rug'))!;
  ok('thảm dùng lineType dashed', rug.lineType === 'dashed', String(rug.lineType));
  const plant = over.find((e) => e.id.includes('plant'))!;
  ok('cây mang màu plant', plant.color === NEUTRAL_PRESENT_PALETTE.plant);
  ok('có người', over.some((e) => e.id.includes('person')));
  // tán tự do BẤT ĐỐI XỨNG — bán kính không được đều nhau
  const pts = (plant as Extract<Entity, { type: 'polyline' }>).points;
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const rs = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
  ok('tán bất đối xứng (bán kính không đều)', Math.max(...rs) - Math.min(...rs) > 1);
}

console.log('\n[9] Nền sàn — khai báo thắng suy đoán, và NÓI RÕ khi phải đoán (K3/N4)');
{
  const withSlab = derivePresentDecor(mkDoc(), { ground: 'flat' });
  ok('có slab khai báo ⇒ KHÔNG bịa nền', !withSlab.under.some((e) => e.id.includes('ground')));
  ok('và ghi rõ nguồn', withSlab.report.notes.some((n) => n.includes('khai báo')));

  const noSlab = {
    ...mkDoc(),
    entities: mkDoc().entities.filter((e) => e.id !== 's1'),
  } as Doc;
  const r = derivePresentDecor(noSlab, { ground: 'flat' });
  ok('không có slab ⇒ dựng nền suy đoán', r.under.some((e) => e.id.includes('ground')));
  ok('và KHAI THẬT là suy đoán', r.report.notes.some((n) => n.includes('SUY ĐOÁN')));
}

console.log('\n[10] structureBox bỏ ghi chú nằm xa — không lấy bao toàn bản vẽ');
{
  const doc = mkDoc();
  const withFarText = {
    ...doc,
    entities: [...doc.entities, { id: 'far', type: 'text', layer: 'L3', at: { x: 5_000_000, y: 0 }, text: 'X', h: 100 } as Entity],
  } as Doc;
  const b = structureBox(withFarText)!;
  ok('chữ cách 5km KHÔNG kéo giãn khung kết cấu', b.maxX < 100_000, `maxX=${b.maxX}`);
}

console.log('\n[11] Bộ nhớ đệm — cùng doc + cùng options thì KHÔNG tính lại');
{
  __clearPresentMemo();
  const doc = mkDoc();
  const a = presentProjectionMemo(doc, { ground: 'flat' });
  const b = presentProjectionMemo(doc, { ground: 'flat' });
  ok('trả về CÙNG tham chiếu (không tính lại)', a === b);
  const c = presentProjectionMemo(doc, { ground: 'islands' });
  ok('đổi options ⇒ tính lại', c !== a);
}

console.log('\n[12] 🔴 HAI LỖI BẮT ĐƯỢC LÚC VERIFY TRÊN APP THẬT — canh để không tái phát');
{
  /* Lỗi A — gom cụm quá rộng: căn hộ nhỏ thì mọi món cách nhau <2,2m ⇒ gộp thành MỘT cụm ⇒
     một tấm thảm phủ kín cả căn. Dựng đúng ca đó: 2 nhóm đồ cách nhau 1,4m (lọt lối đi). */
  // Ghế xoay 440×440 (`furniture.ts:592`) — dùng món NHỎ để khoảng hở giữa hai nhóm là hở THẬT.
  // (Bản test đầu tiên tôi dùng sofa3 rộng 2,1m đặt cách 1,8m ⇒ hai bao CHỒNG nhau; test đỏ là
  // đúng, lỗi ở dữ liệu test chứ không ở hàm gom cụm — ghi lại để người sau khỏi sửa nhầm hàm.)
  const twoGroups: Entity[] = [
    { id: 'g1a', type: 'block', layer: 'L2', block: 'officeChair', at: { x: 0, y: 0 }, rot: 0, sx: 1, sy: 1 },
    { id: 'g1b', type: 'block', layer: 'L2', block: 'officeChair', at: { x: 400, y: 0 }, rot: 0, sx: 1, sy: 1 },
    { id: 'g1c', type: 'block', layer: 'L2', block: 'officeChair', at: { x: 200, y: 400 }, rot: 0, sx: 1, sy: 1 },
    // nhóm 2 cách nhóm 1 ~1,56m hở THẬT — đủ cho một người đi lọt ⇒ phải tách thành 2 cụm
    { id: 'g2a', type: 'block', layer: 'L2', block: 'officeChair', at: { x: 2400, y: 0 }, rot: 0, sx: 1, sy: 1 },
    { id: 'g2b', type: 'block', layer: 'L2', block: 'officeChair', at: { x: 2800, y: 0 }, rot: 0, sx: 1, sy: 1 },
    { id: 'g2c', type: 'block', layer: 'L2', block: 'officeChair', at: { x: 2600, y: 400 }, rot: 0, sx: 1, sy: 1 },
  ];
  const d = { ...mkDoc(), entities: [mkDoc().entities[0], mkDoc().entities[1], ...twoGroups] } as Doc;
  const cs = furnitureClusters(d);
  ok('hai nhóm cách nhau một lối đi ⇒ HAI cụm, không gộp làm một',
    cs.length === 2, `ra ${cs.length} cụm: ${JSON.stringify(cs.map((c) => c.count))}`);

  const decor = derivePresentDecor(d, { ground: 'none', showPlants: false, showPeople: false });
  const rugs = decor.under.filter((e) => e.id.includes('rug'));
  ok('⇒ hai tấm thảm riêng, không một tấm phủ hết', rugs.length === 2, `${rugs.length} thảm`);

  /* Lỗi B — cây/người rơi RA NGOÀI nhà vì đặt ở góc cụm + đệm. Kẹp vào khung kết cấu. */
  const bb = structureBox(d)!;
  const withDecor = derivePresentDecor(d, { ground: 'none' });
  const outside: string[] = [];
  for (const e of withDecor.over) {
    if (e.type === 'circle') {
      if (e.c.x < bb.minX || e.c.x > bb.maxX || e.c.y < bb.minY || e.c.y > bb.maxY) outside.push(e.id);
    } else if (e.type === 'polyline') {
      const cx = e.points.reduce((s, p) => s + p.x, 0) / e.points.length;
      const cy = e.points.reduce((s, p) => s + p.y, 0) / e.points.length;
      if (cx < bb.minX || cx > bb.maxX || cy < bb.minY || cy > bb.maxY) outside.push(e.id);
    }
  }
  ok('không cây/người nào nằm ngoài khung kết cấu', outside.length === 0, `lọt ra ngoài: ${outside.join(', ')}`);
}

console.log('\n[13] 🔴 LỖI THỨ BA bắt được trên app thật — layer tiếng Việt CÓ DẤU');
{
  // Bản vẽ demo của app đặt layer "Tường" · "Trục" · "Ghi chú". Regex không dấu trượt hết
  // ⇒ 22 đường trục bị xếp thành ĐỒ ĐẠC ⇒ cụm kéo giãn ra cả bản vẽ.
  const viDoc = {
    id: 'd', name: 'vi', unit: 'mm',
    layers: [
      { id: 'LT', name: 'Tường', color: '#000', visible: true, locked: false },
      { id: 'LX', name: 'Trục', color: '#000', visible: true, locked: false },
      { id: 'LG', name: 'Ghi chú', color: '#000', visible: true, locked: false },
      { id: 'LS', name: 'Sàn', color: '#000', visible: true, locked: false },
    ],
    entities: [
      { id: 'a', type: 'line', layer: 'LT', a: { x: 0, y: 0 }, b: { x: 1, y: 0 } },
      { id: 'b', type: 'line', layer: 'LX', a: { x: 0, y: 0 }, b: { x: 90000, y: 0 } },
      { id: 'c', type: 'line', layer: 'LG', a: { x: 0, y: 0 }, b: { x: 1, y: 0 } },
      { id: 'd', type: 'line', layer: 'LS', a: { x: 0, y: 0 }, b: { x: 1, y: 0 } },
    ] as Entity[],
  } as unknown as Doc;

  ok('"Tường" ⇒ structure', classifyPresentRole(viDoc, viDoc.entities[0]).role === 'structure');
  ok('"Trục" ⇒ annotation (KHÔNG phải đồ đạc)', classifyPresentRole(viDoc, viDoc.entities[1]).role === 'annotation',
    classifyPresentRole(viDoc, viDoc.entities[1]).role);
  ok('"Ghi chú" ⇒ annotation', classifyPresentRole(viDoc, viDoc.entities[2]).role === 'annotation');
  ok('"Sàn" ⇒ floor', classifyPresentRole(viDoc, viDoc.entities[3]).role === 'floor');

  // chốt an toàn thứ hai: dù có đoán nhầm vai, cụm vẫn KHÔNG nuốt đường kẻ vô danh
  const wild = {
    ...viDoc,
    layers: [{ id: 'L?', name: 'khong-ro', color: '#000', visible: true, locked: false }],
    entities: [{ id: 'w', type: 'line', layer: 'L?', a: { x: 0, y: 0 }, b: { x: 90000, y: 0 } }] as Entity[],
  } as unknown as Doc;
  ok('đường kẻ vô danh KHÔNG bao giờ vào cụm', furnitureClusters(wild).length === 0);
}

console.log(`\nplan-present.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
