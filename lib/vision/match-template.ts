/**
 * lib/vision/match-template.ts — BƯỚC ⑤ của dây chuyền "ảnh → món đồ có kích thước → bản vẽ"
 * (`docs/TU-VAN-ANH-SANG-BAN-VE-2026-07-30.md` §3⑤), làm theo hướng Hoà chốt 05/08: **KHỚP MẪU,
 * KHÔNG DỰNG TỪ ĐẦU**.
 *
 * Tài liệu 30/07 khuyên HOÃN ⑤ vì image-to-3D là "đắt nhất, chậm nhất, kém tin nhất". Cách ở đây
 * né cả ba: **không gọi AI, không sinh mesh**. Chỉ tìm trong thư viện block CÓ SẴN của IF cái mẫu
 * có tỉ lệ gần món đang đo nhất, rồi kéo giãn nó về đúng số đo. Tất định, 0 credit, chạy offline —
 * đúng tinh thần `single-view-metrology.ts`.
 *
 * ⛔ RANH GIỚI KHÔNG ĐƯỢC XOÁ (luật §2 tài liệu tư vấn — sai 1 số là mất tiền thật của xưởng):
 * mẫu đã kéo giãn là **KHỐI THAM CHIẾU**, không phải vật thật. Số đo để đặt xưởng LUÔN lấy từ
 * `measureObject()`/`measureObjectTiered()` (tầng A), KHÔNG bao giờ đo lại từ khối này. Xem
 * `ortho-projection.ts` — chỗ ba nhãn đó được cưỡng chế bằng kiểu dữ liệu.
 *
 * ⚠️ MỘT SỰ THẬT VỀ THƯ VIỆN PHẢI NÓI TRƯỚC (đọc code, không suy đoán — luật N7):
 * cả hai nguồn block của IF đều là **2D nhìn từ trên**, KHÔNG có chiều cao và KHÔNG có hình khối:
 *   • `lib/cad/furniture.ts` `BlockDef` — `w` × `h` là **rộng × SÂU** của hình chiếu bằng
 *     (vd `bedS w:1000 h:2000` = giường đơn rộng 1m sâu 2m), `prims` là nét vẽ mặt bằng.
 *   • `lib/cad/block-library.ts` `LibraryBlockMeta` — cũng chỉ `w`/`h` bao, nội dung là file .dxf
 *     mặt bằng.
 * ⇒ Khớp theo **tỉ lệ mặt bằng w:d** là có thật; phần **cao** không có gì trong thư viện để khớp,
 * nên đối chiếu với dải chuẩn nghề `FURNITURE_SIZE_PRIORS` và ghi rõ đó là nguồn khác. Không vờ
 * rằng thư viện biết chiều cao.
 */

// ⚠️ Import TƯƠNG ĐỐI, không dùng alias `@/…`: `npm test` chạy test bằng `sucrase-node`, thứ
// KHÔNG đọc `paths` của tsconfig ⇒ file dùng alias thì test của nó im lặng không chạy được
// (đúng ca `lib/present-editor/boq-group.ts` đã mắc, ghi trong STATUS.md).
import type { Prim, BlockDef } from '../cad/furniture';
import { BLOCKS } from '../cad/furniture';
import type { LibraryBlockMeta, LibraryManifest } from '../cad/block-library';
import type { BlockGroup } from '../cad/shared-types';
import {
  FURNITURE_SIZE_PRIORS,
  type FurnitureCategory,
  type ObjectSilhouette,
  type Pt2D,
} from './single-view-metrology';

/* ═══════════════════════════ Kiểu dữ liệu ═══════════════════════════ */

