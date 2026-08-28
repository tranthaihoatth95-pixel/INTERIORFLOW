#!/usr/bin/env node
/**
 * chan-doan-sqlite.mjs — TÁI HIỆN (hoặc bác bỏ) cú kẹt `L2-01`.
 *
 * ── ĐIỀU CẦN GIẢI ─────────────────────────────────────────────────────────────────────────────
 * 27/08, sau ~6 phút dùng bình thường, dev server **kẹt cứng**: tệp tĩnh vẫn 200, mọi route app
 * và API treo vô hạn — không lỗi, không timeout, không mã trạng thái. `sample` cho thấy **9 luồng
 * `tokio-runtime-worker`** của query engine đứng chết **cùng một stack**.
 *
 * ── ĐIỀU TÔI ĐÃ SAI, VÀ VÌ SAO SCRIPT NÀY TỒN TẠI ─────────────────────────────────────────────
 * Tôi từng viết `busy_timeout=0` ⇒ "chờ mãi mãi". **Ngược lại** — đo thật: `busy_timeout=0` báo
 * `database is locked` sau **0.00s**. Tôi dựng một câu chuyện nhân quả nghe hợp lý rồi không
 * kiểm nó (F-20). Bài học: **không được gọi WAL/connection_limit là thuốc chữa khi chưa tái hiện
 * được bệnh.** Script này đi tìm bệnh, không đi tìm sự đồng thuận với giả thuyết của tôi.
 *
 * ── THIẾT KẾ ──────────────────────────────────────────────────────────────────────────────────
 * · Mỗi ARM chạy trong **tiến trình con riêng**. Bắt buộc: một query engine đã kẹt thì không có
 *   cách nào dọn trong cùng tiến trình — arm sau sẽ đo trên một engine đã hỏng.
 * · Mỗi ARM dùng **bản sao DB riêng**, qua `moDbTam` ⇒ cổng tiền kiểm chặn TRƯỚC Prisma.
 *   Không arm nào thấy WAL/journal do arm trước để lại.
 * · Tải **CỐ ĐỊNH** giữa các arm: cùng số worker, cùng chuỗi thao tác, cùng tỉ lệ đọc/ghi. Khác
 *   nhau **chỉ ở chuỗi kết nối**. Đổi hai thứ một lúc thì kết quả không quy được cho cái nào.
 * · Ghi là thật: `User.lastSeenAt` — `lib/server/auth.ts` cập nhật nó ở **gần như mọi request**,
 *   nên đây là nguồn ghi liên tục có thật của IF, không phải tải bịa.
 * · **Máy dò kẹt**: mỗi worker đóng dấu thời gian sau mỗi thao tác. Không worker nào nhúc nhích
 *   quá `--tran-ket` giây ⇒ tuyên KẸT, ghi lại mốc phút thứ mấy, chụp `sample`, rồi dừng arm.
 *
 * ── ĐỌC KẾT QUẢ ───────────────────────────────────────────────────────────────────────────────
 * KẸT ở arm `tran` mà không kẹt ở arm `moi`  ⇒ tái hiện được, và bản vá có cơ sở.
 * KHÔNG kẹt ở arm nào                        ⇒ **chưa tái hiện được** — vẫn là `PARTIAL`, cấm
 *                                              nâng lên PASS, và phải nói ra tải này khác tải
 *                                              thật ở đâu.
 * KẸT ở CẢ HAI                               ⇒ bản vá không đủ; đừng ship rồi tưởng đã xong.
 *
 * Dùng:  node scripts/proof/chan-doan-sqlite.mjs [--giay 300] [--worker 8] [--tran-ket 30]
 */

import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEP = fileURLToPath(import.meta.url);

const doc = (ten, mac) => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : mac;
};

const GIAY = doc('giay', 300);
const WORKER = doc('worker', 8);
const TRAN_KET = doc('tran-ket', 30);

