/**
 * lib/wallpaper/mau-bo.ts — [marker: bangMauBo] NỬA CÒN THIẾU của "bộ = hình nền + BẢNG MÀU".
 *
 * ══ VÌ SAO TỆP NÀY TỒN TẠI ══
 * `sets.ts` (16/08) đã dựng xong nửa HÌNH NỀN: năm bộ, sinh bằng mã, 240 phép đo tương phản.
 * Nhưng nó **cố ý** không mang màu nhấn — chú thích ngay trong tệp đó viết: bão hoà ≤ 0.12 để
 * *"không bộ nào bị khoá vào màu nhấn"*, vì lúc ấy màu nhấn thứ hai chưa chốt.
 *
 * Hoà chốt 30/08 (`IF-CHUAN-NEN.md` §4) đổi đúng điều đó: **bộ = hình nền + bảng màu ĐI LIỀN**,
 * và *"accent `#6a57f5` không còn là hằng số — nó là accent của MỘT bộ trong năm"*.
 * ⇒ Tệp này gắn bảng màu vào năm bộ ĐÃ CÓ. Nó **không đẻ bộ thứ sáu** và không sửa `sets.ts`.
 *
 * ══ NÓ KHÔNG LÀM GÌ (nói trước, để không ai tưởng đã xong) ══
 * Tệp này **CHƯA** nối vào `app/globals.css`. `--accent` trong CSS vẫn là hằng số `#6a57f5`.
 * Nối token là một lượt ghi vào bề mặt cả app đang dùng — việc của lượt sau, có tên trong
 * `docs/control/IF-HE-5-BO-MAU.md` §5. Ở đây mới là **khai báo + RANGE + CỔNG**.
 *
 * THUẦN — không import React/DOM. Chạy được `sucrase-node` (xem `mau-bo.test.ts` cạnh tệp).
 */

import { relLuminance, type RGB } from '../adaptive-contrast';
import {
  GOC_MAU_NGHIA,
  BAN_KINH_CAM,
  hslToRgb,
  khoangCachHue,
  trongVungCam,
  WALLPAPER_SETS,
} from './sets';

/* ================================================================== *
 * ① BỀ MẶT ĐỐI CHỨNG — chữ và thẻ mà accent phải sống chung
 * ================================================================== *
 * ⚠️ BẢN SAO token của `app/globals.css`, cùng bệnh và cùng thuốc với `contrast.ts`:
 * `mau-bo.test.ts` đọc thẳng CSS và khẳng định từng giá trị dưới đây khớp. Bản sao trôi
 * thì test đỏ. Đúng ca vừa xảy ra: `--card` sáng đổi `#ffffff` → `#fdfdff` ngày 30/08,
 * bản sao trong `contrast.ts` không đổi theo, và drift-guard là thứ duy nhất bắt được.
 */
export const DOI_CHUNG = {
  /** Chữ trắng đứng TRÊN nền accent (nút chính, chip đang chọn). */
  chuTren: [255, 255, 255] as RGB,
  /** `--card` theme sáng — accent làm viền/icon/chấm đứng cạnh mặt thẻ này. */
  cardSang: [253, 253, 255] as RGB,
  /** `--card` theme tối. */
  cardToi: [26, 26, 30] as RGB,
} as const;

/** Màu AI (`--mau-ai` mòng két #1f7f88 ≈ 187°). Accent trùng vùng này là mượn nghĩa của nó. */
export const GOC_MAU_AI = 187;

/* ================================================================== *
 * ② BA BẤT ĐẲNG THỨC — nguồn của mọi biên trên trục SÁNG
 * ================================================================== */

/** WCAG 2.2 §1.4.3 — chữ thường trên nền accent. */
export const NGUONG_CHU = 4.5;
/** WCAG 2.2 §1.4.11 — thành phần KHÔNG phải chữ (viền, icon mang nghĩa, chấm trạng thái). */
export const NGUONG_PHI_CHU = 3.0;

export function tuongPhan(a: RGB, b: RGB): number {
  const x = Math.max(relLuminance(a), relLuminance(b));
  const y = Math.min(relLuminance(a), relLuminance(b));
  return (x + 0.05) / (y + 0.05);
}

