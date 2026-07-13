/**
 * lib/gu.test.ts — kiểm Gu Engine sau HOOK ML pha 1 (palette LAB + moods + prompt). Chạy:
 *   node_modules/.bin/sucrase-node lib/gu.test.ts
 */
import { buildGuProfile, guProfileFromPicked, guToPrompt, type GuAsset } from './gu';
import { paletteMood } from './gu/color-psychology';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function asset(palette: string[], tags = '', caption = ''): GuAsset {
  return { id: 'a', name: '', url: 'u', usage: 'ref-render', palette, caption, tags, w: 100, h: 100 };
}

function testPaletteLabMerge() {
  console.log('\n[1] mergePalette theo LAB — màu gần cảm quan GOM 1 cụm (hết so-hex-khít)');
  // 3 biến thể nâu ấm chỉ lệch 1-2 bậc kênh (ΔE nhỏ) + 1 xanh đậm khác hẳn
  const p = buildGuProfile([
    asset(['#8a5a3c', '#8b5a3d', '#8a5b3c']),
    asset(['#1f4e5f']),
  ]);
  ok('3 nâu gần nhau gộp 1 cụm → palette 2 màu', p.palette.length === 2);
  // cụm nâu 3 phiếu > cụm xanh 1 phiếu → đứng đầu
  ok('cụm đông phiếu đứng đầu (nâu ấm)', /^#8[ab]/i.test(p.palette[0]));
  ok('tất định — chạy lại ra y hệt', JSON.stringify(buildGuProfile([asset(['#8a5a3c', '#8b5a3d', '#8a5b3c']), asset(['#1f4e5f'])]).palette) === JSON.stringify(p.palette));
}

function testTopNClamp() {
  console.log('\n[2] mergePalette giữ trần 6 màu (khớp hành vi topN cũ)');
  // 8 màu cách xa nhau rõ rệt → phải kẹp về 6
  const many = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#884400', '#4488aa'];
  const p = buildGuProfile([asset(many)]);
  ok('≤ 6 màu', p.palette.length <= 6);
  ok('hex sai định dạng bị bỏ', buildGuProfile([asset(['zzz', '#12345', '#8a5a3c'])]).palette.length === 1);
}

function testMoods() {
  console.log('\n[3] GuProfile.moods — tâm-lý-màu gắn từ palette (tất định, giải thích được)');
  const p = buildGuProfile([asset(['#8a5a3c', '#c2703e'])]); // nâu/cam ấm
  ok('có moods', Array.isArray(p.moods) && p.moods!.length > 0);
  ok('mood trội = warm-inviting', p.moods![0].mood === 'warm-inviting');
  ok('khớp paletteMood trên cùng palette', JSON.stringify(p.moods) === JSON.stringify(paletteMood(p.palette).moods));
  const empty = buildGuProfile([]);
  ok('0 ref → moods rỗng (không bịa)', (empty.moods ?? []).length === 0);
}

function testPrompt() {
  console.log('\n[4] guToPrompt — nối mood khi có, giữ nguyên khi không');
  const p = buildGuProfile([asset(['#8a5a3c', '#c2703e'], 'walnut japandi', 'gỗ óc chó ấm')]);
  const s = guToPrompt(p);
  ok('prompt có style/vật liệu như cũ', s.includes('japandi') && s.includes('vật liệu:'));
  ok('prompt nối mood + tỉ trọng', /mood: .*warm-inviting \d+%/.test(s));
  const noMood = guToPrompt({ ...p, moods: undefined });
  ok('thiếu moods → prompt như cũ (không đuôi mood)', !noMood.includes('mood:'));
}

function testPickedPath() {
  console.log('\n[5] guProfileFromPicked — đường ảnh-đã-chọn vẫn chạy, có moods');
  const p = guProfileFromPicked([
    { name: 'ref', url: 'u', usage: 'ref-render', palette: ['#eae5da', '#efe9dc'], caption: '', tags: 'quiet luxury' },
  ]);
  ok('palette gộp LAB (2 kem gần nhau → 1)', p.palette.length === 1);
  ok('mood trung tính sang (luxe-neutral)', p.moods![0].mood === 'luxe-neutral');
}

function testSubject() {
  console.log('\n[6] ROOM_TERMS → subject (Sprint 2, §2a.2) — VI + EN, xếp theo tần suất');
  const p = buildGuProfile([
    asset(['#8a5a3c'], 'phòng khách japandi', ''),
    asset(['#8a5a3c'], '', 'a cozy living room with walnut'),
    asset(['#8a5a3c'], 'bedroom', ''),
  ]);
  ok('nhận subject từ tag VI + caption EN', (p.subject ?? []).includes('living room') && (p.subject ?? []).includes('bedroom'));
  ok('tần suất cao đứng đầu (living room 2 phiếu > bedroom 1)', p.subject![0] === 'living room');
  ok('mỗi asset chỉ góp 1 phiếu/subject (không đếm trùng trong 1 chuỗi)',
    buildGuProfile([asset(['#8a5a3c'], 'bedroom bedroom phòng ngủ', '')]).subject!.filter((s) => s === 'bedroom').length === 1);
  ok('không nhận ra gì → subject rỗng (không bịa)', buildGuProfile([asset(['#8a5a3c'], 'abc', 'xyz')]).subject!.length === 0);
  ok('tất định — chạy lại y hệt', JSON.stringify(buildGuProfile([
    asset(['#8a5a3c'], 'phòng khách japandi', ''),
    asset(['#8a5a3c'], '', 'a cozy living room with walnut'),
    asset(['#8a5a3c'], 'bedroom', ''),
  ]).subject) === JSON.stringify(p.subject));
}

function testSubjectPrompt() {
  console.log('\n[7] guToPrompt nối subject — đứng ĐẦU prompt, thiếu subject giữ nguyên như cũ');
  const p = buildGuProfile([asset(['#8a5a3c'], 'phòng ngủ walnut japandi', '')]);
  const s = guToPrompt(p);
  ok('subject đứng đầu prompt (bedroom interior)', s.startsWith('bedroom interior'));
  ok('phần còn lại giữ nguyên (style/vật liệu/tông)', s.includes('japandi') && s.includes('vật liệu:'));
  const legacy = guToPrompt({ ...p, subject: undefined }); // JSON cũ thiếu field
  ok('thiếu subject → prompt y hệt trước (không đầu "interior" thừa)', !legacy.includes('interior'));
  ok('tối đa 2 subject vào prompt', guToPrompt({ ...p, subject: ['bedroom', 'kitchen', 'lobby'] }).startsWith('bedroom, kitchen interior'));
}

testPaletteLabMerge();
testTopNClamp();
testMoods();
testPrompt();
testPickedPath();
testSubject();
testSubjectPrompt();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
