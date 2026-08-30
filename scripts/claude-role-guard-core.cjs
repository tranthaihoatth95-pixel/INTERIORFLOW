'use strict';
const path = require('node:path');

// Toán tử shell: thứ nối/chuyển hướng lệnh. Nằm NGOÀI quote thì là cấu trúc, nằm TRONG quote
// thì chỉ là dữ liệu — `rg "a|b" x` không hề mở ống, nó tìm chuỗi có gạch đứng.
const OPERATORS = new Set([';', '&', '|', '<', '>', '\n', '\r']);

// Quét một dòng lệnh thành TỪ + TOÁN TỬ, biết quote. Trả null khi gặp thứ không đọc nổi:
// quote hở, thay-lệnh `$(…)` / backtick (kể cả trong nháy kép, nơi shell vẫn chạy chúng).
function scan(text) {
  const source = String(text == null ? '' : text);
  const words = [];
  const ops = [];
  const segments = [[]];
  let current = null;
  const flush = () => { if (current !== null) { words.push(current); segments[segments.length - 1].push(current); current = null; } };
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
    if (OPERATORS.has(ch)) {
      flush();
      let op = '';
      while (i < source.length && OPERATORS.has(source[i])) { op += source[i]; i += 1; }
      ops.push(op);
      if (op === '|') segments.push([]);
      continue;
    }
    if (/\s/.test(ch)) { flush(); i += 1; continue; }
    current = (current === null ? '' : current) + ch;
    i += 1;
  }
  flush();
  return { words, ops, segments };
}

