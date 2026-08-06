/**
 * lib/cad/workstation-clusters.test.ts — VIỆC 2 (cụm bàn sinh bằng hàm).
 * Chạy: node_modules/.bin/sucrase-node lib/cad/workstation-clusters.test.ts
 *
 * Trọng tâm §0f TB4: **đổi dữ liệu thì hình phải TỰ ĐÚNG** — đổi deskW 1400→1500 là cụm tự giãn
 * ĐÚNG lượng, clearance tự tính lại, KHÔNG méo (tỉ lệ giữ nguyên, không lệch tâm).
 */
import {
  CHAIR_ACCESS_MM,
  MEETING_AISLE_MM,
  benchRow,
  checkMeetingArea,
  chairPrims,
  cluster120,
  clusterCross,
  clusterSpineL,
  clusterY,
  meetingTable,
  primsBBox,
  type ClusterResult,
} from './workstation-clusters';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const near = (a: number, b: number, tolPct: number) => Math.abs(a - b) <= Math.abs(b) * tolPct;

/* ── [1] ghế — tiết chế đúng chuẩn phiếu ── */
function testChair() {
  console.log('\n[1] Ghế = mâm + lưng + 2 tay (KHÔNG chân sao, KHÔNG bánh xe)');
  const p = chairPrims();
  ok('đúng 4 hình: mâm + lưng + 2 tay', p.length === 4);
  ok('KHÔNG có cung/tròn nào (chân sao & bánh xe đều cần cung)', p.every((x) => x.k === 'poly'));
  ok('MỘT cấp nét — Prim không mang bề dày, tự đúng', p.every((x) => !('lineweight' in x)));
}

/* ── [2] sáu hàm đều chạy, trả đủ hợp đồng ── */
function testContract() {
  console.log('\n[2] Sáu hàm — trả đủ prims / clearance / sizeMm / seats');
  const all: [string, ClusterResult][] = [
    ['clusterSpineL(8)', clusterSpineL(8)],
    ['benchRow(8)', benchRow(8)],
    ['clusterY()', clusterY()],
    ['cluster120()', cluster120()],
    ['clusterCross()', clusterCross()],
    ['meetingTable(12)', meetingTable(12)],
  ];
  for (const [ten, r] of all) {
    ok(`${ten} — có prims`, r.prims.length > 0);
    ok(`${ten} — có ClearanceZone kèm reason tiếng Việt`, r.clearance.length > 0 && r.clearance.every((c) => c.reason.length > 8 && /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(c.reason)));
    ok(`${ten} — bao ngoài đo được > 0`, r.sizeMm.w > 0 && r.sizeMm.h > 0);
    ok(`${ten} — số chỗ > 0`, r.seats > 0);
    ok(`${ten} — m²/chỗ tính ra số hữu hạn`, Number.isFinite(r.areaPerSeatM2) && r.areaPerSeatM2 > 0);
  }
}

