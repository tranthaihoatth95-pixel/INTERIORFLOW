/**
 * lib/dna/store-revisions.test.ts — kho Thẻ DNA trên đĩa THẬT (thư mục tạm): upsert/delete có sổ
 * phiên bản, ghi nguyên tử, khôi phục, MỞ LẠI đọc y hệt. Chạy:
 *   node_modules/.bin/sucrase-node lib/dna/store-revisions.test.ts
 */
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import {
  __setDnaRootForTest,
  deleteDnaCard,
  listDnaRevisions,
  parseCardsFile,
  readDnaCards,
  restoreDnaRevision,
  upsertDnaCard,
} from './store';
import { newDnaCard } from './types';
import { fromTrangThaiNguon } from '../distill/assurance';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'if-dna-'));
  __setDnaRootForTest(root);
  try {
    const P = 'proj_test';
    console.log('[1] dự án chưa có thẻ — đọc rỗng, sổ null (hợp lệ, không throw)');
    eq('read', await readDnaCards(P), []);
    eq('ledger', await listDnaRevisions(P), null);

    console.log('[2] upsert 2 thẻ — cards.json đúng định dạng cũ, sổ 2 entry có by');
    const a = newDnaCard(P, 'Phương án A', '2026-09-02T01:00:00.000Z');
    a.layers.mauTyLe = { values: ['#101010'], trangThai: 'inferred', nguon: ['asset_1'] };
    const b = newDnaCard(P, 'Phương án B', '2026-09-02T02:00:00.000Z');
    await upsertDnaCard(P, a, { by: 'u1', at: '2026-09-02T01:00:01.000Z' });
    const after2 = await upsertDnaCard(P, b, { by: 'u1', at: '2026-09-02T02:00:01.000Z' });
    eq('trả đủ 2 thẻ', after2.map((c) => c.id), [a.id, b.id]);
    const rawCards = await fs.readFile(path.join(root, P, 'cards.json'), 'utf8');
    eq('cards.json đọc bằng parser cũ y hệt', parseCardsFile(rawCards), [a, b]);
    const l2 = await listDnaRevisions(P);
    eq('2 entry', l2?.entries.map((e) => [e.seq, e.reason, e.by]), [[1, 'upsert', 'u1'], [2, 'upsert', 'u1']]);
    eq('subject', l2?.subject, { kind: 'dna-cards', key: P });
    ok('objectId là UUID', /^[0-9a-f-]{36}$/.test(l2?.objectId ?? ''));
    ok('objectId ≠ projectId (bền, độc lập id route)', l2?.objectId !== P);

    console.log('[3] người xác nhận lớp màu (inferred → verified) rồi xoá thẻ B — sổ nối tiếp');
    const a2 = { ...a, layers: { ...a.layers, mauTyLe: { values: ['#101010'], trangThai: 'verified' as const, nguon: ['asset_1', 'manual'] } } };
    await upsertDnaCard(P, a2, { by: 'u2', at: '2026-09-02T03:00:00.000Z' });
    const afterDel = await deleteDnaCard(P, b.id, { by: 'u2', at: '2026-09-02T04:00:00.000Z' });
    eq('còn thẻ A', afterDel.map((c) => c.id), [a.id]);
    const l4 = await listDnaRevisions(P);
    eq('4 entry, entry cuối reason delete', l4?.entries.map((e) => e.reason), ['upsert', 'upsert', 'upsert', 'delete']);
    eq('thang chung đọc lớp màu bản mới = user-override (verified + manual)', fromTrangThaiNguon(afterDel[0].layers.mauTyLe.trangThai, afterDel[0].layers.mauTyLe.nguon), 'user-override');

    console.log('[4] khôi phục bản 2 (trước khi xác nhận + trước khi xoá) — thẻ B sống lại, lớp màu về inferred, sổ KHÔNG cắt');
    const rev2 = l4!.entries[1].revisionId;
    const r = await restoreDnaRevision(P, rev2, { by: 'u3', at: '2026-09-02T05:00:00.000Z' });
    ok('restore trả kết quả', !!r && r.revision.restoredFrom === rev2 && r.revision.by === 'u3');
    eq('bộ thẻ = bản 2', r?.cards, [a, b]);
    eq('lớp màu về inferred — inferred không thể "trôi" thành verified qua khôi phục', fromTrangThaiNguon(r!.cards[0].layers.mauTyLe.trangThai), 'inferred');
    eq('sổ 5 entry', (await listDnaRevisions(P))?.entries.length, 5);
    eq('restore id lạ ⇒ null', await restoreDnaRevision(P, 'rev_nope'), null);

    console.log('[5] MỞ LẠI — module đọc từ đĩa (không cache) trả y hệt bản hiện hành');
    eq('readDnaCards sau restore', await readDnaCards(P), [a, b]);
    ok('không file tmp rơi rớt', !(await fs.readdir(path.join(root, P))).some((f) => f.includes('.tmp-')));
    ok('thư mục revisions có 5 bản chụp', (await fs.readdir(path.join(root, P, 'revisions'))).length === 5);

    console.log('[6] projectId lạ (path traversal) — bị ép về tên an toàn, không thoát khỏi DNA_ROOT');
    const weird = '../../etc';
    await upsertDnaCard(weird, newDnaCard(weird, 'x', '2026-09-02T06:00:00.000Z'), { at: '2026-09-02T06:00:01.000Z' });
    ok('ghi vào thư mục tên đã làm sạch', (await fs.stat(path.join(root, '______etc', 'cards.json'))).isFile());
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
