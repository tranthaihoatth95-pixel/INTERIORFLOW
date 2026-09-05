import assert from 'node:assert';
import { daiKhiHauTuViDo, goiApDung } from './climate';
import { HAN_SUY_DIEN_MS, ghimHopLe, kiemCu, nhanGoiY, suyDienSite } from './derive';
import { parseSiteContext, siteRong } from './store';
import { nhanBangChung, soanPhieuKhaoSat } from './survey-bridge';
import type { SiteContext, SitePack, SurveyEvidence } from './types';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

const NOW = new Date('2026-09-03T02:00:00Z');
const goc = (): SiteContext => ({ ...siteRong('p1', NOW), pin: { lat: 21.0285, lng: 105.8542, muiGioPhut: 420, nguon: 'ghim-tay', tai: NOW.toISOString() } });

/** FIXTURE gói vùng — chỉ trong test, KHÔNG phải kiến thức ship trong app. */
const GOI: SitePack = {
  id: 'fx-hn',
  ten: 'Fixture Hà Nội',
  hopBao: [20, 22, 105, 107],
  nguon: { ten: 'fixture test', kiemChungDuoc: false },
  khiHau: { dai: 'can-nhiet-doi', moTa: 'fixture' },
  gioChuDao: [{ huongDo: 135, mua: 'hè' }],
  bienSoGoiY: [{ ma: 'co-mua-dong', lyDo: 'fixture' }],
  cauChuyen: [{ chuDe: 'vat-lieu', text: 'fixture vật liệu' }],
};

test('không ghim → không suy gì, khuyết = [ghim]', () => {
  const d = suyDienSite(siteRong('p1', NOW), { now: NOW });
  assert.strictEqual(d.matTroi, null);
  assert.strictEqual(d.daiKhiHau, null);
  assert.deepStrictEqual(d.khuyet, ['ghim']);
});

test('ghim hợp lệ về hình học; ngoài biên/NaN bị từ chối', () => {
  assert.ok(ghimHopLe({ lat: 0, lng: 0 }));
  assert.ok(!ghimHopLe({ lat: 91, lng: 0 }));
  assert.ok(!ghimHopLe({ lat: Number.NaN, lng: 0 }));
  assert.ok(!ghimHopLe(null));
});

test('chỉ ghim, không gói/bằng chứng: mặt trời inferred/thiên văn · khí hậu suy-vĩ-độ tin cậy thấp · gió null · khuyết đủ 4', () => {
  const d = suyDienSite(goc(), { now: NOW });
  assert.strictEqual(d.matTroi?.trangThai, 'inferred');
  assert.strictEqual(d.matTroi?.nguon.loai, 'thien-van');
  assert.strictEqual(d.daiKhiHau?.value, 'nhiet-doi');
  assert.strictEqual(d.daiKhiHau?.nguon.loai, 'suy-vi-do');
  assert.ok(d.daiKhiHau!.doTinCay < 0.5);
  assert.strictEqual(d.gio, null);
  assert.deepStrictEqual(d.khuyet, ['khi-hau', 'gio', 'vat-lieu-tai-cho', 'tap-quan']);
  assert.strictEqual(d.goiY.length, 0, 'suy-vĩ-độ KHÔNG đẻ gợi ý biến số');
});

test('máy KHÔNG BAO GIỜ tự gán verified', () => {
  const ks: SurveyEvidence[] = [
    { id: 'e1', kind: 'so-do', loai: 'gio-huong', giaTri: 90, donVi: 'deg', tai: NOW.toISOString() },
    { id: 'e2', kind: 'ngu-canh', loai: 'vat-lieu-tai-cho', text: 'đá ong', tai: NOW.toISOString() },
  ];
  const d = suyDienSite({ ...goc(), khaoSat: ks }, { now: NOW, packs: [GOI] });
  const all = [d.matTroi, d.daiKhiHau, d.gio, ...d.cauChuyen.map((c) => c.fact)].filter(Boolean);
  assert.ok(all.length >= 4);
  for (const f of all) assert.notStrictEqual(f!.trangThai, 'verified');
  for (const g of d.goiY) assert.strictEqual(g.trangThai, 'inferred');
});

