/**
 * lib/save-status.test.ts — chạy: node_modules/.bin/sucrase-node lib/save-status.test.ts
 *
 * 🔴 ĐÂY LÀ CỔNG CANH CỦA LỖI P0 `A2-03`, không phải test cho vui.
 *
 * Bệnh đã đo trên app thật: nhãn hiện "Đã lưu lúc 07:5x" ở giây **1,5** trong khi
 * `POST /api/project-files` mãi giây **21,1** mới xảy ra ⇒ **19,6 giây app khẳng định một việc
 * chưa xảy ra**, và đóng tab trong khoảng đó (trên một hồ sơ trình duyệt khác/mới) là mất bản vẽ.
 *
 * Luật rút ra không sửa được bằng một lời dặn trong docstring, vì lời dặn không chặn được ai:
 *   **KHÔNG tổ hợp trạng thái nào được cho ra LỜI HỨA BỀN VỮNG khi máy chủ chưa nhận.**
 * Test dưới đây quét TOÀN BỘ không gian tổ hợp (5 × 2 × 3 × 2 = 60 ca) và khẳng định đúng câu đó.
 * Thêm một `ServerSyncState` mới mà quên xử lý ⇒ test này đỏ ngay, không phải chờ ai đọc lại mã.
 */
import assert from 'node:assert';
import { nhanTrangThaiLuu, type SaveState, type ServerSyncState, type DauVaoNhanLuu } from './save-status';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const T = new Date(2026, 8, 5, 9, 7).getTime(); // 09:07
const T2 = new Date(2026, 8, 5, 9, 9).getTime(); // 09:09

const TRANG_THAI_LUU: SaveState[] = ['idle', 'saving', 'saved'];
const TRANG_THAI_MAY_CHU: ServerSyncState[] = ['off', 'pending', 'syncing', 'synced', 'error'];

console.log('\n[1] BẤT BIẾN — không nhánh nào hứa bền vững khi máy chủ chưa nhận');
test('quét 60 tổ hợp: huaBenVung ⇒ serverStatus === "synced" và có mốc máy chủ', () => {
  let soCa = 0;
  let soCaHua = 0;
  for (const status of TRANG_THAI_LUU) {
    for (const lastSavedAt of [null, T]) {
      for (const serverStatus of TRANG_THAI_MAY_CHU) {
        for (const serverSavedAt of [null, T2]) {
          soCa++;
          const n = nhanTrangThaiLuu({ status, lastSavedAt, serverStatus, serverSavedAt });
          if (!n) continue;
          if (n.huaBenVung) {
            soCaHua++;
            assert.strictEqual(serverStatus, 'synced', `hứa bền vững khi serverStatus=${serverStatus}`);
            assert.notStrictEqual(serverSavedAt, null, 'hứa bền vững mà không có mốc máy chủ');
          }
        }
      }
    }
  }
  assert.strictEqual(soCa, 60);
  assert.ok(soCaHua > 0, 'phải có ít nhất một ca hứa được — không thì test này vô nghĩa');
});

test('câu chữ: chỉ nhánh hứa bền vững mới được nói "Đã lưu lúc"', () => {
  for (const status of TRANG_THAI_LUU) {
    for (const lastSavedAt of [null, T]) {
      for (const serverStatus of TRANG_THAI_MAY_CHU) {
        for (const serverSavedAt of [null, T2]) {
          const n = nhanTrangThaiLuu({ status, lastSavedAt, serverStatus, serverSavedAt });
          if (!n) continue;
          // "Đã lưu lúc …" là câu người dùng đọc thành "đóng máy được rồi".
          // "Đã lưu trong máy …" thì không — nó tự khai phạm vi.
          const noiDaLuuTron = /^Đã lưu lúc /.test(n.chu);
          assert.strictEqual(noiDaLuuTron, n.huaBenVung, `câu "${n.chu}" lệch cờ huaBenVung`);
        }
      }
    }
  }
});

console.log('\n[2] BỐN NHÁNH — từng câu một');
test('đang ghi → "Đang lưu…"', () => {
  const n = nhanTrangThaiLuu({ status: 'saving', lastSavedAt: T, serverStatus: 'synced', serverSavedAt: T2 });
  assert.strictEqual(n?.chu, 'Đang lưu…');
  assert.strictEqual(n?.huaBenVung, false);
});

test('đang đẩy lên máy chủ cũng là "Đang lưu…" (không hứa trước)', () => {
  const n = nhanTrangThaiLuu({ status: 'saved', lastSavedAt: T, serverStatus: 'syncing', serverSavedAt: T2 });
  assert.strictEqual(n?.chu, 'Đang lưu…');
});

