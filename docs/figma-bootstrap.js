/**
 * InteriorFlow — Bootstrap Figma Design System
 * Chạy bằng Figma Plugin API (agent Figma, hoặc plugin console).
 * Tạo: 14 page khớp route app + Variables 2 mode (Dark/Light) + frame rỗng.
 *
 * Token lấy từ code thật: app/globals.css (25/07/2026)
 * Chi tiết bàn giao: docs/FIGMA-HANDOFF.md
 *
 * CÁCH DÙNG
 * - Với agent Figma: dán toàn bộ file này, yêu cầu "chạy script này trong file của tôi".
 * - Chạy từng BƯỚC (1 → 4), không chạy hết một lần (Figma hay lỗi khi 1 script làm quá nhiều).
 */

/* ─────────────────────────────────────────────────────────────
 * BƯỚC 1 · Đổi tên file + tạo 14 page
 * ───────────────────────────────────────────────────────────── */
async function step1_pages() {
  figma.root.name = 'InteriorFlow · Design System';

  const wanted = [
    '00 · Foundations',
    '01 · Components',
    '10 · Global / Login',
    '11 · Global / Intro',
    '12 · Global / Gallery',
    '13 · Global / Library',
    '14 · Global / Settings',
    '20 · Project / Overview',
    '21 · Project / CAD',
    '22 · Project / Render',
    '23 · Project / Present',
    '24 · Project / Photo',
    '25 · Project / Notebook',
    '30 · Present mode',
  ];

  const existing = figma.root.children.map((p) => p.name);
  const created = [];
  for (const name of wanted) {
    if (!existing.includes(name)) {
      const p = figma.createPage();
      p.name = name;
      created.push({ name, id: p.id });
    }
  }
  return { fileName: figma.root.name, created, all: figma.root.children.map((p) => p.name) };
}

/* ─────────────────────────────────────────────────────────────
 * BƯỚC 2 · Variables — collection "IF Core", 2 mode Dark/Light
 * Token đúng tên biến CSS trong code → đổi màu ở Figma là code theo được.
 * ───────────────────────────────────────────────────────────── */
const hex = (h) => {
  const s = h.replace('#', '');
  return {
    r: parseInt(s.slice(0, 2), 16) / 255,
    g: parseInt(s.slice(2, 4), 16) / 255,
    b: parseInt(s.slice(4, 6), 16) / 255,
  };
};

// [tên biến, giá trị Dark, giá trị Light]
const COLORS = [
  ['bg', '#0C0C0E', '#F2EFE9'],
  ['panel', '#141417', '#FAF8F4'],
  ['card', '#1A1A1E', '#FFFFFF'],
  ['field', '#202024', '#F4F1EB'],
  ['hover', '#2A2A30', '#E9E5DD'],
  ['border', '#2A2A31', '#E3DED4'],
  ['border-strong', '#3D3D45', '#CBC4B6'],
  ['dots', '#26262D', '#DDD8CE'],
  // accent giống nhau ở 2 mode
  ['accent', '#8B7CF7', '#8B7CF7'],
  ['accent-strong', '#7C6CF0', '#7C6CF0'],
];

const NUMBERS = [
  ['radius-sm', 10],
  ['radius-md', 14], // mặc định
  ['radius-lg', 20],
  ['radius-xl', 28],
  ['blur', 22],
  ['blur-strong', 40],
];

async function step2_variables() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let col = collections.find((c) => c.name === 'IF Core');
  if (!col) col = figma.variables.createVariableCollection('IF Core');

  // mode 1 = Dark (rename mode mặc định), mode 2 = Light
  const darkId = col.modes[0].modeId;
  col.renameMode(darkId, 'Dark');
  let lightId = (col.modes.find((m) => m.name === 'Light') || {}).modeId;
  if (!lightId) lightId = col.addMode('Light');

  const made = [];

  for (const [name, dark, light] of COLORS) {
    const v = figma.variables.createVariable(`color/${name}`, col, 'COLOR');
    v.scopes = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];
    v.setValueForMode(darkId, hex(dark));
    v.setValueForMode(lightId, hex(light));
    made.push(v.id);
  }

  for (const [name, val] of NUMBERS) {
    const v = figma.variables.createVariable(`size/${name}`, col, 'FLOAT');
    v.scopes = name.startsWith('radius') ? ['CORNER_RADIUS'] : ['ALL_SCOPES'];
    v.setValueForMode(darkId, val);
    v.setValueForMode(lightId, val);
    made.push(v.id);
  }

  return { collectionId: col.id, modes: col.modes.map((m) => m.name), variableIds: made };
}

/* ─────────────────────────────────────────────────────────────
 * BƯỚC 3 · Effect styles — kính mờ + đổ bóng (đặc trưng của app)
 * ───────────────────────────────────────────────────────────── */
