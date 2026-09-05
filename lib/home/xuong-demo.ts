/**
 * lib/home/xuong-demo.ts — BỘ DỮ LIỆU MẪU cho Home, chép từ ba bản vẽ đã khoá
 * `docs/mocks/mock-home-lock-{co-viec,day-du,rong}.html`.
 *
 * ⚠️ VÌ SAO TỆP NÀY TỒN TẠI, nói thẳng — nó KHÔNG phải cách lách luật "cấm bịa":
 *
 *   · Bản khoá §5 định nghĩa BỐN TRẠNG THÁI mà Home phải đứng vững, và
 *     `HOME-IMPLEMENTATION-SPEC.md` §2 khai rõ nội dung của chúng là **DEMO** vì IF hiện
 *     CHƯA có nguồn thật cho "hiện vật đang dở kèm số đo được" (bảng vật liệu có m² đo từ
 *     khối 3D, mẻ render có tiến trình). Đây là bàn giao có chủ đích, không phải chỗ hổng.
 *   · Bộ này chỉ chạy khi URL nói rõ `?demo=…`. Mọi khung nó dựng đều ĐEO NHÃN
 *     `demo · dữ liệu mẫu` ở mép trên (§28) — nhãn CHỈ được gỡ khi dữ liệu đã thật, và gỡ
 *     là một thay đổi phải nêu trong báo cáo.
 *   · Đường THẬT (`/api/home/summary` + `loadResume`) là mặc định và không đi qua tệp này.
 *
 * ⛔ CẤM: dùng bộ này làm đường thoái lui khi API lỗi. API lỗi thì Home phải nói là chưa
 *    đọc được — bịa một xưởng đầy việc lên màn của người dùng là dối, không phải "đỡ trống".
 */

import type { VatHome } from './thang-chu-y';

/** Ba cảnh của bản khoá. `null` = đường thật. */
export type CanhDemo = 'co-viec' | 'day-du' | 'rong';

export function laCanhDemo(v: string | null | undefined): CanhDemo | null {
  return v === 'co-viec' || v === 'day-du' || v === 'rong' ? v : null;
}

export interface HangVatLieu {
  ten: string;
  ma: string;
  /** ô màu mẫu — token vật liệu (`--vl-*`). */
  mau: string;
  /** diện tích ĐO ĐƯỢC. `null` ⇒ hiện "— m" + "chưa đo được", KHÔNG ước tính (luật BOQ). */
  dienTich: string | null;
}

export interface DongThongSo {
  n: string;
  v: string;
}

/**
 * BA LỐI VÀO của thân "lời mời" — mỗi nút một VIỆC KHÁC NHAU.
 *
 * 🔴 Vì sao phải khai bằng MÃ VIỆC chứ không để nơi gọi đoán theo thứ tự: tới 04/09 cả ba nút
 * dùng chung đúng một `onClick` (`XuongHome.tsx:184,187,190` → `moVat`) — ba nhãn khác nhau,
 * một hành vi, và không cái nào tạo được dự án (lỗi chặn D-J04a: bấm xong `Project` 20 → 20).
 * Buộc khai mã việc thì kiểu dữ liệu tự bắt lỗi đó: thêm một lối vào mà quên nối dây là `tsc`
 * đỏ ở nhánh `switch`, không phải một nút im lặng.
 */
export type ViecBatDau =
  /** tạo dự án mới — LỐI CHÍNH (§26 `RESUME → BEGIN`) */
  | 'tao-du-an'
  /** mở một dự án đã có — đưa mắt/tiêu điểm sang cột dự án bên phải */
  | 'mo-du-an'
  /** bắt đầu từ tệp có sẵn (dwg · pdf · ảnh) */
  | 'nhap-tep';

export interface NutBatDau {
  nhan: string;
  viec: ViecBatDau;
}

/** THÂN của bậc NGAY BÂY GIỜ — hình thức đổi theo NGHĨA của vật (chỉ thị E), không theo thẻ. */
export type ThanVat =
  | { kieu: 'bang-vat-lieu'; hang: HangVatLieu[]; conLai: string; boHoanThien: string[] }
  | { kieu: 'khung-anh'; thongSo: DongThongSo[] }
  // Thân "lời mời" — dùng cho CẢ hai ca: xưởng chưa có gì, và xưởng có dự án mà máy này chưa
  // có việc dở. Câu chữ đi theo dữ liệu nên khai ở đây, KHÔNG gõ cứng trong component.
  | {
      kieu: 'bat-dau';
      tieuDe: string;
      moTa: string;
      nut: [NutBatDau, NutBatDau, NutBatDau];
      loiBa: string;
      titVon: string;
      von: DongThongSo[];
      daiMau: string[];
    }
  | { kieu: 'tom-tat'; hang: DongThongSo[] };

