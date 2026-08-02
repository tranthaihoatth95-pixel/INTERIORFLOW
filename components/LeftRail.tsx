'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  FolderOpen,
  Boxes,
} from 'lucide-react';
import { useFlowStore, type Panel } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { useDismissable } from '@/lib/useDismissable';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { AccountMenu } from '@/components/AccountMenu';

/**
 * Hợp nhất rail (Hoà chốt 03/08, sau khi xác nhận "rail của /files" trong ảnh chê là
 * `FileManagerShell` riêng của G4, KHÔNG PHẢI file này — lỗi mô tả từ Cowork). Từ nay
 * `LeftRail.tsx` là rail DUY NHẤT cho cả app; G4 bỏ rail riêng, dùng lại file này sau khi merge.
 *
 * Hình học ĐỒNG TÂM đúng `docs/SPEC-APPLE-MOTION-MATERIAL.md` §2 ("bo trong = bo ngoài − đệm"):
 * nút 44px (bo 22, `rounded-full`) · đệm capsule 8px mọi phía · capsule rộng 60px (=44+8+8, bo 30
 * `rounded-full` tự cho 2 đầu bán nguyệt đúng nghĩa "capsule dọc") · khoảng cách giữa nút 6px ·
 * vạch ngăn rộng 24px căn giữa, margin dọc 6px. Capsule cao TỰ NHIÊN theo nội dung (không còn kéo
 * hết viewport bằng flex-1 như bản cũ) — avatar tài khoản đứng NGOÀI capsule, ngay dưới, cách đáy
 * capsule đúng 12px, cùng trục giữa (Tailwind `gap-3` = 12px, khớp).
 *
 * Cấu trúc chuẩn (03/08, CHOT-AVATAR-MEMOJI §2): Dashboard · vạch ngăn · Dự án · Files (chờ G4
 * merge, `soon`) · Thư viện — RAIL CHỈ CÒN ĐIỀU HƯỚNG. Nút ⚙ Cài đặt + Trợ giúp + toàn bộ ⋯
 * (credits/share/chat) GOM VÀO menu avatar (`AccountMenu.tsx`, dùng chung với `UserChip` ở
 * `AppChrome.tsx`) — "một cửa duy nhất cho chuyện của tôi", chuẩn macOS. Avatar 44px = ĐÚNG cỡ
 * nút rail. 2 mục cũ mất chỗ trong rail (Trình chiếu, Reference) KHÔNG có lối vào khác (đã grep)
 * nên đã thêm làm 2 action Command Palette (⌘K) thay vì mất hẳn.
 */
const BTN = 44; // nút — bo 22 (rounded-full)
const CAPSULE_PAD = 8; // đệm capsule mọi phía ⇒ capsule rộng 44+8+8=60, bo 30 (đồng tâm)
// 03/08 (CHOT-AVATAR-MEMOJI §2): avatar ĐÚNG BẰNG cỡ nút rail — "cái tròn ava đáng lẽ đường
// kính phải bằng thanh tool, sao lại cái to cái nhỏ".
const AVATAR_SIZE = 44;

interface NavItem {
  icon: typeof LayoutDashboard;
  label: [string, string];
  panel?: Panel;
  action?: () => void;
  active?: boolean;
  soon?: boolean;
}

/**
 * "Nút rail / toolbar / icon-only" đúng `docs/SPEC-HOVER-FOCUS-IDF.md` §2: hover ĐỔI NỀN,
 * KHÔNG scale, 120ms · press nền đậm hơn + scale 0.97, 80ms · focus-visible = cùng hiệu ứng +
 * viền accent 2px offset 2px · `reduced-motion` bỏ scale, chỉ giữ đổi nền. Dùng chung cho mọi
 * nút trong capsule (khác `pressableIcon` dùng chỗ khác trong app — tap 0.9/120ms không khớp
 * bảng này, viết riêng thay vì sửa hằng số dùng toàn cục).
 */
function RailButton({
  icon: Icon,
  label,
  active,
  soon,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
  soon?: boolean;
  onClick?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      whileTap={soon || reduceMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.08 }}
      aria-label={label}
      disabled={soon}
      onClick={onClick}
      style={{ width: BTN, height: BTN }}
      className={cn(
        'grid shrink-0 place-items-center rounded-full transition-colors duration-[120ms] ease-[cubic-bezier(.32,.72,0,1)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]',
        active
          ? 'bg-[var(--accent)] text-white'
          : soon
            ? 'cursor-default text-[var(--t5)]'
            : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)] active:bg-[var(--hover)]',
      )}
    >
      <Icon size={18} strokeWidth={1.75} />
    </motion.button>
  );
}

