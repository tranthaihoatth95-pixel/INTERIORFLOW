#!/usr/bin/env node
/**
 * Bưu tá local cho cầu MOC — nhẹ, default-off, không quét repo, không cloud.
 *
 * Chạy một lượt:
 *   BOS_MOC_POSTMAN=1 BOS_MOC_CONNECTORS_JSON='{"06":{"command":"...","args":["{handoffId}","{body}"]}}' \
 *     node scripts/buu-ta-cau.mjs --once
 * Watch nhẹ (mặc định 15s, không daemon hệ thống):
 *   ... node scripts/buu-ta-cau.mjs --watch
 *
 * Connector contract:
 * - command + args chạy bằng execFile, KHÔNG shell.
 * - `{handoffId}` là idempotency key bắt buộc; connector phải dedupe theo khóa này.
 * - stdout không rỗng = receipt thật ⇒ mới ghi SENT. Exit 0 nhưng stdout rỗng chỉ là WAKE_ATTEMPTED.
 * - Không có connector/process callable ⇒ OFFLINE; hook `moc im <lane>` vẫn nạp phiếu ở lượt sau.
 */
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import core from './buu-ta-cau-core.cjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG_ROOT = process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG');
const CAU = path.join(LOG_ROOT, 'agent-handoffs.jsonl');
const FLAG = process.env.BOS_MOC_POSTMAN === '1';
const STALE_MS = Math.max(1, Number(process.env.BOS_MOC_STALE_MINUTES || 20)) * 60_000;
const BASE_MS = Math.max(1000, Number(process.env.BOS_MOC_BACKOFF_MS || 15_000));
const MAX_MS = Math.max(BASE_MS, Number(process.env.BOS_MOC_BACKOFF_MAX_MS || 15 * 60_000));

export function docSuKien(cau = CAU) {
  if (!existsSync(cau)) return [];
  return readFileSync(cau, 'utf8').split('\n').filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

const { viecCanGiao } = core;
const backoffMs = (soLan) => core.backoffMs(soLan, BASE_MS, MAX_MS);

function connectors() {
  try {
    const c = JSON.parse(process.env.BOS_MOC_CONNECTORS_JSON || '{}');
    return c && typeof c === 'object' ? c : {};
  } catch { throw new Error('BOS_MOC_CONNECTORS_JSON không phải JSON hợp lệ'); }
}

function thay(s, h) {
  return String(s).replaceAll('{handoffId}', h.id).replaceAll('{lane}', h.to)
    .replaceAll('{from}', h.from).replaceAll('{topic}', h.topic).replaceAll('{body}', h.body);
}

function moc(args) {
  return execFileSync(process.execPath, ['scripts/moc.mjs', ...args],
    { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: process.env }).trim();
}

function demLan(events, id) {
  return events.filter((e) => e.type === 'DISPATCH_ATTEMPT' && e.handoffId === id).length + 1;
}

export async function motLuot(now = Date.now()) {
  if (!FLAG) return { disabled: true, delivered: 0, offline: 0, failed: 0 };
  const events = docSuKien();
  const cauHinh = connectors();
  const jobs = viecCanGiao(events, now);
  const kq = { disabled: false, delivered: 0, offline: 0, failed: 0 };

  for (const h of jobs) {
    if (!/^(cx|cl):\d{2}$/.test(h.to) || !/^(cx|cl):\d{2}$/.test(h.from)) {
      kq.offline += 1;
      console.log(`○ LEGACY_AMBIGUOUS ${h.id} · chỉ đọc, bưu tá không tự gán hệ`);
      continue;
    }
    const c = cauHinh[h.to];
    const age = now - Date.parse(h.createdAt);
    if (!c?.command || !Array.isArray(c.args) || !c.args.some((a) => String(a).includes('{handoffId}'))) {
      kq.offline += 1;
      console.log(`${age >= STALE_MS ? '⚠️ STALE' : '○ OFFLINE'} ${h.id} → ${h.to} · không có connector callable; phiếu vẫn bền trong inbox`);
      continue;
    }

    const lan = demLan(events, h.id);
    const nextAt = new Date(now + backoffMs(lan)).toISOString();
    moc(['dispatch-attempt', h.from, h.id, 'STARTED', c.command, nextAt, `attempt=${lan}`]);
    try {
      const receipt = await new Promise((resolve, reject) => {
        execFile(c.command, c.args.map((a) => thay(a, h)), { cwd: REPO, timeout: Number(c.timeoutMs || 30_000),
          maxBuffer: 1024 * 1024, env: { ...process.env, BOS_MOC_HANDOFF_ID: h.id } }, (err, stdout, stderr) => {
          if (err) reject(new Error((stderr || err.message).trim().slice(0, 240)));
          else resolve(String(stdout || '').trim());
        });
      });
      moc(['danh-thuc', h.from, h.id, `${c.name || c.command} · idempotency=${h.system || 'legacy'}:${h.id}`]);
      if (receipt) moc(['sent', h.from, h.id, c.name || c.command, receipt.slice(0, 240)]);
      kq.delivered += 1;
    } catch (err) {
      moc(['dispatch-attempt', h.from, h.id, 'FAILED', c.name || c.command, nextAt,
        err instanceof Error ? err.message : String(err)]);
      kq.failed += 1;
    }
  }
  return kq;
}

async function main() {
  const watch = process.argv.includes('--watch');
  if (!FLAG) {
    console.log('○ Bưu tá MOC đang TẮT (mặc định). Đặt BOS_MOC_POSTMAN=1 để chạy.');
    return;
  }
  do {
    const r = await motLuot();
    console.log(`bưu tá: delivered=${r.delivered} offline=${r.offline} failed=${r.failed}`);
    if (!watch) break;
    await new Promise((resolve) => setTimeout(resolve, Math.max(5000, Number(process.env.BOS_MOC_HEARTBEAT_MS || 15_000))));
  } while (true);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(err instanceof Error ? err.message : String(err)); process.exit(1); });
}
