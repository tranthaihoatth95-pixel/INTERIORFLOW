/**
 * lib/shortcuts.test.ts — 7.3.33: không tổ hợp phím trùng trong cùng scope, mọi mục có label.
 *   node_modules/.bin/sucrase-node lib/shortcuts.test.ts
 */
import { SHORTCUTS, formatShortcutKeys, cadTypedCommandGroups, cadTypedCommandGroupsByCategory, type ShortcutScope } from './shortcuts';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function testNoDuplicateWithinScope() {
  console.log('\n[1] không tổ hợp phím trùng trong cùng scope');
  const scopes: ShortcutScope[] = ['toàn cục', 'cad', 'render', 'present'];
  for (const scope of scopes) {
    const seen = new Set<string>();
    let dupFound: string | null = null;
    for (const s of SHORTCUTS.filter((x) => x.scope === scope)) {
      const key = s.keys.join('+');
      if (seen.has(key)) { dupFound = key; break; }
      seen.add(key);
    }
    ok(`scope "${scope}" — 0 trùng lặp`, dupFound === null);
  }
}

function testNoEmptyLabel() {
  console.log('\n[2] mọi mục có label không rỗng');
  ok('tất cả SHORTCUTS có label.trim().length > 0', SHORTCUTS.every((s) => s.label.trim().length > 0));
  ok('tất cả SHORTCUTS có keys.length > 0', SHORTCUTS.every((s) => s.keys.length > 0));
}

function testExecutableCadPrintShortcut() {
  console.log('\n[3] lệnh xuất PDF CAD có phím thật, không còn ghi dự kiến');
  const print = SHORTCUTS.find((s) => s.scope === 'cad' && s.keys.join('+') === 'mod+P');
  ok('có ⌘P/Ctrl+P trong nguồn phím tắt chung', !!print);
  ok('⌘P/Ctrl+P đã bật hành vi thật', !!print && !print.disabled);
}

function testFormatShortcutKeys() {
  console.log('\n[4] formatShortcutKeys — Mac vs Windows');
  ok('Mac: mod+Z → "⌘Z"', formatShortcutKeys(['mod', 'Z'], true) === '⌘Z');
  ok('Windows: mod+Z → "Ctrl+Z"', formatShortcutKeys(['mod', 'Z'], false) === 'Ctrl+Z');
  ok('Mac: mod+shift+S → "⌘⇧S"', formatShortcutKeys(['mod', 'shift', 'S'], true) === '⌘⇧S');
  ok('Windows: mod+shift+S → "Ctrl+Shift+S"', formatShortcutKeys(['mod', 'shift', 'S'], false) === 'Ctrl+Shift+S');
  ok('token không phải mod/shift giữ nguyên chữ (F8)', formatShortcutKeys(['F8'], true) === 'F8');
  ok('token không phải mod/shift giữ nguyên chữ (F8), Windows', formatShortcutKeys(['F8'], false) === 'F8');
}

function testCadTypedCommandGroups() {
  console.log('\n[5] cadTypedCommandGroups — đọc từ command-aliases.ts, không chép tay');
  const groups = cadTypedCommandGroups();
  ok('có ít nhất 30 nhóm lệnh (danh mục CAD thật khá dài)', groups.length >= 30);
  // Lưu ý: gộp nhóm dựa trên LABEL TRÙNG TUYỆT ĐỐI — 'XL'/'XLINE' có label khác nhau ("Xline —
  // đường tham chiếu vô hạn" vs "Xline") trong chính command-aliases.ts nên KHÔNG gộp, ra 2
  // dòng riêng trong bảng tra (đúng dữ liệu gốc, không phải lỗi gộp — không sửa data gốc ở đây,
  // ngoài phạm vi sprint này). Test bằng cặp label khớp tuyệt đối để xác nhận cơ chế gộp đúng.
  const arrayRect = groups.find((g) => g.label === 'Mảng chữ nhật');
  ok('nhóm Mảng chữ nhật có cả AR và ARRAY', !!arrayRect && arrayRect.cmds.includes('AR') && arrayRect.cmds.includes('ARRAY'));
  const arrayPolar = groups.find((g) => g.label === 'Mảng tròn');
  ok('nhóm Mảng tròn có cả ARP và ARRAYPOLAR', !!arrayPolar && arrayPolar.cmds.includes('ARP') && arrayPolar.cmds.includes('ARRAYPOLAR'));
  ok('mọi nhóm có ít nhất 1 cmd', groups.every((g) => g.cmds.length > 0));
}

function testCadTypedCommandGroupsByCategory() {
  console.log('\n[6] cadTypedCommandGroupsByCategory — 5 nhóm hiển thị (mẫu Hoà 31/07)');
  const cats = cadTypedCommandGroupsByCategory();
  const flatCount = cadTypedCommandGroups().length;
  const catCount = cats.reduce((n, c) => n + c.items.length, 0);
  ok('tổng số dòng theo category = tổng số dòng flat (không mất/nhân đôi dòng nào)', catCount === flatCount);
  ok('mọi category có ít nhất 1 dòng', cats.every((c) => c.items.length > 0));
  ok('có nhóm "Vẽ"', cats.some((c) => c.group === 'Vẽ'));
  ok('có nhóm "Biến đổi"', cats.some((c) => c.group === 'Biến đổi'));
  ok('có nhóm "Chọn, xoá, hoàn tác"', cats.some((c) => c.group === 'Chọn, xoá, hoàn tác'));
}

testNoDuplicateWithinScope();
testNoEmptyLabel();
testExecutableCadPrintShortcut();
testFormatShortcutKeys();
testCadTypedCommandGroups();
testCadTypedCommandGroupsByCategory();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
