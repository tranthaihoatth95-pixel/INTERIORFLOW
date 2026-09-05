'use client';

/**
 * components/present-editor/Toolbar.tsx — Thanh công cụ trên cùng.
 * Thêm chữ / ảnh / hình, mở template, undo/redo, xuất PDF & PPTX.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
  Archive,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  MoreHorizontal,
  TableProperties,
} from 'lucide-react';
import IOMenu from '@/components/ui/IOMenu';
import LightArc from '@/components/ui/LightArc';
import { ToolbarChip } from '@/components/ui/ToolbarChip';
import { commonCommandsFor, bindStage } from '@/lib/commands/toolbar-source';
import { CommandIcon } from '@/components/ui/command-icon';
import { RADIUS } from '@/lib/geometry';
import { useDismissable } from '@/lib/useDismissable';
import type { EditorSlide, ShapeKind } from '@/lib/present-editor/model';
import type { AlignMode as GroupAlignMode } from '@/lib/present-editor/align';
// Nhập .xlsx vào BẢNG KHỐI LƯỢNG (BOQ) — logic thuần ở lib, component này chỉ là mặt tiền.
import { useT, useLang } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import { effectiveUserId } from '@/lib/resume';
import { getProjectDoc } from '@/lib/present-editor/project-doc';
import { useSheetsBucketId } from '@/lib/scope';
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
import { detectFormat } from '@/lib/gateway/detect';
import { routeFormat } from '@/lib/gateway/route';

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
  /* Phụ lục BOQ (02/09) — dựng/làm mới trang bảng khối lượng từ Doc 2D + Kho giá + sửa tay. Logic ở
   * PresentEditor#onInsertBoqAppendix; toolbar chỉ là mặt tiền (cùng khuôn export). */
  onInsertBoqAppendix?: () => void | Promise<void>;
  boqAppendixBusy?: boolean;
}

/**
 * H4 (13/08, sửa nóng dogfood F1) — handle imperative để TaskFirstStart (empty-state MỚI ở
 * PresentEditor.tsx canvas trống) gọi ĐÚNG cửa "Mở tệp" đang có, KHÔNG đẻ input file thứ hai.
 * MARKER: TaskFirstStart.
 */
export interface ToolbarHandle {
  /** mở hộp thoại chọn tệp (đặc cách PDF/PPTX/ảnh/IDFP/XLSX ở `onGatewayFile` bên dưới). */
  openGatewayPicker: () => void;
}

