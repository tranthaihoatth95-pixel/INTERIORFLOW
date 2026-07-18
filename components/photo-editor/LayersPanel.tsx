'use client';

/**
 * components/photo-editor/LayersPanel.tsx — Bảng quản lý lớp (bên phải).
 *
 * Thêm/xoá/nhân bản/đổi tên/kéo sắp z-order, ẩn/hiện, khoá, slider opacity, chọn blend.
 * Danh sách hiển thị TỪ TRÊN XUỐNG = z cao xuống thấp (đảo mảng model để trực quan như PS).
 */

import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  SlidersHorizontal,
} from 'lucide-react';
import type { Layer, BlendMode } from '@/lib/photo-editor/model';
import { BLEND_MODES } from '@/lib/photo-editor/model';

interface Props {
  layers: Layer[]; // thứ tự model: [0]=dưới … [n]=trên
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void; // -1 = xuống (z thấp), +1 = lên
  onOpacity: (id: string, v: number, live: boolean) => void;
  onBlend: (id: string, b: BlendMode) => void;
}

export default function LayersPanel(p: Props) {
  // hiển thị từ trên xuống = đảo mảng
  const ordered = [...p.layers].reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', letterSpacing: 0.3 }}>
        LỚP ({p.layers.length})
      </div>
      {ordered.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--t4)', padding: '8px 0' }}>
          Chưa có lớp nào. Import ảnh hoặc thêm lớp mới.
        </div>
      )}
      {ordered.map((l) => (
        <LayerRow
          key={l.id}
          layer={l}
          selected={l.id === p.selectedId}
          onSelect={() => p.onSelect(l.id)}
          onToggleVisible={() => p.onToggleVisible(l.id)}
          onToggleLock={() => p.onToggleLock(l.id)}
          onRename={(n) => p.onRename(l.id, n)}
          onDuplicate={() => p.onDuplicate(l.id)}
          onDelete={() => p.onDelete(l.id)}
          onUp={() => p.onMove(l.id, 1)}
          onDown={() => p.onMove(l.id, -1)}
          onOpacity={(v, live) => p.onOpacity(l.id, v, live)}
          onBlend={(b) => p.onBlend(l.id, b)}
        />
      ))}
    </div>
  );
}

function LayerRow(props: {
  layer: Layer;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onToggleLock: () => void;
  onRename: (n: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUp: () => void;
  onDown: () => void;
  onOpacity: (v: number, live: boolean) => void;
  onBlend: (b: BlendMode) => void;
}) {
  const l = props.layer;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(l.name);

  return (
    <div
      onClick={props.onSelect}
      style={{
        border: props.selected ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: props.selected ? 'var(--accent-soft)' : 'var(--field)',
        borderRadius: 10,
        padding: 8,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconBtn title={l.visible ? 'Ẩn lớp' : 'Hiện lớp'} onClick={props.onToggleVisible}>
          {l.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </IconBtn>
        <span
          title={
            l.kind === 'adjustment'
              ? 'Lớp chỉnh màu — ảnh hưởng MỌI lớp bên dưới, không phá huỷ ảnh gốc'
              : 'Lớp ảnh (raster) — chỉ chứa nội dung của riêng nó'
          }
          style={{
            color: l.kind === 'adjustment' ? 'var(--accent)' : 'var(--t4)',
            display: 'grid',
            placeItems: 'center',
            width: 20,
            height: 20,
            borderRadius: 5,
            background: l.kind === 'adjustment' ? 'var(--accent-soft)' : 'transparent',
            flex: '0 0 auto',
          }}
        >
          {l.kind === 'adjustment' ? <SlidersHorizontal size={13} /> : <ImageIcon size={13} />}
        </span>
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              setEditing(false);
              props.onRename(name.trim() || l.name);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12.5,
              padding: '2px 6px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--t1)',
            }}
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setName(l.name);
              setEditing(true);
            }}
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12.5,
              color: 'var(--t2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title="Double-click để đổi tên"
          >
            {l.name}
          </span>
        )}
        <IconBtn title={l.locked ? 'Mở khoá' : 'Khoá'} onClick={props.onToggleLock}>
          {l.locked ? <Lock size={13} /> : <Unlock size={13} />}
        </IconBtn>
      </div>

      {/* gợi ý non-destructive — LUÔN THẤY (không chỉ hover) để phân biệt rõ adjustment
          (ảnh hưởng mọi lớp bên dưới) với raster phẳng (chỉ nội dung riêng nó). */}
      {l.kind === 'adjustment' && (
        <div style={{ fontSize: 10.5, color: 'var(--accent)', paddingLeft: 26, marginTop: 2 }}>
          ↓ ảnh hưởng mọi lớp bên dưới
        </div>
      )}

      {props.selected && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* opacity */}
          <label style={{ fontSize: 11, color: 'var(--t4)' }}>
            Độ mờ {Math.round(l.opacity * 100)}%
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(l.opacity * 100)}
              onChange={(e) => props.onOpacity(Number(e.target.value) / 100, true)}
              onPointerUp={(e) => props.onOpacity(Number((e.target as HTMLInputElement).value) / 100, false)}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%' }}
            />
          </label>
          {/* blend */}
          <select
            value={l.blend}
            onChange={(e) => props.onBlend(e.target.value as BlendMode)}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 12,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--t2)',
            }}
          >
            {BLEND_MODES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          {/* hàng thao tác */}
          <div style={{ display: 'flex', gap: 4 }}>
            <IconBtn title="Đưa lên" onClick={props.onUp}>
              <ChevronUp size={14} />
            </IconBtn>
            <IconBtn title="Đưa xuống" onClick={props.onDown}>
              <ChevronDown size={14} />
            </IconBtn>
            <IconBtn title="Nhân bản" onClick={props.onDuplicate}>
              <Copy size={13} />
            </IconBtn>
            <IconBtn title="Xoá lớp" onClick={props.onDelete}>
              <Trash2 size={13} />
            </IconBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        width: 26,
        height: 24,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        color: 'var(--t3)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
