/**
 * scripts/proof/trang-thai-bon-nhanh.mjs — P0-2 mục 1: bốn trạng thái phải TÁCH BẠCH trên runtime.
 *
 * Lane `IF-UXUI-RUNTIME-001` chứng minh trục này sập: `/projects` khi **401** và khi **server
 * chết hẳn** in ra **chữ y hệt, pixel y hệt**. Proof này dựng lại đúng phép so sánh đó — nhưng ở
 * mức HTTP + văn bản trang, và đòi bốn nhánh cho **bốn câu khác nhau**.
 *
 * ⚠️ Cái proof này KHÔNG chứng minh: bố cục/thị giác của bốn màn. Đó là việc của lane UX và mắt
 * Hoà. Ở đây chỉ chứng minh **ngữ nghĩa đã tách** — điều kiện cần, chưa phải điều kiện đủ.
 *
 * ⚠️ CỔNG HARNESS (F-15) · luật F-17 (phải có ca **mong THẤY**). Cách ly DB qua `_db-tam.mjs`.
 */

import { spawn } from 'node:child_process';
import { moDbTam } from './_db-tam.mjs';
import { SignJWT } from 'jose';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const db = await moDbTam('bon-nhanh');
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
function chuaDo(ten, lyDo) {
  ket.push({ ten, dat: true, chuaDo: true });
  console.log(`  ⚪    ${ten} — NOT ASSESSED: ${lyDo}`);
}

// ── Nạp module THUẦN từ mã sản xuất (bundle) — soi đúng thứ app dùng, không soi bản chép ──
const tmp = mkdtempSync(path.join(process.cwd(), 'node_modules', '.if-proof-'));
const out = path.join(tmp, 'tt.cjs');
execFileSync('npx', ['esbuild', 'lib/ui/trang-thai-tai.ts', '--bundle', '--format=cjs',
  '--platform=node', `--outfile=${out}`], { stdio: 'pipe' });
const TT = require(out);

