/**
 * components/ui/icon.test.ts — KHOÁ NGỮ PHÁP ICON.
 * Chạy: node_modules/.bin/sucrase-node components/ui/icon.test.ts
 *
 * Test này canh HẰNG SỐ, không canh render — nó chặn đúng cái đã xảy ra: có người đổi 1.5 → 2
 * "cho đậm hơn một chỗ", rồi thang vỡ dần. Đo 23/08 trước khi có primitive: 12 giá trị nét và
 * 12 cỡ khác nhau đang chạy song song.
 */
import assert from 'node:assert';
import { readFileSync } from 'node:fs';

let pass = 0;
const ok = (m: string) => { console.log('  ok  -', m); pass++; };

const src = readFileSync('components/ui/Icon.tsx', 'utf8');

assert.ok(/ICON_SIZES = \[14, 16, 18, 20\]/.test(src), 'ICON_SIZES phải đúng bốn cỡ Sheet chốt');
ok('cỡ quang học = {14,16,18,20}, không hơn không kém');

assert.ok(/ICON_STROKE = 1\.5\b/.test(src), 'ICON_STROKE phải là 1.5');
ok('nét = 1.5, "one value, no exceptions"');

assert.ok(/strokeWidth=\{ICON_STROKE\}/.test(src), 'phải truyền hằng, không gõ số tại chỗ');
ok('nét truyền bằng HẰNG — không ai đổi lẻ được ở call site');

assert.ok(/strokeLinecap="round"/.test(src) && /strokeLinejoin="round"/.test(src), 'đầu/góc phải bo tròn');
ok('linecap + linejoin = round');

assert.ok(/fill=\{selected \? 'currentColor' : 'none'\}/.test(src), 'tô đặc CHỈ khi selected');
ok('viền là trạng thái nghỉ; tô đặc chỉ để báo selected/on — cùng một glyph');

assert.ok(/color="currentColor"/.test(src), 'icon không tự chọn màu');
ok('currentColor — màu do ngữ cảnh quyết');

assert.ok(/aria-hidden=\{label \? undefined : true\}/.test(src), 'không nhãn ⇒ ẩn khỏi trình đọc');
ok('có nhãn thì đọc được, không nhãn thì là trang trí và bị ẩn');

// Kiểu IconSize là CỔNG: nếu ai nới thành `number` thì test này đỏ.
assert.ok(/size\?: IconSize/.test(src), 'size phải nhận IconSize, KHÔNG phải number');
ok('size là kiểu hẹp — truyền 13 là tsc đỏ, không đợi máy soi');

console.log(`\n${pass} assertions PASS`);

/* ═══════════════════════════════════════════════════════════════════════════════════════════
   GUARD KIỂU — thêm 23/08 sau khi primitive này lọt lưới suốt một ngày.
   Bộ test cũ khoá đủ hằng số (cỡ · nét · viewBox) và in 8 PASS, nhưng KHÔNG ca nào đưa một icon
   lucide THẬT vào `glyph`. Nên `strokeWidth?: number` (hẹp hơn `LucideProps`) vẫn xanh, trong khi
   mọi chỗ dùng thật đều là `tsc` đỏ. Test xanh, primitive chưa từng chạy được.
   Dòng dưới là ca đã lọt, nay khoá lại: nó KHÔNG chạy lúc test — nó chạy lúc `tsc`. Hẹp kiểu
   `glyph` lần nữa là biên dịch đỏ ngay, không đợi ai đi grep.
   (Bài học 15/08, bug Hough: test khẳng định đường THOÁI LUI mà không có test nào khẳng định
   đường CHÍNH chạy được thì đó là test CHE bug.)
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
import { Move } from 'lucide-react';
import type { IconProps } from './Icon';
const _guardLucide: IconProps['glyph'] = Move;
void _guardLucide;
