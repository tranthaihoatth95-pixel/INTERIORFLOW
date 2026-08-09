'use client';

/**
 * components/present-editor/Toolbar.tsx — Thanh công cụ trên cùng.
 * Thêm chữ / ảnh / hình, mở template, undo/redo, xuất PDF & PPTX.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  Triangle,
  Pentagon,
  MoveRight,
  LayoutTemplate,
  LayoutGrid,
  Undo2,
  Redo2,
  Play,
  Palette,
  Proportions,
  FileDown,
  FileText,
  FileUp,
  FileJson,
  Printer,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  Group,
  Ungroup,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import IOMenu from '@/components/ui/IOMenu';
import { useDismissable } from '@/lib/useDismissable';
import Tooltip from '@/components/ui/Tooltip';
import type { EditorSlide, ShapeKind } from '@/lib/present-editor/model';
import type { AlignMode as GroupAlignMode } from '@/lib/present-editor/align';
// Nhập .xlsx vào BẢNG KHỐI LƯỢNG (BOQ) — logic thuần ở lib, component này chỉ là mặt tiền.
import { useT, useLang } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import { effectiveUserId } from '@/lib/resume';
import { getProjectDoc } from '@/lib/present-editor/project-doc';
import { loadBoqOverrides, saveBoqOverrides } from '@/lib/present-editor/boq-overrides-persist';
import {
  readBoqSheetFile, guessBoqColumns, buildBoqImportPlan, planToOverrides, describeBoqImportRow,
  unusedBoqColumns, BOQ_IMPORT_FIELDS, BOQ_IMPORT_FIELD_LABEL,
  type BoqImportColumns, type BoqImportField, type BoqXlsxImportPlan, type ParsedSheet,
} from '@/lib/present-editor/boq-xlsx-import';
import type { BoqRow } from '@/lib/boq/model';
// Làn C (in/giấy/xuất) — mục "Xuất PDF theo tờ giấy…" mở ExportPdfDialog (Màn 7). Dialog tự
// portal ra document.body, không cần đổi layout Toolbar để chứa nó.
import ExportPdfDialog from '@/components/print/ExportPdfDialog';

interface Props {
  onAddText: () => void;
  onAddImageUrl: (src: string) => void;
  onAddShape: (shape: ShapeKind) => void;
  onToggleTemplates: () => void;
  templatesOpen: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExportPdf: () => void;
  onExportPptx: () => void;
  /** xuất từng slide thành ảnh PNG (zip đơn giản hoá = tải lần lượt). */
  onExportPng: () => void;
  /** PDF khổ giấy thật A4/A3 theo dpi (P3 phần 1) — chữ/hình khối đạt dpi thật, ảnh hero/nền
   * CHƯA (P3 phần 2). Chỉ bật khi `printReady` (khổ đang chọn là A4/A3, không phải 16:9). */
  onExportPrint300: () => void;
  printReady: boolean;
  /** mở trình chiếu (xem hiệu ứng động). */
  onPlay: () => void;
  /** mở panel Brand Kit — Nhận diện (PS-1). */
  onBrandKit: () => void;
  /** mở panel Khổ trình bày — 16:9 · A4/A3 ngang/dọc (PS-4). */
  onStagePreset: () => void;
  /** nhãn khổ đang chọn (vd "16:9", "A4 dọc") hiện trên nút. */
  stageLabel: string;
  /** mở "Xem lưới" (Slide Sorter) — xem toàn deck dạng lưới thu nhỏ. */
  onOpenSorter: () => void;
  busy: string | null;
  /** kết quả export gần nhất (thành công/lỗi) — hiện toast ngắn cạnh nút Export. */
  exportMsg?: { ok: boolean; text: string } | null;

  /* P6b bước 1 (04/08, TICKET-PRESENT-UI-GON) — cụm "Sắp xếp" (align · z-order · group · khoá).
   * KHÔNG có logic mới — 5 callback dưới đây là NGUYÊN VẸN các hàm đã có sẵn trong
   * PresentEditor.tsx (đang dùng cho Inspector.tsx: onZOrder/onAlignSelection/onGroupSelected/
   * onUngroupSelected/onToggleLockSelected), Toolbar chỉ NỐI thêm 1 lối gọi khác, không tự viết
   * cơ chế mới. `slide`+`selectedIds` truyền thô để Toolbar tự đếm gating (multiCount/
   * selectedGroupCount/anyUnlocked) — CÙNG công thức Inspector.tsx đã dùng, không phát minh
   * công thức khác. */
  /** slide đang mở — chỉ để ĐẾM gating cho cụm Sắp xếp (không đọc/ghi gì khác). */
  slide?: EditorSlide | null;
  /** id các phần tử đang chọn — cùng nguồn `ed.selectedIds` truyền cho Inspector. */
  selectedIds: string[];
  onZOrder: (dir: 'front' | 'back' | 'forward' | 'backward') => void;
  /** Căn NHIỀU phần tử đã chọn theo bounding box CHUNG của chính chúng (cần ≥2, xem Inspector.tsx). */
  onAlignSelection: (mode: GroupAlignMode) => void;
  onGroup: () => void;
  onUngroup: () => void;
  /** khoá/mở khoá cả lựa chọn — 1 nút, đổi icon/nhãn theo trạng thái (xem `anyUnlocked` bên dưới). */
  onToggleLock: () => void;
  /* P6b bước 2a (02/08, duyệt riêng — năng lực MỚI, không phải nối dây) — ẩn/hiện cả lựa chọn,
   * 1 nút cạnh Khoá, cùng khuôn toggle-cả-cụm với onToggleLock. */
  /** ẩn/hiện cả lựa chọn — 1 nút, đổi icon/nhãn theo trạng thái (xem `anyVisible` bên dưới). */
  onToggleHide: () => void;
}

