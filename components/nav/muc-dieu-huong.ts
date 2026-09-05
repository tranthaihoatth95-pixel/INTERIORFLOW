/**
 * components/nav/muc-dieu-huong.ts — [marker: railHaiCum] BẢNG KHAI của rail điều hướng.
 * (Marker GIỮ NGUYÊN chuỗi `railHaiCum` làm ĐỊNH DANH ổn định qua mọi lần đổi cấu trúc — hai cụm
 *  16/08 → ba cụm 20/08 → HAI ĐẢO 20/08. Đổi chuỗi marker là vỡ mọi con trỏ trong phiếu/nhật ký
 *  cũ; tên marker là khoá kỹ thuật, không phải nhãn. Đừng "sửa cho khớp".)
 *
 * Vì sao tách khỏi component: đây là phần DUY NHẤT kiểm được bằng máy (đường đi · mục đang mở ·
 * lý do mờ · nấc chi tiết nào có gì để nhìn). Để chung trong `.tsx` thì muốn kiểm phải dựng DOM.
 *
 * 🔴 NGUỒN CẤU TRÚC HIỆN HÀNH — **Hoà chốt 23/08**: *"thanh sidebar cực đơn giản, KHÔNG nên 1
 * thanh dọc dài dễ cảm giác thô, mà tách 2 phần"* + *"BỎ LUÔN CÁI NHÁP. CHỐT THEO NHỮNG MỤC
 * SÁNG CHỐT"*. Rail dựng thành **ĐÚNG HAI VIÊN**, không hơn:
 *   VIÊN 1 · XƯỞNG/VIỆC — Trang chủ · Dự án · Cảm hứng · Thư viện
 *   VIÊN 2 · CHẶNG      — Thiết kế 2D · Thiết kế 3D · Trình chiếu · `+`
 * Hai viên tách bằng KHOẢNG THỞ CÓ NGHĨA, ⛔ không gộp thành một menu dài, ⛔ không đường kẻ.
 *
 * 🔴 BA THỨ VỪA RỜI RAIL 23/08 — đọc trước khi định "bù cho đủ":
 *   · **Files** và **Soát duyệt** không có trong danh sách Hoà chốt ⇒ rời rail (route còn sống).
 *   · **Cả đảo NGỮ CẢNH DỰ ÁN** (Tổng quan · Flows·Workspace · Tệp dự án · Quyết định·DNA) —
 *     Hoà gọi thẳng là "cái nháp", **BỎ HẲN KHỎI RAIL**. Bốn thứ đó là ngữ cảnh của MỘT dự án,
 *     thuộc bề mặt dự án chứ không thuộc bộ điều hướng cấp app. ⛔ KHÔNG xoá route, KHÔNG xoá
 *     màn — chỉ gỡ khỏi bản đồ. Lối vào còn lại ghi trong `docs/bao-cao-phien/2026-08-23-lane-rail.md`.
 *   · **Cảm hứng** thì ngược lại: chưa từng có trên rail ⇒ THÊM VÀO.
 * ⇒ Đảo thứ ba (`cum: 'du-an'`) và cơ chế `CUM_CAN_DU_AN` đã gỡ hẳn: giữ lại một khái niệm cụm
 *   không còn cụm nào dùng là để sẵn một cái bẫy cho phiên sau tưởng chỗ đó còn trống mà nhét vào.
 * Thanh trái trả lời đúng hai câu: *tôi đang làm việc ở đâu* · *tôi đang ở chặng nào*.
 * ⛔ **Cá nhân/Cộng tác/Hệ thống RỜI KHỎI thanh trái** — Hồ sơ · Credit · Cài đặt · Tài khoản ·
 * Đăng xuất nay sống trong MENU ẢNH ĐẠI DIỆN ở cụm phải-trên
 * (`components/studio/CumPhaiTren.tsx` + `components/AccountMenu.tsx`). Hoà nêu thẳng đây là
 * TIÊU CHÍ TRƯỢT: *"trượt nếu thanh trái còn chứa Hồ sơ/Credit/Cài đặt"* ⇒ ai định thêm lại một
 * mục Cá nhân/Cài đặt vào bảng này, đọc dòng này trước; test [2] chặn cứng.
 *
 * ĐÈ CHỐT NÀO: "BA CỤM" của `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` điều 3 (Workspace chung ·
 * ba chặng · cá nhân/hệ thống) — bản đó tự nó đã ĐÈ "hai cụm" 16-17/08, và nay bị đè tiếp: cụm
 * cá nhân/hệ thống KHÔNG còn là đảo thứ ba trên trục dọc, nó chuyển sang trục phải-trên.
 * Điều 4 của cùng chốt (ba độ sâu: Rail 52-56 · Context Shelf 220-280 · Work Panel 320-440)
 * GIỮ NGUYÊN, không đụng. Nền cũ vẫn đúng phần ràng buộc:
 * `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §5 (ba nấc chi tiết = ba công năng) · §6 (ràng buộc
 * chung). Bản đồ: `docs/IF-KIEN-TRUC.md` §2 §3 §7.
 * Hoà chốt 16/08 (VẪN ĐÚNG): **sidebar là hệ router toàn app** ⇒
 * `components/studio/StageSwitcher.tsx` thôi là "trục điều hướng duy nhất". Nhưng câu "ba chặng
 * chỉ là MỘT nhóm stage ngang hàng Files/Thư viện" nay ĐƯỢC LÀM RÕ: ba chặng là ĐẢO RIÊNG, tách
 * bằng khoảng thở — ngang hàng về trục, KHÔNG trộn vào cùng một danh sách.
 *
 * ⚠️ MỘT ĐÍNH CHÍNH SO VỚI BẢNG §1 CỦA HỢP ĐỒNG — nhãn ba chặng.
 * Bảng §1 gọi hai chặng đầu theo lối đảo chữ (kỹ-thuật trước, thiết-kế trước); nhưng chốt 07/08
 * (mục ĐỊNH NGHĨA BA CHẶNG, bản cuối) là **Thiết kế 2D · Thiết kế 3D · Trình chiếu**, và cả hai
 * chỗ đang thi hành đều theo bản cuối: `components/studio/StageSwitcher.tsx` (WIDEST_LABEL) và
 * từ điển máy `scripts/soi-tu-dien.mjs:33-34` — lối đảo chữ kia dùng trong `components/` là BÁO ĐỎ.
 * ⇒ Lấy theo bản cuối. Đây là đổi NHÃN, KHÔNG đổi route — không kéo theo thay đổi nào ở vùng
 * phiên V2, nên không phải ca "chạm biên phải dừng".
 * (Chính dòng này lúc đầu TRÍCH NGUYÊN chuỗi bị cấm để giải thích, và máy soi bắt được ngay —
 *  ghi lại vì nó chứng minh máy soi chạy đúng, kể cả khi người viết đang nói về chính luật đó.)
 */

