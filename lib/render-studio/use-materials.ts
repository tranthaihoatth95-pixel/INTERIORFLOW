'use client';

/**
 * lib/render-studio/use-materials.ts — nguồn matId THẬT dùng chung cho mọi nơi cần danh sách vật
 * liệu (`GET /api/specs?kind=material`, `ProductSpec` ATLAS — KHÔNG phải `MaterialDef` thị giác
 * của CAD). Tách ra từ `NodeLibraryPanel.tsx` (G2 phần (5)) khi `Command3DPanel.tsx` (G3 phần (1),
 * tab "Vật liệu") cần đúng NGUỒN DỮ LIỆU này — tránh copy-paste 2 lần cùng 1 fetch.
 */
import { useEffect, useState } from 'react';

export interface MaterialSpecLite {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  colorHex: string | null;
  priceNote: string | null;
}

/** Fetch 1 lần khi `enabled` bật (không poll — vật liệu đổi chậm, cùng lý do đã ghi ở phần (5)). */
export function useMaterials(enabled: boolean): MaterialSpecLite[] {
  const [materials, setMaterials] = useState<MaterialSpecLite[]>([]);
  useEffect(() => {
    if (!enabled) return;
    fetch('/api/specs?kind=material')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMaterials(data?.specs ?? []))
      .catch(() => {});
  }, [enabled]);
  return materials;
}
