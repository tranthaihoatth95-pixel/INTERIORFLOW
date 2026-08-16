'use client';

/**
 * components/render-studio/Tool3DBar.tsx — MẶT UI của máy trạng thái công cụ 3D
 * [marker: Tool3DStateMachine] (phiếu `docs/phieu-giao/tool-state-3d.md` ô④(1)-(2)).
 *
 * Vòng đời một tool: bấm nút dock (hoặc phím tắt) → bar này hiện ở đáy khung nhìn với các Ô SỐ
 * của tool đó (ô đầu tự focus — gõ là số rơi thẳng vào, đúng tinh thần SPEC-LENH-VE-IF) →
 * **Enter áp + về Chọn · Esc huỷ + về Chọn · Space về Chọn**. Gizmo-first GIỮ NGUYÊN: bar không
 * đụng gì tới gizmo/push-pull trên khối đang chọn.
 *
 * Ghi Doc DUY NHẤT qua `useCadStore.addEntities/updateEntities` (vào lịch sử — Ctrl+Z lùi được,
 * KS4); logic hình học nằm hết ở `lib/render-studio/tool3d.ts` (thuần, có test).
 *
 * Phím: listener CAPTURE trên window — chạy TRƯỚC QuickCommandBox (bubble, `Viewport3D`) và
 * `stopPropagation` cho đúng các phím mình xử lý, để một cú Esc không vừa thoát tool vừa xoá dòng
 * lệnh. Đang gõ ở ô nhập NGOÀI bar (đặt tên layer, ô cao độ…) thì bar không cướp phím nào.
 * Nền đặc `--panel` ≥96%, KHÔNG backdrop blur (G9 — trần kính trên WebGL đã dùng hết).
 */

import { useEffect, useRef, useState } from 'react';
import { RADIUS, concentricRadius } from '@/lib/geometry';
import { Check } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { useT } from '@/lib/i18n';
import {
  useTool3D,
  TOOL3D_HOTKEYS,
  type Tool3DId,
  lineBlockEntities,
  rectBlockEntities,
  circleBlockEntities,
  moveSelectionUpdates,
  rotateSelectionUpdates,
  duplicateSelectionEntities,
  measureSelection,
} from '@/lib/render-studio/tool3d';

/** Ô số của từng tool — key ổn định, nhãn ≤2 từ, giá trị mặc định gợi cỡ nội thất quen tay. */
const TOOL_FIELDS: Record<Exclude<Tool3DId, 'select' | 'ruler'>, { key: string; vi: string; en: string; def: number }[]> = {
  line: [
    { key: 'x1', vi: 'Từ X', en: 'From X', def: 0 },
    { key: 'y1', vi: 'Từ Y', en: 'From Y', def: 0 },
    { key: 'x2', vi: 'Đến X', en: 'To X', def: 4000 },
    { key: 'y2', vi: 'Đến Y', en: 'To Y', def: 0 },
    { key: 't', vi: 'Dày', en: 'Thick', def: 220 },
    { key: 'h', vi: 'Cao', en: 'Height', def: 2700 },
  ],
  rect: [
    { key: 'x', vi: 'Góc X', en: 'Corner X', def: 0 },
    { key: 'y', vi: 'Góc Y', en: 'Corner Y', def: 0 },
    { key: 'w', vi: 'Rộng', en: 'Width', def: 3000 },
    { key: 'd', vi: 'Sâu', en: 'Depth', def: 2000 },
    { key: 'h', vi: 'Cao', en: 'Height', def: 2700 },
  ],
  circle: [
    { key: 'x', vi: 'Tâm X', en: 'Center X', def: 0 },
    { key: 'y', vi: 'Tâm Y', en: 'Center Y', def: 0 },
    { key: 'r', vi: 'Bán kính', en: 'Radius', def: 600 },
    { key: 'h', vi: 'Cao', en: 'Height', def: 2700 },
  ],
  move: [
    { key: 'dx', vi: 'dX', en: 'dX', def: 0 },
    { key: 'dy', vi: 'dY', en: 'dY', def: 0 },
    { key: 'dz', vi: 'dZ', en: 'dZ', def: 0 },
  ],
  rotate: [{ key: 'ang', vi: 'Góc °', en: 'Angle °', def: 90 }],
  dup: [
    { key: 'dx', vi: 'dX', en: 'dX', def: 1200 },
    { key: 'dy', vi: 'dY', en: 'dY', def: 0 },
  ],
};