import type { LucideIcon } from 'lucide-react';
import { House, Folders, Compass, GalleryHorizontalEnd, Grid2x2, Box, Monitor } from 'lucide-react';

/* ─── BẢY BIỂU TƯỢNG CỦA THANH TRÁI — MỘT HỌ, không phải bảy cái hiểu được ──────────────────
 * Khung/nét là hằng số chung ở `components/ui/command-icon.tsx` (`HE_BIEU_TUONG`). Ở đây chọn
 * NGHĨA **và** SILHOUETTE.
 *
 * 🔴 Hoà 20/08: hiểu được từng cái nhưng **chưa cảm thấy là MỘT HỌ của IF** ⇒ siết NGỮ PHÁP HÌNH.
 * TRỤC XUYÊN SUỐT: **chữ nhật → chữ nhật bo → viên nang → tròn**. Mọi icon phải đọc ra là biến
 * thể trên trục đó: cùng bán kính góc · cùng kiểu đầu nét/góc nối · đơn sắc trung tính mặc định ·
 * màu CHỈ hỗ trợ trạng thái.
 * ⛔ Cấm trộn glyph đặc với glyph viền · bán kính góc tuỳ tiện · hình quá chi tiết · kiểu emoji.
 *
 *  mục          icon                    silhouette                    vì sao
 *  Trang chủ    House                   thân bo r2 + mái dốc          ⚠️ lệch trục — xem ghi chú dưới
 *  Dự án        Folders                 HAI thư mục r2 xếp chồng      hộp chứa dự án
 *  Cảm hứng     Compass                 VÒNG TRÒN + kim               ⭐ cái DUY NHẤT trọn trục — xem dưới
 *  Thư viện     GalleryHorizontalEnd    dãy thẻ r2 song song          kho tài sản xếp kệ
 *  Thiết kế 2D  Grid2x2                 CHỮ NHẬT r2 chia ô            MẶT PHẲNG
 *  Thiết kế 3D  Box                     khối lập phương dây           KHỐI
 *  Trình chiếu  Monitor                 CHỮ NHẬT r2 + chân            MẶT ĐẦU RA
 *
 * ⭐ VIÊN CHẶNG PHẢI ĐỌC THÀNH MỘT TIẾN TRÌNH, không phải ba vật rời:
 *      Grid2x2  →  Box  →  Monitor
 *      PHẲNG       KHỐI     MẶT TRÌNH BÀY
 *   Cả ba cùng bắt đầu từ MỘT hình chữ nhật: cái đầu chia ô (phẳng), cái giữa đùn lên có chiều sâu
 *   (khối), cái cuối đặt lên chân (mặt xuất). Đứng cạnh nhau thấy được một câu chuyện.
 *   ⛔ Đổi lẻ một trong ba là làm gãy câu chuyện — phải đổi cả ba hoặc không đổi.
 *
 * ⭐ **CẢM HỨNG = `Compass` — CHỌN BẰNG SỐ, KHÔNG BẰNG NGHĨA (THÊM 23/08).**
 *   Nó đứng ngay cạnh Thư viện, nên ràng buộc nặng nhất là SILHOUETTE PHẢI KHÁC HẲN. Mọi ứng
 *   viên "đúng nghĩa ảnh" lại đều là KHUNG CHỮ NHẬT (`Image` · `Images` · `GalleryVertical`) ⇒
 *   ở 18px đọc lẫn với dãy thẻ của Thư viện. `Compass` là VÒNG TRÒN + kim: tách bạch ngay từ
 *   đường viền ngoài, và **tròn là điểm CUỐI của chính cái trục** chữ-nhật→bo→viên-nang→tròn
 *   ⇒ nó là icon DUY NHẤT của bộ nằm trọn trên trục. Nghĩa cũng đúng: đi tìm hướng, không phải
 *   xem một tấm ảnh.
 *   🔴 `Lightbulb` là lựa chọn ĐẦU và bị TEST BÁC, ghi lại để không ai thử lại: cung của nó là
 *   `a6 6` ⇒ **bán kính 6**, trong khi cả sáu icon còn lại đều **r2**. Đúng loại lệch mà mắt
 *   thấy "sai sai" mà không gọi được tên — và test [9] gọi được tên nó bằng số.
 *   `Sparkles` bị loại có chủ đích: sắc lấp lánh là ngôn ngữ của AI, kênh đó đã dành cho nút
 *   `+` ở viên 2 — dùng ở hai chỗ thì `+` mất nghĩa riêng.
 *
 * ⚠️ **`House` VẪN LÀ MỤC DUY NHẤT LỆCH TRỤC** — khai thẳng, không giấu: mái dốc là HAI ĐƯỜNG
 *   CHÉO. Đã rà hết ứng viên lucide cho nghĩa "nhà/xưởng" (`Warehouse` `Building*`) — cái nào
 *   cũng mái dốc hoặc mái cong; `LayoutGrid`/`LayoutDashboard` đúng trục nhưng Hoà đã loại vì
 *   là ngôn ngữ dashboard. ⇒ Muốn trục tuyệt đối thì cần GLYPH RIÊNG của IF; đó là việc của cửa
 *   thiết kế, KHÔNG tự vẽ ở lane code. Nó vẫn r2, vẫn viền đơn sắc, chỉ lệch ở silhouette.
 *
 * Dải phần tử **1-3** (đo bằng test [8]) — không cái nào lệch hẳn.
 * ⚠️ Con số là ĐO, không đếm mắt: bản nháp đầu của chính bảng này sai 4/8 dòng vì regex đếm hụt
 * icon một-phần-tử. Sửa icon thì chạy test rồi chép số ra, đừng ước.
 */
