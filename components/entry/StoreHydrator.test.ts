/**
 * components/entry/StoreHydrator.test.ts — kiểm CA DEEP-LINK cho bug C7 (02/08): `store.hydrate()`
 * trước đây chỉ chạy khi qua `HomeScreen.tsx` ('/'), deep-link thẳng route con bỏ qua bước này.
 *
 * KHÔNG có hạ tầng render React trong repo (không jsdom/@testing-library) — mọi test ở đây đều
 * thuần sucrase-node. Test THEO KHUÔN `lib/cad/idf-neutrality.test.ts`: quét SOURCE THẬT bằng
 * `fs.readFileSync`, khẳng định bất biến kiến trúc thay vì dựng DOM giả. Đúng bản chất bug (SAI
 * VỊ TRÍ MOUNT, không phải sai logic hydrate()) — quét đúng chỗ dễ tái phạm nhất: ai đó xoá
 * `<StoreHydrator />` khỏi layout gốc, hoặc thêm lại `store.hydrate()` cục bộ ở 1 route con (vá
 * riêng lẻ — đúng lỗi cũ) thay vì sửa ở tầng gốc.
 *
 * Chạy: node_modules/.bin/sucrase-node components/entry/StoreHydrator.test.ts
 */
import fs from 'node:fs';
import path from 'node:path';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

const root = path.join(__dirname, '..', '..');
const layoutSrc = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
const hydratorSrc = fs.readFileSync(path.join(root, 'components/entry/StoreHydrator.tsx'), 'utf8');
const homeScreenSrc = fs.readFileSync(path.join(root, 'components/home/HomeScreen.tsx'), 'utf8');

console.log('app/layout.tsx — StoreHydrator mount ở TẦNG GỐC, chạy MỌI route (deep-link được)');
{
  ok('layout.tsx import StoreHydrator', /import\s*\{\s*StoreHydrator\s*\}\s*from\s*['"]@\/components\/entry\/StoreHydrator['"]/.test(layoutSrc));
  ok('layout.tsx render <StoreHydrator />', /<StoreHydrator\s*\/>/.test(layoutSrc));
  // Phải đứng TRƯỚC {children} trong cùng cây JSX — store cần có giá trị trước khi route con đọc.
  const hydratorIdx = layoutSrc.indexOf('<StoreHydrator');
  const childrenIdx = layoutSrc.indexOf('{children}');
  ok('StoreHydrator đứng TRƯỚC {children}', hydratorIdx >= 0 && childrenIdx >= 0 && hydratorIdx < childrenIdx);
}

console.log('StoreHydrator.tsx — gọi hydrate() KHÔNG điều kiện theo route/pathname');
{
  ok('gọi useFlowStore.getState().hydrate()', /useFlowStore\.getState\(\)\.hydrate\(\)/.test(hydratorSrc));
  ok('effect deps rỗng — chạy đúng 1 lần lúc mount, không phụ thuộc pathname', /\}, \[\]\)/.test(hydratorSrc));
  // Bug gốc là "chỉ hydrate khi Ở route cụ thể" — cấm mọi điều kiện theo pathname/usePathname
  // tái xuất hiện trong chính component chịu trách nhiệm hydrate toàn cục.
  ok('KHÔNG có usePathname (mọi điều kiện theo route quay lại đúng bug cũ)', !/usePathname/.test(hydratorSrc));
}

console.log('HomeScreen.tsx — KHÔNG tự gọi hydrate() cục bộ nữa (1 nguồn duy nhất ở layout gốc)');
{
  // Bỏ phần comment (`//…`) trước khi quét — nhắc tới "hydrate()" trong lời giải thích (vd
  // "đã chuyển lên StoreHydrator") là hợp lệ, chỉ cấm LỆNH GỌI THẬT còn sót lại.
  const codeOnly = homeScreenSrc
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
  ok('không còn lệnh gọi hydrate() thật (ngoài comment) trong HomeScreen', !/\.hydrate\(\)/.test(codeOnly));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
