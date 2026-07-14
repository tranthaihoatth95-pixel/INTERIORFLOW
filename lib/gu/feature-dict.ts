/**
 * lib/gu/feature-dict.ts — TỪ ĐIỂN FEATURE chuẩn cho Gu Engine (Sprint 2, M-1).
 *
 * VÌ SAO CẦN 1 TỪ ĐIỂN CHUNG: pairwise-perceptron.ts học trên vector THƯA
 * (Record<string, number>) — nếu mỗi chặng tự đặt tên feature một kiểu thì trọng số học ở
 * chặng này không tái dùng được ở chặng khác, và không ai giải thích nổi model đang nhìn gì.
 * File này CHUẨN HOÁ tên + thang đo (mọi feature ~0..1) cho CẢ 3 CHẶNG (CAD · Render · Present);
 * Sprint 2 mới cắm chặng PRESENT (gợi ý template ở LayoutShelf), 2 chặng kia đặt chỗ trước.
 *
 * QUY ƯỚC ĐẶT TÊN (namespace bằng dấu chấm, one-hot bằng hậu tố ':giá-trị'):
 *   img.*   — tín hiệu ẢNH nội dung        (Present, Render)
 *   text.*  — tín hiệu CHỮ                  (Present)
 *   pal.*   — tín hiệu MÀU (ΔE*76, tông)    (Present, Render)
 *   grid.*  — tín hiệu LƯỚI ảnh mẫu          (Present — detect-regions/grid-geometry)
 *   shelf:* — one-hot kệ bố cục              (Present)
 *   tpl:*   — one-hot bản sắc template gốc   (Present; memorization NHẸ — clamp bởi maxWeight)
 *   op:*    — one-hot operator (đặt chỗ CAD — classifyOperator / gu-features)
 *   mood:*  — one-hot tâm-lý-màu trội (đặt chỗ Render — color-psychology)
 *   room:*  — one-hot subject phòng (đặt chỗ Render — ROOM_TERMS trong gu.ts)
 *
 * THANG ĐO: mọi feature nằm ~[0, 1] để learning-rate của perceptron tác động đều nhau
 * (1 feature thang 100 sẽ nuốt trọn update). Tất định — cùng input ra cùng vector.
 */

// import RELATIVE (không '@/') cho VALUE import — quy ước codebase để test chạy được bằng
// sucrase-node (alias '@/' chỉ dùng cho import type, bị xoá khi compile).
import type { EditorTemplate } from '../present-editor/templates';
import { estimateImageSlots, shelfOf } from '../present-editor/templates';
import type { FeatureVector } from './pairwise-perceptron';
import { hexToRgb, rgbToLab, deltaE } from './color-psychology';

/* ═══════════════════════ TỪ ĐIỂN (tài liệu sống — đọc được bằng code lẫn người) ═══════════════════════ */

/** Mô tả từng feature chuẩn. Key có '*' = họ one-hot (thay '*' bằng giá trị cụ thể). */
export const FEATURE_DOC: Record<string, string> = {
  'img.count': 'Số ảnh NỘI DUNG đang có trên slide, chuẩn hoá /8 (0..1).',
  'img.slotFit': 'Độ khớp giữa số Ô ảnh của template và số ảnh đang có: 1 = khớp đúng, giảm tuyến tính theo chênh lệch (0 khi lệch ≥6).',
  'text.density': 'Mật độ chữ của slide hiện tại (tổng ký tự title+body, chuẩn hoá 400 ký tự → 0..1).',
  'text.fit': 'Template ÍT ô ảnh × slide NHIỀU chữ (tương tác) — bố cục thiên chữ hợp nội dung dày chữ.',
  'pal.deltaE': 'Khoảng cách ΔE*76 giữa màu NỀN template (build với palette gu hiện hành) và màu gu GẦN NHẤT, chuẩn hoá /100. 0 = trùng tông; lớn = lệch gu.',
  'pal.darkBg': '1 nếu nền template là tông tối (luminance < 128).',
  'pal.toneMatch': "1 nếu tông nền template khớp spec.tone người dùng chọn ('dark' ↔ nền tối; 'light'/'warm'/'accent' ↔ nền sáng).",
  'grid.cellMatch': 'Độ khớp ARCHETYPE: số ô ảnh template so với số Ô LƯỚI nhận ra từ ảnh mẫu reference (detectRegions). 1 = trùng số ô.',
  'grid.tightMulti': 'Tương tác: gutter ảnh mẫu HẸP (khe < 10% sân khấu) × template nhiều ô (≥4) — bố cục lưới dày hợp ảnh mẫu khít.',
  'shelf:*': 'One-hot kệ bố cục (cover | subcover | content | closing).',
  'tpl:*': 'One-hot bản sắc template GỐC (đã bỏ hậu tố biến thể __mir/__dark) — cho phép model nhớ "user hay chọn cái này", clamp bởi maxWeight nên không lật thuyền.',
  'op:*': '(đặt chỗ — chặng CAD) one-hot OperatorType từ classifyOperator/gu-features.',
  'mood:*': '(đặt chỗ — chặng Render) one-hot tâm-lý-màu trội từ paletteMood.',
  'room:*': '(đặt chỗ — chặng Render) one-hot subject phòng từ ROOM_TERMS (gu.ts).',
};

