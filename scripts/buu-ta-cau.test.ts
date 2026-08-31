import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { backoffMs, viecCanGiao } = require('./buu-ta-cau-core.cjs') as {
  backoffMs: (n: number, base: number, max: number) => number;
  viecCanGiao: (events: object[], now: number) => object[];
};

const H = { type: 'HANDOFF', id: 'HO-20260830150000-aaaaaaaaaaaa', handoffId: 'HO-20260830150000-aaaaaaaaaaaa',
  from: 'cx:00', to: 'cl:06', system: 'cx', lane: '00', target_system: 'cl', target_lane: '06', createdAt: '2026-08-30T08:00:00.000Z' };
const at = (type: string, extra = {}) => ({ type, handoffId: H.id, system: 'cl', lane: '06',
  target_system: 'cl', target_lane: '06', createdAt: '2026-08-30T08:01:00.000Z', ...extra });
const NOW = Date.parse('2026-08-30T09:00:00.000Z');

{
  assert.equal(viecCanGiao([H], NOW).length, 1, 'CREATED phải được giao');
  assert.equal(viecCanGiao([H, at('SEEN')], NOW).length, 0, 'SEEN thắng SENT và dừng gửi');
  assert.equal(viecCanGiao([H, at('ACK')], NOW).length, 0, 'ACK dừng gửi');
  assert.equal(viecCanGiao([H, at('SENT')], NOW).length, 0, 'receipt thật dừng gửi trùng');
  assert.equal(viecCanGiao([H, at('WAKE')], NOW).length, 0, 'WAKE_ATTEMPTED dừng gửi trùng');
  assert.equal(viecCanGiao([H, at('WAKE_ATTEMPTED')], NOW).length, 0, 'schema mới WAKE_ATTEMPTED dừng gửi trùng');
  assert.equal(viecCanGiao([H, at('DISPATCH_ATTEMPT', { nextAt: '2026-08-30T09:01:00.000Z' })], NOW).length, 0,
    'crash giữa wake và receipt phải giữ backoff qua restart');
  assert.equal(viecCanGiao([H, at('DISPATCH_ATTEMPT', { nextAt: '2026-08-30T08:59:00.000Z' })], NOW).length, 1,
    'hết backoff thì retry');
  assert.ok(backoffMs(2, 1000, 10000) >= backoffMs(1, 1000, 10000), 'backoff không được giảm');
  assert.equal(viecCanGiao([{ ...H, to: 'cx:99', target_system: 'cx', target_lane: '99' }], NOW).length, 1, 'core không âm thầm đổi lane; adapter sẽ OFFLINE');
  assert.equal(viecCanGiao([{ type: 'HANDOFF', id: H.id, from: '00', to: '06', createdAt: H.createdAt }], NOW).length, 1,
    'legacy không bị mất; adapter giữ LEGACY_AMBIGUOUS');
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'if-buu-ta-'));
  try {
    const log = path.join(tmp, 'agent-handoffs.jsonl');
    writeFileSync(log, `${JSON.stringify(H)}\n`);
    const env = {
      ...process.env,
      BOS_SHARED_LOG_ROOT: tmp,
      /* Bàn TẠM — bắt buộc. `buu-ta-cau` gọi `moc.mjs`, `moc.mjs` spawn `phieu-ca --ghi-ban`.
       * Thiếu dòng này thì hằng số fixture ở đầu tệp (`HO-…-aaaaaaaaaaaa`) đi thẳng vào
       * `docs/control/ban/06.md` THẬT — đúng ca đã xảy ra 30/08. */
      BOS_BAN_ROOT: path.join(tmp, 'ban'),
      BOS_MOC_POSTMAN: '1',
      BOS_SESSION_ID: 'test-postman-session',
      BOS_MOC_CONNECTORS_JSON: JSON.stringify({
        'cl:06': { name: 'fake-receipt', command: process.execPath,
          args: ['-e', 'process.stdout.write(`receipt:${process.argv[1]}`)', '{handoffId}'] },
      }),
    };
    const run = () => spawnSync(process.execPath, ['scripts/buu-ta-cau.mjs', '--once'],
      { cwd: process.cwd(), env, encoding: 'utf8' });
    const first = run();
    assert.equal(first.status, 0, first.stderr);
    const afterFirst = readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(afterFirst.filter((e) => e.type === 'SENT').length, 1, 'receipt thật sinh đúng một SENT');
    assert.equal(afterFirst.filter((e) => e.type === 'WAKE_ATTEMPTED').length, 1, 'connector thành công sinh WAKE_ATTEMPTED');
    const second = run();
    assert.equal(second.status, 0, second.stderr);
    const afterRestart = readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(afterRestart.filter((e) => e.type === 'SENT').length, 1, 'restart không gửi trùng');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log('buu-ta-cau: 14/14 mutation + restart gates');
}
