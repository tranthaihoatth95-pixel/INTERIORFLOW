/**
 * lib/dna/types.ts — `DesignDnaCard` (Thẻ DNA Thiết kế), mặt tiền DỰ ÁN của `DistillEngine`
 * (phiếu `docs/phieu-giao/dna-card.md` ④.2).
 *
 * 8 LỚP lấy ĐÚNG NGUYÊN VĂN từ `docs/NC-KTS-SANPHAM-IF-2026-08-11.md:53`:
 *   "ý đồ·ảnh có nguồn·ngôn ngữ không gian·màu+tỷ lệ·vật liệu matId·ánh sáng·khung hình·
 *    ràng buộc/độ tin" — KHÔNG tự chế thêm/bớt lớp nào.
 *
 * N thẻ / dự án (mỗi phương án một Thẻ DNA, `docs/00-CHOT.md` [07/08] + NC-KTS §5) — vì vậy
 * `DesignDnaCard` có `id` + `name` riêng, không phải 1-thẻ-1-dự-án.
 *
 * Luật 12.3 (áp cứng vào kiểu): KHÔNG có trường điểm số (không "7/10"), KHÔNG có trường xu
 * hướng không dẫn nguồn — mọi lớp đều là `DistilledField<string>` (mô tả + nguồn + trạng
 * thái), không phải con số chấm điểm.
 */

import type { DistilledField } from '../distill/types';
import { emptyField } from '../distill/types';

/** Thứ tự CHUẨN của 8 lớp — dùng cho UI lặp `DNA_LAYER_KEYS.map(...)` để không lệch thứ tự
 * giữa các nơi hiển thị. */
export const DNA_LAYER_KEYS = [
  'yDo',
  'anhNguon',
  'ngonNguKhongGian',
  'mauTyLe',
  'vatLieuMatId',
  'anhSang',
  'khungHinh',
  'rangBuocDoTin',
] as const;

export type DnaLayerKey = (typeof DNA_LAYER_KEYS)[number];

export const DNA_LAYER_LABEL: Record<DnaLayerKey, { vi: string; en: string }> = {
  yDo: { vi: 'Ý đồ', en: 'Design intent' },
  anhNguon: { vi: 'Ảnh có nguồn', en: 'Sourced images' },
  ngonNguKhongGian: { vi: 'Ngôn ngữ không gian', en: 'Spatial language' },
  mauTyLe: { vi: 'Màu + tỷ lệ', en: 'Color & proportion' },
  vatLieuMatId: { vi: 'Vật liệu (matId)', en: 'Materials (matId)' },
  anhSang: { vi: 'Ánh sáng', en: 'Lighting' },
  khungHinh: { vi: 'Khung hình', en: 'Framing' },
  rangBuocDoTin: { vi: 'Ràng buộc / độ tin', en: 'Constraints / confidence' },
};

export type DesignDnaLayers = Record<DnaLayerKey, DistilledField<string>>;

export interface DesignDnaCard {
  id: string;
  projectId: string;
  /** tên phương án — bắt buộc phân biệt khi N thẻ / dự án. */
  name: string;
  createdAt: string;
  updatedAt: string;
  layers: DesignDnaLayers;
}

export function emptyDnaLayers(): DesignDnaLayers {
  const out = {} as DesignDnaLayers;
  for (const k of DNA_LAYER_KEYS) out[k] = emptyField();
  return out;
}

export function newDnaCard(projectId: string, name: string, now: string = new Date().toISOString()): DesignDnaCard {
  return {
    id: `dna_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
    projectId,
    name,
    createdAt: now,
    updatedAt: now,
    layers: emptyDnaLayers(),
  };
}

/** Kiểm hợp lệ tối thiểu — dùng ở tầng API trước khi ghi (không tin dữ liệu từ client). */
export function isDesignDnaCard(x: unknown): x is DesignDnaCard {
  if (!x || typeof x !== 'object') return false;
  const c = x as Record<string, unknown>;
  if (typeof c.id !== 'string' || !c.id) return false;
  if (typeof c.projectId !== 'string' || !c.projectId) return false;
  if (typeof c.name !== 'string') return false;
  if (typeof c.createdAt !== 'string' || typeof c.updatedAt !== 'string') return false;
  if (!c.layers || typeof c.layers !== 'object') return false;
  const layers = c.layers as Record<string, unknown>;
  for (const k of DNA_LAYER_KEYS) {
    const f = layers[k] as { values?: unknown; trangThai?: unknown; nguon?: unknown } | undefined;
    if (!f || !Array.isArray(f.values) || !Array.isArray(f.nguon)) return false;
    if (f.trangThai !== 'measured' && f.trangThai !== 'inferred' && f.trangThai !== 'verified') return false;
  }
  return true;
}
