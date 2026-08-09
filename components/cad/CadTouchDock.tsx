'use client';

/**
 * components/cad/CadTouchDock.tsx — cụm nút CẢM ỨNG của chế độ **Sketch** (tham chiếu ArcSite).
 *
 * Lý do tồn tại: 4 thao tác cốt lõi của trình vẽ trước đây CHỈ có trên bàn phím vật lý, nên trên
 * iPad/màn cảm ứng là không dùng được:
 *   F8    → Ortho (khoá hướng ngang/dọc)            → nút "Ortho"
 *   F12   → Dynamic Input (HUD số cạnh con trỏ)     → nút "Số liệu"
 *   gõ chữ bất kỳ (type-anywhere) → mở dòng lệnh     → nút "Lệnh"
 *   giữ Space → pan tạm thời                         → nút "Kéo" (bật tool 'pan')
 * Thêm 2 nút kết thúc/huỷ thao tác (Enter/Escape) vì không có chúng thì trên cảm ứng không
 * chốt nổi polyline/tường, tức là "vẽ bằng ngón tay" vẫn dở dang.
 *
 * Cách nối: mọi nút PHÁT LẠI đúng phím tương ứng qua `cad:synth-key` — CadCanvas gọi thẳng
 * handler keydown của nó, nên nút và phím luôn chạy CÙNG một nhánh logic (không có bản sao thứ
 * hai để lệch nhau). Riêng Ortho/Dynamic Input đọc trạng thái từ store để tô sáng đúng.
 *
 * Chỉ hiện ở Sketch. Pro (chuột + bàn phím) ẩn hẳn cho sạch — xem CadToolbar.
 * Gu: cùng ngôn ngữ pill liquid-glass + hairline 1px của CadToolbar, KHÔNG thêm màu mới.
 * Vùng chạm ≥ 44×44px (chuẩn cảm ứng).
 *
 * Toolbelt ổ ⑤: từ chỗ pill nổi góc dưới-trái canvas → nay là HÀNG 2 của dock kính chung
 * (`CadToolbelt.tsx`, một-khối-một-bóng §2c) — component này chỉ còn render hàng nút,
 * vỏ kính + định vị do dock lo.
 */

import { useEffect, useState } from 'react';
import { Crosshair, Gauge, Terminal, Hand, Check, X, Undo2, Redo2, Fingerprint } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import {
  FINGER_DRAW_EVENT,
  readFingerDrawPreference,
  writeFingerDrawPreference,
} from '@/lib/cad/touch-input';

/** Kích thước cạnh nhỏ nhất của một vùng chạm (chuẩn Apple HIG / Material). */
const TOUCH_MIN = 44;

function synthKey(key: string, modifiers?: { mod?: boolean; shift?: boolean }) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cad:synth-key', { detail: { key, ...modifiers } }));
  }
}

