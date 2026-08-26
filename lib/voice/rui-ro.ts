/**
 * lib/voice/rui-ro.ts — CỬA CHẶN "đổi sự thật lặng lẽ".
 *
 * 🔴 Luật cứng (phiếu Lane V): *nhận dạng giọng nói KHÔNG BAO GIỜ được lặng lẽ đổi hình học /
 * spec / sự thật dự án. Đổi có ý nghĩa ⇒ xem trước + xác nhận + hoàn tác được.*
 *
 * ⭐ CÁCH KHOÁ: **FAIL-CLOSED**. Hàm `canXacNhan()` mặc định trả `true` (phải xác nhận) cho MỌI
 * ý định; chỉ một danh sách AN TOÀN rất ngắn được chạy thẳng. Vì sao chọn kiểu này thay vì liệt
 * kê "những lệnh nguy hiểm":
 *   · Danh sách nguy hiểm phải ĐUỔI THEO sổ lệnh — thêm lệnh mới mà quên khai là nó chạy thẳng,
 *     im lặng, đúng thứ luật cấm. Danh sách an toàn thì ngược lại: quên khai ⇒ lệnh mới rơi vào
 *     nhánh phải-xác-nhận, tệ nhất là phiền một cú bấm, không bao giờ là hỏng bản vẽ.
 *   · Và nó KHÔNG phải "bảng ánh xạ riêng cho giọng nói": đây là CHÍNH SÁCH RỦI RO, khai bằng
 *     id thật của sổ lệnh, có test canh cho không id nào là id ma.
 *
 * File THUẦN, import tương đối.
 */

import { COMMANDS } from '../commands/registry';
import type { YDinh } from './types';

/**
 * BỐN lệnh được chạy thẳng bằng giọng nói, không cần xác nhận. Tiêu chí vào danh sách — cả ba
 * phải đúng, không có ngoại lệ:
 *   ① KHÔNG ghi gì vào Doc (không sinh/sửa/xoá entity, không đổi thông số bản vẽ);
 *   ② nghe nhầm thì thiệt hại bằng KHÔNG, người dùng nhìn phát biết ngay và tự sửa;
 *   ③ đảo lại được bằng chính một lệnh khác cùng nhóm.
 *
 * ⚠️ `cad.sel.undo`/`cad.sel.redo` CỐ Ý KHÔNG có ở đây, dù nghe rất "vô hại": chúng ĐỔI Doc
 * thật. Nói "hoàn tác" mà máy nghe nhầm thành nghe được rồi tự chạy là mất việc vừa làm — đúng
 * kiểu hỏng mà luật này sinh ra để chặn.
 * ⚠️ Mọi lệnh `activate(tool)` khác cũng KHÔNG vào đây: chọn công cụ tuy chưa vẽ gì, nhưng nó
 * đổi cái chuột sắp làm — nghe nhầm giữa lúc đang thao tác là nét kế tiếp đi sai. Đợt sau muốn
 * nới thì nới có căn cứ, đừng nới cho tiện.
 */
export const LENH_CHAY_THANG: readonly string[] = [
  'cad.sel.select', // chỉ đổi công cụ về "chọn" — trạng thái nghỉ, không ghi gì
  'cad.view.zoomextents', // đổi khung nhìn
  'cad.view.polar', // bật/tắt trợ giúp vẽ, không đụng Doc
  'cad.dim.measure', // đo — đọc số, không sinh entity
];

/**
 * Ý định này có buộc phải qua cửa xem trước + xác nhận không?
 *
 * · `y-dinh-thiet-ke` → LUÔN `true`. Không có ngoại lệ nào, kể cả `doTinCay` cao: câu "tường
 *   này dày 120" nghe nhầm thành "dày 1200" thì con số vẫn hợp lệ về cú pháp, máy không cách nào
 *   tự biết là sai. Chỉ mắt người biết.
 * · `ghi-chu`, `soat-duyet`, `tim-kiem` → `false`. Chúng KHÔNG đổi sự thật dự án: ghi chú là lời
 *   của người dùng về bản vẽ, không phải bản vẽ; tìm kiếm chỉ đọc. Nghe nhầm thì sửa chữ, không
 *   mất gì.
 * · `lenh` → `false` CHỈ KHI id nằm trong `LENH_CHAY_THANG`; còn lại `true`.
 */
export function canXacNhan(yDinh: YDinh): boolean {
  switch (yDinh.nguCanh) {
    case 'ghi-chu':
    case 'soat-duyet':
    case 'tim-kiem':
      return false;
    case 'lenh':
      return !LENH_CHAY_THANG.includes(yDinh.commandId);
    case 'y-dinh-thiet-ke':
      return true;
    default:
      // Ngữ cảnh lạ (thêm nhánh union mà quên sửa file này) ⇒ chặn. Fail-closed.
      return true;
  }
}

/**
 * Câu nói cho người dùng biết VÌ SAO phải xác nhận — hiện thẳng trên phiếu, tiếng Việt, ≤12 từ
 * theo `SPEC-NGON-NGU-CHI-DAN`. Không có câu nào dùng chữ nghề ("entity", "Doc").
 */
export function lyDoXacNhan(yDinh: YDinh): [string, string] | null {
  if (!canXacNhan(yDinh)) return null;
  if (yDinh.nguCanh === 'y-dinh-thiet-ke') {
    return ['Việc này đổi bản vẽ — xem lại rồi bấm Đồng ý.', 'This changes the drawing — review, then confirm.'];
  }
  return ['Lệnh này đổi bản vẽ — xem lại rồi bấm Đồng ý.', 'This command changes the drawing — review, then confirm.'];
}

/** Danh sách an toàn có id nào là id ma không? Test dùng; cũng dùng được lúc dev. */
export function idMaTrongDanhSachAnToan(): string[] {
  const co = new Set(COMMANDS.map((c) => c.id));
  return LENH_CHAY_THANG.filter((id) => !co.has(id));
}
