/**
 * lib/present-editor/reflow.ts — DÀN LẠI (reflow) deck khi đổi khổ trình bày (PS-4).
 *
 * "Bản gọn của Magic Resize, không cần AI" (đúng như spec PS-4 mô tả): khi user đổi khổ
 * sân khấu (16:9 ↔ A4/A3 ngang/dọc), toạ độ %-based của element VẪN HỢP LỆ (0..100 không
 * đổi ý nghĩa) nhưng bố cục nghĩ cho khổ CŨ có thể lệch tỉ lệ trên khổ MỚI (vd cột ảnh nửa
 * phải ở 16:9 sẽ thành dải hẹp cao ngoẵng nếu giữ nguyên % trên khổ A4 dọc). Module này
 * SẮP XẾP LẠI các phần tử CẤU TRÚC (tiêu đề/kicker/ảnh/thân bài — nhận theo `role`/`kind`)
 * vào lưới CANONICAL phù hợp hướng khổ mới, dùng đúng QUY ƯỚC margin/lưới của
 * `DECK_STANDARDS` — TÁI DÙNG các hàm định lượng đã có ở `region-layout.ts`
 * (`textFrameHeight` ôm chữ, `titleSize` co cỡ tiêu đề theo độ dài, `fitImageFrame` co ảnh
 * theo trần diện tích) thay vì tự chế lại công thức.
 *
 * CHỦ Ý AN TOÀN DỮ LIỆU: khác `buildSlideFromRegions` (được thiết kế để DÒ vai trò từ ảnh
 * mẫu bất định — có thể bỏ bớt ô/dòng nếu vượt "ngân sách" của template), hàm ở đây CHỈ
 * ĐỔI FRAME (vị trí/kích thước) — KHÔNG bao giờ tạo lại nội dung/id/style từ đầu, và không
 * bao giờ ÂM THẦM XOÁ phần tử: nếu số ảnh/khối thân bài vượt số ô canonical tính được,
 * phần dư vẫn được GIỮ NGUYÊN (chỉ kẹp % vào biên sân khấu) thay vì bị bỏ.
 *
 * Phần tử TỰ DO (freeform — hình khối trang trí, chữ role 'free') KHÔNG bị dàn lại theo
 * lưới (không có "vai trò" hình học rõ ràng để suy đúng vị trí mới) — chỉ CLAMP về trong
 * biên 0..100 cho an toàn, giữ nguyên % (đã hợp lệ ở mọi tỉ lệ khung).
 *
 * Thuần (pure) — không side-effect, không DOM. Test: reflow.test.ts.
 */

import {
  cloneDeck,
  type EditorDeck,
  type EditorSlide,
  type SlideElement,
  type TextElement,
  type ImageElement,
  type Frame,
} from './model';
import { DECK_STANDARDS, budgetFor } from './standards';
import { fitImageFrame, textFrameHeight, titleSize } from './region-layout';
import type { RegionCell } from './detect-regions';
import { stageFor, isLandscape, type StageSize, type StagePresetId } from './stage-presets';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Cùng "họ" tỉ lệ (lệch <2%) VÀ cùng hướng → % cũ đã đúng, KHÔNG cần dàn lại (vd A4 ngang
 * ↔ A3 ngang: cùng tỉ lệ giấy ISO, chỉ đổi độ phân giải). */
function sameAspectFamily(a: StageSize, b: StageSize): boolean {
  if (isLandscape(a) !== isLandscape(b)) return false;
  const ra = a.w / a.h;
  const rb = b.w / b.h;
  return Math.abs(ra - rb) / rb < 0.02;
}

function isRole(el: SlideElement, r: TextElement['role']): el is TextElement {
  return el.kind === 'text' && (el as TextElement).role === r;
}

interface Structural {
  title?: TextElement;
  kicker?: TextElement;
  bodies: TextElement[];
  images: ImageElement[];
  freeformIds: Set<string>;
}

