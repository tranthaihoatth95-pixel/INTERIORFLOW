'use client';

/**
 * components/studio/RenderIOMenus.tsx — menu "Tệp" DUY NHẤT của chặng Render (mã 2.2.60,
 * 29/07 — docs/CHOT-SO-MA-2026-07-29.md §D).
 *
 * Trước là 3 điều khiển rời trên thanh đầu: "Thêm vào canvas" (UploadButton) + 2 popover
 * "Mở tệp"/"Xuất" (2× IOMenu) — cùng góp phần gây tràn khung ở ~1183px. Gộp lại thành 1
 * nút "Tệp" + 1 popover 2 mục NHẬP/XUẤT. Mục "Ảnh (tạo node Import Image)" trong NHẬP
 * chính là hành vi "Thêm vào canvas" cũ (addImageNodesFromFiles) — không viết logic mới,
 * chỉ gộp lối vào.
 *
 * KHÔNG đụng `components/ui/IOMenu.tsx` — component đó dùng CHUNG cho CAD/Present, sửa ở
 * đây sẽ ảnh hưởng 2 chặng kia. Popover này viết riêng, cục bộ cho chặng Render.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Files, Image as ImageIcon, FileDown, FileText, Printer, FileUp, ChevronDown } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { addImageNodesFromFiles } from '@/components/studio/UploadButton';
import { deckImagesFromNodes } from '@/lib/present-editor/handoff';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface FileItem {
  id: string;
  label: string;
  sub?: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function RenderIOMenus() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const tr = useT();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 4000);
  };

  /** Gom slide đã render trong flow — rỗng thì báo rõ thay vì xuất file trắng. */
  const collectSlides = (): string[] => deckImagesFromNodes(useFlowStore.getState().nodes);

  const exportPdf = async () => {
    const slides = collectSlides();
    if (!slides.length) {
      flash(false, 'Chưa có slide nào đã render — chạy node Export Deck / Slide Composer trước.');
      return;
    }
    setBusy('pdf');
    try {
      const { buildDeckPdf, downloadPdf } = await import('@/lib/present-demo');
      const uri = await buildDeckPdf(slides, 'interiorflow-deck.pdf');
      downloadPdf(uri, 'interiorflow-deck.pdf');
      flash(true, `Đã xuất PDF — ${slides.length} slide.`);
    } catch (err) {
      flash(false, `Lỗi xuất PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  };

  const exportPptx = async () => {
    const slides = collectSlides();
    if (!slides.length) {
      flash(false, 'Chưa có slide nào đã render — chạy node Export Deck / Slide Composer trước.');
      return;
    }
    setBusy('pptx');
    try {
      const { exportDeckToPptx } = await import('@/lib/pptx');
      const name = useFlowStore.getState().flowName || 'deck';
      await exportDeckToPptx(
        slides.map((imageDataUrl) => ({ kind: 'image', imageDataUrl }) as const),
        { fileName: name, title: name },
      );
      flash(true, `Đã xuất PowerPoint — ${slides.length} slide.`);
    } catch (err) {
      flash(false, `Lỗi xuất PPTX: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  };

  const importItems: FileItem[] = [
    {
      id: 'image',
      label: 'Ảnh (tạo node Import Image)',
      sub: 'Chọn nhiều ảnh — mỗi ảnh 1 node gắn sẵn trên canvas',
      icon: <ImageIcon size={15} />,
      onSelect: () => fileRef.current?.click(),
    },
    {
      id: 'flow',
      label: 'Mở flow (.json)',
      icon: <FileUp size={15} />,
      onSelect: () => {},
      disabled: true,
      disabledReason: 'Chưa hỗ trợ — flow lưu trên server, chưa xuất/nhập ra file rời',
    },
  ];

  const exportItems: FileItem[] = [
    {
      id: 'pdf',
      label: 'PDF thuyết trình',
      sub: 'Gom slide đã render trong flow · 16:9 1920×1080, nhiều trang',
      icon: <FileDown size={15} />,
      onSelect: exportPdf,
    },
    {
      id: 'pptx',
      label: 'PowerPoint (.pptx)',
      sub: 'Mỗi slide 1 ảnh full-bleed · khổ 16:9',
      icon: <FileText size={15} />,
      onSelect: exportPptx,
    },
    {
      id: 'flow-export',
      label: 'Flow (.json)',
      icon: <FileUp size={15} />,
      onSelect: () => {},
      disabled: true,
      disabledReason: 'Chưa hỗ trợ — flow lưu trên server, chưa xuất ra file rời',
    },
    {
      id: 'print300',
      label: 'In 300dpi (A3/A4)',
      icon: <Printer size={15} />,
      onSelect: () => {},
      disabled: true,
      disabledReason: 'Chưa khả dụng — ảnh render hiện ~1920px (~116dpi ở khổ A3)',
    },
  ];

  const runningLabel = busy
    ? [...importItems, ...exportItems].find((i) => i.id === busy)?.label
    : null;

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!!busy}
        aria-haspopup="menu"
        aria-expanded={open}
        title={tr('Nhập ảnh · mở flow · xuất PDF/PPTX/in ấn', 'Import images · open flow · export PDF/PPTX/print')}
        className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--t2)] transition-colors hover:bg-[var(--hover)] disabled:opacity-60"
      >
        <Files size={13} />
        <span className="hidden sm:inline">{busy ? `${tr('Đang', 'Working')} ${runningLabel ?? ''}…` : tr('Tệp', 'File')}</span>
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+6px)] z-40 w-[236px] rounded-[10px] border border-[var(--border)] bg-[var(--panel)] p-[5px] shadow-xl"
        >
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">
            {tr('Nhập', 'Import')}
          </p>
          {importItems.map((it) => (
            <FileMenuItem key={it.id} item={it} onDone={() => setOpen(false)} />
          ))}
          <div className="my-1 h-px bg-[var(--border)]" />
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">
            {tr('Xuất', 'Export')}
          </p>
          {exportItems.map((it) => (
            <FileMenuItem key={it.id} item={it} onDone={() => setOpen(false)} />
          ))}
        </div>
      )}

      {msg && (
        <div
          role="status"
          className="absolute left-0 top-[calc(100%+6px)] z-40 whitespace-nowrap rounded-[8px] border px-3 py-1.5 text-[12.5px] shadow-xl"
          style={{
            borderColor: msg.ok ? 'var(--accent)' : '#c0392b',
            background: 'var(--panel)',
            color: msg.ok ? 'var(--t1)' : '#c0392b',
          }}
        >
          {msg.text}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          await addImageNodesFromFiles(files);
        }}
      />
    </div>
  );
}

function FileMenuItem({ item, onDone }: { item: FileItem; onDone: () => void }) {
  const dim = !!item.disabled;
  return (
    <button
      type="button"
      role="menuitem"
      disabled={dim}
      title={dim ? item.disabledReason ?? 'Chưa khả dụng' : item.sub ?? item.label}
      onClick={() => {
        if (dim) return;
        onDone();
        item.onSelect();
      }}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-left transition-colors hover:enabled:bg-[var(--field)]',
        dim ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
      )}
    >
      <span className="grid shrink-0 place-items-center">{item.icon}</span>
      <span className="min-w-0">
        <span className={cn('block text-[12.5px] font-semibold', dim ? 'text-[var(--t3)]' : 'text-[var(--t1)]')}>
          {item.label}
        </span>
        {(dim ? item.disabledReason ?? item.sub : item.sub) && (
          <span className="mt-0.5 block text-[11px] text-[var(--t3)]">
            {dim ? item.disabledReason ?? item.sub : item.sub}
          </span>
        )}
      </span>
    </button>
  );
}
