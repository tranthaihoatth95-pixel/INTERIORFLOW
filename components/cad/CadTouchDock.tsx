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
 */

import { Crosshair, Gauge, Terminal, Hand, Check, X } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';

/** Kích thước cạnh nhỏ nhất của một vùng chạm (chuẩn Apple HIG / Material). */
const TOUCH_MIN = 44;

function synthKey(key: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cad:synth-key', { detail: key }));
  }
}

export default function CadTouchDock() {
  const cadMode = useCadStore((s) => s.cadMode);
  const orthoLock = useCadStore((s) => s.orthoLock);
  const dynInput = useCadStore((s) => s.dynInput);
  const tool = useCadStore((s) => s.tool);
  const setTool = useCadStore((s) => s.setTool);

  if (cadMode !== 'sketch') return null;

  const panOn = tool === 'pan';

  return (
    <div
      aria-label="Cụm nút cảm ứng (Sketch)"
      style={{
        position: 'absolute',
        left: 14,
        bottom: 14,
        zIndex: 22,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 5,
        borderRadius: 999,
        background: 'color-mix(in srgb, var(--panel) 78%, transparent)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,.22)',
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
      <span style={{ width: 1, height: 26, background: 'var(--border)', margin: '0 2px' }} />
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
        gap: 6,
        minWidth: TOUCH_MIN,
        height: TOUCH_MIN,
        padding: '0 12px',
        borderRadius: 999,
        border: 'none',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--t2)',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 600,
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
