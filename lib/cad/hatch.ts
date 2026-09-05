/**
 * lib/cad/hatch.ts — HATCH THẬT (Nấc 4): dò biên vùng kín từ pick-point (boundary trace trên
 * mặt phẳng phân hoạch bởi các entity giao nhau) + sinh pattern ANSI31/ANSI32/ANSI37/SOLID/DOTS.
 * Hình học THUẦN — test được độc lập, không đụng store/React.
 *
 * THUẬT TOÁN dò biên (giống ý tưởng BHATCH của AutoCAD, đơn giản hoá cho phạm vi app):
 *  1) Lấy mọi đoạn thẳng "có thể là biên" từ entity hiển thị (line/dim/polyline/rect/hatch lấy
 *     thẳng; circle/arc xấp xỉ đa giác — đủ mượt cho mục đích dò biên, KHÔNG cần chính xác từng
 *     độ cong).
 *  2) Cắt (split) mọi đoạn tại MỌI giao điểm với đoạn khác — kể cả giao kiểu CHẠM ĐẦU MÚT
 *     (đầu đoạn này đậu giữa đoạn kia, chính là đỉnh chữ T) và chồng lấn THẲNG HÀNG một phần —
 *     rồi hút đỉnh về lưới 0.01mm + loại đoạn trùng lặp (mỗi wallSegment phát cả hatch lẫn
 *     polyline cùng toạ độ → mọi cạnh tường bị nhân đôi nếu không lọc) → tập đoạn "nguyên tử"
 *     tạo thành 1 mặt phẳng phân hoạch (planar arrangement) sạch.
 *  3) Dựng DCEL toàn cục: mỗi đoạn nguyên tử → 2 nửa-cạnh (half-edge) ngược chiều; tại mỗi đỉnh
 *     sắp các nửa-cạnh đi ra theo góc; con trỏ next của nửa-cạnh (u→v) = nửa-cạnh đứng NGAY
 *     TRƯỚC twin (v→u) theo chiều ngược kim đồng hồ quanh v. Đi theo next liệt kê MỌI mặt của
 *     phân hoạch đúng 1 lần (thuật toán textbook — khác bản cũ chỉ "rẽ góc nhỏ nhất" cục bộ
 *     từng bước từ 1 cạnh xuất phát đoán mò, vốn lạc lối tại đỉnh chữ T bậc ≥4, xem git log).
 *     Mặt HỮU HẠN có diện tích đại số dương (đi ngược kim đồng hồ); mặt vô hạn âm → loại.
 *  4) Trong các mặt hữu hạn chứa pick-point (point-in-polygon), lấy mặt diện tích NHỎ NHẤT
 *     (ưu tiên vùng trong cùng khi có phòng lồng phòng).
 *
 * Nhờ liệt kê mặt TOÀN CỤC (không phụ thuộc cạnh xuất phát), phòng có vách khác đâm vào tường
 * bao tạo chữ T — trường hợp phổ biến của mặt bằng nhiều phòng, từng làm bản cũ trả null —
 * giờ dò đúng đa giác phòng (test [7]/[8] trong hatch.test.ts khoá hành vi này). Các "khe hở"
 * nhỏ nơi 2 quad tường không vát góc chồng lấn nhau vẫn là mặt thật của phân hoạch, nhưng chỉ
 * được trả về khi pick-point nằm TRONG khe đó (đúng nghĩa hình học).
 */

import type { Doc, Entity, Pt } from './model';
import { dist, nearestOnSeg, pointInPolygon, polygonArea } from './model';
import { entSegments } from './query';
import { infiniteLineIntersect } from './modify';
import { blockInfo } from './schedule';

