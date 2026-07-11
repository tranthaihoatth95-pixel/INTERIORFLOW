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

import { useEffect, useRef } from 'react';
import { useCadStore } from '@/lib/cad/store';
import { useFlowStore } from '@/lib/store';
import type { Entity, Pt, Viewport, DimEntity, LineEntity } from '@/lib/cad/model';
import { screenToWorld, worldToScreen, zoomAt, fitBox, docBox, dist } from '@/lib/cad/model';
import { drawEntities, drawEntity } from '@/lib/cad/render';
import { findSnap, hitTest, idsInRect, type SnapResult } from '@/lib/cad/query';
import { newId } from '@/lib/cad/store';
import {
  translateEntity,
  rotateEntity,
  mirrorEntity,
  offsetEntity,
  withNewId,
} from '@/lib/cad/geometry';
import { wallChain, roomRect } from '@/lib/cad/commands';
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
}

function css(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

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

  /** điểm hiệu dụng (snap + ortho/polar tracking + dynamic) so với base point (nếu có). */
  function effectivePoint(base?: Pt): Pt {
    let p = ix.current.snap.pt;
    if (base) {
      // dynamic input: độ dài theo hướng con trỏ
      if (ix.current.dynBuf) {
        const len = parseFloat(ix.current.dynBuf);
        if (Number.isFinite(len)) {
          const dx0 = ix.current.cursorWorld.x - base.x;
          const dy0 = ix.current.cursorWorld.y - base.y;
          const { dx, dy } = applyDirectionConstraint(dx0, dy0);
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
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
    const screen = toLocal(e);
    updateCursor(screen);
    const st = useCadStore.getState();

    // pan: chuột giữa, hoặc space, hoặc tool pan
    if (e.button === 1 || ix.current.spaceHeld || st.tool === 'pan') {
      ix.current.panning = true;
      ix.current.panStart = { screen, vp: st.viewport };
      return;
    }
    if (e.button !== 0) return;

    if (st.tool === 'select') {
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
    ix.current.ortho = ev.shiftKey;
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
        // kéo phải→trái = window (bao gọn), trái→phải = crossing (chạm)
        const windowMode = b.x < a.x;
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

  const onDblClick = () => {
    const st = useCadStore.getState();
    if (st.tool === 'polyline' && ix.current.pts.length >= 2) finishPolyline(false);
    else if (st.tool === 'wall' && ix.current.pts.length >= 2) finishWall(false);
  };

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
      case 'room':
        P.push(w);
        if (P.length === 2) {
          const name = window.prompt('Tên phòng:', 'PHÒNG') ?? '';
          const textLayer = st.doc.layers.find((l) => l.name === 'Ghi chú')?.id ?? st.currentLayer;
          const { entities } = roomRect(P[0], P[1], st.wallThickness, name || 'PHÒNG', st.currentLayer, textLayer);
          st.addEntities(entities);
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
      case 'arc':
        P.push(w);
        if (P.length === 3) {
          const arc = arcFrom3(P[0], P[1], P[2]);
          if (arc) commit({ id: newId('e'), type: 'arc', layer: st.currentLayer, ...arc });
          else ix.current.pts = [];
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
    });
    st.setStatus(`Hatch: đã tô ${st.hatchPattern} (${poly.length} đỉnh biên).`);
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

  /* ───────── keyboard ───────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return; // đang gõ command line / layer name
      const st = useCadStore.getState();

      // undo/redo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        ix.current.redraw = true;
        return;
      }
      if (e.key === ' ') {
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
        // fillet/chamfer/lengthen: số gõ trước khi click là THAM SỐ (bán kính/khoảng cách/delta),
        // không phải điểm — chốt riêng, không đi qua handleClick.
        if (ix.current.dynBuf && (st.tool === 'fillet' || st.tool === 'chamfer' || st.tool === 'lengthen')) {
          const n = parseFloat(ix.current.dynBuf);
          if (Number.isFinite(n)) {
            if (st.tool === 'fillet') st.setFilletRadius(n);
            else if (st.tool === 'chamfer') st.setChamferDist(n, n);
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
        if (st.tool === 'polyline') finishPolyline(false);
        else if (st.tool === 'wall') finishWall(false);
        else if (ix.current.dynBuf && ix.current.pts.length) {
          handleClick(effectivePoint(ix.current.pts[ix.current.pts.length - 1]), e.shiftKey);
        }
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
      // dynamic input số
      if (/[0-9.]/.test(e.key)) {
        ix.current.dynBuf += e.key;
        st.setStatus(`Nhập độ dài: ${ix.current.dynBuf} mm (Enter để chốt)`);
        return;
      }
      if (e.key === 'Backspace' && ix.current.dynBuf) {
        ix.current.dynBuf = ix.current.dynBuf.slice(0, -1);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') ix.current.spaceHeld = false;
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
        drawEntity(ctx, v, docToDraw, e, { stroke: accent, forceColor: accent, lineWidth: 2.4, text: true, dimStyle: st.dimStyle });
      }
    }

    // grips: chỉ hiện khi tool=select và đang chọn ĐÚNG 1 entity
    if (st.tool === 'select' && st.selection.length === 1) {
      const ent = docToDraw.entities.find((e) => e.id === st.selection[0]);
      if (ent) drawGrips(ctx, v, ent, accent);
    }

    drawPreview(ctx, v, accent);
    drawSelectionBox(ctx, v, accent);
    drawSnap(ctx, v, accent);
    drawCrosshair(ctx, W, H, gridMinor, t3);

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
          drawEntity(ctx, v, st.doc, ix.current.angularFirst, { stroke: accent, forceColor: accent, lineWidth: 2.6, text: false });
        }
        break;
      }
      case 'polyline':
      case 'wall':
        for (let i = 0; i < P.length - 1; i++) line(P[i], P[i + 1]);
        if (P.length) line(P[P.length - 1], cur);
        break;
      case 'rect':
      case 'room':
        if (P.length === 1) {
          const a = S(P[0]);
          const b = S(cur);
          ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
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
          if (target) drawEntity(ctx, v, st.doc, target, { stroke: accent, forceColor: accent, lineWidth: 2.6, text: false });
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
    const windowMode = ix.current.cursorWorld.x < sd.start.x;
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.setLineDash(windowMode ? [] : [5, 4]);
    ctx.globalAlpha = 0.9;
    ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = accent;
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
        style={{ display: 'block', touchAction: 'none', cursor: 'crosshair' }}
      />
    </div>
  );
}

/** dựng cung tròn qua 3 điểm; null nếu thẳng hàng. */
function arcFrom3(p1: Pt, p2: Pt, p3: Pt): { c: Pt; r: number; a1: number; a2: number } | null {
  const ax = p1.x;
  const ay = p1.y;
  const bx = p2.x;
  const by = p2.y;
  const cx = p3.x;
  const cy = p3.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-6) return null;
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const c = { x: ux, y: uy };
  const r = Math.hypot(ax - ux, ay - uy);
  let a1 = Math.atan2(ay - uy, ax - ux);
  const a2 = Math.atan2(cy - uy, cx - ux);
  const am = Math.atan2(by - uy, bx - ux);
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
