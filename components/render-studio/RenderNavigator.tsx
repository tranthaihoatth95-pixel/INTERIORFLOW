'use client';

/**
 * components/render-studio/RenderNavigator.tsx — outline các khối ĐANG CÓ trên canvas cho ổ ②
 * Navigator (VIỆC 2 mở rộng 03/08, Hoà: "rail capsule biến mất khỏi CẢ app" — Render/Present
 * cũng phải qua `<AppShell>`). Nhóm theo `NodeCategory` thật (`lib/types.ts` — INPUT/AI_GENERATE/
 * AI_EDIT/SLIDE/UTILITY/OUTPUT, đúng khái niệm "Nguồn·Xử lý·Bảng·Xuất" của
 * `docs/mocks/mock-if-3chang.html` phần `.only.render`), KHÔNG phải catalog để thêm khối mới
 * (đó là `NodeLibraryPanel`, vẫn mở qua "Thư viện Node" ở `AppLogoMenu`/đáy Navigator — 2 việc
 * khác nhau, không gộp để tránh vỡ hành vi toggle sẵn có của `NodeLibraryPanel`).
 *
 * ⚠️ CHỈ đọc (chưa click-để-focus node trên canvas) — `useFlowStore` không có action
 * chọn/pan tới 1 node đơn lẻ sẵn dùng ngoài React Flow instance; nối click thật là việc riêng.
 */

import { useMemo } from 'react';
import { useFlowStore } from '@/lib/store';
import { getDefinition } from '@/lib/nodes/registry';
import { CATEGORY_META, type NodeCategory } from '@/lib/types';
import { useT } from '@/lib/i18n';

const ORDER: NodeCategory[] = ['INPUT', 'AI_GENERATE', 'AI_EDIT', 'SLIDE', 'UTILITY', 'OUTPUT'];

export function RenderNavigator() {
  const nodes = useFlowStore((s) => s.nodes);
  const tr = useT();

  const groups = useMemo(() => {
    const byCat = new Map<NodeCategory, { id: string; title: string }[]>();
    for (const n of nodes) {
      if (!n.data?.defType) continue; // sticky note / mindmap node — không có defType, bỏ qua outline
      let def;
      try {
        def = getDefinition(n.data.defType);
      } catch {
        continue;
      }
      const list = byCat.get(def.category) ?? [];
      list.push({ id: n.id, title: def.title });
      byCat.set(def.category, list);
    }
    return ORDER.map((cat) => ({ cat, items: byCat.get(cat) ?? [] })).filter((g) => g.items.length > 0);
  }, [nodes]);

  if (groups.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-[12px] text-[var(--t4)]">
        {tr('Canvas chưa có khối nào', 'No blocks on canvas yet')}
      </div>
    );
  }

  return (
    <div className="pb-2">
      {groups.map((g) => (
        <div key={g.cat}>
          <div className="mt-1.5 flex h-6 items-center px-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--t4)]">
            {CATEGORY_META[g.cat].label.split(' · ')[0]}
            <span className="ml-auto font-semibold tabular-nums">{g.items.length}</span>
          </div>
          {g.items.map((it) => (
            <div key={it.id} className="flex h-[28px] items-center gap-2 truncate px-2.5 text-[12px] text-[var(--t2)]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: CATEGORY_META[g.cat].color }} />
              <span className="truncate">{it.title}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
