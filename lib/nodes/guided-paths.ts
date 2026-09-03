/**
 * lib/nodes/guided-paths.ts — ĐƯỜNG DẪN CÓ HƯỚNG DẪN (Slice 10, 03/09): công thức THUẦN dựng một
 * chuỗi node THẬT (ảnh → hiểu ảnh → dựng → hồ sơ) cho người mới, không giấu node nào.
 *
 * ── LOOK INSIDE TRƯỚC (luật B25 NO-REBUILD — negative evidence, đo 03/09) ────────────────────
 *  · Engine chạy: `lib/execution.ts` `runNode()` (upstream + hàng đợi + cache-skip theo
 *    `inputHash` + hoàn credit khi lỗi) — KHÔNG viết engine mới; đường dẫn chỉ DỰNG graph.
 *  · Huỷ: `useFlowStore.requestCancelFlowRun()` — có sẵn. Hoàn tác: `snapshot()`/`undo()` — có sẵn.
 *  · "Nút tổng" (`macro.ts` + `NodeGroup.isMacro`): node con vẫn là node THẬT trong `nodes[]`,
 *    thu gọn chỉ đổi `hidden`. ⇒ đường dẫn dựng xong = MỘT nút tổng MỞ SẴN (collapsed:false)
 *    — người mới thấy một khối có tên, người thạo thấy nguyên chuỗi node để sửa. Không có
 *    "graph engine thứ hai", không có node giả.
 *  · Thẻ Tool Mode (`lib/render-studio/task-cards.ts`) dựng graph 2 node cho MỘT tác vụ;
 *    đường dẫn là bản NHIỀU bước, đi qua nhiều họ (`families.ts`). Hai thứ bổ sung nhau.
 *  · Hợp đồng cạnh: cùng luật `isValidConnection` (FlowCanvas.tsx) — chỉ so `dataType` cổng ra ↔
 *    cổng vào, 1 cổng vào nhận đúng 1 dây. `planGuidedPath()` kiểm TRƯỚC khi dựng, lệch là
 *    `issues` (không dựng graph hỏng rồi để người dùng đi tìm dây đỏ).
 *
 * Hàm THUẦN, nhận `lookupDef` từ ngoài (khuôn `DefLookup` của `macro.ts`) — test chạy được mà
 * không kéo `registry.ts`. Import TƯƠNG ĐỐI (sucrase-node không resolve `@/`).
 */
import type { DataType, NodeDefinition } from '../types';
import { familyOf, type NodeFamily } from './families';
import type { MacroIcon } from './macro';

export type DefLookup = (defType: string) => NodeDefinition;

export interface GuidedStep {
  /** khoá ổn định TRONG đường dẫn (đích của cạnh) — không phải node id */
  key: string;
  defType: string;
  /** 1 câu cho người mới: bước này làm gì */
  why: string;
  whyEn: string;
  /** tham số đặt sẵn (đè lên default của node) */
  params?: Record<string, string | number>;
  /** tham số đưa ra mặt nút tổng (id param) */
  expose?: string[];
}

export interface GuidedEdge {
  from: string;
  fromHandle: string;
  to: string;
  toHandle: string;
}

export interface GuidedPath {
  id: string;
  label: string;
  labelEn: string;
  blurb: string;
  blurbEn: string;
  /** sản phẩm cuối — nói bằng ngôn ngữ nghề */
  output: string;
  outputEn: string;
  icon: MacroIcon;
  steps: GuidedStep[];
  edges: GuidedEdge[];
}

/**
 * 5 đường dẫn — mỗi đường đi qua ≥ 2 họ, kết thúc ở một thứ NGHỀ dùng được (bảng món, deck,
 * board, phim, ảnh bám ý). Mọi `defType`/handle đều là node THẬT — `guided-paths.test.ts` đối
 * chiếu với source `registry.ts`/`defs/*.ts`.
 */