export default function Toolbar(p: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const idfpFileRef = useRef<HTMLInputElement>(null);
  const pptxFileRef = useRef<HTMLInputElement>(null);
  const [libOpen, setLibOpen] = useState(false);
  // L4 — cụm Sắp xếp gom vào popover (xem chú thích tại nút).
  const [arrangeOpen, setArrangeOpen] = useState(false);
  const arrangeBtnRef = useRef<HTMLSpanElement>(null);
  // Cửa nhập .xlsx vào BẢNG KHỐI LƯỢNG (BOQ) — xem docblock `BoqXlsxImportDialog` bên dưới.
  const [boqImportOpen, setBoqImportOpen] = useState(false);
  // Làn C — hộp thoại "Xuất PDF theo tờ giấy…" (Màn 7). Toolbar chưa có Sheet[]/checklist thật
  // của chặng Trình chiếu trong props hiện tại — dùng placeholder tối thiểu (1 "tờ" = trang đang
  // mở, checklist rỗng thay vì bịa mục giả) cho tới khi có phiên nối dữ liệu thật sâu hơn.
  const [pdfSheetsOpen, setPdfSheetsOpen] = useState(false);

  // P6b bước 1 — gating cụm "Sắp xếp", CÙNG công thức Inspector.tsx đang dùng (không bịa công
  // thức khác cho 2 chỗ hiện cùng 1 khái niệm) — xem Inspector.tsx dòng ~204-213/425-431.
  const selectedEls = (p.slide?.elements ?? []).filter((e) => p.selectedIds.includes(e.id));
  const multiCount = p.selectedIds.length;
  const selectedGroupCount = new Set(selectedEls.map((e) => e.groupId).filter(Boolean)).size;
  const anyUnlocked = selectedEls.some((e) => !e.locked);
  const anyVisible = selectedEls.some((e) => !e.hidden);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => p.onAddImageUrl(String(reader.result));
    reader.readAsDataURL(f);
    e.target.value = '';
  }

  /**
   * B2 (31/07, ĐỢT B lớp lưu trữ, mã `4.1.b`) — `.idfp` gồm TẤT CẢ sheet (không chỉ trang đang
   * mở) — Toolbar/PresentEditor không giữ danh sách sheet (nằm trong PresentSheets.tsx, phía
   * trên trong cây component). Bắc cầu qua CustomEvent, ĐÚNG pattern `cad:idf-export-request`/
   * `cad:idf-import-request` (CadEditor.tsx/CadSheets.tsx) — không viết cơ chế mới.
   */
  function onOpenIdfpFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    // .idfp THAY THẾ TOÀN BỘ project (mọi trang) — luôn hỏi trước, cùng UX .idf phía CAD.
    if (!window.confirm(`Mở "${f.name}" sẽ THAY THẾ TOÀN BỘ project hiện tại (mọi trang đang mở). Tiếp tục?`)) return;
    const reader = new FileReader();
    reader.onload = () => {
      window.dispatchEvent(new CustomEvent('present:idfp-import-request', { detail: { json: String(reader.result), fileName: f.name } }));
    };
    reader.readAsText(f);
  }

  /**
   * 09/08 — MỞ DECK `.pptx`. Đọc file bằng `lib/present-editor/pptx-import.ts` (nhập ĐỘNG để
   * jszip + bộ đọc XML không nằm trong gói khởi động của chặng Trình chiếu — người không nhập
   * pptx thì không phải tải), rồi bắc cầu sang PresentEditor bằng CustomEvent — ĐÚNG pattern
   * `present:idfp-import-request` ngay trên, không viết cơ chế mới.
   *
   * KHÁC `.idfp` ở một điểm quan trọng: `.idfp` là project CỦA CHÍNH MÌNH nên THAY THẾ toàn bộ
   * (có hỏi trước); `.pptx` là deck của người khác/công cụ khác nên **NỐI VÀO CUỐI** hồ sơ đang
   * mở — nhập xong vẫn còn nguyên thứ đang làm dở, không cần hỏi gì.
   */
  async function onOpenPptxFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const say = (ok: boolean, text: string) =>
      window.dispatchEvent(new CustomEvent('present:pptx-import-done', { detail: { ok, text } }));
    say(true, `Đang đọc "${f.name}"…`);
    try {
      const { importPptx, importSummary } = await import('@/lib/present-editor/pptx-import');
      const res = await importPptx(await f.arrayBuffer());
      if (!res.slides.length) {
        say(false, `Không nhập được slide nào từ "${f.name}" — file rỗng hoặc mọi slide đều hỏng.`);
        return;
      }
      window.dispatchEvent(
        new CustomEvent('present:pptx-import-request', {
          detail: { slides: res.slides, message: importSummary(f.name, res) },
        }),
      );
    } catch (err) {
      say(false, err instanceof Error ? err.message : `Không mở được "${f.name}".`);
    }
  }

  // Thoát Canva mode: quay lại trang trước, không có lịch sử thì về app chính '/'.
  function onBack() {
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
        flexWrap: 'wrap',
      }}
    >
      <Btn onClick={onBack} title="Quay lại app chính">
        <ArrowLeft size={15} /> Quay lại
      </Btn>
      <Divider />
      {/* 19/07 — cặp Nhập/Xuất DÙNG CHUNG với chặng Layout CAD & Render (components/ui/IOMenu.tsx):
       *  cùng icon, cùng vị trí (đầu thanh công cụ), cùng cách xổ menu; chỉ khác danh sách định
       *  dạng. Logic xuất PDF/PPTX/PNG giữ NGUYÊN — vẫn gọi đúng p.onExportPdf/Pptx/Png cũ. */}
      <IOMenu
        kind="import"
        size="md"
        title="Nhập file vào chặng Trình chiếu"
        items={[
          {
            id: 'image',
            label: 'Ảnh vào slide',
            sub: 'Ảnh NỘI DUNG — đưa thẳng vào slide đang dàn',
            icon: <ImageIcon size={15} />,
            onSelect: () => fileRef.current?.click(),
          },
          {
            // MỞ KHOÁ 09/08 — trước đây mục này gộp ".pptx / .pdf" vào một nút xám. Nay .pptx
            // ĐỌC ĐƯỢC THẬT (lib/present-editor/pptx-import.ts), .pdf thì chưa ⇒ TÁCH LÀM HAI
            // mục để nhãn không nói dối: cái chạy được thì bấm được, cái chưa có thì vẫn hiện
            // (ô trống là bằng chứng còn việc — luật §9, cấm xoá cho gọn mắt).
            id: 'deck',
            label: 'Mở deck (.pptx)',
            sub: 'Mỗi slide PowerPoint → 1 slide, NỐI VÀO CUỐI hồ sơ đang mở (không thay thế)',
            icon: <FileUp size={15} />,
            onSelect: () => pptxFileRef.current?.click(),
          },
          {
            id: 'deck-pdf',
            label: 'Mở deck (.pdf)',
            icon: <FileUp size={15} />,
            onSelect: () => {},
            disabled: true,
            disabledReason: 'Chưa đọc được .pdf — dùng ".pptx", hoặc ".idfp" để mở lại project đã lưu',
          },
          {
            id: 'idfp',
            label: 'Mở project (.idfp)',
            sub: 'Thay thế toàn bộ project — mọi trang/slide/font/ảnh nhúng',
            icon: <FileJson size={15} />,
            onSelect: () => idfpFileRef.current?.click(),
          },
          {
            id: 'boq-xlsx',
            label: 'Nhập .xlsx vào bảng khối lượng',
            sub: 'Nạp khối lượng/đơn giá vào hạng mục ĐÃ CÓ theo mã — không thêm hạng mục mới',
            icon: <FileSpreadsheet size={15} />,
            onSelect: () => setBoqImportOpen(true),
          },
        ]}
      />
      {boqImportOpen && <BoqXlsxImportDialog onClose={() => setBoqImportOpen(false)} />}
      <input ref={idfpFileRef} type="file" accept=".idfp,application/json" hidden onChange={onOpenIdfpFile} />
      <input
        ref={pptxFileRef}
        type="file"
        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        hidden
        onChange={onOpenPptxFile}
      />
      <IOMenu
        kind="export"
        size="md"
        align="left"
        variant="accent"
        title="Xuất file từ chặng Trình chiếu"
        busy={p.busy}
        resultMsg={p.exportMsg}
        items={[
          { id: 'pdf', label: 'PDF', sub: '1:1 với editor · đúng khổ đã chọn (màn hình/chiếu)', icon: <FileDown size={15} />, onSelect: p.onExportPdf },
          { id: 'pptx', label: 'PowerPoint (.pptx)', sub: 'Chữ còn chỉnh được trong PPT · luôn khổ 16:9', icon: <FileText size={15} />, onSelect: p.onExportPptx },
          { id: 'png', label: 'Ảnh PNG', sub: 'Mỗi slide 1 ảnh, tải lần lượt', icon: <ImageIcon size={15} />, onSelect: p.onExportPng },
          {
            id: 'idfp',
            label: 'Toàn bộ project (.idfp)',
            sub: 'Mở lại chỉnh được tiếp — mọi trang/slide/font/ảnh nhúng, tự chứa',
            icon: <FileJson size={15} />,
            onSelect: () => window.dispatchEvent(new CustomEvent('present:idfp-export-request')),
          },
          {
            id: 'print300',
            label: 'PDF in 300dpi (A3/A4)',
            sub: 'Chữ/hình khối + ảnh đủ nguồn đạt 300dpi thật · ảnh nhỏ tự nâng độ phân giải (hỏi giá/thời gian trước khi chạy)',
            icon: <Printer size={15} />,
            onSelect: p.onExportPrint300,
            disabled: !p.printReady,
            disabledReason: 'Chỉ xuất được ở khổ giấy A4/A3 — đổi khổ trong "Khổ trình bày" trước (16:9 là khổ màn hình, không phải khổ in).',
          },
          {
            id: 'pdf-sheets',
            label: 'Xuất PDF theo tờ giấy…',
            sub: 'Chọn khổ/hướng giấy · xem trước tờ · kiểm bảng nét in trước khi xuất',
            icon: <FileDown size={15} />,
            onSelect: () => setPdfSheetsOpen(true),
          },
        ]}
      />
      <ExportPdfDialog
        open={pdfSheetsOpen}
        sheets={[{ id: 'current', label: 'Trang hiện tại' }]}
        // Ở chặng Trình chiếu, khổ giấy KHÔNG do hộp thoại này quyết định — nó lấy theo "Khổ trình
        // bày" của hồ sơ (`deck.stagePreset` → `PAPER_SIZE_MM`, PresentEditor.tsx:400). Khoá lại kèm
        // lý do, KHÔNG để người dùng bấm A0/Dọc rồi file xuất ra vẫn y nguyên (luật §9 cấm nút giả).
        paperLockedReason='Khổ giấy ở chặng Trình chiếu lấy theo "Khổ trình bày" của hồ sơ — đổi ở đó.'
        onExportAll={() => {
          setPdfSheetsOpen(false);
          p.onExportPdf();
        }}
        onExportCurrent={() => {
          setPdfSheetsOpen(false);
          p.onExportPdf();
        }}
        onClose={() => setPdfSheetsOpen(false)}
      />
      <Divider />
      <Btn onClick={p.onAddText} title="Thêm chữ">
        <Type size={15} /> Chữ
      </Btn>
      <Btn
        onClick={() => fileRef.current?.click()}
        title="Ảnh NỘI DUNG: tải ảnh lên và đưa thẳng vào slide đang dàn. (Ảnh tham khảo/style → tab Reference bên trái)"
      >
        <ImageIcon size={15} /> Ảnh
      </Btn>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <Divider />
      <IconOnly onClick={() => p.onAddShape('rect')} title="Hình chữ nhật (chuột phải shape trên slide để chỉnh cạnh/góc)">
        <Square size={15} />
      </IconOnly>
      <IconOnly onClick={() => p.onAddShape('ellipse')} title="Hình elip">
        <Circle size={15} />
      </IconOnly>
      <IconOnly onClick={() => p.onAddShape('triangle')} title="Tam giác">
        <Triangle size={15} />
      </IconOnly>
      <IconOnly onClick={() => p.onAddShape('polygon')} title="Đa giác (chỉnh số cạnh khi chuột phải)">
        <Pentagon size={15} />
      </IconOnly>
      <IconOnly onClick={() => p.onAddShape('arrow')} title="Mũi tên">
        <MoveRight size={15} />
      </IconOnly>
      <IconOnly onClick={() => p.onAddShape('line')} title="Đường thẳng">
        <Minus size={15} />
      </IconOnly>

      <Divider />
      {/* L4 (phiếu 03/08): 14 nút căn-lề/thứ-tự/nhóm/khoá/ẩn từng trải ngang làm toolbar tràn
          xuống HÀNG THỨ HAI và đè cả Inspector. Nay gom vào MỘT nút "Sắp xếp" mở popover —
          §0d: không bỏ nút nào, mọi lệnh vẫn tới được trong 2 thao tác (mở popover → bấm), và
          Inspector vẫn giữ nguyên bản sao của cụm này cho ai quen dùng bên phải. */}
      <span ref={arrangeBtnRef} style={{ display: 'inline-flex' }}>
        <Btn onClick={() => setArrangeOpen((v) => !v)} active={arrangeOpen} title="Sắp xếp — căn lề · thứ tự lớp · nhóm · khoá · ẩn">
          <AlignCenterHorizontal size={15} /> Sắp xếp
        </Btn>
      </span>
      {arrangeOpen && (
        <ArrangePopover anchorRef={arrangeBtnRef} onDismiss={() => setArrangeOpen(false)}>
      {/* P6b bước 1 — cụm "Sắp xếp": căn theo nhau · thứ tự lớp · nhóm/bỏ nhóm · khoá. Logic
       * NGUYÊN VẸN từ PresentEditor.tsx (đã dùng cho Inspector.tsx) — chỉ nối thêm 1 lối gọi. */}
      <IconOnly
        onClick={() => p.onAlignSelection('left')}
        title="Căn trái theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignStartVertical size={15} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onAlignSelection('hcenter')}
        title="Căn giữa ngang theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignCenterVertical size={15} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onAlignSelection('right')}
        title="Căn phải theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignEndVertical size={15} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onAlignSelection('top')}
        title="Căn trên theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignStartHorizontal size={15} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onAlignSelection('vcenter')}
        title="Căn giữa dọc theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignCenterHorizontal size={15} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onAlignSelection('bottom')}
        title="Căn dưới theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignEndHorizontal size={15} />
      </IconOnly>

      <IconOnly
        onClick={() => p.onZOrder('front')}
        title="Đưa lên trước cùng"
        disabled={multiCount < 1}
      >
        <ChevronsUp size={15} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onZOrder('forward')}
        title="Tiến 1 bậc"
        disabled={multiCount < 1}
      >
        <ArrowUp size={15} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onZOrder('backward')}
        title="Lùi 1 bậc"
        disabled={multiCount < 1}
      >
        <ArrowDown size={15} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onZOrder('back')}
        title="Đưa ra sau cùng"
        disabled={multiCount < 1}
      >
        <ChevronsDown size={15} />
      </IconOnly>

      <IconOnly
        onClick={p.onGroup}
        title="Gộp các phần tử đang chọn thành 1 cụm (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <Group size={15} />
      </IconOnly>
      <IconOnly
        onClick={p.onUngroup}
        title="Rã cụm của lựa chọn hiện tại"
        disabled={selectedGroupCount < 1}
      >
        <Ungroup size={15} />
      </IconOnly>
      <IconOnly
        onClick={p.onToggleLock}
        title={anyUnlocked ? 'Khoá lựa chọn' : 'Mở khoá lựa chọn'}
        disabled={multiCount < 1}
      >
        {anyUnlocked ? <Lock size={15} /> : <Unlock size={15} />}
      </IconOnly>
      {/* P6b bước 2a — Ẩn hàng loạt, cạnh Khoá theo đúng vị trí Hoà duyệt. */}
      <IconOnly
        onClick={p.onToggleHide}
        title={anyVisible ? 'Ẩn lựa chọn' : 'Hiện lựa chọn'}
        disabled={multiCount < 1}
      >
        {anyVisible ? <EyeOff size={15} /> : <Eye size={15} />}
      </IconOnly>

      </ArrangePopover>
      )}
      <Divider />
      {/* 07/08 (p12, chốt 01/08 §3c): TemplatePicker + LayoutShelf đã gộp làm MỘT — tên chính
          thức "Bố cục" (nhãn cũ trên nút + tab panel ghi "Magic" là hai tên cho một thứ;
          không nhắc nguyên văn nhãn cũ ở đây để cửa kiểm PHEU-AI-TEN-MAGIC quét chuỗi không
          báo nhầm vào comment lịch sử). */}
      <Btn onClick={p.onToggleTemplates} active={p.templatesOpen} title="Bố cục — mẫu dàn trang, bấm là áp">
        <LayoutTemplate size={15} /> Bố cục
      </Btn>

      <Divider />
      <IconOnly onClick={p.onUndo} title="Hoàn tác" disabled={!p.canUndo}>
        <Undo2 size={15} />
      </IconOnly>
      <IconOnly onClick={p.onRedo} title="Làm lại" disabled={!p.canRedo}>
        <Redo2 size={15} />
      </IconOnly>

      <Divider />
      <Btn onClick={p.onBrandKit} title="Brand Kit — Nhận diện (logo · màu · font · watermark). Lưu 1 lần, áp lại cho cả deck.">
        <Palette size={15} /> Nhận diện
      </Btn>
      <Btn
        onClick={p.onStagePreset}
        title="Khổ trình bày (màn hình/chiếu) — 16:9 · A4 ngang/dọc · A3 ngang/dọc. Đổi khổ tự dàn lại bố cục."
      >
        <Proportions size={15} /> {p.stageLabel}
      </Btn>

      <div style={{ flex: 1 }} />

      <Btn onClick={p.onOpenSorter} title="Xem lưới toàn bộ slide (Slide Sorter) — chọn/kéo-thả đổi thứ tự/xoá/nhân bản">
        <LayoutGrid size={15} /> Xem lưới
      </Btn>
      <Btn onClick={p.onPlay} title="Trình chiếu (xem hiệu ứng động)">
        <Play size={15} /> Trình chiếu
      </Btn>

      {/* nút ẩn giữ chỗ cho lib open state (tránh unused) */}
      {libOpen && <span hidden onClick={() => setLibOpen(false)} />}
    </div>
  );
}

