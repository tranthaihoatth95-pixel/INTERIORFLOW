
/* 🔴 GỠ `vatLieu` KHỎI MỌI KẾ HOẠCH BÀY — 26/08, Hoà soi app thật.
   "Vật liệu của tuần" là widget do MÁY chọn rồi tự bày ra, không do người dùng xin.
   `product/home.md` ghi thẳng nó là ca mẫu bị TỪ CHỐI: mọi vật trên Trang chủ phải thuộc một
   trong năm nhóm — hiện diện con người · việc đang làm · điều cần chú ý · Design DNA · tiện ích
   người dùng CHỦ ĐỘNG bật. Nó không thuộc nhóm nào: không phải việc đang làm, không phải tín
   hiệu cần xử, và người dùng chưa bao giờ ghim nó.
   ⭐ Nó lọt được vì có DỮ LIỆU THẬT — vật liệu có thật, ảnh có thật, không phải fixture. Đó đúng
   là cái bẫy: **dữ liệu thật không tự cấp cho một vật cái quyền chiếm chỗ trên Home.** Câu hỏi
   không phải "số này có thật không" mà "nó phục vụ VIỆC GÌ của con người lúc này".
   ⛔ KHÔNG xoá component `WeeklyMaterial` — nó vẫn sống ở bố cục `xuongLayout` và sẽ là ứng viên
   hợp lệ cho tầng "tiện ích cá nhân" KHI có cơ chế ghim thật. Đây là quyết định của TRANG CHỦ,
   không phải khai tử widget. */
/**
 * components/home/nam-trang-thai.ts — [marker: namTrangThaiHome] **HOME LÀ BỀ MẶT CÓ TRẠNG THÁI**,
 * không phải một màn cố định. Thuần (không React · không DOM · không `Date` · không `window`)
 * nên test được toàn bộ tổ hợp mà không cần trình duyệt.
 *
 * NGUỒN: `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md` — Hoà chốt 23/08. Năm trạng thái
 * A→E, ba tầng widget, và câu quan trọng nhất của bản chốt:
 *   > *"Mật độ là HÀM CỦA TRẠNG THÁI, không phải hằng số."*
 * ⇒ Đây là lý do tệp này tồn tại: nếu mật độ chỉ là một hằng CSS thì Home lại thành **một** bố
 * cục đẹp cho **một** tình huống — đúng thứ bản chốt bác.
 *
 * ⛔ NÓ KHÔNG THAY `xuong-layout.ts`. Hai tệp trả lời hai câu khác nhau:
 *   · `xuong-layout.ts`  → *bày cụm phụ theo thứ tự nào* (bố cục hai cột, chế độ `custom`).
 *   · tệp này            → *lúc này Home ĐANG Ở TRẠNG THÁI NÀO, và trạng thái đó cần gì*.
 * Cả hai cùng sống; `xuong-layout` là bố cục, đây là ngữ cảnh.
 *
 * ⚠️ MỘT LỆCH TỪ VỰNG PHẢI GHI RÕ, KẺO PHIÊN SAU ĐỌC NHẦM: chữ `A · B · C` ở
 * `xuong-layout.ts` là **ba trạng thái DỮ LIỆU** (chưa có dự án → có dự án → dữ liệu dày). Chữ
 * `A…E` ở đây là **năm trạng thái NGỮ CẢNH** của bản chốt 23/08. Trùng chữ cái, KHÁC trục.
 * Ánh xạ duy nhất chắc chắn: `xuong-layout` A  ⟷  `nam-trang-thai` A (cả hai là "chưa có gì").
 */

/** Năm trạng thái của bản chốt 23/08. Mã giữ đúng chữ cái để trích sổ được. */
export type TrangThaiHome = 'A' | 'B' | 'C' | 'D' | 'E';

/** Ba tầng widget (§"Ba tầng widget"). Thứ tự ưu tiên mặc định: CORE > AI > PERSONAL. */
export type TangWidget = 'core' | 'ai' | 'personal';

/**
 * Mật độ — **hệ quả** của trạng thái, không phải lựa chọn riêng.
 * `thoang` A · `gan-trong` B · `nhe` C · `day` D · `dong` E.
 */
