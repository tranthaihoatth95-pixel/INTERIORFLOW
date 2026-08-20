'use client';

/**
 * components/present-editor/PresentEditor.tsx — Trình dàn trang "Present" (container).
 *
 * Lắp ráp: Toolbar (trên) · [Panel trái RESIZE (Magic | Reference | Motion) | Canvas |
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
import { useT } from '@/lib/i18n';
import { usePlayStatus } from '@/lib/present-editor/play-status';
import type {
  EditorDeck,
  EditorSlide,
  ShapeKind,
  Frame,
  SlideElement,
  ImageElement,
  SlideTransition,
  ElementReveal,
} from '@/lib/present-editor/model';
import { AnimatePresence } from 'framer-motion';
import {
  makeText,
  makeImage,
  makeShape,
  newId,
  duplicateElement,
  duplicateElementsPreservingGroups,
} from '@/lib/present-editor/model';
import type { EmbeddedFont } from '@/lib/present-editor/model';
import { registerFonts } from '@/lib/present-editor/custom-fonts';
import {
  BUILTIN_TEMPLATES,
  templatesFromLibrary,
  type EditorTemplate,
  type TemplateContext,
} from '@/lib/present-editor/templates';
import { suggestTemplate } from '@/lib/present-editor/suggest';
import { DEFAULT_SPEC, applySpecToSlide, type LayoutSpec } from '@/lib/present-editor/spec';
import { classifyWheel } from '@/lib/input/wheel';
import { buildGuProfile, type GuAsset, type GuProfile } from '@/lib/gu';
import { exportDeckToPdf, exportDeckToPptxFromModel, exportDeckToPng, exportDeckToPdfAtPaperSize } from '@/lib/present-editor/export';
import { estimatePrintUpscale, UpscaleCreditError } from '@/lib/present-editor/print-upscale';
import { useFlowStore } from '@/lib/store';
import { useEditor } from './useEditor';
import { slidesFromContent, coverKickerFromDeck } from '@/lib/present-editor/content-deck';
import { evaluateDeck } from '@/lib/present-editor/layout-check';
import { slidesFromReference, detectGridFromUrl } from '@/lib/present-editor/reference-layout';
import type { GridGeometryInput } from '@/lib/present-editor/suggest';
import { consumePresentHandoffWithIds, deckImagesWithIdsFromNodes } from '@/lib/present-editor/handoff';
import { consumeCadPresentHandoff } from '@/lib/cad/present-handoff';
import { consumeSpecPresentHandoff } from '@/lib/present-editor/spec-present-handoff';
import {
  stashPhotoEditorIn,
  readPhotoEditorReturn,
  clearPhotoEditorReturn,
  PHOTO_EDITOR_RETURN_KEY,
} from '@/lib/photo-editor/handoff';
import { stageHrefFrom } from '@/lib/project-scope';
import { useRouter } from 'next/navigation';
// [marker: focusEntity] — đọc `?focusEntity=` từ deep-link Bảng việc (lib/tasks/context.ts sinh).
import { parseFocusEntity } from '@/lib/tasks/focus-entity';
// [marker: magic-phoi-canh] — vòng "Chỉnh phối cảnh" liên chặng (phiếu demo-d2-vong-chinh):
// gieo node ai.regionrender ở chặng 2 + nhận ảnh kết quả về đúng asset.
import { seedPerspectiveEdit } from '@/lib/nodes/magic-perspective';
import {
  findPerspectiveResult,
  appendPerspectiveProvenance,
} from '@/lib/nodes/magic-perspective-core';
import {
  createAssetFromElement,
  attachElementToAsset,
  detachElement,
  setLinkedAssetSrc,
  listLinkedAssets,
} from '@/lib/present-editor/linked-assets';
import Toolbar, { type ToolbarHandle } from './Toolbar';
import EditorCanvas from './EditorCanvas';
import Inspector from './Inspector';
import SlideStrip from './SlideStrip';
import SlideSorter from './SlideSorter';
import { reorderArray } from '@/lib/present-editor/reorder';
import LayoutShelf from './LayoutShelf';
import LibraryBrowser, { type RefImage } from './LibraryBrowser';
import MotionPanel from './MotionPanel';
import SlidePlayer from './SlidePlayer';
import ImageEditor from './ImageEditor';
import BrandKitPanel from './BrandKitPanel';
import { applyBrandKitToDeck, type BrandKit } from '@/lib/present-editor/brand-kit';
import StagePresetPanel from './StagePresetPanel';
import ReplaceImageDialog from './ReplaceImageDialog';
import { reflowDeckForStage } from '@/lib/present-editor/reflow';
import { alignFrames, distributeFrames, type AlignMode as GroupAlignMode, type DistributeAxis } from '@/lib/present-editor/align';
import { groupBoundingBox, scaleGroupByCorner, scaleMemberFrame, type GroupFrame } from '@/lib/present-editor/resize-group';
import { reorderZOrderGroup } from '@/lib/present-editor/zorder-group';
import { stageFor, PAPER_SIZE_MM, type StagePresetId } from '@/lib/present-editor/stage-presets';
import { LayoutTemplate, Images, Wand2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, FileUp, FilePlus2, Sparkles } from 'lucide-react';

interface Props {
  initialDeck: EditorDeck;
  /**
   * (Tuỳ chọn — multi-sheet) Báo deck "sống" ra ngoài mỗi khi đổi. Mặc định undefined =
   * KHÔNG đổi hành vi. Tầng PresentSheets dùng để lưu nội dung sheet trước khi chuyển tab.
   */
  onDeckChange?: (deck: EditorDeck) => void;
  /**
   * (V6/H4, `PresentDocTypePicker`) Tab mở sẵn khi mount. Bỏ trống = 'layout' (hành vi cũ,
   * KHÔNG đổi).
   */
  initialTab?: LeftTab;
  /**
   * (V6/H4) Lối "Tự dàn" từ màn chọn hồ sơ cần vào THẲNG kệ mẫu, KHÔNG qua GenerateFlow (lối
   * đó dành riêng cho "✨ Magic"). Forward xuống `LayoutShelf` làm `initialGenerated`. Bỏ trống
   * = false = hành vi cũ (tab Mẫu luôn mở bằng GenerateFlow trước).
   */
  skipGenerateFlow?: boolean;
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

