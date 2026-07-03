'use client';

import { loadImage, extractPalette } from '@/lib/imaging';

/** Nội dung 1 slide — parse từ node Concept Content hoặc text thường. */
export interface SlideContent {
  kicker: string;
  title: string;
  body: string[];
}

export function parseContent(raw: string): SlideContent {
  // Concept node xuất JSON; Text Prompt thường → dòng 1 = title, còn lại = body
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

/** Theme quiet-luxury mặc định khi không có ảnh ref. */
const DEFAULT_THEME: SlideTheme = {
  bg: '#f5f1ea',
  text: '#221f1a',
  muted: '#8a8378',
  accent: '#8a6f4d',
  palette: ['#f5f1ea', '#dad0c7', '#c7a397', '#8a6f4d', '#635c45', '#221f1a'],
};

/** Dựng theme từ ảnh ref (palette 6 màu) — nền sáng hoặc tối. */
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
const FONTS: Record<FontPairing, { display: string; body: string }> = {
  Editorial: { display: 'Georgia, serif', body: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  Modern: { display: '"Helvetica Neue", Helvetica, Arial, sans-serif', body: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  Elegant: { display: 'Didot, "Bodoni 72", Georgia, serif', body: '"Avenir Next", Avenir, "Helvetica Neue", sans-serif' },
};

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

async function drawCover(ctx: CanvasRenderingContext2D, o: SlideOptions) {
  const { theme, content, heroUrl } = o;
  const f = FONTS[o.fonts];
  const hasHero = Boolean(heroUrl);
  const textW = hasHero ? W * 0.52 : W;
  const PAD = 120;

  if (hasHero) {
    const img = await loadImage(heroUrl!);
    const x = textW, w = W - textW;
    const scale = Math.max(w / img.naturalWidth, H / img.naturalHeight);
    const sw = w / scale, sh = H / scale;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, 0, w, H);
    // scrim nhẹ để chữ khối trái tách khỏi ảnh
    const grad = ctx.createLinearGradient(x, 0, x + 200, 0);
    grad.addColorStop(0, theme.bg);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, 200, H);
  }

  if (content.kicker) {
    ctx.fillStyle = o.theme.accent;
    ctx.font = `600 30px ${f.body}`;
    ctx.fillText(content.kicker.toUpperCase().split('').join('  '), PAD, 260);
  }

  ctx.fillStyle = theme.text;
  ctx.font = `600 118px ${f.display}`;
  const titleLines = wrapText(ctx, content.title, textW - PAD * 1.6);
  let y = 400;
  for (const line of titleLines) {
    ctx.fillText(line, PAD, y);
    y += 128;
  }

  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PAD, y + 8);
  ctx.lineTo(PAD + 140, y + 8);
  ctx.stroke();

  ctx.fillStyle = theme.muted;
  ctx.font = `400 36px ${f.body}`;
  let by = y + 84;
  for (const para of content.body.slice(0, 3)) {
    for (const line of wrapText(ctx, para.replace(/^[-•]\s*/, ''), textW - PAD * 1.8)) {
      ctx.fillText(line, PAD, by);
      by += 52;
    }
    by += 10;
  }

  // dải palette brand dưới cùng
  const sw2 = 72, sh2 = 14;
  o.theme.palette.slice(0, 6).forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(PAD + i * sw2, H - 120, sw2, sh2);
  });
}

async function drawContent(ctx: CanvasRenderingContext2D, o: SlideOptions) {
  const { theme, content, heroUrl } = o;
  const f = FONTS[o.fonts];
  const PAD = 110;
  const hasHero = Boolean(heroUrl);
  const textW = hasHero ? W * 0.52 : W * 0.8;

  if (content.kicker) {
    ctx.fillStyle = theme.accent;
    ctx.font = `600 26px ${f.body}`;
    ctx.fillText(content.kicker.toUpperCase(), PAD, 150);
  }
  ctx.fillStyle = theme.text;
  ctx.font = `600 72px ${f.display}`;
  let y = 240;
  for (const line of wrapText(ctx, content.title, textW - PAD)) {
    ctx.fillText(line, PAD, y);
    y += 84;
  }
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(PAD, y - 30);
  ctx.lineTo(PAD + 110, y - 30);
  ctx.stroke();

  y += 60;
  ctx.font = `400 34px ${f.body}`;
  for (const item of content.body.slice(0, 8)) {
    const clean = item.replace(/^[-•]\s*/, '');
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(PAD + 8, y - 11, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.text;
    for (const line of wrapText(ctx, clean, textW - PAD - 60)) {
      ctx.fillText(line, PAD + 40, y);
      y += 50;
    }
    y += 22;
  }

  if (hasHero) {
    const img = await loadImage(heroUrl!);
    const x = W * 0.58, w = W - x - PAD, h = H - 260;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale, sh = h / scale;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, 130, w, h, 10);
    ctx.clip();
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, 130, w, h);
    ctx.restore();
  }
}

async function drawQuote(ctx: CanvasRenderingContext2D, o: SlideOptions) {
  const { theme, content } = o;
  const f = FONTS[o.fonts];
  ctx.fillStyle = theme.accent;
  ctx.font = `400 260px ${f.display}`;
  ctx.fillText('“', W / 2 - 70, 330);

  ctx.fillStyle = theme.text;
  ctx.font = `italic 500 66px ${f.display}`;
  ctx.textAlign = 'center';
  let y = 480;
  for (const line of wrapText(ctx, content.title, W * 0.62)) {
    ctx.fillText(line, W / 2, y);
    y += 90;
  }
  if (content.body.length) {
    ctx.fillStyle = theme.muted;
    ctx.font = `400 32px ${f.body}`;
    ctx.fillText(`— ${content.body[0].replace(/^[-•]\s*/, '')}`, W / 2, y + 40);
  }
  ctx.textAlign = 'left';
}

/** Render 1 slide 1920×1080 → JPEG dataURL. */
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

  // footer brand + số trang
  const f = FONTS[o.fonts];
  ctx.fillStyle = o.theme.muted;
  ctx.font = `500 24px ${f.body}`;
  if (o.brand) ctx.fillText(o.brand.toUpperCase(), 110, H - 56);
  if (o.pageNo) {
    ctx.textAlign = 'right';
    ctx.fillText(o.pageNo, W - 110, H - 56);
    ctx.textAlign = 'left';
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