/** Tách phần tử CẤU TRÚC (tiêu đề/kicker/thân bài/ảnh) khỏi phần TỰ DO (hình/chữ role 'free'). */
function splitStructural(slide: EditorSlide): Structural {
  const title = slide.elements.find((e): e is TextElement => isRole(e, 'title'));
  const kicker = slide.elements.find((e): e is TextElement => isRole(e, 'kicker'));
  const bodies = slide.elements.filter((e): e is TextElement => isRole(e, 'body'));
  const images = slide.elements.filter((e): e is ImageElement => e.kind === 'image');
  const structuralIds = new Set<string>([
    ...(title ? [title.id] : []),
    ...(kicker ? [kicker.id] : []),
    ...bodies.map((b) => b.id),
    ...images.map((im) => im.id),
  ]);
  const freeformIds = new Set(slide.elements.filter((e) => !structuralIds.has(e.id)).map((e) => e.id));
  return { title, kicker, bodies, images, freeformIds };
}

/** Kẹp frame vào biên sân khấu 0..100 — an toàn, KHÔNG đổi % nếu đã hợp lệ. */
function clampToStage(el: SlideElement): SlideElement {
  const f = el.frame;
  const w = Math.min(f.w, 100);
  const h = Math.min(f.h, 100);
  const x = clamp(f.x, 0, 100 - w);
  const y = clamp(f.y, 0, 100 - h);
  if (x === f.x && y === f.y && w === f.w && h === f.h) return el;
  return { ...el, frame: { ...f, x, y, w, h } };
}

/** Tỉ lệ diện tích `a` bị `b` che (0..1) — dùng để phát hiện phần tử tự do bị ảnh mới đè kín. */
function overlapAreaPct(a: Frame, b: Frame): number {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const aArea = a.w * a.h;
  if (aArea <= 0) return 0;
  return (ix * iy) / aArea;
}

/**
 * (Fix Phase 2c, audit 18/07 — bug thật: "đổi khổ trình bày làm ảnh đè hoàn toàn lên
 * tiêu đề vô hình") Phần tử TỰ DO (role 'free') chủ ý KHÔNG bị dàn lại theo lưới canonical
 * — giữ đúng triết lý "tự do đặt vị trí" của người dùng. Nhưng chỉ CLAMP biên (như cũ)
 * không đủ: nếu ảnh cấu trúc vừa được dàn lại vào ô MỚI đè kín > 50% diện tích phần tử tự
 * do, người dùng sẽ thấy chữ/hình biến mất hoàn toàn dù dữ liệu còn nguyên — đây là bug
 * thật cần né, KHÔNG phải đổi triết lý tự do đặt vị trí. Né bằng cách đẩy phần tử xuống
 * ngay dưới ảnh che nó (hoặc lên trên nếu không đủ chỗ dưới), giữ nguyên x/w/h.
 */
function avoidImageOverlap(el: SlideElement, newImages: ImageElement[]): SlideElement {
  const clamped = clampToStage(el);
  const f = clamped.frame;
  const covering = newImages.find((im) => overlapAreaPct(f, im.frame) > 0.5);
  if (!covering) return clamped;
  const imgF = covering.frame;
  const belowY = imgF.y + imgF.h + 2;
  const fitsBelow = belowY + f.h <= 100;
  const y = fitsBelow ? belowY : Math.max(0, imgF.y - f.h - 2);
  return { ...clamped, frame: { ...f, y: clamp(y, 0, 100 - f.h) } };
}

interface CanonicalLayout {
  titleCell?: RegionCell;
  kickerSlot: RegionCell;
  imageCells: RegionCell[];
  bodyCells: RegionCell[]; // luôn ≤ 1 ô (khối thân bài gộp) — placeBodies() chia cho nhiều block gốc.
}

