'use client';

/**
 * components/present-editor/Toolbar.tsx — Thanh công cụ trên cùng.
 * Thêm chữ / ảnh / hình, mở template, undo/redo, xuất PDF & PPTX.
 */

import { useRef, useState } from 'react';
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
} from 'lucide-react';
import ExportMenu from './ExportMenu';
import Tooltip from '@/components/ui/Tooltip';
import type { ShapeKind } from '@/lib/present-editor/model';

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
}

export default function Toolbar(p: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [libOpen, setLibOpen] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => p.onAddImageUrl(String(reader.result));
    reader.readAsDataURL(f);
    e.target.value = '';
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
      <Divider />
      {/* Export gộp: PDF · PowerPoint · PNG trong 1 menu (góp ý #7). */}
      <ExportMenu
        onExportPdf={p.onExportPdf}
        onExportPptx={p.onExportPptx}
        onExportPng={p.onExportPng}
        busy={p.busy}
        resultMsg={p.exportMsg}
      />

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

function Divider() {
  return <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 3px' }} />;
}
