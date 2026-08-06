/**
 * lib/cad/dxf-plan.ts — ĐỌC NGỮ NGHĨA MẶT BẰNG từ `Doc` vừa nạp bằng `parseDxfEx()`
 * (phiếu DXF Nam Long 05/08, VIỆC 4). Hàm THUẦN, test bằng
 * `node_modules/.bin/sucrase-node lib/cad/dxf-plan.test.ts`.
 *
 * ⛔ **KHÔNG SUY ĐOÁN THAY NGƯỜI DÙNG (K3).** Mọi hàm ở đây trả về CẢ kết quả LẪN nguồn/độ tin
 * cậy; không tìm thấy thì trả `null` + lý do, tuyệt đối không trả một con số "trông có vẻ đúng".
 * Bài học của chính phiên này: thử lấy diện tích sàn bằng bao lồi (convex hull) của lớp mặt dựng
 * → lệch **+37% (TANG11)** và **+50% (TANG12)** so với số ghi trong khung tên. Ship con số đó thì
 * mọi phép chia khu phía sau đều sai mà nhìn vẫn "có số". Nên `planAreaCrossCheck()` thà trả
 * `method:'none'` còn hơn.
 *
 * ⚠️ TÊN LAYER LÀ QUY ƯỚC CỦA BỘ HỒ SƠ, KHÔNG PHẢI CHUẨN NGÀNH. Bộ Nam Long dùng
 * `A-Column`/`A-Wall`/`E-Stair`/`E-Wc`/`E-DimTruc`/`A-Par-Glass`. Hồ sơ studio khác sẽ khác ⇒ mọi
 * danh sách layer dưới đây đều là THAM SỐ mặc định, truyền đè được. Không hardcode vào thuật toán.
 */

import type { Doc, Entity, Pt } from './model';
import { entityBox } from './model';

/* ═══════════════════════ 0 · CỤM VẼ CHÍNH ═══════════════════════ */

/** Layer mang HÌNH CÔNG TRÌNH (khác hẳn layer ghi chú/kích thước — thứ hay nằm rải rất xa). */
export const DEFAULT_STRUCTURE_LAYERS = ['A-Column', 'A-Wall', 'A-Par-Glass', 'E-Par-Glass', 'E-Stair', 'E-Wc', 'LOUV'];

/** Layer LÕI CỨNG — thang, WC, hộp kỹ thuật. Vùng cấm động khi chia khu. */
export const DEFAULT_CORE_LAYERS = ['E-Stair', 'E-Wc'];

/** Layer mang nhãn trục (lưới cột). */
export const DEFAULT_GRID_LAYERS = ['E-DimTruc'];

export interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const boxOf = (pts: Pt[]): Box | null => {
  if (!pts.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
};

function layerNameMap(doc: Doc): Map<string, string> {
  return new Map(doc.layers.map((l) => [l.id, l.name]));
}

function centroid(e: Entity): Pt | null {
  const b = entityBox(e);
  if (!Number.isFinite(b.minX)) return null;
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
}

/**
 * KHUNG BAO CỦA CỤM VẼ CHÍNH — bỏ các bản sao parked xa trong model space.
 *
 * 🔴 BẮT BUỘC PHẢI CÓ, không phải phòng xa: `04_TANG8-TTT.dxf` chèn block "SDG" ba lần ở cách gốc
 * **12 km** (đã đối chiếu file thô — đúng nội dung file). Khung bao thô của nó ra
 * **12.311 × 15.492 m**; lấy số đó đi tính bất cứ thứ gì đều vô nghĩa.
 *
 * Cách làm: chỉ xét entity trên LAYER CÔNG TRÌNH (ghi chú/kích thước bị loại — chúng đông gấp
 * nhiều lần và kéo lệch cụm), băm centroid vào ô lưới `cellMm`, lấy ô đông nhất rồi loang sang ô
 * kề có ít nhất `minShare` phần entity so với ô đông nhất.
 */
export function mainClusterBox(
  doc: Doc,
  opts: { layers?: string[]; cellMm?: number; minShare?: number } = {},
): { box: Box; entities: Entity[]; droppedFar: number } | null {
  const layers = opts.layers ?? DEFAULT_STRUCTURE_LAYERS;
  const cell = opts.cellMm ?? 20_000;
  const minShare = opts.minShare ?? 0.02;
  const names = layerNameMap(doc);

  const pool = doc.entities.filter((e) => layers.includes(names.get(e.layer) ?? ''));
  if (!pool.length) return null;

  const bins = new Map<string, { n: number; cx: number; cy: number }>();
  const cellOf = (p: Pt) => `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)}`;
  for (const e of pool) {
    const c = centroid(e);
    if (!c) continue;
    const k = cellOf(c);
    const b = bins.get(k) ?? { n: 0, cx: Math.floor(c.x / cell), cy: Math.floor(c.y / cell) };
    b.n += 1;
    bins.set(k, b);
  }
  if (!bins.size) return null;

  const best = [...bins.values()].sort((a, b) => b.n - a.n)[0];
  const keep = new Set<string>();
  for (const [k, b] of bins) {
    // Ô kề (bán kính 2 ô) và đủ đông → cùng cụm. Bản sao cách 12 km không bao giờ lọt.
    if (Math.abs(b.cx - best.cx) <= 2 && Math.abs(b.cy - best.cy) <= 2 && b.n >= best.n * minShare) keep.add(k);
  }

  const inCluster: Entity[] = [];
  const pts: Pt[] = [];
  for (const e of pool) {
    const c = centroid(e);
    if (!c || !keep.has(cellOf(c))) continue;
    inCluster.push(e);
    const b = entityBox(e);
    pts.push({ x: b.minX, y: b.minY }, { x: b.maxX, y: b.maxY });
  }
  const box = boxOf(pts);
  if (!box) return null;
  return { box, entities: inCluster, droppedFar: pool.length - inCluster.length };
}

/* ═══════════════════════ 1 · LƯỚI CỘT (trục) ═══════════════════════ */

export interface GridAxis {
  /** nhãn trục người dùng thấy: 'B' · 'B1' · '2D' · '1' · '2'… */
  label: string;
  /** toạ độ trục theo phương vuông góc với nó (mm). */
  posMm: number;
}

export interface PlanGrid {
  /** trục theo phương X (nhãn thường là CHỮ) — sắp tăng dần theo `posMm`. */
  xAxes: GridAxis[];
  /** trục theo phương Y (nhãn thường là SỐ). */
  yAxes: GridAxis[];
  /** nhịp giữa các trục X liên tiếp (mm). */
  xSpansMm: number[];
  ySpansMm: number[];
  warnings: string[];
}

/** Nhãn trục hợp lệ: 1-2 chữ cái/số kiểu B · B1 · 2D · E · 1 · 12. Loại chữ dài (tên phòng). */
const AXIS_LABEL = /^(?:\d?[A-Za-z]\d?|\d{1,2})$/;

/**
 * Nhãn trục nằm trên layer trục, xếp thành HÀNG (cùng y) hoặc CỘT (cùng x). Phân loại bằng độ
 * lệch chuẩn: nhóm nào trải theo X mà gần như không trải theo Y thì đó là trục X, và ngược lại.
 *
 * ⚠️ `posMm` lấy từ VỊ TRÍ CHỮ, không phải đường trục — chữ nằm trong bong bóng đầu trục nên lệch
 * vài chục mm so với tim trục thật. Đủ để RÀNG BUỘC chia khu ("đừng cắt vách ngang cột"), KHÔNG
 * đủ để ghi kích thước hồ sơ. Ghi rõ chứ không để người sau tưởng là số đo chuẩn (N4).
 */
export function planGridAxes(doc: Doc, opts: { layers?: string[] } = {}): PlanGrid {
  const layers = opts.layers ?? DEFAULT_GRID_LAYERS;
  const names = layerNameMap(doc);
  const warnings: string[] = [];

  const labels = doc.entities
    .filter((e): e is Extract<Entity, { type: 'text' }> => e.type === 'text')
    .filter((e) => layers.includes(names.get(e.layer) ?? ''))
    .map((e) => ({ label: e.text.trim(), x: e.at.x, y: e.at.y }))
    .filter((t) => AXIS_LABEL.test(t.label));

  if (!labels.length) {
    warnings.push(`Không thấy nhãn trục nào trên layer ${layers.join('/')} — bản vẽ dùng quy ước layer khác, truyền tham số \`layers\` cho đúng hồ sơ.`);
    return { xAxes: [], yAxes: [], xSpansMm: [], ySpansMm: [], warnings };
  }

  const spread = (v: number[]) => (v.length < 2 ? 0 : Math.max(...v) - Math.min(...v));
  const xAxes: GridAxis[] = [];
  const yAxes: GridAxis[] = [];

  // Gom theo "hàng ngang" (y gần nhau) và "cột dọc" (x gần nhau); TOL rộng 1m vì chữ không thẳng hàng tuyệt đối.
  const TOL = 1000;
  const rows = new Map<number, typeof labels>();
  const cols = new Map<number, typeof labels>();
  for (const t of labels) {
    const rk = Math.round(t.y / TOL);
    const ck = Math.round(t.x / TOL);
    (rows.get(rk) ?? rows.set(rk, []).get(rk)!).push(t);
    (cols.get(ck) ?? cols.set(ck, []).get(ck)!).push(t);
  }
  const bestRow = [...rows.values()].sort((a, b) => b.length - a.length)[0] ?? [];
  const bestCol = [...cols.values()].sort((a, b) => b.length - a.length)[0] ?? [];

  if (bestRow.length >= 2 && spread(bestRow.map((t) => t.x)) > spread(bestRow.map((t) => t.y))) {
    for (const t of bestRow) xAxes.push({ label: t.label, posMm: t.x });
  }
  if (bestCol.length >= 2 && spread(bestCol.map((t) => t.y)) > spread(bestCol.map((t) => t.x))) {
    for (const t of bestCol) yAxes.push({ label: t.label, posMm: t.y });
  }

  xAxes.sort((a, b) => a.posMm - b.posMm);
  yAxes.sort((a, b) => a.posMm - b.posMm);
  const spans = (ax: GridAxis[]) => ax.slice(1).map((a, i) => Math.round(a.posMm - ax[i].posMm));

  if (!xAxes.length) warnings.push('Không dựng được trục theo phương X.');
  if (!yAxes.length) warnings.push('Không dựng được trục theo phương Y.');

  return { xAxes, yAxes, xSpansMm: spans(xAxes), ySpansMm: spans(yAxes), warnings };
}

/* ═══════════════════════ 2 · LÕI CỨNG (vùng cấm) ═══════════════════════ */

export interface CoreZone {
  /** layer sinh ra vùng này ('E-Stair' · 'E-Wc'…). */
  layer: string;
  box: Box;
  entityCount: number;
}

/**
 * Vùng LÕI CỨNG = khung bao của các entity theo từng layer lõi, TÁCH RIÊNG theo cụm liền kề để
 * hai buồng thang ở hai đầu sàn không bị gộp thành một hộp phủ kín cả sàn.
 */
export function planCoreZones(doc: Doc, opts: { layers?: string[]; gapMm?: number } = {}): CoreZone[] {
  const layers = opts.layers ?? DEFAULT_CORE_LAYERS;
  const gap = opts.gapMm ?? 3000;
  const names = layerNameMap(doc);
  const out: CoreZone[] = [];

  for (const lay of layers) {
    const ents = doc.entities.filter((e) => (names.get(e.layer) ?? '') === lay);
    if (!ents.length) continue;
    // Gom cụm đơn giản theo khoảng cách khung bao (đủ cho vài buồng thang/WC trên một sàn).
    const boxes = ents.map((e) => ({ e, b: entityBox(e) })).filter((x) => Number.isFinite(x.b.minX));
    const used = new Array(boxes.length).fill(false);
    for (let i = 0; i < boxes.length; i++) {
      if (used[i]) continue;
      let cur: Box = { ...boxes[i].b };
      used[i] = true;
      let n = 1;
      let grew = true;
      while (grew) {
        grew = false;
        for (let j = 0; j < boxes.length; j++) {
          if (used[j]) continue;
          const b = boxes[j].b;
          const overlap =
            b.minX <= cur.maxX + gap && b.maxX >= cur.minX - gap &&
            b.minY <= cur.maxY + gap && b.maxY >= cur.minY - gap;
          if (!overlap) continue;
          cur = {
            minX: Math.min(cur.minX, b.minX), minY: Math.min(cur.minY, b.minY),
            maxX: Math.max(cur.maxX, b.maxX), maxY: Math.max(cur.maxY, b.maxY),
          };
          used[j] = true;
          n += 1;
          grew = true;
        }
      }
      out.push({ layer: lay, box: cur, entityCount: n });
    }
  }
  return out.sort((a, b) => (b.box.maxX - b.box.minX) * (b.box.maxY - b.box.minY) - (a.box.maxX - a.box.minX) * (a.box.maxY - a.box.minY));
}

/* ═══════════════════════ 3 · DIỆN TÍCH KHAI TRONG KHUNG TÊN ═══════════════════════ */

/** '474 m2' · '474m²' · '1.234,5 m2' → 474 / 1234.5. Trả null khi không có chuỗi nào dạng đó. */
export function planDeclaredAreaM2(doc: Doc): { areaM2: number; source: string } | null {
  // ⚠️ KHÔNG dùng `\b` sau `²`: '²' không phải ký tự \w nên `\b` không bao giờ khớp ở cuối chuỗi
  // — bắt được lúc chạy test ('1.234,5 m²' trượt trong khi '474 m2' lại đậu). Chặn bằng
  // "không phải chữ số ngay sau" là đủ để 'm2' không nuốt nhầm 'm25'.
  const re = /(\d[\d.,]*)\s*m\s*(?:2|²)(?!\d)/i;
  for (const e of doc.entities) {
    if (e.type !== 'text') continue;
    const m = re.exec(e.text);
    if (!m) continue;
    // Số trong khung tên VN: dấu chấm là phân nhóm nghìn, dấu phẩy là thập phân.
    const n = Number(m[1].replace(/\./g, '').replace(',', '.'));
    if (Number.isFinite(n) && n > 0) return { areaM2: n, source: e.text.trim() };
  }
  return null;
}

/* ═══════════════════════ 4 · ĐỐI CHIẾU DIỆN TÍCH ═══════════════════════ */

export interface AreaCrossCheck {
  declaredM2: number | null;
  computedM2: number | null;
  /** cách tính diện tích: đường bao khép kín thật · chưa có cách nào đáng tin. */
  method: 'closedBoundary' | 'none';
  /** |computed − declared| / declared, đơn vị %. null khi thiếu một trong hai vế. */
  deltaPercent: number | null;
  /** vượt `tolerancePercent` (mặc định 3% theo phiếu) ⇒ true. */
  suspect: boolean;
  notes: string[];
}

const shoelaceM2 = (pts: Pt[]): number => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const q = pts[(i + 1) % pts.length];
    a += pts[i].x * q.y - q.x * pts[i].y;
  }
  return Math.abs(a) / 2 / 1e6;
};

