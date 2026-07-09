'use client';

/**
 * components/form/DraftBoard.tsx — Bảng DRAFT bố cục trước khi generate moodboard.
 *
 * Hiện các ảnh đã chọn thành thẻ trên khung 16:9 (đúng tỉ lệ output). Human-in-loop:
 * KÉO để dời, kéo góc để đổi TỈ LỆ to/nhỏ, nút To/Nhỏ, xoá, "Tự sắp xếp" lại. Khi
 * generate, render dùng đúng bố cục này (opts.placements) → ra sát ý.
 */

import { useCallback, useRef, useState } from 'react';
import { Wand2, X, Plus, Minus } from 'lucide-react';
import type { Placement } from '@/lib/moodboard-boards';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function DraftBoard({
  images,
  placements,
  onChange,
  onAuto,
  onRemove,
}: {
  images: { id: string; url: string }[];
  placements: Placement[];
  onChange: (p: Placement[]) => void;
  onAuto: () => void;
  onRemove: (index: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState(0);
  const drag = useRef<{ i: number; mode: 'move' | 'resize'; sx: number; sy: number; rw: number; rh: number; orig: Placement } | null>(null);

  const begin = useCallback(
    (e: React.PointerEvent, i: number, mode: 'move' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      setSel(i);
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect) return;
      const base = placements.slice();
      drag.current = { i, mode, sx: e.clientX, sy: e.clientY, rw: rect.width, rh: rect.height, orig: { ...placements[i] } };
      const move = (ev: PointerEvent) => {
        const d = drag.current;
        if (!d) return;
        const dx = (ev.clientX - d.sx) / d.rw;
        const dy = (ev.clientY - d.sy) / d.rh;
        const o = d.orig;
        const next = base.slice();
        if (d.mode === 'move') {
          next[d.i] = { ...o, xf: clamp(o.xf + dx, 0, 1 - o.wf), yf: clamp(o.yf + dy, 0, 1 - o.hf) };
        } else {
          next[d.i] = { ...o, wf: clamp(o.wf + dx, 0.06, 1 - o.xf), hf: clamp(o.hf + dy, 0.06, 1 - o.yf) };
        }
        onChange(next);
      };
      const up = () => {
        drag.current = null;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [placements, onChange],
  );

  // To / Nhỏ giữ nguyên tâm ảnh
  const scale = useCallback(
    (i: number, factor: number) => {
      const o = placements[i];
      if (!o) return;
      const cx = o.xf + o.wf / 2;
      const cy = o.yf + o.hf / 2;
      const nw = clamp(o.wf * factor, 0.06, 1);
      const nh = clamp(o.hf * factor, 0.06, 1);
      const next = placements.slice();
      next[i] = { xf: clamp(cx - nw / 2, 0, 1 - nw), yf: clamp(cy - nh / 2, 0, 1 - nh), wf: nw, hf: nh };
      onChange(next);
    },
    [placements, onChange],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[var(--t4)]">Kéo để dời · kéo góc để đổi tỉ lệ · ảnh #1 là ảnh chủ đạo</p>
        <button
          onClick={onAuto}
          className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--t2)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--t1)]"
        >
          <Wand2 size={13} /> Tự sắp xếp
        </button>
      </div>

      <div
        ref={boxRef}
        className="relative w-full overflow-hidden rounded-[12px] border border-[var(--border)] bg-[#141110]"
        style={{ aspectRatio: '16 / 9', touchAction: 'none' }}
        onPointerDown={() => setSel(-1)}
      >
        {placements.map((p, i) => {
          const on = sel === i;
          const img = images[i];
          return (
            <div
              key={img?.id ?? i}
              onPointerDown={(e) => begin(e, i, 'move')}
              style={{ left: `${p.xf * 100}%`, top: `${p.yf * 100}%`, width: `${p.wf * 100}%`, height: `${p.hf * 100}%` }}
              className={`absolute cursor-move select-none overflow-hidden rounded-[4px] ${
                on ? 'z-20 ring-2 ring-[var(--accent)]' : 'z-10 ring-1 ring-white/20'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img?.url} alt="" className="pointer-events-none h-full w-full object-cover" draggable={false} />
              <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {i + 1}
                {i === 0 ? ' · chủ đạo' : ''}
              </span>
              {on && (
                <>
                  <button
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onRemove(i);
                    }}
                    className="absolute right-1 top-1 z-30 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white hover:bg-red-500"
                    title="Bỏ ảnh khỏi bố cục"
                  >
                    <X size={11} />
                  </button>
                  {/* tay cầm resize góc dưới-phải */}
                  <div
                    onPointerDown={(e) => begin(e, i, 'resize')}
                    className="absolute bottom-0 right-0 z-30 h-4 w-4 cursor-se-resize rounded-tl-[4px] bg-[var(--accent)]"
                    title="Kéo đổi tỉ lệ"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* nút To/Nhỏ cho ảnh đang chọn */}
      {sel >= 0 && sel < placements.length && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--t4)]">Ảnh #{sel + 1}:</span>
          <button
            onClick={() => scale(sel, 0.88)}
            className="flex items-center gap-1 rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2 py-1 text-[12px] text-[var(--t2)] hover:bg-[var(--hover)]"
          >
            <Minus size={12} /> Nhỏ
          </button>
          <button
            onClick={() => scale(sel, 1.14)}
            className="flex items-center gap-1 rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2 py-1 text-[12px] text-[var(--t2)] hover:bg-[var(--hover)]"
          >
            <Plus size={12} /> To
          </button>
        </div>
      )}
    </div>
  );
}
