/**
 * lib/home/thang-chu-y.ts — THANG CHÚ Ý bốn bậc của Home (bản khoá `docs/delivery/DESIGN-LOCK-HOME.md` §1).
 *
 *   NGAY BÂY GIỜ · KỀ BÊN · NỀN · KHI GỌI
 *
 * ⭐ CƠ CHẾ — đọc kỹ trước khi sửa, vì đây là chỗ cả bản khoá đứng hoặc đổ:
 *
 *   ① BẬC DO TRẠNG THÁI TÍNH RA, KHÔNG DO NGƯỜI DỰNG GÁN CỨNG VÀO JSX.
 *      Vì thế hàm này THUẦN (không React, không DOM, không đọc giờ hệ thống) và có test —
 *      `thang-chu-y.test.ts`. Không vật nào giành được sự chú ý chỉ vì nó tồn tại.
 *
 *   ② BẬC QUYẾT ĐỊNH VẬT ĐƯỢC CẤP BAO NHIÊU THÂN:
 *        NGAY BÂY GIỜ → một THÂN đầy đủ (đầu · thân · chân có số thật)
 *        KỀ BÊN       → một MẶT NHÌN (hình + một số sống)
 *        NỀN          → một DÒNG có số
 *        KHI GỌI      → một CON SỐ có tên loại
 *
 *   ③ HỆ QUẢ BẮT BUỘC — MẬT ĐỘ TĂNG THÌ VẬT **TỤT BẬC**, KHÔNG ĐÒI THÊM CHỖ.
 *      Đây là điểm chết của bản thăm dò H2 (hết chỗ ở ~9 món) mà bản khoá sinh ra để giải.
 *      Thi hành bằng TRẦN CỨNG cho từng bậc: vật vượt trần **tụt xuống bậc dưới**, và thứ rơi
 *      khỏi bậc NỀN thì **được ĐẾM** ở bậc KHI GỌI — không mục nào biến mất im lặng (§30).
 *      ⇒ 3 vật hay 40 vật thì `keBen.length` và `nen.length` **y hệt nhau** ⇒ hình học không
 *        đổi một pixel. Test khẳng định đúng câu đó; đừng nới trần để "cho vừa thêm một món".
 *
 *   ④ KHỔ HẸP KHÔNG ĐỔI HỆ, CHỈ ĐỔI **SỐ NGƯỜI ĐỨNG TRÊN MỖI BẬC** (bản khoá §6).
 *      Trần hẹp hơn 1 ở KỀ BÊN và NỀN; thứ bị thu **tụt xuống KHI GỌI và được đếm ở đó**.
 */

/** Bốn bậc, theo đúng thứ tự chú ý giảm dần. */
export type Bac = 'ngay-bay-gio' | 'ke-ben' | 'nen' | 'khi-goi';

/**
 * TRẠNG THÁI của một vật — đây là ĐẦU VÀO THẬT của phép tính bậc.
 * Không có trường nào tên "bậc" hay "ưu tiên": người gọi **không được** tự gán bậc.
 */
export type TrangThai =
  /** chính là việc người dùng đang dở (nguồn: `loadResume` + `buildResumeCard`) */
  | 'dang-do'
  /** người dùng vừa sờ tới, và nó đang chờ CHÍNH NGƯỜI DÙNG làm tiếp */
  | 'can-toi'
  /** máy đang chạy — có tiến trình đo được hoặc đang tính */
  | 'dang-chay'
  /** đang chờ NGƯỜI KHÁC / bên ngoài (duyệt, báo giá, nhà cung cấp) */
  | 'dang-cho'
  /** máy kiểm báo lệch chuẩn — cần xem lại */
  | 'lech'
  /** không đòi hỏi gì ở người dùng lúc này */
  | 'ngu';

/** Loại vật — dùng để ĐẶT TÊN cho con số ở bậc KHI GỌI ("còn 4 việc và 6 dự án đang ngủ"). */
export type LoaiVat = 'viec' | 'du-an' | 'vat-the';

export interface VatHome {
  id: string;
  ten: string;
  loai: LoaiVat;
  trangThai: TrangThai;
  /** mốc thời gian gần nhất (ms). Dùng để xếp TRONG cùng một bậc, KHÔNG dùng để chọn bậc. */
  lucCuoi: number;
  /** câu số sống của vật ("4 ghi chú chưa xử", "2 ngày"). Thiếu thì bậc dưới không bịa. */
  soSong?: string;
  /**
   * tiến trình ĐO ĐƯỢC 0…1. **Chỉ đặt khi thật sự đo được** — cùng luật với union của
   * `lib/ui/tien-trinh.ts`: không đo được thì KHÔNG có phần trăm, không có `aria-valuenow`.
   */
  tienDo?: number;
  /** đường đi khi bấm; thiếu thì vật không phải lối vào (không dựng nút chết). */
  href?: string;
}

