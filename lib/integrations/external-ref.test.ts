/**
 * lib/integrations/external-ref.test.ts — L-EXT1 · §0v "lõi không mang tên nhà cung cấp".
 *
 * Hai việc:
 *  [A] CHẶN HỒI QUY — `prisma/schema.prisma` không được đẻ thêm cột mang tên nhà cung cấp.
 *  [B] Bảng cầu `ExternalRef` phải khai đúng hình dạng §0v yêu cầu + hàm cầu thuần chạy đúng.
 *
 * ⚠️ Vì sao KHÔNG dùng thẳng phép đếm thô của §0v: phép kiểm ghi trong §0v là
 * `grep -na "lark" prisma/schema.prisma` — đếm THEO DÒNG, nên **chú thích cũng bị tính**. Chỉ cần
 * ai đó viết một câu comment nhắc tên nhà cung cấp là con số phồng lên, phiên sau tưởng có cột mới
 * và đi truy nhầm. Test này đếm **KHAI BÁO TRƯỜNG** (bỏ comment, bỏ `@@index`) — đúng thứ §0v
 * thật sự muốn chặn.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  normalizeExternalKey,
  isValidExternalKey,
  isValidCoreKey,
  externalRefKeyString,
} from './external-ref-core';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

const SCHEMA_PATH = path.resolve(__dirname, '../../prisma/schema.prisma');
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

/** Tên nhà cung cấp đang bị khoá — viết tách để chính file test này không tự làm phồng phép grep. */
const VENDOR = ['l', 'a', 'r', 'k'].join('');

/** Dòng khai TRƯỜNG (bỏ comment `//`, `///`, và `@@index`/`@@unique`). */
function fieldDeclarations(src: string): { name: string; line: number }[] {
  const out: { name: string; line: number }[] = [];
  src.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('//') || line.startsWith('@@') || line.startsWith('model ')) return;
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s+[A-Za-z[]/.exec(line);
    if (m) out.push({ name: m[1], line: i + 1 });
  });
  return out;
}

console.log('[A] CHẶN HỒI QUY — không đẻ thêm cột mang tên nhà cung cấp');

/**
 * DANH SÁCH ĐÓNG BĂNG đo 06/08 — 9 khai báo trường bắt đầu bằng tên nhà cung cấp: 8 cột thật
 * + 1 trường quan hệ (`larkUserMaps`). Whitelist mạnh hơn đếm số: đổi tên/thêm mới đều sập.
 */
const FROZEN = 9;

test(`đúng ${FROZEN} khai báo trường mang tên nhà cung cấp — không hơn`, () => {
  const dinh = fieldDeclarations(schema).filter((f) => f.name.toLowerCase().startsWith(VENDOR));
  assert.strictEqual(
    dinh.length,
    FROZEN,
    `Đếm được ${dinh.length} (mốc đóng băng ${FROZEN}). Nếu TĂNG: có cột mới mang tên nhà cung cấp — ` +
      `§0v CẤM, đưa id hệ ngoài vào bảng ExternalRef. Danh sách: ${dinh.map((d) => `${d.name}@${d.line}`).join(', ')}`,
  );
});

test('bảng cầu ExternalRef KHÔNG được mang tên nhà cung cấp trong bất kỳ trường nào', () => {
  const khoi = /model ExternalRef \{[\s\S]*?\n\}/.exec(schema);
  assert.ok(khoi, 'không tìm thấy model ExternalRef');
  const dinh = fieldDeclarations(khoi![0]).filter((f) => f.name.toLowerCase().includes(VENDOR));
  assert.deepStrictEqual(dinh, [], 'bảng cầu mà lại mang tên nhà cung cấp thì vô nghĩa');
});

test('8 cột cũ VẪN CÒN — đợt này chỉ ngừng đẻ mới, KHÔNG được xoá', () => {
  // §0v: "Cột lark* cũ giữ nguyên (gỡ ngay là rủi ro vô ích)". Test này chặn cả chiều ngược:
  // ai đó hăng hái dọn sạch cột cũ mà chưa migrate dữ liệu = mất mối nối đang chạy thật.
  const cot = fieldDeclarations(schema).filter((f) => f.name.toLowerCase().startsWith(VENDOR));
  assert.ok(cot.length >= 8, `chỉ còn ${cot.length} — có người xoá cột cũ, xem lại §0v`);
});

console.log('[B] ExternalRef — hình dạng schema đúng §0v');