export type MatDo = 'thoang' | 'gan-trong' | 'nhe' | 'day' | 'dong';

/**
 * Cỡ ô — **ĐÚNG BA CỠ ĐỊNH SẴN**, khai bằng SỐ Ô LƯỚI, tuyệt đối không px.
 *
 * 🔴 Đây KHÔNG phải chuyện thẩm mỹ (chốt 16/08, ghi lại vì rất dễ bị nới ra cho "linh hoạt"):
 * widget khai theo ô thì lưới hẹp lại trên điện thoại là chúng **tự xếp lại**, không phải viết
 * lại dòng nào. Ba cỡ định sẵn là **ĐIỀU KIỆN** để cùng một bộ widget chạy trên máy tính ·
 * tablet · điện thoại. Cho kéo giãn tự do là mất luôn khả năng đó.
 */
export type CoO = '1x1' | '2x1' | '2x2';

/** Số ô mà một cỡ chiếm — nơi gọi dựng `grid-column/row: span N`, không tự tính px. */
export function nhipO(c: CoO): { cot: number; hang: number } {
  if (c === '2x2') return { cot: 2, hang: 2 };
  if (c === '2x1') return { cot: 2, hang: 1 };
  return { cot: 1, hang: 1 };
}

/** Mã mọi widget Home có thể bày. Khớp tên tệp đang có ở `components/home/widgets/`. */
export type MaWidget =
  | 'tiepTuc' // CORE — một đích tiếp tục (ResumeWork / dải Tiếp tục)
  | 'canToiXu' // CORE — "Cần tôi xử" (bản vẽ EXS-C, ô viền cảnh báo)
  | 'keDuAn' // CORE — kệ dự án gần đây
  | 'homNay' // CORE — TodayStrip
  | 'mocToi' // CORE — UpcomingList
  | 'ghiChu' // CORE — QuickNotes
  | 'bieuDo' // CORE — StageChart
  | 'dongTin' // CORE — NewsFeed / ContributionGrid
  | 'vitals' // AI   — signal Vitals (chỉ khi đủ đáng giá)
  | 'anhTuan' // PERSONAL — WeeklyImage
  | 'vatLieu'; // PERSONAL — WeeklyMaterial

/**
 * ⚠️ KHÔNG có mã `chao` ở đây, và đó là cố ý: lời chào sống trong dải KHÔNG KHÍ (ambient) vốn
 * LUÔN có mặt ở mọi trạng thái. Cho nó thêm một ô trong lưới là nói cùng một điều hai lần.
 */
export const TANG_CUA: Record<MaWidget, TangWidget> = {
  tiepTuc: 'core',
  canToiXu: 'core',
  keDuAn: 'core',
  homNay: 'core',
  mocToi: 'core',
  ghiChu: 'core',
  bieuDo: 'core',
  dongTin: 'core',
  vitals: 'ai',
  anhTuan: 'personal',
  vatLieu: 'personal',
};

/**
 * Cờ "mục này CÓ DỮ LIỆU THẬT không". Không có cờ nào mặc định `true`:
 * ⛔ luật của bản chốt — *widget thiếu dữ liệu thì TỰ ẨN*, và **CẤM dữ liệu giả**.
 * (`chao` không có cờ vì lời chào chỉ cần biết giờ — nó luôn thật.)
 */
export interface TinHieu {
  coDuAn: boolean;
  coViecDo: boolean;
  /**
   * Có mục ĐANG CHỜ CHÍNH NGƯỜI NÀY xử (review chờ quyết · spec thiếu · blocker).
   * ⛔ Đây KHÔNG phải "có việc nói chung" — nếu nới thành thế thì ô này lúc nào cũng sáng và
   * hết nghĩa. Không có nguồn phân biệt được thì để `false` và ô biến mất.
   */
  canToiXu: boolean;
  homNay: boolean;
  mocToi: boolean;
  bieuDo: boolean;
  dongTin: boolean;
  anhTuan: boolean;
  vatLieu: boolean;
  /**
   * Vitals CÓ ĐIỀU ĐÁNG NÓI hay không.
   * ⛔ *"Vitals không được nói chỉ để chứng minh rằng nó tồn tại."* Không có insight đáng giá
   * ⇒ cờ `false` ⇒ **không có card nào cả**, chứ không phải card ghi "mọi thứ ổn".
   */
  vitalsDangNoi: boolean;
}

