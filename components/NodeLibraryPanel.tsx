'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactFlow } from '@xyflow/react';
import { X, GripVertical, Star, Plus, Command, Paintbrush, Wand2, Users, Sparkles, StickyNote, Palette, Network, ChevronRight } from 'lucide-react';
import { NODE_DEFINITIONS, NODE_REGISTRY } from '@/lib/nodes/registry';
import { nodeIconFor } from '@/components/nodes/NodeIcons';
import { useFlowStore } from '@/lib/store';
import { useSketchStore } from '@/lib/sketch/sketchStore';
import { SketchStudioModal } from '@/components/sketch/SketchStudioModal';
import { SmartSelectModal } from '@/components/smartselect/SmartSelectModal';
import { WarpCornersModal } from '@/components/warp/WarpCornersModal';
import { nodeMatches } from '@/lib/nodes/search';
import { modKey } from '@/lib/kbd';
import type { NodeDefinition } from '@/lib/types';
import { GROUP_ORDER, GROUP_META, groupOf, type NodeGroup } from '@/lib/nodes/groups';
import { PHASE_MAP, DEFAULT_PHASE } from '@/lib/phases';
import { sheetSlide, staggerList, pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { sidebarZoneOf } from '@/lib/render-studio/sidebar-zones';
import { TASK_CARDS } from '@/lib/render-studio/task-cards';
import { useToolModeUi } from '@/lib/render-studio/tool-mode-ui';
import { instantiateConceptMindmap, MINDMAP_TEMPLATE_ID } from '@/lib/render-studio/mindmap-templates';
import { useMaterials, type MaterialSpecLite } from '@/lib/render-studio/use-materials';
import { useT } from '@/lib/i18n';

export const DND_MIME = 'application/interiorflow-node';
/**
 * G2 phần (5) (`docs/SPEC-CHANG2-UI-2MODE.md` §3 "Swatch vật liệu mang matId — kéo vào mang
 * dữ liệu, không chỉ ảnh"): đi KÈM `DND_MIME` (không thay thế) khi kéo 1 vật liệu thật từ
 * `/api/specs?kind=material` — `FlowCanvas.onDrop` đọc thêm MIME này để `updateParam` ngay sau
 * khi tạo node `util.materialnote`, đúng khuôn `ASSET_MIME` đã có (components/LibraryPanel.tsx).
 */
export const MAT_MIME = 'application/interiorflow-material';
/**
 * G2 phần (6) (`docs/SPEC-CHANG2-UI-2MODE.md:27` "Mindmap = 1 TUỲ CHỌN"): đi KÈM `DND_MIME`
 * KHÔNG được (mindmap dựng bằng nhiều `note`, không phải 1 `NodeDefinition` type qua `addNode`)
 * — MIME RIÊNG, giá trị = id template cố định (`MINDMAP_TEMPLATE_ID`). `FlowCanvas.onDrop` đọc
 * để gọi `instantiateConceptMindmap` tại đúng vị trí thả.
 */
export const MINDMAP_MIME = 'application/interiorflow-mindmap';

const ALL_GROUP = 'all' as const;

interface Props {
  /** Hoà 04/08 (BÁC bản Navigator list-chữ, `docs/SO-KIEM-TONG.md` §0d "giữ cái đang tốt") —
   * gắn NGUYÊN component này vào ổ ② Navigator của `AppShell` cho chặng Render, KHÔNG viết lại.
   * `embedded=true`: bỏ gate `panel==='library'`/AnimatePresence sheet-trượt (Navigator luôn
   * hiện, không phải panel bật/tắt) + bỏ khung `w-64`/border/nút đóng riêng (Navigator đã có
   * khung 280px của nó) — MỌI nội dung bên trong (search/chip/mood/vật liệu/master/★/nhóm tag)
   * giữ NGUYÊN 100%, không đổi 1 dòng logic. Mặc định `false` = hành vi sheet-trượt cũ, còn
   * dùng ở Command Palette "Mở Node Library"/`RenderToolModeOverlay`. */
  embedded?: boolean;
}

export function NodeLibraryPanel({ embedded = false }: Props = {}) {
  const panel = useFlowStore((s) => s.panel);
  const setPanel = useFlowStore((s) => s.setPanel);
  const setPaletteOpen = useFlowStore((s) => s.setPaletteOpen);
  const addNode = useFlowStore((s) => s.addNode);
  const addNote = useFlowStore((s) => s.addNote);
  const updateNote = useFlowStore((s) => s.updateNote);
  const updateParam = useFlowStore((s) => s.updateParam);
  const aiTier = useFlowStore((s) => s.aiTier);
  const workspace = useFlowStore((s) => s.workspace);
  const openSketch = useSketchStore((s) => s.open);
  // H2 (docs/SPEC-MODE-PER-STAGE.md §2) — bấm thẻ MASTER = mở tool window (ĐÚNG luật "bắt buộc
  // mở window để thao tác"), KHÔNG thả node AI trần lên canvas như thẻ thường. Tái dùng thẳng
  // `useToolModeUi`/`ToolWindow` đã có từ D3 — không có luồng mở window thứ 2.
  const selectCard = useToolModeUi((s) => s.selectCard);
  const tr = useT();
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<NodeGroup | typeof ALL_GROUP>(ALL_GROUP);
  // Kệ khối không được là một danh sách dài không đáy: mỗi cụm nghề nghiệp tự thu/mở.
  // Chỉ mở Nguồn lúc mới vào để người dùng có điểm bắt đầu; khi tìm, mọi kết quả mở ra.
  const [openGroups, setOpenGroups] = useState<Set<NodeGroup>>(() => new Set(['source']));
  const { screenToFlowPosition, setCenter } = useReactFlow();
  // DỌN ĐỊA TẦNG (Hoà 04/08) — nhóm "Trên bảng" đầu panel: node ĐANG có trên canvas, bấm = focus.
  const canvasNodes = useFlowStore((s) => s.nodes);
  const focusNode = useCallback(
    (id: string) => {
      const n = useFlowStore.getState().nodes.find((x) => x.id === id);
      if (!n) return;
      const w = n.measured?.width ?? 256;
      const h = n.measured?.height ?? 120;
      void setCenter(n.position.x + w / 2, n.position.y + h / 2, { zoom: 1, duration: 300 });
    },
    [setCenter],
  );

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

  // Khớp qua helper dùng chung (lib/nodes/search.ts): bỏ dấu tiếng Việt + khớp cả `keywords`
  // VI/EN, nên gõ "vách", "vach", "tach nen", "hoa văn" đều ra đúng node.
  const matchesQuery = (d: NodeDefinition, q: string) => !q || nodeMatches(d, q);
  const hiddenByTier = (d: NodeDefinition) => noAi && (d.category === 'AI_GENERATE' || d.category === 'AI_EDIT');
  // H2 — chặng Render giờ có 2 vùng RIÊNG (Mood+Collab, Master, xem bên dưới) — danh sách
  // theo tag/★ ở đây thu hẹp lại đúng nghĩa "Node thường" (§2), không lặp lại node đã có vùng
  // riêng. Chặng khác (nếu sau này panel dùng lại) giữ hành vi cũ nguyên vẹn.
  const hiddenBySidebarZone = (d: NodeDefinition) => phase.id === 'render' && sidebarZoneOf(d.type) !== 'normal';

  // Nhóm ★ node ưu tiên của chặng hiện tại (chỉ khi không tìm kiếm — soft focus, không lọc bỏ phần khác).
  const featured = useMemo(() => {
    if (query.trim()) return [];
    return phase.featured
      .map((t) => NODE_REGISTRY[t])
      .filter((d): d is NodeDefinition => Boolean(d) && !hiddenByTier(d) && !hiddenBySidebarZone(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, noAi, query]);

  // Nhóm theo BƯỚC QUY TRÌNH archviz (Hoà 05/08, `lib/nodes/groups.ts`): Nguồn → Gu → Máy quay
  // → Dựng ảnh → Sửa ảnh → Hồ sơ. Thay hệ 7 tag kỹ thuật cũ (input/ai-generate/edit/…) — mỗi
  // node đứng ĐÚNG 1 nhóm nên không còn cảnh 1 node hiện ở 2-3 chỗ.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = NODE_DEFINITIONS.filter((d) => matchesQuery(d, q) && !hiddenByTier(d) && !hiddenBySidebarZone(d));
    // Cột "Đầu vào" từng bị bỏ ở layout nghỉ (Hoà 04/08 — trùng nhóm "Trên bảng"). Nay ① NGUỒN
    // KHÔNG phải cột đó: nó là bước quy trình, chứa cả Tạo ảnh từ chữ · Phác tay · Bản vẽ → 3D
    // (không node nào là "đầu vào thuần"), nên hiện đủ 6 nhóm cả lúc nghỉ lẫn lúc tìm.
    const groupsToShow = activeGroup === ALL_GROUP ? GROUP_ORDER : [activeGroup];
    return groupsToShow
      .map((group) => ({ group, defs: filtered.filter((d) => groupOf(d.type) === group) }))
      .filter((g) => g.defs.length > 0);
    // `phase` PHẢI có trong deps: `hiddenBySidebarZone` đọc `phase.id` (ẩn node đã có vùng riêng
    // Mood/Công cụ ở chặng Render). Thiếu nó thì danh sách giữ nguyên kết quả tính lúc mới mount
    // — bắt được lúc verify 05/08: đổi sang chặng 3D thì khối ★ cập nhật (memo `featured` có
    // `phase`) mà 6 nhóm bên dưới vẫn lặp lại node Mood/Công cụ của chặng cũ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, noAi, activeGroup, phase]);

  // H2 — vùng ① Mood + Collab (moodboard/reference/gu) — chỉ ai.moodboard + input.guref khớp
  // registry thật, "note" KHÔNG phải NodeDefinition (type React Flow riêng) nên thêm bằng nút
  // riêng (addNote), không qua NodeCard.
  // Lọc thêm theo ô tìm kiếm: 2 vùng ghim (Mood, Công cụ) trước đây bị ẨN HẲN khi đang gõ, mà
  // node của chúng cũng KHÔNG lọt vào 6 nhóm bên dưới (hiddenBySidebarZone) ⇒ ở chặng 3D, gõ
  // tên 12 node Công cụ / 2 node Mood ra "Không tìm thấy khối nào" dù node có thật (bắt được
  // lúc verify 05/08: gõ "inpainting" = node Sửa vùng → 0 kết quả). Nay vùng ghim tự thu hẹp
  // theo truy vấn thay vì biến mất.
  const moodDefs = useMemo(
    () => (phase.id === 'render' ? NODE_DEFINITIONS.filter((d) => sidebarZoneOf(d.type) === 'mood' && matchesQuery(d, query.trim().toLowerCase())) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, query],
  );
  // G2 phần (5) — kệ "Vật liệu" (matId thật, ProductSpec{kind:'material'} qua /api/specs, KHÔNG
  // phải MaterialDef thị giác của CAD). Fetch 1 lần, không poll — vật liệu đổi chậm (cùng lý do
  // bỏ poll nhanh ở PresenceBar phần (4)). Chỉ hiện ở chặng Render, cùng khu Mood + Cộng tác.
  const materials = useMaterials(phase.id === 'render');
  const materialToParams = useCallback(
    (m: MaterialSpecLite) => ({
      matId: m.id,
      name: m.name,
      code: m.sku ?? '',
      supplier: m.brand ?? '',
      hex: m.colorHex ?? '',
      note: m.priceNote ? `Giá tham khảo: ${m.priceNote}` : '',
    }),
    [],
  );
  const onAddMaterial = useCallback(
    (m: MaterialSpecLite) => {
      addNode('util.materialnote', centerPos());
      const created = useFlowStore.getState().nodes.at(-1);
      if (!created) return;
      const p = materialToParams(m);
      for (const [k, v] of Object.entries(p)) updateParam(created.id, k, v);
    },
    [addNode, centerPos, materialToParams, updateParam],
  );
  // H2 — vùng ② Node MASTER: đúng thứ tự TASK_CARDS, chỉ node còn tồn tại trong registry (phòng
  // khi task-cards.ts trỏ nhầm type — không throw, tự bỏ qua).
  const masterDefs = useMemo(
    () =>
      phase.id === 'render'
        ? TASK_CARDS.map((c) => NODE_REGISTRY[c.nodeType]).filter((d): d is NodeDefinition => Boolean(d) && matchesQuery(d, query.trim().toLowerCase()))
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, query],
  );
  const masterCardIdByNodeType = useMemo(() => new Map(TASK_CARDS.map((c) => [c.nodeType, c.id])), []);
  const onOpenMaster = useCallback(
    (type: string) => {
      const cardId = masterCardIdByNodeType.get(type);
      if (cardId) selectCard(cardId);
    },
    [masterCardIdByNodeType, selectCard],
  );
  const onAddNote = useCallback(() => addNote(centerPos()), [addNote, centerPos]);

  // G2 phần (6) — "Khung concept 5 nhánh" (mindmap tuỳ chọn, xem lib/render-studio/mindmap-templates.ts)
  const onAddMindmap = useCallback(() => {
    instantiateConceptMindmap(centerPos(), {
      addNote,
      updateNote,
      getLastNodeId: () => useFlowStore.getState().nodes.at(-1)?.id,
    });
  }, [centerPos, addNote, updateNote]);

  // `embedded`: gắn thẳng vào ổ ② Navigator (AppShell) — không sheet trượt, không khung/nút
  // đóng riêng (Navigator lo phần đó), luôn hiện bất kể `panel`. Nội dung bên trong NGUYÊN VẸN.
  const body = (
    <>
      <div className="space-y-1.5 p-2.5">
        <input
          autoFocus={panel === 'search'}
          className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-xs leading-normal text-[var(--t1)] placeholder-[var(--t5)] transition-colors focus-visible:border-[var(--accent)]"
          placeholder={tr('Tìm khối…', 'Search blocks…')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* chip lọc theo bước quy trình — 1 chip đang active tại 1 thời điểm, gọn cho panel hẹp */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveGroup(ALL_GROUP)}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
              activeGroup === ALL_GROUP
                ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--t4)] hover:bg-[var(--hover)]',
            )}
          >
            {tr('Tất cả', 'All')}
          </button>
          {GROUP_ORDER.map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                activeGroup === group
                  ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--t4)] hover:bg-[var(--hover)]',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: GROUP_META[group].color }} />
              {tr(GROUP_META[group].label, GROUP_META[group].labelEn)}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="flex w-full items-center gap-1.5 rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--t4)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--t2)]"
          title={tr('Tìm & thêm nhanh khối/hành động', 'Quickly find & add blocks/actions')}
        >
          <Command size={16} className="shrink-0" />
          {tr('Tìm nhanh mọi thứ', 'Quick find anything')}
          <kbd suppressHydrationWarning className="ml-auto shrink-0 rounded border border-[var(--border)] bg-[var(--field)] px-1 py-0.5 text-[9px]">{modKey('K')}</kbd>
        </button>

        {/* Sketch Studio — demo & lối vào nhanh cho cơ chế vẽ tay tự do */}
        <button
          onClick={quickSketch}
          className="flex w-full items-center gap-1.5 rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--t4)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--t2)]"
          title={tr('Thêm khối Free Sketch vào canvas rồi mở Sketch Studio ngay', 'Add a Free Sketch block to the canvas and open Sketch Studio now')}
        >
          <Paintbrush size={16} className="shrink-0" />
          {tr('Vẽ tay nhanh', 'Quick sketch')}
        </button>
        <button
          onClick={demoSketchToRender}
          className="flex w-full items-center gap-1.5 rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--t4)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--t2)]"
          title={tr('Tạo sẵn Free Sketch → Sketch→Render ← Prompt đã nối dây — minh hoạ pipeline vẽ tay → render', 'Sets up Free Sketch → Sketch→Render ← Prompt already wired — demoes the sketch → render pipeline')}
        >
          <Wand2 size={16} className="shrink-0" />
          {tr('Demo: Vẽ tay → Render', 'Demo: Sketch → Render')}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-2.5 pb-4">
        {/* DỌN ĐỊA TẦNG (Hoà chốt 04/08, thay cột "Đầu vào" đã xoá) — nhóm "TRÊN BẢNG" đứng ĐẦU:
            node đang có trên canvas (đầu vào đã thả, node AI đang chạy…), đếm số ở header, bấm 1
            hàng = focus node đó trên canvas (setCenter React Flow). Ẩn khi đang tìm — cùng luật
            soft-focus với các nhóm pinned khác. */}
        {canvasNodes.length > 0 && !query.trim() && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t3)]">
              {tr('Trên bảng', 'On canvas')}
              <span className="ml-auto font-semibold tabular-nums">{canvasNodes.length}</span>
            </p>
            <div className="space-y-1">
              {canvasNodes.map((n) => {
                const defType = n.data?.defType as string | undefined;
                const def = defType ? NODE_REGISTRY[defType] : undefined;
                const label = def?.title ?? (n.type === 'note' ? tr('Ghi chú', 'Note') : (defType ?? n.type ?? ''));
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => focusNode(n.id)}
                    title={tr('Bấm để nhìn tới khối này trên bảng', 'Click to focus this block on the canvas')}
                    className="flex w-full items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-left transition-colors hover:border-[var(--accent-ring)]"
                  >
                    {(() => {
                      if (!defType) return <StickyNote size={16} className="shrink-0 text-[var(--t3)]" />;
                      const Icon = nodeIconFor(defType);
                      return <Icon size={16} className="shrink-0 text-[var(--t3)]" />;
                    })()}
                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[var(--t1)]">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 border-t border-[var(--border)]" />
          </div>
        )}

        {/* H2 (docs/SPEC-MODE-PER-STAGE.md §2) — vùng ① Mood + Collab: moodboard cộng tác kiểu
            Miro (ai.moodboard, reference/gu, note). Chỉ hiện chặng Render, không tìm kiếm (soft
            focus, giống khối ★ bên dưới — ẩn khi đang gõ tìm để đỡ rối). */}
        {moodDefs.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t3)]">
              <Users size={14} />
              {tr('Mood + Cộng tác', 'Mood + Collab')}
            </p>
            <div className="space-y-1">
              {moodDefs.map((def) => (
                <NodeCard key={`mood-${def.type}`} def={def} onAdd={onAdd} />
              ))}
              <button
                onClick={onAddNote}
                className="flex w-full items-center gap-2 rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-2 text-[11px] text-[var(--t4)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--t2)]"
                title={tr('Thêm ghi chú dán lên canvas — trao đổi/ghi ý tưởng, không phải khối xử lý', 'Add a sticky note to the canvas — for discussion/ideas, not a processing block')}
              >
                <StickyNote size={18} className="shrink-0" />
                {tr('Ghi chú', 'Note')}
              </button>
            </div>
            <div className="mt-3 border-t border-[var(--border)]" />
          </div>
        )}

        {/* G2 phần (5) — kệ Vật liệu (matId thật, ATLAS/ProductSpec) — cùng khu Mood + Cộng tác
            vì swatch phục vụ canvas Mood, không phải node xử lý. */}
        {materials.length > 0 && !query.trim() && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t3)]">
              <Palette size={14} />
              {tr('Vật liệu', 'Materials')}
            </p>
            <div className="space-y-1">
              {materials.map((m) => (
                <MaterialSwatchChip key={m.id} material={m} onAdd={onAddMaterial} toParams={materialToParams} />
              ))}
            </div>
            <div className="mt-3 border-t border-[var(--border)]" />
          </div>
        )}

        {/* G2 phần (6) — "Form lập luận": mindmap TUỲ CHỌN, kéo/bấm mới dựng, canvas trống mặc
            định. Chỉ 1 template (Khung concept 5 nhánh) — 5 form còn lại của SPEC-STAGE-LIBRARIES
            là việc riêng "xây kệ Thư viện chặng 2 đầy đủ", ngoài phạm vi phần (6). */}
        {phase.id === 'render' && !query.trim() && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t3)]">
              <Network size={14} />
              {tr('Form lập luận', 'Reasoning frames')}
            </p>
            <div className="space-y-1">
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(MINDMAP_MIME, MINDMAP_TEMPLATE_ID);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={onAddMindmap}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAddMindmap();
                  }
                }}
                className="group flex cursor-pointer items-start gap-2 rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-2 transition-transform hover:border-[var(--accent-ring)] hover:scale-[1.015] active:scale-[0.99]"
                title={tr('Bấm để thêm vào giữa canvas · hoặc kéo thả để đặt đúng chỗ — không bắt buộc, xoá/sửa tự do', 'Click to add to the canvas center · or drag to place — optional, freely edit/delete')}
              >
                <Network size={14} className="mt-0.5 shrink-0 text-[var(--t3)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-medium tracking-[-.005em] text-[var(--t1)]">{tr('Khung concept 5 nhánh', '5-branch concept frame')}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--t4)]">
                    {tr('1 ý tưởng chính + 5 nhánh gợi ý — dựng xong sửa/xoá tự do', '1 main idea + 5 suggested branches — freely edit/delete after')}
                  </p>
                </div>
                <span className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-md text-[var(--t5)] opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-[var(--accent)]">
                  <Plus size={14} />
                </span>
              </div>
            </div>
            <div className="mt-3 border-t border-[var(--border)]" />
          </div>
        )}

        {/* H2 §2 — vùng ② Node MASTER: bắt buộc mở tool window để thao tác (ToolWindow, D3) —
            bấm thẻ ở đây KHÔNG thả node AI trần lên canvas như thẻ thường (xem onOpenMaster). */}
        {masterDefs.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t3)]">
              <Sparkles size={14} />
              {tr('Công cụ', 'Tools')}
            </p>
            <motion.div className="space-y-1" variants={staggerList} initial="hidden" animate="visible">
              {masterDefs.map((def) => (
                <NodeCard key={`master-${def.type}`} def={def} onAdd={onOpenMaster} draggableOverride={false} />
              ))}
            </motion.div>
            <div className="mt-3 border-t border-[var(--border)]" />
          </div>
        )}

        {/* ★ Node ưu tiên cho chặng hiện tại — soft focus, phần còn lại vẫn liệt kê đủ bên dưới */}
        {featured.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              <Star size={14} className="fill-[var(--accent)]" />
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
        {groups.map(({ group, defs }) => {
          const expanded = Boolean(query.trim()) || openGroups.has(group);
          return (
          <div key={group}>
            <button
              type="button"
              onClick={() => setOpenGroups((current) => {
                const next = new Set(current);
                if (next.has(group)) next.delete(group); else next.add(group);
                return next;
              })}
              aria-expanded={expanded}
              className="mb-1.5 flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--t3)] transition-colors hover:bg-[var(--hover)]"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: GROUP_META[group].color }} />
              {tr(GROUP_META[group].label, GROUP_META[group].labelEn)}
              <span className="ml-auto text-[10px] tabular-nums text-[var(--t5)]">{defs.length}</span>
              <ChevronRight size={14} className={cn('shrink-0 transition-transform duration-150', expanded && 'rotate-90')} />
            </button>
            {expanded && (
              <motion.div className="space-y-1" variants={staggerList} initial="hidden" animate="visible">
                {defs.map((def) => (
                  <NodeCard key={`${group}-${def.type}`} def={def} onAdd={onAdd} />
                ))}
              </motion.div>
            )}
          </div>
          );
        })}
        {/* "Không tìm thấy" chỉ khi KHÔNG vùng nào có kết quả — vùng ghim Mood/Công cụ nay cũng
            lọc theo truy vấn nên đếm cả chúng, không thì gõ "inpainting" ra 1 kết quả mà vẫn
            kèm dòng "Không tìm thấy khối nào." ngay dưới (mâu thuẫn, thấy khi verify 05/08). */}
        {groups.length === 0 && moodDefs.length === 0 && masterDefs.length === 0 && (
          <p className="px-1 pt-4 text-center text-xs text-[var(--t5)]">{tr('Không tìm thấy khối nào.', 'No blocks found.')}</p>
        )}
        <p className="px-1 pt-2 text-[10px] leading-relaxed text-[var(--t5)]">
          {noAi
            ? tr('Mức "Không AI" đang bật — khối AI đã ẩn. Đổi mức ở góc trên để hiện lại.', 'The "No AI" level is on — AI blocks are hidden. Change the level at the top to show them again.')
            : tr(`Chặng ${phase.label}: khối ★ ở trên. Kéo thả bất kỳ khối nào vào canvas — các chặng dùng chung 1 canvas.`, `${phase.label} stage: ★ blocks are listed above. Drag any block onto the canvas — all stages share one canvas.`)}
        </p>
      </div>
    </>
  );

  return (
    <>
    {embedded ? (
      <div className="flex h-full w-full flex-col">{body}</div>
    ) : (
      <AnimatePresence>
        {(panel === 'library' || panel === 'search') && (
          // iOS sheet trượt từ trái + material blur
          <motion.aside
            key="node-library"
            variants={sheetSlide('left')}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="nen-mo-panel z-20 flex w-64 flex-col border-r border-[var(--border)]"
          >
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
              <span className="flex-1 text-xs leading-normal font-semibold uppercase tracking-wider text-[var(--t3)]">
                {tr('Thư viện khối', 'Block library')}
              </span>
              <motion.button
                {...pressableIcon}
                onClick={() => setPanel(null)}
                className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
              >
                <X size={14} />
              </motion.button>
            </div>
            {body}
          </motion.aside>
        )}
      </AnimatePresence>
    )}
    {/* NodeLibraryPanel LUÔN được mount trong app/page.tsx (chỉ nội dung panel ẩn/hiện) —
        gắn Sketch Studio ở đây để không phải sửa app/page.tsx (ngoài phạm vi commit).
        Modal tự portal ra document.body nên vị trí gọi không ảnh hưởng layout/transform. */}
    <SketchStudioModal />
    {/* Cùng lý do như SketchStudioModal: mount ở đây (panel luôn được mount) để không phải
        sửa app/page.tsx; modal tự portal ra body nên không ảnh hưởng layout. */}
    <SmartSelectModal />
    <WarpCornersModal />
    </>
  );
}