function Btn({
  children,
  onClick,
  title,
  active,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
        cursor: disabled ? 'default' : 'pointer',
        border: primary ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: primary
          ? 'var(--accent)'
          : active
            ? 'var(--accent-soft)'
            : 'var(--field)',
        color: primary ? '#fff' : active ? 'var(--accent)' : 'var(--t2)',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

/** Rút gọn title (thường có mô tả dài trong ngoặc/sau —) thành nhãn ngắn cho tag hover. */
function shortLabel(title: string): string {
  return title.split(' (')[0].split(' — ')[0].trim();
}

function IconOnly({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip label={shortLabel(title)}>
      <button
        type="button"
        title={title}
        onClick={onClick}
        disabled={disabled}
        className="pe-tool-btn"
        style={{
          width: 38,
          height: 36,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--field)',
          color: 'var(--t2)',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {children}
      </button>
    </Tooltip>
  );
}

/**
 * L4 — bảng "Sắp xếp" nổi dưới nút cùng tên. PORTAL ra `body` theo LUẬT PANEL NỔI (docs/00-CHOT
 * K4: panel kính lồng trong chrome kính thì `backdrop-filter` của cha chặn blur của con). Đóng
 * bằng Escape / bấm ra ngoài qua `useDismissable` — cùng họ sự kiện với mọi lớp đóng-mở của app,
 * không tự chế listener riêng.
 */
function ArrangePopover({
  anchorRef,
  onDismiss,
  children,
}: {
  anchorRef: React.RefObject<HTMLSpanElement | null>;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    // ghim mép trái theo nút, tự lùi vào trong nếu sát mép phải màn hình
    const width = 236;
    setPos({ left: Math.min(r.left, window.innerWidth - width - 12), top: r.bottom + 6 });
  }, [anchorRef]);

  useDismissable({ open: true, onDismiss, refs: [panelRef, anchorRef] });

  if (typeof document === 'undefined' || !pos) return null;
  return createPortal(
    <div
      ref={panelRef}
      role="group"
      aria-label="Sắp xếp"
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        zIndex: 80,
        width: 236,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: 10,
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--panel)',
        boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(0,0,0,.18))',
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function Divider() {
  return <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 3px' }} />;
}

/* ══════════════ Nhập .xlsx vào BẢNG KHỐI LƯỢNG (BOQ) ══════════════ */

type BoqImportStep = 'load' | 'pick' | 'map' | 'applying' | 'done';

const BOQ_PREVIEW_COUNT = 20;

/**
 * Cửa nhập .xlsx cho bảng khối lượng — Hoà chốt: **đích là bảng khối lượng ĐANG CÓ, không tạo
 * nguồn dữ liệu song song**. Bảng BOQ vẫn do engine tính từ bản vẽ; file Excel chỉ NẠP GIÁ TRỊ
 * (khối lượng / đơn giá) vào đúng cơ chế sửa-tay `boq-overrides` mà `BoqTable` đang dùng. Dòng
 * Excel không khớp mã nào ⇒ báo rõ từng dòng, BỎ QUA — không đẻ hạng mục ảo.
 *
 * Luồng: mở → nạp bảng BOQ hiện tại (cùng đường `BoqScreen` đi: `getProjectDoc` + `POST
 * /api/boq/[projectId]`) → chọn file → ghép cột (đoán sẵn, sửa được) + xem trước khớp/không-khớp
 * → áp. Khuôn UI theo `MaterialImportWizard` (cửa nhập Excel đã có của kho vật liệu) — không chế
 * kiểu hộp thoại thứ hai. Portal ra `body` theo luật K4 (panel nổi không lồng trong chrome kính).
 *
 * Toàn bộ phần đọc/khớp/báo lỗi nằm ở `lib/present-editor/boq-xlsx-import.ts` (có test) — file
 * này chỉ hiển thị và gọi.
 */
function BoqXlsxImportDialog({ onClose }: { onClose: () => void }) {
  const tr = useT();
  const lang = useLang();
  const params = useParams<{ id?: string }>();
  const projectId = params?.id ?? '';
  const storeUserId = useFlowStore((s) => s.user?.id);
  const userId = effectiveUserId(storeUserId) ?? '';

  const [step, setStep] = useState<BoqImportStep>('load');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [boqRows, setBoqRows] = useState<BoqRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [columns, setColumns] = useState<BoqImportColumns | null>(null);
  const [applied, setApplied] = useState<{ rows: number; cells: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * Nạp bảng BOQ hiện tại — CÙNG đường `BoqScreen.tsx` đi (Doc sống, không snapshot).
   *
   * ⛔ KHÔNG đưa `tr` vào deps — `useT()` trả HÀM MỚI mỗi render nên `loadBoq` sẽ đổi mỗi render,
   * kéo `useEffect(..., [loadBoq])` chạy vô hạn ("Maximum update depth exceeded", hộp thoại kẹt ở
   * "Đang đọc…" — đã tái hiện trên app thật lúc nghiệm thu). Dùng `lang` (nguyên trị 'vi'|'en',
   * ổn định qua Zustand selector) — ĐÚNG cách `BoqScreen.tsx:89-91` đã ghi lại sau cùng cái bẫy.
   */
  const loadBoq = useCallback(async () => {
    const say = (vi: string, en: string) => (lang === 'vi' ? vi : en);
    setStep('load');
    setLoadError(null);
    if (!projectId || !userId) {
      setLoadError(say(
        'Chưa xác định được dự án đang mở — mở chặng Trình chiếu từ một dự án cụ thể rồi nhập lại.',
        'No project is open — enter the Presenting stage from a specific project, then import again.',
      ));
      return;
    }
    try {
      const { doc, source } = await getProjectDoc(userId, projectId);
      if (source === 'none' || doc.entities.length === 0) {
        setBoqRows([]);
        setStep('pick');
        return;
      }
      const res = await fetch(`/api/boq/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || say('Không tính được bảng khối lượng.', 'Could not compute the bill of quantities.'));
      }
      const data = await res.json();
      setBoqRows(Array.isArray(data?.rows) ? data.rows : []);
      setStep('pick');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId, userId, lang]);

  useEffect(() => { void loadBoq(); }, [loadBoq]);

  const openFile = async (file: File) => {
    setFileError(null);
    try {
      const parsed = await readBoqSheetFile(file);
      if (parsed.rows.length === 0) {
        setFileError(tr('File không có dòng dữ liệu nào (chỉ có tiêu đề).', 'File has no data rows (header only).'));
        return;
      }
      setFileName(file.name);
      setSheet(parsed);
      setColumns(guessBoqColumns(parsed.headers));
      setStep('map');
    } catch (e) {
      setFileError(e instanceof Error ? e.message : String(e));
    }
  };

  const plan: BoqXlsxImportPlan | null = sheet && columns ? buildBoqImportPlan(sheet, columns, boqRows) : null;
  const dropped = sheet && columns ? unusedBoqColumns(sheet.headers, columns) : [];

  const setField = (field: BoqImportField, col: number | null) => {
    setColumns((prev) => (prev ? { ...prev, [field]: col } : prev));
  };

  const apply = async () => {
    if (!plan || plan.applyCount === 0) return;
    setStep('applying');
    try {
      const current = await loadBoqOverrides(userId, projectId);
      await saveBoqOverrides(userId, projectId, planToOverrides(plan, current, Date.now()));
      setApplied({ rows: plan.applyCount, cells: plan.cellCount });
      setStep('done');
    } catch (e) {
      // Ghi hỏng thì NÓI RA và quay lại bảng xem trước — không để nút kẹt "Đang áp…".
      setFileError(tr('Không lưu được số vừa nạp.', 'Could not save the imported values.') + ` (${e instanceof Error ? e.message : String(e)})`);
      setStep('map');
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,8,6,0.4)' }}
    >
      <div style={{ width: 760, maxWidth: 'calc(100vw - 24px)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 46, padding: '0 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <FileSpreadsheet size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>
            {tr('Nhập .xlsx vào bảng khối lượng', 'Import .xlsx into the bill of quantities')}
          </span>
          <button type="button" onClick={onClose} style={{ marginLeft: 'auto', width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, borderRadius: 8, background: 'transparent', color: 'var(--t4)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
          {step === 'load' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px' }}>
              {loadError ? (
                <>
                  <AlertTriangle size={22} style={{ color: 'var(--danger)' }} />
                  <span style={{ fontSize: 12.5, color: 'var(--t2)', textAlign: 'center', maxWidth: 460, lineHeight: 1.5 }}>{loadError}</span>
                  <button type="button" onClick={() => void loadBoq()} style={btnPrimary}>{tr('Thử lại', 'Try again')}</button>
                </>
              ) : (
                <>
                  <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 13, color: 'var(--t2)' }}>{tr('Đang đọc bảng khối lượng hiện tại…', 'Reading the current bill of quantities…')}</span>
                </>
              )}
            </div>
          )}

          {step === 'pick' && (
            <>
              <div style={{ marginBottom: 12, padding: '9px 11px', borderRadius: 10, background: 'var(--field)', border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.55 }}>
                {boqRows.length > 0
                  ? tr(
                      `Bảng khối lượng đang có ${boqRows.length} hạng mục (máy tính từ bản vẽ). File Excel chỉ NẠP khối lượng / đơn giá vào các hạng mục đó theo MÃ — dòng nào không khớp mã sẽ được báo và bỏ qua, không thêm hạng mục mới.`,
                      `The bill of quantities currently has ${boqRows.length} item(s) computed from the drawing. The spreadsheet only fills in quantity / unit price on those items, matched by code — unmatched rows are reported and skipped, never added as new items.`,
                    )
                  : tr(
                      'Bảng khối lượng đang TRỐNG (dự án chưa có vùng tô/món nào gán vật liệu). Nhập Excel lúc này sẽ không khớp được dòng nào — vẽ và gán vật liệu ở chặng Thiết kế 2D trước.',
                      'The bill of quantities is EMPTY (no material-tagged regions or items in this project yet). An import now cannot match any row — draw and assign materials in the 2D Design stage first.',
                    )}
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) void openFile(e.dataTransfer.files[0]); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '44px 20px',
                  borderRadius: 12, border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                  background: dragOver ? 'var(--accent-soft, var(--field))' : 'var(--field)',
                }}
              >
                <Upload size={26} strokeWidth={1.5} style={{ color: 'var(--t4)' }} />
                <b style={{ fontSize: 13, color: 'var(--t1)' }}>{tr('Thả file .xlsx hoặc .csv vào đây', 'Drop an .xlsx or .csv file here')}</b>
                <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>
                  {tr('Kể cả file do chính app xuất ra ("Xuất xlsx" ở màn BOQ) — sửa trong Excel rồi nạp lại', 'Including the file this app exported ("Export xlsx" on the BOQ screen) — edit in Excel and load it back')}
                </span>
                <button type="button" onClick={() => fileRef.current?.click()} style={{ ...btnPrimary, marginTop: 6 }}>
                  {tr('Chọn file từ máy', 'Choose a file')}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.csv"
                  hidden
                  onChange={(e) => { if (e.target.files?.[0]) void openFile(e.target.files[0]); e.target.value = ''; }}
                />
                {fileError && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: 12, textAlign: 'center' }}>
                    <AlertTriangle size={13} /> {fileError}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'map' && sheet && columns && plan && (
            <>
              <div style={{ fontSize: 11.5, color: 'var(--t4)', marginBottom: 10 }}>
                {fileName} · {tr(`${sheet.rows.length} dòng dữ liệu`, `${sheet.rows.length} data row(s)`)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {BOQ_IMPORT_FIELDS.map((field) => (
                  <div key={field}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>
                      {tr(BOQ_IMPORT_FIELD_LABEL[field].vi, BOQ_IMPORT_FIELD_LABEL[field].en)}
                    </label>
                    <select
                      value={columns[field] ?? ''}
                      onChange={(e) => setField(field, e.target.value === '' ? null : Number(e.target.value))}
                      style={{ width: '100%', height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 12.5, padding: '0 8px' }}
                    >
                      <option value="">{tr('— không dùng —', '— unused —')}</option>
                      {sheet.headers.map((h, i) => (
                        <option key={i} value={i}>{h || tr(`(cột ${i + 1})`, `(column ${i + 1})`)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {columns.matId == null && columns.ma == null && (
                <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 9, background: 'color-mix(in srgb, var(--danger) 12%, var(--field))', border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--t2)' }}>
                  <AlertTriangle size={12} style={{ color: 'var(--danger)', verticalAlign: -2, marginRight: 5 }} />
                  {tr(
                    'Chưa chỉ được cột MÃ — không có mã thì không biết dòng Excel thuộc hạng mục nào. Khớp theo TÊN là cách chắc chắn nạp nhầm giá, nên app không làm.',
                    'No code column selected — without a code there is no way to tell which item a row belongs to. Matching by name is a reliable way to import the wrong price, so the app does not do it.',
                  )}
                </div>
              )}

              {dropped.length > 0 && (
                <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 9, background: 'color-mix(in srgb, var(--warning) 12%, var(--field))', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)' }}>
                    <AlertTriangle size={12} style={{ color: 'var(--warning)', verticalAlign: -2, marginRight: 5 }} />
                    {tr(`${dropped.length} cột trong file KHÔNG được nạp:`, `${dropped.length} column(s) in the file are NOT imported:`)}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--t3)' }}>{dropped.map((c) => `"${c.header}"`).join(' · ')}</div>
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--t4)' }}>
                    {tr('Bảng khối lượng chỉ nhận khối lượng và đơn giá — các cột khác (NCC, hao hụt, thành tiền…) do bản vẽ và kho vật liệu quyết.', 'The BOQ only accepts quantity and unit price — other columns (vendor, wastage, amount…) come from the drawing and the material library.')}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>
                  {tr(`Xem trước ${Math.min(BOQ_PREVIEW_COUNT, plan.rows.length)}/${plan.rows.length} dòng`, `Preview ${Math.min(BOQ_PREVIEW_COUNT, plan.rows.length)}/${plan.rows.length} rows`)}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--accent)' }}>{tr(`${plan.applyCount} dòng sẽ nạp (${plan.cellCount} ô)`, `${plan.applyCount} row(s) to import (${plan.cellCount} cell(s))`)}</span>
                {plan.unchangedCount > 0 && (
                  <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>{tr(`${plan.unchangedCount} dòng trùng số cũ`, `${plan.unchangedCount} unchanged`)}</span>
                )}
                {plan.skippedCount > 0 && (
                  <span style={{ fontSize: 11.5, color: 'var(--warning)' }}>{tr(`${plan.skippedCount} dòng bỏ qua`, `${plan.skippedCount} skipped`)}</span>
                )}
              </div>

              <div style={{ maxHeight: 270, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, background: 'var(--field)' }}>
                      <th style={boqTh}>{tr('Dòng', 'Row')}</th>
                      <th style={boqTh}>{tr('Mã', 'Code')}</th>
                      <th style={boqTh}>{tr('Hạng mục trong BOQ', 'Item in the BOQ')}</th>
                      <th style={{ ...boqTh, textAlign: 'right' }}>{tr('Khối lượng', 'Qty')}</th>
                      <th style={{ ...boqTh, textAlign: 'right' }}>{tr('Đơn giá', 'Unit price')}</th>
                      <th style={boqTh}>{tr('Kết quả', 'Result')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.rows.slice(0, BOQ_PREVIEW_COUNT).map((r) => {
                      const bad = r.status !== 'apply' && r.status !== 'unchanged';
                      const note = describeBoqImportRow(r, lang);
                      return (
                        <tr key={r.rowIndex} style={{ background: bad ? 'color-mix(in srgb, var(--warning) 10%, transparent)' : undefined }}>
                          <td style={boqTd}>{r.lineNo}</td>
                          <td style={{ ...boqTd, fontFamily: 'ui-monospace, Menlo, monospace' }}>{r.code || '—'}</td>
                          {/* Chưa khớp thì hiện tên TRONG FILE, màu nhạt — để người dùng nhận ra
                              món của mình mà không tưởng nhầm là đã tìm thấy trong BOQ. */}
                          <td style={{ ...boqTd, color: r.boqTen ? 'var(--t2)' : 'var(--t4)' }}>{r.boqTen ?? (r.ten || '—')}</td>
                          <td style={{ ...boqTd, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.fields.includes('m2') ? 'var(--t1)' : 'var(--t4)' }}>
                            {r.qty != null ? r.qty.toLocaleString('vi-VN') : '—'}
                          </td>
                          <td style={{ ...boqTd, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.fields.includes('donGia') ? 'var(--t1)' : 'var(--t4)' }}>
                            {r.donGia != null ? r.donGia.toLocaleString('vi-VN') : '—'}
                          </td>
                          <td style={{ ...boqTd, color: bad ? 'var(--warning)' : 'var(--t4)' }}>
                            {note ?? tr(`nạp ${r.fields.length} ô`, `${r.fields.length} cell(s)`)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {plan.unmatchedCodes.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.55 }}>
                  {tr(
                    `${plan.unmatchedCodes.length} mã trong file không có trong bảng khối lượng: ${plan.unmatchedCodes.slice(0, 8).join(' · ')}${plan.unmatchedCodes.length > 8 ? '…' : ''}. Bảng khối lượng bám bản vẽ — muốn có thêm hạng mục thì gán vật liệu cho vùng/món ở chặng Thiết kế 2D.`,
                    `${plan.unmatchedCodes.length} code(s) in the file are not in the BOQ: ${plan.unmatchedCodes.slice(0, 8).join(' · ')}${plan.unmatchedCodes.length > 8 ? '…' : ''}. The BOQ follows the drawing — to get more items, assign materials to regions/items in the 2D Design stage.`,
                  )}
                </div>
              )}

              {fileError && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: 12 }}>
                  <AlertTriangle size={13} /> {fileError}
                </div>
              )}
            </>
          )}

          {step === 'applying' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px' }}>
              <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, color: 'var(--t2)' }}>{tr('Đang nạp vào bảng khối lượng…', 'Writing into the bill of quantities…')}</span>
            </div>
          )}

          {step === 'done' && applied && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px' }}>
              <CheckCircle2 size={22} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                {tr(`Đã nạp ${applied.cells} ô vào ${applied.rows} hạng mục`, `Imported ${applied.cells} cell(s) into ${applied.rows} item(s)`)}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--t3)', textAlign: 'center', maxWidth: 460, lineHeight: 1.55 }}>
                {tr(
                  'Mở "Bảng khối lượng (BOQ)" ở thanh bên trái để xem. Các ô vừa nạp được đánh dấu "đã sửa tay" — bấm nút hoàn về là lấy lại số máy tính từ bản vẽ.',
                  'Open "Bill of quantities (BOQ)" in the left navigator to see them. Imported cells are marked as hand-edited — use the reset button to go back to the model value.',
                )}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 14, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {step === 'map' && (
            <>
              <button type="button" onClick={() => { setSheet(null); setColumns(null); setStep('pick'); }} style={btnGhost}>
                {tr('Chọn file khác', 'Pick another file')}
              </button>
              <button
                type="button"
                onClick={() => void apply()}
                disabled={!plan || plan.applyCount === 0}
                title={plan && plan.applyCount === 0 ? tr('Không dòng nào khớp hạng mục trong bảng khối lượng', 'No row matches an item in the bill of quantities') : undefined}
                style={{ ...btnPrimary, opacity: !plan || plan.applyCount === 0 ? 0.5 : 1, cursor: !plan || plan.applyCount === 0 ? 'not-allowed' : 'pointer' }}
              >
                {tr(`Nạp ${plan?.cellCount ?? 0} ô`, `Import ${plan?.cellCount ?? 0} cell(s)`)}
              </button>
            </>
          )}
          {step === 'done' && (
            <button type="button" onClick={onClose} style={btnPrimary}>{tr('Xong', 'Done')}</button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const boqTh: React.CSSProperties = { textAlign: 'left', padding: '5px 8px', fontSize: 10.5, fontWeight: 600, color: 'var(--t4)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
const boqTd: React.CSSProperties = { padding: '4px 8px', color: 'var(--t2)', borderBottom: '1px solid var(--border)' };
const btnPrimary: React.CSSProperties = { height: 32, padding: '0 16px', borderRadius: 8, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
