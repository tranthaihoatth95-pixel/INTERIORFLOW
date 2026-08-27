/**
 * tai-khoan-trong.ts — "tài khoản này CÓ TRỐNG THẬT không?" (28/08, L2-06).
 *
 * VÌ SAO CẦN MỘT HÀM RIÊNG:
 * `HomeScreen` quyết định bày lời chào người-mới bằng `!resume && !isTourDone(userId)`.
 * Cả hai đều là **localStorage** — tức nó hỏi TRÌNH DUYỆT, không hỏi DỮ LIỆU. Xoá storage,
 * đổi máy, mở cửa sổ ẩn danh: một tài khoản 17 dự án hiện ra màn "Tạo dự án đầu tiên của bạn",
 * ngay trên nền dải dự án đang có. Đó là trạng thái BẰNG KHÔNG bày cho người CÓ DỮ LIỆU.
 *
 * LUẬT ÁP DỤNG — cùng trục với `lib/ui/trang-thai-tai.ts`: **`trống` ≠ `chưa biết`.**
 * Hỏi không được thì câu trả lời là `chua-biet`, KHÔNG phải `trong`. Và chỉ `trong` mới được
 * mở lời chào. Sai về phía im lặng thì người dùng mất một lời chào; sai về phía nói bừa thì
 * app bảo một người đã làm việc ba tháng rằng họ chưa có gì.
 *
 * ⚠️ ĐO ĐÚNG CON SỐ MÀ NGƯỜI DÙNG ĐANG NHÌN: dùng chính `stats` của `/api/dashboard` — cái
 * đang vẽ nên dải dự án phía sau modal. Nếu sau này siết phạm vi (`IF_PROJECT_SCOPE_ENFORCE`)
 * làm con số đó đổi, lời chào đổi theo, tự khớp. Đi hỏi một nguồn khác là đẻ ra đúng cảnh
 * "modal nói trống, nền nói có" một lần nữa.
 */

export type TrangThaiTrong = 'chua-biet' | 'trong' | 'co-du-lieu';

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Hỏi server xem tài khoản đang đăng nhập có dữ liệu nào chưa.
 * KHÔNG ném lỗi — mọi thất bại đều về `chua-biet`.
 */
export type ThongKe = { projects: number; flows: number };

/**
 * Đọc `stats` của `/api/dashboard`. `null` = **chưa biết** (mạng hỏng · 401 · thiếu trường).
 * KHÔNG bao giờ trả 0 thay cho "không đọc được" — đó đúng là chỗ đẻ ra L2-06.
 */
export async function doThongKe(
  fetchImpl: Fetcher = (u, i) => fetch(u, i),
  signal?: AbortSignal,
): Promise<ThongKe | null> {
  try {
    const res = await fetchImpl('/api/dashboard', { signal, credentials: 'same-origin' });
    if (!res.ok) return null;
    const d: unknown = await res.json();
    const stats = (d as { stats?: unknown })?.stats;
    if (!stats || typeof stats !== 'object') return null;
    const s = stats as Record<string, unknown>;
    // F-17 — khẳng định phải CÓ CHỦ NGỮ: thiếu trường thì là `null`, không phải 0.
    if (typeof s.projects !== 'number' || typeof s.flows !== 'number') return null;
    return { projects: s.projects, flows: s.flows };
  } catch {
    return null;
  }
}

export async function doTaiKhoanTrong(
  fetchImpl: Fetcher = (u, i) => fetch(u, i),
  signal?: AbortSignal,
): Promise<TrangThaiTrong> {
  const tk = await doThongKe(fetchImpl, signal);
  if (!tk) return 'chua-biet';
  return tk.projects === 0 && tk.flows === 0 ? 'trong' : 'co-du-lieu';
}

/**
 * Cổng DUY NHẤT cho lời chào TỰ ĐỘNG. `true` chỉ khi cả ba đều đúng:
 * chưa có dấu chân trên máy này · chưa từng bỏ qua · và **đo được** là tài khoản trống.
 *
 * Người dùng tự bấm "Xem lại hướng dẫn" thì KHÔNG đi qua đây — đó là ý muốn của họ,
 * có bao nhiêu dự án cũng mở được.
 */
export function duocChaoTuDong(opts: {
  coDauChan: boolean;
  daBoQua: boolean;
  trangThai: TrangThaiTrong;
}): boolean {
  return !opts.coDauChan && !opts.daBoQua && opts.trangThai === 'trong';
}
