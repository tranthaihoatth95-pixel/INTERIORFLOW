'use client';

/**
 * components/present-editor/Toolbar.tsx — Thanh công cụ trên cùng.
 * Thêm chữ / ảnh / hình, mở template, undo/redo, xuất PDF & PPTX.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
} from 'lucide-react';
import IOMenu from '@/components/ui/IOMenu';
import { useDismissable } from '@/lib/useDismissable';
import Tooltip from '@/components/ui/Tooltip';
import type { EditorSlide, ShapeKind } from '@/lib/present-editor/model';
import type { AlignMode as GroupAlignMode } from '@/lib/present-editor/align';

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
  const [libOpen, setLibOpen] = useState(false);
  // L4 — cụm Sắp xếp gom vào popover (xem chú thích tại nút).
  const [arrangeOpen, setArrangeOpen] = useState(false);
  const arrangeBtnRef = useRef<HTMLSpanElement>(null);

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
        title="Nhập file vào chặng Trình bày"
        items={[
          {
            id: 'image',
            label: 'Ảnh vào slide',
            sub: 'Ảnh NỘI DUNG — đưa thẳng vào slide đang dàn',
            icon: <ImageIcon size={15} />,
            onSelect: () => fileRef.current?.click(),
          },
          {
            id: 'deck',
            label: 'Mở deck (.pptx / .pdf)',
            icon: <FileUp size={15} />,
            onSelect: () => {},
            disabled: true,
            // Đính chính 01/08 — câu cũ "Present hiện chỉ nhập ảnh" LỖI THỜI (ngầm phủ nhận cả
            // .idfp, trong khi nút "Mở project (.idfp)" ngay bên dưới ĐÃ chạy thật — xem
            // idfp.ts + PresentSheets.tsx:60). Nút NÀY thật sự chưa có gì đứng sau (onSelect
            // no-op) — KHÔNG mở khoá, chỉ sửa câu cho đúng hiện trạng.
            disabledReason: 'Chưa hỗ trợ đọc trực tiếp .pptx/.pdf — dùng ".idfp" để mở lại project đã lưu, hoặc nhập ảnh rời',
          },
          {
            id: 'idfp',
            label: 'Mở project (.idfp)',
            sub: 'Thay thế toàn bộ project — mọi trang/slide/font/ảnh nhúng',
            icon: <FileJson size={15} />,
            onSelect: () => idfpFileRef.current?.click(),
          },
        ]}
      />
      <input ref={idfpFileRef} type="file" accept=".idfp,application/json" hidden onChange={onOpenIdfpFile} />
      <IOMenu
        kind="export"
        size="md"
        align="left"
        variant="accent"
        title="Xuất file từ chặng Trình bày"
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
        ]}
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
      <Btn onClick={p.onToggleTemplates} active={p.templatesOpen} title="Chọn mẫu bố cục">
        <LayoutTemplate size={15} /> Mẫu
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
