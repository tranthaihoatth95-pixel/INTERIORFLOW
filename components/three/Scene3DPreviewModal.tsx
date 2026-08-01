'use client';

/**
 * components/three/Scene3DPreviewModal.tsx — modal "Xem 3D" mở từ node `three.cad2fbx`
 * (NodeExtras.tsx). Portal thẳng ra document.body (cùng lý do SketchStudioModal — node cha là
 * motion.div có transform, `position:fixed` bên trong sẽ bị giam nếu không portal).
 *
 * `Scene3DViewer` nặng (~170KB gzip `three`) — mount qua `next/dynamic(..., { ssr:false })` NGAY
 * TẠI ĐÂY, không phải nơi gọi, để nút "Xem 3D" tự nó là ranh giới code-split (mở modal mới tải
 * three, đúng quyết định #1 SPEC-3D-CORE.md).
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import { useDismissable } from '@/lib/useDismissable';
import type { Scene3DData } from '@/lib/three/cad-to-obj';

const Scene3DViewer = dynamic(() => import('./Scene3DViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: 'var(--t3)', fontSize: 12 }}>
      Đang tải khung nhìn 3D…
    </div>
  ),
});

export function Scene3DPreviewModal({ open, onClose, scene }: { open: boolean; onClose: () => void; scene: Scene3DData | null }) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  useDismissable({ open, onDismiss: onClose, refs: [panelRef], outside: true });

  if (!mounted || !open || !scene) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
    >
      <div
        ref={panelRef}
        style={{
          width: 'min(1100px, 92vw)',
          height: 'min(720px, 86vh)',
          background: 'var(--bg)',
          borderRadius: 12,
          border: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border-strong)' }}>
          <p style={{ fontSize: 12, color: 'var(--t2)' }}>
            Xem 3D · quan sát (orbit) — kéo chuột xoay, cuộn để zoom. Xám trơn, chưa vật liệu/ánh sáng.
          </p>
          <button className="nodrag" onClick={onClose} style={{ padding: 4, borderRadius: 6, color: 'var(--t3)' }} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Scene3DViewer scene={scene} mode="orbit" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
