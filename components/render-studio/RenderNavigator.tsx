'use client';

/**
 * components/render-studio/RenderNavigator.tsx — ổ ② Navigator chặng Dựng ảnh.
 *
 * 🔥 1b (đêm 04/08, `docs/BAO-CAO-DEM-2026-08-04.md` mục 23:1x): bản đầu đổ node-INSTANCE trên
 * canvas → canvas trống thì Navigator RỖNG ("chỉ ĐẦU VÀO 2" — ảnh Hoà). Viết lại theo đúng
 * chẩn đoán TỔNG: nối nguồn dữ liệu CATALOG của `NodeLibraryPanel` (NODE_DEFINITIONS + zones
 * H2), nhóm theo mock `mock-if-3chang.html` sidebar render: **Nguồn · Xử lý · Bảng cảm hứng ·
 * Xuất** — Navigator luôn ĐẦY nội dung, kể cả canvas trống.
 *
 * Số đếm cạnh mỗi hàng = số instance đang có trên canvas (mock `.mini`) — 0 thì để trống cho đỡ
 * nhiễu. Bấm hàng = THÊM khối vào giữa canvas (cùng hành vi click của NodeLibraryPanel: normal →
 * `addNode`, MASTER → mở ToolWindow qua `selectCard`, ghi chú → `addNote`) — Navigator là bảng
 * XÂY GRAPH, không phải outline chết.
 */

import { useCallback, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '@/lib/store';
import { NODE_DEFINITIONS } from '@/lib/nodes/registry';
import { sidebarZoneOf } from '@/lib/render-studio/sidebar-zones';
import { TASK_CARDS } from '@/lib/render-studio/task-cards';
import { useToolModeUi } from '@/lib/render-studio/tool-mode-ui';
import { CATEGORY_META } from '@/lib/types';
import { useT } from '@/lib/i18n';

interface Row {
  key: string;
  title: string;
  color: string;
  onPick: () => void;
  count: number;
}

interface Group {
  label: [string, string];
  rows: Row[];
}

export function RenderNavigator() {
  const nodes = useFlowStore((s) => s.nodes);
  const addNode = useFlowStore((s) => s.addNode);
  const addNote = useFlowStore((s) => s.addNote);
  const selectCard = useToolModeUi((s) => s.selectCard);
  const { screenToFlowPosition } = useReactFlow();
  const tr = useT();

  const centerPos = useCallback(
    () => screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }),
    [screenToFlowPosition],
  );

  const countByType = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) {
      const t = n.data?.defType as string | undefined;
      if (t) m.set(t, (m.get(t) ?? 0) + 1);
    }
    return m;
  }, [nodes]);
  const noteCount = useMemo(() => nodes.filter((n) => n.type === 'note').length, [nodes]);

  const masterCardIdByNodeType = useMemo(() => new Map(TASK_CARDS.map((c) => [c.nodeType, c.id])), []);

  const groups: Group[] = useMemo(() => {
    const nguon: Row[] = [];
    const xuly: Row[] = [];
    const bang: Row[] = [];
    const xuat: Row[] = [];

    for (const def of NODE_DEFINITIONS) {
      const zone = sidebarZoneOf(def.type);
      const pick =
        zone === 'master'
          ? () => {
              const cardId = masterCardIdByNodeType.get(def.type);
              if (cardId) selectCard(cardId);
            }
          : () => addNode(def.type, centerPos());
      const row: Row = {
        key: def.type,
        title: def.title,
        color: CATEGORY_META[def.category].color,
        onPick: pick,
        count: countByType.get(def.type) ?? 0,
      };
      if (zone === 'mood') bang.push(row);
      else if (def.category === 'INPUT') nguon.push(row);
      else if (def.category === 'OUTPUT' || def.category === 'SLIDE') xuat.push(row);
      else xuly.push(row); // AI_GENERATE · AI_EDIT · UTILITY — "Xử lý" theo mock
    }
    // Ghi chú nhóm (sticky note) — type React Flow riêng, không nằm trong registry (xem
    // sidebar-zones.ts phần MOOD) — thêm tay đúng như NodeLibraryPanel.
    bang.push({
      key: 'note',
      title: tr('Ghi chú nhóm', 'Team notes'),
      color: '#d9a34a',
      onPick: () => addNote(centerPos()),
      count: noteCount,
    });

    return [
      { label: ['Nguồn', 'Sources'] as [string, string], rows: nguon },
      { label: ['Xử lý', 'Process'] as [string, string], rows: xuly },
      { label: ['Bảng cảm hứng', 'Mood board'] as [string, string], rows: bang },
      { label: ['Xuất', 'Output'] as [string, string], rows: xuat },
    ].filter((g) => g.rows.length > 0);
  }, [masterCardIdByNodeType, selectCard, addNode, addNote, centerPos, countByType, noteCount, tr]);

  return (
    <div className="pb-2">
      {groups.map((g) => (
        <div key={g.label[1]}>
          <div className="mt-1.5 flex h-6 items-center px-2.5 text-[var(--fs-2xs)] font-bold uppercase tracking-wider text-[var(--t4)]">
            {tr(g.label[0], g.label[1])}
            <span className="ml-auto font-semibold tabular-nums">{g.rows.length}</span>
          </div>
          {g.rows.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={r.onPick}
              title={tr('Bấm để thêm vào bảng làm việc', 'Click to add to canvas')}
              className="flex h-[28px] w-full items-center gap-2 px-2.5 text-[12px] text-[var(--t2)] transition-colors duration-100 hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-ring)]"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
              <span className="min-w-0 flex-1 truncate text-left">{r.title}</span>
              {r.count > 0 && (
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--t4)]">{r.count}</span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