function norm2pi(a: number): number {
  return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

/**
 * `pointInPolygon` + `polygonArea` ĐÃ DỜI xuống `./model` (04/09) và được XUẤT LẠI ở đây.
 * Lý do dời: `query.ts` cần chúng cho hit-test lòng vùng tô, mà tệp này đã nhập `entSegments`
 * từ `query.ts` ⇒ để nguyên là vòng import. Xuất lại để 6 nơi đang `import … from './hatch'`
 * không phải sửa dòng nào — đây là CHUYỂN NHÀ, không phải bản thứ hai.
 */
export { pointInPolygon, polygonArea };

/**
 * 2.1.9.q — chu vi (mm), TẤT CẢ cạnh hoặc chỉ cạnh được chọn qua `edgeMask` (cạnh `i` nối
 * `poly[i]→poly[(i+1)%length]`, `edgeMask[i]===false` → bỏ qua). Dùng cho m dài BOQ (chân
 * tường/nẹp/tay nắm) — "nẹp cạnh chỉ lấy cạnh biên, không lấy toàn chu vi"
 * (docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md §2①). Không `edgeMask` = chu vi đầy đủ.
 */
export function polygonPerimeter(poly: Pt[], edgeMask?: boolean[]): number {
  let total = 0;
  for (let i = 0; i < poly.length; i++) {
    if (edgeMask && edgeMask[i] === false) continue;
    total += dist(poly[i], poly[(i + 1) % poly.length]);
  }
  return total;
}

/** 2.1.9.q — ngưỡng diện tích lỗ mở (m²) TỐI THIỂU để trừ khỏi diện tích tường/sàn khi tính BOQ —
 * lỗ nhỏ hơn (ô thoáng, lam gió...) không đáng trừ, bỏ qua. Nguồn: ví dụ VD1 cửa 900×2100≈1,89m²
 * PHẢI trừ (docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md §2②) — vào CONFIG, không hard-code rải rác. */
export const BOQ_OPENING_MIN_AREA_M2 = 0.5;

/**
 * 2.1.9.q — chiều cao chuẩn nghề (mm) cho cửa/cửa sổ khi tính DIỆN TÍCH lỗ mở (m²).
 * ⚠️ PHÁT HIỆN khi khám code (Luật #4/#5 PHẦN E — khám trước khi code): `BlockDef.h` trong
 * `furniture.ts` KHÔNG phải chiều cao cửa/sổ thật — đó là chiều SÂU MẶT BẰNG (vd `door(900)` có
 * `h:900` = bán kính cung vẽ khi cửa mở, `window` có `h:100` = độ dày tường tại vị trí cửa sổ,
 * xem `furniture.ts:599-619`). `docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md` §2② giả định `w×h` ra
 * ngay diện tích thật — giả định đó SAI với dữ liệu 2D-mặt-bằng app này đang có. Dùng `w` (rộng
 * cửa/sổ, DỮ LIỆU THẬT từ `BLOCK_MAP`) × chiều cao chuẩn nghề công khai dưới đây (Luật #10 — tiêu
 * chuẩn nghề không hỏi) thay vì bịa theo từng block. `2.1.9.p` (BOQ thật, chưa greenlight) có thể
 * thêm field chiều cao THẬT riêng từng cửa/sổ khi cần chính xác hơn mức groundwork này.
 */
export const OPENING_STANDARD_HEIGHT_MM: Record<'door' | 'window', number> = {
  door: 2100, // dải chuẩn cửa đi 2000-2200mm, lấy giữa dải — cùng dải ANCHOR_CONFIG.door (2.2.87)
  window: 1500, // cửa sổ dân dụng phổ biến ~1400-1600mm bệ-đỉnh, lấy giữa dải
};

/**
 * 2.1.9.q — tổng diện tích (m²) các lỗ mở (cửa/cửa sổ) NẰM TRONG `poly`, dùng để trừ khỏi diện
 * tích tường/sàn khi tính BOQ. Đi đường (a) khuyến nghị của
 * docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md §2②: trừ theo entity ĐÃ PHÂN LOẠI
 * (`elementType==='door'|'window'`) nằm trong polygon — KHÔNG dò ring con bằng hình học (đắt, dễ
 * sai với bản vẽ thật). Chiều RỘNG lấy qua `blockInfo()` (`schedule.ts`, TÁI DÙNG — Luật #6, cùng
 * nguồn cột w bảng thống kê Legend C1); chiều CAO lấy `OPENING_STANDARD_HEIGHT_MM` (xem lý do ở
 * đó — `BlockDef.h` không phải chiều cao thật). Entity không có `w` (block DXF/lạ không có trong
 * `BLOCK_MAP`) → bỏ qua, không đoán mò. Chỉ trừ lỗ đạt `thresholdM2` trở lên.
 */
export function openingsAreaInPolygon(entities: Entity[], poly: Pt[], thresholdM2 = BOQ_OPENING_MIN_AREA_M2): number {
  let total = 0;
  for (const e of entities) {
    if (e.type !== 'block') continue;
    if (e.elementType !== 'door' && e.elementType !== 'window') continue;
    if (!pointInPolygon(e.at, poly)) continue;
    const { w } = blockInfo(e);
    if (!w) continue;
    const heightMm = OPENING_STANDARD_HEIGHT_MM[e.elementType];
    const areaM2 = (w * heightMm) / 1e6;
    if (areaM2 >= thresholdM2) total += areaM2;
  }
  return total;
}

/**
 * T4 (SPEC-VE-REVIT-MODE §A7.2) — dung sai (mm) để coi một cửa/cửa sổ là "nằm TRÊN biên" polygon:
 * khoảng cách từ điểm chèn block tới cạnh gần nhất ≤ số này. 150 = nửa bề dày tường phổ biến
 * (SỐ ĐỀ XUẤT của spec, chưa ai đo lại) — vào CONFIG theo tiền lệ `BOQ_OPENING_MIN_AREA_M2` (T15),
 * không hard-code trong thân hàm.
 */
export const OPENING_BOUNDARY_TOL_MM = 150;

/**
 * T4 (SPEC-VE-REVIT-MODE §A7.2) — tổng BỀ RỘNG (mm) các lỗ mở nằm TRÊN BIÊN `poly`, để TRỪ khỏi
 * chu vi khi tính m dài len chân tường / phào: phòng cạnh 5000 có cửa 900 giữa cạnh ⇒ len phải là
 * 5000−900=4100 — `edgeMask` của `polygonPerimeter` bật/tắt CẢ cạnh nên không diễn đạt được ca này.
 * Đối xứng với `openingsAreaInPolygon` (diện tích ↔ bề rộng): cùng chỉ nhận block ĐÃ PHÂN LOẠI
 * (`elementType==='door'|'window'`), rộng qua `blockInfo()` (TÁI DÙNG, cùng nguồn cột w bảng thống
 * kê), block lạ không có `w` → bỏ qua không đoán mò. Khác một điểm: điều kiện KHÔNG phải "trong
 * polygon" mà là "trên biên" — khoảng cách `block.at` → cạnh gần nhất ≤ `tolMm` (`nearestOnSeg`
 * model.ts, TÁI DÙNG — không viết phép chiếu mới).
 *
 * ⚠️ Rẽ nhánh theo LOẠI PHÀO qua `kinds` — spec cấm "trừ mù": len chân tường chỉ trừ CỬA ĐI
 * (mặc định `['door']` — cửa sổ có bệ, len vẫn chạy dưới); loại phào nào cần trừ cả cửa sổ
 * (vd nẹp ốp tường cao kịch trần) thì caller truyền `['door','window']` một cách CÓ Ý THỨC.
 *
 * Cách dùng dự kiến (spec §A7.6, BOQ nhánh m dài — T5 CHƯA tồn tại nên hàm này chưa có caller):
 *   m_dài = (polygonPerimeter(poly, mask) − openingsWidthOnBoundary(entities, poly)) / 1000
 */
export function openingsWidthOnBoundary(
  entities: Entity[],
  poly: Pt[],
  tolMm = OPENING_BOUNDARY_TOL_MM,
  kinds: ReadonlyArray<'door' | 'window'> = ['door'],
): number {
  let total = 0;
  for (const e of entities) {
    if (e.type !== 'block') continue;
    if (e.elementType !== 'door' && e.elementType !== 'window') continue;
    if (!kinds.includes(e.elementType)) continue;
    let minD = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const { d } = nearestOnSeg(e.at, poly[i], poly[(i + 1) % poly.length]);
      if (d < minD) minD = d;
    }
    if (minD > tolMm) continue;
    const { w } = blockInfo(e);
    if (!w) continue;
    total += w;
  }
  return total;
}

