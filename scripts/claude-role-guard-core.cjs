'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Toán tử shell NỐI LỆNH: thứ ngăn một dòng thành nhiều khúc. Nằm NGOÀI quote thì là cấu trúc,
// nằm TRONG quote thì chỉ là dữ liệu — `rg "a|b" x` không hề mở ống, nó tìm chuỗi có gạch đứng.
// ⚠️ `<` và `>` KHÔNG còn nằm ở đây (v3 mục 2). Chúng không nối lệnh, chúng CHUYỂN HƯỚNG; mà
// muốn tha `2>&1` thì phải đọc được cả mô tả fd lẫn đích, và gộp chúng vào rọ toán tử chung
// làm mất đúng hai mẩu đó — `npx tsc --noEmit 2>&1` từng bị xé thành hai TỪ rời `2` và `1`.
const OPERATORS = new Set([';', '&', '|', '\n', '\r']);

// Khúc nối hợp lệ: `&&` · `||` · `|` · `;` · xuống dòng. `&` ĐƠN là chạy nền — nó tách tiến
// trình ra khỏi tầm nhìn của cổng, nên không bao giờ được tính là nối lệnh bình thường.
const NOI_OP = (op) => op === '&&' || op === '||' || op === '|' || /^[;\n\r]+$/.test(op);

// Chuyển hướng LÀNH: `>&N` nhân bản fd, `>/dev/null` đổ đi. Cả hai không sinh ra tệp nào, nên
// bắt chúng xin lease là bắt người kiểm trả giá cho một thói quen gõ lệnh. Mọi dạng còn lại —
// kể cả `<` đọc vào — giữ nguyên hạng cũ là mutation, và mutation không khai tệp thì nó đóng.
const CHUYEN_HUONG_LANH = (r) => (r.op === '>' || r.op === '>>') && (r.sao !== null || r.dich === '/dev/null');

// Quét một dòng lệnh thành TỪ + TOÁN TỬ + CHUYỂN HƯỚNG, biết quote. Trả null khi gặp thứ không
// đọc nổi: quote hở, thay-lệnh `$(…)` / backtick (kể cả trong nháy kép, nơi shell vẫn chạy
// chúng), hoặc chuyển hướng cụt đuôi — không đọc nổi thì đóng, không đoán.
function scan(text) {
  const source = String(text == null ? '' : text);
  const words = [];
  const ops = [];
  const segments = [[]];
  const redirects = [];
  let current = null;
  let cho = null; // chuyển hướng đang chờ đích: TỪ kế tiếp thuộc về NÓ, không thuộc argv
  const flush = () => {
    if (current === null) return;
    if (cho) { cho.dich = current; cho = null; }
    else { words.push(current); segments[segments.length - 1].push(current); }
    current = null;
  };
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') { if (i + 1 >= source.length) return null; current = (current === null ? '' : current) + source[i + 1]; i += 2; continue; }
    if (ch === "'") { const end = source.indexOf("'", i + 1); if (end < 0) return null; current = (current === null ? '' : current) + source.slice(i + 1, end); i = end + 1; continue; }
    if (ch === '"') {
      let buffer = '';
      i += 1;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\' && i + 1 < source.length) { buffer += source[i + 1]; i += 2; continue; }
        if (source[i] === '`' || (source[i] === '$' && source[i + 1] === '(')) return null;
        buffer += source[i];
        i += 1;
      }
      if (i >= source.length) return null;
      current = (current === null ? '' : current) + buffer;
      i += 1;
      continue;
    }
    if (ch === '`') return null;
    if (ch === '$' && source[i + 1] === '(') return null;
    if (ch === '>' || ch === '<') {
      // Chữ số DÍNH LIỀN ngay trước dấu là mô tả fd (`2>`), không phải một TỪ của lệnh. Có
      // khoảng trắng thì nó đã bị flush thành TỪ rồi — `head 2 > out` khác hẳn `head 2>out`.
      let fd = null;
      if (current !== null && /^\d+$/.test(current)) { fd = current; current = null; }
      flush();
      if (cho) return null; // chuyển hướng chồng chuyển hướng, cái trước chưa có đích
      let op = ch;
      i += 1;
      if (source[i] === ch) { op += ch; i += 1; }
      let sao = null;
      if (source[i] === '&') {
        i += 1;
        let so = '';
        while (i < source.length && /\d/.test(source[i])) { so += source[i]; i += 1; }
        if (source[i] === '-') { so += '-'; i += 1; }
        if (!so) return null; // `>&tệp` — dạng gộp cả hai luồng vào một TỆP, không đọc nổi ở đây
        sao = so;
      }
      const r = { op, fd, sao, dich: null, khuc: segments.length - 1 };
      redirects.push(r);
      if (sao === null) cho = r;
      continue;
    }
    if (OPERATORS.has(ch)) {
      flush();
      if (cho) return null; // `cmd > ; x` — chuyển hướng không có đích
      let op = '';
      while (i < source.length && OPERATORS.has(source[i])) { op += source[i]; i += 1; }
      ops.push(op);
      if (NOI_OP(op)) segments.push([]);
      continue;
    }
    if (/\s/.test(ch)) { flush(); i += 1; continue; }
    current = (current === null ? '' : current) + ch;
    i += 1;
  }
  flush();
  if (cho) return null; // `cmd >` — cụt đuôi
  return { words, ops, segments, redirects };
}

