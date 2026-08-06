/**
 * lib/three/section-entities.ts — CẮT RA BẢN VẼ: `ObjScene` (khối 3D) → `Entity[]` của
 * `lib/cad/model.ts`, cắm thẳng vào `Doc`. Test: `sucrase-node lib/three/section-entities.test.ts`.
 *
 * ▸ VÌ SAO CÓ FILE NÀY (đo 05/08, khớp phiếu): `lib/three/section.ts` (35 dòng) chỉ sinh
 * `THREE.Plane` cho `renderer.clippingPlanes` — cắt cho MẮT NHÌN trong viewport, KHÔNG trích được
 * một đường 2D nào. `grep -rn "sectionToDoc|sectionToEntities" lib components app` = 0 kết quả.
 * ⛔ **KHÔNG SỬA `section.ts`** (§0d — nó đang chạy đúng việc của nó ở `Scene3DViewer.tsx:156`);
 * file này CHỈ TÁI DÙNG `SectionSpec` + đúng quy ước GIỮ/CẮT của nó.
 *
 * ▸ QUY ƯỚC GIỮ/CẮT — **giữ nguyên `section.ts`, không đảo**: GIỮ phần toạ độ CAD trên trục đã
 * chọn **≤ `at`**, CẮT phần **> `at`**. Đảo hướng là vỡ `Scene3DViewer`.
 *
 * ▸ §0f TB2 — NÉT LÀ THÔNG TIN: ba nhóm KHÁC LAYER, khác bề dày (xem `SECTION_LAYERS`).
 * Trộn chung một layer là hỏng cả bản vẽ, người trong nghề đọc ra ngay.
 *
 * ▸ THUẦN — **không import `three`**. Cố ý:
 *   (a) `ObjScene.groups[].positions` đã là `number[]` thuần, không cần `three` để đọc;
 *   (b) `lib/three/csg.ts` tự ghi ở docstring rằng nó import `three-bvh-csg` TĨNH và "chỉ an toàn
 *       vì nơi gọi được import ĐỘNG" — kéo nó vào đây sẽ lôi cả `three` vào mọi nơi dùng mặt cắt;
 *   (c) test chạy được bằng `sucrase-node`, không cần WebGL.
 *
 * ▸ **TRẢ LỜI CÂU "chỗ nào phải tự viết thay vì dùng lại csg"** (phiếu hỏi thẳng — trả lời thẳng):
 * `lib/three/csg.ts` export **ĐÚNG MỘT HÀM**: `booleanOp(a, b, kind)` → `BufferGeometry`
 * (`csg.ts:42`). Đó là boolean KHỐI↔KHỐI, **không trả giao tuyến**. Muốn có đường bao MẶT CẮT từ
 * nó thì vẫn phải: cắt khối bằng nửa-không-gian → dò các mặt ĐỒNG PHẲNG với mặt cắt → trích cạnh
 * biên của đám mặt đó → nối thành vòng. Tức là **vẫn phải tự viết đúng ba bước cuối**, cộng thêm
 * chi phí dựng `BufferGeometry` + chạy BVH cho mỗi group.
 * ⇒ Chọn đường TRỰC TIẾP: **mặt phẳng × tam giác** (mỗi tam giác cho tối đa 1 đoạn) rồi nối vòng.
 * Chính xác hơn (không qua tam-giác-hoá lại), rẻ hơn, và KHÔNG PHẢI "bộ cắt thứ hai" — nó không
 * cạnh tranh với `booleanOp`: `booleanOp` làm khối-trừ-khối (`ops[]` của `Base`), hàm này làm
 * khối-giao-mặt-phẳng, hai bài toán khác nhau. `booleanOp` không bị đụng tới.
 */

import type { Entity, HatchEntity, Layer, PolylineEntity, Pt } from '../cad/model';
import type { ObjScene, SceneGroup } from './cad-to-obj';

/**
 * 05/08 (S2 BUILD#1) — NỚI kiểu tham số `scene` từ `ObjScene` xuống ĐÚNG PHẦN CÁC HÀM NÀY ĐỌC.
 * Grep toàn file: chỉ `scene.groups` được dùng, không đụng `obj`/`mtl`/`stats`/`warnings`.
 * Vì sao cần nới: nơi mount thật (`useScene3D()`) giữ `Scene3DData` = `Pick<ObjScene,'groups'> &
 * {bboxMm, sizeM}` — KHÔNG có `obj`/`mtl` text (viewer không cần, xem `toScene3DData`). Bắt nơi
 * gọi phải dựng lại `ObjScene` đầy đủ chỉ để thoả kiểu là ép nó tính lại cả scene lần hai.
 * Nới kiểu (không đổi một dòng logic) ⇒ `ObjScene` vẫn truyền vào được như cũ.
 */
