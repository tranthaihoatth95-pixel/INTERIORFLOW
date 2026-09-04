/**
 * Kiểm tra tĩnh tối thiểu trước khi tạo bộ cài nội bộ.
 * Không thay thế smoke test trên máy sạch (xem docs/RELEASE-CHECKLIST-INTERNAL.md).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mainPath = path.join(root, 'electron', 'main.js');
const main = fs.readFileSync(mainPath, 'utf8');
const failures = [];

if (main.includes("HOSTNAME: '0.0.0.0'")) {
  failures.push('Electron server vẫn bind 0.0.0.0. Bản nội bộ phải chỉ nghe 127.0.0.1.');
}
if (main.includes("'-H', '0.0.0.0'")) {
  failures.push('Lệnh next start vẫn bind 0.0.0.0.');
}
if (!main.includes("HOSTNAME: '127.0.0.1'")) {
  failures.push('Không thấy HOSTNAME loopback trong electron/main.js.');
}
if (!main.includes("'-H', '127.0.0.1'")) {
  failures.push('Không thấy next start bind loopback trong electron/main.js.');
}
if (!main.includes('INTERIORFLOW_AUTO_UPDATE === \'1\'')) {
  failures.push('Auto-update chưa yêu cầu bật rõ ràng cho bản nội bộ.');
}
if (!main.includes('Dữ liệu chưa được mở để tránh ghi tiếp')) {
  failures.push('Lỗi đồng bộ schema chưa dừng khởi động với thông báo rõ ràng.');
}
if (!main.includes('snapshotBeforeUpgrade(userDataDir, dbPath)')) {
  failures.push('Thiếu snapshot DB + uploads trước khi kiểm tra schema của bản nâng cấp.');
}
if (!main.includes("path.join(userDataDir, 'backups'")) {
  failures.push('Thiếu thư mục backup phiên bản trong userData.');
}
// 04/09 — CSDL người dùng phải nâng cấp bằng `migrate deploy`, KHÔNG bằng `db push`.
// `db push` không có lịch sử, không có đường lùi, và được phép đổi/bỏ cột để ép CSDL
// khớp schema. Hai phép so dưới đây canh đúng lần đổi đó, chống tái phát.
if (!main.includes("'migrate', 'deploy'")) {
  failures.push('Đường nâng cấp CSDL không còn dùng `prisma migrate deploy`.');
}
if (main.includes("'db', 'push'")) {
  failures.push('Đường nâng cấp CSDL đã quay lại `prisma db push` trên dữ liệu người dùng.');
}

// ── Cổng macOS ───────────────────────────────────────────────────────────────
// 04/09 — macOS là NỀN TẢNG CHÍNH mà chủ dự án dùng hằng ngày. Ba phép soi dưới đây
// canh đúng ba thứ đã sửa/đã chốt trong lượt này, chống tái phát. Không phép nào
// thay được việc mở app trên máy Mac thật.

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const macCfg = pkg.build?.mac ?? {};

// ① Kiến trúc Mac: chủ dự án xác nhận CẢ HAI máy đều Apple Silicon ⇒ chỉ dựng arm64.
//    Nếu sau này thêm `x64`/`universal` thì Prisma PHẢI có engine darwin (x64) trong
//    `binaryTargets`, nếu không bản Intel mở lên sẽ không nối được CSDL. Soi cặp đôi
//    đó ở đây để không ai thêm kiến trúc mà quên engine.
const macArchs = (macCfg.target ?? []).flatMap((t) => (typeof t === 'string' ? [] : (t.arch ?? [])));
if (macArchs.includes('x64') || macArchs.includes('universal')) {
  const schema = fs.readFileSync(path.join(root, 'prisma', 'schema.prisma'), 'utf8');
  const targets = /binaryTargets\s*=\s*\[([^\]]*)\]/.exec(schema)?.[1] ?? '';
  if (!/"darwin"/.test(targets)) {
    failures.push(
      'build.mac dựng cho Intel/universal nhưng prisma/schema.prisma thiếu binaryTargets "darwin" ' +
        '⇒ bản Intel sẽ không tìm thấy Query Engine và không mở được CSDL.',
    );
  }
}

// ② Sẵn sàng ký: hardenedRuntime + entitlements phải luôn có mặt, để ngày có
//    Developer ID chỉ cần đặt biến môi trường, không phải sửa mã. Và `identity: null`
//    KHÔNG được quay lại — nó bắt electron-builder bỏ ký KỂ CẢ khi máy có chứng chỉ.
if (macCfg.identity === null) {
  failures.push('build.mac.identity = null đã quay lại — electron-builder sẽ bỏ ký kể cả khi máy CÓ chứng chỉ.');
}
if (macCfg.hardenedRuntime !== true) {
  failures.push('build.mac.hardenedRuntime chưa bật — không ký công chứng (notarize) được khi có chứng chỉ.');
}
for (const key of ['entitlements', 'entitlementsInherit']) {
  const rel = macCfg[key];
  if (!rel) {
    failures.push(`build.mac.${key} chưa khai.`);
  } else if (!fs.existsSync(path.join(root, rel))) {
    failures.push(`build.mac.${key} trỏ tới tệp không tồn tại: ${rel}`);
  }
}

// ③ Nhãn phím phải theo hệ. Chuỗi NGƯỜI DÙNG THẤY mà ghi "Ctrl+<phím>" nhưng không
//    kèm '⌘' là nói SAI với người dùng Mac — họ bấm ⌘, app bảo họ bấm Ctrl.
//    Nhãn đúng đi qua modKey()/useModKey() của lib/kbd.ts.
//    Soi bỏ qua dòng chú thích, và CHỈ soi components/ + lib/ (không tự soi chính mình —
//    bài học 04/09: máy soi quét văn bản mà không loại trừ chính nó thì báo quá tay).
const nhanPhimSai = [];
function soiNhanPhim(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') soiNhanPhim(p);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) continue;
    // lib/kbd.ts là CHÍNH bộ dịch nhãn — nó buộc phải viết cả hai nhánh '⌘…' và
    // 'Ctrl+…'. Soi chính nó thì máy soi tự bắt mình (bài học 04/09: máy soi quét
    // văn bản phải tự loại trừ mình ra khỏi vùng quét).
    if (path.relative(root, p) === path.join('lib', 'kbd.ts')) continue;
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
      // chỉ xét phần nằm trong dấu nháy — nhãn hiển thị, không phải mã
      for (const m of line.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
        const s = m[2];
        if (/Ctrl\+[A-Za-z0-9]/.test(s) && !s.includes('⌘')) {
          nhanPhimSai.push(`${path.relative(root, p)}:${i + 1}`);
          return;
        }
      }
    });
  }
}
for (const dir of ['components', 'lib']) {
  const abs = path.join(root, dir);
  if (fs.existsSync(abs)) soiNhanPhim(abs);
}
if (nhanPhimSai.length) {
  failures.push(
    `Nhãn phím gõ cứng "Ctrl+…" không kèm ⌘ (Mac sẽ đọc sai) tại: ${nhanPhimSai.join(', ')}. ` +
      'Dùng modKey()/useModKey() của lib/kbd.ts.',
  );
}

// ④ Phím chính (⌘ trên macOS · Ctrl nơi khác) phải đọc từ MỘT nguồn `lib/kbd.ts`.
//    Trước 04/09 có 50 chỗ tự viết `e.metaKey || e.ctrlKey` — cùng một biểu thức
//    khai 50 nơi, đúng bệnh "một danh sách nhiều bản". Ngoại lệ bên dưới là những
//    chỗ CỐ Ý đọc phím thô, mỗi chỗ kèm lý do; thêm ngoại lệ phải thêm lý do.
const ngoaiLePhimTho = new Map([
  ['components/studio/AppChrome.tsx', '⌃⌘Q khoá màn — cố ý đòi ĐỒNG THỜI Ctrl và ⌘, không phải phím chính'],
  ['components/photo-editor/DocCanvas.tsx', 'lấy mẫu clone kiểu Photoshop — ⌥/⌘ giữ chuột, không phải phím tắt bàn phím'],
  ['components/smartselect/SmartSelectModal.tsx', 'cử chỉ chuột loại-trừ-vùng, không phải phím tắt'],
  ['components/cad/CadCanvas.tsx', 'dựng KeyboardEvent giả cho nút chạm — đặt cả hai cờ nên đúng ở mọi hệ'],
  // 04/09: 3 tệp present-editor còn đọc thô, lane khác đang giữ. Xem báo cáo G7.
  ['components/present-editor/Element.tsx', 'lane Present đang giữ — di trú ở lượt sau'],
  ['components/present-editor/PresentEditor.tsx', 'lane Present đang giữ — di trú ở lượt sau'],
  ['components/present-editor/boq/BoqScreen.tsx', 'lane Present đang giữ — di trú ở lượt sau'],
]);
const phimTho = [];
function soiPhimTho(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') soiPhimTho(p);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) continue;
    const rel = path.relative(root, p);
    if (rel === path.join('lib', 'kbd.ts')) continue; // chính nguồn
    if (rel === path.join('lib', 'input', 'wheel.ts')) continue; // ctrlKey = cử chỉ chụm trackpad, trình duyệt tự đặt
    if (ngoaiLePhimTho.has(rel)) continue;
    fs.readFileSync(p, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        const t = line.trim();
        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
        if (/\.metaKey\b/.test(line) && /\.ctrlKey\b/.test(line)) phimTho.push(`${rel}:${i + 1}`);
      });
  }
}
for (const dir of ['components', 'lib', 'app']) {
  const abs = path.join(root, dir);
  if (fs.existsSync(abs)) soiPhimTho(abs);
}
if (phimTho.length) {
  failures.push(
    `Đọc phím sửa đổi thô (metaKey/ctrlKey) ngoài lib/kbd.ts tại: ${phimTho.join(', ')}. ` +
      'Dùng laPhimChinh()/coPhimHeThong() — hoặc khai ngoại lệ kèm lý do trong scripts/release-preflight.mjs.',
  );
}

if (failures.length) {
  console.error('Release preflight không đạt:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Release preflight đạt: loopback, snapshot/migration gate, và update opt-in đã hiện diện.');
