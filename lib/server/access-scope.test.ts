/**
 * lib/server/access-scope.test.ts — phần THUẦN của phạm vi tài nguyên (Wave 1 · W1-1/W1-2).
 * Chạy qua sucrase-node (`npm test`), không DB. Phần đụng DB được chứng minh riêng trên runtime
 * thật: `scripts/proof/access-scope.mjs` (19/19) và `scripts/proof/library-file-scope.mjs`.
 *
 * Import TƯƠNG ĐỐI — file này cố ý KHÔNG nạp `access.ts` (nó kéo theo Prisma). Hai hàm dưới đây
 * được trích ra thành module thuần đúng vì lý do đó.
 */
import assert from 'assert';
import path from 'path';
import { canReadLibraryAsset, duongDanTrongThuMuc, libraryScopeEnforced } from './access-scope';

let pass = 0;
const ok = (ten: string, dk: boolean) => {
  assert.ok(dk, `THẤT BẠI: ${ten}`);
  pass++;
};

const chu = { id: 'u1', isAdmin: false };
const nguoiKhac = { id: 'u2', isAdmin: false };
const admin = { id: 'u3', isAdmin: true };
const asset = { userId: 'u1' };

// ── Cờ TẮT (mặc định) — giữ NGUYÊN hành vi kho dùng chung hôm nay ──────────────
delete process.env.IF_LIBRARY_SCOPE_ENFORCE;
ok('mặc định cờ TẮT', libraryScopeEnforced() === false);
ok('cờ tắt: chủ đọc được', canReadLibraryAsset(chu, asset));
ok('cờ tắt: người khác VẪN đọc được (kho dùng chung — hành vi hôm nay)', canReadLibraryAsset(nguoiKhac, asset));

// ── Cờ BẬT — siết về đúng luật mà DELETE /api/library/[id] đã thi hành ─────────
process.env.IF_LIBRARY_SCOPE_ENFORCE = '1';
ok('cờ bật', libraryScopeEnforced() === true);
ok('cờ bật: chủ đọc được', canReadLibraryAsset(chu, asset));
ok('cờ bật: người khác BỊ CHẶN', !canReadLibraryAsset(nguoiKhac, asset));
ok('cờ bật: admin đọc được (cùng cửa hậu với DELETE)', canReadLibraryAsset(admin, asset));
delete process.env.IF_LIBRARY_SCOPE_ENFORCE;

// ── Traversal — KHÔNG có cờ, luôn bật, không đổi hành vi hợp lệ nào ────────────
const UP = path.resolve('/tmp/uploads-giả');
ok('tên phẳng hợp lệ', duongDanTrongThuMuc(UP, 'a.png') === path.join(UP, 'a.png'));
ok('thư mục con hợp lệ vẫn qua', duongDanTrongThuMuc(UP, 'sub/a.png') === path.join(UP, 'sub', 'a.png'));
ok('chặn ../', duongDanTrongThuMuc(UP, '../etc/passwd') === null);
ok('chặn ../ lồng nhiều tầng', duongDanTrongThuMuc(UP, 'a/../../../../etc/passwd') === null);
ok('chặn đường tuyệt đối', duongDanTrongThuMuc(UP, '/etc/passwd') === null);
ok('chặn rỗng', duongDanTrongThuMuc(UP, '') === null);
ok(
  'chặn tiền tố GIỐNG NHAU nhưng khác thư mục (uploads-giả-khác)',
  duongDanTrongThuMuc(UP, '../uploads-giả-khác/a.png') === null,
);

console.log(`access-scope: ${pass}/${pass} PASS`);
