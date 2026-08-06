/**
 * lib/cad/workstation-clusters.ts — CỤM BÀN LÀM VIỆC SINH BẰNG HÀM (§0f TB4).
 * Hàm THUẦN. Test: `node_modules/.bin/sucrase-node lib/cad/workstation-clusters.test.ts`.
 *
 * ▸ VÌ SAO (phiếu): cụm bàn là hình học CÓ QUY LUẬT — n bàn, w×h, quay quanh tâm, vách dày d.
 * Vẽ tay thì đổi số phải vẽ lại = TRANG TRÍ, không phải thiết kế. Sinh bằng hàm thì đổi bàn
 * 1400×700 → 1500×750 là cụm tự giãn, clearance tự tính lại.
 *
 * ▸ §0b SEARCH — thứ ĐÃ CÓ, không viết lại:
 *   · `Prim` + khuôn dựng hình 2D: `lib/cad/furniture.ts:18` — dùng NGUYÊN, không đẻ kiểu mới.
 *   · `ClearanceZone`: `lib/cad/shared-types.ts:49` — **IMPORT**, luật ở đầu file đó ghi rõ
 *     "mọi chỗ cần dùng PHẢI import từ đây, KHÔNG định nghĩa lại" (đã gây conflict 3 lần).
 *   · Bàn ăn/bàn làm việc ĐƠN đã có sẵn (`furniture.ts:518` dining4/6/8, `:562` desk) — nhưng
 *     chúng là BLOCK TĨNH một cỡ, không phải cụm sinh theo tham số. Không đụng.
 *   · `railingPosts()` (`commands.ts`) là tiền lệ "sinh cụm bằng hàm" ở tầng Entity; file này làm
 *     ở tầng `Prim` (trong lòng 1 block) theo đúng phiếu.
 *
 * ▸ CHUẨN VẼ: **MỘT cấp nét trong một block** — `Prim` không mang bề dày nên điều này tự đúng;
 * phân cấp 4:2:1 chỉ áp khi block đã đặt vào bản vẽ cùng tường/dim, KHÔNG áp nội bộ block.
 * Ghế vẽ TIẾT CHẾ: **mâm + lưng + 2 tay**. Không chân sao, không bánh xe.
 *
 * ▸ SỐ LIỆU CÔNG THÁI HỌC — lấy từ nguồn ĐÃ CÓ TRONG REPO, không bịa:
 *   · `lib/cad/standards/neufert.ts:96` `neufert-dining-space-per-person`
 *     → `seatWidthMm: 600` · `chairPullbackMm: 750`.
 *   · `lib/cad/standards/neufert.ts:36` `neufert-circulation-one-person` → `minWidthMm: 750`.
 *   Trị số phiếu yêu cầu (lối vào ghế ≥700, lối đi quanh bàn họp ≥900) DÙNG ĐÚNG như phiếu ghi.
 *
 * ▸ ✅ **NGUỒN THAM CHIẾU NAY ĐÃ CÓ — đã đối chiếu (cập nhật 05/08, phiên S3)**. Ghi chú cũ ở đây
 * nói `docs/00-PHAN-TICH-NGUON-THAM-CHIEU.md` không tồn tại; **nay file ĐÃ có trong repo** và
 * bảng "Kích thước rút được từ ảnh" của nó xác nhận ĐÚNG mọi trị số file này đang dùng:
 *   · cụm chữ Y bao ngoài **6955 × 6023 mm**, cánh **600+60+600**, nhịp **1200** (nguồn `E1`)
 *   · bàn trong cụm 120° **1200 × 600**, vách **600**, góc **120°** (nguồn `E2`)
 *   · bàn họp 12 người **94″ × 36″ = 2388 × 914 mm** (nguồn `D1`)
 * ⇒ `CLUSTER_Y_HUB_R_MM = 2452` suy từ 6955/6023 (cách suy ghi ở chỗ khai hằng số) nay **có
 * nguồn đối chiếu**, không còn là "suy từ chữ trong phiếu". Lệch 478 vs 600 mm/chỗ của bàn họp
 * vẫn giữ nguyên cách xử lý cũ (mặc định Neufert, cho chỉnh) — xem `meetingTable()`.
 * ⚠️ Ảnh gốc `E1`/`E2`/`D1` vẫn CHƯA mở được từ repo (`docs/reference/` chưa có) — đối chiếu ở
 * đây là với **bảng số đã chưng cất trong `00-PHAN-TICH-NGUON-THAM-CHIEU.md`**, không phải với
 * ảnh có dim. Nói rõ để không ai tưởng đã kiểm tới tận ảnh.
 */

import type { Prim } from './furniture';
import type { ClearanceZone } from './shared-types';

/* ═════════════════════ khuôn chung ═════════════════════ */

