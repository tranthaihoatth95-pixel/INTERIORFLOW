/** Test `knowledge.ts` — chạy: node_modules/.bin/sucrase-node lib/library/knowledge.test.ts
 *
 * Ba thứ phải CHỨNG MINH bằng máy chứ không bằng lời:
 *  ① nguồn gốc ĐỌC TỪ DỮ LIỆU, không đoán (`verified` · `loaiNguon` · `note` đi thẳng qua);
 *  ② chiều thời gian đúng theo `resolveRulesAsOf` (rule bị thay → `da-thay-the`, chuyển tiếp → `chuyen-tiep`);
 *  ③ bộ lọc mặc định ẨN mục đã thay thế, và tài liệu người dùng KHÔNG BAO GIỜ được khai "đã kiểm".
 */
import {
  filterKnowledge,
  groupKnowledge,
  knowledgeFromNotebookSources,
  knowledgeFromRules,
  knowledgeStats,
} from './knowledge';
import { getAllRules, type StandardRule } from '../cad/standards/registry';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const rule = (over: Partial<StandardRule> & Pick<StandardRule, 'id'>): StandardRule => ({
  source: 'TCVN test §1',
  category: 'room-size',
  severity: 'warning',
  description: `mô tả ${over.id}`,
  params: { minMm: 800 },
  verified: false,
  note: 'cần đối chiếu bản gốc',
  ...over,
});

console.log('knowledgeFromRules() — nguồn gốc đi thẳng từ rule, không đoán');
{
  const [e] = knowledgeFromRules([rule({ id: 'a', verified: true, note: undefined, region: 'VN', binding: 'mandatory', loaiNguon: 'luat', nguyenVan: 'Điều 1…' })]);
  ok('id có tiền tố rule:', e.id === 'rule:a');
  ok('verified=true → da-kiem', e.provenance.xacMinh === 'da-kiem');
  ok('region/binding/loaiNguon giữ nguyên', e.provenance.region === 'VN' && e.provenance.binding === 'mandatory' && e.provenance.loaiNguon === 'luat');
  ok('có nguyên văn → coNguyenVan', e.provenance.coNguyenVan === true);
  ok('params là phần máy dùng được', e.mayDung.sanSang && e.mayDung.thamSo?.minMm === 800);
  ok('không có ghi chú khi rule không khai', e.provenance.ghiChu === null);

  const [f] = knowledgeFromRules([rule({ id: 'b' })]);
  ok('verified=false → chua-kiem + note đi theo', f.provenance.xacMinh === 'chua-kiem' && f.provenance.ghiChu === 'cần đối chiếu bản gốc');
  ok('không khai loaiNguon → undefined (KHÔNG suy từ severity/source)', f.provenance.loaiNguon === undefined);
  ok('không nguyên văn → coNguyenVan=false', f.provenance.coNguyenVan === false);
  ok('params là BẢN SAO, sửa không đụng rule gốc', (() => { const r = rule({ id: 'c' }); const [x] = knowledgeFromRules([r]); x.mayDung.thamSo!.minMm = 1; return r.params.minMm === 800; })());
}

console.log('knowledgeFromRules() — chiều thời gian theo resolveRulesAsOf');
{
  const cu = rule({ id: 'old', supersededBy: 'new' });
  const moi = rule({ id: 'new', effectiveFrom: '2025-02-01' });
  const bMoiNhat = knowledgeFromRules([cu, moi]);
  ok('không ngày mốc: bản cũ = da-thay-the', bMoiNhat.find((e) => e.id === 'rule:old')?.hieuLuc === 'da-thay-the');
  ok('không ngày mốc: bản mới = hien-hanh', bMoiNhat.find((e) => e.id === 'rule:new')?.hieuLuc === 'hien-hanh');
  const bTruoc = knowledgeFromRules([cu, moi], '2024-06-01');
  ok('mốc TRƯỚC ngày hiệu lực: bản cũ = chuyen-tiep, có ghi chú', (() => { const o = bTruoc.find((e) => e.id === 'rule:old'); return o?.hieuLuc === 'chuyen-tiep' && !!o.ghiChuHieuLuc; })());
  ok('mốc TRƯỚC: bản mới chưa hiệu lực → da-thay-the (không nằm trong bộ áp dụng)', bTruoc.find((e) => e.id === 'rule:new')?.hieuLuc === 'da-thay-the');
  ok('KHÔNG rule nào bị rơi khỏi danh sách (tri thức cũ vẫn là tri thức)', bMoiNhat.length === 2 && bTruoc.length === 2);
}

