/**
 * lib/cad/levels.ts — TẦNG (Level) + RÀNG BUỘC CAO ĐỘ. Hàm THUẦN (không React/DOM/store), test
 * độc lập bằng `sucrase-node lib/cad/levels.test.ts` — cùng khuôn `lib/cad/hosting.ts`.
 *
 * VÌ SAO CÓ FILE NÀY (`docs/SO-KIEM-TONG.md` §7, hai dòng cuối bảng đối chiếu Revit):
 *  - "Level/tầng" — 🟡 MỘT PHẦN: `Base.storey` CHỈ LÀ NHÃN chuỗi tự do, không mang cao độ.
 *  - "Constraint theo cao độ" — ⬜ CHƯA: `heightMm` là số tuyệt đối gõ tay, không tham chiếu Level
 *    nào ⇒ sửa cao độ 1 tầng phải sửa tay từng cấu kiện.
 * File này đóng đúng hai dòng đó ở TẦNG DỮ LIỆU (K2 — cấu kiện là tầng dữ liệu dưới cả 3 chặng).
 *
 * ⛔ KHÔNG ĐỤNG RENDER (yêu cầu phiếu). `lib/three/cad-to-obj.ts` hôm nay vẫn `builder.prism(
 * h.points, 0, wallH)` — đùn từ z=0, đọc thẳng `h.heightMm`. Đây là TẦNG THÊM, không phải tầng
 * thay: mọi hàm dưới đây được thiết kế để khi ai đó nối vào render thì dữ liệu CŨ (không levelId,
 * không constraint) trả về ĐÚNG con số cũ — base 0, top = heightMm (xem test [6] "trung tính").
 *
 * ⛔ KHÔNG SUY ĐOÁN LÚC CHẠY (K3): entity có `storey` mà không có `levelId` thì `resolveElevation`
 * trả 0, KHÔNG dò `doc.levels` theo tên `storey`. Việc bắc cầu storey→Level làm ĐÚNG MỘT LẦN ở
 * migration v1→v2 (`levelsFromStoreys`/`upgradeDocLevelsFromStorey` dưới đây), có cờ
 * `Level.inferred` để UI nói thật là máy đoán.
 */

import type { Doc, Entity, Level } from './model';

/* ───────────────────────── tra cứu Level ───────────────────────── */

/** `undefined` nếu doc chưa có tầng nào HOẶC id không tra được (tầng đã bị xoá — tham chiếu mồ
 * côi; nơi gọi phải xử lý, xem `ResolvedHeights.danglingLevelIds`). */
export function levelById(doc: Doc, id: string | undefined): Level | undefined {
  if (!id || !doc.levels?.length) return undefined;
  return doc.levels.find((l) => l.id === id);
}

/**
 * Bản sao đã xếp thứ tự: `order` tăng dần, hoà thì `elevationMm` tăng dần, hoà nữa thì giữ thứ tự
 * gốc (sort ổn định của JS). KHÔNG sửa mảng gốc.
 */
export function sortedLevels(doc: Doc): Level[] {
  return [...(doc.levels ?? [])].sort((a, b) => a.order - b.order || a.elevationMm - b.elevationMm);
}

/* ───────────────────────── VIỆC 1 · resolveElevation ───────────────────────── */

/**
 * CAO ĐỘ ĐÁY (mm) của entity — chuỗi lùi ĐÚNG THEO PHIẾU:
 *   1. có `levelId` tra được Level  → `Level.elevationMm`
 *   2. không                        → `entity.elevationMm`
 *   3. không nữa                    → 0
 *
 * ⚠️ ĐỌC KỸ TRƯỚC KHI NỐI VÀO RENDER — `elevationMm` đang mang NGHĨA KHÁC ở vai trò cutter:
 * `lib/cad/hosting.ts:121` ghi `elevationMm = sillMm` (bệ cửa sổ 900) và `cad-to-obj.ts:480` đọc
 * nó làm z0 của LỖ KHOÉT, tính từ CHÂN TƯỜNG chứ không phải từ ±0.000 công trình. Nếu sau này có
 * ai gán thêm `levelId` cho chính cutter đó, hàm này sẽ trả cao độ TẦNG và **nuốt mất 900mm bệ**.
 * ⇒ Cách đúng cho ca "bệ cao X trên tầng Y" là `baseConstraint: {levelId:'Y', offsetMm:X}` +
 * `computeHeights()` (VIỆC 2) — hàm đó cộng đúng cả hai. `resolveElevation` cố ý giữ chuỗi lùi
 * đơn giản của phiếu, KHÔNG tự thông minh. Ghi ra đây thay vì im lặng (N5).
 */
