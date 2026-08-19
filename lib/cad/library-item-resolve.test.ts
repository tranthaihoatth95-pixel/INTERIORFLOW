/**
 * lib/cad/library-item-resolve.test.ts — G-M3-14: thả món từ Thư viện phải RƠI XUỐNG bản vẽ.
 *
 * Luật được canh ở đây (theo đúng thứ tự nguy hiểm):
 *   [1] ưu tiên kho giữ được DANH TÍNH (`BLOCKS` → `BlockEntity`), không phải kho làm phẳng;
 *   [2] không khớp được thì trả `null` + câu nói THẬT — cấm thả bừa một hình mang tên món khác
 *       (bệnh cũ: toast báo "đã tạo" trong khi bản vẽ trống trơn);
 *   [3] món KHÔNG phải hình vẽ (vật liệu/hatch/preset) không được lọt vào đường thả.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/library-item-resolve.test.ts
 */
import { resolveLibraryItem, normalizeKey, unresolvedMessage, DROPPABLE_ITEM_KINDS } from './library-item-resolve';
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

/** Manifest THẬT trên đĩa (`public/cad-library/manifest.json`) — không bịa dữ liệu giả. */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MANIFEST = require('../../public/cad-library/manifest.json') as LibraryManifest;

function testNormalize() {
  console.log('\n[0] Chuẩn hoá khoá so tên');
  ok('bỏ dấu + bỏ ký tự lạ', normalizeKey('Sofa 3 chỗ') === 'sofa3cho');
  ok('đ → d', normalizeKey('Bàn đá') === 'banda');
  ok('mã gạch ngang', normalizeKey('SOFA-3S') === 'sofa3s');
  ok('dấu × trong tên block', normalizeKey('Bàn làm việc 1400×700') === 'banlamviec1400700');
}

function testPrefersIdentity() {
  console.log('\n[1] Ưu tiên kho GIỮ DANH TÍNH (BlockEntity), không phải kho làm phẳng');
  const r = resolveLibraryItem({ name: 'Sofa 3 chỗ', code: 'SOFA-3S', kind: 'furniture' }, MANIFEST);
  ok('khớp được', r !== null);
  ok('đi đường BLOCKS', r?.via === 'blockdef');
  ok('khai rõ là giữ danh tính', r?.keepsIdentity === true);
  ok('đúng block sofa 3 chỗ', r?.via === 'blockdef' && r.def.id === 'sofa3');

  const win = resolveLibraryItem({ name: 'Cửa sổ trượt', code: 'WIN-SL-1800', kind: 'block' }, MANIFEST);
  ok('cửa sổ trượt khớp đúng block', win?.via === 'blockdef' && win.def.id === 'slidingWindow');

  const toilet = resolveLibraryItem({ name: 'Bồn cầu treo', code: 'WC-01', kind: 'sanitary' }, MANIFEST);
  ok('tên kệ dài hơn tên kho vẫn khớp (Bồn cầu treo → Bồn cầu)', toilet?.via === 'blockdef' && toilet.def.id === 'toilet');
}

function testFallbackToManifest() {
  console.log('\n[2] BLOCKS không có → mới tới kho .dxf, và PHẢI khai là mất danh tính');
  const r = resolveLibraryItem({ name: 'Bếp chữ L', code: 'KIT-L', kind: 'furniture' }, MANIFEST);
  ok('khớp qua manifest .dxf', r?.via === 'manifest');
  ok('khai rõ KHÔNG giữ danh tính (G-M3-10 chưa sửa)', r?.keepsIdentity === false);

  const noManifest = resolveLibraryItem({ name: 'Bếp chữ L', code: 'KIT-L', kind: 'furniture' }, null);
  ok('manifest chưa tải xong ⇒ trả null, KHÔNG khẳng định "không có"', noManifest === null);
}