async function step3_effects() {
  const made = [];

  const shadows = [
    ['Shadow / Sheet', 12, 40, -12, 0.70], // modal, sheet
    ['Shadow / Pop', 8, 30, -8, 0.65], // popover
    ['Shadow / Node', 6, 20, -8, 0.60], // node trên canvas
  ];
  for (const [name, y, blur, spread, a] of shadows) {
    const s = figma.createEffectStyle();
    s.name = name;
    s.effects = [
      {
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a },
        offset: { x: 0, y },
        radius: blur,
        spread,
        visible: true,
        blendMode: 'NORMAL',
      },
    ];
    made.push(s.id);
  }

  const blurs = [
    ['Glass / Blur 22', 22], // panel, header
    ['Glass / Blur 40', 40], // modal
  ];
  for (const [name, radius] of blurs) {
    const s = figma.createEffectStyle();
    s.name = name;
    s.effects = [{ type: 'BACKGROUND_BLUR', radius, visible: true }];
    made.push(s.id);
  }

  return { effectStyleIds: made };
}

/* ─────────────────────────────────────────────────────────────
 * BƯỚC 4 · Frame rỗng cho từng màn (chạy RIÊNG cho mỗi page)
 * Gọi: await step4_frames('21 · Project / CAD')
 * Đặt tên frame = "route — trạng thái" để bàn giao code không lệch.
 * ───────────────────────────────────────────────────────────── */
const SCREENS = {
  '10 · Global / Login': { route: '/login', states: ['mặc định', 'đăng ký', 'lỗi sai mật khẩu'] },
  '11 · Global / Intro': { route: '/intro', states: ['cảnh 1', 'cảnh 2', 'cảnh 3', 'cảnh 4'] },
  '12 · Global / Gallery': { route: '/', states: ['có dự án', 'trống (user mới)', 'Vitals mở'] },
  '13 · Global / Library': { route: '/library/ingest', states: ['mặc định', 'đang phân loại'] },
  '14 · Global / Settings': { route: '/settings/avatar', states: ['mặc định'] },
  '20 · Project / Overview': { route: '/projects/[id]/overview', states: ['mặc định', 'trống'] },
  '21 · Project / CAD': {
    route: '/projects/[id]/cad',
    states: ['trống', 'đang vẽ', 'panel Zone mở', 'khung tên', 'Thống kê + Chú giải'],
  },
  '22 · Project / Render': {
    route: '/projects/[id]/render',
    states: ['canvas trống', 'flow 3 node', 'node đang chạy', 'Thư viện Node mở', 'Command ⌘K'],
  },
  '23 · Project / Present': {
    route: '/projects/[id]/present',
    states: ['mặc định', 'panel Mẫu', 'Brand Kit', 'slide sorter'],
  },
  '24 · Project / Photo': { route: '/projects/[id]/photo', states: ['mặc định'] },
  '25 · Project / Notebook': { route: '/projects/[id]/notebook', states: ['chưa có nguồn', 'có nguồn + chat'] },
  '30 · Present mode': { route: '/present', states: ['16:9'] },
};

// Desktop 1440×900 là khổ chính. CAD/Render chỉ desktop.
async function step4_frames(pageName) {
  const page = figma.root.children.find((p) => p.name === pageName);
  if (!page) throw new Error('Không thấy page: ' + pageName);
  await figma.setCurrentPageAsync(page);

  const def = SCREENS[pageName];
  if (!def) throw new Error('Page này không có định nghĩa màn: ' + pageName);

  const W = 1440;
  const H = 900;
  const GAP = 120;
  const created = [];

  def.states.forEach((state, i) => {
    const f = figma.createFrame();
    f.name = `${def.route} — ${state}`;
    f.resize(W, H);
    f.x = i * (W + GAP);
    f.y = 0;
    f.fills = [{ type: 'SOLID', color: hex('#0C0C0E') }]; // Dark mặc định
    page.appendChild(f);
    created.push({ id: f.id, name: f.name });
  });

  return { page: pageName, createdFrames: created };
}

/* ─────────────────────────────────────────────────────────────
 * GHI CHÚ CHO NGƯỜI/AGENT LÀM TIẾP
 * ─────────────────────────────────────────────────────────────
 * - Font: cài "Be Vietnam Pro" (Regular 400 / Medium 500 / SemiBold 600).
 *   ⚠️ Trong Figma style là "Semi Bold" (có dấu cách), không phải "SemiBold".
 * - Kính mờ: fill rgba(20,20,23,0.68) + Background blur 22px + stroke 1px rgba(255,255,255,0.06).
 * - Easing chuyển động: cubic-bezier(0.32, 0.72, 0, 1); nhanh 180ms · thường 320ms.
 * - Mỗi frame nên làm CẢ Dark + Light (đổi mode của collection "IF Core").
 * - Component ưu tiên dựng trước: Node card (4 trạng thái) · Panel kính · Modal · Header.
 * - KHÔNG dùng nhận diện studio nào trong UI app — thương hiệu trong nội dung dự án
 *   đến từ Brand Kit của từng dự án (người dùng tự nhập).
 */
