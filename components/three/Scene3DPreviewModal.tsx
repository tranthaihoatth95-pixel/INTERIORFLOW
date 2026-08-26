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
import { X, Box, Move3d } from 'lucide-react';
import { useDismissable } from '@/lib/useDismissable';
import type { Scene3DData } from '@/lib/three/cad-to-obj';
import type { Scene3DMode } from './Scene3DViewer';

const Scene3DViewer = dynamic(() => import('./Scene3DViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: 'var(--t3)', fontSize: 12 }}>
      Đang tải khung nhìn 3D…
    </div>
  ),
});

const MODE_HINT: Record<Extract<Scene3DMode, 'orbit' | 'massing'>, string> = {
  orbit: 'quan sát (orbit) — kéo chuột xoay, cuộn để zoom. Xám trơn, chưa vật liệu/ánh sáng.',
  massing: 'đẩy-kéo khối (3D-5) — bấm giữ MẶT TRÊN 1 tường, kéo lên/xuống đổi cao độ, thả để ghi vào bản vẽ. Tường khác không đổi.',
};

export function Scene3DPreviewModal({
  open,
  onClose,
  scene,
  onPushPull,
}: {
  open: boolean;
  onClose: () => void;
  scene: Scene3DData | null;
  /** 3D-5 — có prop này mới hiện nút chuyển sang "Đẩy-kéo khối"; thiếu → chỉ orbit như cũ (nơi
   * gọi chưa nối Doc thật, vd bench/demo). */
  onPushPull?: (entityId: string, newHeightMm: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Extract<Scene3DMode, 'orbit' | 'massing'>>('orbit');
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) setMode('orbit'); // đóng modal → lần mở sau về orbit, không kẹt ở chế độ chỉnh
  }, [open]);
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
          borderRadius: 14,
          border: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border-strong)' }}>
          <p style={{ fontSize: 12, color: 'var(--t2)', flex: 1 }}>Xem 3D · {MODE_HINT[mode]}</p>
          {onPushPull && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button
                className="nodrag"
                onClick={() => setMode('orbit')}
                aria-pressed={mode === 'orbit'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, fontSize: 11,
                  border: '1px solid var(--border-strong)',
                  color: mode === 'orbit' ? 'var(--bg)' : 'var(--t2)',
                  background: mode === 'orbit' ? 'var(--t1)' : 'transparent',
                }}
              >
                <Box size={14} /> Quan sát
              </button>
              <button
                className="nodrag"
                onClick={() => setMode('massing')}
                aria-pressed={mode === 'massing'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, fontSize: 11,
                  border: '1px solid var(--border-strong)',
                  color: mode === 'massing' ? 'var(--bg)' : 'var(--t2)',
                  background: mode === 'massing' ? 'var(--t1)' : 'transparent',
                }}
              >
                <Move3d size={14} /> Đẩy-kéo khối
              </button>
            </div>
          )}
          <button className="nodrag" onClick={onClose} style={{ padding: 4, borderRadius: 6, color: 'var(--t3)' }} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Scene3DViewer scene={scene} mode={mode} onPushPull={onPushPull} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