export type SectionSourceScene = Pick<ObjScene, 'groups'>;
import type { SectionSpec } from './section';

/* ═════════════════════ layer — §0f TB2 ═════════════════════ */

export const SECTION_CUT_LAYER = 'S-CUT';
export const SECTION_VIEW_LAYER = 'S-VIEW';
export const SECTION_FAR_LAYER = 'S-FAR';

/**
 * Ba layer của bản vẽ mặt cắt. Bề dày theo đúng phiếu (0.70 / 0.35 / 0.18) — đều nằm trong
 * `STANDARD_LINEWEIGHTS` của `model.ts`, không đẻ nấc mới.
 * Màu: **xám trung tính**, không hex thương hiệu nào (luật Trung tính).
 */
export const SECTION_LAYERS: Layer[] = [
  { id: SECTION_CUT_LAYER, name: 'Mặt cắt · nét cắt', color: '#2b2b2b', visible: true, locked: false, lineweight: 0.7, lineType: 'continuous' },
  { id: SECTION_VIEW_LAYER, name: 'Mặt cắt · thấy', color: '#6b6b6b', visible: true, locked: false, lineweight: 0.35, lineType: 'continuous' },
  { id: SECTION_FAR_LAYER, name: 'Mặt cắt · xa', color: '#a0a0a0', visible: true, locked: false, lineweight: 0.18, lineType: 'continuous' },
];

/* ═════════════════════ tuỳ chọn ═════════════════════ */

export interface SectionToEntitiesOptions {
  /**
   * `'section'` — có cắt: sinh đủ 3 nhóm CUT/VIEW/FAR.
   * `'elevation'` — MẶT ĐỨNG: **chỉ chiếu, KHÔNG có nhóm MẶT CẮT** (đúng ca thứ 3 của phiếu).
   * Mặc định `'section'`.
   */
  mode?: 'section' | 'elevation';
  /**
   * Ngưỡng (mm) tính từ mặt phẳng cắt: sâu hơn ngưỡng ⇒ xuống nhóm **XA** (`S-FAR`, chìm xuống).
   * Mặc định 3000.
   * ⚠️ Đây là **quy ước dựng hình**, KHÔNG phải trị số tiêu chuẩn nào — không có TCVN/ISO nào quy
   * định "xa bao nhiêu thì nhạt". Ghi ra để không ai tưởng là số tra được (N4). Chỉnh tự do.
   */
  farThresholdMm?: number;
  /** Dung sai hàn điểm khi nối đoạn thành vòng (mm). Mặc định 0.5 — nhỏ hơn mọi sai số vẽ tay,
   * đủ lớn để nuốt sai số dấu phẩy động của phép giao. */
  weldToleranceMm?: number;
  /** Bỏ qua group theo tên (regex) — VD bỏ `Room_*` (hình học dò biên runtime, không phải vật thể
   * thật, xem `SceneGroup.entityId` docstring ở `cad-to-obj.ts:130`). Mặc định bỏ `Room_`. */
  skipGroupPattern?: RegExp | null;
  /** Vòng kín nhóm MẶT CẮT có sinh kèm `hatch` SOLID (poché) không. Mặc định true (đúng phiếu). */
  poche?: boolean;
}

export interface SectionReport {
  entities: Entity[];
  /** đếm theo nhóm — dùng cho nghiệm thu, không phải trang trí. */
  counts: { cut: number; view: number; far: number };
  /** số vòng KÍN của nhóm cắt (mỗi vòng = 1 polyline + 1 hatch nếu bật poché). */
  cutLoops: number;
  /** số chuỗi HỞ của nhóm cắt — >0 nghĩa là hình học không kín (mesh hở/tam giác thiếu), poché
   * không tô được chỗ đó. Không giấu. */
  cutOpenChains: number;
  warnings: string[];
}

/* ═════════════════════ hình học nền ═════════════════════ */

/** three-space (mét) → CAD (mm). Nghịch đảo ĐÚNG `ObjBuilder.vert()` (`cad-to-obj.ts:322`):
 * `x = xMm/1000 · y = zMm/1000 · z = -yMm/1000`. Suy ngược, không đoán. */