/** Lấy mọi đoạn thẳng biên khả dĩ từ entity hiển thị trong `doc` (circle/arc xấp xỉ đa giác). */
export function collectBoundarySegments(doc: Doc, arcSteps = 24): [Pt, Pt][] {
  const segs: [Pt, Pt][] = [];
  for (const e of doc.entities) {
    const lay = doc.layers.find((l) => l.id === e.layer);
    if (lay && !lay.visible) continue;
    if (e.type === 'circle') {
      const pts: Pt[] = [];
      for (let i = 0; i < arcSteps; i++) {
        const a = (i / arcSteps) * Math.PI * 2;
        pts.push({ x: e.c.x + e.r * Math.cos(a), y: e.c.y + e.r * Math.sin(a) });
      }
      for (let i = 0; i < pts.length; i++) segs.push([pts[i], pts[(i + 1) % pts.length]]);
    } else if (e.type === 'arc') {
      const sweep = norm2pi(e.a2 - e.a1) || Math.PI * 2;
      const steps = Math.max(4, Math.round(arcSteps * (sweep / (Math.PI * 2))));
      const pts: Pt[] = [];
      for (let i = 0; i <= steps; i++) {
        const a = e.a1 + (sweep * i) / steps;
        pts.push({ x: e.c.x + e.r * Math.cos(a), y: e.c.y + e.r * Math.sin(a) });
      }
      for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]]);
    } else if (e.type !== 'text' && e.type !== 'block') {
      segs.push(...entSegments(e));
    }
  }
  return segs;
}

const EPS = 1e-6;

