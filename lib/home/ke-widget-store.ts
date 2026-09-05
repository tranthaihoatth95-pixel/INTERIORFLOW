/**
 * lib/home/ke-widget-store.ts — KỆ WIDGET của bậc KHI GỌI: thứ TÔI tự đặt và hiện đang lặng.
 *
 * ⭐ LƯU Ở ĐÂU — luật chung↔máy (16/08), và đây là chỗ nó được thi hành, không phải nhắc lại:
 *
 *     VẬT (vật liệu · cấu kiện · bản vẽ · deck)          → CHUNG, ai cũng thấy
 *     CẤU TRÚC VIỆC (chuỗi công đoạn · dây nối)          → CHUNG
 *     CÁCH BÀY TRÊN MÀN CỦA TÔI (nấc · cỡ · thứ tự kệ)   → MÁY MÌNH   ← tệp này
 *
 *   Kệ widget là **cách bày trên màn của tôi** ⇒ `localStorage`, KHÔNG lên máy chủ, KHÔNG vào
 *   `.idf`. Màn hình mỗi người một cỡ, thói quen mỗi người một kiểu.
 *
 * ⭐ LUẬT PASS (`HOME-IMPLEMENTATION-SPEC.md` §5) — đây là thứ tệp này tồn tại để chứng minh:
 *     THAO TÁC → GHI XUỐNG → ĐÓNG/TẢI LẠI → VÀO LẠI → CÙNG MỘT SỰ THẬT.
 *   Phần THUẦN (`doiCho` · `an` · `hien` · `apDung` · `chuanHoa`) tách hẳn khỏi I/O để test
 *   được bằng `sucrase-node` — xem `ke-widget-store.test.ts`.
 *
 * ⚠️ Widget có cỡ ĐỊNH SẴN theo ô lưới (1×1 · 2×1), CẤM kéo giãn tự do. Đó không phải chuyện
 *    thẩm mỹ: khai theo Ô LƯỚI (không theo pixel) chính là ĐIỀU KIỆN để cùng một widget chạy
 *    được trên máy tính · tablet · điện thoại (chốt 16/08). Đừng nới thành kéo tự do.
 */

/** Khoá lưu — per-user để hai người dùng chung một máy không giẫm kệ của nhau. */
export function khoaKe(userId: string | null | undefined): string {
  return `interiorflow.home.ke-widget.${userId || 'khach'}`;
}

export interface BayKe {
  /** thứ tự hiện tại của các widget CÒN TRÊN KỆ (theo id). */
  thuTu: string[];
  /** id các widget đã ẩn — giữ lại tên để "gọi ra" được, không xoá mất. */
  an: string[];
}

export const KE_RONG: BayKe = { thuTu: [], an: [] };

/** Đọc an toàn giá trị lạ: thiếu trường, sai kiểu, hoặc JSON hỏng đều ra kệ rỗng. */
export function chuanHoa(v: unknown): BayKe {
  if (!v || typeof v !== 'object') return KE_RONG;
  const o = v as Record<string, unknown>;
  const loc = (x: unknown): string[] =>
    Array.isArray(x) ? Array.from(new Set(x.filter((i): i is string => typeof i === 'string' && i.length > 0))) : [];
  const an = loc(o.an);
  // Một id không thể vừa ở trên kệ vừa bị ẩn — ẩn thắng, vì đó là lệnh gần nhất người dùng ra.
  const thuTu = loc(o.thuTu).filter((i) => !an.includes(i));
  return { thuTu, an };
}

/**
 * Áp bày-đã-lưu lên danh sách widget CÓ THẬT hiện nay.
 *
 * Ba ca phải đúng, và cả ba đều là ca thật chứ không phải phòng xa:
 *   · widget MỚI mà bản lưu chưa biết  → xếp CUỐI kệ, không biến mất
 *   · widget đã BỎ khỏi app            → rơi khỏi kệ lặng lẽ, không để lại ô trống
 *   · widget người dùng đã ẩn          → không lên kệ, nhưng vẫn ĐẾM ĐƯỢC ở `daAn`
 */
export function apDung<T extends { id: string }>(
  co: readonly T[],
  bay: BayKe,
): { tren: T[]; daAn: T[] } {
  const map = new Map(co.map((w) => [w.id, w]));
  const tren: T[] = [];
  for (const id of bay.thuTu) {
    const w = map.get(id);
    if (w) {
      tren.push(w);
      map.delete(id);
    }
  }
  const daAn: T[] = [];
  for (const id of bay.an) {
    const w = map.get(id);
    if (w) {
      daAn.push(w);
      map.delete(id);
    }
  }
  // Phần còn lại = widget app mới thêm, bản lưu chưa từng thấy ⇒ xếp cuối kệ theo thứ tự gốc.
  for (const w of co) if (map.has(w.id)) tren.push(w);
  return { tren, daAn };
}

/** Đổi chỗ một widget sang trái/phải. Chạm biên thì ĐỨNG YÊN — không cuộn vòng (gây mất dấu). */
export function doiCho(bay: BayKe, id: string, huong: -1 | 1, thuTuHienTai: readonly string[]): BayKe {
  const ds = [...thuTuHienTai];
  const i = ds.indexOf(id);
  if (i < 0) return bay;
  const j = i + huong;
  if (j < 0 || j >= ds.length) return { ...bay, thuTu: ds };
  [ds[i], ds[j]] = [ds[j], ds[i]];
  return { thuTu: ds, an: bay.an };
}

export function an(bay: BayKe, id: string, thuTuHienTai: readonly string[]): BayKe {
  return {
    thuTu: thuTuHienTai.filter((x) => x !== id),
    an: bay.an.includes(id) ? bay.an : [...bay.an, id],
  };
}

export function hien(bay: BayKe, id: string, thuTuHienTai: readonly string[]): BayKe {
  return {
    thuTu: thuTuHienTai.includes(id) ? [...thuTuHienTai] : [...thuTuHienTai, id],
    an: bay.an.filter((x) => x !== id),
  };
}

/* ─────────────────────────── I/O — chỉ chạy ở trình duyệt ─────────────────────────── */

export function docKe(userId: string | null | undefined): BayKe {
  if (typeof window === 'undefined') return KE_RONG;
  try {
    const raw = window.localStorage.getItem(khoaKe(userId));
    return raw ? chuanHoa(JSON.parse(raw)) : KE_RONG;
  } catch {
    // Cửa sổ riêng tư / chặn site data / JSON hỏng — kệ rỗng là trạng thái đúng, không phải lỗi.
    return KE_RONG;
  }
}

export function ghiKe(userId: string | null | undefined, bay: BayKe): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(khoaKe(userId), JSON.stringify(chuanHoa(bay)));
  } catch {
    /* hết chỗ hoặc bị chặn — không làm vỡ màn vì một tiện ích bày biện */
  }
}
