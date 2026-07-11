'use client';

import { loadImage, extractPalette } from '@/lib/imaging';

/** Noi dung 1 slide - parse tu node Concept Content hoac text thuong. */
export interface SlideContent {
  kicker: string;
  title: string;
  body: string[];
}

export function parseContent(raw: string): SlideContent {
  // Concept node xuat JSON; Text Prompt thuong -> dong 1 = title, con lai = body
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === 'object' && ('title' in j || 'body' in j)) {
      return {
        kicker: String(j.kicker ?? ''),
        title: String(j.title ?? ''),
        body: String(j.body ?? '')
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean),
      };
    }
  } catch {
    /* not JSON */
  }
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  return { kicker: '', title: lines[0] ?? '', body: lines.slice(1) };
}

export interface SlideTheme {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  palette: string[];
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function saturation(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}
/** hex '#rrggbb' + alpha -> 'rgba(...)' (dung cho scrim/vien toc). */
function hexToRgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Theme quiet-luxury mac dinh khi khong co anh ref. */
const DEFAULT_THEME: SlideTheme = {
  bg: '#f5f1ea',
  text: '#221f1a',
  muted: '#8a8378',
  accent: '#8a6f4d',
  palette: ['#f5f1ea', '#dad0c7', '#c7a397', '#8a6f4d', '#635c45', '#221f1a'],
};

/** Dung theme tu anh ref (palette 6 mau) - nen sang hoac toi. */
export async function themeFromRef(refUrl: string | null, dark: boolean): Promise<SlideTheme> {
  let palette: string[];
  if (!refUrl) {
    palette = DEFAULT_THEME.palette;
  } else {
    try {
      palette = await extractPalette(refUrl);
    } catch {
      palette = DEFAULT_THEME.palette;
    }
  }
  if (palette.length < 3) palette = DEFAULT_THEME.palette;
  const byLum = [...palette].sort((a, b) => luminance(a) - luminance(b));
  const darkest = byLum[0];
  const lightest = byLum[byLum.length - 1];
  const mids = byLum.slice(1, -1);
  const accent = [...(mids.length ? mids : byLum)].sort((a, b) => saturation(b) - saturation(a))[0];
  return dark
    ? { bg: darkest, text: lightest, muted: mids[Math.floor(mids.length / 2)] ?? lightest, accent, palette }
    : { bg: lightest, text: darkest, muted: mids[Math.floor(mids.length / 2)] ?? darkest, accent, palette };
}

export type FontPairing = 'Editorial' | 'Modern' | 'Elegant';
/**
 * Bo chu cho SLIDE XUAT (ban giao khach) - khac luat "chi sans" cua UI app: ban trinh bay
 * quiet-luxury editorial can MAT CHU SERIF THANH cho tieu de (dung gu Cormorant/Didot).
 * Dung serif he thong (Georgia) - co dau tieng Viet day du, hien dien moi may, khong can nap font.
 *  - Editorial (mac dinh): tieu de serif + than sans nhe -> cap tap-chi kinh dien.
 *  - Modern: sans nhe toan phan (khi muon kho, toi gian).
 *  - Elegant: serif toan phan (trang trong nhat).
 */
const SERIF = 'Georgia, "Times New Roman", "Noto Serif", serif';
const SANS = '"Helvetica Neue", "Segoe UI", -apple-system, Arial, sans-serif';
const FONTS: Record<FontPairing, { display: string; body: string; displayWeight: number }> = {
  Editorial: { display: SERIF, body: SANS, displayWeight: 400 },
  Modern: { display: SANS, body: SANS, displayWeight: 300 },
  Elegant: { display: SERIF, body: SERIF, displayWeight: 400 },
};

/** Dat letter-spacing an toan (Chromium ho tro ctx.letterSpacing; may cu bo qua). */
function setTracking(ctx: CanvasRenderingContext2D, px: number) {
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
  } catch {
    /* bo qua neu khong ho tro */
  }
}
function resetTracking(ctx: CanvasRenderingContext2D) {
  setTracking(ctx, 0);
}

export type SlideLayout = 'Cover' | 'Nội dung + ảnh' | 'Quote';

export interface SlideOptions {
  content: SlideContent;
  theme: SlideTheme;
  layout: SlideLayout;
  fonts: FontPairing;
  heroUrl: string | null;
  brand: string;
  pageNo?: string;
}

const W = 1920;
const H = 1080;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Chon co chu tieu de lon nhat vua maxWidth trong toi da maxLines dong. */
function fitTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: number,
  maxSize: number,
  minSize: number,
  maxWidth: number,
  maxLines: number,
): { size: number; lines: string[] } {
  for (let size = maxSize; size >= minSize; size -= 4) {
    ctx.font = `${weight} ${size}px ${family}`;
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  ctx.font = `${weight} ${minSize}px ${family}`;
  return { size: minSize, lines: wrapText(ctx, text, maxWidth) };
}

async function drawCover(ctx: CanvasRenderingContext2D, o: SlideOptions) {
  const { theme, content, heroUrl } = o;
  const f = FONTS[o.fonts];
  const hasHero = Boolean(heroUrl);
  const PAD = 150;
  const textW = hasHero ? W * 0.5 : W * 0.78;

  if (hasHero) {
    const img = await loadImage(heroUrl!);
    const x = textW, w = W - textW;
    const scale = Math.max(w / img.naturalWidth, H / img.naturalHeight);
    const sw = w / scale, sh = H / scale;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, 0, w, H);
    const grad = ctx.createLinearGradient(x, 0, x + 260, 0);
    grad.addColorStop(0, theme.bg);
    grad.addColorStop(1, hexToRgba(theme.bg, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, 260, H);
  }

  if (content.kicker) {
    ctx.fillStyle = theme.accent;
    ctx.font = `600 22px ${f.body}`;
    setTracking(ctx, 4);
    ctx.fillText(content.kicker.toUpperCase(), PAD, 300);
    resetTracking(ctx);
  }

  const fit = fitTitle(ctx, content.title, f.display, f.displayWeight, 116, 64, textW - PAD * 1.3, 4);
  const lead = fit.size * 1.08;
  ctx.fillStyle = theme.text;
  ctx.font = `${f.displayWeight} ${fit.size}px ${f.display}`;
  setTracking(ctx, -0.5);
  let y = 392;
  for (const line of fit.lines) {
    ctx.fillText(line, PAD, y);
    y += lead;
  }
  resetTracking(ctx);

  const ruleY = y - lead + fit.size * 0.32 + 44;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD + 0.5, ruleY);
  ctx.lineTo(PAD + 92, ruleY);
  ctx.stroke();

  ctx.fillStyle = theme.muted;
  ctx.font = `400 30px ${f.body}`;
  let by = ruleY + 74;
  for (const para of content.body.slice(0, 3)) {
    for (const line of wrapText(ctx, para.replace(/^[-•]\s*/, ''), textW - PAD * 1.4)) {
      ctx.fillText(line, PAD, by);
      by += 46;
    }
    by += 12;
  }
  // Bo dai o mau palette (artifact cong cu) - quiet-luxury de trong tho.
}