export interface DuKienHome {
  tinHieu: TinHieu;
  /** Giờ trong ngày 0–23. Nơi gọi cấp; tệp này KHÔNG đọc `Date` (để test được mọi giờ). */
  gio: number;
  /**
   * Trong PHIÊN NÀY người dùng đã rời Home vào một workspace rồi quay lại chưa.
   * Đây là dữ kiện phân biệt C (mở đầu ngày) với D (quay về Home GIỮA giờ) — và nó là dữ liệu
   * THẬT (`sessionStorage`), không phải suy từ giờ.
   */
  daQuayLai: boolean;
  /**
   * Hero có **đủ ruột** để đứng khổ `2x2` không (sửa 23/08 — lỗi Hoà chỉ: *"thẻ trắng khổng lồ
   * gần như RỖNG"*).
   *
   * 🔴 GỐC BỆNH, ghi rõ để không tái phát: cỡ ô trước nay là **hằng số của kế hoạch**, gán từ
   * bản vẽ (`tiepTuc: '2x2'`) mà không hỏi *"ruột có đủ lấp không"*. Thẻ Việc-đang-dở thật chỉ
   * cao ~136px (tên dự án · lần cuối · một nút), còn ô `2x2` sàn là 2×88 + gap ≈ 184px — và
   * `WidgetCard` thì `h-full` nên nó **kéo giãn cái vỏ ra cho bằng khung**. Kết quả đúng thứ
   * Hoà thấy: một tấm trắng to chứa ba dòng chữ ở đỉnh.
   *
   * ⇒ Luật *"widget thiếu dữ liệu thì tự ẩn, ô co theo nội dung"* nay áp cho **cả cỡ ô**, không
   * riêng việc ẩn/hiện. Hero mỏng ⇒ tụt `2x2` → `2x1`. KHÔNG tụt xuống `1x1`: hero vẫn phải là
   * hero (*"cỡ card = mức quan trọng"*), chỉ thôi đòi một khung nó không lấp nổi.
   *
   * Mặc định `true` = giữ nguyên hành vi cũ cho mọi nơi gọi chưa khai.
   */
  heroDayRuot?: boolean;
}

/** Ngưỡng giờ. Đặt tên để trích được, và để đổi thì đổi MỘT chỗ. */
export const GIO_SANG_HET = 11; // < 11h là "mở đầu ngày"
export const GIO_TOI_BAT_DAU = 18; // ≥ 18h là "cuối ngày"

/**
 * Chọn trạng thái.
 *
 * THỨ TỰ ƯU TIÊN — cố ý, và đây là phần dễ làm sai nhất:
 *  ① **A thắng tất cả.** Chưa có dự án, chưa có việc dở, chưa có tín hiệu nào ⇒ mọi trạng thái
 *     khác đều sẽ phải bịa nội dung để lấp chỗ. *"CẤM giả lập dashboard."*
 *  ② **B thắng C/D/E.** Có phiên dang dở là dữ kiện MẠNH NHẤT về ý định của người dùng — mạnh
 *     hơn hẳn giờ trong ngày. Người mở IF lúc 9h sáng với một phiên dở thì việc của họ là
 *     *tiếp tục*, không phải *đọc tình hình*.
 *     ⚠️ Nhưng CHỈ khi **chưa quay lại**: đã vào workspace rồi bật về Home thì họ không còn cần
 *     lời mời "tiếp tục" nữa — họ cần tổng đài (D).
 *  ③ Còn lại chia theo GIỜ: sáng → C · tối → E · giữa ngày → D.
 *  ④ Đã quay lại giữa phiên ⇒ **luôn D**, bất kể giờ. "Giữa giờ làm" là một ngữ cảnh, không
 *     phải một khung đồng hồ.
 */
