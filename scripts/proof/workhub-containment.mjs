/**
 * scripts/proof/workhub-containment.mjs — `IF-WORKHUB-CONTAINMENT-001`.
 *
 * Lane `IF-UXUI-RUNTIME-001` đo được trên runtime: `/workhub` mở được **khi chưa đăng nhập**,
 * chào đích danh *"Chào Hoa"*, hiện ngày **đóng băng** "Thứ Hai, 17 tháng 8", và nhúng
 * `outlook.office.com` · `pinterest.com` · … bằng `<iframe>`.
 *
 * Đây là **CÔ LẬP**, không phải thiết kế lại: route ở lại, dữ liệu không đụng, mọi thứ lùi được
 * bằng biến môi trường. Proof đo **ba nhánh cờ** vì cả ba đều là hành vi sản xuất:
 *   · cả hai cờ TẮT (mặc định)          → `/workhub` không phục vụ, kể cả khi đã đăng nhập
 *   · cờ chính BẬT                       → đòi đăng nhập; đăng nhập rồi thì vào, nhưng KHÔNG nhúng ngoài
 *   · cờ chính + cờ nhúng ngoài BẬT      → nhúng được (đường thoát có ký tên, không phải mặc định)
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0 · luật F-17 (khẳng định có chủ thể + phải có ca **mong THẤY**).
 * ⚠️ Cách ly DB: `_db-tam.mjs` — không chạm `prisma/dev.db` thật (cổng #12, sau F-18).
 */

import { spawn } from 'node:child_process';
import { moDbTam } from './_db-tam.mjs';
import { SignJWT } from 'jose';
import { readFileSync } from 'node:fs';

const db = await moDbTam('workhub');
const prisma = db.prisma;
const TAG = `__proof_wh_${Date.now()}`;
const servers = [];
const ket = [];