/* ─────────────────────────────────────────────────────────────────────────────────────────
   BA NẤC CHI TIẾT = BA CÔNG NĂNG (hợp đồng §5 · bản đồ §7 · CHOT-EXPERIENCE-SYSTEM điều 4)

   52  "tôi đang ở đâu"     — định vị bằng vị trí + hình, KHÔNG chữ (Rail icon-only)
   240 "tôi đi đâu được"    — thêm CHỮ (Context Shelf)
   320 "ở đó đang có gì"    — thêm HÌNH, hoặc TÌNH TRẠNG nếu thứ đó không có hình (Work Panel)

   ✅ 52 — MÂU THUẪN 28↔52 ĐÃ ĐÓNG 23/08. Đừng mở lại.
   Từng có hai văn bản hai số: bản vẽ `docs/mocks/mock-rail-hai-cum.html` (`--w-dinh-vi:28px`) +
   `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §5 nói **28**; `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md`
   điều 4 nói **52-56**. Chỉ thị cuối của Hoà (§SIDEBAR MAP) tuyên thẳng **"52px anchor rail"**
   ⇒ `docs/control/IF-CANONICAL.md` §10 `[CHỐT]` **Neo 52px** là PHÂN GIẢI, không phải ghi vội.
   **THAY BỞI:** IF-CANONICAL §10. Bản vẽ 28px nay LỖI THỜI **ở con số này thôi** — phần a11y và
   hành vi của nó vẫn là hợp đồng.
   Hệ quả bố cục: hàng rộng 52 − 2×4 lề = **44px**, vẫn thừa cho ô icon 20×20 của `HE_BIEU_TUONG`
   và nay CHỨA NỔI nút thu/mở 32px (xem `RailDieuHuong.tsx` › `NutNac` — 24px cũ là hệ quả BỊ ÉP
   của 28, không phải một lựa chọn a11y; đừng giữ nó vì quán tính).
   240 GIỮ: đã nằm trong khoảng 220-280 của chốt, đổi là churn không mang tin.
   320 GIỮ min: chốt cho resize tới trần 440 nhưng rail HIỆN CHƯA có cơ chế resize —
   ⛳ NỢ (phiếu riêng): thêm resize kéo tay nấc `duyet` trong khoảng [320, 440].

   ⛔ Ba nấc chi tiết là một NHỊP, không phải HẠN NGẠCH: mục nào không có gì để nhìn ở 320 thì
   BỎ nấc đó cho riêng mục ấy (`mat320.kieu === 'khong'` + lý do đọc được).
   ───────────────────────────────────────────────────────────────────────────────────────── */

