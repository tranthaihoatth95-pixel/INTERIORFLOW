'use client';

/**
 * components/nodes/MacroShelf.tsx — "Nút tổng của tôi" (`docs/mocks/mock-if-nut-tong.html`, cột
 * phải cả 4 màn mock). Mock dựng nó thành CỘT DỌC ĐÍNH cố định bên phải toàn màn (grid 2 cột) —
 * FlowCanvas hiện KHÔNG có bố cục 2 cột (canvas tràn hết chiều rộng, mọi overlay khác đều là thẻ
 * nổi absolute), nên PORT Ở ĐÂY là thẻ nổi góc trên-phải, thu/mở được, KHÔNG đúng nguyên văn cột
 * đính của mock (khai thật — luật §5 N5, xem báo cáo phiên).
 *
 * Chỉ liệt kê nút tổng của FLOW ĐANG MỞ (`groups.filter(isMacro)`) — "của tôi" ở mức flow hiện
 * tại, CHƯA phải kho cá nhân xuyên dự án (cần lưu trữ riêng ngoài phạm vi `nodes[]`/`groups[]`
 * của 1 flow, để việc sau).
 */
import { useState } from 'react';
import { Box, CircleDot, Layers as LayersIcon, Sparkle, Grid3x3, Share2, Check, ChevronRight, Boxes } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, typeof Box> = { box: Box, sun: CircleDot, layers: LayersIcon, sparkle: Sparkle, grid: Grid3x3 };

export function MacroShelf() {
  const tr = useT();
  const groups = useFlowStore((s) => s.groups);
  const setGroupShared = useFlowStore((s) => s.setGroupShared);
  const toggleGroupCollapse = useFlowStore((s) => s.toggleGroupCollapse);
  const [collapsed, setCollapsed] = useState(false);
  const macros = groups.filter((g) => g.isMacro);

  if (!macros.length) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        title={tr('Nút tổng của tôi', 'My macro nodes')}
        className="nen-mo-card absolute right-3 top-3 z-[6] flex h-9 items-center gap-1.5 rounded-[14px] border border-[var(--vien-mo)] px-3 text-[11px] font-semibold text-[var(--t2)] shadow-[var(--shadow-pop)] transition-colors hover:text-[var(--t1)]"
      >
        <Boxes size={14} className="text-[var(--accent)]" />
        {macros.length}
      </button>
    );
  }

  return (
    <div className="nen-mo-card absolute right-3 top-3 z-[6] flex max-h-[70%] w-[236px] flex-col overflow-hidden rounded-[14px] border border-[var(--vien-mo)] shadow-[var(--shadow-pop)]">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="flex h-[34px] flex-none items-center gap-1.5 border-b border-[var(--border)] px-3 text-left transition-colors hover:bg-[var(--hover)]"
      >
        <span className="flex-1 text-[11px] font-bold uppercase leading-[1.5] tracking-wide text-[var(--t4)]">
          {tr('Nút tổng của tôi', 'My macro nodes')}
        </span>
        <ChevronRight size={18} className="text-[var(--t4)]" />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {macros.map((g) => {
          const Icon = ICON_MAP[g.icon ?? ''] ?? Box;
          return (
            <div
              key={g.id}
              className={cn(
                'flex h-12 cursor-pointer items-center gap-2 px-3 transition-colors',
                !g.collapsed ? 'border-l-2 border-[var(--accent)] bg-[var(--accent-soft)]' : 'hover:bg-[var(--hover)]',
              )}
              onClick={() => {
                if (g.collapsed) toggleGroupCollapse(g.id);
              }}
            >
              <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[10px] bg-[var(--field)]">
                <Icon size={18} className={!g.collapsed ? 'text-[var(--accent)]' : 'text-[var(--t3)]'} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-[12px] font-semibold leading-[1.5]',
                    !g.collapsed ? 'text-[var(--accent)]' : 'text-[var(--t1)]',
                  )}
                >
                  {g.label}
                </span>
                <span className={cn('block truncate text-[10px] leading-[1.5]', !g.collapsed ? 'text-[var(--accent)]' : 'text-[var(--t4)]')}>
                  {!g.collapsed
                    ? tr('Đang mở ra xem', 'Currently open')
                    : tr(`Đã dùng ${g.usageCount ?? 0} lần`, `Used ${g.usageCount ?? 0} times`)}
                </span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setGroupShared(g.id, !g.shared);
                }}
                title={tr(g.shared ? 'Đã chia sẻ cho studio' : 'Chia sẻ cho studio', g.shared ? 'Shared with studio' : 'Share with studio')}
                className={cn(
                  'flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[10px] transition-colors',
                  g.shared ? 'bg-[var(--field)] text-[var(--success)]' : 'text-[var(--t4)] hover:bg-[var(--field)] hover:text-[var(--t1)]',
                )}
              >
                {g.shared ? <Check size={16} /> : <Share2 size={16} />}
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex h-[30px] flex-none items-center border-t border-[var(--border)] px-3 text-[11px] leading-[1.5] text-[var(--t4)]">
        {tr(`${macros.length} nút tổng`, `${macros.length} macro nodes`)}
      </div>
    </div>
  );
}