// argv của MỘT lệnh đơn. Có toán tử hoặc chuyển hướng ngoài quote ⇒ không phải argv đơn ⇒ null.
function argvSafe(command) {
  const scanned = scan(command);
  if (!scanned || scanned.ops.length || scanned.redirects.length || !scanned.words.length) return null;
  return scanned.words;
}

// Lệnh đọc thuần: không có đường nào ghi ra tệp nếu không có chuyển hướng (đã chặn ở scan).
const READ_BINS = new Set(['pwd', 'cat', 'head', 'tail', 'wc', 'basename', 'dirname', 'file', 'stat', 'du', 'date', 'printenv', 'which', 'sort', 'uniq', 'cut', 'tr', 'column', 'jq', 'diff', 'cmp', 'shasum', 'sha256sum', 'md5', 'tree', 'echo', 'printf', 'true', 'grep', 'egrep', 'fgrep']);
// `find` chạy được lệnh con và xoá được tệp — chỉ đọc khi không mang những vị từ đó.
const FIND_MUTATORS = new Set(['-exec', '-execdir', '-ok', '-okdir', '-delete', '-fprint', '-fprint0', '-fprintf', '-fls']);
const GIT_READ = new Set(['status', 'diff', 'show', 'log', 'rev-parse', 'ls-files', 'blame', 'describe']);
const GIT_UNSAFE_FLAGS = ['-c', '--config-env', '--ext-diff', '--textconv', '--output'];
// Cờ biến máy soi từ ĐỌC thành GHI.
const SOI_WRITE_FLAGS = /^--(ghi|fix|write|sua|viet|cap-nhat)/;

// Đối số nào của `rm`/`git rm` là TỆP: mọi thứ không phải cờ. Lọc kín — `rm -- -tep-la`
// mất tên tệp và rơi vào nhánh "chưa khai tệp", tức đóng, đúng chiều an toàn.
const dungTep = (args) => args.filter((v) => v !== '--' && !v.startsWith('-'));
// Cờ đệ quy, kể cả dạng gộp `-rf`. Đệ quy thì cổng KHÔNG đọc được ruột thư mục ⇒ phải
// đòi mục tiêu nằm HẲN BÊN TRONG một gốc allowlist, không được là chính cái gốc đó.
const coDeQuy = (args) => args.some((v) => v === '--recursive' || (/^-[A-Za-z]+$/.test(v) && /[rR]/.test(v.slice(1))));

// ── SỔ LỆNH ĐỌC (v3 mục 3) ────────────────────────────────────────────────────────────────
// Whitelist đọc là DỮ LIỆU, không phải mã. Nằm trong lõi thì nó đóng băng ở mức của ngày viết
// ra nó — vì mỗi lần sửa lõi là một lần phải chứng minh lại cả cổng — rồi chặn oan mọi lệnh
// đọc mới (ca thật: `git worktree list`, đúng thứ CLAUDE.md bắt chạy trước mỗi sprint).
// FAIL-CLOSED: sổ thiếu/hỏng ⇒ rổ RỖNG, rơi về whitelist cứng ở trên. Sổ hỏng mà mở toang thì
// tệp JSON này thành cần gạt tắt cổng, và xoá một tệp dữ liệu dễ hơn sửa lõi có test canh.
// Bin CHẠY MÃ TUỲ Ý: tên của chúng không nói lệnh nào sắp chạy, chỉ nói ai sắp chạy nó.
const THONG_DICH = new Set(['node', 'npx', 'npm', 'python', 'python3', 'sh', 'bash', 'zsh', 'perl', 'ruby', 'deno', 'bun', 'osascript', 'env', 'xargs', 'eval']);