/**
 * Ba arm — mỗi bước đổi ĐÚNG MỘT thứ, để quy được kết quả cho một nguyên nhân.
 *
 * ⚠️ `journal` phải ÉP, không được để mặc định. Lượt chạy đầu (28/08) cho `journal=wal` ở **cả
 * ba arm**, kể cả arm mang nhãn "như trước 27/08": DB thật **đã** được bật WAL hôm 27/08 (còn
 * `prisma/dev.db.bak-2026-08-27-truoc-wal`), nên bản sao thừa hưởng WAL. Một arm mang nhãn
 * "trước" mà không mang điều kiện của "trước" thì mọi kết luận rút từ nó đều rỗng — đúng luật
 * F-15: ca chỉ đúng khi bộ máy đã nạp **đúng đối tượng**.
 */
const ARMS = [
  { id: 'truoc', ten: 'ĐÚNG điều kiện 27/08 — journal=DELETE, không tham số', journal: 'DELETE', tham: '' },
  { id: 'wal', ten: 'chỉ đổi journal → WAL, vẫn không tham số', journal: 'WAL', tham: '' },
  { id: 'moi', ten: 'WAL + connection_limit=1 + socket_timeout=10 (HEAD hôm nay)', journal: 'WAL', tham: 'connection_limit=1&socket_timeout=10' },
];

/* ══════════════════════════════════════════════════════════════════════════════════════════════
   CHẾ ĐỘ CON — chạy một arm
   ══════════════════════════════════════════════════════════════════════════════════════════════ */
