'use client';

/**
 * components/cad/CadCanvas.tsx — CANVAS 2D tương tác của trình CAD.
 *
 * Vẽ bằng Canvas 2D (không SVG) để mượt với hàng nghìn entity. Vòng vẽ dùng
 * requestAnimationFrame, đọc doc/viewport từ useCadStore + trạng thái tương tác cục bộ (ref)
 * để KHÔNG re-render React mỗi lần rê chuột. Xử lý: pan/zoom, grid, vẽ các công cụ, snap,
 * chọn/quây khung, move/copy/rotate/mirror/offset, dimension, đặt block, dynamic input.
 *
 * SSR-safe: 'use client' + mọi truy cập window/document nằm trong effect/handler.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCadStore, toolHint } from '@/lib/cad/store';
import type { Tool } from '@/lib/cad/store';
import { useFlowStore } from '@/lib/store';
import type { Entity, Pt, Viewport, DimEntity, LineEntity, MarkupPin, PhotoEmbed, Box } from '@/lib/cad/model';
import { screenToWorld, worldToScreen, zoomAt, fitBox, docBox, dist, entityBox } from '@/lib/cad/model';
import { drawEntities, drawEntity } from '@/lib/cad/render';
import { createMarkupPin, createPhotoEmbed, nearestMarkup, nearestPhoto, formatMarkupTime } from '@/lib/cad/markup';
import { findSnap, hitTest, idsInRect, type SnapResult } from '@/lib/cad/query';
import { newId } from '@/lib/cad/store';
import {
  translateEntity,
  rotateEntity,
  mirrorEntity,
  offsetEntity,
  withNewId,
  circumcircle,
  arcFromCenterStartEnd,
} from '@/lib/cad/geometry';
import { wallChain, roomRect, parseCoordInput, resolveCoordInput } from '@/lib/cad/commands';
import { polygonVertices, ellipsePoints, catmullRomSpline, divideEntity, measureEntity } from '@/lib/cad/geometry';
import { loadManifest, insertBlockById } from '@/lib/cad/block-library';
import {
  trimEntity,
  extendEntity,
  filletTwoLines,
  chamferTwoLines,
  arrayRect,
  arrayPolar,
  scaleEntitiesAbout,
  stretchEntities,
  breakEntity,
  joinEntities,
  explodeEntity,
  lengthenLine,
  lengthenArc,
  infiniteLineIntersect,
} from '@/lib/cad/modify';
import { gripsOf, hitTestGrip, applyGripMove, type Grip } from '@/lib/cad/grips';
import { findHatchBoundary } from '@/lib/cad/hatch';
import { BLOCK_MAP } from '@/lib/cad/furniture';
import {
  autoSnapToWall,
  detectCollisions,
  blockWorldCorners,
  clearanceWorldPolygons,
} from '@/lib/cad/shape-interactions';
import { classifyWheel, findScrollableAncestor, normalizeWheelDelta } from '@/lib/input/wheel';
import { SHAPE_DND_MIME } from '@/components/ShapePalette';
import type { BlockEntity } from '@/lib/cad/model';

interface Ix {
  cursorScreen: Pt;
  cursorWorld: Pt;
  snap: SnapResult;
  pts: Pt[]; // click đã chốt cho thao tác hiện tại (world)
  dynBuf: string; // dynamic input độ dài
  panning: boolean;
  panStart: { screen: Pt; vp: Viewport } | null;
  spaceHeld: boolean;
  ortho: boolean;
  orthoLock: boolean;
  selDrag: { start: Pt; startScreen: Pt } | null; // world start cho rubber-band
  blockRot: number;
  redraw: boolean;
  // trạng thái 2-click cho FILLET/CHAMFER/JOIN + 1-click "chờ điểm 2" cho BREAK
  filletFirst: { id: string; pick: Pt } | null;
  chamferFirst: { id: string; pick: Pt } | null;
  joinFirst: string | null;
  breakTarget: { id: string; p1: Pt } | null;
  // Nấc 2 — grips: kéo trực tiếp điểm neo của entity đang chọn (chỉ khi chọn đúng 1)
  gripDrag: { entityId: string; grip: Grip } | null;
  gripPreview: Entity | null;
  // Nấc 3 — dimension: dim gần nhất tạo ra (cho DCO/DBA nối chuỗi) + đường 1 đang chờ cho DAN
  lastDim: DimEntity | null;
  angularFirst: LineEntity | null;
  // Việc 3 — lặp lệnh: lệnh/tool "thật" vừa phát (không tính select/pan)
  lastTool: Tool | null;
  // Việc 3 — phân biệt Space TAP nhanh (lặp lệnh) với Space GIỮ để pan
  spaceDownAt: number;
  spaceDidPan: boolean;
  // Việc 4 — Dynamic Input heads-up cạnh con trỏ (F12 bật/tắt, mặc định bật)
  hud: boolean;
  // Cảm ứng — pinch-zoom/pan 2 ngón: theo dõi MỌI pointer đang active (không chỉ touch, để
  // logic dọn dẹp trên up/cancel đơn giản — nhưng chỉ pointer type 'touch' mới tính vào pinch).
  pointers: Map<number, { x: number; y: number; type: string }>;
  // non-null khi ĐANG có gesture pinch 2 ngón chạy; startDist/startScale chốt lúc bắt đầu để tính
  // tỉ lệ zoom so với GESTURE START (không phải incremental) — tránh trôi dạt tích luỹ sai số.
  pinch: { startDist: number; startScale: number; lastMid: Pt } | null;
  // Cảm ứng — cờ "pointer gần nhất là ngón tay" cập nhật ở pointerdown/up, dùng để quyết định
  // hiện nút Xoá nổi (thiết bị không có bàn phím vật lý thì không dùng được phím Delete/Backspace).
  lastPointerWasTouch: boolean;
}

function css(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

/** Sprint 7 — bán kính bắt (px màn hình, KHÔNG scale theo zoom) cho ghim markup/thumbnail ảnh —
 * cả 2 vẽ ở kích thước cố định trên màn nên hitTest cũng phải cố định px, khác tolMm() (world). */
const PIN_HIT_PX = 16;
/** Kích thước thumbnail ảnh trên canvas (px màn hình, cố định). */
const PHOTO_THUMB_PX = 44;

/** Đặt 1 block thư viện DXF tại điểm click — async (manifest + file DXF cache theo phiên trang). */
function placeLibraryBlock(id: string, at: Pt, rot: number, layer: string) {
  void (async () => {
    const st = useCadStore.getState();
    try {
      const manifest = await loadManifest();
      const ents = await insertBlockById(manifest, id, at, { rot, layer });
      st.addEntities(ents);
      st.setStatus(`Đã đặt block thư viện (${ents.length} entity) — R xoay 90° trước khi đặt tiếp.`);
    } catch (err) {
      st.setStatus(`Lỗi đặt block thư viện: ${err instanceof Error ? err.message : String(err)}`);
    }
  })();
}