/**
 * Lưới CANONICAL cho khổ mới, theo margin `DECK_STANDARDS.grid` — "compact Magic Resize":
 *   - landscape + có ảnh  → 2 cột (chữ trái ~42% · ảnh phải phần còn lại, ảnh xếp dọc nếu >1).
 *   - portrait/vuông + có ảnh → xếp CHỒNG (tiêu đề → ảnh → thân bài), ảnh xếp NGANG nếu >1.
 *   - không ảnh (quote/big-stat/closing…) → tiêu đề trên, thân bài dưới, full-width.
 * Xác định vai trò bằng CẤU TRÚC (không dò hình học lại) nên không lẫn ô như pickCells.
 */
function canonicalLayout(to: StageSize, nImages: number, hasTitle: boolean, hasBody: boolean): CanonicalLayout {
  const mW = DECK_STANDARDS.grid.marginPctW.ideal ?? 6;
  const mH = DECK_STANDARDS.grid.marginPctH.ideal ?? 6;
  const left = mW;
  const top = mH;
  const width = 100 - 2 * mW;
  const height = 100 - 2 * mH;
  const kickerSlot: RegionCell = { x: left, y: 4, w: 50, h: 4 };

  let titleCell: RegionCell | undefined;
  let bodyCells: RegionCell[] = [];
  const imageCells: RegionCell[] = [];

  if (isLandscape(to) && nImages > 0) {
    const textW = width * 0.42;
    const gutter = width * 0.06;
    const imgW = width - textW - gutter;
    const imgX = left + textW + gutter;
    if (hasTitle) titleCell = { x: left, y: top, w: textW, h: height * 0.16 };
    if (hasBody) bodyCells = [{ x: left, y: top + height * 0.22, w: textW, h: height * 0.78 }];
    const gapY = nImages > 1 ? height * 0.03 : 0;
    const perImgH = (height - gapY * (nImages - 1)) / nImages;
    for (let k = 0; k < nImages; k++) {
      imageCells.push({ x: imgX, y: top + k * (perImgH + gapY), w: imgW, h: perImgH });
    }
  } else if (nImages > 0) {
    if (hasTitle) titleCell = { x: left, y: top, w: width, h: height * 0.12 };
    const imgTop = top + (hasTitle ? height * 0.15 : 0);
    const imgH = height * (hasBody ? 0.55 : 0.8);
    const gapX = nImages > 1 ? width * 0.03 : 0;
    const perImgW = (width - gapX * (nImages - 1)) / nImages;
    for (let k = 0; k < nImages; k++) {
      imageCells.push({ x: left + k * (perImgW + gapX), y: imgTop, w: perImgW, h: imgH });
    }
    if (hasBody) {
      const bodyY = imgTop + imgH + height * 0.04;
      bodyCells = [{ x: left, y: bodyY, w: width, h: Math.max(6, top + height - bodyY) }];
    }
  } else {
    if (hasTitle) titleCell = { x: left, y: top, w: width, h: height * 0.3 };
    if (hasBody) bodyCells = [{ x: left, y: top + height * 0.36, w: width, h: height * 0.64 }];
  }

  return { titleCell, kickerSlot, imageCells, bodyCells };
}

function placeTitle(title: TextElement | undefined, cell: RegionCell | undefined, hero: boolean): TextElement | undefined {
  if (!title) return undefined;
  if (!cell) return clampToStage(title) as TextElement;
  const fs = titleSize(hero, title.text);
  const lh = title.lineHeight ?? DECK_STANDARDS.type.lineHeightDisplay.ideal ?? 1.15;
  return {
    ...title,
    fontSize: fs,
    lineHeight: lh,
    frame: { x: cell.x, y: cell.y, w: cell.w, h: textFrameHeight(title.text, cell, fs, lh), rotation: 0 },
  };
}

function placeImages(images: ImageElement[], cells: RegionCell[], perImgMaxAreaPct: number): ImageElement[] {
  return images.map((im, k) => {
    const cell = cells[k];
    if (!cell) return clampToStage(im) as ImageElement; // vượt số ô canonical — GIỮ (không xoá), chỉ kẹp biên.
    return { ...im, frame: fitImageFrame(cell, perImgMaxAreaPct) };
  });
}