// argv của MỘT lệnh đơn. Có toán tử ngoài quote ⇒ không phải argv đơn ⇒ null.
function argvSafe(command) {
  const scanned = scan(command);
  if (!scanned || scanned.ops.length || !scanned.words.length) return null;
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

const READ = () => ({ kind: 'read', files: [] });
const VERIFY = () => ({ kind: 'verify', files: [] });
const MUTATION = (reason) => ({ kind: 'mutation', files: [], reason });

// Phân loại MỘT lệnh đơn đã tách argv.
function classifyArgv(argv) {
  const [bin, sub, ...rest] = argv;
  if (!bin) return MUTATION('lệnh rỗng');

  if (bin === 'ls' && !argv.some((v) => /^--(?:hide-control-chars|quoting-style=)/.test(v))) return READ();
  if (READ_BINS.has(bin)) return READ();
  if (bin === 'find' && !argv.some((v) => FIND_MUTATORS.has(v))) return READ();
  if (bin === 'rg' && !argv.includes('--pre') && !argv.includes('--hostname-bin')) return READ();
  if (bin === 'sed' && sub === '-n' && !argv.some((v) => v === '-i' || v.startsWith('--in-place'))) return READ();
  if (bin === 'git' && GIT_READ.has(sub) && !rest.some((v) => GIT_UNSAFE_FLAGS.some((x) => v === x || v.startsWith(`${x}=`)))) return READ();
  if (bin === 'node' && sub === '--check' && rest.length === 1) return READ();

  // ── LỚP VERIFY: chạy được ở MỌI lane, không cần lease. Đây là thứ chứng minh một
  // thay đổi đúng; bắt nó xin lease là bắt người kiểm phải mượn quyền của người ghi.
  if (bin === 'npm' && sub === 'test' && rest.length === 0) return VERIFY();
  if (bin === 'npm' && sub === 'run' && /^(?:soi:|check:|tsc$|test$|lint$)/.test(rest[0] || '')) return VERIFY();
  if (bin === 'npx' && sub === 'tsc' && rest.includes('--noEmit')) return VERIFY();
  if (bin === 'node_modules/.bin/tsc' && argv.includes('--noEmit')) return VERIFY();
  if (bin === 'node_modules/.bin/sucrase-node' && rest.length === 0 && sub && /\.test\.ts$/.test(sub)) return VERIFY();
  if (bin === 'node' && /^scripts\/(?:soi-[\w-]+|nang-luc)\.mjs$/.test(sub || '') && !rest.some((v) => SOI_WRITE_FLAGS.test(v))) return VERIFY();

  // Soi chính control-plane phải không cần quyền — nếu không, phiên bị chặn không có cách nào
  // biết TẠI SAO mình bị chặn. Đúng ca đầu phiên 31/08: `claude-lease.mjs status` bị khoá.
  if (bin === 'node' && sub === 'scripts/claude-lease.mjs' && (rest.length === 0 || rest[0] === 'status')) return READ();

  if (bin === 'node' && sub === 'scripts/moc.mjs') {
    const action = rest[0];
    if (['inbox', 'peek', 'namespace-view'].includes(action)) return READ();
    if (['im', 'ack', 'sent', 'danh-thuc', 'dispatch-attempt'].includes(action)) return { kind: 'governance', files: [], address: rest[1], action };
  }

  if (bin === 'git' && sub === 'add') return { kind: 'mutation', files: rest };

  // ── COMMIT: chỉ dạng `-m` trên thứ ĐÃ add tường minh. `-a/-A/--all/--include/-p`
  // gom cả cây làm việc ⇒ commit vượt ra ngoài allowlist mà không khai một tệp nào.
  if (bin === 'git' && sub === 'commit') {
    const bulk = rest.some((v) => ['--all', '--include', '--patch', '-A'].includes(v) || (/^-[A-Za-z]+$/.test(v) && /[aApi]/.test(v.slice(1))));
    const message = rest.some((v) => v === '--message' || v.startsWith('--message=') || /^-[A-Za-z]*m$/.test(v));
    if (bulk) return MUTATION('git commit gom cả cây làm việc bị chặn — add tệp tường minh trước');
    if (!message) return MUTATION('git commit phải mang -m; commit mở editor thì treo phiên');
    return { kind: 'commit', files: [] };
  }

  return MUTATION('lệnh không nằm trong danh sách đọc/verify');
}

function classifyBash(command) {
  const scanned = scan(command);
  if (!scanned) return MUTATION('shell composition/redirect/subshell bị chặn');
  if (scanned.ops.some((op) => op !== '|')) return MUTATION('shell composition/redirect/subshell bị chặn');
  const segments = scanned.segments;
  if (!segments.length || segments.some((argv) => argv.length === 0)) return MUTATION('ống có khúc rỗng');
  const parts = segments.map(classifyArgv);
  if (parts.every((part) => part.kind === 'read')) return READ();
  if (parts.every((part) => part.kind === 'read' || part.kind === 'verify')) return VERIFY();
  // Ống mà có khúc ghi thì cả ống là ghi, và KHÔNG thừa kế danh sách tệp của khúc nào —
  // `cat x | tee y` phải rơi vào nhánh "chưa khai tệp", không được mượn tệp của `cat`.
  if (segments.length > 1) return MUTATION('ống có khúc mutation');
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

function evaluate({ env, hook, lease = null, now = Date.now(), cwd = process.cwd() }) {
  const operation = inspect(hook.tool_name, hook.tool_input || {});
  if (operation.kind === 'read') return { allow: true, mutation: false, operation };
  if (operation.kind === 'verify') return { allow: true, mutation: false, verify: true, operation };
  const identity = parseAddress(env.IF_SYSTEM, env.IF_LANE);
  if (!identity) return { allow: false, reason: 'IDENTITY: mutation cần IF_SYSTEM=cl và IF_LANE=NN', operation };
  const taskId = env.IF_TASK_ID || '';
  const sessionId = env.IF_SESSION_ID || env.CLAUDE_SESSION_ID || hook.session_id || '';
  const stamp = { system: identity.system, role: identity.address, task: taskId || 'MISSING', lease: env.IF_LEASE_ID || 'MISSING', session: sessionId || 'MISSING', kind: operation.kind, files: operation.files };
  if (!taskId || !sessionId) return { allow: false, reason: 'CONTRACT: thiếu TASK/SESSION', stamp, operation };
  if (operation.kind === 'governance') {
    if (operation.address !== identity.address) return { allow: false, reason: 'GOVERNANCE: địa chỉ lệnh không khớp identity', stamp, operation };
    return { allow: true, mutation: true, governance: true, stamp, operation };
  }
  if (identity.lane === '00') return { allow: false, reason: 'ROLE: cl:00 là read/route-only', stamp, operation };

  // Commit là thao tác trên CHỈ MỤC đã khai tường minh trước đó ⇒ nó không mang tệp.
  if (operation.kind !== 'commit') {
    if (operation.files.length === 0) return { allow: false, reason: `FILES: ${hook.tool_name} mutation phải khai tệp tường minh`, stamp, operation };
    if (operation.files.some((v) => BULK.has(v) || /[*?]/.test(v))) return { allow: false, reason: 'FILES: cấm bulk/glob staging', stamp, operation };
  }

  let allowlist;
  if (identity.lane === '06') {
    if (!lease || lease.status !== 'ACTIVE') return { allow: false, reason: 'LEASE: không có lease sống trong control-plane', stamp, operation };
    if (lease.expires_at <= now) return { allow: false, reason: 'LEASE: stale', stamp, operation };
    if (lease.system !== identity.system || lease.lane !== identity.lane || lease.session_id !== sessionId || lease.task_id !== taskId || lease.lease_id !== env.IF_LEASE_ID) return { allow: false, reason: 'LEASE: wrong system/lane/session/task/id', stamp, operation };
    allowlist = lease.files;
  } else {
    // Lane khác 06 không cầm quyền ghi production, nhưng có workspace riêng của mình.
    if (operation.kind === 'commit') return { allow: false, reason: `ROLE: ${identity.address} không được commit; commit là quyền cl:06 có lease`, stamp, operation };
    allowlist = parseAllowlist(env.IF_FILE_ALLOWLIST);
    if (!allowlist.length) return { allow: false, reason: `ROLE: ${identity.address} cần IF_FILE_ALLOWLIST để ghi workspace của lane`, stamp, operation };
  }

  const outside = operation.files.filter((file) => !isAllowed(file, allowlist, cwd));
  if (outside.length) return { allow: false, reason: `FILES: ngoài allow-list: ${outside.join(', ')}`, stamp, operation };
  return { allow: true, mutation: true, stamp, operation };
}

module.exports = { argvSafe, classifyArgv, classifyBash, evaluate, filesFromInput, inspect, isAllowed, parseAddress, parseAllowlist, scan };
