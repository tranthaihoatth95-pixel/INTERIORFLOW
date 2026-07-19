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

import { useEffect, useRef, useState } from 'react';
import { useCadStore } from '@/lib/cad/store';
import type { Tool } from '@/lib/cad/store';
import { useFlowStore } from '@/lib/store';
import type { Entity, Pt, Viewport, DimEntity, LineEntity, MarkupPin, PhotoEmbed } from '@/lib/cad/model';
import { screenToWorld, worldToScreen, zoomAt, fitBox, docBox, dist } from '@/lib/cad/model';
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
      // user tự thêm — xoá không cần snapshot cảnh báo phức tạp, window.confirm là đủ).
      const photoHit = nearestPhoto((st.doc.photos ?? []).map((p) => ({ ...p, at: worldToScreen(st.viewport, p.at) })), screen, PIN_HIT_PX);
      if (photoHit) {
        const real = (st.doc.photos ?? []).find((p) => p.id === photoHit.id) ?? null;
        setViewPhoto(real);
        return;
      }
      const markupHit = nearestMarkup((st.doc.markups ?? []).map((m) => ({ ...m, at: worldToScreen(st.viewport, m.at) })), screen, PIN_HIT_PX);
      if (markupHit) {
        const real = (st.doc.markups ?? []).find((m) => m.id === markupHit.id);
        if (real && window.confirm(`Xoá ghim markup này?\n\n"${real.text}"`)) {
          st.removeMarkup(real.id);
          st.setStatus('Đã xoá ghim markup.');
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

  const onWheel = (ev: React.WheelEvent) => {
    const st = useCadStore.getState();
    const screen = toLocal(ev.nativeEvent);
    const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
    st.setViewport(zoomAt(st.viewport, screen, factor));
    updateCursor(screen);
  };

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
        const txt = window.prompt('Nội dung ghi chú:', '');
        if (txt) commit({ id: newId('e'), type: 'text', layer: st.currentLayer, at: w, text: txt, h: 250 });
        else ix.current.pts = [];
        break;
      }
      // Sprint 7 — Việc 3: Markup — ghim ghi chú KH RỜI khỏi hình học (doc.markups, không phải
      // Entity — xem lib/cad/model.ts). Giữ tool 'markup' sau khi đặt (đặt liên tiếp nhiều ghim).
      case 'markup': {
        const txt = window.prompt('Ghi chú markup (phản hồi của khách hàng):', '');
        if (txt && txt.trim()) {
          st.addMarkup(createMarkupPin(w, txt));
          st.setStatus(`Đã đặt ghim markup — "${txt.trim().slice(0, 40)}"${txt.trim().length > 40 ? '…' : ''}`);
        }
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

  function handleArrayRect() {
    const st = useCadStore.getState();
    const sel = needSelection();
    if (!sel.length) return;
    const rows = parseInt(window.prompt('Array chữ nhật — số hàng:', '2') ?? '', 10);
    const cols = parseInt(window.prompt('Số cột:', '2') ?? '', 10);
    const dx = parseFloat(window.prompt('Khoảng cách cột theo X (mm):', '1000') ?? '');
    const dy = parseFloat(window.prompt('Khoảng cách hàng theo Y (mm):', '1000') ?? '');
    if ([rows, cols, dx, dy].every((n) => Number.isFinite(n))) {
      const targets = st.doc.entities.filter((e) => sel.includes(e.id));
      st.addEntities(arrayRect(targets, rows, cols, dx, dy));
    }
  }

  function handleArrayPolar(w: Pt) {
    const st = useCadStore.getState();
    const sel = needSelection();
    if (!sel.length) return;
    const count = parseInt(window.prompt('Array tròn — số bản (kể cả gốc):', '6') ?? '', 10);
    const angle = parseFloat(window.prompt('Tổng góc quét (độ, 360 = đầy vòng):', '360') ?? '');
    if (Number.isFinite(count) && count >= 2 && Number.isFinite(angle)) {
      const targets = st.doc.entities.filter((e) => sel.includes(e.id));
      st.addEntities(arrayPolar(targets, w, count, angle, true));
    }
  }

  function handleScale(w: Pt) {
    const st = useCadStore.getState();
    const sel = needSelection();
    if (!sel.length) return;
    const f = parseFloat(window.prompt('Hệ số scale (VD 2, 0.5):', '1') ?? '');
    if (Number.isFinite(f) && f > 0) {
      const targets = st.doc.entities.filter((e) => sel.includes(e.id));
      st.updateEntities(scaleEntitiesAbout(targets, w, f));
    }
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
    const raw = window.prompt(
      'Divide/Measure — gõ SỐ ĐOẠN để chia đều (VD "5"), hoặc "M <khoảng cách mm>" để đo cố định (VD "M 300"):',
      '5',
    );
    if (!raw || !raw.trim()) return;
    const trimmed = raw.trim();
    const measureMatch = /^m\s+([\d.]+)$/i.exec(trimmed);
    let points: Pt[];
    let label: string;
    if (measureMatch) {
      const segLen = parseFloat(measureMatch[1]);
      if (!Number.isFinite(segLen) || segLen <= 0) {
        st.setStatus('Measure: khoảng cách không hợp lệ.');
        return;
      }
      points = measureEntity(target, segLen);
      label = `Measure mỗi ${segLen}mm`;
    } else {
      const n = parseInt(trimmed, 10);
      if (!Number.isFinite(n) || n < 2) {
        st.setStatus('Divide: số đoạn phải là số nguyên ≥ 2.');
        return;
      }
      points = divideEntity(target, n);
      label = `Divide ${n} đoạn`;
    }
    if (!points.length) {
      st.setStatus('Divide/Measure: không đặt được điểm chia (đối tượng quá ngắn so với tham số).');
      return;
    }
    const markerR = 15; // mm — chấm nhỏ đánh dấu điểm chia (bán kính rất nhỏ, đủ thấy khi zoom)
    const markers: Entity[] = points.map((p) => ({ id: newId('e'), type: 'circle', layer: st.currentLayer, c: p, r: markerR }));
    st.addEntities(markers);
    st.setStatus(`${label}: đã đặt ${markers.length} điểm chia.`);
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
      if (e.key === 'F8') {
        e.preventDefault();
        ix.current.orthoLock = !ix.current.orthoLock;
        st.setStatus(`Ortho ${ix.current.orthoLock ? 'BẬT' : 'tắt'} (F8) — khoá hướng ngang/dọc khi vẽ.`);
        return;
      }
      // Việc 4 — F12: bật/tắt Dynamic Input heads-up cạnh con trỏ (thói quen AutoCAD).
      if (e.key === 'F12') {
        e.preventDefault();
        ix.current.hud = !ix.current.hud;
        st.setStatus(`Dynamic Input ${ix.current.hud ? 'BẬT' : 'tắt'} (F12) — hiện số/độ dài cạnh con trỏ.`);
        ix.current.redraw = true;
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
      if (e.key === 'Delete' || (e.key === 'e' && st.tool === 'select')) {
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
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        onWheel={onWheel}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: 13 }} onClick={(e) => e.stopPropagation()}>
            <span>{viewPhoto.caption || 'Ảnh hiện trường'}</span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Gỡ ảnh này khỏi bản vẽ?')) {
                  useCadStore.getState().removePhoto(viewPhoto.id);
                  useCadStore.getState().setStatus('Đã gỡ ảnh hiện trường.');
                }
                setViewPhoto(null);
              }}
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
