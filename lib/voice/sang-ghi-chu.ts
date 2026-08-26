/**
 * lib/voice/sang-ghi-chu.ts — hạ `YDinh` ghi chú xuống ĐÚNG kho ghi chú ĐANG CÓ của IF.
 *
 * ⭐ ĐÂY LÀ CHỖ LUẬT "CẤM ĐẺ KHO SỰ THẬT RIÊNG CHO GIỌNG NÓI" ĐƯỢC THI HÀNH BẰNG MÃ, không phải
 * bằng lời dặn: file này KHÔNG định nghĩa một kiểu ghi chú nào của riêng thoại. Nó nhận hình
 * dạng của kho sẵn có (`HomeNote` — `lib/home/notes-store.ts`, đã chạy thật, lưu JSON per-user
 * qua `app/api/home/notes`) và dựng đúng bản ghi đó.
 *
 * 🔴 NHƯNG PHẢI NÓI THẲNG MỘT CHỖ HỤT — [Đ2] đo tại nguồn 22/08:
 *    `HomeNote` chỉ neo tới **DỰ ÁN** (`projectId: string | null`). IF hôm nay **CHƯA CÓ** kho
 *    ghi chú neo tới ĐỐI TƯỢNG (`entityId`) — đó vẫn là entry `comment-neo-doi-tuong` đang chờ
 *    trong sổ frontier, chưa ai làm. Lane này **cố ý không dựng nó**: dựng ở đây thì nó thành
 *    kho của riêng giọng nói, đúng thứ bị cấm — và tuần sau chữ gõ lại phải có kho thứ hai.
 *
 *    ⛔ Và tuyệt đối KHÔNG nhét `entityId` vào chuỗi `text` cho đủ chỗ. Nhét vào là dữ liệu bịa
 *       hình dạng: người dùng đọc thấy rác, máy sau này không parse ngược ra được. Thay vào đó
 *       `hapNote()` TRẢ RA phần neo **không lưu được**, để mặt tiền nói thẳng với người dùng
 *       ("ghi chú này chưa gắn được vào vật đang chọn") thay vì lặng lẽ đánh rơi.
 *
 * File THUẦN, import tương đối.
 */

import type { HomeNote } from '../home/notes-store';
import type { DauVaoNguNghia, Neo } from './types';

export interface KetQuaHap {
  /** Bản ghi đúng hình dạng kho SẴN CÓ. `id`/`createdAt` do nơi gọi cấp (thuần: không tự sinh). */
  readonly note: Omit<HomeNote, 'id' | 'createdAt'>;
  /**
   * Những mẩu neo mà kho hiện tại KHÔNG chỗ nào chứa được — mặt tiền phải hiện ra.
   * Rỗng = neo được trọn vẹn.
   */
  readonly neoChuaLuuDuoc: ReadonlyArray<keyof Neo>;
}

/**
 * Hạ ghi chú thoại xuống `HomeNote`. Nhận cả ngữ cảnh `ghi-chu` lẫn `soat-duyet` — hai ngữ cảnh
 * khác nhau về ĐƯỜNG ĐI (soát duyệt còn vào checklist `lib/review`), nhưng phần "một câu chữ
 * của người dùng, neo vào một chỗ" thì y hệt, nên dùng chung một hàm hạ.
 */
export function hapNote(d: DauVaoNguNghia): KetQuaHap | null {
  const y = d.yDinh;
  if (y.nguCanh !== 'ghi-chu' && y.nguCanh !== 'soat-duyet') return null;

  const chuaLuuDuoc: Array<keyof Neo> = [];
  // Kho hiện có chỉ có MỘT ô neo: projectId. Mọi mẩu neo khác đang có thật mà không có chỗ chứa
  // thì phải khai ra, không được im.
  if (y.neo.entityId) chuaLuuDuoc.push('entityId');
  if (y.neo.workspaceId) chuaLuuDuoc.push('workspaceId');
  if (y.neo.stage) chuaLuuDuoc.push('stage');

  return {
    note: {
      projectId: y.neo.projectId ?? null,
      // NGUYÊN VĂN, còn dấu — không bỏ dấu, không viết hoa hộ, không thêm tiền tố "[thoại]".
      text: y.noiDung,
    },
    neoChuaLuuDuoc: chuaLuuDuoc,
  };
}