/* `dinhVi` 52 → 72 (02/09): nấc hẹp nay chở CHỮ DƯỚI ICON (dáng tab bar iPad, chốt 14), không
 * còn là một cột hình câm. 52 chỉ vừa ô icon 26 + đệm; nhãn 10.5px cần ~64 để không cắt cụt
 * mọi nhãn. 72 = 64 nhãn + 4 lề mỗi bên. */
export const BE_RONG_NAC = { dinhVi: 72, dieuHuong: 240, duyet: 320 } as const;

export type NacRail = keyof typeof BE_RONG_NAC;

/** Thứ tự từ hẹp tới rộng — dùng cho hai nút bước tới/bước lui. */
export const THU_TU_NAC: readonly NacRail[] = ['dinhVi', 'dieuHuong', 'duyet'] as const;

export const NHAN_NAC: Record<NacRail, { vi: string; en: string }> = {
  dinhVi: { vi: 'Định vị', en: 'Locate' },
  dieuHuong: { vi: 'Điều hướng', en: 'Navigate' },
  duyet: { vi: 'Duyệt', en: 'Browse' },
};

/** Bước một nấc chi tiết theo hướng; đã ở đầu/cuối dải thì trả `null` (nơi gọi không vẽ nút). */
export function nacKe(nac: NacRail, huong: 1 | -1): NacRail | null {
  const i = THU_TU_NAC.indexOf(nac);
  const j = i + huong;
  return j >= 0 && j < THU_TU_NAC.length ? THU_TU_NAC[j] : null;
}

/* ───────────────────────────────────────────────────────────────────────────────────────── */

