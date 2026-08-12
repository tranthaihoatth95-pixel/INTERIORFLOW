'use client';

/**
 * lib/library/gallery-data.ts — nguồn dữ liệu THẬT cho Gallery liên ngành (K · 12/08).
 *
 * Đọc `GET /api/library` (route đã có, cùng đường `lib/library/db-items.ts` dùng cho kệ Thư
 * viện — KHÔNG thêm route, KHÔNG thêm cột DB). Gallery chỉ là MẶT TIỀN TUYỂN CHỌN khác trên
 * CÙNG một kho `LibraryAsset`: đọc nguyên `tags` rồi giải mã qua `gallery-tags.ts`.
 */

import { useCallback, useEffect, useState } from 'react';
import { imgIdFromKey } from '../img-id';
import {
  canJoinCollection,
  parseGalleryTags,
  type GalleryIndustry,
  type GalleryLicense,
} from './gallery-tags';

/** Trường mình dùng từ payload `GET /api/library` (route trả nhiều hơn — chỉ khai phần cần,
 * cùng quy ước tối thiểu-hoá của `LibraryApiAsset` trong `db-items.ts`). */
interface GalleryApiAsset {
  id: string;
  imgId?: string;
  name: string;
  category: string;
  tags: string;
  caption?: string;
  url: string;
  mine?: boolean;
}

export interface GalleryAsset {
  /** id gốc `LibraryAsset.id` — dùng cho `key` React + sự kiện nội bộ. */
  id: string;
  /** id ảnh chuẩn không gian `img_` — đây là thứ "Dùng cho moodboard/Thẻ DNA" phải copy (VIỆC 5). */
  imgId: string;
  name: string;
  category: string;
  caption: string;
  url: string;
  mine: boolean;
  nganh: GalleryIndustry | null;
  license: GalleryLicense | null;
  nguon: string | null;
  bosuutap: string[];
  /** Đủ nguồn + giấy phép để vào bộ sưu tập xu hướng (VIỆC 3) — tính sẵn 1 lần, mọi nơi dùng lại. */
  hasSource: boolean;
}

function mapAsset(a: GalleryApiAsset): GalleryAsset {
  const info = parseGalleryTags(a.tags ?? '');
  return {
    id: a.id,
    imgId: a.imgId ?? imgIdFromKey(a.id),
    name: a.name,
    category: a.category,
    caption: a.caption ?? '',
    url: a.url,
    mine: !!a.mine,
    nganh: info.nganh,
    license: info.license,
    nguon: info.nguon,
    bosuutap: info.bosuutap,
    hasSource: canJoinCollection(info),
  };
}

/** Chỉ ảnh (raster) mới hợp Gallery — kho `LibraryAsset` hiện chỉ nhận ảnh khi POST
 * (`app/api/library/route.ts` whitelist MIME raster), nhưng lọc lại ở đây cho chắc: `usage` khác
 * không liên quan (vd tương lai có loại phi-ảnh) không lẫn vào lưới ảnh. */
export function useGalleryAssets(): { assets: GalleryAsset[]; loaded: boolean; error: boolean; refresh: () => void } {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setError(false);
    fetch('/api/library')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.assets) ? (data.assets as GalleryApiAsset[]) : [];
        setAssets(list.map(mapAsset));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { assets, loaded, error, refresh };
}

export interface IndustryGroup {
  id: GalleryIndustry;
  items: GalleryAsset[];
}

/** Gom theo nhóm ngành, GIỮ THỨ TỰ `GALLERY_INDUSTRIES` (không tự sắp theo số lượng — ổn định
 * giữa các lần render). Ảnh chưa gắn `nganh:` KHÔNG rơi vào nhóm nào — gọi `ungroupedOf()` riêng,
 * không đoán bừa để lấp cho đủ nhóm (N4). */
export function groupByIndustry(assets: GalleryAsset[], order: GalleryIndustry[]): IndustryGroup[] {
  return order
    .map((id) => ({ id, items: assets.filter((a) => a.nganh === id) }))
    .filter((g) => g.items.length > 0);
}

export function ungroupedOf(assets: GalleryAsset[]): GalleryAsset[] {
  return assets.filter((a) => a.nganh === null);
}

export interface GalleryCollection {
  slug: string;
  items: GalleryAsset[];
}

/** Bộ sưu tập xu hướng — gom theo `bosuutap:<slug>`, CHỈ tính ảnh `hasSource` (VIỆC 3: thiếu
 * nguồn/giấy phép thì tag `bosuutap:` trên nó bị bỏ qua, không lách được luật bằng cách gắn
 * thêm tag bộ sưu tập). Bộ sưu tập rỗng sau lọc thì không xuất hiện. */
export function collectionsFrom(assets: GalleryAsset[]): GalleryCollection[] {
  const bySlug = new Map<string, GalleryAsset[]>();
  for (const a of assets) {
    if (!a.hasSource) continue;
    for (const slug of a.bosuutap) {
      const list = bySlug.get(slug) ?? [];
      list.push(a);
      bySlug.set(slug, list);
    }
  }
  return Array.from(bySlug.entries())
    .map(([slug, items]) => ({ slug, items }))
    .sort((x, y) => y.items.length - x.items.length);
}

/** Nhãn hiển thị cho slug bộ sưu tập — `anh-sang-tu-nhien` → "Ánh sáng tự nhiên" kiểu Title Case
 * đơn giản (thay dấu gạch bằng khoảng trắng). Không phải bảng dịch — slug tiếng Việt không dấu là
 * lossy nên đây chỉ là fallback hiển thị được, không phải bản dịch chuẩn. */
export function collectionLabel(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
