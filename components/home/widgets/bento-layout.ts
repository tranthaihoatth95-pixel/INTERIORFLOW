/**
 * components/home/widgets/bento-layout.ts — [marker: soThuTuO + oCoTheoNoiDung] luật ĐÁNH SỐ Ô và
 * luật CỠ Ô THEO LƯỢNG TIN của Home bento (phiếu `docs/phieu-giao/P-X-sua-4-loi-home.md` ④.V2+V3).
 *
 * THUẦN — không React, không DOM. Chạy được `sucrase-node` nên chứng minh được bằng test thay vì
 * bằng mắt (yêu cầu ⑥ của phiếu: "dãy số ô liền mạch ở MỌI tổ hợp widget ẩn/hiện").
 *
 * ── V2 · VÌ SAO PHẢI TỰ TÍNH ──────────────────────────────────────────────────────────────────
 * Trước 17/08 số ô GÁN CỨNG tại chỗ gọi trong `DongStudioHome.tsx` (`index="03"` `"05"` `"07"`…)
 * trong khi widget RENDER CÓ ĐIỀU KIỆN (`hasC`/`hasD`/`hasE`/`hasG`). Widget nào tự ẩn thì số của
 * nó biến mất và dãy ĐỨT: ảnh chụp màn 17/08 của Hoà ra `01 · 02 · 04 · 05 · 06 · 08` — thiếu 03
 * và 07, còn ô *Lưới tích luỹ studio* thì KHÔNG có số nào (`ContributionGrid` không nhận `index`).
 *
 * SỐ MANG TIN GÌ — số ô là **ĐỊA CHỈ Ô TRÊN MÀN**, không phải thứ tự đọc. Nó tồn tại để chỉ chỗ
 * được: chu trình duyệt-mắt hiện nay là Hoà chụp màn rồi chỉ *"ô 05 thừa trống"* — ngắn và chính
 * xác hơn *"cái biểu đồ chặng ở dưới bên trái"*. Đúng `simpleCoChiTiet` (chi tiết phải mang tin)
 * và giữ được NT-7 (số thứ tự làm xương cấu trúc). Hệ quả bắt buộc của nghĩa đó:
 *   ① số phải LIỀN MẠCH `01 02 03…` — địa chỉ mà đứt quãng thì chỉ nhầm chỗ;
 *   ② MỌI ô đều có số, không sót ô nào — sót một ô là ô đó không chỉ được;
 *   ③ số chạy theo THỨ TỰ ĐỌC CỦA TỪNG BỐ CỤC (bento/vừa/mỏng/xếp dọc khác thứ tự nhau).
 *
 * ⚠️ HẠN DÙNG: khi Home bento cho người dùng TỰ SẮP Ô, "địa chỉ ô" thành thứ đổi mỗi lần kéo thả
 * ⇒ lúc đó phải chốt lại: hoặc số bám VỊ TRÍ (giữ như nay) hoặc bám WIDGET (số cố định theo loại).
 *
 * ── V3 · CỠ Ô THEO LƯỢNG TIN ─────────────────────────────────────────────────────────────────
 * `duAnTileRows` + `bentoFillPercent` — xem docstring từng hàm.
 */

/** Chín ô của Home bento. Tên theo NGHĨA (không theo chữ cái A-I của bố cục cũ). */
export type HomeCellId =
  | 'duAn' // ô A · Dự án
  | 'chao' // ô B · Chào + đồng hồ ánh sáng
  | 'homNay' // ô C · Hôm nay
  | 'anhTuan' // ô D · Ảnh đẹp tuần này
  | 'bieuDo' // ô E · Biểu đồ chặng
  | 'ghiChu' // ô F · Ghi chú nhanh
  | 'mocToi' // ô G · Sắp tới
  | 'vatLieu' // ô H · Vật liệu của tuần
  | 'dongTin'; // ô I · Bảng tin studio / Lưới tích luỹ studio

/** Bốn bố cục thật sự có trong `DongStudioHome.tsx` — mỗi cái một THỨ TỰ ĐỌC riêng. */
export type HomeLayout = 'bento' | 'vua' | 'mong' | 'stacked';

/** Sáu ô CÓ THỂ rỗng. Ba ô còn lại (`duAn`/`chao`/`ghiChu`) luôn sống nên không có cờ. */
export interface HomeCellFlags {
  homNay: boolean;
  anhTuan: boolean;
  bieuDo: boolean;
  mocToi: boolean;
  vatLieu: boolean;
  dongTin: boolean;
}

/**
 * Thứ tự đọc từng bố cục — chép từ thứ tự render thật trong `DongStudioHome.tsx`, KHÔNG bịa:
 *  · `bento`  : A(1-8,h1-2) · B · C ▸ D ▸ E · F · G · H · I  (trái→phải, trên→dưới)
 *  · `vua`    : A · B ▸ rồi hàng dưới GHI CHÚ đứng TRƯỚC các ô phụ (mảng `vuaExtras`)
 *  · `mong`   : A · B ▸ F  (0 ô phụ sống)
 *  · `stacked`: xếp dọc <1100px, đúng thứ tự JSX
 */
