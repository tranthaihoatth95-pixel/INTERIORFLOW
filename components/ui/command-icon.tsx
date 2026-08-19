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
} from 'lucide-react';
import type { ReactNode } from 'react';
import { ThaoTacGlyph, type ThaoTacKey } from '@/lib/ui/thao-tac-glyph';

const MAP = {
  MousePointer2, Move, RotateCw, Copy, FlipHorizontal2, Trash2,
  Undo2, Redo2, MoveDiagonal, Type, HelpCircle,
} as const;

export type CommandIconName = keyof typeof MAP;

/** Icon của một lệnh theo tên registry khai. Tên lạ → `HelpCircle` (thấy được là còn việc, đúng
 * luật §9 "cấm xoá ô trống cho gọn mắt") thay vì trả `null` làm nút mất hình. */
export function CommandIcon({ name, size = 17 }: { name: string; size?: number }) {
  const Ico = (MAP as Record<string, typeof MousePointer2>)[name] ?? HelpCircle;
  return <Ico size={size} />;
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