export function chonTrangThai(d: DuKienHome): TrangThaiHome {
  const t = d.tinHieu;
  const trongTron =
    !t.coDuAn &&
    !t.coViecDo &&
    !t.homNay &&
    !t.mocToi &&
    !t.bieuDo &&
    !t.dongTin &&
    !t.vitalsDangNoi;
  if (trongTron) return 'A';

  if (t.coViecDo && !d.daQuayLai) return 'B';
  if (d.daQuayLai) return 'D';

  if (d.gio < GIO_SANG_HET) return 'C';
  if (d.gio >= GIO_TOI_BAT_DAU) return 'E';
  return 'D';
}

/** Mật độ đi kèm trạng thái — quan hệ MỘT-MỘT, khai một chỗ để không ai đặt lệch. */
export function matDoCua(tt: TrangThaiHome): MatDo {
  switch (tt) {
    case 'A':
      return 'thoang';
    case 'B':
      return 'gan-trong';
    case 'C':
      return 'nhe';
    case 'D':
      return 'day';
    case 'E':
      return 'dong';
  }
}

/**
 * Nhịp thở theo mật độ. Đơn vị là **số nhân trên `--gap`**, không phải px — cùng khai báo chạy
 * ở mọi bề rộng, và đổi thang khoảng cách toàn app thì Home đi theo.
 * `oToiDa` = số ô lưới tối đa cho phép bày; nó là **CỬA MẬT ĐỘ**: D được dày, B gần như trống.
 */
export function nhipCua(m: MatDo): { heSoGap: number; oToiDa: number; cot: number } {
  switch (m) {
    // A và B **không có ô nào**: hero của A là ba cửa vào, hero của B là chính công việc đang
    // dở. Trần 0 là một khẳng định — không phải "chưa cấu hình".
    case 'thoang':
      return { heSoGap: 3, oToiDa: 0, cot: 4 };
    case 'gan-trong':
      return { heSoGap: 3, oToiDa: 0, cot: 4 };
    case 'nhe':
      return { heSoGap: 2, oToiDa: 10, cot: 4 };
    // `heSoGap: 1` = ĐÚNG `--gap` (12px) — con số của bản vẽ EXS-C H1
    // (`grid-template-columns:repeat(4,1fr); grid-auto-rows:88px; gap:12px`).
    case 'day':
      return { heSoGap: 1, oToiDa: 16, cot: 4 };
    case 'dong':
      return { heSoGap: 1.75, oToiDa: 12, cot: 4 };
  }
}

/**
 * VAI của một ô — **thứ bậc bằng CHẤT LIỆU**, tách khỏi `co` (thứ bậc bằng DIỆN TÍCH).
 * Vỏ tương ứng ở `widgets/WidgetCard.tsx` (`VaiO`): `phu` = KHÔNG vỏ, đứng trần trên nền.
 *
 * Vì sao phải có trục thứ hai: chỉ đổi diện tích thì mọi ô vẫn là **một tấm kính giống nhau**,
 * và một dãy tấm kính to-nhỏ vẫn đọc ra *"tường widget"* (Hoà FAIL 22/08) — to hơn không có
 * nghĩa là quan trọng hơn nếu chất liệu y hệt. Hai trục đi cùng nhau mới ra editorial.
 */
export type VaiO = 'hero' | 'chinh' | 'phu';

export interface MucBay {
  ma: MaWidget;
  tang: TangWidget;
  co: CoO;
  vai: VaiO;
}

