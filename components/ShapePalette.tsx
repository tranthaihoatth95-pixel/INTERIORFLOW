'use client';

/**
 * components/ShapePalette.tsx — Sprint 3 / Agent C (B2.1 drag-from-palette + B2.4 info panel +
 * B2.5 variant switch + B2.8 search).
 *
 * `ShapePalette`  — danh sách BlockDef nhóm theo BlockGroup, kéo (HTML5 DnD) hoặc click để đặt
 *                   (dùng chung `setPendingBlock` — hành vi click cũ vẫn hoạt động), + ô tìm kiếm.
 * `ShapeInfoPanel`— hiện khi chọn 1 BlockEntity trên canvas: tên, kích thước (variant hiện tại
 *                   hoặc w/h gốc), giá (nếu `meta.price`), và switch variant (B2.5) nếu có.
 *
 * Cả 2 component THUẦN UI (props-in, callback-out) — không tự import useCadStore để dễ test/tái
 * dùng; nơi gọi (CadEditor/CadCanvas) chịu trách nhiệm nối vào store.
 */

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { BlockDef } from '@/lib/cad/furniture';
import type { BlockEntity } from '@/lib/cad/model';
import { effectiveBlockSize } from '@/lib/cad/shape-interactions';

/** mimetype dùng cho dataTransfer khi kéo 1 item từ palette (B2.1) — CadCanvas đọc lại ở onDrop. */
export const SHAPE_DND_MIME = 'application/x-if-block-id';

export interface ShapePaletteProps {
  blocks: BlockDef[];
  /** id block đang "chờ đặt" (pendingBlock cũ) — tô sáng item tương ứng */
  pendingId?: string | null;
  /** click item = giữ hành vi cũ (chọn rồi click canvas để đặt) */
  onPick: (blockId: string) => void;
  /** B2.1 — bắt đầu kéo 1 item (CadCanvas nối onDrop để tạo BlockEntity tại điểm thả) */
  onDragStart?: (blockId: string) => void;
}

function formatMm(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}m` : `${n}mm`;
}

/** B2.8 — lọc theo tên (không dấu, không phân biệt hoa/thường) hoặc nhóm. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function ShapePalette({ blocks, pendingId, onPick, onDragStart }: ShapePaletteProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return blocks;
    return blocks.filter((b) => normalize(b.name).includes(q) || normalize(b.group).includes(q));
  }, [blocks, query]);

  const groups = useMemo(() => Array.from(new Set(filtered.map((b) => b.group))), [filtered]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      {/* B2.8 — search */}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Tìm shape… (vd "giường")'
          aria-label="Tìm shape"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '5px 8px 5px 26px', borderRadius: 7,
            border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 12,
          }}
        />
      </div>

      {groups.length === 0 && (
        <p style={{ fontSize: 11.5, color: 'var(--t4)', padding: '6px 4px' }}>Không tìm thấy shape khớp &quot;{query}&quot;.</p>
      )}

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {groups.map((g) => (
          <div key={g} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--t4)', padding: '4px 6px' }}>{g}</div>
            {filtered
              .filter((b) => b.group === g)
              .map((b) => {
                const active = pendingId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(SHAPE_DND_MIME, b.id);
                      e.dataTransfer.effectAllowed = 'copy';
                      onDragStart?.(b.id);
                    }}
                    onClick={() => onPick(b.id)}
                    title={`${b.name} — ${b.w}×${b.h}mm. Kéo thả vào bản vẽ, hoặc click rồi click canvas để đặt.`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      width: '100%', textAlign: 'left', padding: '5px 8px', borderRadius: 7, border: 'none',
                      fontSize: 12, cursor: 'grab',
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? '#fff' : 'var(--t2)',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                    <span style={{ fontSize: 10, color: active ? 'rgba(255,255,255,.8)' : 'var(--t4)', flexShrink: 0 }}>
                      {formatMm(b.w)}×{formatMm(b.h)}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── B2.4 — info panel + B2.5 variant switch ───────────────────────── */

export interface ShapeInfoPanelProps {
  entity: BlockEntity;
  def: BlockDef | undefined;
  onVariantChange?: (variantId: string) => void;
  onClose?: () => void;
}

function formatVnd(n: number): string {
  return `${n.toLocaleString('vi-VN')}đ`;
}

export function ShapeInfoPanel({ entity, def, onVariantChange, onClose }: ShapeInfoPanelProps) {
  if (!def) {
    return (
      <div style={infoBox}>
        <p style={{ fontSize: 12, color: 'var(--t4)' }}>Không tìm thấy định nghĩa shape &quot;{entity.block}&quot;.</p>
      </div>
    );
  }
  const size = effectiveBlockSize(entity);
  const currentVariant = entity.variant ? def.variants?.find((v) => v.id === entity.variant) : undefined;

  return (
    <div style={infoBox}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{currentVariant?.name ?? def.name}</span>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ border: 'none', background: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
            ×
          </button>
        )}
      </div>
      <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
        Kích thước: {size.w}×{size.h}mm
      </div>
      {def.meta?.price !== undefined && (
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Giá: {formatVnd(def.meta.price)}</div>
      )}
      {def.meta?.vendor && <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 2 }}>NCC: {def.meta.vendor}</div>}
      {def.meta?.sku && <div style={{ fontSize: 11, color: 'var(--t4)' }}>Mã: {def.meta.sku}</div>}

      {/* B2.5 — variant switch */}
      {def.variants && def.variants.length > 0 && onVariantChange && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--t4)', marginBottom: 4 }}>Biến thể</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {def.variants.map((v) => {
              const active = entity.variant === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onVariantChange(v.id)}
                  style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    border: '1px solid var(--border)',
                    background: active ? 'var(--accent)' : 'var(--field)',
                    color: active ? '#fff' : 'var(--t2)',
                  }}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const infoBox: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '10px 12px',
  minWidth: 200,
  boxShadow: '0 8px 30px rgba(0,0,0,.18)',
};
