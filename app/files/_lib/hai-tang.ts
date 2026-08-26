/**
 * app/files/_lib/hai-tang.ts — [marker: filesHaiTang] LÕI THUẦN của **hai TẦNG** màn Files.
 *
 * Hoà đưa bố cục 17/08 tối (`docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §3 · `docs/IF-KIEN-TRUC.md` §5):
 *   **Tầng ①** — THƯ MỤC HỆ THỐNG, 5 loại, mỗi loại một QUYỀN truy cập.
 *   **Tầng ②** — COLLECTION+, 8 gói component mã `COL-<LOẠI>-NNN`, tổ chức theo LOẠI VẬT.
 *
 * 🔴 **BẢN "HAI NGĂN" (chốt sáng 17/08) HẾT HIỆU LỰC.** Lõi cũ `./ngan-tho.ts` KHÔNG chết —
 * logic *phần thô dùng chung* (map texture · nhà cung cấp · **range giá**) nay sống **bên trong
 * thư mục "Nhà cung cấp"** của tầng ①, đúng lời chốt. Đừng xoá nó, cũng đừng dựng lại.
 *
 * ⭐ VÌ SAO HAI TẦNG PHẢI **THẤY ĐƯỢC**, không được rút thành một bộ lọc (Hoà: *"khác bản chất ⇒
 * phải THẤY ĐƯỢC trên giao diện"*): hai tầng khác nhau ở **TRỤC TỔ CHỨC**, không ở tập con của
 * cùng một danh sách —
 *   · tầng ① gom theo **AI ĐƯỢC ĐỘNG VÀO** (quyền), câu hỏi *"tôi có quyền gì ở đây"*;
 *   · tầng ② gom theo **VẬT ĐÓ LÀ GÌ** (loại), câu hỏi *"tôi lấy nguyên liệu loại nào"*.
 * Một bộ lọc không bao giờ đổi trục; nó chỉ cắt bớt hàng. Nên hai tầng nằm **chồng nhau trên
 * cùng một trang cuộn dọc**, mỗi tầng có tiêu đề + câu tự khai trục của mình.
 *
 * ⛔ Files là **phần THÔ** — *"chưa được thêm đủ thông tin để mang đi tạo sinh hình ảnh"*. Mọi câu
 * chữ ở đây phải nói được điều đó **và nói đường đi tiếp** (`Files → cửa sổ công cụ → Thư viện`).
 * ⛔ Nghĩa **"chợ đầu mối"** của File Manager đã **BỎ** (Hoà 16/08) — cấm dùng lại chữ đó.
 *
 * ⚠️ **KHÔNG BỊA SỐ.** Kho thật gần như rỗng; số đếm kiểu `number | null` — `null` = *chưa có
 * nguồn số thật*, giao diện hiện `—`, đúng kỷ luật đã có ở `lib/library/shelves.ts:31`.
 *
 * Thuần — không React, không DOM, không fetch. Chuỗi trả về là cặp `{vi,en}`, nơi gọi tự dịch.
 *
 * ⚠️ Import RELATIVE, không alias `@/` — bộ chạy test là `sucrase-node`, nó không đọc `paths`
 * của tsconfig (cùng lý do đã ghi ở `./ngan-tho.ts`).
 */
import type { BaMatText } from '../../../lib/materials/ba-mat';

/* ─────────────────────────── TẦNG ① · THƯ MỤC HỆ THỐNG ─────────────────────────── */

export type ThuMucKey = 'duAn' | 'studio' | 'nhaCungCap' | 'daDuyet' | 'luuTru';

export interface ThuMucDef {
  khoa: ThuMucKey;
  ten: BaMatText;
  /** Vai — thư mục này chứa gì. Một dòng, đọc là hiểu, không jargon. */
  vai: BaMatText;
  /** Quyền truy cập — thứ làm 5 thư mục khác BẢN CHẤT chứ không phải khác tên. */
  quyen: BaMatText;
  /**
   * DÁNG của huy hiệu quyền — port `docs/mocks/mock-files-hai-tang.html` (`.quy.rw/.ro/.admin`).
   * ⭐ `ro` = viền **NÉT ĐỨT**: bản vẽ cố ý chọn hình dạng chứ không chọn màu, để *Chỉ đọc*
   * **đọc được cả khi in đen trắng**. Đây là lý do trường này tồn tại — đừng rút nó thành màu.
   */
  dangQuyen: 'rw' | 'ro' | 'admin';
  /**
   * `true` = đã có nguồn dữ liệu thật đứng sau (đọc được, không bịa).
   * `false` = mặt đã dựng nhưng **chưa nối kho** ⇒ phải hiện màn trống nói thẳng còn thiếu gì,
   * **cấm nhồi dữ liệu mẫu cho đỡ trống** (luật §9: ô trống là bằng chứng còn việc).
   */
  daNoiKho: boolean;
  /** Câu cho màn trống — nói *chưa có gì* và *cái gì sẽ vào đây*, không phải câu lỗi. */
  khiTrong: BaMatText;
}

