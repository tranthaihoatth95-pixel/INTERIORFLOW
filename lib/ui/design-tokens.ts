/**
 * lib/ui/design-tokens.ts — [marker: designTokens] ĐỌC `app/globals.css` thành bảng token
 * máy-kiểm-được. Không có React, không có DOM: chạy được trong test `sucrase-node`.
 *
 * VÌ SAO CẦN: token là NGUỒN DUY NHẤT của màu/bo/cỡ (RETRIEVAL-MAP "UX / DESIGN SYSTEM":
 * *"nguồn DUY NHẤT cho số góc màu — cấm trích từ sổ"*). Nhưng trước 03/09 không máy nào đọc
 * được nguồn đó: tương phản là TÍNH TAY rồi ghi vào comment (globals.css khối `--mo-vo-hieu`),
 * và hai bug đã sống lâu vì thế — `--surface-page` được tham chiếu 5 file mà CHƯA TỪNG khai
 * (fallback beige của một studio chạy thật trên sản phẩm), `--font-geist-sans` chưa khai làm cả
 * app rơi về Times. Cả hai đều là "var() trỏ vào token không tồn tại" — loại lỗi này chỉ máy
 * bắt được, và chỉ khi máy đọc được globals.css. File này là cái máy đó.
 *
 * Ba việc:
 *   ① `parseTokenSheet(css)` — gom khai báo `--x: v` theo khối: dùng chung (`:root`) · tối
 *      (`:root[data-theme='dark']`) · sáng · cảm ứng (`:root` trong media pointer:coarse).
 *   ② `resolveToken(sheet, name, theme)` — mở `var(--x[, fallback])` lồng nhau ra giá trị cuối.
 *   ③ `parseCssColor(value)` — hex/rgb()/rgba()/transparent/`color-mix(in srgb …)` → RGBA,
 *      để test đo tương phản BẰNG SỐ trên đúng giá trị đang chạy (không chép từ comment).
 *
 * Parser cố ý TỐI GIẢN (quét ngoặc nhọn + regex khai báo), không kéo PostCSS vào: globals.css
 * viết tay, không có @import/nesting; nếu sau này có, test [parser] sẽ đỏ trước tiên.
 */

import { blend, contrastRatio, type RGB } from '../adaptive-contrast';

export type ThemeName = 'dark' | 'light';

export interface TokenSheet {
  /** khai trong `:root` dùng chung (ngoài media query). */
  shared: Map<string, string>;
  dark: Map<string, string>;
  light: Map<string, string>;
  /** khai trong `:root` nằm trong `@media (hover: none) and (pointer: coarse)`. */
  coarse: Map<string, string>;
  /** mọi tên token đã khai ở BẤT KỲ khối nào (kể cả class), để kiểm "var() chưa khai". */
  declared: Set<string>;
  /** CSS đã bỏ comment — để test grep luật (focus-visible, reduced-motion…) không dính chú thích. */
  css: string;
}

export interface RGBA {
  rgb: RGB;
  a: number;
}

/** Bỏ mọi `/* … *\/` — comment trong globals.css dày đặc số cũ, không được để test đọc nhầm. */
export function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

const DECL_RE = /(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]+);/g;

function normalizeSelector(sel: string): string {
  return sel.replace(/\s+/g, ' ').trim();
}

function classify(selector: string, media: string | null): keyof Pick<TokenSheet, 'shared' | 'dark' | 'light' | 'coarse'> | null {
  const sel = normalizeSelector(selector);
  if (!/(^|,\s*):root/.test(sel)) return null;
  if (/data-theme=['"]light['"]/.test(sel)) return 'light';
  if (/data-theme=['"]dark['"]/.test(sel)) return 'dark';
  if (sel !== ':root') return null;
  if (media && /pointer:\s*coarse/.test(media)) return 'coarse';
  if (media) return null; // :root trong media khác (vd print) — không thuộc 4 khối chuẩn
  return 'shared';
}

/**
 * Quét từng khối `selector { body }` ở một cấp; `@media` thì đệ quy vào ruột với ngữ cảnh media.
 * Trả về vị trí đã quét để caller không phải làm gì thêm.
 */
function walkBlocks(
  css: string,
  media: string | null,
  onRule: (selector: string, body: string, media: string | null) => void,
): void {
  let i = 0;
  let selStart = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) break;
    const selector = css.slice(selStart, open).split(/[;}]/).pop() ?? '';
    // tìm ngoặc đóng khớp
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      const ch = css[j];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      j += 1;
    }
    const body = css.slice(open + 1, j - 1);
    const sel = selector.trim();
    if (sel.startsWith('@media')) walkBlocks(body, sel, onRule);
    else if (sel.startsWith('@')) {
      // @keyframes/@supports/@font-face: ruột có thể chứa khai báo `--x` (font-face không), bỏ qua
      if (sel.startsWith('@supports')) walkBlocks(body, media, onRule);
    } else onRule(sel, body, media);
    i = j;
    selStart = j;
  }
}