const SO_MAC_DINH = path.join(__dirname, 'guard-lenh-doc.json');
const SO_CACHE = new Map();
function napSo(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const doc = (Array.isArray(parsed.doc) ? parsed.doc : [])
      .filter((e) => e && Array.isArray(e['argv-dau']) && e['argv-dau'].length && e['argv-dau'].every((v) => typeof v === 'string'))
      // ⛔ TIỀN TỐ LÀ TÊN THÔNG DỊCH VIÊN THÌ NÓ KHÔNG ĐỊNH DANH MỘT LỆNH NÀO CẢ.
      // `argv-dau: ["node"]` khớp MỌI `node <bất cứ gì>` ⇒ cả rổ rơi hạng READ: không lease,
      // không identity, mọi lane. Ca thật 01/09: một lane xin thêm đúng mục đó để chạy chế độ
      // `--check` của một kịch bản. `["node","-e"]` cũng vậy — dài hơn một từ nhưng vẫn là eval.
      // ⇒ Với thông dịch viên, mục chỉ hợp lệ khi có `phai-co` thu hẹp, HOẶC khi từ thứ hai là
      // một ĐƯỜNG DẪN cụ thể (không phải cờ). Thiếu ⇒ BỎ MỤC, đúng chiều fail-closed.
      // ⚠️ Luật này CHỈ áp cho thông dịch viên. Bản đầu 01/09 viết thành "tiền tố phải ≥2 từ"
      // và lập tức ăn oan `lsof` · `ps` · `printenv` — ba mục đọc một từ hoàn toàn lành.
      .filter((e) => !THONG_DICH.has(e['argv-dau'][0])
        || (Array.isArray(e['phai-co']) && e['phai-co'].length)
        || (e['argv-dau'].length >= 2 && !e['argv-dau'][1].startsWith('-')));
    const script = (Array.isArray(parsed['script-an-toan']) ? parsed['script-an-toan'] : []).filter((e) => e && Array.isArray(e.bin) && e.bin.length && typeof e.mau === 'string' && typeof e['co-out'] === 'string');
    return { doc, script };
  } catch { return { doc: [], script: [] }; }
}
function so() {
  const file = process.env.IF_GUARD_LENH_DOC || SO_MAC_DINH;
  if (!SO_CACHE.has(file)) SO_CACHE.set(file, napSo(file));
  return SO_CACHE.get(file);
}
// Khớp TIỀN TỐ argv, rồi loại theo `cam-co`: cùng một `bin` vẫn có biến thể GHI (`git branch`
// đọc, `git branch -D` xoá nhánh). Mẫu regex hỏng ⇒ mục không áp dụng, không đoán bừa.
function khopSo(argv, entry) {
  const dau = entry['argv-dau'];
  if (argv.length < dau.length) return false;
  for (let i = 0; i < dau.length; i += 1) if (argv[i] !== dau[i]) return false;
  const con = argv.slice(dau.length);
  for (const mau of Array.isArray(entry['cam-co']) ? entry['cam-co'] : []) {
    let re;
    try { re = new RegExp(mau); } catch { return false; }
    if (con.some((v) => re.test(v))) return false;
  }
  // ĐIỀU KIỆN DƯƠNG `phai-co` — MỌI mẫu phải khớp ít nhất một đối số. `cam-co` một mình chỉ
  // LOẠI TRỪ được, mà loại trừ thì phải kể hết cái xấu; muốn khai một chế độ CHỈ-ĐỌC của một
  // kịch bản (`--check`) thì phải nói được cái TỐT. Không có nó, cách duy nhất để khai là mở
  // tiền tố `node` — tức mở cả cổng. Mẫu hỏng ⇒ mục không áp dụng (fail-closed, như `cam-co`).
  for (const mau of Array.isArray(entry['phai-co']) ? entry['phai-co'] : []) {
    let re;
    try { re = new RegExp(mau); } catch { return false; }
    if (!con.some((v) => re.test(v))) return false;
  }
  return true;
}
// Script an toàn CÓ THAM SỐ GHI (v3 mục 8): sổ chỉ nói ĐÍCH GHI NẰM Ở ĐÂU. Đích đó vẫn đi qua
// đúng cửa ngoài-repo/allowlist như mọi mutation khác — đây không phải danh sách miễn kiểm.
//
// 🔴 GIẢ ĐỊNH NGẦM CỦA v3, VỠ NGÀY 01/09: mô hình này cho MỖI kịch bản ĐÚNG MỘT đích ghi. Kịch
// bản đa-chế-độ phá nó. Ca thật `design/seed-canvas.mjs` (đọc 464 dòng ruột):
//   seed        → `write(outPath, …)` :462, đúng một lời ghi vào `--out`  ✅ mô hình đúng
//   `--extract` → `mkdirSync(to)` :290 + `write(join(to, name), …)` :313-314, ghi N tệp vào
//                 `--to`, rồi `process.exit(0)` :319 — TRƯỚC KHI `--out` được đọc lần nào
// ⇒ `… --extract x.html --to <bất kỳ đâu> --out <tệp trong allowlist>`: cổng tìm thấy `--out`,
//   thấy đích hợp lệ, CHO QUA; kịch bản rẽ nhánh extract và ghi vào `--to` mà cổng chưa hề kiểm.
//   Một đường ghi ngoài allowlist, đi xuyên qua chính cái mục sổ được thêm để canh nó.
// `cam-co` bịt đúng nhánh đó: mục KHÔNG áp dụng khi argv mang cờ của một chế độ ghi khác, nên
// lệnh rơi lại vào "chưa khai tệp" — tức đóng. Đóng nhầm còn sửa được; mở nhầm thì không.
function dichGhiTuSo(argv) {
  for (const entry of so().script) {
    if (!entry.bin.includes(argv[0])) continue;
    let re;
    try { re = new RegExp(entry.mau); } catch { continue; }
    if (!argv.slice(1).some((v) => re.test(v))) continue;
    let cam = false;
    for (const mau of Array.isArray(entry['cam-co']) ? entry['cam-co'] : []) {
      let reCam;
      try { reCam = new RegExp(mau); } catch { cam = true; break; }
      if (argv.slice(1).some((v) => reCam.test(v))) { cam = true; break; }
    }
    if (cam) continue;
    const i = argv.indexOf(entry['co-out']);
    if (i < 0 || i + 1 >= argv.length) continue;
    const dich = argv[i + 1];
    if (!dich || dich.startsWith('-')) continue;
    return dich;
  }
  return null;
}