/**
 * THỨ TỰ + CỠ theo từng trạng thái. Đây là chỗ *"cỡ card = mức quan trọng"* thành số.
 *
 * 🔴 ĐỔI LUẬT CỠ Ô 02/09 (chốt 14 Hoà: *"widget giống y chang iPad"*).
 * Luật cũ: *"hero LỚN (2x2) · priority vừa · todo nhỏ"* — cỡ ô đi theo MỨC QUAN TRỌNG.
 * Nó cho ra đúng thứ ảnh 10:12 chụp được: `tiepTuc` 2x2 chứa ba dòng chữ ⇒ **~70% vỏ rỗng**,
 * còn `keDuAn` 1x1 chứa một DANH SÁCH ⇒ tên dự án **vỡ mỗi dòng một chữ**. Cỡ đúng theo thứ
 * bậc, sai theo nội dung — và mắt đọc ra cái sai trước.
 * Luật mới, lấy từ cách iPad làm (chốt 9: giống nó trước rồi mới hơn nó) — **cỡ ô đi theo
 * LOẠI NỘI DUNG**:
 *   · `1x1` = MỘT cái nhìn — một số lớn, một ảnh, một tên. KHÔNG chứa danh sách.
 *   · `2x1` = một danh sách ngắn, hoặc một dòng tiêu đề + vài chip.
 *   · `2x2` = CHỈ cho lưới ảnh (bìa dự án), thứ duy nhất thật sự cần một mảng vuông.
 * Thứ bậc KHÔNG mất — nó chuyển sang `vai` + VỊ TRÍ (hero đứng đầu dòng chảy), đúng cách
 * springboard phân cấp. Hệ quả: hero nay là `2x1`, và ô `2x2` có thể mang `vai: 'chinh'`.
 *
 * 🔴 `keDuAn` 2x2 → 2x1 (02/09, sau khi NHÌN ảnh 18:28). Luật ngay trên nói `2x2` **CHỈ** cho
 * lưới ảnh. Kế hoạch H-3 định cho `keDuAn` thành lưới 2×2 bìa dự án — nhưng **thứ đó chưa dựng**:
 * trên app thật nó đang vẽ một DANH SÁCH CHỮ ("Căn hộ mẫu · Studio 48m²" / "Nháp" / "Dự án mới").
 * Danh sách trong ô 2x2 ⇒ 3 dòng chữ và ~40% vỏ rỗng bên dưới — đúng lỗi F4 mà chính lát này
 * sinh ra để chữa.
 * ⇒ Cỡ phải theo thứ ô ĐANG VẼ, không theo thứ ô SẼ vẽ. Cấp cỡ trước cho một tính năng chưa có
 * là cách một ô rỗng được hợp thức hoá bằng một lời hứa.
 * ⛳ Dựng xong lưới bìa thật thì trả lại `2x2` — lúc đó `2x2` mới có nghĩa.
 *
 * 🔴 NỚI NGHĨA CỦA `2x2` 02/09 (R-3c) — nói rõ vì đây là ĐỔI LUẬT, không phải lách cổng.
 * Luật cũ: *"`2x2` CHỈ cho lưới ảnh"*. Nó đúng ở ý định (đừng cho ô chữ mượn khổ lớn) nhưng
 * sai ở phạm vi: nó mô tả một HÌNH THỨC (ảnh) trong khi thứ cần canh là một RÀNG BUỘC (nội
 * dung có thật sự cần hai hàng không).
 * Ca bắt được: `mocToi` mang **5 mốc ngày + 6 dòng việc**. Nhét vào một hàng đơn vị thì hoặc
 * cắt mất nửa danh sách, hoặc vỡ ô vuông — cả hai đều tệ hơn việc cho nó hai hàng.
 * ⇒ Luật mới: **`2x2` cho nội dung THẬT SỰ cần hai hàng** (lưới ảnh, hoặc danh sách dài đã đo).
 * ⛔ Và nó vẫn phải là ngoại lệ có tên: cổng liệt kê ĐÍCH DANH widget nào được `2x2`, ô nào
 * khác lấy khổ đó là đỏ. Nới nghĩa mà không nêu tên là mở cửa cho mọi ô đòi khổ lớn.
 *
 * B không có mục nào ở đây: State B là **một câu và một nút trên nền công việc**, nó không đi
 * qua lưới ô. Trả mảng rỗng là đúng, không phải thiếu.
 */
