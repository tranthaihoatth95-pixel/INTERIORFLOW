/**
 * lib/vision/single-view-metrology.ts — 2.2.87: "ĐO ĐƯỢC MÓN ĐỒ TRONG ẢNH" (Lát cắt 1,
 * docs/TU-VAN-ANH-SANG-BAN-VE-2026-07-30.md §4). CHỈ bước ①②③⑦ của dây chuyền 7 bước — KHÔNG
 * dựng mesh 3D, KHÔNG sinh góc phối cảnh mới (đợt 2). Thuần lib, 0 credit, tất định, KHÔNG UI.
 *
 * ── SỰ THẬT TOÁN HỌC PHẢI GIỮ (đọc trước khi sửa) ──────────────────────────────────────────
 * Một tấm ảnh KHÔNG chứa thang đo tuyệt đối (scale ambiguity) — mọi con số mm ở đây PHẢI đi qua
 * `anchorScale()` (neo bằng vật chuẩn/chiều cao máy ảnh), KHÔNG có đường tắt nào khác.
 *
 * ── HAI LỚP, TÁCH BẠCH CHỦ ĐÍCH ─────────────────────────────────────────────────────────────
 * Lớp TOÁN (testable tất định, không cần ảnh thật): `calibrateFromVanishingPoints()`,
 * `anchorScale()`, `measureObject()` — nhận toạ độ điểm tụ/toạ độ ảnh làm input, KHÔNG đọc pixel.
 * Test bằng CẢNH TỔNG HỢP: chiếu 1 cảnh 3D biết trước qua 1 camera biết trước ra điểm ảnh, rồi
 * xác nhận pipeline suy ngược đúng kích thước gốc — đây LÀ ý nghĩa "ảnh tổng hợp" trong yêu cầu
 * test, không phải raster hoá pixel thật rồi chạy dò biên (không có ảnh thật để chạy headless).
 *
 * Lớp ẢNH (heuristic, đọc pixel thật): `detectLineSegments()`, `calibrateFromImage()` — dò biên
 * (Sobel) + gom cụm điểm tụ Manhattan từ ảnh thật. Đây là CV cổ điển bậc phổ thông (không phải
 * LSD/J-linkage nghiên cứu), có `confidence` để người dùng biết khi nào nên nghi ngờ — ĐỪNG tin
 * layer này cho ra kết quả chính xác trên MỌI ảnh thật, đúng tinh thần "không giấu sai số" của
 * tài liệu tư vấn.
 *
 * ── NHÓM 🟢 ĐO / 🟡 SUY (Luật sản phẩm, §2 tài liệu) ────────────────────────────────────────
 * `measureObject()` trả `width`/`height` là 🟢 ĐO (cạnh nhìn thấy trên mặt đã hiệu chỉnh — sàn
 * cho rộng, trục dọc cho cao). `depth` LUÔN 🟡 SUY — ảnh 1 góc không thấy mặt sau, trừ khi caller
 * truyền `silhouette.side` (mặt bên nhìn thấy được, hiếm khi có ở 1 ảnh). Đây KHÔNG phải thiếu
 * sót — đúng bản chất toán học đã nêu ở đầu tài liệu tư vấn.
 */

/* ═══════════════════════════ Kiểu dữ liệu ═══════════════════════════ */

export interface Pt2D {
  x: number;
  y: number;
}

/** Đoạn thẳng phát hiện trên ảnh — 2 đầu mút, dùng để suy điểm tụ. */
export interface LineSegment2D {
  a: Pt2D;
  b: Pt2D;
}

/** Ảnh xám mức 0-255, hàng-chính (row-major) — layer ảnh dùng kiểu này thay vì đọc thẳng
 * ImageData màu (RGBA), tránh phụ thuộc DOM (chạy được cả Node test lẫn browser). */
export interface GrayImage {
  width: number;
  height: number;
  data: Float32Array; // length = width*height
}

/** ImageData tối giản — khớp shape của `CanvasRenderingContext2D.getImageData()` thật, không
 * import type DOM (giữ module thuần, chạy được ở Node). */
export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8ClampedArray | number[]; // RGBA, length = width*height*4
}

export type Axis3 = 'vertical' | 'horizA' | 'horizB';

/** Hiệu chỉnh máy ảnh — bước ① (`calibrateFromImage`/`calibrateFromVanishingPoints`). */
export interface CameraCalib {
  /** Tiêu cự (px), giả định pixel vuông + tâm quang học = tâm ảnh (giản lược chuẩn, đủ cho
   * ảnh render/chụp nội thất không zoom lệch tâm nặng). */
  focalLengthPx: number;
  principalPoint: Pt2D;
  /** Ma trận xoay world→camera, world Z = trục đứng (sàn = mặt phẳng z=0). Cột 0/1/2 = hướng
   * 3 trục world (X ngang·Y ngang·Z đứng) biểu diễn trong hệ camera — đã trực giao hoá (SVD). */
  rotationWorldToCam: number[][]; // 3x3
  /** 3 điểm tụ nguồn (ảnh px) — giữ lại để debug/hiển thị, không dùng lại trong tính toán sau. */
  vanishingPoints: { vertical: Pt2D; horizA: Pt2D; horizB: Pt2D };
  imageWidth: number;
  imageHeight: number;
  /** 0-1 — hợp lệ hình học: 3 điểm tụ càng gần trực giao thật (theo ràng buộc Caprile-Torre)
   * càng cao. KHÔNG phải xác suất thống kê — là độ khớp ràng buộc hình học. */
  confidence: number;
}

/** 1 vật neo trong khung hình dùng để suy thang đo. */
export interface ScaleAnchorInput {
  kind: AnchorKind;
  /** Chiều dài ĐÃ BIẾT của vật neo theo world (mm) — vd cao cửa thật 2100mm. */
  realLengthMm: number;
  /** 2 điểm ảnh 2 đầu chiều dài đó. */
  imagePoints: [Pt2D, Pt2D];
  /** Với neo trên SÀN (chân-đỉnh cùng 1 điểm chân, vd cửa/bậc thang): true → dùng phép chiếu
   * đứng (back-project qua VP dọc). Với neo NGANG (module gạch đo dọc sàn): false. */
  vertical: boolean;
}

export type AnchorKind = 'cameraHeight' | 'door' | 'bed' | 'stairRiser' | 'tileModule' | 'tableTop' | 'seatHeight' | 'outlet' | 'depthMetric';

export interface ScaleResult {
  /** mm thế giới thật trên mỗi đơn vị "world" nội bộ (world dựng theo camera height = 1 đơn vị
   * — xem CONFIG.WORLD_UNIT_IS_CAMERA_HEIGHT). Nhân measureObject() output với số này lấy mm. */
  mmPerWorldUnit: number;
  confidence: number;
  needsManualScale: boolean;
  /** Chi tiết từng nguồn neo đã dùng — để người dùng kiểm được (đúng yêu cầu "basis kiểm được"). */
  sources: { kind: AnchorKind; mmPerWorldUnit: number; agreesWithinTolerance: boolean }[];
  reason?: string;
}

export interface MeasurementValue {
  valueMm: number;
  toleranceMm: number;
  kind: 'measured' | 'inferred';
  /** Neo/giả định đã dùng để tính ra số này — vd "cameraHeight 1550mm + VP dọc", hoặc
   * "ước lượng theo tỉ lệ sâu/rộng nội thất thông dụng (0.55)". */
  basis: string;
}

export interface MeasurementResult {
  width: MeasurementValue; // 🟢 luôn ĐO được (cạnh trái-phải trên sàn)
  height: MeasurementValue; // 🟢 luôn ĐO được (đáy sàn → đỉnh, qua VP dọc)
  depth: MeasurementValue; // 🟡 SUY trừ khi có silhouette.side
}

