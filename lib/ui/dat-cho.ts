/**
 * lib/ui/dat-cho.ts — LUẬT ĐẶT CHỖ cho mọi bề mặt nổi (Hoà chốt 20/08).
 * Chạy test: `node_modules/.bin/sucrase-node lib/ui/dat-cho.test.ts`
 *
 * 🔴 OVERLAY NHỎ KHÔNG ĐƯỢC MẶC ĐỊNH RA GIỮA MÀN.
 *
 * BẢY BƯỚC, chạy theo đúng thứ tự này:
 *   ① neo vào HÀNH ĐỘNG/NGUỒN đã gọi nó
 *   ② nở ra HƯỚNG NGOÀI từ nguồn (về phía nhiều chỗ trống hơn)
 *   ③ TRÁNH CHE nội dung chính (canvas chính · vật đang chọn · thanh công cụ đang dùng)
 *   ④ gần mép màn thì LẬT sang phía kia
 *   ⑤ KẸP trong viewport
 *   ⑥ QUÁ LỚN ⇒ đổi thành INSPECTOR CẮM BÊN
 *   ⑦ VIỆC SÂU ⇒ đổi sang CHẾ ĐỘ TOÀN KHÔNG GIAN LÀM VIỆC
 *
 * ⭐⭐ ĐIỂM ĐẮT NHẤT, DỄ BỎ QUA NHẤT — **KÍCH CỠ QUYẾT ĐỊNH LOẠI BỀ MẶT, KHÔNG CHỈ TOẠ ĐỘ.**
 * Một bảng to KHÔNG được là "popover nhưng to". Nó phải ĐỔI LOẠI. Vì thế ⑥⑦ chạy TRƯỚC ①-⑤
 * trong hiện thực dưới đây: hỏi "đây là loại gì" xong mới hỏi "đứng đâu" — hỏi ngược lại là
 * đẻ ra đúng con vật luật này cấm (một tấm 700px lơ lửng giữa màn, kẹp viewport rất chỉnh tề).
 *
 * 🔴 HỘP THOẠI GIỮA MÀN: CHỈ cho quyết định NGẮN và CHẶN — xác nhận · xoá · cảnh báo nghiêm
 * trọng · một câu hỏi gật/lắc. ⛔ CẤM biểu mẫu dài / cài đặt ra giữa màn (khớp luật vật liệu:
 * biểu mẫu dày thì ĐẶC, và nay thêm: ĐẶT BÊN, KHÔNG ĐẶT GIỮA).
 *
 * ⚠️ Luật này chi phối LÚC MỞ. Người dùng kéo đi đâu là quyền của họ — `useKeoBeMat` giữ nguyên.
 */

export interface Hop {
  x: number;
  y: number;
  rong: number;
  cao: number;
}

export interface KhungNhin {
  rong: number;
  cao: number;
}

/** Ba hạng theo kích cỡ. Hạng quyết LOẠI, loại quyết cách đặt. */
export type HangCo = 'nho' | 'vua' | 'lon';

/**
 * Loại bề mặt:
 *   · `popover`         gần nguồn, phải CÒN NHÌN THẤY vật nó đang điều khiển
 *   · `inspector-canh`  cắm mép trái/phải, canvas chính VẪN THẤY
 *   · `toan-khong-gian` chiếm không gian làm việc
 *   · `giua-man`        CHỈ cho quyết định ngắn và chặn — không suy ra từ kích cỡ, phải khai tay
 */
export type LoaiBeMat = 'popover' | 'inspector-canh' | 'toan-khong-gian' | 'giua-man';

export const LE = 12;
/** Khe giữa nguồn và bề mặt — đủ để mắt đọc ra hai vật, không đủ để thành hai vật rời nhau. */
export const KHE = 10;

/**
 * 🔴 HAI VÙNG CẤM THƯỜNG TRỰC — KHÔNG phải "ưu tiên mềm", là VÙNG CẤM.
 *   · mép TRÊN  — chrome app, nơi **Vitals** đứng  → kênh *"tôi nên biết gì"*
 *   · mép DƯỚI  — **dải hành động**                → kênh *"vừa xảy ra gì"*
 * Vì sao đây là cấm chứ không phải né-nếu-tiện: một bề mặt TẠM THỜI mà bịt mất HAI HỆ THƯỜNG
 * TRỰC là đổi mất thứ đắt lấy thứ rẻ. Người dùng đang làm việc, overlay che Vitals thì họ mất
 * đúng kênh cảnh báo vào đúng lúc cần nó nhất — và họ không biết là mình đang mất.
 * Con số là SÀN mặc định; nơi gọi đo DOM thật thì truyền `camTren`/`camDuoi` chính xác hơn.
 */
export const CAM_TREN = 48;
export const CAM_DUOI = 56;

