/**
 * lib/cad/plan-depth.ts — PHÂN LỚP ĐỘ ĐẬM THEO CHIỀU SÂU (VIỆC 3, phiên S4).
 *
 * ▸ NGUỒN: `docs/00-PHAN-TICH-NGUON-THAM-CHIEU.md` mục 6 (ảnh `C2`) — *"cùng một cảnh, lớp TRƯỚC
 *   nét rõ và trắng đặc, lớp SAU nét mờ hơn hẳn, chìm vào nền. Đây là aerial perspective áp cho
 *   line drawing."*
 *
 * ⛔ **KHÔNG DÙNG BÓNG ĐỔ.** Chỉ hai cần gạt, đúng nguồn:
 *     ① **độ đậm của nét** — pha màu nét về phía màu nền (nét "chìm vào nền")
 *     ② **bề dày nét** — lớp xa mảnh hơn
 *   Không blur, không shadow, không alpha trên nền (alpha đè lên nhau sẽ cộng dồn ở chỗ nét chồng
 *   nét, ra vệt đậm giả — pha màu thì không bao giờ bị).
 *
 * ▸ **NGUỒN DỮ LIỆU CHIỀU SÂU = LAYER KHAI BÁO, không suy đoán (K3).** Đường trích mặt cắt/mặt
 *   đứng của phiên **S2** đã phân sẵn ba layer kèm bề dày đúng ISO:
 *     `S-CUT` 0.70 · `S-VIEW` 0.35 · `S-FAR` 0.18  — xem `lib/three/section-entities.ts:41-43,50`.
 *   File này **KHÔNG import** từ `lib/three/*` (sai chiều phụ thuộc: `lib/three/cad-to-obj.ts`
 *   đã import ngược từ `lib/cad/*`; thêm chiều ngược lại là vòng tròn). Ba id trên là **THAM SỐ
 *   mặc định** — S2 đổi tên layer thì đổi ở `DEFAULT_DEPTH_BANDS`, một chỗ.
 *
 * ▸ 🔴 **TRẠNG THÁI NỐI DÂY — khai thật (N5/N6).** `elevationToEntities()`
 *   (`lib/three/section-entities.ts:430`) ĐÃ CÓ và chạy được, nhưng
 *   `grep -rn "elevationToEntities\|sectionToEntities" --include=*.tsx components/ app/` = **0**
 *   ⇒ **chưa component nào mount nó**, nên trong app chưa có mặt đứng để tô. Vì thế nút ở
 *   `components/cad/PlanPresentPanel.tsx` để `disabled` kèm đúng lý do *"chờ đường trích mặt đứng
 *   (S2)"* theo §9. Phần DỮ LIỆU dưới đây làm xong và test được ngay — S2 mount xong là chạy,
 *   không phải viết lại.
 *
 * Hàm THUẦN. Test: `node_modules/.bin/sucrase-node lib/cad/plan-depth.test.ts`
 */

import type { Doc, Entity } from './model';

/* ═══════════════════════ 0 · DẢI CHIỀU SÂU ═══════════════════════ */

export interface DepthBand {
  /** id layer mang lớp này. */
  layerId: string;
  /** 0 = gần nhất (rõ nhất). Số càng lớn càng xa. */
  depth: number;
  /** nhãn cho UI. */
  label: string;
}

/**
 * Mặc định khớp ba layer S2 sinh ra. **Tham số, không phải chân lý** — hồ sơ dùng quy ước layer
 * khác thì truyền `bands` riêng.
 */
export const DEFAULT_DEPTH_BANDS: DepthBand[] = [
  { layerId: 'S-CUT', depth: 0, label: 'Nét cắt · Cut' },
  { layerId: 'S-VIEW', depth: 1, label: 'Thấy · Visible' },
  { layerId: 'S-FAR', depth: 2, label: 'Xa · Far' },
];

export interface DepthFadeOptions {
  bands?: DepthBand[];
  /** màu NỀN để pha về — nét lớp xa "chìm vào" chính màu này. */
  backgroundColor?: string;
  /**
   * Mỗi bậc chiều sâu pha thêm bao nhiêu phần về phía nền (0–1). 0.42 ⇒ lớp 1 giữ 58% mực,
   * lớp 2 giữ ~34% — khớp cảm giác "mờ hẳn" của `C2` mà vẫn đọc được đường.
   */
  fadePerStep?: number;
  /** Mỗi bậc chiều sâu nhân bề dày nét với hệ số này. 0.55 ≈ nhịp 0.70→0.35→0.18 của S2. */
  weightPerStep?: number;
  /** Trần pha — không bao giờ pha quá mức này, để lớp xa nhất vẫn còn nhìn thấy. */
  maxFade?: number;
}

export const DEFAULT_DEPTH_FADE: Required<Omit<DepthFadeOptions, 'bands'>> = {
  backgroundColor: '#ffffff',
  fadePerStep: 0.42,
  weightPerStep: 0.55,
  maxFade: 0.82,
};

/* ═══════════════════════ 1 · MÀU ═══════════════════════ */

