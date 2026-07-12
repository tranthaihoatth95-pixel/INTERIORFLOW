/**
 * lib/present-editor/layout-check.ts — Chấm 1 slide theo DECK_STANDARDS.
 *
 * "Không thụ động": sau khi sinh/sửa slide, hàm này đo coverage / whitespace / số hình /
 * số khối chữ / chữ-tràn rồi phát CẢNH BÁO tiếng Việt (human-in-the-loop) — cùng giọng
 * với `reason` ở suggest.ts. Thuần, không DOM, test được.
 */

import type { EditorSlide, SlideElement, TextElement } from './model';
import { DECK_STANDARDS, budgetFor, type LayoutBudget, type Range } from './standards';

export type WarnLevel = 'empty' | 'dense' | 'range' | 'overflow';

export interface LayoutWarning {
  level: WarnLevel;
  metric: 'whitespace' | 'images' | 'textBlocks' | 'imageArea' | 'textOverflow';
  message: string; // tiếng Việt, hiển thị cho người dùng
}

export interface LayoutReport {
  coveragePct: number; // 0..100 (diện tích bị chiếm, cap 100)
  whitespacePct: number; // 100 - coverage
  imageAreaPct: number; // 0..100
  imageCount: number;
  textCount: number;
  warnings: LayoutWarning[];
  bleed: boolean;
}

const area = (el: SlideElement) => (el.frame.w * el.frame.h) / 100; // % sân khấu
const visible = (el: SlideElement) => !el.hidden && (el.opacity ?? 1) > 0.02;
const inRange = (v: number, r: Range) => v >= r.min && v <= r.max;

/** Ước lượng slide có ảnh nền tràn (bleed) — coverage ~100 là cố ý. */
function isBleed(slide: EditorSlide, budget: LayoutBudget): boolean {
  return !!budget.bleed || !!slide.backgroundImage;
}

/** Ước lượng chữ có tràn khung không (số dòng × cỡ × lineHeight so với chiều cao khung). */
function textOverflows(el: TextElement): boolean {
  const chars = (el.text || '').length;
  if (!chars) return false;
  const perLine = Math.max(1, el.frame.w * DECK_STANDARDS.type.charsPerPctWBody);
  const lines = Math.ceil(chars / perLine);
  const lh = el.lineHeight ?? DECK_STANDARDS.type.lineHeightBody.ideal ?? 1.4;
  const neededPctH = lines * el.fontSize * lh; // fontSize theo %H
  return neededPctH > el.frame.h + 0.5; // +0.5 dung sai
}

export function evaluateSlide(slide: EditorSlide, templateId?: string): LayoutReport {
  const id = templateId ?? slide.templateId;
  const budget = budgetFor(id);
  const els = slide.elements.filter(visible);

  let coverage = els.reduce((a, el) => a + area(el), 0);
  let imageArea = els.filter((e) => e.kind === 'image').reduce((a, el) => a + area(el), 0);
  const bleed = isBleed(slide, budget);
  if (slide.backgroundImage) {
    coverage = 100;
    imageArea = Math.max(imageArea, 100);
  }
  coverage = Math.min(100, coverage);
  imageArea = Math.min(100, imageArea);
  const whitespace = 100 - coverage;

  const imageCount = els.filter((e) => e.kind === 'image').length + (slide.backgroundImage ? 1 : 0);
  const textCount = els.filter((e) => e.kind === 'text').length;

  const warnings: LayoutWarning[] = [];
  const ws = DECK_STANDARDS.whitespace;

  if (!bleed && whitespace > ws.tooEmptyAbovePct) {
    warnings.push({ level: 'empty', metric: 'whitespace', message: `Trống quá (${whitespace.toFixed(0)}% khoảng trắng > ${ws.tooEmptyAbovePct}%) — thêm nội dung hoặc phóng to element.` });
  }
  if (!bleed && whitespace < ws.tooDenseBelowPct) {
    warnings.push({ level: 'dense', metric: 'whitespace', message: `Chật quá (${whitespace.toFixed(0)}% khoảng trắng < ${ws.tooDenseBelowPct}%) — bớt nội dung hoặc giãn khung.` });
  }
  if (!inRange(imageCount, budget.images)) {
    warnings.push({ level: 'range', metric: 'images', message: `Số hình ${imageCount} ngoài dải ${budget.images.min}–${budget.images.max} cho layout này.` });
  }
  if (!inRange(textCount, budget.textBlocks)) {
    warnings.push({ level: 'range', metric: 'textBlocks', message: `Số khối chữ ${textCount} ngoài dải ${budget.textBlocks.min}–${budget.textBlocks.max}.` });
  }
  if (!bleed && imageArea > 0 && !inRange(imageArea, budget.imageAreaPct)) {
    warnings.push({ level: 'range', metric: 'imageArea', message: `Diện tích ảnh ${imageArea.toFixed(0)}% ngoài dải ${budget.imageAreaPct.min}–${budget.imageAreaPct.max}%.` });
  }
  for (const el of els) {
    if (el.kind === 'text' && textOverflows(el)) {
      const snippet = (el.text || '').slice(0, 24);
      warnings.push({ level: 'overflow', metric: 'textOverflow', message: `Chữ có thể tràn khung: "${snippet}${el.text.length > 24 ? '…' : ''}" — giảm chữ hoặc tăng khung/giảm cỡ.` });
    }
  }

  return { coveragePct: coverage, whitespacePct: whitespace, imageAreaPct: imageArea, imageCount, textCount, warnings, bleed };
}

/** Chấm cả deck → gộp cảnh báo kèm số slide (1-index). */
export function evaluateDeck(slides: EditorSlide[]): { slide: number; report: LayoutReport }[] {
  return slides.map((s, i) => ({ slide: i + 1, report: evaluateSlide(s) })).filter((r) => r.report.warnings.length > 0);
}