/**
 * Đối chiếu diện tích ghi trong khung tên với diện tích TÍNH TỪ HÌNH HỌC — phép tự kiểm rẻ mà chắc.
 *
 * ⚠️ **LỆCH KHÔNG CÓ NGHĨA LÀ NẠP SAI** (đổi cách diễn giải 05/08, `docs/CHOT-DIEN-TICH-NAMLONG-2026-08-05.md`
 * mục 2). Ca thật đã dựng nên luật này: một file tầng được copy từ tầng khác, người vẽ sửa khung
 * tên hiển thị nhưng **định nghĩa block cũ còn sót trong section BLOCKS**, mang con số của tầng
 * nguồn. Hàm này phát hiện đúng — nó phát hiện **rác trong file gốc**, không phải lỗi bộ đọc.
 * ⇒ Câu cảnh báo phải hướng người dùng đi ĐỐI CHIẾU KHUNG TÊN, tuyệt đối KHÔNG viết "nạp sai"/
 * "lỗi đọc file" — viết vậy là đổ lỗi nhầm chỗ và người dùng sẽ đi sửa nhầm thứ.
 *
 * 🔴 **VỚI BỘ NAM LONG, VẾ "TÍNH TỪ HÌNH HỌC" HIỆN KHÔNG CÓ** — và đó là sự thật của FILE, không
 * phải thiếu sót của hàm này. Đã kiểm cả 6 file: đường polyline khép kín lớn duy nhất là khung
 * giấy trên layer `defpoints` (1.247 m² và 922 m², **y hệt nhau ở cả 6 sàn** ⇒ là khung bản vẽ,
 * không phải ranh giới sàn). Đường bao sàn được vẽ bằng nhiều đoạn thẳng rời trên `A-Wall`/
 * `A-Par-Glass`, muốn thành đa giác phải DÒ MẶT PHẲNG (planar face finding) — thuật toán riêng,
 * chưa làm. Bao lồi đã thử và BỊ LOẠI: lệch +37% (TANG11) / +50% (TANG12).
 *
 * ⇒ Hàm trả `method:'none'` + `computedM2:null` và ghi lý do. Nơi gọi hiện "chưa đối chiếu được",
 * KHÔNG hiện một con số bịa (K3/N4).
 */
