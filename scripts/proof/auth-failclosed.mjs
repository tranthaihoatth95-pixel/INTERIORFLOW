#!/usr/bin/env node
/**
 * scripts/proof/auth-failclosed.mjs — RUNTIME PROOF cho Wave 0 · fail-closed AUTH_SECRET.
 *
 * Vì sao cần bundle chứ không import thẳng `middleware.ts` (đã thử và hỏng, ghi lại để
 * người sau khỏi mất công lần nữa):
 *   1. `require()` thẳng → `jose` là ESM, Node từ chối.
 *   2. `sucrase --transforms typescript` (CLI, không -d) → ghi ra TỆP RỖNG, "nạp được"
 *      là nạp module trống. Đây là bẫy nguy hiểm nhất: test XANH GIẢ.
 *   3. esbuild `--format=esm` → `next/server` không resolve được ngoài ngữ cảnh Next;
 *      bundle ESM thì vỡ vì phụ thuộc CJS dùng `__dirname`.
 *   ⇒ Đường đi được: esbuild `--bundle --format=cjs` rồi `require()`.
 *
 * Chạy: node scripts/proof/auth-failclosed.mjs
 */
import { spawnSync } from 'node:child_process';
import { rmSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const repo = process.cwd();
const out = join(repo, '.proof-middleware.cjs');

const build = spawnSync('npx', ['esbuild', 'middleware.ts', '--bundle', '--format=cjs',
  '--platform=node', `--outfile=${out}`, '--log-level=error'], { cwd: repo, encoding: 'utf8' });
if (build.status !== 0) {
  console.error('Không dịch được middleware.ts:', build.stderr?.slice(0, 300));
  process.exit(2);
}

/* ══════════════ CA 0 · CỔNG HARNESS (thêm 27/08) ══════════════
 *
 * ⚠️ Script này là script DUY NHẤT trong `scripts/proof/` từng KHÔNG có cổng harness, và đó là
 * một nghịch lý đắt: docstring ngay phía trên kể lại đúng sự cố F-15 — công cụ sinh ra một tệp
 * RỖNG, thoát mã 0, `require()` thành công, in `LOADED` — rồi **ca thứ hai của chính nó lại mong
 * đúng chữ `LOADED`**. Nghĩa là nếu esbuild im lặng sinh bundle rỗng:
 *     · ca 1 (mong `THREW`) đỏ ⇒ ta được cứu TÌNH CỜ, y hệt lần F-15;
 *     · ca 2 và ca 3 **XANH TRÊN MỘT MODULE RỖNG**.
 *
 * `build.status !== 0` ở trên là kiểm **mã thoát của công cụ** — đúng cái gốc mà F-15 kết luận
 * là sai. Cổng dưới đây kiểm **SẢN PHẨM của công cụ**: tệp có thân, và nạp được thì thật sự
 * mang thứ ta định soi.
 *
 * Lane `IF-RELEASE-QA-001` tìm ra chỗ này khi soi lại toàn bộ ma trận proof. Cổng harness không
 * tự mọc ở nơi nó cần nhất; phải có người đi soi từng cái. */
{
  const loi = [];
  if (!existsSync(out)) loi.push('esbuild thoát 0 nhưng KHÔNG có tệp đầu ra');
  else if (statSync(out).size < 1024) loi.push(`bundle chỉ ${statSync(out).size} byte — rỗng hoặc cụt`);
  else {
    // Nạp một lần với đủ điều kiện để KHÔNG ném, rồi đòi module thật sự phơi ra `middleware`.
    // Bundle rỗng `require()` được nhưng `exports` trống ⇒ chết ở đây, đúng chỗ nó phải chết.
    const kiem = spawnSync(process.execPath, ['-e',
      `process.env.NODE_ENV='development';delete process.env.AUTH_SECRET;` +
      `const m=require(${JSON.stringify(out)});` +
      `console.log(typeof m.middleware==='function'?'CO_MIDDLEWARE':'THIEU_MIDDLEWARE:'+Object.keys(m).join(','));`,
    ], { cwd: repo, encoding: 'utf8' });
    const ra = `${kiem.stdout ?? ''}${kiem.stderr ?? ''}`;
    if (!/CO_MIDDLEWARE/.test(ra)) loi.push(`module nạp được nhưng không phơi \`middleware\`: ${ra.trim().slice(0, 160)}`);
  }

  if (loi.length) {
    console.error('\n⛔ CA 0 · CỔNG HARNESS ĐỎ — KHÔNG in ĐẠT cho ca nào phía sau.');
    for (const l of loi) console.error(`   · ${l}`);
    console.error('   Đây đúng là bẫy F-15: bộ máy xanh vì nó không soi gì cả.');
    rmSync(out, { force: true });
    process.exit(1);
  }
  console.log(`  ok  CA 0 · HARNESS: bundle ${statSync(out).size} byte, nạp được, có phơi \`middleware\``);
}

const run = (nodeEnv, hasSecret) => {
  const code =
    `process.env.NODE_ENV=${JSON.stringify(nodeEnv)};` +
    (hasSecret ? `process.env.AUTH_SECRET='k'.repeat(44);` : `delete process.env.AUTH_SECRET;`) +
    `require(${JSON.stringify(out)});console.log('LOADED');`;
  const p = spawnSync(process.execPath, ['-e', code], { cwd: repo, encoding: 'utf8' });
  const text = `${p.stdout ?? ''}${p.stderr ?? ''}`;
  if (/AUTH_SECRET chưa cấu hình/.test(text)) return 'THREW';
  if (/LOADED/.test(text)) return 'LOADED';
  return `OTHER: ${text.split('\n').filter(Boolean).slice(-1)[0]?.slice(0, 120)}`;
};

const cases = [
  ['production', false, 'THREW',  'production + THIẾU secret → phải NÉM (lỗ bị bịt)'],
  ['production', true,  'LOADED', 'production + CÓ secret → phải nạp bình thường'],
  ['development', false,'LOADED', 'dev + THIẾU secret → phải nạp (giữ cách ly if_session_noenv)'],
];

let bad = 0;
console.log('RUNTIME PROOF · fail-closed AUTH_SECRET');
for (const [env, sec, want, label] of cases) {
  const got = run(env, sec);
  const ok = got === want;
  if (!ok) bad++;
  console.log(`  ${ok ? '✓' : '✗'} ${label} → ${got}`);
}
rmSync(out, { force: true });
console.log(bad === 0 ? `\nPASS 3/3` : `\nFAIL — ${bad}/3 hỏng`);
process.exit(bad === 0 ? 0 : 1);
