/**
 * lib/avatar.test.ts — kiểm tra normalize + deterministic random + parse.
 * Chạy: `node_modules/.bin/sucrase-node lib/avatar.test.ts`.
 */

import {
  DEFAULT_AVATAR,
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

// 1. Random deterministic từ id
const a = randomAvatarFromId('user-abc');
const b = randomAvatarFromId('user-abc');
assert(JSON.stringify(a) === JSON.stringify(b), 'same id → same avatar');

const c = randomAvatarFromId('user-xyz');
assert(JSON.stringify(a) !== JSON.stringify(c), 'khác id → khác avatar (rất khả năng)');

// 2. Normalize rác → fallback deterministic
const n = normalizeAvatar({ base: 99, hair: 'nope' }, 'seed-1');
assert(n.base >= 1 && n.base <= 4, 'base clamp về 1..4');
assert(n.hair >= 1 && n.hair <= 8, 'hair clamp về 1..8');

// 3. Parse null → default (không id)
const p = parseAvatar(null);
assert(p.base === DEFAULT_AVATAR.base, 'null + no seed → DEFAULT');

// 4. Round-trip serialize → parse
const s = serializeAvatar(DEFAULT_AVATAR);
const back = parseAvatar(s);
assert(JSON.stringify(back) === JSON.stringify(DEFAULT_AVATAR), 'round-trip ok');

// 5. Parse invalid JSON → fallback
const bad = parseAvatar('{not json}', 'user-abc');
assert(bad.base >= 1 && bad.base <= 4, 'json rác → fallback random');

console.log('PASS avatar tests');
