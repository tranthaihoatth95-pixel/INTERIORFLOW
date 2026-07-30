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

export type AnchorKind = 'cameraHeight' | 'door' | 'stairRiser' | 'tileModule' | 'tableTop' | 'seatHeight' | 'outlet' | 'depthMetric';

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

export const ANCHOR_CONFIG: Record<AnchorKind, { minMm: number; maxMm: number; typicalMm: number; label: string }> = {
  cameraHeight: { minMm: 1500, maxMm: 1600, typicalMm: 1550, label: 'Chiều cao máy ảnh (tầm mắt)' },
  door: { minMm: 2000, maxMm: 2200, typicalMm: 2100, label: 'Cửa đi' },
  stairRiser: { minMm: 150, maxMm: 180, typicalMm: 165, label: 'Bậc thang' },
  tileModule: { minMm: 300, maxMm: 800, typicalMm: 600, label: 'Module gạch lát' },
  tableTop: { minMm: 720, maxMm: 780, typicalMm: 750, label: 'Mặt bàn' },
  seatHeight: { minMm: 400, maxMm: 450, typicalMm: 425, label: 'Mặt ngồi ghế' },
  outlet: { minMm: 280, maxMm: 1220, typicalMm: 300, label: 'Ổ cắm/công tắc' },
  depthMetric: { minMm: 0, maxMm: 1e9, typicalMm: 0, label: 'Depth map (chỉ kiểm chéo)' },
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
      // đường thẳng qua (x,y) VUÔNG GÓC hướng gradient (biên) — θ_line = dir + 90°
      const thetaLine = dir[y * w + x] + Math.PI / 2;
      const thetaDeg = (((thetaLine * 180) / Math.PI) % 180 + 180) % 180;
      const rho = x * Math.cos(thetaLine) + y * Math.sin(thetaLine) + diag;
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