/**
 * NGƯỠNG HẠNG CỠ. Vì sao đúng những con số này (ghi lại để lượt sau khỏi chỉnh theo cảm giác):
 *   · `NHO_RONG = 380`  — `BeMatNoi` mặc định 360; 380 ôm trọn mọi viên/popover đang có mà
 *     không nới tới cỡ một bảng. Trên 380 thì nó thôi là "một dòng cạnh vật".
 *   · `NHO_CAO = 0.40`  — trên 40% chiều cao khung nhìn, một tấm neo cạnh nguồn KHÔNG còn cách
 *     nào không che vật đang chọn: chỉ cần nguồn nằm ở nửa dưới là nó phủ gần hết nửa trên.
 *     Đây là ngưỡng của bước ③, không phải ngưỡng thẩm mỹ.
 *   · `VUA_RONG = 520`  — trần bề rộng một inspector cắm bên còn để canvas thở trên màn 1280
 *     (1280 − 520 = 760, vẫn hơn nửa). Rộng hơn nữa thì canvas thành cái khe.
 *   · `VUA_CAO = 0.92`  — cao hơn nữa thì nó đã là cả cột màn hình; lúc đó gọi là inspector
 *     chỉ còn là cách gọi, thực chất là một chế độ làm việc.
 */
export const NGUONG = {
  NHO_RONG: 380,
  NHO_CAO: 0.4,
  VUA_RONG: 520,
  VUA_CAO: 0.92,
} as const;

export function hangCo(beMat: { rong: number; cao: number }, khung: KhungNhin): HangCo {
  if (beMat.rong <= NGUONG.NHO_RONG && beMat.cao <= khung.cao * NGUONG.NHO_CAO) return 'nho';
  if (beMat.rong <= NGUONG.VUA_RONG && beMat.cao <= khung.cao * NGUONG.VUA_CAO) return 'vua';
  return 'lon';
}

export function loaiTheoHang(hang: HangCo): Exclude<LoaiBeMat, 'giua-man'> {
  return hang === 'nho' ? 'popover' : hang === 'vua' ? 'inspector-canh' : 'toan-khong-gian';
}

export interface YeuCauDatCho {
  nguon: Hop | null;
  beMat: { rong: number; cao: number };
  khung: KhungNhin;
  /**
   * Vùng KHÔNG ĐƯỢC CHE — canvas chính · **vật đang chọn** · thanh công cụ đang dùng.
   * ⚠️ Tin của Hoà bị cắt ở *"AVOID COVERING: primary canvas · current…"*; đọc là **vật/vùng
   * đang chọn**, và mở rộng sang thanh công cụ đang dùng (cùng lý do: che thứ người dùng vừa
   * chạm là hỏng mục đích tồn tại). Nếu cách đọc đúng hẹp hơn thì chỉ cần truyền ít vùng hơn —
   * thuật toán không đổi.
   */
  tranhChe?: Hop[];
  /**
   * Chiều cao vùng cấm mép trên (chrome + Vitals) và mép dưới (dải hành động).
   * Bỏ trống ⇒ dùng `CAM_TREN`/`CAM_DUOI`. Truyền 0 chỉ khi màn đó THẬT SỰ không có hai dải đó.
   */
  camTren?: number;
  camDuoi?: number;
  /** Khai tay khi bề mặt là quyết định NGẮN + CHẶN (xác nhận/xoá/cảnh báo). Thắng mọi bước. */
  quyetDinhChan?: boolean;
}

export interface KetQuaDatCho {
  loai: LoaiBeMat;
  hang: HangCo;
  x: number;
  y: number;
  /** Bề rộng/cao thực dùng — hạng `vua`/`lon` bị khung nhìn quyết lại, không giữ cỡ đề nghị. */
  rong: number;
  cao: number;
  /** Popover nở lên hay xuống / cắm bên trái hay phải. */
  huong: 'duoi' | 'tren' | 'trai' | 'phai' | 'giua';
  /** ④ đã phải lật vì sát mép chưa. */
  daLat: boolean;
  /** ③ đã phải dời ngang để thôi che vùng cấm chưa. */
  daNeChe: boolean;
}

const kep = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));
const giao = (a: Hop, b: Hop) =>
  a.x < b.x + b.rong && a.x + a.rong > b.x && a.y < b.y + b.cao && a.y + a.cao > b.y;

