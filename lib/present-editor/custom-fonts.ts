/**
 * lib/present-editor/custom-fonts.ts — FONT NGƯỜI DÙNG TẢI LÊN (#13).
 *
 * Đọc file .ttf/.otf/.woff/.woff2 → data URL → đăng ký FontFace vào document.fonts →
 * dùng được ngay trên canvas (render.ts) + preview. Lưu localStorage để lần sau tự nạp lại.
 * Trả về entry giống CuratedFont (label/stack/face) để trộn thẳng vào dropdown Font.
 */

import type { CuratedFont } from './fonts';

export interface CustomFont extends CuratedFont {
  dataUrl: string;
}

const KEY = 'interiorflow.customFonts';

function read(): CustomFont[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as CustomFont[];
  } catch {
    return [];
  }
}

function write(list: CustomFont[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* localStorage đầy/chặn — bỏ qua persist */
  }
}

export function getCustomFonts(): CustomFont[] {
  return read();
}

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });
}

async function register(face: string, dataUrl: string): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  const ff = new FontFace(face, `url(${dataUrl})`);
  await ff.load();
  (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff);
}

/** Nạp lại toàn bộ font đã lưu (gọi khi mở editor). */
export async function registerAllCustom(): Promise<void> {
  for (const f of read()) {
    try {
      await register(f.face, f.dataUrl);
    } catch {
      /* font hỏng — bỏ qua */
    }
  }
}

/** Tải 1 file font người dùng → đăng ký + lưu → trả entry để thêm vào dropdown. */
export async function addCustomFont(file: File): Promise<CustomFont> {
  const dataUrl = await fileToDataUrl(file);
  const base = file.name.replace(/\.(ttf|otf|woff2?|)$/i, '').trim().slice(0, 40) || 'Font tải lên';
  // tên face duy nhất (tránh trùng)
  const face = `${base}-${Date.now().toString(36).slice(-4)}`;
  await register(face, dataUrl);
  const cf: CustomFont = {
    label: `${base} (tải lên)`,
    stack: `"${face}", system-ui, sans-serif`,
    face: base,
    dataUrl,
  };
  const list = read();
  list.push(cf);
  write(list);
  return cf;
}