const TOOL_TITLES: Record<Tool3DId, { vi: string; en: string }> = {
  select: { vi: 'Chọn', en: 'Select' },
  line: { vi: 'Đường — dải khối hai điểm', en: 'Line — two-point strip block' },
  rect: { vi: 'Chữ nhật — đáy đùn thành khối', en: 'Rectangle — base extruded to block' },
  circle: { vi: 'Vòng tròn — đáy đùn thành khối', en: 'Circle — base extruded to block' },
  move: { vi: 'Di chuyển khối đang chọn (mm)', en: 'Move selected block (mm)' },
  rotate: { vi: 'Xoay khối đang chọn', en: 'Rotate selected block' },
  dup: { vi: 'Nhân bản khối đang chọn (mm)', en: 'Duplicate selected block (mm)' },
  ruler: { vi: 'Thước — đo khối đang chọn', en: 'Ruler — measure selected block' },
};

const NEEDS_SELECTION: Tool3DId[] = ['move', 'rotate', 'dup', 'ruler'];

interface Tool3DBarProps {
  /** entityId của khối đang chọn (từ cây/khung nhìn) — tool biến đổi/đo cần nó. */
  selectedEntityId: string | null;
  /** khoảng cách đáy (px) — nơi gọi nâng bar lên khi dock đang MỞ RỘNG để hai tấm không đè nhau. */
  bottomPx?: number;
}

