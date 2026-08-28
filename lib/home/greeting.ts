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
  /** Tên tài khoản (`User.name`) — rỗng/undefined → chỉ chào "InteriorFlow" chung chung. */
  name: string | null | undefined;
  /**
   * v5 (17/08, phiếu P-X ④.V1) — TÊN HIỂN THỊ do CHÍNH người dùng gõ. Thắng `name` khi có.
   * Đây là đường DUY NHẤT đúng cho dấu tiếng Việt: `hoa` KHÔNG suy ra được `Hoà` (còn Hoa · Hoá
   * · Hoạ) — máy đoán dấu là bịa. Máy chỉ được làm phần luôn đúng: viết hoa chữ cái đầu.
   */
  displayName?: string | null;
  now: Date;
  en: boolean;
  /** Số việc (Task) chưa xong, hạn hôm nay — 0/âm/NaN đều coi như "không có". */
  dueTodayCount: number;
}

/** Khoá localStorage của tên hiển thị (per-user, khai ở `components/home/useDisplayName.ts`).
 * Cùng họ khoá `interiorflow.*` của các cài đặt cục bộ sẵn có (vd `lib/units/settings.ts`). */
export const DISPLAY_NAME_KEY = 'interiorflow.display_name_v1';

/** Trần độ dài tên hiển thị — đủ cho họ tên đầy đủ, chặn dán cả đoạn văn vào lời chào. */
export const DISPLAY_NAME_MAX = 40;

/**
 * Gọt tên hiển thị người dùng gõ: bỏ khoảng trắng thừa, gộp khoảng trắng giữa, cắt trần.
 * KHÔNG viết hoa, KHÔNG đoán dấu — người dùng gõ sao giữ vậy (đó là lý do trường này tồn tại).
 * Rỗng → `null` (đường thoái lui về `name`, rồi về 'InteriorFlow').
 */
export function normalizeDisplayName(raw: string | null | undefined): string | null {
  const s = (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, DISPLAY_NAME_MAX);
  return s.length > 0 ? s : null;
}

/**
 * Viết hoa chữ cái đầu.
 * 🔴 28/08 — chú thích cũ ghi đây là *"phần DUY NHẤT máy suy được mà LUÔN ĐÚNG"*. **SAI**, và đã
 * trả giá: `hoa` → `Hoa` trong khi tên thật là `Hoà`. Hàm này **CẤM dùng cho TÊN NGƯỜI**; nó chỉ
 * còn hợp lệ cho thứ máy tự sinh và tự biết đúng, ví dụ thứ trong tuần.
 * Dùng `toLocaleUpperCase()` để chữ có dấu lên hoa đúng (`ánh` → `Ánh`), và tách bằng spread để
 * không cắt đôi cặp mã (emoji/ký tự ngoài BMP).
 */
export function capitalizeFirst(raw: string): string {
  const chars = [...raw];
  if (chars.length === 0) return raw;
  return chars[0].toLocaleUpperCase() + chars.slice(1).join('');
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
  // v5 (17/08, P-X ④.V1) — thứ tự thoái lui: tên người dùng TỰ ĐẶT → từ cuối của tên tài khoản
  // (đã viết hoa chữ đầu) → 'InteriorFlow'. Ảnh chụp màn 17/08 ra "Chào hoa" vì tên tài khoản
  // lưu là `hoa`: chữ thường + mất dấu. Viết hoa chữ đầu sửa được nửa đầu; nửa dấu thì CHỈ người
  // dùng gõ được, nên `displayName` đứng trước.
  const custom = normalizeDisplayName(input.displayName);
  const lastWord = (input.name ?? '').trim().split(/\s+/).pop() || '';
  /* 🔴 SỬA 28/08 — TRƯỚC ĐÂY: `capitalizeFirst(lastWord)`, kèm chú thích tự khai đó là
   * *"phần DUY NHẤT máy suy được mà LUÔN ĐÚNG"*. **Câu đó sai, và Hoà chụp màn chứng minh:**
   * tên trong DB là `hoa`; viết hoa ra `Hoa`; tên thật là **Hoà**.
   *
   * Đây KHÔNG phải bịa một chuỗi như `|| 'Untitled'` — nguy hiểm hơn: một **phép biến đổi chế
   * ra sự tự tin**. Nó lấy giá trị không kiểm được rồi làm nó **trông như đã được xác nhận**,
   * nên không ai nghi. `hoa` để nguyên thì người dùng thấy lạ và tự sửa; `Hoa` thì trông đúng
   * và **sai vĩnh viễn**.
   *
   * Nay: `displayName` (người dùng TỰ GÕ, có dấu) thắng; không có thì hiện **đúng thứ đang lưu**,
   * không tô vẽ. Máy chỉ được hiển thị thứ nó đo được. */
  const firstName = custom ?? (lastWord || null);
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