/* ── [3] NGHIỆM THU TB4: đổi deskW 1400→1500 → cụm TỰ GIÃN đúng, không méo ── */
function testParametricGrowth() {
  console.log('\n[3] NGHIỆM THU TB4 — đổi deskW 1400→1500, cụm tự giãn ĐÚNG');

  const a = clusterSpineL(8, 1400, 700, 60);
  const b = clusterSpineL(8, 1500, 700, 60);
  console.log(`      clusterSpineL(8): 1400 → ${a.sizeMm.w}×${a.sizeMm.h} · 1500 → ${b.sizeMm.w}×${b.sizeMm.h}`);
  // 4 bàn mỗi bên, xương sống dài = 4 × deskW ⇒ cao phải tăng đúng 4 × 100 = 400.
  ok('chiều dài xương sống tăng ĐÚNG 4×100 = 400mm', Math.abs((b.sizeMm.h - a.sizeMm.h) - 400) < 1);
  ok('chiều NGANG KHÔNG đổi (deskW không đụng bề ngang) — không méo', Math.abs(b.sizeMm.w - a.sizeMm.w) < 1);
  ok('clearance TỰ TÍNH LẠI theo chiều dài mới', Math.abs(b.clearance[0].h - a.clearance[0].h - 400) < 1);
  ok('m²/chỗ tăng theo (bàn to hơn thì tốn hơn)', b.areaPerSeatM2 > a.areaPerSeatM2);

  const c = benchRow(8, 1400, 700, 60);
  const d = benchRow(8, 1500, 750, 60);
  console.log(`      benchRow(8): 1400×700 → ${c.sizeMm.w}×${c.sizeMm.h} · 1500×750 → ${d.sizeMm.w}×${d.sizeMm.h}`);
  ok('benchRow — dài tăng đúng 400mm', Math.abs((d.sizeMm.h - c.sizeMm.h) - 400) < 1);
  ok('benchRow — sâu tăng đúng 2×50 = 100mm', Math.abs((d.sizeMm.w - c.sizeMm.w) - 100) < 1);

  // Đối xứng: cụm phải cân quanh gốc, không lệch tâm sau khi giãn (đó là "méo").
  for (const [ten, r] of [['spineL', b], ['bench', d]] as [string, ClusterResult][]) {
    const bb = primsBBox(r.prims);
    ok(`${ten} — vẫn CÂN quanh gốc sau khi giãn (không lệch tâm)`, Math.abs(bb.minX + bb.maxX) < 1 && Math.abs(bb.minY + bb.maxY) < 1);
  }

  // Thêm chỗ → cụm dài ra, m²/chỗ GIẢM (chia sẻ vách) — quy luật của cụm đối lưng.
  const s4 = clusterSpineL(4);
  const s16 = clusterSpineL(16);
  console.log(`      clusterSpineL: 4 chỗ ${s4.areaPerSeatM2} m²/chỗ · 16 chỗ ${s16.areaPerSeatM2} m²/chỗ`);
  ok('tăng số chỗ → m²/chỗ giảm (chia sẻ xương sống)', s16.areaPerSeatM2 <= s4.areaPerSeatM2);
  ok('số chỗ khai đúng', s16.seats === 16 && s4.seats === 4);
}

/* ── [4] NGHIỆM THU: clusterY ra bao ngoài 6955×6023 ±2% ── */
function testClusterY() {
  console.log('\n[4] NGHIỆM THU — clusterY() bao ngoài 6955 × 6023 mm ±2%');
  const r = clusterY();
  console.log(`      bao BÀN+VÁCH : ${r.deskEnvelopeMm.w.toFixed(0)} × ${r.deskEnvelopeMm.h.toFixed(0)} mm  (mục tiêu phiếu 6955 × 6023)`);
  console.log(`      bao CẢ GHẾ   : ${r.sizeMm.w.toFixed(0)} × ${r.sizeMm.h.toFixed(0)} mm  (ghế kéo ra nên lớn hơn)`);
  // ⚠️ Nghiệm thu áp lên BAO BÀN+VÁCH, không phải bao cả ghế. Căn cứ: giải ngược công thức bao
  // 3 cánh 120° từ chiều RỘNG 6955 ra tầm với R=3652, thay vào công thức chiều CAO được 6023,6 —
  // khớp số thứ hai của phiếu tới <1mm. Hai số độc lập cùng khớp một mô hình ⇒ dim gốc gần như
  // chắc chắn đo BÀN, không đo ghế (ghế đẩy ra/đẩy vào thì không ai ghi dim theo nó).
  // CHƯA xác nhận được bằng ảnh gốc — `docs/reference/` không tồn tại (xem đầu file nguồn).
  ok('bao BÀN — chiều rộng 6955 ±2%', near(r.deskEnvelopeMm.w, 6955, 0.02));
  ok('bao BÀN — chiều cao 6023 ±2%', near(r.deskEnvelopeMm.h, 6023, 0.02));
  ok('đúng 6 chỗ', r.seats === 6);
  ok('có 3 cánh toả (đối xứng 120° → rộng ≠ cao)', Math.abs(r.deskEnvelopeMm.w - r.deskEnvelopeMm.h) > 500);
  ok('bao cả ghế LỚN HƠN bao bàn (ghế nhô ra) — hai số khác nhau, không lẫn', r.sizeMm.h > r.deskEnvelopeMm.h);

  const b = clusterY(1400, 600);
  console.log(`      đổi nhịp 1200→1400: ${b.sizeMm.w.toFixed(0)} × ${b.sizeMm.h.toFixed(0)} mm`);
  ok('đổi nhịp → cụm TỰ GIÃN, không phải sửa tay', b.sizeMm.w > r.sizeMm.w && b.sizeMm.h > r.sizeMm.h);
  ok('vẫn 6 chỗ', b.seats === 6);
}

