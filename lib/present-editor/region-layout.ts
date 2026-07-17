/**
 * lib/present-editor/region-layout.ts — Lưới (từ detect-regions) → EditorSlide.
 *
 * Cầu nối cuối: nhận ô lưới `RegionCell[]` (đã theo % sân khấu) + nội dung + ngân sách
 * chuẩn (DECK_STANDARDS) → gán VAI TRÒ cho từng ô rồi dựng element.
 *
 * Gán vai trò bằng HÌNH HỌC (không cần biết ảnh gốc là slide hay ảnh gì):
 *   - ô mỏng, nằm cao  → TIÊU ĐỀ (title)
 *   - ô diện tích lớn  → ẢNH (tối đa theo budget.images)
 *   - ô còn lại        → BODY (gộp ý vào ÍT ô, "one idea per card")
 *
 * CHỐNG LOÃNG (bài học từ Gamma / Beautiful.ai / Figma auto-layout — xem REPORT):
 *   1) KẸP SỐ Ô về `budget.cells` (trần): ảnh mẫu "bận" dò ra 20+ ô vụn → ta CHỈ giữ
 *      đúng số ô mà NỘI DUNG cần (1 tiêu đề + N ảnh + ÍT ô body), chọn các ô LỚN nhất,
 *      bỏ hết ô vụn. Không bao giờ đẻ ô rỗng → slide không loãng (Gamma: card nở theo
 *      nội dung, không chèn ô trống). Số ô body gộp tối thiểu để ý dồn 1 khối.
 *   2) BIÊN ĐỘ MIN–MAX theo TỪNG phần tử (Figma min/max width+height "tránh bố cục dị"):
 *      - cỡ chữ TIÊU ĐỀ: co trong dải titlePctH theo độ dài tiêu đề (dài → nhỏ dần).
 *      - diện tích ẢNH: nếu ô ảnh vượt trần imageAreaPct/ảnh → CO ảnh (inset giữa ô) về trần.
 *      - độ dài BODY: kẹp số dòng về bulletsMax (6×6) để không tràn.
 *
 * Đây là điểm xuất phát — người dùng chỉnh tiếp (human-in-the-loop). Thuần, không DOM.
 *
 * PS-4: `textFrameHeight`/`titleSize`/`fitImageFrame` được EXPORT thêm để `reflow.ts`
 * (dàn lại slide khi đổi khổ trình bày) tái dùng đúng công thức "ôm chữ"/"co ảnh theo
 * trần diện tích" — KHÔNG lặp lại các con số ma thuật ở nơi khác.
 */

import { makeText, makeImage, newId } from './model';
import type { EditorSlide, Frame, SlideElement } from './model';
import type { RegionCell } from './detect-regions';
import { DECK_STANDARDS, budgetFor, type LayoutBudget } from './standards';

export interface RegionContent {
  kicker?: string;
  title?: string;
  body?: string[];
  images?: string[]; // src/data-URI
}

export interface BuildRegionOpts {
  cells: RegionCell[];
  content: RegionContent;
  templateId?: string;
  palette?: string[];
  background?: string;
  ink?: string; // màu chữ
  hero?: boolean; // cỡ tiêu đề lớn (cover/quote)
}

const cellArea = (c: RegionCell) => c.w * c.h;
/** Diện tích ô quy về % SÂN KHẤU (0..100) — khớp đơn vị imageAreaPct trong chuẩn. */
const cellAreaPct = (c: RegionCell) => (c.w * c.h) / 100;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * GỘP ô vụn → ô LỚN: khi ảnh mẫu "bận" dò ra quá nhiều ô nhỏ, ta coi tập ô như 1 lưới
 * và giảm số đường cắt về (cols×rows) — giữ các đường cắt gần mốc chia đều nhất (thường
 * trùng gutter thật của slide) → ra ít ô lớn TILE kín khung, thay vì nhặt vài ô vụn để
 * lại slide trống. Tất định, thuần.
 */
