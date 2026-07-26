/**
 * lib/avatar.ts — schema + palette + defaults + random cho Avatar "búp bê nỉ 3D".
 *
 * Avatar là JSON nhỏ lưu trong User.avatar (Prisma). Deterministic random dùng khi
 * user chưa chọn — cùng id → cùng avatar, tránh flicker mỗi lần load.
 *
 * ⚠️ TƯƠNG THÍCH NGƯỢC (cột User.avatar đã có dữ liệu thật):
 *  · Mọi KEY cũ giữ nguyên tên + nguyên giá trị cũ (không đổi nghĩa `base:2`, `hair:5`…).
 *  · Mọi hạng mục MỞ RỘNG chỉ nối thêm vào cuối danh sách → giá trị cũ luôn còn hợp lệ.
 *  · Mọi FIELD MỚI là optional ở đầu vào: thiếu → rơi về LEGACY_DEFAULTS (giá trị trung
 *    tính, KHÔNG random) nên avatar cũ trông y hệt trước, chỉ đẹp hơn về chất liệu.
 *  · Giá trị lạ (sai kiểu, ngoài range, string rác) → rơi về mặc định, không bao giờ
 *    trả undefined ⇒ renderer không thể vẽ trống.
 */

/* ─────────────────────── Kiểu ─────────────────────── */

export type HairColor =
  // 5 màu gốc — GIỮ NGUYÊN thứ tự và tên
  | 'black' | 'brown' | 'blonde' | 'red' | 'silver'
  // mở rộng
  | 'auburn' | 'ash' | 'platinum' | 'teal' | 'pink' | 'lilac';

export type Glasses =
  | 'none' | 'round' | 'square' | 'aviator' | 'rimless' | 'cateye'
  | 'oversized' | 'halfrim' | 'shield';

export type Hat =
  | 'none' | 'fedora' | 'beanie' | 'cap' | 'headphone' | 'hairband'
  | 'bucket' | 'beret';

export type Shirt =
  | 'hoodie' | 'sweater' | 'blazer' | 'tshirt' | 'turtleneck' | 'dress'
  | 'jacket' | 'vest' | 'overalls' | 'coat';

export type ShirtColor =
  | 'navy' | 'orange' | 'beige' | 'gray' | 'white'
  | 'black' | 'cream' | 'sage' | 'terracotta' | 'blush' | 'mustard';

/** MỚI — biểu cảm miệng/mày. */
export type Expression = 'neutral' | 'smile' | 'grin' | 'pout' | 'frown' | 'smirk';
/** MỚI — khuyên tai. */
export type Earring = 'none' | 'hoop' | 'stud' | 'drop';
/** MỚI — độ đậm má ửng. */
export type Blush = 'none' | 'soft' | 'strong';
/** MỚI — màu nền khung tròn. */
export type BgColor = 'cream' | 'mist' | 'sage' | 'blush' | 'sky' | 'sand' | 'charcoal';
/** MỚI — phụ kiện quanh cổ/ngực. */
export type Accessory = 'none' | 'scarf' | 'necklace' | 'collarPin' | 'bowtie';

export type SkinTone = 1 | 2 | 3 | 4 | 5 | 6;
export type HairStyle = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

export interface AvatarConfig {
  base: SkinTone; // 6 tông da (1..4 giữ nguyên nghĩa cũ)
  hair: HairStyle; // 16 kiểu (1..8 giữ nguyên nghĩa cũ)
  hairColor: HairColor;
  glasses: Glasses;
  hat: Hat;
  shirt: Shirt;
  shirtColor: ShirtColor;
  // ── field mới (optional ở đầu vào, luôn có giá trị sau normalize) ──
  expression: Expression;
  earring: Earring;
  freckles: boolean;
  blush: Blush;
  bg: BgColor;
  accessory: Accessory;
}

/** Đầu vào từ API/localStorage/DB cũ — mọi field đều có thể thiếu. */
export type AvatarConfigInput = Partial<AvatarConfig>;

/* ─────────────────────── Palette ─────────────────────── */