// Tiền tố gán biến môi trường (v3 mục 7): `VAR=x cmd …` phải phân loại theo `cmd`, không theo
// `VAR=x`. Thiếu mục này thì dạng inline `BOS_SESSION_ID=… node scripts/moc.mjs handoff …` —
// lệnh quản trị đúng luật — bị chặn chỉ vì cách truyền biến môi trường.
const GAN_BIEN = /^[A-Za-z_][A-Za-z0-9_]*=/;
function bocEnv(argv) { let i = 0; while (i < argv.length && GAN_BIEN.test(argv[i])) i += 1; return argv.slice(i); }

// Lệnh đưa dữ liệu RA KHỎI MÁY (v3 mục 4). Chúng vốn đã bị chặn vì không nằm trong whitelist
// nào; nhưng chặn chung một câu với "ghi sai tệp" thì người bị chặn không đọc được mình vừa
// chạm luật nào. Mục này TÁCH HẠNG và TÁCH THÔNG ĐIỆP — nó KHÔNG mở đường cho lệnh nào qua.
const EXTERNAL_BINS = new Set(['curl', 'wget', 'nc', 'ncat', 'netcat', 'telnet', 'ssh', 'scp', 'sftp', 'rsync', 'ftp']);

// CỜ PHÁT HÀNH của electron-builder. `--publish never` (dạng `electron:pack:*` vẫn dùng) chỉ
// đóng gói tại chỗ ⇒ vẫn là kiểm. Mọi giá trị khác — `always`, `onTag`, hay cờ trần không kèm
// giá trị — đều có thể ĐẨY BẢN DỰNG LÊN MẠNG, và hạng verify chạy được ở mọi lane không lease,
// nên để lọt một cờ ở đây là mở cửa phát hành cho bất kỳ phiên nào.
function coPhatHanh(rest) {
  for (let i = 0; i < rest.length; i += 1) {
    const v = rest[i];
    const m = /^(?:--publish|-p)(?:=(.*))?$/.exec(v);
    if (!m) continue;
    const giaTri = m[1] !== undefined ? m[1] : rest[i + 1];
    if (giaTri !== 'never') return true;
  }
  return false;
}

const READ = () => ({ kind: 'read', files: [] });
const VERIFY = () => ({ kind: 'verify', files: [] });
const MUTATION = (reason) => ({ kind: 'mutation', files: [], reason });
const EXTERNAL = (bin) => ({ kind: 'external', files: [], reason: `EXTERNAL — dữ liệu có thể rời máy (${bin})` });