/** Một mẫu ứng viên, đã quy về CÙNG một hình dạng dù đến từ nguồn nào. */
export interface TemplateCandidate {
  /** `furniture` = BLOCKS vẽ tay · `library` = manifest .dxf. Giữ lại để UI nói đúng nguồn. */
  source: 'furniture' | 'library';
  id: string;
  name: string;
  /** BlockGroup với nguồn `furniture`; `category` (chuỗi tự do) với nguồn `library`. */
  group: string;
  /** Rộng danh nghĩa mặt bằng (mm). */
  footprintWMm: number;
  /** SÂU danh nghĩa mặt bằng (mm) — chính là `h` của BlockDef/LibraryBlockMeta, xem docblock. */
  footprintDMm: number;
  /** Nét vẽ mặt bằng, hệ local mm gốc TÂM. Chỉ nguồn `furniture` có sẵn; nguồn `library` phải
   *  `loadBlockDoc()` bất đồng bộ nên để trống ở đây (khớp vẫn chạy được bằng w/d/nhóm). */
  prims?: Prim[];
}

/** Số đo tầng A đưa vào — CHỈ nhận số, không nhận `MeasurementValue`, để không ai lỡ tay mang
 *  `kind`/`basis` của phép đo gắn sang khối tham chiếu (đó là hai thứ khác nhau). */
export interface TargetDims {
  widthMm: number;
  depthMm: number;
  heightMm: number;
}

export interface MatchReason {
  /** Mã tiêu chí — UI dịch ra câu, không hiển thị thẳng. */
  key: 'aspect' | 'group' | 'complexity' | 'height';
  /** 0..1 — điểm riêng của tiêu chí này. */
  score: number;
  /** Trọng số đã dùng khi cộng vào tổng. */
  weight: number;
  /** Câu giải thích cho người dùng đọc (tiếng Việt, ngắn). */
  label: string;
}

export interface TemplateMatch {
  candidate: TemplateCandidate;
  /** 0..1. UI hiện "giống mẫu X 82%" = Math.round(matchScore * 100). */
  matchScore: number;
  reasons: MatchReason[];
  /** Hệ số kéo giãn đã áp lên mẫu để ra đúng số đo (mặt bằng). */
  scale: { sx: number; sy: number };
  /** Nét mặt bằng SAU khi kéo giãn — chỉ có khi ứng viên mang sẵn `prims` (nguồn `furniture`). */
  prims?: Prim[];
}

/* ═══════════════════════════ Cấu hình khớp ═══════════════════════════ */

/**
 * Trọng số 4 tiêu chí. Tổng = 1.
 *
 * `complexity` cố ý NHẸ NHẤT và đây là lý do (không giấu): mặt nạ ở bước ③ là **hình chiếu ĐỨNG**
 * (nhìn ngang), còn nét mẫu là **hình chiếu BẰNG** (nhìn từ trên) — hai phép chiếu khác nhau, số
 * điểm cực trị của chúng không so trực tiếp được. Thứ còn dùng được là tín hiệu THÔ "món này đơn
 * giản hay rườm rà" (tủ hộp vs bộ bàn ăn có ghế), nên nó chỉ đáng làm căn cứ phá hoà, không đáng
 * làm căn cứ chính. Ai muốn nâng trọng số này phải có hình chiếu bằng thật của món đồ trước.
 */
export const MATCH_WEIGHTS = { aspect: 0.5, group: 0.3, complexity: 0.1, height: 0.1 } as const;

/** Dưới ngưỡng này ⇒ `matchTemplate()` trả null. KHÔNG ép khớp bừa (yêu cầu (e)). */
export const DEFAULT_MATCH_THRESHOLD = 0.6;

/**
 * Bắc cầu `FurnitureCategory` (ngôn ngữ của tầng đo) ↔ `BlockGroup` (ngôn ngữ của thư viện block).
 * `other` cố ý KHÔNG có trong bảng: nó nghĩa là "chưa biết loại", ánh xạ bừa sang một nhóm sẽ tạo
 * điểm nhóm giả — lúc đó tiêu chí nhóm bị bỏ qua và trọng số chia lại cho các tiêu chí có thật.
 */
export const CATEGORY_TO_GROUP: Partial<Record<FurnitureCategory, BlockGroup>> = {
  sofa2: 'Phòng khách',
  sofa3: 'Phòng khách',
  armchair: 'Phòng khách',
  coffeeTable: 'Phòng khách',
  diningTable: 'Phòng ăn',
  diningChair: 'Phòng ăn',
  bedSingle: 'Phòng ngủ',
  bedDouble: 'Phòng ngủ',
  bedQueen: 'Phòng ngủ',
  bedKing: 'Phòng ngủ',
  wardrobe: 'Phòng ngủ',
  nightstand: 'Phòng ngủ',
  deskTable: 'Làm việc',
};