const Toolbar = forwardRef<ToolbarHandle, Props>(function Toolbar(p, ref) {
  const tr = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const gatewayFileRef = useRef<HTMLInputElement>(null);
  const [libOpen, setLibOpen] = useState(false);
  // L4 — cụm Sắp xếp gom vào popover (xem chú thích tại nút).
  // H4 (13/08): neo ĐỔI sang nút "Bố cục" (layoutMenuBtnRef) — Sắp xếp giờ là 1 mục trong đó.
  const [arrangeOpen, setArrangeOpen] = useState(false);
  // H4 (13/08, gộp toolbar theo dogfood F1): "Hình" (6 shape) và "Bố cục" (Sắp xếp·Brand Kit·
  // Khổ·Xem lưới) — gộp KHÔNG xoá năng lực, chỉ đổi nơi đứng. Xem JSX bên dưới.
  const [shapeOpen, setShapeOpen] = useState(false);
  const shapeBtnRef = useRef<HTMLSpanElement>(null);
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const layoutMenuBtnRef = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => ({
    openGatewayPicker: () => gatewayFileRef.current?.click(),
  }), []);
  // Cửa nhập .xlsx vào BẢNG KHỐI LƯỢNG (BOQ) — xem docblock `BoqXlsxImportDialog` bên dưới.
  const [boqImportOpen, setBoqImportOpen] = useState(false);
  const [boqInitialFile, setBoqInitialFile] = useState<File | null>(null);
  // Làn C — hộp thoại "Xuất PDF theo tờ giấy…" (Màn 7). Toolbar chưa có Sheet[]/checklist thật
  // của chặng Trình chiếu trong props hiện tại — dùng placeholder tối thiểu (1 "tờ" = trang đang
  // mở, checklist rỗng thay vì bịa mục giả) cho tới khi có phiên nối dữ liệu thật sâu hơn.
  const [pdfSheetsOpen, setPdfSheetsOpen] = useState(false);
  // Smart Convert bậc 1 (13/08, docs/phieu-giao/smart-convert-pdf.md) — tiến độ đọc `.pdf` nhiều
  // trang. LightArc DETERMINATE (nuôi bằng `pdfToDeck`'s onProgress) — khác `p.busy` (chuỗi rỗng/
  // đầy, dùng cho export) vì đây có % thật theo trang, không phải "đang chạy" mờ.
  const [pdfProgress, setPdfProgress] = useState<{ fileName: string; done: number; total: number } | null>(null);

  /* Gói Hồ Sơ Sống (P4, docs/phieu-giao/goi-ho-so-song.md ④.4) — ngữ cảnh cho `exportHoSoSong`
   * bên dưới. userId/projectId CÙNG đường `BoqXlsxImportDialog` trong file này; bucketId CÙNG
   * đường PresentSheets.tsx nạp sheet (`useSheetsBucketId` + route '/present-editor').
   * MARKER: HoSoSong. */
  const hoSoParams = useParams<{ id?: string }>();
  const hoSoProjectId = hoSoParams?.id ?? '';
  const hoSoStoreUserId = useFlowStore((s) => s.user?.id);
  const hoSoUserId = effectiveUserId(hoSoStoreUserId) ?? '';
  const hoSoBucketId = useSheetsBucketId();
  const [hoSoBusy, setHoSoBusy] = useState(false);

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

  const addImageFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => p.onAddImageUrl(String(reader.result));
    reader.readAsDataURL(f);
  };

  /**
   * B2 (31/07, ĐỢT B lớp lưu trữ, mã `4.1.b`) — `.idfp` gồm TẤT CẢ sheet (không chỉ trang đang
   * mở) — Toolbar/PresentEditor không giữ danh sách sheet (nằm trong PresentSheets.tsx, phía
   * trên trong cây component). Bắc cầu qua CustomEvent, ĐÚNG pattern `cad:idf-export-request`/
   * `cad:idf-import-request` (CadEditor.tsx/CadSheets.tsx) — không viết cơ chế mới.
   */
  function openIdfpFile(f: File) {
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
  async function openPptxFile(f: File) {
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

  /**
   * 13/08 — Smart Convert BẬC 1 (`docs/phieu-giao/smart-convert-pdf.md`). Đọc `.pdf` bằng
   * `lib/present-editor/pdf-import.ts` (unpdf, đã có sẵn — KHÔNG thêm dependency), bắc cầu sang
   * PresentEditor CÙNG PATTERN `openPptxFile` ngay trên (nối vào CUỐI deck đang mở, không hỏi
   * trước — PDF là tài liệu nguồn khác, không phải project `.idfp` của chính mình).
   *
   * ✅ ĐẶC CÁCH GATEWAY ĐÃ TRẢ NỢ (R6 19/08): `lib/gateway` nay khai `present.pdf.import='lossy'`
   * và `routeFormat('pdf','present')` trả `present-import-deck` — `onGatewayFile` bên dưới hết
   * bắt `format === 'pdf'` trước khi gọi router; PDF đi CÙNG CỬA với mọi định dạng khác. Chọn
   * importer nào (pdf-import ↔ pptx-import) vẫn quyết Ở ĐÂY theo `format` — đó là việc của bề
   * mặt, router chỉ trả lời "đích là gì".
   *
   * Số trang > `PDF_RANGE_PROMPT_THRESHOLD` (30) → hỏi phạm vi trước khi convert (phiếu ③) bằng
   * `window.prompt` — cùng mức tương tác `window.confirm` của `openIdfpFile` phía trên, không
   * dựng dialog mới cho một lần hỏi đơn giản. Tiến độ nuôi `LightArc` (state `pdfProgress` local
   * — không cần bắc cầu CustomEvent vì thanh tiến độ hiện NGAY TẠI ĐÂY, Toolbar sở hữu nút Nhập).
   */
  async function openPdfFile(f: File) {
    const say = (ok: boolean, text: string) =>
      window.dispatchEvent(new CustomEvent('present:pdf-import-done', { detail: { ok, text } }));
    try {
      const { pdfToDeck, pdfPageCount, pdfImportSummary, parsePagesInput, PDF_RANGE_PROMPT_THRESHOLD } =
        await import('@/lib/present-editor/pdf-import');
      const buf = await f.arrayBuffer();
      const total = await pdfPageCount(buf);
      // D1b — chọn TRANG TUỲ Ý (danh sách "15-22,30"), không chỉ dải liên tục: hồ sơ thật 47
      // trang thường chỉ cần vài trang bếp/khách/vệ sinh nằm rải rác (DF2-C4 Westlake).
      let pages: number[] | undefined;
      if (total > PDF_RANGE_PROMPT_THRESHOLD) {
        const input = window.prompt(
          `"${f.name}" có ${total} trang — nhập trang muốn chuyển (vd "1-20" hoặc "15-22,30"), để trống = cả ${total} trang:`,
          '',
        );
        if (input === null) {
          say(false, `Đã huỷ nhập "${f.name}".`);
          return;
        }
        pages = parsePagesInput(input, total) ?? undefined;
      }
      const rangeTotal = pages ? pages.length : total;
      setPdfProgress({ fileName: f.name, done: 0, total: rangeTotal });
      /**
       * D1b — vá DF2-F1 (luật Smart Ingest): ảnh nhúng PDF đẩy ra KHO Thư viện qua POST
       * /api/library SẴN CÓ (cùng đường LibraryPanel/ProjectSelect upload — không route mới),
       * deck chỉ giữ URL `/api/library/{id}/file` ⇒ deck JSON còn cỡ KB thay vì >1GB dataURL
       * (file 47 trang raster từng làm chết tab). Lib pdf-import THUẦN — nó không biết API,
       * mình truyền hàm; ném lỗi (chưa đăng nhập/ảnh >25MB bị 413…) thì lib tự fallback dataURL
       * + ghi imageWarnings, người dùng vẫn nhập được (khai thật trong summary, không hộp đen).
       */
      const storeImage = async (bytes: Uint8Array, meta: { assetId: string; name: string; mime: string }) => {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error ?? new Error('đọc bytes ảnh thất bại'));
          reader.readAsDataURL(new Blob([bytes as BlobPart], { type: meta.mime }));
        });
        const r = await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${meta.name} — ${f.name}`,
            category: 'Style dàn trang',
            tags: 'pdf-import',
            usage: 'slide',
            dataUrl,
          }),
        });
        if (!r.ok) throw new Error(`kho Thư viện trả ${r.status}`);
        const j = (await r.json()) as { url?: string };
        if (!j.url) throw new Error('kho Thư viện không trả url');
        return j.url;
      };
      const res = await pdfToDeck(buf, {
        fileName: f.name,
        pages,
        storeImage,
        onProgress: (done, tot) => setPdfProgress({ fileName: f.name, done, total: tot }),
      });
      if (!res.slides.length) {
        say(false, `Không nhập được trang nào từ "${f.name}".`);
        return;
      }
      window.dispatchEvent(
        new CustomEvent('present:pdf-import-request', {
          // D1b — kèm linkedAssets: hợp đồng của pdf-import.ts (docstring PdfImportResult) bắt
          // caller merge registry vào deck — trước đây quên, element hiển thị đúng nhưng mất tính
          // "sửa 1 lần đổi mọi nơi". PresentEditor#onImportPdf nhận và merge.
          detail: { slides: res.slides, linkedAssets: res.linkedAssets, message: pdfImportSummary(f.name, res) },
        }),
      );
    } catch (err) {
      say(false, err instanceof Error ? err.message : `Không mở được "${f.name}".`);
    } finally {
      setPdfProgress(null);
    }
  }

  async function onGatewayFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const bytes = new Uint8Array(await f.slice(0, 8192).arrayBuffer());
    const format = detectFormat({ name: f.name, bytes });
    const action = routeFormat(format, 'present');
    if (action.kind === 'place-image') {
      addImageFile(f);
      return;
    }
    if (action.kind === 'present-import-deck') {
      // Cùng MỘT đích "nhập làm slide", hai importer theo định dạng (route.ts:18 khai sẵn ý này).
      if (format === 'pdf') await openPdfFile(f);
      else await openPptxFile(f);
      return;
    }
    if (action.kind === 'present-open-project') {
      openIdfpFile(f);
      return;
    }
    if (action.kind === 'library-bulk-ingest') {
      // xlsx/csv — ở chặng Trình bày đích "nạp hàng loạt" nghĩa là nhập BOQ (dialog sẵn có).
      setBoqInitialFile(f);
      setBoqImportOpen(true);
      return;
    }
    const reason = action.kind === 'unsupported' && action.reason
      ? action.reason
      : `Chưa biết cách mở "${f.name}" trong chặng Trình bày.`;
    window.dispatchEvent(new CustomEvent('present:pptx-import-done', { detail: { ok: false, text: reason } }));
  }

  /**
   * 13/08 — GÓI HỒ SƠ SỐNG (.zip) — P4 chuỗi nền DocCore (docs/phieu-giao/goi-ho-so-song.md).
   * GOM artifact ĐÃ SINH SẴN từ các đường hiện có rồi gọi `lib/ho-so-song/pack.ts` đóng thùng —
   * KHÔNG render engine mới [T2]:
   *   · ruột JSON  = `.idfp` đầy đủ mọi sheet (exportIdfp — chính đường nút "Toàn bộ project")
   *   · ảnh trang  = renderEditorSlide từng slide deck ĐANG MỞ (chính engine PDF/PNG đang dùng)
   *   · BOQ        = CÙNG đường `BoqXlsxImportDialog` bên dưới (getProjectDoc + POST /api/boq)
   *                  → boqResultToXlsxBuffer; KHÔNG mở được thì BỎ QUA kênh đó, không chặn [T0]
   *   · PDF        = `exportDeckToPdfBlob` (13/08, phiếu present-editor-hoan-thien-1 — biến thể
   *                  Blob CÙNG builder với nút "Xuất PDF"); lỗi → kênh vắng + viewer khai rõ,
   *                  fail-open không chặn gói [T0].
   * Toast đi kênh `present:idfp-export-done` (PresentEditor.tsx#onDone — kênh toast xuất CHUNG,
   * cùng cách .pptx nhập mượn kênh, không viết toast mới). Mọi import ĐỘNG — người không bấm
   * thì bundle chặng Trình chiếu không phải tải jszip/render. MARKER: HoSoSong.
   */
  async function exportHoSoSong() {
    if (hoSoBusy) return;
    const say = (ok: boolean, text: string) =>
      window.dispatchEvent(new CustomEvent('present:idfp-export-done', { detail: { ok, text } }));
    setHoSoBusy(true);
    say(true, 'Đang đóng Gói Hồ Sơ (.zip)…');
    try {
      const [{ packHoSoSong, hoSoSongFileName }, { exportIdfp }, { getActiveBrandKit }, { renderEditorSlide }, { stageFor }, { loadSheets }] =
        await Promise.all([
          import('@/lib/ho-so-song/pack'),
          import('@/lib/present-editor/idfp'),
          import('@/lib/present-editor/brand-kit'),
          import('@/lib/present-editor/render'),
          import('@/lib/present-editor/stage-presets'),
          import('@/lib/sheets-persist'),
        ]);

      // 1. Deck mọi sheet từ persist — CÙNG bucket/route PresentSheets.tsx đang autosave vào.
      type PersistedPresentSheet = { id: string; name: string; deck: import('@/lib/present-editor/model').EditorDeck };
      const record = hoSoUserId
        ? await loadSheets<PersistedPresentSheet & { [k: string]: unknown }>(hoSoUserId, '/present-editor', hoSoBucketId)
        : null;
      const sheets = (record?.sheets ?? []).filter((s) => s?.deck && Array.isArray(s.deck.slides));
      const activeSheet = sheets.find((s) => s.id === record?.activeId) ?? sheets[0];
      const tenDuAn = activeSheet?.deck.project || activeSheet?.deck.brand || hoSoProjectId || 'Hồ sơ';
      const taoLuc = new Date().toISOString();

      const deckJson = sheets.length
        ? (JSON.parse(exportIdfp(
            sheets.map((s) => ({ id: s.id, name: s.name, deck: s.deck })),
            getActiveBrandKit(),
            { projectName: tenDuAn },
          )) as unknown)
        : undefined;

      // 2. Ảnh từng trang của deck ĐANG MỞ — chính engine render PDF/PNG đang dùng.
      const images: Array<{ name: string; data: Uint8Array }> = [];
      if (activeSheet) {
        const deck = activeSheet.deck;
        const stage = stageFor(deck.stagePreset);
        for (let i = 0; i < deck.slides.length; i++) {
          const dataUrl = await renderEditorSlide(deck.slides[i], deck.fonts, deck.watermark, stage);
          const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
          const bin = atob(b64);
          const arr = new Uint8Array(bin.length);
          for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
          images.push({ name: `trang-${String(i + 1).padStart(2, '0')}.jpg`, data: arr });
        }
      }

      // 3. BOQ best-effort — hỏng/thiếu Doc thì BỎ QUA kênh, không chặn cả gói.
      let boqXlsx: Uint8Array | undefined;
      let boqTomTat: { rows: Array<{ ten: string; qty: number; unit: string; thanhTien: number }>; tong: number } | undefined;
      if (hoSoProjectId && hoSoUserId) {
        try {
          const { doc, source } = await getProjectDoc(hoSoUserId, hoSoProjectId);
          if (source !== 'none' && doc.entities.length > 0) {
            const res = await fetch(`/api/boq/${hoSoProjectId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ doc }),
            });
            if (res.ok) {
              const data = await res.json();
              const rows: BoqRow[] = Array.isArray(data?.rows) ? data.rows : [];
              if (rows.length) {
                const totalAmount = rows.reduce((s, r) => s + (Number(r.thanhTien) || 0), 0);
                const { boqResultToXlsxBuffer } = await import('@/lib/boq/xlsx');
                boqXlsx = await boqResultToXlsxBuffer({
                  rows,
                  errors: Array.isArray(data?.errors) ? data.errors : [],
                  totalAmount,
                });
                boqTomTat = {
                  rows: rows.map((r) => ({ ten: r.ten, qty: r.qty, unit: r.unit, thanhTien: r.thanhTien })),
                  tong: totalAmount,
                };
              }
            }
          }
        } catch {
          // BOQ là kênh KÈM THÊM — lỗi mạng/Doc không được giết cả gói; viewer sẽ ghi kênh vắng.
        }
      }

      // 4. PDF deck ĐANG MỞ — biến thể Blob của chính đường "Xuất PDF" (exportDeckToPdfBlob).
      // Best-effort như BOQ: hỏng thì kênh vắng (viewer khai rõ), KHÔNG giết cả gói [T0].
      let pdf: Blob | undefined;
      if (activeSheet) {
        try {
          const { exportDeckToPdfBlob } = await import('@/lib/present-editor/export');
          pdf = await exportDeckToPdfBlob(activeSheet.deck);
        } catch {
          // kênh KÈM THÊM — render/ảnh hỏng không được chặn các kênh còn lại.
        }
      }

      const blob = await packHoSoSong({
        projectId: hoSoProjectId || hoSoBucketId,
        tenDuAn,
        taoLuc,
        nguoiXuat: hoSoUserId || undefined,
        deckJson,
        boqXlsx,
        boqTomTat,
        pdf,
        images,
      });
      const fileName = hoSoSongFileName(tenDuAn, taoLuc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      const vang = [!deckJson && 'deck', !images.length && 'ảnh', !boqXlsx && 'BOQ', !pdf && 'PDF']
        .filter(Boolean)
        .join(', ');
      say(true, `Đã xuất ${fileName} — ${images.length} trang ảnh${pdf ? ' + PDF' : ''}${boqXlsx ? ' + BOQ' : ''}${deckJson ? ' + ruột JSON' : ''}.${vang ? ` Kênh vắng: ${vang}.` : ''}`);
    } catch (err) {
      say(false, err instanceof Error ? err.message : 'Không đóng được Gói Hồ Sơ (.zip).');
    } finally {
      setHoSoBusy(false);
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
        <ArrowLeft size={18} /> Quay lại
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
            id: 'gateway',
            label: 'Chọn tệp — tự nhận định dạng',
            sub: 'Ảnh · PPTX · PDF (chữ sống, bậc 1) · IDFP · XLSX/CSV; định dạng chưa hỗ trợ sẽ nói rõ lý do',
            icon: <FileUp size={16} />,
            onSelect: () => gatewayFileRef.current?.click(),
          },
          {
            id: 'boq-appendix',
            label: tr('Phụ lục BOQ từ bản vẽ', 'BOQ appendix from the drawing'),
            sub: tr(
              'Dựng trang bảng khối lượng từ Doc 2D + Kho giá + số sửa tay · mỗi dòng ghi rõ Bản vẽ ↔ Sửa tay ✎ · làm mới được · PDF/PNG đúng bố cục, PPTX xuất trang này dạng ảnh',
              'Build BOQ pages from the 2D doc + price library + hand edits · every row labelled Drawing ↔ Hand-edited ✎ · refreshable · PDF/PNG keep the layout, PPTX exports these pages as images',
            ),
            icon: <TableProperties size={15} />,
            onSelect: () => { void p.onInsertBoqAppendix?.(); },
            disabled: !p.onInsertBoqAppendix || !!p.boqAppendixBusy,
            disabledReason: p.boqAppendixBusy
              ? tr('Đang dựng phụ lục — chờ xong lượt trước.', 'Building the appendix — wait for the previous run.')
              : tr('Chưa nối với hồ sơ đang mở.', 'Not connected to the open document.'),
          },
        ]}
      />
      {pdfProgress && (
        <span
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}
          title={`Đang chuyển "${pdfProgress.fileName}" — trang ${pdfProgress.done}/${pdfProgress.total}`}
        >
          <LightArc
            value={pdfProgress.total > 0 ? (pdfProgress.done / pdfProgress.total) * 100 : undefined}
            size={16}
            strokeWidth={1.5}
            label="Đang chuyển PDF"
          />
          Trang {pdfProgress.done}/{pdfProgress.total}
        </span>
      )}
      {boqImportOpen && (
        <BoqXlsxImportDialog
          initialFile={boqInitialFile}
          onClose={() => { setBoqImportOpen(false); setBoqInitialFile(null); }}
        />
      )}
      <input
        ref={gatewayFileRef}
        type="file"
        hidden
        onChange={onGatewayFile}
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
          { id: 'pdf', label: 'PDF', sub: '1:1 với editor · đúng khổ đã chọn (màn hình/chiếu)', icon: <FileDown size={16} />, onSelect: p.onExportPdf },
          /* R9a (19/08) nhãn-nói-thật: "luôn khổ 16:9" lỗi thời — export.ts đọc
             deck.stagePreset (quyết định 16:9-cứng đã HUỶ 07/08 p12). */
          { id: 'pptx', label: 'PowerPoint (.pptx)', sub: 'Chữ còn chỉnh được trong PPT · đúng khổ đã chọn', icon: <FileText size={16} />, onSelect: p.onExportPptx },
          { id: 'png', label: 'Ảnh PNG', sub: 'Mỗi slide 1 ảnh, tải lần lượt', icon: <ImageIcon size={16} />, onSelect: p.onExportPng },
          {
            id: 'idfp',
            label: 'Toàn bộ project (.idfp)',
            sub: 'Mở lại chỉnh được tiếp — mọi trang/slide/font/ảnh nhúng, tự chứa',
            icon: <FileJson size={16} />,
            onSelect: () => window.dispatchEvent(new CustomEvent('present:idfp-export-request')),
          },
          {
            id: 'print300',
            label: 'PDF in 300dpi (A3/A4)',
            sub: 'Chữ/hình khối + ảnh đủ nguồn đạt 300dpi thật · ảnh nhỏ tự nâng độ phân giải (hỏi giá/thời gian trước khi chạy)',
            icon: <Printer size={16} />,
            onSelect: p.onExportPrint300,
            disabled: !p.printReady,
            disabledReason: 'Chỉ xuất được ở khổ giấy A4/A3 — đổi khổ trong "Khổ trình bày" trước (16:9 là khổ màn hình, không phải khổ in).',
          },
          {
            id: 'pdf-sheets',
            label: 'Xuất PDF theo tờ giấy…',
            sub: 'Chọn khổ/hướng giấy · xem trước tờ · kiểm bảng nét in trước khi xuất',
            icon: <FileDown size={16} />,
            onSelect: () => setPdfSheetsOpen(true),
          },
          {
            id: 'ho-so-song',
            label: 'Gói Hồ Sơ (.zip) · Living Dossier',
            sub: 'Một file giao khách: trang xem mở mọi trình duyệt + ảnh/BOQ + dữ liệu máy-đọc nhập lại được',
            icon: <Archive size={16} />,
            onSelect: () => { void exportHoSoSong(); },
            disabled: hoSoBusy,
            disabledReason: 'Đang đóng gói — chờ xong lượt trước.',
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
      {/* Cửa nhận tờ từ 2D/3D mount ở `PresentStageScreen` (tầng chặng), KHÔNG ở đây: cầu là
          consume-once, hai nơi cùng nhận thì nơi nào dựng trước cướp mất tờ của nơi kia. Toolbar
          chỉ dựng khi đã có hồ sơ mở nên nó là chỗ SAI để nhận. */}
      <Divider />
      <Btn onClick={p.onAddText} title="Thêm chữ">
        <Type size={18} /> Chữ
      </Btn>
      <Btn
        onClick={() => fileRef.current?.click()}
        title="Ảnh NỘI DUNG: tải ảnh lên và đưa thẳng vào slide đang dàn. (Ảnh tham khảo/style → tab Reference bên trái)"
      >
        <ImageIcon size={18} /> Ảnh
      </Btn>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <Divider />
      {/* H4 (13/08, sửa nóng dogfood F1 "toolbar 2 hàng ~20 nút ngang cấp") — 6 lệnh
          rect/ellipse/triangle/polygon/arrow/line GỘP vào 1 nhóm "Hình" mở popover. KHÔNG bớt
          lệnh nào, chỉ đổi nơi đứng — cùng luật §0d đã áp cho "Sắp xếp" bên dưới. */}
      <span ref={shapeBtnRef} style={{ display: 'inline-flex' }}>
        <Btn onClick={() => setShapeOpen((v) => !v)} active={shapeOpen} title="Hình — chữ nhật · elip · tam giác · đa giác · mũi tên · đường thẳng">
          <Square size={18} /> Hình
        </Btn>
      </span>
      {shapeOpen && (
        <AnchoredPopover anchorRef={shapeBtnRef} onDismiss={() => setShapeOpen(false)} width={168}>
          <IconOnly onClick={() => { p.onAddShape('rect'); setShapeOpen(false); }} title="Hình chữ nhật (chuột phải shape trên slide để chỉnh cạnh/góc)">
            <Square size={18} />
          </IconOnly>
          <IconOnly onClick={() => { p.onAddShape('ellipse'); setShapeOpen(false); }} title="Hình elip">
            <Circle size={18} />
          </IconOnly>
          <IconOnly onClick={() => { p.onAddShape('triangle'); setShapeOpen(false); }} title="Tam giác">
            <Triangle size={18} />
          </IconOnly>
          <IconOnly onClick={() => { p.onAddShape('polygon'); setShapeOpen(false); }} title="Đa giác (chỉnh số cạnh khi chuột phải)">
            <Pentagon size={18} />
          </IconOnly>
          <IconOnly onClick={() => { p.onAddShape('arrow'); setShapeOpen(false); }} title="Mũi tên">
            <MoveRight size={18} />
          </IconOnly>
          <IconOnly onClick={() => { p.onAddShape('line'); setShapeOpen(false); }} title="Đường thẳng">
            <Minus size={18} />
          </IconOnly>
        </AnchoredPopover>
      )}

      <Divider />
      {/* 07/08 (p12, chốt 01/08 §3c): TemplatePicker + LayoutShelf đã gộp làm MỘT — tên chính
          thức "Bố cục" (nhãn cũ trên nút + tab panel ghi "Magic" là hai tên cho một thứ;
          không nhắc nguyên văn nhãn cũ ở đây để cửa kiểm PHEU-AI-TEN-MAGIC quét chuỗi không
          báo nhầm vào comment lịch sử). */}
      <Btn onClick={p.onToggleTemplates} active={p.templatesOpen} title="Thiết kế — Magic và các mẫu dàn trang">
        <LayoutTemplate size={18} /> Thiết kế
      </Btn>

      <Divider />
      {/* ══ TẦNG ① — LỆNH CHUNG, ĐỌC TỪ SỔ LỆNH (B2) ══
          Trước B2 chỗ này là hai nút Hoàn tác/Làm lại tự khai. Nay cả cụm đọc
          `lib/commands/registry.ts`, nên Trình chiếu bày ĐÚNG bộ lệnh chung, ĐÚNG thứ tự, ĐÚNG
          icon như 2D và 3D.
          Tám lệnh chặng này chưa có engine vẫn HIỆN, mờ kèm lý do thật (§9 "cấm nút giả · cấm xoá
          ô trống cho gọn mắt"): ô mờ là bằng chứng còn việc, và giấu đi thì ba chặng lại hiện ba
          bộ nút khác nhau — đúng cái B2 sinh ra để dẹp. */}
      {bindStage(commonCommandsFor({ stage: 'present' }), {
        'cad.sel.undo': { run: p.onUndo, unavailableReason: p.canUndo ? undefined : 'Chưa có thao tác nào để hoàn tác' },
        'cad.sel.redo': { run: p.onRedo, unavailableReason: p.canRedo ? undefined : 'Chưa hoàn tác gì để làm lại' },
      }).map((c) => (
        <IconOnly
          key={c.id}
          onClick={c.run}
          label={c.label[0]}
          title={c.enabled ? c.label[0] : (c.disabledReason ?? c.label[0])}
          disabled={!c.enabled}
        >
          <CommandIcon name={c.icon} size={18} />
        </IconOnly>
      ))}

      <Divider />
      {/* H4 (13/08) — Sắp xếp/Brand Kit/Khổ trình bày/Xem lưới GỘP vào 1 menu "⋯". Đặt tên "⋯"
          (không phải "Bố cục") để KHÔNG trùng tên với nút Thiết kế ngay trên (comment 07/08 gọi
          cụm mẫu dàn trang là "Bố cục" — 2 nút cùng tên trên 1 toolbar đúng là thứ đang gây rối,
          nên tránh). Không bớt lệnh nào — "Sắp xếp" bên trong vẫn mở ĐÚNG AnchoredPopover cũ
          (căn lề · thứ tự lớp · nhóm · khoá · ẩn), chỉ đổi điểm neo. */}
      <span ref={layoutMenuBtnRef} style={{ display: 'inline-flex' }}>
        <Btn
          onClick={() => setLayoutMenuOpen((v) => !v)}
          active={layoutMenuOpen || arrangeOpen}
          title="Thêm — Sắp xếp · Brand Kit · Khổ trình bày · Xem lưới"
        >
          <MoreHorizontal size={18} />
        </Btn>
      </span>
      {layoutMenuOpen && (
        <AnchoredPopover anchorRef={layoutMenuBtnRef} onDismiss={() => setLayoutMenuOpen(false)} width={216} layout="list">
          <MenuRow
            icon={<AlignCenterHorizontal size={14} />}
            label="Sắp xếp"
            sub="Căn lề · thứ tự lớp · nhóm · khoá · ẩn"
            onClick={() => { setLayoutMenuOpen(false); setArrangeOpen(true); }}
          />
          <MenuRow
            icon={<Palette size={14} />}
            label="Brand Kit"
            sub="Logo · màu · font · watermark"
            onClick={() => { setLayoutMenuOpen(false); p.onBrandKit(); }}
          />
          <MenuRow
            icon={<Proportions size={14} />}
            label={`Khổ trình bày — ${p.stageLabel}`}
            sub="16:9 · A4/A3 ngang/dọc"
            onClick={() => { setLayoutMenuOpen(false); p.onStagePreset(); }}
          />
          <MenuRow
            icon={<LayoutGrid size={14} />}
            label="Xem lưới"
            sub="Toàn bộ slide dạng lưới thu nhỏ"
            onClick={() => { setLayoutMenuOpen(false); p.onOpenSorter(); }}
          />
        </AnchoredPopover>
      )}
      {arrangeOpen && (
        <AnchoredPopover anchorRef={layoutMenuBtnRef} onDismiss={() => setArrangeOpen(false)} width={236}>
      {/* P6b bước 1 — cụm "Sắp xếp": căn theo nhau · thứ tự lớp · nhóm/bỏ nhóm · khoá. Logic
       * NGUYÊN VẸN từ PresentEditor.tsx (đã dùng cho Inspector.tsx) — chỉ nối thêm 1 lối gọi. */}
      <IconOnly
        onClick={() => p.onAlignSelection('left')}
        title="Căn trái theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignStartVertical size={18} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onAlignSelection('hcenter')}
        title="Căn giữa ngang theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignCenterVertical size={18} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onAlignSelection('right')}
        title="Căn phải theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignEndVertical size={18} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onAlignSelection('top')}
        title="Căn trên theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignStartHorizontal size={18} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onAlignSelection('vcenter')}
        title="Căn giữa dọc theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignCenterHorizontal size={18} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onAlignSelection('bottom')}
        title="Căn dưới theo nhau (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <AlignEndHorizontal size={18} />
      </IconOnly>

      <IconOnly
        onClick={() => p.onZOrder('front')}
        title="Đưa lên trước cùng"
        disabled={multiCount < 1}
      >
        <ChevronsUp size={18} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onZOrder('forward')}
        title="Tiến 1 bậc"
        disabled={multiCount < 1}
      >
        <ArrowUp size={18} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onZOrder('backward')}
        title="Lùi 1 bậc"
        disabled={multiCount < 1}
      >
        <ArrowDown size={18} />
      </IconOnly>
      <IconOnly
        onClick={() => p.onZOrder('back')}
        title="Đưa ra sau cùng"
        disabled={multiCount < 1}
      >
        <ChevronsDown size={18} />
      </IconOnly>

      <IconOnly
        onClick={p.onGroup}
        title="Gộp các phần tử đang chọn thành 1 cụm (cần ≥2 đối tượng)"
        disabled={multiCount < 2}
      >
        <Group size={18} />
      </IconOnly>
      <IconOnly
        onClick={p.onUngroup}
        title="Rã cụm của lựa chọn hiện tại"
        disabled={selectedGroupCount < 1}
      >
        <Ungroup size={18} />
      </IconOnly>
      <IconOnly
        onClick={p.onToggleLock}
        title={anyUnlocked ? 'Khoá lựa chọn' : 'Mở khoá lựa chọn'}
        disabled={multiCount < 1}
      >
        {anyUnlocked ? <Lock size={18} /> : <Unlock size={18} />}
      </IconOnly>
      {/* P6b bước 2a — Ẩn hàng loạt, cạnh Khoá theo đúng vị trí Hoà duyệt. */}
      <IconOnly
        onClick={p.onToggleHide}
        title={anyVisible ? 'Ẩn lựa chọn' : 'Hiện lựa chọn'}
        disabled={multiCount < 1}
      >
        {anyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </IconOnly>

        </AnchoredPopover>
      )}
      <div style={{ flex: 1 }} />

      {/* H4 (13/08): "Xem lưới" dời vào menu "⋯" phía trên (xem AnchoredPopover layout="list") —
          Trình chiếu giữ nguyên vị trí cuối cùng, luôn thấy được (1 trong 6 việc chính). */}
      <Btn onClick={p.onPlay} title="Trình chiếu (xem hiệu ứng động)">
        <Play size={18} /> Trình chiếu
      </Btn>

      {/* nút ẩn giữ chỗ cho lib open state (tránh unused) */}
      {libOpen && <span hidden onClick={() => setLibOpen(false)} />}
    </div>
  );
});