/** Mặt nạ món đồ (từ `ai.furnitureextract`/`ai.removebg`) — viền ẢNH (px), không phải world. */
export interface ObjectSilhouette {
  /** Viền mặt trước (bắt buộc) — đa giác kín theo px ảnh, thứ tự bất kỳ. */
  front: Pt2D[];
  /** Viền mặt bên nếu ảnh chụp góc thấy được cả 2 mặt (hiếm) — có thì depth chuyển 🟢. */
  side?: Pt2D[];
}

/* ═══════════════════════════ CONFIG — mọi hằng số neo (không hard-code rải rác) ═══════════════════════════ */

export const ANCHOR_CONFIG: Record<AnchorKind, { minMm: number; maxMm: number; typicalMm: number; label: string; defaultVertical: boolean }> = {
  cameraHeight: { minMm: 1500, maxMm: 1600, typicalMm: 1550, label: 'Chiều cao máy ảnh (tầm mắt)', defaultVertical: true },
  door: { minMm: 2000, maxMm: 2200, typicalMm: 2100, label: 'Cửa đi (cao)', defaultVertical: true },
  bed: { minMm: 1500, maxMm: 2000, typicalMm: 1600, label: 'Giường (rộng) — mốc rất đáng tin', defaultVertical: false },
  stairRiser: { minMm: 150, maxMm: 180, typicalMm: 165, label: 'Bậc thang (cao)', defaultVertical: true },
  tileModule: { minMm: 300, maxMm: 800, typicalMm: 600, label: 'Module gạch lát (cạnh)', defaultVertical: false },
  tableTop: { minMm: 720, maxMm: 780, typicalMm: 750, label: 'Mặt bàn (cao)', defaultVertical: true },
  seatHeight: { minMm: 400, maxMm: 450, typicalMm: 425, label: 'Mặt ngồi ghế (cao)', defaultVertical: true },
  outlet: { minMm: 280, maxMm: 1220, typicalMm: 300, label: 'Ổ cắm/công tắc (cao so nền)', defaultVertical: true },
  depthMetric: { minMm: 0, maxMm: 1e9, typicalMm: 0, label: 'Depth map (chỉ kiểm chéo)', defaultVertical: true },
};

/** Ngưỡng khớp 3 nguồn neo (§ "Ba nguồn khớp trong ±5% ⇒ tin"). */
export const ANCHOR_AGREEMENT_TOLERANCE = 0.05;

/** Tỉ lệ sâu/rộng mặc định khi PHẢI suy depth (không có mặt bên) — nội thất phổ thông (sofa/tủ/
 * bàn) thường sâu = 45-65% rộng; lấy giữa dải, ghi rõ đây là prior không phải phép đo. */
export const DEFAULT_DEPTH_TO_WIDTH_RATIO = 0.55;
/** Sai số ước lượng khi dùng prior tỉ lệ — rộng để không đánh lừa người dùng là số chắc chắn. */
export const DEPTH_PRIOR_TOLERANCE_RATIO = 0.35;

/* ═══════════════════════════ Đại số tuyến tính tối thiểu (không thêm dependency) ═══════════════════════════ */

type Vec3 = [number, number, number];
type Mat3 = [Vec3, Vec3, Vec3];

function dot3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function norm3(a: Vec3): number {
  return Math.sqrt(dot3(a, a));
}
function normalize3(a: Vec3): Vec3 {
  const n = norm3(a) || 1e-12;
  return [a[0] / n, a[1] / n, a[2] / n];
}
function cross3(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function matVec3(m: Mat3, v: Vec3): Vec3 {
  return [dot3(m[0], v), dot3(m[1], v), dot3(m[2], v)];
}
function transpose3(m: Mat3): Mat3 {
  return [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]],
  ];
}

/** Trực giao hoá 1 ma trận 3x3 gần-trực-giao (cột = 3 hướng đo từ ảnh, có nhiễu) về ma trận xoay
 * hợp lệ gần nhất — Gram-Schmidt CÓ đủ cho 3 vector gần-trực-giao (không cần SVD đầy đủ, tránh
 * viết SVD tổng quát chỉ để dùng 1 chỗ). Cột 2 (world Z/dọc) GIỮ NGUYÊN hướng (tin cậy nhất, từ
 * VP dọc — thường ít nhiễu hơn 2 trục ngang trong ảnh nội thất), 2 cột còn lại trực giao hoá theo. */
function orthonormalizeColumns(m: Mat3): Mat3 {
  const c0: Vec3 = [m[0][0], m[1][0], m[2][0]];
  const c1: Vec3 = [m[0][1], m[1][1], m[2][1]];
  const c2raw: Vec3 = [m[0][2], m[1][2], m[2][2]];
  const c2 = normalize3(c2raw);
  // c0 vuông góc c2
  let c0o: Vec3 = [c0[0] - dot3(c0, c2) * c2[0], c0[1] - dot3(c0, c2) * c2[1], c0[2] - dot3(c0, c2) * c2[2]];
  c0o = normalize3(c0o);
  // c1 vuông góc cả c2 lẫn c0o — dùng tích có hướng để CHẮC CHẮN trực giao (không tích luỹ sai số Gram-Schmidt 2 bước)
  let c1o = cross3(c2, c0o);
  // đảm bảo cùng hướng thô với c1 gốc (tránh lật dấu tuỳ tiện)
  if (dot3(c1o, c1) < 0) c1o = [-c1o[0], -c1o[1], -c1o[2]];
  return [
    [c0o[0], c1o[0], c2[0]],
    [c0o[1], c1o[1], c2[1]],
    [c0o[2], c1o[2], c2[2]],
  ];
}

/* ═══════════════════════════ Bước ① — Hiệu chỉnh máy ảnh từ 3 điểm tụ ═══════════════════════════ */

/**
 * Tính điểm tụ từ 1 cụm đoạn thẳng gần-song-song/hội-tụ bằng bình phương tối thiểu: mỗi đoạn AB
 * cho 1 đường thẳng đồng nhất l=(a,b,c) (a·x+b·y+c=0, chuẩn hoá a²+b²=1); điểm tụ là (x,y) tối
 * thiểu hoá Σ(a·x+b·y+c)² — giải hệ chuẩn tắc 2×2. Trả kèm phần dư (RMS khoảng cách) làm chỉ báo
 * độ khớp cụm (dùng cho confidence).
 */
export function vanishingPointFromLines(lines: LineSegment2D[]): { vp: Pt2D; residualPx: number } | null {
  if (lines.length < 2) return null;
  let Saa = 0;
  let Sab = 0;
  let Sbb = 0;
  let Sac = 0;
  let Sbc = 0;
  const abcs: [number, number, number][] = [];
  for (const { a: p1, b: p2 } of lines) {
    let a = p2.y - p1.y;
    let b = p1.x - p2.x;
    let c = -(a * p1.x + b * p1.y);
    const n = Math.sqrt(a * a + b * b) || 1e-12;
    a /= n;
    b /= n;
    c /= n;
    abcs.push([a, b, c]);
    Saa += a * a;
    Sab += a * b;
    Sbb += b * b;
    Sac += a * c;
    Sbc += b * c;
  }
  // Hệ chuẩn tắc: [Saa Sab; Sab Sbb] [x;y] = [-Sac; -Sbc]
  const det = Saa * Sbb - Sab * Sab;
  if (Math.abs(det) < 1e-9) return null; // mọi đường song song hệt nhau hoặc suy biến
  const x = (-Sac * Sbb - -Sbc * Sab) / det;
  const y = (Saa * -Sbc - Sab * -Sac) / det;
  let sumSq = 0;
  for (const [a, b, c] of abcs) sumSq += (a * x + b * y + c) ** 2;
  const residualPx = Math.sqrt(sumSq / abcs.length);
  return { vp: { x, y }, residualPx };
}