export interface HienVat {
  /** mặt nội dung: sáng (tờ/bảng) hay tối (khung hình). */
  nen: 'sang' | 'toi';
  dau: 'chay' | 'cho' | 'lech';
  ten: string;
  kem: string;
  chip: string | null;
  than: ThanVat;
  chan: { manh: string; nhe: string }[];
  chanCuoi: string;
  /** tiến trình ĐO ĐƯỢC 0…1 ở chân vật. Thiếu ⇒ không vạch, không %, không aria-valuenow. */
  tienDo?: number;
  href?: string;
}

export interface NutMach {
  khi: string;
  cai: string;
  no: string;
  cho?: boolean;
}

export interface OWidget {
  nh: string;
  gt: string;
  kem?: string;
  rong2?: boolean;
}

export interface BoDuLieuHome {
  /** nhãn hai ô an toàn trên dải môi trường — ĐÚNG HAI, không hơn. */
  nhanDaiTrai: { manh: string; nhe: string } | null;
  nhanDaiPhai: string | null;
  hienVat: HienVat;
  nguCanhTit: string;
  nguCanhChip: string;
  mach: NutMach[];
  vat: VatHome[];
  tenBacKeBen: string;
  tenBacNen: string;
  widget: OWidget[];
}

const T = Date.parse('2026-09-04T16:20:00');
const phut = (n: number) => T - n * 60_000;

