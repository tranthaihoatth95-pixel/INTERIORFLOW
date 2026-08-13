/**
 * lib/home/greeting.ts — [marker: DongStudio] lời chào dữ liệu thật, KHÔNG quote sáo, KHÔNG AI
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.2; sửa 13/08 v2 việc ④.3 "khử trùng sự
 * kiện").
 *
 * "Chào <tên> · <thứ, ngày>" + 1 dòng TÍN HIỆU rút từ dữ liệu thật — CHỈ việc đến hạn hôm nay
 * (CẦN HÀNH ĐỘNG). Không có tín hiệu nào → `signal: null`, component TỰ ẨN dòng đó (luật X2 —
 * không bịa, không số 0 tròn) và chỉ còn lời chào trơn.
 *
 * v2 (13/08, phiếu home-dong-studio-v2.md ④.3): BỎ nhánh "X vừa có chuyển động"
 * (`recentProjectName`) — đo trên app thật thấy CÙNG một sự kiện (Flow.updatedAt gần nhất) lặp
 * lại ở 3 nơi (lời chào "vừa có chuyển động" · TodayStrip "vừa có cập nhật" · NewsFeed "cập nhật
 * mới 3 ngày trước") với 3 cách đọc thời gian khác nhau — đúng bẫy NC-HOME-DELIGHT "quote lặp =
 * noise". Theo bảng ưu tiên của phiếu (đến-hạn → lời chào; còn lại → bảng tin), "flow vừa cập
 * nhật" không phải việc CẦN HÀNH ĐỘNG nên KHÔNG thuộc về lời chào nữa — chỉ còn sống ở
 * `NewsFeed` (nơi nó vốn thuộc về, đúng 1 chỗ).
 *
 * THUẦN — chạy được sucrase-node, không gọi fetch/AI. Route/component truyền dữ liệu đã fetch
 * sẵn (dueTodayCount) vào — hàm này chỉ QUYẾT ĐỊNH câu chữ.
 */

export interface GreetingInput {
  /** Tên hiển thị — rỗng/undefined → chỉ chào "InteriorFlow" chung chung. */
  name: string | null | undefined;
  now: Date;
  en: boolean;
  /** Số việc (Task) chưa xong, hạn hôm nay — 0/âm/NaN đều coi như "không có". */
  dueTodayCount: number;
}

export interface GreetingResult {
  /** "Chào Hoà · Thứ Năm, 13/08" */
  headline: string;
  /** "3 việc đến hạn hôm nay" | "<tên dự án> vừa có chuyển động" | null (ẩn dòng). */
  signal: string | null;
}

/**
 * "Thứ Năm, 13/08" (vi) / "Thursday, 13 Aug" (en) — không throw với Date hỏng (Invalid Date).
 * Phần ngày/tháng dựng TAY (không qua `toLocaleDateString({day,month})`) vì ICU của Node và
 * trình duyệt trả dấu phân cách khác nhau cho `vi-VN` (Node: "13-08", Chrome: "13/08") — dựng
 * tay đảm bảo MỘT kết quả xuyên môi trường, chỉ Intl hoá phần tên thứ (chữ, không có dấu lệch).
 */
function formatWeekdayDate(now: Date, en: boolean): string {
  if (Number.isNaN(now.getTime())) return '';
  try {
    const weekday = now.toLocaleDateString(en ? 'en-US' : 'vi-VN', { weekday: 'long' });
    const w = en ? weekday : weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const dd = String(now.getDate()).padStart(2, '0');
    if (en) {
      const month = now.toLocaleDateString('en-US', { month: 'short' });
      return `${w}, ${dd} ${month}`;
    }
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${w}, ${dd}/${mm}`;
  } catch {
    return '';
  }
}

export function buildGreeting(input: GreetingInput): GreetingResult {
  const firstName = (input.name ?? '').trim().split(/\s+/).pop() || null;
  const dateLine = formatWeekdayDate(input.now, input.en);
  const namePart = firstName ? (input.en ? `Hi ${firstName}` : `Chào ${firstName}`) : 'InteriorFlow';
  const headline = dateLine ? `${namePart} · ${dateLine}` : namePart;

  const due = Number.isFinite(input.dueTodayCount) ? Math.max(0, Math.trunc(input.dueTodayCount)) : 0;
  const signal: string | null =
    due > 0
      ? input.en
        ? due === 1
          ? '1 task due today'
          : `${due} tasks due today`
        : `${due} việc đến hạn hôm nay`
      : null;

  return { headline, signal };
}