function threeToCadMm(px: number, py: number, pz: number): [number, number, number] {
  return [px * 1000, -pz * 1000, py * 1000];
}

type V3 = [number, number, number];

/** Toạ độ theo trục cắt. */
function alongAxis(v: V3, axis: SectionSpec['axis']): number {
  return axis === 'x' ? v[0] : axis === 'y' ? v[1] : v[2];
}

/**
 * Chiếu điểm CAD 3D → mặt phẳng vẽ 2D của bản vẽ mặt cắt:
 *   - `axis:'z'` (cắt ngang cao độ → MẶT BẰNG, nhìn xuống): (u,v) = (x, y) — đúng mặt bằng CAD.
 *   - `axis:'y'` (mặt cắt đứng): (u,v) = (x, z) — hoành độ theo X, **tung độ là CAO ĐỘ**.
 *   - `axis:'x'` (mặt cắt đứng): (u,v) = (y, z).
 * Nhờ vậy mặt cắt đứng ra bản vẽ có v = cao độ thật, cốt ±0.000 nằm đúng v=0 — ghi kích thước cao
 * độ lên là đọc được ngay, không phải bù trừ.
 */
function project(v: V3, axis: SectionSpec['axis']): Pt {
  if (axis === 'z') return { x: v[0], y: v[1] };
  if (axis === 'y') return { x: v[0], y: v[2] };
  return { x: v[1], y: v[2] };
}

function keyOf(p: Pt, tol: number): string {
  return `${Math.round(p.x / tol)}|${Math.round(p.y / tol)}`;
}

/**
 * Nối các đoạn rời thành chuỗi/vòng. Thuật toán: gom đoạn theo đầu mút đã lượng tử hoá, đi men
 * theo đỉnh bậc lẻ trước (ra chuỗi HỞ), rồi mới đến phần còn lại (ra vòng KÍN) — chuẩn "walk the
 * edge graph", không phải phát minh.
 */
function chainSegments(segs: [Pt, Pt][], tol: number): { loops: Pt[][]; chains: Pt[][] } {
  const adj = new Map<string, { to: string; pt: Pt; from: Pt; used: boolean }[]>();
  const push = (a: Pt, b: Pt) => {
    const ka = keyOf(a, tol);
    const kb = keyOf(b, tol);
    if (ka === kb) return; // đoạn suy biến (dài < dung sai) — bỏ, không tạo nút cụt
    if (!adj.has(ka)) adj.set(ka, []);
    adj.get(ka)!.push({ to: kb, pt: b, from: a, used: false });
  };
  for (const [a, b] of segs) {
    push(a, b);
    push(b, a);
  }

  // Đánh dấu 1 cạnh + cạnh ngược của nó là đã dùng (đồ thị vô hướng lưu 2 chiều).
  const consume = (ka: string, e: { to: string; pt: Pt; from: Pt; used: boolean }) => {
    e.used = true;
    const back = adj.get(e.to)?.find((x) => !x.used && x.to === ka);
    if (back) back.used = true;
  };

  const walk = (start: string): Pt[] | null => {
    const first = adj.get(start)?.find((e) => !e.used);
    if (!first) return null;
    const path: Pt[] = [first.from];
    let cur = start;
    let edge = first;
    for (;;) {
      consume(cur, edge);
      path.push(edge.pt);
      cur = edge.to;
      const nxt = adj.get(cur)?.find((e) => !e.used);
      if (!nxt) break;
      edge = nxt;
      if (cur === start) break;
    }
    return path.length >= 2 ? path : null;
  };

  const loops: Pt[][] = [];
  const chains: Pt[][] = [];
  const keys = Array.from(adj.keys());

  // Bậc lẻ = đầu mút hở ⇒ đi trước để chuỗi hở không bị cắt vụn.
  const odd = keys.filter((k) => (adj.get(k)?.length ?? 0) % 2 === 1);
  for (const k of odd) {
    for (;;) {
      const p = walk(k);
      if (!p) break;
      chains.push(p);
    }
  }
  for (const k of keys) {
    for (;;) {
      const p = walk(k);
      if (!p) break;
      const closed = keyOf(p[0], tol) === keyOf(p[p.length - 1], tol);
      if (closed && p.length >= 4) loops.push(p.slice(0, -1));
      else chains.push(p);
    }
  }
  return { loops, chains };
}

