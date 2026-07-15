/**
 * lib/render-core/text2image-core.ts — TẦNG LÕI TẤT ĐỊNH của node "Tạo ảnh từ Text".
 *
 * Khi CHƯA có API key (NVIDIA/fal): vẫn trả KẾT QUẢ THẬT — một concept sketch SVG
 * dựng từ chính prompt (đọc loại phòng + phong cách → palette + bố cục nội thất),
 * KHÔNG phải mock ngẫu nhiên. Ảnh tự dán nhãn "LÕI TẤT ĐỊNH · KHÔNG AI" — không
 * bao giờ giả dạng ảnh AI (kiến trúc 2 tầng, cấm mock-im-lặng).
 *
 * Thuần TS (string SVG, không DOM) — test: node_modules/.bin/sucrase-node lib/render-core/render-core.test.ts
 */

export type CoreRoom = 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'office';

/** hash FNV-ish ổn định — biến thể tất định theo prompt (cùng prompt = cùng ảnh). */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const ROOM_KEYWORDS: Array<[CoreRoom, string[]]> = [
  ['bedroom', ['bedroom', 'phòng ngủ', 'phong ngu', 'giường', 'bed ']],
  ['kitchen', ['kitchen', 'bếp', 'bep', 'dining', 'phòng ăn', 'phong an']],
  ['bathroom', ['bathroom', 'phòng tắm', 'phong tam', 'toilet', 'wc', 'bathtub']],
  ['office', ['office', 'văn phòng', 'van phong', 'workspace', 'làm việc', 'lam viec', 'desk']],
  ['living', ['living', 'phòng khách', 'phong khach', 'sofa', 'lounge']],
];

/** Đọc loại phòng từ prompt (EN + VI) — mặc định living. */
export function detectRoom(prompt: string): CoreRoom {
  const p = prompt.toLowerCase();
  for (const [room, keys] of ROOM_KEYWORDS) {
    if (keys.some((k) => p.includes(k))) return room;
  }
  return 'living';
}

export interface CorePalette {
  name: string;
  wall: string;
  wallShade: string;
  floor: string;
  furniture: string;
  accent: string;
  ink: string;
}

const STYLE_PALETTES: Array<[string[], CorePalette]> = [
  [
    ['japandi', 'wabi', 'zen'],
    { name: 'Japandi', wall: '#e8e2d6', wallShade: '#d8d0c0', floor: '#b89d7a', furniture: '#8a7460', accent: '#5f6c5d', ink: '#3f3a33' },
  ],
  [
    ['scandinavian', 'scandi', 'bắc âu', 'bac au'],
    { name: 'Scandinavian', wall: '#f2f0ec', wallShade: '#e2ded6', floor: '#d9c6a5', furniture: '#9aa4a8', accent: '#c96f4a', ink: '#42403c' },
  ],
  [
    ['indochine', 'đông dương', 'dong duong', 'colonial'],
    { name: 'Indochine', wall: '#e9dfc8', wallShade: '#d6c8a8', floor: '#6f4f35', furniture: '#4c3b2a', accent: '#2f5d50', ink: '#33291d' },
  ],
  [
    ['luxury', 'sang trọng', 'sang trong', 'marble', 'đá', 'gold'],
    { name: 'Modern Luxury', wall: '#e6e3de', wallShade: '#d2cec7', floor: '#c9c2b6', furniture: '#6d675e', accent: '#b08d57', ink: '#33302b' },
  ],
  [
    ['industrial', 'brick', 'concrete', 'bê tông', 'be tong'],
    { name: 'Industrial', wall: '#c9c4bc', wallShade: '#a8a29a', floor: '#8f8a82', furniture: '#4d4a45', accent: '#a4552f', ink: '#2e2c29' },
  ],
];

const DEFAULT_PALETTE: CorePalette = {
  name: 'Neutral',
  wall: '#ece7de',
  wallShade: '#dcd5c9',
  floor: '#c4ab88',
  furniture: '#83745f',
  accent: '#71624d',
  ink: '#3b362e',
};

/** Đọc phong cách từ prompt → palette tất định (không nhận diện được → Neutral). */
export function detectPalette(prompt: string): CorePalette {
  const p = prompt.toLowerCase();
  for (const [keys, pal] of STYLE_PALETTES) {
    if (keys.some((k) => p.includes(k))) return pal;
  }
  return DEFAULT_PALETTE;
}

