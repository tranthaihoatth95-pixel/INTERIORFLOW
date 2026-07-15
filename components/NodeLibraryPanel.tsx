'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactFlow } from '@xyflow/react';
import { X, GripVertical, Star, Plus, Command, Paintbrush, Wand2 } from 'lucide-react';
import { NODE_DEFINITIONS, NODE_REGISTRY } from '@/lib/nodes/registry';
import { nodeIconFor } from '@/components/nodes/NodeIcons';
import { useFlowStore } from '@/lib/store';
import { useSketchStore } from '@/lib/sketch/sketchStore';
import { SketchStudioModal } from '@/components/sketch/SketchStudioModal';
import { modKey } from '@/lib/kbd';
import type { NodeDefinition } from '@/lib/types';
import { TAG_ORDER, TAG_META, tagsFor, type NodeTag } from '@/lib/nodes/tags';
import { PHASE_MAP, DEFAULT_PHASE } from '@/lib/phases';
import { sheetSlide, staggerList, pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';

export const DND_MIME = 'application/interiorflow-node';

const ALL_TAG = 'all' as const;

export function NodeLibraryPanel() {
  const panel = useFlowStore((s) => s.panel);
  const setPanel = useFlowStore((s) => s.setPanel);
  const setPaletteOpen = useFlowStore((s) => s.setPaletteOpen);
  const addNode = useFlowStore((s) => s.addNode);
  const updateParam = useFlowStore((s) => s.updateParam);
  const aiTier = useFlowStore((s) => s.aiTier);
  const workspace = useFlowStore((s) => s.workspace);
  const openSketch = useSketchStore((s) => s.open);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<NodeTag | typeof ALL_TAG>(ALL_TAG);
  const { screenToFlowPosition } = useReactFlow();

  // Vị trí giữa canvas (khớp CommandPalette) — node thêm bằng CLICK rơi vào giữa tầm nhìn.
  const centerPos = useCallback(() => {
    const p = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    return { x: p.x - 128, y: p.y - 20 };
  }, [screenToFlowPosition]);

  // Bấm thẻ node = thêm ngay vào giữa canvas (dễ hơn kéo-thả, nhất là trên cảm ứng).
  const onAdd = useCallback((type: string) => addNode(type, centerPos()), [addNode, centerPos]);

  // "Vẽ tay nhanh": thêm node Free Sketch giữa canvas rồi mở Sketch Studio ngay —
  // lấy id node vừa tạo bằng cách đọc state NGAY sau addNode (set() của zustand đồng bộ).
  const quickSketch = useCallback(() => {
    addNode('util.sketchpad', centerPos());
    const nodes = useFlowStore.getState().nodes;
    const created = nodes[nodes.length - 1];
    if (created) openSketch(created.id);
  }, [addNode, centerPos, openSketch]);

  // "Demo: Vẽ tay → Render": seed 3 node đã NỐI DÂY sẵn (Free Sketch → Sketch→Render ← Prompt)
  // minh hoạ pipeline sketch→render mà không cần đụng lib/store.ts (dùng action có sẵn).
  const demoSketchToRender = useCallback(() => {
    const base = centerPos();
    addNode('util.sketchpad', { x: base.x - 340, y: base.y - 120 });
    const sketchNode = useFlowStore.getState().nodes.at(-1);

    addNode('input.prompt', { x: base.x - 340, y: base.y + 260 });
    const promptNode = useFlowStore.getState().nodes.at(-1);
    if (promptNode) {
      updateParam(
        promptNode.id,
        'prompt',
        'japandi living room, warm oak floor, linen sofa, soft natural light',
      );
    }

    addNode('ai.sketch2render', { x: base.x + 60, y: base.y + 20 });
    const renderNode = useFlowStore.getState().nodes.at(-1);

    if (sketchNode && renderNode) {
      useFlowStore
        .getState()
        .onConnect({ source: sketchNode.id, sourceHandle: 'image', target: renderNode.id, targetHandle: 'image' });
    }
    if (promptNode && renderNode) {
      useFlowStore
        .getState()
        .onConnect({ source: promptNode.id, sourceHandle: 'text', target: renderNode.id, targetHandle: 'prompt' });
    }
    if (sketchNode) openSketch(sketchNode.id);
  }, [addNode, centerPos, updateParam, openSketch]);

  // Mức 1 (Không AI): ẩn hẳn node AI — chỉ còn input/slide/utility/output cho quy trình thủ công.
  const noAi = aiTier === 1;
  const phase = PHASE_MAP[workspace ?? DEFAULT_PHASE];

  const matchesQuery = (d: NodeDefinition, q: string) =>
    !q ||
    d.title.toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q) ||
    d.type.includes(q);
  const hiddenByTier = (d: NodeDefinition) => noAi && (d.category === 'AI_GENERATE' || d.category === 'AI_EDIT');

  // Nhóm ★ node ưu tiên của chặng hiện tại (chỉ khi không tìm kiếm — soft focus, không lọc bỏ phần khác).
  const featured = useMemo(() => {
    if (query.trim()) return [];
    return phase.featured
      .map((t) => NODE_REGISTRY[t])
      .filter((d): d is NodeDefinition => Boolean(d) && !hiddenByTier(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, noAi, query]);

  // Nhóm theo TAG chức năng (không phải category kỹ thuật) — 1 node nhiều tag thì xuất
  // hiện ở nhiều nhóm, giúp tìm theo "việc muốn làm" thay vì tầng hệ thống.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = NODE_DEFINITIONS.filter((d) => matchesQuery(d, q) && !hiddenByTier(d));
    const tagsToShow = activeTag === ALL_TAG ? TAG_ORDER : [activeTag];
    return tagsToShow
      .map((tag) => ({ tag, defs: filtered.filter((d) => tagsFor(d.type).includes(tag)) }))
      .filter((g) => g.defs.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, noAi, activeTag]);

  return (
    <>
    <AnimatePresence>
      {(panel === 'library' || panel === 'search') && (
        // iOS sheet trượt từ trái + material blur
        <motion.aside
          key="node-library"
          variants={sheetSlide('left')}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mat-panel z-20 flex w-64 flex-col border-r border-[var(--border)]"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
          Node Library
        </span>
        <motion.button
          {...pressableIcon}
          onClick={() => setPanel(null)}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <X size={13} />
        </motion.button>
      </div>

      <div className="space-y-1.5 p-2.5">
        <input
          autoFocus={panel === 'search'}
          className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-xs text-[var(--t1)] placeholder-[var(--t5)] outline-none transition-colors focus:border-[var(--accent-ring)]"
          placeholder="Tìm node…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* chip lọc theo tag chức năng — 1 chip đang active tại 1 thời điểm, gọn cho panel hẹp */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTag(ALL_TAG)}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
              activeTag === ALL_TAG
                ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--t4)] hover:bg-[var(--hover)]',
            )}
          >
            Tất cả
          </button>
          {TAG_ORDER.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                activeTag === tag
                  ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--t4)] hover:bg-[var(--hover)]',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: TAG_META[tag].color }} />
              {TAG_META[tag].label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="flex w-full items-center gap-1.5 rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--t4)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--t2)]"
          title="Tìm & thêm nhanh node/hành động"
        >
          <Command size={11} className="shrink-0" />
          Tìm nhanh mọi thứ
          <kbd suppressHydrationWarning className="ml-auto shrink-0 rounded border border-[var(--border)] bg-[var(--field)] px-1 py-0.5 text-[9px]">{modKey('K')}</kbd>
        </button>

        {/* Sketch Studio — demo & lối vào nhanh cho cơ chế vẽ tay tự do */}
        <button
          onClick={quickSketch}
          className="flex w-full items-center gap-1.5 rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--t4)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--t2)]"
          title="Thêm node Free Sketch vào canvas rồi mở Sketch Studio ngay"
        >
          <Paintbrush size={11} className="shrink-0" />
          Vẽ tay nhanh
        </button>
        <button
          onClick={demoSketchToRender}
          className="flex w-full items-center gap-1.5 rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--t4)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--t2)]"
          title="Tạo sẵn Free Sketch → Sketch→Render ← Prompt đã nối dây — minh hoạ pipeline vẽ tay → render"
        >
          <Wand2 size={11} className="shrink-0" />
          Demo: Vẽ tay → Render
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-2.5 pb-4">
        {/* ★ Node ưu tiên cho chặng hiện tại — soft focus, phần còn lại vẫn liệt kê đủ bên dưới */}
        {featured.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              <Star size={10} className="fill-[var(--accent)]" />
              Chặng {phase.label}
            </p>
            <motion.div className="space-y-1" variants={staggerList} initial="hidden" animate="visible">
              {featured.map((def) => (
                <NodeCard key={`f-${def.type}`} def={def} onAdd={onAdd} />
              ))}
            </motion.div>
            <div className="mt-3 border-t border-[var(--border)]" />
          </div>
        )}
        {groups.map(({ tag, defs }) => (
          <div key={tag}>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: TAG_META[tag].color }} />
              {TAG_META[tag].label}
            </p>
            {/* stagger nhẹ — item hiện lần lượt như list iOS */}
            <motion.div className="space-y-1" variants={staggerList} initial="hidden" animate="visible">
              {defs.map((def) => (
                <NodeCard key={`${tag}-${def.type}`} def={def} onAdd={onAdd} />
              ))}
            </motion.div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="px-1 pt-4 text-center text-xs text-[var(--t5)]">Không tìm thấy node nào.</p>
        )}
        <p className="px-1 pt-2 text-[10px] leading-relaxed text-[var(--t5)]">
          {noAi
            ? 'Mức "Không AI" đang bật — node AI đã ẩn. Đổi mức ở góc trên để hiện lại.'
            : `Chặng ${phase.label}: node ★ ở trên. Kéo thả bất kỳ node nào vào canvas — các chặng dùng chung 1 canvas.`}
        </p>
      </div>
        </motion.aside>
      )}
    </AnimatePresence>
    {/* NodeLibraryPanel LUÔN được mount trong app/page.tsx (chỉ nội dung panel ẩn/hiện) —
        gắn Sketch Studio ở đây để không phải sửa app/page.tsx (ngoài phạm vi commit).
        Modal tự portal ra document.body nên vị trí gọi không ảnh hưởng layout/transform. */}
    <SketchStudioModal />
    </>
  );
}

