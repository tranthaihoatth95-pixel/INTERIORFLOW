'use client';

/**
 * components/cad/MaterialPalette.tsx — Sprint 5 / Việc 1: panel chọn "vật liệu" cho lệnh Hatch.
 *
 * Khác ShapePalette.tsx (props-in/callback-out thuần), panel này nối thẳng useCadStore — theo
 * đúng pattern các panel khác trong CadEditor.tsx (FurniturePanel/StandardsPanel cũng tự đọc
 * store), vì trạng thái pattern/scale/angle/color của Hatch vốn đã sống trong store (Nấc 4).
 *
 * 2 phần:
 *  1. Lưới "vật liệu" — mỗi ô 1 swatch preview (CSS/pattern, KHÔNG PHẢI ảnh thật — xem
 *     lib/cad/materials.ts đầu file) + tên. Click = applyMaterial() (đổi cả pattern/scale/
 *     angle/màu + chuyển tool sang Hatch luôn, đỡ phải bấm thêm).
 *  2. "Pattern kỹ thuật" — giữ nguyên UI chọn 5 pattern ANSI/SOLID/DOTS + scale/angle thô, cho
 *     ai cần chỉnh tay chi tiết hơn preset vật liệu (không xoá tính năng cũ, chỉ thêm lớp trên).
 */

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import type { HatchPattern } from '@/lib/cad/model';
import { MATERIALS, materialSwatchStyle, type MaterialDef, type MaterialCategory } from '@/lib/cad/materials';

const PATTERNS: HatchPattern[] = ['SOLID', 'ANSI31', 'ANSI32', 'ANSI37', 'DOTS'];

export default function MaterialPalette({ onClose }: { onClose: () => void }) {
  const hatchMaterialId = useCadStore((s) => s.hatchMaterialId);
  const hatchPattern = useCadStore((s) => s.hatchPattern);
  const hatchScale = useCadStore((s) => s.hatchScale);
  const hatchAngle = useCadStore((s) => s.hatchAngle);
  const applyMaterial = useCadStore((s) => s.applyMaterial);
  const setHatchPattern = useCadStore((s) => s.setHatchPattern);
  const setHatchScale = useCadStore((s) => s.setHatchScale);
  const setHatchAngle = useCadStore((s) => s.setHatchAngle);
  const setHatchColor = useCadStore((s) => s.setHatchColor);
  const setTool = useCadStore((s) => s.setTool);
  const [tab, setTab] = useState<'all' | MaterialCategory>('all');

  const categories = useMemo(() => Array.from(new Set(MATERIALS.map((m) => m.category))), []);
  const shown = tab === 'all' ? MATERIALS : MATERIALS.filter((m) => m.category === tab);

  const pick = (m: MaterialDef) => {
    applyMaterial(m.name, m.hatchPattern, m.patternScale, m.patternAngle, m.color);
  };

  return (
    <div style={{ ...panel, right: 12, top: 400, width: 250, maxHeight: '58vh', display: 'flex', flexDirection: 'column' }}>
      <div style={panelHead}>
        <span>Vật liệu (Hatch)</span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng">
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '0 4px 8px', flexWrap: 'wrap' }}>
        {(['all', ...categories] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setTab(c)}
            style={{
              padding: '3px 8px', borderRadius: 999, border: '1px solid var(--border)', fontSize: 10.5,
              background: tab === c ? 'var(--accent)' : 'transparent', color: tab === c ? '#fff' : 'var(--t3)', cursor: 'pointer',
            }}
          >
            {c === 'all' ? 'Tất cả' : c}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
          maxHeight: 320, overflowY: 'auto', padding: '0 2px 4px',
        }}
      >
        {shown.map((m) => {
          const active = hatchMaterialId === m.name;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => pick(m)}
              title={`${m.name} — preview dựng bằng CSS/pattern, chưa có ảnh chụp thật`}
              style={{
                display: 'flex', flexDirection: 'column', gap: 3, padding: 4, borderRadius: 8,
                border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: 'transparent', cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '100%', aspectRatio: '1 / 1', borderRadius: 5, border: '1px solid rgba(0,0,0,.15)',
                  ...materialSwatchStyle(m),
                }}
              />
              <span style={{ fontSize: 9.5, lineHeight: 1.2, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.name}
              </span>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 9.5, color: 'var(--t4)', padding: '4px 4px 8px', lineHeight: 1.4 }}>
        Preview dựng bằng CSS/hoạ tiết (chưa có ảnh chụp vật liệu thật) — chọn xong click 1 điểm
        trong vùng kín cần tô (giống Hatch cũ).
      </p>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--t4)', padding: '0 4px 5px' }}>
          Pattern kỹ thuật (chỉnh tay)
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '0 4px 6px' }}>
          {PATTERNS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setHatchPattern(p);
                setTool('hatch');
              }}
              style={{
                padding: '3px 7px', borderRadius: 6, fontSize: 10.5, cursor: 'pointer',
                border: '1px solid var(--border)',
                background: hatchPattern === p && !hatchMaterialId ? 'var(--accent)' : 'var(--field)',
                color: hatchPattern === p && !hatchMaterialId ? '#fff' : 'var(--t2)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 4px', alignItems: 'center' }}>
          <label style={{ fontSize: 10, color: 'var(--t3)', display: 'flex', gap: 4, alignItems: 'center' }}>
            Tỉ lệ
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={hatchScale}
              onChange={(e) => setHatchScale(parseFloat(e.target.value) || 1)}
              style={{ width: 46, fontSize: 10.5, background: 'var(--field)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--t2)' }}
            />
          </label>
          <label style={{ fontSize: 10, color: 'var(--t3)', display: 'flex', gap: 4, alignItems: 'center' }}>
            Góc
            <input
              type="number"
              step={5}
              value={hatchAngle}
              onChange={(e) => setHatchAngle(parseFloat(e.target.value) || 0)}
              style={{ width: 46, fontSize: 10.5, background: 'var(--field)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--t2)' }}
            />
          </label>
          <button
            type="button"
            onClick={() => setHatchColor('')}
            title="Bỏ màu vật liệu — quay lại dùng màu layer"
            style={{ fontSize: 9.5, color: 'var(--t4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            reset màu
          </button>
        </div>
      </div>
    </div>
  );
}

const panel: React.CSSProperties = {
  position: 'absolute',
  zIndex: 15,
  background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 8,
  boxShadow: '0 8px 30px rgba(0,0,0,.18)',
};
const panelHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--t2)',
  padding: '2px 6px 8px',
};
const miniBtn: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 22,
  height: 22,
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--t3)',
  cursor: 'pointer',
};
