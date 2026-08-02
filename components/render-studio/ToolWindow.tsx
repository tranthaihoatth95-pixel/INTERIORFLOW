'use client';

/**
 * components/render-studio/ToolWindow.tsx — "tool window" (D3, `docs/CHOT-RENDER-TOOL-WINDOW-2026-08-01.md`
 * §1 mục 1): window LÀ node phóng to, không phải màn riêng — đóng/mở chỉ đổi CÁCH HIỂN THỊ của
 * CÙNG 1 trạng thái (`useToolModeUi`), không có bản sao. Portal vào `document.body` (khuôn
 * `Popover.tsx`, tránh bị `overflow:hidden` của ancestor bất kỳ cắt mất — xem §3 mục 2).
 *
 * Vật liệu khung đúng luật §2 "kính là VỎ, không bao giờ là RUỘT": vỏ (header + viền) kính mờ
 * backdrop-blur; RUỘT (nội dung `ToolModeForm` — ảnh/kết quả) sắc nét, KHÔNG blur/phủ màu — bọc
 * trong `position:relative` cỡ cố định để `ToolModeForm` (vốn tự `position:absolute;inset:0`,
 * viết cho màn TOÀN MÀN cũ) tự lấp KHÍT khung này thay vì lấp cả viewport — không cần sửa
 * `ToolModeForm.tsx`.
 *
 * 💭 GIỚI HẠN đợt này (ghi trong BAO-CAO-CHINH.md): 1 window/lượt (chưa làm 2-3 window +
 * tự thu cái cũ nhất §1 mục 3), KHÔNG kéo di chuyển được (định vị cố định dưới thanh tab), CHƯA
 * nối "⌗ mở subgraph" (không có khái niệm subgraph thật trong node graph hiện tại — nút đó ẩn).
 */

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Minus, X } from 'lucide-react';
import { useToolModeUi, useIsSmallScreenForCanvas } from '@/lib/render-studio/tool-mode-ui';
import { taskCardById } from '@/lib/render-studio/task-cards';
import ToolModeForm from './ToolModeForm';

export default function ToolWindow({ cardId }: { cardId: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const backToHome = useToolModeUi((s) => s.backToHome);
  const setSessionImageDataUrl = useToolModeUi((s) => s.setSessionImageDataUrl);
  const setSessionNodeRefs = useToolModeUi((s) => s.setSessionNodeRefs);
  const smallScreen = useIsSmallScreenForCanvas();
  const card = taskCardById(cardId);

  if (!mounted || !card) return null;

  // Màn ≤7 inch: window CHÍNH NÓ trở thành Tool Mode toàn màn cũ — cùng 1 code (`ToolModeForm`),
  // không dựng khung kính (§1 mục 4: "không nuôi hai giao diện"). `ToolModeForm` tự
  // `position:absolute;inset:0` sẵn — không cần bọc gì thêm.
  if (smallScreen) return createPortal(<ToolModeForm cardId={cardId} />, document.body);

  function handleClose() {
    backToHome();
    setSessionImageDataUrl(null);
    setSessionNodeRefs(null);
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: 78,
        transform: 'translateX(-50%)',
        zIndex: 31,
        width: 'min(1040px, 94vw)',
        height: 'min(720px, calc(100vh - 110px))',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
        background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{card.label}</p>
          <p style={{ fontSize: 11, color: 'var(--t3)' }}>{card.desc}</p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => backToHome()}
            title="Thu lại thành node nhỏ"
            aria-label="Thu lại"
            style={{ padding: 6, borderRadius: 8, color: 'var(--t3)' }}
          >
            <Minus size={14} />
          </button>
          <button type="button" onClick={handleClose} title="Đóng" aria-label="Đóng" style={{ padding: 6, borderRadius: 8, color: 'var(--t3)' }}>
            <X size={14} />
          </button>
        </div>
      </div>
      {/* RUỘT — sắc nét, không kính. `position:relative` cỡ khít để ToolModeForm (absolute;inset:0
          nguyên bản) lấp đúng khung này, không lấp viewport. */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, background: 'var(--bg)' }}>
        <ToolModeForm cardId={cardId} />
      </div>
    </div>,
    document.body,
  );
}