/**
 * ĐÚNG HAI VIÊN (Hoà chốt 23/08 — ĐÈ ba đảo 22/08):
 *   `viec`  — VIÊN 1, XƯỞNG/VIỆC: *tôi đang làm việc ở đâu*. Bốn mục.
 *   `chang` — VIÊN 2, CHẶNG: *tôi đang ở chặng nào*. Đúng ba mục + nút `+`, không hơn — viên này
 *             phải ỔN ĐỊNH và QUEN TAY, thêm mục vào đây là làm mất tính đoán-trước của nó.
 * ⛔ KHÔNG có viên thứ ba. Cá nhân/hệ thống ở cụm phải-trên; ngữ cảnh dự án ở bề mặt dự án.
 *
 * ĐỔI KHOÁ CÓ AN TOÀN KHÔNG — đo trước khi đổi, không đoán: `CumRail` sống trong đúng ba tệp
 * `components/nav/**`, và localStorage của rail chỉ có MỘT khoá `interiorflow.rail.nac_v1` lưu
 * **NacRail** — không khoá nào lưu CumRail. ⇒ bỏ một cụm KHÔNG vỡ dữ liệu đã ghi.
 */
export type CumRail = 'viec' | 'chang';

/**
 * Nấc 320 của TỪNG mục — "ở đó đang có gì".
 * `khong` bắt buộc kèm `viSao`: bỏ một nấc chi tiết là quyết định thiết kế, phải đọc được lý do
 * ngay tại chỗ, đừng để phiên sau tưởng là bỏ sót rồi đi "bù" cho đủ ba.
 */
export type Mat320 =
  | { kieu: 'tinhTrang'; moTa: string; daNoiNguon: boolean }
  | { kieu: 'hinh'; moTa: string; daNoiNguon: boolean }
  | { kieu: 'khong'; viSao: string };

export interface MucRail {
  id: string;
  vi: string;
  en: string;
  cum: CumRail;
  icon: LucideIcon;
  /** Đường tuyệt đối, sống không cần dự án nào. */
  duong?: string;
  /**
   * Đuôi sau `/projects/<id>/` — mục CHỈ có nghĩa khi đã mở một dự án.
   * Điều kiện "cần dự án" nay đọc từ CHÍNH trường này chứ không suy từ cụm: đảo VIỆC có cả mục
   * cần dự án (Dự án) lẫn mục không cần (Files · Thư viện), nên lấy cụm làm điều kiện là sai.
   */
  duoi?: string;
  /** Có giá trị = mục hiện MỜ vĩnh viễn, và đây là lý do đọc được (§9 cấm nút giả không lý do). */
  chuaCoTrang?: { vi: string; en: string };
  mat320: Mat320;
}

/**
 * ⛔ KHÔNG lên rail (hợp đồng §1) — Bảng màu là một BƯỚC trong chọn vật liệu · Kho vật liệu là
 * một KỆ của Thư viện · Gallery là mặt tuyển chọn của kệ Ảnh. Ba thứ đó KHÔNG có mục riêng ở đây;
 * ai định thêm vào, đọc §1 trước.
 */