export default function CadTouchDock() {
  const [fingerDraw, setFingerDraw] = useState(false);
  const cadMode = useCadStore((s) => s.cadMode);
  const orthoLock = useCadStore((s) => s.orthoLock);
  const dynInput = useCadStore((s) => s.dynInput);
  const tool = useCadStore((s) => s.tool);
  const setTool = useCadStore((s) => s.setTool);

  useEffect(() => {
    setFingerDraw(readFingerDrawPreference());
    const sync = (event: Event) => setFingerDraw(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener(FINGER_DRAW_EVENT, sync);
    return () => window.removeEventListener(FINGER_DRAW_EVENT, sync);
  }, []);

  if (cadMode !== 'sketch') return null;

  const panOn = tool === 'pan';

  return (
    <div
      aria-label="Cụm nút cảm ứng (Sketch)"
      style={{
        display: 'flex',
        alignItems: 'center',
        // Màn hẹp: tổng 9 nút rộng hơn Stage. Center sẽ làm tràn CẢ hai phía, cắt mất nút đầu;
        // bắt đầu từ trái + cuộn ngang giúp mọi nút luôn tới được mà không che canvas.
        justifyContent: 'flex-start',
        gap: 2,
        padding: '3px 5px',
        maxWidth: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        // Nút bấm nhanh liên tiếp không bị trình duyệt trễ 300ms / phóng to 2 chạm.
        touchAction: 'manipulation',
      }}
    >
      <DockBtn
        icon={Crosshair}
        label="Ortho"
        active={orthoLock}
        onPress={() => synthKey('F8')}
        title={`Ortho ${orthoLock ? 'BẬT' : 'tắt'} — khoá hướng ngang/dọc khi vẽ (phím F8)`}
      />
      <DockBtn
        icon={Gauge}
        label="Số liệu"
        active={dynInput}
        onPress={() => synthKey('F12')}
        title={`Dynamic Input ${dynInput ? 'BẬT' : 'tắt'} — hiện độ dài/toạ độ cạnh con trỏ (phím F12)`}
      />
      <DockBtn
        icon={Terminal}
        label="Lệnh"
        active={false}
        onPress={() => window.dispatchEvent(new CustomEvent('cad:cmd-focus'))}
        title="Mở ô nhập lệnh (trên bàn phím: gõ thẳng chữ cái bất kỳ lên bản vẽ)"
      />
      <DockBtn
        icon={Hand}
        label="Kéo"
        active={panOn}
        onPress={() => setTool(panOn ? 'select' : 'pan')}
        title="Kéo màn hình (trên bàn phím: giữ Space và rê chuột)"
      />
      <DockBtn
        icon={Fingerprint}
        label="Ngón vẽ"
        active={fingerDraw}
        onPress={() => writeFingerDrawPreference(!fingerDraw)}
        title={`${fingerDraw ? 'Tắt' : 'Bật'} vẽ bằng ngón tay khi thiết bị đã nhận bút`}
      />
      <span style={{ width: 1, height: 26, background: 'var(--border)', margin: '0 2px' }} />
      <DockBtn
        icon={Undo2}
        label="Hoàn tác"
        active={false}
        onPress={() => synthKey('z', { mod: true })}
        title="Hoàn tác bước gần nhất (⌘Z/Ctrl+Z)"
      />
      <DockBtn
        icon={Redo2}
        label="Làm lại"
        active={false}
        onPress={() => synthKey('z', { mod: true, shift: true })}
        title="Làm lại bước vừa hoàn tác (⌘⇧Z/Ctrl+Shift+Z)"
      />
      <DockBtn
        icon={Check}
        label="Xong"
        active={false}
        onPress={() => synthKey('Enter')}
        title="Chốt/kết thúc thao tác đang vẽ (phím Enter)"
      />
      <DockBtn
        icon={X}
        label="Huỷ"
        active={false}
        onPress={() => synthKey('Escape')}
        title="Huỷ thao tác đang vẽ, về công cụ Chọn (phím Esc)"
      />
    </div>
  );
}

function DockBtn({
  icon: Icon,
  label,
  active,
  onPress,
  title,
}: {
  icon: typeof Hand;
  label: string;
  active: boolean;
  onPress: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      title={title}
      aria-label={title}
      aria-pressed={active}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        flex: 'none',
        minWidth: TOUCH_MIN,
        height: TOUCH_MIN,
        padding: '0 9px',
        borderRadius: 999,
        // 2.1.8.l (30/07) — bật KHÔNG tô đặc nữa: trên bản vẽ kỹ thuật, khối màu đặc thắng chính
        // bản vẽ (cùng luật đã áp cho nút "Chạy flow", xem docs/TICKET-CHAY-FLOW-KHONG-GHIM-BAR
        // -2026-07-30.md quyết định ④) — ghost bằng token đã có, KHÔNG thêm màu mới.
        border: active ? '1px solid var(--accent-ring)' : '1px solid transparent',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--t2)',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        touchAction: 'manipulation',
        transition: 'background .15s, color .15s',
      }}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}
