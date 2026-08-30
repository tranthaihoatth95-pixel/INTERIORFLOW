#!/usr/bin/env node
/**
 * scripts/quality/do-coverage-giay-phep.mjs — ĐO COVERAGE cổng giấy phép, SINH BIÊN NHẬN MÁY.
 *
 * Bàn 07 sở hữu. READ-ONLY tuyệt đối: không sửa artifact, không sửa cổng, chỉ ĐỌC và ĐẾM.
 *
 * VÌ SAO CÓ: packet vòng 1 đưa con số 22,18% mà không kèm cách chạy lại. Số kể lại không phải
 * bằng chứng — người sau không tái tạo được thì nó chỉ là lời khai. Tệp này sinh biên nhận có
 * hash để đối chiếu.
 *
 * ⚠️ MÔ PHỎNG ĐÚNG THỨ TỰ CỦA CỔNG THẬT (`soi-giay-phep-phat-hanh.mjs`):
 *   :137 tên → :141 ĐUÔI → :144 CỠ → đọc ruột
 * Thứ tự này là dữ kiện, không phải tiểu tiết: đuôi lọc TRƯỚC cỡ, nên tệp nhị phân lớn không bao
 * giờ tới được bước đo cỡ. Đảo thứ tự khi mô phỏng là ra kết luận sai về việc lỗ nào đang bắn.
 *
 * Dùng:  node scripts/quality/do-coverage-giay-phep.mjs [--json]
 */
import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';

/* Chép từ cổng thật — CỐ Ý không import: nếu import thì đổi cổng là phép đo tự đổi theo, và ta
   mất khả năng phát hiện "cổng vừa bị nới". Lệch giữa hai bản là tín hiệu cần đọc, không phải lỗi. */
const DUOI_MA = new Set(['.js', '.mjs', '.cjs', '.html', '.json', '.css', '.txt']);
const TRAN_DOC = 64 * 1024 * 1024;
const NHI_PHAN = new Set(['.wasm', '.node', '.dylib', '.so', '.a', '.bin', '.dll', '.exe']);
const KHO_NEN = new Set(['.asar', '.zip', '.gz', '.tgz', '.7z', '.dmg']);

const goc = process.cwd();
const o = { tong: 0, byteTong: 0, tenBat: 0, quet: 0, byteQuet: 0, boDuoi: 0, byteBoDuoi: 0, boCo: 0, byteBoCo: 0, nhiPhan: 0, byteNhiPhan: 0, khoNen: 0, byteKhoNen: 0 };
const lonNhatQuetDuoc = { mb: 0, ten: '' };

const quet = (dir) => {
  let muc;
  try { muc = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of muc) {
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) { quet(p); continue; }
    if (!e.isFile()) continue;
    let s; try { s = statSync(p).size; } catch { continue; }
    o.tong += 1; o.byteTong += s;
    const duoi = extname(e.name).toLowerCase();
    if (NHI_PHAN.has(duoi)) { o.nhiPhan += 1; o.byteNhiPhan += s; }
    if (KHO_NEN.has(duoi)) { o.khoNen += 1; o.byteKhoNen += s; }
    // ── thứ tự Y HỆT cổng thật ──
    if (/libredwg|mlightcad/i.test(e.name)) { o.tenBat += 1; continue; }
    if (!DUOI_MA.has(duoi)) { o.boDuoi += 1; o.byteBoDuoi += s; continue; }   // :141 ĐUÔI trước
    if (s > TRAN_DOC) { o.boCo += 1; o.byteBoCo += s; continue; }             // :144 CỠ sau
    o.quet += 1; o.byteQuet += s;
    if (s / 1048576 > lonNhatQuetDuoc.mb) { lonNhatQuetDuoc.mb = s / 1048576; lonNhatQuetDuoc.ten = e.name; }
  }
};
for (const d of ['dist-installer', 'dist']) quet(join(goc, d));

const mb = (b) => +(b / 1048576).toFixed(1);
const bn = {
  khi: new Date().toISOString(),
  thuMuc: ['dist-installer', 'dist'],
  tep: { tong: o.tong, batTheoTen: o.tenBat, quetRuot: o.quet, boViDuoi: o.boDuoi, boViCo: o.boCo },
  byteMB: { tong: mb(o.byteTong), quetRuot: mb(o.byteQuet), boViDuoi: mb(o.byteBoDuoi), boViCo: mb(o.byteBoCo) },
  coverageBytePhanTram: +((o.byteQuet / (o.byteTong || 1)) * 100).toFixed(2),
  coverageTepPhanTram: +((o.quet / (o.tong || 1)) * 100).toFixed(2),
  nhomRuiRo: { nhiPhan: { tep: o.nhiPhan, mb: mb(o.byteNhiPhan) }, khoNen: { tep: o.khoNen, mb: mb(o.byteKhoNen) } },
  // T3 ngủ: trần chỉ bắn được với tệp VỪA hợp đuôi VỪA >64MB. Biên còn lại nói nó xa hay gần.
  t3Dormant: { tepQuetLonNhatMB: +lonNhatQuetDuoc.mb.toFixed(1), tenTep: lonNhatQuetDuoc.ten, bienToiTranMB: +(64 - lonNhatQuetDuoc.mb).toFixed(1) },
};
bn.hash = createHash('sha256').update(JSON.stringify(bn)).digest('hex').slice(0, 16);

if (process.argv.includes('--json')) { console.log(JSON.stringify(bn, null, 1)); process.exit(0); }
console.log(`BIÊN NHẬN COVERAGE · ${bn.khi} · hash ${bn.hash}`);
console.log(`  tệp tổng        ${bn.tep.tong} · ${bn.byteMB.tong} MB`);
console.log(`  quét ruột       ${bn.tep.quetRuot} · ${bn.byteMB.quetRuot} MB`);
console.log(`  bỏ vì ĐUÔI      ${bn.tep.boViDuoi} · ${bn.byteMB.boViDuoi} MB`);
console.log(`  bỏ vì CỠ >64MB  ${bn.tep.boViCo} · ${bn.byteMB.boViCo} MB   (T3 ngủ)`);
console.log(`  COVERAGE bytes  ${bn.coverageBytePhanTram}%  ·  theo tệp ${bn.coverageTepPhanTram}%`);
console.log(`  nhóm rủi ro     nhị phân ${bn.nhomRuiRo.nhiPhan.tep} tệp/${bn.nhomRuiRo.nhiPhan.mb} MB · kho nén ${bn.nhomRuiRo.khoNen.tep} tệp/${bn.nhomRuiRo.khoNen.mb} MB`);
console.log(`  T3: tệp quét-được lớn nhất ${bn.t3Dormant.tepQuetLonNhatMB} MB (${bn.t3Dormant.tenTep}) — còn ${bn.t3Dormant.bienToiTranMB} MB mới chạm trần`);