/**
 * Đường bao CHIẾU của một đám tam giác: **khử mặt sau** rồi chiếu xuống 2D và **triệt tiêu cạnh
 * dùng chung** (cạnh trong xuất hiện 2 lần thì mất, cạnh biên còn lại 1 lần).
 *
 * ⚠️ **BƯỚC KHỬ MẶT SAU LÀ BẮT BUỘC, KHÔNG PHẢI TỐI ƯU** — bỏ nó là hàm trả về RỖNG với mọi khối
 * kín. Đo được lúc viết test: một hộp kín 12 tam giác, chiếu dọc trục thì mặt TRÊN và mặt DƯỚI
 * rơi trùng khít lên nhau trong 2D ⇒ mỗi cạnh biên bị đếm 2 lần ⇒ triệt tiêu hết ⇒ mặt đứng
 * trắng trơn. Giữ lại đúng nửa quay về phía người nhìn thì parity mới ra đúng đường bao.
 * (Ca bệnh thật: 3 test [4]/[5]/[6] FAIL ở lần chạy đầu, không phải suy luận.)
 *
 * Hướng nhìn: đứng ở phía `at` nhìn về phía được GIỮ, tức nhìn theo chiều GIẢM của trục cắt ⇒
 * tam giác quay về phía người nhìn khi pháp tuyến có thành phần **dương** trên trục đó.
 *
 * ⚠️ **KHÔNG có khử nét khuất giữa các group** (hidden-line removal thật): một cái bàn nằm sau
 * bức tường vẫn được vẽ. Khử nét khuất đúng nghĩa là bài toán riêng (BSP/z-buffer vector), KHÔNG
 * làm ở phiếu này. Ghi thẳng ra đây thay vì để người dùng tự phát hiện (N5/§9).
 */
function projectedOutline(tris: [V3, V3, V3][], axis: SectionSpec['axis'], tol: number): [Pt, Pt][] {
  const ai = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const count = new Map<string, { a: Pt; b: Pt; n: number }>();
  for (const t of tris) {
    // Pháp tuyến (tích có hướng) — chỉ cần THÀNH PHẦN trên trục cắt để biết quay về phía nào.
    const ux = t[1][0] - t[0][0];
    const uy = t[1][1] - t[0][1];
    const uz = t[1][2] - t[0][2];
    const vx = t[2][0] - t[0][0];
    const vy = t[2][1] - t[0][1];
    const vz = t[2][2] - t[0][2];
    const n: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    if (n[ai] <= 0) continue; // quay đi / vuông góc (chiếu thành đoạn suy biến) — bỏ

    const p = [project(t[0], axis), project(t[1], axis), project(t[2], axis)];
    for (let i = 0; i < 3; i++) {
      const a = p[i];
      const b = p[(i + 1) % 3];
      const ka = keyOf(a, tol);
      const kb = keyOf(b, tol);
      if (ka === kb) continue;
      const k = ka < kb ? `${ka}#${kb}` : `${kb}#${ka}`;
      const got = count.get(k);
      if (got) got.n += 1;
      else count.set(k, { a, b, n: 1 });
    }
  }
  const out: [Pt, Pt][] = [];
  for (const e of count.values()) if (e.n === 1) out.push([e.a, e.b]);
  return out;
}

/* ═════════════════════ dựng Entity ═════════════════════ */

let seq = 0;
/** id tất định theo tiền tố + bộ đếm module (KHÔNG `Math.random`/`Date.now` — cắt lại cùng một
 * scene phải ra cùng bộ id, nếu không thì undo/diff/BOQ nhảy lung tung). */
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

/** ĐẶT LẠI bộ đếm id — CHỈ dùng trong test để 2 lần cắt so sánh được với nhau. */
export function __resetSectionIdSeqForTest(): void {
  seq = 0;
}

function polyEntity(pts: Pt[], closed: boolean, layer: string, lineweight: number, src?: SceneGroup): PolylineEntity {
  return {
    id: nextId('sec'),
    type: 'polyline',
    layer,
    points: pts,
    closed,
    lineweight,
    // Truy vết NGUYÊN VĂN từ group nguồn (K3 — đọc, không suy đoán). Chỉ có ở group sinh từ đúng
    // 1 entity thật; `Floor`/`Room_i` không có, để trống.
    ...(src?.storey ? { storey: src.storey } : {}),
  };
}

function hatchEntity(pts: Pt[], src?: SceneGroup): HatchEntity {
  return {
    id: nextId('sec'),
    type: 'hatch',
    layer: SECTION_CUT_LAYER,
    points: pts,
    pattern: 'SOLID',
    solid: true,
    lineweight: 0.7,
    ...(src?.storey ? { storey: src.storey } : {}),
    ...(src?.specId ? { specId: src.specId } : {}),
  };
}