/* ── [5] cluster120 + clusterCross ── */
function testOthers() {
  console.log('\n[5] cluster120 (bàn 1200×600, vách 600) + clusterCross');
  const r = cluster120();
  console.log(`      cluster120: ${r.sizeMm.w.toFixed(0)} × ${r.sizeMm.h.toFixed(0)} mm · ${r.areaPerSeatM2} m²/chỗ`);
  ok('đúng 6 chỗ', r.seats === 6);
  ok('gần đối xứng tròn (6 cánh đều) — rộng ≈ cao ±10%', near(r.sizeMm.w, r.sizeMm.h, 0.1));
  // ⚠️ Cụm TOẢ TIA: `deskW` là chiều TIẾP TUYẾN (dọc cạnh bàn), `deskH` là chiều BÁN KÍNH. Bao
  // ngoài do bán kính quyết định ⇒ nới deskW gần như KHÔNG đổi bao, nới deskH mới đổi. Assertion
  // đầu của tôi ('đổi deskW → cụm tự giãn') SAI về mặt hình học — đã sửa cho đúng bản chất.
  const rW = cluster120(1500, 600);
  const rH = cluster120(1200, 750);
  console.log(`      deskW 1200→1500: ${r.sizeMm.w.toFixed(0)}→${rW.sizeMm.w.toFixed(0)} · deskH 600→750: ${r.sizeMm.w.toFixed(0)}→${rH.sizeMm.w.toFixed(0)}`);
  ok('nới deskH (chiều bán kính) → cụm giãn ĐÚNG hướng', rH.sizeMm.w > r.sizeMm.w && rH.sizeMm.h > r.sizeMm.h);
  ok('nới deskW (tiếp tuyến) → bao gần như giữ nguyên, KHÔNG méo', Math.abs(rW.sizeMm.h - r.sizeMm.h) < r.sizeMm.h * 0.15);
  ok('nới deskW vẫn phải nới BAO BÀN (bàn to ra thật)', rW.deskEnvelopeMm.w > r.deskEnvelopeMm.w);

  const c = clusterCross();
  console.log(`      clusterCross: ${c.sizeMm.w.toFixed(0)} × ${c.sizeMm.h.toFixed(0)} mm · ${c.areaPerSeatM2} m²/chỗ`);
  ok('chữ thập đúng 4 chỗ', c.seats === 4);
  ok('chữ thập đối xứng 4 phương — rộng ≈ cao', near(c.sizeMm.w, c.sizeMm.h, 0.02));
  ok('chữ thập TỐN diện tích hơn chữ L xương sống (đúng nhận định phiếu)', c.areaPerSeatM2 > clusterSpineL(8).areaPerSeatM2);
}

