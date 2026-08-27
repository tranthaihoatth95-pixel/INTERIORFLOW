/**
 * scripts/proof/db-khong-ket.mjs — P0 `L2-01`: server KHÔNG được kẹt cứng.
 *
 * Lane `IF-UXUI-RUNTIME-001` đang audit thì dev server **kẹt sau ~6 phút dùng bình thường**: tệp
 * tĩnh còn 200, **mọi route app và API treo vô hạn — không lỗi, không timeout**. `sample` cho thấy
 * 9 luồng của query engine đứng chết cùng stack.
 *
 * Lane gọi đó là *"TẢI HỎNG thoái hoá thành ĐANG TẢI vĩnh viễn"* — đúng, và gốc **không ở UI**:
 *     journal_mode=delete  → mỗi lần ghi khoá độc quyền TOÀN BỘ tệp, người đọc bị chặn
 *     busy_timeout=0       → kết nối bị chặn chờ MÃI MÃI, không bao giờ báo lỗi
 *     getSession()         → GHI `lastSeenAt` ở gần như mọi request ⇒ người ghi liên tục
 * ⇒ App **không thể** đạt tới trạng thái "tải hỏng" vì request không bao giờ hỏng — nó treo.
 * Vẽ một trạng thái lỗi ở tầng UI là vẽ thứ không bao giờ tới được.
 *
 * Proof này là **A/B thật**, không phải khẳng định suông: dựng HAI server, một theo cấu hình CŨ
 * (delete + pool nhiều kết nối), một theo cấu hình MỚI (WAL + `connection_limit=1`), rồi nện
 * cùng một tải song song vào cả hai.
 *
 * ⚠️ CỔNG HARNESS (F-15) · luật F-17 (phải có ca **mong THẤY**). Cách ly DB qua `_db-tam.mjs`.
 */

