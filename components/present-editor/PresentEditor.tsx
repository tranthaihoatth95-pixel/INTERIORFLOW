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
import { evaluateDeck } from '@/lib/present-editor/layout-check';
import { slidesFromReference, detectGridFromUrl } from '@/lib/present-editor/reference-layout';
import type { GridGeometryInput } from '@/lib/present-editor/suggest';
import { consumePresentHandoff } from '@/lib/present-editor/handoff';
import { consumeCadPresentHandoff } from '@/lib/cad/present-handoff';
import {
  stashPhotoEditorIn,
  readPhotoEditorReturn,
  clearPhotoEditorReturn,
  PHOTO_EDITOR_RETURN_KEY,
} from '@/lib/photo-editor/handoff';
import {
  createAssetFromElement,
  attachElementToAsset,
  detachElement,
  setLinkedAssetSrc,
  listLinkedAssets,
} from '@/lib/present-editor/linked-assets';
import Toolbar from './Toolbar';
import EditorCanvas from './EditorCanvas';
import Inspector from './Inspector';
import SlideStrip from './SlideStrip';
import LayoutShelf from './LayoutShelf';
import LibraryBrowser, { type RefImage } from './LibraryBrowser';
import MotionPanel from './MotionPanel';
import SlidePlayer from './SlidePlayer';
import ImageEditor from './ImageEditor';
import BrandKitPanel from './BrandKitPanel';
import { applyBrandKitToDeck, type BrandKit } from '@/lib/present-editor/brand-kit';
import StagePresetPanel from './StagePresetPanel';
import { reflowDeckForStage } from '@/lib/present-editor/reflow';
import { stageFor, type StagePresetId } from '@/lib/present-editor/stage-presets';
import { LayoutTemplate, Images, Wand2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface Props {
  initialDeck: EditorDeck;
  /**
   * (Tuỳ chọn — multi-sheet) Báo deck "sống" ra ngoài mỗi khi đổi. Mặc định undefined =
   * KHÔNG đổi hành vi. Tầng PresentSheets dùng để lưu nội dung sheet trước khi chuyển tab.
   */
  onDeckChange?: (deck: EditorDeck) => void;
}

type LeftTab = 'layout' | 'reference' | 'motion';

const MIN_PANEL = 220;
const MAX_PANEL = 460;
const MIN_INSPECTOR = 180;
const MAX_INSPECTOR = 480;
const LS_PANEL_W = 'pe-panelW';
const LS_INSPECTOR_W = 'pe-inspectorW';
const LS_INSPECTOR_OPEN = 'pe-inspectorOpen';

/* Zoom canvas — tham khảo Figma/Photoshop: zoom=1 = "Fit" (vừa khung, giữ hành vi cũ khi
 * chưa có zoom), Ctrl/Cmd+lăn chuột hoặc nút +/− đổi zoom, Ctrl/Cmd+0 về lại Fit. */
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const STAGE_MAX_W = 1100; // rộng tối đa sân khấu ở zoom 100% (khớp giá trị cũ EditorCanvas).
const STAGE_PAD = 48; // padding ngang của <main> (24px × 2).

export default function PresentEditor({ initialDeck, onDeckChange }: Props) {
  const ed = useEditor(initialDeck);

  // Multi-sheet: đẩy deck hiện tại ra wrapper (nếu có) để lưu khi đổi tab. Phụ-thêm, vô hại
  // khi onDeckChange không truyền.
  useEffect(() => {
    onDeckChange?.(ed.deck);
  }, [ed.deck, onDeckChange]);
  const [tab, setTab] = useState<LeftTab>('layout');
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelW, setPanelW] = useState(288); // rộng cột trái (kéo dãn)
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorW, setInspectorW] = useState(280); // rộng cột phải "LỚP" (kéo dãn)

  // Nạp độ rộng/ẩn-hiện panel đã lưu (localStorage) SAU mount — tránh lệch hydration SSR.
  useEffect(() => {
    try {
      const pw = Number(localStorage.getItem(LS_PANEL_W));
      if (pw && pw >= MIN_PANEL && pw <= MAX_PANEL) setPanelW(pw);
      const iw = Number(localStorage.getItem(LS_INSPECTOR_W));
      if (iw && iw >= MIN_INSPECTOR && iw <= MAX_INSPECTOR) setInspectorW(iw);
      const io = localStorage.getItem(LS_INSPECTOR_OPEN);
      if (io === '0') setInspectorOpen(false);
    } catch {
      /* private mode / SSR — bỏ qua, dùng mặc định */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_PANEL_W, String(panelW));
    } catch {
      /* ignore */
    }
  }, [panelW]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_INSPECTOR_W, String(inspectorW));
    } catch {
      /* ignore */
    }
  }, [inspectorW]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_INSPECTOR_OPEN, inspectorOpen ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [inspectorOpen]);
  const [zoom, setZoom] = useState(1); // 1 = "Fit" (vừa khung hiện có, hành vi mặc định cũ)
  const [fitWidth, setFitWidth] = useState(STAGE_MAX_W);
  const zoomIn = useCallback(
    () => setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))),
    [],
  );
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(z - ZOOM_STEP).toFixed(2)))),
    [],
  );
  const zoomReset = useCallback(() => setZoom(1), []);
  const stageWidth = Math.round(Math.max(160, Math.min(fitWidth, STAGE_MAX_W) * zoom));

  const [busy, setBusy] = useState<string | null>(null);
  // Toast kết quả export (thành công/lỗi) — tự tắt sau vài giây (cùng pattern FlowCanvas.tsx).
  const [exportMsg, setExportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (!exportMsg) return;
    const t = setTimeout(() => setExportMsg(null), exportMsg.ok ? 3000 : 4500);
    return () => clearTimeout(t);
  }, [exportMsg]);
  const [libAssets, setLibAssets] = useState<GuAsset[]>([]);
  const [libLoading, setLibLoading] = useState(true);
  const [gu, setGu] = useState<GuProfile | null>(null);
  const [imageEditId, setImageEditId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  // bảng hỏi số liệu (áp vào bố cục sinh ra).
  const [spec, setSpec] = useState<LayoutSpec>(DEFAULT_SPEC);
  // ảnh reference LOCAL (phiên editor) — bổ sung cho server khi chưa đăng nhập.
  const [localRefs, setLocalRefs] = useState<RefImage[]>([]);
  // Cảnh báo bố cục (chuẩn DECK_STANDARDS) sau khi dàn tự động — không thụ động, đóng được.
  const [layoutWarnings, setLayoutWarnings] = useState<ReturnType<typeof evaluateDeck>>([]);
  // HOOK ML pha 1: hình học lưới của ảnh reference GẦN NHẤT (đính lúc Generate) — nuôi
  // suggestTemplate chọn archetype sát ảnh mẫu. null = suggest theo heuristic cũ.
  const [refGrid, setRefGrid] = useState<GridGeometryInput | null>(null);

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

  // A-4 (bridge Render→Present): consume-ONCE ảnh slide đã render theo user từ chặng Render
  // (stash ở Header khi bấm pill Present). Vào rổ Reference local — human-in-loop kéo vào slide,
  // KHÔNG tự chèn vào deck. Không có handoff ⇒ mảng rỗng ⇒ editor y hệt cũ.
  useEffect(() => {
    const imgs = consumePresentHandoff();
    if (!imgs.length) return;
    const items: RefImage[] = imgs.map((url, i) => ({
      id: newId('ref'),
      name: `Slide từ Render ${i + 1}`,
      url,
      tags: 'render-handoff',
      source: 'local',
      mine: true,
    }));
    setLocalRefs((prev) => [...items, ...prev]);
  }, []);

  // Cầu nối CAD→Present (SONG SONG với A-4 Render→Present ở trên, KHÔNG thay thế): 1 ảnh
  // snapshot bản vẽ CAD hiện tại (stash ở CadEditor.tsx khi bấm "Đưa sang Present") → CHÈN
  // THẲNG vào 1 SLIDE MỚI ở cuối deck — không đè slide/deck có sẵn, giống hệt hành vi người
  // dùng tự upload ảnh vào slide (onAddImageUrl). Consume-once: không có handoff ⇒ noop, editor
  // y hệt cũ.
  useEffect(() => {
    const dataUrl = consumeCadPresentHandoff();
    if (!dataUrl) return;
    const insertAt = ed.deck.slides.length;
    ed.update((d) => {
      // Nền CỐ ĐỊNH beige ấm TTT (KHÔNG kế thừa slide[0] — slide đầu deck mẫu có thể là slide
      // bìa nền TỐI, kế thừa mù sẽ làm chữ tối-trên-tối vô hình). Ink luôn tối vì nền luôn sáng.
      d.slides.push({
        id: newId('sld'),
        background: '#F1ECE3',
        backgroundImage: null,
        elements: [
          makeText({
            text: 'Bản vẽ CAD · CAD Layout',
            role: 'kicker',
            frame: { x: 6, y: 4, w: 70, h: 6, rotation: 0 },
            fontSize: 2.6,
            bold: true,
            color: '#221f1a',
          }),
          makeImage(dataUrl, { frame: { x: 5, y: 12, w: 90, h: 84, rotation: 0 } }),
        ],
        templateId: 'cad-handoff',
      });
    });
    ed.selectSlide(insertAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return suggestTemplate({ title, kicker, body, images, gu, grid: refGrid }, { isFirst: ed.currentSlide === 0 });
  }, [ed.slide, ed.currentSlide, gu, refGrid]);

  // M-1 (perceptron feedback): thống kê nội dung slide hiện tại nuôi feature-dict ở LayoutShelf
  // (#ảnh + độ dài chữ — cùng nguồn với suggestion ở trên, tách gọn để không đổi suggest cũ).
  const contentStats = useMemo(() => {
    const s = ed.slide;
    if (!s) return null;
    const texts = s.elements.filter((e) => e.kind === 'text') as Extract<SlideElement, { kind: 'text' }>[];
    const textLen = texts.reduce((sum, t) => sum + (t.text?.length ?? 0), 0);
    const nImages =
      s.elements.filter((e) => e.kind === 'image').length + (s.backgroundImage ? 1 : 0);
    return { nImages, textLen };
  }, [ed.slide]);

  const palette = ed.deck.palette;
  // Khổ trình bày đang chọn (PS-4) — mặc định 16:9, đọc 1 nguồn duy nhất (stage-presets.ts).
  const stage = useMemo(() => stageFor(ed.deck.stagePreset), [ed.deck.stagePreset]);

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

  /** vùng "còn liên quan tới selection" — canvas (stage + toolbar nổi) và Inspector (phải).
   * Click ngoài CẢ HAI (vd sidebar Mẫu/Reference/Motion bên trái, header) = bỏ chọn. */
  const canvasAreaRef = useRef<HTMLElement | null>(null);
  const inspectorRef = useRef<HTMLElement | null>(null);

  /* Đo bề rộng khả dụng của <main> (canvas area) để tính "Fit" (zoom=1) — cập nhật khi resize
   * cửa sổ HOẶC khi panel trái/phải kéo dãn/ẩn-hiện (canvas area đổi kích thước). */
  useEffect(() => {
    const node = canvasAreaRef.current;
    if (!node) return;
    function recompute() {
      if (!node) return;
      setFitWidth(Math.max(160, node.clientWidth - STAGE_PAD));
    }
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(node);
    return () => ro.disconnect();
  }, [panelOpen, inspectorOpen]);

  /* Ctrl/Cmd + lăn chuột = zoom canvas (chuẩn Photoshop/Canva/Figma). Lăn chuột THƯỜNG (không
   * giữ Ctrl/Cmd) giữ nguyên hành vi cuộn cũ. Gắn listener NATIVE (không dùng onWheel của React)
   * để preventDefault thật sự chặn được zoom trang của trình duyệt — React 17+ đăng ký wheel
   * handler ở chế độ passive nên preventDefault bên trong onWheel JSX sẽ KHÔNG có tác dụng. */
  useEffect(() => {
    const node = canvasAreaRef.current;
    if (!node) return;
    function onWheelNative(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(z + dir * ZOOM_STEP).toFixed(2))));
    }
    node.addEventListener('wheel', onWheelNative, { passive: false });
    return () => node.removeEventListener('wheel', onWheelNative);
  }, []);
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
    async (r: import('./GenerateFlow').GenerateResult) => {
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
      // HOOK ML pha 1: ảnh reference đính kèm → rút hình học lưới (gutter + ô) cho suggest.
      // Chạy nền, lỗi/nghèo lưới → giữ null (suggest heuristic cũ). Không chặn dàn slide.
      if (r.attachRefs?.length) {
        detectGridFromUrl(r.attachRefs[0]).then((g) => setRefGrid(g)).catch(() => {});
      }
      // MỚI: có nội dung text → DÀN SLIDE tự động (cover + quote + content).
      // Ưu tiên: có ảnh reference → dàn theo LƯỚI ảnh (region-layout); nếu không ra
      // được thì FALLBACK về template. KHÔNG âm thầm xoá: deck đã có slide → HỎI Thay/Nối.
      if (r.bodyText.trim()) {
        let built = r.attachRefs?.length
          ? await slidesFromReference(r.attachRefs[0], r.bodyText, r.contentImages, pal, ed.deck.fonts).catch(() => [])
          : [];
        if (!built.length) built = slidesFromContent(r.bodyText, r.contentImages, pal, ed.deck.fonts);
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
          // Chấm bố cục theo chuẩn → nổi cảnh báo "trống/chật/chữ tràn" (human-in-loop).
          setLayoutWarnings(evaluateDeck(built));
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
      setExportMsg({ ok: true, text: 'Đã xuất PDF xong.' });
    } catch (err) {
      console.error('[PresentEditor] PDF export failed', err);
      setExportMsg({ ok: false, text: 'Xuất PDF lỗi — thử lại.' });
    } finally {
      setBusy(null);
    }
  }, [ed.deck]);

  const onExportPptx = useCallback(async () => {
    setBusy('pptx');
    try {
      await exportDeckToPptxFromModel(ed.deck);
      setExportMsg({ ok: true, text: 'Đã xuất PowerPoint xong.' });
    } catch (err) {
      console.error('[PresentEditor] PPTX export failed', err);
      setExportMsg({ ok: false, text: 'Xuất PowerPoint lỗi — thử lại.' });
    } finally {
      setBusy(null);
    }
  }, [ed.deck]);

  const onExportPng = useCallback(async () => {
    setBusy('png');
    try {
      await exportDeckToPng(ed.deck);
      setExportMsg({ ok: true, text: 'Đã xuất ảnh PNG xong.' });
    } catch (err) {
      console.error('[PresentEditor] PNG export failed', err);
      setExportMsg({ ok: false, text: 'Xuất PNG lỗi — thử lại.' });
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

  /* ------------------------- splitter kéo dãn panel phải (Lớp) ------------------------- */
  const dragStartR = useRef<{ x: number; w: number } | null>(null);
  const onSplitDownR = useCallback(
    (e: React.PointerEvent) => {
      dragStartR.current = { x: e.clientX, w: inspectorW };
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [inspectorW],
  );
  const onSplitMoveR = useCallback((e: React.PointerEvent) => {
    if (!dragStartR.current) return;
    // panel phải: kéo splitter sang TRÁI mới tăng rộng (ngược hướng so panel trái).
    const next = dragStartR.current.w - (e.clientX - dragStartR.current.x);
    setInspectorW(Math.max(MIN_INSPECTOR, Math.min(MAX_INSPECTOR, next)));
  }, []);
  const onSplitUpR = useCallback((e: React.PointerEvent) => {
    dragStartR.current = null;
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
      // zoom canvas: Ctrl/Cmd + '=' (phím '+' không Shift) / '-' / '0' (về Fit) — chuẩn Figma/PS.
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
        return;
      }
      if (mod && e.key === '-') {
        e.preventDefault();
        zoomOut();
        return;
      }
      if (mod && e.key === '0') {
        e.preventDefault();
        zoomReset();
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
  }, [
    ed,
    onDuplicateSelected,
    onCopySelected,
    onPaste,
    onDeleteSelected,
    onNudge,
    onSelectNext,
    imageEditId,
    playing,
    zoomIn,
    zoomOut,
    zoomReset,
  ]);

  /* ------- click ra ngoài canvas/Inspector = bỏ chọn (góp ý ảnh qab3/wzvd) -------
   * Chỉ dispatch bỏ chọn (passive) — KHÔNG preventDefault/stopPropagation, để mọi click
   * khác (menu export, đổi tab trái, nút trong sidebar...) vẫn hoạt động bình thường. */
  useEffect(() => {
    function onPointerDownCapture(e: PointerEvent) {
      if (!ed.selectedIds.length) return;
      const target = e.target as Node | null;
      if (!target) return;
      const inCanvas = !!canvasAreaRef.current?.contains(target);
      const inInspector = !!inspectorRef.current?.contains(target);
      // splitter/nút ẩn-hiện panel không phải "click ra ngoài" (tránh mất chọn khi kéo dãn).
      const onChrome = (target as HTMLElement).closest?.('.pe-splitter, .pe-panel-toggle');
      if (!inCanvas && !inInspector && !onChrome) ed.select(null);
    }
    window.addEventListener('pointerdown', onPointerDownCapture);
    return () => window.removeEventListener('pointerdown', onPointerDownCapture);
  }, [ed]);

  // Mở /photo-editor (Photoshop-level) ở tab mới — hậu kỳ ảnh nâng cao (PS-3, round-trip).
  // Stash NGAY TRƯỚC window.open (sessionStorage được tab mới clone tại đúng lúc mở — xem
  // lib/photo-editor/handoff.ts) rồi mở tab; /photo-editor tự consume để seed đúng ảnh.
  const openAdvancedEditor = useCallback(
    (elementId: string) => {
      const el = ed.slide?.elements.find((e) => e.id === elementId);
      if (el && el.kind === 'image' && ed.slide) {
        stashPhotoEditorIn(el.src, { slideId: ed.slide.id, elementId, assetId: el.assetId });
      }
      if (typeof window !== 'undefined') window.open('/photo-editor', '_blank');
    },
    [ed.slide],
  );

  // PS-3 — CHIỀU VỀ: /photo-editor (tab khác) ghi ảnh đã edit vào localStorage
  // (writePhotoEditorReturn); ở đây lắng nghe sự kiện `storage` (bắn tự động khi TAB KHÁC
  // đổi giá trị) + kiểm lại khi tab này focus lại (phòng khi bỏ lỡ sự kiện lúc ẩn). Consume-once:
  // áp xong dọn ngay (clearPhotoEditorReturn) + chặn double-apply bằng mốc thời gian đã áp.
  const lastAppliedReturnTs = useRef(0);
  useEffect(() => {
    function applyPendingReturn() {
      const ret = readPhotoEditorReturn();
      if (!ret || ret.ts <= lastAppliedReturnTs.current) return;
      lastAppliedReturnTs.current = ret.ts;
      const { dataUrl, target } = ret;
      ed.update((d) => {
        if (target.assetId) {
          const next = setLinkedAssetSrc(d, target.assetId, dataUrl);
          d.linkedAssets = next.linkedAssets;
          d.slides = next.slides;
          return;
        }
        const slide = d.slides.find((s) => s.id === target.slideId);
        const el = slide?.elements.find((e) => e.id === target.elementId);
        if (el && el.kind === 'image') {
          el.src = dataUrl;
          el.crop = { x: 0, y: 0, w: 1, h: 1 }; // ảnh mới (đã composite) — crop cũ hết ý nghĩa
        }
      });
      clearPhotoEditorReturn();
    }
    applyPendingReturn(); // phòng ảnh đã ghi về trong lúc tab này chưa mount / đang tải
    function onStorage(e: StorageEvent) {
      if (e.key === PHOTO_EDITOR_RETURN_KEY) applyPendingReturn();
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', applyPendingReturn);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', applyPendingReturn);
    };
  }, [ed]);

  // Tài sản liên kết (PS-3) — panel Inspector chọn/gắn/gỡ; chỉnh nguồn thật xảy ra ở
  // applyPendingReturn (ghi về từ /photo-editor) qua setLinkedAssetSrc.
  const linkedAssets = useMemo(() => listLinkedAssets(ed.deck), [ed.deck]);
  const onCreateAsset = useCallback(() => {
    if (!ed.slide || !ed.selected || ed.selected.kind !== 'image') return;
    const slideId = ed.slide.id;
    const elementId = ed.selected.id;
    ed.update((d) => {
      const next = createAssetFromElement(d, slideId, elementId);
      d.linkedAssets = next.linkedAssets;
      d.slides = next.slides;
    });
  }, [ed]);
  const onAttachAsset = useCallback(
    (assetId: string) => {
      if (!ed.slide || !ed.selected || ed.selected.kind !== 'image') return;
      const slideId = ed.slide.id;
      const elementId = ed.selected.id;
      ed.update((d) => {
        const next = attachElementToAsset(d, slideId, elementId, assetId);
        d.slides = next.slides;
      });
    },
    [ed],
  );
  const onDetachAsset = useCallback(() => {
    if (!ed.slide || !ed.selected || ed.selected.kind !== 'image') return;
    const slideId = ed.slide.id;
    const elementId = ed.selected.id;
    ed.update((d) => {
      const next = detachElement(d, slideId, elementId);
      d.slides = next.slides;
    });
  }, [ed]);

  // Brand Kit (PS-1): mở panel Nhận diện + áp lại theme cho cả deck.
  const [brandKitOpen, setBrandKitOpen] = useState(false);
  const onApplyBrandKit = useCallback(
    (kit: BrandKit, watermarkEnabled: boolean) => {
      ed.update((d) => {
        const next = applyBrandKitToDeck(d, kit);
        d.palette = next.palette;
        d.fonts = next.fonts;
        d.slides = next.slides;
        // cờ bật/tắt watermark do panel quyết định (kit có logo mới hiện được).
        if (next.watermark) d.watermark = { ...next.watermark, enabled: watermarkEnabled && !!kit.logo };
        else if (d.watermark) d.watermark = { ...d.watermark, enabled: false };
      });
      // Chấm lại bố cục sau khi nhuộm (màu đổi có thể ảnh hưởng tương phản chữ).
      setLayoutWarnings(evaluateDeck(ed.deck.slides));
      setBrandKitOpen(false);
    },
    [ed],
  );

  // Khổ trình bày (PS-4): mở panel + đổi khổ → DÀN LẠI (reflow) toàn deck cho khổ mới.
  const [stagePresetOpen, setStagePresetOpen] = useState(false);
  const onApplyStagePreset = useCallback(
    (id: StagePresetId) => {
      ed.update((d) => {
        const next = reflowDeckForStage(d, id);
        d.stagePreset = next.stagePreset;
        d.slides = next.slides;
      });
      setStagePresetOpen(false);
    },
    [ed],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', color: 'var(--t1)' }}>
      {layoutWarnings.length > 0 && (
        <div
          style={{
            position: 'fixed', bottom: 16, right: 16, zIndex: 60, width: 320, maxHeight: 260, overflowY: 'auto',
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,.35)', fontSize: 11.5, lineHeight: 1.45,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <strong style={{ fontSize: 12, color: 'var(--t1)' }}>
              Bố cục: {layoutWarnings.length} slide cần chú ý
            </strong>
            <button
              type="button"
              onClick={() => setLayoutWarnings([])}
              title="Đóng"
              style={{ border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--t2)' }}>
            {layoutWarnings.slice(0, 8).map(({ slide, report }) => (
              <li key={slide} style={{ marginBottom: 4 }}>
                <b>Slide {slide}:</b> {report.warnings[0].message}
                {report.warnings.length > 1 ? ` (+${report.warnings.length - 1})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
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
        onBrandKit={() => setBrandKitOpen(true)}
        onStagePreset={() => setStagePresetOpen(true)}
        stageLabel={stage.label}
        busy={busy}
        exportMsg={exportMsg}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* trái: panel 3 tab (kéo dãn + ẩn/hiện — tham khảo Photoshop dock/Canva sidebar) */}
        {panelOpen ? (
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
                    gu={gu}
                    refGrid={refGrid}
                    content={contentStats}
                    activeSlide={ed.slide ?? null}
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

            {/* splitter kéo dãn + nút ẩn panel (mép trong, kiểu Canva "double-click divider") */}
            <div
              className="pe-splitter"
              onPointerDown={onSplitDown}
              onPointerMove={onSplitMove}
              onPointerUp={onSplitUp}
              onDoubleClick={() => setPanelW(288)}
              title="Kéo để đổi rộng cột · nhấp đúp để về mặc định"
              style={{
                width: 6,
                flex: '0 0 6px',
                cursor: 'col-resize',
                background: 'transparent',
                marginLeft: -3,
                zIndex: 5,
                position: 'relative',
              }}
            >
              <button
                type="button"
                className="pe-panel-toggle"
                onClick={() => setPanelOpen(false)}
                title="Ẩn panel Mẫu/Reference/Motion"
                style={panelToggleBtnStyle}
              >
                <ChevronLeft size={12} />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="pe-panel-toggle"
            onClick={() => setPanelOpen(true)}
            title="Hiện panel Mẫu/Reference/Motion"
            style={panelEdgeStripStyle}
          >
            <ChevronRight size={12} />
          </button>
        )}

        {/* giữa: canvas */}
        <main
          ref={canvasAreaRef}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {ed.slide ? (
            <EditorCanvas
              slide={ed.slide}
              widthPx={stageWidth}
              stage={stage}
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
              watermark={ed.deck.watermark}
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

          {/* zoom canvas — kiểu Photoshop/Figma: -/+ + % + Fit-to-view. */}
          {ed.slide && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 12,
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: 4,
                borderRadius: 999,
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: '0 6px 20px rgba(0,0,0,.2)',
                zIndex: 4,
              }}
            >
              <button type="button" onClick={zoomOut} title="Thu nhỏ (Ctrl/Cmd −)" style={zoomBtnStyle}>
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: 11.5, color: 'var(--t2)', minWidth: 38, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button type="button" onClick={zoomIn} title="Phóng to (Ctrl/Cmd +)" style={zoomBtnStyle}>
                <ZoomIn size={14} />
              </button>
              <span style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />
              <button
                type="button"
                onClick={zoomReset}
                title="Vừa khung / 100% (Ctrl/Cmd 0)"
                style={zoomBtnStyle}
              >
                <Maximize size={13} />
              </button>
            </div>
          )}
        </main>

        {/* phải: inspector "LỚP" (kéo dãn + ẩn/hiện) */}
        {inspectorOpen ? (
          <>
            <div
              className="pe-splitter"
              onPointerDown={onSplitDownR}
              onPointerMove={onSplitMoveR}
              onPointerUp={onSplitUpR}
              onDoubleClick={() => setInspectorW(280)}
              title="Kéo để đổi rộng cột · nhấp đúp để về mặc định"
              style={{
                width: 6,
                flex: '0 0 6px',
                cursor: 'col-resize',
                background: 'transparent',
                marginRight: -3,
                zIndex: 5,
                position: 'relative',
              }}
            >
              <button
                type="button"
                className="pe-panel-toggle"
                onClick={() => setInspectorOpen(false)}
                title="Ẩn panel Lớp"
                style={panelToggleBtnStyle}
              >
                <ChevronRight size={12} />
              </button>
            </div>
            <aside
              ref={inspectorRef}
              style={{
                width: inspectorW,
                flex: `0 0 ${inspectorW}px`,
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
                  linkedAssets={linkedAssets}
                  onCreateAsset={onCreateAsset}
                  onAttachAsset={onAttachAsset}
                  onDetachAsset={onDetachAsset}
                  selectedIds={ed.selectedIds}
                  onSelect={ed.select}
                  onReorderElement={onReorderElement}
                />
              )}
            </aside>
          </>
        ) : (
          <button
            type="button"
            className="pe-panel-toggle"
            onClick={() => setInspectorOpen(true)}
            title="Hiện panel Lớp"
            style={panelEdgeStripStyleR}
          >
            <ChevronLeft size={12} />
          </button>
        )}
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

      {/* Brand Kit — Nhận diện (PS-1): logo · màu · font · watermark + áp lại theme cả deck. */}
      {brandKitOpen && (
        <BrandKitPanel deck={ed.deck} onClose={() => setBrandKitOpen(false)} onApply={onApplyBrandKit} />
      )}

      {/* Khổ trình bày (PS-4): 16:9 · A4/A3 ngang/dọc — đổi khổ tự DÀN LẠI (reflow) cả deck. */}
      {stagePresetOpen && (
        <StagePresetPanel
          current={ed.deck.stagePreset}
          onClose={() => setStagePresetOpen(false)}
          onApply={onApplyStagePreset}
        />
      )}
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

/* Nút ẩn/hiện panel (mép trong splitter) — kiểu Photoshop "collapse to icons" / Canva
 * "double-click divider". Đặt giữa chiều cao splitter, hiện rõ khi hover (.pe-panel-toggle
 * trong globals.css). */
const panelToggleBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 20,
  height: 36,
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--t3)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  zIndex: 6,
};

/* Dải mảnh ở mép ngoài khi panel ĐANG ẨN — bấm để hiện lại (canvas giãn ra chiếm chỗ). */
const panelEdgeStripStyle: React.CSSProperties = {
  flex: '0 0 14px',
  width: 14,
  alignSelf: 'stretch',
  border: 'none',
  borderRight: '1px solid var(--border)',
  background: 'var(--panel)',
  color: 'var(--t3)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
};
const panelEdgeStripStyleR: React.CSSProperties = {
  ...panelEdgeStripStyle,
  borderRight: 'none',
  borderLeft: '1px solid var(--border)',
};

const zoomBtnStyle: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 26,
  height: 26,
  borderRadius: 999,
  border: 'none',
  background: 'transparent',
  color: 'var(--t2)',
  cursor: 'pointer',
};

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