export interface ClusterResult {
  /** hình học, hệ LOCAL mm, gốc = TÂM cụm (cùng quy ước block của `furniture.ts`). */
  prims: Prim[];
  /**
   * `prims` TÁCH LÀM HAI (thêm 05/08, S3) — để checkpoint duyệt theo phần được (§0e KS3).
   * Không phải chia cho vui: bản vẽ bố trí kỹ thuật rất hay vẽ bàn+vách mà BỎ ghế, nên "nhận bàn,
   * bỏ ghế" là thao tác nghề thật. `prims === [...deskPrims, ...chairPrims]` — luôn đúng, xem
   * `finish()`.
   */
  deskPrims: Prim[];
  chairPrims: Prim[];
  /** vùng chờ bắt buộc — hcn LOCAL, gốc TÂM (`shared-types.ts:49`). */
  clearance: ClearanceZone[];
  /** BAO NGOÀI THẬT của cụm KỂ CẢ GHẾ (mm) — đo từ chính `prims`, không phải số khai tay. */
  sizeMm: { w: number; h: number };
  /**
   * Bao ngoài của RIÊNG MẶT BÀN + VÁCH, **không tính ghế**. Đây là con số các bản vẽ bố trí nội
   * thất thường ghi dim (ghế bị đẩy ra/đẩy vào nên không ai lấy làm kích thước cụm).
   * Tách riêng vì hai số lệch nhau đáng kể — xem `clusterY()`.
   */
  deskEnvelopeMm: { w: number; h: number };
  seats: number;
  /** m²/chỗ TÍNH RIÊNG BÀN (bao ngoài ÷ số chỗ) — chỉ số so sánh chính giữa các cụm. */
  areaPerSeatM2: number;
  /** m²/chỗ TÍNH CẢ vùng chờ (bao ngoài đã nới ra hết clearance). Đây mới là số so với
   * TCVN 4601 (≥1,80 m²/người cho phòng họp có bàn). */
  areaPerSeatWithClearanceM2: number;
}

/* ── trị số nền, có nguồn (xem docstring đầu file) ── */
/** Neufert: bề rộng 1 chỗ ngồi ăn/họp. `neufert.ts:96` `seatWidthMm`. */
export const SEAT_WIDTH_MM = 600;
/** Phiếu: lối vào ghế ≥700mm sau lưng ghế. (Neufert `chairPullbackMm` 750 rộng rãi hơn — dùng 700
 * theo đúng phiếu, ghi ra để biết đây là mức TỐI THIỂU chứ không phải mức thoải mái.) */
export const CHAIR_ACCESS_MM = 700;
/** Phiếu: lối đi quanh bàn họp ≥900mm mỗi bên. */
export const MEETING_AISLE_MM = 900;

const rect = (cx: number, cy: number, w: number, h: number): Prim => ({
  k: 'poly',
  pts: [
    { x: cx - w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy + h / 2 },
    { x: cx - w / 2, y: cy + h / 2 },
  ],
  closed: true,
});