/**
 * 1 thẻ node — BẤM để thêm vào giữa canvas (dễ nhất, nhất là cảm ứng) HOẶC kéo-thả để
 * đặt đúng chỗ. Cả hai cùng tạo node; click là lối chính vì kéo-thả React Flow khó trên touch.
 */
function NodeCard({
  def,
  onAdd,
  draggableOverride = true,
}: {
  def: NodeDefinition;
  onAdd: (type: string) => void;
  /** H2 — thẻ MASTER tắt kéo-thả: kéo lên canvas sẽ THẢ NODE AI TRẦN, sai luật "bắt buộc mở
   * window để thao tác" (§2). Bấm vẫn mở window bình thường qua `onAdd`. Kéo-thả-mở-window là
   * việc riêng của H3 (đúng ràng buộc "kéo/thả xổ ra WINDOW" — cần cơ chế khác `DND_MIME` hiện
   * tại, vốn chỉ hiểu "thả ra = tạo node"). */
  draggableOverride?: boolean;
}) {
  const tr = useT();
  // VIỆC 1 (05/08): nhãn CHỈ tiếng Việt, ngắn — tên tiếng Anh của công cụ ('Batch Variants',
  // 'Inpainting'…) xuống TOOLTIP, đúng khuôn thanh tool 2D ("Đường (L)"). Giao diện EN đảo lại:
  // hiện tên EN, tooltip mang tên VI — không mất chữ nào ở bất kỳ ngôn ngữ nào.
  const label = tr(def.title, def.titleEn ?? def.title);
  const otherName = tr(def.titleEn ?? '', def.title);
  const hint = draggableOverride ? 'Bấm để thêm vào giữa canvas · hoặc kéo thả để đặt đúng chỗ' : 'Bấm để mở cửa sổ công cụ';
  return (
    <div
      draggable={draggableOverride}
      onDragStart={
        draggableOverride
          ? (e) => {
              e.dataTransfer.setData(DND_MIME, def.type);
              e.dataTransfer.effectAllowed = 'move';
            }
          : undefined
      }
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
      title={otherName ? `${otherName}\n${hint}` : hint}
    >
      {(() => { const Icon = nodeIconFor(def.type); return <Icon size={14} className="mt-0.5 shrink-0 text-[var(--t3)]" />; })()}
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-medium tracking-[-.005em] text-[var(--t1)]">{label}</p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--t4)]">{def.description}</p>
      </div>
      <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
        {def.creditCost > 0 && (
          <span className="rounded bg-[var(--hover)] px-1 py-0.5 text-[9px] text-[var(--t4)]">
            {def.creditCost}cr
          </span>
        )}
        <span className="grid h-5 w-5 place-items-center rounded-md text-[var(--t5)] opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-[var(--accent)]">
          <Plus size={14} />
        </span>
      </div>
    </div>
  );
}