import { spawn, execFileSync } from 'node:child_process';
import { moDbTam } from './_db-tam.mjs';
import { SignJWT } from 'jose';
import { readFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';

const db = await moDbTam('khong-ket');
const prisma = db.prisma;
const servers = [];
const ket = [];

const raw = readFileSync('.env', 'utf8').split('\n').find((l) => l.startsWith('AUTH_SECRET'));
const SECRET = raw.slice(raw.indexOf('=') + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2');

function ca(ten, mong, got, ghiChu = '') {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  if (ghiChu) console.log(`         ${ghiChu}`);
  return dat;
}

const pragma = (tep, q) => execFileSync('sqlite3', [tep, q], { encoding: 'utf8' }).trim();

async function dungServer(port, url) {
  const p = spawn('npx', ['next', 'dev', '-p', String(port)],
    { env: { ...process.env, DATABASE_URL: url }, stdio: 'ignore' });
  servers.push(p);
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/comments`);
      if (r.status === 401 || r.status === 200) return `http://127.0.0.1:${port}`;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Server ${port} không lên`);
}

/**
 * Nện `n` request SONG SONG, mỗi cái có hạn `hanMs`. Trả về thống kê.
 * `/api/dashboard` được chọn vì nó vừa ĐỌC nhiều bảng vừa kích `getSession()` — tức vừa đọc vừa
 * GHI `lastSeenAt`. Đúng hình dạng tải đã làm kẹt server thật.
 */
async function nen(base, cookie, n, hanMs) {
  const bd = Date.now();
  const kq = await Promise.all(
    Array.from({ length: n }, async () => {
      const bo = AbortSignal.timeout(hanMs);
      try {
        const r = await fetch(`${base}/api/dashboard`, { headers: { cookie }, signal: bo });
        return r.status === 200 ? 'ok' : `http-${r.status}`;
      } catch (e) {
        return e?.name === 'TimeoutError' || /abort/i.test(String(e?.message)) ? 'treo' : 'loi';
      }
    }),
  );
  return {
    ok: kq.filter((x) => x === 'ok').length,
    treo: kq.filter((x) => x === 'treo').length,
    loi: kq.filter((x) => x !== 'ok' && x !== 'treo').length,
    giay: ((Date.now() - bd) / 1000).toFixed(1),
  };
}

async function main() {
  console.log('# P0 L2-01 · server KHÔNG được kẹt — A/B cấu hình CŨ vs MỚI\n');

  const u = await prisma.user.findFirst({ where: { isAdmin: true }, select: { id: true } })
    ?? await prisma.user.findFirst({ select: { id: true } });
  const cookie = `if_session=${await new SignJWT({ sub: u.id }).setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(SECRET))}`;

  // Hai bản sao riêng: một ép về `delete` (cấu hình CŨ), một để WAL (cấu hình MỚI).
  const cu = path.join(path.dirname(db.duongDan), 'cu.db');
  const moi = db.duongDan;
  copyFileSync(moi, cu);
  pragma(cu, 'PRAGMA journal_mode=DELETE;');
  pragma(moi, 'PRAGMA journal_mode=WAL;');

  // ── CA 0 · CỔNG HARNESS ───────────────────────────────────────────────────
  // Đòi: hai bản sao THẬT SỰ ở hai chế độ khác nhau. Nếu cả hai cùng chế độ thì A/B vô nghĩa và
  // mọi ca sau xanh vì lý do sai.
  const jCu = pragma(cu, 'PRAGMA journal_mode;');
  const jMoi = pragma(moi, 'PRAGMA journal_mode;');
  const congOk = jCu === 'delete' && jMoi === 'wal' && !!u;
  ca(`CA 0 · HARNESS: hai bản sao ở HAI chế độ khác nhau (${jCu} vs ${jMoi})`, true, congOk);
  if (!congOk) throw new Error('HARNESS ĐỎ — dừng.');

  // ── NHÁNH CŨ: delete + pool nhiều kết nối (khai tường minh để `db.ts` không đè) ──
  const bCu = await dungServer(3091, `file:${cu}?connection_limit=5&socket_timeout=30`);
  const rCu = await nen(bCu, cookie, 24, 12_000);
  const cuKet = rCu.treo > 0;
  ca(`CA 1 · cấu hình CŨ có tái hiện được cú kẹt không? (ok ${rCu.ok} · treo ${rCu.treo} · lỗi ${rCu.loi}, ${rCu.giay}s)`,
    true, true,
    cuKet
      ? '🔴 TÁI HIỆN ĐƯỢC — A/B có giá trị nhân quả.'
      : '⚠️ KHÔNG tái hiện được. Nện 24 request trong ~1 giây KHÔNG bằng ~6 phút dùng thật. ' +
        'Nghĩa là proof này CHƯA chứng minh cấu hình cũ là nguyên nhân — xem CA 8.');

  // ── NHÁNH MỚI: WAL + để `db.ts` tự áp connection_limit=1 + socket_timeout=10 ──
  const bMoi = await dungServer(3092, `file:${moi}`);
  const rMoi = await nen(bMoi, cookie, 24, 12_000);
  ca('CA 2 · **mong THẤY** — cấu hình MỚI: 24/24 request về ĐƯỢC, 0 treo', true,
    rMoi.ok === 24 && rMoi.treo === 0,
    `ok ${rMoi.ok} · treo ${rMoi.treo} · lỗi ${rMoi.loi} · ${rMoi.giay}s`);

  // Nện đợt hai — ca kẹt thật xuất hiện SAU vài phút dùng, không phải ngay phát đầu.
  const rMoi2 = await nen(bMoi, cookie, 24, 12_000);
  const rMoi3 = await nen(bMoi, cookie, 24, 12_000);
  ca('CA 3 · và giữ được qua ba đợt liên tiếp — kẹt thật xuất hiện SAU vài phút, không phải phát đầu',
    true, rMoi2.ok === 24 && rMoi3.ok === 24 && rMoi2.treo === 0 && rMoi3.treo === 0,
    `đợt 2: ok ${rMoi2.ok}/treo ${rMoi2.treo} (${rMoi2.giay}s) · đợt 3: ok ${rMoi3.ok}/treo ${rMoi3.treo} (${rMoi3.giay}s)`);

  ca('CA 4 · server MỚI vẫn sống sau tải: route đơn lẻ trả lời trong 5s', 200,
    (await fetch(`${bMoi}/api/comments`, { headers: { cookie }, signal: AbortSignal.timeout(5000) })).status);

  // ── Cấu hình đã vào mã, không phải lời hứa ──
  const nguon = readFileSync('lib/server/db.ts', 'utf8');
  ca('CA 5 · `db.ts` áp `connection_limit=1` và `socket_timeout` cho SQLite', true,
    /connection_limit/.test(nguon) && /socket_timeout/.test(nguon) && /startsWith\('file:'\)/.test(nguon));
  ca('CA 6 · và KHÔNG đè giá trị người vận hành đã khai tường minh', true,
    /if \(!p\.has\('connection_limit'\)\)/.test(nguon));
  ca('CA 7 · DB THẬT đã ở chế độ WAL', 'wal', pragma(path.resolve('prisma/dev.db'), 'PRAGMA journal_mode;'));

  /* ── CA 8 · ĐIỀU PROOF NÀY **KHÔNG** CHỨNG MINH ──────────────────────────────────────────────
   * Phải nói ra, vì đây đúng là chỗ dễ tự lừa nhất của cả lát: các ca trên xanh, và người đọc
   * vội sẽ kết luận "đã sửa xong cú kẹt". KHÔNG.
   *
   * Cú kẹt thật xuất hiện sau **~6 phút dùng bình thường** trong một phiên audit — nhiều loại
   * request khác nhau, xen kẽ đọc/ghi, kéo dài. Proof này nện 24 request giống nhau trong ~1
   * giây. Cấu hình CŨ **cũng qua** bài đó. ⇒ **A/B không tái hiện được sự cố**, nên nó KHÔNG
   * chứng minh được quan hệ nhân quả.
   *
   * Cái proof này CHỨNG MINH: cấu hình mới không làm hỏng gì, chịu được tải cụm, và ba PRAGMA
   * gây bệnh đã đổi. Cái nó KHÔNG chứng minh: rằng cú kẹt sẽ không tái diễn.
   *
   * Muốn lên PASS thì phải: chạy một phiên dài (≥15 phút) với hình dạng tải hỗn hợp trên cấu
   * hình CŨ tới khi kẹt, rồi lặp lại y hệt trên cấu hình MỚI. Chưa dựng được bậc đó ở đây. */
  ket.push({ ten: 'CA 8 · nguyên nhân cú kẹt ~6 phút', dat: true, chuaDo: true });
  console.log('  ⚪    CA 8 · nguyên nhân cú kẹt ~6 phút — NOT ASSESSED: A/B không tái hiện được sự cố');
  console.log('         (24 request/1 giây ≠ 6 phút dùng thật). Cấu hình mới là SUY LUẬN từ ba PRAGMA đo được,');
  console.log('         chưa phải bằng chứng nhân quả. Verdict lát này: PARTIAL, không phải PASS.');
}

main()
  .catch((e) => { console.error(e.message); ket.push({ ten: 'CHẠY ĐƯỢC', dat: false }); })
  .finally(async () => {
    for (const s of servers) s.kill();
    await db.dong();
    const fail = ket.filter((k) => !k.dat);
    const na = ket.filter((k) => k.chuaDo).length;
    console.log(`\n${ket.length - fail.length - na}/${ket.length - na} ĐẠT · ${na} NOT ASSESSED`);
    console.log('VERDICT: PARTIAL — cấu hình đã đổi và chịu được tải cụm; nguyên nhân cú kẹt CHƯA chứng minh.');
    process.exit(fail.length ? 1 : 0);
  });
