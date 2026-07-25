/**
 * lib/avatar.test.ts — normalize + deterministic random + parse + TƯƠNG THÍCH NGƯỢC.
 * Chạy: `node_modules/.bin/sucrase-node lib/avatar.test.ts`.
 *
 * Trọng tâm: cột User.avatar đã có dữ liệu THẬT của người dùng ⇒ config cũ (thiếu field
 * mới) và giá trị lạ phải luôn ra AvatarConfig đủ field, không crash, không undefined.
 */

import {
  ACCESSORY_STYLES,
  AvatarConfig,
  BASE_TONES,
  BG_COLORS,
  BG_COLOR_KEYS,
  BLUSH_STYLES,
  DEFAULT_AVATAR,
  EARRING_STYLES,
  EXPRESSION_STYLES,
  GLASSES_STYLES,
  HAIR_COLORS,
  HAIR_COLOR_KEYS,
  HAIR_STYLES,
  HAT_STYLES,
  LEGACY_DEFAULTS,
  REF_PRESET,
  SHIRT_COLORS,
  SHIRT_COLOR_KEYS,
  SHIRT_STYLES,
  SKIN_TONES,
  TOTAL_COMBOS,
  normalizeAvatar,
  parseAvatar,
  randomAvatarFromId,
  serializeAvatar,
} from './avatar';

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
  console.log('  ok:', msg);
}

console.log('avatar tests');

/* ─── 1. Random deterministic từ id (test cũ) ─── */
const a = randomAvatarFromId('user-abc');
const b = randomAvatarFromId('user-abc');
assert(JSON.stringify(a) === JSON.stringify(b), 'same id → same avatar');

const c = randomAvatarFromId('user-xyz');
assert(JSON.stringify(a) !== JSON.stringify(c), 'khác id → khác avatar (rất khả năng)');

/* ─── 2. Normalize rác → fallback deterministic (test cũ, range đã mở rộng) ─── */
const n = normalizeAvatar({ base: 99, hair: 'nope' }, 'seed-1');
assert(n.base >= 1 && n.base <= SKIN_TONES.length, `base clamp về 1..${SKIN_TONES.length}`);
assert(n.hair >= 1 && n.hair <= HAIR_STYLES.length, `hair clamp về 1..${HAIR_STYLES.length}`);

/* ─── 3. Parse null → default (test cũ) ─── */
const p = parseAvatar(null);
assert(p.base === DEFAULT_AVATAR.base, 'null + no seed → DEFAULT');

/* ─── 4. Round-trip serialize → parse (test cũ) ─── */
const s = serializeAvatar(DEFAULT_AVATAR);
const back = parseAvatar(s);
assert(JSON.stringify(back) === JSON.stringify(DEFAULT_AVATAR), 'round-trip ok');

/* ─── 5. Parse invalid JSON → fallback (test cũ) ─── */
const bad = parseAvatar('{not json}', 'user-abc');
assert(bad.base >= 1 && bad.base <= SKIN_TONES.length, 'json rác → fallback random');

/* ─── 6. TƯƠNG THÍCH NGƯỢC: config CŨ (7 field, thiếu toàn bộ field mới) ─── */
const legacyRaw = JSON.stringify({
  base: 2,
  hair: 5,
  hairColor: 'brown',
  glasses: 'round',
  hat: 'beanie',
  shirt: 'blazer',
  shirtColor: 'navy',
});
const legacy = parseAvatar(legacyRaw, 'user-abc');
assert(legacy.base === 2 && legacy.hair === 5, 'config cũ giữ nguyên base/hair');
assert(
  legacy.hairColor === 'brown' &&
    legacy.glasses === 'round' &&
    legacy.hat === 'beanie' &&
    legacy.shirt === 'blazer' &&
    legacy.shirtColor === 'navy',
  'config cũ giữ nguyên toàn bộ 7 field cũ',
);
assert(legacy.expression === LEGACY_DEFAULTS.expression, 'thiếu expression → mặc định trung tính');
assert(legacy.earring === LEGACY_DEFAULTS.earring, 'thiếu earring → mặc định');
assert(legacy.freckles === LEGACY_DEFAULTS.freckles, 'thiếu freckles → mặc định');
assert(legacy.blush === LEGACY_DEFAULTS.blush, 'thiếu blush → mặc định');
assert(legacy.bg === LEGACY_DEFAULTS.bg, 'thiếu bg → mặc định');
assert(legacy.accessory === LEGACY_DEFAULTS.accessory, 'thiếu accessory → mặc định');