/** Khổ ảnh theo tỉ lệ khung của node. */
export function sizeForRatio(ratio: string): { w: number; h: number } {
  switch (ratio) {
    case '1:1':
      return { w: 640, h: 640 };
    case '4:3':
      return { w: 736, h: 552 };
    case '9:16':
      return { w: 432, h: 768 };
    default:
      return { w: 768, h: 432 }; // 16:9
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Bàn ghế silhouette theo loại phòng — toạ độ trong hệ 100×56 (viewBox chuẩn hoá). */
function furnitureShapes(room: CoreRoom, pal: CorePalette, jitter: number): string {
  const f = pal.furniture;
  const a = pal.accent;
  const dx = (jitter % 7) - 3; // dịch nhẹ tất định theo prompt
  switch (room) {
    case 'bedroom':
      return `
  <rect x="${28 + dx}" y="30" width="34" height="14" rx="1.5" fill="${f}"/>
  <rect x="${28 + dx}" y="24" width="34" height="7" rx="1" fill="${a}" opacity="0.85"/>
  <rect x="${26 + dx}" y="22" width="4" height="22" rx="1" fill="${pal.ink}" opacity="0.6"/>
  <rect x="${70 + dx}" y="34" width="9" height="10" rx="0.8" fill="${f}" opacity="0.8"/>`;
    case 'kitchen':
      return `
  <rect x="${14 + dx}" y="26" width="30" height="18" rx="1" fill="${f}"/>
  <rect x="${14 + dx}" y="24" width="30" height="2.6" fill="${a}"/>
  <rect x="${56 + dx}" y="32" width="22" height="12" rx="1.2" fill="${f}" opacity="0.9"/>
  <circle cx="${62 + dx}" cy="30" r="2.6" fill="${a}"/>
  <circle cx="${72 + dx}" cy="30" r="2.6" fill="${a}"/>`;
    case 'bathroom':
      return `
  <rect x="${20 + dx}" y="32" width="30" height="12" rx="5" fill="#f4f2ee"/>
  <rect x="${20 + dx}" y="32" width="30" height="12" rx="5" fill="none" stroke="${f}" stroke-width="1"/>
  <rect x="${62 + dx}" y="26" width="14" height="18" rx="1" fill="${f}" opacity="0.85"/>
  <circle cx="${69 + dx}" cy="24" r="3" fill="${a}" opacity="0.9"/>`;
    case 'office':
      return `
  <rect x="${26 + dx}" y="30" width="36" height="2.6" fill="${f}"/>
  <rect x="${28 + dx}" y="32.6" width="3" height="11" fill="${f}"/>
  <rect x="${55 + dx}" y="32.6" width="3" height="11" fill="${f}"/>
  <rect x="${38 + dx}" y="22" width="12" height="8" rx="1" fill="${pal.ink}" opacity="0.75"/>
  <rect x="${66 + dx}" y="28" width="10" height="16" rx="1.4" fill="${a}" opacity="0.85"/>`;
    default: // living
      return `
  <rect x="${24 + dx}" y="32" width="34" height="10" rx="2" fill="${f}"/>
  <rect x="${24 + dx}" y="26" width="34" height="7" rx="2" fill="${f}" opacity="0.85"/>
  <rect x="${22 + dx}" y="30" width="4" height="12" rx="1.4" fill="${f}"/>
  <rect x="${56 + dx}" y="30" width="4" height="12" rx="1.4" fill="${f}"/>
  <rect x="${64 + dx}" y="38" width="16" height="5" rx="1" fill="${a}" opacity="0.9"/>
  <circle cx="${16 + dx}" cy="26" r="4.5" fill="${pal.accent}" opacity="0.55"/>`;
  }
}

export interface CoreImage {
  /** data-URI SVG — kết quả thật của tầng lõi */
  dataUri: string;
  room: CoreRoom;
  styleName: string;
  /** ghi chú tầng chạy — node đưa thẳng ra UI */
  note: string;
}

/**
 * Prompt → concept sketch tất định. Cùng (prompt, ratio) luôn cho cùng 1 ảnh.
 * Ảnh LUÔN mang nhãn "LÕI TẤT ĐỊNH · KHÔNG AI" ở footer.
 */
export function text2imageCore(prompt: string, ratio = '16:9'): CoreImage {
  const room = detectRoom(prompt);
  const pal = detectPalette(prompt);
  const { w, h } = sizeForRatio(ratio);
  const seed = hashSeed(`${prompt}|${ratio}`);
  const label = 'LÕI TẤT ĐỊNH · KHÔNG AI';
  const excerpt = prompt.trim().slice(0, 64) + (prompt.trim().length > 64 ? '…' : '');
  // viewBox 100×56: 0–40 tường, 40–48 sàn, 48–56 footer nhãn
  const winX = 8 + (seed % 5);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 100 56" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="wl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${pal.wall}"/><stop offset="1" stop-color="${pal.wallShade}"/>
    </linearGradient>
    <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${pal.floor}"/><stop offset="1" stop-color="${pal.wallShade}"/>
    </linearGradient>
  </defs>
  <rect width="100" height="40" fill="url(#wl)"/>
  <rect y="40" width="100" height="9" fill="url(#fl)"/>
  <rect x="${winX}" y="8" width="14" height="22" fill="#f7f4ec" opacity="0.92"/>
  <rect x="${winX}" y="8" width="14" height="22" fill="none" stroke="${pal.ink}" stroke-width="0.5" opacity="0.5"/>
  <line x1="${winX + 7}" y1="8" x2="${winX + 7}" y2="30" stroke="${pal.ink}" stroke-width="0.4" opacity="0.4"/>
  <polygon points="${winX},30 ${winX + 14},30 ${winX + 22},44 ${winX - 6},44" fill="#fffdf5" opacity="0.28"/>
  ${furnitureShapes(room, pal, seed)}
  <line x1="0" y1="40" x2="100" y2="40" stroke="${pal.ink}" stroke-width="0.35" opacity="0.4"/>
  <rect y="48" width="100" height="8" fill="${pal.ink}"/>
  <text x="3" y="51.4" font-family="system-ui" font-size="2.4" fill="#f4efe6" font-weight="600">${esc(label)} · ${esc(pal.name)}</text>
  <text x="3" y="54.6" font-family="system-ui" font-size="2" fill="#cfc8ba">${esc(excerpt)}</text>
</svg>`.trim();
  return {
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    room,
    styleName: pal.name,
    note: `Tầng lõi tất định (không AI) — concept sketch ${pal.name} · ${room}. Thêm NVIDIA_API_KEY / FAL_KEY để render AI.`,
  };
}