if (process.env.IF_ARM) {
  const arm = ARMS.find((a) => a.id === process.env.IF_ARM);
  const { moDbTam } = await import('./_db-tam.mjs');
  const db = await moDbTam(`sqlite-${arm.id}`);
  // `moDbTam` đã mở một client trỏ bản sao; arm cần client riêng với THAM SỐ của arm.
  await db.prisma.$disconnect();

  // ÉP journal_mode của arm. Thất bại ⇒ CỔNG HARNESS ĐỎ, thoát ngay: chạy tiếp trên một tệp
  // không ở đúng chế độ là sản xuất ra một con số trông giống bằng chứng.
  let journalThat;
  try {
    execFileSync('sqlite3', [db.duongDan, `PRAGMA journal_mode=${arm.journal};`], { stdio: 'pipe' });
    journalThat = execFileSync('sqlite3', [db.duongDan, 'PRAGMA journal_mode;'], { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error(JSON.stringify({ loi: `CỔNG HARNESS ĐỎ — không đặt được journal_mode: ${e.message}` }));
    process.exit(2);
  }
  if (journalThat.toLowerCase() !== arm.journal.toLowerCase()) {
    console.error(JSON.stringify({ loi: `CỔNG HARNESS ĐỎ — xin ${arm.journal}, tệp đang ở ${journalThat}` }));
    process.exit(2);
  }

  const url = `file:${db.duongDan}${arm.tham ? `?${arm.tham}` : ''}`;
  process.env.DATABASE_URL = url;
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  // PRAGMA thật của tệp, đo chứ không đoán.
  // `journal_mode` và `synchronous` là thuộc tính BỀN của tệp — đọc lại được.
  // `busy_timeout` thì KHÔNG: nó thuộc về từng KẾT NỐI, nên đọc từ một shell sqlite3 mới luôn
  // trả 0 dù Prisma đang đặt gì. Lượt đầu tôi in nó ra như một dữ kiện — đó là một cột vô nghĩa
  // đội lốt số đo. Bỏ hẳn còn hơn để người đọc suy từ nó.
  const pragma = { journal_mode: journalThat };
  try {
    pragma.synchronous = execFileSync('sqlite3', [db.duongDan, 'PRAGMA synchronous;'], { encoding: 'utf8' }).trim();
  } catch { /* sqlite3 không có thì bỏ qua */ }

  // Chủ thể của tải: user thật đầu tiên trong bản sao. KHÔNG có user ⇒ cổng harness đỏ:
  // một vòng lặp ghi vào 0 hàng thì mọi con số bên dưới đều vô nghĩa (F-15).
  const chuThe = await prisma.user.findFirst({ select: { id: true } });
  if (!chuThe) {
    console.error(JSON.stringify({ loi: 'CỔNG HARNESS ĐỎ — bản sao không có User nào để ghi.' }));
    process.exit(2);
  }

  const treGiay = [];
  const loi = new Map();
  let xong = 0;
  let dungLai = false;
  const nhipCuoi = new Array(WORKER).fill(Date.now());

  /** Một lượt = 1 GHI + 3 ĐỌC — xấp xỉ hình dạng một request thật của IF. */
  async function motLuot(i) {
    const t0 = Date.now();
    await prisma.user.update({ where: { id: chuThe.id }, data: { lastSeenAt: new Date() } });
    await prisma.project.findMany({ where: { deletedAt: null }, take: 20, select: { id: true, name: true } });
    await prisma.flow.count();
    await prisma.libraryAsset.findMany({ take: 20, select: { id: true } });
    treGiay.push(Date.now() - t0);
    xong++;
    nhipCuoi[i] = Date.now();
  }

  const het = Date.now() + GIAY * 1000;
  const chay = async (i) => {
    while (!dungLai && Date.now() < het) {
      try {
        await motLuot(i);
      } catch (e) {
        const k = String(e.message).split('\n')[0].slice(0, 90);
        loi.set(k, (loi.get(k) ?? 0) + 1);
        nhipCuoi[i] = Date.now();
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  };

  // Máy dò kẹt — chạy song song, KHÔNG dùng cùng đường ống với tải.
  let ket = null;
  const bd = Date.now();
  const doKet = setInterval(() => {
    const im = (Date.now() - Math.max(...nhipCuoi)) / 1000;
    if (im >= TRAN_KET && !ket) {
      ket = { giayImLang: Math.round(im), phutThuMay: +((Date.now() - bd) / 60000).toFixed(1), xongTruocKhiKet: xong };
      try {
        ket.sample = execFileSync('sample', [String(process.pid), '1', '-mayberestarted'], {
          encoding: 'utf8', timeout: 20000,
        }).split('\n').filter((l) => /tokio-runtime-worker|query_engine/.test(l)).slice(0, 6);
      } catch { ket.sample = ['(không chạy được `sample`)']; }
      dungLai = true;
    }
  }, 2000);
  doKet.unref?.();

  await Promise.all(Array.from({ length: WORKER }, (_, i) => chay(i)));
  clearInterval(doKet);

  treGiay.sort((a, b) => a - b);
  const pt = (q) => (treGiay.length ? treGiay[Math.min(treGiay.length - 1, Math.floor(treGiay.length * q))] : null);

  const kq = {
    arm: arm.id, ten: arm.ten, pragma,
    giayChay: Math.round((Date.now() - bd) / 1000),
    luotXong: xong,
    thongLuong: +(xong / ((Date.now() - bd) / 1000)).toFixed(1),
    p50: pt(0.5), p95: pt(0.95), max: treGiay.at(-1) ?? null,
    loi: [...loi.entries()].map(([k, n]) => ({ cau: k, lan: n })),
    ket,
  };
  console.log('___KQ___' + JSON.stringify(kq));
  await prisma.$disconnect().catch(() => {});
  await db.dong();
  process.exit(0);
}

/* ══════════════════════════════════════════════════════════════════════════════════════════════
   CHẾ ĐỘ CHA — điều phối
   ══════════════════════════════════════════════════════════════════════════════════════════════ */
console.log('CHẨN ĐOÁN SQLITE · L2-01');
console.log(`  ${ARMS.length} arm × ${GIAY}s · ${WORKER} worker · trần kẹt ${TRAN_KET}s`);
console.log('  Mỗi arm: tiến trình riêng · bản sao DB riêng · tải CỐ ĐỊNH, chỉ đổi chuỗi kết nối.\n');

const ketQua = [];
for (const arm of ARMS) {
  process.stdout.write(`▶ ${arm.id.padEnd(5)} ${arm.ten}\n`);
  const t0 = Date.now();
  const kq = await new Promise((res) => {
    const con = spawn(process.execPath, [TEP, '--giay', String(GIAY), '--worker', String(WORKER), '--tran-ket', String(TRAN_KET)], {
      env: { ...process.env, IF_ARM: arm.id },
      cwd: process.cwd(),
    });
    let ra = '', er = '';
    con.stdout.on('data', (d) => { ra += d; });
    con.stderr.on('data', (d) => { er += d; });
    // Trần cứng: arm kẹt tới mức chính máy dò cũng không chạy được thì cha vẫn thoát được.
    const giet = setTimeout(() => con.kill('SIGKILL'), (GIAY + 120) * 1000);
    con.on('close', () => {
      clearTimeout(giet);
      // `db.dong()` in thêm dòng xác nhận DB thật sau marker — chỉ lấy ĐÚNG dòng JSON.
      const d = ra.split('___KQ___')[1]?.split('\n')[0];
      res(d ? JSON.parse(d) : { arm: arm.id, ten: arm.ten, loiTienTrinh: (er || ra).slice(-400) });
    });
  });
  kq.tuongGiay = Math.round((Date.now() - t0) / 1000);
  ketQua.push(kq);
  console.log(kq.loiTienTrinh
    ? `   🔴 arm chết: ${kq.loiTienTrinh.split('\n').pop()}`
    : `   ${kq.ket ? '🔴 KẸT' : '🟢 không kẹt'} · ${kq.luotXong} lượt · ${kq.thongLuong}/s · p50 ${kq.p50}ms · p95 ${kq.p95}ms · max ${kq.max}ms · journal=${kq.pragma?.journal_mode ?? '?'}\n`);
}

console.log('\n══ TỔNG ══');
for (const k of ketQua) {
  if (k.loiTienTrinh) { console.log(`  ${k.arm.padEnd(5)} — arm không chạy được`); continue; }
  console.log(`  ${k.arm.padEnd(5)} journal=${(k.pragma?.journal_mode ?? '?').padEnd(6)} sync=${(k.pragma?.synchronous ?? '?').padEnd(2)} · ${String(k.luotXong).padStart(6)} lượt · p95 ${String(k.p95).padStart(5)}ms · max ${String(k.max).padStart(6)}ms · ${k.ket ? `KẸT phút ${k.ket.phutThuMay}` : 'không kẹt'}`);
  for (const e of k.loi.slice(0, 3)) console.log(`        lỗi ×${e.lan}: ${e.cau}`);
  if (k.ket?.sample?.length) for (const l of k.ket.sample) console.log(`        sample: ${l.trim().slice(0, 100)}`);
}

const soKet = ketQua.filter((k) => k.ket).length;
console.log('\n══ KẾT LUẬN ══');
if (soKet === 0) {
  console.log('  CHƯA TÁI HIỆN ĐƯỢC cú kẹt L2-01 với tải này.');
  console.log('  ⇒ Verdict giữ nguyên PARTIAL. CẤM nâng lên PASS, CẤM gọi WAL/connection_limit là root cause.');
  console.log('  ⇒ Tải này KHÁC tải thật ở: không có HTTP/Next, không có nhiều PrismaClient, không có');
  console.log('     phiên đăng nhập, không có ghi ảnh/tệp. Bước sau phải đo trên chính `next start`.');
} else if (soKet === ARMS.length) {
  console.log('  KẸT Ở MỌI ARM — bản vá KHÔNG đủ. Không được ship rồi coi như đã xong.');
} else {
  const ketO = ketQua.filter((k) => k.ket).map((k) => k.arm).join(', ');
  const khong = ketQua.filter((k) => !k.ket && !k.loiTienTrinh).map((k) => k.arm).join(', ');
  console.log(`  TÁI HIỆN ĐƯỢC: kẹt ở [${ketO}], không kẹt ở [${khong}].`);
  console.log('  ⇒ Bản vá có cơ sở thực nghiệm. Vẫn cần một lượt trên `next start` trước khi gọi PASS.');
}
process.exit(0);
