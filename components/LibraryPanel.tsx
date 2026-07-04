'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Trash2, Loader2 } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { sheetSlide, pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';

export const ASSET_MIME = 'application/interiorflow-asset-url';

export const LIBRARY_CATEGORIES = [
  'CAD / Sketch',
  'Ref nội thất',
  'Ref ngoại thất',
  'Style dàn trang',
  'Vật liệu / Texture',
] as const;

interface ServerAsset {
  id: string;
  name: string;
  category: string;
  tags: string;
  uploader: string;
  mine: boolean;
  url: string;
}

export function LibraryPanel() {
  const panel = useFlowStore((s) => s.panel);
  const setPanel = useFlowStore((s) => s.setPanel);
  const setLightboxUrl = useFlowStore((s) => s.setLightboxUrl);
  const [items, setItems] = useState<ServerAsset[]>([]);
  const [cat, setCat] = useState<string>('Ref nội thất');
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    fetch('/api/library')
      .then((r) => (r.ok ? r.json() : { assets: [] }))
      .then((d) => setItems(d.assets ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (panel === 'assets') refresh();
  }, [panel, refresh]);

  if (panel !== 'assets') return null;

  const q = query.trim().toLowerCase();
  const filtered = items.filter(
    (i) =>
      i.category === cat &&
      (!q || i.name.toLowerCase().includes(q) || i.tags.toLowerCase().includes(q)),
  );

  return (
    <motion.aside
      variants={sheetSlide('left')}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mat-panel z-20 flex w-72 flex-col border-r border-[var(--border)]"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
          Thư viện <span className="text-emerald-400">(team)</span>
        </span>
        <motion.button
          {...pressableIcon}
          onClick={() => setPanel(null)}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <X size={13} />
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-1 px-2.5 pt-2.5">
        {LIBRARY_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              'rounded-md px-2 py-1 text-[10px] transition-colors',
              cat === c
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--t4)] hover:bg-[var(--hover)] hover:text-[var(--t2)]',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 p-2.5">
        <input
          className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-xs text-[var(--t1)] placeholder-[var(--t5)] outline-none transition-colors focus:border-[var(--accent-ring)]"
          placeholder="Tìm theo tên / tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-1.5">
          <input
            className="min-w-0 flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-xs text-[var(--t1)] placeholder-[var(--t5)] outline-none transition-colors focus:border-[var(--accent-ring)]"
            placeholder="Tag khi upload: NCC, mã, style…"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = [...(e.target.files ?? [])];
              if (!files.length) return;
              setUploading(true);
              try {
                for (const f of files) {
                  const dataUrl = await new Promise<string>((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () => res(String(reader.result));
                    reader.onerror = () => rej(reader.error);
                    reader.readAsDataURL(f);
                  });
                  await fetch('/api/library', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: f.name.replace(/\.[^.]+$/, ''),
                      category: cat,
                      tags,
                      dataUrl,
                    }),
                  });
                }
                refresh();
              } finally {
                setUploading(false);
                e.target.value = '';
              }
            }}
          />
          <motion.button
            {...pressableIcon}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title={`Upload vào "${cat}" — cả team thấy`}
            className="flex shrink-0 items-center gap-1 rounded-[10px] bg-[var(--accent-strong)] px-2.5 text-[11px] font-medium text-white transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Upload
          </motion.button>
        </div>
      </div>

      <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto px-2.5 pb-4">
        {filtered.length === 0 && (
          <p className="col-span-2 px-1 pt-4 text-center text-xs leading-relaxed text-[var(--t5)]">
            Trống — upload ảnh {cat.toLowerCase()}, cả team dùng chung, kéo thả ra canvas.
          </p>
        )}
        {filtered.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(ASSET_MIME, item.url);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="group cursor-grab overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--field)] transition-transform hover:scale-[1.02] active:cursor-grabbing"
            title={`${item.name}${item.tags ? ` · ${item.tags}` : ''} · up bởi ${item.uploader} — kéo ra canvas`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.name}
              loading="lazy"
              className="h-20 w-full object-cover"
              onClick={() => setLightboxUrl(item.url)}
            />
            <div className="flex items-center gap-1 px-1.5 py-1">
              <p className="min-w-0 flex-1 truncate text-[10px] text-[var(--t2)]">{item.name}</p>
              {item.mine && (
                <button
                  onClick={async () => {
                    await fetch(`/api/library/${item.id}`, { method: 'DELETE' });
                    refresh();
                  }}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded text-[var(--t4)] opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="border-t border-[var(--border)] px-3 py-2 text-[9px] leading-relaxed text-[var(--t5)]">
        Thư viện chung cả team (lưu server) · kéo asset ra canvas → tự tạo node Import Image.
      </p>
    </motion.aside>
  );
}