export const GUIDED_PATHS: GuidedPath[] = [
  {
    id: 'anh-do-bang-mon',
    label: 'Ảnh → Đo → Bảng món',
    labelEn: 'Image → Measure → Item table',
    blurb: 'Từ một ảnh món đồ, đo kích thước rồi ghi thành dòng bảng món. Không AI, 0 credit.',
    blurbEn: 'From one furniture photo, measure it and write a BOQ-style item row. No AI, 0 credit.',
    output: 'Bảng món (BOQ) có kích thước đo được',
    outputEn: 'Item table with measured sizes',
    icon: 'grid',
    steps: [
      { key: 'anh', defType: 'input.image', why: 'Ảnh món đồ (nền càng sạch càng đo chuẩn).', whyEn: 'Photo of the item (clean background measures best).' },
      { key: 'do', defType: 'vision.measureobject', why: 'Máy đo kích thước từ ảnh, có cờ độ tin cậy.', whyEn: 'Measure size from the image, with a confidence flag.', expose: ['category'] },
      { key: 'bang', defType: 'util.ffetable', why: 'Ghi thành một dòng bảng món — chỉ số đo được đi vào bảng.', whyEn: 'Write one item row — only measured numbers enter the table.', expose: ['name', 'qty', 'room'] },
    ],
    edges: [
      { from: 'anh', fromHandle: 'image', to: 'do', toHandle: 'image' },
      { from: 'do', fromHandle: 'measurement', to: 'bang', toHandle: 'measurement' },
      { from: 'anh', fromHandle: 'image', to: 'bang', toHandle: 'cutout' },
    ],
  },
  {
    id: 'khoi-trang-den-slide',
    label: 'Khối trắng → Ảnh thật → Slide',
    labelEn: 'Clay → Photoreal → Slide',
    blurb: 'Render khối trắng từ 3ds Max → ảnh thật khoá hình khối → phóng to → dựng slide và xuất deck.',
    blurbEn: 'Clay render from 3ds Max → photoreal locked to geometry → upscale → compose a slide and export the deck.',
    output: 'Deck có hero image render',
    outputEn: 'Deck with a rendered hero image',
    icon: 'sparkle',
    steps: [
      { key: 'anh', defType: 'input.image', why: 'Ảnh khối trắng (clay) — hình học đã cố định.', whyEn: 'Clay render — geometry already fixed.' },
      { key: 'phongcach', defType: 'input.stylepreset', why: 'Chọn phong cách — thành prompt cho bước dựng.', whyEn: 'Pick a style — becomes the render prompt.', expose: ['style'] },
      { key: 'dung', defType: 'ai.clay2render', why: 'AI sơn vật liệu/ánh sáng BÊN TRONG khối (ControlNet depth) — không bịa hình.', whyEn: 'AI paints material/light INSIDE the massing (ControlNet depth) — no invented geometry.', expose: ['preserve'] },
      { key: 'phongto', defType: 'ai.upscale', why: 'Phóng to để đủ dpi in/trình chiếu.', whyEn: 'Upscale for print/presentation dpi.', expose: ['scale'] },
      { key: 'noidung', defType: 'slide.concept', why: 'Chữ trên slide: kicker, tiêu đề, mô tả.', whyEn: 'Slide text: kicker, title, body.', expose: ['title'] },
      { key: 'slide', defType: 'slide.composer', why: 'Dựng slide từ chữ + ảnh hero — tất định, không AI.', whyEn: 'Compose the slide from text + hero — deterministic, no AI.', expose: ['layout'] },
      { key: 'deck', defType: 'slide.deck', why: 'Xuất deck (chữ vẫn sửa được ở bước sau).', whyEn: 'Export the deck (text stays editable downstream).', expose: ['deckName'] },
    ],
    edges: [
      { from: 'anh', fromHandle: 'image', to: 'dung', toHandle: 'image' },
      { from: 'phongcach', fromHandle: 'text', to: 'dung', toHandle: 'prompt' },
      { from: 'dung', fromHandle: 'image', to: 'phongto', toHandle: 'image' },
      { from: 'noidung', fromHandle: 'text', to: 'slide', toHandle: 'content' },
      { from: 'phongto', fromHandle: 'image', to: 'slide', toHandle: 'hero' },
      { from: 'slide', fromHandle: 'image', to: 'deck', toHandle: 'slide1' },
    ],
  },
  {
    id: 'mau-the-vat-lieu-board',
    label: 'Ảnh mẫu → Thẻ vật liệu → Board',
    labelEn: 'Swatch → Material card → Board',
    blurb: 'Ảnh mẫu vật liệu → thẻ vật liệu có mã/nhà cung cấp → ghép lên board. Không AI, 0 credit.',
    blurbEn: 'Material swatch → material card with code/supplier → placed on a board. No AI, 0 credit.',
    output: 'Board vật liệu có mã + nhà cung cấp',
    outputEn: 'Material board with codes + suppliers',
    icon: 'layers',
    steps: [
      { key: 'mau', defType: 'input.image', why: 'Ảnh mẫu vật liệu (chụp swatch, texture).', whyEn: 'Swatch/texture photo.' },
      { key: 'the', defType: 'util.materialnote', why: 'Điền tên · mã · nhà cung cấp — máy vẽ thẻ vật liệu.', whyEn: 'Fill name · code · supplier — the app draws the card.', expose: ['name', 'code', 'supplier'] },
      { key: 'board', defType: 'out.board', why: 'Ghép thẻ lên board dự án.', whyEn: 'Place the card on the project board.', expose: ['projectName'] },
    ],
    edges: [
      { from: 'mau', fromHandle: 'image', to: 'the', toHandle: 'swatch' },
      { from: 'the', fromHandle: 'image', to: 'board', toHandle: 'image1' },
    ],
  },
  {
    id: 'goc-may-anh-phim',
    label: 'Góc máy → Ảnh → Phim',
    labelEn: 'Camera → Image → Movie',
    blurb: 'Chọn góc máy/tiêu cự (tất định) → AI tạo ảnh theo góc đó → AI dựng phim ngắn từ ảnh.',
    blurbEn: 'Pick camera/lens (deterministic) → AI image from that angle → AI short movie from the image.',
    output: 'Phim ngắn (mp4) từ một góc máy',
    outputEn: 'Short movie (mp4) from one camera angle',
    icon: 'sun',
    steps: [
      { key: 'cam', defType: 'three.camera', why: 'Góc máy · tiêu cự · khung — thành prompt góc máy.', whyEn: 'Angle · lens · frame — becomes a camera prompt.', expose: ['preset', 'lens'] },
      { key: 'anh', defType: 'ai.text2image', why: 'AI tạo ảnh theo prompt + góc máy.', whyEn: 'AI image from prompt + camera.' },
      { key: 'phim', defType: 'ai.image2video', why: 'AI dựng phim ngắn từ ảnh (chỉ chạy ở mức AI kết nối).', whyEn: 'AI short movie from the image (connected AI tier only).', expose: ['duration'] },
    ],
    edges: [
      { from: 'cam', fromHandle: 'prompt', to: 'anh', toHandle: 'prompt' },
      { from: 'cam', fromHandle: 'camera', to: 'anh', toHandle: 'camera' },
      { from: 'anh', fromHandle: 'image', to: 'phim', toHandle: 'image' },
    ],
  },
  {
    id: 'tham-khao-render-bam-y',
    label: 'Ảnh mẫu → Phiếu → Render bám ý',
    labelEn: 'Reference → Sheet → Grounded render',
    blurb: 'Đọc ảnh tham khảo ra phiếu 4 cấp (người duyệt) → tách mảng trên ảnh gốc → render đúng mảng, không trộn toàn cục.',
    blurbEn: 'Read a reference into a 4-level sheet (human-approved) → mask regions on the base image → render per region, no global blend.',
    output: 'Ảnh render bám ý theo mảng',
    outputEn: 'Region-grounded render',
    icon: 'box',
    steps: [
      { key: 'mau', defType: 'input.image', why: 'Ảnh tham khảo (gu, vật liệu, không khí).', whyEn: 'Reference image (taste, materials, mood).' },
      { key: 'phieu', defType: 'ai.refsheet', why: 'Máy lập phiếu 4 cấp — bạn duyệt trước khi áp.', whyEn: 'The app drafts a 4-level sheet — you approve before applying.', expose: ['mode'] },
      { key: 'goc', defType: 'input.image', why: 'Ảnh trọng tâm (A) — thứ sẽ được render lại.', whyEn: 'Base image (A) — the one being re-rendered.' },
      { key: 'mang', defType: 'ai.idmask', why: 'Tách ảnh gốc thành mảng, chọn mảng cần áp.', whyEn: 'Split the base image into regions, pick one.', expose: ['pick'] },
      { key: 'render', defType: 'ai.regionrender', why: 'Render đúng mảng đã chọn theo phiếu đã duyệt.', whyEn: 'Render only the chosen region per the approved sheet.', expose: ['approve', 'region', 'keep'] },
    ],
    edges: [
      { from: 'mau', fromHandle: 'image', to: 'phieu', toHandle: 'image' },
      { from: 'goc', fromHandle: 'image', to: 'mang', toHandle: 'image' },
      { from: 'goc', fromHandle: 'image', to: 'render', toHandle: 'image' },
      { from: 'mang', fromHandle: 'mask', to: 'render', toHandle: 'mask' },
      { from: 'phieu', fromHandle: 'sheet', to: 'render', toHandle: 'sheet' },
    ],
  },
];

