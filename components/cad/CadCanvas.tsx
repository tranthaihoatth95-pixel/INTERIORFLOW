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
import type { Entity, Pt, Viewport } from '@/lib/cad/model';
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
}

function css(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
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

  /** điểm hiệu dụng (snap + ortho + dynamic) so với base point (nếu có). */
  function effectivePoint(base?: Pt): Pt {
    const st = useCadStore.getState();
    let p = ix.current.snap.pt;
    if (base) {
      // dynamic input: độ dài theo hướng con trỏ
      if (ix.current.dynBuf) {
        const len = parseFloat(ix.current.dynBuf);
        if (Number.isFinite(len)) {
          let dx = ix.current.cursorWorld.x - base.x;
          let dy = ix.current.cursorWorld.y - base.y;
          if (ix.current.ortho) {
            if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
            else dx = 0;
          }
          const d = Math.hypot(dx, dy) || 1;
          p = { x: base.x + (dx / d) * len, y: base.y + (dy / d) * len };
          return p;
        }
      }
      if (ix.current.ortho) {
        const dx = p.x - base.x;
        const dy = p.y - base.y;
        if (Math.abs(dx) >= Math.abs(dy)) p = { x: p.x, y: base.y };
        else p = { x: base.x, y: p.y };
      }
    }
    void st;
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
    ix.current.snap = findSnap(st.doc, ix.current.cursorWorld, tolMm(), st.gridStep, st.snap);
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
  };

  const onPointerUp = (ev: React.PointerEvent) => {
    const st = useCadStore.getState();
    if (ix.current.panning) {
      ix.current.panning = false;
      ix.current.panStart = null;
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
          commit({ id: newId('e'), type: 'dim', layer: st.currentLayer, a: P[0], b: P[1], off: 200 });
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
        if (st.pendingBlock) {
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
      default:
        break;
    }
    ix.current.redraw = true;
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
        st.clearSelection();
        st.setTool('select');
        ix.current.redraw = true;
        return;
      }
      if (e.key === 'Enter') {
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
    drawEntities(ctx, v, st.doc, { stroke: t3, lineWidth: 1.3, text: true });

    // highlight selection
    if (st.selection.length) {
      const sel = new Set(st.selection);
      for (const e of st.doc.entities) {
        if (!sel.has(e.id)) continue;
        drawEntity(ctx, v, st.doc, e, { stroke: accent, forceColor: accent, lineWidth: 2.4, text: true });
      }
    }

    drawPreview(ctx, v, accent);
    drawSelectionBox(ctx, v, accent);
    drawSnap(ctx, v, accent);
    drawCrosshair(ctx, W, H, gridMinor, t3);

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
        if (P.length === 1) {
          line(P[0], cur);
          labelLen(ctx, v, P[0], cur, accent);
        }
        break;
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