/**
 * Hiệu chỉnh máy ảnh từ 3 điểm tụ TRỰC GIAO (giả định Manhattan world — nội thất). Không đọc
 * pixel, thuần hình học — layer TOÁN test được bằng cảnh tổng hợp (xem đầu file).
 *
 * `vpVertical`/`vpHorizA`/`vpHorizB`: caller (hoặc `calibrateFromImage`) đã PHÂN LOẠI cụm nào là
 * điểm tụ trục dọc (world Z) — thường là cụm đường có phương ảnh gần đứng nhất.
 */
export function calibrateFromVanishingPoints(
  vpVertical: Pt2D,
  vpHorizA: Pt2D,
  vpHorizB: Pt2D,
  imageWidth: number,
  imageHeight: number,
): CameraCalib | null {
  const pp: Pt2D = { x: imageWidth / 2, y: imageHeight / 2 };

  // Caprile-Torre: f² = -(v_i - pp)·(v_j - pp) (bỏ toạ độ thứ 3=0 ở trên, dùng dot 2D thuần).
  const dotOff = (v1: Pt2D, v2: Pt2D) => (v1.x - pp.x) * (v2.x - pp.x) + (v1.y - pp.y) * (v2.y - pp.y);
  const candidates = [-dotOff(vpVertical, vpHorizA), -dotOff(vpVertical, vpHorizB), -dotOff(vpHorizA, vpHorizB)].filter(
    (f2) => f2 > 0,
  );
  if (candidates.length === 0) return null; // hình học không hợp lệ (không trực giao được ở bất kỳ cặp nào)
  const f2 = candidates.reduce((s, v) => s + v, 0) / candidates.length;
  const f = Math.sqrt(f2);

  const dirCam = (v: Pt2D): Vec3 => normalize3([(v.x - pp.x) / f, (v.y - pp.y) / f, 1]);
  const dVert = dirCam(vpVertical);
  const dA = dirCam(vpHorizA);
  const dB = dirCam(vpHorizB);

  // Cột 0=world X(horizA)·cột 1=world Y(horizB)·cột 2=world Z(vertical) — khớp Axis3 thứ tự.
  const raw: Mat3 = [
    [dA[0], dB[0], dVert[0]],
    [dA[1], dB[1], dVert[1]],
    [dA[2], dB[2], dVert[2]],
  ];
  const R = orthonormalizeColumns(raw);

  // confidence: đo 3 cặp có thực sự trực giao (dot ≈ 0) trước khi trực giao hoá cưỡng bức —
  // càng gần 0 càng đáng tin, ánh xạ về [0,1] qua ngưỡng góc lệch cho phép ~15°.
  const cosErr = (u: Vec3, v: Vec3) => Math.abs(dot3(normalize3(u), normalize3(v)));
  const maxCos = Math.sin((15 * Math.PI) / 180); // dot của 2 vector lệch trực giao 15° ≈ sin(15°)
  const errs = [cosErr(dA, dB), cosErr(dA, dVert), cosErr(dB, dVert)];
  const confidence = Math.max(0, Math.min(1, 1 - Math.max(...errs) / maxCos));

  return {
    focalLengthPx: f,
    principalPoint: pp,
    rotationWorldToCam: R,
    vanishingPoints: { vertical: vpVertical, horizA: vpHorizA, horizB: vpHorizB },
    imageWidth,
    imageHeight,
    confidence,
  };
}

/* ═══════════════════════════ Ray back-projection dùng chung (calib đã có, world Z-up, sàn z=0) ═══════════════════════════ */

/** Hướng tia thế giới ứng với 1 điểm ảnh (px), đã chuẩn hoá — R^T (camera→world) · K⁻¹·[u,v,1]. */
function rayWorldDir(calib: CameraCalib, p: Pt2D): Vec3 {
  const { focalLengthPx: f, principalPoint: pp, rotationWorldToCam: R } = calib;
  const dirCam: Vec3 = [(p.x - pp.x) / f, (p.y - pp.y) / f, 1];
  const Rt = transpose3(R as Mat3);
  return normalize3(matVec3(Rt, dirCam));
}

/**
 * Giao tia (từ tâm camera qua điểm ảnh `p`) với mặt sàn world z=0, camera đặt tại (0,0,camZ)
 * (world unit — nhân `ScaleResult.mmPerWorldUnit` để ra mm thật). Trả null nếu tia không cắt sàn
 * hướng đúng (vd điểm nằm trên đường chân trời/bầu trời — vô lý về mặt vật lý cho vật đứng sàn).
 */
function intersectFloor(calib: CameraCalib, p: Pt2D, camZ: number): Vec3 | null {
  const dir = rayWorldDir(calib, p);
  if (Math.abs(dir[2]) < 1e-9) return null;
  const t = -camZ / dir[2];
  if (t <= 0) return null; // sau lưng camera — hình học không hợp lệ
  return [t * dir[0], t * dir[1], 0];
}

/**
 * Chiều cao world (đơn vị = camZ, tức "world unit") của điểm `top` khi biết điểm `base` của NÓ
 * đã chạm sàn tại toạ độ world `baseWorld` — tham số hoá tia base→lên thẳng đứng bằng z, giải z
 * sao cho khớp toạ độ ẢNH quan sát của `top` (dùng riêng thành phần v — trục dọc ảnh nhạy chiều
 * cao nhất, ổn định số học hơn giải đồng thời u lẫn v cho 1 ẩn).
 */
function heightFromTopPoint(calib: CameraCalib, top: Pt2D, baseWorld: Vec3, camZ: number): number | null {
  const { focalLengthPx: f, principalPoint: pp, rotationWorldToCam: R } = calib;
  // world point tại độ cao z: (baseWorld.x, baseWorld.y, z). Chiếu qua camera:
  // camPt = R·(worldPt - C), C=(0,0,camZ). v_img = pp.y + f*camPt.y/camPt.z — giải z từ v_img=top.y.
  const Rm = R as Mat3;
  const wx = baseWorld[0];
  const wy = baseWorld[1];
  // camPt(z) = R·[wx,wy,z-camZ] = R·[wx,wy,-camZ] + z·R·[0,0,1] = P0 + z·D
  const P0 = matVec3(Rm, [wx, wy, -camZ]);
  const D = matVec3(Rm, [0, 0, 1]);
  // v = pp.y + f*(P0.y + z*D.y)/(P0.z + z*D.z) = top.y  → giải z (phương trình tuyến tính sau quy đồng)
  const target = top.y;
  // (target-pp.y)*(P0.z+z*D.z) = f*(P0.y+z*D.y)
  // (target-pp.y)*P0.z - f*P0.y = z*(f*D.y - (target-pp.y)*D.z)
  const lhs = (target - pp.y) * P0[2] - f * P0[1];
  const coefZ = f * D[1] - (target - pp.y) * D[2];
  if (Math.abs(coefZ) < 1e-9) return null;
  const z = lhs / coefZ;
  return z > 0 ? z : null;
}

/* ═══════════════════════════ Bước ② — Neo thang đo ═══════════════════════════ */