/* ─── 7. Mọi field mới đều KHÔNG BAO GIỜ undefined, kể cả input rỗng/rác ─── */
const KEYS: (keyof AvatarConfig)[] = [
  'base', 'hair', 'hairColor', 'glasses', 'hat', 'shirt', 'shirtColor',
  'expression', 'earring', 'freckles', 'blush', 'bg', 'accessory',
];
const junkInputs: unknown[] = [
  null,
  undefined,
  0,
  '',
  'string',
  [],
  [1, 2, 3],
  {},
  { base: null, hair: null, expression: 42, earring: {}, freckles: 'yes', bg: 'neon', accessory: 7 },
  { hair: 3.5, base: -1, glasses: 'CATEYE', shirt: 'Turtleneck' },
  { hair: 999, base: 999 },
  JSON.parse('{"base":"2","hair":"9"}'),
];
for (const raw of junkInputs) {
  const cfg = normalizeAvatar(raw, 'seed-junk');
  for (const k of KEYS) {
    if (cfg[k] === undefined || cfg[k] === null) {
      console.error('FAIL: undefined field', k, 'từ input', JSON.stringify(raw));
      process.exit(1);
    }
  }
}
assert(true, `${junkInputs.length} input rác → luôn đủ ${KEYS.length} field, không undefined`);

/* ─── 8. Chuỗi rác/khổng lồ không làm parseAvatar ném lỗi ─── */
const nasty = ['', '   ', 'null', 'undefined', '[]', '{}', '"x"', '{"base":', 'x'.repeat(5000)];
for (const raw of nasty) {
  const cfg = parseAvatar(raw, 'seed-nasty');
  if (!cfg || typeof cfg.base !== 'number') {
    console.error('FAIL: parseAvatar vỡ với', raw.slice(0, 20));
    process.exit(1);
  }
}
assert(true, 'chuỗi rác/khổng lồ → parseAvatar không ném, luôn có config');

/* ─── 9. Mọi giá trị hợp lệ phải có màu/định nghĩa (renderer không vẽ trống) ─── */
for (const t of SKIN_TONES) assert(!!BASE_TONES[t], `BASE_TONES có tone ${t}`);
for (const k of HAIR_COLOR_KEYS) assert(!!HAIR_COLORS[k], `HAIR_COLORS có ${k}`);
for (const k of SHIRT_COLOR_KEYS) assert(!!SHIRT_COLORS[k], `SHIRT_COLORS có ${k}`);
for (const k of BG_COLOR_KEYS) assert(!!BG_COLORS[k], `BG_COLORS có ${k}`);

/* ─── 10. randomAvatarFromId luôn trả giá trị nằm trong danh sách hợp lệ ─── */
for (let i = 0; i < 300; i++) {
  const cfg = randomAvatarFromId(`u-${i}`);
  const okRange =
    cfg.base >= 1 && cfg.base <= SKIN_TONES.length &&
    cfg.hair >= 1 && cfg.hair <= HAIR_STYLES.length &&
    HAIR_COLOR_KEYS.includes(cfg.hairColor) &&
    GLASSES_STYLES.includes(cfg.glasses) &&
    HAT_STYLES.includes(cfg.hat) &&
    SHIRT_STYLES.includes(cfg.shirt) &&
    SHIRT_COLOR_KEYS.includes(cfg.shirtColor) &&
    EXPRESSION_STYLES.includes(cfg.expression) &&
    EARRING_STYLES.includes(cfg.earring) &&
    typeof cfg.freckles === 'boolean' &&
    BLUSH_STYLES.includes(cfg.blush) &&
    BG_COLOR_KEYS.includes(cfg.bg) &&
    ACCESSORY_STYLES.includes(cfg.accessory);
  if (!okRange) {
    console.error('FAIL: random ngoài range cho u-' + i, cfg);
    process.exit(1);
  }
}
assert(true, '300 seed → random luôn nằm trong danh sách hợp lệ');

/* ─── 11. Round-trip cho config đầy đủ (13 field) + preset tham chiếu ─── */
const full = randomAvatarFromId('full-1');
assert(
  JSON.stringify(parseAvatar(serializeAvatar(full))) === JSON.stringify(full),
  'round-trip config đầy đủ 13 field ok',
);
assert(
  JSON.stringify(parseAvatar(serializeAvatar(REF_PRESET))) === JSON.stringify(REF_PRESET),
  'round-trip REF_PRESET ok',
);

/* ─── 12. Field thừa (từ bản tương lai) bị bỏ, không lọt vào config ─── */
const future = normalizeAvatar({ ...DEFAULT_AVATAR, wings: 'dragon', hair: 4 }, 'seed-f');
assert(!('wings' in future), 'field lạ bị loại khỏi config đã chuẩn hoá');
assert(Object.keys(future).length === KEYS.length, `config chuẩn hoá đúng ${KEYS.length} key`);

/* ─── 13. Tổng số tổ hợp ─── */
assert(TOTAL_COMBOS > 4e10, `tổng tổ hợp = ${TOTAL_COMBOS.toLocaleString('en-US')}`);

console.log('PASS avatar tests');