const raw = readFileSync('.env', 'utf8').split('\n').find((l) => l.startsWith('AUTH_SECRET'));
const SECRET = raw.slice(raw.indexOf('=') + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2');

function ca(ten, mong, got, ghiChu = '') {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  if (!dat && ghiChu) console.log(`         ${ghiChu}`);
  return dat;
}
function chuaDo(ten, lyDo) {
  ket.push({ ten, dat: true, chuaDo: true });
  console.log(`  ⚪    ${ten} — NOT ASSESSED: ${lyDo}`);
}

const cookie = async (sub) =>
  `if_session=${await new SignJWT({ sub }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt()
    .setExpirationTime('1h').sign(new TextEncoder().encode(SECRET))}`;

async function dungServer(port, extraEnv) {
  const p = spawn('npx', ['next', 'dev', '-p', String(port)],
    { env: { ...process.env, ...db.env, ...extraEnv }, stdio: 'ignore' });
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

/** Lấy HTML của `/workhub` — đây là thứ người dùng thật sự nhận. */
/** Dấu hiệu CHỈ xuất hiện khi vỏ workspace thật sự render — placeholder ô tìm của topbar.
 *  ⚠️ Lượt đầu tôi soi cụm "Không gian làm việc", nhưng chính CÂU CỔNG của tôi cũng chứa cụm đó
 *  ("Không gian làm việc đang được cô lập…") ⇒ ca đỏ vì khẳng định soi nhầm chỗ, không phải vì
 *  rò rỉ. Đúng họ F-17 ở tầng khẳng định: bộ máy đúng, mắt nhìn sai ô. */
const DAU_HIEU_VO = /Tìm tab hoặc công cụ|Cửa sổ làm việc/;

const html = async (base, c) =>
  (await fetch(`${base}/workhub`, { headers: c ? { cookie: c } : {}, redirect: 'manual' })).text();

async function main() {
  console.log('# IF-WORKHUB-CONTAINMENT-001 · runtime proof (ba nhánh cờ)\n');

  const u = await prisma.user.create({
    data: { email: `${TAG}@proof.local`, name: `${TAG}_user`, passwordHash: 'x' },
  });
  const c = await cookie(u.id);

  /* ═════ NHÁNH 1 · MẶC ĐỊNH — cả hai cờ TẮT ═════ */
  const b1 = await dungServer(3081, {});
  const h1Khach = await html(b1);

  // CỔNG HARNESS: đòi server thật sự phục vụ trang này (không phải 404 của Next), và cookie
  // đúc thật sự xác thực được. Thiếu một trong hai thì mọi ca sau xanh vì lý do sai.
  const congOk =
    h1Khach.length > 500 &&
    (await fetch(`${b1}/api/comments`, { headers: { cookie: c } })).status === 200;
  ca('CA 0 · HARNESS: server phục vụ /workhub và cookie đúc xác thực được', true, congOk,
    `dài HTML ${h1Khach.length}`);
  if (!congOk) throw new Error('HARNESS ĐỎ — dừng.');

  ca('CA 1 · **mong THẤY** — mặc định: khách lạ nhận trạng thái "chưa được bật"', true,
    /chưa được bật|not enabled/i.test(h1Khach));
  ca('CA 2 · mặc định: KHÔNG lộ vỏ workspace cho khách lạ', false, DAU_HIEU_VO.test(h1Khach));
  ca('CA 3 · mặc định: KHÔNG có iframe nào', false, /<iframe/i.test(h1Khach));
  ca('CA 4 · mặc định: KHÔNG có miền ngoài nào trong HTML', false,
    /outlook\.office\.com|pinterest\.com|chat\.zalo\.me|microsoft365\.com|canva\.com|youtube\.com/i.test(h1Khach));

  const h1DaVao = await html(b1, c);
  ca('CA 5 · mặc định: ĐÃ ĐĂNG NHẬP vẫn nhận "chưa được bật" — cờ thắng phiên', true,
    /chưa được bật|not enabled/i.test(h1DaVao));
  ca('CA 6 · và câu chữ nói RÕ đây KHÔNG phải lỗi quyền (chống gộp trạng thái)', true,
    /không phải do quyền|not a permission/i.test(h1DaVao));

  /* ═════ NHÁNH 2 · cờ chính BẬT, nhúng ngoài TẮT ═════ */
  const b2 = await dungServer(3082, { NEXT_PUBLIC_IF_WORKHUB: '1' });
  const h2Khach = await html(b2);
  ca('CA 7 · cờ BẬT: khách lạ nhận "cần đăng nhập" — KHÁC hẳn "chưa được bật"', true,
    /cần đăng nhập|sign-in required/i.test(h2Khach) && !/chưa được bật/i.test(h2Khach));
  ca('CA 8 · và vẫn KHÔNG lộ vỏ workspace', false, DAU_HIEU_VO.test(h2Khach));
  ca('CA 9 · khách lạ: vẫn không iframe, không miền ngoài', false,
    /<iframe/i.test(h2Khach) || /outlook\.office\.com|pinterest\.com/i.test(h2Khach));
  ca('CA 10 · trang KHÔNG chuyển hướng — luôn vẽ một trạng thái đọc được (chống trắng 12 giây)',
    200, (await fetch(`${b2}/workhub`, { redirect: 'manual' })).status);

  const h2DaVao = await html(b2, c);
  ca('CA 11 · **mong THẤY** — cờ BẬT + đã đăng nhập: vào được vỏ workspace', true,
    DAU_HIEU_VO.test(h2DaVao));
  ca('CA 12 · KHÔNG còn lời chào nhúng tên riêng', false, /Chào Hoa/.test(h2DaVao));
  ca('CA 13 · KHÔNG còn ngày đóng băng "Thứ Hai, 17 tháng 8"', false, /Thứ Hai, 17 tháng 8/.test(h2DaVao));
  ca('CA 14 · nhúng ngoài TẮT: KHÔNG có iframe nào dù đã vào được', false, /<iframe/i.test(h2DaVao));
  ca('CA 15 · và nói RÕ vì sao tắt, không để nút chết câm', true,
    /đang tắt ở bản này|disabled in this build/i.test(h2DaVao));

  /* ═════ NHÁNH 3 · cả hai cờ BẬT — lối thoát CÓ KÝ TÊN ═════ */
  const b3 = await dungServer(3083, { NEXT_PUBLIC_IF_WORKHUB: '1', NEXT_PUBLIC_IF_WORKHUB_EXTERNAL: '1' });
  const h3 = await html(b3, c);
  ca('CA 16 · **mong THẤY** — hai cờ BẬT: nút mở trang ngoài hiện lại', true,
    /Mở trang web|Open website/i.test(h3));
  ca('CA 17 · nhưng khách lạ vẫn bị chặn ở nhánh này', true,
    /cần đăng nhập|sign-in required/i.test(await html(b3)));

  chuaDo('CA 18 · Electron đóng gói', 'proof chạy `next dev`; bản .app hiện có là 22/08, KHÔNG phải HEAD này');
  chuaDo('CA 19 · duyệt bằng mắt VI/EN trên app thật', 'thuộc lane UX/Design Authority — mắt cuối là của Hoà');
}

main()
  .catch((e) => { console.error(e.message); ket.push({ ten: 'CHẠY ĐƯỢC', dat: false }); })
  .finally(async () => {
    for (const s of servers) s.kill();
    await prisma.user.deleteMany({ where: { name: { contains: TAG } } }).catch(() => {});
    await db.dong();
    const fail = ket.filter((k) => !k.dat);
    const na = ket.filter((k) => k.chuaDo).length;
    console.log(`\n${ket.length - fail.length - na}/${ket.length - na} ĐẠT · ${na} NOT ASSESSED`);
    process.exit(fail.length ? 1 : 0);
  });
