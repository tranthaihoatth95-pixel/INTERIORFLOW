/**
 * scripts/probe-fal.ts — probe trạng thái fal.ai (fal từng 403 "Exhausted balance").
 *
 * Chạy:  node_modules/.bin/sucrase-node scripts/probe-fal.ts
 * Cơ chế: submit 1 job flux/schnell tối thiểu rồi CANCEL ngay (≈0đ) — MỘT lần, không retry.
 * Exit code: 0 ok · 2 no-key · 3 exhausted (hết balance) · 4 bad-key · 1 lỗi khác.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Nạp env kiểu .env đơn giản (cùng cách scripts/seed-admin.ts) — không thêm dependency. */
function loadEnvFile(file: string) {
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split('\n')) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}
loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

async function main() {
  // import động SAU khi env nạp (fal client đọc FAL_KEY lúc config)
  const { probeFal } = await import('../lib/ai/providers/fal');
  const r = await probeFal();
  const icon = { ok: '✓', 'no-key': '○', exhausted: '✗', 'bad-key': '✗', error: '!' }[r.status];
  const label = {
    ok: 'fal SẴN SÀNG — key hợp lệ, còn balance (job probe đã cancel).',
    'no-key': 'CHƯA có FAL_KEY — node AI sẽ chạy tầng lõi tất định.',
    exhausted: 'fal HẾT BALANCE / bị khoá — nạp credit tại fal.ai/dashboard/billing.',
    'bad-key': 'FAL_KEY sai hoặc bị thu hồi — tạo key mới tại fal.ai.',
    error: 'Lỗi khác (mạng/timeout) — xem detail bên dưới.',
  }[r.status];
  console.log(`${icon} [fal probe] ${label}`);
  console.log(`  detail: ${r.detail}`);
  process.exit({ ok: 0, 'no-key': 2, exhausted: 3, 'bad-key': 4, error: 1 }[r.status]);
}

main().catch((e) => {
  console.error('! [fal probe] crash:', e instanceof Error ? e.message : e);
  process.exit(1);
});
