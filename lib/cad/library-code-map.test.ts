/**
 * lib/cad/library-code-map.test.ts — MÁY CANH chống lệch tên giữa KỆ và KHO.
 *
 * Bệnh test này khoá (đo 20/08): kệ `cad-kyhieu` khai 12 món, nhưng **4 món kéo xuống bản vẽ ra
 * Δ entity = 0** vì kệ và kho gọi cùng một vật bằng hai cái tên khác nhau, mà sợi dây nối duy
 * nhất lại là khớp TÊN HIỂN THỊ. Không ai phát hiện được bằng tsc/test cũ: hai danh sách đứng
 * riêng thì mỗi bên đều nhất quán, chỉ lộ khi ĐẶT CẠNH NHAU.
 *
 * ⇒ Luật canh ở đây: **mọi món kệ khai đều phải đi được xuống bản vẽ, hoặc khai THẲNG là kho
 * chưa có.** Không có cửa thứ ba (im lặng không ra gì). Lệch tên trong tương lai = test ĐỎ,
 * không phải người dùng phát hiện.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/library-code-map.test.ts
 */
import { resolveLibraryItem } from './library-item-resolve';
import { KE_ITEM_TARGET, unavailableReason } from './library-code-map';
import { BLOCKS } from './furniture';
import { itemsFor } from '../library/shelves';
import type { LibraryManifest } from './block-library';

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

/** Kho THẬT trên đĩa — không bịa dữ liệu giả, đúng cách `library-item-resolve.test.ts` đã làm. */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MANIFEST = require('../../public/cad-library/manifest.json') as LibraryManifest;

/** Mọi kệ built-in có món hình vẽ — quét HẾT, không lấy mẫu vài món đầu (đúng cách bug này lọt:
 *  lượt soi trước chỉ xem 6/12 nên đếm thiếu một món hỏng). */
const SHELVES_CO_HINH = ['cad-kyhieu'] as const;

function testMoiMonDeuDiDuocXuongBanVe() {
  console.log('\n[1] MỌI món trên kệ: hoặc resolve được, hoặc khai thẳng là kho chưa có');
  for (const shelfId of SHELVES_CO_HINH) {
    const items = itemsFor('cad', shelfId, 'all');
    ok(`kệ ${shelfId} có món để kiểm`, items.length > 0);
    for (const it of items) {
      const r = resolveLibraryItem({ name: it.name, code: it.code, kind: it.kind }, MANIFEST);
      const khai = unavailableReason(it.code);
      // Đây là khẳng định ăn tiền: null mà KHÔNG khai lý do = món câm, đúng bệnh đang chữa.
      ok(
        `${it.code} "${it.name}" — ${r ? `thả ra ${r.via}` : khai ? 'khai thẳng kho chưa có' : 'CÂM (thả không ra gì)'}`,
        r !== null || khai !== undefined,
      );
      // Và ngược lại: đã khai chưa-có thì resolver phải nhất quán trả null, không được vẫn thả ra
      // một món gần giống — hai bên nói hai kiểu còn tệ hơn cả hai bên cùng sai.
      if (khai) ok(`${it.code} khai chưa-có ⇒ resolver cũng trả null (không nói hai kiểu)`, r === null);
    }
  }
}

function testBangGhimTroDungCho() {
  console.log('\n[2] Bảng ghim không trỏ vào hư không (id kho phải có thật)');
  for (const [code, t] of Object.entries(KE_ITEM_TARGET)) {
    if (t.blockId) ok(`${code} → BLOCKS:${t.blockId} có thật`, BLOCKS.some((b) => b.id === t.blockId));
    if (t.manifestId) {
      ok(`${code} → manifest:${t.manifestId} có thật`, MANIFEST.blocks.some((m) => m.id === t.manifestId));
    }
    ok(`${code} khai đúng MỘT đích (kho ①, kho ②, hoặc chưa-có)`,
      [t.blockId, t.manifestId, t.missing].filter(Boolean).length === 1);
  }
}

function testKhongCoDongChet() {
  console.log('\n[3] Bảng ghim không có dòng chết (mã không còn trên kệ nào)');
  const moiMa = new Set(SHELVES_CO_HINH.flatMap((s) => itemsFor('cad', s, 'all').map((i) => i.code)));
  for (const code of Object.keys(KE_ITEM_TARGET)) {
    // Dòng chết không làm gãy gì, nhưng nó là dấu hiệu kệ vừa đổi mà bảng chưa theo — thứ đẻ ra
    // đúng loại lệch này. Bắt sớm còn hơn để nó tích lại.
    ok(`${code} còn được kệ dùng`, moiMa.has(code));
  }
}

function testGhimThangKhopTen() {
  console.log('\n[4] Ghim ĐỨNG TRƯỚC khớp-tên, và khớp-tên vẫn là đường lùi');
  // 'BED-160' trước bản vá: khớp-tên trượt cả 3 luật (tên kho "Giường đôi" không mang con số).
  const bed = resolveLibraryItem({ name: 'Giường 1m6', code: 'BED-160', kind: 'furniture' }, MANIFEST);
  ok('BED-160 ra đúng bedD (w1600) nhờ ghim', bed?.via === 'blockdef' && bed.def.id === 'bedD');
  ok('ghim đúng món ⇒ KHÔNG gắn cờ gần-đúng', bed?.approximate === false);

  // Món không nằm trong bảng ghim vẫn phải chạy đường khớp-tên như trước — bảng thêm đường,
  // không cắt đường.
  const cu = resolveLibraryItem({ name: 'Bàn trà', code: 'KHONG-CO-TRONG-BANG', kind: 'furniture' }, MANIFEST);
  ok('món ngoài bảng vẫn khớp-tên được (Bàn trà → coffeeTable)', cu?.via === 'blockdef' && cu.def.id === 'coffeeTable');

  // Ghim vào kho ② mà manifest chưa tải xong ⇒ rơi xuống khớp-tên, KHÔNG trả null sớm.
  const noManifest = resolveLibraryItem({ name: 'Bếp chữ L', code: 'KIT-L', kind: 'furniture' }, null);
  ok('ghim manifest + manifest chưa tải ⇒ không chết, vẫn thử khớp-tên', noManifest === null || noManifest.via === 'blockdef');

  // Khai chưa-có phải THẮNG cả khớp-tên: 'Người · tỉ lệ' không được vồ bừa món nào.
  ok('SCALE-H khai chưa-có ⇒ luôn null', resolveLibraryItem({ name: 'Người · tỉ lệ', code: 'SCALE-H', kind: 'misc' }, MANIFEST) === null);
}

testMoiMonDeuDiDuocXuongBanVe();
testBangGhimTroDungCho();
testKhongCoDongChet();
testGhimThangKhopTen();

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok · ${fail} fail`);
if (fail > 0) process.exit(1);