function reduceCuts(interior: number[], lo: number, hi: number, slots: number): number[] {
  const nCuts = Math.max(0, slots - 1);
  if (nCuts === 0) return [];
  const uniq = [...new Set(interior)].sort((a, b) => a - b);
  if (uniq.length <= nCuts) return uniq;
  const chosen = new Set<number>();
  for (let k = 1; k <= nCuts; k++) {
    const target = lo + ((hi - lo) * k) / (nCuts + 1);
    let best = uniq[0];
    let bd = Infinity;
    for (const e of uniq) {
      const d = Math.abs(e - target);
      if (!chosen.has(e) && d < bd) {
        bd = d;
        best = e;
      }
    }
    chosen.add(best);
  }
  return [...chosen].sort((a, b) => a - b);
}

function coarsenCells(cells: RegionCell[], cols: number, rows: number): RegionCell[] {
  const xset = new Set<number>();
  const yset = new Set<number>();
  for (const c of cells) {
    xset.add(+c.x.toFixed(2));
    xset.add(+(c.x + c.w).toFixed(2));
    yset.add(+c.y.toFixed(2));
    yset.add(+(c.y + c.h).toFixed(2));
  }
  const xs = [...xset].sort((a, b) => a - b);
  const ys = [...yset].sort((a, b) => a - b);
  const x0 = xs[0];
  const x1 = xs[xs.length - 1];
  const y0 = ys[0];
  const y1 = ys[ys.length - 1];
  const xb = [x0, ...reduceCuts(xs.slice(1, -1), x0, x1, cols), x1];
  const yb = [y0, ...reduceCuts(ys.slice(1, -1), y0, y1, rows), y1];
  const out: RegionCell[] = [];
  for (let r = 0; r < yb.length - 1; r++)
    for (let c = 0; c < xb.length - 1; c++)
      out.push({ x: xb[c], y: yb[r], w: xb[c + 1] - xb[c], h: yb[r + 1] - yb[r] });
  return out;
}

/**
 * Chiều cao khung chữ ÔM nội dung (Figma "hug"): số dòng × cỡ × lineHeight, kẹp trong ô.
 * Đo dòng CÙNG công thức layout-check.textOverflows → khung sinh ra không bị cảnh báo tràn,
 * và không phình coverage như khi lấy trọn ô cao.
 */
export function textFrameHeight(text: string, cell: RegionCell, fontSize: number, lineHeight: number): number {
  const chars = text.length || 1;
  const perLine = Math.max(1, cell.w * DECK_STANDARDS.type.charsPerPctWBody);
  const linesByWrap = Math.ceil(chars / perLine);
  const linesByBreak = text.split('\n').length;
  const lines = Math.max(linesByWrap, linesByBreak);
  const needed = lines * fontSize * lineHeight;
  return Math.min(cell.h, Math.max(fontSize * lineHeight, needed));
}

/**
 * Cỡ tiêu đề trong dải chuẩn, CO theo độ dài (Figma: kẹp trong biên min–max).
 * Tiêu đề ngắn (≤ titleWordsIdeal từ) giữ cỡ lớn nhất (ideal); dài dần → co về min.
 */
export function titleSize(hero: boolean, text?: string): number {
  const band = hero ? DECK_STANDARDS.type.titleHeroPctH : DECK_STANDARDS.type.titlePctH;
  const ideal = band.ideal ?? (band.min + band.max) / 2;
  const words = text && text.trim() ? text.trim().split(/\s+/).length : 1;
  const lo = DECK_STANDARDS.type.titleWordsIdeal;
  const hi = DECK_STANDARDS.type.titleWordsMax;
  if (words <= lo || hi <= lo) return ideal;
  const t = clamp((words - lo) / (hi - lo), 0, 1);
  return clamp(ideal - t * (ideal - band.min), band.min, band.max);
}

/**
 * CO ảnh về biên độ diện tích: nếu ô lớn hơn trần `maxAreaPct` (% sân khấu) → thu nhỏ
 * ảnh, đặt GIỮA ô (giữ căn lưới, phần dư thành khoảng trắng). Ô trong dải → giữ nguyên
 * (không đụng frame — giữ tương thích test cũ).
 */