export const MUC_RAIL: readonly MucRail[] = [
  // ── VIÊN 1 · XƯỞNG/VIỆC — "tôi đang làm việc ở đâu". Đúng bốn mục Hoà chốt 23/08 ──────────
  {
    id: 'trang-chu',
    vi: 'Trang chủ',
    en: 'Home',
    cum: 'viec',
    icon: House,
    duong: '/',
    mat320: {
      kieu: 'khong',
      viSao:
        'Trang chủ CHÍNH LÀ mặt nhìn của app — bày một bản thu nhỏ của nó ngay cạnh nó là nói cùng một điều hai lần.',
    },
  },
  {
    id: 'du-an',
    vi: 'Dự án',
    en: 'Projects',
    cum: 'viec',
    icon: Folders,
    // 🔴 ĐỔI NGHĨA (Hoà chốt 22/08) — trước đây mục này trỏ `/projects/<id>/overview`, tức một
    // bề mặt THUỘC MỘT DỰ ÁN lại đứng ở viên TOÀN CỤC ⇒ hai đích đọc ra như hai dashboard ngang
    // hàng. Nay nó là **SỔ DỰ ÁN TOÀN CỤC**: danh sách MỌI dự án, sống không cần dự án nào mở.
    // ⛔ KHÔNG bịa engine mới: `/projects` mount `ProjectSelect` — chính cỗ máy đang làm sổ dự án
    // bên trong `/`, chỉ là trước nay nó không có đường đi riêng (một cỗ máy, nhiều mặt tiền).
    duong: '/projects',
    mat320: { kieu: 'hinh', moTa: 'thẻ dự án gần đây', daNoiNguon: true },
  },
  {
    id: 'cam-hung',
    vi: 'Cảm hứng',
    en: 'Inspiration',
    cum: 'viec',
    icon: Compass,
    // THÊM 23/08 theo danh sách Hoà chốt. ⛔ KHÔNG đẻ route mới: đích là `/library/gallery` —
    // Gallery liên ngành ĐANG SỐNG (`app/library/gallery/page.tsx`), đúng nghĩa "kho ảnh tuyển
    // liên ngành, chống thói quen search web/Pinterest ảnh rác, NUÔI Thẻ DNA/moodboard"
    // (00-CHOT 12/08). Trước nay nó chỉ tới được từ bên trong tấm Thư viện.
    // ⚠️ ĐÂY LÀ CHỖ T SUY, KHAI THẲNG: Hoà viết "Cảm hứng (Design DNA)" — chữ trong ngoặc có thể
    // trỏ Thẻ DNA. Nhưng Thẻ DNA hiện KHÔNG có route riêng (mount trong trang Tổng quan), nên
    // trỏ vào đó là quay lại đúng bề mặt dự án vừa bị gỡ. Gallery là đích DUY NHẤT vừa có route
    // thật, vừa toàn cục, vừa đúng nghĩa "cảm hứng". Hoà bác thì đổi một dòng `duong` này.
    duong: '/library/gallery',
    mat320: { kieu: 'hinh', moTa: 'ảnh tuyển gần đây', daNoiNguon: false },
  },
  {
    id: 'thu-vien',
    vi: 'Thư viện',
    en: 'Library',
    cum: 'viec',
    icon: GalleryHorizontalEnd,
    duong: '/library',
    // Hoà nêu đích danh 16/08: "thư viện vật liệu, size to nhất là cột dọc ô tròn vật liệu".
    mat320: { kieu: 'hinh', moTa: 'cột ô tròn vật liệu', daNoiNguon: false },
  },

  // ── VIÊN 2 · CHẶNG — "tôi đang ở chặng nào". ĐÚNG BA MỤC + nút `+` (nút không phải MucRail:
  //    nó không dẫn đi đâu trên bản đồ, nó SINH RA thứ mới — xem `NutTaoAi` trong RailDieuHuong).
  {
    id: 'thiet-ke-2d',
    vi: 'Thiết kế 2D',
    en: '2D Design',
    cum: 'chang',
    icon: Grid2x2,
    duoi: 'cad',
    mat320: { kieu: 'tinhTrang', moTa: 'chặng đang dở', daNoiNguon: true },
  },
  {
    id: 'thiet-ke-3d',
    vi: 'Thiết kế 3D',
    en: '3D Design',
    cum: 'chang',
    icon: Box,
    duoi: 'render',
    mat320: { kieu: 'tinhTrang', moTa: 'chặng đang dở', daNoiNguon: true },
  },
  {
    id: 'trinh-chieu',
    vi: 'Trình chiếu',
    en: 'Presenting',
    cum: 'chang',
    icon: Monitor,
    duoi: 'present',
    mat320: { kieu: 'tinhTrang', moTa: 'chặng đang dở', daNoiNguon: true },
  },
] as const;

export const NHAN_CUM: Record<CumRail, { vi: string; en: string }> = {
  viec: { vi: 'Việc', en: 'Work' },
  chang: { vi: 'Chặng', en: 'Stages' },
};

/**
 * Thứ tự vẽ HAI VIÊN trên cùng một trục dọc (Hoà chốt 23/08 — ĐÈ bản ba đảo 22/08).
 * `viec` → `chang`. Viên VIỆC ở trên vì nó sống không cần dự án nào; viên CHẶNG ở dưới, gần
 * tầm tay nhất khi đang làm — và nó là thứ người dùng bấm nhiều nhất trong một phiên sáng tác.
 */
export const THU_TU_CUM: readonly CumRail[] = ['viec', 'chang'] as const;