const READING_ORDER: Record<HomeLayout, HomeCellId[]> = {
  bento: ['duAn', 'chao', 'homNay', 'anhTuan', 'bieuDo', 'ghiChu', 'mocToi', 'vatLieu', 'dongTin'],
  vua: ['duAn', 'chao', 'ghiChu', 'homNay', 'anhTuan', 'bieuDo', 'mocToi', 'vatLieu', 'dongTin'],
  mong: ['duAn', 'chao', 'ghiChu'],
  stacked: ['duAn', 'chao', 'homNay', 'anhTuan', 'bieuDo', 'ghiChu', 'mocToi', 'vatLieu', 'dongTin'],
};

/** Ba ô luôn sống — `duAn` (luôn có "+ Dự án mới"), `chao`, `ghiChu` (luôn có ô gõ). */
const ALWAYS_LIVE: HomeCellId[] = ['duAn', 'chao', 'ghiChu'];

function isLive(id: HomeCellId, flags: HomeCellFlags): boolean {
  if (ALWAYS_LIVE.includes(id)) return true;
  return flags[id as keyof HomeCellFlags] === true;
}

/** Danh sách ô THẬT SỰ hiện ra, đúng thứ tự đọc của bố cục đó. */
export function visibleCells(layout: HomeLayout, flags: HomeCellFlags): HomeCellId[] {
  return READING_ORDER[layout].filter((id) => isLive(id, flags));
}

/**
 * Bảng tra `ô → số`. Ô ẩn KHÔNG có khoá trong bảng (đọc ra `undefined` → `WidgetCard` bỏ số).
 * Số luôn 2 chữ số (`01`…`09`) — gu Swiss của `WidgetCard`, và để chiều rộng cột số không nhảy.
 */
export function cellIndexMap(layout: HomeLayout, flags: HomeCellFlags): Partial<Record<HomeCellId, string>> {
  const out: Partial<Record<HomeCellId, string>> = {};
  visibleCells(layout, flags).forEach((id, i) => {
    out[id] = String(i + 1).padStart(2, '0');
  });
  return out;
}

/**
 * Số HÀNG TILE mà ô "Dự án" thật sự cần.
 *
 * Lưới tile bên trong ô A là `lg:grid-cols-4` (`components/ProjectSelect.tsx:2098`) và tile
 * "+ Dự án mới" LUÔN đứng đầu, nên số tile ≈ số dự án + 1. `projectCount` lấy từ tổng
 * `stageChart[].projects` — nguồn đã có sẵn và đã được `stageChartHasSignal` dùng đúng nghĩa
 * "tổng số dự án của studio" (mỗi dự án rơi vào ĐÚNG MỘT chặng), [Đ2] không đẻ nguồn mới.
 *
 * ⚠️ CHƯA CHẮC: chưa cộng tile "Nháp" (số flow chưa gắn dự án KHÔNG có trong `/api/home/summary`)
 * ⇒ hàm có thể đếm THIẾU 1 tile. Đếm thiếu chỉ làm ô A thấp hơn cần một chút, không vỡ bố cục.
 */
export function duAnTileRows(projectCount: number, perRow = 4): number {
  const n = Number.isFinite(projectCount) ? Math.max(0, Math.trunc(projectCount)) : 0;
  return Math.max(1, Math.ceil((n + 1) / Math.max(1, perRow)));
}

/**
 * Phần trăm chiều cao màn mà lưới bento được phép chiếm — **gốc bệnh "thừa trống" nằm ở đây**.
 *
 * Trước 17/08 lưới LUÔN cao 100% màn với 3 hàng chia đều, nên ô A (cao 2/3 màn ≈ 569px ở
 * 1440×900) phải ôm một lưới tile chỉ cao ~283px khi studio mới có 1-2 dự án ⇒ **phân nửa dưới
 * trống trơn**, đúng chỗ Hoà chỉ. Đó là "ô giãn ra cho vừa khung", thứ vừa bị cấm.
 *
 * Sửa bằng cách CHỌN CỠ, không phải kéo dãn: dữ liệu mỏng (ô A chỉ cần MỘT hàng tile) thì cả lưới
 * lùi về 76% chiều cao và đứng giữa màn — phần dư trả lại cho HÌNH NỀN, đúng chốt A2 16/08
 * *"thẻ kính KHÔNG phủ kín màn — chừa lề cho nền thở"*. Dữ liệu dày (≥2 hàng tile) thì lưới lấy
 * đủ 100% như cũ vì lúc đó ô A có việc dùng hết chỗ.
 *
 * Khai bằng **%** (không px) nên vẫn đúng ràng buộc "widget khai theo ô lưới, cấm khai px" và
 * vẫn chạy nguyên trên mọi bề ngang màn.
 */
export function bentoFillPercent(tileRows: number): number {
  return tileRows >= 2 ? 100 : 76;
}