export default Toolbar;

/**
 * 15/08 (`toolbar-mot-khuon`) — CHƯA đổi sang `ToolbarChip`: `Btn` là pill NGANG icon+CHỮ LUÔN
 * HIỆN (nav "Quay lại", CTA đặc "Trình chiếu"/primary), khác ngữ pháp với `ToolbarChip` (chip
 * TRÒN, chữ ẩn dưới tooltip trừ khi `showLabel` xếp CỘT) — ép vào sẽ làm mất chữ luôn-hiện của
 * nav/CTA hoặc làm "Trình chiếu" (nút primary duy nhất) hết tô đặc, đổi ý nghĩa hình học của
 * chính nó (primary CTA CHỦ Ý tô đặc, khác nút TOGGLE mà luật 2.1.8.l nhắm tới).
 *
 * ⇒ T audit 15/08 GIỮ NGUYÊN lập luận này (đúng: pill-chữ ≠ chip-tròn là hai ngữ pháp thật), chỉ
 * đi nốt bước cuối: bo `RADIUS.r2` (10) → `RADIUS.full` — vì r10 để lại hậu quả nặng hơn cả hai
 * lựa chọn thuần: CÙNG một hàng có 2 chip r999 cạnh 8 pill r10, Trình chiếu tự mâu thuẫn. Capsule
 * giữ được HẾT (chữ luôn hiện · primary vẫn đặc) mà vẫn về đúng họ hình KB-1. Kèm `#fff` → `--on-accent`.
 */
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
        // 15/08 T audit `toolbar-mot-khuon`: r10 → capsule. Giữ nguyên lập luận đúng của TB
        // (Btn là pill NGANG icon+chữ, KHÔNG ép thành chip tròn — nav mất chữ, CTA mất tô đặc),
        // nhưng r10 để lại hậu quả nặng hơn: trong CÙNG một hàng có 2 chip r999 đứng cạnh 8 pill
        // r10, tức Trình chiếu tự mâu thuẫn với chính nó — tệ hơn cả hai lựa chọn thuần. KB-1
        // chốt họ hình là CAPSULE, và pill chữ vẫn capsule được: chữ vẫn hiện, primary vẫn đặc,
        // chỉ đổi đúng một thuộc tính. Đây là chỗ "cùng họ nút" của 3 chặng thật sự khép lại.
        borderRadius: RADIUS.full,
        fontSize: 13,
        cursor: disabled ? 'default' : 'pointer',
        border: primary ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: primary
          ? 'var(--accent)'
          : active
            ? 'var(--accent-soft)'
            : 'var(--field)',
        // '#fff' cũ là hex cứng giữa rừng token — `--on-accent` đã có sẵn (globals.css:160,
        // đo 4,89:1 trên nền accent) và chính ToolDock3D đang dùng. Không đẻ màu ngoài hệ.
        color: primary ? 'var(--on-accent)' : active ? 'var(--accent)' : 'var(--t2)',
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