/** Key localStorage cho model gợi ý TEMPLATE PRESENT (versioned — đổi schema thì tăng v). */
export const PRESENT_TEMPLATE_MODEL_KEY = 'interiorflow.gu.perceptron.present-template.v1';

/* ═══════════════════════ TRAITS — đặc điểm TĨNH của 1 template ═══════════════════════ */

/** Đặc điểm rút 1 lần từ template (cache theo id + palette được ở caller). */
export interface TemplateTraits {
  /** id GỐC — bỏ hậu tố biến thể (`__mir`, `__dark`) để biến thể học chung trọng số với gốc. */
  id: string;
  shelf: string;
  /** số Ô ảnh của bố cục (estimateImageSlots). */
  imageSlots: number;
  /** màu nền khi build với palette hiện hành. */
  bgHex: string;
  darkBg: boolean;
}

/** Bỏ hậu tố biến thể `__mir`/`__dark` (templates.makeVariants) → id template gốc. */
export function baseTemplateId(id: string): string {
  return id.replace(/(__mir|__dark)+$/, '');
}

function luminance(hex: string): number {
  const c = hexToRgb(hex);
  if (!c) return 255;
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

/** Rút traits từ 1 EditorTemplate — build thử với ctx dò (không ảnh) để lấy màu nền thật. */
export function templateTraits(t: EditorTemplate, palette?: string[]): TemplateTraits {
  let bgHex = '#f5f1ea';
  try {
    const probe = t.build({ title: 'x', kicker: 'x', body: ['a', 'b'], images: [], palette });
    if (probe.background) bgHex = probe.background;
  } catch {
    /* template lỗi build → traits mặc định, không chặn */
  }
  return {
    id: baseTemplateId(t.id),
    shelf: shelfOf(t),
    imageSlots: estimateImageSlots(t),
    bgHex,
    darkBg: luminance(bgHex) < 128,
  };
}

/* ═══════════════════════ CONTEXT — tín hiệu ĐỘNG lúc gợi ý ═══════════════════════ */

export interface PresentFeatureContext {
  /** số ảnh nội dung đang có trên slide hiện tại. */
  nImages: number;
  /** tổng ký tự title + body của slide hiện tại. */
  textLen: number;
  /** palette gu hiện hành (để đo ΔE với nền template). */
  palette?: string[];
  /** tông người dùng chọn ở bảng hỏi (spec.tone). */
  tone?: 'light' | 'warm' | 'dark' | 'accent';
  /** số ô lưới nhận ra từ ảnh mẫu reference (detectRegions) — không có = bỏ tín hiệu grid. */
  gridCells?: number;
  /** gutter đại diện của ảnh mẫu theo % sân khấu (detectRegions.gutterXPct). */
  gutterPct?: number;
}

/** ΔE*76 từ 1 hex tới màu GẦN NHẤT trong palette. null nếu thiếu dữ liệu. */
export function nearestDeltaE(hex: string, palette?: string[]): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb || !palette?.length) return null;
  const lab = rgbToLab(rgb);
  let best: number | null = null;
  for (const p of palette) {
    const pr = hexToRgb(p);
    if (!pr) continue;
    const d = deltaE(lab, rgbToLab(pr));
    if (best === null || d < best) best = d;
  }
  return best;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * VECTOR FEATURE cho 1 template Present trong 1 ngữ cảnh gợi ý. Tất định, mọi giá trị ~[0,1].
 * Đây là hàm featureOf() nuôi PairwisePerceptron.rank/update ở LayoutShelf.
 */
