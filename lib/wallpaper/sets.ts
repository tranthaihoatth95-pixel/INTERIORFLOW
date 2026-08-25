/**
 * lib/wallpaper/sets.ts — [marker: boHinhNen] NĂM BỘ hình nền hệ thống, sinh bằng mã.
 *
 * Năm bộ khác nhau ở **CƠ CHẾ ÁNH SÁNG** (`WallpaperLayer`), không ở màu — mỗi bộ là một
 * hiện tượng ánh sáng có thật trong nghề, và mỗi bộ nói được **một câu** nó là gì.
 *
 * ⛔ BA RÀNG BUỘC ĐƯỢC MÁY KIỂM (xem `sets.test.ts`, không phải lời hứa suông):
 *  ① góc màu nền nằm NGOÀI phổ màu nghĩa — nền ngả đỏ thì cảnh báo đỏ mất trọng lượng;
 *  ② bão hoà ≤ 0.12 ⇒ không bộ nào bị khoá vào màu nhấn (mòng két ↔ mận CHƯA CHỐT);
 *  ③ dải sáng của theme SÁNG không được tụt dưới sàn — sàn đó do `contrast.ts` quyết,
 *    không do mắt: tụt xuống là chữ trên pill kính rơi dưới 4.5.
 */

import { relLuminance } from '../adaptive-contrast';
import { sunPosition } from '../home/time-of-day';
import type {
  Rgb,
  WallpaperPalette,
  WallpaperPeriod,
  WallpaperSet,
  WallpaperTheme,
} from './types';

/* ------------------------------------------------------------------ *
 * ① PHỔ MÀU NGHĨA — vùng cấm, đọc từ giá trị THẬT trong `app/globals.css`
 * ------------------------------------------------------------------ */

/**
 * Góc màu của ba màu mang nghĩa nghề, tính từ hex thật trong `globals.css` (theme tối):
 * `--danger #e5674f` ≈ 10° · `--warning #d9a34a` ≈ 37° · `--success #46b876` ≈ 145°.
 * Số này KHÔNG gõ tay ở đây — `sets.test.ts` tính lại từ hex và khẳng định khớp, nên khi
 * ai đó đổi token màu nghĩa thì test đỏ chứ không im lặng trôi.
 */
export const GOC_MAU_NGHIA = { danger: 10, warning: 37, success: 145 } as const;
/** Bán kính vùng cấm quanh mỗi màu nghĩa (chốt 16/08 B14: ±20°). */
export const BAN_KINH_CAM = 20;