test('bằng chứng khảo sát (measured) THẮNG gói vùng (inferred) cho gió; gói thắng suy-vĩ-độ cho khí hậu', () => {
  const ks: SurveyEvidence[] = [
    { id: 'g1', kind: 'so-do', loai: 'gio-huong', giaTri: 80, donVi: 'deg', tai: NOW.toISOString() },
    { id: 'g2', kind: 'so-do', loai: 'gio-huong', giaTri: 100, donVi: 'deg', tai: NOW.toISOString() },
    { id: 'g3', kind: 'so-do', loai: 'gio-toc-do', giaTri: 3.25, donVi: 'm/s', tai: NOW.toISOString() },
  ];
  const d = suyDienSite({ ...goc(), khaoSat: ks }, { now: NOW, packs: [GOI] });
  assert.strictEqual(d.gio?.trangThai, 'measured');
  assert.deepStrictEqual(d.gio?.value, [{ huongDo: 90, tocDoMs: 3.3 }]);
  assert.strictEqual(d.daiKhiHau?.value, 'can-nhiet-doi');
  assert.strictEqual(d.daiKhiHau?.nguon.loai, 'goi-vung');
  assert.ok(d.daiKhiHau!.doTinCay <= 0.4, 'gói KHÔNG kiểm chứng được → tin cậy bị kẹp ≤0.4');
  assert.ok(!d.khuyet.includes('gio') && !d.khuyet.includes('khi-hau') && !d.khuyet.includes('vat-lieu-tai-cho'));
  assert.ok(d.khuyet.includes('tap-quan'));
});

test('gói vùng chỉ áp khi ghim rơi trong hộp bao', () => {
  assert.strictEqual(goiApDung({ lat: 21, lng: 106, nguon: 'ghim-tay', tai: '' }, [GOI]).length, 1);
  assert.strictEqual(goiApDung({ lat: 10.8, lng: 106.7, nguon: 'ghim-tay', tai: '' }, [GOI]).length, 0);
});

test('gợi ý nóng-ẩm chỉ khi có CẢ nhiệt độ lẫn độ ẩm đo; vùng ngập khi mức ngập > 0', () => {
  const tai = NOW.toISOString();
  const chiAm: SurveyEvidence[] = [{ id: 'a', kind: 'so-do', loai: 'do-am', giaTri: 85, donVi: '%', tai }];
  assert.strictEqual(suyDienSite({ ...goc(), khaoSat: chiAm }, { now: NOW }).goiY.length, 0);
  const du: SurveyEvidence[] = [...chiAm, { id: 'b', kind: 'so-do', loai: 'nhiet-do', giaTri: 30, donVi: 'C', tai }, { id: 'c', kind: 'so-do', loai: 'muc-ngap', giaTri: 0.4, donVi: 'm', tai }];
  const goiY = suyDienSite({ ...goc(), khaoSat: du }, { now: NOW }).goiY.map((g) => g.ma);
  assert.deepStrictEqual(goiY, ['nong-am', 'vung-ngap']);
});

test('người NHẬN gợi ý → verified + nguồn nguoi-xac-nhan giữ vết gợi ý gốc; gợi ý đã nhận không lặp', () => {
  const ctx0 = goc();
  const ctx1 = { ...ctx0, suyDien: suyDienSite(ctx0, { now: NOW, packs: [GOI] }) };
  assert.deepStrictEqual(ctx1.suyDien.goiY.map((g) => g.ma), ['co-mua-dong']);
  const ctx2 = nhanGoiY(ctx1, 'co-mua-dong', NOW);
  assert.strictEqual(ctx2.bienSo[0].trangThai, 'verified');
  assert.strictEqual(ctx2.bienSo[0].nguon.loai, 'nguoi-xac-nhan');
  assert.ok(ctx2.bienSo[0].nguon.ref.startsWith('goi-y:goi-vung:fx-hn'));
  const d2 = suyDienSite(ctx2, { now: NOW, packs: [GOI] });
  assert.strictEqual(d2.goiY.length, 0);
  assert.strictEqual(nhanGoiY(ctx2, 'co-mua-dong', NOW), ctx2, 'nhận lần hai là no-op');
  assert.strictEqual(nhanGoiY(ctx1, 'ven-bien', NOW), ctx1, 'nhận thứ máy chưa gợi là no-op');
});

