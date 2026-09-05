/**
 * lib/storage/revision-ledger.test.ts — sổ phiên bản thuần. Chạy:
 *   node_modules/.bin/sucrase-node lib/storage/revision-ledger.test.ts
 */
import { createHash } from 'crypto';
import {
  appendRevision,
  canonicalJson,
  contentHashOf,
  findRevision,
  newLedger,
  parseLedger,
  revisionIdOf,
  serializeLedger,
  verifyChain,
} from './revision-ledger';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

console.log('[1] canonicalJson — thứ tự khoá không đổi hash, undefined bị bỏ, mảng giữ thứ tự');
{
  eq('sắp khoá', canonicalJson({ b: 1, a: { d: 2, c: 3 } }), '{"a":{"c":3,"d":2},"b":1}');
  eq('undefined bỏ', canonicalJson({ a: undefined, b: null }), '{"b":null}');
  eq('mảng giữ thứ tự', canonicalJson([{ z: 1, y: 2 }, 3]), '[{"y":2,"z":1},3]');
  ok('hash không phụ thuộc thứ tự khoá', contentHashOf({ a: 1, b: 2 }, sha) === contentHashOf({ b: 2, a: 1 }, sha));
  ok('đổi 1 giá trị ⇒ hash khác', contentHashOf({ a: 1 }, sha) !== contentHashOf({ a: 2 }, sha));
}

console.log('[2] revisionId — tất định, phụ thuộc cha + nội dung, có tiền tố rev_');
{
  const id = revisionIdOf(null, 'h1', sha);
  ok('tiền tố rev_ + 24 hex', /^rev_[0-9a-f]{24}$/.test(id));
  eq('gọi lại ra cùng id', revisionIdOf(null, 'h1', sha), id);
  ok('khác cha ⇒ khác id', revisionIdOf('rev_x', 'h1', sha) !== id);
  ok('khác nội dung ⇒ khác id', revisionIdOf(null, 'h2', sha) !== id);
}

console.log('[3] appendRevision — không đột biến, nối chuỗi cha→con, idempotent khi nội dung y hệt');
{
  const l0 = newLedger('00000000-0000-4000-8000-000000000001', { kind: 'dna-cards', key: 'proj_1' });
  const r1 = appendRevision(l0, { contentHash: 'h1', at: '2026-09-02T00:00:00.000Z', reason: 'upsert', by: 'u1' }, sha);
  ok('l0 không bị đột biến', l0.entries.length === 0 && l0.head === null);
  ok('entry 1 có cha null, seq 1', r1.entry?.parentRevisionId === null && r1.entry?.seq === 1 && !r1.unchanged);
  eq('by giữ', r1.entry?.by, 'u1');
  const r1b = appendRevision(r1.ledger, { contentHash: 'h1', at: '2026-09-02T00:01:00.000Z', reason: 'upsert' }, sha);
  ok('cùng nội dung ⇒ unchanged, không thêm entry', r1b.unchanged && r1b.ledger === r1.ledger && r1b.entry === r1.entry);
  const r2 = appendRevision(r1.ledger, { contentHash: 'h2', at: '2026-09-02T00:02:00.000Z', reason: 'delete' }, sha);
  ok('entry 2 cha = entry 1', r2.entry?.parentRevisionId === r1.entry?.revisionId && r2.entry?.seq === 2);
  eq('head = entry 2', r2.ledger.head, r2.entry?.revisionId);
  // khôi phục về h1: PHẢI ghi entry mới dù nội dung trùng một bản cũ — lịch sử không bị cắt
  const r3 = appendRevision(r2.ledger, { contentHash: 'h1', at: '2026-09-02T00:03:00.000Z', reason: 'restore', restoredFrom: r1.entry!.revisionId }, sha);
  ok('restore = entry MỚI (seq 3), không phải quay đầu về entry 1', !r3.unchanged && r3.entry?.seq === 3 && r3.ledger.entries.length === 3);
  eq('restoredFrom ghi đúng', r3.entry?.restoredFrom, r1.entry?.revisionId);
  ok('id bản khôi phục KHÁC id bản gốc (cha khác) — hai lần xuất hiện của cùng nội dung phân biệt được', r3.entry?.revisionId !== r1.entry?.revisionId);
  eq('findRevision', findRevision(r3.ledger, r2.entry!.revisionId)?.contentHash, 'h2');
  eq('findRevision không có ⇒ null', findRevision(r3.ledger, 'rev_nope'), null);
  eq('verifyChain ok', verifyChain(r3.ledger, sha), { ok: true });

  console.log('[4] serialize → parse round-trip + verifyChain bắt sổ bị sửa tay');
  const raw = serializeLedger(r3.ledger);
  const back = parseLedger(raw);
  eq('round-trip nguyên vẹn', back, r3.ledger);
  const tampered = JSON.parse(raw);
  tampered.entries[1].contentHash = 'h2-sua-tay';
  const t = verifyChain(parseLedger(JSON.stringify(tampered))!, sha);
  ok('sửa contentHash giữa chuỗi ⇒ brokenAt entry đó', !t.ok && (t as { brokenAt: string | null }).brokenAt === r2.entry?.revisionId);
  const cut = JSON.parse(raw);
  cut.entries.pop();
  const c = verifyChain(parseLedger(JSON.stringify(cut))!, sha);
  ok('cắt entry cuối mà head còn trỏ ⇒ hỏng tại head', !c.ok);
}

console.log('[5] parseLedger — dữ liệu ngoài không tin mù');
{
  eq('rỗng ⇒ null', parseLedger(''), null);
  eq('JSON hỏng ⇒ null', parseLedger('{'), null);
  eq('sai version ⇒ null', parseLedger('{"version":2,"objectId":"x","subject":{"kind":"a","key":"b"},"head":null,"entries":[]}'), null);
  eq('thiếu subject ⇒ null', parseLedger('{"version":1,"objectId":"x","head":null,"entries":[]}'), null);
  eq('entry thiếu contentHash ⇒ null', parseLedger('{"version":1,"objectId":"x","subject":{"kind":"a","key":"b"},"head":"r","entries":[{"revisionId":"r","parentRevisionId":null,"seq":1,"at":"t","reason":"x"}]}'), null);
  ok('sổ rỗng hợp lệ parse được', parseLedger(serializeLedger(newLedger('x', { kind: 'a', key: 'b' })))?.entries.length === 0);
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