const BAY_THEO_TRANG_THAI: Record<TrangThaiHome, readonly MucBay[]> = {
  // A — ba cửa vào chiếm hero; KHÔNG widget nào khác vì chưa có gì thật để nói.
  A: [],
  B: [],
  // C — mở đầu ngày, CHƯA có phiên dở (có thì đã là B). Hero là *hôm nay* vì không có resume
  // nào để làm hero. Nhẹ hơn D: bỏ ghi chú · biểu đồ · dòng tin.
  C: [
    { ma: 'homNay', tang: 'core', co: '2x1', vai: 'hero' },
    { ma: 'keDuAn', tang: 'core', co: '2x1', vai: 'chinh' },
    { ma: 'canToiXu', tang: 'core', co: '1x1', vai: 'chinh' },
    { ma: 'mocToi', tang: 'core', co: '2x2', vai: 'phu' },
    { ma: 'anhTuan', tang: 'personal', co: '2x1', vai: 'phu' },
  ],
  // D — TỔNG ĐÀI, dày nhất. ⭐ THỨ TỰ + CỠ PORT TỪ BẢN VẼ `mocks/mock-exs-c-home-work-os.html`
  // (H1 · Studio Focus): hero 2×2 là **Việc đang dở**, phần còn lại là ô 1×1.
  // *"Hero là Resume, không phải AI, không phải KPI."* — chú thích của chính bản vẽ.
  D: [
    { ma: 'tiepTuc', tang: 'core', co: '2x1', vai: 'hero' },
    { ma: 'keDuAn', tang: 'core', co: '2x1', vai: 'chinh' },
    { ma: 'homNay', tang: 'core', co: '1x1', vai: 'chinh' },
    { ma: 'canToiXu', tang: 'core', co: '1x1', vai: 'chinh' },
    { ma: 'mocToi', tang: 'core', co: '2x2', vai: 'phu' },
    { ma: 'anhTuan', tang: 'personal', co: '2x1', vai: 'phu' },
    /* 🔴 GỠ 02/09: `ghiChu` và `vitals`.
       Không phải vì chúng xấu — vì chúng KHÔNG CÓ NỘI DUNG được cấp. `DongStudioHome` không
       truyền node cho `ghiChu`, và `vitalsDangNoi` là `false`, nên hai ô này hoặc không vẽ
       hoặc vẽ ra một tấm kính rỗng chiếm đúng một ô của lưới. Bớt ô rỗng chính là cách tạo
       khoảng thở — không phải bằng cách nới khe. */
    /* 🔴 23/08 — `bieuDo` và `dongTin` ĐÃ GỠ KHỎI TRANG CHỦ. Lý do là LUẬT, không phải gu:
       · `dongTin` rơi vào nhánh `ContributionGrid` = lưới tích luỹ kiểu GitHub. Đúng thứ
         `NGHIEN-CUU-NODE-CANVAS-DOITHU-2026-08-02` đã loại tường minh là **"thống kê phù
         phiếm"**. Nó đếm được, nhưng không nói được điều gì cho một KTS.
       · `bieuDo` (`StageChart`) mở cổng ở `stageChartHasSignal` = *tổng số dự án ≥ 2* — cổng
         đó chỉ hỏi "có dự án không", KHÔNG hỏi "có việc gì để nói không". Hậu quả đo được trên
         ảnh Hoà chụp: **`3/0 · 0/0 · 0/0`** — ba cặp số mà hai phần ba là số không. Bày một
         biểu đồ rỗng còn tệ hơn không bày, vì nó chiếm chỗ của thứ có nghĩa.
       Hai mã này GIỮ NGUYÊN trong `MaWidget` + `coDuLieu` (widget vẫn sống, vẫn dùng được ở
       bề mặt khác) — chỉ **Trang chủ** thôi mời chúng. Home là NƠI CHỐN, không phải trang
       phân tích. Muốn cho lại thì phải kèm một cổng tín hiệu nói được thành câu. */
  ],
  // E — tạo CLOSURE: hôm nay đã đóng · còn mở · mai tiếp. ⛔ Không điểm số, không gamification.
  // Cố ý KHÔNG có `anhTuan`/`vatLieu`: cuối ngày là lúc ĐÓNG LẠI, không phải lúc nuôi mắt.
  E: [
    { ma: 'homNay', tang: 'core', co: '2x1', vai: 'hero' },
    { ma: 'tiepTuc', tang: 'core', co: '2x1', vai: 'chinh' },
    { ma: 'keDuAn', tang: 'core', co: '2x1', vai: 'chinh' },
    { ma: 'mocToi', tang: 'core', co: '2x2', vai: 'phu' },
  ],
};

