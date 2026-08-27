/**
 * scripts/proof/soi-quan-tri.mjs — chứng minh MÁY CANH quản trị bằng KIỂM ĐỘT BIẾN.
 *
 * Hoà đặt bài: *"cố ý đưa một EV thiếu Sensitivity và máy soi phải ĐỎ"*. Một máy canh chưa từng
 * đỏ thì không ai biết nó có canh gì không — đúng bẫy F-15 ở tầng máy soi.
 *
 * Cách làm: tạo tệp đột biến TRONG `docs/`, chạy máy soi, đòi nó đỏ ĐÚNG chỗ, rồi xoá tệp và
 * đòi nó xanh lại. Không đụng tệp nào có sẵn.
 */

import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = process.cwd();
const THU = path.join(REPO, 'docs', '__dot-bien-quan-tri');
const ket = [];

function ca(ten, mong, got, ghiChu = '') {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  if (!dat && ghiChu) console.log(`         ${ghiChu}`);
  return dat;
}

const chay = () => spawnSync(process.execPath, ['scripts/soi-quan-tri.mjs'], { encoding: 'utf8', cwd: REPO });

try {
  // ── CA 0 · CỔNG HARNESS ────────────────────────────────────────────────────
  // Đòi máy soi CHẠY ĐƯỢC và XANH ở trạng thái sạch. Nếu nó vốn đã đỏ thì mọi ca đột biến sau
  // "đỏ" vì lý do sai — đúng bẫy F-15.
  {
    const r = chay();
    const ok = r.status === 0 && /Cổng quản trị XANH/.test(r.stdout);
    ca('CA 0 · HARNESS: máy soi chạy được và XANH khi cây sạch', true, ok,
      `mã ${r.status} · ${(r.stdout || '').slice(-160)}`);
    if (!ok) { console.error('\n⛔ HARNESS ĐỎ — dừng.'); process.exit(1); }
  }

  mkdirSync(THU, { recursive: true });

  // ── CA 1-3 · L1: EV thiếu ô bắt buộc ───────────────────────────────────────
  {
    // Đây là ĐÚNG hình dạng đã để 23 ảnh lọt qua: bằng chứng mạnh, mô tả đầy đủ, nhưng không ai
    // điền `Sensitivity` — nên không ai hỏi "hiện vật này chứa gì".
    writeFileSync(path.join(THU, 'thu.md'), `# thử

### EV-901
Type: runtime · Source: docs/.../anh/ · Strength: strong
Captured: 27/08 — 23 ảnh chụp app thật.
`);
    const r = chay();
    ca('CA 1 · EV thiếu `Sensitivity` VÀ `Scope` ⇒ máy soi ĐỎ (thoát 1)', 1, r.status);
    ca('CA 2 · và gọi đích danh cả hai ô còn thiếu', true,
      /EV-901.*Sensitivity, Scope/s.test(r.stdout), r.stdout.slice(-240));
    ca('CA 3 · và nhắc đúng bài học gốc (F-21)', true, /F-21/.test(r.stdout));
  }

  // ── CA 4 · điền MỘT ô vẫn chưa đủ ──────────────────────────────────────────
  {
    writeFileSync(path.join(THU, 'thu.md'), `# thử

### EV-901
Type: runtime · Sensitivity: client-data · Strength: strong
`);
    const r = chay();
    ca('CA 4 · điền `Sensitivity` nhưng thiếu `Scope` ⇒ VẪN ĐỎ', 1, r.status);
    ca('CA 5 · và chỉ còn kêu đúng ô thiếu, không kêu ô đã điền', true,
      /Sensitivity, Scope/.test(r.stdout) === false && /thiếu ô bắt buộc: Scope/.test(r.stdout));
  }

  // ── CA 6 · **mong THẤY** — điền đủ thì QUA ─────────────────────────────────
  {
    writeFileSync(path.join(THU, 'thu.md'), `# thử

### EV-901
Type: runtime · Sensitivity: client-data · Scope: chỉ trả lời "UI hiện ra thế nào"
`);
    const r = chay();
    ca('CA 6 · **mong THẤY** — điền đủ hai ô ⇒ XANH (cổng không siết bừa)', 0, r.status);
  }

  // ── CA 7-8 · L2: hai sự thật cùng sống ─────────────────────────────────────
  {
    writeFileSync(path.join(THU, 'thu.md'), `# thử

IF-DEC-901
  Status: CURRENT
  ghi chú: bản này đã SUPERSEDED bởi IF-DEC-902 nhưng chưa ai đóng dấu
`);
    const r = chay();
    ca('CA 7 · quyết định vừa CURRENT vừa SUPERSEDED ⇒ ĐỎ', 1, r.status);
    ca('CA 8 · và nhắc đúng bài học F-19 (ba ô người-ghi cùng sống)', true, /F-19/.test(r.stdout));
  }

  // ── CA 9 · dọn xong phải XANH lại ─────────────────────────────────────────
  {
    rmSync(THU, { recursive: true, force: true });
    const r = chay();
    ca('CA 9 · xoá tệp đột biến ⇒ máy soi XANH lại (không để lại vết)', 0, r.status);
  }

  // ── CA 10 · L5 canh sổ frontier ───────────────────────────────────────────
  {
    const { FRONTIER } = await import(path.join(REPO, 'scripts', 'frontier-registry.mjs'));
    const q = FRONTIER.filter((e) => e.quanTri);
    ca('CA 10 · sổ frontier có entry mang `quanTri` để Hoà kiểm bằng một lệnh', true, q.length >= 2,
      `đang có ${q.length}`);
    ca('CA 11 · entry `client-data` phải có đủ dec + ev + diss + gate', true,
      q.some((e) => e.quanTri.nhay === 'client-data' && e.quanTri.dec && e.quanTri.ev?.length && e.quanTri.diss && e.quanTri.gate));
  }
} finally {
  rmSync(THU, { recursive: true, force: true });
  const fail = ket.filter((k) => !k.dat);
  console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
  process.exit(fail.length ? 1 : 0);
}
