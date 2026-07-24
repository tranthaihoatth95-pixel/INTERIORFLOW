'use client';

/**
 * components/cad/SchedulePanel.tsx — Hệ Legend C1+C2 (docs/PROPOSAL-LEGEND-SYSTEM.md §3):
 * panel "Thống kê · Schedule" + "Chú giải · Legend" cho CAD.
 *
 *  - Bảng schedule ĐỌC LIVE từ doc (đếm lại mỗi render — buildSchedule là hàm thuần rẻ);
 *    click 1 hàng → highlight các entity thuộc group trên canvas (cơ chế select có sẵn).
 *  - Cột "Ghi chú" tự nối ProductSpec (X1): ưu tiên specId user đã gán trên entity, fallback
 *    match drawingBlock ↔ block key — hiện sku · brand · giá tham khảo.
 *  - Nút "Đóng dấu vào bản vẽ": chèn bảng/khung legend thành entity TEXT/LINE THƯỜNG cạnh mép
 *    phải bản vẽ (Q-L3: entity thường + regenerate, PDF/DXF export ăn theo pipeline sẵn).
 */

import { useEffect, useMemo, useState } from 'react';
import { Stamp, X, ListOrdered, BookOpenText } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { docBox } from '@/lib/cad/model';
import {
  buildSchedule, scheduleToEntities, type ScheduleFilter, type ScheduleNotes,
} from '@/lib/cad/schedule';
import { collectLegend, legendToEntities, LEGEND_TABLE_W } from '@/lib/cad/legend';

/** Spec DTO tối thiểu panel cần (subset response /api/specs). */
interface SpecDto {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  priceNote: string | null;
  drawingBlock: string | null;
}

const FILTERS: { id: ScheduleFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'furniture', label: 'Nội thất' },
  { id: 'door', label: 'Cửa đi' },
  { id: 'window', label: 'Cửa sổ' },
  { id: 'wall', label: 'Tường' },
];

