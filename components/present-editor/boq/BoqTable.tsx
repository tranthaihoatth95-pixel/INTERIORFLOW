'use client';

/**
 * components/present-editor/boq/BoqTable.tsx — B2 (8 cột cố định + tabular-nums) · B4 (truy vết
 * ngược "Xem trên bản vẽ") · B5 (sửa tay 1 ô = override, badge + revert + cảnh báo máy-vs-tay) ·
 * B6 (group theo tầng + subtotal) · B10 phần "lệnh tương tác" (↑↓←→ di ô, Enter sửa/xuống, Tab
 * sang phải, Esc huỷ) đều gói trong bảng này — bảng là nơi DUY NHẤT các luật đó chạm nhau.
 *
 * Số học GIỮ NGUYÊN cách trình bày Hoà đã kiểm tay ở `docs/mocks/mock-trinh-bay.html` (VIỆC 2):
 * m² 2 số lẻ dấu CHẤM ("48.60"), tiền ngăn nghìn bằng KHOẢNG TRẮNG ("7 047 000") — KHÔNG theo
 * kiểu dấu chấm-nghìn/dấu phẩy-lẻ của mock hợp đồng 04/08 (2 mock lệch nhau, ưu tiên chỉ đạo trực
 * tiếp của Hoà trong lệnh giao việc này).
 */
import { useRouter } from 'next/navigation';
import { Fragment, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useCadStore } from '@/lib/cad/store';
import type { BoqError } from '@/lib/boq/model';
import type { BoqGroup } from '@/lib/present-editor/boq-group';
import type { BoqDisplayRow, BoqOverrideField } from '@/lib/present-editor/boq-overrides';
import { boqUnitLabel, type BoqSpecExtra } from '@/lib/present-editor/boq-spec-extra';
import { BoqErrorRows } from './BoqErrors';

/** Số cột THẬT của bảng — dùng cho `colSpan` của dòng lỗi/subtotal, TRÁNH lệch số cứng (đã có 1
 * lỗi thật kiểu này trước khi sửa: `BoqErrorRows` từng hardcode colSpan=9 trong khi bảng chỉ có
 * 8 cột). Đổi số cột ở HEADER dưới đây thì đổi luôn hằng số này, đừng để 2 nơi tự đếm riêng.
 * 06/08 (G-M3-11): 10 → 11, thêm cột "Ảnh". */
export const BOQ_TABLE_COLUMN_COUNT = 11;

