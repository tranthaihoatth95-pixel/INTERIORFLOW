/**
 * components/ui/command-icon.tsx — đổi tên icon dạng CHUỖI trong sổ lệnh thành component lucide.
 *
 * Vì sao tách khỏi `lib/commands/`: `registry.ts` + `toolbar-source.ts` là `lib/*` THUẦN, test
 * chạy thẳng bằng `sucrase-node` không có bundler. Import `lucide-react` vào đó là kéo React vào
 * `lib/` ⇒ mất test thuần. Nên sổ lệnh giữ chuỗi (`icon: 'Move'`), việc dựng hình nằm ở đây.
 *
 * Bảng tra là **danh sách trắng cố ý**, không phải `LucideIcons[name]` động: gõ sai tên icon phải
 * lộ ra lúc đọc code chứ không phải lúc render trắng bệch; và tra động thì bundler phải gói TOÀN
 * BỘ bộ icon vào bundle.
 */

import {
  MousePointer2, Move, RotateCw, Copy, FlipHorizontal2, Trash2,
  Undo2, Redo2, MoveDiagonal, Type, HelpCircle,
  Sparkles, Box, Camera, Clapperboard, Film, LayoutGrid, ImagePlus,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { ThaoTacGlyph, type ThaoTacKey } from '@/lib/ui/thao-tac-glyph';

/**
 * ─── HỆ BIỂU TƯỢNG · MỘT BỘ SỐ CHO CẢ APP (Hoà chốt 20/08, đợt NAV-TI-LE-ICON) ──────────────
 *
 * Sửa biểu tượng phải sửa như MỘT HỆ, không sửa lẻ từng cái. Ba số dưới đây là hệ đó; mọi nơi vẽ
 * icon điều hướng/lệnh phải ĐỌC TỪ ĐÂY, cấm gõ `size={16}` `strokeWidth={2}` tại chỗ dùng —
 * gõ tại chỗ chính là cơ chế làm hệ trôi mỗi nơi một kiểu.
 *
 *   khung 20  — ô chạm/ô đặt icon (hằng số bố cục, không phải cỡ hình)
 *   hinh  18  — cỡ hình quang học, trong dải 16-18 Hoà chốt
 *   net   1,5 → 1,75 khi NHẤN — cả hai đầu đều nằm trong dải 1,5-1,75
 *
 * ⛔ `net` KHÔNG được vượt 1,75. Trước 20/08 rail dùng `strokeWidth={2}` cho mục đang mở: nét 2
 * ở hình 16px làm icon đó ĐẶC hơn hẳn hàng xóm, tức lấy "độ dày nét" làm kênh danh tính chứ
 * không phải kênh trạng thái — đúng thứ luật này cấm.
 *
 * ⛔ MÀU = TRẠNG THÁI, KHÔNG PHẢI DANH TÍNH. Không icon nào được có màu riêng để "nhận ra nó";
 * màu chỉ nói đang-mở / mờ / cảnh báo.
 *
 * ⛔ MỘT HỌ DUY NHẤT: lucide (viền đơn sắc, ~1,5). Cấm trộn icon đặc, duotone, hình chi tiết cao,
 * glyph siêu hình học. Nếu một nghĩa BUỘC phải vẽ glyph riêng của IF thì DỪNG và hỏi — vẽ hình
 * mới là việc thị giác, thuộc cửa thiết kế, không phải việc của lane code.
 *
 * ⛔ CỬA CHẤT LƯỢNG (đo được, không phải cảm tính): ở 16-18px phải hiểu dưới ~1 giây; cần chi
 * tiết nhỏ mới đọc ra ⇒ đơn giản hoá. **Hai icon cạnh nhau mà độ phức tạp lệch hẳn là TRƯỢT** —
 * đo bằng số phần tử vẽ trong `iconNode` của lucide; xem `components/nav/muc-dieu-huong.test.ts`
 * nhóm [8] đang khoá dải đó cho 8 icon của thanh trái.
 */
export const HE_BIEU_TUONG = {
  /** Ô đặt icon — hằng số bố cục, KHÔNG phải cỡ hình. */
  khung: 20,
  /** Cỡ hình quang học (dải chốt 16-18). */
  hinh: 18,
  /** Nét thường. */
  net: 1.5,
  /** Nét khi NHẤN/đang mở — trần cứng của dải, cấm vượt. */
  netNhan: 1.75,
} as const;

const MAP = {
  MousePointer2, Move, RotateCw, Copy, FlipHorizontal2, Trash2,
  Undo2, Redo2, MoveDiagonal, Type, HelpCircle,
  // 20/08 (LANE A) — icon của NĂNG LỰC GỘP (`lib/capabilities/compound.ts`). Cùng bảng tra với
  // lệnh đơn vì luật ① của bảng năng lực là "MỘT năng lực = MỘT icon xuyên toàn app": hai bảng
  // icon sẽ cho phép hai chỗ vẽ cùng một năng lực bằng hai hình khác nhau.
  // `ImagePlus` không thuộc bảng năng lực — nó là nút CHỌN NGUỒN của Toolbelt (bước SOURCE).
  Sparkles, Box, Camera, Clapperboard, Film, LayoutGrid, ImagePlus,
} as const;

export type CommandIconName = keyof typeof MAP;

/** Icon của một lệnh theo tên registry khai. Tên lạ → `HelpCircle` (thấy được là còn việc, đúng
 * luật §9 "cấm xoá ô trống cho gọn mắt") thay vì trả `null` làm nút mất hình. */
export function CommandIcon({ name, size = HE_BIEU_TUONG.hinh }: { name: string; size?: number }) {
  const Ico = (MAP as Record<string, typeof MousePointer2>)[name] ?? HelpCircle;
  // `strokeWidth` khai tường minh: mặc định của lucide là 2, ngoài dải 1,5-1,75 của hệ.
  return <Ico size={size} strokeWidth={HE_BIEU_TUONG.net} />;
}

/**
 * R3 (19/08) — đổi KHOÁ `hinh` trong sổ lệnh thành glyph minh hoạ thao tác, MỘT chỗ duy nhất
 * (đúng vai file này: "sổ giữ chuỗi, việc dựng hình nằm ở đây"). Mặt tiền gọi
 * `hinh={commandHinh(c.hinh)}` — KHÔNG tự import `ThaoTacGlyph` để mỗi toolbar một kiểu.
 * Trả `undefined` khi lệnh không khai hình: Tooltip giữ nguyên khuôn cũ (fallback hiện hữu).
 * ⛔ Glyph chỉ được đưa vào prop `hinh` của Tooltip/ToolbarChip (ô giải nghĩa) — cấm làm nút,
 * ràng buộc đã khoá bằng test của kho hình (`lib/ui/thao-tac-glyph.test.ts` mục [6]).
 */
export function commandHinh(hinh: ThaoTacKey | undefined): ReactNode | undefined {
  return hinh ? <ThaoTacGlyph ten={hinh} /> : undefined;
}
