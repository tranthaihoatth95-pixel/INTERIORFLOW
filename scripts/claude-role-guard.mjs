#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { evaluate } = require('./claude-role-guard-core.cjs');
const { findLease, readEvents } = require('./claude-lease-core.cjs');

let raw = '';
for await (const chunk of process.stdin) raw += chunk;
let hook = {};
try { hook = raw.trim() ? JSON.parse(raw) : {}; }
catch { console.error('BLOCKED · Claude Role Guard · hook input không phải JSON'); process.exit(2); }
const leaseFile = process.env.IF_LEASE_LOG || path.join(process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG'), 'claude-writer-leases.jsonl');
let lease = null;
try { if (process.env.IF_LEASE_ID) lease = findLease(readEvents(leaseFile), process.env.IF_LEASE_ID, Date.now()); }
catch (error) { console.error(`BLOCKED · Claude Role Guard · lease store unreadable: ${error.message}`); process.exit(2); }
const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// CHỈ MỤC THẬT — thứ `git commit` sắp đóng dấu. Không đọc được thì trả null để cổng đóng,
// chứ không trả [] (mảng rỗng đọc ra thành "chẳng có gì lọt" — đúng chiều nguy hiểm).
function docChiMuc() {
  const out = spawnSync('git', ['diff', '--cached', '--name-only', '-z'], { cwd, encoding: 'utf8' });
  if (out.error || out.status !== 0) return null;
  return out.stdout.split('\0').filter(Boolean);
}

// SỔ CẦU — đích của một phiếu `danh-thuc` nằm ở đây chứ không nằm trong dòng lệnh.
const cauFile = path.join(process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG'), 'agent-handoffs.jsonl');
function docDichPhieu(handoffId) {
  if (!handoffId) return null;
  let raw;
  try { raw = fs.readFileSync(cauFile, 'utf8'); } catch { return null; }
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event.type === 'HANDOFF' && event.id === handoffId) return event.to || null;
  }
  return null;
}

const result = evaluate({ env: process.env, hook, lease, cwd, staged: docChiMuc, handoffTo: docDichPhieu });
const stamp = result.stamp || {
  system: process.env.IF_SYSTEM || 'MISSING', role: process.env.IF_LANE ? `${process.env.IF_SYSTEM || 'MISSING'}:${process.env.IF_LANE}` : 'MISSING',
  task: process.env.IF_TASK_ID || 'MISSING', lease: process.env.IF_LEASE_ID || 'MISSING',
  session: process.env.IF_SESSION_ID || process.env.CLAUDE_SESSION_ID || hook.session_id || 'MISSING',
  kind: result.operation?.kind || 'unknown', files: [],
};
const receipt = `SYSTEM ${stamp.system} · ROLE ${stamp.role} · TASK ${stamp.task} · LEASE ${stamp.lease} · KIND ${stamp.kind} · FILES ${stamp.files.length ? stamp.files.join(',') : 'NONE'}`;
if (!result.allow) { console.error(`BLOCKED · ${receipt} · ${result.reason}`); process.exit(2); }
if (result.mutation) console.error(`ALLOW · ${receipt}`);
