#!/usr/bin/env node
/**
 * soat-toan-dien.mjs — MỘT LỆNH, MỘT MẺ, MỘT PHÁN QUYẾT.
 *
 * Hoà 30/08: *"mình sẽ thiết lập 1 lệnh chạy end-to-end thu 1 mẻ lớn cuối cùng luôn."*
 *
 * ══ NÓ KHÔNG PHẢI `npm test` ══
 * `npm test` trả lời *"mã có hỏng không"*. Lệnh này trả lời *"DỰ ÁN đã sẵn sàng chưa"* — một câu
 * rộng hơn, gồm cả những việc **máy không chấm được** và phải nói thẳng là chưa ai xác nhận.
 * Khuôn mượn từ ngoài: **preflight checklist** của hàng không và **quality gate** của CI —
 * một chuỗi cổng có thứ tự, qua hết mới được cất cánh, và **không có cửa sau**.
 *
 * ══ BỐN PHÁN QUYẾT, KHÔNG CÓ CÁI THỨ NĂM ══
 *   ✅ ĐẠT           máy chạy, exit 0
 *   🔴 HỎNG          máy chạy, exit khác 0
 *   ⚪ CHƯA TỚI      còn phụ thuộc chưa xanh — KHÔNG chạy, và KHÔNG tính là hỏng
 *   🟡 CHƯA XÁC NHẬN việc người phải xác nhận bằng mắt; máy không có quyền tuyên
 *
 * ⛔ CẤM tuyệt đối một trạng thái thứ năm kiểu "gần đạt"/"cơ bản xong". Luật dự án:
 *    *không dữ liệu giả · không PASS giả · không tự tin giả.*
 *
 * ══ VÌ SAO "CHƯA TỚI" LÀ MỘT PHÁN QUYẾT THẬT ══
 * Nó khác HỎNG. Một việc chưa tới lượt mà bị tô đỏ thì bảng đỏ rực ngay từ đầu, và bảng luôn đỏ
 * là bảng người ta học cách ngó lơ (F-02). Trên bản vẽ ở cổng 4173, "chưa tới" hiện **màu xám,
 * không sáng** — đúng điều Hoà mô tả.
 *
 * Dùng:  node scripts/soat-toan-dien.mjs            chạy cả hai trạng thái
 *        node scripts/soat-toan-dien.mjs --soat     chỉ TẦM SOÁT
 *        node scripts/soat-toan-dien.mjs --json     máy đọc (màn 4173 dùng đường này)
 *        node scripts/soat-toan-dien.mjs --chi-cong chỉ kiểm "máy soi nào ngoài cổng"
 */

import { execFileSync, execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHA, NGUOI, VIEC, dem } from './bos-so-viec.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const co = (c) => process.argv.includes(c);
const JSON_RA = co('--json');

/* ══ --chi-cong: máy soi nào đang nằm NGOÀI npm test ══ */
if (co('--chi-cong')) {
  const p = JSON.parse(readFileSync(path.join(REPO, 'package.json'), 'utf8'));
  const may = Object.keys(p.scripts).filter((k) => /^(soi|check):/.test(k));
  const ngoai = may.filter((k) => !(p.scripts.test || '').includes(k));
  if (!JSON_RA) {
    console.log(`  ${may.length} máy soi · ${may.length - ngoai.length} trong cổng · ${ngoai.length} NGOÀI`);
    if (ngoai.length) {
      console.log(`  🔴 ngoài cổng: ${ngoai.join(' · ')}`);
      console.log('     Máy soi ngoài `npm test` chưa từng chặn ai. Nối vào, hoặc bỏ hẳn.');
    }
  } else console.log(JSON.stringify({ may, ngoai }));
  process.exit(ngoai.length ? 1 : 0);
}

/* ══ chạy một đầu việc ══ */
function chayViec(v) {
  if (v.bang.tay) return { trang: 'tay', ghi: v.bang.tay };
  const t0 = Date.now();
  try {
    execFileSync(v.bang.lenh, v.bang.args, { cwd: REPO, encoding: 'utf8', stdio: 'pipe', timeout: 900000 });
    return { trang: 'dat', ms: Date.now() - t0 };
  } catch (e) {
    const ra = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim().split('\n').filter(Boolean);
    return { trang: 'hong', ms: Date.now() - t0, ghi: ra.slice(-3).join(' | ').slice(0, 260) };
  }
}

const loc = co('--soat') ? VIEC.filter((v) => v.pha === 'soat') : co('--dung') ? VIEC.filter((v) => v.pha === 'dung') : VIEC;
const kq = new Map();

if (!JSON_RA) {
  const d = dem();
  console.log(`\n╭─ SOÁT TOÀN DIỆN ─ ${d.viec} đầu việc · ${d.nguoi} làn · ${d.tuDong} máy chấm · ${d.tay} người xác nhận`);
}

for (const pha of ['soat', 'dung']) {
  const trong = loc.filter((v) => v.pha === pha);
  if (!trong.length) continue;
  if (!JSON_RA) console.log(`\n│ ${PHA[pha].ten} — ${PHA[pha].y}`);

  for (const v of trong) {
    const chuaXong = (v.can ?? []).filter((c) => kq.get(c)?.trang !== 'dat');
    let r;
    if (chuaXong.length) r = { trang: 'chuaToi', ghi: `chờ: ${chuaXong.join(' · ')}` };
    else r = chayViec(v);
    kq.set(v.ma, r);

    if (!JSON_RA) {
      const bieu = { dat: '✅', hong: '🔴', chuaToi: '⚪', tay: '🟡' }[r.trang];
      const gio = r.ms ? ` ${(r.ms / 1000).toFixed(1)}s` : '';
      console.log(`│  ${bieu} [${v.lane}] ${v.ten}${gio}`);
      if (r.ghi) console.log(`│       ${r.ghi}`);
    }
  }
}

const gom = (t) => [...kq.values()].filter((r) => r.trang === t).length;
const hong = gom('hong');

if (JSON_RA) {
  console.log(JSON.stringify({
    luc: new Date().toISOString(),
    pha: PHA, nguoi: NGUOI,
    viec: VIEC.map((v) => ({ ...v, bang: v.bang.tay ? { tay: v.bang.tay } : { lenh: `${v.bang.lenh} ${v.bang.args.join(' ')}` }, kq: kq.get(v.ma) ?? null })),
    tong: { dat: gom('dat'), hong, chuaToi: gom('chuaToi'), tay: gom('tay') },
  }));
  process.exit(0);
}

console.log(`\n╰─ ✅ ${gom('dat')} đạt · 🔴 ${hong} hỏng · ⚪ ${gom('chuaToi')} chưa tới · 🟡 ${gom('tay')} chưa xác nhận\n`);

const soatHong = VIEC.filter((v) => v.pha === 'soat' && kq.get(v.ma)?.trang === 'hong');
if (soatHong.length) {
  console.log(`  🔴 TẦM SOÁT CÒN ${soatHong.length} CHỖ HỎNG — chưa được bắt tay dựng & ship.`);
  console.log('     Việc ở trạng thái sau mà chạy khi trạng thái trước còn đỏ là xây trên nền chưa đo.\n');
} else if (gom('tay')) {
  console.log('  🟡 Máy đã chấm hết phần nó chấm được. Phần còn lại CẦN MẮT NGƯỜI — máy không có quyền tuyên.\n');
} else {
  console.log('  ✅ Toàn bộ sổ việc đã xanh.\n');
}
process.exit(hong ? 1 : 0);
