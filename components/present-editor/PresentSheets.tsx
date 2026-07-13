'use client';

/**
 * components/present-editor/PresentSheets.tsx — Tầng MULTI-SHEET (phụ-thêm) cho chặng Present.
 *
 * `useEditor` là state cục bộ theo instance, nhưng PresentEditor bind 1 listener keydown cấp
 * window → KHÔNG mount đồng thời nhiều instance (đụng ⌘Z). Giải pháp: giữ ĐÚNG 1 PresentEditor,
 * re-key theo activeId; mỗi sheet giữ deck riêng. `onDeckChange` (prop tuỳ chọn) đẩy deck sống ra
 * → lưu vào deckRef → commit vào sheet trước khi đổi tab.
 *
 * PERSISTENCE (J-3 Sprint 2 — quyết định #6 "nhớ chính xác từng sheet"):
 * cả bộ sheet (deck + tên, TRẦN 5) serialize vào IndexedDB theo khoá
 * `userId::/present-editor` (lib/sheets-persist). Reload → khôi phục đúng bộ sheet +
 * sheet đang mở (ưu tiên resume.sheetId của lib/resume nếu còn tồn tại). Autosave
 * debounce ≥1s nghe onDeckChange + thao tác tab. PresentEditor chỉ mount SAU khi
 * hydrate xong (IDB trả lời trong vài ms) — vì editor giữ deck theo key=activeId,
 * mount trước rồi mới bơm deck khôi phục sẽ không ăn. Không có userId → in-memory y bản cũ.
 *
 * Đánh đổi pha 1: đổi tab reset undo-history + selection (giống Excel đổi sheet), fetch lại thư
 * viện 1 lần/đổi-tab. Nội dung deck KHÔNG mất. 1 sheet ⇒ y hệt bản cũ (kể cả đường export).
 * Kéo-gộp single-window = pha 2 (docs/MULTI-SHEET-PROPOSAL.md §6).
 */

import { useEffect, useRef, useState } from 'react';
import PresentEditor from './PresentEditor';
import SheetTabBar, { type SheetTab } from '@/components/studio/SheetTabBar';
import type { EditorDeck, EditorSlide } from '@/lib/present-editor/model';
import { newId } from '@/lib/present-editor/model';
import { getLastUserId, loadResume, saveResume } from '@/lib/resume';
import {
  createSheetsAutosaver,
  loadSheets,
  nextSeqFrom,
  type SheetsAutosaver,
  type SheetsRecord,
} from '@/lib/sheets-persist';

const MAX_SHEETS = 5;
const ROUTE = '/present-editor' as const;
const BLANK_PALETTE = ['#EFE9DC', '#C2AD86', '#8A6A3A', '#6E4A2E', '#3B352F', '#28211A'];

interface Props {
  initialDeck: EditorDeck;
}

interface Sheet extends SheetTab {
  deck: EditorDeck;
}

/** Hình hài 1 sheet trong IndexedDB — deck + tên. */
interface PersistedPresentSheet {
  id: string;
  name: string;
  deck: EditorDeck;
  [k: string]: unknown;
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

  // ---- Persistence (J-3): refs gương cho autosaver + cờ hydrate ----
  const userIdRef = useRef<string | null>(null);
  const sheetsRef = useRef(sheets);
  const activeIdRef = useRef(activeId);
  const saverRef = useRef<SheetsAutosaver | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /** KHÔI PHỤC 1 lần lúc mount: IDB → bộ sheet + sheet active (ưu tiên resume.sheetId). */
  useEffect(() => {
    const userId = getLastUserId();
    userIdRef.current = userId;
    if (!userId) {
      setHydrated(true); // chưa đăng nhập → thuần in-memory (y bản cũ)
      return;
    }
    let cancelled = false;
    void loadSheets<PersistedPresentSheet>(userId, ROUTE).then((rec) => {
      if (cancelled) return;
      const valid =
        rec?.sheets.filter((s) => s.deck && Array.isArray(s.deck.slides)).slice(0, MAX_SHEETS) ?? [];
      if (rec && valid.length > 0) {
        seq = Math.max(seq, nextSeqFrom(valid.map((s) => s.id), 'presheet'));
        const resumeSheet = loadResume(userId)?.sheetId;
        const wantId =
          (resumeSheet && valid.some((s) => s.id === resumeSheet) && resumeSheet) ||
          (valid.some((s) => s.id === rec.activeId) && rec.activeId) ||
          valid[0].id;
        const restored = valid.map(({ id, name, deck }) => ({ id, name, deck }));
        setSheets(restored);
        setActiveId(wantId);
        liveDeck.current = restored.find((s) => s.id === wantId)?.deck ?? restored[0].deck;
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** AUTOSAVE debounce ≥1s — deck sống + cấu trúc tab, chỉ sau khi hydrate. */
  useEffect(() => {
    const userId = userIdRef.current;
    if (!hydrated || !userId) return;
    const getRecord = (): SheetsRecord | null => ({
      v: 1,
      activeId: activeIdRef.current,
      ts: Date.now(),
      sheets: sheetsRef.current.slice(0, MAX_SHEETS).map((s) => ({
        id: s.id,
        name: s.name,
        // sheet đang mở → deck sống mới nhất (state sheets chỉ commit lúc đổi tab)
        deck: s.id === activeIdRef.current ? liveDeck.current : s.deck,
      })),
    });
    const saver = createSheetsAutosaver(userId, ROUTE, getRecord, {
      onSaved: (bytes) => console.debug(`[present-sheets] IDB ghi ${(bytes / 1024).toFixed(1)} KB`),
    });
    saverRef.current = saver;
    const flush = () => saver.flush();
    const onHide = () => {
      if (document.visibilityState === 'hidden') saver.flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onHide);
      saver.flush(); // rời route (client-nav) → không mất nhịp cuối
      saver.dispose();
      saverRef.current = null;
    };
  }, [hydrated]);

  /** Cấu trúc tab đổi (thêm/xoá/đổi tên/reorder/đổi active) → gương ref + đánh dấu lưu. */
  useEffect(() => {
    sheetsRef.current = sheets;
    activeIdRef.current = activeId;
    if (hydrated) saverRef.current?.touch();
  }, [sheets, activeId, hydrated]);

  /** Resume trỏ tận sheet: ghi sheetId đang mở vào resume-state (lib/resume). */
  useEffect(() => {
    const userId = userIdRef.current;
    if (!hydrated || !userId) return;
    saveResume(userId, { route: ROUTE, sheetId: activeId });
  }, [activeId, hydrated]);

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
        {/* Chỉ mount editor SAU hydrate: deck khôi phục phải vào từ initialDeck (key=activeId). */}
        {hydrated && (
          <PresentEditor
            key={activeId}
            initialDeck={active.deck}
            onDeckChange={(d) => {
              liveDeck.current = d;
              saverRef.current?.touch();
            }}
          />
        )}
      </div>
    </div>
  );
}