/** Độ dài world (world unit, camZ=1 tạm) của 1 đoạn neo — dùng lại đúng phép chiếu ở trên. */
function anchorLengthWorldUnits(calib: CameraCalib, anchor: ScaleAnchorInput): number | null {
  const [p1, p2] = anchor.imagePoints;
  if (anchor.vertical) {
    // đoạn đứng chạm sàn ở p1 (chân) — dùng camZ tạm = 1 (world unit chuẩn), suy chiều cao thế giới ảo rồi quy đổi mm ở anchorScale().
    const base = intersectFloor(calib, p1, 1);
    if (!base) return null;
    const h = heightFromTopPoint(calib, p2, base, 1);
    return h;
  }
  // neo NGANG trên sàn (module gạch) — cả 2 đầu đều chạm sàn, đo khoảng cách 3D 2 điểm sàn.
  const w1 = intersectFloor(calib, p1, 1);
  const w2 = intersectFloor(calib, p2, 1);
  if (!w1 || !w2) return null;
  return Math.sqrt((w1[0] - w2[0]) ** 2 + (w1[1] - w2[1]) ** 2 + (w1[2] - w2[2]) ** 2);
}

/**
 * Neo thang đo từ NHIỀU nguồn, kiểm chéo (§ tài liệu: 3 nguồn khớp ±5% ⇒ tin, lệch ⇒ báo, không
 * tự chọn). `cameraHeight` (nếu có trong `anchors`) LÀ mốc world unit=camZ=1 trực tiếp (mạnh
 * nhất — mọi phép chiếu ở trên đã ngầm giả định camZ=1 world unit); các neo khác (cửa/bậc thang/
 * gạch/bàn/ghế/ổ cắm) trả CHIỀU DÀI WORLD UNIT của chính nó theo hình học ĐÃ chiếu ở camZ=1, nên
 * `mmPerWorldUnit` suy từ neo X = (X.realLengthMm / lengthWorldUnits(X)) — PHẢI khớp với neo
 * cameraHeight's `mmPerWorldUnit = anchor.realLengthMm / 1` (vì camZ world unit LUÔN =1 theo định nghĩa).
 */
export function anchorScale(calib: CameraCalib, anchors: ScaleAnchorInput[]): ScaleResult {
  const measured = anchors.filter((a) => a.kind !== 'depthMetric');
  const depthOnly = anchors.filter((a) => a.kind === 'depthMetric');

  const sources: ScaleResult['sources'] = [];
  const mmPerUnitCandidates: number[] = [];

  for (const anchor of measured) {
    let mmPerUnit: number | null = null;
    if (anchor.kind === 'cameraHeight') {
      // Định nghĩa: world unit = camZ. mmPerWorldUnit = realLengthMm / 1.
      mmPerUnit = anchor.realLengthMm;
    } else {
      const lenUnits = anchorLengthWorldUnits(calib, anchor);
      if (lenUnits && lenUnits > 1e-6) mmPerUnit = anchor.realLengthMm / lenUnits;
    }
    if (mmPerUnit != null && Number.isFinite(mmPerUnit) && mmPerUnit > 0) {
      mmPerUnitCandidates.push(mmPerUnit);
      sources.push({ kind: anchor.kind, mmPerWorldUnit: mmPerUnit, agreesWithinTolerance: false });
    }
  }

  // depth map: chỉ kiểm chéo, KHÔNG bao giờ vào candidates chính (đúng luật §3④ tài liệu).
  for (const anchor of depthOnly) {
    if (!anchor.realLengthMm) continue;
    sources.push({ kind: 'depthMetric', mmPerWorldUnit: anchor.realLengthMm, agreesWithinTolerance: false });
  }

  if (mmPerUnitCandidates.length === 0) {
    return {
      mmPerWorldUnit: 0,
      confidence: 0,
      needsManualScale: true,
      sources,
      reason: 'Không có neo nào hợp lệ trong khung hình — cần người dùng nhập tay 1 kích thước đã biết.',
    };
  }

  const mean = mmPerUnitCandidates.reduce((s, v) => s + v, 0) / mmPerUnitCandidates.length;
  let allAgree = true;
  for (const s of sources) {
    if (s.kind === 'depthMetric') {
      s.agreesWithinTolerance = Math.abs(s.mmPerWorldUnit - mean) / mean <= ANCHOR_AGREEMENT_TOLERANCE;
      continue; // không ảnh hưởng allAgree — chỉ kiểm chéo tham khảo
    }
    const within = Math.abs(s.mmPerWorldUnit - mean) / mean <= ANCHOR_AGREEMENT_TOLERANCE;
    s.agreesWithinTolerance = within;
    if (!within) allAgree = false;
  }

  if (mmPerUnitCandidates.length >= 2 && !allAgree) {
    return {
      mmPerWorldUnit: mean,
      confidence: 0.3,
      needsManualScale: true,
      sources,
      reason: `Các nguồn neo lệch nhau quá ${Math.round(ANCHOR_AGREEMENT_TOLERANCE * 100)}% — không tự chọn nguồn, cần người dùng xác nhận.`,
    };
  }

  const confidence = mmPerUnitCandidates.length >= 2 ? 0.9 : 0.6; // 1 nguồn duy nhất = tin thấp hơn (không kiểm chéo được)
  return { mmPerWorldUnit: mean, confidence, needsManualScale: false, sources };
}

/* ═══════════════════════════ Bước ③+⑦ (phần đo) — R×S×C từ mặt nạ ═══════════════════════════ */

function bbox(points: Pt2D[]): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Đo Rộng×Sâu×Cao từ mặt nạ món đồ. Giả định: mặt nạ trước là 1 món đồ ĐỨNG TRÊN SÀN, đáy mặt
 * nạ (y lớn nhất) chạm sàn. Rộng = khoảng cách world giữa điểm chạm-sàn trái nhất/phải nhất của
 * đáy mặt nạ (🟢 ĐO). Cao = từ đáy (điểm chạm sàn, x giữa đáy) lên đỉnh mặt nạ (y nhỏ nhất) qua
 * `heightFromTopPoint` (🟢 ĐO). Sâu = 🟡 SUY qua prior tỉ lệ, TRỪ KHI có `silhouette.side`.
 */
