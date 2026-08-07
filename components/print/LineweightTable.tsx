'use client';

/**
 * components/print/LineweightTable.tsx — Màn 8. Port nguyên văn `docs/mocks/BangNetIn.dc.html`.
 *
 * Panel "BẢNG NÉT KHI IN": header (tiêu đề + mô tả) · danh sách hàng cuộn được (chấm màu layer ·
 * tên · ô số mm · vạch minh hoạ độ đậm) · footer 2 nút gạt Bản màu/Đen trắng + dòng nhắc.
 *
 * Dữ liệu qua prop `rows` — 7 hàng của mock chỉ là DỮ LIỆU MẪU, export riêng `DEMO_LINEWEIGHT_ROWS`,
 * không hardcode trong thân component (đúng chỉ đạo phiếu).
 *
 * 7 màu chấm layer (`#e5674f #6a57f5 #46b876 #d9a34a #9e9ea8 #a99cff #71717c`) là MÀU LAYER do
 * người dùng đặt — DỮ LIỆU đi qua prop `row.color`, không phải token UI (ngoại lệ đã ghi trong
 * chỉ đạo phiếu, LUẬT 3).
 */

import { useState } from 'react';
// Bậc chiều cao vạch nằm ở `lib/print/lineweight.ts` để test được (xem `lineweight.test.ts` khoá
// đúng 7 hàng của mock) — component chỉ vẽ, không tự giữ một bản công thức thứ hai.
import { lineweightBarHeightPx } from '@/lib/print/lineweight';

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif";
const MONO = 'ui-monospace, Menlo, monospace';

export interface LineweightRow {
  name: string;
  /** màu layer — DỮ LIỆU của người dùng, không phải token UI. */
  color: string;
  /** độ đậm nét khi in, mm. */
  mm: number;
}

/** Dữ liệu MẪU — 7 hàng đúng mock, dùng khi nơi gọi chưa có bảng nét thật (đọc từ `Layer[]`). */
export const DEMO_LINEWEIGHT_ROWS: LineweightRow[] = [
  { name: 'Tường chịu lực', color: '#e5674f', mm: 0.5 },
  { name: 'Tường ngăn', color: '#6a57f5', mm: 0.35 },
  { name: 'Cửa và cửa sổ', color: '#46b876', mm: 0.25 },
  { name: 'Đồ đạc', color: '#d9a34a', mm: 0.18 },
  { name: 'Kích thước', color: '#9e9ea8', mm: 0.13 },
  { name: 'Ký hiệu và ghi chú', color: '#a99cff', mm: 0.13 },
  { name: 'Đường trục', color: '#71717c', mm: 0.09 },
];

interface Props {
  rows?: LineweightRow[];
}

export default function LineweightTable({ rows = DEMO_LINEWEIGHT_ROWS }: Props) {
  const [mode, setMode] = useState<'color' | 'mono'>('color');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, fontFamily: FONT }}>
      <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid var(--mat-hairline)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t4)' }}>
          Bảng nét khi in
        </div>
        <div style={{ marginTop: 5, fontSize: 11, color: 'var(--t5)', lineHeight: 1.55, textWrap: 'pretty' }}>
          {/* Mock BangNetIn.dc.html viết "Checklist TTT: …" — BỎ tên studio khỏi chuỗi hiển thị theo
              LUẬT TRUNG TÍNH (CLAUDE.md §1: sản phẩm bán ra không nhúng cứng thương hiệu studio nào).
              Giữ nguyên NỘI DUNG lời nhắc, chỉ bỏ cái tên. */}
          Độ đậm từng layer, đơn vị mi-li-mét. Sau khi xuất, mở file PDF kiểm lại độ đậm nhạt của nét.
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px 6px' }}>
        {rows.map((row, i) => (
          <Row key={`${row.name}-${i}`} row={row} mono={mode === 'mono'} />
        ))}
      </div>

      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--mat-hairline)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <ModeButton active={mode === 'color'} onClick={() => setMode('color')}>
            Bản màu
          </ModeButton>
          <ModeButton active={mode === 'mono'} onClick={() => setMode('mono')}>
            Đen trắng
          </ModeButton>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--t5)', lineHeight: 1.55 }}>
          Giữ màu layer để soát bản mềm. Trước khi giao khách, đổi sang đen trắng rồi kiểm lại độ đậm.
        </div>
      </div>
    </div>
  );
}

function Row({ row, mono }: { row: LineweightRow; mono: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 1fr 46px 34px',
        gap: 8,
        alignItems: 'center',
        height: 'var(--tap)',
        padding: '0 6px',
        borderRadius: 9,
        transition: 'background var(--dur-fast) var(--ease-apple)',
        background: hover ? 'var(--hover)' : 'transparent',
      }}
    >
      {/* Đen trắng: chấm layer chuyển xám — đây chính là ý nghĩa của nút, không chỉ đổi nhãn. */}
      <span style={{ width: 10, height: 10, borderRadius: 3, background: mono ? 'var(--t4)' : row.color }} />
      <span
        style={{
          minWidth: 0,
          fontSize: 12,
          color: 'var(--t2)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {row.name}
      </span>
      <span
        style={{
          height: 20,
          borderRadius: 6,
          background: 'var(--field)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--t2)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {row.mm.toFixed(2)}
      </span>
      <span style={{ height: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ width: 28, background: 'var(--pen)', borderRadius: 2, height: lineweightBarHeightPx(row.mm) }} />
      </span>
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        flex: 1,
        height: 'var(--tap)',
        border: '1px solid var(--border-strong)',
        borderRadius: 10,
        background: active ? 'var(--accent-soft)' : 'var(--field)',
        color: active ? 'var(--accent)' : 'var(--t3)',
        fontWeight: 600,
        fontSize: 11.5,
        lineHeight: 1.45,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'background var(--dur-base) var(--ease-apple)',
      }}
    >
      {children}
    </button>
  );
}
