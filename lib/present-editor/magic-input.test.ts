import { magicBodyText } from './magic-input';

let pass = 0;
let fail = 0;
function ok(label: string, condition: boolean) {
  if (condition) {
    pass++;
    console.log(`  ok  - ${label}`);
  } else {
    fail++;
    console.error(`  FAIL - ${label}`);
  }
}

console.log('\nMagic input — bốn tổ hợp dữ liệu');
const full = magicBodyText('# Concept thật', true);
ok('text + ảnh giữ nguyên nội dung thật', full.bodyText === '# Concept thật' && !full.usesDraftCopy);

const textOnly = magicBodyText('  # Brief  ', false);
ok('chỉ text vẫn giữ nội dung thật', textOnly.bodyText === '# Brief' && !textOnly.usesDraftCopy);

const imageOnly = magicBodyText('', true);
ok('chỉ ảnh sinh sườn nháp và nói sẽ phân bổ ảnh', imageOnly.usesDraftCopy && imageOnly.bodyText.includes('Hình ảnh đã cung cấp'));

const empty = magicBodyText('   ', false);
ok('không có gì vẫn sinh sườn, ghi rõ nội dung mẫu và vị trí ảnh', empty.usesDraftCopy && empty.bodyText.includes('Nội dung mẫu — cần chỉnh') && empty.bodyText.includes('Vị trí hình ảnh'));

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