/**
 * 5 thư mục, thứ tự theo mock Hoà đưa. Thứ tự này KHÔNG tuỳ tiện: đi từ **hẹp quyền nhất**
 * (một dự án) ra **rộng dần** (toàn studio → biên tập giới hạn → chỉ đọc → quản trị).
 */
export const THU_MUC_HE_THONG: readonly ThuMucDef[] = [
  {
    khoa: 'duAn',
    ten: { vi: 'Dự án', en: 'Projects' },
    vai: { vi: 'tệp theo từng dự án', en: 'files per project' },
    quyen: { vi: 'Theo dự án', en: 'Per project' },
    dangQuyen: 'rw',
    daNoiKho: true,
    khiTrong: {
      vi: 'Dự án này chưa có tệp nào — thả bản vẽ, ảnh hoặc tài liệu vào đây.',
      en: 'This project has no files yet — drop drawings, images or documents here.',
    },
  },
  {
    khoa: 'studio',
    ten: { vi: 'Studio dùng chung', en: 'Studio shared' },
    vai: { vi: 'dùng khắp studio', en: 'used across the studio' },
    quyen: { vi: 'Toàn studio', en: 'Whole studio' },
    dangQuyen: 'rw',
    daNoiKho: false,
    khiTrong: {
      vi: 'Chưa nối kho studio. Chỗ này sẽ chứa tệp dùng chung cho mọi dự án — khuôn hồ sơ, bộ nhận diện, quy định.',
      en: 'Not connected to the studio store yet. This will hold files shared by every project — document shells, brand kits, standards.',
    },
  },
  {
    khoa: 'nhaCungCap',
    ten: { vi: 'Nhà cung cấp', en: 'Suppliers' },
    vai: {
      vi: 'map texture · nhà cung cấp · range giá',
      en: 'texture maps · suppliers · price ranges',
    },
    quyen: { vi: 'Biên tập giới hạn', en: 'Limited editing' },
    dangQuyen: 'rw',
    daNoiKho: true,
    khiTrong: {
      vi: 'Kho chung chưa có món nào — thả tệp vật liệu vào đây để bắt đầu.',
      en: 'The shared catalogue is empty — drop material files here to start.',
    },
  },
  {
    khoa: 'daDuyet',
    ten: { vi: 'Đã duyệt', en: 'Approved' },
    vai: { vi: 'nội dung đã qua Cổng duyệt', en: 'content that passed the Review Gate' },
    quyen: { vi: 'Chỉ đọc', en: 'Read only' },
    dangQuyen: 'ro',
    daNoiKho: false,
    khiTrong: {
      vi: 'Chưa có gì được duyệt. Món qua Cổng duyệt sẽ nằm ở đây và không sửa được nữa.',
      en: 'Nothing approved yet. Items that pass the Review Gate land here and can no longer be edited.',
    },
  },
  {
    khoa: 'luuTru',
    ten: { vi: 'Lưu trữ', en: 'Archive' },
    vai: { vi: 'kho lạnh', en: 'cold storage' },
    quyen: { vi: 'Quản trị viên', en: 'Administrators' },
    dangQuyen: 'admin',
    daNoiKho: false,
    khiTrong: {
      vi: 'Kho lạnh trống. Dự án đóng và bản cũ chuyển vào đây, vẫn mở lại được.',
      en: 'Cold storage is empty. Closed projects and old versions move here and can still be reopened.',
    },
  },
];

export function thuMucTheoKhoa(khoa: ThuMucKey): ThuMucDef {
  const d = THU_MUC_HE_THONG.find((x) => x.khoa === khoa);
  /* Không có đường rơi im lặng: khoá sai là lỗi lập trình, phải nổ lúc dựng chứ không phải hiện
     nhầm thư mục cho người dùng. */
  if (!d) throw new Error(`[hai-tang] không có thư mục hệ thống nào tên "${khoa}"`);
  return d;
}

/* ─────────────────────────── TẦNG ② · COLLECTION+ ─────────────────────────── */

export type GoiKey =
  | 'vatLieu' | 'furniture' | 'chiTiet' | 'cayNguoi'
  | 'designDna' | 'hocTuDuAn' | 'mauTrinhBay' | 'cachLam';

