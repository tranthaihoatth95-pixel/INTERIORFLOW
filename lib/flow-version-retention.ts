/**
 * lib/flow-version-retention.ts — thang lưu giữ cho `FlowVersion` (④ đổi cò, 01/08,
 * docs/QUYET-DINH-HA-TANG-2026-07-31.md §④ phương án C).
 *
 * "ĐỪNG nghĩ khuôn mới" (ghi chú của Hoà ở §⑥ cùng file quyết định) — dùng LẠI đúng bậc thang
 * `RETENTION_TIERS` của `lib/cad/backup-diff.ts` (giữ mọi bản trong 1h → 1 bản/giờ trong 24h →
 * 1 bản/ngày trong 30 ngày → 1 bản/tuần sau đó). KHÔNG dùng lại `planRetention()` nguyên khối của
 * file đó — hàm đó còn xử lý chuỗi diff/full phải "đúc lại" (materialize) trước khi xoá, một vấn
 * đề CHỈ tồn tại vì backup CAD lưu diff xen kẽ full trên đĩa để tiết kiệm dung lượng. Mỗi hàng
 * `FlowVersion` đã LÀ `graphJson` đầy đủ (không có khái niệm diff) — nên chỉ cần bước 1 (quyết
 * GIỮ/XOÁ theo bucket), không cần bước đúc lại.
 */
import { RETENTION_TIERS } from './cad/backup-diff';

export interface FlowVersionEntry {
  id: string;
  createdAtMs: number;
}

/** Khoá gộp nhóm cho 1 mốc thời gian — giống hệt `bucketKey` của backup-diff.ts (không export ở
 * đó nên lặp lại phần NGẮN này thay vì import cả module CAD-only vào 1 route API server-side). */
function bucketKey(timestampMs: number, nowMs: number): string | null {
  const age = nowMs - timestampMs;
  if (age < RETENTION_TIERS.keepAllWithinMs) return null;
  const d = new Date(timestampMs);
  if (age < RETENTION_TIERS.hourlyWithinMs) return `h:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
  if (age < RETENTION_TIERS.dailyWithinMs) return `d:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  return `w:${Math.floor(timestampMs / (7 * 24 * 60 * 60 * 1000))}`;
}

/**
 * Lập kế hoạch tỉa — THUẦN, không đụng DB. Trả về id các `FlowVersion` PHẢI xoá; mọi id không có
 * trong danh sách này là GIỮ. Bản mới nhất luôn giữ, an toàn tuyệt đối (dù nowMs truyền sai).
 */
export function planFlowVersionRetention(entries: FlowVersionEntry[], nowMs: number): string[] {
  const sorted = [...entries].sort((a, b) => a.createdAtMs - b.createdAtMs);
  const keep = new Array<boolean>(sorted.length).fill(false);
  const latestIndexByBucket = new Map<string, number>();
  sorted.forEach((e, i) => {
    const key = bucketKey(e.createdAtMs, nowMs);
    if (key === null) {
      keep[i] = true;
      return;
    }
    const cur = latestIndexByBucket.get(key);
    if (cur === undefined || sorted[cur].createdAtMs < e.createdAtMs) latestIndexByBucket.set(key, i);
  });
  for (const i of latestIndexByBucket.values()) keep[i] = true;
  if (sorted.length) keep[sorted.length - 1] = true;
  return sorted.filter((_, i) => !keep[i]).map((e) => e.id);
}