export default function CadCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Sprint 7 — Việc 4: ảnh đang xem full-size (lightbox) — state React thật (hiếm đổi, click-only)
  // khác mọi state tương tác khác của canvas vốn cố tình ở ref để không re-render mỗi rê chuột.
  const [viewPhoto, setViewPhoto] = useState<PhotoEmbed | null>(null);
  // cache <img> đã load theo src — vẽ thumbnail cần element ảnh thật cho ctx.drawImage; đang tải
  // thì vẽ khung placeholder, load xong bật lại redraw (không polling, chỉ trigger đúng 1 lần/ảnh).
  const photoImgCache = useRef<Map<string, HTMLImageElement | 'loading' | 'error'>>(new Map());
  // Room tool — ô nhập tên phòng inline, thay window.prompt (chặn thread JS, treo ứng dụng
  // trong webview nhúng — cùng lớp bug đã sửa ở Dashboard "Đặt tên dự án", xem components/Dashboard.tsx).
  // Chốt 2 điểm góc xong lưu tạm ở đây thay vì addEntity ngay, hỏi tên xong mới addEntity.
  const [roomNamePrompt, setRoomNamePrompt] = useState<{ p0: Pt; p1: Pt; screenAt: Pt } | null>(null);
  const [roomNameValue, setRoomNameValue] = useState('PHÒNG');
  // Batch 19/07 — thay TOÀN BỘ window.prompt/confirm còn lại bằng UI nổi non-blocking (cùng lớp
  // bug room tool ở trên: native dialog chặn thread JS, treo webview nhúng + treo automation).
  // 1 form dùng chung 1-N field (Text/Markup 1 field; Array rect 4 field; Array polar 2; Scale/
  // Divide 1) + 1 hộp xác nhận dùng chung (xoá markup pin). Semantics giữ NGUYÊN dialog cũ:
  // Enter/✓ = OK (giá trị được validate y hệt sau-prompt cũ), Escape/✕ = Cancel (như prompt trả
  // null / confirm trả false → KHÔNG làm gì).
  const [inlineForm, setInlineForm] = useState<{
    title: string;
    fields: { label: string; value: string }[];
    screenAt: Pt;
    onCommit: (values: string[]) => void;
  } | null>(null);
  const [inlineConfirm, setInlineConfirm] = useState<{
    message: string;
    screenAt: Pt;
    okLabel: string;
    onConfirm: () => void;
  } | null>(null);
  // Lightbox ảnh hiện trường — bước xác nhận "Gỡ ảnh" inline (thay window.confirm).
  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);
  useEffect(() => setConfirmRemovePhoto(false), [viewPhoto]);

  // Cảm ứng — nút Xoá nổi: chỉ cần re-render khi selection/tool đổi (selector zustand, KHÔNG
  // đọc viewport ở đây — viewport đổi liên tục lúc pan/zoom và được xử lý riêng, imperative,
  // trong draw()/updateDeleteFabPosition() để không ép React re-render mỗi frame pan/zoom).
  const selection = useCadStore((s) => s.selection);
  const cadTool = useCadStore((s) => s.tool);
  // cập nhật ở pointerdown/up (KHÔNG ở pointermove — tần suất cao, tránh re-render mỗi lần rê
  // chuột/ngón tay, đúng tinh thần kiến trúc file này: React state chỉ đổi khi cần hiện UI).
  const [isTouchInput, setIsTouchInput] = useState(false);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const showDeleteFab = cadTool === 'select' && selection.length > 0 && isTouchInput;
  // draw() (vòng rAF) mới là nơi cập nhật vị trí nút mỗi frame (xem updateDeleteFabPosition) —
  // NHƯNG nút chỉ mount vào DOM sau khi React commit (sau khi rAF-tick hiện tại đã trôi qua nếu
  // ref còn null lúc đó), nên có thể "trễ 1 nhịp" và tạm nằm ở vị trí fallback cho tới lần redraw
  // kế tiếp — nhất là khi rAF không chạy liên tục (tab nền/công cụ tự động hoá). Đặt vị trí ĐÚNG
  // ngay khi nút vừa hiện (trước khi trình duyệt paint) để không có 1 frame nào lộ vị trí sai.
  useLayoutEffect(() => {
    if (!showDeleteFab) return;
    const st = useCadStore.getState();
    const { W, H } = screenSize();
    updateDeleteFabPosition(st, st.viewport, W, H);
  }, [showDeleteFab]);
  // autoFocus không ăn ổn định khi form mount NGAY trong pointerdown trên canvas (thứ tự
  // focus()/blur mặc định của browser trong cùng cú click không đảm bảo — quan sát được focus
  // rơi về body/ô lệnh) → effect tự focus field đầu sau khi form mở. Guard "focus đã nằm TRONG
  // panel" để KHÔNG cướp focus mỗi keystroke (mỗi onChange đổi state inlineForm → effect chạy lại).
  const inlineFormPanelRef = useRef<HTMLDivElement>(null);
  const inlineFormFirstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inlineForm && !inlineFormPanelRef.current?.contains(document.activeElement)) {
      inlineFormFirstInputRef.current?.focus();
    }
  }, [inlineForm]);
  const inlineConfirmOkRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (inlineConfirm) inlineConfirmOkRef.current?.focus();
  }, [inlineConfirm]);
  const ix = useRef<Ix>({
    cursorScreen: { x: 0, y: 0 },
    cursorWorld: { x: 0, y: 0 },
    snap: { pt: { x: 0, y: 0 }, type: 'none' },
    pts: [],
    dynBuf: '',
    panning: false,
    panStart: null,
    spaceHeld: false,
    ortho: false,
    orthoLock: false,
    selDrag: null,
    blockRot: 0,
    redraw: true,
    filletFirst: null,
    chamferFirst: null,
    joinFirst: null,
    breakTarget: null,
    gripDrag: null,
    gripPreview: null,
    lastDim: null,
    angularFirst: null,
    lastTool: null,
    spaceDownAt: 0,
    spaceDidPan: false,
    hud: true,
    pointers: new Map(),
    pinch: null,
    lastPointerWasTouch: false,
  });

  // ── vòng vẽ rAF ──
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (ix.current.redraw) {
        draw();
        ix.current.redraw = false;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // redraw khi store đổi (doc / viewport / selection / tool)
  useEffect(() => {
    const unsub = useCadStore.subscribe(() => {
      ix.current.redraw = true;
    });
    return unsub;
  }, []);

  // Việc 3 — ghi nhớ lệnh/tool "thật" vừa phát để lặp lại (Space tap / chuột phải khi rảnh).
  // Bỏ qua 'select' và 'pan' (đó là trạng thái nghỉ, không phải lệnh cần lặp).
  useEffect(() => {
    let prev = useCadStore.getState().tool;
    const unsub = useCadStore.subscribe((s) => {
      if (s.tool !== prev) {
        prev = s.tool;
        if (s.tool !== 'select' && s.tool !== 'pan') ix.current.lastTool = s.tool;
      }
    });
    return unsub;
  }, []);

  // Canvas vẽ bằng màu đọc trực tiếp từ CSS var (--bg/--t1/...) mỗi lần draw(), nhưng
  // useCadStore.subscribe ở trên không bắt được đổi theme (sống ở useFlowStore khác store)
  // → bấm sáng/tối không tự vẽ lại, phải đợi thao tác khác (pan/zoom/vẽ) mới cập nhật màu.
  // Theo dõi appliedTheme để ép vẽ lại ngay khi đổi giao diện.
  const appliedTheme = useFlowStore((s) => s.appliedTheme);
  useEffect(() => {
    ix.current.redraw = true;
  }, [appliedTheme]);

  // resize canvas theo khung + DPR
  useEffect(() => {
    const onResize = () => {
      const c = canvasRef.current;
      const wrap = wrapRef.current;
      if (!c || !wrap) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      c.width = Math.max(1, Math.floor(r.width * dpr));
      c.height = Math.max(1, Math.floor(r.height * dpr));
      c.style.width = `${r.width}px`;
      c.style.height = `${r.height}px`;
      ix.current.redraw = true;
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // events từ toolbar: zoom-extents / export-png / to-render lo ở CadEditor,
  // riêng zoom-extents cần kích thước canvas nên xử lý ở đây.
  useEffect(() => {
    const onExtents = () => zoomExtents();
    window.addEventListener('cad:zoom-extents', onExtents);
    return () => window.removeEventListener('cad:zoom-extents', onExtents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // panel "Kiểm chuẩn" (standards checker) — click 1 violation để zoom tới vị trí (world mm).
  useEffect(() => {
    const onZoomTo = (ev: Event) => {
      const detail = (ev as CustomEvent<{ x: number; y: number }>).detail;
      if (!detail) return;
      const st = useCadStore.getState();
      const { W, H } = screenSize();
      st.setViewport({ scale: Math.max(st.viewport.scale, 0.15), panX: W / 2 - detail.x * Math.max(st.viewport.scale, 0.15), panY: H / 2 + detail.y * Math.max(st.viewport.scale, 0.15) });
      ix.current.redraw = true;
    };
    window.addEventListener('cad:zoom-to', onZoomTo);
    return () => window.removeEventListener('cad:zoom-to', onZoomTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function screenSize() {
    const c = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return { W: (c?.width ?? 1) / dpr, H: (c?.height ?? 1) / dpr, dpr };
  }

  function zoomExtents() {
    const { doc, setViewport } = useCadStore.getState();
    const { W, H } = screenSize();
    const box = docBox(doc);
    if (box) setViewport(fitBox(box, W, H, 80));
    ix.current.redraw = true;
  }

  // tolerance px → mm
  function tolMm() {
    return 10 / useCadStore.getState().viewport.scale;
  }

  /** Áp ràng buộc hướng (ortho ưu tiên nhất, rồi polar tracking) lên vector (dx,dy). Ortho khoá
   * trục 90° tuyệt đối (giữ trục lớn hơn). Polar tracking bắt vào bội số `polarStep` độ CHỈ khi
   * cách góc đó trong dung sai (giống "aperture" của AutoCAD) — ngoài dung sai thì tự do. */
  function applyDirectionConstraint(dx: number, dy: number): { dx: number; dy: number } {
    if (ix.current.ortho) {
      return Math.abs(dx) >= Math.abs(dy) ? { dx, dy: 0 } : { dx: 0, dy };
    }
    const st = useCadStore.getState();
    if (st.polarTracking && (dx !== 0 || dy !== 0)) {
      const d = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      const stepRad = (st.polarStep * Math.PI) / 180;
      const nearest = Math.round(ang / stepRad) * stepRad;
      const deltaDeg = Math.abs(((ang - nearest) * 180) / Math.PI);
      if (deltaDeg <= 4) return { dx: Math.cos(nearest) * d, dy: Math.sin(nearest) * d };
    }
    return { dx, dy };
  }

  /** điểm hiệu dụng (snap + ortho/polar tracking + dynamic) so với base point (nếu có).
   * Việc 1 (Sprint 10) — nếu dynBuf đang gõ khớp định dạng toạ độ AutoCAD ("X,Y" tuyệt đối hoặc
   * "@dx,dy" tương đối so `base`), ƯU TIÊN toạ độ đó hơn cách "độ dài theo hướng con trỏ" cũ —
   * "X,Y" hoạt động NGAY CẢ khi chưa có base (điểm đầu tiên của lệnh). "@dx,dy" cần base, không
   * có thì bỏ qua (coi như chưa gõ gì, rơi về logic cũ bên dưới). */
  function effectivePoint(base?: Pt): Pt {
    let p = ix.current.snap.pt;
    if (ix.current.dynBuf) {
      const coord = parseCoordInput(ix.current.dynBuf);
      if (coord) {
        const resolved = resolveCoordInput(coord, base);
        if (resolved) return resolved;
      }
    }
    if (base) {
      // dynamic input: độ dài theo hướng con trỏ (số đơn, không dấu phẩy — VD "500"). BUG Sprint
      // 10 phát hiện + sửa: nếu con trỏ CHƯA di chuyển khỏi `base` (VD vừa click đặt tâm Circle
      // rồi gõ số ngay, không rê chuột) thì (dx0,dy0)=(0,0) — hướng suy biến, "|| 1" cũ chỉ chặn
      // chia 0 chứ KHÔNG khôi phục hướng, khiến điểm ra = chính `base` → bán kính/độ dài luôn = 0.
      // Fallback hướng mặc định Đông (1,0) khi con trỏ trùng base — magnitude vẫn đúng như đã gõ.
      if (ix.current.dynBuf) {
        const len = parseFloat(ix.current.dynBuf);
        if (Number.isFinite(len)) {
          const dx0 = ix.current.cursorWorld.x - base.x;
          const dy0 = ix.current.cursorWorld.y - base.y;
          const hasDir = dx0 !== 0 || dy0 !== 0;
          const { dx, dy } = applyDirectionConstraint(hasDir ? dx0 : 1, hasDir ? dy0 : 0);
          const d = Math.hypot(dx, dy) || 1;
          p = { x: base.x + (dx / d) * len, y: base.y + (dy / d) * len };
          return p;
        }
      }
      const { dx, dy } = applyDirectionConstraint(p.x - base.x, p.y - base.y);
      p = { x: base.x + dx, y: base.y + dy };
    }
    return p;
  }

  /* ───────── pointer ───────── */
  function toLocal(e: PointerEvent | WheelEvent): Pt {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function updateCursor(screen: Pt) {
    const st = useCadStore.getState();
    ix.current.cursorScreen = screen;
    ix.current.cursorWorld = screenToWorld(st.viewport, screen);
    const from = ix.current.pts[ix.current.pts.length - 1]; // điểm gốc lệnh hiện tại (nếu có) — cho perpendicular/tangent
    ix.current.snap = findSnap(st.doc, ix.current.cursorWorld, tolMm(), st.gridStep, st.snap, from);
    ix.current.redraw = true;
  }

  const onPointerDown = (ev: React.PointerEvent) => {
    const e = ev.nativeEvent;
    // setPointerCapture có thể throw DOMException "No active pointer" (vd pointerId không còn
    // hợp lệ khi đầu vào tổng hợp/tự động hoá) — bọc try/catch để không chặn luôn thao tác vẽ
    // phía sau (bắt điểm/handleClick) chỉ vì capture thất bại, không ảnh hưởng hành vi chuột thật.
    try {
      (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
    } catch {
      /* bỏ qua — không phải lỗi nghiêm trọng */
    }
    const screen = toLocal(e);
    updateCursor(screen);
    const st = useCadStore.getState();

    // Cảm ứng — theo dõi MỌI pointer đang active (map theo pointerId) để phát hiện gesture 2 ngón.
    ix.current.lastPointerWasTouch = ev.pointerType === 'touch';
    setIsTouchInput(ev.pointerType === 'touch');
    ix.current.pointers.set(ev.pointerId, { x: screen.x, y: screen.y, type: ev.pointerType });
    if (ev.pointerType === 'touch') {
      const touchPts = [...ix.current.pointers.values()].filter((p) => p.type === 'touch');
      if (!ix.current.pinch && touchPts.length === 2) {
        // Đúng 2 ngón chạm cùng lúc → bắt đầu pinch-zoom/pan, HUỶ mọi trạng thái đơn-pointer mà
        // ngón đầu tiên có thể đã lỡ khởi tạo (quây khung chọn / kéo grip / pan) để không xung
        // đột với gesture 2 ngón sắp chạy. (Giới hạn đã biết: nếu ngón đầu rơi đúng vào 1 điểm vẽ
        // của lệnh đang chạy — vd Line/Polyline — điểm đó đã được chốt trước khi ngón 2 chạm tới,
        // pinch không thể "undo" lại điểm đó; nằm ngoài phạm vi việc này, ghi vào báo cáo.)
        ix.current.selDrag = null;
        ix.current.gripDrag = null;
        ix.current.gripPreview = null;
        ix.current.panning = false;
        ix.current.panStart = null;
        const [p1, p2] = touchPts;
        ix.current.pinch = {
          startDist: Math.max(1, dist(p1, p2)),
          startScale: st.viewport.scale,
          lastMid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
        };
        ix.current.redraw = true;
        return;
      }
      if (ix.current.pinch) {
        // Đã có pinch chạy (vd ngón thứ 3 chạm thêm) — bỏ qua, KHÔNG phá gesture 2 ngón gốc.
        return;
      }
    }

    // pan: chuột giữa, hoặc space, hoặc tool pan
    if (e.button === 1 || ix.current.spaceHeld || st.tool === 'pan') {
      ix.current.panning = true;
      ix.current.panStart = { screen, vp: st.viewport };
      if (ix.current.spaceHeld) ix.current.spaceDidPan = true; // Việc 3: đã dùng Space để pan → không lặp lệnh
      return;
    }
    // chuột PHẢI = Enter/kết thúc lệnh (thói quen AutoCAD): chốt polyline/wall/tham số đang gõ.
    // Việc 3: nếu KHÔNG có gì để chốt (đang rảnh) → chuột phải = lặp lệnh vừa dùng.
    if (e.button === 2) {
      if (isIdle()) repeatLastCommand();
      else commitEnter(ev.shiftKey);
      ix.current.redraw = true;
      return;
    }
    if (e.button !== 0) return;

    if (st.tool === 'select') {
      // Sprint 7 — Việc 3/4: ghim markup/ảnh KHÔNG phải entity nên không vào hitTest/selection
      // thường — kiểm riêng TRƯỚC, ưu tiên hơn chọn hình học (pin luôn ở trên cùng, nhỏ, dễ bắn
      // trượt). Ảnh: click mở lightbox xem full-size. Markup: click hỏi xoá (annotation của
      // user tự thêm — xoá không cần snapshot cảnh báo phức tạp, hộp xác nhận nổi là đủ).
      const photoHit = nearestPhoto((st.doc.photos ?? []).map((p) => ({ ...p, at: worldToScreen(st.viewport, p.at) })), screen, PIN_HIT_PX);
      if (photoHit) {
        const real = (st.doc.photos ?? []).find((p) => p.id === photoHit.id) ?? null;
        setViewPhoto(real);
        return;
      }
      const markupHit = nearestMarkup((st.doc.markups ?? []).map((m) => ({ ...m, at: worldToScreen(st.viewport, m.at) })), screen, PIN_HIT_PX);
      if (markupHit) {
        const real = (st.doc.markups ?? []).find((m) => m.id === markupHit.id);
        if (real) {
          // Hộp xác nhận nổi thay window.confirm (chặn thread JS, treo webview nhúng).
          setInlineConfirm({
            message: `Xoá ghim markup này? — "${real.text}"`,
            screenAt: { ...screen },
            okLabel: 'Xoá',
            onConfirm: () => {
              const s2 = useCadStore.getState();
              s2.removeMarkup(real.id);
              s2.setStatus('Đã xoá ghim markup.');
            },
          });
        }
        return;
      }
      // grip: nếu đang chọn ĐÚNG 1 entity, ưu tiên bắt grip trước khi quây khung
      if (st.selection.length === 1) {
        const ent = st.doc.entities.find((en) => en.id === st.selection[0]);
        if (ent) {
          const g = hitTestGrip(gripsOf(ent), ix.current.cursorWorld, tolMm());
          if (g) {
            ix.current.gripDrag = { entityId: ent.id, grip: g };
            ix.current.gripPreview = ent;
            return;
          }
        }
      }
      // bắt đầu khả năng quây khung
      ix.current.selDrag = { start: ix.current.cursorWorld, startScreen: screen };
      return;
    }
    handleClick(effectivePoint(ix.current.pts[ix.current.pts.length - 1]), ev.shiftKey);
  };

  const onPointerMove = (ev: React.PointerEvent) => {
    const e = ev.nativeEvent;
    ix.current.ortho = ev.shiftKey || ix.current.orthoLock;
    const screen = toLocal(e);
    if (ix.current.pointers.has(ev.pointerId)) {
      ix.current.pointers.set(ev.pointerId, { x: screen.x, y: screen.y, type: ev.pointerType });
    }
    // Cảm ứng — 2 ngón đang active + gesture pinch đã bắt đầu → tính zoom (so với khoảng cách
    // LÚC BẮT ĐẦU gesture, tránh trôi dạt) + pan (theo dịch chuyển điểm giữa 2 ngón so với lần
    // move trước), rồi trả sớm — KHÔNG chạy tiếp logic pan/vẽ/chọn 1-pointer bên dưới.
    if (ix.current.pinch) {
      const touchPts = [...ix.current.pointers.values()].filter((p) => p.type === 'touch');
      if (touchPts.length >= 2) {
        const [p1, p2] = touchPts;
        const newMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const newDist = Math.max(1, dist(p1, p2));
        const pinch = ix.current.pinch;
        const stNow = useCadStore.getState();
        // (1) pan: dịch view đúng bằng chuyển động của điểm giữa 2 ngón kể từ lần move trước —
        // giữ nguyên cơ chế pan đã có (cộng thẳng vào panX/panY, giống nhánh panning ở trên).
        const panned: Viewport = {
          ...stNow.viewport,
          panX: stNow.viewport.panX + (newMid.x - pinch.lastMid.x),
          panY: stNow.viewport.panY + (newMid.y - pinch.lastMid.y),
        };
        // (2) zoom: tỉ lệ so với LÚC BẮT ĐẦU gesture (startDist/startScale), tâm ĐÚNG tại điểm
        // giữa 2 ngón hiện tại — tái dùng zoomAt() sẵn có (cơ chế zoom duy nhất trong file), chỉ
        // truyền factor tương đối so với scale sau bước pan ở trên.
        const targetScale = pinch.startScale * (newDist / pinch.startDist);
        const zoomed = zoomAt(panned, newMid, targetScale / panned.scale);
        stNow.setViewport(zoomed);
        pinch.lastMid = newMid;
        ix.current.redraw = true;
        return;
      }
    }
    if (ix.current.panning && ix.current.panStart) {
      const { screen: s0, vp } = ix.current.panStart;
      useCadStore.getState().setViewport({ ...vp, panX: vp.panX + (screen.x - s0.x), panY: vp.panY + (screen.y - s0.y) });
      ix.current.redraw = true;
      return;
    }
    updateCursor(screen);
    if (ix.current.gripDrag) {
      const st = useCadStore.getState();
      const ent = st.doc.entities.find((en) => en.id === ix.current.gripDrag!.entityId);
      if (ent) {
        ix.current.gripPreview = applyGripMove(ent, ix.current.gripDrag.grip, ix.current.snap.pt);
        ix.current.redraw = true;
      }
    }
  };

  const onPointerUp = (ev: React.PointerEvent) => {
    const st = useCadStore.getState();
    ix.current.lastPointerWasTouch = ev.pointerType === 'touch';
    setIsTouchInput(ev.pointerType === 'touch');
    ix.current.pointers.delete(ev.pointerId);
    if (ix.current.pinch) {
      // Số pointer touch đổi từ 2 xuống 1/0 (nhấc 1 hoặc cả 2 ngón) → thoát pinch, quay lại xử lý
      // pointer đơn bình thường. Pointerup của MỘT trong 2 ngón pinch không được rơi vào logic
      // select/pan bên dưới (selDrag/gripDrag/panning đã bị huỷ lúc bắt đầu pinch nên vốn dĩ
      // cũng vô hại, nhưng return sớm cho rõ ràng + tránh phụ thuộc ẩn vào thứ tự dọn state).
      const touchLeft = [...ix.current.pointers.values()].filter((p) => p.type === 'touch').length;
      if (touchLeft < 2) ix.current.pinch = null;
      ix.current.redraw = true;
      return;
    }
    if (ix.current.panning) {
      ix.current.panning = false;
      ix.current.panStart = null;
      return;
    }
    if (ix.current.gripDrag) {
      const ent = st.doc.entities.find((en) => en.id === ix.current.gripDrag!.entityId);
      if (ent) {
        const final = applyGripMove(ent, ix.current.gripDrag.grip, ix.current.snap.pt);
        st.updateEntities([final]);
      }
      ix.current.gripDrag = null;
      ix.current.gripPreview = null;
      ix.current.redraw = true;
      return;
    }
    // hoàn tất chọn
    if (st.tool === 'select' && ix.current.selDrag) {
      const moved = dist(ix.current.selDrag.startScreen, ix.current.cursorScreen) > 4;
      if (moved) {
        const a = ix.current.selDrag.start;
        const b = ix.current.cursorWorld;
        // ĐÚNG chuẩn AutoCAD: kéo TRÁI→PHẢI = window (chỉ bắt đối tượng nằm GỌN trong khung);
        // kéo PHẢI→TRÁI = crossing (bắt cả đối tượng CHẠM khung).
        const windowMode = b.x > a.x;
        const ids = idsInRect(st.doc, a, b, windowMode);
        st.select(ids, ev.shiftKey);
      } else {
        const id = hitTest(st.doc, ix.current.cursorWorld, tolMm());
        st.select(id ? [id] : [], ev.shiftKey);
      }
      ix.current.selDrag = null;
      ix.current.redraw = true;
    }
  };

  /** pointercancel (OS ngắt gesture giữa chừng — vd hệ thống chen ngang, cuộn trang, cảnh báo…):
   * dọn sạch MỌI trạng thái tương tác ephemeral để không kẹt UI (khác onPointerUp — không giả
   * định gesture kết thúc "sạch", nên reset rộng tay hơn thay vì chỉ xử lý đúng nhánh đang chạy). */
  const onPointerCancel = (ev: React.PointerEvent) => {
    ix.current.pointers.delete(ev.pointerId);
    const touchLeft = [...ix.current.pointers.values()].filter((p) => p.type === 'touch').length;
    if (touchLeft < 2) ix.current.pinch = null;
    ix.current.panning = false;
    ix.current.panStart = null;
    ix.current.selDrag = null;
    ix.current.gripDrag = null;
    ix.current.gripPreview = null;
    ix.current.redraw = true;
  };

  /* Cuộn/zoom — xem `lib/input/wheel.ts` để biết vì sao phải phân loại thiết bị.
   *
   * Gắn listener NATIVE với `{ passive: false }` chứ KHÔNG dùng `onWheel` của React: từ React 17
   * handler wheel được đăng ký ở chế độ passive, `preventDefault()` bên trong sẽ bị bỏ qua ⇒ trang
   * vẫn cuộn / trình duyệt vẫn zoom / trackpad vẫn kích hoạt vuốt-lùi (back-swipe).
   *
   * Gắn ở phần tử CHA của wrapper (vùng canvas của CadEditor) với `capture: true` để bắt được cả
   * cú cuộn rơi trên các lớp nổi bên trên canvas — chính là thanh công cụ pill từng nuốt cuộn ở
   * mode Pro. `findScrollableAncestor` lo phần "nhường cho panel/pill khi chúng cuộn được thật". */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const root = wrap.parentElement ?? wrap;

    function onWheelNative(e: WheelEvent) {
      const st = useCadStore.getState();
      const { dx, dy } = normalizeWheelDelta(e);
      // Con trỏ đang trên panel Lớp/Nội thất (cuộn dọc) hay pill đang vuốt ngang ⇒ nhường.
      if (findScrollableAncestor(e.target as Element, dx, dy, root)) return;

      e.preventDefault();
      const screen = toLocal(e);
      const intent = classifyWheel(e);
      if (intent.kind === 'zoom') {
        st.setViewport(zoomAt(st.viewport, screen, intent.factor));
      } else {
        // pan: `panX/panY` là vị trí px của gốc world trên canvas ⇒ trừ delta để nội dung đi theo
        // chiều cuộn (cuộn xuống = nhìn xuống dưới bản vẽ).
        st.setViewport({ ...st.viewport, panX: st.viewport.panX - intent.dx, panY: st.viewport.panY - intent.dy });
      }
      updateCursor(screen);
    }

    root.addEventListener('wheel', onWheelNative, { passive: false, capture: true });
    return () => root.removeEventListener('wheel', onWheelNative, { capture: true });
  }, []);

  /** B2.1 — thả 1 item kéo từ ShapePalette vào canvas: tạo BlockEntity tại điểm thả, tự áp
   * auto-snap-to-wall (B2.2) nếu BlockDef có anchors và có tường gần đó. */
  const onDragOver = (ev: React.DragEvent) => {
    if (ev.dataTransfer.types.includes(SHAPE_DND_MIME)) {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'copy';
    }
  };
  const onDrop = (ev: React.DragEvent) => {
    const blockId = ev.dataTransfer.getData(SHAPE_DND_MIME);
    if (!blockId || !BLOCK_MAP[blockId]) return;
    ev.preventDefault();
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const screen: Pt = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    const st = useCadStore.getState();
    const world = screenToWorld(st.viewport, screen);
    let entity: BlockEntity = {
      id: newId('e'), type: 'block', layer: st.currentLayer, block: blockId, at: world, rot: 0, sx: 1, sy: 1,
    };
    entity = autoSnapToWall(entity, st.doc);
    st.addEntity(entity);
    st.setStatus(`Đã thả "${BLOCK_MAP[blockId].name}" — kéo từ palette (R xoay 90° nếu vừa đặt lại bằng lệnh D/WIN).`);
    ix.current.redraw = true;
  };

  const onDblClick = () => {
    const st = useCadStore.getState();
    if (st.tool === 'polyline' && ix.current.pts.length >= 2) finishPolyline(false);
    else if (st.tool === 'wall' && ix.current.pts.length >= 2) finishWall(false);
    else if (st.tool === 'spline' && ix.current.pts.length >= 2) finishSpline(false);
  };

  /** Room tool — chốt ô nhập tên inline (thay window.prompt). Giữ ĐÚNG hành vi cũ: tên rỗng
   * (Enter/Xác nhận không gõ gì, hoặc bấm Huỷ) vẫn tạo phòng, chỉ rơi về tên mặc định 'PHÒNG'
   * — y hệt window.prompt cũ (Cancel trả null → name || 'PHÒNG' cũng ra 'PHÒNG'). */
  function confirmRoomName(nameOverride?: string) {
    if (!roomNamePrompt) return;
    const st = useCadStore.getState();
    const name = (nameOverride ?? roomNameValue).trim();
    const textLayer = st.doc.layers.find((l) => l.name === 'Ghi chú')?.id ?? st.currentLayer;
    const { entities } = roomRect(roomNamePrompt.p0, roomNamePrompt.p1, st.wallThickness, name || 'PHÒNG', st.currentLayer, textLayer);
    st.addEntities(entities);
    setRoomNamePrompt(null);
    ix.current.redraw = true;
  }
  function cancelRoomName() {
    // Cancel = tạo phòng với tên mặc định 'PHÒNG', BỎ QUA chữ đang gõ dở — đúng hành vi
    // window.prompt cũ (bấm Cancel trả null, không trả text đang gõ dở trong ô).
    confirmRoomName('');
  }

  /** Form nổi dùng chung — Enter/✓ chốt: đóng form rồi chạy onCommit với giá trị các field
   * (validate nằm TRONG từng onCommit, y hệt code sau-window.prompt cũ). */
  function commitInlineForm() {
    if (!inlineForm) return;
    const values = inlineForm.fields.map((f) => f.value);
    setInlineForm(null);
    inlineForm.onCommit(values);
    ix.current.redraw = true;
  }
  /** Escape/✕ = Cancel — như window.prompt trả null: KHÔNG làm gì (khác cancelRoomName ở trên
   * vốn phải tạo phòng tên mặc định vì đó là semantics riêng của room tool cũ). */
  function cancelInlineForm() {
    setInlineForm(null);
  }
  function commitInlineConfirm() {
    if (!inlineConfirm) return;
    setInlineConfirm(null);
    inlineConfirm.onConfirm();
    ix.current.redraw = true;
  }

  /**
   * commitEnter — hành vi "Enter/xác nhận" của CAD, dùng CHUNG cho phím Enter VÀ chuột phải
   * (thói quen AutoCAD: right-click = Enter/kết thúc lệnh). Chốt tham số fillet/chamfer/lengthen,
   * kết thúc break/polyline/wall, hoặc chốt điểm khi đang gõ dynamic input.
   */
  function commitEnter(shift: boolean) {
    const st = useCadStore.getState();
    // Việc 1.3 (Sprint 10) — Offset nhập số chính xác: gõ số + Enter đặt LẠI offsetDist (giống
    // hệt pattern fillet/chamfer/lengthen) thay vì cố commit thành 1 điểm click (không hợp lý
    // cho offset vì bước 2 là chọn PHÍA, không phải khoảng cách).
    if (ix.current.dynBuf && (st.tool === 'fillet' || st.tool === 'chamfer' || st.tool === 'lengthen' || st.tool === 'offset')) {
      const n = parseFloat(ix.current.dynBuf);
      if (Number.isFinite(n)) {
        if (st.tool === 'fillet') st.setFilletRadius(n);
        else if (st.tool === 'chamfer') st.setChamferDist(n, n);
        else if (st.tool === 'offset') st.setOffsetDist(n);
        else st.setLengthenDelta(n);
        st.setStatus(`Đã đặt tham số = ${n}mm.`);
      }
      ix.current.dynBuf = '';
      return;
    }
    if (st.tool === 'break' && ix.current.breakTarget) {
      const { id, p1 } = ix.current.breakTarget;
      ix.current.breakTarget = null;
      const target = st.doc.entities.find((en) => en.id === id);
      if (target) {
        const result = breakEntity(target, p1, p1);
        if (result) {
          st.removeIds([target.id]);
          st.addEntities(result);
        }
      }
      return;
    }
    // Việc 1.1 (Sprint 10) — polyline/wall/spline là chuỗi NHIỀU điểm; Enter xưa nay = kết thúc
    // chuỗi luôn. Nếu đang có dynBuf (vừa gõ toạ độ/độ dài cho ĐỈNH TIẾP THEO), Enter phải CHỐT
    // đỉnh đó trước (như AutoCAD: Enter có nội dung = thêm điểm; Enter RỖNG mới thật sự kết thúc).
    if (st.tool === 'polyline') {
      if (ix.current.dynBuf) handleClick(effectivePoint(ix.current.pts[ix.current.pts.length - 1]), shift);
      else finishPolyline(false);
    } else if (st.tool === 'wall') {
      if (ix.current.dynBuf) handleClick(effectivePoint(ix.current.pts[ix.current.pts.length - 1]), shift);
      else finishWall(false);
    } else if (st.tool === 'spline') {
      if (ix.current.dynBuf) handleClick(effectivePoint(ix.current.pts[ix.current.pts.length - 1]), shift);
      else finishSpline(false);
    } else if (ix.current.dynBuf) {
      // toạ độ TUYỆT ĐỐI ("X,Y") hợp lệ ngay cả khi CHƯA có base (điểm đầu tiên của lệnh, VD
      // click tâm Circle/Polygon hoặc điểm đầu Line) — mọi trường hợp khác (độ dài đơn, "@dx,dy")
      // cần base đã có (pts.length>0), giữ đúng hành vi cũ.
      const coord = parseCoordInput(ix.current.dynBuf);
      const canCommitFirst = ix.current.pts.length > 0 || coord?.kind === 'abs';
      if (canCommitFirst) handleClick(effectivePoint(ix.current.pts[ix.current.pts.length - 1]), shift);
    }
  }

  /**
   * isIdle — đang "rảnh": tool=select, không đang chờ điểm, không gõ số, không trong
   * chuỗi fillet/chamfer/join/break/grip/góc. Dùng để quyết định có được phép mở lệnh
   * bằng chữ (Việc 1) hoặc lặp lệnh (Việc 3) hay không — tránh phá luồng đang vẽ.
   */
  function isIdle(): boolean {
    const st = useCadStore.getState();
    return (
      st.tool === 'select' &&
      ix.current.pts.length === 0 &&
      ix.current.dynBuf === '' &&
      !ix.current.filletFirst &&
      !ix.current.chamferFirst &&
      !ix.current.joinFirst &&
      !ix.current.breakTarget &&
      !ix.current.gripDrag &&
      !ix.current.angularFirst
    );
  }

  /** Việc 3 — lặp lại lệnh/tool vừa phát (thói quen AutoCAD). */
  function repeatLastCommand() {
    const last = ix.current.lastTool;
    if (!last) return;
    useCadStore.getState().setTool(last);
    ix.current.redraw = true;
  }

  /* ───────── xử lý click theo công cụ ───────── */
  function handleClick(w: Pt, shift: boolean) {
    const st = useCadStore.getState();
    const t = st.tool;
    const P = ix.current.pts;
    ix.current.dynBuf = '';

    const commit = (e: Entity) => {
      st.addEntity({ ...e, layer: e.layer || st.currentLayer });
      ix.current.pts = [];
    };

    switch (t) {
      case 'line':
        P.push(w);
        if (P.length === 2) {
          st.addEntity({ id: newId('e'), type: 'line', layer: st.currentLayer, a: P[0], b: P[1] });
          ix.current.pts = [P[1]]; // nối tiếp (chain) đến khi Esc
        }
        break;
      case 'polyline':
        P.push(w);
        break;
      case 'wall':
        P.push(w);
        break;
      // Sprint 10 — Việc 3.1: Spline — chuỗi control point y hệt polyline (Enter/double-click/C
      // kết thúc — xem finishSpline/onDblClick/phím C), CHỈ khác lúc chốt sẽ nội suy cong.
      case 'spline':
        P.push(w);
        break;
      case 'room':
        P.push(w);
        if (P.length === 2) {
          // Không dùng window.prompt (đứng thread JS, treo trong webview nhúng) — mở ô nhập
          // inline (roomNamePrompt), addEntities thật sự chỉ chạy khi confirmRoomName() chốt.
          setRoomNamePrompt({ p0: P[0], p1: P[1], screenAt: ix.current.cursorScreen });
          setRoomNameValue('PHÒNG');
          ix.current.pts = [];
        }
        break;
      case 'rect':
        P.push(w);
        if (P.length === 2) {
          commit({ id: newId('e'), type: 'rect', layer: st.currentLayer, x: P[0].x, y: P[0].y, w: P[1].x - P[0].x, h: P[1].y - P[0].y });
        }
        break;
      case 'circle':
        P.push(w);
        if (P.length === 2) {
          commit({ id: newId('e'), type: 'circle', layer: st.currentLayer, c: P[0], r: dist(P[0], P[1]) });
        }
        break;
      // Sprint 10 — Việc 2: Polygon đều — click tâm → click bán kính (số cạnh = st.polygonSides,
      // đổi bằng lệnh "POL <n>"). Gõ số chính xác dùng CHUNG cơ chế dynBuf như circle (base=P[0]).
      // Lưu như PolylineEntity khép kín (model.ts không cần Entity type riêng cho polygon).
      case 'polygon':
        P.push(w);
        if (P.length === 2) {
          const verts = polygonVertices(P[0], P[1], st.polygonSides);
          commit({ id: newId('e'), type: 'polyline', layer: st.currentLayer, points: verts, closed: true });
        }
        break;
      // Sprint 10 — Việc 3.3: Ellipse ĐƠN GIẢN HOÁ — click tâm → click góc bounding-box xác định
      // 2 bán trục THẲNG TRỤC (rx theo X, ry theo Y, không xoay — quyết định ưu tiên ít rủi ro,
      // xem geometry.ts ellipsePoints). Xấp xỉ 48 điểm, lưu như PolylineEntity khép kín.
      case 'ellipse':
        P.push(w);
        if (P.length === 2) {
          const rx = Math.abs(P[1].x - P[0].x);
          const ry = Math.abs(P[1].y - P[0].y);
          if (rx > 0 && ry > 0) {
            commit({ id: newId('e'), type: 'polyline', layer: st.currentLayer, points: ellipsePoints(P[0], rx, ry, 48), closed: true });
          } else {
            st.setStatus('Ellipse: 2 bán trục phải > 0 — chọn lại.');
            ix.current.pts = [];
          }
        }
        break;
      // Sprint 10 — Việc 3.4: Donut — click tâm để đặt (bán kính trong/ngoài nhớ từ lệnh
      // "DO <inner> <outer>"), GIỮ tool để đặt liên tiếp (giống 'block'). 2 CircleEntity đồng
      // tâm — đơn giản hơn hatch vòng, đủ dùng cho DD (model.ts không cần Entity donut riêng).
      case 'donut': {
        const inner = st.donutInnerR;
        const outer = Math.max(st.donutOuterR, inner + 1);
        st.addEntities([
          { id: newId('e'), type: 'circle', layer: st.currentLayer, c: w, r: outer },
          { id: newId('e'), type: 'circle', layer: st.currentLayer, c: w, r: inner },
        ]);
        break; // giữ tool để đặt tiếp
      }
      // Sprint 10 — Việc 3.2: Construction line (Xline) — click 2 điểm xác định HƯỚNG, kéo dài
      // rất xa 2 đầu (100m mỗi phía — đủ "vô hạn" thực tế). Đặt vào layer riêng 'Tham chiếu'
      // (ensureLayerByName — không đổi currentLayer, không lẫn vào layer thi công thật).
      case 'xline':
        P.push(w);
        if (P.length === 2) {
          const dx = P[1].x - P[0].x;
          const dy = P[1].y - P[0].y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const FAR = 100000; // mm — 100m mỗi phía, đủ "vô hạn" ở tỉ lệ nội thất
          const xlineLayer = st.ensureLayerByName('Tham chiếu', '#5a7a9a', 'phantom');
          st.addEntity({
            id: newId('e'),
            type: 'line',
            layer: xlineLayer,
            a: { x: P[0].x - ux * FAR, y: P[0].y - uy * FAR },
            b: { x: P[0].x + ux * FAR, y: P[0].y + uy * FAR },
          });
          ix.current.pts = [];
        }
        break;
      // Sprint 10 — Việc 3.5: Divide/Measure — click 1 đối tượng → handleDivide xử lý prompt
      // chọn chế độ (giữ tool để làm tiếp trên đối tượng khác).
      case 'divide':
        handleDivide(w);
        break;
      // Sprint 5 — Việc 2: Circle 3-điểm (khác 'circle' tâm+bán kính ở trên). 3 click bất kỳ
      // trên đường tròn → circumcircle() suy ra tâm+bán kính (dùng chung công thức với arcFrom3).
      case 'circle3p':
        P.push(w);
        if (P.length === 3) {
          const cc = circumcircle(P[0], P[1], P[2]);
          if (cc) commit({ id: newId('e'), type: 'circle', layer: st.currentLayer, c: cc.c, r: cc.r });
          else {
            st.setStatus('Circle 3-điểm: 3 điểm thẳng hàng, không tạo được đường tròn. Chọn lại.');
            ix.current.pts = [];
          }
        }
        break;
      case 'arc':
        P.push(w);
        if (P.length === 3) {
          const arc = arcFrom3(P[0], P[1], P[2]);
          if (arc) commit({ id: newId('e'), type: 'arc', layer: st.currentLayer, ...arc });
          else ix.current.pts = [];
        }
        break;
      // Sprint 5 — Việc 3: Arc tâm+góc (khác 'arc' 3-điểm ở trên). Click tâm → điểm bắt đầu
      // (bán kính + góc đầu) → điểm kết thúc (chỉ góc cuối, giữ nguyên bán kính) — kiểu lệnh
      // ARC "Center, Start, End" của AutoCAD.
      case 'arccenter':
        P.push(w);
        if (P.length === 3) {
          const arc = arcFromCenterStartEnd(P[0], P[1], P[2]);
          if (arc) commit({ id: newId('e'), type: 'arc', layer: st.currentLayer, ...arc });
          else {
            st.setStatus('Arc tâm+góc: điểm bắt đầu trùng tâm, bán kính = 0. Chọn lại.');
            ix.current.pts = [];
          }
        }
        break;
      case 'dimension':
        P.push(w);
        if (P.length === 2) {
          const d: DimEntity = { id: newId('e'), type: 'dim', kind: 'aligned', layer: st.currentLayer, a: P[0], b: P[1], off: 200 };
          st.addEntity(d);
          ix.current.lastDim = d;
          ix.current.pts = [];
        }
        break;
      case 'measure':
        P.push(w);
        if (P.length === 2) {
          st.setStatus(`Khoảng cách: ${Math.round(dist(P[0], P[1]))} mm  ·  Δx ${Math.round(P[1].x - P[0].x)}  Δy ${Math.round(P[1].y - P[0].y)}`);
          ix.current.pts = [];
        }
        break;
      case 'text': {
        // Không dùng window.prompt (chặn thread JS, treo webview nhúng) — form nổi non-blocking.
        // Semantics cũ giữ nguyên: rỗng/Cancel → không tạo gì.
        const at = { ...w };
        setInlineForm({
          title: 'Ghi chú',
          fields: [{ label: 'Nội dung ghi chú', value: '' }],
          screenAt: { ...ix.current.cursorScreen },
          onCommit: ([txt]) => {
            if (txt) {
              const s2 = useCadStore.getState();
              s2.addEntity({ id: newId('e'), type: 'text', layer: s2.currentLayer, at, text: txt, h: 250 });
            }
          },
        });
        ix.current.pts = [];
        break;
      }
      // Sprint 7 — Việc 3: Markup — ghim ghi chú KH RỜI khỏi hình học (doc.markups, không phải
      // Entity — xem lib/cad/model.ts). Giữ tool 'markup' sau khi đặt (đặt liên tiếp nhiều ghim).
      case 'markup': {
        // Form nổi thay window.prompt (chặn thread JS) — tool giữ 'markup' để đặt ghim tiếp.
        const at = { ...w };
        setInlineForm({
          title: 'Markup — phản hồi của khách hàng',
          fields: [{ label: 'Ghi chú markup', value: '' }],
          screenAt: { ...ix.current.cursorScreen },
          onCommit: ([txt]) => {
            if (txt && txt.trim()) {
              const s2 = useCadStore.getState();
              s2.addMarkup(createMarkupPin(at, txt));
              s2.setStatus(`Đã đặt ghim markup — "${txt.trim().slice(0, 40)}"${txt.trim().length > 40 ? '…' : ''}`);
            }
          },
        });
        ix.current.pts = [];
        break;
      }
      // Sprint 7 — Việc 4: đặt ảnh hiện trường đã chọn (pendingPhotoSrc) tại điểm click, rồi
      // trả tool về 'select' (khác 'block' giữ tool để đặt tiếp — ảnh thường chỉ gắn 1 vị trí).
      case 'photo': {
        if (st.pendingPhotoSrc) {
          st.addPhoto(createPhotoEmbed(w, st.pendingPhotoSrc));
          st.setStatus('Đã gắn ảnh hiện trường vào bản vẽ — click vào thumbnail để xem full-size.');
          st.setPendingPhoto(null);
        }
        ix.current.pts = [];
        break;
      }
      case 'block': {
        // 'lib:<id>' = block THƯ VIỆN DXF (46 block, docs/CAD-LIBRARY.md §6 cách A):
        // tải + làm phẳng entity rồi addEntities (1 bước undo). Còn lại = block vẽ tay cũ (BLOCK_MAP).
        if (st.pendingBlock?.startsWith('lib:')) {
          placeLibraryBlock(st.pendingBlock.slice(4), w, ix.current.blockRot, st.currentLayer);
        } else if (st.pendingBlock) {
          st.addEntity({ id: newId('e'), type: 'block', layer: st.currentLayer, block: st.pendingBlock, at: w, rot: ix.current.blockRot, sx: 1, sy: 1 });
        }
        break; // giữ tool để đặt tiếp
      }
      case 'move':
      case 'copy':
        handleMoveCopy(w, t === 'copy');
        break;
      case 'rotate':
        handleRotate(w, shift);
        break;
      case 'mirror':
        handleMirror(w);
        break;
      case 'offset':
        handleOffset(w);
        break;
      case 'trim':
        handleTrim(w);
        break;
      case 'extend':
        handleExtend(w);
        break;
      case 'fillet':
        handleFillet(w);
        break;
      case 'chamfer':
        handleChamfer(w);
        break;
      case 'arrayrect':
        handleArrayRect();
        break;
      case 'arraypolar':
        handleArrayPolar(w);
        break;
      case 'scale':
        handleScale(w);
        break;
      case 'stretch':
        handleStretch(w);
        break;
      case 'break':
        handleBreak(w);
        break;
      case 'join':
        handleJoin(w);
        break;
      case 'explode':
        handleExplode(w);
        break;
      case 'lengthen':
        handleLengthen(w);
        break;
      case 'dimradius':
        handleDimRadial(w, false);
        break;
      case 'dimdiameter':
        handleDimRadial(w, true);
        break;
      case 'dimangular':
        handleDimAngular(w);
        break;
      case 'dimcontinue':
        handleDimChain(w, 'continue');
        break;
      case 'dimbaseline':
        handleDimChain(w, 'baseline');
        break;
      case 'hatch':
        handleHatch(w);
        break;
      default:
        break;
    }
    ix.current.redraw = true;
  }

  /** Đối tượng đang chọn (nếu có) hoặc TOÀN BỘ bản vẽ — dùng làm biên cắt/kéo dài cho TRIM/EXTEND. */
  function cuttersOrAll(): Entity[] {
    const st = useCadStore.getState();
    if (!st.selection.length) return st.doc.entities;
    const sel = new Set(st.selection);
    return st.doc.entities.filter((e) => sel.has(e.id));
  }

  function handleTrim(w: Pt) {
    const st = useCadStore.getState();
    const id = hitTest(st.doc, w, tolMm());
    if (!id) return;
    const target = st.doc.entities.find((e) => e.id === id);
    if (!target) return;
    const cutters = cuttersOrAll().filter((c) => c.id !== target.id);
    const result = trimEntity(target, cutters, w);
    if (result) {
      st.removeIds([target.id]);
      st.addEntities(result);
    } else {
      st.setStatus('Trim: không có giao điểm ở đây (dùng đối tượng đang chọn làm biên, hoặc bỏ chọn để cắt theo toàn bộ bản vẽ).');
    }
  }

  function handleExtend(w: Pt) {
    const st = useCadStore.getState();
    const id = hitTest(st.doc, w, tolMm());
    if (!id) return;
    const target = st.doc.entities.find((e) => e.id === id);
    if (!target) return;
    const boundaries = cuttersOrAll().filter((c) => c.id !== target.id);
    const result = extendEntity(target, boundaries, w);
    if (result) st.updateEntities([result]);
    else st.setStatus('Extend: không tìm thấy biên phía đầu kéo dài (chỉ hỗ trợ LINE/ARC).');
  }

  function handleFillet(w: Pt) {
    const st = useCadStore.getState();
    const id = hitTest(st.doc, w, tolMm());
    if (!id) return;
    const target = st.doc.entities.find((e) => e.id === id);
    if (!target || target.type !== 'line') {
      st.setStatus('Fillet: chỉ hỗ trợ 2 đường thẳng (LINE).');
      return;
    }
    if (!ix.current.filletFirst) {
      ix.current.filletFirst = { id, pick: w };
      st.setStatus(`Fillet: đã chọn đường 1 — click đường thứ 2 (bán kính ${st.filletRadius}mm — gõ số + Enter để đổi).`);
      return;
    }
    const first = ix.current.filletFirst;
    ix.current.filletFirst = null;
    if (first.id === id) return;
    const l1 = st.doc.entities.find((e) => e.id === first.id);
    if (!l1 || l1.type !== 'line') return;
    const r = filletTwoLines(l1, target, st.filletRadius, first.pick, w);
    if (r) {
      st.updateEntities([r.line1, r.line2]);
      if (r.arc) st.addEntity(r.arc);
      st.setStatus('Fillet: đã bo góc.');
    } else {
      st.setStatus('Fillet: 2 đường song song/thẳng hàng — không bo được.');
    }
  }

  function handleChamfer(w: Pt) {
    const st = useCadStore.getState();
    const id = hitTest(st.doc, w, tolMm());
    if (!id) return;
    const target = st.doc.entities.find((e) => e.id === id);
    if (!target || target.type !== 'line') {
      st.setStatus('Chamfer: chỉ hỗ trợ 2 đường thẳng (LINE).');
      return;
    }
    if (!ix.current.chamferFirst) {
      ix.current.chamferFirst = { id, pick: w };
      st.setStatus(`Chamfer: đã chọn đường 1 — click đường thứ 2 (d1=${st.chamferD1}mm, d2=${st.chamferD2}mm).`);
      return;
    }
    const first = ix.current.chamferFirst;
    ix.current.chamferFirst = null;
    if (first.id === id) return;
    const l1 = st.doc.entities.find((e) => e.id === first.id);
    if (!l1 || l1.type !== 'line') return;
    const r = chamferTwoLines(l1, target, st.chamferD1, st.chamferD2, first.pick, w);
    if (r) {
      st.updateEntities([r.line1, r.line2]);
      st.addEntity(r.connector);
      st.setStatus('Chamfer: đã vát góc.');
    } else {
      st.setStatus('Chamfer: 2 đường song song/thẳng hàng — không vát được.');
    }
  }

  // 3 lệnh dưới: trước đây hỏi bằng CHUỖI window.prompt nối nhau (2-4 hộp liên tiếp, chặn
  // thread JS) — gộp thành 1 form nổi nhiều field, validate lúc chốt Y HỆT code sau-prompt cũ
  // (giá trị không hợp lệ / Cancel → không làm gì, không báo lỗi — giữ nguyên semantics).
  function handleArrayRect() {
    const sel = needSelection();
    if (!sel.length) return;
    setInlineForm({
      title: 'Array chữ nhật',
      fields: [
        { label: 'Số hàng', value: '2' },
        { label: 'Số cột', value: '2' },
        { label: 'Khoảng cách cột theo X (mm)', value: '1000' },
        { label: 'Khoảng cách hàng theo Y (mm)', value: '1000' },
      ],
      screenAt: { ...ix.current.cursorScreen },
      onCommit: ([vRows, vCols, vDx, vDy]) => {
        const rows = parseInt(vRows, 10);
        const cols = parseInt(vCols, 10);
        const dx = parseFloat(vDx);
        const dy = parseFloat(vDy);
        if ([rows, cols, dx, dy].every((n) => Number.isFinite(n))) {
          const s2 = useCadStore.getState();
          const targets = s2.doc.entities.filter((e) => sel.includes(e.id));
          s2.addEntities(arrayRect(targets, rows, cols, dx, dy));
        }
      },
    });
  }

  function handleArrayPolar(w: Pt) {
    const sel = needSelection();
    if (!sel.length) return;
    const center = { ...w }; // tâm mảng = điểm click, chốt trước khi form mở
    setInlineForm({
      title: 'Array tròn',
      fields: [
        { label: 'Số bản (kể cả gốc)', value: '6' },
        { label: 'Tổng góc quét (độ, 360 = đầy vòng)', value: '360' },
      ],
      screenAt: { ...ix.current.cursorScreen },
      onCommit: ([vCount, vAngle]) => {
        const count = parseInt(vCount, 10);
        const angle = parseFloat(vAngle);
        if (Number.isFinite(count) && count >= 2 && Number.isFinite(angle)) {
          const s2 = useCadStore.getState();
          const targets = s2.doc.entities.filter((e) => sel.includes(e.id));
          s2.addEntities(arrayPolar(targets, center, count, angle, true));
        }
      },
    });
  }

  function handleScale(w: Pt) {
    const sel = needSelection();
    if (!sel.length) return;
    const base = { ...w }; // điểm gốc scale = điểm click
    setInlineForm({
      title: 'Scale',
      fields: [{ label: 'Hệ số scale (VD 2, 0.5)', value: '1' }],
      screenAt: { ...ix.current.cursorScreen },
      onCommit: ([vF]) => {
        const f = parseFloat(vF);
        if (Number.isFinite(f) && f > 0) {
          const s2 = useCadStore.getState();
          const targets = s2.doc.entities.filter((e) => sel.includes(e.id));
          s2.updateEntities(scaleEntitiesAbout(targets, base, f));
        }
      },
    });
  }

  function handleStretch(w: Pt) {
    const st = useCadStore.getState();
    const P = ix.current.pts;
    P.push(w);
    if (P.length === 4) {
      const dx = P[3].x - P[2].x;
      const dy = P[3].y - P[2].y;
      st.updateEntities(stretchEntities(st.doc.entities, { min: P[0], max: P[1] }, dx, dy));
      ix.current.pts = [];
      st.setStatus('Stretch: đã kéo dãn các điểm trong khung crossing.');
    } else if (P.length === 1) {
      st.setStatus('Stretch: click góc thứ 2 của khung crossing.');
    } else if (P.length === 2) {
      st.setStatus('Stretch: click điểm gốc (base point).');
    } else if (P.length === 3) {
      st.setStatus('Stretch: click điểm đích.');
    }
  }

  function handleBreak(w: Pt) {
    const st = useCadStore.getState();
    if (!ix.current.breakTarget) {
      const id = hitTest(st.doc, w, tolMm());
      if (id) {
        ix.current.breakTarget = { id, p1: w };
        st.setStatus('Break: click điểm cắt thứ 2 (Enter = cắt tại đúng điểm vừa click, không hở).');
      }
      return;
    }
    const { id, p1 } = ix.current.breakTarget;
    ix.current.breakTarget = null;
    const target = st.doc.entities.find((e) => e.id === id);
    if (!target) return;
    const result = breakEntity(target, p1, w);
    if (result) {
      st.removeIds([target.id]);
      st.addEntities(result);
    } else {
      st.setStatus('Break: chỉ hỗ trợ LINE/ARC.');
    }
  }

  function handleJoin(w: Pt) {
    const st = useCadStore.getState();
    const id = hitTest(st.doc, w, tolMm());
    if (!id) return;
    if (!ix.current.joinFirst) {
      ix.current.joinFirst = id;
      st.setStatus('Join: click đối tượng thứ 2 cần nối.');
      return;
    }
    const firstId = ix.current.joinFirst;
    ix.current.joinFirst = null;
    if (firstId === id) return;
    const e1 = st.doc.entities.find((e) => e.id === firstId);
    const e2 = st.doc.entities.find((e) => e.id === id);
    if (!e1 || !e2) return;
    const joined = joinEntities(e1, e2);
    if (joined) {
      st.removeIds([e1.id, e2.id]);
      st.addEntity(joined);
      st.setStatus('Join: đã nối 2 đối tượng.');
    } else {
      st.setStatus('Join: không nối được (không thẳng hàng / không cùng đường tròn tiếp giáp / không chung đầu mút).');
    }
  }

  function handleExplode(w: Pt) {
    const st = useCadStore.getState();
    const id = hitTest(st.doc, w, tolMm());
    if (!id) return;
    const target = st.doc.entities.find((e) => e.id === id);
    if (!target) return;
    const result = explodeEntity(target);
    if (result.length === 1 && result[0].id === target.id) {
      st.setStatus('Explode: đối tượng này không thể rã thêm.');
      return;
    }
    st.removeIds([target.id]);
    st.addEntities(result);
  }

  function handleLengthen(w: Pt) {
    const st = useCadStore.getState();
    const id = hitTest(st.doc, w, tolMm());
    if (!id) return;
    const target = st.doc.entities.find((e) => e.id === id);
    if (!target) return;
    if (target.type === 'line') {
      st.updateEntities([lengthenLine(target, st.lengthenDelta, w)]);
    } else if (target.type === 'arc') {
      const deltaRad = st.lengthenDelta / Math.max(1, target.r);
      st.updateEntities([lengthenArc(target, deltaRad, w)]);
    } else {
      st.setStatus('Lengthen: chỉ hỗ trợ LINE/ARC.');
    }
  }

  /** DRA/DDI — click lên CIRCLE/ARC: điểm click chiếu lên đường tròn xác định hướng leader. */
  function handleDimRadial(w: Pt, diameter: boolean) {
    const st = useCadStore.getState();
    const id = hitTest(st.doc, w, tolMm());
    if (!id) return;
    const target = st.doc.entities.find((e) => e.id === id);
    if (!target || (target.type !== 'circle' && target.type !== 'arc')) {
      st.setStatus('Dim Radius/Diameter: chỉ đo trên CIRCLE hoặc ARC.');
      return;
    }
    const ang = Math.atan2(w.y - target.c.y, w.x - target.c.x);
    const onCirc: Pt = { x: target.c.x + target.r * Math.cos(ang), y: target.c.y + target.r * Math.sin(ang) };
    const d: DimEntity = { id: newId('e'), type: 'dim', kind: diameter ? 'diameter' : 'radius', layer: st.currentLayer, a: target.c, b: onCirc, off: 0 };
    st.addEntity(d);
  }

  /** DAN — click 2 đường LINE tạo góc, rồi click vị trí đặt cung đo (xác định bán kính off). */
  function handleDimAngular(w: Pt) {
    const st = useCadStore.getState();
    const id = hitTest(st.doc, w, tolMm());
    if (!id) return;
    const target = st.doc.entities.find((e) => e.id === id);
    if (!target || target.type !== 'line') {
      st.setStatus('Dim Angular: chỉ hỗ trợ 2 đường LINE.');
      return;
    }
    if (!ix.current.angularFirst) {
      ix.current.angularFirst = target;
      st.setStatus('Dim Angular: click đường thứ 2.');
      return;
    }
    const l1 = ix.current.angularFirst;
    ix.current.angularFirst = null;
    if (l1.id === id) return;
    const P0 = infiniteLineIntersect(l1.a, l1.b, target.a, target.b);
    if (!P0) {
      st.setStatus('Dim Angular: 2 đường song song — không đo được góc.');
      return;
    }
    const ref1 = dist(l1.a, P0.pt) > dist(l1.b, P0.pt) ? l1.a : l1.b;
    const ref2 = dist(target.a, P0.pt) > dist(target.b, P0.pt) ? target.a : target.b;
    const off = Math.max(50, dist(P0.pt, w));
    const d: DimEntity = { id: newId('e'), type: 'dim', kind: 'angular', layer: st.currentLayer, c: P0.pt, a: ref1, b: ref2, off };
    st.addEntity(d);
  }

  /** DCO/DBA — nối tiếp từ dim aligned gần nhất (lastDim); nếu chưa có dim nào, xử lý như DAL 2 điểm. */
  function handleDimChain(w: Pt, mode: 'continue' | 'baseline') {
    const st = useCadStore.getState();
    const last = ix.current.lastDim;
    if (!last) {
      const P = ix.current.pts;
      P.push(w);
      if (P.length === 2) {
        const d: DimEntity = { id: newId('e'), type: 'dim', kind: 'aligned', layer: st.currentLayer, a: P[0], b: P[1], off: 200 };
        st.addEntity(d);
        ix.current.lastDim = d;
        ix.current.pts = [];
      }
      return;
    }
    const a = mode === 'continue' ? last.b : last.a;
    const off = mode === 'continue' ? last.off : last.off + (last.off >= 0 ? 400 : -400);
    const d: DimEntity = { id: newId('e'), type: 'dim', kind: 'aligned', layer: st.currentLayer, a, b: w, off };
    st.addEntity(d);
    ix.current.lastDim = d;
  }

  /** H — pick-point: dò biên vùng kín quanh w, tô theo pattern/scale/góc đang nhớ trong store. */
  function handleHatch(w: Pt) {
    const st = useCadStore.getState();
    const poly = findHatchBoundary(st.doc, w);
    if (!poly) {
      st.setStatus('Hatch: không dò được vùng kín tại điểm này (cần biên khép kín từ line/polyline/rect/circle/arc).');
      return;
    }
    st.addEntity({
      id: newId('e'),
      type: 'hatch',
      layer: st.currentLayer,
      points: poly,
      solid: st.hatchPattern === 'SOLID',
      pattern: st.hatchPattern,
      patternScale: st.hatchScale,
      patternAngle: st.hatchAngle,
      // Sprint 5 — Việc 1: màu preset vật liệu (nếu đang chọn 1 vật liệu từ MaterialPalette);
      // '' = không override, dùng màu layer như hành vi cũ (Nấc 4).
      ...(st.hatchColor ? { color: st.hatchColor } : {}),
    });
    const materialTxt = st.hatchMaterialId ? ` vật liệu "${st.hatchMaterialId}"` : ` ${st.hatchPattern}`;
    st.setStatus(`Hatch: đã tô${materialTxt} (${poly.length} đỉnh biên).`);
  }

  function finishPolyline(closed: boolean) {
    const st = useCadStore.getState();
    const pts = ix.current.pts;
    if (pts.length >= 2) {
      st.addEntity({ id: newId('e'), type: 'polyline', layer: st.currentLayer, points: pts.slice(), closed });
    }
    ix.current.pts = [];
    ix.current.redraw = true;
  }

  function finishWall(closed: boolean) {
    const st = useCadStore.getState();
    const pts = ix.current.pts;
    if (pts.length >= 2) {
      st.addEntities(wallChain(pts.slice(), st.wallThickness, st.currentLayer, closed));
    }
    ix.current.pts = [];
    ix.current.redraw = true;
  }

  /** Sprint 10 — Việc 3.1: kết thúc SPLINE — nội suy Catmull-Rom qua các control point đã click
   * rồi lưu như PolylineEntity (nhiều đoạn ngắn xấp xỉ đường cong — xem geometry.ts). Cùng cặp
   * tham số (closed) với finishPolyline/finishWall (Enter=hở, phím C=đóng vòng). */
  function finishSpline(closed: boolean) {
    const st = useCadStore.getState();
    const pts = ix.current.pts;
    if (pts.length >= 2) {
      const curve = catmullRomSpline(pts.slice(), 12, closed);
      st.addEntity({ id: newId('e'), type: 'polyline', layer: st.currentLayer, points: curve, closed });
    }
    ix.current.pts = [];
    ix.current.redraw = true;
  }

  function needSelection(): string[] {
    const st = useCadStore.getState();
    if (st.selection.length) return st.selection;
    // chưa chọn → click này để chọn 1 đối tượng
    const id = hitTest(st.doc, ix.current.cursorWorld, tolMm());
    if (id) {
      st.select([id]);
      return [id];
    }
    return [];
  }

  function handleMoveCopy(w: Pt, isCopy: boolean) {
    const st = useCadStore.getState();
    if (!st.selection.length) {
      needSelection();
      return;
    }
    const P = ix.current.pts;
    P.push(w);
    if (P.length === 2) {
      const dx = P[1].x - P[0].x;
      const dy = P[1].y - P[0].y;
      const sel = new Set(st.selection);
      const targets = st.doc.entities.filter((e) => sel.has(e.id));
      if (isCopy) {
        st.addEntities(targets.map((e) => translateEntity(withNewId(e), dx, dy)));
      } else {
        st.updateEntities(targets.map((e) => translateEntity(e, dx, dy)));
      }
      ix.current.pts = [];
    }
  }

  function handleRotate(w: Pt, shift: boolean) {
    const st = useCadStore.getState();
    if (!st.selection.length) {
      needSelection();
      return;
    }
    const P = ix.current.pts;
    P.push(w);
    if (P.length === 3) {
      const c = P[0];
      let ang = Math.atan2(P[2].y - c.y, P[2].x - c.x) - Math.atan2(P[1].y - c.y, P[1].x - c.x);
      if (shift) ang = Math.round(ang / (Math.PI / 2)) * (Math.PI / 2);
      const sel = new Set(st.selection);
      const targets = st.doc.entities.filter((e) => sel.has(e.id));
      st.updateEntities(targets.map((e) => rotateEntity(e, c, ang)));
      ix.current.pts = [];
    }
  }

  function handleMirror(w: Pt) {
    const st = useCadStore.getState();
    if (!st.selection.length) {
      needSelection();
      return;
    }
    const P = ix.current.pts;
    P.push(w);
    if (P.length === 2) {
      const phi = Math.atan2(P[1].y - P[0].y, P[1].x - P[0].x);
      const sel = new Set(st.selection);
      const targets = st.doc.entities.filter((e) => sel.has(e.id));
      st.updateEntities(targets.map((e) => mirrorEntity(e, P[0], phi)));
      ix.current.pts = [];
    }
  }

  function handleOffset(w: Pt) {
    const st = useCadStore.getState();
    // click 1: chọn đối tượng; click 2: phía offset
    if (!ix.current.pts.length) {
      const id = hitTest(st.doc, w, tolMm());
      if (id) {
        st.select([id]);
        ix.current.pts = [w]; // đánh dấu đã chọn (giá trị không dùng)
        st.setStatus(`Offset ${st.offsetDist}mm — click phía cần offset.`);
      }
      return;
    }
    const target = st.doc.entities.find((e) => e.id === st.selection[0]);
    if (target) {
      const off = offsetEntity(target, st.offsetDist, w);
      if (off) st.addEntity(off);
    }
    ix.current.pts = [];
  }

  /**
   * Sprint 10 — Việc 3.5: Divide/Measure — click 1 đối tượng (line/polyline/circle/arc) → prompt
   * chọn chế độ: số nguyên = DIVIDE (chia đều N đoạn), "M <khoảng cách>" = MEASURE (đo cố định,
   * hành vi/alias giống lệnh MEASURE thật của AutoCAD — KHÁC tool 'measure' có sẵn trong app này
   * vốn là "đo nhanh khoảng cách 2 điểm click", không liên quan). Đặt marker CircleEntity nhỏ tại
   * mỗi điểm chia (đủ đơn giản, không cần BlockDef riêng như mep.ts).
   */
  function handleDivide(w: Pt) {
    const st = useCadStore.getState();
    const id = hitTest(st.doc, w, tolMm());
    if (!id) {
      st.setStatus('Divide/Measure: click lên 1 Line/Polyline/Circle/Arc.');
      return;
    }
    const target = st.doc.entities.find((e) => e.id === id);
    if (!target || (target.type !== 'line' && target.type !== 'polyline' && target.type !== 'circle' && target.type !== 'arc')) {
      st.setStatus('Divide/Measure: chỉ hỗ trợ Line/Polyline/Circle/Arc.');
      return;
    }
    // Form nổi thay window.prompt (chặn thread JS) — validate lúc chốt y hệt code sau-prompt cũ.
    setInlineForm({
      title: 'Divide/Measure',
      fields: [{ label: 'Số đoạn chia đều (VD "5"), hoặc "M <khoảng cách mm>" (VD "M 300")', value: '5' }],
      screenAt: { ...ix.current.cursorScreen },
      onCommit: ([raw]) => {
        if (!raw || !raw.trim()) return;
        const s2 = useCadStore.getState();
        // tìm lại đối tượng theo id từ doc HIỆN TẠI (form không chặn thread — doc có thể đã đổi)
        const t2 = s2.doc.entities.find((e) => e.id === target.id) ?? target;
        const trimmed = raw.trim();
        const measureMatch = /^m\s+([\d.]+)$/i.exec(trimmed);
        let points: Pt[];
        let label: string;
        if (measureMatch) {
          const segLen = parseFloat(measureMatch[1]);
          if (!Number.isFinite(segLen) || segLen <= 0) {
            s2.setStatus('Measure: khoảng cách không hợp lệ.');
            return;
          }
          points = measureEntity(t2, segLen);
          label = `Measure mỗi ${segLen}mm`;
        } else {
          const n = parseInt(trimmed, 10);
          if (!Number.isFinite(n) || n < 2) {
            s2.setStatus('Divide: số đoạn phải là số nguyên ≥ 2.');
            return;
          }
          points = divideEntity(t2, n);
          label = `Divide ${n} đoạn`;
        }
        if (!points.length) {
          s2.setStatus('Divide/Measure: không đặt được điểm chia (đối tượng quá ngắn so với tham số).');
          return;
        }
        const markerR = 15; // mm — chấm nhỏ đánh dấu điểm chia (bán kính rất nhỏ, đủ thấy khi zoom)
        const markers: Entity[] = points.map((p) => ({ id: newId('e'), type: 'circle', layer: s2.currentLayer, c: p, r: markerR }));
        s2.addEntities(markers);
        s2.setStatus(`${label}: đã đặt ${markers.length} điểm chia.`);
      },
    });
  }

  /* ───────── keyboard ───────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return; // đang gõ command line / layer name
      const st = useCadStore.getState();

      // undo/redo — đồng bộ Mac (⌘Z / ⌘⇧Z) và Windows (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        ix.current.redraw = true;
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        st.redo();
        ix.current.redraw = true;
        return;
      }
      // Sprint 4 — Việc 1: Copy-paste bàn phím kiểu Office/Canva (Ctrl+C/Cmd+C, Ctrl+V/Cmd+V),
      // KHÁC tool "Copy" AutoCAD hiện có (cần chọn base point). Dán lệch nhẹ (offset mặc định)
      // để thấy được ngay là đã dán, không đè lên bản gốc.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        if (!st.selection.length) return;
        e.preventDefault();
        st.copySelection();
        st.setStatus(`Đã chép ${st.selection.length} đối tượng (Ctrl+V để dán).`);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        if (!st.clipboard.length) return;
        e.preventDefault();
        st.pasteClipboard();
        ix.current.redraw = true;
        st.setStatus(`Đã dán ${st.clipboard.length} đối tượng (lệch +20mm).`);
        return;
      }
      if (e.key === ' ') {
        // Việc 3: đánh dấu thời điểm nhấn để phân biệt TAP nhanh (lặp lệnh) với GIỮ để pan.
        if (!e.repeat) {
          ix.current.spaceDownAt = performance.now();
          ix.current.spaceDidPan = false;
        }
        ix.current.spaceHeld = true;
        return;
      }
      if (e.key === 'Escape') {
        // Đóng luôn form/hộp xác nhận nổi nếu đang mở (khi focus còn trên canvas — focus trong
        // ô input thì handler của input tự xử + stopPropagation). Cancel = không làm gì, đúng
        // semantics prompt/confirm cũ. setState từ closure ổn: setter của useState là stable.
        setInlineForm(null);
        setInlineConfirm(null);
        ix.current.pts = [];
        ix.current.dynBuf = '';
        ix.current.filletFirst = null;
        ix.current.chamferFirst = null;
        ix.current.joinFirst = null;
        ix.current.breakTarget = null;
        ix.current.gripDrag = null;
        ix.current.gripPreview = null;
        ix.current.angularFirst = null;
        st.clearSelection();
        st.setTool('select');
        ix.current.redraw = true;
        return;
      }
      if (e.key === 'Enter') {
        commitEnter(e.shiftKey);
        return;
      }
      // F8 — bật/tắt Ortho khoá (thói quen AutoCAD). Giữ Shift vẫn là ortho tạm thời.
      // Nguồn sự thật giờ là store (st.orthoLock) để nút cảm ứng ở CadTouchDock bật/tắt CÙNG
      // trạng thái; effect đồng bộ phía dưới đẩy giá trị mới xuống ix.current cho vòng vẽ.
      if (e.key === 'F8') {
        e.preventDefault();
        st.setOrthoLock(!st.orthoLock);
        return;
      }
      // Việc 4 — F12: bật/tắt Dynamic Input heads-up cạnh con trỏ (thói quen AutoCAD).
      if (e.key === 'F12') {
        e.preventDefault();
        st.setDynInput(!st.dynInput);
        return;
      }
      if ((e.key === 'c' || e.key === 'C') && st.tool === 'polyline' && ix.current.pts.length >= 2) {
        finishPolyline(true);
        return;
      }
      if ((e.key === 'c' || e.key === 'C') && st.tool === 'wall' && ix.current.pts.length >= 2) {
        finishWall(true);
        return;
      }
      if ((e.key === 'c' || e.key === 'C') && st.tool === 'spline' && ix.current.pts.length >= 2) {
        finishSpline(true);
        return;
      }
      // CHỈ phím Delete vật lý xoá tức thì. TRƯỚC ĐÂY phím chữ 'e' (khi tool='select') cũng
      // xoá tức thì — mô phỏng AutoCAD "gõ E = Erase", NHƯNG bắt phím này TRƯỚC nhánh
      // type-anywhere bên dưới nên nuốt mất mọi lệnh 2+ chữ bắt đầu bằng E (EX=Extend,
      // EL=Ellipse, ERASE) — gõ "EX" định vào lệnh Kéo dài lại xoá luôn vật đang chọn ngay ở
      // phím đầu tiên rồi phím 'x' sau đó rơi vào buffer rỗng, KHÔNG BAO GIỜ gõ được EX/EL/
      // ERASE qua type-anywhere, và tệ hơn — xoá nhầm dữ liệu đang chọn ngoài ý muốn. Bỏ nhánh
      // phím 'e' này: type-anywhere bên dưới (isIdle()) đã tự đưa 'e' vào ô lệnh (seed "E",
      // focus input) — gõ tiếp "x" đúng như input bình thường ⇒ "EX"+Enter vẫn chạy ERASE/
      // EXTEND đúng lệnh, không mất khả năng gõ tắt, chỉ bỏ phát bắn tức thì gây xung đột.
      // Backspace vật lý vẫn xoá được khi buffer rỗng (nhánh riêng bên dưới).
      if (e.key === 'Delete') {
        st.deleteSelected();
        ix.current.redraw = true;
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && st.tool === 'block') {
        ix.current.blockRot = (ix.current.blockRot + Math.PI / 2) % (Math.PI * 2);
        ix.current.redraw = true;
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        zoomExtents();
        return;
      }
      // Việc 1 — Type-anywhere: khi RẢNH, gõ CHỮ CÁI bất kỳ trên vùng vẽ sẽ chảy vào
      // dòng lệnh (chuẩn AutoCAD) mà KHÔNG cần click ô lệnh trước. Các hotkey 1 phím ngữ
      // cảnh (c/r/f/e) đã xử lý phía trên nên không bị phá; số vẫn vào dynBuf như cũ.
      if (
        !e.ctrlKey && !e.metaKey && !e.altKey &&
        /^[a-zA-Z]$/.test(e.key) &&
        isIdle()
      ) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('cad:cmd-key', { detail: e.key }));
        return;
      }
      // dynamic input số — Việc 1 (Sprint 10): mở rộng ký tự cho phép gõ toạ độ kiểu AutoCAD
      // "X,Y" (tuyệt đối) / "@dx,dy" (tương đối) bên cạnh số đơn (độ dài) như cũ.
      if (/[0-9.,@-]/.test(e.key)) {
        ix.current.dynBuf += e.key;
        const coord = parseCoordInput(ix.current.dynBuf);
        if (coord?.kind === 'abs') st.setStatus(`Toạ độ tuyệt đối: ${ix.current.dynBuf} (Enter để chốt)`);
        else if (coord?.kind === 'rel') st.setStatus(`Toạ độ tương đối: ${ix.current.dynBuf} (Enter để chốt)`);
        else st.setStatus(`Nhập độ dài: ${ix.current.dynBuf} mm (Enter để chốt)`);
        return;
      }
      if (e.key === 'Backspace') {
        if (ix.current.dynBuf) {
          // Đang gõ buffer nhập số/toạ độ động → Backspace chỉ xoá ký tự cuối, KHÔNG đụng selection.
          ix.current.dynBuf = ix.current.dynBuf.slice(0, -1);
          // Cập nhật status theo buffer CÒN LẠI (trước đây status giữ nguyên thông báo cũ dù
          // buffer đã đổi); xoá hết → trả status về hint của tool hiện tại.
          if (ix.current.dynBuf) {
            const coord = parseCoordInput(ix.current.dynBuf);
            if (coord?.kind === 'abs') st.setStatus(`Toạ độ tuyệt đối: ${ix.current.dynBuf} (Enter để chốt)`);
            else if (coord?.kind === 'rel') st.setStatus(`Toạ độ tương đối: ${ix.current.dynBuf} (Enter để chốt)`);
            else st.setStatus(`Nhập độ dài: ${ix.current.dynBuf} mm (Enter để chốt)`);
          } else {
            st.setStatus(toolHint(st.tool));
          }
          ix.current.redraw = true; // HUD cạnh con trỏ (F12) cũng đang hiện buffer — vẽ lại
        } else if (st.selection.length) {
          // Bàn phím Mac không numpad gửi 'Backspace' cho phím "delete" vật lý (không phải 'Delete').
          // Buffer rỗng + có đối tượng đang chọn → coi như phím xoá, đồng bộ hành vi với nhánh 'Delete'.
          st.deleteSelected();
          ix.current.redraw = true;
        }
        return;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === ' ') {
        ix.current.spaceHeld = false;
        // Việc 3: TAP Space nhanh khi rảnh (không giữ để pan) = lặp lệnh vừa dùng.
        // Bỏ qua nếu đang gõ trong ô nhập (command line / tên layer).
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const dt = performance.now() - ix.current.spaceDownAt;
        if (!ix.current.spaceDidPan && dt < 300 && isIdle()) repeatLastCommand();
      }
    };
    // Cảm ứng (Sketch mode) — cầu nối "nút = phím". CadTouchDock phát `cad:synth-key` với tên
    // phím; ta gọi THẲNG onKey bằng một KeyboardEvent dựng sẵn nên nút đi qua ĐÚNG nhánh logic
    // của phím thật, không có bản sao logic thứ hai để lệch nhau về sau. Event chỉ được dựng
    // (không dispatch) → e.target = null → guard INPUT/TEXTAREA ở đầu onKey bỏ qua, đúng ý:
    // bấm nút cảm ứng vẫn ăn kể cả khi con trỏ text đang nằm trong ô lệnh.
    const onSynthKey = (ev: Event) => {
      const key = (ev as CustomEvent<string>).detail;
      if (typeof key !== 'string' || !key) return;
      onKey(new KeyboardEvent('keydown', { key }));
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('cad:synth-key', onSynthKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('cad:synth-key', onSynthKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ortho (F8) / Dynamic Input (F12) sống ở store để cụm nút cảm ứng và phím tắt dùng CHUNG một
  // trạng thái. Vòng vẽ + hit-test đọc ix.current (hot path, không qua React), nên effect này là
  // chỗ duy nhất đẩy store → ix; status bar cũng cập nhật ở đây để 2 đường vào (phím & nút) đều
  // báo giống hệt nhau. Bỏ qua lần chạy đầu để không đè status hint của tool lúc mới mở trang.
  const orthoLock = useCadStore((s) => s.orthoLock);
  const dynInput = useCadStore((s) => s.dynInput);
  const modeFlagsFirstRun = useRef(true);
  useEffect(() => {
    ix.current.orthoLock = orthoLock;
    ix.current.hud = dynInput;
    ix.current.redraw = true;
    if (modeFlagsFirstRun.current) {
      modeFlagsFirstRun.current = false;
      return;
    }
    const st = useCadStore.getState();
    st.setStatus(
      `Ortho ${orthoLock ? 'BẬT' : 'tắt'} (F8) · Dynamic Input ${dynInput ? 'BẬT' : 'tắt'} (F12).`,
    );
  }, [orthoLock, dynInput]);

  /* ───────── vẽ ───────── */
  function draw() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const { W, H, dpr } = screenSize();
    const st = useCadStore.getState();
    const v = st.viewport;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const bg = css('--bg', '#141210');
    const gridMinor = css('--border', '#2a2622');
    const t3 = css('--t3', '#9a9488');
    const accent = css('--accent', '#c08a5a');

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawGrid(ctx, v, W, H, st.gridStep, gridMinor);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // trong lúc kéo grip: vẽ bằng bản preview cục bộ (chưa commit store) thay cho bản gốc
    const gp = ix.current.gripDrag && ix.current.gripPreview;
    const docToDraw = gp ? { ...st.doc, entities: st.doc.entities.map((e) => (e.id === ix.current.gripDrag!.entityId ? ix.current.gripPreview! : e)) } : st.doc;
    drawEntities(ctx, v, docToDraw, { stroke: t3, lineWidth: 1.3, text: true, dimStyle: st.dimStyle, realLineweight: true });

    // highlight selection
    if (st.selection.length) {
      const sel = new Set(st.selection);
      for (const e of docToDraw.entities) {
        if (!sel.has(e.id)) continue;
        drawEntity(ctx, v, docToDraw, e, { stroke: accent, forceColor: accent, lineWidth: 2.4, text: true, dimStyle: st.dimStyle, outlineOnly: true });
      }
    }

    // grips: chỉ hiện khi tool=select và đang chọn ĐÚNG 1 entity
    if (st.tool === 'select' && st.selection.length === 1) {
      const ent = docToDraw.entities.find((e) => e.id === st.selection[0]);
      if (ent) drawGrips(ctx, v, ent, accent);
      // B2.7 — clearance overlay quanh shape đang chọn
      if (ent && ent.type === 'block') drawClearance(ctx, v, ent);
    }

    // B2.6 — collision warning: viền đỏ quanh mọi BlockEntity đang chồng lấn (transient, KHÔNG
    // lưu vào .idf — tính lại mỗi frame từ doc hiện tại).
    drawCollisions(ctx, v, docToDraw.entities.filter((e): e is BlockEntity => e.type === 'block'));

    // Sprint 7 — Việc 3/4: markup pin + photo embed — LUÔN vẽ trên cùng (annotation KH, không
    // phải hình học) để không bị tường/nội thất che mất.
    drawAnnotations(ctx, v, W, H, accent);

    drawPreview(ctx, v, accent);
    drawSelectionBox(ctx, v, accent);
    drawSnap(ctx, v, accent);
    drawCrosshair(ctx, W, H, gridMinor, t3);
    drawDynInput(ctx, W, H);

    ctx.restore();
    updateDeleteFabPosition(st, v, W, H);
  }

  /** Cảm ứng — nút Xoá nổi: neo cạnh trên-phải bao hình (bbox) của selection, tính lại mỗi frame
   * (viewport đổi liên tục lúc pan/zoom nên KHÔNG thể dựa vào React re-render — xem ghi chú ở
   * chỗ khai báo `selection`/`cadTool` phía trên). Không dùng React state cho vị trí, chỉ set
   * trực tiếp style của node DOM qua ref, giữ đúng tinh thần "không re-render vì tương tác chuột/
   * cảm ứng" của toàn file. Việc hiện/ẩn nút vẫn do React (showDeleteFab) quyết định. */
  function updateDeleteFabPosition(st: ReturnType<typeof useCadStore.getState>, v: Viewport, W: number, H: number) {
    const btn = deleteBtnRef.current;
    if (!btn || st.tool !== 'select' || st.selection.length === 0) return;
    const sel = new Set(st.selection);
    const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (const e of st.doc.entities) {
      if (!sel.has(e.id)) continue;
      const b = entityBox(e);
      if (!Number.isFinite(b.minX)) continue;
      box.minX = Math.min(box.minX, b.minX);
      box.minY = Math.min(box.minY, b.minY);
      box.maxX = Math.max(box.maxX, b.maxX);
      box.maxY = Math.max(box.maxY, b.maxY);
    }
    const BTN = 40;
    let left: number;
    let top: number;
    if (Number.isFinite(box.minX)) {
      const c1 = worldToScreen(v, { x: box.minX, y: box.minY });
      const c2 = worldToScreen(v, { x: box.maxX, y: box.maxY });
      // trục Y màn hình bị lật so với world (worldToScreen) → lấy min/max riêng từng trục, không
      // giả định c1 là góc trên-trái.
      const right = Math.max(c1.x, c2.x);
      const topY = Math.min(c1.y, c2.y);
      left = right + 14;
      top = topY - BTN - 14;
      // tràn mép phải/trên → gập vào trong thay vì để nút khuất ngoài canvas.
      if (left + BTN > W - 8) left = Math.max(c1.x, c2.x) - BTN; // áp sát mép phải bbox, vào trong
      if (top < 8) top = Math.min(c1.y, c2.y) + 8; // áp sát mép trên bbox, vào trong (dưới đỉnh)
      left = Math.min(Math.max(left, 8), W - BTN - 8);
      top = Math.min(Math.max(top, 8), H - BTN - 8);
    } else {
      // fallback hiếm gặp (entity không có bbox hữu hạn) — góc dưới-phải màn hình, không che toolbar.
      left = W - BTN - 16;
      top = H - BTN - 16;
    }
    btn.style.left = `${left}px`;
    btn.style.top = `${top}px`;
  }

  /**
   * Việc 4 — Dynamic Input heads-up: ô nhỏ NGAY CẠNH con trỏ hiện số đang gõ (dynBuf)
   * và/hoặc độ dài + góc của đoạn đang vẽ (từ điểm chốt gần nhất tới con trỏ). Mắt không
   * phải rời điểm vẽ để nhìn xuống thanh status. F12 bật/tắt (mặc định bật). Toạ độ live góc
   * dưới + status bar vẫn giữ nguyên.
   */
  function drawDynInput(ctx: CanvasRenderingContext2D, W: number, H: number) {
    if (!ix.current.hud) return;
    const s = ix.current.cursorScreen;
    const last = ix.current.pts[ix.current.pts.length - 1];
    const lines: string[] = [];
    if (ix.current.dynBuf) lines.push(`${ix.current.dynBuf} mm`);
    if (last) {
      const w = ix.current.cursorWorld;
      const d = dist(last, w);
      const ang = ((Math.atan2(w.y - last.y, w.x - last.x) * 180) / Math.PI + 360) % 360;
      if (!ix.current.dynBuf) lines.push(`${Math.round(d)} mm`);
      lines.push(`∠ ${ang.toFixed(1)}°`);
    }
    if (!lines.length) return;

    const panel = css('--panel', '#1c1a17');
    const t1 = css('--t1', '#efe9df');
    const border = css('--border', '#2a2622');
    ctx.save();
    ctx.font = '11px ui-monospace, monospace';
    const padX = 7;
    const lineH = 14;
    const textW = Math.max(...lines.map((t) => ctx.measureText(t).width));
    const boxW = textW + padX * 2;
    const boxH = lines.length * lineH + 6;
    // đặt chéo dưới-phải con trỏ; nếu tràn mép thì lật sang trái/trên
    let bx = s.x + 16;
    let by = s.y + 16;
    if (bx + boxW > W - 4) bx = s.x - 16 - boxW;
    if (by + boxH > H - 4) by = s.y - 16 - boxH;
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = panel;
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(bx, by, boxW, boxH);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = t1;
    ctx.textBaseline = 'top';
    lines.forEach((t, i) => ctx.fillText(t, bx + padX, by + 4 + i * lineH));
    ctx.restore();
  }

  function drawGrips(ctx: CanvasRenderingContext2D, v: Viewport, ent: Entity, accent: string) {
    const grips = gripsOf(ent);
    const activeGrip = ix.current.gripDrag?.grip;
    for (const g of grips) {
      const s = worldToScreen(v, g.pt);
      const isActive = activeGrip && activeGrip.kind === g.kind && activeGrip.index === g.index;
      const r = 5;
      ctx.save();
      ctx.fillStyle = isActive ? accent : css('--panel', '#1c1a17');
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.3;
      ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
      ctx.strokeRect(s.x - r, s.y - r, r * 2, r * 2);
      ctx.restore();
    }
  }

  /** B2.6 — viền đỏ nhấp nháy quanh mọi BlockEntity đang chồng lấn nhau (SAT — lib/cad/shape-interactions.ts). */
  function drawCollisions(ctx: CanvasRenderingContext2D, v: Viewport, blocks: BlockEntity[]) {
    if (!blocks.length) return;
    const collided = detectCollisions(blocks, BLOCK_MAP);
    if (!collided.size) return;
    const blink = 0.55 + 0.45 * Math.sin(performance.now() / 220); // "nhấp nháy" theo spec B2.6
    ctx.save();
    ctx.strokeStyle = '#e14a3a';
    ctx.lineWidth = 2;
    ctx.globalAlpha = blink;
    for (const e of blocks) {
      if (!collided.has(e.id)) continue;
      const corners = blockWorldCorners(e, BLOCK_MAP).map((p) => worldToScreen(v, p));
      ctx.beginPath();
      corners.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
    ix.current.redraw = true; // giữ vòng lặp vẽ chạy để hiệu ứng nhấp nháy tiếp diễn
  }

  /** B2.7 — overlay mờ vùng clearance (BlockDef.clearance) quanh BlockEntity đang chọn. */
  function drawClearance(ctx: CanvasRenderingContext2D, v: Viewport, e: BlockEntity) {
    const polys = clearanceWorldPolygons(e, BLOCK_MAP);
    if (!polys.length) return;
    ctx.save();
    ctx.fillStyle = '#e0a83a';
    ctx.strokeStyle = '#e0a83a';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.2;
    for (const poly of polys) {
      const pts = poly.map((p) => worldToScreen(v, p));
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.globalAlpha = 0.12;
      ctx.fill();
      ctx.globalAlpha = 0.65;
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Lazy-load 1 ảnh theo src (cache trong Map) — trả HTMLImageElement nếu đã load xong, null
   * nếu đang tải/lỗi (draw() vẽ placeholder cho các trường hợp đó). `onLoaded` bật lại redraw
   * đúng 1 lần khi ảnh vừa tải xong (Sprint 7 — Việc 4). */
  function getPhotoImage(src: string, onLoaded: () => void): HTMLImageElement | null {
    const cache = photoImgCache.current;
    const cached = cache.get(src);
    if (cached === 'loading' || cached === 'error') return null;
    if (cached) return cached;
    cache.set(src, 'loading');
    const img = new Image();
    img.onload = () => {
      cache.set(src, img);
      onLoaded();
    };
    img.onerror = () => cache.set(src, 'error');
    img.src = src;
    return null;
  }

  /**
   * Sprint 7 — Việc 3 (markup pin) + Việc 4 (photo embed thumbnail) — annotation rời khỏi hình
   * học (doc.markups/doc.photos), vẽ kích thước CỐ ĐỊNH px màn hình (không scale theo zoom,
   * giống grip/crosshair) để luôn dễ bấm dù đang zoom xa. Hover (theo cursorScreen hiện tại,
   * fixed mỗi frame trong vòng lặp rAF — không cần listener chuột riêng) hiện tooltip.
   */
  function drawAnnotations(ctx: CanvasRenderingContext2D, v: Viewport, W: number, H: number, accent: string) {
    const st = useCadStore.getState();
    const cursor = ix.current.cursorScreen;
    const panel = css('--panel', '#1c1a17');
    const t1 = css('--t1', '#efe9df');
    const border = css('--border', '#2a2622');

    // ── Photo embeds ──
    const photos = st.doc.photos ?? [];
    let hoverPhotoCaption: { s: Pt; text: string } | null = null;
    for (const p of photos) {
      const s = worldToScreen(v, p.at);
      if (s.x < -60 || s.x > W + 60 || s.y < -60 || s.y > H + 60) continue; // ngoài khung nhìn
      const half = PHOTO_THUMB_PX / 2;
      const hovered = Math.hypot(cursor.x - s.x, cursor.y - s.y) <= half + 4;
      const img = getPhotoImage(p.src, () => (ix.current.redraw = true));
      ctx.save();
      ctx.beginPath();
      ctx.rect(s.x - half, s.y - half, PHOTO_THUMB_PX, PHOTO_THUMB_PX);
      ctx.clip();
      if (img) {
        // cover-fit: cắt phần thừa theo cạnh ngắn để lấp đầy khung vuông, không méo ảnh
        const ir = img.naturalWidth / img.naturalHeight || 1;
        let dw = PHOTO_THUMB_PX;
        let dh = PHOTO_THUMB_PX;
        if (ir > 1) dw = PHOTO_THUMB_PX * ir;
        else dh = PHOTO_THUMB_PX / ir;
        ctx.drawImage(img, s.x - dw / 2, s.y - dh / 2, dw, dh);
      } else {
        ctx.fillStyle = panel;
        ctx.fillRect(s.x - half, s.y - half, PHOTO_THUMB_PX, PHOTO_THUMB_PX);
        ctx.fillStyle = t1;
        ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('…', s.x, s.y + 3);
        ctx.textAlign = 'left';
      }
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = hovered ? accent : border;
      ctx.lineWidth = hovered ? 2 : 1.3;
      ctx.strokeRect(s.x - half, s.y - half, PHOTO_THUMB_PX, PHOTO_THUMB_PX);
      ctx.restore();
      if (hovered) hoverPhotoCaption = { s, text: p.caption ? p.caption : 'Ảnh hiện trường — click xem full-size' };
    }

    // ── Markup pins ──
    const markups = st.doc.markups ?? [];
    let hoverMarkup: { s: Pt; pin: MarkupPin } | null = null;
    for (const m of markups) {
      const s = worldToScreen(v, m.at);
      if (s.x < -40 || s.x > W + 40 || s.y < -40 || s.y > H + 40) continue;
      const hovered = Math.hypot(cursor.x - s.x, cursor.y - s.y) <= PIN_HIT_PX;
      const r = hovered ? 9 : 7;
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = m.color || '#e0603a';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.restore();
      if (hovered) hoverMarkup = { s, pin: m };
    }

    // tooltip: markup ưu tiên hơn ảnh nếu cả 2 đang hover trùng (hiếm — pin nhỏ hơn thumbnail)
    if (hoverMarkup) {
      const lines = [hoverMarkup.pin.text, formatMarkupTime(hoverMarkup.pin.ts)].filter(Boolean);
      drawTooltip(ctx, hoverMarkup.s, lines, W, H, panel, t1, border);
    } else if (hoverPhotoCaption) {
      drawTooltip(ctx, hoverPhotoCaption.s, [hoverPhotoCaption.text], W, H, panel, t1, border);
    }
  }

  /** Hộp tooltip nhỏ cạnh 1 điểm màn hình — dùng chung cho markup + photo hover. */
  function drawTooltip(ctx: CanvasRenderingContext2D, at: Pt, lines: string[], W: number, H: number, panel: string, textColor: string, border: string) {
    if (!lines.length) return;
    ctx.save();
    ctx.font = '11.5px ui-sans-serif, system-ui, sans-serif';
    const padX = 8;
    const lineH = 15;
    const textW = Math.min(220, Math.max(...lines.map((t) => ctx.measureText(t).width)));
    const boxW = textW + padX * 2;
    const boxH = lines.length * lineH + 8;
    let bx = at.x + 14;
    let by = at.y - boxH - 10;
    if (bx + boxW > W - 4) bx = at.x - 14 - boxW;
    if (by < 4) by = at.y + 16;
    ctx.globalAlpha = 0.96;
    ctx.fillStyle = panel;
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(bx, by, boxW, boxH);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';
    lines.forEach((t, i) => {
      const truncated = ctx.measureText(t).width > textW ? `${t.slice(0, 34)}…` : t;
      ctx.fillText(truncated, bx + padX, by + 4 + i * lineH);
    });
    ctx.restore();
  }

  function drawGrid(ctx: CanvasRenderingContext2D, v: Viewport, W: number, H: number, step: number, color: string) {
    const majorEvery = 10; // 10 × step (100mm) = 1m
    const px = step * v.scale;
    if (px < 6) return; // quá dày → bỏ lưới nhỏ
    // gốc world (0,0) trên màn:
    const origin = worldToScreen(v, { x: 0, y: 0 });
    const startX = origin.x % px;
    const startY = origin.y % px;
    const majorPx = px * majorEvery;
    const majorOffX = ((origin.x % majorPx) + majorPx) % majorPx;
    const majorOffY = ((origin.y % majorPx) + majorPx) % majorPx;

    ctx.lineWidth = 1;
    // minor
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    for (let x = startX; x < W; x += px) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = startY; y < H; y += px) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
    // major (1m)
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    for (let x = majorOffX; x < W; x += majorPx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = majorOffY; y < H; y += majorPx) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // trục 0
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, H);
    ctx.moveTo(0, origin.y);
    ctx.lineTo(W, origin.y);
    ctx.stroke();
  }

  function drawPreview(ctx: CanvasRenderingContext2D, v: Viewport, accent: string) {
    const st = useCadStore.getState();
    const P = ix.current.pts;
    const cur = effectivePoint(P[P.length - 1]);
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    const S = (p: Pt) => worldToScreen(v, p);

    const line = (a: Pt, b: Pt) => {
      const sa = S(a);
      const sb = S(b);
      ctx.beginPath();
      ctx.moveTo(sa.x, sa.y);
      ctx.lineTo(sb.x, sb.y);
      ctx.stroke();
    };

    switch (st.tool) {
      case 'line':
      case 'dimension':
      case 'measure':
      case 'dimcontinue':
      case 'dimbaseline':
        if (P.length === 1) {
          line(P[0], cur);
          labelLen(ctx, v, P[0], cur, accent);
        } else if (!P.length && ix.current.lastDim && (st.tool === 'dimcontinue' || st.tool === 'dimbaseline')) {
          const from = st.tool === 'dimcontinue' ? ix.current.lastDim.b : ix.current.lastDim.a;
          line(from, cur);
        }
        break;
      case 'dimangular': {
        if (ix.current.angularFirst) {
          drawEntity(ctx, v, st.doc, ix.current.angularFirst, { stroke: accent, forceColor: accent, lineWidth: 2.6, text: false, outlineOnly: true });
        }
        break;
      }
      case 'polyline':
      case 'wall':
        for (let i = 0; i < P.length - 1; i++) line(P[i], P[i + 1]);
        if (P.length) line(P[P.length - 1], cur);
        break;
      // Sprint 10 — Việc 3.1: preview spline — nội suy sống các control point ĐÃ chốt + con trỏ
      // (nhẹ vì stepsPerSpan thấp hơn bản final, đủ mượt cho preview).
      case 'spline': {
        const live = P.length ? catmullRomSpline([...P, cur], 8, false) : [];
        for (let i = 0; i < live.length - 1; i++) line(live[i], live[i + 1]);
        for (const p of P) {
          const sp = S(p);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
      case 'rect':
      case 'room':
        if (P.length === 1) {
          const a = S(P[0]);
          const b = S(cur);
          ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
        }
        break;
      // Sprint 10 — Việc 3.3: preview ellipse — bounding box (rx=|dx|, ry=|dy|) giống rect, VẼ
      // thêm hình ellipse thật bên trong để thấy ngay hình dạng cuối.
      case 'ellipse':
        if (P.length === 1) {
          const rx = Math.abs(cur.x - P[0].x);
          const ry = Math.abs(cur.y - P[0].y);
          if (rx > 0 && ry > 0) {
            const pts = ellipsePoints(P[0], rx, ry, 40).map(S);
            ctx.beginPath();
            pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.closePath();
            ctx.stroke();
          }
        }
        break;
      case 'circle':
        if (P.length === 1) {
          const c = S(P[0]);
          ctx.beginPath();
          ctx.arc(c.x, c.y, dist(P[0], cur) * v.scale, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      // Sprint 10 — Việc 2: preview polygon đều — N cạnh (st.polygonSides) nội tiếp bán kính
      // đang kéo, góc bắt đầu theo hướng con trỏ (khớp handleClick).
      case 'polygon':
        if (P.length === 1) {
          const verts = polygonVertices(P[0], cur, st.polygonSides).map(S);
          ctx.beginPath();
          verts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
          ctx.closePath();
          ctx.stroke();
        }
        break;
      // Sprint 10 — Việc 3.4: preview donut — 2 vòng tròn đồng tâm theo con trỏ.
      case 'donut': {
        const c = S(cur);
        ctx.beginPath();
        ctx.arc(c.x, c.y, st.donutOuterR * v.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x, c.y, st.donutInnerR * v.scale, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      // Sprint 10 — Việc 3.2: preview xline — đoạn dài xuyên suốt màn hình theo hướng đang chọn
      // (chỉ preview trong viewport, bản final mới kéo dài 100m thật — xem handleClick 'xline').
      case 'xline':
        if (P.length === 1) {
          const dx = cur.x - P[0].x;
          const dy = cur.y - P[0].y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const FAR_PREVIEW = 20000; // mm — đủ dài để thấy hướng, không cần full 100m lúc preview
          line({ x: P[0].x - ux * FAR_PREVIEW, y: P[0].y - uy * FAR_PREVIEW }, { x: P[0].x + ux * FAR_PREVIEW, y: P[0].y + uy * FAR_PREVIEW });
        }
        break;
      case 'circle3p':
        if (P.length === 1) {
          line(P[0], cur);
        } else if (P.length === 2) {
          const cc = circumcircle(P[0], P[1], cur);
          if (cc) {
            const c = S(cc.c);
            ctx.beginPath();
            ctx.arc(c.x, c.y, cc.r * v.scale, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            line(P[0], P[1]);
          }
        }
        break;
      case 'arccenter':
        if (P.length === 1) {
          const c = S(P[0]);
          ctx.beginPath();
          ctx.arc(c.x, c.y, dist(P[0], cur) * v.scale, 0, Math.PI * 2);
          ctx.stroke();
        } else if (P.length === 2) {
          const arc = arcFromCenterStartEnd(P[0], P[1], cur);
          if (arc) {
            const c = S(arc.c);
            ctx.beginPath();
            ctx.arc(c.x, c.y, arc.r * v.scale, -arc.a2, -arc.a1);
            ctx.stroke();
          }
        }
        break;
      case 'move':
      case 'copy':
        if (P.length === 1) line(P[0], cur);
        break;
      case 'rotate':
        if (P.length >= 1) line(P[0], cur);
        break;
      case 'mirror':
        if (P.length === 1) line(P[0], cur);
        break;
      case 'stretch': {
        // P0,P1 = khung crossing; P2,P3 = base/đích (di dời)
        if (P.length === 1) {
          const a = S(P[0]);
          const b = S(cur);
          ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
        } else if (P.length >= 2) {
          const a = S(P[0]);
          const b = S(P[1]);
          ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
          if (P.length === 3) line(P[2], cur);
        }
        break;
      }
      case 'fillet':
      case 'chamfer': {
        const first = st.tool === 'fillet' ? ix.current.filletFirst : ix.current.chamferFirst;
        if (first) {
          const p = S(first.pick);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
      case 'break': {
        if (ix.current.breakTarget) {
          const p = S(ix.current.breakTarget.p1);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
          ctx.stroke();
          line(ix.current.breakTarget.p1, cur);
        }
        break;
      }
      case 'join': {
        if (ix.current.joinFirst) {
          const target = st.doc.entities.find((e) => e.id === ix.current.joinFirst);
          if (target) drawEntity(ctx, v, st.doc, target, { stroke: accent, forceColor: accent, lineWidth: 2.6, text: false, outlineOnly: true });
        }
        break;
      }
      case 'block': {
        // ghost block theo con trỏ
        const bId = st.pendingBlock;
        if (bId) {
          const ghost: Entity = { id: 'ghost', type: 'block', layer: st.currentLayer, block: bId, at: ix.current.snap.pt, rot: ix.current.blockRot, sx: 1, sy: 1 };
          ctx.globalAlpha = 0.6;
          drawEntity(ctx, v, st.doc, ghost, { stroke: accent, forceColor: accent, lineWidth: 1.4, text: false });
          ctx.globalAlpha = 1;
        }
        break;
      }
      default:
        break;
    }
    ctx.restore();
  }

  function labelLen(ctx: CanvasRenderingContext2D, v: Viewport, a: Pt, b: Pt, accent: string) {
    const s = worldToScreen(v, b);
    ctx.save();
    ctx.setLineDash([]);
    ctx.fillStyle = accent;
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(`${Math.round(dist(a, b))} mm`, s.x + 10, s.y - 8);
    ctx.restore();
  }

  function drawSelectionBox(ctx: CanvasRenderingContext2D, v: Viewport, accent: string) {
    const sd = ix.current.selDrag;
    if (!sd) return;
    const a = worldToScreen(v, sd.start);
    const b = ix.current.cursorScreen;
    // TRÁI→PHẢI = window (nét liền); PHẢI→TRÁI = crossing (nét đứt). Màu phân biệt như AutoCAD:
    // window = accent (lạnh), crossing = xanh lá.
    const windowMode = ix.current.cursorWorld.x > sd.start.x;
    const col = windowMode ? accent : '#4a9c6d';
    ctx.save();
    ctx.strokeStyle = col;
    ctx.setLineDash(windowMode ? [] : [5, 4]);
    ctx.globalAlpha = 0.9;
    ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = col;
    ctx.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    ctx.restore();
  }

  function drawSnap(ctx: CanvasRenderingContext2D, v: Viewport, accent: string) {
    const sn = ix.current.snap;
    if (sn.type === 'none') return;
    const s = worldToScreen(v, sn.pt);
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.6;
    const r = 6;
    if (sn.type === 'endpoint') ctx.strokeRect(s.x - r, s.y - r, r * 2, r * 2);
    else if (sn.type === 'midpoint') {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - r);
      ctx.lineTo(s.x + r, s.y + r);
      ctx.lineTo(s.x - r, s.y + r);
      ctx.closePath();
      ctx.stroke();
    } else if (sn.type === 'center') {
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (sn.type === 'intersection') {
      ctx.beginPath();
      ctx.moveTo(s.x - r, s.y - r);
      ctx.lineTo(s.x + r, s.y + r);
      ctx.moveTo(s.x + r, s.y - r);
      ctx.lineTo(s.x - r, s.y + r);
      ctx.stroke();
    } else if (sn.type === 'quadrant') {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - r);
      ctx.lineTo(s.x + r, s.y + r);
      ctx.lineTo(s.x - r, s.y + r);
      ctx.closePath();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
    } else if (sn.type === 'node') {
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
    } else if (sn.type === 'perpendicular') {
      ctx.beginPath();
      ctx.moveTo(s.x - r, s.y + r);
      ctx.lineTo(s.x - r, s.y - r);
      ctx.lineTo(s.x + r, s.y - r);
      ctx.stroke();
    } else if (sn.type === 'tangent') {
      ctx.beginPath();
      ctx.arc(s.x, s.y - 2, r * 0.75, 0, Math.PI * 2);
      ctx.moveTo(s.x - r, s.y + r);
      ctx.lineTo(s.x + r, s.y + r);
      ctx.stroke();
    } else if (sn.type === 'nearest') {
      ctx.beginPath();
      ctx.moveTo(s.x - r, s.y - r);
      ctx.lineTo(s.x + r, s.y - r);
      ctx.lineTo(s.x - r, s.y + r);
      ctx.lineTo(s.x + r, s.y + r);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrosshair(ctx: CanvasRenderingContext2D, W: number, H: number, color: string, textColor: string) {
    const s = ix.current.cursorScreen;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x, 0);
    ctx.lineTo(s.x, H);
    ctx.moveTo(0, s.y);
    ctx.lineTo(W, s.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // toạ độ live
    const w = ix.current.cursorWorld;
    ctx.fillStyle = textColor;
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`X ${Math.round(w.x)}  Y ${Math.round(w.y)} mm`, 12, H - 12);
    ctx.restore();
  }

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onDoubleClick={onDblClick}
        onContextMenu={(e) => e.preventDefault()}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{ display: 'block', touchAction: 'none', cursor: 'crosshair' }}
      />
      {/* Sprint 7 — Việc 4: lightbox xem full-size ảnh hiện trường. */}
      {viewPhoto && (
        <div
          onClick={() => setViewPhoto(null)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            background: 'rgba(0,0,0,.72)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'zoom-out',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewPhoto.src}
            alt={viewPhoto.caption || 'Ảnh hiện trường'}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '86%', maxHeight: '76%', objectFit: 'contain', borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,.5)', background: 'var(--panel)' }}
          />
          {/* Xác nhận "Gỡ ảnh" 2 bước inline thay window.confirm (chặn thread JS, treo webview
              nhúng). Giữ semantics cũ: xác nhận → gỡ + đóng lightbox; từ chối → chỉ đóng lightbox
              (window.confirm cũ bấm Cancel cũng đóng). */}
          {confirmRemovePhoto ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: 13 }} onClick={(e) => e.stopPropagation()}>
              <span>Gỡ ảnh này khỏi bản vẽ?</span>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  useCadStore.getState().removePhoto(viewPhoto.id);
                  useCadStore.getState().setStatus('Đã gỡ ảnh hiện trường.');
                  setViewPhoto(null);
                }}
                style={{ border: 'none', background: 'var(--accent-strong)', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
              >
                Gỡ ảnh
              </button>
              <button
                type="button"
                onClick={() => setViewPhoto(null)}
                style={{ border: '1px solid rgba(255,255,255,.4)', background: 'transparent', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
              >
                Không
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: 13 }} onClick={(e) => e.stopPropagation()}>
              <span>{viewPhoto.caption || 'Ảnh hiện trường'}</span>
              <button
                type="button"
                onClick={() => setConfirmRemovePhoto(true)}
                style={{ border: '1px solid rgba(255,255,255,.4)', background: 'transparent', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
              >
                Gỡ ảnh
              </button>
              <button
                type="button"
                onClick={() => setViewPhoto(null)}
                style={{ border: '1px solid rgba(255,255,255,.4)', background: 'transparent', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      )}
      {/* Room tool — ô nhập tên phòng inline, thay window.prompt (đứng thread JS trong webview
          nhúng — cùng lớp bug đã sửa ở Dashboard "Đặt tên dự án"). Neo gần điểm click góc thứ 2,
          kẹp trong khung canvas để không tràn ra ngoài. */}
      {roomNamePrompt && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(Math.max(roomNamePrompt.screenAt.x, 8), (wrapRef.current?.clientWidth ?? 800) - 220),
            top: Math.min(Math.max(roomNamePrompt.screenAt.y, 8), (wrapRef.current?.clientHeight ?? 600) - 90),
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,.18)',
          }}
        >
          <input
            autoFocus
            value={roomNameValue}
            onChange={(e) => setRoomNameValue(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmRoomName();
              else if (e.key === 'Escape') {
                e.stopPropagation();
                cancelRoomName();
              }
            }}
            placeholder="Tên phòng…"
            className="text-xs text-[var(--t1)]"
            style={{ width: 140, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', padding: '5px 8px', outline: 'none' }}
          />
          <button
            type="button"
            onClick={() => confirmRoomName()}
            title="Tạo phòng (Enter)"
            style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 8, background: 'var(--accent-strong)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            ✓
          </button>
          <button
            type="button"
            onClick={cancelRoomName}
            title="Dùng tên mặc định (Esc)"
            style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 8, background: 'transparent', color: 'var(--t3)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
      {/* Form nổi dùng chung (Text/Markup/Array rect/Array polar/Scale/Divide) — thay các
          window.prompt cũ. Cùng pattern room tool: neo gần con trỏ, kẹp trong khung canvas;
          Enter/✓ chốt, Escape/✕ huỷ (= prompt trả null, không làm gì). */}
      {inlineForm && (
        <div
          ref={inlineFormPanelRef}
          style={{
            position: 'absolute',
            left: Math.min(Math.max(inlineForm.screenAt.x, 8), (wrapRef.current?.clientWidth ?? 800) - 260),
            top: Math.min(Math.max(inlineForm.screenAt.y, 8), (wrapRef.current?.clientHeight ?? 600) - (70 + inlineForm.fields.length * 46)),
            zIndex: 30,
            width: 248,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.18)',
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>{inlineForm.title}</div>
          {inlineForm.fields.map((f, i) => (
            <label key={f.label} style={{ display: 'block', marginBottom: 6 }}>
              <span style={{ display: 'block', fontSize: 10.5, color: 'var(--t3)', marginBottom: 2 }}>{f.label}</span>
              <input
                ref={i === 0 ? inlineFormFirstInputRef : undefined}
                autoFocus={i === 0}
                value={f.value}
                onChange={(e) => {
                  const v = e.target.value;
                  setInlineForm((prev) =>
                    prev ? { ...prev, fields: prev.fields.map((fd, j) => (j === i ? { ...fd, value: v } : fd)) } : prev,
                  );
                }}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    commitInlineForm();
                  } else if (e.key === 'Escape') {
                    e.stopPropagation();
                    cancelInlineForm();
                  }
                }}
                className="text-xs text-[var(--t1)]"
                style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', padding: '5px 8px', outline: 'none' }}
              />
            </label>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button
              type="button"
              onClick={cancelInlineForm}
              title="Huỷ (Esc)"
              style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 8, background: 'transparent', color: 'var(--t3)', border: '1px solid var(--border)', cursor: 'pointer' }}
            >
              ✕
            </button>
            <button
              type="button"
              onClick={commitInlineForm}
              title="Xác nhận (Enter)"
              style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 8, background: 'var(--accent-strong)', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              ✓
            </button>
          </div>
        </div>
      )}
      {/* Hộp xác nhận nổi (xoá ghim markup) — thay window.confirm. */}
      {inlineConfirm && (
        <div
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setInlineConfirm(null);
            }
          }}
          style={{
            position: 'absolute',
            left: Math.min(Math.max(inlineConfirm.screenAt.x, 8), (wrapRef.current?.clientWidth ?? 800) - 280),
            top: Math.min(Math.max(inlineConfirm.screenAt.y, 8), (wrapRef.current?.clientHeight ?? 600) - 100),
            zIndex: 30,
            maxWidth: 268,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.18)',
          }}
        >
          <div style={{ fontSize: 11.5, color: 'var(--t1)', marginBottom: 8, wordBreak: 'break-word' }}>{inlineConfirm.message}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button
              type="button"
              onClick={() => setInlineConfirm(null)}
              style={{ borderRadius: 8, padding: '4px 10px', fontSize: 11.5, background: 'transparent', color: 'var(--t3)', border: '1px solid var(--border)', cursor: 'pointer' }}
            >
              Huỷ
            </button>
            <button
              type="button"
              ref={inlineConfirmOkRef}
              autoFocus
              onClick={commitInlineConfirm}
              style={{ borderRadius: 8, padding: '4px 10px', fontSize: 11.5, background: 'var(--accent-strong)', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              {inlineConfirm.okLabel}
            </button>
          </div>
        </div>
      )}
      {/* Cảm ứng — nút Xoá nổi: thiết bị không có bàn phím (tablet) không dùng được phím Delete/
          Backspace. Vị trí (left/top) do updateDeleteFabPosition() trong draw() set trực tiếp mỗi
          frame — không qua React state (xem ghi chú ở chỗ khai báo showDeleteFab phía trên). */}
      {showDeleteFab && (
        <button
          ref={deleteBtnRef}
          type="button"
          onClick={() => {
            const s2 = useCadStore.getState();
            s2.deleteSelected();
            s2.setStatus('Đã xoá đối tượng đã chọn.');
          }}
          title="Xoá đối tượng đã chọn"
          aria-label="Xoá đối tượng đã chọn"
          style={{
            position: 'absolute',
            left: `calc(100% - 56px)`,
            top: `calc(100% - 56px)`,
            zIndex: 32,
            width: 40,
            height: 40,
            borderRadius: 20,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--accent-strong)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 8px 20px rgba(0,0,0,.28)',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** dựng cung tròn qua 3 điểm; null nếu thẳng hàng. */
function arcFrom3(p1: Pt, p2: Pt, p3: Pt): { c: Pt; r: number; a1: number; a2: number } | null {
  // circumcircle() (lib/cad/geometry.ts) tính tâm+bán kính — tách ra Sprint 5 để Circle
  // 3-điểm (circle3p) dùng chung, tránh 2 bản công thức lệch nhau.
  const cc = circumcircle(p1, p2, p3);
  if (!cc) return null;
  const { c, r } = cc;
  const ux = c.x;
  const uy = c.y;
  let a1 = Math.atan2(p1.y - uy, p1.x - ux);
  const a2 = Math.atan2(p3.y - uy, p3.x - ux);
  const am = Math.atan2(p2.y - uy, p2.x - ux);
  // đảm bảo cung đi qua điểm giữa: nếu am không nằm trong [a1,a2] CCW thì đảo
  const norm = (x: number) => ((x % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const inRange = (s: number, m: number, e: number) => {
    const S = norm(s);
    const M = norm(m - S);
    const E = norm(e - S);
    return M <= E;
  };
  if (!inRange(a1, am, a2)) {
    // đổi hướng: giữ nguyên nhưng hoán a1<->a2
    const tmp = a1;
    a1 = a2;
    return { c, r, a1, a2: tmp };
  }
  return { c, r, a1, a2 };
}