console.log('knowledgeFromNotebookSources() — tài liệu người dùng');
{
  const list = knowledgeFromNotebookSources('p1', [
    { id: 's1', kind: 'pdf', title: 'Brief.pdf', status: 'ready', hasFile: true, chunkCount: 12 },
    { id: 's2', kind: 'url', title: 'Bài web', status: 'ready', originalUrl: 'https://example.org/x', chunkCount: 0 },
    { id: 's3', kind: 'pdf', title: 'Đang xử lý.pdf', status: 'processing', hasFile: true, chunkCount: 3 },
  ]);
  ok('3 nguồn → 3 mục', list.length === 3);
  ok('KHÔNG mục nào được khai đã kiểm', list.every((e) => e.provenance.xacMinh === 'chua-kiem'));
  ok('ready + có chunk → máy dùng được', list[0].mayDung.sanSang === true && list[0].mayDung.soChunk === 12);
  ok('0 chunk → chưa dùng được dù ready', list[1].mayDung.sanSang === false);
  ok('processing → chưa dùng được', list[2].mayDung.sanSang === false);
  ok('URL đi vào provenance.url + nguon', list[1].provenance.url === 'https://example.org/x' && list[1].provenance.nguon === 'https://example.org/x');
  ok('href dẫn về notebook đúng dự án', list.every((e) => e.href === '/projects/p1/notebook'));
  ok('id không đụng id rule', list.every((e) => e.id.startsWith('nb:p1:')));
}

console.log('filterKnowledge() · knowledgeStats() · groupKnowledge()');
{
  const rules = [rule({ id: 'old', supersededBy: 'new', verified: true, note: undefined }), rule({ id: 'new', effectiveFrom: '2025-02-01', category: 'egress' })];
  const all = [...knowledgeFromRules(rules), ...knowledgeFromNotebookSources('p1', [{ id: 's', kind: 'pdf', title: 'Tài liệu', status: 'ready', chunkCount: 1 }])];
  ok('mặc định ẩn da-thay-the', filterKnowledge(all).every((e) => e.hieuLuc !== 'da-thay-the') && filterKnowledge(all).length === 2);
  ok('anDaThayThe=false thì hiện đủ', filterKnowledge(all, { anDaThayThe: false }).length === 3);
  ok('lọc kind', filterKnowledge(all, { kind: 'tai-lieu-du-an' }).length === 1);
  ok('chiDaKiem chỉ giữ mục đã đối chiếu (kể cả khi không ẩn thay thế)', filterKnowledge(all, { chiDaKiem: true, anDaThayThe: false }).map((e) => e.id).join() === 'rule:old');
  ok('tìm theo nguồn, không phân biệt hoa thường', filterKnowledge(all, { q: 'tcvn' }).length === 1);
  ok('tìm không ra → rỗng, không ném', filterKnowledge(all, { q: 'zzz' }).length === 0);
  const st = knowledgeStats(all);
  ok('stats đếm đúng', st.tong === 3 && st.daKiem === 1 && st.daThayThe === 1 && st.hienHanh === 2 && st.theoLoai['quy-chuan'] === 2 && st.theoLoai['tai-lieu-du-an'] === 1);
  const g = groupKnowledge(all);
  ok('nhóm giữ thứ tự xuất hiện (room-size · egress · pdf)', g.map((x) => x.nhom).join() === 'room-size,egress,pdf');
  ok('stats trên rỗng = toàn 0', knowledgeStats([]).tong === 0);
}

console.log('bộ luật THẬT của app đi qua adapter');
{
  const real = knowledgeFromRules(getAllRules());
  ok('có rule thật (>0)', real.length > 0);
  ok('mọi mục có nguồn không rỗng', real.every((e) => e.provenance.nguon.trim().length > 0));
  ok('id duy nhất', new Set(real.map((e) => e.id)).size === real.length);
  ok('mục chưa kiểm PHẢI có ghi chú (luật registry)', real.filter((e) => e.provenance.xacMinh === 'chua-kiem').every((e) => !!e.provenance.ghiChu));
}

console.log(`\n${pass} ok · ${fail} fail`);
if (fail > 0) process.exit(1);