export function measureObject(calib: CameraCalib, scale: ScaleResult, silhouette: ObjectSilhouette): MeasurementResult {
  const mmPerUnit = scale.mmPerWorldUnit || 0;
  const front = silhouette.front;

  // Điểm trái nhất/phải nhất/cao nhất THẬT của viền — mỗi điểm giữ ĐÚNG toạ độ y của nó (KHÔNG
  // ép về box.maxY chung): dưới phối cảnh có yaw, 2 góc đáy trái/phải hiếm khi cùng y ảnh — ép
  // chung 1 y làm điểm trái/phải bị suy ra từ 1 dải hẹp có thể chỉ chứa 1 trong 2 góc (width→0,
  // bug đã bắt được bằng test cảnh tổng hợp trước khi sửa, xem lịch sử).
  const leftPt = front.reduce((a, b) => (b.x < a.x ? b : a));
  const rightPt = front.reduce((a, b) => (b.x > a.x ? b : a));
  const topPt = front.reduce((a, b) => (b.y < a.y ? b : a));

  const wLeft = intersectFloor(calib, leftPt, 1);
  const wRight = intersectFloor(calib, rightPt, 1);
  let widthMm = 0;
  let widthOk = false;
  if (wLeft && wRight) {
    const widthUnits = Math.sqrt((wLeft[0] - wRight[0]) ** 2 + (wLeft[1] - wRight[1]) ** 2 + (wLeft[2] - wRight[2]) ** 2);
    widthMm = widthUnits * mmPerUnit;
    widthOk = true;
  }

  // Điểm chạm-sàn trung tâm: nội suy TUYẾN TÍNH giữa 2 góc trái/phải (đúng cả toạ độ x lẫn y ảnh
  // — không ép y về giá trị chung nào), rồi dùng CHÍNH x đó ghép với y của điểm cao nhất để suy
  // chiều cao — xấp xỉ hợp lý khi không biết chính xác góc trên của mặt nạ khớp góc dưới nào.
  const baseMid: Pt2D = { x: (leftPt.x + rightPt.x) / 2, y: (leftPt.y + rightPt.y) / 2 };
  const topForHeight: Pt2D = { x: baseMid.x, y: topPt.y };
  const baseCenterWorld = intersectFloor(calib, baseMid, 1);
  let heightMm = 0;
  let heightOk = false;
  if (baseCenterWorld) {
    const hUnits = heightFromTopPoint(calib, topForHeight, baseCenterWorld, 1);
    if (hUnits != null) {
      heightMm = hUnits * mmPerUnit;
      heightOk = true;
    }
  }

  // Sai số ước lượng: hình học ĐO cộng dồn (a) sai số neo thang đo (1-confidence) (b) sai số
  // hiệu chỉnh camera (1-calib.confidence) — quy về % rồi ra mm, KHÔNG bịa số tuyệt đối.
  const geomErrRatio = 0.02 + (1 - scale.confidence) * 0.05 + (1 - calib.confidence) * 0.05;

  const width: MeasurementValue = widthOk
    ? { valueMm: widthMm, toleranceMm: widthMm * geomErrRatio, kind: 'measured', basis: 'Điểm chạm sàn trái/phải mặt nạ, chiếu qua mặt sàn đã hiệu chỉnh (VP ngang) + thang đo neo.' }
    : { valueMm: 0, toleranceMm: 0, kind: 'inferred', basis: 'Không tính được — hình học tia không cắt sàn hợp lệ.' };

  const height: MeasurementValue = heightOk
    ? { valueMm: heightMm, toleranceMm: heightMm * geomErrRatio, kind: 'measured', basis: 'Đáy chạm sàn → đỉnh mặt nạ, chiếu qua điểm tụ dọc (VP đứng) + thang đo neo.' }
    : { valueMm: 0, toleranceMm: 0, kind: 'inferred', basis: 'Không tính được — hình học tia không cắt sàn hợp lệ.' };

  let depth: MeasurementValue;
  if (silhouette.side && silhouette.side.length >= 3) {
    const sideBox = bbox(silhouette.side);
    const sLeft: Pt2D = { x: sideBox.minX, y: sideBox.maxY };
    const sRight: Pt2D = { x: sideBox.maxX, y: sideBox.maxY };
    const wS1 = intersectFloor(calib, sLeft, 1);
    const wS2 = intersectFloor(calib, sRight, 1);
    if (wS1 && wS2) {
      const dUnits = Math.sqrt((wS1[0] - wS2[0]) ** 2 + (wS1[1] - wS2[1]) ** 2 + (wS1[2] - wS2[2]) ** 2);
      const depthMm = dUnits * mmPerUnit;
      depth = { valueMm: depthMm, toleranceMm: depthMm * geomErrRatio, kind: 'measured', basis: 'Mặt bên nhìn thấy trong ảnh — chiếu qua mặt sàn giống chiều rộng.' };
    } else {
      depth = inferredDepth(widthMm);
    }
  } else {
    depth = inferredDepth(widthMm);
  }

  return { width, height, depth };
}

function inferredDepth(widthMm: number): MeasurementValue {
  const v = widthMm * DEFAULT_DEPTH_TO_WIDTH_RATIO;
  return {
    valueMm: v,
    toleranceMm: v * DEPTH_PRIOR_TOLERANCE_RATIO,
    kind: 'inferred',
    basis: `Không thấy mặt bên trong ảnh (1 góc chụp) — ước lượng theo tỉ lệ sâu/rộng nội thất thông dụng (${DEFAULT_DEPTH_TO_WIDTH_RATIO}× rộng). KIỂM TRA TRƯỚC KHI SẢN XUẤT.`,
  };
}

/* ═══════════════════════════ Layer ẢNH (heuristic) — bước ①③ đọc pixel thật ═══════════════════════════ */

export function toGray(img: RgbaImage): GrayImage {
  const { width, height, data } = img;
  const out = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    out[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return { width, height, data: out };
}

/**
 * Sobel gradient — trả magnitude + hướng (radian) mỗi pixel. Đơn giản, chuẩn giáo trình, đủ cho
 * bước dò biên trước khi gom cụm đường thẳng — KHÔNG phải NMS+hysteresis đầy đủ kiểu Canny (nằm
 * ngoài phạm vi "lát cắt 1", có thể nâng cấp sau nếu độ chính xác thực tế không đủ).
 */
function sobel(gray: GrayImage): { mag: Float32Array; dir: Float32Array } {
  const { width: w, height: h, data } = gray;
  const mag = new Float32Array(w * h);
  const dir = new Float32Array(w * h);
  const at = (x: number, y: number) => data[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx =
        -at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1) + at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1);
      const gy =
        -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) + at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
      mag[y * w + x] = Math.sqrt(gx * gx + gy * gy);
      dir[y * w + x] = Math.atan2(gy, gx);
    }
  }
  return { mag, dir };
}

/**
 * Dò đoạn thẳng THEO HƯỚNG: quét theo lưới góc (18 hướng, mỗi 10°), với mỗi hướng dùng Hough
 * tích luỹ (ρ,θ) tìm đỉnh mạnh nhất, rồi truy vết pixel biên dọc đường đó ra đoạn thẳng dài nhất
 * liên tục. Heuristic phổ thông (không phải LSD nghiên cứu) — đủ cho cảnh Manhattan rõ nét
 * (nội thất/render), KÉM tin cậy hơn trên ảnh nhiễu/mờ — phản ánh qua `confidence` ở tầng trên.
 */