/** '#rgb' | '#rrggbb' → [r,g,b] 0–255. Chuỗi hỏng ⇒ null (không đoán bừa). */
export function parseHex(hex: string): [number, number, number] | null {
  const s = hex.trim().replace(/^#/, '');
  if (s.length === 3) {
    const r = parseInt(s[0] + s[0], 16), g = parseInt(s[1] + s[1], 16), b = parseInt(s[2] + s[2], 16);
    return Number.isNaN(r + g + b) ? null : [r, g, b];
  }
  if (s.length === 6) {
    const r = parseInt(s.slice(0, 2), 16), g = parseInt(s.slice(2, 4), 16), b = parseInt(s.slice(4, 6), 16);
    return Number.isNaN(r + g + b) ? null : [r, g, b];
  }
  return null;
}

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

/** Pha `a` về `b` theo tỉ lệ `t` (0 = giữ nguyên a, 1 = thành b). Hỏng màu ⇒ trả `a`. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = parseHex(a), cb = parseHex(b);
  if (!ca || !cb) return a;
  const k = Math.max(0, Math.min(1, t));
  return `#${toHex(ca[0] + (cb[0] - ca[0]) * k)}${toHex(ca[1] + (cb[1] - ca[1]) * k)}${toHex(ca[2] + (cb[2] - ca[2]) * k)}`;
}

/* ═══════════════════════ 2 · TRA DẢI ═══════════════════════ */

/**
 * Entity thuộc dải chiều sâu nào. **CHỈ đọc layer KHAI BÁO** — không có trong bảng dải thì trả
 * `null` và nơi gọi để nguyên entity đó. Không suy đoán chiều sâu từ toạ độ/kích thước (K3):
 * đoán sai một lớp là đảo ngược cả chiều sâu của bản vẽ.
 */
export function depthBandOf(e: Entity, bands: DepthBand[] = DEFAULT_DEPTH_BANDS): DepthBand | null {
  return bands.find((b) => b.layerId === e.layer) ?? null;
}

/** Màu + bề dày sau khi lùi `depth` bậc. Hàm thuần, test trực tiếp được. */
export function depthFadeSpec(
  baseColor: string,
  baseLineweightMm: number,
  depth: number,
  opts: DepthFadeOptions = {},
): { color: string; lineweightMm: number; fade: number } {
  const o = { ...DEFAULT_DEPTH_FADE, ...opts };
  const d = Math.max(0, depth);
  // d=0 ⇒ 1−(1−p)^0 = 0 (lớp trước GIỮ NGUYÊN, "nét rõ") · d=1 ⇒ p · d=2 ⇒ p(2−p) … chặn ở maxFade.
  const f = Math.min(o.maxFade, 1 - Math.pow(1 - o.fadePerStep, d));
  return {
    color: mixHex(baseColor, o.backgroundColor, f),
    lineweightMm: baseLineweightMm * Math.pow(o.weightPerStep, d),
    fade: f,
  };
}

/* ═══════════════════════ 3 · ỐNG KÍNH ═══════════════════════ */

export interface DepthFadeReport {
  /** số entity mỗi dải, theo nhãn dải. */
  perBand: Record<string, number>;
  /** entity KHÔNG thuộc dải nào — để nguyên, không tô. Con số này phải hiện ra UI chứ không giấu. */
  untouched: number;
  notes: string[];
}

/**
 * Áp phân lớp độ đậm lên một `Doc` mặt đứng. Trả `Doc` **PHÙ DU** — cùng luật K1 như
 * `plan-present.ts`: chỉ để VẼ, không bao giờ vào store/`.idf`.
 *
 * ⛔ Không đụng toạ độ. Chỉ ghi `color` + `lineweight`.
 */
export function applyDepthFade(
  doc: Doc,
  opts: DepthFadeOptions = {},
): { doc: Doc; report: DepthFadeReport } {
  const bands = opts.bands ?? DEFAULT_DEPTH_BANDS;
  const perBand: Record<string, number> = {};
  const notes: string[] = [];
  let untouched = 0;

  const layerColor = new Map(doc.layers.map((l) => [l.id, l.color]));
  const layerWeight = new Map(doc.layers.map((l) => [l.id, l.lineweight ?? 0.25]));

  const entities = doc.entities.map((e) => {
    const band = depthBandOf(e, bands);
    if (!band) { untouched++; return e; }
    perBand[band.label] = (perBand[band.label] ?? 0) + 1;
    const base = e.color ?? layerColor.get(e.layer) ?? '#000000';
    const bw = e.lineweight ?? layerWeight.get(e.layer) ?? 0.25;
    const spec = depthFadeSpec(base, bw, band.depth, opts);
    return { ...e, color: spec.color, lineweight: spec.lineweightMm } as Entity;
  });

  if (!Object.keys(perBand).length) {
    notes.push(`Không entity nào nằm trên layer chiều sâu (${bands.map((b) => b.layerId).join(' · ')}). Bản vẽ này chưa phải mặt đứng trích từ mô hình — chưa có gì để phân lớp.`);
  }
  if (untouched) {
    notes.push(`${untouched} entity không thuộc dải chiều sâu nào — GIỮ NGUYÊN, không tô mờ (K3: không đoán chiều sâu).`);
  }

  return { doc: { ...doc, entities }, report: { perBand, untouched, notes } };
}