export function fitImageFrame(c: RegionCell, maxAreaPct: number): Frame {
  const areaPct = cellAreaPct(c);
  if (!(maxAreaPct > 0) || areaPct <= maxAreaPct) return { x: c.x, y: c.y, w: c.w, h: c.h, rotation: 0 };
  const scale = Math.sqrt(maxAreaPct / areaPct);
  const w = c.w * scale;
  const h = c.h * scale;
  return { x: c.x + (c.w - w) / 2, y: c.y + (c.h - h) / 2, w, h, rotation: 0 };
}

interface Picked {
  titleCell?: RegionCell;
  imageCells: RegionCell[];
  bodyCells: RegionCell[];
  nImg: number;
}

/**
 * Chọn ĐÚNG số ô mà nội dung cần, kẹp theo trần `budget.cells`, ưu tiên
 * TIÊU ĐỀ > ẢNH > BODY. Ô vụn dư bị bỏ (không render) → slide gọn.
 */
function pickCells(all: RegionCell[], budget: LayoutBudget, content: RegionContent): Picked {
  const indexed = all.map((c, i) => ({ c, i }));
  const imgs = content.images ?? [];
  const wantTitle = !!content.title;
  const lines = content.body?.length ?? 0;
  const hasBody = lines > 0;

  // số ảnh: kẹp theo budget + số ô sẵn có.
  const nImg = clamp(Math.min(imgs.length, indexed.length), budget.images.min, budget.images.max);

  // TRẦN tổng số ô: không dưới phần "cứng" (tiêu đề + ảnh), không quá budget.cells.max.
  const fixed = (wantTitle ? 1 : 0) + nImg;
  const cap = Math.max(budget.cells.max, fixed);

  // số ô body: gộp về ÍT ô ("one idea/card"); mặc định 1, cho 2 nếu nhiều dòng & còn chỗ.
  const bodyWish = hasBody ? (lines > DECK_STANDARDS.type.bulletsMax ? 2 : 1) : 0;
  const bodyRoom = Math.max(0, cap - fixed);
  const maxBodyByBlocks = Math.max(1, budget.textBlocks.max - (wantTitle ? 1 : 0));
  const wantBody = Math.min(bodyWish, bodyRoom, maxBodyByBlocks, Math.max(0, indexed.length - fixed));

  const used = new Set<number>();

  // 1) ẢNH = các ô diện tích lớn nhất.
  const byArea = [...indexed].sort((a, b) => cellArea(b.c) - cellArea(a.c));
  const imageCells: RegionCell[] = [];
  for (const { c, i } of byArea) {
    if (imageCells.length >= nImg) break;
    imageCells.push(c);
    used.add(i);
  }

  // 2) TIÊU ĐỀ = ô MỎNG NHẤT ở nửa trên (fallback ô cao nhất) trong các ô CÒN LẠI.
  let titleCell: RegionCell | undefined;
  if (wantTitle) {
    const remain = indexed.filter(({ i }) => !used.has(i));
    const pool = remain.length ? remain : indexed;
    const pick =
      pool.filter(({ c }) => c.y < 45).sort((a, b) => a.c.h - b.c.h || a.c.y - b.c.y)[0] ??
      [...pool].sort((a, b) => a.c.y - b.c.y)[0];
    if (pick) {
      titleCell = pick.c;
      used.add(pick.i);
    }
  }

  // 3) BODY = wantBody ô lớn nhất còn lại; xếp lại theo thứ tự đọc (trên→dưới, trái→phải).
  const bodyCells = indexed
    .filter(({ i }) => !used.has(i))
    .sort((a, b) => cellArea(b.c) - cellArea(a.c))
    .slice(0, wantBody)
    .map(({ c }) => c)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  return { titleCell, imageCells, bodyCells, nImg };
}

/**
 * Dựng 1 slide từ lưới. Nếu cells rỗng → trả slide nền trơn (an toàn, không ném).
 */