/**
 * Đích khi bấm một mục CHẶNG mà tài khoản chưa có dự án nào: về Trang chủ và BUNG SẴN hộp tạo
 * dự án. Một cú bấm ra đúng việc người dùng đang muốn, thay vì một cú bấm vào hư không.
 */
export const DUONG_MO_DU_AN = '/?mo=du-an';

/** Đường đi thật của một mục — `null` chỉ khi mục THẬT SỰ chưa có trang. */
export function duongCua(muc: MucRail, duAnId: string | null): string | null {
  if (muc.chuaCoTrang) return null;
  // Điều kiện đọc từ `duoi`, KHÔNG từ cụm: đảo VIỆC trộn cả mục cần dự án (Dự án) lẫn mục không
  // cần (Files · Thư viện) ⇒ lấy cụm làm điều kiện sẽ khoá nhầm nửa đảo.
  if (!muc.duoi) return muc.duong ?? null;
  /* ⚠️ CHƯA CÓ DỰ ÁN THÌ VẪN TRẢ ĐƯỜNG — dẫn về chỗ tạo, KHÔNG trả null. (Bản vá 05/09.)
   *
   * Trước lát này chỗ này trả `null` ⇒ mọi mục chặng thành nút `aria-disabled`, bấm không ra gì.
   * Chủ dự án mở bản cài lần đầu, chưa có dự án nào, gặp đúng những nút chết đó — báo "app không
   * chạy được chặng". Đo lại trên app thật: tất cả đều `aria-disabled="true"`, không href.
   *
   * Trái LUẬT X2 (`00-CHOT` 03/08): *"KHÔNG màn nào được chặn vì chưa làm bước trước — chặng
   * trống hiện empty state LÀM ĐƯỢC VIỆC tại chỗ"*. Nút chết còn tệ hơn màn trống: nó không nói
   * được phải làm gì tiếp.
   *
   * 🔀 HOÀ HAI CÁCH SỬA. Nhánh này (02/09, chốt 15) đã đi được nửa đường: đổi nghĩa `daMoDuAn`
   * thành *"CÓ dự án dùng được"* để rail tự lùi về dự án gần nhất, nhưng CỐ Ý giữ lại một ca mờ
   * cho tài khoản trắng — vì bất biến *"hễ không có đường đi thì PHẢI có lý do"* là thứ chặn nút
   * giả. Nhánh `integration` (05/09) đóng nốt ca đó theo cách KHÔNG phá bất biến: cấp cho nó MỘT
   * ĐƯỜNG ĐI THẬT. Có đường ⇒ không cần lý do ⇒ bất biến vẫn đứng, mà cửa khoá cuối cùng cũng
   * hết. Đây là lý do nhánh `lyDoMo` "chưa có dự án" bên dưới bị gỡ hẳn chứ không phải nới lỏng.
   */
  return duAnId ? `/projects/${duAnId}/${muc.duoi}` : DUONG_MO_DU_AN;
}

/**
 * Mục nào đang mở, suy từ đường hiện tại.
 *
 * `/materials` và `/colors` cùng sáng ở **Thư viện**: hợp đồng §1 khai chúng là KỆ và BƯỚC bên
 * trong Thư viện, không phải mục rail. Hai route đó còn đứng riêng cho tới khi phiên V2 gộp
 * xong; tới lúc ấy hai dòng này tự thành thừa và xoá được mà không đụng gì khác.
 *
 * ⚠️ `/settings`, `/settings/avatar`, `/tasks`, `/projects/<id>/notebook` nay trả **null** — CÓ Ý,
 * không phải bỏ sót: bốn route đó vẫn sống, nhưng KHÔNG còn mục nào trên thanh trái đại diện cho
 * chúng (Cài đặt/Hồ sơ sang menu ảnh đại diện; Bảng việc/Sổ tay rời rail theo chốt hai đảo).
 * Trả về id của một mục không tồn tại thì rail sẽ sáng nhầm hoặc không sáng gì — null là đúng.
 *
 * ⚠️ 23/08 — DANH SÁCH TRẢ NULL DÀI THÊM, và đây là CÁI GIÁ ĐÃ BIẾT của chốt hai viên:
 * `/files` và `/projects/<id>/overview` nay cũng null. Hai màn đó vẫn sống và vẫn vào được, chỉ
 * là thanh trái không còn mục nào đại diện ⇒ đứng ở đó thì rail **không sáng hàng nào**.
 * ⛔ Đừng "chữa" bằng cách cho nó sáng nhờ một mục gần giống (vd `/files` sáng ở Thư viện) —
 * sáng nhầm mục là NÓI DỐI VỊ TRÍ, tệ hơn hẳn không sáng gì.
 */