// Phân loại MỘT lệnh đơn đã tách argv.
function classifyArgv(argvGoc) {
  const argv = bocEnv(argvGoc);
  const [bin, sub, ...rest] = argv;
  if (!bin) return MUTATION('lệnh rỗng');
  if (EXTERNAL_BINS.has(bin)) return EXTERNAL(bin);

  if (bin === 'ls' && !argv.some((v) => /^--(?:hide-control-chars|quoting-style=)/.test(v))) return READ();
  if (READ_BINS.has(bin)) return READ();
  if (bin === 'find' && !argv.some((v) => FIND_MUTATORS.has(v))) return READ();
  if (bin === 'rg' && !argv.includes('--pre') && !argv.includes('--hostname-bin')) return READ();
  if (bin === 'sed' && sub === '-n' && !argv.some((v) => v === '-i' || v.startsWith('--in-place'))) return READ();
  if (bin === 'git' && GIT_READ.has(sub) && !rest.some((v) => GIT_UNSAFE_FLAGS.some((x) => v === x || v.startsWith(`${x}=`)))) return READ();
  if (bin === 'node' && sub === '--check' && rest.length === 1) return READ();

  // Sổ lệnh đọc — phần MỞ RỘNG ĐƯỢC của whitelist trên. Đứng sau whitelist cứng để sổ hỏng
  // không bao giờ làm mất những lệnh đọc nền tảng.
  if (so().doc.some((entry) => khopSo(argv, entry))) return READ();

  // ── LỚP VERIFY: chạy được ở MỌI lane, không cần lease. Đây là thứ chứng minh một
  // thay đổi đúng; bắt nó xin lease là bắt người kiểm phải mượn quyền của người ghi.
  if (bin === 'npm' && sub === 'test' && rest.length === 0) return VERIFY();
  // `npm run <máy> -- <cờ>` truyền tiếp nguyên xi xuống máy soi ⇒ phải canh cờ GHI y như khi
  // gọi thẳng. Lỗ do writer `9e` phát hiện (không khai thác): `npm run soi:ban -- --ghi-ban`
  // lọt hạng VERIFY — tức đúng cái lệnh vừa phá 9 tệp bàn hôm 30/08 chạy được không cần lease.
  // `test:` là NHÁNH của `npm test` sau khi chuỗi test được tách làm ba (guard-v4 mục 1):
  // `test:ky-thuat` · `test:sweep` · `test:so-sach`. Thiếu tiền tố này thì người kiểm gọi được
  // cả chuỗi nhưng không gọi nổi một khúc — tức bắt họ chạy lại 27 cổng để xem 1 cổng.
  if (bin === 'npm' && sub === 'run' && /^(?:soi:|check:|test:|tsc$|test$|lint$)/.test(rest[0] || '') && !rest.slice(1).some((v) => SOI_WRITE_FLAGS.test(v))) return VERIFY();
  if (bin === 'npx' && sub === 'tsc' && rest.includes('--noEmit')) return VERIFY();
  // ── DỰNG BẢN: `next build` và `electron-builder` là bước CHỨNG MINH cuối — mã biên dịch được,
  // gói đóng được. Chúng chỉ ghi vào `.next/`/`dist/` (đều gitignore), không chạm mã nguồn, nên
  // bắt chúng xin lease là bắt người kiểm mượn quyền người ghi đúng lúc cần kiểm nhất (nợ
  // guard-v4 có tên trong sổ: `npx next build` bị chặn ngay lượt e2e 31/08).
  // ⛔ `--publish` KHÔNG lọt: nó đẩy bản dựng LÊN mạng — đó là phát hành, không phải kiểm.
  if (bin === 'npx' && sub === 'next' && rest[0] === 'build' && rest.length === 1) return VERIFY();
  if (bin === 'npx' && sub === 'electron-builder' && !coPhatHanh(rest)) return VERIFY();
  if (bin === 'node_modules/.bin/tsc' && argv.includes('--noEmit')) return VERIFY();
  if (bin === 'node_modules/.bin/sucrase-node' && rest.length === 0 && sub && /\.test\.ts$/.test(sub)) return VERIFY();
  // `soat-toan-dien` là máy SOI như họ `soi-*`, chỉ khác cái tên — nó không có một lệnh ghi nào
  // (`grep -n 'writeFileSync\|appendFileSync\|mkdirSync\|spawn\|execSync\|rmSync' scripts/soat-toan-dien.mjs`
  // ⇒ 0 dòng). Tên nằm ngoài khuôn `soi-` là lý do duy nhất nó từng bị đòi lease.
  if (bin === 'node' && /^scripts\/(?:soi-[\w-]+|nang-luc|soat-toan-dien)\.mjs$/.test(sub || '') && !rest.some((v) => SOI_WRITE_FLAGS.test(v))) return VERIFY();

  // Soi chính control-plane phải không cần quyền — nếu không, phiên bị chặn không có cách nào
  // biết TẠI SAO mình bị chặn. Đúng ca đầu phiên 31/08: `claude-lease.mjs status` bị khoá.
  if (bin === 'node' && sub === 'scripts/claude-lease.mjs' && (rest.length === 0 || rest[0] === 'status')) return READ();

  if (bin === 'node' && sub === 'scripts/moc.mjs') {
    const action = rest[0];
    if (['inbox', 'peek', 'namespace-view'].includes(action)) return READ();
    // `handoff <from> <to> …` cũng là lệnh quản trị, và ô `from` của nó là ô DANH TÍNH —
    // cùng vị trí với ô tác giả của im/ack/sent/danh-thuc/dispatch-attempt.
    if (['im', 'ack', 'sent', 'danh-thuc', 'dispatch-attempt', 'handoff'].includes(action)) {
      return { kind: 'governance', files: [], address: rest[1], action, handoffId: rest[2] };
    }
  }

  if (bin === 'git' && sub === 'add') return { kind: 'mutation', files: rest };

  // ── XOÁ CÓ KIỂM: `rm`/`git rm` mang danh sách tệp tường minh ra cổng rồi đi qua đúng
  // allowlist như mọi mutation khác. Trước 31/08 chúng rơi vào nhánh "không nằm trong danh
  // sách": chặn được, nhưng chặn MÙ — không lane nào xoá nổi tệp của chính mình.
  if (bin === 'rm') return { kind: 'mutation', files: dungTep(argv.slice(1)), recursive: coDeQuy(argv) };
  if (bin === 'git' && sub === 'rm') return { kind: 'mutation', files: dungTep(rest), recursive: coDeQuy(rest) };

  // ── COMMIT: chỉ dạng `-m` trên thứ ĐÃ add tường minh. `-a/-A/--all/--include/-p`
  // gom cả cây làm việc ⇒ commit vượt ra ngoài allowlist mà không khai một tệp nào.
  if (bin === 'git' && sub === 'commit') {
    const bulk = rest.some((v) => ['--all', '--include', '--patch', '-A'].includes(v) || (/^-[A-Za-z]+$/.test(v) && /[aApi]/.test(v.slice(1))));
    const message = rest.some((v) => v === '--message' || v.startsWith('--message=') || /^-[A-Za-z]*m$/.test(v));
    if (bulk) return MUTATION('git commit gom cả cây làm việc bị chặn — add tệp tường minh trước');
    if (!message) return MUTATION('git commit phải mang -m; commit mở editor thì treo phiên');
    return { kind: 'commit', files: [] };
  }

  // Script an toàn có tham số ghi — đích lấy TỪ CỜ đã khai trong sổ, rồi đi tiếp qua đúng
  // đường kiểm ngoài-repo/allowlist. Không khớp sổ, hoặc khớp mà thiếu cờ, thì rơi xuống dưới.
  const dichGhi = dichGhiTuSo(argv);
  if (dichGhi) return { kind: 'mutation', files: [dichGhi] };

  return MUTATION('lệnh không nằm trong danh sách đọc/verify');
}