export function detectLineSegments(img: RgbaImage, opts: { maxLines?: number; magThreshold?: number } = {}): LineSegment2D[] {
  const maxLines = opts.maxLines ?? 60;
  const magThreshold = opts.magThreshold ?? 40;
  const gray = toGray(img);
  const { mag, dir } = sobel(gray);
  const { width: w, height: h } = gray;

  const thetaBins = 180; // 1° mỗi bin
  const diag = Math.sqrt(w * w + h * h);
  const rhoBins = Math.ceil(diag * 2);
  const acc = new Int32Array(thetaBins * rhoBins);
  const edgePts: { x: number; y: number }[] = [];

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const m = mag[y * w + x];
      if (m < magThreshold) continue;
      edgePts.push({ x, y });
      // 🔴 SỬA 15/08 — BUG GỐC làm Hough KHÔNG BAO GIỜ tạo được đỉnh:
      // bản cũ vote bằng góc TIẾP TUYẾN (`dir + 90°`) rồi lại tính rho theo công thức
      // `x·cosθ + y·sinθ` — công thức đó CHỈ đúng khi θ là góc PHÁP TUYẾN. Hệ quả: các điểm
      // trên CÙNG một đường cho rho KHÁC NHAU (đo thật: đường pháp-tuyến-30°/rho-100 cho ra
      // −50/0/50/120 thay vì 100,100,100,100) ⇒ phiếu rải khắp bin, không đỉnh nào hình thành,
      // `detectLineSegments` trả rỗng, `calibrateFromImage` luôn rơi `needsManualScale`.
      // Phần DỰNG LẠI đoạn thẳng phía dưới (`:645-658`) vốn đã diễn giải θ là PHÁP TUYẾN
      // ("hướng vuông góc pháp tuyến (cosT,sinT)") — nên hai nửa cùng file hiểu ngược nhau.
      // Sửa theo nửa đúng: gradient ảnh CHÍNH LÀ pháp tuyến của biên ⇒ θ = dir.
      const thetaNormal = dir[y * w + x];
      const thetaDeg = (((thetaNormal * 180) / Math.PI) % 180 + 180) % 180;
      const rho = x * Math.cos(thetaNormal) + y * Math.sin(thetaNormal) + diag;
      const tBin = Math.min(thetaBins - 1, Math.floor(thetaDeg));
      const rBin = Math.min(rhoBins - 1, Math.max(0, Math.floor(rho)));
      acc[tBin * rhoBins + rBin] += 1;
    }
  }

  // Lấy top-K đỉnh accumulator KHÔNG liền kề nhau (non-max suppression thô theo lân cận bin).
  const peaks: { tBin: number; rBin: number; votes: number }[] = [];
  const suppressed = new Uint8Array(thetaBins * rhoBins);
  for (let iter = 0; iter < maxLines; iter++) {
    let best = -1;
    let bestVotes = 0;
    for (let i = 0; i < acc.length; i++) {
      if (suppressed[i]) continue;
      if (acc[i] > bestVotes) {
        bestVotes = acc[i];
        best = i;
      }
    }
    if (best < 0 || bestVotes < 8) break;
    const tBin = Math.floor(best / rhoBins);
    const rBin = best % rhoBins;
    peaks.push({ tBin, rBin, votes: bestVotes });
    for (let dt = -3; dt <= 3; dt++) {
      for (let dr = -6; dr <= 6; dr++) {
        const tt = tBin + dt;
        const rr = rBin + dr;
        if (tt >= 0 && tt < thetaBins && rr >= 0 && rr < rhoBins) suppressed[tt * rhoBins + rr] = 1;
      }
    }
  }

  // Với mỗi đỉnh, tìm điểm biên KHỚP đường đó rồi lấy đoạn (min,max) chiếu lên hướng đường —
  // ra 1 LineSegment2D thật (không chỉ tham số (ρ,θ) trừu tượng).
  const lines: LineSegment2D[] = [];
  for (const peak of peaks) {
    const thetaLine = ((peak.tBin + 0.5) * Math.PI) / 180;
    const cosT = Math.cos(thetaLine);
    const sinT = Math.sin(thetaLine);
    const rhoTarget = peak.rBin + 0.5 - diag;
    const along: { t: number; x: number; y: number }[] = [];
    for (const p of edgePts) {
      const rho = p.x * cosT + p.y * sinT;
      if (Math.abs(rho - rhoTarget) > 1.5) continue;
      // toạ độ dọc đường (hướng vuông góc pháp tuyến (cosT,sinT))
      const t = -p.x * sinT + p.y * cosT;
      along.push({ t, x: p.x, y: p.y });
    }
    if (along.length < 6) continue;
    along.sort((a, b) => a.t - b.t);
    lines.push({ a: { x: along[0].x, y: along[0].y }, b: { x: along[along.length - 1].x, y: along[along.length - 1].y } });
  }
  return lines;
}

/** Góc (độ, 0-180) của 1 đoạn thẳng trong ảnh — dùng để phân cụm dọc/ngang. */
function segmentAngleDeg(l: LineSegment2D): number {
  const a = (Math.atan2(l.b.y - l.a.y, l.b.x - l.a.x) * 180) / Math.PI;
  return ((a % 180) + 180) % 180;
}

/**
 * Gom N đoạn thẳng thành 3 cụm Manhattan (1 dọc gần-đứng + 2 ngang hội tụ) rồi hiệu chỉnh camera
 * trực tiếp từ ảnh. Trả `{ needsManualScale: true, reason }` nếu không đủ đường mỗi cụm (ảnh
 * cận cảnh không có cạnh kiến trúc nào — đúng rủi ro §5 tài liệu tư vấn, không đoán bừa).
 */
export function calibrateFromImage(img: RgbaImage): CameraCalib | { needsManualScale: true; reason: string } {
  const lines = detectLineSegments(img);
  if (lines.length < 6) {
    return { needsManualScale: true, reason: 'Không dò được đủ cạnh thẳng trong ảnh (cần ≥6, có ' + lines.length + ') — có thể là ảnh cận cảnh không có cạnh kiến trúc nào.' };
  }

  // Cụm "gần đứng": góc trong [75°,105°]. Còn lại chia 2 cụm ngang bằng góc trung vị (Manhattan
  // world → 2 hướng ngang còn lại cách nhau ~90° sau khi bỏ cụm dọc).
  const vertLines = lines.filter((l) => {
    const a = segmentAngleDeg(l);
    return a >= 75 && a <= 105;
  });
  const horizLines = lines.filter((l) => !vertLines.includes(l));
  if (vertLines.length < 2 || horizLines.length < 4) {
    return { needsManualScale: true, reason: 'Không đủ đường thẳng theo cả 2 phương (dọc/ngang) để dò 3 điểm tụ Manhattan.' };
  }
  const sortedHoriz = [...horizLines].sort((a, b) => segmentAngleDeg(a) - segmentAngleDeg(b));
  const mid = Math.floor(sortedHoriz.length / 2);
  const groupA = sortedHoriz.slice(0, mid);
  const groupB = sortedHoriz.slice(mid);
  if (groupA.length < 2 || groupB.length < 2) {
    return { needsManualScale: true, reason: 'Không tách được 2 cụm đường ngang hội tụ khác nhau.' };
  }

  const vpV = vanishingPointFromLines(vertLines);
  const vpA = vanishingPointFromLines(groupA);
  const vpB = vanishingPointFromLines(groupB);
  if (!vpV || !vpA || !vpB) {
    return { needsManualScale: true, reason: 'Các cụm đường không hội tụ được về 1 điểm tụ hợp lệ (có thể ảnh bị méo/nhiễu nặng).' };
  }

  const calib = calibrateFromVanishingPoints(vpV.vp, vpA.vp, vpB.vp, img.width, img.height);
  if (!calib) return { needsManualScale: true, reason: 'Hình học 3 điểm tụ không trực giao được — hiệu chỉnh thất bại.' };
  return calib;
}

/* ═══════════════════════════ Thang PHƯƠNG PHÁP (không rơi tay không) — 30/07 sửa 2 lần ═══════════════════════════
 *
 * SỬA LẦN 1: bản gốc (trên) bắt MỌI phép đo đi qua điểm tụ (bước ①) — cần ảnh có cạnh thẳng dài
 * 2 phương. Ảnh render nội thất ĐẸP (rèm, thảm cong, ánh sáng loang) thường KHÔNG có → báo lỗi
 * trung thực nhưng "tay không". Nguyên tắc mới: "Bấm Render KHÔNG BAO GIỜ trả về tay không" —
 * luôn có số + độ tin thật, tự TỤT phương pháp khi phương pháp trên không đủ điều kiện, KHÔNG
 * dừng báo lỗi đỏ (lỗi đỏ CHỈ dành cho ngoại lệ thật — ảnh hỏng không đọc được).
 *
 * SỬA LẦN 2 (Hoà chỉ đúng — Luật #6 Đồng Bộ): 4 "bậc" KHÔNG được là cơ chế riêng — phải ÁNH XẠ
 * vào 4 TẦNG AI đã có sẵn (`lib/ai/tiers.ts`, dùng CHUNG toàn app). `tier` field dưới đây là
 * PHƯƠNG PHÁP ĐO (method quality 1-4, riêng của module này — hình học có gì dùng nấy), KHÁC với
 * `AiTier` (1-4, hệ thống — Không AI/oneAI/AI Vừa/AI Cao). Node (2.2.88) đọc `ctx.aiTier` rồi
 * hiện CẢ HAI: "Tầng <n> · phương pháp bậc <m> · độ tin <k>%" — không trộn làm một số.
 *
 * Phương pháp 4 (tốt nhất, hoạt động ở MỌI aiTier kể cả 1=Không AI — thuần hình học, 0 credit):
 *   `calibrateFromImage()`+`anchorScale()`+`measureObject()` — điểm tụ ảnh. ~90%.
 * Phương pháp 3 (neo tay — hoạt động ở MỌI aiTier, không cần AI): người dùng khoanh 2 điểm 1 vật
 *   chuẩn (`tierManualAnchor`) HOẶC xác nhận 1 kích thước của chính món đang đo (`tier3`, đơn
 *   giản hoá). ~80%.
 * Phương pháp 2 (có mặt nạ — `ai.furnitureextract`/`ai.removebg`, tự động ở aiTier≥2 hoặc tầng
 *   lõi tất định): tỉ lệ W:H khung bao mặt nạ tinh chỉnh dải chuẩn nghề. D vẫn 🟡. ~65%.
 * Phương pháp 1 (LUÔN sẵn sàng, 0 điều kiện) — dải chuẩn nghề theo loại đồ NGƯỜI DÙNG CHỌN (không
 *   tự đoán qua ảnh — đoán loại đồ bằng heuristic không đáng tin, đúng bước cấm "đoán bừa"). ~50%.
 *
 * ⚠️ CHƯA LÀM (disclose rõ, không giấu — ưu tiên xây 1→2→3→4, KHÔNG làm 4 trước theo yêu cầu):
 * Tầng 2 auto-tìm vật neo qua oneAI (object detection) và Tầng 3 VLM tự ước category/tỉ lệ CHƯA
 * có trong bản này — cần hạ tầng object-detection/VLM riêng, ngoài thời gian phiên này. Phương
 * pháp 4/3/2/1 ở trên hoạt động ĐỘC LẬP với AI (không cần Tầng 2/3 mới đạt "luôn ra số thật").
 */

