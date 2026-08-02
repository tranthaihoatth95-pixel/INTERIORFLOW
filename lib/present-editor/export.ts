/**
 * lib/present-editor/export.ts — Xuất deck ĐÃ SỬA → PDF/PNG và PPTX từ CÙNG một model.
 *
 * PDF (jsPDF): mỗi slide render ra JPEG full-page → 1 trang, ĐÚNG khổ trình bày đang chọn
 *     của deck (`deck.stagePreset` → `stageFor()`, mặc định 16:9 landscape — KHÔNG đổi so
 *     trước PS-4). Trung thực 1:1 với editor (mọi element, filter, crop). WYSIWYG.
 *
 * PNG: tương tự, mỗi ảnh xuất đúng W×H của khổ đang chọn.
 *
 * PPTX (lib/pptx exportDeckToPptx): CHỮ vẫn chỉnh được trong PowerPoint.
 *      Ánh xạ heuristic: mỗi slide → PptxSlideContent nếu bóc được title/body text element;
 *      ảnh hero = image element to nhất HOẶC ảnh nền. Nếu slide thiên về ảnh (không có text
 *      role title/body) → fallback PptxSlideImage full-bleed (render từ model).
 *
 *      QUYẾT ĐỊNH PHẠM VI (PS-4): PPTX LUÔN xuất khổ 16:9, BẤT KỂ `deck.stagePreset` đang
 *      chọn khổ gì. `lib/pptx.ts` định vị mọi text/ảnh bằng SỐ INCH TUYỆT ĐỐI neo cứng vào
 *      canvas 13.333×7.5in (lề/cột/cỡ chữ tính point cố định) — nếu đổi kích thước khung
 *      PPTX theo A4/A3 dọc, các con số neo cứng đó (vd `SLIDE_H - 0.6` cho footer, `SLIDE_W
 *      * 0.56` cho cột ảnh) sẽ lệch tỉ lệ nặng (khổ càng khác 16:9 càng rõ) vì chúng được
 *      tinh chỉnh RIÊNG cho tỉ lệ ngang rộng — sửa đúng cho mọi khổ cần viết lại toàn bộ
 *      hệ toạ độ của lib/pptx.ts (ngoài phạm vi PS-4). "Giữ 16:9" là lựa chọn AN TOÀN hơn
 *      trong 2 lựa chọn spec cho phép ("giữ 16:9 HOẶC map khổ gần nhất") — UI nhắc rõ điều
 *      này ở StagePresetPanel + menu Xuất (components/ui/IOMenu.tsx).
 *
 * PDF khổ giấy thật theo dpi (`exportDeckToPdfAtPaperSize`, P3 01/08): CHỈ chạy được với khổ
 *     A4/A3 (`PAPER_SIZE_MM`) — trang PDF đúng mm thật (không phải px màn hình như hàm PDF
 *     trên), canvas phóng theo `resScale` để chữ/hình khối đạt đúng dpi. Ảnh hero/nền CHƯA đạt
 *     dpi đó (P3 phần 2, chưa làm) — xem JSDoc hàm.
 *
 * Cả bốn đọc EditorDeck. jsPDF/pptx import động (client-only).
 */

import type { EditorDeck, EditorSlide, TextElement, ImageElement, FillOverlay } from './model';
import { renderEditorSlide } from './render';
import { imageMaskCanvasPath, applyFillOverlayStyle } from './shape-geometry';
import { stageFor, printResScale, PAPER_SIZE_MM, type StageSize } from './stage-presets';
import { exportDeckToPptx, type PptxSlide, type PptxExportResult } from '@/lib/pptx';
import type { SlideContent, SlideTheme, SlideLayout } from '@/lib/slides';
import { applyPrintUpscale } from './print-upscale';
import type { AiTier } from '@/lib/ai/tiers';

/* --------------------------------- PDF --------------------------------- */

