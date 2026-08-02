'use client';

/**
 * components/studio/Navigator.tsx — ổ ② NAVIGATOR 214px (VIỆC 2, `docs/SPEC-HA-TANG-UI-IF.md`
 * Trụ 1 + `docs/SPEC-CAD-SHELL-V3.md` §2 luật 2/7). Thay `LeftRail` (rail icon dọc) làm khung
 * trái của `AppShell` — nội dung (danh sách Lớp/Node/Trang) do từng chặng truyền vào qua prop
 * `children`, khung CỐ ĐỊNH: đáy luôn 2 hàng giống hệt mọi chặng mọi mode (Trụ 1 luật B — "điểm
 * neo trí nhớ", chống bệnh Affinity "như đang dùng app khác").
 *
 * ⚠️ CHƯA có "Layer State" (đỉnh sidebar, SPEC-CAD-SHELL-V3 §2 luật 7 — snapshot bật/tắt lớp
 * theo bộ) — đó là TÍNH NĂNG MỚI (cần model lưu snapshot), không phải chỗ trống UI. Để trống,
 * không giả bằng nút chết. `topState` prop khai sẵn cho khi tính năng đó có.
 *
 * Thu gọn: nhớ lựa chọn tay qua localStorage (KHÔNG tự mở lại khi phóng cửa sổ — chỉ auto-thu
 * lúc hẹp, không bao giờ auto-mở, đúng luật 7 `SPEC-HA-TANG-UI-IF.md` §3 "nhớ lựa chọn tay,
 * không tự đảo ngược").
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, Plus, Library, Settings as SettingsIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { useDismissable } from '@/lib/useDismissable';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { AccountMenu } from '@/components/AccountMenu';

const WIDTH = 214;
const COLLAPSE_BREAKPOINT = 1280;
const STORAGE_KEY = 'interiorflow.navigator.collapsed_v1';

interface Props {
  /** Nội dung danh sách chính (Lớp/Node/Trang tuỳ chặng) — cuộn riêng. */
  children: ReactNode;
  /** Đỉnh sidebar tuỳ chọn — CHƯA dùng ở VIỆC 2, khai sẵn cho Layer State sau này. */
  topState?: ReactNode;
  /** Nhãn nút "+ thêm" theo chặng (Lớp mới/Khối mới/Trang mới). */
  addLabel: string;
  onAdd?: () => void;
  onOpenLibrary: () => void;
}

export function Navigator({ children, topState, addLabel, onAdd, onOpenLibrary }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const user = useFlowStore((s) => s.user);
  const router = useRouter();
  const tr = useT();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === '1') setCollapsed(true);
    else if (window.innerWidth < COLLAPSE_BREAKPOINT) setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Auto-thu khi hẹp — KHÔNG BAO GIỜ tự mở lại (chỉ set true, không bao giờ set false ở đây).
    const onResize = () => {
      if (window.innerWidth < COLLAPSE_BREAKPOINT) setCollapsed(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  const avatarRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const el = avatarRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchorRect({ top: r.top - 6, left: r.right + 8 });
  }, [menuOpen]);
  useDismissable({ open: menuOpen, onDismiss: () => setMenuOpen(false), refs: [avatarRef, menuRef] });

  if (collapsed) {
    return (
      <div
        className="flex shrink-0 flex-col items-center border-r border-[var(--border)] bg-[var(--panel)] py-2"
        style={{ width: 36 }}
      >
        <button
          type="button"
          onClick={toggle}
          title={tr('Mở Navigator', 'Expand Navigator')}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] text-[var(--t3)] transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
        >
          <ChevronLeft size={15} className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="flex min-h-0 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)]"
      style={{ width: WIDTH, visibility: hydrated ? 'visible' : 'hidden' }}
      data-tour="navigator"
    >
      {topState}
      <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
        {children}
      </div>

      {/* Đáy Navigator — 2 hàng CỐ ĐỊNH, y hệt mọi chặng mọi mode (Trụ 1 luật B). */}
      <div className="flex shrink-0 gap-0.5 border-t border-[var(--mat-hairline)] p-1.5">
        <button
          type="button"
          onClick={onAdd}
          disabled={!onAdd}
          title={addLabel}
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[11px] text-[var(--t3)] transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Plus size={13} />
        </button>
        <button
          type="button"
          onClick={onOpenLibrary}
          title={tr('Thư viện', 'Library')}
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[11px] text-[var(--t3)] transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)]"
        >
          <Library size={13} />
          {tr('Thư viện', 'Library')}
        </button>
        <button
          type="button"
          onClick={toggle}
          title={tr('Thu gọn — B', 'Collapse — B')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-[var(--t3)] transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)]"
        >
          <ChevronLeft size={13} />
        </button>
      </div>
      <div className="flex shrink-0 gap-0.5 border-t border-[var(--border)] p-1.5">
        {user && (
          <button
            ref={avatarRef}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className="flex h-[30px] min-w-0 flex-1 items-center gap-2 rounded-[10px] px-1.5 transition-colors duration-[120ms] hover:bg-[var(--hover)]"
          >
            <UserAvatar id={user.id} avatar={user.avatar} name={user.name} size={22} frame={false} />
            <span className="min-w-0 truncate text-[12px] text-[var(--t2)]">{user.name}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push('/settings')}
          title={tr('Cài đặt', 'Settings')}
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] text-[var(--t3)] transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)]"
        >
          <SettingsIcon size={14} strokeWidth={1.75} />
        </button>
      </div>
      {user && <AccountMenu open={menuOpen} anchorRect={anchorRect} onDismiss={() => setMenuOpen(false)} menuRef={menuRef} />}
    </aside>
  );
}

export { WIDTH as NAVIGATOR_WIDTH };