export function buildSlideFromRegions(opts: BuildRegionOpts): EditorSlide {
  const { content, templateId, palette, background, hero } = opts;
  const ink = opts.ink ?? palette?.[palette.length - 1] ?? '#221f1a';
  const budget = budgetFor(templateId);
  const elements: SlideElement[] = [];

  // ô hợp lệ, bỏ ô quá nhỏ (đề phòng caller chưa lọc).
  let cells = [...opts.cells].filter((c) => c.w >= 6 && c.h >= 6);

  // KẸP SỐ Ô: ảnh mẫu bận dò ra nhiều ô vụn (> trần budget.cells) → GỘP về lưới ô lớn
  // để slide không loãng. Đủ ít ô rồi thì giữ nguyên frame gốc (không đụng bố cục đã sạch).
  if (cells.length > budget.cells.max) {
    const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(budget.cells.max))));
    const rows = Math.min(3, Math.max(1, Math.ceil(budget.cells.max / cols)));
    cells = coarsenCells(cells, cols, rows).filter((c) => c.w >= 6 && c.h >= 6);
  }

  if (cells.length) {
    const { titleCell, imageCells, bodyCells, nImg } = pickCells(cells, budget, content);
    const imgs = content.images ?? [];

    // ẢNH (đặt trước → nằm dưới chữ). Diện tích co về trần imageAreaPct / số ảnh.
    const perImgMax = nImg > 0 ? budget.imageAreaPct.max / nImg : budget.imageAreaPct.max;
    imageCells.forEach((c, k) => {
      const src = imgs.length ? imgs[k % imgs.length] : undefined;
      if (src) elements.push(makeImage(src, { id: newId('img'), frame: fitImageFrame(c, perImgMax) }));
    });

    // TIÊU ĐỀ — cỡ co theo độ dài (dải min–max), khung ÔM chiều cao chữ.
    if (titleCell && content.title) {
      const fs = titleSize(!!hero, content.title);
      const lh = DECK_STANDARDS.type.lineHeightDisplay.ideal ?? 1.15;
      elements.push(
        makeText({
          id: newId('txt'),
          frame: {
            x: titleCell.x,
            y: titleCell.y,
            w: titleCell.w,
            h: textFrameHeight(content.title, titleCell, fs, lh),
            rotation: 0,
          },
          text: content.title,
          fontSize: fs,
          color: ink,
          bold: true,
          role: 'title',
          lineHeight: lh,
        }),
      );
    }

    // BODY: kẹp số dòng về bulletsMax (mỗi ô), chia đều dòng cho các ô body.
    const capLines = DECK_STANDARDS.type.bulletsMax * Math.max(1, bodyCells.length);
    const bodyLines = (content.body ?? []).slice(0, capLines);
    if (bodyCells.length && bodyLines.length) {
      const per = Math.ceil(bodyLines.length / bodyCells.length);
      bodyCells.forEach((c, k) => {
        const part = bodyLines.slice(k * per, (k + 1) * per).slice(0, DECK_STANDARDS.type.bulletsMax);
        if (part.length) {
          const text = part.join('\n');
          const fs = DECK_STANDARDS.type.bodyPctH.ideal ?? 2.6;
          const lh = DECK_STANDARDS.type.lineHeightBody.ideal ?? 1.45;
          elements.push(
            makeText({
              id: newId('txt'),
              frame: { x: c.x, y: c.y, w: c.w, h: textFrameHeight(text, c, fs, lh), rotation: 0 },
              text,
              fontSize: fs,
              color: ink,
              role: 'body',
              bullet: part.length > 1,
              lineHeight: lh,
            }),
          );
        }
      });
    }
  }

  // kicker (nếu có) — dải nhỏ trên cùng, không chiếm ô lưới.
  if (content.kicker) {
    elements.unshift(
      makeText({
        id: newId('txt'),
        frame: { x: DECK_STANDARDS.grid.marginPctW.ideal ?? 6, y: 4, w: 50, h: 4, rotation: 0 },
        text: content.kicker,
        fontSize: DECK_STANDARDS.type.captionPctH.ideal ?? 1.8,
        color: ink,
        role: 'kicker',
      }),
    );
  }

  return {
    id: newId('slide'),
    background: background ?? '#ffffff',
    backgroundImage: null,
    elements,
    templateId,
  };
}
