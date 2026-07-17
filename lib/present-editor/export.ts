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
 *      này ở StagePresetPanel + ExportMenu.
 *
 * Cả ba đọc EditorDeck. jsPDF/pptx import động (client-only).
 */

import type { EditorDeck, EditorSlide, TextElement, ImageElement } from './model';
import { renderEditorSlide } from './render';
import { stageFor, type StageSize } from './stage-presets';
import { exportDeckToPptx, type PptxSlide } from '@/lib/pptx';
import type { SlideContent, SlideTheme, SlideLayout } from '@/lib/slides';

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

/** Ảnh "hero" = image element có diện tích lớn nhất; nếu không có, dùng ảnh nền. */
function pickHero(slide: EditorSlide): string | null {
  const imgs = slide.elements.filter((e): e is ImageElement => e.kind === 'image');
  if (imgs.length) {
    const biggest = imgs
      .slice()
      .sort((a, b) => b.frame.w * b.frame.h - a.frame.w * a.frame.h)[0];
    return biggest.src;
  }
  return slide.backgroundImage ?? null;
}

/** Chuyển 1 EditorSlide → SlideContent + layout + theme cho PPTX (chữ chỉnh được). */
function toContentSlide(
  slide: EditorSlide,
  deck: EditorDeck,
): { content: SlideContent; layout: SlideLayout; theme: SlideTheme } | null {
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

  // Lưu ý: font riêng theo element (el.fontFamily) + kiểu đậm/nghiêng/gạch chân KHÔNG map được
  // xuống nhánh PPTX text-editable này vì lib/pptx style theo ROLE cấp deck, không theo run.
  // Trung thực về font/kiểu chữ được bảo toàn ở PDF và nhánh PPTX-ảnh (render.ts đọc fontFamily).

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

  return { content, layout, theme };
}

/**
 * Xuất PPTX. Với mỗi slide:
 *   - Bóc được text title/body → PptxSlideContent (text editable) + hero data URI.
 *   - Không → render cả slide thành ảnh (PptxSlideImage full-bleed).
 * Ảnh hero được nạp thành data URI để nhúng (PPTX cần base64, không nhận URL /api).
 */
export async function exportDeckToPptxFromModel(deck: EditorDeck): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!deck.slides.length) throw new Error('Deck rỗng — cần ít nhất 1 slide.');

  const out: PptxSlide[] = [];
  for (let i = 0; i < deck.slides.length; i++) {
    const slide = deck.slides[i];
    const mapped = toContentSlide(slide, deck);
    if (mapped) {
      const heroSrc = pickHero(slide);
      const heroDataUrl = heroSrc ? await toDataUri(heroSrc) : null;
      out.push({
        kind: 'content',
        content: mapped.content,
        theme: mapped.theme,
        layout: mapped.layout,
        fonts: deck.fonts,
        heroDataUrl,
        brand: deck.brand,
        pageNo: `${i + 1} / ${deck.slides.length}`,
      });
    } else {
      // ảnh-first → render full-bleed. CHỦ Ý dùng stage MẶC ĐỊNH (16:9) — KHÔNG truyền
      // deck.stagePreset — xem "QUYẾT ĐỊNH PHẠM VI" ở đầu file (PPTX luôn 16:9).
      const imageDataUrl = await renderEditorSlide(slide, deck.fonts, deck.watermark);
      out.push({ kind: 'image', imageDataUrl });
    }
  }

  await exportDeckToPptx(out, {
    fileName: deck.project || deck.brand || 'deck',
    title: deck.project || deck.brand || 'deck',
    author: deck.brand,
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
