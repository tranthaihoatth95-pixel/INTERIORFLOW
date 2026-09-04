'use client';

/**
 * components/ui/PanelFlank.tsx — TAY CẦM THU/MỞ PANEL BÊN dùng chung toàn app (p3, 07/08).
 *
 * Hoà chốt 07/08: *"Thanh này ở chặng presenting làm rất tốt nên áp dụng cho toàn hệ thống"* —
 * mẫu là dải DỌC MẢNH sát mép panel, giữa có mũi tên ‹ / ›, bấm là thu/mở. Vì sao đáng nhân bản:
 * chiếm ~0 diện tích khi không dùng · vị trí đoán được (luôn ở mép panel) · một cú bấm không cần
 * menu · thu rồi VẪN THẤY tay cầm để mở lại (không "mất tích" — bẫy chết người dùng).
 *
 * CHÉP HÀNH VI của `PresentEditor.tsx` (panel Magic trái + inspector Lớp phải: `panelEdgeStripStyle`
 * dải 14px + `LS_INSPECTOR_OPEN` nhớ localStorage), KHÔNG chép code — hiện trạng đo 07/08 cho
 * thấy hành vi này đã bị chép tay lệch nhau rải rác (2/20 cad · 2/18 render-studio · 3/31
 * studio · 5/10 nodes · 0/7 library), mỗi bản một kiểu. Từ nay MỘT component; cấm chép tay thêm.
 *
 * Cách dùng — đặt làm CON TRỰC TIẾP của một container flex-row, thay chỗ panel cũ đứng:
 *   <PanelFlank side="left" storageKey="library.shelf" label="Kệ thư viện">
 *     <div className="shelf">…</div>
 *   </PanelFlank>
 * `side` = panel đứng ở mép NÀO của vùng nội dung (trái/phải) — quyết định chiều mũi tên.
 * Khi MỞ: [children][dải ‹] (side=left) · khi THU: chỉ còn dải 14px với mũi tên chiều ngược lại.
 * Component KHÔNG quản bề rộng children (panel tự mang width như cũ) — chỉ quản đóng/mở.
 *
 * Nhớ trạng thái THEO TỪNG PANEL (storageKey riêng, tiền tố 'if.panelflank.') — không dùng một
 * cờ chung: thu kệ Thư viện không được kéo theo thu Inspector 3D.
 *
 * Phím tắt: optional `hotkey` (một ký tự). Component nghe window keydown, guard ô nhập liệu.
 * Nơi mount TỰ chọn phím không va (va phím là bệnh đã có án — §4e SPEC-PANEL-ROLLOUT-IDF, chặng
 * Vẽ type-anywhere nuốt chữ trần); không truyền = không phím tắt, chỉ bấm chuột.
 */

import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { coPhimHeThong } from '@/lib/kbd'; // MỘT nguồn phím chính: ⌘ trên macOS · Ctrl nơi khác

const PREFIX = 'if.panelflank.';

function readStored(key: string): boolean | null {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v === null ? null : v === '1';
  } catch {
    // localStorage bị chặn (Safari chế độ riêng tư / iframe third-party / quota) — K5: không nhớ
    // được thì panel về defaultOpen mỗi phiên, KHÔNG phải lỗi chặn việc; không văng exception ra UI.
    return null;
  }
}

function writeStored(key: string, open: boolean): void {
  try {
    localStorage.setItem(PREFIX + key, open ? '1' : '0');
  } catch {
    // cùng lý do trên — mất trí nhớ giữa phiên là hệ quả chấp nhận được, không chặn thao tác thu/mở.
  }
}

/**
 * Dải tay cầm TRÌNH BÀY THUẦN — cho nơi ĐÃ có state đóng/mở riêng (vd `AppShell` quản
 * `inspectorHidden` + phím I sẵn) muốn cùng hình hài/aria mà không double-manage state.
 * Nơi chưa có state thì dùng `PanelFlank` (mặc định) — nó tự quản + tự nhớ localStorage.
 */