export function resolveElevation(entity: Entity, doc: Doc): number {
  const lv = levelById(doc, entity.levelId);
  if (lv) return lv.elevationMm;
  return entity.elevationMm ?? 0;
}

/* ───────────────────────── VIỆC 2 · computeHeights ───────────────────────── */

export type BaseSource = 'baseConstraint' | 'level' | 'entity' | 'default';
export type TopSource = 'topConstraintLevel' | 'topConstraintHeight' | 'entity' | 'unknown';

export interface ResolvedHeights {
  /** cao độ ĐÁY (mm). Luôn có số — chuỗi lùi cuối cùng là 0. */
  baseMm: number;
  /** cao độ ĐỈNH (mm). `undefined` = KHÔNG XÁC ĐỊNH ĐƯỢC (không constraint đỉnh, entity cũng
   * không có `heightMm`) — N4: KHÔNG bịa 2700 ở đây; cao mặc định là chuyện của scene
   * (`SceneOptions.wallHeightMm`), nơi gọi tự quyết lấy mặc định nào. */
  topMm?: number;
  /** `topMm - baseMm`. `undefined` khi `topMm` undefined. **CÓ THỂ ÂM hoặc 0** khi người dùng đặt
   * tầng đỉnh thấp hơn tầng đáy — hàm KHÔNG kẹp/không sửa, chỉ báo qua `degenerate`. */
  heightMm?: number;
  /** true khi `heightMm` tính ra ≤ 0 — nơi gọi phải cảnh báo người dùng, không dựng khối lộn ngược. */
  degenerate?: true;
  baseFrom: BaseSource;
  topFrom: TopSource;
  /** id Level được tham chiếu mà KHÔNG tra được trong `doc.levels` (tầng đã bị xoá). Không rỗng =
   * dữ liệu đang hỏng, hàm đã tự lùi về chuỗi cũ để không sập — nhưng nơi gọi phải hiện cảnh báo. */
  danglingLevelIds?: string[];
}

/**
 * ĐÁY + ĐỈNH + CHIỀU CAO cuối cùng của entity, sau khi giải mọi ràng buộc tầng.
 * **Đổi `Level.elevationMm` → mọi entity gắn vào tầng đó đổi theo NGAY**, vì hàm này không cache
 * gì, luôn đọc lại từ `doc` (K1 — một nguồn, không kho thứ hai).
 *
 * Thứ tự quyết ĐÁY:  `baseConstraint` (level + offset) → `resolveElevation()` (levelId → elevationMm → 0)
 * Thứ tự quyết ĐỈNH: `topConstraint` → `entity.heightMm` (cộng lên đáy) → không xác định
 *
 * Tham chiếu Level hỏng (id không tồn tại) KHÔNG làm hàm sập: lùi xuống bậc kế tiếp + ghi id vào
 * `danglingLevelIds`.
 */
export function computeHeights(entity: Entity, doc: Doc): ResolvedHeights {
  const dangling: string[] = [];

  // ── ĐÁY ──
  let baseMm: number;
  let baseFrom: BaseSource;
  const bc = entity.baseConstraint;
  const bcLevel = bc ? levelById(doc, bc.levelId) : undefined;
  if (bc && bcLevel) {
    baseMm = bcLevel.elevationMm + bc.offsetMm;
    baseFrom = 'baseConstraint';
  } else {
    if (bc && !bcLevel) dangling.push(bc.levelId);
    const lv = levelById(doc, entity.levelId);
    if (lv) {
      baseMm = lv.elevationMm;
      baseFrom = 'level';
    } else {
      if (entity.levelId && !lv) dangling.push(entity.levelId);
      if (entity.elevationMm !== undefined) {
        baseMm = entity.elevationMm;
        baseFrom = 'entity';
      } else {
        baseMm = 0;
        baseFrom = 'default';
      }
    }
  }

  // ── ĐỈNH ──
  let topMm: number | undefined;
  let topFrom: TopSource = 'unknown';
  const tc = entity.topConstraint;
  if (tc && 'levelId' in tc) {
    const tcLevel = levelById(doc, tc.levelId);
    if (tcLevel) {
      topMm = tcLevel.elevationMm + tc.offsetMm;
      topFrom = 'topConstraintLevel';
    } else {
      dangling.push(tc.levelId);
    }
  } else if (tc) {
    topMm = baseMm + tc.heightMm;
    topFrom = 'topConstraintHeight';
  }
  if (topMm === undefined && entity.heightMm !== undefined) {
    topMm = baseMm + entity.heightMm;
    topFrom = 'entity';
  }

  const heightMm = topMm === undefined ? undefined : topMm - baseMm;
  return {
    baseMm,
    ...(topMm === undefined ? {} : { topMm }),
    ...(heightMm === undefined ? {} : { heightMm }),
    ...(heightMm !== undefined && heightMm <= 0 ? { degenerate: true as const } : {}),
    baseFrom,
    topFrom,
    ...(dangling.length ? { danglingLevelIds: dangling } : {}),
  };
}