/**
 * G2 phần (5) — 1 chip vật liệu THẬT (ATLAS `ProductSpec.id` = matId). Bấm = thêm ngay (khuôn
 * `NodeCard`). Kéo = set ĐỒNG THỜI `DND_MIME` ('util.materialnote', để nhánh cũ trong
 * `FlowCanvas.onDrop` tạo đúng loại node) + `MAT_MIME` (JSON đủ field, đọc ngay sau đó để
 * `updateParam` — khuôn `ASSET_MIME` đã có, xem `FlowCanvas.tsx`).
 */
function MaterialSwatchChip({
  material,
  onAdd,
  toParams,
}: {
  material: MaterialSpecLite;
  onAdd: (m: MaterialSpecLite) => void;
  toParams: (m: MaterialSpecLite) => Record<string, string>;
}) {
  const swatchColor = material.colorHex && /^#?[0-9a-fA-F]{6}$/.test(material.colorHex) ? material.colorHex : 'var(--border-strong)';
  const meta = [material.brand, material.sku].filter(Boolean).join(' · ');
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_MIME, 'util.materialnote');
        e.dataTransfer.setData(MAT_MIME, JSON.stringify(toParams(material)));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => onAdd(material)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAdd(material);
        }
      }}
      className="group flex cursor-pointer items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-2 transition-transform hover:border-[var(--accent-ring)] hover:scale-[1.015] active:scale-[0.99]"
      title="Bấm để thêm vào giữa canvas · hoặc kéo thả để đặt đúng chỗ — mang theo matId thật"
    >
      <span className="h-6 w-6 shrink-0 rounded-full border border-[var(--border)]" style={{ background: swatchColor }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11.5px] font-medium tracking-[-.005em] text-[var(--t1)]">{material.name}</p>
        {(meta || material.priceNote) && (
          <p className="mt-0.5 truncate text-[10px] leading-snug text-[var(--t4)]">
            {[meta, material.priceNote].filter(Boolean).join('  ·  ')}
          </p>
        )}
      </div>
      <span className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-md text-[var(--t5)] opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-[var(--accent)]">
        <Plus size={14} />
      </span>
    </div>
  );
}