/* ═══════════════════════════ Gom ứng viên từ CẢ HAI nguồn ═══════════════════════════ */

/**
 * Block nào KHÔNG phải "món đồ đo được từ ảnh" thì loại khỏi ứng viên: cửa/cửa sổ là cấu kiện gắn
 * tường (đã có đường riêng `lib/cad/hosting.ts`), còn Điện/Cầu thang không phải đồ rời để khoanh
 * trong ảnh phối cảnh. Lọc ở đây thay vì để điểm số tự loại — điểm số có thể vô tình cho một cái
 * cửa 900×900 khớp cao với một chiếc bàn vuông.
 */
const EXCLUDED_GROUPS: ReadonlySet<string> = new Set<string>(['Kiến trúc', 'Điện', 'Cầu thang']);

function fromBlockDef(b: BlockDef): TemplateCandidate {
  return {
    source: 'furniture',
    id: b.id,
    name: b.name,
    group: b.group,
    footprintWMm: b.w,
    footprintDMm: b.h,
    prims: b.prims,
  };
}

function fromLibraryMeta(m: LibraryBlockMeta): TemplateCandidate {
  return {
    source: 'library',
    id: m.id,
    name: m.name,
    group: m.categoryLabel || m.category,
    footprintWMm: m.w,
    footprintDMm: m.h,
  };
}

/**
 * Danh sách ứng viên = BLOCKS (luôn có, nằm trong bundle) ∪ manifest thư viện .dxf (tuỳ chọn —
 * caller tự `loadManifest()` rồi truyền vào; module này KHÔNG `fetch` để giữ tính thuần/chạy offline).
 */
export function collectCandidates(manifest?: LibraryManifest | null): TemplateCandidate[] {
  const out = BLOCKS.filter((b) => !b.hosted && !EXCLUDED_GROUPS.has(b.group)).map(fromBlockDef);
  if (manifest?.blocks?.length) {
    for (const m of manifest.blocks) {
      if (EXCLUDED_GROUPS.has(m.categoryLabel) || EXCLUDED_GROUPS.has(m.category)) continue;
      if (m.w > 0 && m.h > 0) out.push(fromLibraryMeta(m));
    }
  }
  return out;
}

/* ═══════════════════════════ Bốn tiêu chí ═══════════════════════════ */

/**
 * Điểm tỉ lệ mặt bằng. So TỈ LỆ w:d chứ không so kích thước tuyệt đối — vì bước sau sẽ kéo giãn
 * mẫu về đúng số đo, nên một mẫu đúng dáng mà sai cỡ vẫn là mẫu tốt. Dùng tỉ số lớn/nhỏ để đối
 * xứng (mẫu gầy hơn gấp đôi và béo hơn gấp đôi phải cùng điểm).
 */
export function aspectScore(target: TargetDims, c: TemplateCandidate): number {
  const tRatio = target.widthMm / Math.max(1, target.depthMm);
  const cRatio = c.footprintWMm / Math.max(1, c.footprintDMm);
  if (!isFinite(tRatio) || !isFinite(cRatio) || tRatio <= 0 || cRatio <= 0) return 0;
  const rel = Math.max(tRatio, cRatio) / Math.min(tRatio, cRatio); // ≥1, =1 là khớp hoàn hảo
  // rel=1 → 1 điểm; rel=2 (lệch gấp đôi) → 0.5; rel=3 → 0.33. Giảm dần đều, không có ngưỡng gãy.
  return 1 / rel;
}

/** Điểm nhóm: 1 nếu nhóm mẫu đúng nhóm suy từ loại đồ, 0 nếu khác. `null` = không đánh giá được
 *  (chưa biết loại) ⇒ caller bỏ tiêu chí này ra khỏi tổng thay vì chấm 0 oan. */