function classifyBash(command) {
  const scanned = scan(command);
  if (!scanned) return MUTATION('shell composition/redirect/subshell bị chặn');
  // v3 mục 1: chuỗi nối bằng `&&`/`;`/xuống-dòng đi CÙNG một logic đã có sẵn cho ống `|` —
  // mọi khúc đều đọc thì cả chuỗi là đọc. Chỉ `&` đơn (chạy nền) là vẫn đóng thẳng.
  if (scanned.ops.some((op) => !NOI_OP(op))) return MUTATION('shell composition/subshell bị chặn');
  // v3 mục 2: chuyển hướng lành đi qua; ghi ra TỆP THẬT thì cả lệnh là mutation, và nó không
  // khai được tệp nào ra cổng nên rơi đúng vào nhánh "chưa khai tệp" — tức đóng.
  if (scanned.redirects.some((r) => !CHUYEN_HUONG_LANH(r))) return MUTATION('chuyển hướng ghi ra tệp bị chặn');
  const segments = scanned.segments;
  if (!segments.length || segments.some((argv) => argv.length === 0)) return MUTATION('chuỗi lệnh có khúc rỗng');
  const parts = segments.map(classifyArgv);
  // Một khúc rời máy thì cả chuỗi mang hạng EXTERNAL: `git status && curl …` không được đọc
  // thành "chỉ là một lệnh ghi", vì thứ đang xảy ra là dữ liệu đi ra ngoài.
  const ngoai = parts.find((part) => part.kind === 'external');
  if (ngoai) return ngoai;
  if (parts.every((part) => part.kind === 'read')) return READ();
  if (parts.every((part) => part.kind === 'read' || part.kind === 'verify')) return VERIFY();
  // Chuỗi có khúc ghi thì cả chuỗi là ghi, và KHÔNG thừa kế danh sách tệp của khúc nào —
  // `cat x | tee y` phải rơi vào nhánh "chưa khai tệp", không được mượn tệp của `cat`; cũng
  // vậy với `git log && rm <tệp trong lease>`, nếu không khúc đọc đứng trước sẽ cho khúc xoá
  // mượn quyền của mình.
  if (segments.length > 1) return MUTATION('chuỗi lệnh có khúc mutation');
  return parts[0];
}

function parseAddress(system, lane) {
  if (system !== 'cl' || !/^\d{2}$/.test(lane || '')) return null;
  return { system, lane, address: `${system}:${lane}` };
}

function isAllowed(candidate, allowlist, cwd) {
  const exact = path.resolve(cwd, candidate);
  return allowlist.some((allowed) => { const root = path.resolve(cwd, allowed); return exact === root || exact.startsWith(`${root}${path.sep}`); });
}

// Nhà riêng của CÔNG CỤ, không phải repo: `~/.claude` và scratchpad `/private/tmp/claude-*`.
// Guard này canh repo; bắt phiên xin lease để ghi vào thư mục tạm của chính nó là bắt người
// thợ xin phép để mở hộp đồ nghề. Nguồn: PROPOSAL HO-guard-v2 §4, qua cl:07 30/08, Hoà chưa
// phủ quyết. ⚠️ `.claude/` TRONG repo KHÔNG dính luật này — nó resolve dưới cwd, không dưới HOME.
const TIEN_TO_TAM = '/private/tmp/claude-';

// Đường THẬT của một đường dẫn: giải hết symlink. Tệp chưa tồn tại thì lùi dần lên tổ tiên gần
// nhất còn tồn tại rồi ghép lại — thứ cần giải là các THƯ MỤC trên đường đi, không phải cái lá.
// v3 mục 10: thiếu bước này, một symlink đặt trong nhà công cụ mà trỏ ngược về repo sẽ được
// tính là "ngoài repo" chỉ vì chuỗi đường dẫn trông giống — tức một cửa hậu ghi thẳng vào mã
// sản xuất không cần lease. ⚠️ Phần symlink của `phieu-ca.mjs` là một nợ KHÁC, chưa đụng.
function duongThat(abs) {
  let con = abs;
  const duoi = [];
  for (;;) {
    try { return path.join(fs.realpathSync(con), ...duoi.slice().reverse()); }
    catch {
      const cha = path.dirname(con);
      if (cha === con) return abs;
      duoi.push(path.basename(con));
      con = cha;
    }
  }
}

function ngoaiRepo(file, env, cwd) {
  const abs = duongThat(path.resolve(cwd, file));
  const nha = duongThat(path.join(env.HOME || os.homedir(), '.claude'));
  if (abs === nha || abs.startsWith(`${nha}${path.sep}`)) return { ngoai: true, goc: abs === nha };
  if (abs.startsWith(TIEN_TO_TAM)) return { ngoai: true, goc: abs === TIEN_TO_TAM };
  return { ngoai: false, goc: false };
}