/** Khoảng cách góc màu ngắn nhất giữa hai hue (0–180). */
export function khoangCachHue(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/** Hue có rơi vào vùng cấm của màu nghĩa nào không. */
export function trongVungCam(hue: number): boolean {
  return Object.values(GOC_MAU_NGHIA).some((g) => khoangCachHue(hue, g) < BAN_KINH_CAM);
}

/* ------------------------------------------------------------------ *
 * ② NĂM BỘ
 * ------------------------------------------------------------------ */

/**
 * ⚠️ Cả năm bộ đều nằm ở nửa LẠNH của phổ (193–268° sau khi cộng dịch theo giờ).
 * Đó là CỐ Ý, không phải thiếu đa dạng: chốt 03/08 *"hai nhiệt độ — InteriorFlow LẠNH"*,
 * và chốt A4 16/08 nền sáng canh Apple (`#F2F2F7` ngả LAM, không ngả vàng). Bộ nào kéo IF
 * sang ấm là phá chốt đó ⇒ không có bộ ấm nào trong bộ mặc định, và bản vẽ ghi rõ điều này.
 */
export const WALLPAPER_SETS: WallpaperSet[] = [
  {
    id: 'chan-troi',
    ten: ['Chân trời', 'Horizon'],
    cau: [
      'Bầu trời một ngày — quầng sáng chạy dọc chân trời theo đúng vị trí mặt trời.',
      'A sky through one day — the glow tracks the real position of the sun.',
    ],
    layer: 'horizon',
    hue: 215,
    sat: 0.11,
    spread: 1.0,
  },
  {
    id: 'o-cua',
    ten: ['Ô cửa', 'Aperture'],
    cau: [
      'Nắng lọt qua ô cửa — góc vệt sáng nghiêng theo giờ trong ngày.',
      'Daylight through an opening — the shaft tilts with the hour.',
    ],
    layer: 'aperture',
    hue: 232,
    sat: 0.07,
    spread: 0.92,
  },
  {
    id: 'binh-do',
    ten: ['Bình độ', 'Contours'],
    cau: [
      'Bản vẽ — chỉ có nét, ánh sáng làm nét lộ ra hay chìm đi.',
      'A drawing — only lines; light decides which ones surface.',
    ],
    layer: 'contour',
    hue: 205,
    sat: 0.05,
    spread: 0.42,
  },
  {
    id: 'tang-sau',
    ten: ['Tầng sâu', 'Strata'],
    cau: [
      'Chiều sâu khí quyển — các lớp lùi dần, sương dày lên về đêm.',
      'Atmospheric depth — planes recede, haze thickens toward night.',
    ],
    layer: 'strata',
    hue: 248,
    sat: 0.09,
    spread: 0.74,
  },
  {
    id: 'mat-phang',
    ten: ['Mặt phẳng', 'Plane'],
    cau: [
      'Một tấm vật liệu — ánh sáng liếm qua mép, hạt mịn nổi lên.',
      'A single material surface — light grazes the edge, grain rises.',
    ],
    layer: 'plane',
    hue: 222,
    sat: 0.035,
    spread: 0.34,
  },
];

export function timBo(id: string): WallpaperSet {
  return WALLPAPER_SETS.find((s) => s.id === id) ?? WALLPAPER_SETS[0];
}

/* ------------------------------------------------------------------ *
 * ③ ÁNH SÁNG THEO GIỜ — neo độ sáng cho từng (theme × thời điểm)
 * ------------------------------------------------------------------ */

/**
 * Dải độ sáng HSL [thấp, cao] ở `spread = 1`. Cùng một CẢNH, chỉ ánh sáng đổi.
 *
 * 🔴 SÀN CỦA THEME SÁNG (0.862 ở `night`) KHÔNG PHẢI CHỌN THEO MẮT — nó là kết quả của
 * `contrast.ts`: pill kính (`--nen-mo-header`, alpha 0.72) đè lên nền sáng hơn thì nền hiệu
 * dụng sáng lên, chữ `--t3` (#726c62) mới đạt 4.5. Đo được (`contrast.test.ts` in ra số này
 * mỗi lần chạy): sàn 0.862 → **4.57 ĐẠT** · thử hạ xuống 0.80 → **4.40 TRƯỢT**.
 * ⚠️ Biên chỉ 0.07 — theme SÁNG là chỗ MỎNG NHẤT của cả hệ, xem báo cáo ⑦b. Ai định làm
 * theme sáng "sâu" hơn cho đẹp thì test chặn ngay, không phải chờ mắt bắt.
 */
const NEO_DO_SANG: Record<WallpaperTheme, Record<WallpaperPeriod, [number, number]>> = {
  /* 🔴 VÒNG 2 (16/08) — nâng dải theme TỐI. Vòng 1 dùng [0.022 … 0.19]: qua hết cửa tương
   * phản nhưng **mở bản vẽ ra thì năm bộ gần như đen tuyền, không phân biệt được**. Đó là
   * lỗi chỉ mắt bắt được, tsc/test không bắt (đúng bài học LUẬT nghiệm thu 11/08: *"frontier
   * sinh file xuất được thì nghiệm thu = MỞ FILE ĐẦU RA"*).
   * Biên trên tính được, không đoán: chữ `--t3` kem (#9e9ea8) trên pill kính đạt 4.5 khi nền
   * hiệu dụng ≤ 0.0358 ⇒ kênh nền hiệu dụng ≤ 53 ⇒ **kênh hình nền ≤ 138** (HSL L ≈ 0.54).
   * Dải mới cao nhất là 0.34 — còn dư biên rộng, mà cấu trúc đã đọc ra được. */
  dark: {
    night: [0.05, 0.17],
    dawn: [0.07, 0.26],
    day: [0.09, 0.34],
    dusk: [0.06, 0.22],
  },
  /* 🔴 SỬA 26/08 — DẢI SÁNG CŨ VÔ HÌNH TRÊN THEME SÁNG.
     Bản cũ `day: [0.900, 0.998]` đặt trên nền `--bg` L≈95% ⇒ chênh lệch chỉ ~3 điểm độ sáng.
     Mắt người không phân giải nổi 3 điểm ở vùng gần trắng, nên **nền theo giờ có chạy, có tốn
     tài nguyên, mà không ai thấy** — Hoà soi app thật 26/08: màn phẳng lì.
     ⭐ Một tính năng vô hình là một tính năng KHÔNG TỒN TẠI, nhưng tệ hơn: nó vẫn đứng trong sổ
     như đã xong, nên không ai đi sửa. Đây là PASS giả ở tầng thị giác.
     Nay hạ CẬN DƯỚI để có biên độ thật (~10-13 điểm), giữ CẬN TRÊN gần trắng để vùng có chữ
     vẫn sáng và đọc được. Vẫn là trường TĨNH, không phải hoa văn. */
  light: {
    /* BIÊN ĐỘ = MAX CÒN QUA CỔNG. Dò từng dải, không áp một công thức chung — lượt đầu tôi
       áp công thức chung và làm `night` TỆ HƠN bản gốc (biên độ 1 điểm so với 7).
       Ngưỡng do `contrast.test` định, không do tôi chọn: hạ thêm là 9/40 tổ hợp trượt. */
    night: [0.862, 0.935],
    dawn: [0.880, 0.966],
    day: [0.900, 0.998],
    dusk: [0.862, 0.950],
  },
};

/** Ban ngày ánh sáng TRUNG TÍNH nhất (5600K); bình minh/hoàng hôn có sắc rõ hơn. */
const HE_SO_BAO_HOA: Record<WallpaperPeriod, number> = {
  dawn: 1.0,
  day: 0.55,
  dusk: 0.95,
  night: 0.8,
};

/**
 * Dịch góc màu theo giờ — RẤT nhỏ, và cố ý chỉ dịch trong nửa lạnh. Bình minh nhích về
 * phía lam-tím, hoàng hôn nhích về phía lam-lục; cả hai vẫn cách xa vùng cấm màu nghĩa.
 */
const DICH_HUE: Record<WallpaperPeriod, number> = { dawn: 8, day: 0, dusk: -10, night: -5 };

/** Số chặng màu mỗi bảng. */
const SO_STOP = 4;

/* ---------- HSL → RGB (thuần, không phụ thuộc DOM) ---------- */

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hh = (((h % 360) + 360) % 360) / 360;
  const ss = Math.min(1, Math.max(0, s));
  const ll = Math.min(1, Math.max(0, l));
  if (ss === 0) {
    const v = Math.round(ll * 255);
    return [v, v, v];
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const kenh = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [
    Math.round(kenh(hh + 1 / 3) * 255),
    Math.round(kenh(hh) * 255),
    Math.round(kenh(hh - 1 / 3) * 255),
  ];
}

/** RGB → chuỗi CSS `rgb(r,g,b)`. Cấm hex rời rạc trong file này — mọi màu đều sinh ra. */
export function rgb(c: Rgb): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** RGB + alpha → `rgba(...)`. */
export function rgba(c: Rgb, a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
}

/* ------------------------------------------------------------------ *
 * ④ GIẢI BẢNG MÀU — thuần, tất định, test được
 * ------------------------------------------------------------------ */

export function bangMau(
  set: WallpaperSet,
  period: WallpaperPeriod,
  theme: WallpaperTheme,
): WallpaperPalette {
  const [lo, hi] = NEO_DO_SANG[theme][period];
  const giua = (lo + hi) / 2;
  const nua = ((hi - lo) / 2) * set.spread;
  const hue = set.hue + DICH_HUE[period];
  const sat = set.sat * HE_SO_BAO_HOA[period];

  const stops: Rgb[] = [];
  for (let i = 0; i < SO_STOP; i++) {
    const t = i / (SO_STOP - 1); // 0 = sáng nhất → 1 = tối nhất
    const l = giua + nua - t * (nua * 2);
    // bão hoà nhích nhẹ ở chặng tối (bóng ngả màu hơn vùng sáng — đúng cách mắt nhìn)
    stops.push(hslToRgb(hue, sat * (0.85 + 0.3 * t), l));
  }
  const lums = stops.map(relLuminance);
  return { stops, lumMin: Math.min(...lums), lumMax: Math.max(...lums) };
}

/* ------------------------------------------------------------------ *
 * ⑤ NỀN MANG TIN — vị trí/góc nguồn sáng lấy từ mặt trời THẬT
 * ------------------------------------------------------------------ */

/**
 * ⭐ Đây là chỗ nền **mang tin chứ không trang trí** (NT-11 + luật B12 *"mọi chi tiết thị giác
 * đều phải mang tin"*): quầng sáng đứng ĐÚNG chỗ mặt trời đang đứng, góc vệt nắng nghiêng
 * ĐÚNG theo giờ. Nhìn nền là biết mấy giờ — không phải hoa văn.
 */
export interface NguonSang {
  /** 0–100, trái→phải theo cung mặt trời. */
  x: number;
  /** 0–100, 0 = đỉnh cung, 100 = chân trời. */
  y: number;
  /** Góc vệt nắng (deg) cho lớp `aperture`: sáng sớm nghiêng nhiều, giữa trưa gần dốc đứng. */
  gocVet: number;
  /** Mặt trời đã lặn — lớp hình học đổi sang cách vẽ ban đêm. */
  daLan: boolean;
}

export function nguonSang(hour: number): NguonSang {
  const s = sunPosition(hour);
  return {
    x: s.xPercent,
    y: s.yPercent,
    // 118° (sáng, nghiêng mạnh từ trái) → 152° (giữa trưa, dốc) → 186° (chiều, đổ ngược)
    gocVet: 118 + s.progress * 68,
    daLan: s.belowHorizon,
  };
}