function fmtM2(n: number): string {
  return n.toFixed(2);
}
function fmtVnd(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
/** Món ĐẾM hiện số nguyên ("8"), vùng tô hiện 2 số lẻ ("48.60") — cùng 1 cột "Khối lượng", cột
 * "Đơn vị" bên cạnh nói rõ nó là m² hay cái. Người dùng sửa tay ra số lẻ trên dòng đếm (vd 8.5
 * cái) thì VẪN HIỆN nguyên số lẻ đó, không làm tròn ngầm — số của họ, họ phải thấy đúng nó. */
function fmtQty(row: { kind?: 'area' | 'count' }, n: number): string {
  return row.kind === 'count' && Number.isInteger(n) ? String(n) : fmtM2(n);
}

export interface BoqSelectedCell {
  matId: string;
  field: BoqOverrideField;
}

interface BoqTableProps {
  groups: BoqGroup<BoqDisplayRow>[];
  errors: BoqError[];
  totalAmount: number;
  projectId: string;
  /** matId → {unit, quyCach} — JOIN hiển thị cho 2 cột "Quy cách"/"Đơn vị" (`lib/present-editor/
   * boq-spec-extra.ts`), KHÔNG có trong `BoqRow` engine (`lib/boq/model.ts` cố ý không mang field
   * này — xem docstring `boq-spec-extra.ts`). matId lạ (chưa fetch xong/không có spec) → '—'. */
  specExtra: Map<string, BoqSpecExtra>;
  onOverride: (matId: string, field: BoqOverrideField, value: number) => void;
  onRevert: (matId: string, field: BoqOverrideField) => void;
  selected: BoqSelectedCell | null;
  onSelect: (sel: BoqSelectedCell | null) => void;
}

export function BoqTable({ groups, errors, totalAmount, projectId, specExtra, onOverride, onRevert, selected, onSelect }: BoqTableProps) {
  const tr = useT();
  const router = useRouter();
  const [editing, setEditing] = useState<BoqSelectedCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const flat = groups.flatMap((g) => g.rows);

  const goToModel = (entityIds: string[]) => {
    if (!entityIds.length) return;
    useCadStore.getState().select(entityIds);
    router.push(`/projects/${projectId}/cad`);
  };

  const commitEdit = () => {
    if (!editing) return;
    const n = Number(editValue.replace(',', '.'));
    onOverride(editing.matId, editing.field, n);
    setEditing(null);
    onSelect(editing);
  };

  const startEdit = (sel: BoqSelectedCell, initial: number) => {
    setEditing(sel);
    setEditValue(String(initial));
    onSelect(sel);
  };

  /** B10 lệnh tương tác: ↑↓ đổi dòng cùng cột · ←→/Tab đổi cột cùng dòng · Enter sửa hoặc commit+
   * xuống dòng · Esc huỷ sửa. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing) {
      if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
      else if (e.key === 'Escape') { e.preventDefault(); setEditing(null); }
      return;
    }
    if (!selected) return;
    const idx = flat.findIndex((r) => r.matId === selected.matId);
    if (idx < 0) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = flat[idx + (e.key === 'ArrowDown' ? 1 : -1)];
      if (next) onSelect({ matId: next.matId, field: selected.field });
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
      e.preventDefault();
      const goRight = e.key === 'ArrowRight' || e.key === 'Tab';
      if (selected.field === 'm2' && goRight) onSelect({ matId: selected.matId, field: 'donGia' });
      else if (selected.field === 'donGia' && !goRight) onSelect({ matId: selected.matId, field: 'm2' });
      else if (selected.field === 'donGia' && goRight) {
        const next = flat[idx + 1];
        if (next) onSelect({ matId: next.matId, field: 'm2' });
      } else if (selected.field === 'm2' && !goRight) {
        const prev = flat[idx - 1];
        if (prev) onSelect({ matId: prev.matId, field: 'donGia' });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = flat[idx];
      startEdit(selected, row[selected.field]);
    }
  };

  const cell = (row: BoqDisplayRow, field: BoqOverrideField) => {
    const isSel = selected?.matId === row.matId && selected.field === field;
    const isEditing = editing?.matId === row.matId && editing.field === field;
    const ov = field === 'm2' ? row.m2Override : row.donGiaOverride;
    const raw = row[field];

    if (isEditing) {
      return (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          style={{
            width: '100%', height: 24, textAlign: 'right', font: 'inherit', fontVariantNumeric: 'tabular-nums',
            border: '1px solid var(--accent)', borderRadius: 6, background: 'var(--card, var(--panel))', color: 'var(--t1)', padding: '0 6px',
          }}
        />
      );
    }

    return (
      <div
        onClick={() => onSelect({ matId: row.matId, field })}
        onDoubleClick={() => startEdit({ matId: row.matId, field }, raw)}
        title={ov ? tr(`Số này không còn theo mô hình. Mô hình cho ${field === 'm2' ? fmtM2(ov.machineValue) : fmtVnd(ov.machineValue)}.`, `No longer matches the model — model says ${field === 'm2' ? fmtM2(ov.machineValue) : fmtVnd(ov.machineValue)}.`) : undefined}
        style={{
          position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
          fontVariantNumeric: 'tabular-nums', cursor: 'pointer', padding: '0 2px',
          outline: isSel ? '2px solid var(--accent)' : undefined, outlineOffset: -2,
          background: isSel ? 'var(--accent-soft)' : undefined, borderRadius: isSel ? 6 : undefined,
          color: ov ? 'var(--t1)' : 'var(--t2)',
        }}
      >
        {ov && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }} />}
        {field === 'm2' ? fmtQty(row, raw) : fmtVnd(raw)}
        {ov && (
          <button
            type="button"
            title={tr('Lấy lại số từ mô hình', 'Reset to model value')}
            onClick={(e) => { e.stopPropagation(); onRevert(row.matId, field); }}
            style={{
              width: 18, height: 18, display: 'grid', placeItems: 'center', border: 0, borderRadius: 6,
              background: 'var(--field)', color: 'var(--t3)', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <RotateCcw size={11} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div ref={wrapRef} tabIndex={0} onKeyDown={onKeyDown} style={{ flex: 1, minHeight: 0, overflow: 'auto', outline: 'none' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, background: 'var(--panel)', zIndex: 2 }}>
            {[
              '#', tr('Mã', 'Code'), tr('Ảnh', 'Image'), tr('Hạng mục', 'Item'), tr('Quy cách', 'Spec'), tr('Đơn vị', 'Unit'), 'NCC',
              tr('Khối lượng', 'Qty'), tr('Đơn giá ₫', 'Unit price ₫'), tr('Hao hụt %', 'Wastage %'), tr('Thành tiền ₫', 'Amount ₫'),
            ].map((h, i) => (
              <th
                key={h + i}
                style={{
                  textAlign: i >= 7 ? 'right' : 'left', padding: '0 10px', height: 30, fontWeight: 600, fontSize: 11,
                  color: 'var(--t4)', borderBottom: '1px solid var(--border-strong, var(--border))', whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.key}>
              <tr>
                <td colSpan={BOQ_TABLE_COLUMN_COUNT} style={{ background: 'var(--field)', color: 'var(--t3)', fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', height: 26, padding: '0 10px' }}>
                  {g.label}
                  {g.inferred && (
                    <span style={{ marginLeft: 8, textTransform: 'none', fontWeight: 600, letterSpacing: 0, color: 'var(--warning)' }}>
                      · {tr('suy đoán theo vị trí', 'inferred from position')}
                    </span>
                  )}
                </td>
              </tr>
              {g.rows.map((row, i) => {
                const extra = specExtra.get(row.matId);
                return (
                  <tr key={`${row.kind ?? 'area'}:${row.matId}`} style={{ height: 'var(--row, 28px)' }}>
                    <td style={{ padding: '0 10px', color: 'var(--t4)', borderBottom: '1px solid var(--border)' }}>{i + 1}</td>
                    <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t4)', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11 }}>{row.ma || '—'}</td>
                    {/* G-M3-11 — cột ẢNH. Chưa có ảnh ⇒ ô trống CÓ VIỀN + gạch nối, không để hàng
                        trông như "đã có ảnh" (hồ sơ gửi khách/xưởng đọc cột này là đọc cam kết). */}
                    <td style={{ padding: '2px 10px', borderBottom: '1px solid var(--border)' }}>
                      {extra?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- ảnh từ /api/library/:id/file, kích thước cố định, không cần tối ưu next/image trong bảng
                        <img
                          src={extra.imageUrl}
                          alt={tr(`Ảnh ${row.ten}`, `Image of ${row.ten}`)}
                          loading="lazy"
                          style={{ width: 34, height: 26, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)', display: 'block', background: 'var(--field)' }}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          title={tr('Chưa có ảnh trong kho vật liệu', 'No image in the material library')}
                          style={{ width: 34, height: 26, display: 'grid', placeItems: 'center', borderRadius: 4, border: '1px dashed var(--border)', background: 'var(--field)', color: 'var(--t4)', fontSize: 11 }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td
                      onClick={() => goToModel(row.entityIds)}
                      title={tr('Bấm để xem trên bản vẽ', 'Click to view on the drawing')}
                      style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t1)', cursor: 'pointer' }}
                    >
                      {row.ten}
                    </td>
                    <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t3)', fontSize: 12 }}>{extra?.quyCach ?? '—'}</td>
                    {/* Đơn vị: ưu tiên `row.unit` do ENGINE quyết (m² cho vùng tô · cái/bộ cho món
                        rời) — `specExtra.unit` chỉ là đơn vị KHAI trong kho, có thể lệch. */}
                    <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t3)' }}>{row.unit ? boqUnitLabel(row.unit) : extra?.unit ?? '—'}</td>
                    <td style={{ padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--t3)' }}>{row.ncc}</td>
                    <td style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>{cell(row, 'm2')}</td>
                    <td style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>{cell(row, 'donGia')}</td>
                    <td style={{ padding: '0 10px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>{row.haoHutPhanTram}</td>
                    <td style={{ padding: '0 10px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--t1)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtVnd(row.thanhTien)}</td>
                  </tr>
                );
              })}
              <tr key={`sub-${g.key}`} style={{ background: 'color-mix(in srgb, var(--accent) 5%, var(--panel))' }}>
                {/* 7 = #, Mã, Ảnh, Hạng mục, Quy cách, Đơn vị, NCC — rồi 1 ô m², 2 ô trống, 1 ô tiền
                    = 11 = BOQ_TABLE_COLUMN_COUNT. Lệch là vỡ cột (bug colSpan=9 cũ). */}
                <td colSpan={7} style={{ padding: '0 10px', color: 'var(--t4)', fontSize: 11, fontWeight: 600, borderBottom: '1px solid var(--border-strong, var(--border))' }}>
                  {tr('Subtotal', 'Subtotal')} · {g.label}
                  <span style={{ marginLeft: 6, fontWeight: 500, color: 'var(--t4)' }}>
                    {tr('(m² — món tính theo cái không cộng vào cột này)', '(m² only — counted items are excluded from this column)')}
                  </span>
                </td>
                <td style={{ padding: '0 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--border-strong, var(--border))' }}>{fmtM2(g.subtotalM2)}</td>
                <td colSpan={2} style={{ borderBottom: '1px solid var(--border-strong, var(--border))' }} />
                <td style={{ padding: '0 10px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--border-strong, var(--border))' }}>{fmtVnd(g.subtotalAmount)}</td>
              </tr>
            </Fragment>
          ))}
          <BoqErrorRows errors={errors} projectId={projectId} columns={BOQ_TABLE_COLUMN_COUNT} />
        </tbody>
      </table>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, height: 40, padding: '0 16px', background: 'var(--panel)', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--t3)', position: 'sticky', bottom: 0 }}>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 8, color: 'var(--t2)' }}>
          {tr('Tổng · engine', 'Total · engine')}
          <b style={{ color: 'var(--accent)', fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmtVnd(totalAmount)} ₫</b>
        </span>
      </div>
    </div>
  );
}