/**
 * Cắt mọi đoạn tại giao điểm với đoạn khác → đoạn "nguyên tử" (mặt phẳng phân hoạch).
 * Cắt cả 3 kiểu giao:
 *  - giao CHÉO thường (t, u đều nằm trong lòng 2 đoạn);
 *  - giao CHẠM ĐẦU MÚT — đầu đoạn kia đậu giữa lòng đoạn này (đỉnh chữ T): vẫn phải cắt đoạn
 *    này, nếu không đỉnh T nằm "chìm" giữa cạnh và DCEL không biết tới nó;
 *  - chồng lấn THẲNG HÀNG một phần: chiếu đầu mút đoạn kia lên đoạn này để cắt (phần trùng
 *    nhau sau đó bị loại bởi bước dedupe trong buildAtomicSegments).
 */
/** Dưới ngưỡng này giữ nguyên vòng lặp đôi trần — đo được 400 đoạn = 23ms, dựng lưới còn tốn hơn.
 * (Số đo đầy đủ ở docstring `splitAtIntersections`.) */
const BROADPHASE_MIN_SEGS = 400;
/** Trần số ô mỗi trục — chặn ca bệnh "1 đoạn dài xuyên cả bản vẽ" làm lưới phình vô hạn. */
const BROADPHASE_MAX_CELLS_PER_AXIS = 256;

/**
 * Lọc thô bằng LƯỚI KHÔNG GIAN: gọi `visit(i, k)` cho MỌI cặp đoạn có bbox chạm nhau, mỗi cặp
 * ĐÚNG MỘT LẦN. Cặp bbox rời nhau bị bỏ — chúng không thể giao nhau, cũng không thể chồng lấn
 * thẳng hàng, nên bỏ đi không đổi kết quả (xem docstring `splitAtIntersections`).
 *
 * Chống trùng: một cặp có thể cùng nằm trong nhiều ô. Chỉ xử ở ô GÓC TRÊN-TRÁI của phần giao
 * giữa hai dải ô — ô đó chắc chắn thuộc cả hai dải nên cặp không bao giờ bị bỏ sót, và chỉ khớp
 * đúng một ô nên không lặp. (Rẻ hơn Set cặp: không cấp phát, không băm.)
 */
function forEachNearbyPair(segs: [Pt, Pt][], visit: (i: number, k: number) => void): void {
  const n = segs.length;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let sumExtent = 0;
  for (const [a, b] of segs) {
    minX = Math.min(minX, a.x, b.x); maxX = Math.max(maxX, a.x, b.x);
    minY = Math.min(minY, a.y, b.y); maxY = Math.max(maxY, a.y, b.y);
    sumExtent += Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  }
  const spanX = Math.max(maxX - minX, 1e-6);
  const spanY = Math.max(maxY - minY, 1e-6);
  // Ô ≈ chiều dài đoạn trung bình: đủ nhỏ để lọc mạnh, đủ lớn để đa số đoạn chỉ nằm 1-4 ô.
  const cell = Math.max(
    sumExtent / n || 1,
    spanX / BROADPHASE_MAX_CELLS_PER_AXIS,
    spanY / BROADPHASE_MAX_CELLS_PER_AXIS,
    1e-6,
  );
  // +2 chỗ dư: chỉ số được DỜI +1 ngay dưới nên cột lớn nhất là ceil(spanX/cell)+1.
  const cols = Math.max(1, Math.ceil(spanX / cell) + 2);

  /* Dải ô của từng đoạn (bbox nới EPS để ca chạm-đúng-mép không rơi nhầm ô).
   * ⚠️ DỜI +1: đoạn nằm sát mép trái/dưới có `min - minX - EPS` âm một chút ⇒ `floor` ra **-1**.
   * Khoá ô là `y*cols + x`, nên x = -1 trùng khoá với (y-1, cols-1) — hai đoạn xa lắc bị gom
   * chung rổ, và tệ hơn: luật "chỉ xử ở ô góc trên-trái" khi đó trỏ vào một ô KHÔNG tồn tại nên
   * cặp bị bỏ QUA HẲN. Test đối chiếu `hatch-perf.test.ts` [1] bắt đúng lỗi này (lệch 1393 vs
   * 1391 đoạn nguyên tử trên lưới trực giao) — giữ nguyên bẫy, đừng bỏ dời. */
  const ix0 = new Int32Array(n), ix1 = new Int32Array(n), iy0 = new Int32Array(n), iy1 = new Int32Array(n);
  const buckets = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const [a, b] = segs[i];
    const x0 = Math.floor((Math.min(a.x, b.x) - minX - EPS) / cell) + 1;
    const x1 = Math.floor((Math.max(a.x, b.x) - minX + EPS) / cell) + 1;
    const y0 = Math.floor((Math.min(a.y, b.y) - minY - EPS) / cell) + 1;
    const y1 = Math.floor((Math.max(a.y, b.y) - minY + EPS) / cell) + 1;
    ix0[i] = x0; ix1[i] = x1; iy0[i] = y0; iy1[i] = y1;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const key = y * cols + x;
        const arr = buckets.get(key);
        if (arr) arr.push(i);
        else buckets.set(key, [i]);
      }
    }
  }

  for (const [key, list] of buckets) {
    if (list.length < 2) continue;
    const cx = key % cols;
    const cy = (key - cx) / cols;
    for (let p = 0; p < list.length; p++) {
      const i = list[p];
      for (let q = p + 1; q < list.length; q++) {
        const k = list[q];
        // bbox rời nhau ⇒ bỏ (đây mới là phép lọc thật; ô lưới chỉ để khỏi duyệt hết n²)
        if (ix0[i] > ix1[k] || ix0[k] > ix1[i] || iy0[i] > iy1[k] || iy0[k] > iy1[i]) continue;
        // chỉ xử ở ô góc trên-trái của phần giao — chống xử trùng cặp
        if (Math.max(ix0[i], ix0[k]) !== cx || Math.max(iy0[i], iy0[k]) !== cy) continue;
        visit(i, k);
      }
    }
  }
}

