/**
 * lib/ui/trang-thai-tuong-tac.ts — [marker: trangThaiTuongTac] MA TRẬN TRẠNG THÁI TƯƠNG TÁC
 * DÙNG CHUNG. Đây là NƠI DUY NHẤT khai "trạng thái nào nói bằng kênh thị giác nào".
 *
 * ⭐ VÌ SAO CÓ FILE NÀY — một lỗi IF đã trả giá thật (00-CHOT 16/08). Tầng "trỏ vào" và tầng
 * "đang chạy" cùng rơi về VIỀN, và chỉ phát hiện ra khi Hoà chỉ tận tay. Lúc đó cách chữa là
 * tách bằng CHUYỂN ĐỘNG: viền sáng ĐỨNG YÊN = con trỏ đang ở đây · viền CHẠY vòng = đang chạy.
 * Nhưng cách chữa đó nằm trong một câu văn xuôi — câu văn xuôi không chặn được lần va thứ hai.
 * File này biến nó thành thứ MÁY CHẶN: hai trạng thái khai cùng một kênh ĐỘNG ⇒ test ĐỎ.
 *
 * [Đ2] NHÌN VÀO TRONG TRƯỚC — file này KHÔNG sáng tác lại thứ đã có:
 *   · nhịp ms  ← `lib/ui/nhip.ts` (NHIP/thoiLuong/DUONG_CONG). Không gõ số ms ở đây.
 *   · đo được / không đo được ← `lib/ui/tien-trinh.ts`. Trạng thái `dangChay` KHÔNG mang `pct`;
 *     muốn hiện tiến độ thì nơi gọi tự truyền `TienTrinh` vào — lõi không suy hộ, không bịa số.
 *   · màu ← token trong `app/globals.css`. File này chỉ TRỎ TÊN token, cấm hex mới.
 * Phần thật sự mới là DUY NHẤT một thứ: bảng phân kênh + luật chống va kênh. Grep toàn repo
 * trước khi dựng: không có module nào khai bảng này; mỗi component tự chế inline (ví dụ
 * `ToolbarChip.tsx:109-119` tự đặt border/background/opacity cho active + disabled). Đó đúng
 * là hình dạng của bệnh "cùng một thứ khai nhiều chỗ" — nên đây là CONNECT, không phải NEW.
 *
 * ⛔ LUẬT KHÔNG NHÂN NHƯỢNG
 *   ① Mỗi hiệu ứng PHẢI MANG NGHĨA. Cấm quầng sáng trang trí (NT-11 + LightState).
 *   ② Hai trạng thái khác nhau CẤM dùng chung một kênh ĐỘNG — xem `vaChamKenhDong()`.
 *   ③ `hong` (FAILED) phải DỪNG HẲN chuyển động. Lỗi mà còn nhấp nháy thì đọc ra là "vẫn đang
 *      chạy", tức là nói sai đúng lúc người dùng cần đọc đúng nhất.
 *   ④ `prefers-reduced-motion` THẮNG TUYỆT ĐỐI — mọi kênh động phải có bản TĨNH nói đủ tin.
 */

import { NHIP, type BacNhip } from './nhip';

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ① MƯỜI TRẠNG THÁI
   Tên tiếng Việt là tên chính (khoá dùng trong code); cột EN chỉ để đối chiếu phiếu.
   ════════════════════════════════════════════════════════════════════════════════════════════ */

export const TRANG_THAI = [
  'nghi', //      IDLE
  'troVao', //    HOVER
  'dangBam', //   PRESSED
  'dangChon', //  SELECTED
  'dangChay', //  RUNNING
  'dangCho', //   WAITING
  'canChuY', //   NEEDS ATTENTION
  'xong', //      DONE
  'hong', //      FAILED
  'voHieu', //    DISABLED
] as const;

export type TrangThai = (typeof TRANG_THAI)[number];

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ② BẢY KÊNH THỊ GIÁC
   Kênh = MỘT cách nói. Trạng thái mượn kênh để nói; hai trạng thái mượn cùng một kênh động là
   hai người nói chồng lời — người nghe không tách được ai đang nói gì.
   ════════════════════════════════════════════════════════════════════════════════════════════ */

export const KENH = [
  'nen', //            màu nền của chính vật
  'vienDung', //       viền sáng ĐỨNG YÊN
  'vienChay', //       viền sáng CHẠY vòng          ← ĐỘNG
  'doNoi', //          độ nổi (bóng đổ / nhấc lên)
  'bienDangCucBo', //  biến dạng cục bộ (một mép phồng/lõm)  ← ĐỘNG khi lặp
  'tuSac', //          tụ sắc — dồn màu về một vùng nhỏ
  'chuDau', //         chữ + dấu hiệu hình dạng (kênh dự phòng, KHÔNG bao giờ được thiếu)
] as const;

export type Kenh = (typeof KENH)[number];