/* ─────────────────── ① NGÀY CÓ VIỆC — bậc 1 là bảng vật liệu, nền nội dung SÁNG ─────────────────── */
const CO_VIEC: BoDuLieuHome = {
  nhanDaiTrai: { manh: 'Thảo Điền · căn hộ 96 m²', nhe: '· nền: render bản 3, hôm qua' },
  nhanDaiPhai: '16:20 · nắng xế tây',
  hienVat: {
    nen: 'sang',
    dau: 'cho',
    ten: 'Bảng vật liệu · bản 4',
    kem: 'bạn rời khỏi lúc 15:48 · đang ở bước chốt hoàn thiện',
    chip: '2 mục chờ bạn chốt',
    than: {
      kieu: 'bang-vat-lieu',
      hang: [
        { ten: 'Sồi trắng · xẻ dọc, dầu lì', ma: 'go-sh-014', mau: 'var(--vl-go)', dienTich: '38,4 m²' },
        { ten: 'Đá travertine · mài mờ', ma: 'da-tv-002', mau: 'var(--vl-da)', dienTich: '11,2 m²' },
        { ten: 'Vải bố · sofa và rèm', ma: 'va-bo-021', mau: 'var(--vl-vai)', dienTich: '17,6 m²' },
        { ten: 'Sơn khoáng · trần và tường', ma: 'so-kh-006', mau: 'var(--vl-son)', dienTich: '142,0 m²' },
        // ⭐ HỢP ĐỒNG THẬT giữa đống DEMO: thiếu số đo thì hiện "— m · chưa đo được".
        //    Luật BOQ 15/08 — BOQ chỉ nhận số ĐO ĐƯỢC, cấm ước tính cho đầy bảng.
        { ten: 'Nhôm xước · nẹp và tay nắm', ma: 'kl-nh-009', mau: 'var(--vl-kl)', dienTich: null },
        { ten: 'Sồi hun khói · mặt bếp', ma: 'go-hk-031', mau: 'var(--vl-go)', dienTich: '6,1 m²' },
        { ten: 'Gạch mộc · ban công', ma: 'da-gm-018', mau: 'var(--vl-da)', dienTich: '9,4 m²' },
      ],
      conLai: 'còn 6 mẫu nữa trong bản này · cuộn để xem',
      boHoanThien: ['var(--vl-da)', 'var(--vl-vai)', 'var(--vl-son)'],
    },
    chan: [
      { manh: '224,7 m²', nhe: 'đã đo được' },
      { manh: '2', nhe: 'mảng chưa đo · không vào bảng khối lượng' },
      { manh: '13', nhe: 'mẫu trong bản' },
    ],
    chanCuoi: 'đổi một mẫu ở đây thì bản vẽ · phối cảnh · bảng khối lượng đổi theo',
  },
  nguCanhTit: 'việc này đi từ đâu tới',
  nguCanhChip: 'đổi mẫu ở đây đụng tới 3 chỗ',
  mach: [
    { khi: '21.08', cai: 'Thẻ DNA “Trầm · gỗ sồi”', no: 'chốt cùng chủ nhà, 6 ảnh tham chiếu' },
    { khi: '28.08 · họp', cai: 'Bỏ đá trắng, giữ travertine', no: 'chủ trì duyệt · biên bản có 20 giây tiếng gốc' },
    { khi: 'hôm nay', cai: 'Bảng vật liệu bản 4', no: 'bản 3 vẫn giữ, lùi lại được' },
    { khi: 'đang chờ bản này', cai: 'Bảng khối lượng · hồ sơ khách', no: 'khoá 2 mục còn lại là cả hai chạy tiếp', cho: true },
  ],
  tenBacKeBen: 'kề bên',
  tenBacNen: 'nền',
  vat: [
    { id: 'd1', ten: 'Phối cảnh phòng khách · góc B', loai: 'vat-the', trangThai: 'can-toi', lucCuoi: phut(300), soSong: 'bản 3 · 4 ghi chú chưa xử', href: '#' },
    { id: 'd2', ten: 'Bộ hoàn thiện · phòng ngủ chính', loai: 'vat-the', trangThai: 'can-toi', lucCuoi: phut(2880), soSong: '5 mẫu · chưa gắn vào khối nào', href: '#' },
    { id: 'd3', ten: 'Mặt bằng trục C · triển khai', loai: 'vat-the', trangThai: 'can-toi', lucCuoi: phut(1440), soSong: '2 kích thước bếp chưa chốt', href: '#' },
    { id: 'd4', ten: 'Render đêm · 6 khung', loai: 'viec', trangThai: 'dang-chay', lucCuoi: phut(20), soSong: '4/6', tienDo: 0.64 },
    { id: 'd5', ten: 'Dựng khối tủ bếp · đang tính', loai: 'viec', trangThai: 'dang-chay', lucCuoi: phut(25), soSong: '31%', tienDo: 0.31 },
    { id: 'd6', ten: 'Cổng duyệt · trưởng bộ môn', loai: 'viec', trangThai: 'dang-cho', lucCuoi: phut(40), soSong: '2 ngày' },
    { id: 'd7', ten: 'Báo giá nhôm · chờ nhà cung cấp', loai: 'viec', trangThai: 'dang-cho', lucCuoi: phut(60), soSong: '3 ngày' },
    { id: 'd8', ten: 'Hồ sơ Nam Long · lệch chuẩn thoát', loai: 'viec', trangThai: 'lech', lucCuoi: phut(90), soSong: '1 lỗi' },
    ...Array.from({ length: 4 }, (_, i) => ({
      id: `dz${i}`, ten: `việc đang ngủ ${i + 1}`, loai: 'viec' as const, trangThai: 'ngu' as const, lucCuoi: phut(4000 + i),
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `dp${i}`, ten: `dự án đang ngủ ${i + 1}`, loai: 'du-an' as const, trangThai: 'ngu' as const, lucCuoi: phut(9000 + i),
    })),
  ],
  widget: [
    { nh: 'giờ đã ghi tuần này', gt: '18,5', kem: 'giờ · 4 dự án', rong2: true },
    { nh: 'mẫu mới trong kho', gt: '12' },
    { nh: 'thẻ DNA', gt: '6' },
  ],
};