/**
 * 🔴 SỬA 05/08 (PHU q8, TECH-DEBT "findHatchBoundary treo >2 phút ở mật độ cao"):
 * vòng lặp đôi dưới đây so MỌI CẶP đoạn của TOÀN bản vẽ ⇒ O(n²) với n = số đoạn biên
 * (`collectBoundarySegments` gom mọi entity hiển thị, không lọc theo vị trí bấm). Đo thật trên
 * mặt bằng lưới phòng (mỗi phòng 1 chữ nhật riêng + 2 món đồ):
 *
 * | đoạn biên | TRƯỚC |
 * |---|---|
 * | 1.200 | 49 ms |
 * | 8.112 | 1,02 s |
 * | 21.168 | 6,33 s |
 * | 43.200 | 29,6 s |
 * | 76.800 | **92,4 s** |
 *
 * Bản vẽ nhập từ DWG thật dễ vượt 50k đoạn ⇒ đúng triệu chứng "treo >2 phút" đã ghi sổ.
 *
 * CÁCH SỬA: lọc thô bằng LƯỚI KHÔNG GIAN — hai đoạn chỉ có thể giao/chồng nhau khi bbox của
 * chúng chạm nhau, nên chỉ cần xét các cặp cùng rơi vào một ô lưới. **Không đổi kết quả**: bước
 * cắt phía dưới gom `params[i]` qua `new Set(...)` + `sort()` nên THỨ TỰ đẩy tham số không ảnh
 * hưởng đầu ra; các cặp bị lưới loại đều là cặp không thể sinh tham số hợp lệ (tham số của chúng
 * rơi ngoài (0,1)). Có test đối chiếu cũ↔mới trên dữ liệu ngẫu nhiên: `hatch-perf.test.ts`.
 */