export async function exportDeckToPdf(deck: EditorDeck): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!deck.slides.length) throw new Error('Deck rỗng — cần ít nhất 1 slide.');
  const stage = stageFor(deck.stagePreset);
  const orientation = stage.w >= stage.h ? 'landscape' : 'portrait';
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation, unit: 'px', format: [stage.w, stage.h] });
  for (let i = 0; i < deck.slides.length; i++) {
    const img = await renderEditorSlide(deck.slides[i], deck.fonts, deck.watermark, stage);
    if (i > 0) doc.addPage([stage.w, stage.h], orientation);
    doc.addImage(img, 'JPEG', 0, 0, stage.w, stage.h);
  }
  doc.save(`${safeName(deck.project || deck.brand || 'deck')}.pdf`);
}

/**
 * PDF khổ giấy THẬT (mm, ISO 216) ở `dpi` — P3 phần 1 (01/08,
 * `docs/NGHIEN-CUU-PRESENT-VS-DOI-THU-2026-08-01.md` §3.1). Chỉ chạy được khi
 * `deck.stagePreset` là A4/A3 (`PAPER_SIZE_MM` có mục) — 16:9 không phải khổ in, ném lỗi rõ
 * thay vì âm thầm ra file sai khổ.
 *
 * CHỮ/HÌNH KHỐI (vẽ vector qua canvas 2D) đạt `dpi` thật qua `resScale`, xem JSDoc
 * `renderEditorSlide`. ẢNH hero/nền — P3 phần 2 (02/08, Hoà chốt hướng "chuẩn nguồn in") —
 * truyền `opts.tier` để tự nâng độ phân giải ảnh thiếu (`lib/present-editor/print-upscale.ts`,
 * ×4 hoặc ×4+×2 tuỳ độ thiếu, cache theo hash src, trừ credit thật) TRƯỚC khi render; không
 * truyền `opts` (hoặc mức "Không AI") → giữ nguyên ảnh gốc, KHÔNG chặn export (Tầng lõi tất định
 * luôn ra PDF, chỉ là ảnh chưa tới dpi nếu nguồn nhỏ).
 */
export async function exportDeckToPdfAtPaperSize(
  deck: EditorDeck,
  dpi = 300,
  opts?: { tier: AiTier; onUpscaleProgress?: (done: number, total: number) => void },
): Promise<{ upscaledCount: number; failedCount: number }> {
  if (typeof window === 'undefined') return { upscaledCount: 0, failedCount: 0 };
  if (!deck.slides.length) throw new Error('Deck rỗng — cần ít nhất 1 slide.');
  const mm = deck.stagePreset ? PAPER_SIZE_MM[deck.stagePreset] : undefined;
  if (!mm) throw new Error('Khổ hiện tại không phải giấy in thật (chỉ 16:9) — chọn A4/A3 trước khi xuất theo dpi.');

  let printDeck = deck;
  let upscaledCount = 0;
  let failedCount = 0;
  if (opts) {
    const res = await applyPrintUpscale(deck, dpi, opts.tier, opts.onUpscaleProgress);
    printDeck = res.deck;
    upscaledCount = res.upscaledCount;
    failedCount = res.failedCount;
  }

  const stage = stageFor(printDeck.stagePreset);
  const resScale = printResScale(printDeck.stagePreset, dpi)!;
  const orientation = mm.w >= mm.h ? 'landscape' : 'portrait';
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation, unit: 'mm', format: [mm.w, mm.h] });
  for (let i = 0; i < printDeck.slides.length; i++) {
    const img = await renderEditorSlide(printDeck.slides[i], printDeck.fonts, printDeck.watermark, stage, resScale);
    if (i > 0) doc.addPage([mm.w, mm.h], orientation);
    doc.addImage(img, 'JPEG', 0, 0, mm.w, mm.h);
  }
  doc.save(`${safeName(printDeck.project || printDeck.brand || 'deck')}-${dpi}dpi.pdf`);
  return { upscaledCount, failedCount };
}

/* --------------------------------- PNG --------------------------------- */

/**
 * Xuất mỗi slide thành 1 ảnh PNG (đúng W×H khổ trình bày đang chọn) và tải xuống lần lượt
 * (không cần lib zip). Trung thực 1:1 với editor (renderEditorSlide). Tên: <project>-01.png…
 */