export const BASE_TONES: Record<SkinTone, string> = {
  1: '#F4D1AE', // light      (cũ)
  2: '#E0A87E', // warm       (cũ)
  3: '#B57A4A', // tan        (cũ)
  4: '#6E4326', // deep       (cũ)
  5: '#FBE7D3', // porcelain  (mới)
  6: '#8A5A34', // bronze     (mới)
};

/**
 * ⚠️ Ba màu bạc `silver` · `ash` · `platinum` TRƯỚC ĐÂY gần trùng nhau (#B7B1AA · #6B6560 ·
 * #E3DDD2 — cùng một trục xám ngả vàng, chỉ khác độ sáng, mà gradient tóc lại kéo sáng đỉnh
 * nên nhìn cạnh nhau không phân biệt được). Nay tách theo CẢ HAI trục:
 *  · `silver`   — xám ánh kim, ngả LẠNH (xanh) · sáng trung bình.
 *  · `ash`      — tro ẤM, TỐI hẳn (đậm nhất trong ba).
 *  · `platinum` — gần trắng ngà, SÁNG hẳn.
 * `lib/avatar.test.ts` khoá khoảng cách này bằng ΔE (CIE76) — sửa hex phải chạy lại test.
 * Key không đổi ⇒ avatar đã lưu vẫn là "silver", chỉ đổi sắc độ.
 */
export const HAIR_COLORS: Record<HairColor, string> = {
  black: '#1B1512',
  brown: '#4E2E1A',
  blonde: '#C9A65E',
  red: '#9C3B1B',
  silver: '#9AA3AB',
  auburn: '#7A2F1E',
  ash: '#57534E',
  platinum: '#EFEAE0',
  teal: '#2E5F5B',
  pink: '#C86A85',
  lilac: '#9A86C4',
};

export const SHIRT_COLORS: Record<ShirtColor, string> = {
  navy: '#002850',
  orange: '#F06020',
  beige: '#D8CDB6',
  gray: '#5A5C5F',
  white: '#F1ECE3',
  black: '#22242A',
  cream: '#EFE6D5',
  sage: '#7E8F72',
  terracotta: '#B4593A',
  blush: '#E0A9A0',
  mustard: '#C99A2E',
};

/** Nền khung tròn — sáng, trơn, kiểu phông studio. */
export const BG_COLORS: Record<BgColor, string> = {
  cream: '#F6F2E9',
  mist: '#ECEFF2',
  sage: '#E6EDE4',
  blush: '#F7E9E6',
  sky: '#E4EDF6',
  sand: '#F1E6D6',
  charcoal: '#2C2E33',
};

/* ─────────────────────── Danh sách lựa chọn ─────────────────────── */

export const HAIR_STYLES: HairStyle[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
];
export const SKIN_TONES: SkinTone[] = [1, 2, 3, 4, 5, 6];
export const HAIR_COLOR_KEYS = Object.keys(HAIR_COLORS) as HairColor[];
export const SHIRT_COLOR_KEYS = Object.keys(SHIRT_COLORS) as ShirtColor[];
export const BG_COLOR_KEYS = Object.keys(BG_COLORS) as BgColor[];
export const GLASSES_STYLES: Glasses[] = [
  'none', 'round', 'square', 'aviator', 'rimless', 'cateye', 'oversized', 'halfrim', 'shield',
];
export const HAT_STYLES: Hat[] = [
  'none', 'fedora', 'beanie', 'cap', 'headphone', 'hairband', 'bucket', 'beret',
];
export const SHIRT_STYLES: Shirt[] = [
  'hoodie', 'sweater', 'blazer', 'tshirt', 'turtleneck', 'dress', 'jacket', 'vest', 'overalls', 'coat',
];
export const EXPRESSION_STYLES: Expression[] = ['neutral', 'smile', 'grin', 'pout', 'frown', 'smirk'];
export const EARRING_STYLES: Earring[] = ['none', 'hoop', 'stud', 'drop'];
export const BLUSH_STYLES: Blush[] = ['none', 'soft', 'strong'];
export const ACCESSORY_STYLES: Accessory[] = ['none', 'scarf', 'necklace', 'collarPin', 'bowtie'];

