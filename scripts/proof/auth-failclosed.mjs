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
import { rmSync } from 'node:fs';
import { join } from 'node:path';

const repo = process.cwd();
const out = join(repo, '.proof-middleware.cjs');

const build = spawnSync('npx', ['esbuild', 'middleware.ts', '--bundle', '--format=cjs',
  '--platform=node', `--outfile=${out}`, '--log-level=error'], { cwd: repo, encoding: 'utf8' });
if (build.status !== 0) {
  console.error('Không dịch được middleware.ts:', build.stderr?.slice(0, 300));
  process.exit(2);
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