export interface GoiDef {
  khoa: GoiKey;
  /**
   * Phần `<LOẠI>` của mã `COL-<LOẠI>-NNN`. Viết HOA, chữ Latin không dấu, 2–4 ký tự — mã là thứ
   * người ta **gõ và đọc qua điện thoại**, nên không dấu và ngắn.
   */
  maLoai: string;
  ten: BaMatText;
  /** Một câu: gói này chứa gì. Không quảng cáo, không hứa tính năng chưa có. */
  moTa: BaMatText;
}

/** 8 gói, đúng danh sách và đúng thứ tự Hoà đưa. Thêm/bớt gói = đổi chốt, không phải sửa code. */
export const COLLECTION_GOI: readonly GoiDef[] = [
  {
    khoa: 'vatLieu', maLoai: 'MAT',
    ten: { vi: 'Vật liệu', en: 'Materials' },
    moTa: { vi: 'Gỗ, đá, sơn, vải, kim loại — gốc của mọi thứ khác.', en: 'Wood, stone, paint, fabric, metal — the root of everything else.' },
  },
  {
    khoa: 'furniture', maLoai: 'FUR',
    ten: { vi: 'Furniture', en: 'Furniture' },
    moTa: { vi: 'Đồ rời: bàn, ghế, sofa, giường, tủ rời.', en: 'Loose furniture: tables, chairs, sofas, beds, free-standing cabinets.' },
  },
  {
    khoa: 'chiTiet', maLoai: 'DET',
    ten: { vi: 'Chi tiết điển hình', en: 'Typical details' },
    moTa: { vi: 'Nút giao đã giải xong một lần, dùng lại được: chân tường, hèm cửa, cổ trần.', en: 'Junctions solved once and reused: skirtings, door jambs, ceiling returns.' },
  },
  {
    khoa: 'cayNguoi', maLoai: 'PLC',
    ten: { vi: 'Cây · người', en: 'Plants · people' },
    moTa: { vi: 'Vật thổi hồn cho phối cảnh — cây, dáng người, phụ kiện bày.', en: 'Scene inhabitants — plants, cut-out people, styling props.' },
  },
  {
    khoa: 'designDna', maLoai: 'DNA',
    ten: { vi: 'Design DNA', en: 'Design DNA' },
    moTa: { vi: 'Thẻ gu của một hướng thiết kế: bảng màu, vật liệu, ánh sáng, nhịp.', en: 'The card for one design direction: palette, materials, light, rhythm.' },
  },
  {
    khoa: 'hocTuDuAn', maLoai: 'LEA',
    ten: { vi: 'Gói học từ dự án', en: 'Learned from projects' },
    moTa: { vi: 'Thứ chưng cất được từ dự án đã làm, mang sang dự án sau.', en: 'What was distilled from finished projects and carried to the next one.' },
  },
  {
    khoa: 'mauTrinhBay', maLoai: 'PRE',
    ten: { vi: 'Mẫu trình bày', en: 'Presentation templates' },
    moTa: { vi: 'Khuôn trang, bảng vật liệu, biểu mẫu dự toán — vỏ để đổ nội dung vào.', en: 'Page shells, material boards, BOQ forms — containers to pour content into.' },
  },
  {
    khoa: 'cachLam', maLoai: 'PRO',
    ten: { vi: 'Cách làm', en: 'Know-how' },
    moTa: { vi: 'Quy trình và công thức: các bước đã chạy được, ghi lại để chạy lại.', en: 'Processes and recipes: steps that worked, written down so they run again.' },
  },
];

export function goiTheoKhoa(khoa: GoiKey): GoiDef {
  const g = COLLECTION_GOI.find((x) => x.khoa === khoa);
  if (!g) throw new Error(`[hai-tang] không có gói Collection+ nào tên "${khoa}"`);
  return g;
}

/**
 * Sinh mã `COL-<LOẠI>-NNN`. Số **đệm 3 chữ số** để mã xếp đúng thứ tự khi sắp theo chữ —
 * `COL-VL-002` đứng trước `COL-VL-010`, còn `COL-VL-2` thì không.
 *
 * ⚠️ Quá 999 KHÔNG cắt cụt và KHÔNG quay vòng: mã trùng là hỏng khoá nối, nặng hơn nhiều so với
 * một mã dài 4 chữ số. Trên 999 thì để mã dài ra.
 */
export function maCollection(maLoai: string, so: number): string {
  if (!Number.isInteger(so) || so < 1) {
    throw new Error(`[hai-tang] số thứ tự của mã Collection+ phải là số nguyên ≥ 1, nhận "${so}"`);
  }
  return `COL-${maLoai}-${String(so).padStart(3, '0')}`;
}

/** Đọc ngược một mã. `null` khi không đúng khuôn — dùng để kiểm chuỗi người gõ vào, không throw. */
export function docMaCollection(ma: string): { maLoai: string; so: number } | null {
  const m = /^COL-([A-Z]{2,4})-(\d{3,})$/.exec(ma.trim());
  if (!m) return null;
  const so = Number(m[2]);
  if (!Number.isInteger(so) || so < 1) return null;
  return { maLoai: m[1], so };
}

