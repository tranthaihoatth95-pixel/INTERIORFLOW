'use client';

/**
 * components/photo-editor/PhotoToolbar.tsx — Thanh công cụ trên cùng của trình chỉnh ảnh.
 *
 * Chọn tool (move/brush/eraser/clone/heal/mask/marquee/lasso), thanh cọ (size/hardness/
 * opacity/màu), import ảnh (upload/URL/thư viện), undo/redo, fit, export PNG/JPEG.
 */

import { useRef, useState } from 'react';
import {
  ArrowLeft,
  MousePointer2,
  Brush,
  Eraser,
  Stamp,
  Bandage,
  Layers as MaskIcon,
  SquareDashed,
  Lasso,
  Undo2,
  Redo2,
  Maximize,
  Upload,
  Link2,
  ImagePlus,
  Download,
  CornerUpLeft,
  Check,
} from 'lucide-react';
import type { Tool, BrushSettings } from '@/lib/photo-editor/tools';
import { isPaintTool, TOOL_LABELS, TOOL_HINTS, TOOL_KEYS } from '@/lib/photo-editor/tools';
import { modKey, modShiftKey } from '@/lib/kbd';

interface Props {
  tool: Tool;
  onTool: (t: Tool) => void;
  brush: BrushSettings;
  onBrush: (patch: Partial<BrushSettings>) => void;
  onImportFile: (dataURL: string) => void;
  onImportUrl: (url: string) => void;
  onOpenLibrary: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFit: () => void;
  onExport: (format: 'png' | 'jpeg') => void;
  busy: string | null;
  /** PS-3: có truyền (ảnh đến từ /present-editor qua handoff) → hiện nút "Ghi về Present". */
  onWriteBack?: () => void;
  /** true 1 nhịp ngắn sau khi ghi về xong — đổi nhãn nút thành "Đã ghi". */
  writeBackDone?: boolean;
}

/** Nhóm theo chức năng (giữ đúng thứ tự cũ), phân tách bằng Divider giữa các nhóm —
 * mượn quy ước nhóm-công-cụ của CadToolbar, không đập lại bố cục hàng công cụ. */
const TOOL_GROUPS: { t: Tool; icon: React.ReactNode }[][] = [
  [{ t: 'move', icon: <MousePointer2 size={15} /> }],
  [
    { t: 'brush', icon: <Brush size={15} /> },
    { t: 'eraser', icon: <Eraser size={15} /> },
    { t: 'clone', icon: <Stamp size={15} /> },
    { t: 'heal', icon: <Bandage size={15} /> },
    { t: 'mask', icon: <MaskIcon size={15} /> },
  ],
  [
    { t: 'marquee', icon: <SquareDashed size={15} /> },
    { t: 'lasso', icon: <Lasso size={15} /> },
  ],
];
const TOOLS = TOOL_GROUPS.flat();

/** Tooltip đủ 3 phần: nhãn · phím tắt · mô tả — vẫn hover-only nhưng thêm dòng luôn-thấy bên dưới. */
function toolTitle(t: Tool): string {
  const key = TOOL_KEYS[t];
  return key ? `${TOOL_LABELS[t]} · phím ${key} — ${TOOL_HINTS[t]}` : `${TOOL_LABELS[t]} — ${TOOL_HINTS[t]}`;
}

