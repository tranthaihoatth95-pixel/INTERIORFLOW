/**
 * lib/colors/trend.ts — VIỆC 3: **giữ tham chiếu xu hướng, bỏ bảng tra**.
 *
 * ┌─ RANH GIỚI PHÁP LÝ — đọc trước khi thêm dòng ───────────────────────────────────────────┐
 * │ Ranh giới nằm ở **QUY MÔ BỘ SƯU TẬP**, KHÔNG nằm ở việc có hiển thị hay không.           │
 * │  • Nhúng 2310 mã = sao chép "phần đáng kể" một CSDL biên soạn ⇒ dính bản quyền biên soạn │
 * │    ("selection and arrangement") + sui generis database right (EU) ⇒ ĐÃ XOÁ.             │
 * │  • Nhắc TÊN + MÃ của **một màu mỗi năm**, có dẫn nguồn thông cáo chính thức = tham chiếu  │
 * │    biên tập/nominative — cùng loại với việc một bài báo viết "Pantone chọn Peach Fuzz".   │
 * │    Không thay thế được sản phẩm của họ, không ai dùng bảng này để tra màu.                │
 * │ ⇒ **TRẦN CỨNG: 1 mục/năm.** Ai định thêm "top 10 màu xu hướng của hãng X" là đang dựng    │
 * │   lại đúng cái vừa xoá — dừng lại, đọc `docs/LICENSE-NOTES.md` §9.                        │
 * │ ⇒ Mỗi mục BẮT BUỘC có `source` (link thông cáo/báo). Không nguồn thì không thêm dòng.     │
 * └──────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * Dùng để làm gì: gợi ý bối cảnh khi bàn gu với khách ("năm nay hướng ấm/nâu đất"), KHÔNG phải
 * để tra mã sơn. Tra mã đi qua `nearestColor(hex, source)` với bảng studio tự nạp.
 *
 * `hex` ở đây là giá trị **được công bố rộng rãi kèm thông cáo**, và như mọi hex khác: đó chỉ là
 * xấp xỉ trên màn hình, không thay được mẫu vật lý — xem `disclaimer.ts`.
 */

export interface TrendColor {
  year: number;
  /** Bên công bố. Ghi rõ để không ai nhầm đây là màu do IF đặt ra. */
  publisher: string;
  name: string;
  /** Mã do bên công bố dùng (rỗng nếu thông cáo không nêu mã). */
  code: string;
  hex: string;
  /** BẮT BUỘC — link thông cáo/bài báo. Không có thì không được thêm dòng. */
  source: string;
  note?: string;
}

/**
 * Color of the Year theo năm. Xếp GIẢM DẦN (mới nhất trước) — UI hiện luôn năm gần nhất.
 *
 * ⚠️ TRẠNG THÁI XÁC MINH (không giấu): danh sách này soạn theo hiểu biết sẵn có của phiên code,
 * **CHƯA mở lại từng link để đối chiếu trong phiên này** (sandbox phiên này không truy cập
 * ngoài). Trước khi phát hành: mở đủ 11 link, đối chiếu tên/mã/hex, sửa dòng nào lệch. Đây là
 * dữ liệu tham chiếu hiển thị cho khách — sai một mã là sai lời tư vấn.
 */
export const TREND_COLORS: TrendColor[] = [
  { year: 2025, publisher: 'Pantone', name: 'Mocha Mousse', code: '17-1230', hex: '#a47864', source: 'https://www.pantone.com/color-of-the-year/2025' },
  { year: 2024, publisher: 'Pantone', name: 'Peach Fuzz', code: '13-1023', hex: '#ffbe98', source: 'https://www.pantone.com/color-of-the-year/2024' },
  { year: 2023, publisher: 'Pantone', name: 'Viva Magenta', code: '18-1750', hex: '#bb2649', source: 'https://www.pantone.com/color-of-the-year/2023' },
  { year: 2022, publisher: 'Pantone', name: 'Very Peri', code: '17-3938', hex: '#6667ab', source: 'https://www.pantone.com/color-of-the-year/2022' },
  { year: 2021, publisher: 'Pantone', name: 'Ultimate Gray', code: '17-5104', hex: '#939597', source: 'https://www.pantone.com/color-of-the-year/2021', note: 'Năm 2021 công bố CẶP màu — mục kia là Illuminating 13-0647.' },
  { year: 2021, publisher: 'Pantone', name: 'Illuminating', code: '13-0647', hex: '#f5df4d', source: 'https://www.pantone.com/color-of-the-year/2021', note: 'Nửa còn lại của cặp 2021.' },
  { year: 2020, publisher: 'Pantone', name: 'Classic Blue', code: '19-4052', hex: '#0f4c81', source: 'https://www.pantone.com/color-of-the-year/2020' },
  { year: 2019, publisher: 'Pantone', name: 'Living Coral', code: '16-1546', hex: '#ff6f61', source: 'https://www.pantone.com/color-of-the-year/2019' },
  { year: 2018, publisher: 'Pantone', name: 'Ultra Violet', code: '18-3838', hex: '#5f4b8b', source: 'https://www.pantone.com/color-of-the-year/2018' },
  { year: 2017, publisher: 'Pantone', name: 'Greenery', code: '15-0343', hex: '#88b04b', source: 'https://www.pantone.com/color-of-the-year/2017' },
  { year: 2016, publisher: 'Pantone', name: 'Rose Quartz', code: '13-1520', hex: '#f7cac9', source: 'https://www.pantone.com/color-of-the-year/2016', note: 'Năm 2016 cũng là CẶP — mục kia là Serenity 15-3919.' },
];

/**
 * ⬜ CÒN THIẾU — **năm 2026 chưa có trong bảng**.
 * Phiên code này KHÔNG có nguồn xác thực trong tay cho công bố 2026 nên **không điền, không đoán**
 * (§5 N5 "khai thật cái chưa xong" — bịa một mã màu rồi in vào hồ sơ gửi khách là hỏng thật).
 * Cách bổ sung: mở thông cáo chính thức → thêm 1 dòng vào `TREND_COLORS` kèm `source`.
 * Ô này CỐ Ý để trống và hiện trên UI (§9 "cấm xoá ô trống cho gọn mắt").
 */
export const TREND_MISSING_YEARS: number[] = [2026];

export function trendColorsByYear(year: number): TrendColor[] {
  return TREND_COLORS.filter((t) => t.year === year);
}

export function latestTrendYear(): number | null {
  return TREND_COLORS.length ? Math.max(...TREND_COLORS.map((t) => t.year)) : null;
}