export function guidedPathById(id: string): GuidedPath | undefined {
  return GUIDED_PATHS.find((p) => p.id === id);
}

/* ═══════════════════════════ kế hoạch dựng (thuần) ═══════════════════════════ */

export interface PlannedNode {
  key: string;
  defType: string;
  position: { x: number; y: number };
  /** tham số đặt sẵn — nơi gọi trộn lên `defaultParams(def)` */
  params: Record<string, string | number>;
  family: NodeFamily;
  creditCost: number;
  title: string;
}

export interface PlannedEdge {
  fromKey: string;
  fromHandle: string;
  toKey: string;
  toHandle: string;
  dataType: DataType;
}

export interface GuidedPlan {
  pathId: string;
  nodes: PlannedNode[];
  edges: PlannedEdge[];
  /** lệch hợp đồng — có 1 dòng là KHÔNG dựng */
  issues: string[];
  creditTotal: number;
  /** số bước tốn credit (= gọi AI) */
  aiSteps: number;
  families: NodeFamily[];
}

/** Khoảng đặt node — cùng nhịp lưới 16px của canvas (snapGrid [16,16]), node rộng ~260. */
const COL_W = 320;
const ROW_H = 320; // node cao nhất (bảng món, sửa vùng) ~300px — 2 node cùng cột không đè nhau