async function main() {
  console.log('# P0-2 · bốn trạng thái tách bạch — runtime\n');

  // ── CA 0 · CỔNG HARNESS ────────────────────────────────────────────────────
  // Đòi module THẬT + cư xử đúng ở một ca không tầm thường (offline THẮNG 401).
  const congOk =
    typeof TT.phanLoaiHong === 'function' &&
    typeof TT.nhan === 'function' &&
    TT.phanLoaiHong({ ok: false, status: 401 }, false).lyDo === 'ngoai-tuyen';
  ca('CA 0 · HARNESS: module thật, và offline THẮNG 401 (stub sẽ chết ở đây)', true, congOk);
  if (!congOk) throw new Error('HARNESS ĐỎ — dừng.');

  const u = await db.prisma.user.findFirst({ where: { isAdmin: true }, select: { id: true } });
  const cookie = `if_session=${await new SignJWT({ sub: u.id }).setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(SECRET))}`;

  // ── Dựng server ────────────────────────────────────────────────────────────
  const p = spawn('npx', ['next', 'dev', '-p', '3095'], { env: { ...process.env, ...db.env }, stdio: 'ignore' });
  servers.push(p);
  let base = null;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch('http://127.0.0.1:3095/api/comments');
      if (r.status === 401 || r.status === 200) { base = 'http://127.0.0.1:3095'; break; }
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!base) throw new Error('server không lên');

  // ── CA 1-2 · CHÍNH CÁI ĐÃ SẬP: 401 vs máy chủ lỗi ─────────────────────────
  const n401 = TT.nhan('khong-quyen', { vi: 'dự án', en: 'projects' }, false);
  const n500 = TT.nhan('may-chu-loi', { vi: 'dự án', en: 'projects' }, false);
  ca('CA 1 · 401 và máy-chủ-lỗi ra HAI câu khác nhau (ca đã sập trên app thật)', true,
    n401.tieuDe !== n500.tieuDe && n401.moTa !== n500.moTa);
  ca('CA 2 · và hai nhãn hành động khác nhau — đăng nhập ≠ thử lại', true,
    n401.hanhDong !== n500.hanhDong && /đăng nhập/i.test(n401.hanhDong) && /thử lại/i.test(n500.hanhDong));

  // ── CA 3-4 · bốn nhánh, bốn câu ───────────────────────────────────────────
  for (const en of [false, true]) {
    const cau = ['khong-quyen', 'ngoai-tuyen', 'may-chu-loi', 'khong-doc-duoc']
      .map((l) => JSON.stringify(TT.nhan(l, { vi: 'dự án', en: 'projects' }, en)));
    ca(`CA 3${en ? 'b' : 'a'} · ${en ? 'EN' : 'VI'}: 4 lý do → 4 câu, không trùng đôi nào`, 4, new Set(cau).size);
  }

  // ── CA 5 · MÃ KỸ THUẬT KHÔNG ĐƯỢC RA MẶT NGƯỜI DÙNG ───────────────────────
  {
    let lot = 0;
    for (const l of ['khong-quyen', 'ngoai-tuyen', 'may-chu-loi', 'khong-doc-duoc']) {
      for (const en of [false, true]) {
        const n = TT.nhan(l, { vi: 'dự án', en: 'projects' }, en);
        if (/HTTP|\b[45]\d\d\b/.test(`${n.tieuDe} ${n.moTa} ${n.hanhDong ?? ''}`)) lot++;
      }
    }
    ca('CA 5 · 0/8 câu lọt mã kỹ thuật ("HTTP 401" từng in thẳng ra mặt người dùng)', 0, lot);
  }

  // ── CA 6-7 · RUNTIME: trang /projects thật, hai chiều phiên ───────────────
  const html = async (c) => (await fetch(`${base}/projects`, { headers: c ? { cookie: c } : {} })).text();
  const hKhach = await html(null);
  const hDaVao = await html(cookie);
  ca('CA 6 · **mong THẤY** — trang /projects phục vụ được ở cả hai chiều', true,
    hKhach.length > 500 && hDaVao.length > 500, `khách ${hKhach.length}b · đã vào ${hDaVao.length}b`);
  ca('CA 7 · HTML trang KHÔNG chứa chuỗi "HTTP 4xx" nào', false, /HTTP\s*4\d\d/.test(hKhach + hDaVao));

  // ── CA 8 · mã sản xuất đã NỐI, không chỉ có module ────────────────────────
  {
    const src = readFileSync('components/ProjectSelect.tsx', 'utf8')
      .split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
    ca('CA 8 · `ProjectSelect` dùng `phanLoaiHong` + `nhan`, KHÔNG còn boolean `loadError`', true,
      /phanLoaiHong\(/.test(src) && /nhan\(lyDoHong\.lyDo/.test(src) && !/\bloadError\b/.test(src));
    ca('CA 9 · và `loadProjectCards` KHÔNG còn ném chuỗi mất mã trạng thái', false,
      /throw new Error\('Không tải được danh sách flow/.test(src));
    ca('CA 10 · mất mạng ⇒ KHÔNG dựng nút (nút bấm-không-đổi-gì dạy người dùng bỏ qua nút)', true,
      /n\.hanhDong\s*\?\s*\[\{/.test(src) && /:\s*\[\]/.test(src));
  }

  chuaDo('CA 11 · bố cục/thị giác bốn màn', 'thuộc lane UX + mắt Hoà; proof này chỉ chứng minh NGỮ NGHĨA đã tách');
  /* ── CA 12-16 · `/materials` và `/tasks` (nối 27/08) ───────────────────────── */
  {
    const doc = (f) => readFileSync(f, 'utf8').split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
    const mat = doc('components/materials/MaterialsScreen.tsx');
    const task = doc('components/tasks/TaskBoardScreen.tsx');

    ca('CA 12 · `/materials` dùng từ vựng chung, KHÔNG còn ném `HTTP ${status}` ở đường nạp', true,
      /phanLoaiHong\(/.test(mat) && !/throw new Error\(`HTTP \$\{res\.status\}`\)/.test(mat));
    ca('CA 13 · và trạng thái hỏng CHIẾM CHỖ nội dung, không phải thanh mỏng trên bảng rỗng', true,
      /lyDoHong \? \(/.test(mat) && !/\{error && \(/.test(mat));

    ca('CA 14 · `/tasks` đường NẠP dùng từ vựng chung', true, /phanLoaiHong\(/.test(task));
    /* Ca nặng nhất của lát này: nhánh HỎNG phải đứng TRƯỚC nhánh RỖNG. Bản cũ nạp hỏng ⇒
       setProjects([]) ⇒ rơi vào "chưa có dự án nào" — nói với tài khoản có 15 dự án rằng họ
       chẳng có gì. */
    const iHong = task.indexOf('{lyDoHong ? (');
    const iRong = task.indexOf('projects.length === 0');
    ca('CA 15 · nhánh HỎNG đứng TRƯỚC nhánh RỖNG (nếu ngược lại: "hết phiên" đọc thành "chưa có gì")',
      true, iHong > 0 && iRong > 0 && iHong < iRong, `hỏng@${iHong} · rỗng@${iRong}`);
    ca('CA 16 · ba màn dùng CHUNG một từ vựng, không ba bản chép', 3,
      ['components/ProjectSelect.tsx', 'components/materials/MaterialsScreen.tsx', 'components/tasks/TaskBoardScreen.tsx']
        .filter((f) => /from '@\/lib\/ui\/trang-thai-tai'/.test(readFileSync(f, 'utf8'))).length);
  }
  chuaDo('CA 13 · Electron đóng gói', 'proof chạy `next dev`');
}

main()
  .catch((e) => { console.error(e.message); ket.push({ ten: 'CHẠY ĐƯỢC', dat: false }); })
  .finally(async () => {
    for (const s of servers) s.kill();
    rmSync(tmp, { recursive: true, force: true });
    await db.dong();
    const fail = ket.filter((k) => !k.dat);
    const na = ket.filter((k) => k.chuaDo).length;
    console.log(`\n${ket.length - fail.length - na}/${ket.length - na} ĐẠT · ${na} NOT ASSESSED`);
    process.exit(fail.length ? 1 : 0);
  });
