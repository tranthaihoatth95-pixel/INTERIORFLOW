/**
 * lib/cad/luu-len-may-chu.test.ts — CỔNG CHẶN SAO LƯU BẢN VẼ.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/luu-len-may-chu.test.ts
 *
 * Vì sao đáng có test vĩnh viễn: đúng lớp lỗi này đã trả giá thật ở chặng Trình bày — nhịp sao
 * lưu chạy lúc bộ nhớ còn rỗng và GHI ĐÈ bản tốt bằng bản rỗng. Lỗi im lặng, không ai thấy cho
 * tới khi cần khôi phục. Khoá bằng test để không tái phát.
 */
import assert from 'node:assert';
import type { Doc } from './model';
import type { IdfSheetData } from './idf';
import { duDieuKienSaoLuu } from './luu-len-may-chu';

let n = 0;
function ok(ten: string, dieu: boolean) {
  n += 1;
  assert.ok(dieu, ten);
  console.log(`  ok  - ${ten}`);
}

const docRong = { entities: [], layers: [], levels: [] } as unknown as Doc;
const to = (o?: Partial<IdfSheetData>): IdfSheetData => ({ id: 'cadsheet-0', name: 'Bản vẽ 1', doc: docRong, ...o });

/* ── CHƯA HYDRATE = số 0 của MÁY, cấm ghi đè ─────────────────────────────────────────── */
ok('chưa hydrate → TỪ CHỐI dù có tờ hợp lệ', !duDieuKienSaoLuu([to()], false).ok);
ok('chưa hydrate → nêu đúng lý do', /chưa nạp xong/.test(duDieuKienSaoLuu([to()], false).lyDo ?? ''));

/* ── TRỐNG CÓ CHỦ Ý = trạng thái HỢP LỆ, phải lưu ────────────────────────────────────── */
ok(
  'đã hydrate + bản vẽ TRỐNG (0 entity) → VẪN LƯU (không nuốt thao tác xoá của người dùng)',
  duDieuKienSaoLuu([to()], true).ok,
);

/* ── DANH TÍNH TÀI LIỆU là thứ phân biệt, không phải số lượng hình ──────────────────── */
ok('không có tờ nào → từ chối', !duDieuKienSaoLuu([], true).ok);
ok('tờ thiếu id → từ chối', !duDieuKienSaoLuu([to({ id: '' })], true).ok);
ok('tờ thiếu name → từ chối', !duDieuKienSaoLuu([to({ name: '' })], true).ok);
ok('tờ thiếu doc → từ chối', !duDieuKienSaoLuu([to({ doc: undefined as unknown as Doc })], true).ok);
ok(
  'một tờ hỏng trong bộ → từ chối CẢ BỘ (không ghi bộ nửa vời)',
  !duDieuKienSaoLuu([to(), to({ id: 'x', doc: null as unknown as Doc })], true).ok,
);

/* ── ca bình thường ──────────────────────────────────────────────────────────────────── */
ok('đã hydrate + tờ đủ danh tính → cho lưu', duDieuKienSaoLuu([to({ doc: { entities: [{}], layers: [], levels: [] } as unknown as Doc })], true).ok);

console.log(`\n${n} ok, 0 fail`);
