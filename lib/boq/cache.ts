/**
 * lib/boq/cache.ts — BOQ v2 Việc 2 (02/08): "LIÊN KẾT SỐNG" cho BOQ, cùng tinh thần moat
 * `docs/SPEC-SEMANTIC-MODEL.md` §6 ("Sửa bản vẽ → mặt bằng trong deck tự cập nhật") — áp cho
 * BOQ thay vì Present: sửa vùng tô (diện tích hoặc vật liệu) → BOQ PHẢI tính lại đúng số, không
 * cắm 1 kết quả cũ. THUẦN (không React/DOM/Prisma) — test bằng sucrase-node như phần còn lại.
 *
 * VÌ SAO CÓ CACHE DÙ `computeBoq` RẺ (không network, chỉ vòng lặp mảng) — cache ở đây KHÔNG phải
 * để tiết kiệm CPU, mà để CÓ MỘT CƠ CHẾ PHÁT HIỆN THAY ĐỔI kiểm chứng được (test: sửa Doc → số
 * đổi đúng; không sửa → không tính lại thừa) — nền tảng cho khi `computeBoq` tốn hơn (Việc 3a mới
 * thêm phép kiểm chồng lấn O(n²)/vật liệu) hoặc khi route.ts (Việc 1) gọi lặp lại nhiều lần trong
 * 1 phiên làm việc.
 *
 * VÌ SAO Map TRONG BỘ NHỚ LÀ ĐỦ (không Redis/DB) — đã kiểm `docs/IF-CORE-SCHEMA.md` (Việc 65,
 * L1): app hiện là "Desktop đóng gói, KHÔNG đồng bộ" (Pha 1), 1 tiến trình Node chạy dài trên
 * MỘT máy — Map cấp module sống suốt phiên chạy server đó, không có vấn đề đa tiến trình/
 * serverless-cold-start như trên Vercel. Nếu sau này chuyển sang server nhiều tiến trình, thay
 * `cacheStore` bằng lớp lưu trữ khác — API 2 hàm dưới đây không cần đổi.
 */

import { computeBoq } from './compute';
import type { Doc, HatchEntity, BlockEntity } from '../cad/model';
import type { BoqResult, MaterialSpecLite } from './model';

/**
 * Fingerprint CHỈ từ field ẢNH HƯỞNG kết quả BOQ của mỗi vùng tô: id, specId, toạ độ đỉnh (quyết
 * định diện tích). CỐ TÌNH bỏ qua field không ảnh hưởng số (color, pattern, opacity, layer...) —
 * đổi màu hiển thị/pattern hatch KHÔNG được kích hoạt tính lại vô ích (đúng tinh thần §4 "màu ≠
 * vật liệu"). Sắp theo id trước khi nối chuỗi — thứ tự entities trong mảng đổi (xoá rồi vẽ lại
 * đúng y hệt, undo/redo...) không làm đổi fingerprint.
 *
 * 06/08 (G-M3-09): THÊM `BlockEntity` — từ khi `computeBoq` đếm món rời, thêm/bớt/gán mã cho 1 cái
 * ghế PHẢI làm BOQ tính lại. Bỏ sót chỗ này thì bug "báo giá thiếu âm thầm" quay lại dưới dạng
 * "báo giá cũ dính trong cache". Món rời KHÔNG lấy toạ độ vào dấu vân tay (di chuyển cái ghế không
 * đổi số lượng, không đổi tiền) — khác vùng tô, nơi toạ độ QUYẾT ĐỊNH diện tích.
 */
export function boqFingerprint(doc: Doc): string {
  const parts: string[] = [];
  for (const e of doc.entities) {
    if (e.type === 'hatch') {
      const h = e as HatchEntity;
      parts.push(`h:${h.id}|${h.specId ?? ''}|${h.points.map((p) => `${p.x},${p.y}`).join(';')}`);
    } else if (e.type === 'block') {
      const b = e as BlockEntity;
      parts.push(`b:${b.id}|${b.specId ?? ''}`);
    }
  }
  return parts.sort().join('\n');
}

/** Fingerprint riêng cho `specs[]` — giá/hao hụt đổi ở ProductSpec (vd sync lại từ ATLAS) cũng
 * phải kích hoạt tính lại, dù bản vẽ không đổi 1 nét nào. */
function specsFingerprint(specs: MaterialSpecLite[]): string {
  return specs
    .map((s) => `${s.id}|${s.priceVnd ?? ''}|${s.wastagePercent ?? ''}`)
    .sort()
    .join('\n');
}

interface CacheEntry {
  fingerprint: string;
  result: BoqResult;
}

const cacheStore = new Map<string, CacheEntry>();

export interface ComputeBoqCachedResult {
  result: BoqResult;
  /** true = dùng lại kết quả cũ (fingerprint không đổi); false = vừa tính lại (lần đầu, hoặc
   * fingerprint đổi, hoặc đã bị `invalidateBoqCache` xoá). */
  hit: boolean;
}

/**
 * Tính BOQ CÓ NHỚ theo `cacheKey` (caller tự chọn — vd `projectId` hoặc `sheetId`, để BOQ của
 * dự án A không đụng cache của dự án B). So fingerprint (Doc phần liên quan BOQ + specs) với lần
 * gọi trước CÙNG key: khớp → trả kết quả cũ (`hit: true`, KHÔNG gọi lại `computeBoq`); khác hoặc
 * chưa từng gọi → tính lại (`hit: false`), ghi đè cache.
 */
export function computeBoqCached(
  cacheKey: string,
  doc: Doc,
  specs: MaterialSpecLite[],
): ComputeBoqCachedResult {
  const fingerprint = `${boqFingerprint(doc)}\n---\n${specsFingerprint(specs)}`;
  const cached = cacheStore.get(cacheKey);
  if (cached && cached.fingerprint === fingerprint) {
    return { result: cached.result, hit: true };
  }
  const result = computeBoq(doc, specs);
  cacheStore.set(cacheKey, { fingerprint, result });
  return { result, hit: false };
}

/** Xoá cache 1 key — dùng khi biết chắc phải tính lại bất kể fingerprint (vd đóng dự án, người
 * dùng bấm "Tính lại" thủ công) hoặc trong test để không rò trạng thái giữa các case. */
export function invalidateBoqCache(cacheKey: string): void {
  cacheStore.delete(cacheKey);
}

/** CHỈ DÙNG TRONG TEST — xoá TOÀN BỘ cache (mọi key), tránh 1 test rò trạng thái sang test sau
 * khi chạy chung 1 tiến trình sucrase-node. */
export function __clearAllBoqCacheForTest(): void {
  cacheStore.clear();
}