export interface DoAccent {
  /** chữ trắng trên nền accent — WCAG §1.4.3, sàn 4.5 */
  chuTrenAccent: number;
  /** accent đứng cạnh `--card` sáng — WCAG §1.4.11, sàn 3.0 */
  vsCardSang: number;
  /** accent đứng cạnh `--card` tối — WCAG §1.4.11, sàn 3.0 */
  vsCardToi: number;
}

export function doAccent(c: RGB): DoAccent {
  return {
    chuTrenAccent: tuongPhan(DOI_CHUNG.chuTren, c),
    vsCardSang: tuongPhan(c, DOI_CHUNG.cardSang),
    vsCardToi: tuongPhan(c, DOI_CHUNG.cardToi),
  };
}

export function accentDat(c: RGB): boolean {
  const d = doAccent(c);
  return (
    d.chuTrenAccent >= NGUONG_CHU &&
    d.vsCardSang >= NGUONG_PHI_CHU &&
    d.vsCardToi >= NGUONG_PHI_CHU
  );
}

/**
 * 🔑 HÀM QUYẾT ĐỊNH CỦA CẢ TỆP — **RANGE trên trục sáng không phải một cặp số gõ tay,
 * nó được TÍNH cho từng (hue, sat).**
 *
 * Ba bất đẳng thức kẹp hai đầu và kẹp rất chặt:
 *   · chữ trắng đọc được TRÊN accent  ⇒ accent phải đủ TỐI   (chặn biên TRÊN)
 *   · accent phân biệt được với card sáng ⇒ đủ TỐI            (chặn biên TRÊN)
 *   · accent phân biệt được với card tối  ⇒ đủ SÁNG           (chặn biên DƯỚI)
 *
 * Đo được: cửa sổ còn lại chỉ rộng **0,045–0,070** trên thang L. Đó là con số nói thẳng cho
 * người dùng: trục sáng gần như KHÔNG có tự do, và không phải vì ai keo kiệt — vì ba luật
 * WCAG cắt nhau ở đó. Tự do thật nằm ở trục HUE.
 *
 * @returns `null` nếu cặp (hue, sat) không có l nào hợp lệ — khi đó cặp đó bị TỪ CHỐI,
 *          không phải kẹp về biên (kẹp về một biên không tồn tại là bịa ra một giá trị hợp lệ).
 */
export function khoangSang(hue: number, sat: number, buoc = 0.005): [number, number] | null {
  let lo = Number.NaN;
  let hi = Number.NaN;
  for (let l = buoc; l <= 1 - buoc; l += buoc) {
    if (!accentDat(hslToRgb(hue, sat, l))) continue;
    if (Number.isNaN(lo)) lo = l;
    hi = l;
  }
  if (Number.isNaN(lo)) return null;
  return [Number(lo.toFixed(3)), Number(hi.toFixed(3))];
}

/* ================================================================== *
 * ③ VÙNG CẤM TRÊN TRỤC HUE — accent không được mượn nghĩa của màu khác
 * ================================================================== */

/**
 * Cùng luật ① của `sets.ts` (nền không được ngả vào phổ màu nghĩa), áp thêm cho ACCENT và
 * áp thêm **màu AI**. Lý do giống hệt và đã trả giá: một màu mang nghĩa mà bị màu khác đứng
 * sát bên cạnh thì nghĩa của nó loãng đi. `--mau-ai` là màu MANG NGHĨA (*"bấm vào đây sinh ra
 * sản phẩm từ AI"*, chú thích `globals.css`), nên nó vào danh sách này chứ không được miễn.
 */
export const GOC_CAM: Record<string, number> = { ...GOC_MAU_NGHIA, ai: GOC_MAU_AI };

export function hueBiCam(hue: number): string | null {
  for (const [ten, goc] of Object.entries(GOC_CAM)) {
    if (khoangCachHue(hue, goc) < BAN_KINH_CAM) return ten;
  }
  return null;
}

