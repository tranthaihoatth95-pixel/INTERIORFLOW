/**
 * lib/storage/revisioned-json-file.test.ts — kho JSON có sổ phiên bản trên đĩa THẬT (thư mục
 * tạm của OS, dọn sau khi chạy). Chạy:
 *   node_modules/.bin/sucrase-node lib/storage/revisioned-json-file.test.ts
 */
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { openRevisionedJsonFile, writeFileAtomic } from './revisioned-json-file';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

interface Doc { items: string[] }
const parse = (raw: string): Doc | undefined => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v?.items) ? { items: v.items } : undefined;
  } catch {
    return undefined;
  }
};
const serialize = (d: Doc) => JSON.stringify(d, null, 2);

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'if-revjson-'));
  try {
    const dir = path.join(root, 'proj_1');
    let n = 0;
    const open = () =>
      openRevisionedJsonFile<Doc>({
        dir, fileName: 'cards.json', subject: { kind: 'test-doc', key: 'proj_1' }, parse, serialize,
        newObjectId: () => '00000000-0000-4000-8000-00000000abcd',
      });
    const at = () => `2026-09-02T00:0${++n}:00.000Z`;

    console.log('[1] chưa ghi gì — read undefined, ledger null, verify ok');
    const s = open();
    eq('read', await s.read(), undefined);
    eq('ledger', await s.ledger(), null);
    eq('verify', await s.verify(), { ok: true });

    console.log('[2] ghi lần 1 — bản hiện hành đúng bytes serializer, sổ có objectId bền, bản chụp tồn tại');
    const w1 = await s.write({ items: ['a'] }, { reason: 'upsert', by: 'u1', at: at() });
    ok('không unchanged', !w1.unchanged);
    eq('bytes hiện hành = serialize()', await fs.readFile(path.join(dir, 'cards.json'), 'utf8'), serialize({ items: ['a'] }));
    const l1 = await s.ledger();
    eq('objectId từ hàm tiêm', l1?.objectId, '00000000-0000-4000-8000-00000000abcd');
    eq('subject', l1?.subject, { kind: 'test-doc', key: 'proj_1' });
    eq('head = entry 1', l1?.head, w1.entry.revisionId);
    ok('bản chụp tồn tại', (await fs.stat(path.join(dir, 'revisions', `${w1.entry.revisionId}.json`))).isFile());
    ok('không còn file tmp', !(await fs.readdir(dir)).some((f) => f.includes('.tmp-')));

    console.log('[3] ghi cùng nội dung — idempotent, không thêm entry');
    const w1b = await s.write({ items: ['a'] }, { reason: 'upsert', at: at() });
    ok('unchanged + cùng entry', w1b.unchanged && w1b.entry.revisionId === w1.entry.revisionId);
    eq('sổ vẫn 1 entry', (await s.ledger())?.entries.length, 1);

    console.log('[4] ghi lần 2 + xoá — chuỗi cha→con, readRevision đọc lại đúng bản cũ');
    const w2 = await s.write({ items: ['a', 'b'] }, { reason: 'upsert', at: at() });
    const w3 = await s.write({ items: [] }, { reason: 'delete', at: at() });
    eq('cha của w2 = w1', w2.entry.parentRevisionId, w1.entry.revisionId);
    eq('cha của w3 = w2', w3.entry.parentRevisionId, w2.entry.revisionId);
    eq('hiện hành = rỗng', await s.read(), { items: [] });
    eq('readRevision w2', await s.readRevision(w2.entry.revisionId), { items: ['a', 'b'] });
    eq('readRevision id lạ', await s.readRevision('rev_nope'), undefined);

    console.log('[5] REOPEN — mở lại từ đĩa bằng instance mới: nội dung + sổ + chuỗi y hệt');
    const s2 = open();
    eq('read sau reopen', await s2.read(), { items: [] });
    eq('ledger sau reopen', await s2.ledger(), await s.ledger());
    eq('verify sau reopen', await s2.verify(), { ok: true });

    console.log('[6] restore — entry MỚI có restoredFrom, nội dung = bản cũ, lịch sử không cắt, lùi được tiếp');
    const r = await s2.restore(w2.entry.revisionId, { by: 'u2', at: at() });
    ok('restore trả entry', !!r && r.entry.reason === 'restore' && r.entry.restoredFrom === w2.entry.revisionId);
    eq('nội dung hiện hành = bản w2', await s2.read(), { items: ['a', 'b'] });
    const l = await s2.ledger();
    eq('sổ 4 entry (không cắt)', l?.entries.length, 4);
    eq('by ghi vào entry restore', l?.entries[3].by, 'u2');
    ok('id bản khôi phục ≠ id bản gốc', r!.entry.revisionId !== w2.entry.revisionId);
    eq('restore id lạ ⇒ null', await s2.restore('rev_nope', {}), null);
    // lùi tiếp về bản rỗng (w3) — reversible cả hai chiều
    const r2 = await s2.restore(w3.entry.revisionId, { at: at() });
    eq('lùi tiếp về rỗng', await s2.read(), { items: [] });
    eq('5 entry', (await s2.ledger())?.entries.length, 5);
    eq('verify sau 2 lần restore', await s2.verify(), { ok: true });
    ok('r2 có entry', !!r2);

    console.log('[7] ghi song song trong cùng process — không mất lượt ghi (khoá thư mục)');
    const s3 = open();
    await Promise.all([
      s3.write({ items: ['x'] }, { reason: 'upsert', at: at() }),
      s3.write({ items: ['y'] }, { reason: 'upsert', at: at() }),
      s3.write({ items: ['z'] }, { reason: 'upsert', at: at() }),
    ]);
    const l3 = await s3.ledger();
    eq('3 lượt ghi = 3 entry thêm (5 → 8)', l3?.entries.length, 8);
    eq('verify chuỗi sau ghi song song', await s3.verify(), { ok: true });
    eq('hiện hành = lượt cuối', await s3.read(), { items: ['z'] });

    console.log('[8] sổ bị sửa tay — verify báo hỏng, ledger() vẫn đọc; sổ hỏng cấu trúc ⇒ throw, không tự sửa');
    const ledgerPath = path.join(dir, 'ledger.json');
    const raw = JSON.parse(await fs.readFile(ledgerPath, 'utf8'));
    raw.entries[0].contentHash = 'sua-tay';
    await writeFileAtomic(ledgerPath, JSON.stringify(raw));
    const v = await open().verify();
    ok('verify bắt sửa tay', !v.ok);
    await writeFileAtomic(ledgerPath, '{ hỏng');
    let threw = false;
    try { await open().ledger(); } catch { threw = true; }
    ok('sổ hỏng cấu trúc ⇒ throw (không âm thầm mở sổ mới đè lịch sử)', threw);
    eq('bản hiện hành vẫn đọc được dù sổ hỏng', await open().read(), { items: ['z'] });

    console.log('[9] writeFileAtomic — file hỏng giữa chừng không để lại bản nửa vời');
    const target = path.join(root, 'atomic.json');
    await writeFileAtomic(target, 'v1');
    await writeFileAtomic(target, 'v2');
    eq('nội dung cuối', await fs.readFile(target, 'utf8'), 'v2');
    ok('không tmp rơi rớt', !(await fs.readdir(root)).some((f) => f.includes('.tmp-')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