// Allowlist workspace của lane, đọc từ env. Chú thích trong .claude/settings.json đã hứa
// biến này từ 29/08; tới 30/08 vẫn chưa dòng mã nào đọc nó — lời hứa treo, nay nối thật.
function parseAllowlist(raw) {
  return String(raw == null ? '' : raw).split(/[:,\n]/).map((v) => v.trim()).filter(Boolean);
}

const READ_TOOLS = new Set(['Read', 'Grep', 'Glob', 'NotebookRead']);
const FILE_KEYS = ['file_path', 'notebook_path', 'relative_path', 'path', 'filepath'];

function filesFromInput(input) {
  const files = [];
  for (const key of FILE_KEYS) if (typeof input[key] === 'string' && input[key].trim()) files.push(input[key]);
  if (Array.isArray(input.paths)) for (const v of input.paths) if (typeof v === 'string' && v.trim()) files.push(v);
  return files;
}

function inspect(toolName, input) {
  if (toolName === 'Bash') return { ...classifyBash(input.command), command: input.command || '' };
  if (READ_TOOLS.has(toolName)) return { kind: 'read', files: [] };
  // Mặc định là GHI, kể cả tool chưa biết tên. Lỗ #5 đo 30/08: nhánh mặc định cũ trả `read`,
  // nên mọi công cụ sửa tệp ngoài Write/Edit/Bash (NotebookEdit, họ MCP) đi thẳng qua cổng.
  return { kind: 'mutation', files: filesFromInput(input) };
}

const BULK = new Set(['-A', '--all', '.', '*']);