export function splitAtIntersections(segs: [Pt, Pt][], broadphaseMinSegs = BROADPHASE_MIN_SEGS): [Pt, Pt][] {
  const params: number[][] = segs.map(() => [0, 1]);

  const handlePair = (i: number, k: number) => {
    const [a, b] = segs[i];
    const [c, d] = segs[k];
    const r = infiniteLineIntersect(a, b, c, d);
    if (r) {
      if (r.t > EPS && r.t < 1 - EPS && r.u >= -EPS && r.u <= 1 + EPS) params[i].push(r.t);
      if (r.u > EPS && r.u < 1 - EPS && r.t >= -EPS && r.t <= 1 + EPS) params[k].push(r.u);
      return;
    }
    // song song — chỉ quan tâm khi THẲNG HÀNG (điểm c nằm trên đường ab)
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const ab2 = abx * abx + aby * aby;
    if (ab2 < EPS) return;
    const perp = Math.abs(abx * (c.y - a.y) - aby * (c.x - a.x)) / Math.sqrt(ab2);
    if (perp > 1e-4) return;
    const tOf = (p: Pt) => (abx * (p.x - a.x) + aby * (p.y - a.y)) / ab2;
    for (const t of [tOf(c), tOf(d)]) if (t > EPS && t < 1 - EPS) params[i].push(t);
    const cdx = d.x - c.x;
    const cdy = d.y - c.y;
    const cd2 = cdx * cdx + cdy * cdy;
    if (cd2 < EPS) return;
    const uOf = (p: Pt) => (cdx * (p.x - c.x) + cdy * (p.y - c.y)) / cd2;
    for (const u of [uOf(a), uOf(b)]) if (u > EPS && u < 1 - EPS) params[k].push(u);
  };

  if (segs.length < broadphaseMinSegs) {
    for (let i = 0; i < segs.length; i++) for (let k = i + 1; k < segs.length; k++) handlePair(i, k);
  } else {
    forEachNearbyPair(segs, handlePair);
  }

  const out: [Pt, Pt][] = [];
  for (let i = 0; i < segs.length; i++) {
    const [a, b] = segs[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const ts = Array.from(new Set(params[i].map((t) => Math.round(t * 1e6) / 1e6))).sort((x, y) => x - y);
    for (let k = 0; k + 1 < ts.length; k++) {
      const p0 = { x: a.x + dx * ts[k], y: a.y + dy * ts[k] };
      const p1 = { x: a.x + dx * ts[k + 1], y: a.y + dy * ts[k + 1] };
      if (dist(p0, p1) > 1e-6) out.push([p0, p1]);
    }
  }
  return out;
}

function keyOf(p: Pt): string {
  return `${Math.round(p.x * 100)}:${Math.round(p.y * 100)}`; // gộp đỉnh trùng trong sai số 0.01mm
}

/** Hút toạ độ về đúng lưới 0.01mm của keyOf — để góc cạnh tính từ toạ độ khớp tuyệt đối với đỉnh đã gộp. */
function snap(p: Pt): Pt {
  return { x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 };
}

/** splitAtIntersections + hút lưới + loại đoạn suy biến/TRÙNG LẶP (hatch và polyline của cùng 1
 * wallSegment phát ra 2 bộ cạnh y hệt nhau — giữ cả 2 thì mỗi cạnh tường thành cạnh đôi, DCEL
 * ghép twin sai). */
function buildAtomicSegments(segs: [Pt, Pt][]): [Pt, Pt][] {
  const out: [Pt, Pt][] = [];
  const seen = new Set<string>();
  for (const [a0, b0] of splitAtIntersections(segs)) {
    const a = snap(a0);
    const b = snap(b0);
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (ka === kb) continue;
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([a, b]);
  }
  return out;
}

/** Diện tích ĐẠI SỐ (shoelace có dấu): >0 = đi ngược kim đồng hồ (mặt hữu hạn của DCEL bên dưới). */
function signedArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/**
 * Liệt kê MỌI mặt hữu hạn của mặt phẳng phân hoạch (DCEL kinh điển):
 * mỗi đoạn nguyên tử → 2 nửa-cạnh ngược chiều; tại mỗi đỉnh sắp nửa-cạnh đi ra theo góc tăng
 * dần (ngược kim đồng hồ); next của (u→v) = nửa-cạnh đứng ngay TRƯỚC twin (v→u) trong vòng sắp
 * đó. Mỗi nửa-cạnh thuộc đúng 1 mặt; mặt hữu hạn khép theo chiều ngược kim đồng hồ (diện tích
 * đại số dương), mặt vô hạn âm — chỉ trả mặt hữu hạn.
 */
function enumerateFaces(atomic: [Pt, Pt][]): Pt[][] {
  interface HalfEdge { from: Pt; fromKey: string; toKey: string; ang: number; twin: number; next: number }
  const hes: HalfEdge[] = [];
  for (const [a, b] of atomic) {
    const i = hes.length;
    hes.push({ from: a, fromKey: keyOf(a), toKey: keyOf(b), ang: Math.atan2(b.y - a.y, b.x - a.x), twin: i + 1, next: -1 });
    hes.push({ from: b, fromKey: keyOf(b), toKey: keyOf(a), ang: Math.atan2(a.y - b.y, a.x - b.x), twin: i, next: -1 });
  }
  const outgoing = new Map<string, number[]>();
  hes.forEach((h, i) => {
    if (!outgoing.has(h.fromKey)) outgoing.set(h.fromKey, []);
    outgoing.get(h.fromKey)!.push(i);
  });
  const posInRing = new Array<number>(hes.length);
  for (const ring of outgoing.values()) {
    ring.sort((x, y) => hes[x].ang - hes[y].ang);
    ring.forEach((he, pos) => { posInRing[he] = pos; });
  }
  for (let i = 0; i < hes.length; i++) {
    const ring = outgoing.get(hes[i].toKey)!;
    hes[i].next = ring[(posInRing[hes[i].twin] - 1 + ring.length) % ring.length];
  }
  const faces: Pt[][] = [];
  const visited = new Array<boolean>(hes.length).fill(false);
  for (let i = 0; i < hes.length; i++) {
    if (visited[i]) continue;
    const poly: Pt[] = [];
    let cur = i;
    let guard = hes.length + 1;
    while (!visited[cur] && guard-- > 0) {
      visited[cur] = true;
      poly.push(hes[cur].from);
      cur = hes[cur].next;
    }
    if (cur !== i || poly.length < 3) continue; // vòng không khép về nửa-cạnh xuất phát — bỏ
    if (signedArea(poly) > EPS) faces.push(poly);
  }
  return faces;
}

/**
 * Chỉ mục MẶT dựng SẴN cho một tập đoạn biên — dựng MỘT lần, hỏi N lần (05/08, PHU).
 *
 * Vì sao cần: `traceHatchBoundary` làm 3 việc, nhưng chỉ việc thứ 3 phụ thuộc `pick` —
 * `buildAtomicSegments` (cắt giao điểm) và `enumerateFaces` (dựng DCEL) chỉ phụ thuộc `segs`.
 * `docToObjScene` (`lib/three/cad-to-obj.ts`) gọi `findHatchBoundary` MỘT LẦN CHO MỖI món đồ
 * nội thất ⇒ dựng lại toàn bộ phân hoạch mặt phẳng N lần cho cùng một bản vẽ.
 *
 * Số đo thật (bench phiên này, mặt bằng lưới phòng, mỗi phòng 1 chữ nhật + 2 món đồ):
 *
 *   lưới     phòng   lần hỏi   đoạn biên   1 lời gọi   N LỜI GỌI (bản cũ)
 *   17×17      289       578       3.468       26 ms        12,2 s
 *   24×24      576     1.152       6.912       17 ms        42,4 s
 *   34×34    1.156     2.312      13.872      216 ms      ~173 s  ← "treo >2 phút" của TECH-DEBT
 *   42×42    1.764     3.528      21.168       84 ms      ~353 s
 *
 * (Trần O(n²) của `splitAtIntersections` là chuyện KHÁC và đã vá trước đó — xem
 * `hatch-perf.test.ts`. Bảng trên đo TRÊN bản đã có lưới không gian: phần còn lại thuần là
 * "dựng lại N lần".)
 */
export interface HatchFaceIndex {
  faces: Pt[][];
  /** Diện tích từng mặt — tính sẵn để bước hỏi không gọi `polygonArea` lại mỗi lần. */
  areas: number[];
  /** bbox từng mặt, phẳng [minX,minY,maxX,maxY]×n — lọc thô trước `pointInPolygon` (đắt hơn nhiều). */
  bboxes: Float64Array;
}

/** Dựng chỉ mục mặt từ tập đoạn biên. Rỗng ⇒ `faces` rỗng (mọi lần hỏi trả null, không nổ). */
export function buildHatchFaceIndex(segs: [Pt, Pt][]): HatchFaceIndex {
  const atomic = buildAtomicSegments(segs);
  const faces = atomic.length ? enumerateFaces(atomic) : [];
  const areas = faces.map(polygonArea);
  const bboxes = new Float64Array(faces.length * 4);
  faces.forEach((f, i) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of f) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    bboxes[i * 4] = minX; bboxes[i * 4 + 1] = minY; bboxes[i * 4 + 2] = maxX; bboxes[i * 4 + 3] = maxY;
  });
  return { faces, areas, bboxes };
}

