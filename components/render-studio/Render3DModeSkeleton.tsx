'use client';

/**
 * components/render-studio/Render3DModeSkeleton.tsx — nội dung mode "Vẽ 3D" của chặng Render
 * (H1, `docs/SPEC-MODE-PER-STAGE.md` §1: "Render + Mood + Collab ↔ Vẽ 3D — dựng khối 3D"). Đúng
 * luật "mode = đổi CẢ shell": thay hẳn node canvas 2D bằng khung nhìn 3D toàn màn.
 *
 * SKELETON có chủ đích (`docs/TICKET-UI-HATANG-2026-08-02.md` "chưa cần đủ nội dung từng mode")
 * NHƯNG không phải stub giả — tái dùng THẲNG hạ tầng 3D đã có (3D-1..3D-5, `SPEC-3D-CORE.md`):
 * `docToObjScene(doc)` (Doc chặng 1, CÙNG dữ liệu node "Bản vẽ → 3D" dùng) → `Scene3DViewer` mode
 * `massing` — xem VÀ đẩy-kéo khối cơ bản được ngay, không phải chỉ xem tĩnh. B2-B4 (cấu kiện
 * ngữ nghĩa/IFC/va chạm) CHƯA làm — đúng thứ tự bậc thang `CHOT-HUONG-3D-2026-08-01.md` §2.
 */

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Box } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { docToObjScene, toScene3DData } from '@/lib/three/cad-to-obj';

const Scene3DViewer = dynamic(() => import('@/components/three/Scene3DViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: 'var(--t3)', fontSize: 12 }}>Đang tải khung nhìn 3D…</div>
  ),
});

export default function Render3DModeSkeleton() {
  const doc = useCadStore((s) => s.doc);

  const scene = useMemo(() => {
    if (!doc.entities.length) return null;
    try {
      return toScene3DData(docToObjScene(doc, { wallHeightMm: 2700, theme: 'warm' }));
    } catch {
      return null; // Doc trống/lỗi hình học — rơi về hint thay vì crash cả mode
    }
  }, [doc]);

  // `updateEntities` tạo Doc object MỚI trong store (xem lib/cad/store.ts) → `doc` ở trên tự đổi
  // reference → `scene` useMemo tự tính lại → Scene3DViewer tự dựng lại từ Doc MỚI. Không cần
  // ép remount tay (đúng luật một nguồn: Doc luôn là nguồn, không giữ bản 3D riêng).
  function handlePushPull(entityId: string, newHeightMm: number) {
    const store = useCadStore.getState();
    const entity = store.doc.entities.find((e) => e.id === entityId);
    if (!entity) return;
    store.updateEntities([{ ...entity, heightMm: newHeightMm }]);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg)' }}>
      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 12,
          zIndex: 20,
          maxWidth: 320,
          padding: '8px 12px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'color-mix(in srgb, var(--panel) 90%, transparent)',
          backdropFilter: 'blur(14px)',
          fontSize: 11,
          color: 'var(--t3)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
        }}
      >
        <Box size={13} style={{ marginTop: 1, flexShrink: 0 }} color="var(--accent)" />
        <span>Khối đùn từ bản vẽ CAD (chặng 1) — kéo MẶT TRÊN 1 tường để đổi cao độ, ghi thẳng vào Doc. Cấu kiện/IFC (B2-B4) chưa làm.</span>
      </div>
      {!scene ? (
        <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: 'var(--t3)', fontSize: 12, textAlign: 'center', padding: 24 }}>
          Chưa có bản vẽ — mở chặng CAD, vẽ tường (lệnh W) rồi quay lại đây.
        </div>
      ) : (
        <Scene3DViewer scene={scene} mode="massing" onPushPull={handlePushPull} />
      )}
    </div>
  );
}
