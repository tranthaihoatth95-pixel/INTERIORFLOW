'use client';

/**
 * components/studio/RenderIOMenus.tsx — cặp "Nhập"/"Xuất" của CHẶNG RENDER.
 *
 * Dùng CÙNG component components/ui/IOMenu.tsx với chặng Layout CAD (CadEditor.tsx) và chặng
 * Present (present-editor/Toolbar.tsx) → 3 chặng cùng icon, cùng vị trí, cùng cách xổ menu; chỉ
 * khác DANH SÁCH ĐỊNH DẠNG (yêu cầu user 19/07).
 *
 * KHÔNG viết logic xuất/nhập mới. Mọi item chỉ gọi lại hàm ĐÃ CÓ:
 *   - Nhập ảnh  → addImageNodesFromFiles() (tách ra từ chính nút "Tải lên" cũ, hành vi y hệt).
 *   - Xuất PDF  → deckImagesFromNodes() + buildDeckPdf() + downloadPdf() — ĐÚNG bộ hàm mà nút
 *                 "Tải PDF thuyết trình" trên node Export Deck đang dùng.
 *   - Xuất PPTX → exportDeckToPptx() — ĐÚNG hàm mà ExportPptxButton đang dùng.
 * Khác biệt duy nhất: gom slide ở mức CẢ FLOW (cùng thứ tự ưu tiên slide.deck → slide.composer
 * như PresentOverlay/handoff) thay vì phải tìm đúng node rồi mới bấm.
 */

import { useRef, useState } from 'react';
import { Image as ImageIcon, FileDown, FileText, Printer, FileUp } from 'lucide-react';
import IOMenu from '@/components/ui/IOMenu';
import { useFlowStore } from '@/lib/store';
import { addImageNodesFromFiles } from '@/components/studio/UploadButton';
import { deckImagesFromNodes } from '@/lib/present-editor/handoff';

export function RenderIOMenus() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

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

  return (
    <>
      <IOMenu
        kind="import"
        size="sm"
        title="Nhập file vào chặng Render"
        items={[
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
        ]}
      />
      <IOMenu
        kind="export"
        size="sm"
        align="left"
        title="Xuất file từ chặng Render"
        busy={busy}
        resultMsg={msg}
        items={[
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
            id: 'flow',
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
        ]}
      />
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
    </>
  );
}