/**
 * 🔴 NỀN DÙNG LUẬT CŨ, KHÔNG DÙNG LUẬT MỞ RỘNG — và đây là chỗ suýt sai.
 * Lượt đầu tôi áp `hueBiCam` (đã thêm màu AI 187°) cho CẢ nền. Đo ra ngay: bộ `binh-do`
 * có hue nền **205°**, cách 187° đúng **18°** ⇒ một bộ ĐANG CHẠY THẬT, đã qua 240 phép đo
 * tương phản từ 16/08, bỗng thành "vi phạm" vì một luật vừa viết xong hôm nay.
 * ⇒ Luật mở rộng chỉ áp cho ACCENT (bão hoà 0,35–0,92, hue đọc ra rõ). Nền bão hoà ≤ 0,12
 * gần như vô sắc, không đủ sắc để mượn nghĩa của màu nào — nó giữ đúng luật ① của `sets.ts`.
 * Bài học: một luật mới mà phán ngược lại thứ đã đo được thì nghi LUẬT trước, đừng nghi vật.
 */
export function nenHueBiCam(hue: number): string | null {
  if (!trongVungCam(hue)) return null;
  for (const [ten, goc] of Object.entries(GOC_MAU_NGHIA)) {
    if (khoangCachHue(hue, goc) < BAN_KINH_CAM) return ten;
  }
  return null;
}

/* ================================================================== *
 * ④ NĂM BẢNG MÀU — mỗi bộ một cá tính nghệ thuật, CÓ NGUỒN
 * ================================================================== */

export interface BangMauBo {
  /** Khoá về đúng bộ trong `WALLPAPER_SETS` — không đẻ id mới. */
  setId: string;
  /** Trường phái / cá tính nghệ thuật bộ này ánh xạ tới. */
  phongCach: [string, string];
  /** Nguồn của ánh xạ đó — tên người/trường phái có thật, tra được. */
  nguon: string;
  /** Một câu cá tính: bộ này dành cho người làm việc kiểu gì. */
  caTinh: [string, string];
  /** Accent khai bằng HSL để RANGE kiểm được trên đúng trục người dùng chỉnh. */
  accent: { h: number; s: number; l: number };
}

/**
 * ⚠️ Ánh xạ dưới đây là **ĐỌC LẠI năm bộ đã có**, không phải năm bộ mới. Cơ chế ánh sáng của
 * mỗi bộ (`WallpaperLayer`) vốn đã là một hiện tượng thị giác có tên trong lịch sử nghệ thuật;
 * việc ở đây là gọi đúng tên nó và gắn một màu nhấn hợp với nó.
 *
 * 🔴 NÓI THẲNG MỘT ĐIỀU KHÔNG ĐẸP: năm bộ này khác nhau ở HÌNH HỌC và (từ nay) ở ACCENT,
 * nhưng nền của cả năm đều nằm ở nửa LẠNH (hue 205–248, bão hoà ≤ 0,11). Về nhiệt độ màu
 * chúng là **một cá tính**, không phải năm. Khoảng trống đó có tên và có số:
 * `docs/control/IF-HE-5-BO-MAU.md` §3.
 */
