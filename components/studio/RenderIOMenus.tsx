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

import { useRef, useState, type ReactNode } from 'react';
import { Files, FileDown, FileText, Printer, FileUp, ChevronDown } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { addImageNodesFromFiles } from '@/components/studio/UploadButton';
import { deckImagesFromNodes } from '@/lib/present-editor/handoff';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useDismissable } from '@/lib/useDismissable';
import { detectFormat } from '@/lib/gateway/detect';
import { routeFormat } from '@/lib/gateway/route';
import { useCadStore } from '@/lib/cad/store';
import { useStageMode } from '@/lib/stage-mode';

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
  const { setMode } = useStageMode('render');

  useDismissable({ open, onDismiss: () => setOpen(false), refs: [menuRef] });

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 4000);
  };

  /** Gom slide đã render trong flow — rỗng thì báo rõ thay vì xuất file trắng. */
  const collectSlides = (): string[] => deckImagesFromNodes(useFlowStore.getState().nodes);

  const exportPdf = async () => {
    const slides = collectSlides();
    if (!slides.length) {
      flash(false, tr("Chưa có slide nào — dùng công cụ 'Export Deck / Slide Composer' trước.", "No slides yet — use the 'Export Deck / Slide Composer' tool first."));
      return;
    }
    setBusy('pdf');
    try {
      const { buildDeckPdf, downloadPdf } = await import('@/lib/present-render');
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
      flash(false, tr("Chưa có slide nào — dùng công cụ 'Export Deck / Slide Composer' trước.", "No slides yet — use the 'Export Deck / Slide Composer' tool first."));
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
      id: 'gateway',
      label: tr('Chọn tệp — tự nhận định dạng', 'Choose files — auto-detect format'),
      sub: tr('Ảnh tạo node · GLB mở trong Vẽ 3D', 'Images create nodes · GLB opens in 3D Design'),
      icon: <FileUp size={15} />,
      onSelect: () => fileRef.current?.click(),
    },
  ];

  const exportItems: FileItem[] = [
    {
      id: 'pdf',
      label: tr('PDF thuyết trình', 'Presentation PDF'),
      sub: tr('Gom slide đã render trong bảng làm việc · 16:9 1920×1080, nhiều trang', 'Collects rendered slides from the board · 16:9 1920×1080, multi-page'),
      icon: <FileDown size={15} />,
      onSelect: exportPdf,
    },
    {
      id: 'pptx',
      label: tr('PowerPoint (.pptx)', 'PowerPoint (.pptx)'),
      sub: tr('Mỗi slide 1 ảnh full-bleed · khổ 16:9', 'Each slide is 1 full-bleed image · 16:9'),
      icon: <FileText size={15} />,
      onSelect: exportPptx,
    },
    {
      id: 'flow-export',
      label: tr('Bảng làm việc (.json)', 'Board (.json)'),
      icon: <FileUp size={15} />,
      onSelect: () => {},
      disabled: true,
      disabledReason: tr('Chưa hỗ trợ — bảng làm việc lưu trên server, chưa xuất ra file rời', 'Not supported yet — boards live on the server, no file export yet'),
    },
    {
      id: 'print300',
      label: tr('In 300dpi (A3/A4)', 'Print at 300dpi (A3/A4)'),
      icon: <Printer size={15} />,
      onSelect: () => {},
      disabled: true,
      disabledReason: tr('Chưa khả dụng — ảnh render hiện ~1920px (~116dpi ở khổ A3)', 'Not available yet — rendered images are ~1920px (~116dpi at A3)'),
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
        title={tr('Nhập ảnh · mở bảng làm việc · xuất PDF/PPTX/in ấn', 'Import images · open board · export PDF/PPTX/print')}
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
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          const images: File[] = [];
          const models: File[] = [];
          const rejected: string[] = [];
          for (const file of files) {
            const bytes = new Uint8Array(await file.slice(0, 8192).arrayBuffer());
            const format = detectFormat({ name: file.name, bytes });
            const action = routeFormat(format, 'render');
            if (action.kind === 'place-image') images.push(file);
            else if (action.kind === 'render-import-model') models.push(file);
            else rejected.push(action.kind === 'unsupported' && action.reason ? `${file.name}: ${action.reason}` : `${file.name}: chưa hỗ trợ`);
          }
          if (images.length) await addImageNodesFromFiles(images);
          const modelReports: string[] = [];
          for (const file of models) {
            try {
              const buffer = await file.arrayBuffer();
              const { parseGlb } = await import('@/lib/three/glb-import');
              const parsed = await parseGlb(buffer.slice(0));
              const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Không đọc được file.'));
                reader.onerror = () => reject(reader.error ?? new Error('Không đọc được file.'));
                reader.readAsDataURL(file);
              });
              useCadStore.getState().addModel3DSource({
                id: crypto.randomUUID(), name: file.name, format: 'glb', dataUrl,
                sizeBytes: file.size, importedAt: new Date().toISOString(),
              });
              modelReports.push(`${file.name}: ${parsed.report.meshes} mesh · ${Math.round(parsed.report.triangles).toLocaleString()} tam giác${parsed.report.warnings.length ? ` · ${parsed.report.warnings.join(' ')}` : ''}`);
            } catch (err) {
              rejected.push(`${file.name}: ${err instanceof Error ? err.message : 'GLB không đọc được'}`);
            }
          }
          if (modelReports.length) setMode('model3d');
          if (rejected.length) flash(false, rejected.join(' · '));
          else if (modelReports.length) flash(true, modelReports.join(' · '));
          else if (images.length) flash(true, tr(`Đã thêm ${images.length} ảnh vào bảng làm việc.`, `Added ${images.length} image(s) to the board.`));
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