export function groupScore(category: FurnitureCategory | undefined, c: TemplateCandidate): number | null {
  if (!category) return null;
  const want = CATEGORY_TO_GROUP[category];
  if (!want) return null; // 'other' hoặc loại chưa bắc cầu
  return c.group === want ? 1 : 0;
}

/**
 * Đếm điểm CỰC TRỊ của một đa giác = số đỉnh mà hướng đi đổi chiều đáng kể (>~18°). Bỏ qua các
 * đỉnh gần thẳng hàng để không đếm nhiễu răng cưa của mặt nạ pixel thành "chi tiết".
 */
export function countExtrema(poly: Pt2D[], minTurnRad = 0.31): number {
  const n = poly.length;
  if (n < 3) return 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const p = poly[(i - 1 + n) % n];
    const q = poly[i];
    const r = poly[(i + 1) % n];
    const a1 = Math.atan2(q.y - p.y, q.x - p.x);
    const a2 = Math.atan2(r.y - q.y, r.x - q.x);
    let d = Math.abs(a2 - a1);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d > minTurnRad) count += 1;
  }
  return count;
}

/** Cực trị của nét mẫu: gộp mọi đỉnh của các `poly` (line/circle/arc không có đỉnh gãy để đếm). */
export function templateExtrema(prims: Prim[] | undefined): number {
  if (!prims?.length) return 0;
  let n = 0;
  for (const p of prims) if (p.k === 'poly') n += countExtrema(p.pts);
  return n;
}

/**
 * Điểm "độ rườm rà" — tín hiệu YẾU, xem giải thích ở `MATCH_WEIGHTS`. So số cực trị theo tỉ số,
 * cùng công thức đối xứng với `aspectScore`. Không so được (thiếu một trong hai) ⇒ null.
 */
export function complexityScore(silhouette: ObjectSilhouette | undefined, c: TemplateCandidate): number | null {
  const tplN = templateExtrema(c.prims);
  if (!silhouette?.front?.length || tplN === 0) return null;
  const silN = countExtrema(silhouette.front);
  if (silN === 0) return null;
  const rel = Math.max(silN, tplN) / Math.min(silN, tplN);
  return 1 / rel;
}

/**
 * Điểm chiều cao — đối chiếu số đo với **dải chuẩn nghề** (`FURNITURE_SIZE_PRIORS`), KHÔNG phải
 * với thư viện block (thư viện không có chiều cao, xem docblock đầu file). Trong dải ⇒ 1 điểm;
 * ngoài dải ⇒ giảm dần theo mức lệch so với nửa bề rộng dải.
 */
export function heightScore(target: TargetDims, category: FurnitureCategory | undefined): number | null {
  if (!category) return null;
  const p = FURNITURE_SIZE_PRIORS[category];
  const [lo, hi] = p.heightMm;
  const h = target.heightMm;
  if (h <= 0) return null;
  if (h >= lo && h <= hi) return 1;
  const half = Math.max(1, (hi - lo) / 2);
  const off = h < lo ? lo - h : h - hi;
  return Math.max(0, 1 - off / (half * 2));
}

/* ═══════════════════════════ Kéo giãn nét mẫu ═══════════════════════════ */

/** Lệch tỉ lệ 2 trục dưới mức này thì coi như giãn đều — giữ nguyên circle/arc cho nét sạch. */
const UNIFORM_SCALE_TOLERANCE = 0.02;
/** Số cạnh khi buộc phải bẻ circle/arc thành đường gấp khúc (giãn không đều). */
const CURVE_SEGMENTS = 32;

function scalePt(p: Pt2D, sx: number, sy: number): Pt2D {
  return { x: p.x * sx, y: p.y * sy };
}

/**
 * Kéo giãn một nét theo 2 trục. THUẦN.
 *
 * Giãn KHÔNG ĐỀU biến đường tròn thành elip, mà `Prim` không có kiểu elip — nên circle/arc được
 * bẻ thành `poly` nhiều cạnh. Cố ý làm vậy thay vì "lấy bán kính trung bình": bán kính trung bình
 * vẽ ra một đường tròn SAI ở cả hai trục, còn đường gấp khúc thì đúng hình, chỉ mất tính "là cung".
 */
