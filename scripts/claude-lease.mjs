#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { activeWriter, amend, append, findLease, issue, readEvents, renew, resolveIssuer, state } = require('./claude-lease-core.cjs');

const log = process.env.IF_LEASE_LOG || path.join(process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG'), 'claude-writer-leases.jsonl');
const [command, ...args] = process.argv.slice(2);
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const control = () => {
  const handoffLog = path.join(process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG'), 'agent-handoffs.jsonl');
  return resolveIssuer({ args, env: process.env, handoffs: readEvents(handoffLog) });
};

try {
  const events = readEvents(log);
  if (command === 'status') {
    const id = args[0];
    console.log(JSON.stringify(id ? findLease(events, id, Date.now()) : { active: activeWriter(events, Date.now()), all: state(events, Date.now()) }, null, 2));
  } else if (command === 'issue') {
    const issuer = control();
    const minutes = Number(value('--minutes'));
    const files = JSON.parse(value('--files') || '[]');
    // `--thay`: thu hồi lease ACTIVE hiện có RỒI cấp mới, trong MỘT lệnh. Hoà vấp lỗi "đã có
    // production writer lease sống" hai lần trong ngày 31/08 — lệnh gỡ nằm ở chỗ khác, và
    // giữa hai lệnh có một khoảng repo không ai cầm bút. Trên sổ SẠCH thì `--thay` là no-op.
    let soKien = events;
    if (args.includes('--thay')) {
      const dangSong = activeWriter(events, Date.now());
      if (dangSong) {
        const bo = { v: 1, type: 'LEASE_REVOKED', lease_id: dangSong.lease_id, issuer, reason: 'thay bởi issue --thay', generated_at: new Date().toISOString() };
        append(log, bo);
        soKien = [...events, bo];
      }
    }
    const event = issue({ events: soKien, system: 'cl', lane: '06', session_id: value('--session'), task_id: value('--task'), files, expires_at: Date.now() + minutes * 60_000, issuer });
    append(log, event);
    console.log(JSON.stringify(event, null, 2));
  } else if (command === 'renew') {
    const issuer = control();
    const event = renew({ events, lease_id: args[0], minutes: Number(value('--minutes')), issuer });
    append(log, event);
    console.log(JSON.stringify(event, null, 2));
  } else if (command === 'amend') {
    const issuer = control();
    const event = amend({ events, lease_id: args[0], files: JSON.parse(value('--files') || '[]'), issuer });
    append(log, event);
    console.log(JSON.stringify(event, null, 2));
  } else if (command === 'revoke') {
    const issuer = control();
    const lease = findLease(events, args[0], Date.now());
    if (!lease || lease.status !== 'ACTIVE') throw new Error('lease không sống hoặc không tồn tại');
    const event = { v: 1, type: 'LEASE_REVOKED', lease_id: lease.lease_id, issuer, reason: value('--reason') || 'explicit revoke', generated_at: new Date().toISOString() };
    append(log, event);
    console.log(JSON.stringify(event, null, 2));
  } else if (command === 'launch') {
    const lease = findLease(events, args[0], Date.now());
    if (!lease || lease.status !== 'ACTIVE') throw new Error('lease không sống');
    const split = args.indexOf('--');
    const claudeArgs = split >= 0 ? args.slice(split + 1) : [];
    const result = spawnSync('claude', claudeArgs, { stdio: 'inherit', env: { ...process.env, IF_SYSTEM: lease.system, IF_LANE: lease.lane, IF_SESSION_ID: lease.session_id, IF_TASK_ID: lease.task_id, IF_LEASE_ID: lease.lease_id, IF_LEASE_LOG: log } });
    process.exit(result.status ?? 1);
  } else {
    throw new Error('dùng: status [lease] | issue [--thay] --session ID --task ID --files JSON --minutes N | renew ID --minutes N | amend ID --files JSON | revoke ID --reason TEXT | launch ID -- [claude args]\nissuer (issue/renew/amend/revoke): --issuer-hoa "<ghi chú>" cho người thật · identity cx:00 · --authority-handoff <id>');
  }
} catch (error) { console.error(`BLOCKED · claude-lease · ${error.message}`); process.exit(2); }
