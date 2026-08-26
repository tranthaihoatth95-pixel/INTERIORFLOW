/**
 * lib/present-editor/brand-kit.ts — BRAND KIT: nhận diện riêng của TỪNG DỰ ÁN (PS-1 / G.5).
 *
 * Lưu logo · bộ màu · cặp font MỘT LẦN → tái dùng cho mọi deck. Persist localStorage,
 * tái dùng ĐÚNG pattern `custom-fonts.ts` (read/write JSON, guard `window`, im lặng khi lỗi).
 *
 * Ranh giới (chốt ở IF-PRESENT-SPRINT-PLAN PS-1): KHÔNG dựng "100 brand kiểu Canva". Mỗi user
 * chỉ cần 1–vài brand → lưu 1 DANH SÁCH PHẲNG + 1 kit "đang chọn" (activeId). Không multi-tenant,
 * không server (localStorage-first như custom-fonts). Auth có `getSessionUser()` nhưng Brand Kit
 * gọn + chỉ ở client → không cần gắn userId cho v1 (ghi chú: nếu sau này cần chia theo người,
 * đổi KEY theo userId là đủ, không đổi cấu trúc).
 *
 * Phần THUẦN (áp kit vào deck) tách khỏi phần localStorage để test bằng sucrase-node được.
 */

import type { FontPairing } from '@/lib/slides';
import type { EditorDeck, DeckWatermark, WatermarkCorner } from './model';
import { rethemeDeck } from './theme-roles';
import { createStudioBlobStore } from '../storage/studio-persist';

/** Cấu hình watermark lưu trong Brand Kit (không kèm enabled — deck tự bật/tắt). */
export interface BrandWatermark {
  corner: WatermarkCorner;
  sizePct: number;
  opacity: number;
  marginPct: number;
}

export const DEFAULT_BRAND_WATERMARK: BrandWatermark = {
  corner: 'br',
  sizePct: 12,
  opacity: 0.85,
  marginPct: 3,
};

export interface BrandKit {
  id: string;
  name: string;
  /** logo dataURL/URL (dùng cho watermark + đầu trang). Rỗng = chưa có logo. */
  logo: string | null;
  /** bộ màu gu (>=1, thường 6). */
  palette: string[];
  fonts: FontPairing;
  watermark: BrandWatermark;
  updatedAt: number;
}

/* Key localStorage CŨ — W0.3 (19/08, FINAL-AUDIT A-4): Brand Kit là tài sản studio, dời
 * localStorage → IndexedDB qua `lib/storage/studio-persist.ts` (tái dùng DB `interiorflow-sheets`).
 * Hai key cũ chỉ còn là CẦU đọc-một-lần lúc di trú, không ghi mới, không xoá. Câu than cũ
 * "Đổi máy = mất Brand Kit" vẫn đúng (IDB vẫn per-máy) — nhưng clear-site-data thân thiện hơn
 * và logo dataURL không còn đụng trần 5MB. */
const KEY = 'interiorflow.brandKits';
const ACTIVE_KEY = 'interiorflow.brandKitActive';

interface Stored {
  kits: BrandKit[];
  activeId: string | null;
}

const EMPTY_STORED: Stored = { kits: [], activeId: null };

function parseStored(v: unknown): Stored | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const s = v as Partial<Stored>;
  if (!Array.isArray(s.kits)) return undefined;
  return { kits: s.kits, activeId: typeof s.activeId === 'string' && s.activeId ? s.activeId : null };
}

const brandStore = createStudioBlobStore<Stored>({
  route: '/studio-brand-kits',
  readLegacy: () => {
    if (typeof window === 'undefined') return undefined;
    try {
      const kits = JSON.parse(localStorage.getItem(KEY) || 'null') as BrandKit[] | null;
      if (!Array.isArray(kits)) return undefined;
      const activeId = localStorage.getItem(ACTIVE_KEY);
      return { kits, activeId: activeId || null };
    } catch {
      return undefined;
    }
  },
  empty: EMPTY_STORED,
  parse: parseStored,
});