/** Đặt các khối thân bài GỐC vào (tối đa 1) ô canonical — KHÔNG rút gọn/ghép nội dung như
 * buildSlideFromRegions; nếu nhiều khối gốc hơn ô, CHIA ĐỀU chiều cao ô cho từng khối theo
 * thứ tự đọc (trên→dưới) để không mất khối nào. */
function placeBodies(bodies: TextElement[], cells: RegionCell[]): TextElement[] {
  if (!bodies.length) return [];
  if (!cells.length) return bodies.map((b) => clampToStage(b) as TextElement);
  const cell = cells[0];
  if (bodies.length === 1) {
    const b = bodies[0];
    const lh = b.lineHeight ?? DECK_STANDARDS.type.lineHeightBody.ideal ?? 1.45;
    return [{ ...b, frame: { x: cell.x, y: cell.y, w: cell.w, h: textFrameHeight(b.text, cell, b.fontSize, lh), rotation: 0 } }];
  }
  const subH = cell.h / bodies.length;
  return bodies.map((b, i) => ({ ...b, frame: { x: cell.x, y: cell.y + i * subH, w: cell.w, h: subH, rotation: 0 } }));
}

/**
 * Dàn lại 1 slide cho khổ MỚI. Trả slide MỚI (không mutate `slide`); nếu 2 khổ cùng id
 * hoặc cùng họ tỉ lệ → trả nguyên `slide` (không cần dàn lại, % đã đúng).
 */
export function reflowSlideForStage(slide: EditorSlide, from: StageSize, to: StageSize): EditorSlide {
  if (from.id === to.id || sameAspectFamily(from, to)) return slide;

  const { title, kicker, bodies, images, freeformIds } = splitStructural(slide);
  if (!title && !kicker && !bodies.length && !images.length) {
    return { ...slide, elements: slide.elements.map(clampToStage) };
  }

  const budget = budgetFor(slide.templateId);
  const layout = canonicalLayout(to, images.length, !!title, bodies.length > 0);
  const hero = slide.templateId === 'cover' || slide.templateId === 'dark-cover';

  const newTitle = placeTitle(title, layout.titleCell, hero);
  const newKicker = kicker ? { ...kicker, frame: { ...layout.kickerSlot, rotation: 0 } } : undefined;
  const perImgMax = layout.imageCells.length
    ? budget.imageAreaPct.max / layout.imageCells.length
    : budget.imageAreaPct.max;
  const newImages = placeImages(images, layout.imageCells, perImgMax);
  const newBodies = placeBodies(bodies, layout.bodyCells);

  const byId = new Map<string, SlideElement>();
  if (newTitle) byId.set(newTitle.id, newTitle);
  if (newKicker) byId.set(newKicker.id, newKicker);
  newBodies.forEach((b) => byId.set(b.id, b));
  newImages.forEach((im) => byId.set(im.id, im));

  // Giữ đúng THỨ TỰ VẼ gốc (z-order): duyệt mảng elements GỐC, thay từng phần tử cấu trúc
  // bằng bản đã dàn lại (tra theo id); phần tự do chỉ kẹp biên, không đổi vị trí trong mảng.
  const elements = slide.elements.map(
    (el) => byId.get(el.id) ?? (freeformIds.has(el.id) ? avoidImageOverlap(el, newImages) : el),
  );

  return { ...slide, elements };
}

/**
 * Dàn lại CẢ DECK cho khổ mới `toPreset` — thuần, trả deck MỚI (clone sâu), không mutate
 * `deck` gốc. Cũng cập nhật `deck.stagePreset`. Gọi khi user đổi khổ trình bày (UI:
 * StagePresetPanel.tsx).
 */
export function reflowDeckForStage(deck: EditorDeck, toPreset: StagePresetId): EditorDeck {
  const from = stageFor(deck.stagePreset);
  const to = stageFor(toPreset);
  const next = cloneDeck(deck);
  next.stagePreset = toPreset;
  next.slides = next.slides.map((s) => reflowSlideForStage(s, from, to));
  return next;
}