/**
 * Lập kế hoạch dựng: kiểm hợp đồng cạnh (dataType khớp · handle tồn tại · 1 cổng vào 1 dây ·
 * không vòng) + xếp vị trí tất định (cột = độ sâu topo, hàng = thứ tự trong cột). Cùng `path`,
 * cùng `origin` ⇒ cùng kết quả (idempotent), không random.
 */
export function planGuidedPath(path: GuidedPath, lookupDef: DefLookup, origin = { x: 0, y: 0 }): GuidedPlan {
  const issues: string[] = [];
  const defs = new Map<string, NodeDefinition>();
  const keys = new Set<string>();
  for (const s of path.steps) {
    if (keys.has(s.key)) issues.push(`Bước "${s.key}" khai 2 lần.`);
    keys.add(s.key);
    try {
      defs.set(s.key, lookupDef(s.defType));
    } catch {
      issues.push(`Bước "${s.key}": node "${s.defType}" không có trong registry.`);
    }
  }

  const edges: PlannedEdge[] = [];
  const usedInputs = new Set<string>();
  for (const e of path.edges) {
    const from = defs.get(e.from);
    const to = defs.get(e.to);
    if (!from || !to) {
      if (keys.has(e.from) && keys.has(e.to)) continue; // đã báo ở trên
      issues.push(`Dây ${e.from}.${e.fromHandle} → ${e.to}.${e.toHandle}: bước không tồn tại.`);
      continue;
    }
    const out = from.outputs.find((o) => o.id === e.fromHandle);
    const inp = to.inputs.find((i) => i.id === e.toHandle);
    if (!out) { issues.push(`"${from.title}" không có cổng ra "${e.fromHandle}".`); continue; }
    if (!inp) { issues.push(`"${to.title}" không có cổng vào "${e.toHandle}".`); continue; }
    if (out.dataType !== inp.dataType) {
      issues.push(`Không nối được: "${from.title}".${out.label} (${out.dataType}) ≠ "${to.title}".${inp.label} (${inp.dataType}).`);
      continue;
    }
    const inKey = `${e.to}.${e.toHandle}`;
    if (usedInputs.has(inKey)) { issues.push(`Cổng vào ${inKey} nhận 2 dây — 1 cổng chỉ nhận 1.`); continue; }
    usedInputs.add(inKey);
    edges.push({ fromKey: e.from, fromHandle: e.fromHandle, toKey: e.to, toHandle: e.toHandle, dataType: out.dataType });
  }

  // độ sâu topo (cột) — DFS có bắt vòng
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const depthOf = (k: string): number => {
    if (depth.has(k)) return depth.get(k)!;
    if (visiting.has(k)) { issues.push(`Đường dẫn có vòng lặp qua "${k}".`); return 0; }
    visiting.add(k);
    const ins = edges.filter((e) => e.toKey === k);
    const d = ins.length ? Math.max(...ins.map((e) => depthOf(e.fromKey))) + 1 : 0;
    visiting.delete(k);
    depth.set(k, d);
    return d;
  };
  for (const s of path.steps) depthOf(s.key);

  const rowInCol = new Map<number, number>();
  const nodes: PlannedNode[] = [];
  let creditTotal = 0;
  let aiSteps = 0;
  for (const s of path.steps) {
    const def = defs.get(s.key);
    if (!def) continue;
    const col = depth.get(s.key) ?? 0;
    const row = rowInCol.get(col) ?? 0;
    rowInCol.set(col, row + 1);
    creditTotal += def.creditCost;
    if (def.creditCost > 0) aiSteps += 1;
    nodes.push({
      key: s.key,
      defType: s.defType,
      position: { x: origin.x + col * COL_W, y: origin.y + row * ROW_H },
      params: { ...(s.params ?? {}) },
      family: familyOf(s.defType),
      creditCost: def.creditCost,
      title: def.title,
    });
  }
  const families = [...new Set(nodes.map((n) => n.family))];
  return { pathId: path.id, nodes, edges, issues: [...new Set(issues)], creditTotal, aiSteps, families };
}