/**
 * 15/08 (`toolbar-mot-khuon`, KB-1) — ĐỔI RUỘT sang `ToolbarChip` (component nền dùng chung 3
 * chặng), GIỮ NGUYÊN chữ ký gọi CŨ (children/onClick/title/disabled) để 22+ nơi gọi `<IconOnly>`
 * trong file này không phải sửa. `title` đã luôn mang sẵn lý do khi mờ (vd "Căn trái theo nhau
 * (cần ≥2 đối tượng)") → dùng làm cả `desc` (bật) lẫn `disabledReason` (mờ), đúng §9.
 * `label` (MỚI, optional) — tên NGẮN ổn định cho aria-label/tag hover khi `title` đổi hẳn nội
 * dung lúc mờ (vd Hoàn tác/Làm lại: title đổi thành cả câu lý do) — mặc định vẫn suy từ `title`
 * như trước nên các nơi gọi cũ không cần đổi gì.
 */
function IconOnly({
  children,
  onClick,
  title,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <ToolbarChip
      icon={children}
      label={label ?? shortLabel(title)}
      desc={disabled ? undefined : title}
      disabled={disabled}
      disabledReason={disabled ? title : undefined}
      onClick={onClick}
    />
  );
}

/**
 * L4 (đổi tên AnchoredPopover ở H4 13/08 — dùng chung cho "Hình" · "Sắp xếp" · menu "⋯", không
 * chỉ riêng Sắp xếp nữa) — bảng nổi dưới nút neo. PORTAL ra `body` theo LUẬT PANEL NỔI (docs/
 * 00-CHOT K4: panel kính lồng trong chrome kính thì backdrop blur của cha chặn blur của con).
 * Đóng bằng Escape / bấm ra ngoài qua `useDismissable` — cùng họ sự kiện với mọi lớp đóng-mở của
 * app, không tự chế listener riêng.
 *
 * `layout`: 'grid' (mặc định) = lưới icon bọc dòng (Hình · Sắp xếp) · 'list' = cột dọc, mỗi dòng
 * 1 mục có icon+nhãn+mô tả (menu "⋯" — dùng `MenuRow` bên dưới).
 */
