'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, FileText, Film, Presentation, Check } from 'lucide-react';
import { tweenBase, prefersReducedMotion } from '@/lib/motion';
import { useFlowStore } from '@/lib/store';
import { stashPresentHandoff } from '@/lib/present-editor/handoff';
import ExportPptxButton from '@/components/ExportPptxButton';
import type { InteriorNodeData, PortValue } from '@/lib/types';

function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

/** Ảnh output có lightbox khi click. Fade nhẹ khi ảnh load xong. */
export function OutputImage({ src, className }: { src: string; className?: string }) {
  const setLightboxUrl = useFlowStore((s) => s.setLightboxUrl);
  const [loaded, setLoaded] = useState(false);
  const reduce = prefersReducedMotion();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <motion.img
      src={src}
      alt="output"
      loading="lazy"
      initial={false}
      animate={{ opacity: reduce || loaded ? 1 : 0 }}
      transition={tweenBase}
      onLoad={() => setLoaded(true)}
      className={`nodrag cursor-zoom-in rounded-md object-cover ${className ?? ''}`}
      onClick={() => setLightboxUrl(src)}
    />
  );
}

/** Video output: player inline (loop/muted) + click mở lightbox + nút tải mp4. */
export function OutputVideo({ src, className }: { src: string; className?: string }) {
  const setLightboxUrl = useFlowStore((s) => s.setLightboxUrl);
  return (
    <div className="space-y-1.5">
      <video
        src={src}
        controls
        loop
        muted
        playsInline
        className={`nodrag w-full rounded-md bg-black object-cover ${className ?? ''}`}
      />
      <div className="flex gap-1.5">
        <button
          className="nodrag flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--border-strong)] py-1.5 text-[11px] text-[var(--t2)] hover:border-[#fb7185]/60"
          onClick={() => setLightboxUrl(src)}
        >
          <Film size={12} /> Phóng to
        </button>
        <button
          className="nodrag flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--border-strong)] py-1.5 text-[11px] text-[var(--t2)] hover:border-[#fb7185]/60"
          onClick={() => downloadDataUrl(src, 'walkthrough.mp4')}
        >
          <Download size={12} /> Tải mp4
        </button>
      </div>
    </div>
  );
}

/** So sánh A/B bằng slider clip — đọc ảnh từ upstream đã chạy. */
function CompareBody({ nodeId }: { nodeId: string }) {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const [pos, setPos] = useState(50);

  const imageFor = (handle: string): string | null => {
    const edge = edges.find((e) => e.target === nodeId && e.targetHandle === handle);
    if (!edge) return null;
    const src = nodes.find((n) => n.id === edge.source);
    const out = src?.data.run.outputs?.[edge.sourceHandle ?? ''];
    if (out && out.dataType === 'image') return String(out.value);
    if (src?.data.defType === 'input.image' && src.data.params.file) return String(src.data.params.file);
    return null;
  };
  const a = imageFor('imageA');
  const b = imageFor('imageB');

  if (!a || !b)
    return (
      <p className="rounded-md bg-[var(--field)] px-2 py-2 text-[10px] leading-snug text-[var(--t4)]">
        Nối 2 ảnh A/B (chạy node upstream trước) để so sánh.
      </p>
    );

  return (
    <div className="nodrag select-none">
      <div className="relative h-36 w-full overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b} alt="B" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a}
            alt="A"
            className="absolute inset-0 h-36 w-full object-cover"
            style={{ width: '15.5rem' }}
            loading="lazy"
          />
        </div>
        <div className="absolute bottom-0 top-0 w-0.5 bg-violet-400" style={{ left: `${pos}%` }} />
        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1 text-[9px] text-white">A</span>
        <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1 text-[9px] text-white">B</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="mt-1.5 w-full accent-violet-500"
      />
    </div>
  );
}

