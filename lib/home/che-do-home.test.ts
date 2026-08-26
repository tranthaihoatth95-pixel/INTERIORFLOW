import { CHE_DO_HOME, laBonDai, nhipDai, NHAN_CHE_DO } from './che-do-home';
let fail = 0;
const ok = (m: string, c: unknown) => { if (c) console.log(`  ok  - ${m}`); else { console.log(`  FAIL - ${m}`); fail++; } };

console.log('\n[1] Bốn chế độ, ba chế độ đầu CÙNG thứ tự đọc');
ok('đúng bốn chế độ', CHE_DO_HOME.length === 4);
ok('calm/editorial/compact đều là bố cục BỐN DẢI', ['calm', 'editorial', 'compact'].every((c) => laBonDai(c as never)));
ok('chỉ `custom` mới là bố cục cũ', !laBonDai('custom'));
ok('mọi chế độ có nhãn song ngữ + mô tả', CHE_DO_HOME.every((c) => NHAN_CHE_DO[c].vi && NHAN_CHE_DO[c].en && NHAN_CHE_DO[c].moTa[0]));

console.log('\n[2] Ba chế độ khác MẬT ĐỘ, không khác CẤU TRÚC');
const a = nhipDai('calm'), b = nhipDai('compact'), c = nhipDai('editorial');
ok('compact thở ít hơn calm', b.gap < a.gap && b.leTren < a.leTren);
ok('editorial thở nhiều hơn calm', c.gap > a.gap && c.coChu > a.coChu);
ok('mọi chế độ đều có đủ ba số, không có 0', [a, b, c].every((x) => x.gap > 0 && x.leTren > 0 && x.coChu > 0));

console.log(fail ? `\n❌ ${fail} kiểm HỎNG` : '\n✅ Tất cả kiểm ĐẠT');
if (fail) process.exit(1);
