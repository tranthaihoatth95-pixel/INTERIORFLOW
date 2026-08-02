'use client';

import Link from 'next/link';
import { LayoutGrid, FolderKanban, FolderOpen, LibraryBig, Settings } from 'lucide-react';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { FM } from './fm-tokens';

export type AppRailKey = 'files' | 'settings';

interface RailItem {
  key: AppRailKey | 'dashboard' | 'projects' | 'library';
  label: string;
  icon: React.ReactNode;
  href?: string;
}

/**
 * Rail dọc capsule — VẬT MẪU mock-files-polished.html + mock-settings-polished.html `.rail`
 * (IDENTICAL trong cả 2 mock, ref #9): bo 30, item active = bubble tròn nền đen scale 1.12.
 * Dùng chung cho /files và /settings (2 mock demo cùng 1 rail, khác mỗi item active) — tránh
 * lệch nhau nếu tách riêng. Sống tạm trong components/filemanager/ vì đó là vùng file được giao
 * đầu tiên có mock rail này; dọn về components/shell/ chung khi code chính wire thật (xem
 * docs/BAO-CAO-FM.md mục "Cần nối tay"). Icon-only, khác `LibraryNav` cũ (chữ+nhãn) — Library
 * CHƯA có mock rail riêng nên GIỮ NGUYÊN, không tự chế đổi theo.
 */
export function AppRail({ active }: { active: AppRailKey }) {
  const items: RailItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={17} />, href: '/' },
    { key: 'projects', label: 'Dự án', icon: <FolderKanban size={17} /> },
    { key: 'files', label: 'Files', icon: <FolderOpen size={17} />, href: '/files' },
    { key: 'library', label: 'Master Library', icon: <LibraryBig size={17} />, href: '/library' },
  ];

  return (
    <div className="flex w-[76px] shrink-0 flex-col items-center py-[18px]">
      <div
        className="flex flex-col items-center gap-1.5 rounded-[30px] px-2 py-2.5"
        style={{ background: FM.panel, border: `1px solid ${FM.line}`, boxShadow: FM.shadowSoft }}
      >
        {items.map((it) => {
          const isOn = it.key === active;
          const content = (
            <span
              className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150"
              style={isOn ? { background: FM.ink, color: '#fff', transform: 'scale(1.12)', boxShadow: '0 4px 12px rgba(38,38,43,.30)' } : { color: '#77777f' }}
            >
              {it.icon}
              <span
                className="pointer-events-none absolute left-[54px] whitespace-nowrap rounded-[7px] px-2.5 py-[3px] text-[10.5px] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                style={{ background: FM.ink, color: '#fff' }}
              >
                {it.label}
              </span>
            </span>
          );
          return it.href ? (
            <Link key={it.key} href={it.href} aria-label={it.label}>
              {content}
            </Link>
          ) : (
            <div key={it.key} aria-label={it.label} title="Chưa có trang riêng">
              {content}
            </div>
          );
        })}

        <div className="my-1 h-px w-[26px]" style={{ background: FM.line }} />

        <Link href="/settings" aria-label="Cài đặt">
          <span
            className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150"
            style={active === 'settings' ? { background: FM.ink, color: '#fff', transform: 'scale(1.12)', boxShadow: '0 4px 12px rgba(38,38,43,.30)' } : { color: '#77777f' }}
          >
            <Settings size={17} />
            <span
              className="pointer-events-none absolute left-[54px] whitespace-nowrap rounded-[7px] px-2.5 py-[3px] text-[10.5px] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              style={{ background: FM.ink, color: '#fff' }}
            >
              Cài đặt
            </span>
          </span>
        </Link>
      </div>

      <div className="mt-auto">
        <Link href="/settings" aria-label="Tài khoản" title="Tài khoản (mở Cài đặt) — mock không ghi rõ đích, chọn hợp lý nhất">
          <span className="block rounded-full border-2 border-white" style={{ boxShadow: FM.shadowSoft }}>
            <UserAvatar id="you" name="Bạn" size={40} frame={false} />
          </span>
        </Link>
      </div>
    </div>
  );
}
