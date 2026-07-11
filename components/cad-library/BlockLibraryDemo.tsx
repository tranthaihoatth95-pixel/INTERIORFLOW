'use client';

/**
 * components/cad-library/BlockLibraryDemo.tsx — DEMO độc lập cho thư viện block CAD mới.
 *
 * KHÔNG đụng `components/cad/**` (trình CAD chính của agent khác). Trang này chỉ:
 *   1. Tải `public/cad-library/manifest.json` (qua `lib/cad/block-library.ts`), hiển thị lưới
 *      block có thumbnail SVG, lọc theo danh mục + tìm kiếm.
 *   2. Cho phép "chèn thử": chọn 1 block → click vào canvas xem trước → block được tải, parse
 *      DXF, làm phẳng (xoay/scale) thành Entity chuẩn rồi vẽ ra bằng CHÍNH `drawEntity` của
 *      `lib/cad/render.ts` (import, không sửa) — chứng minh entity sinh ra tương thích 100%
 *      với renderer thật của app, sẵn sàng để trình CAD chính nối vào panel thư viện thật.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  groupByCategory,
  insertBlockById,
  loadManifest,
  searchBlocks,
  type LibraryBlockMeta,
  type LibraryManifest,
} from '@/lib/cad/block-library';
import { DEFAULT_LAYERS, docBox, fitBox, screenToWorld, worldToScreen, zoomAt, type Doc, type Entity, type Pt, type Viewport } from '@/lib/cad/model';
import { drawEntity, type DrawStyle } from '@/lib/cad/render';

const DEFAULT_WORLD_BOX = { minX: -3000, minY: -2000, maxX: 3000, maxY: 2000 };

const STYLE: DrawStyle = { stroke: '#c08a5a', lineWidth: 1.4, text: true };

function emptyPreviewDoc(): Doc {
  return { entities: [], layers: DEFAULT_LAYERS.map((l) => ({ ...l })) };
}

export default function BlockLibraryDemo() {
  const [manifest, setManifest] = useState<LibraryManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selected, setSelected] = useState<LibraryBlockMeta | null>(null);
  const [rotDeg, setRotDeg] = useState(0);
  const [mirror, setMirror] = useState(false);
  const [status, setStatus] = useState('Chọn 1 block rồi click vào khung xem trước để chèn thử.');
  const [placedCount, setPlacedCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const docRef = useRef<Doc>(emptyPreviewDoc());
  const viewportRef = useRef<Viewport | null>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  useEffect(() => {
    loadManifest()
      .then(setManifest)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const categories = useMemo(() => (manifest ? manifest.categories : []), [manifest]);

  const filteredGrouped = useMemo(() => {
    if (!manifest) return new Map<string, LibraryBlockMeta[]>();
    const base = query.trim() ? searchBlocks(manifest, query) : manifest.blocks;
    const scoped = activeCategory === 'all' ? base : base.filter((b) => b.category === activeCategory);
    const map = new Map<string, LibraryBlockMeta[]>();
    for (const b of scoped) {
      if (!map.has(b.category)) map.set(b.category, []);
      map.get(b.category)!.push(b);
    }
    return map;
  }, [manifest, query, activeCategory]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const doc = docRef.current;
    if (!viewportRef.current) {
      const box = docBox(doc) ?? DEFAULT_WORLD_BOX;
      viewportRef.current = fitBox(box, canvas.width, canvas.height, 80);
    }
    const v = viewportRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0f12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // lưới nhẹ mỗi 500mm để có cảm giác tỉ lệ
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const step = 500;
    const box = DEFAULT_WORLD_BOX;
    for (let x = Math.ceil(box.minX / step) * step; x <= box.maxX; x += step) {
      const a = worldToScreen(v, { x, y: box.minY });
      const b = worldToScreen(v, { x, y: box.maxY });
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (let y = Math.ceil(box.minY / step) * step; y <= box.maxY; y += step) {
      const a = worldToScreen(v, { x: box.minX, y });
      const b = worldToScreen(v, { x: box.maxX, y });
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // viền phòng mẫu 6m x 4m để có bối cảnh
    ctx.strokeStyle = 'rgba(232,228,220,0.35)';
    ctx.lineWidth = 2;
    const p0 = worldToScreen(v, { x: box.minX, y: box.minY });
    const p1 = worldToScreen(v, { x: box.maxX, y: box.maxY });
    ctx.strokeRect(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y));

    for (const e of doc.entities) drawEntity(ctx, v, doc, e, STYLE);
  }, []);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = 560;
      viewportRef.current = null; // buộc tính lại fit theo kích thước mới
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !viewportRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    viewportRef.current = zoomAt(viewportRef.current, screen, factor);
    redraw();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 2 && e.button !== 1) return; // phải/giữa để pan, trái để đặt block
    e.preventDefault();
    if (!viewportRef.current) return;
    dragRef.current = { x: e.clientX, y: e.clientY, panX: viewportRef.current.panX, panY: viewportRef.current.panY };
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !viewportRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    viewportRef.current = { ...viewportRef.current, panX: dragRef.current.panX + dx, panY: dragRef.current.panY + dy };
    redraw();
  };
  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const handleClickPlace = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    if (!manifest || !selected || !viewportRef.current) {
      setStatus(manifest && !selected ? 'Chưa chọn block — click 1 thumbnail bên trái trước.' : 'Đang tải thư viện…');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screen: Pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const world = screenToWorld(viewportRef.current, screen);

    try {
      setStatus(`Đang tải + chèn "${selected.name}"…`);
      const rot = (rotDeg * Math.PI) / 180;
      const sx = mirror ? -1 : 1;
      const entities: Entity[] = await insertBlockById(manifest, selected.id, world, { rot, sx, sy: 1, layer: 'l-furniture' });
      docRef.current = { ...docRef.current, entities: [...docRef.current.entities, ...entities] };
      setPlacedCount((n) => n + 1);
      redraw();
      setStatus(`Đã chèn "${selected.name}" (${entities.length} entity) tại (${Math.round(world.x)}, ${Math.round(world.y)}) mm.`);
    } catch (err) {
      setStatus(`Lỗi chèn block: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleClear = () => {
    docRef.current = emptyPreviewDoc();
    setPlacedCount(0);
    redraw();
    setStatus('Đã xoá canvas xem trước.');
  };

  if (error) {
    return (
      <div className="p-8 text-sm text-red-400">
        Lỗi tải thư viện block: {error}. Đã chạy <code>npx tsx scripts/cad-library/generate-library.ts</code> chưa?
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <header className="border-b border-[var(--border)] px-6 py-5">
        <h1 className="text-2xl font-serif" style={{ fontFamily: 'Cormorant, var(--font-sans)' }}>
          Thư viện block CAD — Demo
        </h1>
        <p className="mt-1 text-sm text-[var(--t3)]">
          {manifest ? `${manifest.count} block · ${manifest.categories.length} danh mục · nguồn: tự dựng vector (CC0)` : 'Đang tải manifest…'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[380px_1fr]">
        {/* cột trái: lưới block */}
        <div className="border-r border-[var(--border)] p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm block (vd: sofa, giường, cửa...)"
            className="mb-3 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`rounded-full border px-2.5 py-1 text-xs ${activeCategory === 'all' ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--t3)]'}`}
            >
              Tất cả
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setActiveCategory(c.slug)}
                className={`rounded-full border px-2.5 py-1 text-xs ${activeCategory === c.slug ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--t3)]'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
            {Array.from(filteredGrouped.entries()).map(([slug, blocks]) => (
              <div key={slug} className="mb-4">
                <div className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--t4)]">
                  {blocks[0]?.categoryLabel ?? slug} ({blocks.length})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {blocks.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelected(b)}
                      title={`${b.name} — ${b.w}×${b.h} mm`}
                      className={`group flex flex-col items-center rounded-[var(--radius-sm)] border p-1.5 text-center transition-colors ${
                        selected?.id === b.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.thumb} alt={b.name} className="h-16 w-full rounded object-contain" loading="lazy" />
                      <span className="mt-1 line-clamp-2 text-[11px] leading-tight text-[var(--t2)]">{b.name}</span>
                      <span className="text-[10px] text-[var(--t4)]">{b.w}×{b.h}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {manifest && filteredGrouped.size === 0 && <p className="text-sm text-[var(--t4)]">Không tìm thấy block phù hợp.</p>}
          </div>
        </div>

        {/* cột phải: xem trước + chèn thử */}
        <div className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[var(--t3)]">Đang chọn:</span>
            <span className="font-medium">{selected ? selected.name : '— chưa chọn —'}</span>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setRotDeg((d) => (d + 90) % 360)}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1.5 text-xs hover:border-[var(--border-strong)]"
              >
                Xoay 90° ({rotDeg}°)
              </button>
              <button
                onClick={() => setMirror((m) => !m)}
                className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs ${mirror ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)]'}`}
              >
                Lật gương {mirror ? 'BẬT' : 'TẮT'}
              </button>
              <button
                onClick={handleClear}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1.5 text-xs hover:border-red-400 hover:text-red-400"
              >
                Xoá canvas ({placedCount})
              </button>
            </div>
          </div>

          <div ref={containerRef} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
            <canvas
              ref={canvasRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onContextMenu={(e) => e.preventDefault()}
              onClick={handleClickPlace}
              className="block w-full cursor-crosshair"
            />
          </div>
          <p className="mt-2 text-xs text-[var(--t4)]">
            Click trái để đặt block đã chọn · giữ chuột phải/giữa kéo để pan · lăn chuột để zoom. Ô lưới 500mm, khung viền = phòng mẫu 6m×4m.
          </p>
          <p className="mt-1 text-xs text-[var(--t3)]">{status}</p>
        </div>
      </div>
    </div>
  );
}