export type FurnitureCategory =
  | 'sofa2'
  | 'sofa3'
  | 'armchair'
  | 'bedSingle'
  | 'bedDouble'
  | 'bedQueen'
  | 'bedKing'
  | 'diningTable'
  | 'coffeeTable'
  | 'deskTable'
  | 'wardrobe'
  | 'nightstand'
  | 'diningChair'
  | 'other';

/** Dải chuẩn nghề [min,max] mm — nguồn: thực hành nội thất phổ thông (tương tự tinh thần
 * `ANCHOR_CONFIG` ở trên, không phải số bịa). `typical*` = trung điểm dải, dùng làm giá trị bậc 1. */
export const FURNITURE_SIZE_PRIORS: Record<FurnitureCategory, { widthMm: [number, number]; depthMm: [number, number]; heightMm: [number, number]; label: string }> = {
  sofa2: { widthMm: [1400, 1800], depthMm: [800, 950], heightMm: [800, 900], label: 'Sofa 2 chỗ' },
  sofa3: { widthMm: [1800, 2300], depthMm: [850, 1000], heightMm: [800, 900], label: 'Sofa 3 chỗ' },
  armchair: { widthMm: [700, 900], depthMm: [750, 900], heightMm: [750, 900], label: 'Ghế bành' },
  bedSingle: { widthMm: [900, 1000], depthMm: [1900, 2000], heightMm: [400, 500], label: 'Giường đơn' },
  bedDouble: { widthMm: [1350, 1500], depthMm: [1900, 2000], heightMm: [400, 500], label: 'Giường đôi' },
  bedQueen: { widthMm: [1500, 1600], depthMm: [2000, 2100], heightMm: [400, 500], label: 'Giường Queen' },
  bedKing: { widthMm: [1800, 2000], depthMm: [2000, 2100], heightMm: [400, 500], label: 'Giường King' },
  diningTable: { widthMm: [1400, 1800], depthMm: [800, 950], heightMm: [720, 760], label: 'Bàn ăn' },
  coffeeTable: { widthMm: [900, 1200], depthMm: [500, 700], heightMm: [350, 450], label: 'Bàn cà phê' },
  deskTable: { widthMm: [1100, 1400], depthMm: [550, 700], heightMm: [720, 760], label: 'Bàn làm việc' },
  wardrobe: { widthMm: [1500, 2400], depthMm: [550, 650], heightMm: [2000, 2400], label: 'Tủ quần áo' },
  nightstand: { widthMm: [400, 550], depthMm: [350, 450], heightMm: [500, 600], label: 'Táp đầu giường' },
  diningChair: { widthMm: [450, 550], depthMm: [500, 600], heightMm: [800, 950], label: 'Ghế ăn' },
  other: { widthMm: [400, 2000], depthMm: [400, 900], heightMm: [400, 1200], label: 'Nội thất khác' },
};

export interface TieredMeasurement {
  /** Phương pháp đo (method quality — CỦA MODULE NÀY), KHÁC `AiTier` hệ thống. Xem docstring khối. */
  tier: 1 | 2 | 3 | 4;
  tierLabel: string;
  confidencePercent: number;
  width: MeasurementValue;
  depth: MeasurementValue;
  height: MeasurementValue;
  /** Gợi ý CỤ THỂ để lên bậc kế tiếp — undefined khi đã ở bậc 4 (không còn gì để lên). */
  upgradeHint?: string;
  /** true khi chưa có neo tay/hình học thật (tier ≤2) — UI nên mời khoanh vật neo. */
  needsManualAnchor?: boolean;
}

function priorValue(range: [number, number]): number {
  return (range[0] + range[1]) / 2;
}
function priorTolerance(range: [number, number]): number {
  return (range[1] - range[0]) / 2;
}

/** Bậc 1 — dải chuẩn nghề theo loại đồ, KHÔNG cần ảnh/mặt nạ/neo gì cả. */
function tier1(category: FurnitureCategory): TieredMeasurement {
  const p = FURNITURE_SIZE_PRIORS[category];
  const mk = (range: [number, number], basis: string): MeasurementValue => ({
    valueMm: priorValue(range),
    toleranceMm: priorTolerance(range),
    kind: 'inferred',
    basis,
  });
  return {
    tier: 1,
    tierLabel: `Bậc 1 — dải chuẩn nghề (${p.label})`,
    confidencePercent: 50,
    width: mk(p.widthMm, `Dải chuẩn nghề "${p.label}" — chưa tách được món trong ảnh.`),
    depth: mk(p.depthMm, `Dải chuẩn nghề "${p.label}" — ảnh 2D không thấy mặt sau.`),
    height: mk(p.heightMm, `Dải chuẩn nghề "${p.label}" — chưa tách được món trong ảnh.`),
    upgradeHint: 'Tách được món trong ảnh (nút "Tách nội thất") sẽ tăng độ tin lên ~65%.',
  };
}

/** Bậc 2 — tỉ lệ W:H khung bao mặt nạ tinh chỉnh bậc 1 (H làm neo, lệch ít hơn W giữa các món
 * cùng loại). D vẫn 🟡 — ảnh 2D không đo được sâu, bất kể có mặt nạ hay không. */
function tier2(category: FurnitureCategory, silhouette: ObjectSilhouette): TieredMeasurement {
  const p = FURNITURE_SIZE_PRIORS[category];
  const box = bbox(silhouette.front);
  const pxW = Math.max(1, box.maxX - box.minX);
  const pxH = Math.max(1, box.maxY - box.minY);
  const hTypical = priorValue(p.heightMm);
  const mmPerPx = hTypical / pxH;
  const widthMm = pxW * mmPerPx;
  const t1 = tier1(category);
  return {
    tier: 2,
    tierLabel: `Bậc 2 — tỉ lệ khung bao mặt nạ (${p.label})`,
    confidencePercent: 65,
    width: {
      valueMm: widthMm,
      toleranceMm: widthMm * 0.2,
      kind: 'measured',
      basis: `Tỉ lệ rộng/cao khung bao mặt nạ × cao chuẩn nghề "${p.label}" (${Math.round(hTypical)}mm).`,
    },
    depth: t1.depth,
    height: {
      valueMm: hTypical,
      toleranceMm: priorTolerance(p.heightMm),
      kind: 'measured',
      basis: `Cao chuẩn nghề "${p.label}" — chưa có neo thật để hiệu chỉnh riêng.`,
    },
    upgradeHint: 'Nhập 1 kích thước bạn biết của món này (vd rộng thật) để tăng độ tin lên ~80%.',
  };
}

