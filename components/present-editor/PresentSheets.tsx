'use client';

/**
 * components/present-editor/PresentSheets.tsx — Tầng MULTI-SHEET (phụ-thêm) cho chặng Present.
 *
 * `useEditor` là state cục bộ theo instance, nhưng PresentEditor bind 1 listener keydown cấp
 * window → KHÔNG mount đồng thời nhiều instance (đụng ⌘Z). Giải pháp: giữ ĐÚNG 1 PresentEditor,
 * re-key theo activeId; mỗi sheet giữ deck riêng. `onDeckChange` (prop tuỳ chọn) đẩy deck sống ra
 * → lưu vào deckRef → commit vào sheet trước khi đổi tab.
 *
 * Đánh đổi pha 1: đổi tab reset undo-history + selection (giống Excel đổi sheet), fetch lại thư
 * viện 1 lần/đổi-tab. Nội dung deck KHÔNG mất. 1 sheet ⇒ y hệt bản cũ (kể cả đường export).
 * Kéo-gộp single-window = pha 2 (docs/MULTI-SHEET-PROPOSAL.md §6).
 */

import { useRef, useState } from 'react';
import PresentEditor from './PresentEditor';
import SheetTabBar, { type SheetTab } from '@/components/studio/SheetTabBar';
import type { EditorDeck, EditorSlide } from '@/lib/present-editor/model';
import { newId } from '@/lib/present-editor/model';

const MAX_SHEETS = 5;
const BLANK_PALETTE = ['#EFE9DC', '#C2AD86', '#8A6A3A', '#6E4A2E', '#3B352F', '#28211A'];

interface Props {
  initialDeck: EditorDeck;
}

interface Sheet extends SheetTab {
  deck: EditorDeck;
}

function blankSlide(): EditorSlide {
  return { id: newId('slide'), background: '#ffffff', elements: [] };
}

function blankDeck(n: number): EditorDeck {
  return {
    id: newId('deck'),
    brand: '',
    project: `Trang ${n}`,
    fonts: 'Editorial',
    palette: [...BLANK_PALETTE],
    slides: [blankSlide()],
  };
}

let seq = 1;
const nextId = () => `presheet-${seq++}`;

export default function PresentSheets({ initialDeck }: Props) {
  const [sheets, setSheets] = useState<Sheet[]>([
    { id: 'presheet-0', name: 'Trang 1', deck: initialDeck },
  ]);
  const [activeId, setActiveId] = useState('presheet-0');
  // deck "sống" mới nhất của sheet đang mở (ref → không render thừa mỗi lần deck đổi).
  const liveDeck = useRef<EditorDeck>(initialDeck);

  const active = sheets.find((s) => s.id === activeId) ?? sheets[0];

  /** Commit deck sống của sheet đang mở vào state sheets (gọi trước mỗi thao tác tab). */
  const commitActive = (list: Sheet[]): Sheet[] =>
    list.map((s) => (s.id === activeId ? { ...s, deck: liveDeck.current } : s));

  const switchTo = (id: string) => {
    if (id === activeId) return;
    const committed = commitActive(sheets);
    setSheets(committed);
    const target = committed.find((s) => s.id === id);
    liveDeck.current = target?.deck ?? initialDeck;
    setActiveId(id);
  };

  const addSheet = () => {
    if (sheets.length >= MAX_SHEETS) return;
    const id = nextId();
    const deck = blankDeck(sheets.length + 1);
    const committed = commitActive(sheets);
    liveDeck.current = deck;
    setSheets([...committed, { id, name: `Trang ${sheets.length + 1}`, deck }]);
    setActiveId(id);
  };

  const closeSheet = (id: string) => {
    if (sheets.length <= 1) return;
    const committed = commitActive(sheets);
    const idx = committed.findIndex((s) => s.id === id);
    const rest = committed.filter((s) => s.id !== id);
    setSheets(rest);
    if (id === activeId) {
      const neighbor = rest[Math.max(0, idx - 1)];
      liveDeck.current = neighbor.deck;
      setActiveId(neighbor.id);
    }
  };

  const renameSheet = (id: string, name: string) =>
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));

  const reorder = (from: number, to: number) =>
    setSheets((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <SheetTabBar
        sheets={sheets}
        activeId={activeId}
        max={MAX_SHEETS}
        onSelect={switchTo}
        onAdd={addSheet}
        onRename={renameSheet}
        onClose={closeSheet}
        onReorder={reorder}
        addLabel="Thêm trang trình bày"
      />
      <div style={{ flex: 1, minHeight: 0 }}>
        <PresentEditor
          key={activeId}
          initialDeck={active.deck}
          onDeckChange={(d) => {
            liveDeck.current = d;
          }}
        />
      </div>
    </div>
  );
}