/** Hỏi chỉ mục: mặt hữu hạn NHỎ NHẤT chứa `pick` (vùng trong cùng). null nếu không có. */
export function pickHatchFace(index: HatchFaceIndex, pick: Pt): Pt[] | null {
  let best: Pt[] | null = null;
  let bestArea = Infinity;
  const { faces, areas, bboxes } = index;
  for (let i = 0; i < faces.length; i++) {
    // Mặt nhỏ hơn mới có cửa thắng — so diện tích TRƯỚC (1 phép so) rồi mới tới bbox rồi mới
    // `pointInPolygon` (O(số đỉnh)). Thứ tự này rẻ dần từ trái sang phải, cố ý.
    if (areas[i] >= bestArea) continue;
    const b = i * 4;
    if (pick.x < bboxes[b] || pick.x > bboxes[b + 2] || pick.y < bboxes[b + 1] || pick.y > bboxes[b + 3]) continue;
    if (!pointInPolygon(pick, faces[i])) continue;
    bestArea = areas[i];
    best = faces[i];
  }
  return best;
}

/** Dò biên vùng kín chứa `pick` từ tập đoạn thẳng biên khả dĩ `segs`. null nếu không tìm ra.
 * Trong mọi mặt hữu hạn chứa pick, trả mặt diện tích NHỎ NHẤT (vùng trong cùng).
 * Hỏi NHIỀU điểm trên CÙNG tập `segs` thì dùng `buildHatchFaceIndex` + `pickHatchFace` — hàm
 * này dựng lại phân hoạch mỗi lần gọi (xem bảng số đo ở `HatchFaceIndex`). */
