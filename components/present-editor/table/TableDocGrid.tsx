'use client';

/**
 * components/present-editor/table/TableDocGrid.tsx — LƯỚI HIỂN THỊ chung của `TableDocEngine`
 * (`lib/present-editor/table-doc-engine.ts`) — mặt tiền RENDER, không tự tính gì (mọi dữ liệu đến
 * từ props đã nhóm sẵn qua `groupTableRows`). Dùng chung cho `schedule` (đợt này) và
 * `spec-sheet`/`approval-form` sau này (chưa có UI, xem `PresentDocTypePicker`) — cùng 1 lưới,
 * chỉ đổi `columns`.
 *
 * Bo góc theo thang ĐÃ CHỐT 12/08 (`docs/00-CHOT.md`): `--r-1`(6, chip/badge) ·
 * `--r-2`(10, ô/nút) · `--r-3`(14, card/panel con).
 */
import { useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { TableColumnDef, TableDisplayRow, TableGroup } from '@/lib/present-editor/table-doc-engine';
import { isColumnEditable } from '@/lib/present-editor/table-doc-engine';

export interface TableDocSelectedCell {
  rowId: string;
  colKey: string;
}

interface TableDocGridProps {
  columns: TableColumnDef[];
  groups: TableGroup[];
  onEditCell: (rowId: string, colKey: string, value: string) => void;
  onRevertCell: (rowId: string, colKey: string) => void;
  onViewOnDrawing?: (entityId: string) => void;
}

function fmtCell(v: TableDisplayRow['cells'][string], kind?: TableColumnDef['kind']): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return kind === 'currency' ? Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : v.toFixed(2).replace(/\.00$/, '');
  return String(v);
}