/** Chờ IDB nạp xong (panel Brand Kit await rồi đọc lại nếu cần dữ liệu tươi nhất). */
export function hydrateBrandKits(): Promise<void> {
  return brandStore.hydrate();
}

function read(): Stored {
  return brandStore.get();
}

function write(s: Stored): void {
  if (typeof window === 'undefined') return;
  brandStore.set(s);
}

function makeId(): string {
  return `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function getBrandKits(): BrandKit[] {
  return read().kits;
}

/** Brand Kit đang chọn (activeId), hoặc kit đầu tiên, hoặc null. */
export function getActiveBrandKit(): BrandKit | null {
  const { kits, activeId } = read();
  if (!kits.length) return null;
  return kits.find((k) => k.id === activeId) ?? kits[0];
}

/**
 * Ngữ cảnh thương hiệu gửi kèm mỗi lượt chat Vitals (VIỆC 4). Brand Kit ở localStorage nên
 * backend không đọc được — client phải bơm. KHÔNG gửi dataURL logo (phình payload, model text
 * không dùng được), chỉ gửi `hasLogo`. Chưa có kit → `null` ⇒ Vitals nói thẳng là chưa có.
 */
export function brandContextForVitals(): {
  name: string;
  palette: string[];
  fonts: string;
  hasLogo: boolean;
} | null {
  const kit = getActiveBrandKit();
  if (!kit) return null;
  return {
    name: kit.name || '',
    palette: Array.isArray(kit.palette) ? kit.palette : [],
    fonts: kit.fonts,
    hasLogo: !!kit.logo,
  };
}

export function setActiveBrandKit(id: string): void {
  const s = read();
  if (!s.kits.some((k) => k.id === id)) return;
  write({ ...s, activeId: id });
}

/**
 * Lưu (thêm mới nếu chưa có id, hoặc cập nhật) 1 Brand Kit → đặt làm active. Trả kit đã lưu.
 * Không truyền id → tạo kit mới.
 */
export function saveBrandKit(
  kit: Omit<BrandKit, 'updatedAt' | 'id'> & { id?: string; updatedAt?: number },
): BrandKit {
  const s = read();
  const id = kit.id || makeId();
  const full: BrandKit = { ...kit, id, updatedAt: Date.now() };
  const idx = s.kits.findIndex((k) => k.id === id);
  const kits = idx >= 0 ? s.kits.map((k) => (k.id === id ? full : k)) : [...s.kits, full];
  write({ kits, activeId: id });
  return full;
}

export function deleteBrandKit(id: string): void {
  const s = read();
  const kits = s.kits.filter((k) => k.id !== id);
  const activeId = s.activeId === id ? (kits[0]?.id ?? null) : s.activeId;
  write({ kits, activeId });
}

/* ---------------------- XUẤT / NHẬP .json (0b, 31/07) ----------------------
 * Brand Kit CHỈ ở localStorage (KEY/ACTIVE_KEY ở trên) — không bản sao Prisma, không trong .idf
 * (.idf chỉ mang studioName dạng chuỗi, xem lib/cad/idf.ts). Đổi máy = mất Brand Kit của MỌI dự
 * án. Nút xuất/nhập .json ở BrandKitPanel là PHAO TẠM — đợt B (docs/QUYET-DINH-HA-TANG-2026-07-31.md
 * §⑥ Đợt B, pha B3) sẽ đưa brand-kit.json vào thư mục dự án thật; hàm ở đây có thể tái dùng
 * nguyên cho bước đó (buildBrandKitExport/mergeBrandKits đã tách THUẦN, không đụng localStorage).
 */

/** Gói xuất — versioned để đợt sau đổi schema không vỡ file cũ người dùng đã tải về. */
export interface BrandKitExport {
  version: 1;
  exportedAt: number;
  kits: BrandKit[];
  activeId: string | null;
}

/** Dựng gói xuất (THUẦN — test được bằng sucrase-node, không đụng localStorage). */
export function buildBrandKitExport(kits: BrandKit[], activeId: string | null): BrandKitExport {
  return { version: 1, exportedAt: Date.now(), kits, activeId: activeId && kits.some((k) => k.id === activeId) ? activeId : null };
}

/** Xuất TOÀN BỘ danh sách kit + kit đang chọn thành chuỗi JSON (đọc localStorage). */
export function exportBrandKitsJson(): string {
  const { kits, activeId } = read();
  return JSON.stringify(buildBrandKitExport(kits, activeId), null, 2);
}

function isValidWatermark(v: unknown): v is BrandWatermark {
  if (!v || typeof v !== 'object') return false;
  const w = v as Record<string, unknown>;
  return (
    typeof w.corner === 'string' &&
    ['tl', 'tr', 'bl', 'br'].includes(w.corner) &&
    typeof w.sizePct === 'number' &&
    typeof w.opacity === 'number' &&
    typeof w.marginPct === 'number'
  );
}

/** 1 kit hợp lệ tối thiểu (id/name chuỗi, palette mảng, watermark đủ trường). Không ném — lọc bỏ
 * kit hỏng thay vì làm hỏng cả gói nhập. */
function isValidKit(v: unknown): v is BrandKit {
  if (!v || typeof v !== 'object') return false;
  const k = v as Record<string, unknown>;
  return (
    typeof k.id === 'string' &&
    k.id.length > 0 &&
    typeof k.name === 'string' &&
    (k.logo === null || typeof k.logo === 'string') &&
    Array.isArray(k.palette) &&
    k.palette.every((c) => typeof c === 'string') &&
    typeof k.fonts === 'string' &&
    isValidWatermark(k.watermark) &&
    typeof k.updatedAt === 'number'
  );
}

/** Đọc + kiểm gói .json nhập vào (THUẦN). Sai định dạng/hỏng → null (không ném). Lọc bỏ từng kit
 * hỏng riêng lẻ thay vì từ chối cả file (1 kit lỗi không kéo sập những kit hợp lệ khác). */
export function parseBrandKitExport(json: string): BrandKitExport | null {
  try {
    const raw = JSON.parse(json) as Partial<BrandKitExport>;
    if (raw?.version !== 1 || !Array.isArray(raw.kits)) return null;
    const kits = raw.kits.filter(isValidKit);
    if (!kits.length) return null;
    const activeId = typeof raw.activeId === 'string' && kits.some((k) => k.id === raw.activeId) ? raw.activeId : null;
    return { version: 1, exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : Date.now(), kits, activeId };
  } catch {
    return null;
  }
}

export interface ImportResult {
  kits: BrandKit[];
  activeId: string | null;
  /** số kit đưa vào MỚI (mode='merge': đếm cả kit trùng id được cấp id mới; mode='overwrite': = tổng số kit trong gói). */
  addedCount: number;
}

/**
 * Gộp gói nhập vào kho hiện có (THUẦN — test được).
 *   - 'overwrite': THAY TOÀN BỘ bằng gói nhập — đây là lựa chọn NGƯỜI DÙNG ĐÃ CHỌN tường minh ở
 *     hộp thoại (không phải ghi đè im lặng).
 *     - 'merge': CỘNG THÊM — kit id chưa từng có thì thêm nguyên id; kit TRÙNG id với kit đang có
 *     thì cấp ID MỚI (coi là bản sao) — CHỦ Ý không đè lên kit đang có, đúng yêu cầu "KHÔNG ghi đè
 *     im lặng" ngay trong bản thân chế độ "gộp".
 */
export function mergeBrandKits(existing: Stored, incoming: BrandKitExport, mode: 'merge' | 'overwrite'): ImportResult {
  if (mode === 'overwrite') {
    return { kits: incoming.kits, activeId: incoming.activeId, addedCount: incoming.kits.length };
  }
  const existingIds = new Set(existing.kits.map((k) => k.id));
  const added: BrandKit[] = [];
  for (const k of incoming.kits) {
    if (existingIds.has(k.id)) {
      const dup: BrandKit = { ...k, id: makeId(), name: k.name ? `${k.name} (nhập)` : 'Không tên (nhập)' };
      added.push(dup);
    } else {
      added.push(k);
      existingIds.add(k.id);
    }
  }
  const kits = [...existing.kits, ...added];
  // giữ active hiện tại nếu đang có; chưa có kit nào trước đó → nhận active của gói nhập (ánh xạ id mới nếu bị đổi).
  const activeId =
    existing.activeId ??
    (incoming.activeId ? (added.find((a) => incoming.kits.find((i) => i.id === incoming.activeId)?.name === a.name)?.id ?? incoming.activeId) : null) ??
    kits[0]?.id ??
    null;
  return { kits, activeId, addedCount: added.length };
}

/** Nhập gói .json — đọc localStorage, gộp, ghi lại. Trả kết quả hoặc lỗi (KHÔNG ném). */
export function importBrandKitsJson(json: string, mode: 'merge' | 'overwrite'): { ok: true; addedCount: number; totalCount: number } | { ok: false; error: string } {
  const pkg = parseBrandKitExport(json);
  if (!pkg) return { ok: false, error: 'File không đúng định dạng Brand Kit (.json xuất từ InteriorFlow).' };
  const existing = read();
  const result = mergeBrandKits(existing, pkg, mode);
  write({ kits: result.kits, activeId: result.activeId });
  return { ok: true, addedCount: result.addedCount, totalCount: result.kits.length };
}

/* ---------------------- PHẦN THUẦN (áp kit vào deck) ---------------------- */

/** Dựng watermark deck-level từ Brand Kit (dùng logo của kit). Không logo → undefined. */
export function watermarkFromKit(
  kit: Pick<BrandKit, 'logo' | 'watermark'>,
  enabled: boolean,
): DeckWatermark | undefined {
  if (!kit.logo) return undefined;
  return {
    src: kit.logo,
    corner: kit.watermark.corner,
    sizePct: kit.watermark.sizePct,
    opacity: kit.watermark.opacity,
    marginPct: kit.watermark.marginPct,
    enabled,
  };
}

/**
 * ÁP Brand Kit vào 1 deck ĐÃ CÓ (nút "Áp lại theme cho cả deck" — G.5+G.6+G.7). Trả deck MỚI:
 *   - đặt fonts theo kit,
 *   - NHUỘM LẠI mọi slide theo palette kit (rethemeDeck — vai trò gần nhất, xử lý cả nền tối),
 *   - gắn watermark từ logo kit (giữ trạng thái bật/tắt hiện tại của deck; mặc định bật nếu
 *     deck chưa có watermark và kit có logo).
 * KHÔNG side-effect (deck gốc nguyên vẹn).
 */
export function applyBrandKitToDeck(deck: EditorDeck, kit: BrandKit): EditorDeck {
  const rethemed = rethemeDeck(deck, kit.palette);
  const enabled = deck.watermark ? deck.watermark.enabled : !!kit.logo;
  const watermark = watermarkFromKit(kit, enabled);
  return {
    ...rethemed,
    fonts: kit.fonts,
    watermark: watermark ?? deck.watermark,
  };
}

/**
 * Gieo Brand Kit vào 1 deck MỚI/TRẮNG (auto-load — deck mới tự nạp nhận diện, thay palette
 * quiet-luxury cứng). Chỉ đặt palette/fonts/watermark; KHÔNG nhuộm (deck mới chưa có màu nướng).
 */
export function seedDeckWithBrandKit(deck: EditorDeck, kit: BrandKit): EditorDeck {
  return {
    ...deck,
    palette: [...kit.palette],
    fonts: kit.fonts,
    watermark: watermarkFromKit(kit, !!kit.logo) ?? deck.watermark,
  };
}

/** Dựng 1 Brand Kit "nháp" từ deck hiện tại (để mở panel với giá trị đang dùng). */
export function draftKitFromDeck(deck: EditorDeck, name = ''): Omit<BrandKit, 'updatedAt'> {
  return {
    id: '',
    name,
    logo: deck.watermark?.src ?? null,
    palette: [...deck.palette],
    fonts: deck.fonts,
    watermark: deck.watermark
      ? {
          corner: deck.watermark.corner,
          sizePct: deck.watermark.sizePct,
          opacity: deck.watermark.opacity,
          marginPct: deck.watermark.marginPct ?? DEFAULT_BRAND_WATERMARK.marginPct,
        }
      : { ...DEFAULT_BRAND_WATERMARK },
  };
}
