/**
 * lib/home/weekly-picks.ts — [marker: DongStudio v3] chọn LỰA TẤT ĐỊNH cho 2 widget "sáng tạo"
 * mới của Home BENTO v3 (phiếu docs/phieu-giao/home-bento-v3.md, việc ④.2 ô D "Ảnh đẹp tuần
 * này" + ô H "Vật liệu của tuần"). THUẦN — không import React/DOM/Prisma, chạy được
 * `sucrase-node` trực tiếp.
 *
 * ⚠️ "tất định" nghĩa là CÙNG một danh sách + CÙNG một tuần → LUÔN ra đúng 1 kết quả, không
 * đổi giữa các lần tải lại trang (khác random — phiếu ④.2 nói rõ "chọn tất định theo số tuần,
 * KHÔNG random"). Đổi index theo TUẦN (không phải theo ngày) để một tuần chỉ thấy một vật liệu.
 */

/**
 * Số tuần ISO-8601 (1-53) của một ngày — thuật toán chuẩn (thứ Năm của tuần quyết định số tuần,
 * tuần bắt đầu thứ Hai). Thuần, không phụ thuộc múi giờ ngoài giờ ĐỊA PHƯƠNG của `date`.
 */
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO: thứ Hai = 1 … Chủ Nhật = 7
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // nhảy tới thứ Năm của tuần này
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Chọn 1 phần tử TẤT ĐỊNH theo số tuần ISO của `now` — cùng tuần luôn ra cùng phần tử, đổi tuần
 * mới đổi (kiểu "vật liệu của tuần"). Danh sách rỗng → null (widget tự ẩn, không bịa).
 */
export function pickWeeklyItem<T>(items: readonly T[], now: Date): T | null {
  if (items.length === 0) return null;
  const w = isoWeekNumber(now);
  return items[w % items.length];
}

/**
 * Lọc 1 danh sách theo trường `usage` (quy ước sẵn có ở `LibraryAsset.usage`, xem
 * `app/api/library/route.ts` — 'ref-render' | 'slide' | 'material' | ...), giữ NGUYÊN thứ tự
 * gốc (API `/api/library` đã sort `createdAt desc` ở server — mảng vào đây đã là "mới nhất
 * trước") rồi cắt còn `limit`. Đây là hàm THUẦN cho ô D "Ảnh đẹp tuần này": không có trường
 * `createdAt` trả về từ `/api/library` (route đó NGOÀI vùng file được sửa của phiếu này) nên
 * KHÔNG lọc cứng theo mốc lịch 7 ngày — dựa vào thứ tự đã sort sẵn, xấp xỉ "gần đây" trung thực
 * hơn là bịa ra một mốc ngày không có dữ liệu hậu thuẫn.
 */
export function pickWeeklyImages<T extends { usage?: string | null }>(
  items: readonly T[],
  usage: string,
  limit = 6,
): T[] {
  return items.filter((it) => it.usage === usage).slice(0, Math.max(0, limit));
}

/**
 * v3 (13/08, chỉ đạo gu giữa phiên `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md`) — ô H
 * "Vật liệu của tuần" PHẢI lên QUẢ CẦU vật liệu (`components/three/MaterialSphere.tsx`, engine
 * đã có — tái dùng, không viết render riêng), không phải swatch phẳng. Cầu cần một `PreviewKind`
 * ('wood'|'stone'|'metal'|'paint'|'fabric'|'glass') nhưng `LibraryAsset` (`/api/library`) chỉ có
 * `category`/`tags` dạng chuỗi tự do — hàm THUẦN này đoán loại từ từ khoá VI/EN, mặc định 'paint'
 * khi không khớp gì (an toàn, không throw). Không sửa `lib/library/thumb-kinds.ts` (ngoài vùng
 * file) — hàm này chỉ trả `PreviewKind`, phần tô màu/`tintFor` gọi thẳng file gốc ở nơi dùng.
 */
const KIND_KEYWORDS: { kind: 'wood' | 'stone' | 'metal' | 'paint' | 'fabric' | 'glass'; re: RegExp }[] = [
  { kind: 'wood', re: /(gỗ|go\b|wood|oak|walnut|sồi|oc cho|óc chó|veneer)/i },
  { kind: 'stone', re: /(đá|da\b|stone|marble|granite|đá mài|terrazzo)/i },
  { kind: 'metal', re: /(kim loại|kim loai|metal|thép|thep|steel|đồng|dong|brass|nhôm|nhom|aluminum)/i },
  { kind: 'fabric', re: /(vải|vai\b|fabric|linen|lanh|len|wool|nỉ|ni\b|cotton)/i },
  { kind: 'glass', re: /(kính|kinh\b|glass|gương|guong)/i },
  { kind: 'paint', re: /(sơn|son\b|paint|matte|ngà|nga\b)/i },
];

export function guessMaterialKind(category: string, tags: string): 'wood' | 'stone' | 'metal' | 'paint' | 'fabric' | 'glass' {
  const hay = `${category} ${tags}`;
  for (const { kind, re } of KIND_KEYWORDS) if (re.test(hay)) return kind;
  return 'paint'; // mặc định an toàn — sơn/matte trung tính, không bịa một loại cụ thể hơn
}
