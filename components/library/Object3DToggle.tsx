'use client';

/**
 * components/library/Object3DToggle.tsx — nút bật/tắt cửa sổ `Object3DWindow` gắn trên MỘT thẻ
 * asset của Thư viện (phiếu `docs/phieu-giao/ghe-3d-window-app.md`, việc 3). Hoà: "cho phép tắt
 * mở ô" — mặc định TẮT (`useState(false)`), không tự mở khi vào trang.
 *
 * Render bên trong `.th` (ô xem trước, `position:relative`) — CHÍNH thẻ `.it` bao ngoài đã là
 * `<button>` (LibrarySheet.tsx), nên nút này KHÔNG được là `<button>` lồng trong `<button>` (HTML
 * cấm interactive-content-trong-interactive-content; React vẫn "vẽ" được nhưng click bubble kép +
 * a11y sai). Dùng `<span role="button">` bàn phím đủ (Enter/Space) + `draggable={false}` (chặn kéo
 * bị ăn theo `draggable` của thẻ cha) + `stopPropagation` mọi sự kiện chuột để không kích hoạt
 * chọn/dùng món của thẻ cha.
 */

import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useT } from '@/lib/i18n';
import Object3DWindow from './Object3DWindow';

export interface Object3DToggleProps {
  title: string;
  subtitle?: string;
  glbUrl: string;
  mtlUrl?: string;
}

export function Object3DToggle({ title, subtitle, glbUrl, mtlUrl }: Object3DToggleProps) {
  const [open, setOpen] = useState(false);
  const tr = useT();

  const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation();

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        draggable={false}
        aria-pressed={open}
        className="obj3d-toggle"
        title={open ? tr('Đóng xem 3D', 'Close 3D view') : tr('Xem 3D', 'View 3D')}
        onMouseDown={stop}
        onPointerDown={stop}
        onDoubleClick={stop}
        onClick={(e) => {
          stop(e);
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            stop(e);
            setOpen((v) => !v);
          }
        }}
      >
        {open ? <EyeOff size={14} strokeWidth={1.5} aria-hidden /> : <Eye size={14} strokeWidth={1.5} aria-hidden />}
        {tr('Xem 3D', 'View 3D')}
      </span>
      <Object3DWindow open={open} onOpenChange={setOpen} glbUrl={glbUrl} mtlUrl={mtlUrl} title={title} subtitle={subtitle} />
    </>
  );
}