export default function SchedulePanel({ onClose }: { onClose: () => void }) {
  const doc = useCadStore((s) => s.doc);
  const select = useCadStore((s) => s.select);
  const addEntities = useCadStore((s) => s.addEntities);
  const setStatus = useCadStore((s) => s.setStatus);
  const [filter, setFilter] = useState<ScheduleFilter>('all');
  const [specs, setSpecs] = useState<SpecDto[]>([]);

  // nạp spec 1 lần khi mở panel — lỗi mạng/401 thì bảng vẫn chạy, chỉ thiếu cột ghi chú.
  useEffect(() => {
    let alive = true;
    fetch('/api/specs')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j && Array.isArray(j.specs)) setSpecs(j.specs as SpecDto[]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => buildSchedule(doc, filter), [doc, filter]);
  const legend = useMemo(() => collectLegend(doc), [doc]);

  // ghi chú per-row từ ProductSpec: specId gán tay > drawingBlock match block key.
  const notes = useMemo<ScheduleNotes>(() => {
    const byId = new Map(specs.map((s) => [s.id, s]));
    const byBlock = new Map(specs.filter((s) => s.drawingBlock).map((s) => [s.drawingBlock as string, s]));
    const out: ScheduleNotes = {};
    for (const r of rows) {
      const spec = (r.specId && byId.get(r.specId)) || (r.block && byBlock.get(r.block)) || null;
      if (spec) out[r.key] = [spec.sku, spec.brand, spec.priceNote].filter(Boolean).join(' · ');
    }
    return out;
  }, [rows, specs]);

  /** Điểm đặt cạnh mép PHẢI bản vẽ (như addPresentationKit đặt khung tên) — bảng thứ 2 tự nhích
   * thêm sang phải nhờ docBox đã phình ra sau lần đóng dấu trước. */
  const stampAt = (gap: number) => {
    const box = docBox(doc);
    return box ? { x: box.maxX + gap, y: box.maxY } : { x: 0, y: 0 };
  };

  const stampSchedule = () => {
    if (!rows.length) return;
    addEntities(scheduleToEntities(rows, stampAt(1200), { notes }));
    setStatus(`Đã đóng dấu bảng thống kê (${rows.length} hàng) cạnh mép phải bản vẽ. Bản vẽ đổi thì xoá bảng + đóng dấu lại.`);
    window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
  };

  const stampLegend = () => {
    const ents = legendToEntities(legend, stampAt(1200 + LEGEND_TABLE_W + 1200));
    if (!ents.length) return;
    addEntities(ents);
    setStatus('Đã đặt khung chú giải (legend) cạnh mép phải bản vẽ. Thêm/xoá ký hiệu thì xoá khung + đặt lại.');
    window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
  };

  const legendCount = legend.blocks.length + legend.lineTypes.length + legend.hatches.length;

  return (
    <div style={{ ...panel, left: 12, top: 70, width: 360, maxHeight: 'calc(100% - 130px)', display: 'flex', flexDirection: 'column' }}>
      <div style={panelHead}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ListOrdered size={14} /> Thống kê · Schedule
        </span>
        <button type="button" onClick={onClose} style={miniBtn} title="Đóng">
          <X size={14} />
        </button>
      </div>

      {/* filter elementType */}
      <div style={{ display: 'flex', gap: 4, padding: '0 4px 8px', flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            style={{
              fontSize: 10.5, padding: '3px 9px', borderRadius: 999, cursor: 'pointer',
              border: '1px solid var(--border)',
              background: filter === f.id ? 'var(--accent)' : 'var(--field)',
              color: filter === f.id ? '#fff' : 'var(--t3)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {!rows.length && (
          <div style={{ fontSize: 11, color: 'var(--t4)', padding: '4px 6px 10px' }}>
            Chưa có gì để đếm — đặt block nội thất/cửa hoặc gán elementType cho phần tử.
          </div>
        )}
        {rows.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr style={{ color: 'var(--t4)', fontSize: 10, textAlign: 'left' }}>
                <th style={th}>#</th>
                <th style={th}>Tên · Name</th>
                <th style={th}>KT (mm)</th>
                <th style={{ ...th, textAlign: 'right' }}>SL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.key}
                  onClick={() => select(r.ids)}
                  title={notes[r.key] ? `${notes[r.key]} — click chọn trên bản vẽ` : 'Click chọn các đối tượng này trên bản vẽ'}
                  style={{ cursor: 'pointer', borderTop: '1px solid var(--border)' }}
                >
                  <td style={{ ...td, color: 'var(--t4)' }}>{i + 1}</td>
                  <td style={td}>
                    <div style={{ color: 'var(--t1)' }}>{r.label}</div>
                    {notes[r.key] && (
                      <div style={{ fontSize: 9.5, color: 'var(--t4)', marginTop: 1 }}>{notes[r.key]}</div>
                    )}
                  </td>
                  <td style={{ ...td, color: 'var(--t3)' }}>{r.w && r.h ? `${r.w}×${r.h}` : '—'}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 650, color: 'var(--t1)' }}>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Chú giải · Legend (C2) ── */}
        <div style={{ ...panelHead, padding: '12px 6px 6px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpenText size={14} /> Chú giải · Legend
          </span>
          <span style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 400 }}>{legendCount} mục đang dùng</span>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--t4)', padding: '0 6px 8px', lineHeight: 1.45 }}>
          Tự quét ký hiệu bản vẽ ĐANG dùng: {legend.blocks.length} block · {legend.lineTypes.length} nét ·{' '}
          {legend.hatches.length} hatch. Danh sách tự cập nhật khi thêm/xoá đối tượng.
        </div>
        {legend.blocks.slice(0, 8).map((b) => (
          <div key={b.block} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 8px', color: 'var(--t2)' }}>
            <span>{b.nameEn ? `${b.name} · ${b.nameEn}` : b.name}</span>
            <span style={{ color: 'var(--t4)' }}>×{b.count}</span>
          </div>
        ))}
        {legend.blocks.length > 8 && (
          <div style={{ fontSize: 10, color: 'var(--t4)', padding: '2px 8px' }}>… và {legend.blocks.length - 8} loại nữa (đủ trong khung khi đặt lên bản vẽ)</div>
        )}
      </div>

      {/* hành động */}
      <div style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 8 }}>
        <button type="button" onClick={stampSchedule} disabled={!rows.length} style={actBtn(!rows.length)} title="Chèn bảng thống kê thành entity text/line cạnh mép phải bản vẽ — in PDF/xuất DXF được như mọi entity khác">
          <Stamp size={13} /> Đóng dấu bảng
        </button>
        <button type="button" onClick={stampLegend} disabled={!legendCount} style={actBtn(!legendCount)} title="Đặt khung chú giải (swatch ký hiệu thu nhỏ + tên song ngữ) cạnh mép phải bản vẽ">
          <Stamp size={13} /> Đặt legend
        </button>
      </div>
    </div>
  );
}

/* styles — cùng ngôn ngữ panel của CadEditor (const nội bộ file đó, không export — chép tối thiểu) */
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
const th: React.CSSProperties = { padding: '3px 8px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '5px 8px', verticalAlign: 'top' };
function actBtn(disabled: boolean): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '7px 8px',
    borderRadius: 8,
    border: 'none',
    background: disabled ? 'var(--field)' : 'var(--accent)',
    color: disabled ? 'var(--t4)' : '#fff',
    fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
