/**
 * lib/avatar.ts — schema + defaults + random cho Avatar Builder MVP.
 *
 * Avatar là JSON nhỏ lưu trong User.avatar (Prisma). Deterministic random dùng khi
 * user chưa chọn — cùng id → cùng avatar, tránh flicker mỗi lần load.
 */

export type HairColor = 'black' | 'brown' | 'blonde' | 'red' | 'silver';
export type Glasses = 'none' | 'round' | 'square' | 'aviator' | 'rimless' | 'cateye';
export type Hat = 'none' | 'fedora' | 'beanie' | 'cap' | 'headphone' | 'hairband';
export type Shirt = 'hoodie' | 'sweater' | 'blazer' | 'tshirt' | 'turtleneck' | 'dress';
export type ShirtColor = 'navy' | 'orange' | 'beige' | 'gray' | 'white';

export interface AvatarConfig {
  base: 1 | 2 | 3 | 4; // 4 tone da
  hair: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  hairColor: HairColor;
  glasses: Glasses;
  hat: Hat;
  shirt: Shirt;
  shirtColor: ShirtColor;
}

export const BASE_TONES: Record<AvatarConfig['base'], string> = {
  1: '#F4D1AE', // light
  2: '#E0A87E', // warm
  3: '#B57A4A', // tan
  4: '#6E4326', // deep
};

export const HAIR_COLORS: Record<HairColor, string> = {
  black: '#1B1512',
  brown: '#4E2E1A',
  blonde: '#C9A65E',
  red: '#9C3B1B',
  silver: '#B7B1AA',
};

export const SHIRT_COLORS: Record<ShirtColor, string> = {
  navy: '#002850',
  orange: '#F06020',
  beige: '#D8CDB6',
  gray: '#5A5C5F',
  white: '#F1ECE3',
};

export const HAIR_STYLES: AvatarConfig['hair'][] = [1, 2, 3, 4, 5, 6, 7, 8];
export const GLASSES_STYLES: Glasses[] = ['none', 'round', 'square', 'aviator', 'rimless', 'cateye'];
export const HAT_STYLES: Hat[] = ['none', 'fedora', 'beanie', 'cap', 'headphone', 'hairband'];
export const SHIRT_STYLES: Shirt[] = ['hoodie', 'sweater', 'blazer', 'tshirt', 'turtleneck', 'dress'];

export const DEFAULT_AVATAR: AvatarConfig = {
  base: 2,
  hair: 1,
  hairColor: 'brown',
  glasses: 'none',
  hat: 'none',
  shirt: 'hoodie',
  shirtColor: 'orange',
};

/** Hash chuỗi thành int ổn định (djb2). Dùng để random deterministic từ userId. */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

/** Deterministic avatar từ userId — dùng khi user chưa chọn tay. */
export function randomAvatarFromId(id: string): AvatarConfig {
  const h = hashStr(id || 'anon');
  return {
    base: (((h % 4) + 1) as AvatarConfig['base']),
    hair: pick(HAIR_STYLES, Math.floor(h / 7)),
    hairColor: pick(Object.keys(HAIR_COLORS) as HairColor[], Math.floor(h / 13)),
    glasses: pick(GLASSES_STYLES, Math.floor(h / 17)),
    hat: pick(HAT_STYLES, Math.floor(h / 23)),
    shirt: pick(SHIRT_STYLES, Math.floor(h / 29)),
    shirtColor: pick(Object.keys(SHIRT_COLORS) as ShirtColor[], Math.floor(h / 31)),
  };
}

/** Validate + fallback từng field — accept partial input từ API/localStorage. */
export function normalizeAvatar(raw: unknown, seedId = ''): AvatarConfig {
  const fallback = seedId ? randomAvatarFromId(seedId) : DEFAULT_AVATAR;
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Partial<AvatarConfig>;
  const inRange = (v: unknown, min: number, max: number, def: number) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : def;
  };
  return {
    base: inRange(r.base, 1, 4, fallback.base) as AvatarConfig['base'],
    hair: inRange(r.hair, 1, 8, fallback.hair) as AvatarConfig['hair'],
    hairColor: (Object.keys(HAIR_COLORS) as HairColor[]).includes(r.hairColor as HairColor)
      ? (r.hairColor as HairColor)
      : fallback.hairColor,
    glasses: GLASSES_STYLES.includes(r.glasses as Glasses) ? (r.glasses as Glasses) : fallback.glasses,
    hat: HAT_STYLES.includes(r.hat as Hat) ? (r.hat as Hat) : fallback.hat,
    shirt: SHIRT_STYLES.includes(r.shirt as Shirt) ? (r.shirt as Shirt) : fallback.shirt,
    shirtColor: (Object.keys(SHIRT_COLORS) as ShirtColor[]).includes(r.shirtColor as ShirtColor)
      ? (r.shirtColor as ShirtColor)
      : fallback.shirtColor,
  };
}

export function serializeAvatar(a: AvatarConfig): string {
  return JSON.stringify(a);
}

export function parseAvatar(raw: string | null | undefined, seedId = ''): AvatarConfig {
  if (!raw) return seedId ? randomAvatarFromId(seedId) : DEFAULT_AVATAR;
  try {
    return normalizeAvatar(JSON.parse(raw), seedId);
  } catch {
    return seedId ? randomAvatarFromId(seedId) : DEFAULT_AVATAR;
  }
}