function testNeverGuess() {
  console.log('\n[3] ⛔ Không khớp được thì nói THẬT, cấm thả bừa');
  const r = resolveLibraryItem({ name: 'Ghế massage Nhật bãi', code: 'ZZZ-999', kind: 'furniture' }, MANIFEST);
  ok('trả null', r === null);
  const msg = unresolvedMessage({ name: 'Ghế massage Nhật bãi', code: 'ZZZ-999' });
  ok('câu báo có tên món', msg.includes('Ghế massage Nhật bãi'));
  ok('câu báo chỉ được việc làm tiếp', /panel Nội thất/i.test(msg));
  ok('câu báo KHÔNG nói dối là đã tạo', !/đã tạo|đã thả/i.test(msg));

  const tooShort = resolveLibraryItem({ name: 'Ghế', code: 'X', kind: 'furniture' }, MANIFEST);
  ok('tên quá ngắn (3 ký tự) không được khớp lỏng bừa', tooShort === null);
}

/** [3b] 🔴 BA CẶP KHỚP SAI vòng kiểm phản biện đo được 06/08 — khớp nhầm NGUY HIỂM HƠN không khớp,
 * vì món vào bản vẽ mang danh tính rồi lên BOQ như hàng thật. */
function testWrongMatchRegression() {
  console.log('\n[3b] ⛔ Khớp lồng tên: phải ra món CỤ THỂ NHẤT, không phải món gặp trước');
  const cases: [string, string, string][] = [
    // tên trên kệ                    | id ĐÚNG        | id SAI của bản đầu
    ['Bàn trang điểm có gương', 'dressingTable', 'coffeeTable'],
    ['Cửa sổ trượt loại A', 'slidingWindow', 'window'],
    ['Cửa sổ cố định loại A', 'fixedWindow', 'window'],
  ];
  for (const [name, right, wrong] of cases) {
    const r = resolveLibraryItem({ name, code: '', kind: 'furniture' }, MANIFEST);
    const got = r?.via === 'blockdef' ? r.def.id : r?.via === 'manifest' ? r.meta.id : '(null)';
    ok(`"${name}" → ${right} (KHÔNG phải ${wrong}); đo được: ${got}`, got === right);
    ok(`"${name}" khai rõ là khớp GẦN ĐÚNG`, r?.approximate === true);
  }
  const exact = resolveLibraryItem({ name: 'Sofa 3 chỗ', code: 'SOFA-3S', kind: 'furniture' }, MANIFEST);
  ok('khớp trùng khít thì KHÔNG bị gắn cờ gần đúng', exact?.approximate === false);

  // Tên kệ CHI TIẾT hơn nhưng phần thêm không ứng với block nào ("nhôm") ⇒ vẫn nhận block chung
  // NHƯNG phải gắn cờ gần đúng để UI nói ra — nhận có kèm cảnh báo, không phải nhận im lặng.
  const alu = resolveLibraryItem({ name: 'Cửa sổ nhôm', code: '', kind: 'block' }, MANIFEST);
  ok('"Cửa sổ nhôm" → block cửa sổ chung, CÓ cờ gần đúng',
    alu?.via === 'blockdef' && alu.def.id === 'window' && alu.approximate === true);

  // Chiều ngược lại: tên kệ NGẮN hơn tên kho và có NHIỀU ứng viên ("Thang" ↔ Thang thẳng / Thang
  // chữ L) ⇒ mơ hồ thật ⇒ thà không thả còn hơn thả nhầm loại.
  const ambiguous = resolveLibraryItem({ name: 'Thang', code: '', kind: 'block' }, MANIFEST);
  const ambId = ambiguous?.via === 'blockdef' ? ambiguous.def.id : ambiguous?.via === 'manifest' ? ambiguous.meta.id : '(null)';
  ok(`tên mơ hồ nhiều ứng viên ⇒ không đoán bừa (đo được: ${ambId})`, ambiguous === null);
}