export function presentTemplateFeatures(traits: TemplateTraits, ctx: PresentFeatureContext): FeatureVector {
  const f: FeatureVector = {};
  const slots = traits.imageSlots;
  const slotNorm = clamp01(slots / 6);

  // ẢNH
  f['img.count'] = clamp01(ctx.nImages / 8);
  f['img.slotFit'] = clamp01(1 - Math.abs(slots - ctx.nImages) / 6);

  // CHỮ
  const density = clamp01(ctx.textLen / 400);
  f['text.density'] = density;
  f['text.fit'] = clamp01((1 - slotNorm) * density);

  // MÀU (ΔE*76 với gu)
  const dE = nearestDeltaE(traits.bgHex, ctx.palette);
  if (dE !== null) f['pal.deltaE'] = clamp01(dE / 100);
  if (traits.darkBg) f['pal.darkBg'] = 1;
  if (ctx.tone) {
    const wantDark = ctx.tone === 'dark';
    f['pal.toneMatch'] = wantDark === traits.darkBg ? 1 : 0;
  }

  // LƯỚI ảnh mẫu (archetype match)
  if (typeof ctx.gridCells === 'number' && ctx.gridCells > 0) {
    f['grid.cellMatch'] = clamp01(1 - Math.abs(slots - ctx.gridCells) / 8);
    const tight = typeof ctx.gutterPct === 'number' ? clamp01(1 - ctx.gutterPct / 10) : 0;
    if (tight > 0 && slots >= 4) f['grid.tightMulti'] = tight;
  }

  // ONE-HOT bản sắc
  f[`shelf:${traits.shelf}`] = 1;
  f[`tpl:${traits.id}`] = 1;

  // dọn feature = 0 (giữ vector thưa như perceptron mong đợi)
  for (const k of Object.keys(f)) if (f[k] === 0) delete f[k];
  return f;
}

/* ═══════════════════════ EXPLAIN — 2-3 lý do người đọc được ═══════════════════════ */

/**
 * Sinh 2-3 lý do tiếng Việt vì sao template này hợp ngữ cảnh — cho tooltip explainable.
 * Có `weights` (model đã học) → xếp lý do theo ĐÓNG GÓP thật (feature × trọng số);
 * chưa có → xếp theo ưu tiên tất định (khớp ảnh > lưới > tông > chữ).
 */
export function explainTemplateChoice(
  traits: TemplateTraits,
  ctx: PresentFeatureContext,
  weights?: Record<string, number>,
): string[] {
  const f = presentTemplateFeatures(traits, ctx);
  // [key, câu chữ, ưu-tiên-mặc-định] — chỉ nêu khi tín hiệu đủ rõ.
  const candidates: [string, string, number][] = [];

  if ((f['img.slotFit'] ?? 0) >= 0.8) {
    candidates.push(['img.slotFit', `khớp ${traits.imageSlots} ô ảnh với ${ctx.nImages} ảnh của bạn`, 4]);
  }
  if ((f['grid.cellMatch'] ?? 0) >= 0.8 && ctx.gridCells) {
    candidates.push(['grid.cellMatch', `bố cục ${traits.imageSlots} ô giống lưới ${ctx.gridCells} ô của ảnh mẫu`, 3.5]);
  }
  if ((f['grid.tightMulti'] ?? 0) > 0.4) {
    candidates.push(['grid.tightMulti', 'ảnh mẫu ghép khít → hợp lưới nhiều ô', 2.5]);
  }
  if (f['pal.toneMatch'] === 1 && ctx.tone) {
    candidates.push(['pal.toneMatch', `tông nền ${traits.darkBg ? 'tối' : 'sáng'} đúng lựa chọn "${ctx.tone}"`, 3]);
  }
  const dE = f['pal.deltaE'];
  if (dE !== undefined && dE <= 0.15 && ctx.palette?.length) {
    candidates.push(['pal.deltaE', 'nền template gần như trùng tông palette gu (ΔE nhỏ)', 2]);
  }
  if ((f['text.fit'] ?? 0) >= 0.5) {
    candidates.push(['text.fit', 'nội dung dày chữ → bố cục thiên chữ đọc thoáng hơn', 2]);
  }
  if (weights && (weights[`tpl:${traits.id}`] ?? 0) > 0.3) {
    candidates.push([`tpl:${traits.id}`, 'bạn hay Nhận bố cục này trước đây', 5]);
  }

  const score = (k: string, prio: number) =>
    weights ? (f[k] ?? (k.startsWith('tpl:') ? 1 : 0)) * (weights[k] ?? 0) + prio * 1e-6 : prio;
  return candidates
    .sort((a, b) => score(b[0], b[2]) - score(a[0], a[2]))
    .slice(0, 3)
    .map(([, text]) => text);
}
