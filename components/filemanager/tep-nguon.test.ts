/**
 * components/filemanager/tep-nguon.test.ts — test lõi thuần + DRIFT-GUARD với `lib/server/**`.
 *
 * Nửa drift-guard là phần đắt nhất: `tep-nguon.ts` buộc phải khai lại 3 hằng số phía client
 * (usages · trần bytes · usage-theo-mime) vì nguồn thật nằm trong module server import fs/prisma.
 * Test này import CẢ HAI PHÍA — server đổi mà client quên là đỏ ngay, không chờ người nhớ.
 * (Import `lib/server/**` trong test là quy ước sẵn của repo — xem `lib/server/promote.test.ts`.)
 */
import assert from 'assert';
import { LIBRARY_USAGES, LIBRARY_MAX_BYTES } from '../../lib/server/library-save';
import { usageTuMime } from '../../lib/server/promote';
import {
  TEP_MAX_BYTES,
  USAGE_HIEN_THI,
  USAGE_LIST,
  usageMacDinh,
  loaiTep,
  kiemKichThuoc,
  lyDoChuaGui,
  nhanKetQua,
} from './tep-nguon';

// ── DRIFT-GUARD ────────────────────────────────────────────────────────────────────────────────
assert.deepStrictEqual(
  [...USAGE_LIST].sort(),
  [...LIBRARY_USAGES].sort(),
  'USAGE_HIEN_THI phải trùng khít LIBRARY_USAGES (lib/server/library-save.ts) — server đổi vocabulary thì sửa map client cùng lượt',
);
assert.strictEqual(TEP_MAX_BYTES, LIBRARY_MAX_BYTES, 'trần bytes client phải bằng LIBRARY_MAX_BYTES');
for (const mime of ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'text/plain']) {
  assert.strictEqual(usageMacDinh(mime), usageTuMime(mime), `usageMacDinh lệch usageTuMime ở mime=${mime}`);
}
// Mỗi usage đều có nhãn hai thứ tiếng KHÔNG rỗng — dropdown không được hiện key kỹ thuật trần.
for (const u of LIBRARY_USAGES) {
  const nhan = USAGE_HIEN_THI[u];
  assert.ok(nhan && nhan.vi.trim() && nhan.en.trim(), `usage "${u}" thiếu nhãn hiển thị`);
}

// ── loaiTep ────────────────────────────────────────────────────────────────────────────────────
assert.strictEqual(loaiTep('image/png'), 'anh');
assert.strictEqual(loaiTep('image/avif'), 'anh');
assert.strictEqual(loaiTep('application/pdf'), 'pdf');
assert.strictEqual(loaiTep('application/zip'), 'khac');

// ── kiemKichThuoc — đúng biên, không lệch 1 byte ──────────────────────────────────────────────
assert.strictEqual(kiemKichThuoc(TEP_MAX_BYTES), null, 'đúng trần vẫn phải qua (server dùng >)');
assert.ok(kiemKichThuoc(TEP_MAX_BYTES + 1), 'quá trần 1 byte phải bị chặn');
assert.strictEqual(kiemKichThuoc(0), null);

// ── lyDoChuaGui — human gate: chưa xem thì mờ, đang gửi thì mờ, đủ cả thì null ───────────────
assert.ok(lyDoChuaGui({ daXem: false, dangGui: false }), 'chưa xem ⇒ phải có lý do');
assert.ok(lyDoChuaGui({ daXem: true, dangGui: true }), 'đang gửi ⇒ phải có lý do');
assert.strictEqual(lyDoChuaGui({ daXem: true, dangGui: false }), null);
// đang gửi thắng chưa-xem (thông điệp phản ánh trạng thái tức thời, không phải điều kiện gốc)
assert.ok(lyDoChuaGui({ daXem: false, dangGui: true })!.vi.includes('Đang gửi'));

// ── nhanKetQua — daCo là 200 lặng lẽ, hai câu phải KHÁC nhau ─────────────────────────────────
assert.notStrictEqual(nhanKetQua(true).vi, nhanKetQua(false).vi);
assert.ok(nhanKetQua(true).vi.includes('không nhân bản'));
assert.ok(nhanKetQua(false).vi.includes('✓'));

console.log('tep-nguon.test.ts OK');