/* ───────── ② NHIỀU DỰ ÁN — 14 dự án · 11 việc chờ. HÌNH HỌC PHẢI Y HỆT khung ① ───────── */
const DAY_DU: BoDuLieuHome = {
  nhanDaiTrai: { manh: 'Ba dự án đang chạy song song', nhe: '· nền: mẻ render đêm nay' },
  nhanDaiPhai: '20:34 · đèn trong nhà',
  hienVat: {
    nen: 'toi',
    dau: 'chay',
    ten: 'Phối cảnh phòng ăn · mẻ đêm',
    kem: 'đang chạy từ 20:12 · bạn đặt 6 khung, xong 4',
    chip: 'còn khoảng 22 phút',
    than: {
      kieu: 'khung-anh',
      thongSo: [
        { n: 'Khung đã xong', v: '4 / 6' },
        { n: 'Độ phân giải', v: '3000 px' },
        { n: 'Giờ trong cảnh', v: '19:30' },
        { n: 'Vật liệu bám theo', v: '13 mã' },
        { n: 'Nguồn khối', v: 'bản dựng 7' },
        { n: 'Chi phí mẻ', v: '24 cr' },
      ],
    },
    // Tiến trình ĐO ĐƯỢC thật (4/6 khung) ⇒ có vạch + có aria-valuenow. Loại không đo được
    // thì trường này để trống — union `lib/ui/tien-trinh.ts` cũng cấm bịa % đúng như vậy.
    tienDo: 4 / 6,
    chan: [
      { manh: '4/6', nhe: 'khung' },
      { manh: '67%', nhe: '' },
    ],
    chanCuoi: 'đổi vật liệu lúc này thì mẻ chạy lại từ khung 5',
  },
  nguCanhTit: 'mẻ này đi từ đâu tới',
  nguCanhChip: 'ba dự án dùng chung 6 mã vật liệu',
  mach: [
    { khi: '02.09', cai: 'Bản dựng khối 7', no: 'chốt cao độ trần và hốc đèn' },
    { khi: '03.09', cai: 'Khoá bộ vật liệu 13 mã', no: 'lấy từ bảng vật liệu bản 4' },
    { khi: 'tối nay', cai: 'Mẻ render 6 khung', no: 'xong khung nào thấy khung đó' },
    { khi: 'đang chờ mẻ này', cai: 'Deck trình chủ đầu tư', no: 'khung 5 và 6 là hai trang cuối', cho: true },
  ],
  tenBacKeBen: 'kề bên',
  tenBacNen: 'nền',
  vat: [
    ...Array.from({ length: 14 }, (_, i) => ({
      id: `p${i}`,
      ten: ['Thảo Điền · căn hộ', 'Nam Long · nhà phố', 'An Phú · văn phòng', 'Sala · duplex', 'Thủ Thiêm · penthouse',
        'Quận 7 · showroom', 'Đà Lạt · homestay', 'Hội An · quán cà phê', 'Nha Trang · căn hộ biển',
        'Bình Dương · nhà máy', 'Long An · biệt thự', 'Cần Thơ · nhà hàng', 'Huế · nhà vườn', 'Sapa · lodge'][i],
      loai: 'du-an' as const,
      trangThai: 'can-toi' as const,
      lucCuoi: phut(200 + i * 90),
      soSong: `${(i % 5) + 1} việc mở · chặng ${['2D', '3D', 'Trình chiếu'][i % 3]}`,
      href: '#',
    })),
    ...Array.from({ length: 11 }, (_, i) => ({
      id: `w${i}`,
      ten: ['Mẻ render đêm · Nam Long', 'Dựng tủ bếp · An Phú', 'Cổng duyệt · trưởng bộ môn', 'Báo giá đá · nhà cung cấp',
        'Xuất hồ sơ · Sala', 'Kiểm chuẩn thoát · Thủ Thiêm', 'Chờ ảnh hiện trường · Hội An', 'Dựng khối · Đà Lạt',
        'Duyệt bảng khối lượng · Quận 7', 'Chờ Brand Kit · Nha Trang', 'Đối chiếu cao độ · Huế'][i],
      loai: 'viec' as const,
      trangThai: (i % 3 === 0 ? 'dang-chay' : i % 3 === 1 ? 'dang-cho' : 'lech') as 'dang-chay' | 'dang-cho' | 'lech',
      lucCuoi: phut(10 + i * 12),
      soSong: i % 3 === 0 ? `${30 + i * 5}%` : i % 3 === 1 ? `${i + 1} ngày` : `${i % 3} lỗi`,
      ...(i % 3 === 0 ? { tienDo: (30 + i * 5) / 100 } : {}),
    })),
  ],
  widget: [
    { nh: 'giờ đã ghi tuần này', gt: '31,0', kem: 'giờ · 9 dự án', rong2: true },
    { nh: 'mẫu mới trong kho', gt: '24' },
    { nh: 'thẻ DNA', gt: '11' },
  ],
};

