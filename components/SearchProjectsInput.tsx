'use client';

/**
 * components/SearchProjectsInput.tsx — ô TÌM DỰ ÁN ở AppChrome top bar
 * (phiếu P-V 17/08 · chốt 16/08: *"Vitals ở Home = chấm cạnh ô tìm kiếm"*).
 *
 * TÁCH VIEW từ `ProjectSelect.tsx` (bản gốc ở lines 2054-2073, pill kính đứng
 * đầu `searchGrid`). Cùng logic (chuỗi query lọc `filteredFlows` theo `name`,
 * `status`, `project.name`), khác VỊ TRÍ: nay đứng ở top bar để tay không phải
 * chạy sâu vào bento widget mới tìm được.
 *
 * Hai mặt tiền một cỗ máy [T2]:
 *   · bento widget cũ (ProjectSelect trong ô A) — nay ẨN input pill khi `bentoBox`
 *   · top bar mới — component này
 * Cả hai đọc/ghi cùng `useHomeSearch` store (`lib/home/search-store.ts`), nên
 * kết quả filter trong ProjectSelect vẫn khớp thời gian thực.
 *
 * Responsive (⑤ RÀNG BUỘC phiếu): ≥1100px hiện ô full · <1100px thu về icon kính
 * lúp, bấm bung ra input full-width. Đo bằng `matchMedia('(min-width: 1100px)')`
 * — SSR-safe (initial `false` = mobile), hydrate sau mount không nháy vì input
 * chỉ đổi CHIỀU RỘNG chứ không đổi cấu trúc DOM.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useHomeSearch } from '@/lib/home/search-store';

export default function SearchProjectsInput() {
  const tr = useT();
  const query = useHomeSearch((s) => s.query);
  const setQuery = useHomeSearch((s) => s.setQuery);
  const clear = useHomeSearch((s) => s.clear);
  const inputRef = useRef<HTMLInputElement>(null);

  // ≥1100px: ô full-width luôn hiện. <1100px: thu về icon, bấm mới bung.
  const [wide, setWide] = useState(false);
  const [expanded, setExpanded] = useState(false); // dùng khi hẹp

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1100px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Bung ra ở màn hẹp thì focus luôn để gõ được ngay.
  useEffect(() => {
    if (!wide && expanded) inputRef.current?.focus();
  }, [wide, expanded]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        if (query) {
          e.preventDefault();
          clear();
        } else if (!wide) {
          setExpanded(false);
          inputRef.current?.blur();
        }
      }
    },
    [query, clear, wide],
  );

  // Ở màn hẹp và chưa bung: hiện nút icon-only.
  if (!wide && !expanded && !query) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label={tr('Tìm dự án', 'Search projects')}
        title={tr('Tìm dự án', 'Search projects')}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
        style={{
          background: 'var(--nen-mo-header, var(--panel))',
          border: '1px solid var(--border)',
        }}
      >
        <Search size={14} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5"
      style={{
        background: 'var(--nen-mo-header, var(--panel))',
        border: '1px solid var(--border)',
        // Không chồng backdrop-filter — AppChrome đã có nền riêng; kính-chồng-kính
        // là luật cấm (00-CHOT 16/08 mục "ba tầng kính"). Chỉ dùng token nền.
      }}
    >
      <Search size={14} className="shrink-0 text-[var(--t4)]" aria-hidden="true" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={tr('Tìm tên, ghi chú, dự án…', 'Search name, note, project…')}
        aria-label={tr('Tìm dự án', 'Search projects')}
        className="min-w-0 bg-transparent text-[length:var(--fs-sm)] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none"
        style={{ width: wide ? 220 : 180 }}
      />
      {query ? (
        <button
          type="button"
          aria-label={tr('Xoá tìm kiếm', 'Clear search')}
          onClick={clear}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[var(--t4)] hover:text-[var(--t1)]"
        >
          <X size={12} aria-hidden="true" />
        </button>
      ) : !wide && expanded ? (
        <button
          type="button"
          aria-label={tr('Đóng tìm kiếm', 'Close search')}
          onClick={() => setExpanded(false)}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[var(--t4)] hover:text-[var(--t1)]"
        >
          <X size={12} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