export default function PresentEditor({ initialDeck, onDeckChange, initialTab, skipGenerateFlow }: Props) {
  const ed = useEditor(initialDeck);

  // Multi-sheet: đẩy deck hiện tại ra wrapper (nếu có) để lưu khi đổi tab. Phụ-thêm, vô hại
  // khi onDeckChange không truyền.
  useEffect(() => {
    onDeckChange?.(ed.deck);
  }, [ed.deck, onDeckChange]);

  /* R7 (19/08) — MỞ CỬA ĐỌC SLIDES cho Bảng kiểm (nợ p3c 08/08 "chờ mở cửa đọc slides").
   * Truth deck vẫn MỘT owner là useEditor ở đây; ReviewPanel (AppShell, mép phải) chỉ ĐỌC qua
   * cầu CustomEvent — đúng pattern `present:*` sẵn có phía trên (idfp/pptx/pdf), KHÔNG store mới.
   *   · `present:deck-review-state`   — đẩy tham chiếu `slides` mỗi khi deck đổi (reducer clone
   *     mỗi mutate nên tham chiếu đã phát ra là bất biến — bên nhận không mutate được truth).
   *   · `present:deck-review-request` — ReviewPanel mở panel sau mới hỏi; trả lời bằng bản mới
   *     nhất qua ref (không re-bind listener theo từng phím gõ).
   *   · unmount → phát `slides: null` (đổi sheet/BOQ/đóng chặng): ReviewPanel về trạng thái
   *     "không có hồ sơ đang mở" thật, không đông cứng bản cũ. */
  const deckForReviewRef = useRef(ed.deck.slides);
  deckForReviewRef.current = ed.deck.slides;
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('present:deck-review-state', { detail: { slides: ed.deck.slides } }));
  }, [ed.deck.slides]);
  useEffect(() => {
    const onRequest = () => {
      window.dispatchEvent(new CustomEvent('present:deck-review-state', { detail: { slides: deckForReviewRef.current } }));
    };
    // Nhảy-tới của thẻ luật deck (ViTri.slide, 1-index từ evaluateDeck) → chuyển slide đang mở.
    const onGoto = (ev: Event) => {
      const slide = (ev as CustomEvent<{ slide?: number }>).detail?.slide;
      if (typeof slide === 'number' && Number.isFinite(slide)) ed.selectSlide(slide - 1);
    };
    window.addEventListener('present:deck-review-request', onRequest);
    window.addEventListener('present:goto-slide', onGoto);
    return () => {
      window.removeEventListener('present:deck-review-request', onRequest);
      window.removeEventListener('present:goto-slide', onGoto);
      window.dispatchEvent(new CustomEvent('present:deck-review-state', { detail: { slides: null } }));
    };
    // ed.selectSlide memo hoá với deps [] trong useEditor — ổn định suốt đời instance.
  }, [ed.selectSlide]);

  /* FONT TẢI LÊN (#1) — nhúng theo deck. Đăng ký lại vào document mỗi khi mở/đổi deck để
     chữ hiện ĐÚNG font ngay lần vẽ đầu (canvas render cho PDF cũng cần font đã sẵn sàng).
     Chỉ phụ thuộc `customFonts` — không phải cả deck — để không chạy lại mỗi lần gõ phím. */
  const deckCustomFonts = ed.deck.customFonts;
  useEffect(() => {
    registerFonts(deckCustomFonts);
  }, [deckCustomFonts]);

  const onAddDeckFont = useCallback(
    (f: EmbeddedFont) => {
      ed.update((d) => {
        const list = d.customFonts ?? [];
        if (list.some((x) => x.stack === f.stack)) return; // đã có → khỏi nhúng trùng
        d.customFonts = [...list, f];
      });
    },
    [ed],
  );

  const [tab, setTab] = useState<LeftTab>(initialTab ?? 'layout');
  const [panelOpen, setPanelOpen] = useState(true);
  // H4 (13/08, dogfood F1) — TaskFirstStart "Nhập tệp" gọi ĐÚNG cửa Mở tệp của Toolbar qua ref,
  // KHÔNG đẻ input file thứ hai. MARKER: TaskFirstStart.
  const toolbarRef = useRef<ToolbarHandle>(null);
  // "Thay ảnh…" (VIỆC 2d, 28/07): replaceDialogId = đang hiện hộp thoại 2 lựa chọn cho ảnh này;
  // replaceTarget = đã chọn "Từ thư viện", đang chờ user bấm 1 ảnh trong tab Reference.
  const [replaceDialogId, setReplaceDialogId] = useState<string | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
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
  // B2 (31/07, mã 4.1.b) — .idfp export/import CHẠY ở PresentSheets.tsx (giữ sheets[]), báo kết
  // quả về đây qua CustomEvent để DÙNG CHUNG toast exportMsg đã có sẵn (Luật Đồng Bộ #6, không
  // viết toast mới).
  useEffect(() => {
    const onDone = (ev: Event) => {
      const detail = (ev as CustomEvent<{ ok: boolean; text: string }>).detail;
      if (detail) setExportMsg(detail);
    };
    window.addEventListener('present:idfp-export-done', onDone);
    window.addEventListener('present:idfp-import-done', onDone);
    // 09/08 — nhập .pptx dùng CHUNG kênh toast này (Toolbar.tsx#onOpenPptxFile báo lỗi/tiến độ).
    window.addEventListener('present:pptx-import-done', onDone);
    // 13/08 — Smart Convert PDF bậc 1 (Toolbar.tsx#openPdfFile) — kênh toast RIÊNG (không đè lên
    // pptx, dù cùng mẫu) vì lỗi PDF có nội dung khác hẳn (mật khẩu/hỏng/trang scan).
    window.addEventListener('present:pdf-import-done', onDone);
    return () => {
      window.removeEventListener('present:idfp-export-done', onDone);
      window.removeEventListener('present:idfp-import-done', onDone);
      window.removeEventListener('present:pptx-import-done', onDone);
      window.removeEventListener('present:pdf-import-done', onDone);
    };
  }, []);
  const [libAssets, setLibAssets] = useState<GuAsset[]>([]);
  const [libLoading, setLibLoading] = useState(true);
  const [gu, setGu] = useState<GuProfile | null>(null);
  const [imageEditId, setImageEditId] = useState<string | null>(null);
  // VIỆC A (28/07): nâng lên store dùng chung (lib/present-editor/play-status.ts) — StatusBar
  // (mount ở PresentStageScreen, NGOÀI PresentEditor) cần biết để tự ẩn khi trình chiếu toàn
  // màn hình (SlidePlayer). Mọi lời gọi playing/setPlaying bên dưới giữ nguyên cú pháp cũ.
  const playing = usePlayStatus((s) => s.playing);
  const setPlaying = usePlayStatus((s) => s.setPlaying);
  // "Xem lưới" (Slide Sorter) — overlay bổ sung cho SlideStrip, xem toàn deck dạng lưới.
  const [sorterOpen, setSorterOpen] = useState(false);
  // bảng hỏi số liệu (áp vào bố cục sinh ra).
  const [spec, setSpec] = useState<LayoutSpec>(DEFAULT_SPEC);
  // ảnh reference LOCAL (phiên editor) — bổ sung cho server khi chưa đăng nhập.
  const [localRefs, setLocalRefs] = useState<RefImage[]>([]);
  // Cảnh báo bố cục (chuẩn DECK_STANDARDS) sau khi dàn tự động — không thụ động, đóng được.
  const [layoutWarnings, setLayoutWarnings] = useState<ReturnType<typeof evaluateDeck>>([]);
  // HOOK ML pha 1: hình học lưới của ảnh reference GẦN NHẤT (đính lúc Generate) — nuôi
  // suggestTemplate chọn archetype sát ảnh mẫu. null = suggest theo heuristic cũ.
  const [refGrid, setRefGrid] = useState<GridGeometryInput | null>(null);
  // PS-3: id ổn định (render:<nodeId>[:index]) của ảnh Reference đến từ chặng Render, theo
  // `src` — tra khi chèn ảnh vào slide để gán assetId (xem onAddImageUrl). Không có ở đây =
  // ảnh không có nguồn Render ổn định (upload tay/AI khác) → chèn như trước, không link.
  const renderIdBySrcRef = useRef<Map<string, string>>(new Map());

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
    const imgs = consumePresentHandoffWithIds();
    if (!imgs.length) return;
    for (const { src, id } of imgs) {
      if (id) renderIdBySrcRef.current.set(src, id); // PS-3: nhớ id ổn định để link lúc chèn
    }
    const items: RefImage[] = imgs.map(({ src }, i) => ({
      id: newId('ref'),
      name: `Slide từ Render ${i + 1}`,
      url: src,
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
      // Nền giấy SÁNG cố định (KHÔNG kế thừa slide[0] — slide đầu deck mẫu có thể là slide
      // bìa nền TỐI, kế thừa mù sẽ làm chữ tối-trên-tối vô hình). Ink luôn tối vì nền luôn sáng.
      // 05/08 — LUẬT TRUNG TÍNH: giá trị cũ là beige thương hiệu của một studio. Nay là giấy
      // kem trung tính của IF. CỐ Ý không đọc palette Brand Kit ở đây: palette dự án có thể
      // toàn màu TỐI, lấy mù sẽ tái phát đúng lỗi chữ-tối-trên-nền-tối mà dòng trên đang chặn —
      // người dùng đổi nền slide này bằng tay như mọi slide khác (model.ts:460 `background`).
      d.slides.push({
        id: newId('sld'),
        background: '#F4F1EA',
        backgroundImage: null,
        elements: [
          makeText({
            text: 'Bản vẽ kỹ thuật · Thiết kế 2D',
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

  // Cầu nối Spec (G1-G4 CuaAnhThanhSpec) → Present — LANE F, đóng gap "Spec Portal to Present"
  // (IF-LIVE-BRIDGE.md MISSING). Cùng pattern consume-once + chèn 1 SLIDE MỚI như cầu CAD→Present
  // ở trên — KHÔNG content-model mới, chỉ makeText đã có. Chỉ tới đây khi spec đã DUYỆT VÀ LƯU
  // THẬT (nút "Đưa sang Trình bày" ở G4 chỉ bật sau khi /api/asset-representation trả 200).
  useEffect(() => {
    const p = consumeSpecPresentHandoff();
    if (!p) return;
    const insertAt = ed.deck.slides.length;
    ed.update((d) => {
      d.slides.push({
        id: newId('sld'),
        background: '#F4F1EA',
        backgroundImage: null,
        elements: [
          makeText({
            text: p.doiTuong,
            role: 'kicker',
            frame: { x: 6, y: 5, w: 88, h: 8, rotation: 0 },
            fontSize: 3,
            bold: true,
            color: '#221f1a',
          }),
          ...p.dongChu.map((line, i) =>
            makeText({
              text: line,
              frame: { x: 6, y: 16 + i * 8, w: 88, h: 7, rotation: 0 },
              fontSize: 1.8,
              color: '#3a352c',
            }),
          ),
          makeText({
            text: p.boqNote,
            frame: { x: 6, y: 16 + p.dongChu.length * 8 + 4, w: 88, h: 7, rotation: 0 },
            fontSize: 1.6,
            color: '#6a5f4e',
          }),
        ],
        templateId: 'spec-handoff',
      });
    });
    ed.selectSlide(insertAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * [marker: focusEntity] — chiều ĐỌC của TaskContext Link (phiếu focus-entity-2d-present):
   * Bảng việc deep-link `/projects/{id}/present?focusEntity=` → nhảy đúng TRANG (mức trang là
   * đủ v1; id trỏ vào element thì nhảy tới trang chứa nó + chọn luôn element). PresentEditor
   * chỉ mount SAU khi PresentSheets hydrate xong (xem docstring PresentSheets) nên đọc 1 lần
   * lúc mount là đủ — không cần chờ như bên 2D. Không thấy → toast nhẹ, không chặn.
   */
  useEffect(() => {
    const focusId = parseFocusEntity(window.location.search);
    if (!focusId) return;
    const slides = ed.deck.slides;
    let idx = slides.findIndex((s) => s.id === focusId);
    let elementId: string | null = null;
    if (idx < 0) {
      idx = slides.findIndex((s) => s.elements.some((e) => e.id === focusId));
      if (idx >= 0) elementId = focusId;
    }
    if (idx >= 0) {
      ed.selectSlide(idx);
      if (elementId) ed.select(elementId);
      setExportMsg({ ok: true, text: `Đã mở trang ${idx + 1} từ Bảng việc.` });
    } else {
      setExportMsg({ ok: false, text: 'Trang không còn trong hồ sơ này.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 09/08 — NHẬP `.pptx` (Toolbar.tsx#onOpenPptxFile đọc file bằng lib/present-editor/
   * pptx-import.ts rồi bắc cầu sang đây bằng CustomEvent, cùng pattern `present:idfp-import-*`).
   * Slide nhập vào NỐI VÀO CUỐI deck đang mở — KHÔNG thay thế như `.idfp`, vì đây là deck của
   * nguồn khác chứ không phải project của chính mình. Cùng khuôn với cầu nối CAD→Present ngay
   * trên: push slide → `selectSlide` nhảy tới slide mới đầu tiên → toast qua `exportMsg`.
   */
  useEffect(() => {
    const onImportPptx = (ev: Event) => {
      const detail = (ev as CustomEvent<{ slides: EditorSlide[]; message: string }>).detail;
      if (!detail?.slides?.length) return;
      const insertAt = ed.deck.slides.length;
      ed.update((d) => {
        d.slides.push(...detail.slides);
      });
      ed.selectSlide(insertAt);
      setExportMsg({ ok: true, text: detail.message });
    };
    window.addEventListener('present:pptx-import-request', onImportPptx);
    return () => window.removeEventListener('present:pptx-import-request', onImportPptx);
  }, [ed.deck.slides.length, ed.update, ed.selectSlide]);

  /**
   * 13/08 — NHẬP `.pdf` (Smart Convert bậc 1, Toolbar.tsx#openPdfFile đọc bằng lib/present-editor/
   * pdf-import.ts rồi bắc cầu sang đây). CÙNG KHUÔN với `.pptx` ngay trên: nối vào CUỐI deck đang
   * mở (không thay thế), nhảy tới slide mới đầu tiên, báo qua `exportMsg`.
   */
  useEffect(() => {
    const onImportPdf = (ev: Event) => {
      const detail = (
        ev as CustomEvent<{
          slides: EditorSlide[];
          linkedAssets?: Record<string, import('@/lib/present-editor/model').LinkedAsset>;
          message: string;
        }>
      ).detail;
      if (!detail?.slides?.length) return;
      const insertAt = ed.deck.slides.length;
      ed.update((d) => {
        d.slides.push(...detail.slides);
        // D1b — merge registry ảnh trích từ PDF vào deck (hợp đồng PdfImportResult.linkedAssets).
        // assetId là hash NỘI DUNG pixel → id trùng = cùng ảnh; GIỮ bản đang có (người dùng có thể
        // đã sửa src qua panel linked-assets — không ghi đè sau lưng, luật L5).
        if (detail.linkedAssets) {
          d.linkedAssets = d.linkedAssets ?? {};
          for (const [id, asset] of Object.entries(detail.linkedAssets)) {
            if (!d.linkedAssets[id]) d.linkedAssets[id] = asset;
          }
        }
      });
      ed.selectSlide(insertAt);
      setExportMsg({ ok: true, text: detail.message });
    };
    window.addEventListener('present:pdf-import-request', onImportPdf);
    return () => window.removeEventListener('present:pdf-import-request', onImportPdf);
  }, [ed.deck.slides.length, ed.update, ed.selectSlide]);

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
  /** "In 300dpi" chỉ chạy được ở khổ giấy thật (A4/A3) — 16:9 là khổ màn hình, không phải khổ in. */
  const printReady = useMemo(() => !!(ed.deck.stagePreset && PAPER_SIZE_MM[ed.deck.stagePreset as StagePresetId]), [ed.deck.stagePreset]);

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
  // Đưa ảnh reference vào slide đang dàn (thêm image element cỡ vừa, giữa) — dùng chung cho
  // panel Reference (click "dùng") + kéo-thả vào canvas.
  //
  // PS-3: nếu `src` này đến từ chặng Render với id ổn định (renderIdBySrcRef, gán lúc consume
  // handoff ở trên), gán luôn `assetId` = id đó. Chèn CÙNG ảnh (cùng node nguồn) vào nhiều slide
  // ⇒ mọi element cùng assetId ⇒ tài sản liên kết (linked-assets.ts) coi là 1 nguồn, sửa 1 nơi
  // (round-trip /photo-editor hoặc panel tài sản liên kết) cập nhật MỌI nơi. Đẩy element + gán
  // assetId trong CÙNG 1 lượt `ed.update` để tránh đọc deck cũ (state React chưa kịp áp add).
  // Không có id ổn định (ảnh upload tay/AI khác) → y hệt hành vi cũ, không link.
  const onAddImageUrl = (src: string) => {
    const el = makeImage(src, { frame: centered(40, 45) });
    const renderId = renderIdBySrcRef.current.get(src);
    ed.update((d) => {
      const s = d.slides[ed.currentSlide];
      if (!s) return;
      s.elements.push(el);
      if (!renderId) return;
      const existing = d.linkedAssets?.[renderId];
      if (existing) {
        const next = attachElementToAsset(d, s.id, el.id, renderId);
        d.slides = next.slides;
      } else {
        const next = setLinkedAssetSrc(d, renderId, src);
        d.linkedAssets = next.linkedAssets;
        const el2 = d.slides[ed.currentSlide]?.elements.find((e) => e.id === el.id);
        if (el2 && el2.kind === 'image') el2.assetId = renderId;
      }
    });
    ed.select(el.id);
  };

  // "Thay ảnh…" (VIỆC 2d) — chỉ đổi `src`, GIỮ NGUYÊN vị trí/kích thước/crop (frame/crop/adjust
  // không đụng tới). Xoá `assetId`: ảnh đã đổi nội dung tại chỗ này, không còn đại diện đúng cho
  // tài sản liên kết cũ nữa (tránh các slide khác cùng assetId bị đổi lây ngoài ý muốn).
  const replaceImageSrc = useCallback(
    (id: string, src: string) => {
      ed.updateSlide((s) => {
        const el = s.elements.find((e) => e.id === id);
        if (el && el.kind === 'image') {
          el.src = src;
          delete el.assetId;
        }
      });
    },
    [ed],
  );

  // Tab Reference khi có `replaceTarget` (đến từ "Thay ảnh… → Từ thư viện"): bấm ảnh = THAY
  // đúng ảnh đang chờ, KHÔNG thêm element mới như hành vi mặc định của LibraryBrowser.
  const onUseRefImage = (url: string) => {
    if (replaceTarget) {
      replaceImageSrc(replaceTarget, url);
      setReplaceTarget(null);
    } else {
      onAddImageUrl(url);
    }
  };

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

  // E1 bổ sung (02/08) — RESIZE NHÓM theo tỉ lệ: chụp khung bao + frame/fontSize từng phần tử
  // lúc bắt đầu kéo góc (ref, giống groupStartRef ở trên nhưng cho resize thay vì dời).
  const groupResizeStartRef = useRef<{
    bbox: GroupFrame;
    members: Record<string, { frame: Frame; fontSize?: number }>;
  } | null>(null);

  /** vùng "còn liên quan tới selection" — canvas (stage + toolbar nổi) và Inspector (phải).
   * Click ngoài CẢ HAI (vd sidebar Magic/Reference/Motion bên trái, header) = bỏ chọn. */
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

  /* Ctrl/Cmd + lăn chuột HOẶC chụm 2 ngón trên trackpad = zoom canvas (chuẩn Photoshop/Canva/
   * Figma). Cuộn THƯỜNG (chuột lẫn trackpad) giữ nguyên hành vi cuộn trang cũ — đúng cho trình dàn
   * trang, nên truyền `zoomOnPlainWheel: false` cho bộ phân loại.
   *
   * Gắn listener NATIVE (không dùng onWheel của React) để preventDefault thật sự chặn được zoom
   * trang của trình duyệt — React 17+ đăng ký wheel handler ở chế độ passive nên preventDefault
   * bên trong onWheel JSX sẽ KHÔNG có tác dụng.
   *
   * Đổi 19/07: trước đây cộng/trừ ZOOM_STEP cố định mỗi sự kiện ⇒ chụm trackpad (bắn hàng chục sự
   * kiện nhỏ/giây) zoom giật cục, và Firefox gửi deltaMode=1 (dòng) thì bước lại sai cỡ. Nay dùng
   * hệ số NHÂN theo độ lớn delta đã quy đổi về px, mượt và đồng nhất giữa các trình duyệt. */
  useEffect(() => {
    const node = canvasAreaRef.current;
    if (!node) return;
    function onWheelNative(e: WheelEvent) {
      const intent = classifyWheel(e, { zoomOnPlainWheel: false });
      if (intent.kind !== 'zoom') return; // cuộn thường → để trình duyệt cuộn khung như cũ
      e.preventDefault();
      setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(z * intent.factor).toFixed(2))));
    }
    node.addEventListener('wheel', onWheelNative, { passive: false });
    return () => node.removeEventListener('wheel', onWheelNative);
  }, []);

  /* Click ngoài canvas / Escape → deselect toàn bộ element.
   * Ý user (21/07): "click chuột ngoài vùng canvas thì tự thoát chọn".
   * Cơ chế opt-in: chỉ vùng đánh `data-if-deselect-zone` mới trigger — canvas padding (<main>) +
   * thanh chặng (StudioBar). Toolbar/Inspector/LayerPanel KHÔNG có attr này → click vẫn giữ selection.
   * Escape: nếu không có editing text (contenteditable) và không có input focus, thì deselect. */
  useEffect(() => {
    function onWinPointer(e: PointerEvent) {
      if (!ed.selectedIds.length) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Nếu click nằm trong canvas area (canvasAreaRef) → để onStageDown của EditorCanvas xử lý.
      if (canvasAreaRef.current && canvasAreaRef.current.contains(target)) {
        // Nhưng nếu click chính vào padding của <main> (target=main) → deselect.
        if (target === canvasAreaRef.current) ed.select(null);
        return;
      }
      // Ngoài canvas: chỉ deselect nếu closest có [data-if-deselect-zone].
      const zone = target.closest('[data-if-deselect-zone]');
      if (zone) ed.select(null);
    }
    function onWinKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (!ed.selectedIds.length) return;
      const a = document.activeElement as HTMLElement | null;
      if (a) {
        const tag = a.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || a.isContentEditable) return;
      }
      ed.select(null);
    }
    window.addEventListener('pointerdown', onWinPointer, true);
    window.addEventListener('keydown', onWinKey);
    return () => {
      window.removeEventListener('pointerdown', onWinPointer, true);
      window.removeEventListener('keydown', onWinKey);
    };
  }, [ed]);

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

  /** E1 bổ sung (02/08) — kéo GÓC khung bao cả cụm (EditorCanvas#GroupResizeOverlay) → scale
   * CẢ CỤM theo tỉ lệ: mọi phần tử con giữ vị trí tương đối trong khung bao + kích thước riêng
   * cùng nhân 1 hệ số `scale`, chữ (`fontSize`) cũng nhân theo (xem `resize-group.ts`). Phần tử
   * KHOÁ bị loại khỏi lô scale (giống `onFrameMany` loại khoá khỏi dời nhóm) — chốt giữa chuỗi,
   * giải quyết mục ⛔ "resize cả cụm" P2 để lại (docs/BAO-CAO-PHU.md mục P2). */
  const onGroupResize = useCallback(
    (handle: 'nw' | 'ne' | 'sw' | 'se', dxPct: number, live: boolean) => {
      const s = ed.slide;
      if (!s) return;
      if (!groupResizeStartRef.current) {
        const members: Record<string, { frame: Frame; fontSize?: number }> = {};
        const frames: GroupFrame[] = [];
        for (const id of ed.selectedIds) {
          const el = s.elements.find((e) => e.id === id);
          if (el && !el.locked) {
            members[id] = { frame: { ...el.frame }, fontSize: el.kind === 'text' ? el.fontSize : undefined };
            frames.push(el.frame);
          }
        }
        groupResizeStartRef.current = { bbox: groupBoundingBox(frames), members };
      }
      const { bbox, members } = groupResizeStartRef.current;
      const { bbox: newBbox, scale } = scaleGroupByCorner(bbox, handle, dxPct);
      ed.updateSlide((sl) => {
        for (const el of sl.elements) {
          const m = members[el.id];
          if (!m) continue;
          const res = scaleMemberFrame(m.frame, bbox, newBbox, scale, m.fontSize);
          el.frame = { ...el.frame, x: res.frame.x, y: res.frame.y, w: res.frame.w, h: res.frame.h };
          if (el.kind === 'text' && res.fontSize !== undefined) el.fontSize = res.fontSize;
        }
      }, live);
      if (!live) groupResizeStartRef.current = null;
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

  // z-order NHÓM (chốt 04/08, docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md mục "z-order nhóm") —
  // dùng `ed.selectedIds` (mảng, luôn đúng dù chọn 1 hay nhiều) THAY VÌ `ed.selectedId` (vốn chỉ
  // là phần tử được chọn CUỐI CÙNG, xem useEditor.ts — trước đây multi-select bấm Tiến/Lùi chỉ
  // dịch ĐÚNG 1 phần tử đó, các phần tử khác trong lô chọn im lìm, bug ngầm không báo lỗi). Toán
  // THUẦN nằm ở `reorderZOrderGroup` (zorder-group.ts) — cả cụm dịch bậc CÙNG NHAU, giữ nguyên
  // thứ tự nội bộ (chuẩn Figma).
  const onZOrder = useCallback(
    (dir: 'front' | 'back' | 'forward' | 'backward') => {
      if (!ed.selectedIds.length) return;
      ed.updateSlide((s) => {
        s.elements = reorderZOrderGroup(s.elements, ed.selectedIds, dir);
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
    // groupId ánh xạ sang lô MỚI (P2/E1) — xem duplicateElementsPreservingGroups.
    const copies = duplicateElementsPreservingGroups(originals);
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
    // groupId ánh xạ sang lô MỚI (P2/E1) — dán 2 lần không gộp chung 1 cụm.
    const copies = duplicateElementsPreservingGroups(clipboardRef.current);
    ed.updateSlide((s) => {
      s.elements.push(...copies);
    });
    ed.selectMany(copies.map((c) => c.id));
  }, [ed]);

  /**
   * P2/E1 (nhóm) — click chọn 1 phần tử trong cụm → chọn CẢ cụm (khớp Figma). Đặt Ở ĐÂY (bọc
   * quanh `ed.select`) thay vì sửa trong `useEditor.ts` để LayerPanel vẫn dùng `ed.select` THẲNG
   * (chọn TỪNG dòng riêng, khớp cách các trình layer khác cho chọn 1 lớp trong cụm mà không kéo
   * cả cụm) — chỉ canvas (click + chuột phải, đều đi qua prop `onSelect` này) mới chọn cả cụm.
   */
  const onSelectGroupAware = useCallback(
    (id: string | null) => {
      if (!id) {
        ed.select(null);
        return;
      }
      const el = ed.slide?.elements.find((e) => e.id === id);
      if (el?.groupId) {
        const ids = (ed.slide?.elements ?? []).filter((e) => e.groupId === el.groupId).map((e) => e.id);
        ed.selectMany(ids);
      } else {
        ed.select(id);
      }
    },
    [ed],
  );

  /** P2/E1 — gộp các phần tử đang chọn (≥2) thành 1 cụm mới. */
  const onGroupSelected = useCallback(() => {
    if (ed.selectedIds.length < 2) return;
    const gid = newId('grp');
    const ids = new Set(ed.selectedIds);
    ed.updateSlide((s) => {
      s.elements.forEach((e) => {
        if (ids.has(e.id)) e.groupId = gid;
      });
    });
  }, [ed]);

  /** P2/E1 — rã MỌI cụm có mặt trong lựa chọn hiện tại (kể cả khi chọn nhiều cụm cùng lúc). */
  const onUngroupSelected = useCallback(() => {
    const gids = new Set(
      (ed.slide?.elements ?? [])
        .filter((e) => ed.selectedIds.includes(e.id) && e.groupId)
        .map((e) => e.groupId as string),
    );
    if (!gids.size) return;
    ed.updateSlide((s) => {
      s.elements.forEach((e) => {
        if (e.groupId && gids.has(e.groupId)) e.groupId = undefined;
      });
    });
  }, [ed]);

  /**
   * P2/E1 — khoá/mở khoá CẢ CỤM đang chọn (trước đây chỉ khoá 1 phần tử "chính" qua
   * `ed.updateSelected`, không cascade). Quy ước: còn ≥1 phần tử MỞ khoá trong lựa chọn → khoá
   * HẾT; đã khoá hết → mở HẾT (khớp Figma — tránh trạng thái lẫn lộn khó hiểu khi bấm 1 nút).
   * Dùng CHUNG cho cả nút Khoá trong Inspector lẫn menu chuột phải trên canvas.
   */
  const onToggleLockSelected = useCallback(() => {
    if (!ed.selectedIds.length) return;
    const ids = new Set(ed.selectedIds);
    const anyUnlocked = (ed.slide?.elements ?? []).some((e) => ids.has(e.id) && !e.locked);
    ed.updateSlide((s) => {
      s.elements.forEach((e) => {
        if (ids.has(e.id)) e.locked = anyUnlocked;
      });
    });
  }, [ed]);

  /**
   * P6b bước 2a — ẩn/hiện CẢ CỤM đang chọn. Cùng khuôn `onToggleLockSelected`: còn ≥1 phần tử
   * ĐANG HIỆN trong lựa chọn → ẩn HẾT; đã ẩn hết → hiện HẾT. Đi qua `ed.updateSlide` nên undo/redo
   * phủ tự động (giống khoá).
   */
  const onToggleHideSelected = useCallback(() => {
    if (!ed.selectedIds.length) return;
    const ids = new Set(ed.selectedIds);
    const anyVisible = (ed.slide?.elements ?? []).some((e) => ids.has(e.id) && !e.hidden);
    ed.updateSlide((s) => {
      s.elements.forEach((e) => {
        if (ids.has(e.id)) e.hidden = anyVisible;
      });
    });
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

  /**
   * Căn NHIỀU element đã chọn theo bounding box CHUNG của chính chúng (lib/present-editor/
   * align.ts — thuần) — khác `onAlign` ở trên (canh theo biên sân khấu, 1 phần tử). Bỏ qua
   * phần tử khoá (như onNudge/onDeleteSelected). <2 phần tử mở khoá → không làm gì.
   */
  const onAlignSelection = useCallback(
    (mode: GroupAlignMode) => {
      if (ed.selectedIds.length < 2) return;
      ed.updateSlide((s) => {
        const ids = new Set(ed.selectedIds);
        const targets = s.elements.filter((e) => ids.has(e.id) && !e.locked);
        if (targets.length < 2) return;
        const aligned = alignFrames(targets.map((e) => e.frame), mode);
        targets.forEach((e, i) => {
          e.frame = aligned[i];
        });
      });
    },
    [ed],
  );

  /** Phân bố đều khoảng cách giữa các element đã chọn (cần ≥3 phần tử mở khoá). */
  const onDistributeSelection = useCallback(
    (axis: DistributeAxis) => {
      if (ed.selectedIds.length < 3) return;
      ed.updateSlide((s) => {
        const ids = new Set(ed.selectedIds);
        const targets = s.elements.filter((e) => ids.has(e.id) && !e.locked);
        if (targets.length < 3) return;
        const distributed = distributeFrames(targets.map((e) => e.frame), axis);
        targets.forEach((e, i) => {
          e.frame = distributed[i];
        });
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
        if (!built.length) {
          // Kicker Cover = DỮ LIỆU của deck đang mở (Brand Kit / tên dự án), rỗng thì bỏ dải
          // kicker. KHÔNG hardcode tên studio/khách (CLAUDE.md · LUẬT NỀN TẢNG).
          built = slidesFromContent(
            r.bodyText,
            r.contentImages,
            pal,
            ed.deck.fonts,
            coverKickerFromDeck(ed.deck),
          );
        }
        if (built.length) {
          const startIdx = ed.deck.slides.length;
          const onlyBlankSlide =
            ed.deck.slides.length === 1 &&
            ed.deck.slides[0].elements.length === 0 &&
            !ed.deck.slides[0].backgroundImage;
          const replace =
            startIdx === 0 || onlyBlankSlide ||
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

  /* M-EMPTY-2 (07/08, mock [BẢN CHỐT] `Bốn trạng thái rỗng.dc.html` màn 1d) — hai lối của màn
   * trống, NỐI THẬT cả hai:
   *  - "Tạo từ ảnh đã dựng": đọc ảnh render CỦA CHÍNH FLOW qua `deckImagesWithIdsFromNodes`
   *    (đúng nguồn `pickStage` dùng khi bàn giao Render→Present, không chế nguồn thứ hai) —
   *    mỗi ảnh thành MỘT trang trắng mang ảnh đó. 0 ảnh ⇒ nút KHOÁ + lý do (đúng mock).
   *  - "Bắt đầu bằng slide trắng": 1 trang TRẮNG THẬT (elements rỗng — KHÔNG phải template
   *    "Tiêu đề slide/Ý chính" của onAddSlide, mock đòi slide trống). */
  const trEmpty = useT();
  const flowNodes = useFlowStore((s) => s.nodes);
  const builtImages = useMemo(() => deckImagesWithIdsFromNodes(flowNodes), [flowNodes]);
  /* H4 (13/08, sửa nóng dogfood F1) — id slide vừa được "Trang trống" tạo/xác nhận, để
   * TaskFirstStart (bên dưới) tự ẩn cho ĐÚNG slide đó mà không cần đụng vào schema Deck (state
   * cục bộ thuần UI, không lưu vào .idfp). MARKER: TaskFirstStart. */
  const [taskFirstDismissedId, setTaskFirstDismissedId] = useState<string | null>(null);
  const onAddBlankSlide = useCallback(() => {
    const id = newId('sld');
    ed.update((d) => {
      d.slides.push({ id, background: '#ffffff', elements: [] });
    });
    ed.selectSlide(ed.deck.slides.length);
    setTaskFirstDismissedId(id);
  }, [ed]);
  const EMPTY_FROM_RENDER_CAP = 12;
  const onAddSlidesFromRenders = useCallback(() => {
    if (!builtImages.length) return;
    const batch = builtImages.slice(0, EMPTY_FROM_RENDER_CAP);
    ed.update((d) => {
      for (const it of batch) {
        d.slides.push({
          id: newId('sld'),
          background: '#ffffff',
          elements: [makeImage(it.src, { frame: { x: 5, y: 12, w: 90, h: 84, rotation: 0 } })],
        });
      }
    });
    ed.selectSlide(ed.deck.slides.length);
  }, [ed, builtImages]);

  /* H4 (13/08, dogfood F1 "canvas trắng không dẫn lối") — TaskFirstStart: 3 LỐI TO thay canvas
   * trắng khi hồ sơ THỰC SỰ trống — ①0 slide (deck mới) HOẶC ②đúng 1 slide, 0 phần tử, 0 ảnh nền
   * (vừa "Trang trống"/chưa từng đụng gì). Deck có nội dung/nhiều trang → KHÔNG hiện, không đụng
   * luồng đang làm dở. `taskFirstDismissedId` chỉ tự tắt lối ② cho ĐÚNG slide vừa xác nhận —
   * MARKER: TaskFirstStart. */
  const showTaskFirstStart =
    !ed.slide ||
    (ed.deck.slides.length === 1 &&
      ed.slide.elements.length === 0 &&
      !ed.slide.backgroundImage &&
      ed.slide.id !== taskFirstDismissedId);
  const onTaskFirstImport = useCallback(() => {
    toolbarRef.current?.openGatewayPicker();
  }, []);
  const onTaskFirstFromTemplate = useCallback(() => {
    setPanelOpen(true);
    setTab('layout');
  }, []);
  const onTaskFirstBlank = useCallback(() => {
    if (ed.slide) {
      // Đã có đúng 1 slide trống (scenario ②) — "vào thẳng", không tạo thêm slide mới.
      setTaskFirstDismissedId(ed.slide.id);
    } else {
      onAddBlankSlide();
    }
  }, [ed.slide, onAddBlankSlide]);

  /* H4 (13/08, dogfood F1 "LỚP/NỀN SLIDE/Tạo việc hiện cả khi slide trống, chưa có gì để
   * chỉnh") — cột phải (Inspector: Lớp · Nền slide · Tạo việc từ đây) chỉ có LÝ DO tồn tại khi
   * có phần tử để liệt kê HOẶC đang chọn gì đó. Slide trống + không chọn gì → thu gọn về tay cầm
   * mép (cùng mẫu PanelHandle app dùng ở chặng Trình chiếu, chốt 07/08 mục 10) — KHÔNG đụng state
   * `inspectorOpen` đã lưu (localStorage) nên khi slide có nội dung trở lại, panel tự hiện đúng
   * như người dùng đã chọn trước đó. */
  const hasInspectorContent = !!ed.slide && (ed.slide.elements.length > 0 || ed.selectedIds.length > 0);

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

  // Kéo-thả trong Slide Sorter: from → to bất kỳ (khác onMoveSlide chỉ ±1 bước). Logic mảng
  // THUẦN ở lib/present-editor/reorder.ts (test riêng) — ở đây chỉ áp vào deck + chọn slide
  // vừa kéo làm current (cùng hành vi onMoveSlide).
  const onReorderSlide = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      ed.update((d) => {
        d.slides = reorderArray(d.slides, from, to);
      });
      ed.selectSlide(to);
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

  // Animation Pane THEO OBJECT (mở rộng build-in slide-level ở trên) — mỗi dòng trong
  // MotionPanel chỉnh 1 element BẤT KỲ của slide hiện tại, không cần đang chọn trên canvas.
  const onSetElementReveal = useCallback(
    (id: string, reveal: ElementReveal | undefined) =>
      ed.updateElementById(id, (el) => {
        el.elementReveal = reveal;
      }),
    [ed],
  );
  const onSetElementRevealOrder = useCallback(
    (id: string, order: number | undefined) =>
      ed.updateElementById(id, (el) => {
        el.revealOrder = order;
      }),
    [ed],
  );
  const onSetElementRevealDelay = useCallback(
    (id: string, delaySec: number | undefined) =>
      ed.updateElementById(id, (el) => {
        el.revealDelay = delaySec;
      }),
    [ed],
  );
  /** kéo-thả sắp lại thứ tự xuất hiện — ghi `revealOrder` = 0..n-1 theo thứ tự MỚI, KHÔNG đụng
   * thứ tự z (`slide.elements`). */
  const onReorderElementReveal = useCallback(
    (orderedIds: string[]) => {
      ed.updateSlide((s) => {
        orderedIds.forEach((id, index) => {
          const el = s.elements.find((e) => e.id === id);
          if (el) el.revealOrder = index;
        });
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
      const res = await exportDeckToPptxFromModel(ed.deck);
      // Font bị bỏ qua là chuyện NGƯỜI DÙNG CẦN BIẾT (file vẫn xuất được, nhưng chữ sẽ đổi font
      // trên máy chưa cài) — báo kèm lý do thay vì im lặng "xong".
      if (res.skipped.length) {
        setExportMsg({
          ok: false,
          text: `Đã xuất, nhưng chưa nhúng được ${res.skipped.length} font: ${res.skipped
            .map((s) => s.reason)
            .join(' · ')}`,
        });
      } else if (res.embedded.length) {
        setExportMsg({
          ok: true,
          text: `Đã xuất PowerPoint — nhúng kèm ${res.embedded.length} font (${res.embedded.join(', ')}).`,
        });
      } else {
        setExportMsg({ ok: true, text: 'Đã xuất PowerPoint xong.' });
      }
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

  /**
   * P3 phần 1+2 (01/08 · 02/08 Hoà chốt hướng "chuẩn nguồn in") — chữ/hình khối đạt 300dpi thật
   * qua `resScale`; ẢNH hero/nền thiếu độ phân giải được `ai.upscale` nâng lên TRƯỚC khi render
   * (`print-upscale.ts`, ×4 hoặc ×4+×2, cache theo hash src — cùng ảnh chỉ trả tiền 1 lần).
   *
   * "Hiện giá + thời gian ước trước khi bấm" (luật nói-giá-trước-khi-tiêu-tiền, cùng tinh thần
   * `estimateRunCredit` ở node-graph, `lib/execution.ts`) — `estimatePrintUpscale` CHỈ đọc kích
   * thước ảnh (không gọi AI, 0 chi phí) rồi hỏi `window.confirm` (đúng khuôn xác nhận ".idfp" đã
   * có ở `Toolbar.tsx`, không thêm component mới) trước khi thật sự trừ credit.
   */
  const onExportPrint300 = useCallback(async () => {
    setBusy('print300');
    try {
      const aiTier = useFlowStore.getState().aiTier;
      const estimate = await estimatePrintUpscale(ed.deck, 300, aiTier);
      if (estimate.aiUnavailable) {
        if (
          !window.confirm(
            'Đang ở mức "Không AI" (góc phải header) — ảnh hero/nền sẽ GIỮ NGUYÊN độ phân giải nguồn, không đạt 300dpi nếu ảnh nhỏ. Chữ/hình khối vẫn đạt 300dpi thật. Xuất tiếp?',
          )
        ) {
          setBusy(null);
          return;
        }
      } else if (estimate.needCount > 0) {
        const sec = Math.round(estimate.estMs / 1000);
        if (
          !window.confirm(
            `${estimate.needCount} ảnh hero/nền cần nâng độ phân giải để đạt 300dpi thật — tốn ~${estimate.totalCredits}cr, ~${sec}s. Tiếp tục?`,
          )
        ) {
          setBusy(null);
          return;
        }
      }
      const { upscaledCount, failedCount } = await exportDeckToPdfAtPaperSize(ed.deck, 300, { tier: aiTier });
      const parts = ['Đã xuất PDF 300dpi — chữ/hình khối đạt dpi thật'];
      if (upscaledCount > 0) parts.push(`đã nâng độ phân giải ${upscaledCount} ảnh hero/nền lên dpi thật`);
      else if (estimate.aiUnavailable) parts.push('ảnh hero/nền chưa (mức Không AI)');
      else if (estimate.needCount === 0) parts.push('ảnh hero/nền đã đủ độ phân giải nguồn');
      if (failedCount > 0) parts.push(`${failedCount} ảnh lỗi/hết credit khi nâng — đã giữ ảnh gốc`);
      setExportMsg({ ok: failedCount === 0, text: parts.join(', ') + '.' });
    } catch (err) {
      console.error('[PresentEditor] print300 export failed', err);
      const msg =
        err instanceof UpscaleCreditError
          ? 'Hết credits khi nâng độ phân giải ảnh — nạp thêm rồi thử lại, hoặc xuất ở mức chưa nâng ảnh.'
          : err instanceof Error
            ? err.message
            : 'Xuất PDF 300dpi lỗi — thử lại.';
      setExportMsg({ ok: false, text: msg });
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
      if (imageEditId || playing || sorterOpen) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const ids = (ed.slide?.elements ?? []).filter((el) => !el.locked).map((el) => el.id);
        if (ids.length) ed.selectMany(ids);
        return;
      }
      // B4 (31/07, mã 4.1.d) — Ctrl/⌘+S ép ghi ngay (IndexedDB + đĩa dự án), CÙNG mẫu
      // `cad:force-save-request` (2.1.8.n, CadCanvas.tsx) — không mở đường lưu mới, app không có
      // nút "Lưu tay" riêng. preventDefault() BẮT BUỘC, thiếu là trình duyệt tự mở hộp "Lưu trang".
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('present:force-save-request'));
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
      // VIỆC 2 UI (04/08) — ⌘G/⇧⌘G nối vào đúng onGroupSelected/onUngroupSelected sẵn có
      // (trước chỉ bấm được qua menu chuột phải trên EditorCanvas.tsx) — không viết luồng nhóm
      // thứ hai. ⇧ kiểm TRƯỚC vì 'G'/'g' đều khớp cả 2 nhánh.
      if (mod && e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        onUngroupSelected();
        return;
      }
      if (mod && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        onGroupSelected();
        return;
      }
      // zoom canvas: Ctrl/Cmd + '=' (phím '+' không Shift) / '-' / '9' (về Fit) — chuẩn Figma/PS.
      // VIỆC 2 UI (04/08) — ĐỔI TỪ ⌘0 SANG ⌘9: ⌘0 nay là phím TOÀN CỤC "về Gallery"
      // (AppChrome.tsx, docs/SO-KIEM-TONG.md) — nhường chỗ.
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
      if (mod && e.key === '9') {
        e.preventDefault();
        zoomReset();
        return;
      }
      // ⌘⇧] / ⌘⇧[ — đưa lên trước / ra sau (khớp gợi ý phím tắt trong menu chuột phải ảnh, VIỆC 2).
      if (mod && e.shiftKey && (e.key === ']' || e.key === '}')) {
        e.preventDefault();
        onZOrder('front');
        return;
      }
      if (mod && e.shiftKey && (e.key === '[' || e.key === '{')) {
        e.preventDefault();
        onZOrder('back');
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
    onZOrder,
    onNudge,
    onSelectNext,
    onGroupSelected,
    onUngroupSelected,
    imageEditId,
    playing,
    sorterOpen,
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
      // Task #21: mở công cụ Chỉnh ảnh TRONG dự án đang mở (`/projects/[id]/photo`) — tab
      // mới có store rỗng nên URL phải tự mang dự án, không để nó đoán từ localStorage.
      if (typeof window !== 'undefined') {
        window.open(stageHrefFrom(window.location.pathname, 'photo'), '_blank');
      }
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

  /* ---- [marker: magic-phoi-canh] — vòng "Chỉnh phối cảnh" liên chặng (phiếu D2) ----
   * ② Bấm nút (Inspector/menu chuột phải, chỉ ảnh CÓ assetId) → gieo node ai.regionrender
   *   mang {assetId, deckId} vào flow chặng 2 (store zustand chung, đã đồng bộ đúng dự án
   *   qua useProjectScopeSync) rồi điều hướng client-side sang /projects/[id]/render —
   *   node được select sẵn, canvas fitView lúc mount là thấy.
   * ④ Chiều VỀ (bán tự động trung thực — engine node KHÔNG có completion hook để cắm):
   *   subscribe flow-store nodes; node magic chạy xong + ảnh khác src asset hiện tại →
   *   Inspector hiện nút "Nhận ảnh đã chỉnh". Người bấm [T5] → setLinkedAssetSrc: MỌI
   *   element cùng assetId giữ nguyên frame/vị trí, chỉ đổi ruột ảnh [T1].
   * ⑤ Asset ghi thêm bước gia phả {loai:'grounded-render', nodeId, luc}. */
  const router = useRouter();
  // `flowNodes` đã subscribe sẵn ở trên (M-EMPTY-2) — dùng lại, không subscribe lần hai.
  const onMagicPerspective = useCallback(
    (elementId: string) => {
      const el = ed.slide?.elements.find((e) => e.id === elementId);
      if (!el || el.kind !== 'image' || !el.assetId) return;
      seedPerspectiveEdit({ assetId: el.assetId, deckId: ed.deck.id, src: el.src });
      // Điều hướng client-side (giữ store trong bộ nhớ — node vừa gieo còn nguyên; autosave
      // flow tự chạy nền). Cùng dự án nên ensureProjectScope bên kia trả 'ready' ngay.
      if (typeof window !== 'undefined') {
        router.push(stageHrefFrom(window.location.pathname, 'render'));
      }
    },
    [ed, router],
  );
  // Kết quả chờ nhận cho ảnh ĐANG CHỌN (memo theo nodes + deck — đổi node/đổi asset tự tính lại).
  const magicResult = useMemo(() => {
    const el = ed.selected;
    if (!el || el.kind !== 'image' || !el.assetId) return null;
    const asset = ed.deck.linkedAssets?.[el.assetId];
    return findPerspectiveResult(flowNodes, el.assetId, ed.deck.id, asset?.src ?? el.src);
  }, [flowNodes, ed.deck, ed.selected]);
  const onReceiveMagicResult = useCallback(() => {
    const el = ed.selected;
    if (!magicResult || !el || el.kind !== 'image' || !el.assetId) return;
    const assetId = el.assetId;
    const { nodeId, src } = magicResult;
    ed.update((d) => {
      const prevProv = (d.linkedAssets?.[assetId] as { provenance?: unknown } | undefined)?.provenance;
      const next = setLinkedAssetSrc(d, assetId, src);
      d.linkedAssets = next.linkedAssets;
      d.slides = next.slides;
      const asset = d.linkedAssets?.[assetId] as ({ provenance?: unknown } & Record<string, unknown>) | undefined;
      if (asset) asset.provenance = appendPerspectiveProvenance(prevProv, nodeId);
    });
  }, [ed, magicResult]);

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
        ref={toolbarRef}
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
        onExportPrint300={onExportPrint300}
        printReady={printReady}
        onPlay={() => setPlaying(true)}
        onBrandKit={() => setBrandKitOpen(true)}
        onStagePreset={() => setStagePresetOpen(true)}
        stageLabel={stage.label}
        onOpenSorter={() => setSorterOpen(true)}
        busy={busy}
        exportMsg={exportMsg}
        slide={ed.slide}
        selectedIds={ed.selectedIds}
        onZOrder={onZOrder}
        onAlignSelection={onAlignSelection}
        onGroup={onGroupSelected}
        onUngroup={onUngroupSelected}
        onToggleLock={onToggleLockSelected}
        onToggleHide={onToggleHideSelected}
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
                {/* 07/08 (p12): tab đổi "Magic"→"Bố cục" — một thứ một tên (chốt 01/08 §3c);
                    "Magic" giữ cho phần AI sinh bên trong LayoutShelf, không phải tên cái kệ. */}
                <TabBtn active={tab === 'layout'} onClick={() => setTab('layout')} icon={<LayoutTemplate size={13} />}>
                  Thiết kế
                </TabBtn>
                <TabBtn active={tab === 'reference'} onClick={() => setTab('reference')} icon={<Images size={13} />}>
                  Tài nguyên
                </TabBtn>
                <TabBtn active={tab === 'motion'} onClick={() => setTab('motion')} icon={<Wand2 size={13} />}>
                  Hiệu ứng
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
                    initialGenerated={skipGenerateFlow}
                  />
                )}
                {tab === 'reference' && (
                  <>
                    {replaceTarget && (
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: 8, marginBottom: 8, padding: '7px 10px', borderRadius: 10,
                          border: '1px solid var(--accent)', background: 'var(--accent-soft)',
                          fontSize: 11.5, color: 'var(--accent)',
                        }}
                      >
                        <span>Chọn ảnh để thay thế</span>
                        <button
                          type="button"
                          onClick={() => setReplaceTarget(null)}
                          style={{ background: 'none', border: 'none', color: 'inherit', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Huỷ
                        </button>
                      </div>
                    )}
                    <LibraryBrowser
                      images={refImages}
                      loading={libLoading}
                      onUseImage={onUseRefImage}
                      onDelete={onDeleteRef}
                      onUploadLocal={onUploadLocalRefs}
                    />
                  </>
                )}
                {tab === 'motion' && ed.slide && (
                  <MotionPanel
                    slide={ed.slide}
                    deck={ed.deck}
                    onSetSlideTransition={onSetSlideTransition}
                    onSetSlideReveal={onSetSlideReveal}
                    onApplyDeck={onApplyDeckMotion}
                    onPlay={() => setPlaying(true)}
                    onSetElementReveal={onSetElementReveal}
                    onSetElementRevealOrder={onSetElementRevealOrder}
                    onSetElementRevealDelay={onSetElementRevealDelay}
                    onReorderElementReveal={onReorderElementReveal}
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
                title="Ẩn panel Magic/Reference/Motion"
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
            title="Hiện panel Magic/Reference/Motion"
            style={panelEdgeStripStyle}
          >
            <ChevronRight size={12} />
          </button>
        )}

        {/* giữa: canvas — nền TỐI HƠN trang (docs/SPEC-UI-SHELL.md §3B "giấy vuông, vỏ bo") để
            trang slide (vuông góc, box-shadow nổi + viền 1px sáng) tách bạch rõ khỏi vỏ canvas,
            không cần bo góc trang để phân biệt. */}
        <main
          ref={canvasAreaRef}
          data-if-deselect-zone="true"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            overflow: 'auto',
            position: 'relative',
            background: 'var(--bg)',
          }}
        >
          {showTaskFirstStart ? (
            /* H4 (13/08, sửa nóng dogfood F1 "canvas trắng không dẫn lối") — TaskFirstStart:
             * 3 LỐI TO đúng việc người dùng ĐANG GẤP cần làm ngay — Nhập tệp (đúng cửa Mở tệp
             * sẵn có, qua `toolbarRef`) · Dàn từ mẫu (mở panel Thiết kế) · Trang trống (vào
             * thẳng). THAY cho M-EMPTY-2 cũ (2 lối) — "Tạo từ ảnh đã dựng" giữ nguyên năng lực,
             * hạ xuống thành lối phụ bên dưới (không xoá, chỉ đổi bậc — CLAUDE.md luật 4).
             * MARKER: TaskFirstStart. */
            <div style={{ textAlign: 'center', color: 'var(--t4)', maxWidth: 460 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 2, lineHeight: 1.5 }}>
                {trEmpty('Bắt đầu hồ sơ trình khách', 'Start a client presentation')}
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 18, color: 'var(--t2)' }}>
                {trEmpty(
                  'Chọn một lối để bắt đầu — có thể đổi ý bất cứ lúc nào.',
                  'Pick a way to start — you can change your mind any time.',
                )}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <TaskFirstBtn
                  icon={<FileUp size={18} />}
                  label={trEmpty('Nhập tệp', 'Import a file')}
                  sub={trEmpty('PDF · PPTX · ảnh', 'PDF · PPTX · image')}
                  primary
                  onClick={onTaskFirstImport}
                />
                <TaskFirstBtn
                  icon={<LayoutTemplate size={18} />}
                  label={trEmpty('Dàn từ mẫu', 'Start from a template')}
                  sub={trEmpty('Mở kệ Thiết kế', 'Open the Design shelf')}
                  onClick={onTaskFirstFromTemplate}
                />
                <TaskFirstBtn
                  icon={<FilePlus2 size={18} />}
                  label={trEmpty('Trang trống', 'Blank page')}
                  sub={trEmpty('Tự dàn từ đầu', 'Start from scratch')}
                  onClick={onTaskFirstBlank}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={onAddSlidesFromRenders}
                  disabled={builtImages.length === 0}
                  title={
                    builtImages.length === 0
                      ? trEmpty('Chưa có ảnh nào từ chặng Thiết kế 3D', 'No renders from the 3D stage yet')
                      : undefined
                  }
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent',
                    color: builtImages.length === 0 ? 'var(--t4)' : 'var(--accent)', fontSize: 12, fontWeight: 600,
                    cursor: builtImages.length === 0 ? 'not-allowed' : 'pointer', opacity: builtImages.length === 0 ? 0.6 : 1,
                  }}
                >
                  <Sparkles size={13} />
                  {trEmpty('Hoặc tạo từ ảnh đã dựng', 'Or build from renders')}
                  {builtImages.length > 0 && ` (${builtImages.length})`}
                </button>
              </div>
            </div>
          ) : ed.slide ? (
            <EditorCanvas
              slide={ed.slide}
              widthPx={stageWidth}
              stage={stage}
              fonts={ed.deck.fonts}
              selectedIds={ed.selectedIds}
              onSelect={onSelectGroupAware}
              onToggleSelect={ed.toggleSelect}
              onSelectMany={ed.selectMany}
              onFrame={onFrame}
              onFrameMany={onFrameMany}
              onGroupResize={onGroupResize}
              onAltDrag={onAltDrag}
              onEditTextCommit={onEditTextCommit}
              onEditImage={(id) => setImageEditId(id)}
              onEditImageAdvanced={openAdvancedEditor}
              onMagicPerspective={onMagicPerspective}
              onReplaceImage={(id) => setReplaceDialogId(id)}
              onDropRefImage={onAddImageUrl}
              onDuplicate={onDuplicateSelected}
              onDelete={onDeleteSelected}
              onZOrder={onZOrder}
              onToggleLock={onToggleLockSelected}
              onGroup={onGroupSelected}
              onUngroup={onUngroupSelected}
              onUpdateText={onUpdateText}
              onUpdateShape={onUpdateShape}
              brand={ed.deck.brand}
              project={ed.deck.project}
              palette={ed.deck.palette}
              watermark={ed.deck.watermark}
            />
          ) : null}

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

        {/* phải: inspector "LỚP" (kéo dãn + ẩn/hiện) — ẨN khi slide trống, xem hasInspectorContent */}
        {inspectorOpen && hasInspectorContent ? (
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
                padding: 14,
                // L5 (phiếu 03/08 "panel phải bị cắt đáy"): đo thật thì aside ĐÃ `overflowY:auto`
                // và cuộn được (scrollHeight 395 > clientHeight 302) — cái thiếu là DẤU HIỆU còn
                // nội dung phía dưới: macOS ẩn thanh cuộn khi không rê chuột, nên dòng hướng dẫn
                // nằm dưới mép trông y như bị cắt cụt. Hai thứ sửa đúng bệnh đó:
                //  · `scrollbarGutter:stable` — chừa sẵn rãnh, nội dung không nhảy khi cuộn hiện.
                //  · bóng-cuộn: 2 lớp `local` (màu nền, trôi theo nội dung) che 2 lớp `scroll`
                //    (vệt mờ, đứng yên). Nội dung vừa khung → lớp local phủ kín, KHÔNG thấy vệt;
                //    còn nội dung → lớp local trôi đi, lộ vệt ở mép. Thuần CSS, không state.
                paddingBottom: 28,
                overflowY: 'auto',
                scrollbarGutter: 'stable',
                backgroundColor: 'var(--panel)',
                backgroundImage:
                  'linear-gradient(var(--panel) 40%, transparent), linear-gradient(transparent, var(--panel) 60%),' +
                  'radial-gradient(farthest-side at 50% 0, rgba(0,0,0,.16), transparent),' +
                  'radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,.16), transparent)',
                backgroundPosition: 'top, bottom, top, bottom',
                backgroundSize: '100% 22px, 100% 22px, 100% 9px, 100% 9px',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'local, local, scroll, scroll',
              }}
            >
              {ed.slide && (
                <Inspector
                  slide={ed.slide}
                  slideIndex={ed.currentSlide}
                  selected={ed.selected}
                  palette={palette}
                  deckFonts={ed.deck.fonts}
                  deckCustomFonts={ed.deck.customFonts}
                  onAddDeckFont={onAddDeckFont}
                  onUpdateSelected={ed.updateSelected}
                  onUpdateSlide={ed.updateSlide}
                  onZOrder={onZOrder}
                  onAlign={onAlign}
                  onAlignSelection={onAlignSelection}
                  onDistributeSelection={onDistributeSelection}
                  onDuplicate={onDuplicateSelected}
                  onDelete={onDeleteSelected}
                  onToggleLockSelected={onToggleLockSelected}
                  onGroup={onGroupSelected}
                  onUngroup={onUngroupSelected}
                  onOpenImageEditor={(id) => setImageEditId(id)}
                  onOpenAdvancedEditor={openAdvancedEditor}
                  linkedAssets={linkedAssets}
                  onCreateAsset={onCreateAsset}
                  onAttachAsset={onAttachAsset}
                  onDetachAsset={onDetachAsset}
                  onMagicPerspective={onMagicPerspective}
                  magicResult={magicResult}
                  onReceiveMagicResult={onReceiveMagicResult}
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

      {/* "Xem lưới" (Slide Sorter) — overlay bổ sung cho SlideStrip, xem toàn deck dạng lưới.
          AnimatePresence để lưới còn chạy được `exit` lúc đóng (trước đây tắt phựt). */}
      <AnimatePresence>
        {sorterOpen && (
          <SlideSorter
            deck={ed.deck}
            current={ed.currentSlide}
            onSelect={(i) => {
              ed.selectSlide(i);
              setSorterOpen(false);
            }}
            onAdd={onAddSlide}
            onDuplicate={onDuplicateSlide}
            onDelete={onDeleteSlide}
            onReorder={onReorderSlide}
            onClose={() => setSorterOpen(false)}
          />
        )}
      </AnimatePresence>

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

      {/* "Thay ảnh…" (VIỆC 2d, 28/07) — hộp thoại 2 lựa chọn từ menu chuột phải trên ảnh. */}
      {replaceDialogId && (
        <ReplaceImageDialog
          onClose={() => setReplaceDialogId(null)}
          onPickFromLibrary={() => {
            setReplaceTarget(replaceDialogId);
            setReplaceDialogId(null);
            setPanelOpen(true);
            setTab('reference');
          }}
          onPickFromDisk={(dataUrl) => {
            replaceImageSrc(replaceDialogId, dataUrl);
            setReplaceDialogId(null);
          }}
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

/** H4 (13/08) — 1 trong 3 lối to của TaskFirstStart (canvas trống, xem trên). `primary` = viền/
 * icon nhấn màu accent (dùng cho lối khớp việc Hoà đang gấp nhất — Nhập tệp), 2 lối còn lại
 * trung tính ngang hàng, KHÔNG xám/khoá — cả 3 luôn bấm được (khác "Tạo từ ảnh đã dựng" bên
 * dưới, có thể khoá vì phụ thuộc dữ liệu chặng 3D). */
function TaskFirstBtn({
  icon,
  label,
  sub,
  primary,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        width: 148,
        padding: '18px 14px',
        borderRadius: 'var(--r-3, 14px)',
        border: `1px solid ${primary ? 'var(--accent)' : 'var(--border)'}`,
        background: primary ? 'var(--accent-soft)' : 'var(--card)',
        color: primary ? 'var(--accent)' : 'var(--t1)',
        cursor: 'pointer',
      }}
    >
      {icon}
      <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
      <span style={{ fontSize: 10.5, color: 'var(--t4)', lineHeight: 1.3 }}>{sub}</span>
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