export function traceHatchBoundary(segs: [Pt, Pt][], pick: Pt): Pt[] | null {
  return pickHatchFace(buildHatchFaceIndex(segs), pick);
}

/** Tiện ích 1-bước: dò biên trực tiếp từ Doc + pick-point (dùng cho lệnh H trong CadCanvas —
 * ở đó người dùng bấm MỘT điểm nên dựng-rồi-bỏ là đúng, không phí gì). */
export function findHatchBoundary(doc: Doc, pick: Pt, arcSteps = 24): Pt[] | null {
  return traceHatchBoundary(collectBoundarySegments(doc, arcSteps), pick);
}

/* ───────────────────────── Sinh pattern (Nấc 4) ───────────────────────── */

/** Cắt 1 đường vô hạn (qua `base`, hướng `dir`) theo polygon → các đoạn NẰM TRONG polygon
 * (even-odd rule dựa trên thứ tự giao điểm dọc đường — thuật toán scanline chuẩn cho hatch). */
function clipLineAgainstPolygon(base: Pt, dir: Pt, poly: Pt[]): [Pt, Pt][] {
  const ts: number[] = [];
  const b2 = { x: base.x + dir.x, y: base.y + dir.y };
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const c = poly[(i + 1) % poly.length];
    const r = infiniteLineIntersect(base, b2, a, c);
    if (r && r.u >= 0 && r.u < 1) ts.push(r.t);
  }
  ts.sort((x, y) => x - y);
  const segs: [Pt, Pt][] = [];
  for (let i = 0; i + 1 < ts.length; i += 2) {
    const p0 = { x: base.x + dir.x * ts[i], y: base.y + dir.y * ts[i] };
    const p1 = { x: base.x + dir.x * ts[i + 1], y: base.y + dir.y * ts[i + 1] };
    if (dist(p0, p1) > 1e-6) segs.push([p0, p1]);
  }
  return segs;
}

/** 1 họ đường song song góc `angleDeg`, bước `spacing`, phủ hết polygon rồi cắt theo polygon. */
function oneFamily(poly: Pt[], spacing: number, angleDeg: number): [Pt, Pt][] {
  const ang = (angleDeg * Math.PI) / 180;
  const dir = { x: Math.cos(ang), y: Math.sin(ang) };
  const normal = { x: -dir.y, y: dir.x };
  let minP = Infinity;
  let maxP = -Infinity;
  for (const p of poly) {
    const proj = p.x * normal.x + p.y * normal.y;
    minP = Math.min(minP, proj);
    maxP = Math.max(maxP, proj);
  }
  const out: [Pt, Pt][] = [];
  const start = Math.floor(minP / spacing) * spacing;
  for (let off = start; off <= maxP + 1e-6; off += spacing) {
    const base = { x: normal.x * off, y: normal.y * off };
    out.push(...clipLineAgainstPolygon(base, dir, poly));
  }
  return out;
}

/** Lưới điểm chấm (DOTS) trong polygon, bước `spacing`. */
export function hatchDots(poly: Pt[], scale: number): Pt[] {
  const spacing = Math.max(10, 150 * Math.max(0.05, scale));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const out: Pt[] = [];
  for (let y = minY; y <= maxY; y += spacing) {
    for (let x = minX; x <= maxX; x += spacing) {
      const p = { x, y };
      if (pointInPolygon(p, poly)) out.push(p);
    }
  }
  return out;
}

/**
 * Sinh đoạn thẳng pattern cho ANSI31/ANSI32/ANSI37 (xấp xỉ đơn giản hoá — KHÔNG phải bảng pattern
 * gốc AutoCAD từng-milimet, nhưng đúng tinh thần: ANSI31 = 1 họ chéo 45°, ANSI32 = 1 họ thưa hơn,
 * ANSI37 = 2 họ vuông góc (crosshatch)). scale=1 ⇒ bước cơ sở 60mm; angle tính thêm vào 45° gốc.
 */
export function hatchLines(poly: Pt[], pattern: 'ANSI31' | 'ANSI32' | 'ANSI37', scale: number, angleDeg: number): [Pt, Pt][] {
  const s = Math.max(0.05, scale);
  if (pattern === 'ANSI31') return oneFamily(poly, 60 * s, 45 + angleDeg);
  if (pattern === 'ANSI32') return oneFamily(poly, 120 * s, 45 + angleDeg);
  return [...oneFamily(poly, 90 * s, 45 + angleDeg), ...oneFamily(poly, 90 * s, 135 + angleDeg)];
}
