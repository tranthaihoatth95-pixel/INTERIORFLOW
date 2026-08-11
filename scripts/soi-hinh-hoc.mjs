#!/usr/bin/env node
/**
 * scripts/soi-hinh-hoc.mjs — máy soi HÌNH HỌC BO GÓC (cùng họ soi-frontier.mjs).
 * Chạy: `npm run soi:hinh-hoc` — quét components/ + app/globals.css, báo mọi giá trị
 * border-radius nằm NGOÀI thang cho phép (mảng ALLOWED dưới đây).
 *
 * Bối cảnh (Hoà chê 12/08): "bo góc không phát triển từ tâm, không nhất quán".
 * Gốc bệnh: HAI thang đang tồn tại song song —
 *   · SPEC-DESIGN-SYSTEM-IF:  6 / 9 / 12 / 16
 *   · app/globals.css:        10 / 14 / 20 / 28  (--radius-sm/md/lg/xl)
 * ⚠️ TẠM THỜI ALLOWED nạp CẢ HAI thang để không đỏ giả ~100 chỗ.
 *    Khi Hoà duyệt thang hợp nhất (docs/AUDIT-HINH-HOC-2026-08-12.md) thì SIẾT lại
 *    còn MỘT thang + các giá trị dẫn xuất đồng tâm (rInner = max(4, rOuter - pad)).
 *
 * Chế độ: mặc định BÁO CÁO, exit 0 luôn. Cờ `--strict` → exit 1 khi có vi phạm
 * (gắn CI/pre-push sau khi thang mới được duyệt).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const STRICT = process.argv.includes('--strict');

// ---- THANG CHO PHÉP (tạm nạp cả 2 thang cũ — xem ghi chú đầu file) ----
const ALLOWED = new Set([
  // thang SPEC-DESIGN-SYSTEM-IF
  6, 9, 12, 16,
  // thang globals.css (--radius-sm/md/lg/xl)
  10, 14, 20, 28,
  // dẫn xuất đồng tâm ĐÃ CHỐT §2c (bar 44/r22 đệm 5 → nút r17 → track r11)
  22, 17, 11,
  // vi mô: focus-ring, vạch, chấm — dưới ngưỡng cảm nhận "thang"
  0, 1, 2, 3, 4,
]);
const CAPSULE = new Set([999, 9999]); // capsule/tròn — luôn hợp lệ

const SCAN_DIRS = ['components'];
const SCAN_FILES = ['app/globals.css'];
const EXT = new Set(['.ts', '.tsx', '.css']);
const SKIP = new Set(['node_modules', '.next', '.worktrees', '.git', 'dist', 'out']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (EXT.has(name.slice(name.lastIndexOf('.')))) yield p;
  }
}

// 3 họ cú pháp: CSS `border-radius: 8px` · JSX `borderRadius: 8` · Tailwind `rounded-[8px]`
const RE = [
  { re: /border-radius:\s*([0-9.]+)px\b/g, kieu: 'css' },
  { re: /borderRadius:\s*([0-9.]+)\s*[,}]/g, kieu: 'jsx' },
  { re: /rounded-\[([0-9.]+)px\]/g, kieu: 'tw' },
];
// Tailwind class đặt tên → px (theo config mặc định)
const TW_NAMED = { 'rounded-sm': 2, 'rounded-md': 6, 'rounded-lg': 8, 'rounded-xl': 12, 'rounded-2xl': 16, 'rounded-3xl': 24 };

const viPham = new Map(); // giá_trị → tổng
const theoFile = new Map(); // file → số vi phạm
let tongQuet = 0;

function ghi(file, val) {
  tongQuet++;
  const n = Number(val);
  if (ALLOWED.has(n) || CAPSULE.has(n)) return;
  viPham.set(n, (viPham.get(n) ?? 0) + 1);
  theoFile.set(file, (theoFile.get(file) ?? 0) + 1);
}

const files = [];
for (const d of SCAN_DIRS) files.push(...walk(join(ROOT, d)));
for (const f of SCAN_FILES) files.push(join(ROOT, f));

for (const p of files) {
  const src = readFileSync(p, 'utf8');
  const rel = relative(ROOT, p);
  for (const { re } of RE) {
    re.lastIndex = 0;
    for (const m of src.matchAll(re)) ghi(rel, m[1]);
  }
  for (const [cls, px] of Object.entries(TW_NAMED)) {
    const c = src.split(cls).length - 1;
    for (let i = 0; i < c; i++) ghi(rel, px);
  }
}

// ---- In báo cáo ----
console.log('\nSOI HÌNH HỌC BO GÓC — ' + new Date().toISOString().slice(0, 10) + (STRICT ? ' (strict)' : ' (báo cáo)'));
console.log('Thang cho phép (TẠM — cả 2 thang cũ + dẫn xuất §2c): ' + [...ALLOWED].sort((a, b) => a - b).join(' / ') + ' + capsule 999');
console.log('─'.repeat(78));
const rows = [...viPham.entries()].sort((a, b) => b[1] - a[1]);
if (!rows.length) {
  console.log('✅ Không có giá trị bo góc ngoài thang.');
} else {
  console.log('🔴 GIÁ TRỊ NGOÀI THANG (giá trị → số lần):');
  for (const [v, c] of rows) console.log(`   ${String(v).padStart(5)}px  × ${c}`);
  console.log('\n🔎 TOP FILE VI PHẠM:');
  const tf = [...theoFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [f, c] of tf) console.log(`   ${String(c).padStart(4)}  ${f}`);
}
const tongViPham = rows.reduce((s, [, c]) => s + c, 0);
console.log('─'.repeat(78));
console.log(`Đã quét ${files.length} file · ${tongQuet} khai báo radius · ${tongViPham} ngoài thang (${rows.length} giá trị lẻ)\n`);
process.exit(STRICT && tongViPham ? 1 : 0);
