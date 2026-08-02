'use client';

import Link from 'next/link';
import { LayoutGrid, FolderKanban, Files, LibraryBig, Settings, LogOut, Plug } from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
  disabledHint?: string;
}

/**
 * Nav trái ~210px theo docs/mocks/library-mock-note.md. Chỉ "Master Library" (chính trang này)
 * và "Cài đặt" trỏ route thật đang tồn tại — các mục còn lại (Files/Tích hợp/Đăng xuất) CHƯA có
 * hạ tầng thật (File Manager chưa build — `CHOT-FILEMANAGER-SETTINGS-2026-08-02.md`; Đăng xuất
 * cố tình để mờ, KHÔNG wire — luật verify "KHÔNG logout" `STATUS.md` mục Quy tắc session #2).
 * Wire vào AppChrome/shell thật là việc của code chính sau khi merge — xem docs/BAO-CAO-G4.md.
 */
export function LibraryNav() {
  const items: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} />, href: '/' },
    { key: 'projects', label: 'Dự án', icon: <FolderKanban size={16} />, disabledHint: 'Xem ở Dashboard — trang riêng chưa build' },
    { key: 'files', label: 'Files', icon: <Files size={16} />, disabledHint: 'File Manager — chưa build (xem ghi chú CHOT-FILEMANAGER-SETTINGS)' },
    { key: 'library', label: 'Master Library', icon: <LibraryBig size={16} />, href: '/library', active: true },
    { key: 'settings', label: 'Cài đặt', icon: <Settings size={16} />, href: '/settings' },
    { key: 'logout', label: 'Đăng xuất', icon: <LogOut size={16} />, disabledHint: 'Không wire trong bản mock này — tránh mất phiên khi verify' },
  ];

  return (
    <nav
      className="flex w-[210px] shrink-0 flex-col gap-0.5 px-3 py-4"
      style={{ borderRight: '1px solid var(--border)', background: 'var(--panel)' }}
    >
      <div className="px-2.5 pb-3 text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
        InteriorFlow
      </div>

      {items.map((it) =>
        it.href ? (
          <Link
            key={it.key}
            href={it.href}
            className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13px] font-medium transition-colors duration-[var(--dur-fast)]"
            style={
              it.active
                ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
                : { color: 'var(--t2)' }
            }
          >
            {it.icon}
            {it.label}
          </Link>
        ) : (
          <div
            key={it.key}
            title={it.disabledHint}
            className="flex cursor-not-allowed items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13px]"
            style={{ color: 'var(--t4)' }}
          >
            {it.icon}
            {it.label}
          </div>
        )
      )}

      <div className="mt-3 flex items-center gap-2 px-2.5 pt-3 text-[11px]" style={{ color: 'var(--t4)', borderTop: '1px solid var(--border)' }}>
        <Plug size={12} /> Tích hợp — sắp có (Drive · Git · Notion)
      </div>
    </nav>
  );
}