/** Bậc 3 — người dùng xác nhận 1 kích thước THẬT của chính món đang đo (đơn giản hoá thay vì
 * khoanh vật neo riêng khác trong khung — xem docstring đầu khối). */
function tier3(category: FurnitureCategory, silhouette: ObjectSilhouette, knownWidthMm: number): TieredMeasurement {
  const p = FURNITURE_SIZE_PRIORS[category];
  const box = bbox(silhouette.front);
  const pxW = Math.max(1, box.maxX - box.minX);
  const pxH = Math.max(1, box.maxY - box.minY);
  const mmPerPx = knownWidthMm / pxW;
  const heightMm = pxH * mmPerPx;
  return {
    tier: 3,
    tierLabel: `Bậc 3 — neo bằng kích thước người dùng xác nhận (${p.label})`,
    confidencePercent: 80,
    width: { valueMm: knownWidthMm, toleranceMm: knownWidthMm * 0.03, kind: 'measured', basis: 'Người dùng xác nhận trực tiếp.' },
    depth: {
      valueMm: priorValue(p.depthMm),
      toleranceMm: priorTolerance(p.depthMm),
      kind: 'inferred',
      basis: `Dải chuẩn nghề "${p.label}" — ảnh 2D không thấy mặt sau, kể cả khi đã neo rộng thật.`,
    },
    height: { valueMm: heightMm, toleranceMm: heightMm * 0.1, kind: 'measured', basis: 'Tỉ lệ khung bao mặt nạ × rộng thật người dùng xác nhận.' },
    upgradeHint: 'Ảnh có đủ cạnh tường/sàn/trần thẳng sẽ tự động lên ~90% độ tin (không cần làm gì thêm).',
  };
}

/** Neo tay THẬT — người dùng khoanh 2 điểm trên 1 vật chuẩn (`ANCHOR_CONFIG`) ở BẤT KỲ đâu trong
 * khung hình (không nhất thiết là chính món đang đo, khác `tier3` ở trên). Tỉ lệ mm/px suy từ
 * khoảng cách 2 điểm đó, áp thẳng lên khung bao mặt nạ món đang đo — giả định món đang đo VÀ vật
 * neo ở GẦN CÙNG MẶT PHẲNG/ĐỘ SÂU (đơn giản hoá hợp lý cho ~80% độ tin, không cần camera calib). */
function tierManualAnchor(
  category: FurnitureCategory,
  silhouette: ObjectSilhouette,
  anchorKind: AnchorKind,
  anchorPoints: [Pt2D, Pt2D],
  anchorRealMm: number,
): TieredMeasurement {
  const p = FURNITURE_SIZE_PRIORS[category];
  const anchorPx = Math.hypot(anchorPoints[1].x - anchorPoints[0].x, anchorPoints[1].y - anchorPoints[0].y) || 1;
  const mmPerPx = anchorRealMm / anchorPx;
  const box = bbox(silhouette.front);
  const widthMm = (box.maxX - box.minX) * mmPerPx;
  const heightMm = (box.maxY - box.minY) * mmPerPx;
  const anchorLabel = ANCHOR_CONFIG[anchorKind].label;
  return {
    tier: 3,
    tierLabel: `Bậc 3 — neo tay bằng "${anchorLabel}" (${Math.round(anchorRealMm)}mm)`,
    confidencePercent: 80,
    width: { valueMm: widthMm, toleranceMm: widthMm * 0.15, kind: 'measured', basis: `Neo tay: "${anchorLabel}" ${Math.round(anchorRealMm)}mm khoanh trong ảnh → mm/px → khung bao mặt nạ.` },
    depth: {
      valueMm: priorValue(p.depthMm),
      toleranceMm: priorTolerance(p.depthMm),
      kind: 'inferred',
      basis: `Dải chuẩn nghề "${p.label}" — ảnh 2D không thấy mặt sau, kể cả khi đã neo tay.`,
    },
    height: { valueMm: heightMm, toleranceMm: heightMm * 0.15, kind: 'measured', basis: `Neo tay: "${anchorLabel}" ${Math.round(anchorRealMm)}mm khoanh trong ảnh → mm/px → khung bao mặt nạ.` },
    upgradeHint: 'Ảnh có đủ cạnh tường/sàn/trần thẳng sẽ tự động lên ~90% độ tin (không cần làm gì thêm).',
  };
}

/** Bậc 4 — engine hiệu chỉnh điểm tụ gốc (`calibrateFromImage`+`anchorScale`+`measureObject`,
 * KHÔNG đổi). Trả null nếu không đạt điều kiện — caller tự tụt xuống bậc 3. */
function tryTier4(category: FurnitureCategory, silhouette: ObjectSilhouette, image: RgbaImage, cameraHeightMm: number): TieredMeasurement | null {
  const calib = calibrateFromImage(image);
  if ('needsManualScale' in calib) return null;
  const scale = anchorScale(calib, [
    { kind: 'cameraHeight', realLengthMm: cameraHeightMm, imagePoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], vertical: true },
  ]);
  const result = measureObject(calib, scale, silhouette);
  const p = FURNITURE_SIZE_PRIORS[category];
  return {
    tier: 4,
    tierLabel: 'Bậc 4 — hiệu chỉnh camera từ điểm tụ ảnh',
    confidencePercent: 90,
    width: result.width,
    depth: result.depth.kind === 'measured' ? result.depth : { ...result.depth, basis: `${result.depth.basis} (dải chuẩn nghề "${p.label}" dùng làm tỉ lệ ước lượng — xem prior tỉ lệ trong basis gốc)` },
    height: result.height,
  };
}

/**
 * ĐIỀU PHỐI PHƯƠNG PHÁP — hàm DUY NHẤT node `vision.measureobject` (2.2.88) gọi. KHÔNG BAO GIỜ
 * throw vì thiếu cấu trúc/neo (tự tụt phương pháp) — CHỈ throw khi ảnh thật sự hỏng (decode lỗi,
 * ném ở caller trước khi gọi hàm này, không phải trong hàm này). Thứ tự thử: 4 (tự động, mọi
 * aiTier) → 3 (neo tay — 2 điểm HOẶC tự xác nhận rộng) → 2 (có mặt nạ) → 1 (chỉ loại đồ).
 */
export function measureObjectTiered(opts: {
  category: FurnitureCategory;
  silhouette?: ObjectSilhouette;
  image?: RgbaImage;
  cameraHeightMm?: number;
  knownWidthMm?: number;
  manualAnchor?: { kind: AnchorKind; points: [Pt2D, Pt2D]; realMm: number };
}): TieredMeasurement {
  const { category, silhouette, image, cameraHeightMm, knownWidthMm, manualAnchor } = opts;

  if (image && silhouette) {
    const t4 = tryTier4(category, silhouette, image, cameraHeightMm ?? ANCHOR_CONFIG.cameraHeight.typicalMm);
    if (t4) return t4;
  }
  if (silhouette && manualAnchor && manualAnchor.realMm > 0) {
    return tierManualAnchor(category, silhouette, manualAnchor.kind, manualAnchor.points, manualAnchor.realMm);
  }
  if (silhouette && knownWidthMm && knownWidthMm > 0) {
    return tier3(category, silhouette, knownWidthMm);
  }
  if (silhouette) {
    return { ...tier2(category, silhouette), needsManualAnchor: true };
  }
  return { ...tier1(category), needsManualAnchor: true };
}
