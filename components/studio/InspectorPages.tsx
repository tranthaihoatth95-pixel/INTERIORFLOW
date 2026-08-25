'use client';

/**
 * components/studio/InspectorPages.tsx — DẢI TRANG kiểu Rhino cho ổ ④ Inspector (CHINH-3,
 * `docs/SPEC-PANEL-ROLLOUT-IDF.md` §2c): mỗi lúc CHỈ 1 trang, tập trang = hợp lệ cho selection
 * (chọn tường → thêm trang Tường; chọn khối → thêm trang Khối; chọn NHIỀU loại → chỉ trang
 * chung). Lý do (spec): người làm nội thất nhảy sofa↔tường↔đèn liên tục — chồng rollout thì
 * cuộn mệt + layout nhảy; 1 trang/lúc thì ít cuộn, ít nhảy.
 *
 * Trang đang xem KHÔNG persist theo localStorage (khác bố cục rollout §2b): tập trang đổi theo
 * từng lần chọn vật, nhớ trang cũ dễ trỏ vào trang không còn hợp lệ — mặc định về trang đầu
 * mỗi khi TẬP trang đổi (so bằng chuỗi id), giữ nguyên khi chỉ đổi nội dung cùng tập.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InspectorPage {
  id: string;
  icon: LucideIcon;
  /** Tooltip tiếng Việt — icon nào cũng bắt buộc có (luật chữ §3.5). */
  label: string;
  content: ReactNode;
}

export function InspectorPages({ pages }: { pages: InspectorPage[] }) {
  const key = useMemo(() => pages.map((p) => p.id).join('|'), [pages]);
  const [active, setActive] = useState(pages[0]?.id);

  useEffect(() => {
    setActive(pages[0]?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = pages.find((p) => p.id === active) ?? pages[0];
  if (!pages.length) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Dải icon trang — chỉ hiện khi có ≥2 trang (1 trang thì dải là noise). */}
      {pages.length > 1 && (
        <div className="flex h-[34px] shrink-0 items-center gap-0.5 border-b border-[var(--vien-mo)] px-1.5">
          {pages.map((p) => {
            const on = p.id === current?.id;
            return (
              <button
                key={p.id}
                type="button"
                title={p.label}
                aria-pressed={on}
                onClick={() => setActive(p.id)}
                className={cn(
                  'grid h-[26px] w-[30px] place-items-center rounded-[10px] transition-colors duration-[var(--nhip-bam)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]',
                  on ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--t4)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
                )}
              >
                <p.icon size={14} strokeWidth={1.5} />
              </button>
            );
          })}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {current?.content}
      </div>
    </div>
  );
}