export function planAreaCrossCheck(
  doc: Doc,
  opts: { tolerancePercent?: number; boundaryLayers?: string[] } = {},
): AreaCrossCheck {
  const tol = opts.tolerancePercent ?? 3;
  const notes: string[] = [];
  const declared = planDeclaredAreaM2(doc);
  if (!declared) notes.push('Không tìm thấy chuỗi diện tích dạng "NNN m2" trong bản vẽ.');

  // Đường bao khép kín ĐÁNG TIN = polyline closed, nằm trong cụm vẽ chính, KHÔNG ở layer khung
  // giấy, và diện tích nằm trong khoảng hợp lý của một sàn (50–20.000 m²).
  const names = layerNameMap(doc);
  const main = mainClusterBox(doc);
  const SHEET_LAYERS = ['defpoints', 'DEFPOINTS', 'Defpoints'];
  const candidates = doc.entities
    .filter((e): e is Extract<Entity, { type: 'polyline' }> => e.type === 'polyline' && !!e.closed && e.points.length >= 3)
    .filter((e) => !SHEET_LAYERS.includes(names.get(e.layer) ?? ''))
    .filter((e) => {
      if (!opts.boundaryLayers) return true;
      return opts.boundaryLayers.includes(names.get(e.layer) ?? '');
    })
    .filter((e) => {
      if (!main) return true;
      const b = entityBox(e);
      return b.minX >= main.box.minX - 1 && b.maxX <= main.box.maxX + 1 && b.minY >= main.box.minY - 1 && b.maxY <= main.box.maxY + 1;
    })
    .map((e) => ({ e, m2: shoelaceM2(e.points) }))
    .filter((x) => x.m2 >= 50 && x.m2 <= 20_000)
    .sort((a, b) => b.m2 - a.m2);

  if (!candidates.length) {
    notes.push('Không có đường bao khép kín nào dùng được làm ranh giới sàn (đã loại khung giấy layer defpoints). Ranh giới đang là các đoạn rời — cần dò mặt phẳng, chưa làm.');
    return {
      declaredM2: declared?.areaM2 ?? null,
      computedM2: null,
      method: 'none',
      deltaPercent: null,
      suspect: false,
      notes,
    };
  }

  const computed = candidates[0].m2;
  const delta = declared ? ((computed - declared.areaM2) / declared.areaM2) * 100 : null;
  if (delta !== null && Math.abs(delta) > tol) {
    notes.push(
      `Lệch ${delta.toFixed(1)}% so với số ghi trong khung tên (${declared!.areaM2} m²) — ` +
        'nghi block mồ côi sót lại từ file nguồn khác. Đối chiếu khung tên trong PDF trước khi tin số này.',
    );
  }
  return {
    declaredM2: declared?.areaM2 ?? null,
    computedM2: computed,
    method: 'closedBoundary',
    deltaPercent: delta,
    suspect: delta !== null && Math.abs(delta) > tol,
    notes,
  };
}