export function TableDocGrid({ columns, groups, onEditCell, onRevertCell, onViewOnDrawing }: TableDocGridProps) {
  const tr = useT();
  const [editing, setEditing] = useState<TableDocSelectedCell | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (row: TableDisplayRow, col: TableColumnDef) => {
    if (!isColumnEditable(col)) return;
    const v = row.cells[col.key];
    setEditing({ rowId: row.id, colKey: col.key });
    setEditValue(v === null || v === undefined ? '' : String(v));
  };

  const commit = () => {
    if (!editing) return;
    onEditCell(editing.rowId, editing.colKey, editValue);
    setEditing(null);
  };

  const totalRows = groups.reduce((s, g) => s + g.count, 0);
  if (totalRows === 0) return null;

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, background: 'var(--panel)', zIndex: 1 }}>
            <th style={thStyle('left')}>#</th>
            {columns.map((c) => (
              <th key={c.key} style={thStyle(c.align ?? 'left')}>{tr(...c.label)}</th>
            ))}
            <th style={thStyle('left')} />
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <GroupBlock
              key={g.key}
              group={g}
              columns={columns}
              editing={editing}
              editValue={editValue}
              setEditValue={setEditValue}
              startEdit={startEdit}
              commit={commit}
              cancel={() => setEditing(null)}
              onRevertCell={onRevertCell}
              onViewOnDrawing={onViewOnDrawing}
              tr={tr}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupBlock({
  group, columns, editing, editValue, setEditValue, startEdit, commit, cancel, onRevertCell, onViewOnDrawing, tr,
}: {
  group: TableGroup;
  columns: TableColumnDef[];
  editing: TableDocSelectedCell | null;
  editValue: string;
  setEditValue: (v: string) => void;
  startEdit: (row: TableDisplayRow, col: TableColumnDef) => void;
  commit: () => void;
  cancel: () => void;
  onRevertCell: (rowId: string, colKey: string) => void;
  onViewOnDrawing?: (entityId: string) => void;
  tr: (vi: string, en: string) => string;
}) {
  const hasTotals = Object.keys(group.totals).length > 0;
  return (
    <>
      <tr>
        <td colSpan={columns.length + 2} style={{ padding: '9px 12px 5px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t4)', background: 'var(--bg)' }}>
          {group.label} <span style={{ opacity: .65, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>· {group.count}</span>
        </td>
      </tr>
      {group.rows.map((row, i) => (
        <tr key={row.id} style={{ background: row.orphaned ? 'color-mix(in srgb, var(--warning) 8%, var(--bg))' : 'var(--bg)' }}>
          <td style={tdStyle('left')}>{i + 1}</td>
          {columns.map((col) => {
            const isEditing = editing?.rowId === row.id && editing.colKey === col.key;
            const editable = isColumnEditable(col);
            const ov = row.overrides?.[col.key];
            const raw = row.cells[col.key];
            return (
              <td key={col.key} style={{ ...tdStyle(col.align ?? 'left'), cursor: editable ? 'pointer' : 'default', position: 'relative' }} onClick={() => !isEditing && startEdit(row, col)}>
                {isEditing ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commit();
                      if (e.key === 'Escape') cancel();
                    }}
                    style={{ width: '100%', height: 22, border: '1px solid var(--accent)', borderRadius: 'var(--r-1)', padding: '0 6px', background: 'var(--field)', color: 'var(--t1)', font: 'inherit' }}
                  />
                ) : (
                  <span title={ov ? tr(`Đã sửa tay — mô hình cho ${fmtCell(ov.machineValue, col.kind)}`, `Hand-edited — model says ${fmtCell(ov.machineValue, col.kind)}`) : undefined} style={{ color: ov ? 'var(--warning)' : 'var(--t1)', fontWeight: ov ? 600 : 400 }}>
                    {fmtCell(raw, col.kind)}
                  </span>
                )}
                {ov && !isEditing && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRevertCell(row.id, col.key); }}
                    title={tr('Lấy lại số từ mô hình', 'Reset to model value')}
                    style={{ marginLeft: 6, border: 0, background: 'transparent', color: 'var(--t4)', cursor: 'pointer', verticalAlign: 'middle' }}
                  >
                    <RotateCcw size={11} />
                  </button>
                )}
              </td>
            );
          })}
          <td style={{ ...tdStyle('left'), width: 26 }}>
            {row.orphaned && (
              <span title={tr('Không còn thấy trên bản vẽ — dữ liệu vẫn giữ, bấm "Cập nhật từ bản vẽ" không xoá dòng này.', 'No longer found on the drawing — data is kept; "Update from drawing" will not delete this row.')} style={{ color: 'var(--warning)', display: 'inline-flex' }}>
                <AlertTriangle size={13} />
              </span>
            )}
            {!row.orphaned && row.entityId && onViewOnDrawing && (
              <button type="button" onClick={() => onViewOnDrawing(row.entityId as string)} title={tr('Xem trên bản vẽ', 'View on drawing')} style={{ border: 0, background: 'transparent', color: 'var(--t4)', cursor: 'pointer', fontSize: 10 }}>
                ↗
              </button>
            )}
          </td>
        </tr>
      ))}
      {hasTotals && (
        <tr>
          <td style={tdStyle('left')} />
          {columns.map((col, i) => (
            <td key={col.key} style={{ ...tdStyle(col.align ?? 'left'), fontWeight: 700, color: 'var(--t1)', borderTop: '1px solid var(--border)' }}>
              {i === 0 ? tr('Tổng nhóm', 'Group total') : group.totals[col.key] !== undefined ? fmtCell(group.totals[col.key], col.kind) : ''}
            </td>
          ))}
          <td style={tdStyle('left')} />
        </tr>
      )}
    </>
  );
}

function thStyle(align: 'left' | 'right' | 'center'): React.CSSProperties {
  return { textAlign: align, padding: '7px 12px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t4)', borderBottom: '1px solid var(--border)' };
}
function tdStyle(align: 'left' | 'right' | 'center'): React.CSSProperties {
  return { textAlign: align, padding: '6px 12px', borderBottom: '1px solid var(--border)', color: 'var(--t2)' };
}