test('model ExternalRef tồn tại và có đủ 4 trường lõi', () => {
  const khoi = /model ExternalRef \{[\s\S]*?\n\}/.exec(schema);
  assert.ok(khoi, 'thiếu model ExternalRef');
  const ten = fieldDeclarations(khoi![0]).map((f) => f.name);
  for (const can of ['system', 'externalId', 'entityType', 'entityId']) {
    assert.ok(ten.includes(can), `thiếu trường ${can} — có: ${ten.join(', ')}`);
  }
});

test('có @@unique([system, externalId]) — khoá idempotent khi sync lại', () => {
  const khoi = /model ExternalRef \{[\s\S]*?\n\}/.exec(schema)![0];
  assert.ok(
    /@@unique\(\[\s*system\s*,\s*externalId\s*\]\)/.test(khoi),
    'thiếu @@unique([system, externalId]) ⇒ sync 2 lần là đẻ bản ghi trùng',
  );
});

test('có @@index([entityType, entityId]) — tra ngược từ thực thể lõi', () => {
  const khoi = /model ExternalRef \{[\s\S]*?\n\}/.exec(schema)![0];
  assert.ok(/@@index\(\[\s*entityType\s*,\s*entityId\s*\]\)/.test(khoi), 'thiếu @@index([entityType, entityId])');
});

test('system là chuỗi tự do, KHÔNG enum — thêm nhà cung cấp không phải migrate', () => {
  const khoi = /model ExternalRef \{[\s\S]*?\n\}/.exec(schema)![0];
  assert.ok(/\bsystem\s+String\b/.test(khoi), 'system phải là String');
});

test('cửa chặn migrate còn nguyên — cờ EXTERNAL_REF_TABLE_READY chưa bị bật ẩu', () => {
  // Bảng chưa có trong dev.db (chưa ai chạy db push). Bật cờ mà chưa migrate = vỡ ở lần gọi đầu.
  // Khi chủ dự án đã chạy lệnh ở M-APPLY-C-OUT §10 thì ĐỔI dòng dưới thành `true` cùng lúc.
  const src = fs.readFileSync(path.resolve(__dirname, 'external-ref.ts'), 'utf8');
  assert.ok(
    /export const EXTERNAL_REF_TABLE_READY = false;/.test(src),
    'Cờ đã bật — chỉ đúng NẾU `sqlite3 dev.db ".tables"` thật sự thấy ExternalRef. Sửa test này cùng lúc.',
  );
});

console.log('[C] Hàm cầu thuần');

test('normalize: hạ chữ thường TÊN HỆ, giữ nguyên hoa/thường của id hệ ngoài', () => {
  const n = normalizeExternalKey({ system: '  LarkBase ', externalId: '  recABC123  ' });
  assert.strictEqual(n.system, 'larkbase');
  // id của người ta phân biệt hoa/thường — hạ chữ thường là làm hỏng khoá.
  assert.strictEqual(n.externalId, 'recABC123');
});

test('khoá rỗng/toàn khoảng trắng bị chặn — không ghi rác vào bảng cầu', () => {
  assert.strictEqual(isValidExternalKey({ system: '', externalId: 'rec1' }), false);
  assert.strictEqual(isValidExternalKey({ system: 'lk', externalId: '   ' }), false);
  assert.strictEqual(isValidExternalKey({ system: 'lk', externalId: 'rec1' }), true);
  assert.strictEqual(isValidCoreKey({ entityType: 'task', entityId: '  ' }), false);
  assert.strictEqual(isValidCoreKey({ entityType: 'task', entityId: 'task_1' }), true);
});

test('cùng một khoá viết khác kiểu vẫn ra CÙNG chuỗi khoá (idempotent)', () => {
  const a = externalRefKeyString({ system: 'LARK', externalId: 'rec1' });
  const b = externalRefKeyString({ system: ' lark ', externalId: ' rec1 ' });
  assert.strictEqual(a, b);
  assert.strictEqual(a, 'lark:rec1');
});

test('hai hệ khác nhau cùng externalId KHÔNG đụng nhau', () => {
  assert.notStrictEqual(
    externalRefKeyString({ system: 'lark', externalId: 'rec1' }),
    externalRefKeyString({ system: 'notion', externalId: 'rec1' }),
  );
});

console.log(`\nexternal-ref.test.ts — ${pass}/${pass} PASS`);
