'use client';

/**
 * lib/render-studio/use-scene3d.ts — MỘT nguồn tính `Scene3DData` từ Doc CAD (`docToObjScene` +
 * `toScene3DData`, `lib/three/cad-to-obj.ts`), dùng chung cho `Render3DModeSkeleton` (viewport) +
 * `Object3DTree`/`Object3DInspector` (Navigator/Inspector, sống ở ổ khác của `AppShell`) — tránh
 * 3 nơi tự chép cùng tham số `wallHeightMm`/`theme` rồi lệch nhau (bài học N2 `SO-KIEM-TONG.md`).
 * Doc vẫn là nguồn sự thật (K1 §6d) — hook chỉ là phép tính THUẦN lặp lại, không giữ bản sao.
 */
import { useEffect, useMemo, useState } from 'react';
import { useCadStore } from '@/lib/cad/store';
import { docToObjScene, toScene3DData, type Scene3DData } from '@/lib/three/cad-to-obj';

export function useScene3D(): Scene3DData | null {
  const doc = useCadStore((s) => s.doc);
  const cadScene = useMemo(() => {
    if (!doc.entities.length) return null;
    try {
      return toScene3DData(docToObjScene(doc, { wallHeightMm: 2700, theme: 'warm' }));
    } catch {
      return null; // Doc lỗi hình học — cây/panel tự hiện rỗng, không sập
    }
  }, [doc]);
  const [importedScenes, setImportedScenes] = useState<Scene3DData[]>([]);

  useEffect(() => {
    let cancelled = false;
    const sources = doc.model3dSources ?? [];
    if (!sources.length) {
      setImportedScenes([]);
      return () => { cancelled = true; };
    }
    void (async () => {
      const { dataUrlToArrayBuffer, parseGlb, parseGltfBundle } = await import('@/lib/three/glb-import');
      const parsed = await Promise.all(sources.map(async (source) => {
        try {
          const result = source.format === 'glb'
            ? await parseGlb(dataUrlToArrayBuffer(source.dataUrl))
            : await parseGltfBundle(
                new TextDecoder().decode(dataUrlToArrayBuffer(source.resources.find((resource) => resource.name === source.entryName)?.dataUrl ?? '')),
                source.resources.filter((resource) => resource.name !== source.entryName),
              );
          return {
            ...result.scene,
            groups: result.scene.groups.map((group, index) => ({
              ...group,
              name: `${source.name} · ${group.name || `Mesh ${index + 1}`}`,
            })),
          };
        } catch {
          return null;
        }
      }));
      if (!cancelled) setImportedScenes(parsed.filter((scene): scene is Scene3DData => scene !== null));
    })();
    return () => { cancelled = true; };
  }, [doc.model3dSources]);

  return useMemo(() => {
    const scenes = [...(cadScene ? [cadScene] : []), ...importedScenes];
    if (!scenes.length) return null;
    return {
      groups: scenes.flatMap((scene) => scene.groups),
      bboxMm: {
        minX: Math.min(...scenes.map((scene) => scene.bboxMm.minX)),
        minY: Math.min(...scenes.map((scene) => scene.bboxMm.minY)),
        maxX: Math.max(...scenes.map((scene) => scene.bboxMm.maxX)),
        maxY: Math.max(...scenes.map((scene) => scene.bboxMm.maxY)),
      },
      sizeM: {
        w: Math.max(...scenes.map((scene) => scene.sizeM.w)),
        d: Math.max(...scenes.map((scene) => scene.sizeM.d)),
        h: Math.max(...scenes.map((scene) => scene.sizeM.h)),
      },
    };
  }, [cadScene, importedScenes]);
}