/** BẢY BƯỚC. Thứ tự trong thân hàm chính là thứ tự luật. */
export function datCho(yc: YeuCauDatCho): KetQuaDatCho {
  const {
    nguon,
    beMat,
    khung,
    tranhChe = [],
    quyetDinhChan = false,
    camTren = CAM_TREN,
    camDuoi = CAM_DUOI,
  } = yc;
  const hang = hangCo(beMat, khung);
  /* Dải dọc HỢP LỆ sau khi trừ hai vùng cấm thường trực. Mọi phép kẹp dọc dùng dải này, không
     dùng cả khung nhìn — kẹp vào cả khung là cách âm thầm đè lên Vitals/dải hành động. */
  const yMin = LE + camTren;
  const yMax = khung.cao - LE - camDuoi;
  /* Nguồn cũng là vùng KHÔNG ĐƯỢC CHE (che chính cái vừa bấm là hỏng mục đích tồn tại). */
  const cheDay: Hop[] = nguon ? [...tranhChe, nguon] : tranhChe;

  /* ⑥⑦ ĐỔI LOẠI TRƯỚC — kích cỡ quyết định LOẠI, không chỉ toạ độ. */
  if (quyetDinhChan) {
    // Hộp thoại giữa màn: chỉ ở đây, và chỉ khi nơi gọi khai rõ đây là quyết định ngắn+chặn.
    const rong = Math.min(beMat.rong, khung.rong - LE * 2);
    const cao = Math.min(beMat.cao, khung.cao - LE * 2);
    return {
      loai: 'giua-man',
      hang,
      x: Math.round((khung.rong - rong) / 2),
      y: Math.round((khung.cao - cao) / 2),
      rong,
      cao,
      huong: 'giua',
      daLat: false,
      daNeChe: false,
    };
  }

  if (hang === 'lon') {
    // ⑦ việc sâu ⇒ toàn không gian làm việc. Vẫn chừa lề để nó đọc ra là MỘT LỚP, không phải
    // "trang khác" — người dùng phải thấy mình chưa rời khỏi chỗ cũ.
    return {
      loai: 'toan-khong-gian',
      hang,
      x: LE,
      y: yMin,
      rong: khung.rong - LE * 2,
      cao: yMax - yMin,
      huong: 'giua',
      daLat: false,
      daNeChe: false,
    };
  }

  if (hang === 'vua') {
    // ⑥ inspector CẮM BÊN. Cắm về phía nguồn đứng (nguồn bên phải ⇒ cắm phải): tay đang ở đó.
    const benPhai = !nguon || nguon.x + nguon.rong / 2 >= khung.rong / 2;
    const rong = Math.min(beMat.rong, Math.max(280, khung.rong - 360));
    const cao = Math.min(beMat.cao, yMax - yMin);
    return {
      loai: 'inspector-canh',
      hang,
      x: benPhai ? khung.rong - rong - LE : LE,
      y: yMin,
      rong,
      cao,
      huong: benPhai ? 'phai' : 'trai',
      daLat: false,
      daNeChe: false,
    };
  }

  /* ---- HẠNG NHỎ: popover, đi đủ ①-⑤ ---- */

  // Không có nguồn ⇒ KHÔNG có "mọc từ nguồn". Đặt góc trên-phải thay vì giữa màn: giữa màn là
  // chỗ của quyết định chặn, mượn chỗ đó cho một viên ngữ cảnh là nói sai mức độ nghiêm trọng.
  if (!nguon) {
    return {
      loai: 'popover',
      hang,
      x: khung.rong - beMat.rong - LE,
      y: yMin,
      rong: beMat.rong,
      cao: beMat.cao,
      huong: 'duoi',
      daLat: false,
      daNeChe: false,
    };
  }

  // ① neo vào nguồn · ② nở ra HƯỚNG NGOÀI — phía nào nhiều chỗ trống hơn thì đi phía đó.
  const chodDuoi = yMax - (nguon.y + nguon.cao) - KHE;
  const choTren = nguon.y - KHE - yMin;
  let huong: 'duoi' | 'tren' = chodDuoi >= beMat.cao || chodDuoi >= choTren ? 'duoi' : 'tren';
  // ④ sát mép ⇒ LẬT sang phía kia (chỉ lật khi phía kia thật sự chứa nổi).
  let daLat = false;
  if (huong === 'duoi' && chodDuoi < beMat.cao && choTren >= beMat.cao) {
    huong = 'tren';
    daLat = true;
  } else if (huong === 'tren' && choTren < beMat.cao && chodDuoi >= beMat.cao) {
    huong = 'duoi';
    daLat = true;
  }

  let y = huong === 'duoi' ? nguon.y + nguon.cao + KHE : nguon.y - beMat.cao - KHE;
  let x = nguon.x + nguon.rong / 2 - beMat.rong / 2;

  // ③ TRÁNH CHE — dời NGANG trước (dời dọc là rời khỏi nguồn, mất trí nhớ không gian).
  let daNeChe = false;
  for (const vung of cheDay) {
    const hienTai: Hop = { x, y, rong: beMat.rong, cao: beMat.cao };
    if (!giao(hienTai, vung)) continue;
    const sangPhai = vung.x + vung.rong + KHE;
    const sangTrai = vung.x - beMat.rong - KHE;
    // Chọn phía dời ÍT hơn — bề mặt vẫn phải ở gần nguồn, né không được thành bỏ chạy.
    const ungVien = [sangPhai, sangTrai]
      .filter((v) => v >= LE && v + beMat.rong <= khung.rong - LE)
      .sort((a, b) => Math.abs(a - x) - Math.abs(b - x));
    if (ungVien.length > 0) {
      x = ungVien[0];
      daNeChe = true;
    }
  }

  // ⑤ KẸP trong viewport — luôn là bước cuối, sau mọi lần dời.
  x = kep(x, LE, khung.rong - beMat.rong - LE);
  y = kep(y, yMin, yMax - beMat.cao);

  return {
    loai: 'popover',
    hang,
    x: Math.round(x),
    y: Math.round(y),
    rong: beMat.rong,
    cao: beMat.cao,
    huong,
    daLat,
    daNeChe,
  };
}
