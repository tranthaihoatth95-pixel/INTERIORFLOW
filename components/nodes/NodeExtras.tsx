'use client';

import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import type { InteriorNodeData, PortValue } from '@/lib/types';

function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

/** Ảnh output có lightbox khi click. */
export function OutputImage({ src, className }: { src: string; className?: string }) {
  const setLightboxUrl = useFlowStore((s) => s.setLightboxUrl);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="output"
      loading="lazy"
      className={`nodrag cursor-zoom-in rounded-md object-cover ${className ?? ''}`}
      onClick={() => setLightboxUrl(src)}
    />
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
  );
}

/** Phần hiển thị đặc thù theo loại node (dưới params, trên/thay output mặc định). */
export function NodeExtras({ nodeId, data }: { nodeId: string; data: InteriorNodeData }) {
  const { defType, run, params } = data;
  const outputs = run.outputs;

  if (defType === 'util.compare') return <CompareBody nodeId={nodeId} />;

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

  // multi-image outputs (moodboard) — grid 2×2
  if (run.status === 'done' && outputs) {
    const images = Object.values(outputs).filter((o: PortValue) => o.dataType === 'image');
    if (images.length > 1) {
      return (
        <div className="grid grid-cols-2 gap-1">
          {images.map((img, i) => (
            <OutputImage key={i} src={String(img.value)} className="h-16 w-full" />
          ))}
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
        </div>
      );
    }
  }

  return null;
}
