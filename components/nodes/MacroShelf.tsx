'use client';

/**
 * components/nodes/MacroShelf.tsx — "Đường dẫn · Nút tổng của tôi" (`docs/mocks/mock-if-nut-tong.html`,
 * cột phải cả 4 màn mock). Mock dựng nó thành CỘT DỌC ĐÍNH cố định bên phải toàn màn (grid 2 cột) —
 * FlowCanvas hiện KHÔNG có bố cục 2 cột (canvas tràn hết chiều rộng, mọi overlay khác đều là thẻ
 * nổi absolute), nên PORT Ở ĐÂY là thẻ nổi góc trên-phải, thu/mở được, KHÔNG đúng nguyên văn cột
 * đính của mock (khai thật — luật §5 N5, xem báo cáo phiên).
 *
 * Slice 10 (03/09): kệ này nay LUÔN có mặt (trước: `return null` khi chưa có nút tổng) vì nó gánh
 * thêm mục "Đường dẫn" (`GuidedPathList`) — cửa vào cho người mới dựng chuỗi node thật. Mỗi nút
 * tổng mở ra danh sách bước: trạng thái · nguồn gốc (AI/tất định/mock) · lỗi + chạy lại · huỷ.
 *
 * Vị trí `top-[64px]` (03/09, đo bằng Playwright thật): `top-3` bị thẻ presence (`right-4 top-4 z-30`,
 * dãy avatar) ĐÈ LÊN — bấm không tới, kệ cũ không lộ vì chỉ hiện khi đã có nút tổng. Đặt dưới thẻ đó.
 *
 * Chỉ liệt kê nút tổng của FLOW ĐANG MỞ (`groups.filter(isMacro)`) — "của tôi" ở mức flow hiện
 * tại, CHƯA phải kho cá nhân xuyên dự án (cần lưu trữ riêng ngoài phạm vi `nodes[]`/`groups[]`
 * của 1 flow, để việc sau).
 */
import { useState } from 'react';
import { Box, CircleDot, Layers as LayersIcon, Sparkle, Grid3x3, Share2, Check, ChevronRight, ChevronDown, Boxes, Route } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { GuidedPathList, MacroStepList } from './GuidedPathPanel';

const ICON_MAP: Record<string, typeof Box> = { box: Box, sun: CircleDot, layers: LayersIcon, sparkle: Sparkle, grid: Grid3x3 };