export default function Tool3DBar({ selectedEntityId, bottomPx = 130 }: Tool3DBarProps) {
  const tr = useT();
  const active = useTool3D((s) => s.active);
  const setActive = useTool3D((s) => s.setActive);
  // Subscribe Doc để thước đo cập nhật sống khi khối đổi (kéo gizmo xong số đo đổi theo).
  const docEntities = useCadStore((s) => s.doc.entities);
  const [vals, setVals] = useState<Record<string, string>>({});
  const barRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef(selectedEntityId);
  selectedRef.current = selectedEntityId;

  // Đổi tool → nạp mặc định của tool đó + focus ô đầu (gõ số ngay, không cần click).
  useEffect(() => {
    if (active === 'select' || active === 'ruler') {
      setVals({});
      return;
    }
    setVals(Object.fromEntries(TOOL_FIELDS[active].map((f) => [f.key, String(f.def)])));
    const t = window.setTimeout(() => firstInputRef.current?.select(), 0);
    return () => window.clearTimeout(t);
  }, [active]);

  /** ÁP tool hiện tại vào Doc — trả thông điệp trạng thái (setStatus của store, có sẵn undo). */
  const applyRef = useRef<() => void>(() => {});
  applyRef.current = () => {
    if (active === 'select' || active === 'ruler') return;
    const num = (k: string) => {
      const n = Number((vals[k] ?? '').replace(',', '.'));
      return Number.isFinite(n) ? n : NaN;
    };
    const store = useCadStore.getState();
    const undoHint = tr(' — Ctrl+Z để lùi', ' — Ctrl+Z to undo');

    if (active === 'line' || active === 'rect' || active === 'circle') {
      const h = num('h');
      if (!(h > 0)) { store.setStatus(tr('Cao phải > 0.', 'Height must be > 0.')); return; }
      const o = { heightMm: Math.round(h), layer: store.currentLayer };
      if (active === 'line') {
        const t = num('t');
        if (!(t > 0)) { store.setStatus(tr('Dày phải > 0.', 'Thickness must be > 0.')); return; }
        if (num('x1') === num('x2') && num('y1') === num('y2')) { store.setStatus(tr('Hai điểm trùng nhau — chưa vẽ được.', 'Both points coincide — nothing to draw.')); return; }
        store.addEntities(lineBlockEntities({ x: num('x1'), y: num('y1') }, { x: num('x2'), y: num('y2') }, t, o));
      } else if (active === 'rect') {
        const w = num('w');
        const d = num('d');
        if (!(w > 0) || !(d > 0)) { store.setStatus(tr('Rộng và Sâu phải > 0.', 'Width and Depth must be > 0.')); return; }
        store.addEntities(rectBlockEntities({ x: num('x'), y: num('y') }, w, d, o));
      } else {
        const r = num('r');
        if (!(r > 0)) { store.setStatus(tr('Bán kính phải > 0.', 'Radius must be > 0.')); return; }
        store.addEntities(circleBlockEntities({ x: num('x'), y: num('y') }, r, o));
      }
      store.setStatus(tr('Đã dựng khối', 'Block created') + undoHint);
      return;
    }

    const sel = selectedRef.current;
    if (!sel) { store.setStatus(tr('Chưa chọn khối — bấm một khối trước.', 'No block selected — pick one first.')); return; }
    if (active === 'move') {
      const updates = moveSelectionUpdates(store.doc.entities, sel, num('dx') || 0, num('dy') || 0, num('dz') || 0);
      if (!updates.length) { store.setStatus(tr('Không tìm thấy khối để di chuyển.', 'Block not found.')); return; }
      store.updateEntities(updates);
      store.setStatus(tr('Đã di chuyển', 'Moved') + undoHint);
    } else if (active === 'rotate') {
      const updates = rotateSelectionUpdates(store.doc.entities, sel, num('ang') || 0);
      if (!updates.length) { store.setStatus(tr('Góc 0 hoặc không tìm thấy khối.', 'Zero angle or block not found.')); return; }
      store.updateEntities(updates);
      store.setStatus(tr('Đã xoay', 'Rotated') + undoHint);
    } else if (active === 'dup') {
      const copies = duplicateSelectionEntities(store.doc.entities, sel, num('dx') || 0, num('dy') || 0);
      if (!copies.length) { store.setStatus(tr('Không tìm thấy khối để nhân bản.', 'Block not found.')); return; }
      store.addEntities(copies);
      store.setStatus(tr('Đã nhân bản', 'Duplicated') + undoHint);
    }
  };

  /**
   * Phím của máy trạng thái — CAPTURE (chạy trước QuickCommandBox bubble của `Viewport3D`):
   *  - đang cầm tool: Enter = áp + về Chọn · Esc = huỷ + về Chọn · Space = về Chọn
   *    (kể cả khi focus đang ở Ô SỐ CỦA BAR — chúng là ô số, Space/Enter không có nghĩa gõ chữ);
   *  - không gõ ở đâu: chữ tắt V/L/R/C/M/Q/D/T đổi tool (đúng chữ in trên dock).
   *  Đang gõ ở ô nhập NGOÀI bar → không đụng phím nào.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      const typing = el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
      const inBar = el instanceof HTMLElement && !!barRef.current?.contains(el);
      if (typing && !inBar) return;
      const cur = useTool3D.getState().active;
      if (cur !== 'select') {
        if (e.key === 'Enter') {
          applyRef.current();
          setActive('select');
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (e.key === 'Escape' || e.key === ' ') {
          setActive('select');
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
      if (!typing && !e.shiftKey) {
        const next = TOOL3D_HOTKEYS[e.key.toLowerCase()];
        if (next && next !== cur) {
          setActive(next);
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [setActive]);

  if (active === 'select') return null;

  const needsSel = NEEDS_SELECTION.includes(active) && !selectedEntityId;
  const measure = active === 'ruler' && selectedEntityId ? measureSelection(docEntities, selectedEntityId) : null;

  return (
    <div
      ref={barRef}
      className="if-3d-tool-bar"
      style={{
        position: 'absolute', left: '50%', bottom: bottomPx, transform: 'translateX(-50%)', zIndex: 6,
        display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: RADIUS.r3, // thang bo 12/08
        background: 'color-mix(in srgb, var(--panel) 96%, transparent)',
        border: '1px solid var(--vien-mo)', boxShadow: '0 12px 30px rgba(0, 0, 0, .2)',
        fontSize: 11, lineHeight: 1.5, color: 'var(--t2)', whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{tr(TOOL_TITLES[active].vi, TOOL_TITLES[active].en)}</span>

      {needsSel ? (
        <span style={{ color: 'var(--warning)' }}>
          {tr('Chưa chọn khối — bấm một khối trước.', 'No block selected — pick one first.')}
        </span>
      ) : active === 'ruler' ? (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--t1)' }}>
          {measure
            ? `${measure.wMm} × ${measure.dMm}${measure.hMm !== null ? ` × ${measure.hMm}` : ''} mm${measure.hMm === null ? tr(' · chưa đùn cao', ' · not extruded yet') : ''}`
            : tr('Khối này chưa đo được.', 'This block cannot be measured.')}
        </span>
      ) : (
        <>
          {TOOL_FIELDS[active].map((f, i) => (
            <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--t3)' }}>{tr(f.vi, f.en)}</span>
              <input
                ref={i === 0 ? firstInputRef : undefined}
                value={vals[f.key] ?? ''}
                onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
                inputMode="decimal"
                aria-label={tr(f.vi, f.en)}
                style={{
                  width: 58, padding: '3px 6px', borderRadius: concentricRadius(RADIUS.r3, 7), border: '1px solid var(--border-strong)',
                  background: 'var(--field)', color: 'var(--t1)', fontSize: 11, lineHeight: 1.5,
                  fontVariantNumeric: 'tabular-nums', outline: 'none', fontFamily: 'inherit',
                }}
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => { applyRef.current(); setActive('select'); }}
            style={{
              height: 24, padding: '0 10px', border: 0, borderRadius: concentricRadius(RADIUS.r3, 7), background: 'var(--accent)',
              color: 'var(--on-accent)', fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Check size={12} />
            {tr('Áp dụng', 'Apply')}
          </button>
        </>
      )}

      <span style={{ color: 'var(--t4)' }}>{tr('Enter áp · Esc huỷ · Space về Chọn', 'Enter apply · Esc cancel · Space to Select')}</span>
    </div>
  );
}
