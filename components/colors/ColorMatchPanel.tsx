'use client';

/**
 * components/colors/ColorMatchPanel.tsx — VIỆC 2 trên giao diện: tra màu.
 *
 * Kỷ luật hiển thị (đừng "gọn lại" thành một dòng đáp án):
 *   • Luôn bày **TOP 3-5 kèm số ΔE**, kèm câu giải nghĩa con số đó. Máy thu hẹp lựa chọn, con
 *     người chọn.
 *   • ΔE00 nhỏ nhất > ngưỡng ⇒ hiện thẳng "không có màu nào đủ gần trong thư viện này"
 *     (`NO_CLOSE_MATCH_NOTICE`) — vẫn cho xem danh sách nhưng KHÔNG trình bày như đáp án.
 *   • `ColorAccuracyNotice` (VIỆC 4) đứng NGAY CẠNH nhóm nút chỉ định/xuất, không tắt được.
 *
 * §9 "thiết kế trước — tính năng fill sau": nút **Đặt hàng** vẽ sẵn nhưng `disabled` KÈM LÝ DO
 * (chưa có đường nối sang BOQ/đơn hàng). Cấm nút giả bấm không ra gì, cấm xoá ô trống cho gọn mắt.
 */

import { useMemo, useState } from 'react';
import { Search, Copy, FileDown, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { nearestColors, DEFAULT_MAX_DELTA_E } from '@/lib/gu/pantone';
import { NO_CLOSE_MATCH_NOTICE } from '@/lib/colors/disclaimer';
import type { ColorSource } from '@/lib/colors/types';
import { ColorAccuracyNotice } from './ColorAccuracyNotice';

export function ColorMatchPanel({ sources }: { sources: ColorSource[] }) {
  const tr = useT();
  const [hex, setHex] = useState('#8a5a3c');
  const [sourceId, setSourceId] = useState<string>(sources[0]?.id ?? '');

  const source = useMemo(
    () => sources.find((s) => s.id === sourceId) ?? sources[0] ?? null,
    [sources, sourceId],
  );
  const result = useMemo(() => (source ? nearestColors(hex, source, { limit: 5 }) : null), [hex, source]);

  const copyCodes = () => {
    if (!result) return;
    void navigator.clipboard?.writeText(
      result.matches.map((m) => `${m.code}\t${m.name}\t${m.hex}\tΔE ${m.deltaE}`).join('\n'),
    );
  };

  const exportCsv = () => {
    if (!result) return;
    const rows = [
      ['input_hex', 'library', 'code', 'name', 'hex', 'deltaE2000'],
      ...result.matches.map((m) => [hex, result.sourceName, m.code, m.name, m.hex, String(m.deltaE)]),
    ];
    const blob = new Blob([`﻿${rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n')}`],
      { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tra-mau-${hex.replace('#', '')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!sources.length) return null;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Search size={14} style={{ color: 'var(--t4)' }} />
        <span style={{ fontSize: 13, lineHeight: 1.5, fontWeight: 600, color: 'var(--t1)' }}>
          {tr('Tra màu gần nhất', 'Find the nearest colour')}
        </span>
        <input
          type="color" value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000'}
          onChange={(e) => setHex(e.target.value)} aria-label={tr('Chọn màu', 'Pick a colour')}
          style={{ width: 34, height: 30, padding: 0, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--field)' }}
        />
        <input
          value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#rrggbb"
          style={{ ...fieldStyle, width: 110, fontFamily: 'ui-monospace, monospace' }}
        />
        <select value={source?.id ?? ''} onChange={(e) => setSourceId(e.target.value)} style={{ ...fieldStyle, minWidth: 180 }}>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>{`${s.name} (${s.colors.length})`}</option>
          ))}
        </select>
      </div>

      {result && !result.matches.length && (
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--t4)' }}>
          {tr('Chưa tra được — kiểm lại mã hex, hoặc bảng này chưa có màu nào.',
            'Nothing to match — check the hex value, or this library has no colours.')}
        </p>
      )}

      {result && result.matches.length > 0 && (
        <>
          {!result.enough && (
            <div style={warnBox}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                {tr(NO_CLOSE_MATCH_NOTICE.vi, NO_CLOSE_MATCH_NOTICE.en)}{' '}
                {tr(`Gần nhất lệch ΔE ${result.nearestDeltaE} (ngưỡng ${DEFAULT_MAX_DELTA_E}). Danh sách dưới đây chỉ để tham khảo, không phải kết quả khớp.`,
                  `Closest is ΔE ${result.nearestDeltaE} away (threshold ${DEFAULT_MAX_DELTA_E}). The list below is for reference only, not a match.`)}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.matches.map((m, i) => (
              <div key={`${m.code}-${i}`} style={row}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: m.hex, border: '1px solid var(--border)', flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--t1)', fontWeight: 600 }}>
                    {m.name}{m.code && m.code !== m.name ? ` · ${m.code}` : ''}
                  </div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--t4)' }}>
                    {m.hex}{m.brand ? ` · ${m.brand}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--t2)', fontVariantNumeric: 'tabular-nums' }}>ΔE {m.deltaE}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--t5, var(--t4))' }}>{deltaLabel(m.deltaE, tr)}</div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, color: 'var(--t4)' }}>
            {tr(`ΔE00 (CIEDE2000) tính trong CIELAB D65 — càng nhỏ càng sát. Gần nhất TRONG bảng "${result.sourceName}", không phải trong mọi bảng màu.`,
              `ΔE00 (CIEDE2000) in CIELAB D65 — smaller is closer. Nearest within "${result.sourceName}" only, not across all libraries.`)}
          </p>

          {/* VIỆC 4: câu cảnh báo đứng NGAY CẠNH nhóm nút chỉ định/xuất/đặt hàng. Không tắt được. */}
          <ColorAccuracyNotice />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={copyCodes} style={btn(false)}>
              <Copy size={18} /> {tr('Chép mã đã chọn', 'Copy codes')}
            </button>
            <button type="button" onClick={exportCsv} style={btn(false)}>
              <FileDown size={18} /> {tr('Xuất CSV kết quả', 'Export results as CSV')}
            </button>
            <button
              type="button" disabled
              title={tr('Chưa nối — cần đường từ bảng màu sang BOQ/đơn hàng (chưa có ở phiên này).',
                'Not wired yet — needs a path from the colour library into BOQ/orders.')}
              style={btn(false, true)}
            >
              <ShoppingCart size={18} /> {tr('Đưa vào đơn đặt hàng', 'Add to order')}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function deltaLabel(d: number, tr: (vi: string, en: string) => string): string {
  if (d < 1) return tr('gần như trùng', 'near identical');
  if (d < 2) return tr('rất sát', 'very close');
  if (d <= DEFAULT_MAX_DELTA_E) return tr('cùng tông', 'same tone');
  return tr('khác tông', 'different tone');
}

const fieldStyle: React.CSSProperties = {
  height: 30, padding: '0 8px', borderRadius: 10, border: '1px solid var(--border)',
  background: 'var(--field)', color: 'var(--t1)', fontSize: 12.5, lineHeight: 1.6, outline: 'none',
};
const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: 8,
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--field)',
};
const warnBox: React.CSSProperties = {
  display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-sm)',
  background: 'color-mix(in srgb, var(--warn, var(--danger)) 14%, var(--panel))', color: 'var(--t1)',
};
function btn(primary: boolean, disabled = false): React.CSSProperties {
  return {
    height: 30, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    border: primary ? 0 : '1px solid var(--border)', borderRadius: 10,
    fontSize: 12, lineHeight: 1.5, fontWeight: 600,
    background: primary ? 'var(--accent)' : 'var(--field)', color: primary ? '#fff' : 'var(--t2)',
  };
}