/** Kênh nào là kênh ĐỘNG (chuyển động lặp lại). Chỉ những kênh này mới va nhau được. */
export const KENH_DONG: ReadonlySet<Kenh> = new Set<Kenh>(['vienChay', 'bienDangCucBo']);

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ③ BẢNG PHÂN KÊNH — hợp đồng của cả app
   ════════════════════════════════════════════════════════════════════════════════════════════ */

export interface HinhThaiTrangThai {
  /** Mọi kênh trạng thái này chiếm. Kênh không nêu ⇒ giữ nguyên như `nghi`. */
  readonly kenh: readonly Kenh[];
  /**
   * Kênh ĐỘNG mà trạng thái này ĐỘC CHIẾM, hoặc `null` khi nó đứng yên hoàn toàn.
   * Đây là trường làm nên luật ②: hai trạng thái cùng giá trị khác `null` là VA CHẠM.
   */
  readonly kenhDong: Kenh | null;
  /** Tên token màu trong globals.css. `null` = giữ màu nền sẵn có, không tô gì thêm. */
  readonly mau: string | null;
  /** Nhịp đi VÀO trạng thái này (đọc từ `lib/ui/nhip.ts`, cấm gõ ms tại chỗ). */
  readonly nhip: BacNhip;
  /** Câu nói bằng CHỮ — kênh dự phòng bắt buộc khi màu/ánh sáng không tới được người dùng. */
  readonly nhan: string;
  /** Vì sao trạng thái này được cấp đúng kênh đó. Có mặt để lần sửa sau không đổi bừa. */
  readonly viSao: string;
}

export const MA_TRAN: Readonly<Record<TrangThai, HinhThaiTrangThai>> = {
  nghi: {
    kenh: [],
    kenhDong: null,
    mau: null,
    nhip: 'bam',
    nhan: '',
    viSao: 'Mặc định. Trường LẶNG — không có gì đang xảy ra thì không có gì phải sáng.',
  },
  troVao: {
    kenh: ['nen', 'vienDung'],
    kenhDong: null,
    mau: '--accent-ring',
    nhip: 'bam',
    nhan: '',
    viSao:
      'Viền sáng ĐỨNG YÊN = con trỏ đang ở đây. Cố ý đứng yên để tách khỏi dangChay — đây là ' +
      'cách chữa ca va kênh 16/08, nay thành hợp đồng máy giữ.',
  },
  dangBam: {
    kenh: ['nen', 'bienDangCucBo'],
    kenhDong: null,
    mau: '--accent-soft',
    nhip: 'bam',
    nhan: '',
    viSao:
      'Biến dạng cục bộ MỘT LẦN (lún xuống dưới ngón tay) — không lặp nên không phải kênh động, ' +
      'không va với canChuY. Phản hồi bấm phải tức thì, dùng nhịp nhanh nhất.',
  },
  dangChon: {
    kenh: ['vienDung', 'nen', 'chuDau'],
    kenhDong: null,
    mau: '--accent',
    nhip: 'bam',
    nhan: 'Đang chọn',
    viSao:
      'Chung kênh vienDung với troVao nhưng KHÔNG va: vienDung là kênh TĨNH, và hai trạng thái ' +
      'này khác nhau ở độ đậm + ở chỗ dangChon còn giữ khi con trỏ đã rời đi.',
  },
  dangChay: {
    kenh: ['vienChay', 'chuDau'],
    kenhDong: 'vienChay',
    mau: '--accent',
    nhip: 'vien',
    nhan: 'Đang chạy',
    viSao:
      'Viền CHẠY vòng = đang có việc diễn ra, đọc được TỪ XA khi lướt cả màn. BẮT BUỘC kèm chữ: ' +
      'bật giảm-chuyển-động là viền đứng yên, lúc đó ánh sáng không còn nói được gì — test bắt ' +
      'được đúng lỗ này. Không mang phần trăm: nơi gọi truyền TienTrinh vào, lõi không suy hộ.',
  },
  dangCho: {
    kenh: ['nen', 'chuDau'],
    kenhDong: null,
    mau: '--t4',
    nhip: 'vien',
    nhan: 'Đang chờ',
    viSao:
      'Chờ KHÁC chạy — chờ thì chưa tiêu tài nguyên nào. Cố ý KHÔNG cấp kênh động: cho nó nhấp ' +
      'nháy là nói dối rằng máy đang làm việc.',
  },
  canChuY: {
    kenh: ['bienDangCucBo', 'tuSac', 'chuDau'],
    kenhDong: 'bienDangCucBo',
    mau: '--warning',
    nhip: 'vien',
    nhan: 'Cần xem lại',
    viSao:
      'Biến dạng cục bộ LẶP + tụ sắc hổ phách tại đúng chỗ có chuyện. Gọi bằng hình dạng chứ ' +
      'không bằng độ chói: chói thì tranh chấp với dangChay, hình dạng thì không.',
  },
  xong: {
    kenh: ['chuDau'],
    kenhDong: null,
    mau: '--success',
    nhip: 'vien',
    nhan: 'Xong',
    viSao:
      'Xong thì ánh sáng TAN ĐI, không đổi màu rồi ở lại sáng mãi. Việc đã xong không còn là ' +
      'thứ đang xảy ra, nên không được chiếm kênh ánh sáng nữa.',
  },
  hong: {
    kenh: ['vienDung', 'tuSac', 'chuDau'],
    kenhDong: null,
    mau: '--danger',
    nhip: 'vien',
    nhan: 'Lỗi',
    viSao:
      'CHUYỂN ĐỘNG DỪNG HẲN — đây là tin quan trọng nhất của trạng thái này. Còn nhấp nháy là ' +
      'đọc ra "vẫn đang chạy", tức nói sai đúng lúc người dùng cần đọc đúng nhất.',
  },
  voHieu: {
    kenh: ['nen', 'chuDau'],
    kenhDong: null,
    mau: '--t4',
    nhip: 'bam',
    nhan: 'Chưa dùng được',
    viSao:
      'Mờ đi qua token --mo-vo-hieu (theo theme, không gõ 0.5 tại chỗ) và BẮT BUỘC kèm lý do ' +
      'bằng chữ — §9 cấm nút giả không lý do.',
  },
};

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ④ BA MÁY CANH — luật thành thứ chặn được, không phải thứ nhắc nhau
   ════════════════════════════════════════════════════════════════════════════════════════════ */