function AnchoredPopover({
  anchorRef,
  onDismiss,
  children,
  width = 236,
  layout = 'grid',
}: {
  anchorRef: React.RefObject<HTMLSpanElement | null>;
  onDismiss: () => void;
  children: React.ReactNode;
  width?: number;
  layout?: 'grid' | 'list';
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    // ghim mép trái theo nút, tự lùi vào trong nếu sát mép phải màn hình
    setPos({ left: Math.min(r.left, window.innerWidth - width - 12), top: r.bottom + 6 });
  }, [anchorRef, width]);

  useDismissable({ open: true, onDismiss, refs: [panelRef, anchorRef] });

  if (typeof document === 'undefined' || !pos) return null;
  return createPortal(
    <div
      ref={panelRef}
      role="group"
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        zIndex: 80,
        width,
        display: 'flex',
        flexDirection: layout === 'list' ? 'column' : 'row',
        flexWrap: layout === 'list' ? 'nowrap' : 'wrap',
        gap: layout === 'list' ? 2 : 6,
        padding: layout === 'list' ? 6 : 10,
        borderRadius: 'var(--r-3, 14px)',
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

/** 1 dòng trong menu "⋯" (layout="list" của AnchoredPopover) — icon + nhãn đậm + mô tả nhỏ,
 * cùng khuôn `Item` của `components/ui/IOMenu.tsx` (KHÔNG import trực tiếp — file đó dùng chung
 * cho cả 3 chặng, ngoài VÙNG FILE của ticket này) nhưng chỉ 1 hành động, không có trạng thái
 * disabled. */
function MenuRow({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        width: '100%',
        padding: '8px 9px',
        borderRadius: 'var(--r-2, 10px)',
        border: 'none',
        background: hover ? 'var(--field)' : 'transparent',
        color: 'var(--t2)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--accent)' }}>{icon}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 10.5, color: 'var(--t4)', marginTop: 1 }}>{sub}</span>}
      </span>
    </button>
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
function BoqXlsxImportDialog({ onClose, initialFile = null }: { onClose: () => void; initialFile?: File | null }) {
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
  const initialFileConsumed = useRef(false);

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

  useEffect(() => {
    if (step !== 'pick' || !initialFile || initialFileConsumed.current) return;
    initialFileConsumed.current = true;
    void openFile(initialFile);
  }, [step, initialFile]);

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
      <div style={{ width: 760, maxWidth: 'calc(100vw - 24px)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--panel)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 46, padding: '0 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <FileSpreadsheet size={20} style={{ color: 'var(--accent)' }} />
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>
            {tr('Nhập .xlsx vào bảng khối lượng', 'Import .xlsx into the bill of quantities')}
          </span>
          <button type="button" onClick={onClose} style={{ marginLeft: 'auto', width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, borderRadius: 6, background: 'transparent', color: 'var(--t4)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
          {step === 'load' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px' }}>
              {loadError ? (
                <>
                  <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
                  <span style={{ fontSize: 12.5, color: 'var(--t2)', textAlign: 'center', maxWidth: 460, lineHeight: 1.5 }}>{loadError}</span>
                  <button type="button" onClick={() => void loadBoq()} style={btnPrimary}>{tr('Thử lại', 'Try again')}</button>
                </>
              ) : (
                <>
                  <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
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
                  borderRadius: 10, border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                  background: dragOver ? 'var(--accent-soft, var(--field))' : 'var(--field)',
                }}
              >
                <Upload size={20} strokeWidth={1.5} style={{ color: 'var(--t4)' }} />
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
                    <AlertTriangle size={14} /> {fileError}
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
                      style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 12.5, padding: '0 8px' }}
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
                <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 10, background: 'color-mix(in srgb, var(--danger) 12%, var(--field))', border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--t2)' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--danger)', verticalAlign: -2, marginRight: 5 }} />
                  {tr(
                    'Chưa chỉ được cột MÃ — không có mã thì không biết dòng Excel thuộc hạng mục nào. Khớp theo TÊN là cách chắc chắn nạp nhầm giá, nên app không làm.',
                    'No code column selected — without a code there is no way to tell which item a row belongs to. Matching by name is a reliable way to import the wrong price, so the app does not do it.',
                  )}
                </div>
              )}

              {dropped.length > 0 && (
                <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 10, background: 'color-mix(in srgb, var(--warning) 12%, var(--field))', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)' }}>
                    <AlertTriangle size={14} style={{ color: 'var(--warning)', verticalAlign: -2, marginRight: 5 }} />
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
                  <AlertTriangle size={14} /> {fileError}
                </div>
              )}
            </>
          )}

          {step === 'applying' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, color: 'var(--t2)' }}>{tr('Đang nạp vào bảng khối lượng…', 'Writing into the bill of quantities…')}</span>
            </div>
          )}

          {step === 'done' && applied && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--accent)' }} />
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
const btnPrimary: React.CSSProperties = { height: 32, padding: '0 16px', borderRadius: 10, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { height: 32, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