/* ═════════════════════ HÀM CHÍNH ═════════════════════ */

/**
 * Cắt `scene` bằng mặt phẳng `spec` → `Entity[]` cắm thẳng vào `Doc`.
 * Nhớ nạp `SECTION_LAYERS` vào `doc.layers` (hoặc tự map sang layer của mình) — entity trả về đã
 * khai `lineweight` riêng nên vẫn đúng bề dày kể cả khi thiếu layer.
 */
export function sectionToEntities(scene: SectionSourceScene, spec: SectionSpec, opts: SectionToEntitiesOptions = {}): Entity[] {
  return sectionReport(scene, spec, opts).entities;
}

/** Bản đầy đủ — kèm số đếm + cảnh báo (nghiệm thu cần con số, không cần đoán). */
export function sectionReport(scene: SectionSourceScene, spec: SectionSpec, opts: SectionToEntitiesOptions = {}): SectionReport {
  const mode = opts.mode ?? 'section';
  const tol = opts.weldToleranceMm ?? 0.5;
  const far = opts.farThresholdMm ?? 3000;
  const skip = opts.skipGroupPattern === undefined ? /^Room_/ : opts.skipGroupPattern;
  const poche = opts.poche ?? true;

  const warnings: string[] = [];
  const entities: Entity[] = [];
  const counts = { cut: 0, view: 0, far: 0 };
  let cutLoops = 0;
  let cutOpenChains = 0;

  const groups = scene.groups.filter((g) => !(skip && skip.test(g.name)));
  if (!groups.length) {
    warnings.push('Không có khối nào để cắt (scene rỗng hoặc bị lọc hết).');
    return { entities, counts, cutLoops, cutOpenChains, warnings };
  }

  let boolGroups = 0;
  let anyCross = false;

  for (const g of groups) {
    // `ops[] boolean` (khoét cửa/cửa sổ) được áp ở TẦNG three (`build-ops.ts`), KHÔNG nằm trong
    // `positions` — nên lỗ CHƯA bị trừ khỏi mặt cắt. Đếm để cảnh báo, không im lặng vẽ sai.
    if (g.ops?.some((o) => o.op === 'boolean')) boolGroups += 1;

    const cutSegs: [Pt, Pt][] = [];
    const nearTris: [V3, V3, V3][] = [];
    const farTris: [V3, V3, V3][] = [];

    for (let i = 0; i + 8 < g.positions.length; i += 9) {
      const t: [V3, V3, V3] = [
        threeToCadMm(g.positions[i], g.positions[i + 1], g.positions[i + 2]),
        threeToCadMm(g.positions[i + 3], g.positions[i + 4], g.positions[i + 5]),
        threeToCadMm(g.positions[i + 6], g.positions[i + 7], g.positions[i + 8]),
      ];
      const d = [alongAxis(t[0], spec.axis) - spec.at, alongAxis(t[1], spec.axis) - spec.at, alongAxis(t[2], spec.axis) - spec.at];

      if (mode === 'section') {
        // Tam giác ĐỒNG PHẲNG với mặt cắt: bỏ hẳn. Nếu không, mặt trên/dưới của mọi khối nằm đúng
        // cao độ cắt sẽ đổ NGUYÊN lưới tam giác vào nhóm cắt — bản vẽ thành đống rác.
        const coplanar = Math.abs(d[0]) < tol && Math.abs(d[1]) < tol && Math.abs(d[2]) < tol;
        if (!coplanar) {
          const hit: Pt[] = [];
          for (let e = 0; e < 3; e++) {
            const a = t[e];
            const b = t[(e + 1) % 3];
            const da = d[e];
            const db = d[(e + 1) % 3];
            if ((da > 0 && db > 0) || (da < 0 && db < 0)) continue;
            if (da === db) continue; // cạnh nằm trên mặt phẳng — cạnh kề sẽ bắt được, bỏ tránh trùng
            const s = da / (da - db);
            const p: V3 = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
            hit.push(project(p, spec.axis));
          }
          if (hit.length >= 2) {
            cutSegs.push([hit[0], hit[1]]);
            anyCross = true;
          }
        }
      }

      // GIỮ phần ≤ at (đúng quy ước `section.ts`). Lấy tam giác nằm TRỌN bên giữ; tam giác vắt
      // ngang đã đóng góp đường cắt ở trên rồi.
      if (d[0] <= 0 && d[1] <= 0 && d[2] <= 0) {
        const depth = -Math.max(d[0], d[1], d[2]); // khoảng cách từ mặt cắt vào phía giữ
        (depth > far ? farTris : nearTris).push(t);
      }
    }

    // ── nhóm 1 · MẶT CẮT ──
    if (cutSegs.length) {
      const { loops, chains } = chainSegments(cutSegs, tol);
      for (const lp of loops) {
        entities.push(polyEntity(lp, true, SECTION_CUT_LAYER, 0.7, g));
        counts.cut += 1;
        cutLoops += 1;
        if (poche) {
          entities.push(hatchEntity(lp, g));
          counts.cut += 1;
        }
      }
      for (const ch of chains) {
        entities.push(polyEntity(ch, false, SECTION_CUT_LAYER, 0.7, g));
        counts.cut += 1;
        cutOpenChains += 1;
      }
    }

    // ── nhóm 2+3 · THẤY / XA ──
    for (const [tris, layer, lw, bucket] of [
      [nearTris, SECTION_VIEW_LAYER, 0.35, 'view'] as const,
      [farTris, SECTION_FAR_LAYER, 0.18, 'far'] as const,
    ]) {
      if (!tris.length) continue;
      const outline = projectedOutline(tris, spec.axis, tol);
      const { loops, chains } = chainSegments(outline, tol);
      for (const lp of loops) {
        entities.push(polyEntity(lp, true, layer, lw, g));
        counts[bucket] += 1;
      }
      for (const ch of chains) {
        entities.push(polyEntity(ch, false, layer, lw, g));
        counts[bucket] += 1;
      }
    }
  }

  if (boolGroups > 0) {
    warnings.push(
      `${boolGroups} khối có phép khoét (cửa/cửa sổ, \`ops[] boolean\`) — mặt cắt CHƯA trừ lỗ: ` +
        '`SceneGroup.positions` là hình học TRƯỚC boolean, phép trừ chạy ở tầng three (`build-ops.ts`). ' +
        'Lỗ cửa/cửa sổ sẽ KHÔNG hiện trên bản vẽ này.',
    );
  }
  if (mode === 'section' && !anyCross) {
    warnings.push(`Mặt phẳng cắt (${spec.axis} = ${spec.at}mm) không cắt qua khối nào — không có nhóm MẶT CẮT.`);
  }
  if (cutOpenChains > 0) {
    warnings.push(`${cutOpenChains} đường cắt KHÔNG khép kín (hình học hở) — chỗ đó không tô được poché.`);
  }

  return { entities, counts, cutLoops, cutOpenChains, warnings };
}