/** Nhãn tiếng Việt cho UI builder (chip hiển thị đẹp hơn key thô). */
export const LABELS: Record<string, string> = {
  none: 'không', round: 'tròn', square: 'vuông', aviator: 'phi công', rimless: 'không viền',
  cateye: 'mắt mèo', oversized: 'bản to', halfrim: 'nửa viền', shield: 'che kín',
  fedora: 'fedora', beanie: 'nón len', cap: 'lưỡi trai', headphone: 'tai nghe',
  hairband: 'băng đô', bucket: 'nón tai bèo', beret: 'nón nồi',
  hoodie: 'hoodie', sweater: 'len', blazer: 'blazer', tshirt: 'áo phông',
  turtleneck: 'cổ lọ', dress: 'đầm', jacket: 'khoác', vest: 'gile',
  overalls: 'yếm', coat: 'măng tô',
  neutral: 'mím môi', smile: 'cười nhẹ', grin: 'cười tươi', pout: 'chu môi',
  frown: 'cau mày', smirk: 'nhếch mép',
  hoop: 'khuyên tròn', stud: 'khuyên nụ', drop: 'khuyên giọt',
  soft: 'nhẹ', strong: 'đậm',
  scarf: 'khăn quàng', necklace: 'vòng cổ', collarPin: 'ghim cổ', bowtie: 'nơ',
};

/* ─────────────────────── Mặc định ─────────────────────── */

/**
 * Giá trị mặc định của các FIELD MỚI. Dùng cho config CŨ (thiếu field) — chọn trung
 * tính, KHÔNG random, để avatar đã lưu của người dùng không đột nhiên đổi mặt.
 */
export const LEGACY_DEFAULTS = {
  expression: 'neutral' as Expression,
  earring: 'none' as Earring,
  freckles: false,
  blush: 'soft' as Blush,
  bg: 'cream' as BgColor,
  accessory: 'none' as Accessory,
};

export const DEFAULT_AVATAR: AvatarConfig = {
  base: 2,
  hair: 1,
  hairColor: 'brown',
  glasses: 'none',
  hat: 'none',
  shirt: 'hoodie',
  shirtColor: 'orange',
  ...LEGACY_DEFAULTS,
};

/** Preset "theo ảnh tham chiếu" — chibi nỉ, kính mắt mèo đen, áo cổ lọ. */
export const REF_PRESET: AvatarConfig = {
  base: 1,
  hair: 9,
  hairColor: 'black',
  glasses: 'cateye',
  hat: 'none',
  shirt: 'turtleneck',
  shirtColor: 'cream',
  expression: 'neutral',
  earring: 'none',
  freckles: false,
  blush: 'strong',
  bg: 'cream',
  accessory: 'none',
};

/** Tổng số tổ hợp có thể chọn — dùng cho báo cáo/test. */
export const TOTAL_COMBOS =
  SKIN_TONES.length *
  HAIR_STYLES.length *
  HAIR_COLOR_KEYS.length *
  GLASSES_STYLES.length *
  HAT_STYLES.length *
  SHIRT_STYLES.length *
  SHIRT_COLOR_KEYS.length *
  EXPRESSION_STYLES.length *
  EARRING_STYLES.length *
  2 /* freckles */ *
  BLUSH_STYLES.length *
  BG_COLOR_KEYS.length *
  ACCESSORY_STYLES.length;

/* ─────────────────────── Random deterministic ─────────────────────── */

/** Hash chuỗi thành int ổn định (djb2). Dùng để random deterministic từ userId. */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Chọn 1 phần tử theo (id, tên hạng mục).
 *
 * ⚠️ Bản cũ dùng CHUNG một hash rồi chia hằng số (`h/7`, `h/13`…): hai id chỉ khác 1 ký
 * tự cuối cho ra `h` lệch nhau vài đơn vị, chia xong thành TRÙNG NHAU ở gần hết hạng mục
 * → cả nhóm user liền nhau ra avatar giống hệt, chỉ khác mỗi tông da. Băm lại theo từng
 * hạng mục (`id#field`) cho phân tán thật sự.
 */