/** Mục này có dữ liệu thật không. `chao` luôn thật (giờ + tên), còn lại tra `TinHieu`. */
export function coDuLieu(ma: MaWidget, t: TinHieu): boolean {
  switch (ma) {
    case 'tiepTuc':
      return t.coViecDo;
    case 'canToiXu':
      return t.canToiXu;
    case 'keDuAn':
      return t.coDuAn;
    case 'homNay':
      return t.homNay;
    case 'mocToi':
      return t.mocToi;
    case 'bieuDo':
      return t.bieuDo;
    case 'dongTin':
      return t.dongTin;
    case 'anhTuan':
      return t.anhTuan;
    case 'vatLieu':
      return t.vatLieu;
    case 'ghiChu':
      return true; // chỗ GHI, không phải chỗ BÁO — luôn dùng được, kể cả khi trống
    case 'vitals':
      return t.vitalsDangNoi;
  }
}

export interface KeHoachHome {
  trangThai: TrangThaiHome;
  matDo: MatDo;
  nhip: ReturnType<typeof nhipCua>;
  /** Đã lọc theo dữ liệu thật VÀ đã cắt theo cửa mật độ. */
  bay: MucBay[];
  /** Số ô lưới thực sự dùng — nơi gọi không phải cộng lại. */
  oDaDung: number;
}

/**
 * Kế hoạch đầy đủ cho một lượt render.
 *
 * Hai cửa, theo đúng thứ tự — đảo lại là sai:
 *  ① **Lọc theo dữ liệu thật.** Không có dữ liệu ⇒ mục KHÔNG TỒN TẠI (không phải khung rỗng).
 *  ② **Cắt theo cửa mật độ.** Cắt từ CUỐI danh sách, tức bỏ mục ít quan trọng nhất trước —
 *     danh sách đã xếp theo thứ tự quan trọng ở `BAY_THEO_TRANG_THAI`.
 *
 * ⚠️ Cửa ② cắt theo **số ô**, không theo số mục: một `2x2` ăn 4 ô, một `1x1` ăn 1. Cắt theo số
 * mục thì "dày" và "thoáng" chỉ khác nhau ở số thẻ chứ không khác ở diện tích — mà diện tích
 * mới là thứ mắt đọc ra mật độ.
 */
export function keHoachHome(d: DuKienHome): KeHoachHome {
  const trangThai = chonTrangThai(d);
  const matDo = matDoCua(trangThai);
  const nhip = nhipCua(matDo);

  const song = BAY_THEO_TRANG_THAI[trangThai]
    .filter((m) => coDuLieu(m.ma, d.tinHieu))
    /* ③ NHÁNH HẠ HERO `2x2 → 2x1` ĐÃ GỠ 02/09 — nó chữa một bệnh không còn nữa.
       Nó sinh ra để cứu ca "hero mỏng ruột mà đòi khung 2x2 ⇒ vỏ trắng khổng lồ gần như rỗng".
       Nay KHÔNG hero nào còn là `2x2` (xem luật cỡ ô mới ở `BAY_THEO_TRANG_THAI`), nên nhánh
       này không bao giờ khớp — giữ lại chỉ là một điều kiện chết mà lượt sau phải đi hỏi.
       ⚠️ `heroDayRuot` GIỮ NGUYÊN trong `DuKienHome`: nó vẫn là một dữ kiện thật về ruột hero,
       và H-3 (dựng lại ruột `tiepTuc`) sẽ cần đúng nó. Gỡ CHỖ DÙNG, không gỡ dữ kiện. */

  const bay: MucBay[] = [];
  let dung = 0;
  for (const m of song) {
    const { cot, hang } = nhipO(m.co);
    const can = cot * hang;
    if (dung + can > nhip.oToiDa) continue; // mục sau có thể nhỏ hơn và vẫn lọt — cố ý không `break`
    bay.push(m);
    dung += can;
  }

  return { trangThai, matDo, nhip, bay, oDaDung: dung };
}
