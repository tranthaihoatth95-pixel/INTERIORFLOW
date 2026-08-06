/**
 * lib/cad/plan-leader.test.ts — test leader line (VIỆC 2, phiên S4).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/plan-leader.test.ts`
 *
 * Canh ĐÚNG các trị số của ISO 128-22 / ảnh `C1` chứ không chỉ canh "chạy không lỗi":
 * góc 30–60° · không mũi tên · landing = 20×nét · chữ cách 2×nét · CẤM CẮT NHAU.
 */

import {
  autoPlaceLeaders, leadersToEntities, letterSpaced, segmentsIntersect,
  leaderKey, leaderSeed, DEFAULT_LEADER_STYLE, type LeaderRequest,
} from './plan-leader';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`); }
};

const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) < tol;

/** Lưới điểm chỉ — ca khó nhất cho luật "cấm cắt nhau". */
const grid = (n: number, step = 1500): LeaderRequest[] => {
  const out: LeaderRequest[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ id: `e${i}`, at: { x: (i % 4) * step, y: Math.floor(i / 4) * step }, label: `MUC ${i}` });
  }
  return out;
};

console.log('\n[1] Hình học cơ bản — sinh bằng hàm, đúng số ISO');
{
  const st = DEFAULT_LEADER_STYLE;
  const { placed } = autoPlaceLeaders([{ at: { x: 0, y: 0 }, label: 'BAN' }]);
  ok('đặt được 1 leader', placed.length === 1);
  const p = placed[0];

  const landing = Math.hypot(p.landingEnd.x - p.knee.x, p.landingEnd.y - p.knee.y);
  const expect = st.landingFactor * st.lineWidthMm * st.scaleN;
  ok(`landing = 20 × bề dày nét (${expect}mm-world)`, near(landing, expect, 1e-6), `${landing}`);

  ok('landing NẰM NGANG (y không đổi)', near(p.knee.y, p.landingEnd.y));

  const ang = Math.abs((Math.atan2(p.knee.y - p.anchor.y, p.knee.x - p.anchor.x) * 180) / Math.PI);
  const inRange = ang >= 30 - 1e-6 && ang <= 60 + 1e-6;
  ok('đoạn nghiêng nằm trong 30–60°', inRange, `${ang.toFixed(2)}°`);
}

console.log('\n[2] Chữ — HOA, giãn cách, cách nét đúng 2× bề dày, đặt CUỐI dây');
{
  const st = DEFAULT_LEADER_STYLE;
  const { placed } = autoPlaceLeaders([{ at: { x: 0, y: 0 }, label: 'ban lam viec' }]);
  const p = placed[0];
  ok('nhãn viết HOA', p.labelDisplay.toUpperCase() === p.labelDisplay);
  ok('nhãn có giãn cách', p.labelDisplay.length > 'ban lam viec'.length);
  ok('GIỮ chuỗi gốc để tìm kiếm/BOQ', p.label === 'ban lam viec');

  const gap = st.textGapFactor * st.lineWidthMm * st.scaleN;
  if (p.dir > 0) {
    ok('chữ cách cuối landing đúng 2× nét', near(p.textAt.x - p.landingEnd.x, gap, 1e-6), `${p.textAt.x - p.landingEnd.x}`);
  } else {
    ok('chữ (hướng trái) lùi khỏi landing, không đè lên dây', p.textAt.x < p.landingEnd.x - gap + 1e-6);
  }
  ok('chữ ngồi TRÊN landing (baseline bottom)', p.textAt.y > p.landingEnd.y);
}

console.log('\n[3] letterSpaced');
{
  ok('chèn thin space', letterSpaced('AB', 1) === 'A B');
  ok('n=0 trả nguyên chuỗi', letterSpaced('AB', 0) === 'AB');
  ok('chuỗi 1 ký tự không đổi', letterSpaced('A', 1) === 'A');
}

console.log('\n[4] segmentsIntersect — nền của luật cấm cắt nhau');
{
  ok('hai đoạn cắt chữ X', segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 }));
  ok('hai đoạn song song không cắt', !segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 }));
  ok('chạm đầu mút TÍNH LÀ cắt', segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 5 }));
  ok('rời nhau hẳn', !segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 5, y: 5 }, { x: 6, y: 6 }));
}

console.log('\n[5] ⛔ CẤM CẮT NHAU — lời hứa lớn nhất của việc 2');
{
  for (const n of [4, 8, 12, 16, 24]) {
    const { placed, unplaced } = autoPlaceLeaders(grid(n));
    let crossing = 0;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i], b = placed[j];
        const legsA: [typeof a.anchor, typeof a.knee][] = [[a.anchor, a.knee], [a.knee, a.landingEnd]];
        const legsB: [typeof b.anchor, typeof b.knee][] = [[b.anchor, b.knee], [b.knee, b.landingEnd]];
        for (const [a1, a2] of legsA) for (const [b1, b2] of legsB) {
          if (segmentsIntersect(a1, a2, b1, b2)) crossing++;
        }
      }
    }
    ok(`${n} nhãn: 0 cặp cắt nhau (đặt ${placed.length}, bỏ ${unplaced.length})`, crossing === 0, `${crossing} cặp cắt`);
  }
}

console.log('\n[6] Không đặt được thì KHÔNG đặt bừa (N5) — và nói rõ lý do');
{
  // 40 điểm chen chúc trên một đường thẳng rất ngắn ⇒ chắc chắn có cái phải bỏ
  const tight: LeaderRequest[] = Array.from({ length: 40 }, (_, i) => ({
    id: `t${i}`, at: { x: i * 40, y: 0 }, label: `M${i}`,
  }));
  const { placed, unplaced } = autoPlaceLeaders(tight);
  ok('có nhãn bị bỏ (không nhồi bừa)', unplaced.length > 0, `bỏ ${unplaced.length}/${tight.length}`);
  ok('mỗi nhãn bỏ đều KÈM LÝ DO', unplaced.every((u) => u.why.length > 20));
  ok('tổng đặt + bỏ = đầu vào (không mất nhãn nào)', placed.length + unplaced.length === tight.length);
}

console.log('\n[7] Tập góc dùng CHUNG — không leader nào lệch khỏi tập');
{
  const { placed } = autoPlaceLeaders(grid(16));
  const set = new Set(DEFAULT_LEADER_STYLE.anglesDeg);
  ok('mọi góc nằm trong tập khai báo', placed.every((p) => set.has(p.angleDeg)),
    JSON.stringify([...new Set(placed.map((p) => p.angleDeg))]));
}

console.log('\n[8] Ra entity — KHÔNG mũi tên, nét mảnh, ghi đúng bề dày');
{
  const layout = autoPlaceLeaders(grid(6));
  const ents = leadersToEntities(layout);
  ok('mỗi leader = 2 line + 1 text', ents.length === layout.placed.length * 3, `${ents.length}`);
  ok('KHÔNG có entity mũi tên nào', !ents.some((e) => e.type === 'arrow'));
  ok('mọi nét ghi lineweight mảnh nhất', ents.filter((e) => e.type === 'line')
    .every((e) => e.lineweight === DEFAULT_LEADER_STYLE.lineWidthMm));
}

console.log('\n[9] KS3 — `only` ghi ĐÚNG phần đã tick, không có đường ghi cả mẻ');
{
  const layout = autoPlaceLeaders(grid(6));
  const keys = layout.placed.map((p, i) => leaderKey(p, i));
  const two = leadersToEntities(layout, { only: keys.slice(0, 2) });
  ok('tick 2 ⇒ sinh đúng entity của 2', two.length === 6, `${two.length}`);
  const none = leadersToEntities(layout, { only: [] });
  ok('tick 0 ⇒ không sinh gì', none.length === 0);
}

console.log('\n[10] KS2 — seed là dấu vân tay của đầu vào');
{
  const a = grid(6);
  ok('cùng đầu vào ⇒ cùng seed', leaderSeed(a) === leaderSeed(grid(6)));
  ok('đổi tỉ lệ ⇒ đổi seed', leaderSeed(a) !== leaderSeed(a, { scaleN: 50 }));
  ok('đổi nhãn ⇒ đổi seed',
    leaderSeed(a) !== leaderSeed(a.map((r, i) => (i === 0 ? { ...r, label: 'KHAC' } : r))));
  // và bố cục cũng phải tái lập được
  ok('chạy 2 lần ra bố cục y hệt',
    JSON.stringify(autoPlaceLeaders(a).placed) === JSON.stringify(autoPlaceLeaders(grid(6)).placed));
}

console.log('\n[11] TB4 — đổi tỉ lệ in thì landing tự đúng lại');
{
  const r: LeaderRequest[] = [{ at: { x: 0, y: 0 }, label: 'X' }];
  const p50 = autoPlaceLeaders(r, { scaleN: 50 }).placed[0];
  const p100 = autoPlaceLeaders(r, { scaleN: 100 }).placed[0];
  const len = (p: typeof p50) => Math.hypot(p.landingEnd.x - p.knee.x, p.landingEnd.y - p.knee.y);
  ok('1:100 landing gấp đôi 1:50 (cùng 20×nét TRÊN GIẤY)', near(len(p100), len(p50) * 2, 1e-6),
    `${len(p100)} vs ${len(p50)}`);
}

console.log(`\nplan-leader.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