/**
 * Đường dẫn chạy được ở mức AI hiện tại không. Mức 1 (Không AI) khoá node tốn credit (registry.ts
 * `aiImages()` ném lỗi rõ) — nói TRƯỚC khi dựng, không để người mới bấm rồi gặp lỗi.
 */
export function pathReadiness(plan: GuidedPlan, aiTier: 1 | 2 | 3 | 4): { ok: boolean; reason?: string; reasonEn?: string } {
  if (plan.issues.length) return { ok: false, reason: plan.issues[0], reasonEn: plan.issues[0] };
  if (aiTier === 1 && plan.aiSteps > 0) {
    return {
      ok: false,
      reason: `Đang ở mức "Không AI" — ${plan.aiSteps} bước cần AI sẽ bị khoá. Đổi mức AI ở Cài đặt, hoặc chọn đường 0 credit.`,
      reasonEn: `AI tier is "No AI" — ${plan.aiSteps} AI step(s) would be locked. Change the tier in Settings or pick a 0-credit path.`,
    };
  }
  return { ok: true };
}

/** Nút "chạy đường dẫn" phải gọi `runNode()` cho node nào: node không có dây đi tiếp TRONG đường. */
export function planTerminals(plan: GuidedPlan): string[] {
  const hasDown = new Set(plan.edges.map((e) => e.fromKey));
  return plan.nodes.filter((n) => !hasDown.has(n.key)).map((n) => n.key);
}
