/**
 * lib/tasks/scaffolder.test.ts — kiểm ProjectScaffolder thuần. Chạy:
 *   node_modules/.bin/sucrase-node lib/tasks/scaffolder.test.ts
 */
import { suggestScaffold, stageForTemplate, TEMPLATE_STAGE, LOAI_HINH_OPTIONS } from './scaffolder';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('\n[1] nhà ở → concept + technical, đều stage concept');
{
  const s = suggestScaffold({ loaiHinh: 'nha-o' });
  ok('2 gợi ý', s.length === 2);
  ok('đúng bộ concept,technical', s.map((x) => x.templateKey).join(',') === 'concept,technical');
  ok('cả 2 stage=concept', s.every((x) => x.stage === 'concept'));
  ok('căn cứ nêu loại hình', s[0].reasonVi.includes('Nhà ở'));
}

console.log('\n[2] văn phòng & F&B → concept + fitout');
{
  const vp = suggestScaffold({ loaiHinh: 'van-phong' });
  const fb = suggestScaffold({ loaiHinh: 'fnb' });
  ok('văn phòng: concept,fitout', vp.map((x) => x.templateKey).join(',') === 'concept,fitout');
  ok('F&B: concept,fitout', fb.map((x) => x.templateKey).join(',') === 'concept,fitout');
  ok('F&B căn cứ EN có project type', fb[0].reasonEn.startsWith('based on project type'));
}

console.log('\n[3] khách sạn → technical + fitout, stage đều concept (2D)');
{
  const s = suggestScaffold({ loaiHinh: 'khach-san' });
  ok('technical,fitout', s.map((x) => x.templateKey).join(',') === 'technical,fitout');
  ok('stage concept cho cả 2', s.every((x) => x.stage === 'concept'));
}

console.log('\n[4] thiếu loại hình → [] — máy im, KHÔNG đoán (X2)');
{
  ok('profile null', suggestScaffold(null).length === 0);
  ok('profile undefined', suggestScaffold(undefined).length === 0);
  ok('loaiHinh null', suggestScaffold({ loaiHinh: null }).length === 0);
  ok('loaiHinh rỗng/space', suggestScaffold({ loaiHinh: '  ' }).length === 0);
}

console.log('\n[5] khoá lạ → [] — không gợi ý ma');
{
  ok('khoá lạ', suggestScaffold({ loaiHinh: 'biet-thu-tren-sao-hoa' }).length === 0);
  ok('nhãn VI (không phải khoá) cũng coi là lạ', suggestScaffold({ loaiHinh: 'Nhà ở / căn hộ' }).length === 0);
}

console.log('\n[6] TEMPLATE_STAGE phủ đủ 5 bộ BOARD_TEMPLATES, giá trị hợp lệ');
{
  const keys = ['concept', 'technical', 'render', 'present', 'fitout'];
  ok('đủ 5 khoá', keys.every((k) => k in TEMPLATE_STAGE));
  ok('render→render · present→present', TEMPLATE_STAGE.render === 'render' && TEMPLATE_STAGE.present === 'present');
  ok('technical/fitout → concept', TEMPLATE_STAGE.technical === 'concept' && TEMPLATE_STAGE.fitout === 'concept');
}

console.log('\n[7] stageForTemplate — người dùng tự tick ngoài gợi ý vẫn có stage');
{
  ok('render → render', stageForTemplate('render') === 'render');
  ok('khoá lạ → null (không bịa stage)', stageForTemplate('khong-ton-tai') === null);
}

console.log('\n[8] mọi templateKey trong SCAFFOLD_MAP đều có stage (không gợi ý bộ mồ côi)');
{
  const all = LOAI_HINH_OPTIONS.flatMap((o) => suggestScaffold({ loaiHinh: o.key }));
  ok('4 loại hình đều có gợi ý', LOAI_HINH_OPTIONS.every((o) => suggestScaffold({ loaiHinh: o.key }).length > 0));
  ok('gợi ý nào cũng có stage', all.every((s) => !!s.stage));
  ok('gợi ý nào cũng ≤2 bộ', LOAI_HINH_OPTIONS.every((o) => suggestScaffold({ loaiHinh: o.key }).length <= 2));
}

console.log(`\nscaffolder.test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