/** Xoay 1 điểm quanh gốc. */
function rot(p: { x: number; y: number }, a: number): { x: number; y: number } {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

/** Xoay + dời cả một đám prim (dùng cho cụm toả tia — chữ Y, 120°, chữ thập). */
function place(prims: Prim[], angle: number, dx = 0, dy = 0): Prim[] {
  const tp = (p: { x: number; y: number }) => {
    const r = rot(p, angle);
    return { x: r.x + dx, y: r.y + dy };
  };
  return prims.map((pr): Prim => {
    if (pr.k === 'poly') return { k: 'poly', pts: pr.pts.map(tp), closed: pr.closed };
    if (pr.k === 'line') return { k: 'line', a: tp(pr.a), b: tp(pr.b) };
    if (pr.k === 'circle') return { k: 'circle', c: tp(pr.c), r: pr.r };
    return { k: 'arc', c: tp(pr.c), r: pr.r, a1: pr.a1 + angle, a2: pr.a2 + angle };
  });
}

/**
 * GHẾ — tiết chế đúng chuẩn phiếu: **mâm + lưng + 2 tay**, KHÔNG chân sao, KHÔNG bánh xe.
 * Gốc = tâm mâm ghế; ghế "quay lên" (+y là hướng người ngồi nhìn tới, lưng ở phía −y).
 */
export function chairPrims(seatW = 460, seatD = 460): Prim[] {
  const armT = 60;
  const backT = 70;
  return [
    rect(0, 0, seatW, seatD), // mâm
    rect(0, -seatD / 2 - backT / 2, seatW, backT), // lưng
    rect(-seatW / 2 - armT / 2, 0, armT, seatD * 0.7), // tay trái
    rect(seatW / 2 + armT / 2, 0, armT, seatD * 0.7), // tay phải
  ];
}

/** Bao ngoài THẬT của một đám prim — đo, không khai tay (nghiệm thu cần số đo được). */
export function primsBBox(prims: Prim[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  for (const p of prims) {
    if (p.k === 'poly') for (const q of p.pts) add(q.x, q.y);
    else if (p.k === 'line') {
      add(p.a.x, p.a.y);
      add(p.b.x, p.b.y);
    } else {
      add(p.c.x - p.r, p.c.y - p.r);
      add(p.c.x + p.r, p.c.y + p.r);
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

/** Đóng gói kết quả — m²/chỗ luôn tính TỪ HÌNH HỌC THẬT, không nhận số khai tay. */
function finish(deskPrims: Prim[], chairs: Prim[], clearance: ClearanceZone[], seats: number): ClusterResult {
  const prims = [...deskPrims, ...chairs];
  const b = primsBBox(prims);
  const d = primsBBox(deskPrims);
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;

  // Bao ngoài nới ra hết vùng chờ — đây mới là diện tích chiếm chỗ thật trên mặt bằng.
  let cx0 = b.minX;
  let cy0 = b.minY;
  let cx1 = b.maxX;
  let cy1 = b.maxY;
  for (const c of clearance) {
    cx0 = Math.min(cx0, c.x - c.w / 2);
    cx1 = Math.max(cx1, c.x + c.w / 2);
    cy0 = Math.min(cy0, c.y - c.h / 2);
    cy1 = Math.max(cy1, c.y + c.h / 2);
  }
  const m2 = (a: number, bb: number) => (a / 1000) * (bb / 1000);
  const n = Math.max(1, seats);
  return {
    prims,
    deskPrims,
    chairPrims: chairs,
    clearance,
    sizeMm: { w, h },
    deskEnvelopeMm: { w: d.maxX - d.minX, h: d.maxY - d.minY },
    seats,
    areaPerSeatM2: Math.round((m2(w, h) / n) * 100) / 100,
    areaPerSeatWithClearanceM2: Math.round((m2(cx1 - cx0, cy1 - cy0) / n) * 100) / 100,
  };
}

/* ═════════════════════ ① clusterSpineL — ƯU TIÊN 1 ═════════════════════ */

/**
 * **CHỮ L XƯƠNG SỐNG** — bàn chữ L đối lưng qua một VÁCH CHUNG chạy dọc (xương sống), lối đi hai
 * đầu. Đây là kiểu đặc nhất về mật độ: phiếu đo được **1,65 m²/chỗ riêng bàn**, so với chữ thập
 * 4,9 m²/chỗ — chênh 3 lần. Đúng thứ 391 chỗ trên 6 sàn cần.
 *
 * `n` = tổng số chỗ (chia đôi hai bên xương sống; lẻ thì bên trái nhiều hơn 1).
 * Bàn chữ L = thân `deskW × wingW` + cánh `wingW × wingW` vuông góc.
 */
export function clusterSpineL(n: number, deskW = 1400, wingW = 700, partition = 60): ClusterResult {
  const seats = Math.max(1, Math.floor(n));
  const left = Math.ceil(seats / 2);
  const right = seats - left;
  const perSide = Math.max(left, right);

  const desks: Prim[] = [];
  const chairs: Prim[] = [];
  const spineLen = perSide * deskW;

  // Xương sống: một vách liền chạy hết chiều dài cụm (dùng CHUNG cho cả hai bên — đó là chỗ tiết
  // kiệm diện tích so với hai dãy vách riêng).
  desks.push(rect(0, 0, partition, spineLen));

  const mkSide = (count: number, sign: 1 | -1) => {
    for (let i = 0; i < count; i++) {
      const cy = -spineLen / 2 + deskW / 2 + i * deskW;
      const x0 = sign * (partition / 2);
      // Thân bàn áp vào vách.
      desks.push(rect(x0 + sign * (wingW / 2), cy, wingW, deskW));
      // Cánh chữ L — vuông góc, ở đầu bàn (phía +y của ô), tạo chữ L thật.
      desks.push(rect(x0 + sign * (wingW + wingW / 2), cy + deskW / 2 - wingW / 2, wingW, wingW));
      // Ghế quay VÀO vách (người ngồi nhìn về xương sống).
      chairs.push(...place(chairPrims(), sign === 1 ? -Math.PI / 2 : Math.PI / 2, x0 + sign * (wingW + 260), cy));
    }
  };
  mkSide(left, 1);
  mkSide(right, -1);

  const b = primsBBox([...desks, ...chairs]);
  const clearance: ClearanceZone[] = [
    { x: b.minX - CHAIR_ACCESS_MM / 2, y: 0, w: CHAIR_ACCESS_MM, h: spineLen, reason: `Lối vào ghế phía trái ≥${CHAIR_ACCESS_MM}mm sau lưng ghế` },
    { x: b.maxX + CHAIR_ACCESS_MM / 2, y: 0, w: CHAIR_ACCESS_MM, h: spineLen, reason: `Lối vào ghế phía phải ≥${CHAIR_ACCESS_MM}mm sau lưng ghế` },
  ];
  return finish(desks, chairs, clearance, seats);
}

/* ═════════════════════ ② benchRow ═════════════════════ */

/** **BENCH THẲNG HÀNG ĐỐI LƯNG** — hai dãy bàn phẳng chung một vách dọc. `n` = tổng số chỗ. */
export function benchRow(n: number, deskW = 1400, deskH = 700, partition = 60): ClusterResult {
  const seats = Math.max(1, Math.floor(n));
  const left = Math.ceil(seats / 2);
  const right = seats - left;
  const perSide = Math.max(left, right);
  const rowLen = perSide * deskW;

  const desks: Prim[] = [rect(0, 0, partition, rowLen)];
  const chairs: Prim[] = [];
  const mkSide = (count: number, sign: 1 | -1) => {
    for (let i = 0; i < count; i++) {
      const cy = -rowLen / 2 + deskW / 2 + i * deskW;
      desks.push(rect(sign * (partition / 2 + deskH / 2), cy, deskH, deskW));
      chairs.push(...place(chairPrims(), sign === 1 ? -Math.PI / 2 : Math.PI / 2, sign * (partition / 2 + deskH + 260), cy));
    }
  };
  mkSide(left, 1);
  mkSide(right, -1);

  const b = primsBBox([...desks, ...chairs]);
  const clearance: ClearanceZone[] = [
    { x: b.minX - CHAIR_ACCESS_MM / 2, y: 0, w: CHAIR_ACCESS_MM, h: rowLen, reason: `Lối vào ghế phía trái ≥${CHAIR_ACCESS_MM}mm sau lưng ghế` },
    { x: b.maxX + CHAIR_ACCESS_MM / 2, y: 0, w: CHAIR_ACCESS_MM, h: rowLen, reason: `Lối vào ghế phía phải ≥${CHAIR_ACCESS_MM}mm sau lưng ghế` },
  ];
  return finish(desks, chairs, clearance, seats);
}

/* ═════════════════════ ③ clusterY ═════════════════════ */

/**
 * **CHỮ Y 6 CHỖ** — 3 cánh toả 120°, mỗi cánh 2 chỗ đối lưng qua vách.
 * Phiếu cho: bao ngoài THẬT **6955 × 6023 mm** · cánh **600 + 60 + 600** · nhịp **1200**.
 *
 * ▸ CÁCH SUY `HUB_R` (ghi ra để kiểm được, không phải số rơi từ trời):
 * cánh nửa-rộng = (600+60+600)/2 = 630. Với 3 cánh ở 90°/210°/330° và tầm với `R` tính từ tâm:
 *   rộng = 2·(R·cos30° + 630·sin30°) = 1,7320·R + 630
 *   cao  = R + (R·sin30° + 630·cos30°) = 1,5·R + 545,6
 * Giải theo chiều rộng 6955 ⇒ **R = 3652**; thay vào chiều cao ⇒ 6023,6 — **khớp 6023 của phiếu
 * tới dưới 1mm**. Hai số của phiếu tự nhất quán với nhau, nên R=3652 không phải chọn bừa cho vừa.
 * Suy ra `HUB_R = R − nhịp = 3652 − 1200 = 2452` (vùng lõi đi dây/kỹ thuật giữa cụm).
 *
 * ⚠️ **ĐO LẠI 05/08 (S3) — 6955×6023 LÀ `deskEnvelopeMm`, KHÔNG PHẢI `sizeMm`.** Chạy `clusterY()`
 * mặc định cho:
 *   · `deskEnvelopeMm` = **6955 × 6024** ⇒ khớp nguồn E1 tới **1mm**, đúng như hai công thức trên.
 *   · `sizeMm`         = **6955 × 6263** (rộng hơn 240mm vì CÓ ghế; ghế không nhô ra theo trục X
 *     nên bề rộng hai số trùng nhau, chỉ chiều cao lệch).
 * Hai công thức ở trên mô tả bao ngoài BÀN+VÁCH. Ghi ra vì phiên sau rất dễ đo `sizeMm` rồi tưởng
 * cụm sai 4% — tôi vừa mắc đúng lỗi đó lúc nghiệm thu.
 */
export const CLUSTER_Y_HUB_R_MM = 2452;

export function clusterY(deskW = 1200, wingW = 600, partition = 60): ClusterResult {
  const desks: Prim[] = [];
  const chairs: Prim[] = [];

  for (let k = 0; k < 3; k++) {
    const ang = Math.PI / 2 + (k * 2 * Math.PI) / 3; // 90° · 210° · 330°
    const armDesk: Prim[] = [];
    const armChair: Prim[] = [];
    // Vách xương sống của cánh, chạy dọc cánh.
    armDesk.push(rect(0, CLUSTER_Y_HUB_R_MM + deskW / 2, partition, deskW));
    for (const sign of [1, -1] as const) {
      armDesk.push(rect(sign * (partition / 2 + wingW / 2), CLUSTER_Y_HUB_R_MM + deskW / 2, wingW, deskW));
      armChair.push(...place(chairPrims(), sign === 1 ? -Math.PI / 2 : Math.PI / 2, sign * (partition / 2 + wingW + 260), CLUSTER_Y_HUB_R_MM + deskW / 2));
    }
    // Xoay cả cánh về đúng phương. `-90°` vì cánh dựng sẵn theo trục +y.
    desks.push(...place(armDesk, ang - Math.PI / 2));
    chairs.push(...place(armChair, ang - Math.PI / 2));
  }

  const b = primsBBox([...desks, ...chairs]);
  const r = Math.max(b.maxX - b.minX, b.maxY - b.minY) / 2;
  const clearance: ClearanceZone[] = [
    { x: 0, y: 0, w: (r + CHAIR_ACCESS_MM) * 2, h: (r + CHAIR_ACCESS_MM) * 2, reason: `Vành lối vào ghế quanh cụm chữ Y ≥${CHAIR_ACCESS_MM}mm` },
  ];
  return finish(desks, chairs, clearance, 6);
}

/* ═════════════════════ ④ cluster120 ═════════════════════ */

/**
 * **6 BÀN GÓC 120°** — 2 chùm 3 bàn toả 120°, vách giữa. Phiếu cho: bàn **1200×600**, vách **600**.
 * Dựng: 6 bàn quanh tâm, mỗi bàn lệch 60°, ghế quay ra ngoài.
 */
export function cluster120(deskW = 1200, deskH = 600, partition = 600): ClusterResult {
  const desks: Prim[] = [];
  const chairs: Prim[] = [];
  // Lõi vách hình lục giác đều (bán kính `partition`) — chỗ 6 bàn châu vào.
  const hex: { x: number; y: number }[] = [];
  for (let k = 0; k < 6; k++) hex.push({ x: partition * Math.cos((k * Math.PI) / 3), y: partition * Math.sin((k * Math.PI) / 3) });
  desks.push({ k: 'poly', pts: hex, closed: true });

  for (let k = 0; k < 6; k++) {
    const ang = (k * Math.PI) / 3;
    desks.push(...place([rect(0, partition + deskH / 2, deskW, deskH)], ang));
    chairs.push(...place(place(chairPrims(), Math.PI, 0, partition + deskH + 260), ang));
  }

  const b = primsBBox([...desks, ...chairs]);
  const r = Math.max(b.maxX - b.minX, b.maxY - b.minY) / 2;
  const clearance: ClearanceZone[] = [
    { x: 0, y: 0, w: (r + CHAIR_ACCESS_MM) * 2, h: (r + CHAIR_ACCESS_MM) * 2, reason: `Vành lối vào ghế quanh cụm 120° ≥${CHAIR_ACCESS_MM}mm` },
  ];
  return finish(desks, chairs, clearance, 6);
}

/* ═════════════════════ ⑤ clusterCross ═════════════════════ */

/** **CHỮ THẬP 4 CHỖ** — vách chữ thập ở giữa, 4 bàn áp 4 góc phần tư. Kiểu thoáng nhất (và tốn
 * diện tích nhất — dùng làm mốc so sánh với `clusterSpineL`). */
export function clusterCross(deskW = 1400, deskH = 700, partition = 60): ClusterResult {
  const armLen = deskW;
  const desks: Prim[] = [
    rect(0, 0, partition, armLen * 2), // vách dọc
    rect(0, 0, armLen * 2, partition), // vách ngang
  ];
  const chairs: Prim[] = [];
  for (let k = 0; k < 4; k++) {
    const ang = (k * Math.PI) / 2;
    desks.push(...place([rect(deskW / 2 + partition / 2, partition / 2 + deskH / 2, deskW, deskH)], ang));
    chairs.push(...place(place(chairPrims(), 0, deskW / 2 + partition / 2, partition / 2 + deskH + 260), ang));
  }
  const b = primsBBox([...desks, ...chairs]);
  const r = Math.max(b.maxX - b.minX, b.maxY - b.minY) / 2;
  const clearance: ClearanceZone[] = [
    { x: 0, y: 0, w: (r + CHAIR_ACCESS_MM) * 2, h: (r + CHAIR_ACCESS_MM) * 2, reason: `Vành lối vào ghế quanh cụm chữ thập ≥${CHAIR_ACCESS_MM}mm` },
  ];
  return finish(desks, chairs, clearance, 4);
}

/* ═════════════════════ ⑥ meetingTable ═════════════════════ */

export type MeetingTableShape = 'rect' | 'boat' | 'round';

/**
 * **BÀN HỌP THEO SỐ CHỖ** — bàn TỰ DÀI RA khi tăng chỗ (§0f TB4).
 * Bố trí: 2 chỗ đầu bàn (khi ≥6 chỗ), còn lại chia đều hai cạnh dài.
 *
 * `seatPitchMm` mặc định **600** — lấy từ `lib/cad/standards/neufert.ts:96`
 * (`neufert-dining-space-per-person` → `seatWidthMm: 600`), KHÔNG phải số tôi tự đặt.
 *
 * 🔴 **LỆCH VỚI SỐ ĐỐI CHIẾU CỦA PHIẾU — báo chứ không lặng lẽ chỉnh cho khớp:**
 * phiếu ghi *"bàn 12 chỗ = 94″ × 36″ = 2388 × 914 mm"*. Với 12 chỗ (2 đầu + 5 mỗi cạnh), 2388mm
 * chia 5 chỗ = **478mm/chỗ**, tức **hẹp hơn Neufert 600mm tới 20%**. Hai nguồn nói khác nhau:
 * 2388×914 là cỡ bàn thương mại Mỹ (94″×36″), Neufert là mức công thái học. Tôi để MẶC ĐỊNH theo
 * Neufert (rộng rãi, an toàn khi ký hồ sơ) và cho chỉnh `seatPitchMm: 478` nếu muốn dựng đúng bàn
 * 94″ — xem test [6] dựng lại đúng 2388×914 bằng tham số đó. Không tự chọn hộ.
 */
export function meetingTable(
  seats: number,
  shape: MeetingTableShape = 'rect',
  opts: { seatPitchMm?: number; depthMm?: number } = {},
): ClusterResult {
  const n = Math.max(2, Math.floor(seats));
  const pitch = opts.seatPitchMm ?? SEAT_WIDTH_MM;
  const depth = opts.depthMm ?? 914; // 36″ — cỡ bàn họp phổ biến, đúng số đối chiếu của phiếu
  const desks: Prim[] = [];
  const chairs: Prim[] = [];

  if (shape === 'round') {
    // Tròn: chu vi = n × pitch ⇒ bán kính suy ra, bàn tự to khi thêm chỗ.
    const r = (n * pitch) / (2 * Math.PI);
    desks.push({ k: 'circle', c: { x: 0, y: 0 }, r });
    for (let k = 0; k < n; k++) {
      const a = (k * 2 * Math.PI) / n;
      chairs.push(...place(chairPrims(), a - Math.PI / 2, Math.cos(a) * (r + 260), Math.sin(a) * (r + 260)));
    }
    const bb = primsBBox([...desks, ...chairs]);
    const rr = Math.max(bb.maxX - bb.minX, bb.maxY - bb.minY) / 2;
    return finish(desks, chairs, [{ x: 0, y: 0, w: (rr + MEETING_AISLE_MM) * 2, h: (rr + MEETING_AISLE_MM) * 2, reason: `Lối đi quanh bàn họp ≥${MEETING_AISLE_MM}mm mỗi bên` }], n);
  }

  const ends = n >= 6 ? 2 : 0;
  const perSide = Math.ceil((n - ends) / 2);
  const otherSide = n - ends - perSide;
  const len = perSide * pitch;

  if (shape === 'rect') {
    desks.push(rect(0, 0, len, depth));
  } else {
    // 'boat' — thuyền: phình giữa, thon hai đầu. Đầu bàn hẹp 70% (tỉ lệ dựng hình, không phải trị
    // số tiêu chuẩn nào — ghi rõ để không ai tra ngược tìm nguồn).
    const dEnd = depth * 0.7;
    desks.push({
      k: 'poly',
      closed: true,
      pts: [
        { x: -len / 2, y: -dEnd / 2 }, { x: -len / 4, y: -depth / 2 }, { x: len / 4, y: -depth / 2 }, { x: len / 2, y: -dEnd / 2 },
        { x: len / 2, y: dEnd / 2 }, { x: len / 4, y: depth / 2 }, { x: -len / 4, y: depth / 2 }, { x: -len / 2, y: dEnd / 2 },
      ],
    });
  }

  const side = (count: number, sign: 1 | -1) => {
    for (let i = 0; i < count; i++) {
      const cx = -len / 2 + pitch / 2 + i * pitch;
      chairs.push(...place(chairPrims(), sign === 1 ? Math.PI : 0, cx, sign * (depth / 2 + 260)));
    }
  };
  side(perSide, 1);
  side(otherSide, -1);
  if (ends === 2) {
    chairs.push(...place(chairPrims(), Math.PI / 2, -len / 2 - 260, 0));
    chairs.push(...place(chairPrims(), -Math.PI / 2, len / 2 + 260, 0));
  }

  const b = primsBBox([...desks, ...chairs]);
  const clearance: ClearanceZone[] = [
    { x: 0, y: 0, w: b.maxX - b.minX + MEETING_AISLE_MM * 2, h: b.maxY - b.minY + MEETING_AISLE_MM * 2, reason: `Lối đi quanh bàn họp ≥${MEETING_AISLE_MM}mm mỗi bên` },
  ];
  return finish(desks, chairs, clearance, n);
}

/* ═════════════════════ đối chiếu TCVN 4601 ═════════════════════ */

/** TCVN 4601 — phòng họp CÓ BÀN cần **≥1,80 m²/người** (trị số phiếu cung cấp; CHƯA đối chiếu chéo
 * bản gốc trong phiên này — cùng mức tin cậy như `vn-*` rule đang để `verified:false`). */
export const TCVN_4601_MEETING_M2_PER_PERSON = 1.8;

/** Cụm có đạt ≥1,80 m²/người không (tính CẢ lối đi). Trả cả số đo để nơi gọi hiện thẳng, không
 * chỉ trả true/false (người ký hồ sơ cần con số). */
export function checkMeetingArea(r: ClusterResult): { ok: boolean; m2PerPerson: number; requiredM2: number } {
  return {
    ok: r.areaPerSeatWithClearanceM2 >= TCVN_4601_MEETING_M2_PER_PERSON,
    m2PerPerson: r.areaPerSeatWithClearanceM2,
    requiredM2: TCVN_4601_MEETING_M2_PER_PERSON,
  };
}

/* ═════════════════════ MẶT TIỀN CHO PANEL — 1 chỗ khai, panel chỉ đọc ═════════════════════ */

/**
 * VÌ SAO CÓ KHỐI NÀY (phiếu S3 VIỆC 1 + VIỆC 3): 6 hàm trên viết xong từ trước nhưng **0 nơi gọi**.
 * Panel cần biết mỗi cụm có những núm chỉnh nào, dải bao nhiêu, mặc định bao nhiêu — nếu panel tự
 * khai thì trị số sống ở HAI chỗ và sẽ lệch nhau. Khai MỘT lần ở đây, panel chỉ render.
 *
 * ⛔ VIỆC 3: không có toạ độ gõ tay nào trong khối này — mọi hình học vẫn do 6 hàm trên sinh.
 * Đây thuần tuý là **bảng khai núm chỉnh**, đổi số ở panel là gọi lại hàm, không phải vẽ lại.
 *
 * §0e KS5 "nói được vì sao": mỗi núm mang `why` — hiện thẳng làm tooltip, để KTS biết trị số mặc
 * định đến từ đâu chứ không phải con số rơi từ trời.
 */

export type ClusterParamValue = number | string;

export interface ClusterParamDef {
  id: string;
  label: [string, string];
  kind: 'number' | 'select';
  /** chỉ cho `kind:'number'` */
  min?: number;
  max?: number;
  step?: number;
  /** chỉ cho `kind:'select'` */
  options?: { value: string; label: [string, string] }[];
  default: ClusterParamValue;
  unit?: string;
  /** nguồn/lý do của trị số mặc định — §0e KS5. */
  why?: string;
}

export interface ClusterSpec {
  id: string;
  label: [string, string];
  desc: [string, string];
  params: ClusterParamDef[];
  build: (v: Record<string, ClusterParamValue>) => ClusterResult;
  /** true ⇒ panel đối chiếu TCVN 4601 bằng `checkMeetingArea()`. */
  isMeeting?: boolean;
}

const num = (v: Record<string, ClusterParamValue>, k: string, dflt: number): number => {
  const raw = v[k];
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : dflt;
};

/** Núm dùng lại ở nhiều cụm — khai 1 lần, tránh 6 bản sao lệch dải nhau. */
const P_SEATS = (dflt: number, max = 24): ClusterParamDef => ({
  id: 'n', label: ['Số chỗ', 'Seats'], kind: 'number', min: 2, max, step: 1, default: dflt, unit: 'chỗ',
  why: 'Cụm tự dài ra theo số chỗ — không phải vẽ lại (§0f TB4).',
});
const P_DESK_W = (dflt: number): ClusterParamDef => ({
  id: 'deskW', label: ['Bề rộng bàn', 'Desk width'], kind: 'number', min: 900, max: 2000, step: 50, default: dflt, unit: 'mm',
  why: 'Bàn làm việc phổ thông VN 1200–1600mm.',
});
const P_PARTITION = (dflt: number): ClusterParamDef => ({
  id: 'partition', label: ['Bề rộng vách', 'Partition width'], kind: 'number', min: 0, max: 800, step: 10, default: dflt, unit: 'mm',
  why: 'Vách ngăn giữa hai lưng bàn. 0 = không vách.',
});

export const CLUSTER_SPECS: ClusterSpec[] = [
  {
    id: 'spine-l',
    label: ['Chữ L xương sống', 'L-shape spine'],
    desc: ['Đặc nhất — hai dãy bàn chữ L đối lưng qua một vách chung.', 'Densest — two rows of L-desks back to back across one shared spine.'],
    params: [
      P_SEATS(8, 40),
      P_DESK_W(1400),
      { id: 'wingW', label: ['Bề rộng cánh', 'Wing width'], kind: 'number', min: 500, max: 1000, step: 50, default: 700, unit: 'mm', why: 'Cánh chữ L = chiều sâu bàn, 600–800mm.' },
      P_PARTITION(60),
    ],
    build: (v) => clusterSpineL(num(v, 'n', 8), num(v, 'deskW', 1400), num(v, 'wingW', 700), num(v, 'partition', 60)),
  },
  {
    id: 'bench-row',
    label: ['Bench thẳng hàng', 'Bench row'],
    desc: ['Hai dãy bàn phẳng đối lưng, chung một vách dọc.', 'Two flat rows back to back over one long partition.'],
    params: [
      P_SEATS(8, 40),
      P_DESK_W(1400),
      { id: 'deskH', label: ['Chiều sâu bàn', 'Desk depth'], kind: 'number', min: 500, max: 900, step: 50, default: 700, unit: 'mm', why: 'Sâu bàn làm việc chuẩn 700mm.' },
      P_PARTITION(60),
    ],
    build: (v) => benchRow(num(v, 'n', 8), num(v, 'deskW', 1400), num(v, 'deskH', 700), num(v, 'partition', 60)),
  },
  {
    id: 'cluster-y',
    label: ['Chữ Y — 6 chỗ', 'Y cluster — 6 seats'],
    desc: ['3 cánh toả 120°, mỗi cánh 2 chỗ đối lưng. Bao ngoài gốc 6955×6023mm.', '3 arms at 120°, 2 seats each. Reference envelope 6955×6023mm.'],
    params: [
      P_DESK_W(1200),
      { id: 'wingW', label: ['Bề rộng cánh', 'Wing width'], kind: 'number', min: 450, max: 900, step: 50, default: 600, unit: 'mm', why: 'Nguồn E1: cánh 600+60+600.' },
      P_PARTITION(60),
    ],
    build: (v) => clusterY(num(v, 'deskW', 1200), num(v, 'wingW', 600), num(v, 'partition', 60)),
  },
  {
    id: 'cluster-120',
    label: ['Góc 120° — 6 chỗ', '120° cluster — 6 seats'],
    desc: ['6 bàn châu quanh lõi vách lục giác, ghế quay ra ngoài.', '6 desks around a hexagonal core, chairs facing out.'],
    params: [
      P_DESK_W(1200),
      { id: 'deskH', label: ['Chiều sâu bàn', 'Desk depth'], kind: 'number', min: 450, max: 900, step: 50, default: 600, unit: 'mm', why: 'Nguồn E2: bàn 1200×600.' },
      { id: 'partition', label: ['Bán kính lõi vách', 'Core radius'], kind: 'number', min: 200, max: 1000, step: 50, default: 600, unit: 'mm', why: 'Nguồn E2: vách 600.' },
    ],
    build: (v) => cluster120(num(v, 'deskW', 1200), num(v, 'deskH', 600), num(v, 'partition', 600)),
  },
  {
    id: 'cluster-cross',
    label: ['Chữ thập — 4 chỗ', 'Cross cluster — 4 seats'],
    desc: ['Vách chữ thập giữa, 4 bàn áp 4 góc phần tư. Thoáng nhất.', 'Cross partition, 4 desks in 4 quadrants. Most spacious.'],
    params: [
      P_DESK_W(1400),
      { id: 'deskH', label: ['Chiều sâu bàn', 'Desk depth'], kind: 'number', min: 500, max: 900, step: 50, default: 700, unit: 'mm', why: 'Sâu bàn làm việc chuẩn 700mm.' },
      P_PARTITION(60),
    ],
    build: (v) => clusterCross(num(v, 'deskW', 1400), num(v, 'deskH', 700), num(v, 'partition', 60)),
  },
  {
    id: 'meeting-table',
    label: ['Bàn họp', 'Meeting table'],
    desc: ['Bàn tự dài ra theo số chỗ. Chữ nhật · thuyền · tròn.', 'Table grows with seat count. Rect · boat · round.'],
    isMeeting: true,
    params: [
      P_SEATS(12, 30),
      {
        id: 'shape', label: ['Hình dáng', 'Shape'], kind: 'select', default: 'rect',
        options: [
          { value: 'rect', label: ['Chữ nhật', 'Rectangle'] },
          { value: 'boat', label: ['Thuyền', 'Boat'] },
          { value: 'round', label: ['Tròn', 'Round'] },
        ],
        why: 'Thuyền = phình giữa thon hai đầu; tròn = bán kính suy từ số chỗ.',
      },
      {
        id: 'seatPitchMm', label: ['Bề rộng 1 chỗ', 'Seat pitch'], kind: 'number', min: 450, max: 800, step: 2, default: SEAT_WIDTH_MM, unit: 'mm',
        why: 'Mặc định 600 theo Neufert (neufert.ts:96). Đặt 478 để dựng đúng bàn thương mại 94″×36″ — hai nguồn lệch nhau 20%, xem docstring meetingTable().',
      },
      { id: 'depthMm', label: ['Chiều sâu bàn', 'Table depth'], kind: 'number', min: 700, max: 1400, step: 2, default: 914, unit: 'mm', why: 'Nguồn D1: 36″ = 914mm.' },
    ],
    build: (v) =>
      meetingTable(num(v, 'n', 12), (String(v.shape || 'rect') as MeetingTableShape), {
        seatPitchMm: num(v, 'seatPitchMm', SEAT_WIDTH_MM),
        depthMm: num(v, 'depthMm', 914),
      }),
  },
];

/** Trị số mặc định của 1 cụm — panel dựng state ban đầu từ đây, không tự khai lại. */
export function clusterDefaults(spec: ClusterSpec): Record<string, ClusterParamValue> {
  const out: Record<string, ClusterParamValue> = {};
  for (const p of spec.params) out[p.id] = p.default;
  return out;
}

/**
 * SEED của một lần dựng cụm — §0e KS2 "cùng đầu vào → cùng kết quả", `Checkpoint` bắt buộc khai.
 *
 * ▸ Ở đây seed KHÔNG phải hạt giống ngẫu nhiên (cụm là hàm THUẦN TẤT ĐỊNH, không có random nào).
 * Nó là **dấu vân của bộ tham số**: cùng seed ⇔ cùng cụm, khác seed ⇔ đã đổi núm nào đó. Người
 * dùng ghi lại seed là dựng lại được y hệt — đúng thứ KS2 cần, không phải khai cho có.
 * ▸ Băm FNV-1a 32-bit: ngắn, ổn định giữa các phiên/máy, không kéo thêm dependency. Khoá được
 * sắp xếp trước khi băm để thứ tự gõ núm không làm đổi seed.
 */
export function clusterSeed(specId: string, values: Record<string, ClusterParamValue>): number {
  const canon = `${specId}|${Object.keys(values).sort().map((k) => `${k}=${values[k]}`).join('&')}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < canon.length; i++) {
    h ^= canon.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}