/* ───────────────────────── migration v1 → v2 (dùng bởi lib/cad/idf.ts) ───────────────────────── */

/**
 * Khoá kỹ thuật ổn định sinh từ nhãn `storey`. PHẢI TẤT ĐỊNH (không `Math.random`/`Date.now`) —
 * mở cùng 1 file .idf hai lần phải ra cùng bộ id, nếu không mọi `levelId` đã ghi ra file lần
 * trước sẽ mồ côi. Tiếng Việt có dấu → bỏ dấu (NFD + xoá dấu tổ hợp) rồi mới slug, nên
 * 'Tầng trệt' ra `level-tang-tret` chứ không phải `level---`.
 */
function levelIdFromStorey(storey: string, taken: Set<string>): string {
  const slug = storey
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const stem = `level-${slug || 'x'}`;
  let id = stem;
  let n = 2;
  while (taken.has(id)) id = `${stem}-${n++}`;
  taken.add(id);
  return id;
}

/**
 * Sinh danh sách `Level` từ tập nhãn `storey` đã dùng — thứ tự XUẤT HIỆN ĐẦU TIÊN trong doc
 * (không sắp xếp theo tên: 'GF'/'L1'/'Lửng'/'Tum' không có thứ tự chữ cái đúng nghĩa nào).
 *
 * ⚠️ `elevationMm` = **0 CHO MỌI TẦNG**, có chủ đích, KHÔNG phải quên (N4/K3):
 *  - File v1 KHÔNG mang một byte thông tin cao độ nào — nhãn 'L1' không nói L1 cao 3200 hay 3600.
 *    Đoán 3000/tầng là bịa số vào hồ sơ kỹ thuật, sai kiểu nguy hiểm nhất (nhìn như thật).
 *  - 0 cũng là con số GIỮ NGUYÊN HÀNH VI: hôm nay mọi khối đùn từ z=0, nên file cũ mở ở app v2
 *    dựng ra y hệt trước khi có Level. Nâng cấp ngữ nghĩa mà không đổi một pixel nào.
 *  - Mỗi Level sinh ra mang `inferred: true` để UI nói thật "máy đoán, chưa khai cao độ".
 */
export function levelsFromStoreys(storeys: string[]): Level[] {
  const taken = new Set<string>();
  return storeys.map((name, i) => ({
    id: levelIdFromStorey(name, taken),
    name,
    elevationMm: 0,
    order: i,
    inferred: true as const,
  }));
}

/**
 * Nâng MỘT `Doc` từ v1 lên v2: sinh `doc.levels` từ tập `storey` đã dùng + gắn `levelId` cho
 * đúng những entity mang `storey` đó. **KHÔNG đụng `storey`** (giữ nguyên tuyệt đối — DXF XDATA,
 * cây đối tượng, nhóm BOQ vẫn đọc nó).
 *
 * Trả về CHÍNH `doc` (cùng tham chiếu) khi không có gì để làm — doc không entity nào có `storey`,
 * hoặc doc đã có `levels` rồi (file lai/đã nâng). Không bao giờ sửa tại chỗ: có việc thì trả bản
 * sao mới.
 */
export function upgradeDocLevelsFromStorey(doc: Doc): Doc {
  if (doc.levels !== undefined) return doc; // đã có tầng thật — không đè lên dữ liệu người dùng
  if (!Array.isArray(doc.entities)) return doc;

  const order: string[] = [];
  const seen = new Set<string>();
  for (const e of doc.entities) {
    const s = typeof e?.storey === 'string' ? e.storey.trim() : '';
    if (!s || seen.has(s)) continue;
    seen.add(s);
    order.push(s);
  }
  if (!order.length) return doc; // không nhãn tầng nào ⇒ không sinh Level rỗng cho có

  const levels = levelsFromStoreys(order);
  const idByStorey = new Map(order.map((s, i) => [s, levels[i].id]));
  const entities = doc.entities.map((e) => {
    const s = typeof e?.storey === 'string' ? e.storey.trim() : '';
    if (!s || e.levelId !== undefined) return e;
    const id = idByStorey.get(s);
    return id ? { ...e, levelId: id } : e;
  });
  return { ...doc, entities, levels };
}