function testMaterialsExcluded() {
  console.log('\n[4] Vật liệu/hatch/khung tên KHÔNG đi đường thả hình');
  const hatch = resolveLibraryItem({ name: 'Sàn gỗ', code: 'HT-WOOD', kind: 'wood' }, MANIFEST);
  ok('hatch gỗ bị loại sớm', hatch === null);
  const sheet = resolveLibraryItem({ name: 'Khung tên A1', code: 'TB-A1', kind: 'sheet' }, MANIFEST);
  ok('khung tên bị loại sớm', sheet === null);
  ok('danh sách loại thả được không chứa vật liệu', !(DROPPABLE_ITEM_KINDS as readonly string[]).includes('material'));
}

/** [5] Chạy trên DỮ LIỆU KỆ THẬT — không phải ví dụ tự chế: bao nhiêu món trên kệ chính thả được. */
function testRealShelf() {
  console.log('\n[5] Kệ "Ký hiệu · khối" thật — đếm số món thả được');
  const items = itemsFor('cad', 'cad-kyhieu', 'all', '');
  ok('kệ có món thật', items.length > 0);
  const resolved = items.filter((i) => resolveLibraryItem({ name: i.name, code: i.code, kind: i.kind }, MANIFEST));
  console.log(`      → ${resolved.length}/${items.length} món thả xuống bản vẽ được; còn lại báo rõ "chưa có hình"`);
  ok('ít nhất một nửa số món thả được', resolved.length * 2 >= items.length);
  ok('KHÔNG món nào khớp im lặng sang loại khác (mọi kết quả đều có id thật)',
    resolved.every((i) => {
      const r = resolveLibraryItem({ name: i.name, code: i.code, kind: i.kind }, MANIFEST)!;
      return r.via === 'blockdef' ? !!r.def.id : !!r.meta.id;
    }));
}

/** R1 (19/08) — specId phải đi XUYÊN từ kệ tới kết quả resolve (rồi DropBridge gán vào entity).
 * Bốn luật canh: có mã khớp → mang đúng ProductSpec.id · không nguồn nào → KHÔNG bịa ·
 * specId đã chốt ở tầng UI (gán tay) THẮNG khớp mã · hai món khác mã không lây identity. */
function testSpecIdThroughDrop() {
  console.log('\n[7] R1 — specId đi xuyên đường thả');
  const SPECS = [
    { id: 'spec_sofa', sku: 'SOFA-3S' },
    { id: 'spec_win', sku: 'WIN-SL-1800' },
  ];

  const a = resolveLibraryItem({ name: 'Sofa 3 chỗ', code: 'SOFA-3S', kind: 'furniture' }, MANIFEST, SPECS);
  ok('món có mã khớp sku → specId = ProductSpec.id', a?.via === 'blockdef' && a.specId === 'spec_sofa');

  const b = resolveLibraryItem({ name: 'Sofa 3 chỗ', code: 'SOFA-3S', kind: 'furniture' }, MANIFEST);
  ok('không specs + không specId tầng UI → KHÔNG bịa (undefined)', !!b && b.specId === undefined);

  const c = resolveLibraryItem(
    { name: 'Sofa 3 chỗ', code: 'SOFA-3S', kind: 'furniture', specId: 'spec_gan_tay' },
    MANIFEST,
    SPECS,
  );
  ok('specId gán tay ở tầng UI THẮNG khớp mã tự động', c?.specId === 'spec_gan_tay');

  const d = resolveLibraryItem({ name: 'Cửa sổ trượt', code: 'WIN-SL-1800', kind: 'block' }, MANIFEST, SPECS);
  ok('hai món khác mã → specId khác nhau, không lây', d?.specId === 'spec_win' && d.specId !== a?.specId);

  const e = resolveLibraryItem({ name: 'Sofa 3 chỗ', code: 'MA-KHONG-CO-TRONG-KHO', kind: 'furniture' }, MANIFEST, SPECS);
  ok('mã không khớp kho spec → specId trống nhưng món VẪN thả được', !!e && e.specId === undefined);
}

function main() {
  testNormalize();
  testPrefersIdentity();
  testFallbackToManifest();
  testNeverGuess();
  testWrongMatchRegression();
  testMaterialsExcluded();
  testRealShelf();
  testSpecIdThroughDrop();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
