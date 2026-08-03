'use client';

/**
 * lib/render-studio/use-scene3d.ts — MỘT nguồn tính `Scene3DData` từ Doc CAD (`docToObjScene` +
 * `toScene3DData`, `lib/three/cad-to-obj.ts`), dùng chung cho `Render3DModeSkeleton` (viewport) +
 * `Object3DTree`/`Object3DInspector` (Navigator/Inspector, sống ở ổ khác của `AppShell`) — tránh
 * 3 nơi tự chép cùng tham số `wallHeightMm`/`theme` rồi lệch nhau (bài học N2 `SO-KIEM-TONG.md`).
 * Doc vẫn là nguồn sự thật (K1 §6d) — hook chỉ là phép tính THUẦN lặp lại, không giữ bản sao.
 */
import { useMemo } from 'react';
import { useCadStore } from '@/lib/cad/store';
import { docToObjScene, toScene3DData, type Scene3DData } from '@/lib/three/cad-to-obj';

export function useScene3D(): Scene3DData | null {
  const doc = useCadStore((s) => s.doc);
  return useMemo(() => {
    if (!doc.entities.length) return null;
    try {
      return toScene3DData(docToObjScene(doc, { wallHeightMm: 2700, theme: 'warm' }));
    } catch {
      return null; // Doc lỗi hình học — cây/panel tự hiện rỗng, không sập
    }
  }, [doc]);
}
