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
 * Nền đặc `--panel`, KHÔNG backdrop blur (G9 — trần kính trên WebGL đã dùng hết).
 *
 * 19/08 (R4 — mảnh cuối `toolbar-mot-khuon`, KB-1): vỏ tự vẽ (r3 · color-mix 96% · shadow riêng)
 * ĐỔI sang `ToolbarBar` + nút Áp dụng đổi sang `ToolbarChip` — cùng khuôn với dock compact
 * `ToolDock3D` ngay bên dưới (capsule 44/r-full, nền đặc `var(--panel)` nên G9 vẫn giữ).
 * Ô số đổi bo theo `RADIUS.full` (trình duyệt kẹp về nửa cạnh ngắn ⇒ tự đồng tâm với vỏ ở mọi
 * cỡ, xem ghi chú trong `ToolbarBar`). Hành vi/phím/handlers GIỮ NGUYÊN — chỉ đổi vỏ nút.
 * `barRef` nằm ở div định vị bọc ngoài (ToolbarBar không forward ref; div này chỉ mang position
 * + font, KHÔNG mang hình dạng — hình dạng thuộc ToolbarBar, đúng hợp đồng "không cho ghi đè").
 *
 * 19/08 (R4-L1 — bar tràn ngang khi tool ≥5 ô số): bar MỘT capsule của tool `line` (6 ô) rộng
 * ~915px trong khi viewport 3D chỉ ~678px @1440×900 ⇒ tràn hai bên + dòng nhắc "Enter áp…" văng
 * khỏi màn. KHÔNG wrap được bên trong một ToolbarBar (khuôn khoá cứng `height: var(--tap-lg)`,
 * hợp đồng cấm ghi đè hình dạng — và sửa khuôn là đổi cả 3 chặng, ngoài phạm vi phiếu). Cách sửa:
 * chia bar thành CÁC CAPSULE NHỎ (tiêu đề · nhóm ≤3 ô số · Áp dụng + dòng nhắc) trong một
 * container flex-wrap có `maxWidth: calc(100% - 24px)` theo viewport — mỗi mảnh vẫn đúng khuôn
 * KB-1 (capsule 44/r-full, bo §2d tự đồng tâm), viewport hẹp thì capsule tự xuống hàng (CSS thuần,
 * không đo JS, không animation), bar neo đáy nên nở LÊN TRÊN, và dòng nhắc nằm trong capsule cuối
 * nên không bao giờ văng mất (luật: người dùng luôn biết đường ra).
 */

import { useEffect, useRef, useState } from 'react';
import { RADIUS } from '@/lib/geometry';
import { Check } from 'lucide-react';
import { ToolbarChip, ToolbarBar } from '@/components/ui/ToolbarChip';
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

  // R4-L1: chia ô số thành nhóm ≤3 — mỗi nhóm một capsule ToolbarBar, để viewport hẹp thì
  // capsule tự xuống hàng thay vì cả bar tràn ngang. 3 là cỡ nhóm lớn nhất mà capsule
  // (nhãn + ô 58px) vẫn dưới ~400px — lọt viewport hẹp nhất đã đo (~678px) cả bản EN.
  const fieldChunks: (typeof TOOL_FIELDS)[Exclude<Tool3DId, 'select' | 'ruler'>][] = [];
  if (!needsSel && active !== 'ruler') {
    const fields = TOOL_FIELDS[active];
    for (let i = 0; i < fields.length; i += 3) fieldChunks.push(fields.slice(i, i + 3));
  }

  const hint = (
    <span style={{ color: 'var(--t4)', padding: '0 6px' }}>{tr('Enter áp · Esc huỷ · Space về Chọn', 'Enter apply · Esc cancel · Space to Select')}</span>
  );

  return (
    <div
      ref={barRef}
      className="if-3d-tool-bar"
      style={{
        // Div này CHỈ định vị + xếp capsule + font — hình dạng (nền/viền/bo/bóng) là việc của
        // ToolbarBar. flex-wrap + maxWidth theo viewport: hẹp thì capsule xuống hàng, neo đáy
        // nên nở lên trên (không đè dock bên dưới). whiteSpace nowrap giữ cho CHỮ trong từng
        // capsule không gãy giữa nhãn — wrap chỉ xảy ra ở cấp capsule.
        position: 'absolute', left: '50%', bottom: bottomPx, transform: 'translateX(-50%)', zIndex: 6,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
        gap: 6, width: 'max-content', maxWidth: 'calc(100% - 24px)',
        fontSize: 11, lineHeight: 1.5, color: 'var(--t2)', whiteSpace: 'nowrap',
      }}
    >
      <ToolbarBar>
        <span style={{ fontWeight: 700, color: 'var(--t1)', padding: '0 8px' }}>{tr(TOOL_TITLES[active].vi, TOOL_TITLES[active].en)}</span>
      </ToolbarBar>

      {needsSel ? (
        <ToolbarBar>
          <span style={{ color: 'var(--warning)', padding: '0 4px' }}>
            {tr('Chưa chọn khối — bấm một khối trước.', 'No block selected — pick one first.')}
          </span>
          <ToolbarBar.Sep />
          {hint}
        </ToolbarBar>
      ) : active === 'ruler' ? (
        <ToolbarBar>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--t1)', padding: '0 4px' }}>
            {measure
              ? `${measure.wMm} × ${measure.dMm}${measure.hMm !== null ? ` × ${measure.hMm}` : ''} mm${measure.hMm === null ? tr(' · chưa đùn cao', ' · not extruded yet') : ''}`
              : tr('Khối này chưa đo được.', 'This block cannot be measured.')}
          </span>
          <ToolbarBar.Sep />
          {hint}
        </ToolbarBar>
      ) : (
        <>
          {fieldChunks.map((chunk, ci) => (
            <ToolbarBar key={ci}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
                {chunk.map((f, i) => (
                  <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: 'var(--t3)' }}>{tr(f.vi, f.en)}</span>
                    <input
                      ref={ci === 0 && i === 0 ? firstInputRef : undefined}
                      value={vals[f.key] ?? ''}
                      onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
                      inputMode="decimal"
                      aria-label={tr(f.vi, f.en)}
                      style={{
                        // RADIUS.full kẹp về nửa cạnh ngắn ⇒ tự đồng tâm với vỏ capsule (ghi chú ToolbarBar).
                        width: 58, padding: '3px 8px', borderRadius: RADIUS.full, border: '1px solid var(--border-strong)',
                        background: 'var(--field)', color: 'var(--t1)', fontSize: 11, lineHeight: 1.5,
                        fontVariantNumeric: 'tabular-nums', outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </label>
                ))}
              </span>
            </ToolbarBar>
          ))}
          <ToolbarBar>
            <ToolbarChip
              icon={<Check size={18} />}
              label={tr('Áp dụng', 'Apply')}
              desc={tr('Áp giá trị đang nhập rồi về Chọn', 'Apply the entered values, then return to Select')}
              shortcutHint="Enter"
              onClick={() => { applyRef.current(); setActive('select'); }}
            />
            <ToolbarBar.Sep />
            {hint}
          </ToolbarBar>
        </>
      )}
    </div>
  );
}