/** Nút tải PNG/PDF cho Export Board. */
function BoardActions({ board, projectName }: { board: string; projectName: string }) {
  const [busy, setBusy] = useState(false);
  const safeName = (projectName || 'board').replace(/[\\/:*?"<>|]/g, '').trim() || 'board';
  return (
    <div className="flex gap-1.5">
      <button
        className="nodrag flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--border-strong)] py-1.5 text-[11px] text-[var(--t2)] hover:border-violet-500/60"
        onClick={() => downloadDataUrl(board, `${safeName}.jpg`)}
      >
        <Download size={12} /> PNG/JPG
      </button>
      <button
        disabled={busy}
        className="nodrag flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--border-strong)] py-1.5 text-[11px] text-[var(--t2)] hover:border-violet-500/60 disabled:opacity-40"
        onClick={async () => {
          setBusy(true);
          try {
            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            pdf.addImage(board, 'JPEG', 0, 0, 297, 210);
            pdf.save(`${safeName}.pdf`);
          } finally {
            setBusy(false);
          }
        }}
      >
        <FileText size={12} /> PDF
      </button>
    </div>
  );
}

/** Nút tải PDF 16:9 cho Export Deck. */
function DeckActions({ slidesJson, deckName }: { slidesJson: string; deckName: string }) {
  const [busy, setBusy] = useState(false);
  const safeName = (deckName || 'deck').replace(/[\\/:*?"<>|]/g, '').trim() || 'deck';
  return (
    <div className="flex w-full flex-col gap-1.5">
      <button
        disabled={busy}
        className="nodrag flex w-full items-center justify-center gap-1.5 rounded-md bg-orange-500/90 py-2 text-[11px] font-medium text-white hover:bg-orange-400 disabled:opacity-40"
        onClick={async () => {
          setBusy(true);
          try {
            const slides = JSON.parse(slidesJson) as string[];
            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });
            slides.forEach((s, i) => {
              if (i > 0) pdf.addPage([1920, 1080], 'landscape');
              pdf.addImage(s, 'JPEG', 0, 0, 1920, 1080);
            });
            pdf.save(`${safeName}.pdf`);
          } finally {
            setBusy(false);
          }
        }}
      >
        <FileText size={13} /> {busy ? 'Đang xuất…' : 'Tải PDF thuyết trình'}
      </button>
      <ExportPptxButton slidesJson={slidesJson} deckName={deckName} />
    </div>
  );
}

/**
 * Nút TƯỜNG MINH "Đưa sang Present →" trên node slide.* đã render (quyết định user #4 — Sprint 2).
 * Bấm: stash ảnh (lib/present-editor/handoff, consume-once) → toast nhỏ "Đã gửi N ảnh…" →
 * điều hướng /present-editor (delay ngắn để user kịp thấy xác nhận). Ảnh vào RỔ REFERENCE
 * của Present (human-in-loop kéo vào slide), không tự chèn vào deck.
 */
function SendToPresent({ images }: { images: string[] }) {
  const router = useRouter();
  const [sent, setSent] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  if (!images.length) return null;

  if (sent !== null) {
    return (
      <p className="nodrag flex w-full items-center justify-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 py-1.5 text-[11px] text-emerald-300">
        <Check size={12} /> Đã gửi {sent} ảnh sang Present…
      </p>
    );
  }
  return (
    <button
      className="nodrag flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border-strong)] py-1.5 text-[11px] text-[var(--t2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--t1)]"
      title="Đẩy ảnh slide đã render vào rổ Reference của trình dàn trang Present"
      onClick={() => {
        stashPresentHandoff(images);
        setSent(images.length);
        timerRef.current = setTimeout(() => router.push('/present-editor'), 650);
      }}
    >
      <Presentation size={12} /> Đưa sang Present →
    </button>
  );
}

/**
 * Badge "tầng đã chạy" cho bộ node render v2 (kiến trúc 2 tầng): node ghi output ẩn
 * `_tier` (Tầng AI · … / Tầng lõi tất định …) — hiện rõ để KHÔNG BAO GIỜ mock-im-lặng.
 */
function TierBadge({ tier }: { tier: string }) {
  const isAi = tier.startsWith('Tầng AI');
  return (
    <p
      className={`nodrag rounded-md border px-2 py-1 text-[9.5px] leading-snug ${
        isAi
          ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
          : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      }`}
      title={tier}
    >
      {tier}
    </p>
  );
}

function downloadText(content: string, filename: string, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Nút tải OBJ/MTL + convert FBX (Blender local qua /api/render/fbx) cho node Bản vẽ → 3D. */
function ObjFbxActions({ obj, mtl, cam }: { obj: string; mtl: string; cam: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <button
          className="nodrag flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--border-strong)] py-1.5 text-[11px] text-[var(--t2)] hover:border-sky-500/60"
          onClick={() => {
            downloadText(obj, 'interiorflow-scene.obj');
            downloadText(mtl, 'interiorflow-scene.mtl');
          }}
        >
          <Download size={12} /> OBJ + MTL
        </button>
        <button
          disabled={busy}
          className="nodrag flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--border-strong)] py-1.5 text-[11px] text-[var(--t2)] hover:border-sky-500/60 disabled:opacity-40"
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            try {
              const res = await fetch('/api/render/fbx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ obj, mtl, camera: cam || undefined }),
              });
              const body = (await res.json().catch(() => ({}))) as { fbx?: string; error?: string };
              if (!res.ok || !body.fbx) {
                setMsg(body.error ?? `Convert FBX lỗi (HTTP ${res.status}).`);
                return;
              }
              const bin = atob(body.fbx);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
              const a = document.createElement('a');
              a.href = url;
              a.download = 'interiorflow-scene.fbx';
              a.click();
              URL.revokeObjectURL(url);
              setMsg('Đã xuất FBX (Blender local) — import thẳng vào 3ds Max/Blender.');
            } catch {
              setMsg('Không gọi được server convert FBX.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <Download size={12} /> {busy ? 'Đang convert…' : 'FBX (Blender)'}
        </button>
      </div>
      {msg && <p className="rounded-md bg-[var(--field)] px-2 py-1.5 text-[9.5px] leading-snug text-[var(--t3)]">{msg}</p>}
    </div>
  );
}

/** Rút danh sách ảnh slide của CHÍNH node này (deck → mảng _slides; composer → 1 ảnh). */
function slideImagesOf(defType: string, outputs: Record<string, PortValue> | null | undefined): string[] {
  if (!defType.startsWith('slide.') || !outputs) return [];
  if (defType === 'slide.deck' && outputs._slides) {
    try {
      const slides = JSON.parse(String(outputs._slides.value)) as unknown;
      if (Array.isArray(slides) && slides.length) return slides.map(String);
    } catch {
      /* JSON hỏng — rơi xuống ảnh đơn */
    }
  }
  const img = Object.values(outputs).find((o: PortValue) => o.dataType === 'image');
  return img ? [String(img.value)] : [];
}

/** Phần hiển thị đặc thù theo loại node (dưới params, trên/thay output mặc định). */
export function NodeExtras({ nodeId, data }: { nodeId: string; data: InteriorNodeData }) {
  const { defType, run, params } = data;
  const outputs = run.outputs;
  // Bộ node render v2: output ẩn _tier = tầng đã chạy (AI / lõi tất định) — luôn hiện rõ.
  const tier = run.status === 'done' && outputs?._tier ? String(outputs._tier.value) : null;

  if (defType === 'util.compare') return <CompareBody nodeId={nodeId} />;

  // Bản vẽ → 3D: thông số scene + nút tải OBJ/MTL + convert FBX qua Blender local.
  if (defType === 'three.cad2fbx' && run.status === 'done' && outputs?._obj) {
    return (
      <div className="space-y-1.5">
        {outputs.text && (
          <p className="whitespace-pre-line rounded-md bg-[var(--field)] px-2 py-1.5 text-[10px] leading-snug text-[var(--t3)]">
            {String(outputs.text.value)}
          </p>
        )}
        <ObjFbxActions
          obj={String(outputs._obj.value)}
          mtl={String(outputs._mtl?.value ?? '')}
          cam={String(outputs._cam?.value ?? '')}
        />
        {tier && <TierBadge tier={tier} />}
      </div>
    );
  }

  // Góc máy ảnh: hiện mẩu prompt góc máy để user biết node đang phát gì.
  if (defType === 'three.camera' && run.status === 'done' && outputs?.prompt) {
    return (
      <div className="space-y-1.5">
        <p className="rounded-md bg-[var(--field)] px-2 py-1.5 text-[10px] leading-snug text-[var(--t3)]">
          {String(outputs.prompt.value)}
        </p>
        {tier && <TierBadge tier={tier} />}
      </div>
    );
  }

  if (defType === 'util.palette' && run.status === 'done' && outputs?.text) {
    const colors = String(outputs.text.value)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    return (
      <div>
        <div className="flex gap-1">
          {colors.map((c) => (
            <div key={c} className="h-8 flex-1 rounded" style={{ background: c }} title={c} />
          ))}
        </div>
        <p className="mt-1 break-all text-[9px] leading-snug text-[var(--t4)]">{colors.join(' ')}</p>
      </div>
    );
  }

  // video output → player + tải mp4 (đặt trước ảnh vì node video không có output ảnh)
  if (run.status === 'done' && outputs) {
    const video = Object.values(outputs).find((o: PortValue) => o.dataType === 'video');
    if (video) return <OutputVideo src={String(video.value)} className="h-32" />;
  }

  // multi-image outputs (moodboard) — grid 2×2
  if (run.status === 'done' && outputs) {
    const images = Object.values(outputs).filter((o: PortValue) => o.dataType === 'image');
    if (images.length > 1) {
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1">
            {images.map((img, i) => (
              <OutputImage key={i} src={String(img.value)} className="h-16 w-full" />
            ))}
          </div>
          {tier && <TierBadge tier={tier} />}
        </div>
      );
    }
    if (images.length === 1) {
      const single = String(images[0].value);
      return (
        <div className="space-y-1.5">
          <OutputImage src={single} className={defType.startsWith('slide.') ? 'aspect-video w-full' : 'h-32 w-full'} />
          {defType === 'out.board' && (
            <BoardActions board={single} projectName={String(params.projectName ?? '')} />
          )}
          {defType === 'slide.deck' && outputs._slides && (
            <DeckActions slidesJson={String(outputs._slides.value)} deckName={String(params.deckName ?? '')} />
          )}
          {defType.startsWith('slide.') && <SendToPresent images={slideImagesOf(defType, outputs)} />}
          {tier && <TierBadge tier={tier} />}
        </div>
      );
    }
  }

  return null;
}
