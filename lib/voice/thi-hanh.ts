/**
 * lib/voice/thi-hanh.ts — đưa `DauVaoNguNghia` tới ĐÚNG hệ thống mà chữ gõ đang dùng.
 *
 * ⭐ Ba điều file này CỐ Ý KHÔNG LÀM, vì làm là phá luật nền:
 *   ⛔ không giữ kho nào (không mảng ghi chú, không lịch sử phiên) — ghi vào đâu là việc của
 *      HOST truyền qua `CuaNhan`. Thoại chỉ chuyển tiếp.
 *   ⛔ không có nhánh `if (nguon === 'giong-noi')` — nếu có, giọng nói đã đi đường riêng.
 *   ⛔ không tự chạy lệnh khi `doiSuThat === true` mà chưa có `daXacNhan`. Đây là cửa chặn cuối
 *      cùng: `rui-ro.ts` phân loại, file này THI HÀNH phân loại đó. Có test khoá.
 *
 * File THUẦN, import tương đối.
 */

import { COMMANDS } from '../commands/registry';
import type { DauVaoNguNghia } from './types';

/**
 * CỬA NHẬN — host khai mình nhận được ngữ cảnh nào. Trường nào không khai = host này chưa có
 * chỗ nhận ⇒ `thiHanh()` trả `chua-co-cua`, và mặt tiền phải NÓI THẲNG với người dùng thay vì
 * im lặng nuốt câu (§9 cấm nút bấm-không-ra-gì; nuốt câu còn tệ hơn vì nó câm).
 */
export interface CuaNhan {
  /** Ghi chú neo — host đưa vào ĐÚNG kho ghi chú mà chữ gõ đang ghi vào. */
  ghiChu?: (d: DauVaoNguNghia) => void;
  /** Ghi chú ghim soát duyệt — đường checklist của `lib/review`. */
  soatDuyet?: (d: DauVaoNguNghia) => void;
  /** Tìm kiếm — host mở đúng mặt tìm kiếm sẵn có. */
  timKiem?: (d: DauVaoNguNghia) => void;
  /** Ý định thiết kế — host đưa vào ĐÚNG đường mà chữ gõ đang đi (ô nhập thông số). */
  yDinhThietKe?: (d: DauVaoNguNghia) => void;
}

export type KetQuaThiHanh =
  | { readonly ok: true; readonly daLam: string }
  /** Phải xác nhận mà chưa xác nhận — mặt tiền phải dựng phiếu xem trước. */
  | { readonly ok: false; readonly vuong: 'can-xac-nhan' }
  /** Host chưa khai cửa cho ngữ cảnh này. */
  | { readonly ok: false; readonly vuong: 'chua-co-cua'; readonly nguCanh: string }
  /** Id lệnh không còn trong sổ (sổ đổi mà chỗ khác giữ id cũ). */
  | { readonly ok: false; readonly vuong: 'khong-thay-lenh'; readonly commandId: string };

/**
 * Thi hành. `daXacNhan` = người dùng ĐÃ bấm đồng ý trên phiếu xem trước.
 *
 * ⚠️ Tham số `daXacNhan` cố ý KHÔNG có giá trị mặc định `true` và không nằm trong một object
 * tuỳ chọn: người gọi phải viết ra chữ đó, nên không ai bỏ qua cửa xác nhận một cách vô tình.
 */
export function thiHanh(d: DauVaoNguNghia, cua: CuaNhan, daXacNhan = false): KetQuaThiHanh {
  if (d.doiSuThat && !daXacNhan) return { ok: false, vuong: 'can-xac-nhan' };

  switch (d.yDinh.nguCanh) {
    case 'lenh': {
      const { commandId } = d.yDinh;
      const cmd = COMMANDS.find((c) => c.id === commandId);
      if (!cmd) return { ok: false, vuong: 'khong-thay-lenh', commandId };
      cmd.run({ arg: d.yDinh.arg, arg2: d.yDinh.arg2 });
      return { ok: true, daLam: cmd.id };
    }
    case 'ghi-chu':
      if (!cua.ghiChu) return { ok: false, vuong: 'chua-co-cua', nguCanh: 'ghi-chu' };
      cua.ghiChu(d);
      return { ok: true, daLam: 'ghi-chu' };
    case 'soat-duyet':
      if (!cua.soatDuyet) return { ok: false, vuong: 'chua-co-cua', nguCanh: 'soat-duyet' };
      cua.soatDuyet(d);
      return { ok: true, daLam: 'soat-duyet' };
    case 'tim-kiem':
      if (!cua.timKiem) return { ok: false, vuong: 'chua-co-cua', nguCanh: 'tim-kiem' };
      cua.timKiem(d);
      return { ok: true, daLam: 'tim-kiem' };
    case 'y-dinh-thiet-ke':
      if (!cua.yDinhThietKe) return { ok: false, vuong: 'chua-co-cua', nguCanh: 'y-dinh-thiet-ke' };
      cua.yDinhThietKe(d);
      return { ok: true, daLam: 'y-dinh-thiet-ke' };
    default:
      return { ok: false, vuong: 'chua-co-cua', nguCanh: 'la' };
  }
}
