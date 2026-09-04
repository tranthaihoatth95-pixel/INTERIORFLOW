import assert from 'node:assert';
import { NANG_LUC_PROVIDER, NHOM_PROVIDER, SCOPE_NANG_LUC, coNangLuc, providersTheoNangLuc, providersTheoNhom } from './capabilities';
import { REGISTRY } from './registry';
import { anToanThongDiep, cacheQuaHan, ketQuaLoi, ketQuaOk, phanLoaiLoi } from './ket-qua';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

test('mọi provider trong REGISTRY đều có nhóm + năng lực khai (không sổ lệch)', () => {
  for (const id of Object.keys(REGISTRY)) {
    assert.ok(id in NHOM_PROVIDER, `thiếu nhóm ${id}`);
    assert.ok(id in NANG_LUC_PROVIDER, `thiếu năng lực ${id}`);
  }
});

test('nhóm thư giãn TÁCH hẳn khỏi bối cảnh dự án: không provider nào vừa có lich vừa thuộc thu-gian', () => {
  for (const p of providersTheoNhom('thu-gian')) {
    assert.ok(!coNangLuc(p, 'lich') && !coNangLuc(p, 'hop') && !coNangLuc(p, 'dat-phong'), p);
  }
  assert.deepStrictEqual(providersTheoNangLuc('lich').sort(), ['google', 'ms365']);
  assert.ok(!providersTheoNangLuc('dat-phong').length, 'dat-phong CHƯA có mã — không khai vống');
});

test('scope năng lực ⊆ scope registry (least-scope: không đòi scope registry không xin)', () => {
  for (const [p, m] of Object.entries(SCOPE_NANG_LUC)) {
    const reg = new Set((REGISTRY[p as keyof typeof REGISTRY].scopes ?? []).map((s) => s.toLowerCase()));
    for (const req of Object.values(m ?? {})) for (const s of req ?? []) assert.ok(reg.has(s.toLowerCase()), `${p}: ${s} không nằm trong scope registry`);
  }
});

test('revoke: google có endpoint; ms365/spotify khai thật là KHÔNG thu hồi được từ app', () => {
  assert.ok(REGISTRY.google.revokeUrl);
  assert.ok(!REGISTRY.ms365.revokeUrl && REGISTRY.ms365.revokeNote);
  assert.ok(!REGISTRY.spotify.revokeUrl && REGISTRY.spotify.revokeNote);
});

test('ket-qua: ok/lỗi/phân loại mạng + cache cũ có nhãn cu:true', () => {
  const ok = ketQuaOk('ms365', [1], '2026-09-03T00:00:00Z');
  assert.strictEqual(ok.trangThai, 'ok');
  assert.strictEqual(ok.cu, false);
  const l = ketQuaLoi('ms365', 'thieu-scope', { thieuScope: ['Calendars.Read'] });
  assert.strictEqual(l.data, null);
  const mang = phanLoaiLoi('ms365', new Error('fetch failed'), { data: [1], tai: '2026-09-03T00:00:00Z' });
  assert.strictEqual(mang.trangThai, 'ngoai-tuyen');
  assert.strictEqual(mang.cu, true);
  assert.deepStrictEqual(mang.data, [1]);
  const khac = phanLoaiLoi('ms365', new Error('MS Graph calendarView 403'));
  assert.strictEqual(khac.trangThai, 'loi');
  assert.strictEqual(khac.data, null);
});

test('thông điệp lỗi rời máy chủ KHÔNG mang token/bearer', () => {
  const tok = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20ifQ';
  const m = anToanThongDiep(`Bearer ${tok} rejected; raw=${tok}`);
  assert.ok(!m.includes(tok));
  assert.ok(m.includes('***'));
  assert.ok(m.length <= 160);
});

test('cache quá hạn theo CACHE_QUA_HAN_MS; tai null = quá hạn', () => {
  const now = Date.parse('2026-09-03T01:00:00Z');
  assert.strictEqual(cacheQuaHan('2026-09-03T00:45:00Z', now), false);
  assert.strictEqual(cacheQuaHan('2026-09-03T00:00:00Z', now), true);
  assert.strictEqual(cacheQuaHan(null, now), true);
});

console.log(`capabilities: ${pass} pass`);