/* ─────────────────────────── BỘ LỌC của tầng ② ─────────────────────────── */

export type TrucLocKey = 'loai' | 'nguon' | 'trangThai' | 'capNhat';

export interface TrucLocDef {
  khoa: TrucLocKey;
  ten: BaMatText;
  /**
   * `true` = trục này lọc được ngay bằng dữ liệu đang có (LOẠI đọc từ chính 8 gói).
   * `false` = **chưa có dữ liệu để lọc** ⇒ nút hiện MỜ **kèm lý do**, không phải nút giả bấm
   * không ra gì (§9). Lý do đi đường `aria-describedby`, không đi `title` (bài học 16/08).
   */
  locDuoc: boolean;
  /** Lý do bắt buộc khi `locDuoc: false` — nói *vì sao chưa dùng được*, không nói "sắp có". */
  liDoMo?: BaMatText;
}

export const TRUC_LOC: readonly TrucLocDef[] = [
  { khoa: 'loai', ten: { vi: 'Loại', en: 'Type' }, locDuoc: true },
  {
    khoa: 'nguon', ten: { vi: 'Nguồn', en: 'Source' }, locDuoc: false,
    liDoMo: { vi: 'Chưa gói nào có mục để đọc nguồn.', en: 'No pack has items to read a source from yet.' },
  },
  {
    khoa: 'trangThai', ten: { vi: 'Trạng thái', en: 'Status' }, locDuoc: false,
    liDoMo: { vi: 'Chưa gói nào có mục để đọc trạng thái.', en: 'No pack has items to read a status from yet.' },
  },
  {
    khoa: 'capNhat', ten: { vi: 'Cập nhật', en: 'Updated' }, locDuoc: false,
    liDoMo: { vi: 'Chưa gói nào có mục để đọc ngày cập nhật.', en: 'No pack has items to read an update date from yet.' },
  },
];

/** Ba mức quyền của một gói Collection+ (Hoà chốt: Cá nhân · Chia sẻ nhóm · Studio). */
export type QuyenGoiKey = 'caNhan' | 'chiaSeNhom' | 'studio';

export const QUYEN_GOI: readonly { khoa: QuyenGoiKey; ten: BaMatText }[] = [
  { khoa: 'caNhan', ten: { vi: 'Cá nhân', en: 'Personal' } },
  { khoa: 'chiaSeNhom', ten: { vi: 'Chia sẻ nhóm', en: 'Shared with team' } },
  { khoa: 'studio', ten: { vi: 'Studio', en: 'Studio' } },
];

/**
 * Dòng tổng của tầng ②.
 *
 * `dem[khoa] === null` nghĩa là **chưa có nguồn số thật** cho gói đó — khác hẳn `0` (*đã đọc
 * được, và đúng là rỗng*). Trộn hai thứ này là bịa: một bên là "chưa biết", một bên là "biết là
 * không có". Câu chữ vì thế cũng phải khác nhau.
 */
export function tomTatCollection(dem: Partial<Record<GoiKey, number | null>>): BaMatText {
  const tongGoi = COLLECTION_GOI.length;
  let coSo = 0;
  let tongMon = 0;
  for (const g of COLLECTION_GOI) {
    const n = dem[g.khoa];
    if (typeof n === 'number' && Number.isFinite(n)) {
      coSo += 1;
      tongMon += n;
    }
  }
  if (coSo === 0) {
    return {
      vi: `${tongGoi} gói đã có mặt, chưa gói nào nối kho — mã ${maCollection('MAT', 1)} sẽ cấp khi có mục đầu tiên.`,
      en: `${tongGoi} packs are in place, none connected to a store yet — code ${maCollection('MAT', 1)} is issued with the first item.`,
    };
  }
  if (tongMon === 0) {
    return {
      vi: `${coSo}/${tongGoi} gói đã nối kho, cả ${coSo} gói đang rỗng.`,
      en: `${coSo} of ${tongGoi} packs are connected, all ${coSo} are empty.`,
    };
  }
  return {
    vi: `${tongMon} mục trong ${coSo}/${tongGoi} gói đã nối kho.`,
    en: `${tongMon} items across ${coSo} of ${tongGoi} connected packs.`,
  };
}

/** Chuỗi hiện cho một ô số: `null` ⇒ `—` (chưa biết), số ⇒ chính nó. Cấm hiện `0` khi chưa biết. */
export function soHoacGach(n: number | null | undefined): string {
  return typeof n === 'number' && Number.isFinite(n) ? String(n) : '—';
}
