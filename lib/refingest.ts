'use client';
/**
 * Reference Ingest — nạp nhiều ảnh / file tham khảo lớn → **JSON manifest nhẹ, không vỡ context**.
 *
 * Nguyên tắc "không vỡ context": ảnh gốc KHÔNG nhét base64 vào flow/AI. Mỗi ref chưng cất thành
 * 1 mẩu JSON gọn (palette · usage · tags · caption · kích thước) + 1 thumbnail nhỏ CHỈ để UI.
 * Khi feed cho AI → dùng `toAiManifest()` (bỏ thumb) → còn vài KB text, đọc không tràn context.
 *
 * Ảnh có 2 CÔNG DỤNG (tách khi nạp): 'ref-render' (cho AI render option) vs 'slide' (dàn Present).
 * Manual-first (0 AI): palette + thumbnail + tag tay chạy local. VLM auto-caption gắn sau.
 */
import { loadImage, extractPalette } from '@/lib/imaging';

export type RefUsage = 'ref-render' | 'slide' | 'material' | 'cad' | 'brief';
export type RefType = 'image' | 'pdf' | 'excel' | 'cad' | 'other';

export interface RefAsset {
  id: string;
  name: string;
  mime: string;
  type: RefType;
  usage: RefUsage;
  thumb: string; // dataURL nhỏ (UI-only, bị strip khi export cho AI)
  palette: string[];
  w: number;
  h: number;
  bytes: number;
  tags: string[];
  caption: string; // để trống — VLM điền sau
}

export interface RefManifest {
  project: string;
  createdAt: string;
  assets: RefAsset[];
}

export const USAGES: { id: RefUsage; label: string; tone: string }[] = [
  { id: 'ref-render', label: 'Ref thiết kế → Render', tone: '#7C9A6B' },
  { id: 'slide', label: 'Ảnh → Present/Slide', tone: '#6B84A8' },
  { id: 'material', label: 'Vật liệu', tone: '#A8825A' },
  { id: 'cad', label: 'CAD / Bản vẽ', tone: '#9A6B84' },
  { id: 'brief', label: 'Đầu bài / Brief', tone: '#8A8A8A' },
];

const STORE_KEY = 'interiorflow.refManifest';

export function classify(mime: string, name: string): RefType {
  const n = name.toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (/sheet|excel|csv/.test(mime) || /\.(xlsx?|csv)$/.test(n)) return 'excel';
  if (/\.(dxf|dwg)$/.test(n)) return 'cad';
  return 'other';
}

function defaultUsage(type: RefType): RefUsage {
  return type === 'pdf' ? 'brief' : type === 'excel' ? 'material' : type === 'cad' ? 'cad' : 'ref-render';
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error('read fail'));
    r.readAsDataURL(file);
  });
}

/** Thumbnail nhẹ: co ảnh về ≤max px, JPEG chất lượng vừa. Giữ context nhỏ. */
async function makeThumb(dataURL: string, max = 360): Promise<{ thumb: string; w: number; h: number }> {
  const img = await loadImage(dataURL);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const scale = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return { thumb: c.toDataURL('image/jpeg', 0.68), w, h };
}

let counter = 0;
function uid() {
  counter += 1;
  return `ref_${Date.now().toString(36)}_${counter}`;
}

/** Nạp 1 file → RefAsset (ảnh: thumbnail + palette local; file khác: chỉ metadata tham chiếu). */
export async function ingestFile(file: File): Promise<RefAsset> {
  const type = classify(file.type, file.name);
  const base: RefAsset = {
    id: uid(),
    name: file.name,
    mime: file.type || 'application/octet-stream',
    type,
    usage: defaultUsage(type),
    thumb: '',
    palette: [],
    w: 0,
    h: 0,
    bytes: file.size,
    tags: [],
    caption: '',
  };
  if (type === 'image') {
    try {
      const dataURL = await fileToDataURL(file);
      const { thumb, w, h } = await makeThumb(dataURL);
      base.thumb = thumb;
      base.w = w;
      base.h = h;
      base.palette = await extractPalette(thumb).catch(() => []);
    } catch {
      /* ảnh lỗi → vẫn giữ metadata */
    }
  }
  return base;
}

// ---------- Manifest storage + export ----------
export function loadManifest(): RefManifest | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as RefManifest) : null;
  } catch {
    return null;
  }
}

export function saveManifest(m: RefManifest) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(m));
  } catch {
    /* localStorage đầy — manifest to do nhiều thumb; export ra file thay thế */
  }
}

/** Manifest cho AI: BỎ thumbnail → chỉ còn phần "hiểu" (vài KB), không vỡ context window. */
export function toAiManifest(m: RefManifest): string {
  const slim = {
    project: m.project,
    assets: m.assets.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      usage: a.usage,
      palette: a.palette,
      w: a.w,
      h: a.h,
      tags: a.tags,
      caption: a.caption,
    })),
  };
  return JSON.stringify(slim, null, 2);
}

export function byteSize(str: string): number {
  return new Blob([str]).size;
}

export function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