export function MacroShelf() {
  const tr = useT();
  const groups = useFlowStore((s) => s.groups);
  const setGroupShared = useFlowStore((s) => s.setGroupShared);
  const toggleGroupCollapse = useFlowStore((s) => s.toggleGroupCollapse);
  const [collapsed, setCollapsed] = useState(true);
  const [pathsOpen, setPathsOpen] = useState(true);
  const [openMacro, setOpenMacro] = useState<string | null>(null);
  /** nhóm vừa dựng từ đường dẫn — cho nút Hoàn tác tại chỗ (undo 2 mốc: node + nhóm). */
  const [justBuilt, setJustBuilt] = useState<string | null>(null);
  const macros = groups.filter((g) => g.isMacro);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        title={tr('Đường dẫn · Nút tổng của tôi', 'Guided paths · My macro nodes')}
        className="nen-mo-card absolute right-3 top-[64px] z-[6] flex h-9 items-center gap-1.5 rounded-[14px] border border-[var(--vien-mo)] px-3 text-[11px] font-semibold text-[var(--t2)] shadow-[var(--shadow-pop)] transition-colors hover:text-[var(--t1)]"
      >
        <Route size={14} className="text-[var(--accent)]" />
        {tr('Đường dẫn', 'Paths')}
        {macros.length > 0 && (
          <>
            <Boxes size={14} className="ml-1 text-[var(--accent)]" />
            {macros.length}
          </>
        )}
      </button>
    );
  }

  return (
    <div className="nen-mo-card absolute right-3 top-[64px] z-[6] flex max-h-[80%] w-[276px] flex-col overflow-hidden rounded-[14px] border border-[var(--vien-mo)] shadow-[var(--shadow-pop)]">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="flex h-[34px] flex-none items-center gap-1.5 border-b border-[var(--border)] px-3 text-left transition-colors hover:bg-[var(--hover)]"
      >
        <span className="flex-1 text-[11px] font-bold uppercase leading-[1.5] tracking-wide text-[var(--t4)]">
          {tr('Đường dẫn · Nút tổng', 'Paths · Macros')}
        </span>
        <ChevronRight size={18} className="text-[var(--t4)]" />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* ── Đường dẫn có hướng dẫn ── */}
        <button
          type="button"
          onClick={() => setPathsOpen((v) => !v)}
          className="flex h-8 w-full items-center gap-1.5 px-3 text-left text-[10.5px] font-semibold uppercase tracking-wide text-[var(--t3)] hover:bg-[var(--hover)]"
        >
          <Route size={12} className="text-[var(--accent)]" />
          <span className="flex-1">{tr('Đường dẫn cho người mới', 'Guided paths')}</span>
          {pathsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {pathsOpen && (
          <GuidedPathList
            onBuilt={(id) => {
              setJustBuilt(id);
              setOpenMacro(id);
              setPathsOpen(false);
            }}
          />
        )}

        {/* ── Nút tổng của flow đang mở ── */}
        {macros.length > 0 && (
          <div className="border-t border-[var(--border)]">
            <div className="flex h-8 items-center gap-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--t3)]">
              <Boxes size={12} className="text-[var(--accent)]" />
              {tr('Nút tổng của tôi', 'My macro nodes')}
            </div>
            {macros.map((g) => {
              const Icon = ICON_MAP[g.icon ?? ''] ?? Box;
              const isOpen = openMacro === g.id;
              return (
                <div key={g.id} className="border-b border-[var(--border)] last:border-b-0">
                  <div
                    className={cn(
                      'flex h-12 cursor-pointer items-center gap-2 px-3 transition-colors',
                      !g.collapsed ? 'border-l-2 border-[var(--accent)] bg-[var(--accent-soft)]' : 'hover:bg-[var(--hover)]',
                    )}
                    onClick={() => setOpenMacro(isOpen ? null : g.id)}
                  >
                    <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[10px] bg-[var(--field)]">
                      <Icon size={15} className={!g.collapsed ? 'text-[var(--accent)]' : 'text-[var(--t3)]'} />
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
                          ? tr(`Đang mở · ${g.nodeIds.length} khối`, `Open · ${g.nodeIds.length} blocks`)
                          : tr(`Đã dùng ${g.usageCount ?? 0} lần`, `Used ${g.usageCount ?? 0} times`)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroupCollapse(g.id);
                      }}
                      title={tr(g.collapsed ? 'Mở ra xem các khối bên trong' : 'Thu gọn thành nút tổng', g.collapsed ? 'Expand to see inner blocks' : 'Collapse into macro')}
                      className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[10px] text-[var(--t4)] transition-colors hover:bg-[var(--field)] hover:text-[var(--t1)]"
                    >
                      {g.collapsed ? <LayersIcon size={13} /> : <Boxes size={13} />}
                    </button>
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
                      {g.shared ? <Check size={13} /> : <Share2 size={13} />}
                    </button>
                  </div>
                  {isOpen && (
                    <MacroStepList
                      group={g}
                      justBuilt={justBuilt === g.id}
                      onUndoBuilt={() => {
                        // Gỡ ĐÚNG chuỗi vừa dựng: nhóm + node con + dây chạm node con. KHÔNG dùng
                        // `undo()` đếm mốc — đo Playwright 03/09: thu/mở nút tổng hay kéo node đều
                        // chèn thêm mốc snapshot, đếm 2 mốc thì trượt (nhóm mất mà node còn nguyên).
                        // `snapshot()` trước ⇒ ⌘Z lấy lại được (snapshot chỉ giữ nodes/edges; nhóm
                        // thì đã gỡ hẳn — nhóm không có undo trong store, ghi thật, không giấu).
                        const ids = new Set(g.nodeIds);
                        useFlowStore.getState().snapshot();
                        useFlowStore.setState((s) => ({
                          nodes: s.nodes.filter((n) => !ids.has(n.id)),
                          edges: s.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
                          groups: s.groups.filter((x) => x.id !== g.id),
                        }));
                        setJustBuilt(null);
                        setOpenMacro(null);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex h-[30px] flex-none items-center border-t border-[var(--border)] px-3 text-[11px] leading-[1.5] text-[var(--t4)]">
        {tr(`${macros.length} nút tổng`, `${macros.length} macro nodes`)}
      </div>
    </div>
  );
}