export interface VaCham {
  readonly kenh: Kenh;
  readonly cacTrangThai: readonly TrangThai[];
}

/**
 * Tìm mọi ca HAI trạng thái trở lên cùng độc chiếm một kênh ĐỘNG.
 * Trả mảng rỗng nghĩa là bảng sạch. Test khẳng định nó LUÔN rỗng ⇒ ai thêm trạng thái mới mà
 * tiện tay cấp lại `vienChay` sẽ thấy test đỏ ngay, không đợi tới lúc Hoà chỉ tận tay.
 */
export function vaChamKenhDong(): VaCham[] {
  const theoKenh = new Map<Kenh, TrangThai[]>();
  for (const tt of TRANG_THAI) {
    const k = MA_TRAN[tt].kenhDong;
    if (k == null) continue;
    const ds = theoKenh.get(k) ?? [];
    ds.push(tt);
    theoKenh.set(k, ds);
  }
  const ra: VaCham[] = [];
  for (const [kenh, cacTrangThai] of theoKenh) {
    if (cacTrangThai.length > 1) ra.push({ kenh, cacTrangThai });
  }
  return ra;
}

/**
 * Trạng thái nào PHẢI đứng yên tuyệt đối. `hong` nằm đây vì lý do nghĩa (xem MA_TRAN.hong);
 * `xong` và `nghi` nằm đây vì không còn việc gì đang xảy ra để mà động.
 */
export const PHAI_DUNG_YEN: readonly TrangThai[] = ['nghi', 'xong', 'hong', 'voHieu'];

/** Trạng thái này có được phép mang chuyển động lặp không. */
export function duocPhepDong(tt: TrangThai): boolean {
  return !PHAI_DUNG_YEN.includes(tt) && MA_TRAN[tt].kenhDong != null;
}

/**
 * Trạng thái nào BẮT BUỘC có chữ đi kèm (kênh dự phòng — màu không bao giờ là kênh duy nhất).
 * Ba trạng thái con-trỏ (troVao/dangBam) không nằm đây: chúng nói về thao tác đang diễn ra chứ
 * không mang tin cần đọc lại, và người dùng bàn phím đã có vòng focus riêng.
 */
export function batBuocCoChu(tt: TrangThai): boolean {
  return MA_TRAN[tt].kenh.includes('chuDau');
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ⑤ ĐỌC RA THUỘC TÍNH ĐEM DÙNG
   ════════════════════════════════════════════════════════════════════════════════════════════ */

/** Thời lượng (ms) khi đi VÀO trạng thái, đã tính giảm-chuyển-động ở nơi gọi. */
export function nhipVao(tt: TrangThai): number {
  return NHIP[MA_TRAN[tt].nhip];
}

/** Biểu thức CSS của màu trạng thái, hoặc `null` khi trạng thái không tô màu gì. */
export function mauTrangThai(tt: TrangThai): string | null {
  const m = MA_TRAN[tt].mau;
  return m == null ? null : `var(${m})`;
}

/**
 * Nhãn cho trình đọc màn hình. Ghép nhãn trạng thái với tên vật.
 * Trạng thái không có nhãn (nghi/troVao/dangBam) trả về đúng tên vật — không bịa thêm chữ.
 */
export function nhanTrangThai(tt: TrangThai, tenVat: string): string {
  const n = MA_TRAN[tt].nhan;
  return n ? `${tenVat} — ${n}` : tenVat;
}