export function scalePrim(prim: Prim, sx: number, sy: number): Prim {
  const uniform = Math.abs(sx - sy) <= UNIFORM_SCALE_TOLERANCE * Math.max(Math.abs(sx), Math.abs(sy));
  switch (prim.k) {
    case 'line':
      return { k: 'line', a: scalePt(prim.a, sx, sy), b: scalePt(prim.b, sx, sy) };
    case 'poly':
      return { k: 'poly', closed: prim.closed, pts: prim.pts.map((p) => scalePt(p, sx, sy)) };
    case 'circle': {
      if (uniform) return { k: 'circle', c: scalePt(prim.c, sx, sy), r: prim.r * Math.abs(sx) };
      const pts: Pt2D[] = [];
      for (let i = 0; i < CURVE_SEGMENTS; i++) {
        const t = (i / CURVE_SEGMENTS) * Math.PI * 2;
        pts.push(scalePt({ x: prim.c.x + prim.r * Math.cos(t), y: prim.c.y + prim.r * Math.sin(t) }, sx, sy));
      }
      return { k: 'poly', closed: true, pts };
    }
    case 'arc': {
      if (uniform) return { k: 'arc', c: scalePt(prim.c, sx, sy), r: prim.r * Math.abs(sx), a1: prim.a1, a2: prim.a2 };
      const pts: Pt2D[] = [];
      for (let i = 0; i <= CURVE_SEGMENTS; i++) {
        const t = prim.a1 + ((prim.a2 - prim.a1) * i) / CURVE_SEGMENTS;
        pts.push(scalePt({ x: prim.c.x + prim.r * Math.cos(t), y: prim.c.y + prim.r * Math.sin(t) }, sx, sy));
      }
      return { k: 'poly', closed: false, pts };
    }
  }
}

/* ═══════════════════════════ Hàm chính ═══════════════════════════ */

export interface MatchOptions {
  category?: FurnitureCategory;
  silhouette?: ObjectSilhouette;
  manifest?: LibraryManifest | null;
  /** Mặc định `DEFAULT_MATCH_THRESHOLD`. */
  threshold?: number;
}

/** Chấm điểm 1 ứng viên. Tiêu chí không đánh giá được (null) bị LOẠI khỏi tổng và trọng số chia
 *  lại cho phần còn lại — không chấm 0 oan, cũng không cho điểm miễn phí. */
export function scoreCandidate(target: TargetDims, c: TemplateCandidate, opts: MatchOptions): { score: number; reasons: MatchReason[] } {
  const raw: { key: MatchReason['key']; score: number | null; weight: number; label: string }[] = [
    { key: 'aspect', score: aspectScore(target, c), weight: MATCH_WEIGHTS.aspect, label: `Tỉ lệ mặt bằng rộng:sâu gần mẫu "${c.name}"` },
    { key: 'group', score: groupScore(opts.category, c), weight: MATCH_WEIGHTS.group, label: `Cùng nhóm "${c.group}"` },
    { key: 'complexity', score: complexityScore(opts.silhouette, c), weight: MATCH_WEIGHTS.complexity, label: 'Độ rườm rà đường bao tương đương (tín hiệu yếu — khác phép chiếu)' },
    { key: 'height', score: heightScore(target, opts.category), weight: MATCH_WEIGHTS.height, label: 'Chiều cao nằm trong dải chuẩn nghề của loại đồ' },
  ];
  const usable = raw.filter((r): r is typeof r & { score: number } => r.score !== null);
  const totalWeight = usable.reduce((s, r) => s + r.weight, 0);
  if (totalWeight <= 0) return { score: 0, reasons: [] };
  const score = usable.reduce((s, r) => s + r.score * (r.weight / totalWeight), 0);
  const reasons = usable.map((r) => ({ key: r.key, score: r.score, weight: r.weight / totalWeight, label: r.label }));
  return { score, reasons };
}

