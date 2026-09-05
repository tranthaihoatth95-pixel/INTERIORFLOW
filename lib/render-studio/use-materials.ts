'use client';

/**
 * lib/render-studio/use-materials.ts — nguồn matId THẬT dùng chung cho mọi nơi cần danh sách vật
 * liệu (`GET /api/specs?kind=material`, `ProductSpec` ATLAS — KHÔNG phải `MaterialDef` thị giác
 * của CAD). Tách ra từ `NodeLibraryPanel.tsx` (G2 phần (5)) khi `Command3DPanel.tsx` (G3 phần (1),
 * tab "Vật liệu") cần đúng NGUỒN DỮ LIỆU này — tránh copy-paste 2 lần cùng 1 fetch.
 */
import { useEffect, useState } from 'react';
import { tronHatGiong } from '@/lib/materials/kho-mo-dau';

export interface MaterialSpecLite {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  colorHex: string | null;
  priceNote: string | null;
}

/**
 * Fetch 1 lần khi `enabled` bật (không poll — vật liệu đổi chậm, cùng lý do đã ghi ở phần (5)).
 *
 * 🔴 SỬA 05/09 (`[3D-VL-01]`, tìm được khi nối đường gán vật liệu) — **CHẶNG 3D LÀ MẶT TIỀN DUY
 * NHẤT KHÔNG TRỘN VẬT LIỆU HẠT GIỐNG.** Đo tại nguồn: ba mặt tiền kia đều gọi hàm trộn —
 * `components/materials/MaterialsScreen.tsx:134` (`tronHatGiong`), `components/cad/MaterialPalette.tsx:90`
 * (`tronPickHatGiong`), `app/files/_components/NganPhanTho.tsx:133` (`tronHatGiong`) — còn hook
 * này đọc THẲNG `/api/specs` không qua bước trộn. Hệ quả trên máy sạch (đo thật: `GET
 * /api/specs?kind=material` → `count 0`): hai vật liệu ĐI KÈM BẢN CÀI (`lib/materials/hat-giong.ts`
 * — Gỗ sồi tự nhiên · Gỗ óc chó) **không tồn tại với chặng 3D**, nên panel Vật liệu không bao giờ
 * tra ra tên dù entity đã mang đúng `specId`.
 *
 * Trộn ở đây = mặt tiền THỨ TƯ của cùng một cỗ máy, KHÔNG phải nguồn thứ hai: cùng `tronHatGiong`,
 * cùng luật nhường (dòng DB thắng khi trùng `matId`).
 */
export function useMaterials(enabled: boolean): MaterialSpecLite[] {
  const [materials, setMaterials] = useState<MaterialSpecLite[]>(() => tronHatGiong(null));
  useEffect(() => {
    if (!enabled) return;
    fetch('/api/specs?kind=material')
      .then((r) => (r.ok ? r.json() : null))
      // Fetch hỏng ⇒ `data?.specs` undefined ⇒ vẫn còn dòng hạt giống, KHÔNG rơi về rỗng:
      // vật liệu đi kèm bản cài có mặt kể cả khi offline/API lỗi (đúng vai "nền của kho").
      .then((data) => setMaterials(tronHatGiong(data?.specs ?? null)))
      .catch(() => setMaterials(tronHatGiong(null)));
  }, [enabled]);
  return materials;
}