export async function exportDeckToPng(deck: EditorDeck): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!deck.slides.length) throw new Error('Deck rỗng — cần ít nhất 1 slide.');
  const stage = stageFor(deck.stagePreset);
  const base = safeName(deck.project || deck.brand || 'deck');
  for (let i = 0; i < deck.slides.length; i++) {
    // renderEditorSlide trả JPEG; ép sang PNG qua canvas để đúng định dạng yêu cầu.
    const jpeg = await renderEditorSlide(deck.slides[i], deck.fonts, deck.watermark, stage);
    const png = await jpegDataUrlToPng(jpeg, stage);
    const a = document.createElement('a');
    a.href = png;
    a.download = `${base}-${String(i + 1).padStart(2, '0')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // nhịp nhỏ để trình duyệt không gộp/bỏ bớt tải nhiều file.
    await new Promise((r) => setTimeout(r, 250));
  }
}

async function jpegDataUrlToPng(jpegDataUrl: string, stage: StageSize): Promise<string> {
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('img load fail'));
    img.src = jpegDataUrl;
  });
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || stage.w;
  c.height = img.naturalHeight || stage.h;
  c.getContext('2d')!.drawImage(img, 0, 0);
  return c.toDataURL('image/png');
}

/* --------------------------------- PPTX -------------------------------- */

/** Tìm element text theo role. */
function firstByRole(slide: EditorSlide, role: TextElement['role']): TextElement | undefined {
  return slide.elements.find(
    (e): e is TextElement => e.kind === 'text' && (e as TextElement).role === role,
  );
}
function allByRole(slide: EditorSlide, role: TextElement['role']): TextElement[] {
  return slide.elements.filter(
    (e): e is TextElement => e.kind === 'text' && (e as TextElement).role === role,
  );
}

/**
 * Ảnh "hero" = image element có diện tích lớn nhất; nếu không có, dùng ảnh nền.
 * Trả CẢ ELEMENT (không chỉ `src`) — P1/E2 cần đọc `mask` để bake đúng hình cắt vào PPTX
 * (`heroToDataUri` dưới đây); ảnh nền deck (`backgroundImage`) không phải ImageElement nên
 * không mask được, giữ đường `string` cũ.
 */
function pickHero(slide: EditorSlide): ImageElement | string | null {
  const imgs = slide.elements.filter((e): e is ImageElement => e.kind === 'image');
  if (imgs.length) {
    return imgs.slice().sort((a, b) => b.frame.w * b.frame.h - a.frame.w * a.frame.h)[0];
  }
  return slide.backgroundImage ?? null;
}

/**
 * P1/E2 + P3/E3 — data URI cho ảnh hero PPTX. Có `mask` VÀ/HOẶC `fillOverlay` → NƯỚNG (bake)
 * vào chính data URI TRƯỚC khi nhúng (`maskedImageDataUri` dưới đây) — pptxgenjs chèn ảnh dạng
 * khối chữ nhật, không hiểu `clip-path`/CSS `mix-blend-mode`, phải nướng sẵn thành PNG. Không có
 * CẢ HAI → giữ NGUYÊN đường `toDataUri` cũ (không đổi hành vi/byte output so với trước P1/P3).
 */
async function heroToDataUri(hero: ImageElement | string): Promise<string | null> {
  if (typeof hero === 'string') return toDataUri(hero);
  if (!hero.mask && !hero.fillOverlay) return toDataUri(hero.src);
  return maskedImageDataUri(hero, hero.mask, hero.fillOverlay);
}

/**
 * P1/E2 + P3/E3 — bake mask + lớp phủ fill vào ảnh hero PPTX. Vẽ lên canvas đúng KHỔ CROP đã áp
 * (`el.crop`, giống nguồn `drawImageEl` ở render.ts dùng cho PDF/PNG) rồi PNG trong-suốt (không
 * phải JPEG — vùng bị cắt phải trong suốt để lộ nền slide phía sau, không phải nền đen). CỐ Ý
 * KHÔNG tự ép theo tỉ lệ khung hero PPTX (`lib/pptx.ts` khối phải, cover 16:9 riêng của nó) —
 * pptxgenjs `sizing:{type:'cover'}` sẽ tự crop/scale PNG này vào khung đó SAU, ĐÚNG NHƯ đường cũ
 * (ảnh hero không nướng gì cũng bị cover crop lại từ tỉ lệ ảnh gốc) — không thêm khớp nối riêng.
 * `mask` optional (P3 gọi hàm này cả khi CHỈ có `fillOverlay`, không mask) — không mask thì vẽ
 * cả khung ảnh (không `ctx.clip()`), `fillOverlay` (nếu có) dùng CHUNG `applyFillOverlayStyle`
 * với `render.ts#drawImageEl` (1 nguồn sự thật cho cách tô overlay, xem hàm đó) — vẽ SAU
 * `drawImage`, TRONG vùng clip nếu có mask (giống render.ts, "ăn theo" clip có sẵn).
 */
async function maskedImageDataUri(
  el: ImageElement,
  mask: ImageElement['mask'],
  overlay?: FillOverlay,
): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('img load fail'));
      img.src = el.src;
    });
    const crop = el.crop || { x: 0, y: 0, w: 1, h: 1 };
    const sx = crop.x * img.naturalWidth;
    const sy = crop.y * img.naturalHeight;
    const sw = crop.w * img.naturalWidth || img.naturalWidth || 1;
    const sh = crop.h * img.naturalHeight || img.naturalHeight || 1;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(sw));
    c.height = Math.max(1, Math.round(sh));
    const ctx = c.getContext('2d')!;
    if (mask) {
      imageMaskCanvasPath(ctx, mask, 0, 0, c.width, c.height);
      ctx.clip();
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    if (overlay) {
      applyFillOverlayStyle(ctx, overlay, el.opacity ?? 1, 0, 0, c.width, c.height);
      ctx.fillRect(0, 0, c.width, c.height);
    }
    return c.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** Chuyển 1 EditorSlide → SlideContent + layout + theme cho PPTX (chữ chỉnh được). */
function toContentSlide(
  slide: EditorSlide,
  deck: EditorDeck,
): {
  content: SlideContent;
  layout: SlideLayout;
  theme: SlideTheme;
  fontFaces: { title?: string; body?: string; kicker?: string };
  usedFaces: string[];
} | null {
  const titleEl = firstByRole(slide, 'title');
  const bodyEls = allByRole(slide, 'body');
  const kickerEl = firstByRole(slide, 'kicker');
  if (!titleEl && !bodyEls.length) return null; // không có text ngữ nghĩa → để render ảnh

  const body: string[] = [];
  for (const be of bodyEls) {
    be.text
      .split('\n')
      // gỡ tiền tố danh sách người dùng gõ tay HOẶC auto (bullet "•", gạch "-", số "1.")
      .map((l) => l.replace(/^\s*(?:[-•]|\d+\.)\s*/, '').trim())
      .filter(Boolean)
      .forEach((l) => body.push(l));
  }

  const content: SlideContent = {
    kicker: kickerEl?.text ?? '',
    title: titleEl?.text ?? '',
    body,
  };

  // Font TẢI LÊN theo element: map được xuống PPTX ở mức VAI TRÒ (title/body/kicker) — đủ để
  // dùng font đã nhúng, xem `fontFaces` ở lib/pptx.ts. Kiểu đậm/nghiêng/gạch chân THEO RUN thì
  // vẫn không map được (lib/pptx style theo role, không theo run); PDF và nhánh PPTX-ảnh giữ đúng.
  const faceOf = (el: TextElement | undefined): string | undefined =>
    el ? customFaceFor(el.fontFamily, deck) : undefined;
  const fontFaces = {
    title: faceOf(titleEl),
    body: faceOf(bodyEls[0]),
    kicker: faceOf(kickerEl),
  };
  const usedFaces = [fontFaces.title, fontFaces.body, fontFaces.kicker].filter(
    (f): f is string => Boolean(f),
  );

  // Layout heuristic cho PPTX (chỉ có Cover / Nội dung + ảnh / Quote).
  let layout: SlideLayout = 'Nội dung + ảnh';
  if (slide.templateId === 'quote' || (titleEl?.italic && !body.length)) layout = 'Quote';
  else if (slide.templateId === 'cover' || slide.templateId === 'full-bleed') layout = 'Cover';

  // Theme lấy màu từ chính slide (nền + màu chữ title) + palette gu.
  const theme: SlideTheme = {
    bg: slide.background || '#f5f1ea',
    text: titleEl?.color || '#221f1a',
    muted: '#8a8378',
    accent: kickerEl?.color || (deck.palette[3] ?? '#8a6f4d'),
    palette: deck.palette,
  };

  return { content, layout, theme, fontFaces, usedFaces };
}

/**
 * `TextElement.fontFamily` là một CSS font stack. Nếu nó khớp một font user đã tải lên
 * (`deck.customFonts[].stack`) thì trả về tên face đơn để ghi vào PPTX; font hệ thống/curated
 * trả `undefined` để lib/pptx giữ nguyên đường cũ.
 */
function customFaceFor(fontFamily: string | undefined, deck: EditorDeck): string | undefined {
  if (!fontFamily) return undefined;
  return deck.customFonts?.find((f) => f.stack === fontFamily)?.face;
}

/**
 * Xuất PPTX. Với mỗi slide:
 *   - Bóc được text title/body → PptxSlideContent (text editable) + hero data URI.
 *   - Không → render cả slide thành ảnh (PptxSlideImage full-bleed).
 * Ảnh hero được nạp thành data URI để nhúng (PPTX cần base64, không nhận URL /api).
 */
export async function exportDeckToPptxFromModel(deck: EditorDeck): Promise<PptxExportResult> {
  if (typeof window === 'undefined') return { embedded: [], skipped: [], licenses: [] };
  if (!deck.slides.length) throw new Error('Deck rỗng — cần ít nhất 1 slide.');

  const out: PptxSlide[] = [];
  /** Tên face của font tải lên THỰC SỰ xuất hiện ở nhánh text-editable. */
  const usedFaces = new Set<string>();

  for (let i = 0; i < deck.slides.length; i++) {
    const slide = deck.slides[i];
    const mapped = toContentSlide(slide, deck);
    if (mapped) {
      const hero = pickHero(slide);
      const heroDataUrl = hero ? await heroToDataUri(hero) : null;
      mapped.usedFaces.forEach((f) => usedFaces.add(f));
      out.push({
        kind: 'content',
        content: mapped.content,
        theme: mapped.theme,
        layout: mapped.layout,
        fonts: deck.fonts,
        heroDataUrl,
        brand: deck.brand,
        pageNo: `${i + 1} / ${deck.slides.length}`,
        fontFaces: mapped.fontFaces,
      });
    } else {
      // ảnh-first → render full-bleed. CHỦ Ý dùng stage MẶC ĐỊNH (16:9) — KHÔNG truyền
      // deck.stagePreset — xem "QUYẾT ĐỊNH PHẠM VI" ở đầu file (PPTX luôn 16:9).
      const imageDataUrl = await renderEditorSlide(slide, deck.fonts, deck.watermark);
      out.push({ kind: 'image', imageDataUrl });
    }
  }

  // Chỉ nhúng font ĐANG DÙNG ở nhánh text-editable — không nhúng cả `deck.customFonts`, càng
  // không nhúng thư viện máy. Slide đi đường ảnh đã rasterize sẵn chữ nên không cần font.
  const embedFonts = (deck.customFonts ?? [])
    .filter((f) => usedFaces.has(f.face))
    .map((f) => ({ face: f.face, dataUrl: f.dataUrl }));

  return exportDeckToPptx(out, {
    fileName: deck.project || deck.brand || 'deck',
    title: deck.project || deck.brand || 'deck',
    author: deck.brand,
    embedFonts,
  });
}

/** Nạp một URL/ảnh thành data URI qua canvas (an toàn same-origin: ảnh /api/library). */
async function toDataUri(src: string): Promise<string | null> {
  if (src.startsWith('data:')) return src;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('img load fail'));
      img.src = src;
    });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || 1600;
    c.height = img.naturalHeight || 1200;
    c.getContext('2d')!.drawImage(img, 0, 0);
    return c.toDataURL('image/jpeg', 0.9);
  } catch {
    return null;
  }
}

function safeName(name: string): string {
  return (name || 'deck').replace(/[\\/:*?"<>|]/g, '').trim() || 'deck';
}