/**
 * BƯỚC ⑤ — tìm mẫu gần nhất rồi kéo giãn về đúng số đo.
 *
 * Trả `null` khi không mẫu nào vượt ngưỡng (yêu cầu (e) — thà không có mẫu còn hơn gán bừa một
 * cái ghế cho một cái tủ). Gặp `null` thì đi tiếp bằng `fallbackBox()` + `makeTemplateRequest()`
 * bên dưới, KHÔNG im lặng bỏ qua.
 */
export function matchTemplate(target: TargetDims, opts: MatchOptions = {}): TemplateMatch | null {
  if (!(target.widthMm > 0) || !(target.depthMm > 0)) return null;
  const threshold = opts.threshold ?? DEFAULT_MATCH_THRESHOLD;
  const candidates = collectCandidates(opts.manifest);

  let best: TemplateMatch | null = null;
  for (const c of candidates) {
    const { score, reasons } = scoreCandidate(target, c, opts);
    if (score <= (best?.matchScore ?? -1)) continue;
    const sx = target.widthMm / Math.max(1, c.footprintWMm);
    const sy = target.depthMm / Math.max(1, c.footprintDMm);
    best = {
      candidate: c,
      matchScore: score,
      reasons: reasons.sort((a, b) => b.score * b.weight - a.score * a.weight),
      scale: { sx, sy },
      prims: c.prims?.map((p) => scalePrim(p, sx, sy)),
    };
  }
  return best && best.matchScore >= threshold ? best : null;
}

/* ═══════════════════════════ VIỆC 4 — không khớp được thì sao ═══════════════════════════ */

/** Nét mặt bằng dự phòng: đúng một hình chữ nhật rộng × sâu, gốc TÂM — cùng hệ toạ độ với
 *  `BlockDef.prims` nên mọi thứ vẽ được block đều vẽ được cái này. */
export function fallbackBox(target: TargetDims): Prim[] {
  const w = target.widthMm / 2;
  const d = target.depthMm / 2;
  return [{ k: 'poly', closed: true, pts: [{ x: -w, y: -d }, { x: w, y: -d }, { x: w, y: d }, { x: -w, y: d }] }];
}

/** Nhãn CỐ ĐỊNH cho khối dựng khi không khớp được mẫu nào. Không có tham số đổi/tắt — người dùng
 *  phải luôn thấy đây là khối tạm. */
export const FALLBACK_BLOCK_LABEL = 'Khối tạm — chưa có mẫu';

/**
 * Một dòng việc cho thư viện. Mỗi lần không khớp được là MỘT DÒNG VIỆC, không phải một lần thất
 * bại im lặng — thư viện IF tự lớn theo cách studio dùng thật (chỉ đạo Hoà 05/08).
 */
export interface TemplateRequest {
  id: string;
  /** Loại đồ đoán được lúc đo, `other` khi chưa biết. */
  category: FurnitureCategory;
  /** Nhãn đọc được, vd "Ghế bành" — lấy từ `FURNITURE_SIZE_PRIORS`. */
  categoryLabel: string;
  dims: TargetDims;
  /** Điểm của mẫu gần nhất (0..1) — để xếp ưu tiên: gần 0 nghĩa là thư viện trống hẳn mảng này. */
  bestScore: number;
  /** Tên mẫu gần nhất, nếu có — giúp người dựng mẫu biết bắt đầu từ đâu. */
  bestCandidateName?: string;
  /** Mốc thời gian do CALLER truyền vào (module thuần, không tự gọi Date.now để test tất định). */
  requestedAt: number;
  /** Số lần cùng một loại+cỡ bị hỏi. Gộp bởi `mergeTemplateRequests`. */
  count: number;
}

/** Làm tròn về bậc 50mm — CHỈ để sinh `id` cho gọn mắt, KHÔNG phải cách gộp trùng (xem dưới). */
function dimKey(d: TargetDims): string {
  const r = (v: number) => Math.round(v / 50) * 50;
  return `${r(d.widthMm)}x${r(d.depthMm)}x${r(d.heightMm)}`;
}

export function templateRequestKey(category: FurnitureCategory, dims: TargetDims): string {
  return `${category}:${dimKey(dims)}`;
}