/* ─────────────── ③ RỖNG — RESUME → BEGIN. Vẫn ra studio đang sống, không phải Home-trừ-ảnh ─────────────── */
const RONG: BoDuLieuHome = {
  nhanDaiTrai: { manh: 'Kho ảnh tuyển của IF', nhe: '· không phải dữ liệu của ai' },
  nhanDaiPhai: '09:10 · nắng sớm',
  hienVat: {
    nen: 'sang',
    dau: 'cho',
    ten: 'Bắt đầu',
    kem: 'chưa có việc nào đang dở — xưởng thì đã sẵn sàng',
    chip: '3 lối vào',
    than: {
      kieu: 'bat-dau',
      tieuDe: 'Dựng dự án đầu tiên của bạn',
      moTa:
        'Khai vị trí công trình là đủ để IF gợi ngay bộ quy chuẩn áp dụng, khí hậu và vật liệu sẵn có ' +
        'tại đó. Vẽ 2D, dựng 3D hay dán ảnh tham chiếu — vào cửa nào cũng được, không cửa nào bị khoá.',
      nut: [
        { nhan: 'Tạo dự án mới', viec: 'tao-du-an' },
        { nhan: 'Mở dự án có sẵn', viec: 'mo-du-an' },
        { nhan: 'Nhập từ tệp · dwg · pdf · ảnh', viec: 'nhap-tep' },
      ],
      loiBa: 'Chưa muốn bắt đầu? Xem thư viện mẫu hồ sơ và kho vật liệu ở cột bên.',
      titVon: 'xưởng này đã có sẵn',
      daiMau: ['var(--vl-go)', 'var(--vl-da)', 'var(--vl-vai)', 'var(--vl-kl)', 'var(--vl-son)'],
      von: [
        { n: 'Vật liệu trong kho chung', v: '248' },
        { n: 'Mẫu hồ sơ trình bày', v: '12' },
        { n: 'Bộ quy chuẩn theo vùng', v: '12' },
        { n: 'Thẻ DNA thiết kế mẫu', v: '6' },
      ],
    },
    chan: [
      { manh: '0', nhe: 'dự án' },
      { manh: '0', nhe: 'việc đang chạy' },
    ],
    chanCuoi: 'tạo dự án xong, chỗ này thành việc bạn đang dở',
  },
  nguCanhTit: 'một dự án ở IF đi qua đâu',
  nguCanhChip: 'vào cửa nào cũng được',
  mach: [
    { khi: 'bước 1', cai: 'Vị trí và đề bài', no: 'một biến kéo theo cả bộ quy chuẩn áp dụng' },
    { khi: 'bước 2', cai: 'Ý tưởng và thẻ DNA', no: 'moodboard · ảnh tham chiếu · quyết định có nguồn' },
    { khi: 'bước 3', cai: 'Bản vẽ · khối · phối cảnh', no: 'ba chặng soi vào cùng một nguồn' },
    { khi: 'bước 4', cai: 'Hồ sơ giao khách', no: 'con số trong hồ sơ truy được về khối đã dựng', cho: true },
  ],
  // Thang KHÔNG biến mất khi rỗng — nó đổi thứ đứng trên bậc: từ "việc cần tôi" sang "vốn tôi có".
  tenBacKeBen: 'sẵn để mở ngay',
  tenBacNen: 'kho của xưởng',
  vat: [
    { id: 'r1', ten: 'Mẫu hồ sơ · căn hộ hoàn thiện', loai: 'vat-the', trangThai: 'can-toi', lucCuoi: phut(10), soSong: '14 trang · đã có khung tên', href: '#' },
    { id: 'r2', ten: 'Thẻ DNA mẫu · “Trầm · gỗ sồi”', loai: 'vat-the', trangThai: 'can-toi', lucCuoi: phut(20), soSong: '8 lớp · 6 ảnh tham chiếu', href: '#' },
    { id: 'r3', ten: 'Khung tên · bộ nhận diện trống', loai: 'vat-the', trangThai: 'can-toi', lucCuoi: phut(30), soSong: '9 ô · chờ Brand Kit của dự án', href: '#' },
    { id: 'r4', ten: 'Vật liệu · có giá và nhà cung cấp', loai: 'vat-the', trangThai: 'dang-chay', lucCuoi: phut(40), soSong: '248' },
    { id: 'r5', ten: 'Cấu kiện dựng sẵn', loai: 'vat-the', trangThai: 'dang-chay', lucCuoi: phut(50), soSong: '54' },
    { id: 'r6', ten: 'Bộ quy chuẩn theo vùng', loai: 'vat-the', trangThai: 'dang-chay', lucCuoi: phut(60), soSong: '12' },
    { id: 'r7', ten: 'Ảnh tuyển liên ngành', loai: 'vat-the', trangThai: 'dang-chay', lucCuoi: phut(70), soSong: '1.240' },
    { id: 'r8', ten: 'Kho mẫu hồ sơ', loai: 'vat-the', trangThai: 'ngu', lucCuoi: phut(900) },
    { id: 'r9', ten: 'Bộ nhận diện mẫu', loai: 'vat-the', trangThai: 'ngu', lucCuoi: phut(950) },
  ],
  widget: [
    { nh: 'kho chung cập nhật', gt: '12', kem: 'mẫu mới tuần này', rong2: true },
    { nh: 'thẻ DNA mẫu', gt: '6' },
    { nh: 'bộ quy chuẩn', gt: '12' },
  ],
};

export function boDemo(canh: CanhDemo): BoDuLieuHome {
  return canh === 'day-du' ? DAY_DU : canh === 'rong' ? RONG : CO_VIEC;
}