export function FlankStrip({ side, open, onClick, label, hotkey }: {
  side: 'left' | 'right';
  open: boolean;
  onClick: () => void;
  label: string;
  hotkey?: string;
}) {
  const collapse = side === 'left' ? <ChevronLeft size={12} /> : <ChevronRight size={12} />;
  const expand = side === 'left' ? <ChevronRight size={12} /> : <ChevronLeft size={12} />;
  return (
    <button
      type="button"
      className="pe-panel-toggle"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? `Thu ${label}` : `Mở ${label}`}
      title={(open ? `Thu ${label}` : `Mở ${label}`) + (hotkey ? ` — ${hotkey}` : '')}
      style={{
        flex: '0 0 10px',
        width: 10,
        alignSelf: 'stretch',
        border: 'none',
        [side === 'left' ? 'borderRight' : 'borderLeft']: '1px solid var(--vien-mo)',
        background: 'transparent',
        color: 'var(--t4)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {open ? collapse : expand}
    </button>
  );
}

export interface PanelFlankProps {
  /** Panel đứng ở mép trái hay phải của vùng nội dung — quyết định CHIỀU mũi tên. */
  side: 'left' | 'right';
  /** Khoá nhớ trạng thái RIÊNG TỪNG PANEL (vd 'library.shelf'), tự mang tiền tố 'if.panelflank.'. */
  storageKey: string;
  /** Tên panel cho title + aria ("Kệ thư viện") — trình đọc màn hình đọc "Thu kệ thư viện". */
  label: string;
  defaultOpen?: boolean;
  /** Phím tắt MỘT ký tự, không kèm modifier (vd 'k') — nơi mount tự chọn phím không va. */
  hotkey?: string;
  children: ReactNode;
  /** Class thêm cho wrapper lúc MỞ (hiếm khi cần — children tự mang layout). */
  className?: string;
}

export default function PanelFlank({ side, storageKey, label, defaultOpen = true, hotkey, children, className }: PanelFlankProps) {
  // Đọc localStorage LẦN ĐẦU trong useState initializer sẽ lệch SSR/CSR (server luôn defaultOpen)
  // → hydration mismatch. Mount xong mới đọc — nhấp nháy 1 khung hình khi panel nhớ-là-thu, đổi
  // lấy không vỡ hydration (cùng cách LS_INSPECTOR_OPEN của PresentEditor xử lý).
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  useEffect(() => {
    const stored = readStored(storageKey);
    if (stored !== null) setOpen(stored);
  }, [storageKey]);

  const toggle = useCallback(() => {
    setOpen((o) => {
      writeStored(storageKey, !o);
      return !o;
    });
  }, [storageKey]);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (coPhimHeThong(e) || e.altKey || e.shiftKey) return;
      if (e.key.toLowerCase() !== hotkey.toLowerCase()) return;
      const el = e.target;
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey, toggle]);

  // Mũi tên NÓI HÀNH ĐỘNG sắp xảy ra (chuẩn PresentEditor): panel trái đang mở → ‹ (thu về trái);
  // đang thu → › (bung ra phải). Panel phải thì ngược chiều.
  const collapseIcon = side === 'left' ? <ChevronLeft size={12} /> : <ChevronRight size={12} />;
  const expandIcon = side === 'left' ? <ChevronRight size={12} /> : <ChevronLeft size={12} />;

  const stripStyle: React.CSSProperties = {
    flex: '0 0 14px',
    width: 14,
    alignSelf: 'stretch',
    border: 'none',
    [side === 'left' ? 'borderRight' : 'borderLeft']: '1px solid var(--border)',
    background: 'var(--panel)',
    color: 'var(--t3)',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    padding: 0,
  };

  const strip = (
    <button
      type="button"
      className="pe-panel-toggle"
      onClick={toggle}
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={open ? `Thu ${label}` : `Mở ${label}`}
      title={(open ? `Thu ${label}` : `Mở ${label}`) + (hotkey ? ` — ${hotkey.toUpperCase()}` : '')}
      style={stripStyle}
    >
      {open ? collapseIcon : expandIcon}
    </button>
  );

  if (!open) return strip;

  // side=left: nội dung rồi tay cầm ở mép TRONG (giáp vùng chính); side=right: tay cầm trước.
  return (
    <div id={panelId} className={className} style={{ display: 'flex', alignItems: 'stretch', minHeight: 0, minWidth: 0 }}>
      {side === 'right' && strip}
      {children}
      {side === 'left' && strip}
    </div>
  );
}