export default function PhotoToolbar(p: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState('');

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => p.onImportFile(String(reader.result));
    reader.readAsDataURL(f);
    e.target.value = '';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}
    >
      {/* hàng 1: nút thoát + tools + import/export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', flexWrap: 'wrap' }}>
        {/* Đường thoát Photo mode — luôn hiển thị, tránh kẹt trong route. */}
        <Btn
          onClick={() => {
            if (typeof window !== 'undefined') {
              if (window.history.length > 1) window.history.back();
              else window.location.href = '/';
            }
          }}
          title="Quay lại"
        >
          <ArrowLeft size={15} /> Quay lại
        </Btn>
        <Divider />
        {TOOL_GROUPS.map((group, gi) => (
          <span key={gi} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {gi > 0 && <Divider />}
            {group.map(({ t, icon }) => (
              <IconBtn key={t} title={toolTitle(t)} active={p.tool === t} onClick={() => p.onTool(t)}>
                {icon}
              </IconBtn>
            ))}
          </span>
        ))}

        <Divider />
        <Btn onClick={() => fileRef.current?.click()} title="Tải ảnh lên">
          <Upload size={15} /> Tải lên
        </Btn>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        <Btn onClick={() => setUrlOpen((v) => !v)} title="Dán URL ảnh" active={urlOpen}>
          <Link2 size={15} /> URL
        </Btn>
        <Btn onClick={p.onOpenLibrary} title="Từ thư viện Reference">
          <ImagePlus size={15} /> Thư viện
        </Btn>

        <Divider />
        <IconBtn onClick={p.onUndo} title={`Hoàn tác (${modKey('Z')})`} disabled={!p.canUndo}>
          <Undo2 size={15} />
        </IconBtn>
        <IconBtn onClick={p.onRedo} title={`Làm lại (${modShiftKey('Z')})`} disabled={!p.canRedo}>
          <Redo2 size={15} />
        </IconBtn>
        <IconBtn onClick={p.onFit} title={`Vừa khung (${modKey('0')})`}>
          <Maximize size={15} />
        </IconBtn>

        <div style={{ flex: 1 }} />
        <Btn onClick={() => p.onExport('png')} title="Xuất PNG" disabled={!!p.busy}>
          <Download size={15} /> {p.busy === 'png' ? 'Đang xuất…' : 'PNG'}
        </Btn>
        <Btn onClick={() => p.onExport('jpeg')} title="Xuất JPEG" disabled={!!p.busy} primary>
          <Download size={15} /> {p.busy === 'jpeg' ? 'Đang xuất…' : 'JPEG'}
        </Btn>
        {p.onWriteBack && (
          <>
            <Divider />
            <Btn
              onClick={p.onWriteBack}
              title="Composite ảnh rồi ghi về đúng ảnh trên slide ở tab /present-editor"
              disabled={!!p.busy}
              primary
            >
              {p.writeBackDone ? <Check size={15} /> : <CornerUpLeft size={15} />}
              {p.busy === 'writeback' ? 'Đang ghi…' : p.writeBackDone ? 'Đã ghi' : 'Ghi về Present'}
            </Btn>
          </>
        )}
      </div>

      {/* dòng phát hiện công cụ — LUÔN THẤY (không chỉ hover), cho designer không rành PTS
          biết ngay tool đang chọn làm gì + phím tắt, khớp mật độ/tông chữ nhỏ hiện có. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 12px 6px',
          fontSize: 11,
          color: 'var(--t4)',
        }}
      >
        <strong style={{ color: 'var(--t3)', fontWeight: 600 }}>{TOOL_LABELS[p.tool]}</strong>
        {TOOL_KEYS[p.tool] && <span>· phím {TOOL_KEYS[p.tool]}</span>}
        <span>— {TOOL_HINTS[p.tool]}</span>
      </div>

      {/* hàng URL (bung xuống) */}
      {urlOpen && (
        <div style={{ display: 'flex', gap: 6, padding: '0 12px 8px' }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… hoặc data:image/…"
            style={{
              flex: 1,
              fontSize: 12.5,
              padding: '6px 8px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--field)',
              color: 'var(--t1)',
            }}
          />
          <Btn
            onClick={() => {
              if (url.trim()) {
                p.onImportUrl(url.trim());
                setUrl('');
                setUrlOpen(false);
              }
            }}
            title="Thêm"
            primary
          >
            Thêm ảnh
          </Btn>
        </div>
      )}

      {/* hàng 2: thanh cọ — chỉ hiện khi tool dùng cọ */}
      {isPaintTool(p.tool) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '6px 12px',
            borderTop: '1px solid var(--border)',
            background: 'var(--field)',
            flexWrap: 'wrap',
          }}
        >
          <MiniSlider label="Cỡ" min={1} max={400} value={p.brush.size} onChange={(v) => p.onBrush({ size: v })} suffix="px" />
          <span style={{ fontSize: 10.5, color: 'var(--t4)' }} title="[ giảm cỡ cọ, ] tăng cỡ cọ">
            [ / ] đổi cỡ
          </span>
          <MiniSlider label="Độ cứng" min={0} max={100} value={Math.round(p.brush.hardness * 100)} onChange={(v) => p.onBrush({ hardness: v / 100 })} suffix="%" />
          <MiniSlider label="Đậm" min={1} max={100} value={Math.round(p.brush.opacity * 100)} onChange={(v) => p.onBrush({ opacity: v / 100 })} suffix="%" />
          {(p.tool === 'brush' || p.tool === 'mask') && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--t3)' }}>
              {p.tool === 'mask' ? 'Mask (trắng=hiện)' : 'Màu'}
              <input
                type="color"
                value={p.brush.color}
                onChange={(e) => p.onBrush({ color: e.target.value })}
                style={{ width: 28, height: 22, border: 'none', background: 'none', padding: 0 }}
              />
            </label>
          )}
          {p.tool === 'clone' && (
            <span style={{ fontSize: 11, color: 'var(--t4)' }}>Alt-click đặt điểm nguồn rồi tô.</span>
          )}
          {p.tool === 'mask' && (
            <span style={{ fontSize: 11, color: 'var(--t4)' }}>Tô đen để ẩn, trắng để hiện lại.</span>
          )}
        </div>
      )}
    </div>
  );
}

/* -------- widgets -------- */

function MiniSlider(props: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--t3)' }}>
      {props.label}
      <input
        type="range"
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        style={{ width: 96 }}
      />
      <span style={{ color: 'var(--t4)', minWidth: 34, textAlign: 'right' }}>
        {props.value}
        {props.suffix}
      </span>
    </label>
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
        padding: '7px 11px',
        borderRadius: 8,
        fontSize: 12.5,
        cursor: disabled ? 'default' : 'pointer',
        border: primary ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: primary ? 'var(--accent)' : active ? 'var(--accent-soft)' : 'var(--field)',
        color: primary ? '#fff' : active ? 'var(--accent)' : 'var(--t2)',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36,
        height: 34,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 8,
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'var(--accent-soft)' : 'var(--field)',
        color: active ? 'var(--accent)' : 'var(--t2)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 3px' }} />;
}
