/**
 * lib/present-editor/brand-kit.ts — BRAND KIT bền vững của TTT (PS-1 / G.5).
 *
 * Lưu logo · bộ màu · cặp font MỘT LẦN → tái dùng cho mọi deck. Persist localStorage,
 * tái dùng ĐÚNG pattern `custom-fonts.ts` (read/write JSON, guard `window`, im lặng khi lỗi).
 *
 * Ranh giới (chốt ở IF-PRESENT-SPRINT-PLAN PS-1): KHÔNG dựng "100 brand kiểu Canva". TTT chỉ
 * cần 1–vài brand → lưu 1 DANH SÁCH PHẲNG + 1 kit "đang chọn" (activeId). Không multi-tenant,
 * không server (localStorage-first như custom-fonts). Auth có `getSessionUser()` nhưng Brand Kit
 * gọn + chỉ ở client → không cần gắn userId cho v1 (ghi chú: nếu sau này cần chia theo người,
 * đổi KEY theo userId là đủ, không đổi cấu trúc).
 *
 * Phần THUẦN (áp kit vào deck) tách khỏi phần localStorage để test bằng sucrase-node được.
 */

import type { FontPairing } from '@/lib/slides';
import type { EditorDeck, DeckWatermark, WatermarkCorner } from './model';
import { rethemeDeck } from './theme-roles';

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

const KEY = 'interiorflow.brandKits';
const ACTIVE_KEY = 'interiorflow.brandKitActive';

interface Stored {
  kits: BrandKit[];
  activeId: string | null;
}

function read(): Stored {
  if (typeof window === 'undefined') return { kits: [], activeId: null };
  try {
    const kits = JSON.parse(localStorage.getItem(KEY) || '[]') as BrandKit[];
    const activeId = localStorage.getItem(ACTIVE_KEY);
    return { kits: Array.isArray(kits) ? kits : [], activeId: activeId || null };
  } catch {
    return { kits: [], activeId: null };
  }
}

function write(s: Stored): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s.kits));
    if (s.activeId) localStorage.setItem(ACTIVE_KEY, s.activeId);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* localStorage đầy/chặn — bỏ qua persist */
  }
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
export function draftKitFromDeck(deck: EditorDeck, name = 'TTT'): Omit<BrandKit, 'updatedAt'> {
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