export function mucDangMo(duong: string | null | undefined): string | null {
  if (!duong) return null;
  if (duong === '/') return 'trang-chu';
  // Gallery phải đứng TRƯỚC `/library`: nó là tiền tố con, để sau thì Cảm hứng không bao giờ sáng.
  if (duong.startsWith('/library/gallery')) return 'cam-hung';
  if (duong.startsWith('/library') || duong.startsWith('/materials') || duong.startsWith('/colors')) return 'thu-vien';
  // Sổ dự án toàn cục. Phải đứng TRƯỚC nhánh `/projects/<id>/…` bên dưới và khớp CHÍNH XÁC,
  // nếu không `/projects/abc/overview` cũng rơi vào đây và Tổng quan không bao giờ sáng.
  if (duong === '/projects' || duong.startsWith('/projects?')) return 'du-an';

  const duAn = /^\/projects\/[^/]+\/([^/?#]+)/.exec(duong);
  if (duAn) {
    const found = MUC_RAIL.find((m) => m.duoi === duAn[1]);
    if (found) return found.id;
  }
  return null;
}

/**
 * Lý do một mục hiện MỜ — `null` nghĩa là dùng được.
 *
 * Lý do PHẢI đọc được và phải tới được bằng bàn phím: đường đi là `aria-disabled` +
 * `aria-describedby`, KHÔNG phải `title`. Bài học đo được 16/08 (`ToolbarChip.tsx:24-37`):
 * `<button disabled>` bị Tab bỏ qua hẳn và `title=` câm trên cảm ứng ⇒ đúng cái nút cần giải
 * thích nhất lại là cái mất sạch kênh giải thích.
 */
export function lyDoMo(muc: MucRail): { vi: string; en: string } | null {
  /* CHỈ mục THẬT SỰ chưa có trang mới bị tắt. "Chưa mở dự án" KHÔNG còn là lý do tắt — nó nay là
   * GỢI Ý đi kèm một đường dẫn SỐNG (xem `goiYCua` + `duongCua`). Nút chết không nói được phải
   * làm gì tiếp; nó chỉ bảo người dùng rằng họ đã sai ở đâu đó.
   *
   * ⚠️ Ghi lại vì đây là bẫy dễ lặp: *"mờ KÈM LÝ DO"* chỉ hợp lệ khi việc đó THẬT SỰ chưa làm
   * được. Ở đây làm được — chỉ là chưa ai tạo cái dự án. Khoá một cửa mở được rồi dán giấy giải
   * thích thì vẫn là cửa khoá. */
  if (muc.chuaCoTrang) return muc.chuaCoTrang;
  return null;
}

/**
 * Gợi ý đi kèm mục CÒN BẤM ĐƯỢC — khác hẳn `lyDoMo` (lý do TẮT).
 *
 * Ranh giới, để lần sau không lẫn: `lyDoMo` = *"bấm cũng không ra gì, và đây là vì sao"*;
 * `goiYCua` = *"bấm được, và đây là điều sẽ xảy ra"*. Trước 05/09 hai thứ này bị gộp làm một, nên
 * "chưa có dự án" — vốn chỉ là một trạng thái tạm — lại đi tắt mất các mục chặng.
 */
export function goiYCua(muc: MucRail, daMoDuAn: boolean): { vi: string; en: string } | null {
  if (muc.duoi && !daMoDuAn && !muc.chuaCoTrang) {
    return {
      vi: 'Chưa có dự án — bấm để tạo dự án đầu tiên',
      en: 'No project yet — tap to create your first one',
    };
  }
  return null;
}

/** Mục có bày thêm gì ở nấc 320 hay không (dùng cả ở component lẫn ở test). */
export function co320(muc: MucRail): boolean {
  return muc.mat320.kieu !== 'khong';
}
