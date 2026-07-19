'use client';

/**
 * components/ui/IOMenu.tsx — cặp nút "Nhập"/"Xuất" DÙNG CHUNG cho CẢ 3 CHẶNG
 * (Layout CAD · Render · Present).
 *
 * Yêu cầu user (19/07): "đồng bộ import và export 3 chặng có cách thể hiện giống nhau, khi bấm
 * vào thì mới xổ ra đuôi file tương ứng của mỗi chặng" — nghĩa là:
 *   - CÙNG 1 cặp nút, CÙNG icon (Upload/Download), CÙNG vị trí, CÙNG cách hoạt động ở cả 3 chặng.
 *   - Danh sách định dạng KHÁC nhau theo chặng → truyền vào qua prop `items`, không hardcode.
 *   - Bấm mới xổ menu; không bày dãy nút định dạng ra ngoài toolbar nữa.
 *
 * Component này CHỈ là lớp trình bày. Mọi logic xuất/nhập thật vẫn nằm nguyên ở chặng gọi nó
 * (CadEditor · app/page.tsx Render · PresentEditor) — `onSelect` chỉ gọi lại đúng handler cũ.
 *
 * Ngôn ngữ thiết kế (CLAUDE.md — TTT Design System, áp theo TINH THẦN cho UI thao tác):
 * keyline 1px mảnh (var(--border)), bo góc gần vuông, không thanh dày, nền var(--panel)/var(--field).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Upload, Download, ChevronDown } from 'lucide-react';

/** 1 định dạng trong menu — vd DXF / PDF / .pptx / Ảnh PNG. */
export interface IOFormatItem {
  /** khoá ổn định, cũng dùng để so với `busy` khi muốn hiện "Đang xuất…". */
  id: string;
  /** tên định dạng hiện đậm, vd "DXF" · "PowerPoint (.pptx)". */
  label: string;
  /** dòng mô tả nhỏ bên dưới — giải thích ngắn định dạng dùng để làm gì. */
  sub?: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** định dạng chưa khả dụng → xám + không bấm được. */
  disabled?: boolean;
  /** lý do disabled — hiện trong tooltip (title) VÀ dưới nhãn, để user biết vì sao. */
  disabledReason?: string;
}

interface Props {
  kind: 'import' | 'export';
  items: IOFormatItem[];
  /** id của định dạng đang chạy (hoặc chuỗi bất kỳ ≠ null) → khoá nút + đổi nhãn. */
  busy?: string | null;
  /** đè nhãn mặc định ("Nhập"/"Xuất"). */
  label?: string;
  /** mép menu bám theo — mặc định 'left' cho Nhập, 'right' cho Xuất. */
  align?: 'left' | 'right';
  /** 'accent' = nút đặc màu nhấn (dùng cho Xuất ở Present, giữ đúng giao diện cũ). */
  variant?: 'default' | 'accent';
  /** 'sm' hợp thanh file CAD (cao 44px), 'md' hợp header Present/Render. */
  size?: 'sm' | 'md';
  title?: string;
  /** toast ngắn kết quả lần xuất gần nhất (chặng gọi tự hẹn giờ tắt). */
  resultMsg?: { ok: boolean; text: string } | null;
}

export default function IOMenu({
  kind,
  items,
  busy = null,
  label,
  align,
  variant = 'default',
  size = 'sm',
  title,
  resultMsg = null,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isImport = kind === 'import';
  const side = align ?? (isImport ? 'left' : 'right');
  const baseLabel = label ?? (isImport ? 'Nhập' : 'Xuất');

  // đóng khi bấm ra ngoài / nhấn Escape — cùng hành vi ở cả 3 chặng.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  // nhãn khi đang chạy: ưu tiên label của định dạng đang xuất, không có thì nhãn chung.
  const running = busy ? items.find((i) => i.id === busy) : null;
  const shownLabel = busy
    ? `${isImport ? 'Đang mở' : 'Đang xuất'}${running ? ` ${running.label}` : ''}…`
    : baseLabel;

  const accent = variant === 'accent';
  const pad = size === 'md' ? '8px 12px' : '5px 10px';
  const fontSize = size === 'md' ? 13 : 12;
  const iconSize = size === 'md' ? 15 : 14;

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!!busy}
        aria-haspopup="menu"
        aria-expanded={open}
        title={title ?? (isImport ? 'Mở / nhập file vào chặng này' : 'Xuất file từ chặng này')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: pad,
          borderRadius: 8,
          fontSize,
          cursor: busy ? 'default' : 'pointer',
          border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
          background: accent ? 'var(--accent)' : 'var(--field)',
          color: accent ? '#fff' : 'var(--t2)',
          opacity: busy ? 0.6 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {isImport ? <Upload size={iconSize} /> : <Download size={iconSize} />}
        {shownLabel}
        <ChevronDown
          size={size === 'md' ? 13 : 12}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
        />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [side]: 0,
            zIndex: 40,
            minWidth: 236,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 5,
            boxShadow: '0 10px 30px rgba(0,0,0,.28)',
          }}
        >
          {items.map((it) => (
            <Item
              key={it.id}
              item={it}
              onDone={() => setOpen(false)}
            />
          ))}
        </div>
      )}

      {resultMsg && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [side]: 0,
            zIndex: 40,
            whiteSpace: 'nowrap',
            padding: '7px 12px',
            borderRadius: 8,
            fontSize: 12.5,
            border: `1px solid ${resultMsg.ok ? 'var(--accent)' : '#c0392b'}`,
            background: 'var(--panel)',
            color: resultMsg.ok ? 'var(--t1)' : '#c0392b',
            boxShadow: '0 10px 30px rgba(0,0,0,.25)',
          }}
        >
          {resultMsg.text}
        </div>
      )}
    </div>
  );
}

function Item({ item, onDone }: { item: IOFormatItem; onDone: () => void }) {
  const [hover, setHover] = useState(false);
  const dim = !!item.disabled;
  return (
    <button
      type="button"
      role="menuitem"
      disabled={dim}
      title={dim ? item.disabledReason ?? 'Chưa khả dụng' : item.sub ?? item.label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        if (dim) return;
        onDone();
        item.onSelect();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 10px',
        borderRadius: 7,
        border: 'none',
        background: hover && !dim ? 'var(--field)' : 'transparent',
        color: dim ? 'var(--t3)' : 'var(--t2)',
        cursor: dim ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: dim ? 0.55 : 1,
      }}
    >
      {item.icon && <span style={{ display: 'grid', placeItems: 'center', flexShrink: 0 }}>{item.icon}</span>}
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: dim ? 'var(--t3)' : 'var(--t1)' }}>
          {item.label}
        </span>
        {(dim ? item.disabledReason ?? item.sub : item.sub) && (
          <span style={{ display: 'block', fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
            {dim ? item.disabledReason ?? item.sub : item.sub}
          </span>
        )}
      </span>
    </button>
  );
}
