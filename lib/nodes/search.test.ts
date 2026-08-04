/**
 * lib/nodes/search.test.ts — tìm node bằng TIẾNG VIỆT (có dấu & không dấu) + keywords.
 * Bug gốc: search chỉ khớp title/description/type → gõ "vách", "tách nền", "hoa văn" ra 0 kết quả.
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/search.test.ts
 */
import { normalizeSearch, nodeMatches, nodeScore, textScore } from './search';
import { NODE_KEYWORDS, keywordsFor } from './keywords';

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

/** def giả tối thiểu — chỉ các field mà search dùng. */
function def(type: string, title: string, description = '') {
  return { type, title, description } as unknown as Parameters<typeof nodeMatches>[0];
}

console.log('normalizeSearch');
ok('bỏ dấu tiếng Việt', normalizeSearch('Vách Ốp Đá') === 'vach op da');
ok('đ → d', normalizeSearch('đổi vật liệu') === 'doi vat lieu');
ok('gom khoảng trắng', normalizeSearch('  tách   nền ') === 'tach nen');

console.log('nodeMatches — các từ user gõ thật');
const swap = def('ai.materialswap', 'Material Swap', 'Mask vùng (sàn/tường/tủ) + prompt vật liệu mới → inpaint');
const removebg = def('ai.removebg', 'Remove BG', 'Tách sản phẩm / đồ nội thất khỏi nền');
const upscale = def('ai.upscale', 'Upscale 4K', 'ESRGAN upscale — xuất in ấn');
const pattern = def('ai.pattern', 'Pattern Studio (hoa văn)', 'Hoa văn cho vách · giấy dán tường');
const warp = def('util.warp', 'Perspective Warp (4 góc)', 'Kéo 4 góc để dán pattern lên mặt vách nghiêng');
const smart = def('ai.smartselect', 'Smart Select (chọn vùng)', 'Bấm vào vật thể → chọn đúng biên bằng SAM 2');

ok('"vách" → Material Swap', nodeMatches(swap, 'vách'));
ok('"vach" (không dấu) → Material Swap', nodeMatches(swap, 'vach'));
ok('"đổi vật liệu" → Material Swap', nodeMatches(swap, 'đổi vật liệu'));
ok('"tach nen" (không dấu) → Remove BG', nodeMatches(removebg, 'tach nen'));
ok('"phóng to" → Upscale', nodeMatches(upscale, 'phóng to'));
ok('"hoa văn" → Pattern Studio', nodeMatches(pattern, 'hoa văn'));
ok('"giay dan tuong" → Pattern Studio', nodeMatches(pattern, 'giay dan tuong'));
ok('"dán lên tường" → Warp', nodeMatches(warp, 'dán lên tường'));
ok('"chọn vùng" → Smart Select', nodeMatches(smart, 'chọn vùng'));
ok('"magic wand" (EN) → Smart Select', nodeMatches(smart, 'magic wand'));
ok('không liên quan thì KHÔNG khớp', !nodeMatches(upscale, 'hoa văn'));

/* 05/08 — nhãn tách VI/EN (`title` chỉ tiếng Việt, tên tiếng Anh sang `titleEn`). Kho chữ
   tìm kiếm PHẢI gộp `titleEn`, không thì gõ tên tiếng Anh của công cụ ra 0 kết quả. */
console.log('titleEn — tên tiếng Anh vẫn tìm được sau khi tách khỏi nhãn');
function defEn(type: string, title: string, titleEn: string, description = '') {
  return { type, title, titleEn, description } as unknown as Parameters<typeof nodeMatches>[0];
}
const batch = defEn('ai.batchvariants', 'Sinh nhiều phương án', 'Batch Variants');
const inpaint = defEn('ai.localedit', 'Sửa vùng', 'Inpainting');
ok('"batch variants" (EN, không còn trong title) → node Sinh nhiều phương án', nodeMatches(batch, 'batch variants'));
ok('"inpainting" (thuật ngữ ngành) → node Sửa vùng', nodeMatches(inpaint, 'inpainting'));
ok('nhãn tiếng Việt mới vẫn khớp', nodeMatches(inpaint, 'sua vung'));
ok('node KHÔNG khai titleEn vẫn không throw', nodeMatches(def('x.y', 'Chỉ tiếng Việt'), 'tieng viet'));

console.log('nodeScore — thứ tự');
ok('title bắt đầu bằng query = 3 điểm', nodeScore(def('x.y', 'Upscale 4K'), 'upscale') === 3);
ok('chỉ keywords khớp = 1 điểm', nodeScore(upscale, 'phóng to') === 1);
ok('query rỗng = 3 (giữ nguyên danh sách)', nodeScore(upscale, '  ') === 3);
ok('nhiều từ phải khớp HẾT', !nodeMatches(swap, 'vách xyzkhongco'));

console.log('textScore (⌘K, có cả mục Hành động)');
ok('hành động khớp keyword không dấu', textScore('Tự sắp xếp graph', 'arrange dagre tidy sắp xếp', 'sap xep') >= 1);
ok('không khớp → -1', textScore('Undo', 'hoàn tác', 'hoa van') === -1);

console.log('bảng keywords');
ok('30+ node đã có keywords', Object.keys(NODE_KEYWORDS).length >= 30);
ok(
  'mọi entry đều có ít nhất 1 từ tiếng Việt (ký tự có dấu hoặc từ Việt)',
  Object.values(NODE_KEYWORDS).every((ks) => ks.length >= 3),
);
ok('node tự khai keywords được ưu tiên', keywordsFor('ai.upscale', ['riêng'])[0] === 'riêng');
ok('node lạ → mảng rỗng, không throw', keywordsFor('khong.ton.tai').length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