/**
 * MẶT ĐỨNG (elevation) — ca thứ 3 của phiếu: **chỉ chiếu, không có nhóm MẶT CẮT**.
 * `at` mặc định = mép bao xa nhất của scene trên trục đó, tức GIỮ TRỌN mô hình rồi chiếu hết.
 */
export function elevationToEntities(
  scene: SectionSourceScene,
  axis: SectionSpec['axis'],
  opts: SectionToEntitiesOptions = {},
): Entity[] {
  // ⚠️ KHÔNG dùng `scene.stats.bboxMm` — đó là bao của ENTITY, không phải của HÌNH HỌC sinh ra.
  // Đo được: group `Floor` cố ý phủ RỘNG HƠN bbox 50mm mỗi phía (`cad-to-obj.ts` `floorPoly`), nên
  // lấy `bboxMm.maxY + 1` làm mặt phẳng thì **cắt xuyên qua bản sàn** — mặt +y của sàn rơi vào
  // phía bị cắt bỏ và biến mất khỏi mặt đứng. (Ca bệnh thật: test [6] FAIL, sàn mất, không phải
  // suy luận.) Đo thẳng mép lớn nhất của chính đám tam giác thì không bao giờ hụt.
  let max = -Infinity;
  const k = axis === 'x' ? 0 : axis === 'y' ? 2 : 1; // chỉ số trong `positions` (three-space)
  const sign = axis === 'y' ? -1 : 1; // three.z = −y_CAD
  for (const g of scene.groups) {
    for (let i = k; i < g.positions.length; i += 3) {
      const v = g.positions[i] * 1000 * sign;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(max)) max = 0;
  // +1mm để mọi đỉnh nằm ĐÚNG mép bao vẫn được tính là "giữ" (quy ước giữ ≤ at).
  return sectionToEntities(scene, { axis, at: max + 1 }, { ...opts, mode: 'elevation' });
}