/**
 * Hai dòng việc coi là CÙNG một món khi cùng loại và cả ba chiều lệch dưới mức này.
 *
 * ⚠️ Vì sao gộp theo ĐỘ GẦN chứ không so `id` bằng nhau — bug bắt được lúc viết test, ghi lại để
 * đừng ai "đơn giản hoá" lại về so khoá: làm tròn về bậc cố định có HIỆU ỨNG BIÊN. Đo cùng một
 * chiếc ghế hai lần ra 820mm và 834mm (lệch 14mm, thừa nằm trong dung sai của chính phép đo) thì
 * bậc 50 đẩy chúng về 800 và 850 ⇒ hai dòng việc cho một món. Bậc to hơn không chữa được, chỉ dời
 * chỗ gãy. So theo tỉ lệ lệch thì không có biên để rơi vào.
 */
export const REQUEST_MERGE_TOLERANCE_RATIO = 0.08;

function dimsAreClose(a: TargetDims, b: TargetDims): boolean {
  const near = (x: number, y: number) => {
    const scale = Math.max(Math.abs(x), Math.abs(y));
    if (scale <= 0) return true;
    return Math.abs(x - y) / scale <= REQUEST_MERGE_TOLERANCE_RATIO;
  };
  return near(a.widthMm, b.widthMm) && near(a.depthMm, b.depthMm) && near(a.heightMm, b.heightMm);
}

/** Dựng 1 dòng việc. THUẦN — `now` do caller truyền. */
export function makeTemplateRequest(opts: {
  category?: FurnitureCategory;
  dims: TargetDims;
  bestScore: number;
  bestCandidateName?: string;
  now: number;
}): TemplateRequest {
  const category = opts.category ?? 'other';
  return {
    id: templateRequestKey(category, opts.dims),
    category,
    categoryLabel: FURNITURE_SIZE_PRIORS[category].label,
    dims: opts.dims,
    bestScore: opts.bestScore,
    bestCandidateName: opts.bestCandidateName,
    requestedAt: opts.now,
    count: 1,
  };
}

/**
 * Gộp dòng mới vào hàng đợi: CÙNG LOẠI + ba chiều đủ gần (`REQUEST_MERGE_TOLERANCE_RATIO`) thì
 * tăng `count` + cập nhật mốc thời gian, không đẻ dòng mới. Giữ `bestScore` THẤP NHẤT đã gặp —
 * dòng nào thư viện thiếu nặng nhất phải nổi lên trước.
 */
export function mergeTemplateRequests(queue: TemplateRequest[], incoming: TemplateRequest): TemplateRequest[] {
  const at = queue.findIndex((r) => r.category === incoming.category && dimsAreClose(r.dims, incoming.dims));
  if (at === -1) return [...queue, incoming];
  const old = queue[at];
  const merged: TemplateRequest = {
    ...old,
    count: old.count + incoming.count,
    requestedAt: Math.max(old.requestedAt, incoming.requestedAt),
    bestScore: Math.min(old.bestScore, incoming.bestScore),
    bestCandidateName: old.bestScore <= incoming.bestScore ? old.bestCandidateName : incoming.bestCandidateName,
  };
  const next = [...queue];
  next[at] = merged;
  return next;
}

/** Xếp hàng đợi theo mức đáng làm: hỏi nhiều lần trước, rồi tới cái thư viện thiếu nặng nhất. */
export function sortTemplateRequests(queue: TemplateRequest[]): TemplateRequest[] {
  return [...queue].sort((a, b) => b.count - a.count || a.bestScore - b.bestScore);
}

/* ── vỏ lưu hàng đợi (client) — cùng cách `lib/colors/registry.ts` làm: phần THUẦN ở trên là chỗ
      có test, phần dưới chỉ là đọc/ghi localStorage, hỏng thì im lặng về rỗng ── */

const QUEUE_KEY = 'interiorflow.templateRequests';

export function readTemplateQueue(): TemplateRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const j = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as TemplateRequest[];
    return Array.isArray(j) ? j.filter((r) => r && typeof r.id === 'string') : [];
  } catch {
    return [];
  }
}

export function writeTemplateQueue(queue: TemplateRequest[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}
