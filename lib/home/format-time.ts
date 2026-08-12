/**
 * lib/home/format-time.ts — [marker: DongStudio] MỘT hàm format thời gian tương đối dùng
 * chung cho toàn Home (phiếu docs/phieu-giao/home-dong-studio-v2.md, việc ④.3 — "Mọi timestamp
 * qua MỘT hàm format, hết cảnh 'vừa' ↔ '3 ngày trước' cho CÙNG một sự kiện").
 *
 * Trước 13/08 v2: `components/home/widgets/NewsFeed.tsx` và `components/ProjectSelect.tsx`
 * MỖI FILE tự định nghĩa một `timeAgo()` riêng, lệch nấc (bản NewsFeed dừng ở "ngày", bản
 * ProjectSelect có thêm nấc "tháng") — hai nơi hiển thị CÙNG MỘT loại timestamp
 * (`Flow.updatedAt`) ra hai cách đọc khác nhau. Gộp về đây, cả hai import lại.
 *
 * THUẦN — không Date.now() ngầm khi test (nhận `now` tuỳ chọn để test xuyên thời gian).
 */

/** "2 giờ trước" / "2h ago" — nấc phút→giờ→ngày→tháng, không throw với ISO hỏng. */
export function timeAgo(iso: string, en: boolean, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return en ? 'just now' : 'vừa xong';
  const min = Math.floor(diff / 60_000);
  if (min < 1) return en ? 'just now' : 'vừa xong';
  if (min < 60) return en ? `${min}m ago` : `${min} phút trước`;
  const h = Math.floor(min / 60);
  if (h < 24) return en ? `${h}h ago` : `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return en ? (d === 1 ? '1 day ago' : `${d} days ago`) : `${d} ngày trước`;
  const mo = Math.floor(d / 30);
  return en ? (mo === 1 ? '1 month ago' : `${mo} months ago`) : `${mo} tháng trước`;
}