export const BANG_MAU_BO: BangMauBo[] = [
  {
    setId: 'chan-troi',
    phongCach: ['Trường màu · ánh sáng là chủ thể', 'Color field · light as subject'],
    nguon: 'Mark Rothko (color field) · James Turrell, Skyspace — dải màu ngang, không có vật thể, mắt đọc ÁNH SÁNG chứ không đọc hình',
    caTinh: [
      'Người làm việc trong không khí và ánh sáng trước khi làm việc trong đường nét.',
      'Works in air and light before working in line.',
    ],
    /* Accent hiện hành của app. GIỮ NGUYÊN TỪNG BYTE `#6a57f5` — đây là bộ mặc định
       (`WALLPAPER_SETS[0]`), nên "accent không còn là hằng số" vẫn không làm app đổi mặt
       ở cấu hình mặc định. Đổi mặc định là việc của Hoà, không phải hệ quả phụ của lượt này. */
    accent: { h: 247.2, s: 0.885, l: 0.65 },
  },
  {
    setId: 'o-cua',
    phongCach: ['Sáng-tối tương phản · nội thất Bắc Âu', 'Chiaroscuro · Nordic interior'],
    nguon: 'Caravaggio (tenebrism) → Vilhelm Hammershøi — một vệt nắng qua ô cửa trên tường trống, phần còn lại lùi vào tối',
    caTinh: [
      'Người dựng cảnh bằng MỘT nguồn sáng và chấp nhận phần còn lại tối.',
      'Stages a scene with ONE light source and lets the rest go dark.',
    ],
    accent: { h: 322, s: 0.62, l: 0.475 },
  },
  {
    setId: 'binh-do',
    phongCach: ['Kiến tạo · trường phái Thuỵ Sĩ', 'Constructivist · Swiss International Style'],
    nguon: 'Josef Müller-Brockmann, "Grid Systems in Graphic Design" · bản in lam (cyanotype) — chỉ nét và lưới, không giả vờ có chiều sâu',
    caTinh: [
      'Người tin bản vẽ hơn phối cảnh; đọc công trình bằng nét trước khi bằng ảnh.',
      'Trusts the drawing over the render; reads a building in lines first.',
    ],
    /* Hue 215 là lam bản vẽ (Prussian blue của bản in lam ≈ 210°) — ánh xạ theo NGHĨA
       của chính bộ, không phải chọn cho hợp mắt. */
    accent: { h: 215, s: 0.8, l: 0.48 },
  },
  {
    setId: 'tang-sau',
    phongCach: ['Thuỷ mặc · phối cảnh khí quyển', 'Ink wash · aerial perspective'],
    nguon: 'Sơn thuỷ 山水 / sumi-e · Leonardo da Vinci, "prospettiva aerea" — lớp càng xa càng nhạt và càng ngả lạnh',
    caTinh: [
      'Người nghĩ theo lớp và khoảng lùi, không theo mặt phẳng đơn.',
      'Thinks in receding planes, not a single flat surface.',
    ],
    accent: { h: 285, s: 0.55, l: 0.51 },
  },
  {
    setId: 'mat-phang',
    phongCach: ['Tối giản vật liệu · wabi-sabi', 'Material minimalism · wabi-sabi'],
    nguon: 'Donald Judd (specific objects) · Tadao Ando (bê tông trần, ánh sáng liếm mép) — vật liệu tự nói, không cần trang trí thêm',
    caTinh: [
      'Người để vật liệu tự nói; ghét thêm chi tiết không mang tin.',
      'Lets the material speak; refuses detail that carries no information.',
    ],
    /* Hue 82 (rêu/patina) là ô trống DUY NHẤT còn lại ở nửa ẤM sau khi trừ vùng cấm:
       danger 10° · warning 37° · success 145° · AI 187°, mỗi cái ±20°. Xem §2 của
       `IF-HE-5-BO-MAU.md` — không phải chọn tuỳ hứng, là chỗ duy nhất còn chỗ. */
    accent: { h: 82, s: 0.55, l: 0.302 },
  },
];

export function bangMauCua(setId: string): BangMauBo {
  return BANG_MAU_BO.find((b) => b.setId === setId) ?? BANG_MAU_BO[0];
}

/** HSL của bảng màu → RGB. */
export function accentRgb(b: Pick<BangMauBo, 'accent'>): RGB {
  return hslToRgb(b.accent.h, b.accent.s, b.accent.l);
}