export function parseTokenSheet(rawCss: string): TokenSheet {
  const css = stripCssComments(rawCss);
  const sheet: TokenSheet = {
    shared: new Map(),
    dark: new Map(),
    light: new Map(),
    coarse: new Map(),
    declared: new Set(),
    css,
  };
  walkBlocks(css, null, (selector, body, media) => {
    const bucket = classify(selector, media);
    DECL_RE.lastIndex = 0;
    for (const m of body.matchAll(DECL_RE)) {
      const name = m[1];
      const value = m[2].trim();
      sheet.declared.add(name);
      if (bucket) sheet[bucket].set(name, value);
    }
  });
  return sheet;
}

/** Giá trị THÔ (chưa mở var) của token theo theme: theme thắng, rồi tới dùng chung. */
export function rawToken(sheet: TokenSheet, name: string, theme: ThemeName): string | undefined {
  return sheet[theme].get(name) ?? sheet.shared.get(name);
}

/** Tách `var(--x, fallback)` tại vị trí `start` (chỉ vào chữ `v`). Trả [name, fallback|null, end]. */
function readVar(s: string, start: number): [string, string | null, number] | null {
  if (!s.startsWith('var(', start)) return null;
  let depth = 0;
  let i = start + 3; // tại '('
  let end = -1;
  for (; i < s.length; i += 1) {
    if (s[i] === '(') depth += 1;
    else if (s[i] === ')') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  const inner = s.slice(start + 4, end);
  const comma = inner.indexOf(',');
  const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
  const fallback = comma === -1 ? null : inner.slice(comma + 1).trim();
  return [name, fallback, end + 1];
}

/**
 * Mở hết `var()` trong một chuỗi giá trị theo theme. Token không khai và không có fallback ⇒
 * trả `undefined` (test dùng để bắt "var() chưa khai"). Có chặn vòng lặp (trần 32 tầng).
 */
export function expandVars(sheet: TokenSheet, value: string, theme: ThemeName, depth = 0): string | undefined {
  if (depth > 32) return undefined;
  let out = '';
  let i = 0;
  while (i < value.length) {
    const at = value.indexOf('var(', i);
    if (at === -1) {
      out += value.slice(i);
      break;
    }
    out += value.slice(i, at);
    const v = readVar(value, at);
    if (!v) return undefined;
    const [name, fallback, next] = v;
    const raw = rawToken(sheet, name, theme);
    let resolved: string | undefined;
    if (raw !== undefined) resolved = expandVars(sheet, raw, theme, depth + 1);
    else if (fallback !== null) resolved = expandVars(sheet, fallback, theme, depth + 1);
    if (resolved === undefined) return undefined;
    out += resolved;
    i = next;
  }
  return out;
}

/** Giá trị CUỐI (đã mở var) của token theo theme, hoặc `undefined` nếu không khai. */
export function resolveToken(sheet: TokenSheet, name: string, theme: ThemeName): string | undefined {
  const raw = rawToken(sheet, name, theme);
  if (raw === undefined) return undefined;
  return expandVars(sheet, raw, theme);
}

/* ────────────────────────────── màu ────────────────────────────── */

function hexPair(h: string): number {
  return parseInt(h.length === 1 ? h + h : h, 16);
}

/** Tách đối số cấp 1 theo dấu phẩy, tôn trọng ngoặc lồng (color-mix chứa rgba()). */
function splitTopLevel(s: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    if (ch === sep && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Đọc một giá trị màu CSS đã mở var → RGBA. Không nhận ra ⇒ `null`.
 * Hỗ trợ: `#rgb #rgba #rrggbb #rrggbbaa` · `rgb()/rgba()` (phẩy hoặc khoảng trắng + `/`) ·
 * `transparent` · `color-mix(in srgb, A p%, B [q%])` (trộn premultiplied như trình duyệt).
 */
export function parseCssColor(value: string): RGBA | null {
  const v = value.trim().toLowerCase();
  if (v === 'transparent') return { rgb: [0, 0, 0], a: 0 };
  if (v.startsWith('#')) {
    const h = v.slice(1);
    if (h.length === 3 || h.length === 4) {
      return {
        rgb: [hexPair(h[0]), hexPair(h[1]), hexPair(h[2])],
        a: h.length === 4 ? hexPair(h[3]) / 255 : 1,
      };
    }
    if (h.length === 6 || h.length === 8) {
      return {
        rgb: [hexPair(h.slice(0, 2)), hexPair(h.slice(2, 4)), hexPair(h.slice(4, 6))],
        a: h.length === 8 ? hexPair(h.slice(6, 8)) / 255 : 1,
      };
    }
    return null;
  }
  const rgbm = v.match(/^rgba?\((.+)\)$/);
  if (rgbm) {
    const nums = rgbm[1]
      .split(/[,/\s]+/)
      .filter(Boolean)
      .map((n) => (n.endsWith('%') ? (parseFloat(n) / 100) * 255 : parseFloat(n)));
    if (nums.length < 3 || nums.slice(0, 3).some((n) => !Number.isFinite(n))) return null;
    let a = nums.length >= 4 ? nums[3] : 1;
    // alpha viết dạng "50%" đã bị nhân 255 ở trên — sửa lại cho đúng
    if (rgbm[1].trim().split(/[,/\s]+/).filter(Boolean)[3]?.endsWith('%')) a = a / 255;
    return { rgb: [nums[0], nums[1], nums[2]].map(Math.round) as RGB, a: Math.max(0, Math.min(1, a)) };
  }
  const mix = v.match(/^color-mix\((.+)\)$/);
  if (mix) {
    const args = splitTopLevel(mix[1], ',');
    if (args.length !== 3 || !/^in\s+srgb$/.test(args[0])) return null;
    const read = (arg: string): [RGBA, number | null] | null => {
      const m = arg.match(/^(.*?)(?:\s+([0-9.]+)%)?$/);
      if (!m) return null;
      const c = parseCssColor(m[1]);
      if (!c) return null;
      return [c, m[2] ? parseFloat(m[2]) : null];
    };
    const A = read(args[1]);
    const B = read(args[2]);
    if (!A || !B) return null;
    let p1 = A[1];
    let p2 = B[1];
    if (p1 === null && p2 === null) {
      p1 = 50;
      p2 = 50;
    } else if (p1 === null) p1 = 100 - (p2 as number);
    else if (p2 === null) p2 = 100 - p1;
    const w1 = (p1 as number) / 100;
    const w2 = (p2 as number) / 100;
    const a = A[0].a * w1 + B[0].a * w2;
    if (a === 0) return { rgb: [0, 0, 0], a: 0 };
    const ch = (k: 0 | 1 | 2) => Math.round((A[0].rgb[k] * A[0].a * w1 + B[0].rgb[k] * B[0].a * w2) / a);
    return { rgb: [ch(0), ch(1), ch(2)], a };
  }
  return null;
}

/** Token → RGBA đã mở var theo theme; không phải màu ⇒ `null`. */
export function tokenColor(sheet: TokenSheet, name: string, theme: ThemeName): RGBA | null {
  const v = resolveToken(sheet, name, theme);
  return v === undefined ? null : parseCssColor(v);
}

/**
 * Tương phản WCAG của `fg` (có alpha) ĐẶT LÊN nền đặc `bg`, so với chính nền đó — đúng phép
 * trộn trình duyệt làm (blend rồi mới đo). `bg` phải đặc; nền bán trong suốt thì caller tự
 * trộn lên nền phía dưới trước.
 */
export function contrastOn(fg: RGBA, bg: RGBA): number {
  const solid = blend(fg.rgb, fg.a, bg.rgb);
  return contrastRatio(solid, bg.rgb);
}

/** Số px từ `12px`/`12`; không phải số ⇒ NaN. */
export function px(value: string | undefined): number {
  if (value === undefined) return NaN;
  const m = value.trim().match(/^(-?[0-9.]+)(px)?$/);
  return m ? parseFloat(m[1]) : NaN;
}