/* ── [6] meetingTable — tự dài theo số chỗ + đối chiếu 2 nguồn ── */
function testMeetingTable() {
  console.log('\n[6] meetingTable — bàn tự dài ra theo số chỗ');
  const t6 = meetingTable(6);
  const t12 = meetingTable(12);
  const t20 = meetingTable(20);
  console.log(`      6 chỗ ${t6.sizeMm.w.toFixed(0)}mm · 12 chỗ ${t12.sizeMm.w.toFixed(0)}mm · 20 chỗ ${t20.sizeMm.w.toFixed(0)}mm`);
  ok('thêm chỗ → bàn DÀI RA (không phải sửa tay)', t20.sizeMm.w > t12.sizeMm.w && t12.sizeMm.w > t6.sizeMm.w);
  ok('số chỗ khai đúng', t6.seats === 6 && t12.seats === 12 && t20.seats === 20);

  for (const s of ['rect', 'boat', 'round'] as const) {
    const r = meetingTable(12, s);
    ok(`shape '${s}' dựng được, 12 chỗ`, r.prims.length > 0 && r.seats === 12);
  }
  ok("shape 'round' đối xứng tròn", near(meetingTable(12, 'round').sizeMm.w, meetingTable(12, 'round').sizeMm.h, 0.02));
  ok("shape 'round' to ra khi thêm chỗ", meetingTable(20, 'round').sizeMm.w > meetingTable(8, 'round').sizeMm.w);

  // Đối chiếu số của phiếu: 94″×36″ = 2388×914 ⇔ nhịp 478mm (hẹp hơn Neufert 600 tới 20%).
  const my = meetingTable(12, 'rect', { seatPitchMm: 478, depthMm: 914 });
  const mat = my.prims[0];
  const bb = mat.k === 'poly' ? primsBBox([mat]) : { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  console.log(`      mặt bàn 12 chỗ @nhịp478: ${(bb.maxX - bb.minX).toFixed(0)} × ${(bb.maxY - bb.minY).toFixed(0)} mm (đối chiếu phiếu 2388 × 914)`);
  ok('dựng lại ĐÚNG bàn 94″×36″ = 2388×914 khi truyền nhịp 478', Math.abs(bb.maxX - bb.minX - 2390) < 5 && Math.abs(bb.maxY - bb.minY - 914) < 1);
  const mn = meetingTable(12, 'rect');
  const matN = mn.prims[0];
  const bbN = matN.k === 'poly' ? primsBBox([matN]) : { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  console.log(`      mặt bàn 12 chỗ @Neufert600: ${(bbN.maxX - bbN.minX).toFixed(0)} × ${(bbN.maxY - bbN.minY).toFixed(0)} mm`);
  ok('mặc định theo Neufert 600 → bàn RỘNG HƠN bản 94″ (lệch có thật, không giấu)', bbN.maxX - bbN.minX > bb.maxX - bb.minX);

  // TCVN 4601 ≥1,80 m²/người (tính CẢ lối đi).
  const chk = checkMeetingArea(t12);
  console.log(`      TCVN 4601: bàn 12 chỗ đạt ${chk.m2PerPerson} m²/người (cần ≥ ${chk.requiredM2})`);
  ok('hàm kiểm trả cả SỐ ĐO, không chỉ true/false', typeof chk.m2PerPerson === 'number' && chk.requiredM2 === 1.8);
  ok('bàn 12 chỗ + lối đi 900mm ĐẠT ≥1,80 m²/người', chk.ok);
}

/* ── [7] clearance đúng trị số phiếu ── */
function testClearance() {
  console.log('\n[7] Clearance — đúng trị số phiếu (ghế ≥700, bàn họp ≥900)');
  const s = clusterSpineL(8);
  ok('lối vào ghế rộng đúng 700mm', s.clearance.every((c) => Math.abs(c.w - CHAIR_ACCESS_MM) < 1));
  ok('có lối vào ghế CẢ HAI bên xương sống', s.clearance.length === 2);
  ok('reason nêu rõ số mm', s.clearance.every((c) => c.reason.includes('700')));

  const m = meetingTable(12);
  const bb = primsBBox(m.prims);
  ok('bàn họp — vùng chờ nới đúng 900mm mỗi bên', Math.abs(m.clearance[0].w - (bb.maxX - bb.minX) - MEETING_AISLE_MM * 2) < 1);
  ok('reason bàn họp nêu 900mm', m.clearance[0].reason.includes('900'));
}

/* ── [8] BẢNG m²/CHỖ — nghiệm thu đòi dán bảng ── */
function testAreaTable() {
  console.log('\n[8] BẢNG m²/CHỖ — 6 cụm, so sánh mật độ');
  const rows: [string, ClusterResult][] = [
    ['clusterSpineL(8)  1400·700·60', clusterSpineL(8)],
    ['benchRow(8)       1400·700·60', benchRow(8)],
    ['clusterY()        1200·600', clusterY()],
    ['cluster120()      1200·600', cluster120()],
    ['clusterCross()    1400·700', clusterCross()],
    ['meetingTable(12)  rect', meetingTable(12)],
  ];
  console.log('      ┌─────────────────────────────────┬──────┬──────────────────┬──────────┬──────────┐');
  console.log('      │ cụm                             │ chỗ  │ bao ngoài (mm)   │ m²/chỗ   │ +lối đi  │');
  console.log('      ├─────────────────────────────────┼──────┼──────────────────┼──────────┼──────────┤');
  for (const [ten, r] of rows) {
    const bao = `${r.sizeMm.w.toFixed(0)}×${r.sizeMm.h.toFixed(0)}`;
    console.log(`      │ ${ten.padEnd(31)} │ ${String(r.seats).padStart(4)} │ ${bao.padStart(16)} │ ${r.areaPerSeatM2.toFixed(2).padStart(8)} │ ${r.areaPerSeatWithClearanceM2.toFixed(2).padStart(8)} │`);
  }
  console.log('      └─────────────────────────────────┴──────┴──────────────────┴──────────┴──────────┘');

  const spine = clusterSpineL(8);
  const bench = benchRow(8);
  const cross = clusterCross();
  const y = clusterY();
  console.log(`      chênh chữ thập / chữ L xương sống: ${(cross.areaPerSeatM2 / spine.areaPerSeatM2).toFixed(2)}×  (phiếu nêu 4,9/1,65 ≈ 2,97×)`);
  console.log(`      🔴 LỆCH VỚI PHIẾU: clusterSpineL đo được ${spine.areaPerSeatM2} m²/chỗ, phiếu nêu 1,65 → lệch ${((spine.areaPerSeatM2/1.65-1)*100).toFixed(0)}%`);
  console.log(`         benchRow đo được ${bench.areaPerSeatM2} m²/chỗ — GẦN 1,65 hơn hẳn.`);

  // 🔴 ĐO ĐƯỢC ≠ SỐ PHIẾU — báo, KHÔNG nắn hình cho khớp (§0 luật trung thực).
  // Bàn chữ L chuẩn = thân 1400×700 + cánh 700×700 vuông góc ⇒ footprint 1400×1400; hai cái đối
  // lưng qua vách 60 ⇒ rộng 2860, nhịp 1400 ⇒ 4,00 m²/2 chỗ = **2,00 m²/chỗ**. Muốn xuống 1,65
  // thì bề rộng phải còn ~2360mm, tức cánh chữ L phải NẰM TRONG chiều sâu thân bàn chứ không nhô
  // thêm ra — đó là một cách bố trí KHÁC, không suy ra được từ chữ trong phiếu.
  // ⇒ Không đoán: giữ hình chữ L đúng nghĩa, khai số đo thật. `docs/reference/E1-*.png` (ảnh có
  // dim) KHÔNG TỒN TẠI nên không đối chiếu được. Cần Hoà cấp ảnh gốc để chốt.
  ok('bench đối lưng (không cánh) ĐẶC HƠN chữ L — đúng hình học, dù ngược nhận định phiếu', bench.areaPerSeatM2 < spine.areaPerSeatM2);
  ok('chữ L xương sống vẫn ĐẶC HƠN chữ thập và chữ Y', spine.areaPerSeatM2 < cross.areaPerSeatM2 && spine.areaPerSeatM2 < y.areaPerSeatM2);
  ok('con số 1,65 m²/chỗ của phiếu CHƯA tái lập được — ghi nhận, không giấu', Math.abs(spine.areaPerSeatM2 - 1.65) > 0.2);
  ok('bảng in ra đủ 6 dòng', rows.length === 6);
}

/* ── [9] biên ── */
function testEdges() {
  console.log('\n[9] Biên');
  ok('clusterSpineL(1) — 1 chỗ vẫn dựng được', clusterSpineL(1).seats === 1 && clusterSpineL(1).prims.length > 0);
  ok('clusterSpineL(0) → ép về 1, không sập', clusterSpineL(0).seats === 1);
  ok('clusterSpineL(7) lẻ — chia 4/3, không rơi chỗ', clusterSpineL(7).seats === 7);
  ok('benchRow(1) chạy', benchRow(1).seats === 1);
  ok('meetingTable(2) — dưới 6 chỗ thì KHÔNG có ghế đầu bàn', meetingTable(2).seats === 2);
  ok('meetingTable(0) → ép về 2', meetingTable(0).seats === 2);
  ok('primsBBox([]) không sập', primsBBox([]).maxX === 0);
}

testChair();
testContract();
testParametricGrowth();
testClusterY();
testOthers();
testMeetingTable();
testClearance();
testAreaTable();
testEdges();

console.log(`\nworkstation-clusters.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