export function rgbToHex(c: RGB): string {
  return '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/* ================================================================== *
 * ⑤ RANGE — người dùng chỉnh được gì, tới đâu, VÌ SAO tới đó
 * ================================================================== */

/**
 * Nguồn của một biên. Ba nhãn, và nhãn thứ ba **cố ý xấu xí** để không ai đọc nhầm một chốt
 * sản phẩm thành một hằng số nghiên cứu (`IF-CHUAN-NEN.md` §5 dạy đúng bài đó: thứ chưa có
 * nguồn mà im lặng trôi qua thì sáu tháng sau thành "chuẩn").
 */
export type NguonBien = 'WCAG-2.2' | 'LUAT-IF' | 'CHOT-SAN-PHAM-CHUA-CO-NGUON';

export interface TokenChinhDuoc {
  khoa: 'accentHue' | 'accentSat' | 'accentL' | 'nenHue' | 'nenSat' | 'nacGiamChoi';
  ten: [string, string];
  /** `null` = biên KHÔNG phải hằng số, nó được TÍNH (xem `khoangSang`). */
  bien: [number, number] | null;
  nguon: NguonBien;
  /** Vì sao biên DƯỚI ở đúng đó. */
  vieBienDuoi: string;
  /** Vì sao biên TRÊN ở đúng đó. */
  vieBienTren: string;
}

export const TOKEN_CHINH_DUOC: TokenChinhDuoc[] = [
  {
    khoa: 'accentHue',
    ten: ['Góc màu nhấn', 'Accent hue'],
    bien: [0, 360],
    nguon: 'LUAT-IF',
    vieBienDuoi:
      'Trục hue TỰ DO gần như toàn vòng — hue không đổi độ đọc, nên không có lý do WCAG nào để khoá nó. Đây là chỗ cá nhân hoá THẬT.',
    vieBienTren:
      'Trừ bốn vùng cấm ±20°: danger 10° · warning 37° · success 145° · AI 187°. Accent đứng trong đó là mượn nghĩa của một màu đã có nghĩa (cùng luật ① của sets.ts).',
  },
  {
    khoa: 'accentSat',
    ten: ['Bão hoà màu nhấn', 'Accent saturation'],
    bien: [0.35, 0.92],
    nguon: 'CHOT-SAN-PHAM-CHUA-CO-NGUON',
    vieBienDuoi:
      'Dưới 0,35 thì với L bị ba bất đẳng thức ép vào cửa sổ hẹp, accent đọc ra như một xám ngả màu — "đơn sắc + 1 accent" sập thành "đơn sắc". CHƯA có nguồn nghiên cứu cho đúng con số 0,35.',
    vieBienTren:
      'Trần 0,92 chứa được accent hiện hành (0,885) và chừa biên. CHƯA có nguồn; nghi ngờ đang treo: trên màn P3 màu sát mép gam rung so với nền trung tính — chưa đo.',
  },
  {
    khoa: 'accentL',
    ten: ['Độ sáng màu nhấn', 'Accent lightness'],
    bien: null,
    nguon: 'WCAG-2.2',
    vieBienDuoi:
      'Biên DƯỚI = chỗ accent bắt đầu lẫn vào --card TỐI (§1.4.11, sàn 3,0). Tối hơn nữa thì viền/icon accent biến mất trên theme tối.',
    vieBienTren:
      'Biên TRÊN = chỗ SỚM NHẤT trong hai luật gãy: chữ trắng trên accent tụt dưới 4,5 (§1.4.3), hoặc accent lẫn vào --card SÁNG (§1.4.11, sàn 3,0). Cả hai biên TÍNH theo (hue, sat) — xem khoangSang().',
  },
  {
    khoa: 'nenHue',
    ten: ['Góc màu nền', 'Wallpaper hue'],
    bien: [0, 360],
    nguon: 'LUAT-IF',
    vieBienDuoi: 'Tự do, trừ vùng cấm — cùng luật với accentHue.',
    vieBienTren:
      'Trừ BA vùng cấm ±20° (danger · warning · success) — KHÔNG trừ màu AI: nền bão hoà ≤ 0,12 gần vô sắc, không đủ sắc để mượn nghĩa. Nền ngả đỏ thì cảnh báo đỏ mất trọng lượng (luật ① sets.ts).',
  },
  {
    khoa: 'nenSat',
    ten: ['Bão hoà nền', 'Wallpaper saturation'],
    bien: [0, 0.12],
    nguon: 'LUAT-IF',
    vieBienDuoi:
      '0 = nền trung tính thuần, luôn hợp lệ. Không có sàn: nền nhạt màu không làm hỏng gì.',
    vieBienTren:
      'Trần 0,12 là luật ② đã có sẵn trong sets.ts. Trên mức đó nền tự mang gu và mọi wallpaper khoác lên đều bị nhuộm — đúng điều IF-CHUAN-NEN §4 cấm.',
  },
  {
    khoa: 'nacGiamChoi',
    ten: ['Nấc giảm chói', 'Glare step'],
    bien: [0, 2],
    nguon: 'LUAT-IF',
    vieBienDuoi: '0 = kính như thường. Đã có sẵn trong types.ts, không đẻ khoá mới.',
    vieBienTren:
      '2 = tắt hẳn kính về màu trơn. Nấc càng cao kính càng ĐẶC ⇒ nền càng ít ảnh hưởng ⇒ chữ càng chắc đọc; nấc này cắt ánh kim, không bao giờ cắt độ đọc.',
  },
];

/* ================================================================== *
 * ⑥ CỔNG — thiếu mục này thì "không phạm luật chung" chỉ là lời chúc
 * ================================================================== */

export interface ComboNguoiDung {
  setId: string;
  accentHue: number;
  accentSat: number;
  accentL: number;
  nenHue: number;
  nenSat: number;
  nacGiamChoi: number;
}

export interface LoiRange {
  khoa: TokenChinhDuoc['khoa'] | 'setId';
  noi: string;
}

/**
 * ⛔ CỔNG CANH. Trả về danh sách lỗi RỖNG nghĩa là combo hợp lệ.
 *
 * Nó **không** kẹp giá trị và trả về "đã sửa hộ": một combo sai phải được NÓI RA sai. Kẹp im
 * lặng là cách một luật biến thành lời chúc — người dùng tưởng mình đang chỉnh, hệ thì đang
 * âm thầm nắn về chỗ khác, và không ai học được biên nằm ở đâu. Muốn kẹp thì gọi `kep()`,
 * và đó là một quyết định của chỗ gọi, không phải mặc định của cổng.
 */
export function soiCombo(c: ComboNguoiDung): LoiRange[] {
  const loi: LoiRange[] = [];

  if (!WALLPAPER_SETS.some((s) => s.id === c.setId)) {
    loi.push({ khoa: 'setId', noi: `bộ "${c.setId}" không có trong WALLPAPER_SETS` });
  }

  const camAccent = hueBiCam(c.accentHue);
  if (camAccent) {
    loi.push({
      khoa: 'accentHue',
      noi: `hue ${c.accentHue}° nằm trong vùng cấm của màu "${camAccent}" (±${BAN_KINH_CAM}°)`,
    });
  }
  const camNen = nenHueBiCam(c.nenHue);
  if (camNen) {
    loi.push({
      khoa: 'nenHue',
      noi: `hue nền ${c.nenHue}° nằm trong vùng cấm của màu "${camNen}" (±${BAN_KINH_CAM}°)`,
    });
  }

  const bien = (khoa: TokenChinhDuoc['khoa']) =>
    TOKEN_CHINH_DUOC.find((t) => t.khoa === khoa)!.bien!;

  const [sLo, sHi] = bien('accentSat');
  if (c.accentSat < sLo || c.accentSat > sHi) {
    loi.push({ khoa: 'accentSat', noi: `bão hoà ${c.accentSat} ngoài [${sLo} … ${sHi}]` });
  }

  const [nLo, nHi] = bien('nenSat');
  if (c.nenSat < nLo || c.nenSat > nHi) {
    loi.push({ khoa: 'nenSat', noi: `bão hoà nền ${c.nenSat} ngoài [${nLo} … ${nHi}]` });
  }

  if (![0, 1, 2].includes(c.nacGiamChoi)) {
    loi.push({ khoa: 'nacGiamChoi', noi: `nấc ${c.nacGiamChoi} không phải 0/1/2` });
  }

  /* Trục SÁNG soi cuối, và soi bằng phép ĐO chứ không bằng bảng tra: cửa sổ hợp lệ phụ
     thuộc (hue, sat), nên một giá trị L "đúng" với cặp này có thể sai với cặp kia. */
  const cua = khoangSang(c.accentHue, c.accentSat);
  if (!cua) {
    loi.push({
      khoa: 'accentL',
      noi: `cặp (hue ${c.accentHue}°, sat ${c.accentSat}) KHÔNG có độ sáng nào qua nổi cả ba ngưỡng WCAG — phải đổi hue hoặc sat, không kẹp được`,
    });
  } else if (c.accentL < cua[0] || c.accentL > cua[1]) {
    const d = doAccent(hslToRgb(c.accentHue, c.accentSat, c.accentL));
    loi.push({
      khoa: 'accentL',
      noi:
        `độ sáng ${c.accentL} ngoài cửa sổ [${cua[0]} … ${cua[1]}] tính cho (hue ${c.accentHue}°, sat ${c.accentSat}) — ` +
        `đo được: chữ trắng/accent ${d.chuTrenAccent.toFixed(2)} (sàn ${NGUONG_CHU}) · ` +
        `vs card sáng ${d.vsCardSang.toFixed(2)} · vs card tối ${d.vsCardToi.toFixed(2)} (sàn ${NGUONG_PHI_CHU})`,
    });
  }

  return loi;
}

/**
 * Kẹp một combo về biên gần nhất. Chỉ dùng khi chỗ gọi ĐÃ nói cho người dùng biết là sai
 * (xem lý do ở `soiCombo`). Trả `null` khi không kẹp được — cặp (hue, sat) không có cửa sổ
 * sáng nào thì không có giá trị đúng để kẹp về.
 */
export function kep(c: ComboNguoiDung): ComboNguoiDung | null {
  const keo = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const bien = (khoa: TokenChinhDuoc['khoa']) =>
    TOKEN_CHINH_DUOC.find((t) => t.khoa === khoa)!.bien!;

  /* Hue rơi vùng cấm ⇒ tìm góc SẠCH GẦN NHẤT, không đẩy về 0 (đẩy về 0 là vứt lựa chọn của
     người dùng đi; đi tới góc gần nhất là giữ đúng ý họ tới mức luật cho phép).
     🔴 BẢN ĐẦU DÙNG ĐỆ QUY "đẩy ra mép rồi thử lại" và NÓ TREO — test bắt được ngay, đúng chỗ
     nó phải bắt. Nguyên nhân: hai vùng cấm CHỒNG NHAU (danger 10° và warning 37° chỉ cách 27°,
     mỗi vùng rộng ±20°), nên đẩy ra khỏi vùng này là rơi vào vùng kia, và mép của vùng kia lại
     đẩy ngược về — 31° ↔ 16° vô hạn. Quét ra hai phía thì không có vòng nào để kẹt. */
  const raKhoiVungCam = (hue: number, soi: (h: number) => string | null): number => {
    /* Làm tròn 2 chữ số: `((247.2 % 360) + 360) % 360` ra `247.20000000000005` trong dấu phẩy
       động, và test "kẹp một combo ĐÃ ĐÚNG không đổi giá trị nào" bắt đúng cái đó. Một hàm kẹp
       làm xê dịch giá trị hợp lệ là hàm kẹp không dùng được — nó biến mọi lần lưu thành một lần
       sửa. Độ phân giải 0,01° nhỏ hơn mọi thứ mắt phân biệt được trên trục hue. */
    const chuan = (h: number) => Number(((((h % 360) + 360) % 360)).toFixed(2));
    const goc = chuan(hue);
    if (!soi(goc)) return goc;
    for (let b = 1; b <= 180; b++) {
      if (!soi(chuan(goc + b))) return chuan(goc + b);
      if (!soi(chuan(goc - b))) return chuan(goc - b);
    }
    /* Không tới được: bốn vùng ±20° phủ tối đa 160/360°. Giữ nhánh để nếu ai nới BAN_KINH_CAM
       tới mức bịt kín vòng tròn thì lộ ra ngay, không trả về một góc vẫn phạm luật. */
    throw new Error('vùng cấm đã phủ kín vòng màu — xem lại BAN_KINH_CAM/GOC_CAM');
  };

  const accentHue = raKhoiVungCam(c.accentHue, hueBiCam);
  const nenHue = raKhoiVungCam(c.nenHue, nenHueBiCam);
  const accentSat = keo(c.accentSat, ...(bien('accentSat') as [number, number]));
  const nenSat = keo(c.nenSat, ...(bien('nenSat') as [number, number]));
  const nacGiamChoi = keo(Math.round(c.nacGiamChoi), 0, 2);

  const cua = khoangSang(accentHue, accentSat);
  if (!cua) return null;

  return {
    setId: WALLPAPER_SETS.some((s) => s.id === c.setId) ? c.setId : WALLPAPER_SETS[0].id,
    accentHue,
    accentSat,
    accentL: keo(c.accentL, cua[0], cua[1]),
    nenHue,
    nenSat,
    nacGiamChoi,
  };
}

/** Combo mặc định của một bộ — đúng giá trị đã khai, dùng làm điểm xuất phát cho người dùng. */
export function comboMacDinh(setId: string): ComboNguoiDung {
  const b = bangMauCua(setId);
  const s = WALLPAPER_SETS.find((x) => x.id === b.setId) ?? WALLPAPER_SETS[0];
  return {
    setId: b.setId,
    accentHue: b.accent.h,
    accentSat: b.accent.s,
    accentL: b.accent.l,
    nenHue: s.hue,
    nenSat: s.sat,
    nacGiamChoi: 0,
  };
}