function evaluate({ env, hook, lease = null, now = Date.now(), cwd = process.cwd(), staged = null, handoffTo = null, giuPhien = null }) {
  const operation = inspect(hook.tool_name, hook.tool_input || {});
  if (operation.kind === 'read') return { allow: true, mutation: false, operation };
  if (operation.kind === 'verify') return { allow: true, mutation: false, verify: true, operation };
  // Hạng EXTERNAL đứng TRƯỚC mọi chốt danh tính: không lane nào, không lease nào mở được nó.
  // Đường ra ngoài máy là quyết định của người, đi qua `scripts/chon-tuyen.mjs`, không đi qua đây.
  if (operation.kind === 'external') return { allow: false, reason: operation.reason, operation };
  const identity = parseAddress(env.IF_SYSTEM, env.IF_LANE);
  if (!identity) return { allow: false, reason: 'IDENTITY: mutation cần IF_SYSTEM=cl và IF_LANE=NN', operation };
  const taskId = env.IF_TASK_ID || '';
  const sessionId = env.IF_SESSION_ID || env.CLAUDE_SESSION_ID || hook.session_id || '';
  const stamp = { system: identity.system, role: identity.address, task: taskId || 'MISSING', lease: env.IF_LEASE_ID || 'MISSING', session: sessionId || 'MISSING', kind: operation.kind, files: operation.files };
  if (!taskId || !sessionId) return { allow: false, reason: 'CONTRACT: thiếu TASK/SESSION', stamp, operation };
  if (operation.kind === 'governance') {
    if (operation.address !== identity.address) return { allow: false, reason: 'GOVERNANCE: địa chỉ lệnh không khớp identity', stamp, operation };
    // ĐIỀU PHỐI: `danh-thuc` gõ vào phiên của người khác, nên đích của nó là chuyện quyền hạn.
    // Đích KHÔNG nằm trong argv mà nằm trong sổ cầu ⇒ phải tra sổ mới chấm được. cl:00 là
    // người điều phối nên đánh thức được mọi đích; lane thường chỉ đánh thức phiếu gửi tới mình.
    if (operation.action === 'danh-thuc' && identity.lane !== '00') {
      const dich = typeof handoffTo === 'function' ? handoffTo(operation.handoffId) : null;
      if (!dich) return { allow: false, reason: `GOVERNANCE: không tra được đích của phiếu ${operation.handoffId || '(thiếu id)'}`, stamp, operation };
      if (dich !== identity.address) return { allow: false, reason: `GOVERNANCE: chỉ cl:00 đánh thức địa chỉ khác (phiếu tới ${dich})`, stamp, operation };
    }
    return { allow: true, mutation: true, governance: true, stamp, operation };
  }
  // ⚠️ THỨ TỰ CÓ Ý NGHĨA (v3 mục 6). Cửa NGOÀI-REPO đi TRƯỚC chốt lane-00. Bản v2 đặt chốt
  // `cl:00 read/route-only` lên trước, và hệ quả không ai định: phiên ĐIỀU PHỐI không ghi nổi
  // memory hay scratchpad của chính nó — hai thứ nằm trong nhà công cụ, chẳng dính gì tới sản
  // phẩm. Guard này canh REPO; chốt lane-00 vẫn nguyên vẹn với mọi đường TRONG repo bên dưới.
  // Commit là thao tác trên CHỈ MỤC đã khai tường minh trước đó ⇒ nó không mang tệp.
  if (operation.kind !== 'commit') {
    if (operation.files.length === 0) return { allow: false, reason: `FILES: ${hook.tool_name} mutation phải khai tệp tường minh`, stamp, operation };
    if (operation.files.some((v) => BULK.has(v) || /[*?]/.test(v))) return { allow: false, reason: 'FILES: cấm bulk/glob staging', stamp, operation };
    // Cả lô nằm trong nhà công cụ ⇒ ra ngoài phạm vi guard, không đòi lease. Lô TRỘN
    // trong-ngoài thì rơi xuống luật của repo, vì phần trong repo mới là thứ được canh.
    if (operation.files.every((file) => ngoaiRepo(file, env, cwd).ngoai)) {
      if (operation.recursive && operation.files.some((file) => ngoaiRepo(file, env, cwd).goc)) {
        return { allow: false, reason: 'FILES: cấm xoá đệ quy chính gốc nhà công cụ', stamp, operation };
      }
      return { allow: true, mutation: true, ngoaiRepo: true, stamp, operation };
    }
  }

  if (identity.lane === '00') return { allow: false, reason: 'ROLE: cl:00 là read/route-only', stamp, operation };

  let allowlist;
  if (identity.lane === '06') {
    if (!lease || lease.status !== 'ACTIVE') return { allow: false, reason: 'LEASE: không có lease sống trong control-plane', stamp, operation };
    if (lease.expires_at <= now) return { allow: false, reason: 'LEASE: stale', stamp, operation };
    if (lease.system !== identity.system || lease.lane !== identity.lane || lease.session_id !== sessionId || lease.task_id !== taskId || lease.lease_id !== env.IF_LEASE_ID) return { allow: false, reason: 'LEASE: wrong system/lane/session/task/id', stamp, operation };
    // ── Ô "PHIÊN ĐANG GIỮ" (guard-v4 mục 3). Mọi ô ở trên đọc từ ENV, mà env CHÉP ĐƯỢC: hai cửa
    // sổ mở cùng bộ biến thì cả hai qua hết. `hook.session_id` là thứ duy nhất ở đây do công cụ
    // cấp chứ không do người truyền vào ⇒ nó phân biệt được hai phiên. Xem `claimant()`.
    // Không đọc nổi danh tính phiên (`phienThat` rỗng) thì KHÔNG chấm — chặn một phiên vì công
    // cụ quên gửi id là chặn oan, và ca thật cần bắt là hai phiên ĐỀU CÓ id.
    const phienThat = hook.session_id || '';
    const nguoiGiu = typeof giuPhien === 'function' ? giuPhien(lease.lease_id, phienThat) : null;
    if (phienThat && nguoiGiu && nguoiGiu !== phienThat) return { allow: false, reason: `LEASE: phiên ${nguoiGiu} đang giữ lease này; phiên ${phienThat} không cầm bút`, stamp, operation };
    allowlist = lease.files;
  } else {
    // Lane khác 06 không cầm quyền ghi production, nhưng có workspace riêng của mình.
    if (operation.kind === 'commit') return { allow: false, reason: `ROLE: ${identity.address} không được commit; commit là quyền cl:06 có lease`, stamp, operation };
    allowlist = parseAllowlist(env.IF_FILE_ALLOWLIST);
    if (!allowlist.length) return { allow: false, reason: `ROLE: ${identity.address} cần IF_FILE_ALLOWLIST để ghi workspace của lane`, stamp, operation };
  }

  // ── COMMIT ĐỐI CHIẾU CHỈ MỤC: 147f66a lọt vì cổng chỉ nhìn DẠNG lệnh. Thứ thật sự sắp
  // thành commit là CHỈ MỤC — nó có thể mang tệp mà chẳng lượt `git add` nào khai ra cổng.
  if (operation.kind === 'commit') {
    const chiMuc = typeof staged === 'function' ? staged() : null;
    if (!Array.isArray(chiMuc)) return { allow: false, reason: 'COMMIT: không đọc được chỉ mục (git diff --cached --name-only)', stamp, operation };
    if (!chiMuc.length) return { allow: false, reason: 'COMMIT: chỉ mục rỗng — add tệp tường minh trước', stamp, operation };
    stamp.files = chiMuc;
    const lech = chiMuc.filter((file) => !isAllowed(file, allowlist, cwd));
    if (lech.length) return { allow: false, reason: `COMMIT: chỉ mục có tệp ngoài allow-list: ${lech.join(', ')}`, stamp, operation };
  }

  const outside = operation.files.filter((file) => !isAllowed(file, allowlist, cwd));
  if (outside.length) return { allow: false, reason: `FILES: ngoài allow-list: ${outside.join(', ')}`, stamp, operation };
  if (operation.recursive) {
    const goc = operation.files.filter((file) => allowlist.some((allowed) => path.resolve(cwd, allowed) === path.resolve(cwd, file)));
    if (goc.length) return { allow: false, reason: `FILES: cấm xoá đệ quy chính gốc allow-list: ${goc.join(', ')}`, stamp, operation };
  }
  return { allow: true, mutation: true, stamp, operation };
}

module.exports = { argvSafe, classifyArgv, classifyBash, duongThat, evaluate, filesFromInput, inspect, isAllowed, napSo, ngoaiRepo, parseAddress, parseAllowlist, scan };