test('CŨ: chưa suy · ghim đổi · bằng chứng mới · quá 7 ngày · ngoại tuyen — mỗi lý do tường minh', () => {
  const c0 = goc();
  assert.deepStrictEqual(kiemCu(c0, { now: NOW }).lyDo, ['chua-suy']);
  const c1 = { ...c0, suyDien: suyDienSite(c0, { now: NOW }) };
  assert.strictEqual(kiemCu(c1, { now: NOW }).cu, false);
  assert.deepStrictEqual(kiemCu({ ...c1, pin: { ...c1.pin!, lat: 10.8 } }, { now: NOW }).lyDo, ['ghim-doi']);
  assert.deepStrictEqual(kiemCu(nhanBangChung(c1, [{ id: 'x', kind: 'ghi-chu', text: 'a', tai: '' }], NOW), { now: NOW }).lyDo, ['bang-chung-moi']);
  assert.deepStrictEqual(kiemCu(c1, { now: new Date(NOW.getTime() + HAN_SUY_DIEN_MS + 1) }).lyDo, ['qua-han']);
  assert.deepStrictEqual(kiemCu(c1, { now: NOW, ngoaiTuyen: true }).lyDo, ['ngoai-tuyen']);
});

test('phiếu khảo sát: câu hỏi = đúng danh sách khuyết, hệ đích archinote, cửa chưa mở nói thẳng', () => {
  const c = goc();
  const p = soanPhieuKhaoSat(c, suyDienSite(c, { now: NOW }), NOW);
  assert.strictEqual(p.heDich, 'archinote');
  assert.deepStrictEqual(p.cauHoi.map((q) => q.ma), ['khi-hau', 'gio', 'vat-lieu-tai-cho', 'tap-quan']);
  assert.ok(p.cuaChua.length >= 2);
  assert.deepStrictEqual(soanPhieuKhaoSat(siteRong('p1', NOW), null, NOW).cauHoi.map((q) => q.ma), ['ghim']);
});

test('nhận bằng chứng: chỉ thêm, trùng id bỏ qua, không id bỏ qua', () => {
  const c = nhanBangChung(goc(), [{ id: 'k1', kind: 'ghi-chu', text: 'a', tai: '' }], NOW);
  const c2 = nhanBangChung(c, [{ id: 'k1', kind: 'ghi-chu', text: 'b', tai: '' }, { id: '', kind: 'ghi-chu', text: 'c', tai: '' }], NOW);
  assert.strictEqual(c2, c);
  assert.strictEqual(c2.khaoSat.length, 1);
});

test('parseSiteContext: sai projectId/phiên bản/hình dạng → undefined; ghim NaN → null; dongBo luôn local-only', () => {
  assert.strictEqual(parseSiteContext(null, 'p1'), undefined);
  assert.strictEqual(parseSiteContext({ v: 1, projectId: 'p2', khaoSat: [], bienSo: [] }, 'p1'), undefined);
  assert.strictEqual(parseSiteContext({ v: 2, projectId: 'p1', khaoSat: [], bienSo: [] }, 'p1'), undefined);
  const ok = parseSiteContext({ v: 1, projectId: 'p1', khaoSat: [{ id: 'a' }, { nope: 1 }], bienSo: [], pin: { lat: 'x', lng: 1 }, dongBo: 'cloud' }, 'p1');
  assert.ok(ok);
  assert.strictEqual(ok!.pin, null);
  assert.strictEqual(ok!.khaoSat.length, 1);
  assert.strictEqual(ok!.dongBo, 'local-only');
});

test('dải khí hậu theo vĩ độ: chí tuyến/vòng cực là biên', () => {
  assert.strictEqual(daiKhiHauTuViDo(10), 'nhiet-doi');
  assert.strictEqual(daiKhiHauTuViDo(-23.5), 'can-nhiet-doi');
  assert.strictEqual(daiKhiHauTuViDo(48), 'on-doi');
  assert.strictEqual(daiKhiHauTuViDo(70), 'han-doi');
});

console.log(`derive: ${pass} pass`);