test('máy chủ hỏng → cảnh báo, nói RÕ chưa lên máy chủ', () => {
  const n = nhanTrangThaiLuu({
    status: 'saved',
    lastSavedAt: T,
    serverStatus: 'error',
    serverSavedAt: null,
    serverMessage: 'máy chủ trả 503',
  });
  assert.strictEqual(n?.chu, 'Chưa lưu lên máy chủ');
  assert.strictEqual(n?.muc, 'canh-bao');
  assert.ok(n?.giaiThich.includes('503'), 'lý do thật phải tới được người dùng');
  assert.strictEqual(n?.huaBenVung, false);
});

test('CA CỦA LỖI A2-03: IDB xong, máy chủ còn treo → "Đã lưu trong máy"', () => {
  const n = nhanTrangThaiLuu({ status: 'saved', lastSavedAt: T, serverStatus: 'pending', serverSavedAt: null });
  assert.strictEqual(n?.chu, 'Đã lưu trong máy 09:07');
  assert.strictEqual(n?.huaBenVung, false);
  assert.ok(n?.giaiThich.includes('Đóng cửa sổ'), 'phải cảnh báo đúng hành vi gây mất việc');
});

test('máy chủ đã nhận → "Đã lưu lúc" theo mốc MÁY CHỦ, không theo mốc cache', () => {
  const n = nhanTrangThaiLuu({ status: 'saved', lastSavedAt: T, serverStatus: 'synced', serverSavedAt: T2 });
  assert.strictEqual(n?.chu, 'Đã lưu lúc 09:09'); // 09:09 = mốc máy chủ, KHÔNG phải 09:07 của IDB
  assert.strictEqual(n?.huaBenVung, true);
});

test('mode không có kênh máy chủ ("off") vẫn nói thật, không hứa', () => {
  const n = nhanTrangThaiLuu({ status: 'saved', lastSavedAt: T, serverStatus: 'off', serverSavedAt: null });
  assert.strictEqual(n?.chu, 'Đã lưu trong máy 09:07');
  assert.strictEqual(n?.huaBenVung, false);
  assert.ok(n?.giaiThich.includes('Chưa có bản sao trên máy chủ'));
});

console.log('\n[3] KHÔNG KHAI MỘT LẦN LƯU KHÔNG HỀ XẢY RA');
test('chưa ghi được gì (lastSavedAt = null) → KHÔNG hiện nhãn nào', () => {
  // Nhánh cũ trả chuỗi "Đã lưu" trống trơn ở đúng ca này — `onSavingChange(false)` vẫn chạy khi
  // `getRecord()` trả null, tức không có lần ghi nào cả.
  assert.strictEqual(nhanTrangThaiLuu({ status: 'saved', lastSavedAt: null, serverStatus: 'off', serverSavedAt: null }), null);
  assert.strictEqual(nhanTrangThaiLuu({ status: 'idle', lastSavedAt: null, serverStatus: 'pending', serverSavedAt: null }), null);
});

test('"synced" mà thiếu mốc máy chủ thì KHÔNG được hứa (phòng khi nơi gọi quên set)', () => {
  const n = nhanTrangThaiLuu({ status: 'saved', lastSavedAt: T, serverStatus: 'synced', serverSavedAt: null });
  assert.strictEqual(n?.huaBenVung, false);
  assert.ok(n?.chu.startsWith('Đã lưu trong máy'));
});

console.log('\n[4] Ràng buộc ngôn ngữ chỉ dẫn — câu ngắn, có nội dung');
test('mọi câu ≤ 12 từ và giải thích không rỗng', () => {
  const dv: DauVaoNhanLuu[] = [
    { status: 'saving', lastSavedAt: T, serverStatus: 'pending', serverSavedAt: null },
    { status: 'saved', lastSavedAt: T, serverStatus: 'error', serverSavedAt: null },
    { status: 'saved', lastSavedAt: T, serverStatus: 'pending', serverSavedAt: null },
    { status: 'saved', lastSavedAt: T, serverStatus: 'synced', serverSavedAt: T2 },
    { status: 'saved', lastSavedAt: T, serverStatus: 'off', serverSavedAt: null },
  ];
  for (const v of dv) {
    const n = nhanTrangThaiLuu(v)!;
    assert.ok(n.chu.trim().split(/\s+/).length <= 12, `câu dài quá: "${n.chu}"`);
    assert.ok(n.giaiThich.length > 20, `giải thích rỗng nghĩa: "${n.giaiThich}"`);
  }
});

console.log(`\n${passed} passed`);
