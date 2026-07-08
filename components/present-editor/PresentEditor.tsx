'use client';

/**
 * components/present-editor/PresentEditor.tsx — Trình dàn trang "Present" (container).
 *
 * Lắp ráp: Toolbar (trên) · [TemplatePicker | Canvas | Inspector] (giữa) · SlideStrip (dưới).
 * State cục bộ ở useEditor (KHÔNG dùng lib/store). Kéo/resize/xoay ở Element (pointer events).
 * Template: builtin + từ Reference (fetch /api/library qua fetchGuProfile + raw assets).
 * Auto-suggest: suggestTemplate theo nội dung slide hiện tại. Xuất PDF/PPTX từ CÙNG model.
 *
 * Hydration-safe: fetch thư viện trong useEffect (không ở render body). Nhận initialDeck
 * làm state đầu (deck mẫu do trang truyền vào).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EditorDeck, ShapeKind, Frame, SlideElement } from '@/lib/present-editor/model';
import { makeText, makeImage, makeShape, newId, duplicateElement } from '@/lib/present-editor/model';
import {
  BUILTIN_TEMPLATES,
  templatesFromLibrary,
  type EditorTemplate,
  type TemplateContext,
} from '@/lib/present-editor/templates';
import { suggestTemplate } from '@/lib/present-editor/suggest';
import { buildGuProfile, type GuAsset, type GuProfile } from '@/lib/gu';
import { exportDeckToPdf, exportDeckToPptxFromModel } from '@/lib/present-editor/export';
import { useEditor } from './useEditor';
import Toolbar from './Toolbar';
import EditorCanvas from './EditorCanvas';
import Inspector from './Inspector';
import SlideStrip from './SlideStrip';
import TemplatePicker from './TemplatePicker';

interface Props {
  initialDeck: EditorDeck;
}

export default function PresentEditor({ initialDeck }: Props) {
  const ed = useEditor(initialDeck);
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [libAssets, setLibAssets] = useState<GuAsset[]>([]);
  const [gu, setGu] = useState<GuProfile | null>(null);

  // Nạp thư viện Reference (layout/slide templates + gu). Không chặn UI nếu lỗi/empty.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/library');
        if (!r.ok) return;
        const d = await r.json();
        const assets: GuAsset[] = (d.assets ?? []).map((a: Record<string, unknown>) => ({
          id: String(a.id),
          name: String(a.name ?? ''),
          url: String(a.url ?? ''),
          usage: String(a.usage ?? 'ref-render'),
          palette: Array.isArray(a.palette) ? (a.palette as string[]) : [],
          caption: String(a.caption ?? ''),
          tags: String(a.tags ?? ''),
          w: Number(a.w ?? 0),
          h: Number(a.h ?? 0),
        }));
        if (!alive) return;
        setLibAssets(assets);
        setGu(buildGuProfile(assets));
      } catch {
        /* thư viện trống hoặc chưa đăng nhập — dùng builtin */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const templates: EditorTemplate[] = useMemo(
    () => [...BUILTIN_TEMPLATES, ...templatesFromLibrary(libAssets)],
    [libAssets],
  );

  // Nội dung slide hiện tại (bóc từ text role) để nuôi auto-suggest.
  const suggestion = useMemo(() => {
    const s = ed.slide;
    if (!s) return null;
    const texts = s.elements.filter((e) => e.kind === 'text') as Extract<SlideElement, { kind: 'text' }>[];
    const title = texts.find((t) => t.role === 'title')?.text;
    const kicker = texts.find((t) => t.role === 'kicker')?.text;
    const body = texts.filter((t) => t.role === 'body').flatMap((t) => t.text.split('\n')).filter(Boolean);
    const images = s.elements.filter((e) => e.kind === 'image').map((e) => (e as { src: string }).src);
    if (s.backgroundImage) images.push(s.backgroundImage);
    return suggestTemplate({ title, kicker, body, images, gu }, { isFirst: ed.currentSlide === 0 });
  }, [ed.slide, ed.currentSlide, gu]);

  const palette = ed.deck.palette;

  /* ------------------------- actions element ------------------------- */
  const addElement = useCallback(
    (el: SlideElement) => {
      ed.updateSlide((s) => {
        s.elements.push(el);
      });
      ed.select(el.id);
    },
    [ed],
  );

  const onAddText = () => addElement(makeText({ color: pickInk(palette), frame: centered(50, 12) }));
  const onAddShape = (shape: ShapeKind) =>
    addElement(makeShape(shape, { fill: palette[3] ?? '#8a6f4d', stroke: palette[3] ?? '#8a6f4d' }));
  const onAddImageUrl = (src: string) => addElement(makeImage(src, { frame: centered(40, 45) }));

  const onFrame = useCallback(
    (id: string, frame: Frame, live: boolean) => {
      ed.updateSlide((s) => {
        const el = s.elements.find((e) => e.id === id);
        if (el) el.frame = frame;
      }, live);
    },
    [ed],
  );

  const onEditTextCommit = useCallback(
    (id: string, text: string) => {
      ed.updateSlide((s) => {
        const el = s.elements.find((e) => e.id === id);
        if (el && el.kind === 'text') el.text = text;
      });
    },
    [ed],
  );

  // z-order 4 mức: ra sau cùng / lùi 1 bậc / tiến 1 bậc / lên trước cùng.
  const onZOrder = useCallback(
    (dir: 'front' | 'back' | 'forward' | 'backward') => {
      if (!ed.selectedId) return;
      ed.updateSlide((s) => {
        const i = s.elements.findIndex((e) => e.id === ed.selectedId);
        if (i < 0) return;
        const [el] = s.elements.splice(i, 1);
        if (dir === 'front') s.elements.push(el);
        else if (dir === 'back') s.elements.unshift(el);
        else if (dir === 'forward') s.elements.splice(Math.min(i + 1, s.elements.length), 0, el);
        else s.elements.splice(Math.max(i - 1, 0), 0, el); // backward
      });
    },
    [ed],
  );

  const onDeleteSelected = useCallback(() => {
    if (!ed.selectedId) return;
    ed.updateSlide((s) => {
      s.elements = s.elements.filter((e) => e.id !== ed.selectedId);
    });
    ed.select(null);
  }, [ed]);

  // Nhân bản element đang chọn (Ctrl/Cmd+D) → chọn luôn bản mới.
  const onDuplicateSelected = useCallback(() => {
    if (!ed.selected) return;
    const copy = duplicateElement(ed.selected);
    ed.updateSlide((s) => {
      s.elements.push(copy);
    });
    ed.select(copy.id);
  }, [ed]);

  // Clipboard element cục bộ (không đụng clipboard hệ thống — đủ cho copy/paste trong app).
  const clipboardRef = useRef<SlideElement | null>(null);
  const onCopySelected = useCallback(() => {
    if (ed.selected) clipboardRef.current = JSON.parse(JSON.stringify(ed.selected));
  }, [ed.selected]);

  const onPaste = useCallback(() => {
    if (!clipboardRef.current) return;
    const copy = duplicateElement(clipboardRef.current);
    ed.updateSlide((s) => {
      s.elements.push(copy);
    });
    ed.select(copy.id);
  }, [ed]);

  // Dời element theo phím mũi tên (step nhỏ 0.5%, Shift = 5%). Clamp trong sân khấu.
  const onNudge = useCallback(
    (dx: number, dy: number) => {
      if (!ed.selectedId) return;
      ed.updateSlide((s) => {
        const el = s.elements.find((e) => e.id === ed.selectedId);
        if (!el || el.locked) return;
        el.frame = {
          ...el.frame,
          x: clampPct(el.frame.x + dx),
          y: clampPct(el.frame.y + dy),
        };
      });
    },
    [ed],
  );

  // Căn element trong sân khấu (trái/giữa-ngang/phải · trên/giữa-dọc/dưới).
  const onAlign = useCallback(
    (mode: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => {
      if (!ed.selectedId) return;
      ed.updateSlide((s) => {
        const el = s.elements.find((e) => e.id === ed.selectedId);
        if (!el || el.locked) return;
        const f = { ...el.frame };
        if (mode === 'left') f.x = 0;
        else if (mode === 'hcenter') f.x = (100 - f.w) / 2;
        else if (mode === 'right') f.x = 100 - f.w;
        else if (mode === 'top') f.y = 0;
        else if (mode === 'vcenter') f.y = (100 - f.h) / 2;
        else if (mode === 'bottom') f.y = 100 - f.h;
        el.frame = f;
      });
    },
    [ed],
  );

  /* ------------------------- actions slide --------------------------- */
  const onApplyTemplate = useCallback(
    (t: EditorTemplate) => {
      // Giữ nội dung chữ + ảnh hiện có → nhồi vào template mới (human-in-the-loop).
      const s = ed.slide;
      const texts = (s?.elements.filter((e) => e.kind === 'text') ?? []) as Extract<SlideElement, { kind: 'text' }>[];
      const ctx: TemplateContext = {
        title: texts.find((t2) => t2.role === 'title')?.text,
        kicker: texts.find((t2) => t2.role === 'kicker')?.text,
        body: texts.filter((t2) => t2.role === 'body').flatMap((t2) => t2.text.split('\n')).filter(Boolean),
        images: [
          ...(s?.elements.filter((e) => e.kind === 'image').map((e) => (e as { src: string }).src) ?? []),
          ...(s?.backgroundImage ? [s.backgroundImage] : []),
        ],
        palette: gu?.palette?.length ? gu.palette : palette,
        fonts: ed.deck.fonts,
      };
      const built = t.build(ctx);
      ed.updateSlide((slide) => {
        slide.background = built.background;
        slide.backgroundImage = built.backgroundImage ?? null;
        slide.backgroundAdjust = built.backgroundAdjust;
        slide.elements = built.elements;
        slide.templateId = built.templateId;
      });
      ed.select(null);
    },
    [ed, gu, palette],
  );

  const onAddSlide = useCallback(() => {
    const built = BUILTIN_TEMPLATES.find((t) => t.id === 'content-image')!.build({
      title: 'Tiêu đề slide',
      body: ['Ý chính 1', 'Ý chính 2'],
      palette: gu?.palette?.length ? gu.palette : palette,
    });
    ed.update((d) => {
      d.slides.push(built);
    });
    ed.selectSlide(ed.deck.slides.length);
  }, [ed, gu, palette]);

  const onDuplicateSlide = useCallback(
    (i: number) => {
      ed.update((d) => {
        const copy = JSON.parse(JSON.stringify(d.slides[i]));
        copy.id = newId('sld');
        copy.elements = copy.elements.map((e: SlideElement) => ({ ...e, id: newId(e.kind) }));
        d.slides.splice(i + 1, 0, copy);
      });
      ed.selectSlide(i + 1);
    },
    [ed],
  );

  const onDeleteSlide = useCallback(
    (i: number) => {
      if (ed.deck.slides.length <= 1) return;
      ed.update((d) => {
        d.slides.splice(i, 1);
      });
      ed.selectSlide(Math.max(0, i - 1));
    },
    [ed],
  );

  const onMoveSlide = useCallback(
    (i: number, dir: -1 | 1) => {
      const j = i + dir;
      if (j < 0 || j >= ed.deck.slides.length) return;
      ed.update((d) => {
        const [s] = d.slides.splice(i, 1);
        d.slides.splice(j, 0, s);
      });
      ed.selectSlide(j);
    },
    [ed],
  );

  /* ------------------------------ export ----------------------------- */
  const onExportPdf = useCallback(async () => {
    setBusy('pdf');
    try {
      await exportDeckToPdf(ed.deck);
    } catch (err) {
      console.error('[PresentEditor] PDF export failed', err);
    } finally {
      setBusy(null);
    }
  }, [ed.deck]);

  const onExportPptx = useCallback(async () => {
    setBusy('pptx');
    try {
      await exportDeckToPptxFromModel(ed.deck);
    } catch (err) {
      console.error('[PresentEditor] PPTX export failed', err);
    } finally {
      setBusy(null);
    }
  }, [ed.deck]);

  /* ----------------------- phím tắt (cấp document) ----------------------- */
  // Gắn ở window: div canvas không tự nhận focus nên onKeyDown trên div KHÔNG bắn.
  // Guard: đang gõ trong input/textarea/contenteditable → bỏ qua (trừ Escape).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = isTypingTarget(document.activeElement);

      // Escape: luôn cho qua (thoát inline-edit do textarea tự blur; ở đây bỏ chọn).
      if (e.key === 'Escape') {
        if (!typing) ed.select(null);
        return;
      }
      // Đang gõ chữ → không đụng gì để tránh xoá nhầm element.
      if (typing) return;

      const mod = e.metaKey || e.ctrlKey; // Cmd (mac) hoặc Ctrl (win)

      // Undo / Redo
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) ed.redo();
        else ed.undo();
        return;
      }
      if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        ed.redo();
        return;
      }
      // Nhân bản
      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        onDuplicateSelected();
        return;
      }
      // Copy / Paste (clipboard cục bộ của editor)
      if (mod && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        onCopySelected();
        return;
      }
      if (mod && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        onPaste();
        return;
      }
      // Xoá element đang chọn
      if ((e.key === 'Delete' || e.key === 'Backspace') && ed.selectedId) {
        e.preventDefault();
        onDeleteSelected();
        return;
      }
      // Dời bằng phím mũi tên (Shift = bước lớn 5%, thường 0.5%)
      if (ed.selectedId && e.key.startsWith('Arrow')) {
        const step = e.shiftKey ? 5 : 0.5;
        e.preventDefault();
        if (e.key === 'ArrowLeft') onNudge(-step, 0);
        else if (e.key === 'ArrowRight') onNudge(step, 0);
        else if (e.key === 'ArrowUp') onNudge(0, -step);
        else if (e.key === 'ArrowDown') onNudge(0, step);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ed, onDuplicateSelected, onCopySelected, onPaste, onDeleteSelected, onNudge]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--t1)',
      }}
    >
      <Toolbar
        onAddText={onAddText}
        onAddImageUrl={onAddImageUrl}
        onAddShape={onAddShape}
        onToggleTemplates={() => setTemplatesOpen((v) => !v)}
        templatesOpen={templatesOpen}
        onUndo={ed.undo}
        onRedo={ed.redo}
        canUndo={ed.canUndo}
        canRedo={ed.canRedo}
        onExportPdf={onExportPdf}
        onExportPptx={onExportPptx}
        busy={busy}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* trái: template */}
        {templatesOpen && (
          <aside
            style={{
              width: 260,
              flex: '0 0 260px',
              borderRight: '1px solid var(--border)',
              background: 'var(--panel)',
              padding: 14,
              overflowY: 'auto',
            }}
          >
            <TemplatePicker
              templates={templates}
              suggestedId={suggestion?.templateId ?? null}
              suggestReason={suggestion?.reason ?? null}
              onApply={onApplyTemplate}
              palette={palette}
              fonts={ed.deck.fonts}
            />
          </aside>
        )}

        {/* giữa: canvas */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            overflow: 'auto',
          }}
        >
          {ed.slide && (
            <EditorCanvas
              slide={ed.slide}
              fonts={ed.deck.fonts}
              selectedId={ed.selectedId}
              onSelect={ed.select}
              onFrame={onFrame}
              onEditTextCommit={onEditTextCommit}
              onDuplicate={onDuplicateSelected}
              onDelete={onDeleteSelected}
              onZOrder={onZOrder}
              onToggleLock={() =>
                ed.updateSelected((el) => (el.locked = !el.locked))
              }
            />
          )}
        </main>

        {/* phải: inspector */}
        <aside
          style={{
            width: 280,
            flex: '0 0 280px',
            borderLeft: '1px solid var(--border)',
            background: 'var(--panel)',
            padding: 14,
            overflowY: 'auto',
          }}
        >
          {ed.slide && (
            <Inspector
              slide={ed.slide}
              selected={ed.selected}
              palette={palette}
              deckFonts={ed.deck.fonts}
              onUpdateSelected={ed.updateSelected}
              onUpdateSlide={ed.updateSlide}
              onZOrder={onZOrder}
              onAlign={onAlign}
              onDuplicate={onDuplicateSelected}
              onDelete={onDeleteSelected}
            />
          )}
        </aside>
      </div>

      <SlideStrip
        deck={ed.deck}
        current={ed.currentSlide}
        onSelect={ed.selectSlide}
        onAdd={onAddSlide}
        onDuplicate={onDuplicateSlide}
        onDelete={onDeleteSlide}
        onMove={onMoveSlide}
      />
    </div>
  );
}

/* -------- tiện ích -------- */
function centered(w: number, h: number): Frame {
  return { x: (100 - w) / 2, y: (100 - h) / 2, w, h, rotation: 0 };
}
function clampPct(v: number): number {
  return Math.max(-5, Math.min(v, 105)); // cho lố mép nhẹ để bố cục "tràn viền" vẫn được
}
/** Con trỏ có đang ở trong ô nhập liệu? (chặn phím tắt khi đang gõ). */
function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable === true
  );
}
function pickInk(palette: string[]): string {
  // màu chữ tối nhất trong palette (hoặc đen)
  const valid = (palette || []).filter((c) => /^#[0-9a-fA-F]{6}$/.test(c));
  if (!valid.length) return '#221f1a';
  return valid.slice().sort((a, b) => lum(a) - lum(b))[0];
}
function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}