export function LeftRail() {
  const panel = useFlowStore((s) => s.panel);
  const setPanel = useFlowStore((s) => s.setPanel);
  const dashboardOpen = useFlowStore((s) => s.dashboardOpen);
  const setDashboardOpen = useFlowStore((s) => s.setDashboardOpen);
  const user = useFlowStore((s) => s.user);
  const tr = useT();
  const reduceMotion = useReducedMotion();

  const items: NavItem[] = [
    { icon: LayoutDashboard, label: ['Tổng quan — Dashboard project & team', 'Overview — project & team dashboard'], action: () => setDashboardOpen(true), active: dashboardOpen },
    { icon: FolderKanban, label: ['Dự án & Flow', 'Projects & Flows'], panel: 'flows', action: () => setPanel('flows'), active: panel === 'flows' },
    { icon: FolderOpen, label: ['Files — sắp có (chờ File Manager hợp nhất)', 'Files — coming soon (File Manager merge pending)'], soon: true },
    { icon: Boxes, label: ['Thư viện Node', 'Node Library'], panel: 'library', action: () => setPanel('library'), active: panel === 'library' },
  ];

  // Menu tài khoản — avatar NGOÀI capsule, tự tính anchor riêng (mở XUỐNG dưới, khác `UserChip`
  // ở AppChrome mở theo góc trên-phải) vì cụm rail+avatar nằm ở TOP-LEFT màn hình (capsule cao
  // tự nhiên, không kéo hết viewport) nên đủ chỗ mở popover phía dưới.
  const avatarRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const el = avatarRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchorRect({ top: r.bottom + 6, left: r.left });
  }, [menuOpen]);
  useDismissable({ open: menuOpen, onDismiss: () => setMenuOpen(false), refs: [avatarRef, menuRef] });

  return (
    <div className="z-20 my-3 ml-3 flex flex-col items-center gap-3" data-tour="dock">
      <nav
        className="mat-panel flex flex-col items-center rounded-full border border-[var(--mat-hairline)] shadow-[0_8px_24px_rgba(40,38,35,.14)]"
        style={{ width: BTN + CAPSULE_PAD * 2, padding: CAPSULE_PAD }}
      >
        {/* 03/08 (CHOT-AVATAR-MEMOJI §2): nút ⚙ Cài đặt BỎ khỏi rail — vào AccountMenu ("một
            cửa cho chuyện của tôi"). Vạch ngăn 24px giữ, chuyển lên ngăn Dashboard (overlay
            tổng quan) với nhóm panel bên dưới. */}
        {items.map((item, i) => {
          const { icon: Icon, label, action, active, soon } = item;
          const text = tr(label[0], label[1]);
          return (
            <div key={label[1]} className="flex flex-col items-center">
              {i === 1 && <div className="my-1.5 h-px w-6 shrink-0 bg-[var(--border)]" />}
              <div className={cn(i > 1 && 'mt-1.5')}>
                <Tooltip label={text}>
                  <RailButton icon={Icon} label={text} active={active} soon={soon} onClick={action} />
                </Tooltip>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Avatar tài khoản — NGOÀI capsule, cách đáy 12px (gap-3), cùng trục giữa. detail={true}
          ép bật filter nỉ (40px dưới ngưỡng auto nhưng vẫn muốn chắc chắn, đúng chỉ đạo). Ẩn hẳn
          khi chưa đăng nhập (khớp guard `if (!user) return null` của `UserChip`/`AccountMenu` —
          bấm mở menu rỗng thì vô nghĩa). */}
      {user && (
        <>
          <Tooltip label={tr('Tài khoản', 'Account')}>
            {/* "Swatch vật liệu / avatar / chip nhỏ" — SPEC-HOVER-FOCUS-IDF §2: hover scale 1.04
                150ms (khác nút rail — nhỏ + đơn lẻ nên scale hợp lệ), press 0.98 80ms. */}
            <motion.button
              ref={avatarRef}
              type="button"
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={tr('Tài khoản', 'Account')}
              aria-expanded={menuOpen}
              className="grid shrink-0 place-items-center overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
            >
              <UserAvatar id={user.id} avatar={user.avatar} name={user.name} size={AVATAR_SIZE} detail frame={false} />
            </motion.button>
          </Tooltip>
          <AccountMenu open={menuOpen} anchorRect={anchorRect} onDismiss={() => setMenuOpen(false)} menuRef={menuRef} />
        </>
      )}
    </div>
  );
}
