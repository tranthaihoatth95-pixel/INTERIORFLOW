/**
 * scripts/proof/db-tam-tien-kiem.mjs — chứng minh CỔNG TIỀN KIỂM của `_db-tam.mjs`.
 *
 * Hoà chốt 27/08: *"Guard phải fail TRƯỚC khi server/script mở Prisma nếu target là DB thật.
 * Dọn fixture chỉ là hậu kiểm; không phải cơ chế an toàn."* Và: *"Thêm proof: cố ý đưa
 * `prisma/dev.db` vào harness và harness phải ĐỎ trước bất kỳ ghi nào."*
 *
 * Ca xương sống là **CA 2**: đưa thẳng `prisma/dev.db` vào cổng, đòi nó ném — VÀ đòi vân tay dữ
 * liệu của DB thật **không đổi một bit** qua cả lượt chạy. Ném mà vẫn kịp ghi thì cổng vô dụng.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0 · luật F-17 (phải có ca **mong THẤY**).
 */

import { tienKiemMucTieu, moDbTam, duongDbThat } from './_db-tam.mjs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';

const ket = [];
function ca(ten, mong, got, ghiChu = '') {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  if (!dat && ghiChu) console.log(`         ${ghiChu}`);
  return dat;
}
/** Vân tay DỮ LIỆU (không phải vân tay tệp) — SQLite đổi byte cả khi chỉ đọc. */
const vanTay = (p) =>
  createHash('sha256')
    .update(execFileSync('sqlite3', [p, '.dump'], { encoding: 'buffer', maxBuffer: 1024 ** 3 }))
    .digest('hex');

/** Gọi cổng, trả `'nem'` kèm lý do, hoặc `'lot'` nếu nó cho qua. */
function thu(duong) {
  try {
    tienKiemMucTieu(duong);
    return { kq: 'lot' };
  } catch (e) {
    return { kq: 'nem', lyDo: String(e.message) };
  }
}

const THAT = path.resolve(duongDbThat());
const truoc = vanTay(THAT);

// ── CA 0 · CỔNG HARNESS ──────────────────────────────────────────────────────
// Đòi ba thứ: hàm tồn tại, DB thật đọc được, và cổng CƯ XỬ đúng ở một ca không tầm thường
// (đường tạm hợp lệ phải LỌT). Một stub luôn-ném sẽ chết ngay tại đây.
{
  const tam = path.join(os.tmpdir(), 'if-harness-kiem', 'dev.db');
  const ok =
    typeof tienKiemMucTieu === 'function' &&
    truoc.length === 64 &&
    thu(tam).kq === 'lot';
  ca('CA 0 · HARNESS: cổng tồn tại, DB thật đọc được, và đường TẠM HỢP LỆ vẫn lọt', true, ok);
  if (!ok) { console.error('\n⛔ HARNESS ĐỎ — dừng.'); process.exit(1); }
}

// ── CA 1-2 · CA XƯƠNG SỐNG: đưa thẳng DB THẬT vào ────────────────────────────
{
  const r = thu(THAT);
  ca('CA 1 · đưa thẳng `prisma/dev.db` vào cổng ⇒ NÉM', 'nem', r.kq);
  ca('CA 2 · và lý do gọi đích danh "trùng DB thật theo .env"', true,
    /trùng DB thật theo \.env/.test(r.lyDo ?? ''), r.lyDo?.slice(0, 200));
  ca('CA 3 · lý do nói rõ đây là chốt TRƯỚC KHI GHI, không phải dọn sau', true,
    /TRƯỚC KHI GHI/.test(r.lyDo ?? ''));
}

// ── CA 4-7 · các đường nguy hiểm khác ────────────────────────────────────────
{
  ca('CA 4 · đường NẰM TRONG repo ⇒ NÉM', 'nem', thu(path.join(process.cwd(), 'prisma', 'ban-sao.db')).kq);
  ca('CA 5 · đường trong userData (Electron ghi DB thật ở đó) ⇒ NÉM', 'nem',
    thu(path.join(process.env.HOME ?? '/tmp', 'Library', 'Application Support', 'InteriorFlow', 'dev.db')).kq);
  ca('CA 6 · `/tmp/dev.db` — trông giống sản xuất, không mang dấu thư mục tạm ⇒ NÉM', 'nem',
    thu(path.join(os.tmpdir(), 'dev.db')).kq);
  ca('CA 7 · **mong THẤY** — đường tạm đúng khuôn `if-*` vẫn LỌT (cổng không siết bừa)', 'lot',
    thu(path.join(os.tmpdir(), 'if-proof-abc123', 'dev.db')).kq);
}

// ── CA 8 · CỔNG NÉM MÀ KHÔNG KỊP GHI GÌ ──────────────────────────────────────
{
  ca('CA 8 · DB THẬT không đổi một bit dữ liệu qua toàn bộ lượt thử', truoc, vanTay(THAT));
}

// ── CA 9 · đường hợp lệ vẫn dùng được đầu-tới-cuối ───────────────────────────
{
  const db = await moDbTam('tien-kiem');
  const okMo = db.duongDan.includes('if-tien-kiem') && !db.duongDan.startsWith(process.cwd());
  ca('CA 9 · **mong THẤY** — `moDbTam` vẫn mở được bản sao ngoài repo', true, okMo, db.duongDan);
  const n = await db.prisma.user.count();
  ca('CA 10 · và bản sao có dữ liệu thật để test (user > 0)', true, n > 0, `đếm ${n}`);
  await db.dong();
}

const fail = ket.filter((k) => !k.dat);
console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
process.exit(fail.length ? 1 : 0);