async function drawContent(ctx: CanvasRenderingContext2D, o: SlideOptions) {
  const { theme, content, heroUrl } = o;
  const f = FONTS[o.fonts];
  const PAD = 150;
  const hasHero = Boolean(heroUrl);
  const textW = hasHero ? W * 0.5 : W * 0.82;

  if (content.kicker) {
    ctx.fillStyle = theme.accent;
    ctx.font = `600 22px ${f.body}`;
    setTracking(ctx, 4);
    ctx.fillText(content.kicker.toUpperCase(), PAD, 175);
    resetTracking(ctx);
  }
  const fit = fitTitle(ctx, content.title, f.display, f.displayWeight, 76, 48, textW - PAD * 0.5, 3);
  ctx.fillStyle = theme.text;
  ctx.font = `${f.displayWeight} ${fit.size}px ${f.display}`;
  setTracking(ctx, -0.5);
  let y = 265;
  for (const line of fit.lines) {
    ctx.fillText(line, PAD, y);
    y += fit.size * 1.12;
  }
  resetTracking(ctx);

  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD + 0.5, y - fit.size * 0.3);
  ctx.lineTo(PAD + 80, y - fit.size * 0.3);
  ctx.stroke();

  y += 66;
  ctx.font = `400 32px ${f.body}`;
  for (const item of content.body.slice(0, 7)) {
    const clean = item.replace(/^[-•]\s*/, '');
    // gach ngang manh thay cham tron - editorial hon
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD, y - 11);
    ctx.lineTo(PAD + 22, y - 11);
    ctx.stroke();
    ctx.fillStyle = theme.text;
    for (const line of wrapText(ctx, clean, textW - 44)) {
      ctx.fillText(line, PAD + 42, y);
      y += 46;
    }
    y += 26;
  }

  if (hasHero) {
    const img = await loadImage(heroUrl!);
    const x = W * 0.56, w = W - x - PAD, h = H - 320;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale, sh = h / scale;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, 160, w, h, 4);
    ctx.clip();
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, 160, w, h);
    ctx.restore();
    ctx.strokeStyle = hexToRgba(theme.text, 0.14);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 0.5, 160.5, w - 1, h - 1, 4);
    ctx.stroke();
  }
}

async function drawQuote(ctx: CanvasRenderingContext2D, o: SlideOptions) {
  const { theme, content } = o;
  const f = FONTS[o.fonts];
  // dau ngoac kep lon, mo, lam nen - khong chiem san khau
  ctx.fillStyle = hexToRgba(theme.accent, 0.16);
  ctx.font = `400 400px ${f.display}`;
  ctx.textAlign = 'center';
  ctx.fillText('“', W / 2, 420);

  ctx.fillStyle = theme.text;
  const fit = fitTitle(ctx, content.title, f.display, 400, 74, 44, W * 0.66, 4);
  ctx.font = `italic 400 ${fit.size}px ${f.display}`;
  let y = 500 - ((fit.lines.length - 1) * fit.size * 1.2) / 2;
  for (const line of fit.lines) {
    ctx.fillText(line, W / 2, y);
    y += fit.size * 1.2;
  }
  if (content.body.length) {
    ctx.fillStyle = theme.muted;
    ctx.font = `600 24px ${f.body}`;
    setTracking(ctx, 3);
    ctx.fillText(content.body[0].replace(/^[-•]\s*/, '').toUpperCase(), W / 2, y + 44);
    resetTracking(ctx);
  }
  ctx.textAlign = 'left';
}

/** Render 1 slide 1920x1080 -> JPEG dataURL. */
export async function renderSlide(o: SlideOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = o.theme.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  if (o.layout === 'Cover') await drawCover(ctx, o);
  else if (o.layout === 'Quote') await drawQuote(ctx, o);
  else await drawContent(ctx, o);

  // footer brand + so trang - nho, gian, muted
  const f = FONTS[o.fonts];
  ctx.fillStyle = o.theme.muted;
  ctx.font = `600 19px ${f.body}`;
  setTracking(ctx, 2);
  if (o.brand) ctx.fillText(o.brand.toUpperCase(), 150, H - 72);
  if (o.pageNo) {
    ctx.textAlign = 'right';
    ctx.fillText(o.pageNo, W - 150, H - 72);
    ctx.textAlign = 'left';
  }
  resetTracking(ctx);

  return canvas.toDataURL('image/jpeg', 0.92);
}
