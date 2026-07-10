'use client';

/**
 * components/present-editor/PresentEditor.tsx — Trình dàn trang "Present" (container).
 *
 * Lắp ráp: Toolbar (trên) · [Panel trái RESIZE (Mẫu | Reference | Motion) | Canvas |
 * Inspector] (giữa) · SlideStrip (dưới). State cục bộ ở useEditor (KHÔNG dùng lib/store).
 *
 * Round 2 (user):
 *  - Panel trái KÉO DÃN được (splitter) + 3 tab: bố cục 3 hàng cuộn ngang · Reference
 *    (xoá + gom theo dự án/thẻ) · Motion (hiệu ứng Apple + trình chiếu).
 *  - Bảng hỏi số liệu (spec) áp vào bố cục sinh ra.
 *  - Hai rổ ảnh TÁCH RÕ: "Ảnh" trên toolbar = ảnh NỘI DUNG đưa thẳng vào slide;
 *    tab Reference = ảnh THAM KHẢO gom nhóm (kéo/bấm để đưa vào slide khi cần).
 *  - Chỉnh ảnh: nhấp đúp HOẶC chuột phải → "Chỉnh ảnh"; "Chỉnh ảnh nâng cao" mở /photo-editor.
 *
 * Hydration-safe: fetch thư viện trong useEffect. Nhận initialDeck làm state đầu.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  EditorDeck,
  ShapeKind,
  Frame,
  SlideElement,
  ImageElement,
  SlideTransition,
  ElementReveal,
} from '@/lib/present-editor/model';
import { makeText, makeImage, makeShape, newId, duplicateElement } from '@/lib/present-editor/model';
import {
  BUILTIN_TEMPLATES,
  templatesFromLibrary,
  type EditorTemplate,
  type TemplateContext,
} from '@/lib/present-editor/templates';
import { suggestTemplate } from '@/lib/present-editor/suggest';
import { DEFAULT_SPEC, applySpecToSlide, type LayoutSpec } from '@/lib/present-editor/spec';
import { buildGuProfile, type GuAsset, type GuProfile } from '@/lib/gu';
import { exportDeckToPdf, exportDeckToPptxFromModel, exportDeckToPng } from '@/lib/present-editor/export';
import { useEditor } from './useEditor';
import { slidesFromContent } from '@/lib/present-editor/content-deck';
import Toolbar from './Toolbar';
import EditorCanvas from './EditorCanvas';
import Inspector from './Inspector';
import SlideStrip from './SlideStrip';
import LayoutShelf from './LayoutShelf';
import LibraryBrowser, { type RefImage } from './LibraryBrowser';
import MotionPanel from './MotionPanel';
import SlidePlayer from './SlidePlayer';
import ImageEditor from './ImageEditor';
import { LayoutTemplate, Images, Wand2 } from 'lucide-react';

interface Props {
  initialDeck: EditorDeck;
}

type LeftTab = 'layout' | 'reference' | 'motion';

const MIN_PANEL = 220;
const MAX_PANEL = 460;

export default function PresentEditor({ initialDeck }: Props) {
  const ed = useEditor(initialDeck);
  const [tab, setTab] = useState<LeftTab>('layout');
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelW, setPanelW] = useState(288); // rộng cột trái (kéo dãn)
  const [busy, setBusy] = useState<string | null>(null);
  const [libAssets, setLibAssets] = useState<GuAsset[]>([]);
  const [libLoading, setLibLoading] = useState(true);
  const [gu, setGu] = useState<GuProfile | null>(null);
  const [imageEditId, setImageEditId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  // bảng hỏi số liệu (áp vào bố cục sinh ra).
  const [spec, setSpec] = useState<LayoutSpec>(DEFAULT_SPEC);
  // ảnh reference LOCAL (phiên editor) — bổ sung cho server khi chưa đăng nhập.
  const [localRefs, setLocalRefs] = useState<RefImage[]>([]);

  // Nạp thư viện Reference (layout/slide templates + gu). Không chặn UI nếu lỗi/empty.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/library');
        if (!r.ok) {
          if (alive) setLibLoading(false);
          return;
        }
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
          mine: Boolean(a.mine),
        })) as (GuAsset & { mine?: boolean })[];
        if (!alive) return;
        setLibAssets(assets);
        setGu(buildGuProfile(assets));
      } catch {
        /* thư viện trống hoặc chưa đăng nhập — dùng builtin + reference local */
      } finally {
        if (alive) setLibLoading(false);
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

  // Reference gộp: server (mọi asset dùng làm ảnh tham khảo) + local.
  const refImages: RefImage[] = useMemo(() => {
    const server: RefImage[] = libAssets.map((a) => ({
      id: a.id,
      name: a.name,
      url: a.url,
      tags: a.tags,
      source: 'server' as const,
      mine: (a as GuAsset & { mine?: boolean }).mine,
    }));
    return [...localRefs, ...server];
  }, [libAssets, localRefs]);

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

  // Element ảnh đang chỉnh (nếu overlay mở). Tự đóng nếu không còn tồn tại.
  const imageEditEl = useMemo(() => {
    if (!imageEditId) return null;
    const el = ed.slide?.elements.find((e) => e.id === imageEditId);
    return el && el.kind === 'image' ? (el as ImageElement) : null;
  }, [imageEditId, ed.slide]);
  useEffect(() => {
    if (imageEditId && !imageEditEl) setImageEditId(null);
  }, [imageEditId, imageEditEl]);

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

  // Kéo NHÓM: chụp frame lúc bắt đầu (ref) rồi cộng delta cho mọi phần tử chọn.
  const groupStartRef = useRef<Record<string, Frame> | null>(null);
  const groupLastDelta = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const onFrameMany = useCallback(
    (dxPct: number, dyPct: number, live: boolean) => {
      const s = ed.slide;
      if (!s) return;
      if (!groupStartRef.current) {
        const snap: Record<string, Frame> = {};
        for (const id of ed.selectedIds) {
          const el = s.elements.find((e) => e.id === id);
          if (el && !el.locked) snap[id] = { ...el.frame };
        }
        groupStartRef.current = snap;
      }
      const dx = !live && dxPct === 0 && dyPct === 0 ? groupLastDelta.current.dx : dxPct;
      const dy = !live && dxPct === 0 && dyPct === 0 ? groupLastDelta.current.dy : dyPct;
      if (live) groupLastDelta.current = { dx, dy };
      const start = groupStartRef.current;
      ed.updateSlide((sl) => {
        for (const el of sl.elements) {
          const base = start[el.id];
          if (!base) continue;
          el.frame = { ...base, x: clampPct(base.x + dx), y: clampPct(base.y + dy) };
        }
      }, live);
      if (!live) {
        groupStartRef.current = null;
        groupLastDelta.current = { dx: 0, dy: 0 };
      }
    },
    [ed],
  );

  const onAltDrag = useCallback(
    (id: string) => {
      const el = ed.slide?.elements.find((e) => e.id === id);
      if (!el) return;
      const copy = duplicateElement(el, false);
      ed.updateSlide((s) => {
        s.elements.push(copy);
      });
      ed.select(copy.id);
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

  // Cập nhật 1 text element cụ thể (cho thanh chữ nổi TextToolbar).
  const onUpdateText = useCallback(
    (id: string, mutate: (el: import('@/lib/present-editor/model').TextElement) => void, live?: boolean) => {
      ed.updateSlide((s) => {
        const el = s.elements.find((e) => e.id === id);
        if (el && el.kind === 'text') mutate(el);
      }, live);
    },
    [ed],
  );

  // Cập nhật 1 shape cụ thể (cho bảng chỉnh shape khi chuột phải).
  const onUpdateShape = useCallback(
    (id: string, mutate: (el: import('@/lib/present-editor/model').ShapeElement) => void, live?: boolean) => {
      ed.updateSlide((s) => {
        const el = s.elements.find((e) => e.id === id);
        if (el && el.kind === 'shape') mutate(el);
      }, live);
    },
    [ed],
  );

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
        else s.elements.splice(Math.max(i - 1, 0), 0, el);
      });
    },
    [ed],
  );

  // Reorder z bằng kéo trong ô quản lý layer: chuyển element từ chỉ số from → to (mảng gốc).
  const onReorderElement = useCallback(
    (from: number, to: number) => {
      ed.updateSlide((s) => {
        if (from < 0 || from >= s.elements.length || to < 0 || to >= s.elements.length) return;
        const [el] = s.elements.splice(from, 1);
        s.elements.splice(to, 0, el);
      });
    },
    [ed],
  );

  const onDeleteSelected = useCallback(() => {
    if (!ed.selectedIds.length) return;
    const ids = new Set(ed.selectedIds);
    ed.updateSlide((s) => {
      s.elements = s.elements.filter((e) => !ids.has(e.id));
    });
    ed.select(null);
  }, [ed]);

  const onDuplicateSelected = useCallback(() => {
    if (!ed.selectedIds.length) return;
    const originals = (ed.slide?.elements ?? []).filter((e) => ed.selectedIds.includes(e.id));
    if (!originals.length) return;
    const copies = originals.map((e) => duplicateElement(e));
    ed.updateSlide((s) => {
      s.elements.push(...copies);
    });
    ed.selectMany(copies.map((c) => c.id));
  }, [ed]);

  const clipboardRef = useRef<SlideElement[] | null>(null);
  const onCopySelected = useCallback(() => {
    const sel = (ed.slide?.elements ?? []).filter((e) => ed.selectedIds.includes(e.id));
    if (sel.length) clipboardRef.current = JSON.parse(JSON.stringify(sel));
  }, [ed]);

  const onPaste = useCallback(() => {
    if (!clipboardRef.current?.length) return;
    const copies = clipboardRef.current.map((e) => duplicateElement(e));
    ed.updateSlide((s) => {
      s.elements.push(...copies);
    });
    ed.selectMany(copies.map((c) => c.id));
  }, [ed]);

  const onSelectNext = useCallback(
    (dir: 1 | -1) => {
      const els = ed.slide?.elements ?? [];
      if (!els.length) return;
      const cur = els.findIndex((e) => e.id === ed.selectedId);
      const next = ((cur < 0 ? 0 : cur + dir) + els.length) % els.length;
      ed.select(els[next].id);
    },
    [ed],
  );

  const onNudge = useCallback(
    (dx: number, dy: number) => {
      if (!ed.selectedIds.length) return;
      const ids = new Set(ed.selectedIds);
      ed.updateSlide((s) => {
        for (const el of s.elements) {
          if (!ids.has(el.id) || el.locked) continue;
          el.frame = { ...el.frame, x: clampPct(el.frame.x + dx), y: clampPct(el.frame.y + dy) };
        }
      });
    },
    [ed],
  );

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
      // build từ template rồi ÁP BẢNG HỎI SỐ LIỆU (spec) → điểm xuất phát khớp yêu cầu.
      const built = applySpecToSlide(t.build(ctx), spec, ctx.palette ?? palette);
      ed.updateSlide((slide) => {
        slide.background = built.background;
        slide.backgroundImage = built.backgroundImage ?? null;
        slide.backgroundAdjust = built.backgroundAdjust;
        slide.elements = built.elements;
        slide.templateId = built.templateId;
      });
      ed.select(null);
    },
    [ed, gu, palette, spec],
  );

  // Nhận kết quả từ flow Generate: nạp palette gu từ ảnh reference vào deck + đưa ảnh
  // nội dung vừa import vào rổ Reference (để kéo vào slide). Human-in-loop: chỉ điểm xuất phát.
  const onGenerated = useCallback(
    (r: import('./GenerateFlow').GenerateResult) => {
      const pal = r.rules?.palette?.length ? r.rules.palette : ed.deck.palette;
      if (r.rules?.palette?.length) {
        ed.update((d) => {
          d.palette = r.rules!.palette;
        });
      }
      // Ảnh nội dung → rổ Reference (để kéo tay thêm nếu muốn).
      if (r.contentImages.length) {
        const items: RefImage[] = r.contentImages.map((url, i) => ({
          id: newId('ref'),
          name: `Ảnh nội dung ${i + 1}`,
          url,
          tags: 'nội-dung',
          source: 'local',
          mine: true,
        }));
        setLocalRefs((prev) => [...items, ...prev]);
      }
      // MỚI: có nội dung text → DÀN SLIDE tự động (cover + quote + content).
      // KHÔNG âm thầm xoá việc user đang dàn: nếu deck đã có slide → HỎI Thay / Nối cuối.
      if (r.bodyText.trim()) {
        const built = slidesFromContent(r.bodyText, r.contentImages, pal, ed.deck.fonts);
        if (built.length) {
          const startIdx = ed.deck.slides.length;
          const replace =
            startIdx === 0 ||
            window.confirm(
              `Dàn ${built.length} slide từ nội dung.\n\nOK = THAY toàn bộ slide hiện có.\nHuỷ = NỐI vào cuối (giữ slide cũ).`,
            );
          ed.update((d) => {
            d.slides = replace ? built : [...d.slides, ...built];
          });
          ed.selectSlide(replace ? 0 : startIdx);
        }
      }
    },
    [ed],
  );

  // Tạo trang nội dung TRẮNG để tự dàn (human-in-loop từ số 0 khi muốn).
  const onCreateBlank = useCallback(() => {
    ed.updateSlide((slide) => {
      slide.background = spec.background === 'color' ? slide.background : slide.background;
      slide.backgroundImage = null;
      slide.backgroundAdjust = undefined;
      slide.elements = [
        makeText({
          text: 'Tiêu đề',
          role: 'title',
          frame: { x: 8, y: 10, w: 60, h: 12, rotation: 0 },
          fontSize: 6,
          color: pickInk(palette),
          bold: true,
        }),
      ];
      slide.templateId = 'blank';
    });
    ed.select(null);
  }, [ed, palette, spec.background]);

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

  /* ------------------------- Reference (ảnh tham khảo) ------------------------- */
  const onUploadLocalRefs = useCallback((files: { name: string; dataUrl: string }[], tags: string) => {
    const items: RefImage[] = files.map((f) => ({
      id: newId('ref'),
      name: f.name,
      url: f.dataUrl,
      tags,
      source: 'local',
      mine: true,
    }));
    setLocalRefs((prev) => [...items, ...prev]);
  }, []);

  const onDeleteRef = useCallback(async (img: RefImage) => {
    if (img.source === 'local') {
      setLocalRefs((prev) => prev.filter((r) => r.id !== img.id));
      return;
    }
    // server: gọi DELETE rồi gỡ khỏi state (chỉ ảnh mình upload mới hiện nút xoá).
    try {
      await fetch(`/api/library/${img.id}`, { method: 'DELETE' });
    } catch {
      /* nếu lỗi mạng vẫn gỡ khỏi UI cho gọn; refresh sẽ đồng bộ lại */
    }
    setLibAssets((prev) => prev.filter((a) => a.id !== img.id));
  }, []);

  // Đưa ảnh reference vào slide đang dàn (thêm image element cỡ vừa, giữa).
  const onUseRef = useCallback(
    (url: string) => {
      addElement(makeImage(url, { frame: centered(40, 45) }));
    },
    [addElement],
  );

  /* ------------------------- Motion ------------------------- */
  const onSetSlideTransition = useCallback(
    (t: SlideTransition) => ed.updateSlide((s) => (s.transition = t)),
    [ed],
  );
  const onSetSlideReveal = useCallback(
    (r: ElementReveal) => ed.updateSlide((s) => (s.reveal = r)),
    [ed],
  );
  const onApplyDeckMotion = useCallback(
    (t: SlideTransition, r: ElementReveal) => {
      ed.update((d) => {
        d.transition = t;
        d.reveal = r;
        for (const s of d.slides) {
          s.transition = t;
          s.reveal = r;
        }
      });
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

  const onExportPng = useCallback(async () => {
    setBusy('png');
    try {
      await exportDeckToPng(ed.deck);
    } catch (err) {
      console.error('[PresentEditor] PNG export failed', err);
    } finally {
      setBusy(null);
    }
  }, [ed.deck]);

  /* ------------------------- splitter kéo dãn panel trái ------------------------- */
  const dragStart = useRef<{ x: number; w: number } | null>(null);
  const onSplitDown = useCallback(
    (e: React.PointerEvent) => {
      dragStart.current = { x: e.clientX, w: panelW };
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [panelW],
  );
  const onSplitMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const next = dragStart.current.w + (e.clientX - dragStart.current.x);
    setPanelW(Math.max(MIN_PANEL, Math.min(MAX_PANEL, next)));
  }, []);
  const onSplitUp = useCallback((e: React.PointerEvent) => {
    dragStart.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  /* ----------------------- phím tắt (cấp document) ----------------------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = isTypingTarget(document.activeElement);
      if (e.key === 'Escape') {
        if (!typing) ed.select(null);
        return;
      }
      if (typing) return;
      if (imageEditId || playing) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const ids = (ed.slide?.elements ?? []).filter((el) => !el.locked).map((el) => el.id);
        if (ids.length) ed.selectMany(ids);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        onSelectNext(e.shiftKey ? -1 : 1);
        return;
      }
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
      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        onDuplicateSelected();
        return;
      }
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
      if ((e.key === 'Delete' || e.key === 'Backspace') && ed.selectedIds.length) {
        e.preventDefault();
        onDeleteSelected();
        return;
      }
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
  }, [ed, onDuplicateSelected, onCopySelected, onPaste, onDeleteSelected, onNudge, onSelectNext, imageEditId, playing]);

  // Mở /photo-editor (Photoshop-level) ở tab mới — hậu kỳ ảnh nâng cao.
  const openAdvancedEditor = useCallback(() => {
    if (typeof window !== 'undefined') window.open('/photo-editor', '_blank');
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', color: 'var(--t1)' }}>
      <Toolbar
        onAddText={onAddText}
        onAddImageUrl={onAddImageUrl}
        onAddShape={onAddShape}
        onToggleTemplates={() => setPanelOpen((v) => !v)}
        templatesOpen={panelOpen}
        onUndo={ed.undo}
        onRedo={ed.redo}
        canUndo={ed.canUndo}
        canRedo={ed.canRedo}
        onExportPdf={onExportPdf}
        onExportPptx={onExportPptx}
        onExportPng={onExportPng}
        onPlay={() => setPlaying(true)}
        busy={busy}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* trái: panel 3 tab (kéo dãn) */}
        {panelOpen && (
          <>
            <aside
              style={{
                width: panelW,
                flex: `0 0 ${panelW}px`,
                borderRight: '1px solid var(--border)',
                background: 'var(--panel)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              {/* tab head */}
              <div style={{ display: 'flex', gap: 4, padding: '10px 12px 0' }}>
                <TabBtn active={tab === 'layout'} onClick={() => setTab('layout')} icon={<LayoutTemplate size={13} />}>
                  Mẫu
                </TabBtn>
                <TabBtn active={tab === 'reference'} onClick={() => setTab('reference')} icon={<Images size={13} />}>
                  Reference
                </TabBtn>
                <TabBtn active={tab === 'motion'} onClick={() => setTab('motion')} icon={<Wand2 size={13} />}>
                  Motion
                </TabBtn>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12 }}>
                {tab === 'layout' && (
                  <LayoutShelf
                    templates={templates}
                    suggestedId={suggestion?.templateId ?? null}
                    suggestReason={suggestion?.reason ?? null}
                    onApply={onApplyTemplate}
                    onCreateBlank={onCreateBlank}
                    palette={palette}
                    fonts={ed.deck.fonts}
                    spec={spec}
                    onSpecChange={setSpec}
                    refImages={refImages}
                    onGenerated={onGenerated}
                  />
                )}
                {tab === 'reference' && (
                  <LibraryBrowser
                    images={refImages}
                    loading={libLoading}
                    onUseImage={onUseRef}
                    onDelete={onDeleteRef}
                    onUploadLocal={onUploadLocalRefs}
                  />
                )}
                {tab === 'motion' && ed.slide && (
                  <MotionPanel
                    slide={ed.slide}
                    deck={ed.deck}
                    onSetSlideTransition={onSetSlideTransition}
                    onSetSlideReveal={onSetSlideReveal}
                    onApplyDeck={onApplyDeckMotion}
                    onPlay={() => setPlaying(true)}
                  />
                )}
              </div>
            </aside>

            {/* splitter kéo dãn */}
            <div
              className="pe-splitter"
              onPointerDown={onSplitDown}
              onPointerMove={onSplitMove}
              onPointerUp={onSplitUp}
              title="Kéo để đổi rộng cột"
              style={{
                width: 6,
                flex: '0 0 6px',
                cursor: 'col-resize',
                background: 'transparent',
                marginLeft: -3,
                zIndex: 5,
              }}
            />
          </>
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
          {ed.slide ? (
            <EditorCanvas
              slide={ed.slide}
              fonts={ed.deck.fonts}
              selectedIds={ed.selectedIds}
              onSelect={ed.select}
              onToggleSelect={ed.toggleSelect}
              onSelectMany={ed.selectMany}
              onFrame={onFrame}
              onFrameMany={onFrameMany}
              onAltDrag={onAltDrag}
              onEditTextCommit={onEditTextCommit}
              onEditImage={(id) => setImageEditId(id)}
              onEditImageAdvanced={openAdvancedEditor}
              onDropRefImage={onAddImageUrl}
              onDuplicate={onDuplicateSelected}
              onDelete={onDeleteSelected}
              onZOrder={onZOrder}
              onToggleLock={() => ed.updateSelected((el) => (el.locked = !el.locked))}
              onUpdateText={onUpdateText}
              onUpdateShape={onUpdateShape}
              brand={ed.deck.brand}
              project={ed.deck.project}
            />
          ) : (
            // Chưa có trang nào (deck rỗng) — KHÔNG để trống void, mời tạo trang trắng.
            <div style={{ textAlign: 'center', color: 'var(--t4)', maxWidth: 340 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--t2)', marginBottom: 6 }}>
                Chưa có trang nào
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                Bắt đầu bằng 1 trang trắng, hoặc chọn <b>Mẫu</b> ở cột trái để dàn nhanh.
              </p>
              <button
                onClick={onAddSlide}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: 'var(--accent-strong)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                + Thêm trang trắng
              </button>
            </div>
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
              onOpenImageEditor={(id) => setImageEditId(id)}
              onOpenAdvancedEditor={openAdvancedEditor}
              selectedIds={ed.selectedIds}
              onSelect={ed.select}
              onReorderElement={onReorderElement}
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

      {/* Chế độ chỉnh ảnh (nhấp đúp / chuột phải ảnh) — overlay toàn màn. */}
      {imageEditId && imageEditEl && (
        <ImageEditor
          el={imageEditEl}
          libAssets={libAssets}
          onUpdate={(mutate, live) =>
            ed.updateSlide((s) => {
              const el = s.elements.find((e) => e.id === imageEditId);
              if (el && el.kind === 'image') mutate(el);
            }, live)
          }
          onOpenAdvanced={openAdvancedEditor}
          onClose={() => setImageEditId(null)}
        />
      )}

      {/* Trình chiếu với hiệu ứng động. */}
      {playing && <SlidePlayer deck={ed.deck} startIndex={ed.currentSlide} onClose={() => setPlaying(false)} />}
    </div>
  );
}

/* -------- tiện ích -------- */
function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '7px 4px',
        borderRadius: '8px 8px 0 0',
        border: active ? '1px solid var(--border)' : '1px solid transparent',
        borderBottom: active ? '1px solid var(--panel)' : '1px solid var(--border)',
        marginBottom: -1,
        background: active ? 'var(--card)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--t3)',
        fontSize: 11.5,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function centered(w: number, h: number): Frame {
  return { x: (100 - w) / 2, y: (100 - h) / 2, w, h, rotation: 0 };
}
function clampPct(v: number): number {
  return Math.max(-5, Math.min(v, 105));
}
function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
}
function pickInk(palette: string[]): string {
  const valid = (palette || []).filter((c) => /^#[0-9a-fA-F]{6}$/.test(c));
  if (!valid.length) return '#221f1a';
  return valid.slice().sort((a, b) => lum(a) - lum(b))[0];
}
function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}
