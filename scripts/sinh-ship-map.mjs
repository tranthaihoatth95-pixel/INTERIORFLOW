/**
 * scripts/sinh-ship-map.mjs — CÂY TASK PROCESS MỘT KHUNG NHÌN (Hoà đặt 14/08:
 * "kể từ đây tới ship app, task/quy trình done → tick xanh GIỮ NGUYÊN đúng flow,
 * tổng các task cùng 1 khung nhìn — để đánh giá").
 *
 * Sinh docs/ship-map.html TỪ frontier-registry THẬT (không sổ tay riêng — chống mốc):
 * cột theo ĐỢT, entry là pill: ✓ xanh = xong-MÁY · 👁 = xong-MẮT Hoà · ○ = chờ.
 * Done KHÔNG biến mất — giữ nguyên vị trí trong flow, đúng yêu cầu.
 * Chạy: npm run ship:map (T chạy cuối mỗi đợt, cùng nhịp soi:frontier).
 */
import { FRONTIER } from './frontier-registry.mjs';
import { writeFileSync } from 'fs';

const DOT_TEN = {
  0: 'NỀN CŨ', 1: 'Đ1 · KHÂU DÂY + ĐẦU RA', 2: 'Đ2 · WORKSPACE/TOUCH', 3: 'Đ3 · COLLAB/GÓI',
  4: 'Đ4 · ENGINE CHUNG', 5: 'Đ5 · GIAO DIỆN + DOGFOOD', 6: 'Đ6 · TOOL 3 LỚP/GROUNDED',
  7: 'Đ7 · CHUỖI NỀN P1-P6 + DS', 8: 'Đ8 · UI-KHUNG + DF2 (đang mở)',
};
const VAI_ICON = { mvp: '⭐', day: '🔗', do: '🧰' };
const R1 = [
  ['R1-1', 'Máy sạch trọn vòng đời (build→cài→lưu→nâng cấp→khôi phục)', false],
  ['R1-2', 'Đợt UI theo NT + KB (khung 4 vùng · ⌘K · 2 hàng đợi thao-tac)', false],
  ['R1-3', 'Nợ nghiệm thu mắt = 0 (lô #1: 1/48 đã qua)', false],
  ['R1-4', 'Vòng người dùng thật TTT + error-log', false],
];

const byDot = new Map();
for (const e of FRONTIER) {
  if (!byDot.has(e.dot)) byDot.set(e.dot, []);
  byDot.get(e.dot).push(e);
}
const tong = { mat: 0, xong: 0, cho: 0 };
for (const e of FRONTIER) {
  if (e.trangThai === 'xong-mat') tong.mat++;
  else if (e.trangThai === 'xong') tong.xong++;
  else tong.cho++;
}
const pct = Math.round(((tong.mat + tong.xong) / FRONTIER.length) * 100);

const pill = (e) => {
  const st = e.trangThai;
  const cls = st === 'xong-mat' ? 'mat' : st === 'xong' ? 'ok' : 'cho';
  const tick = st === 'xong-mat' ? '👁✓' : st === 'xong' ? '✓' : '○';
  const ten = e.ten.split('(')[0].split('—')[0].trim().slice(0, 46);
  return `<span class="p ${cls}" title="${e.id} · ${e.he}"><b>${tick}</b> ${VAI_ICON[e.vai] ?? ''} ${ten}</span>`;
};

const cols = [...byDot.keys()].sort((a, b) => a - b).map((d) => {
  const es = byDot.get(d);
  const done = es.filter((e) => e.trangThai !== 'chua').length;
  return `<section><h2>${DOT_TEN[d] ?? 'Đ' + d} <em>${done}/${es.length}</em></h2>${es.map(pill).join('')}</section>`;
}).join('');

const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>IF · SHIP MAP — cây task tới R1</title><style>
:root{--bg:#0c0c0e;--card:#141417;--t1:#ececf1;--t3:#8b8b95;--ok:#3ecf8e;--acc:#6a57f5;--line:#26262b}
*{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--t1);font:13px/1.5 -apple-system,'Segoe UI',system-ui,sans-serif;padding:28px}
h1{font-size:19px;letter-spacing:-.01em}h1 small{color:var(--t3);font-weight:400}
.meta{font-family:ui-monospace,Menlo,monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:.14em;color:var(--t3);margin:4px 0 18px}
.bar{height:6px;background:var(--line);border-radius:999px;margin:10px 0 24px;overflow:hidden}.bar i{display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,var(--acc),var(--ok));border-radius:999px}
.gates{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-bottom:26px}
.gate{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 14px}.gate b{font-family:ui-monospace,Menlo,monospace;font-size:10px;color:var(--t3)}
section{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:12px}
h2{font-size:11px;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.12em;color:var(--t3);margin-bottom:8px}h2 em{float:right;font-style:normal;color:var(--t1)}
.p{display:inline-block;margin:3px 4px 3px 0;padding:4px 10px;border-radius:999px;border:1px solid var(--line);font-size:11.5px;color:var(--t3)}
.p.ok{border-color:rgba(62,207,142,.4);color:var(--t1)}.p.ok b{color:var(--ok)}
.p.mat{border-color:var(--ok);background:rgba(62,207,142,.09);color:var(--t1)}.p.mat b{color:var(--ok)}
.p.cho b{color:var(--t3)}
footer{margin-top:18px;font-size:10.5px;color:var(--t3);font-family:ui-monospace,Menlo,monospace}
</style></head><body>
<h1>IF · SHIP MAP <small>— cây task tới cửa R1, một khung nhìn</small></h1>
<div class="meta">SINH TỪ FRONTIER-REGISTRY · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · 👁 ${tong.mat} QUA MẮT · ✓ ${tong.xong} XONG-MÁY · ○ ${tong.cho} CHỜ · ${pct}%</div>
<div class="bar"><i></i></div>
<div class="gates">${R1.map(([id, ten, ok]) => `<div class="gate"><b>${id} ${ok ? '✓' : '○'}</b><div>${ten}</div></div>`).join('')}</div>
${cols}
<footer>✓ xanh = xong-MÁY · 👁 nền xanh = đã qua mắt Hoà · ○ = chờ · done GIỮ NGUYÊN vị trí trong flow. Nguồn duy nhất: scripts/frontier-registry.mjs — sửa sổ là map đổi, không sổ tay thứ hai.</footer>
</body></html>`;
writeFileSync('docs/ship-map.html', html);
console.log(`ship-map.html sinh xong: ${FRONTIER.length} task · 👁${tong.mat} ✓${tong.xong} ○${tong.cho} · ${pct}%`);