function pickFor<T>(id: string, field: string, arr: readonly T[]): T {
  return arr[hashStr(`${id}#${field}`) % arr.length];
}

/** Deterministic avatar từ userId — dùng khi user chưa chọn tay. */
export function randomAvatarFromId(id: string): AvatarConfig {
  const seed = id || 'anon';
  return {
    base: pickFor(seed, 'base', SKIN_TONES),
    hair: pickFor(seed, 'hair', HAIR_STYLES),
    hairColor: pickFor(seed, 'hairColor', HAIR_COLOR_KEYS),
    glasses: pickFor(seed, 'glasses', GLASSES_STYLES),
    hat: pickFor(seed, 'hat', HAT_STYLES),
    shirt: pickFor(seed, 'shirt', SHIRT_STYLES),
    shirtColor: pickFor(seed, 'shirtColor', SHIRT_COLOR_KEYS),
    expression: pickFor(seed, 'expression', EXPRESSION_STYLES),
    earring: pickFor(seed, 'earring', EARRING_STYLES),
    freckles: hashStr(`${seed}#freckles`) % 5 === 0,
    blush: pickFor(seed, 'blush', BLUSH_STYLES),
    bg: pickFor(seed, 'bg', BG_COLOR_KEYS),
    accessory: pickFor(seed, 'accessory', ACCESSORY_STYLES),
  };
}

/* ─────────────────────── Normalize / parse ─────────────────────── */

function oneOf<T extends string>(v: unknown, list: readonly T[], def: T): T {
  return typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : def;
}

function intIn(v: unknown, min: number, max: number, def: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && Number.isInteger(n) && n >= min && n <= max ? n : def;
}

/**
 * Validate + fallback từng field — chấp nhận partial input từ API/localStorage/DB cũ.
 *
 * · Field CŨ thiếu/sai → lấy từ `fallback` (random deterministic theo seedId, hoặc
 *   DEFAULT_AVATAR khi không có seed) — giữ nguyên hành vi trước đây.
 * · Field MỚI thiếu → LEGACY_DEFAULTS (trung tính). Sai kiểu → cũng về LEGACY_DEFAULTS.
 *   Không dùng random ở đây để avatar đã lưu không đổi diện mạo sau khi nâng cấp.
 */
export function normalizeAvatar(raw: unknown, seedId = ''): AvatarConfig {
  const fallback = seedId ? randomAvatarFromId(seedId) : DEFAULT_AVATAR;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fallback;
  const r = raw as AvatarConfigInput;

  return {
    base: intIn(r.base, 1, SKIN_TONES.length, fallback.base) as SkinTone,
    hair: intIn(r.hair, 1, HAIR_STYLES.length, fallback.hair) as HairStyle,
    hairColor: oneOf(r.hairColor, HAIR_COLOR_KEYS, fallback.hairColor),
    glasses: oneOf(r.glasses, GLASSES_STYLES, fallback.glasses),
    hat: oneOf(r.hat, HAT_STYLES, fallback.hat),
    shirt: oneOf(r.shirt, SHIRT_STYLES, fallback.shirt),
    shirtColor: oneOf(r.shirtColor, SHIRT_COLOR_KEYS, fallback.shirtColor),
    expression: oneOf(r.expression, EXPRESSION_STYLES, LEGACY_DEFAULTS.expression),
    earring: oneOf(r.earring, EARRING_STYLES, LEGACY_DEFAULTS.earring),
    freckles: typeof r.freckles === 'boolean' ? r.freckles : LEGACY_DEFAULTS.freckles,
    blush: oneOf(r.blush, BLUSH_STYLES, LEGACY_DEFAULTS.blush),
    bg: oneOf(r.bg, BG_COLOR_KEYS, LEGACY_DEFAULTS.bg),
    accessory: oneOf(r.accessory, ACCESSORY_STYLES, LEGACY_DEFAULTS.accessory),
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