/** Trần cứng từng bậc. Đổi số ở đây là ĐỔI HÌNH HỌC — phải sửa bản vẽ cùng lượt. */
export const TRAN = { keBen: 3, nen: 5 } as const;
export const TRAN_HEP = { keBen: 2, nen: 4 } as const;

export interface DemKhiGoi {
  loai: LoaiVat;
  soLuong: number;
}

export interface KetQuaThang {
  ngayBayGio: VatHome | null;
  keBen: VatHome[];
  nen: VatHome[];
  /** đếm theo LOẠI — con số có tên loại, không phải một cục "còn N mục" vô nghĩa. */
  khiGoi: DemKhiGoi[];
  /** tổng số vật nằm ở bậc KHI GỌI. 0 ⇒ không dựng dòng "gọi ra". */
  tongKhiGoi: number;
}

/** Bậc TỰ NHIÊN của một trạng thái — trước khi trần cứng can thiệp. */
export function bacTuTrangThai(t: TrangThai): Bac {
  switch (t) {
    case 'dang-do':
      return 'ngay-bay-gio';
    case 'can-toi':
      return 'ke-ben';
    case 'dang-chay':
    case 'dang-cho':
    case 'lech':
      return 'nen';
    case 'ngu':
      return 'khi-goi';
  }
}

/** Thứ tự xếp TRONG một bậc: mới sờ tới đứng trước; hoà thì theo id cho tất định. */
function moiTruoc(a: VatHome, b: VatHome): number {
  if (b.lucCuoi !== a.lucCuoi) return b.lucCuoi - a.lucCuoi;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * XẾP THANG — hàm thuần: đầu vào là danh sách vật kèm trạng thái, đầu ra là bốn bậc đã đủ trần.
 *
 * Luật tụt bậc (một chiều, không bao giờ thăng):
 *   NGAY BÂY GIỜ vượt 1  → phần dư xuống KỀ BÊN
 *   KỀ BÊN vượt trần     → phần dư xuống NỀN
 *   NỀN vượt trần        → phần dư xuống KHI GỌI (được ĐẾM, không mất)
 *
 * ⚠️ KHÔNG có nhánh nào nới trần, và KHÔNG có nhánh nào trả về nhiều hơn trần. Đó chính là
 *    câu "mật độ tăng thì bố cục không vỡ" ở dạng máy kiểm được.
 */
export function xepThang(vat: readonly VatHome[], khoHep = false): KetQuaThang {
  const tran = khoHep ? TRAN_HEP : TRAN;

  const gio: VatHome[] = [];
  const ke: VatHome[] = [];
  const nen: VatHome[] = [];
  const goi: VatHome[] = [];

  for (const v of vat) {
    const b = bacTuTrangThai(v.trangThai);
    if (b === 'ngay-bay-gio') gio.push(v);
    else if (b === 'ke-ben') ke.push(v);
    else if (b === 'nen') nen.push(v);
    else goi.push(v);
  }

  gio.sort(moiTruoc);
  ke.sort(moiTruoc);
  nen.sort(moiTruoc);

  // ĐÚNG MỘT tiêu điểm (D-DR2). Việc dở thứ hai KHÔNG phải tiêu điểm thứ hai — nó tụt bậc.
  const ngayBayGio = gio.length > 0 ? gio[0] : null;
  const keDay = [...gio.slice(1), ...ke].sort(moiTruoc);

  const keCuoi = keDay.slice(0, tran.keBen);
  const nenDay = [...keDay.slice(tran.keBen), ...nen].sort(moiTruoc);

  const nenCuoi = nenDay.slice(0, tran.nen);
  const goiDay = [...nenDay.slice(tran.nen), ...goi];

  const dem = new Map<LoaiVat, number>();
  for (const v of goiDay) dem.set(v.loai, (dem.get(v.loai) ?? 0) + 1);
  const thuTuLoai: LoaiVat[] = ['viec', 'du-an', 'vat-the'];
  const khiGoi = thuTuLoai
    .filter((l) => (dem.get(l) ?? 0) > 0)
    .map((loai) => ({ loai, soLuong: dem.get(loai) as number }));

  return { ngayBayGio, keBen: keCuoi, nen: nenCuoi, khiGoi, tongKhiGoi: goiDay.length };
}

const TEN_LOAI: Record<LoaiVat, string> = {
  viec: 'việc',
  'du-an': 'dự án',
  'vat-the': 'vật',
};

/**
 * Câu của bậc KHI GỌI — "còn 4 việc và 6 dự án đang ngủ". Rỗng thì trả `null` để UI
 * **không dựng mục rỗng** (bản khoá §5 "thiếu dữ liệu"), chứ không hiện "còn 0 mục".
 */
export function cauKhiGoi(k: readonly DemKhiGoi[]): string | null {
  if (k.length === 0) return null;
  const phan = k.map((d) => `${d.soLuong} ${TEN_LOAI[d.loai]}`);
  const doan =
    phan.length === 1 ? phan[0] : `${phan.slice(0, -1).join(', ')} và ${phan[phan.length - 1]}`;
  return `còn ${doan} đang ngủ`;
}