/**
 * 1 thẻ node — BẤM để thêm vào giữa canvas (dễ nhất, nhất là cảm ứng) HOẶC kéo-thả để
 * đặt đúng chỗ. Cả hai cùng tạo node; click là lối chính vì kéo-thả React Flow khó trên touch.
 */
function NodeCard({ def, onAdd }: { def: NodeDefinition; onAdd: (type: string) => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_MIME, def.type);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onAdd(def.type)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAdd(def.type);
        }
      }}
      className="group flex cursor-pointer items-start gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-2 transition-transform hover:border-[var(--accent-ring)] hover:scale-[1.015] active:scale-[0.99]"
      title="Bấm để thêm vào giữa canvas · hoặc kéo thả để đặt đúng chỗ"
    >
      {(() => { const Icon = nodeIconFor(def.type); return <Icon size={14} className="mt-0.5 shrink-0 text-[var(--t3)]" />; })()}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-[var(--t1)]" style={{ fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", monospace' }}>{def.title}</p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--t4)]">{def.description}</p>
      </div>
      <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
        {def.creditCost > 0 && (
          <span className="rounded bg-[var(--hover)] px-1 py-0.5 text-[9px] text-[var(--t4)]">
            {def.creditCost}cr
          </span>
        )}
        <span className="grid h-5 w-5 place-items-center rounded-md text-[var(--t5)] opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-[var(--accent)]">
          <Plus size={13} />
        </span>
      </div>
    </div>
  );
}
