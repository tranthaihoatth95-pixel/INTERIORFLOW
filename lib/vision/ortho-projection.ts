/**
 * lib/vision/ortho-projection.ts — BƯỚC ⑥ của dây chuyền "ảnh → món đồ có kích thước → bản vẽ"
 * (`docs/TU-VAN-ANH-SANG-BAN-VE-2026-07-30.md` §3⑥): mặt bằng · mặt đứng · mặt bên.
 *
 * ⛔ LUẬT SỐ ĐO — lý do file này tồn tại thay vì vẽ thẳng trong UI:
 * số ghi trên hình chiếu **LUÔN lấy từ tầng A** (`measureObject()` / `measureObjectTiered()`),
 * TUYỆT ĐỐI không đo lại từ khối đã kéo giãn. Khối là MẪU đã biến dạng, không phải vật thật —
 * đo lại nó chỉ là đo lại chính giả định của mình rồi trình bày như một phép đo mới. Cưỡng chế
 * bằng kiểu: `buildOrthoViews()` nhận `MeasurementResult` và mọi `OrthoDimension` mang nguyên
 * `MeasurementValue` gốc (kèm `kind`/`basis`/sai số) — không có đường nào đưa số từ `prims` vào.
 *
 * ⛔ BA NHÃN, KHÔNG ĐƯỢC TRỘN (chỉ đạo Hoà 05/08) — xem `PROVENANCE`:
 *   • số đo       → "đo từ ảnh — sai số ±x%"   → dùng cho BOQ, đặt xưởng
 *   • khối 3D     → "khối tham chiếu"           → dựng cảnh, render
 *   • hình chiếu  → "hình chiếu sơ bộ"          → trình bày
 * Mỗi `OrthoView` mang sẵn nhãn của nó, không có tham số tắt.
 *
 * ⚠️ THẬT THÀ VỀ TỪNG HÌNH (đọc code thư viện trước khi viết — luật N7). Thư viện block IF là 2D
 * nhìn từ TRÊN, không có chiều cao (xem docblock `match-template.ts`), nên ba hình KHÔNG cùng độ
 * tin, và `OrthoView.basis` nói thẳng cái nào là gì:
 *   • MẶT BẰNG  — nét thật của mẫu thư viện đã kéo giãn (hoặc hộp bao khi không khớp mẫu).
 *   • MẶT ĐỨNG  — dựng từ CHÍNH mặt nạ của món trong ảnh (bước ③), nắn về mm. Đây là đường bao
 *                 có thật của vật, không phải của mẫu.
 *   • MẶT BÊN   — **chỉ có hộp bao sâu × cao**. Ảnh một góc không chứa mặt bên (trừ khi
 *                 `silhouette.side` có), và thư viện cũng không có hình khối để chiếu. Không vờ
 *                 vẽ được chi tiết mặt bên.
 */

// Import tương đối — lý do ở `match-template.ts` (sucrase-node không đọc alias tsconfig).
import type { Prim } from '../cad/furniture';
import type { MeasurementResult, MeasurementValue, ObjectSilhouette, Pt2D } from './single-view-metrology';
import { fallbackBox, type TargetDims, type TemplateMatch } from './match-template';

/* ═══════════════════════════ Ba nhãn ═══════════════════════════ */

export type ProvenanceKind = 'measurement' | 'referenceBlock' | 'projection';

/** Nhãn + công dụng của từng loại đầu ra. Một chỗ duy nhất — mọi UI/xuất file đọc từ đây, không
 *  ai chép chuỗi ra ngoài rồi để nó trôi mất đồng bộ. */
export const PROVENANCE: Record<ProvenanceKind, { label: string; usage: string }> = {
  measurement: { label: 'Đo từ ảnh', usage: 'Dùng cho BOQ, đặt xưởng' },
  referenceBlock: { label: 'Khối tham chiếu', usage: 'Dùng để dựng cảnh, render' },
  projection: { label: 'Hình chiếu sơ bộ', usage: 'Dùng để trình bày' },
};

/** "đo từ ảnh — sai số ±x%" — x tính từ chính dung sai của phép đo, không phải số cố định. */
export function measurementLabel(v: MeasurementValue): string {
  const pct = v.valueMm > 0 ? (v.toleranceMm / v.valueMm) * 100 : 0;
  const tilde = v.kind === 'inferred' ? '~' : '';
  return `${PROVENANCE.measurement.label} — sai số ±${pct.toFixed(pct < 10 ? 1 : 0)}%${tilde ? ' (suy diễn)' : ''}`;
}

/* ═══════════════════════════ Kiểu dữ liệu ═══════════════════════════ */

export type OrthoViewKind = 'plan' | 'front' | 'side';

export interface OrthoDimension {
  /** 'width' | 'depth' | 'height' — trục được ghi kích thước trên hình này. */
  axis: 'width' | 'depth' | 'height';
  /** Nhãn hiển thị, vd "Rộng · Width". */
  label: string;
  /** NGUYÊN `MeasurementValue` của tầng A — không sao chép lẻ từng số, để `kind`/`basis` đi kèm. */
  value: MeasurementValue;
  /** Câu nguồn gốc dựng sẵn, vd "Đo từ ảnh — sai số ±3.4%". */
  provenance: string;
}

export interface OrthoView {
  kind: OrthoViewKind;
  /** Tên hiển thị song ngữ. */
  title: string;
  /** Nét vẽ, hệ LOCAL mm, gốc ở TÂM hình — cùng quy ước `BlockDef.prims` nên chèn vào CAD được. */
  prims: Prim[];
  /** Bề rộng × bề cao của khung hình chiếu (mm) — để đặt hình lên tờ, KHÔNG phải để ghi kích thước. */
  extentMm: { w: number; h: number };
  /** Kích thước ghi trên hình — luôn từ tầng A. */
  dimensions: OrthoDimension[];
  /** Nhãn cố định "Hình chiếu sơ bộ" + công dụng. */
  provenance: (typeof PROVENANCE)['projection'];
  /** Hình này dựng từ đâu, nói thẳng độ tin. */
  basis: string;
  /** true khi nét chỉ là hộp bao, không phải hình thật của vật. UI nên vẽ nét đứt. */
  isBoundingOutlineOnly: boolean;
}

export interface OrthoViewSet {
  plan: OrthoView;
  front: OrthoView;
  side: OrthoView;
  /** Khối tham chiếu đã dùng (nếu khớp được mẫu) — mang nhãn RIÊNG, không trộn với hình chiếu. */
  referenceBlock: { name: string; matchScore: number; provenance: (typeof PROVENANCE)['referenceBlock'] } | null;
  /** Dấu cảnh báo bắt buộc, giống `measurement-spec-sheet.ts` — không có tham số tắt. */
  warning: string;
}

/** Cùng câu chữ với `measurement-spec-sheet.ts` (dấu đóng trên spec sheet) — một nguồn, một giọng. */
export const HIDDEN_FACE_WARNING = 'Mặt khuất là suy diễn — kiểm tra trước khi sản xuất.';

/* ═══════════════════════════ Helper hình học ═══════════════════════════ */

function bboxOf(pts: Pt2D[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/** Hộp chữ nhật rộng × cao, gốc TÂM. */
export function outlineRect(wMm: number, hMm: number): Prim[] {
  const w = wMm / 2;
  const h = hMm / 2;
  return [{ k: 'poly', closed: true, pts: [{ x: -w, y: -h }, { x: w, y: -h }, { x: w, y: h }, { x: -w, y: h }] }];
}

/**
 * Nắn viền mặt nạ (px ảnh) thành đường bao mặt đứng (mm, gốc TÂM, Y HƯỚNG LÊN).
 *
 * ⚠️ XẤP XỈ CÓ CHỦ Ý, ghi rõ để không ai tưởng đây là phép nắn phối cảnh: chỉ ánh xạ TUYẾN TÍNH
 * khung bao mặt nạ → (rộng × cao) đã đo, tức bỏ qua co ngắn phối cảnh BÊN TRONG món đồ. Chấp nhận
 * được vì (a) `measureObjectTiered` bậc 2-3 vốn cũng suy từ khung bao mặt nạ, (b) sai lệch nằm
 * trong dung sai đã công bố, và (c) thứ cần ở đây là ĐƯỜNG BAO để trình bày, không phải toạ độ
 * để gia công. Muốn đúng hơn thì phải nắn từng điểm qua `calib` — việc của bản sau, cần mặt phẳng
 * mặt trước của vật chứ không chỉ mặt sàn.
 *
 * Lật trục Y vì gốc ảnh là góc trên-trái (y tăng xuống dưới) còn CAD là y tăng lên trên.
 */
export function silhouetteToElevation(front: Pt2D[], widthMm: number, heightMm: number): Prim[] | null {
  if (!front || front.length < 3 || !(widthMm > 0) || !(heightMm > 0)) return null;
  const b = bboxOf(front);
  const pxW = b.maxX - b.minX;
  const pxH = b.maxY - b.minY;
  if (!(pxW > 0) || !(pxH > 0)) return null;
  const sx = widthMm / pxW;
  const sy = heightMm / pxH;
  const pts = front.map((p) => ({
    x: (p.x - b.minX) * sx - widthMm / 2,
    y: heightMm / 2 - (p.y - b.minY) * sy, // lật Y: đáy mặt nạ (y px lớn) → đáy hình (y mm nhỏ)
  }));
  return [{ k: 'poly', closed: true, pts }];
}

/* ═══════════════════════════ Hàm chính ═══════════════════════════ */

const AXIS_LABEL: Record<OrthoDimension['axis'], string> = {
  width: 'Rộng · Width',
  depth: 'Sâu · Depth',
  height: 'Cao · Height',
};

function dim(axis: OrthoDimension['axis'], value: MeasurementValue): OrthoDimension {
  return { axis, label: AXIS_LABEL[axis], value, provenance: measurementLabel(value) };
}

export interface BuildOrthoOptions {
  /** Kết quả bước ⑤. `null` = không khớp được mẫu nào ⇒ cả ba hình rơi về hộp bao. */
  match: TemplateMatch | null;
  /** Mặt nạ bước ③ — có thì mặt ĐỨNG dựng được đường bao thật của vật. */
  silhouette?: ObjectSilhouette;
}

/**
 * BƯỚC ⑥ — dựng ba hình chiếu trực giao từ số đo tầng A + mẫu đã khớp ở bước ⑤.
 *
 * `measurement` là NGUỒN DUY NHẤT của mọi con số. `match` chỉ góp NÉT VẼ.
 */
export function buildOrthoViews(measurement: MeasurementResult, opts: BuildOrthoOptions): OrthoViewSet {
  const dims: TargetDims = {
    widthMm: measurement.width.valueMm,
    depthMm: measurement.depth.valueMm,
    heightMm: measurement.height.valueMm,
  };
  const proj = PROVENANCE.projection;

  /* ── MẶT BẰNG — nét mẫu đã kéo giãn, hoặc hộp bao ── */
  const planFromTemplate = opts.match?.prims?.length ? opts.match.prims : null;
  const plan: OrthoView = {
    kind: 'plan',
    title: 'Mặt bằng · Plan',
    prims: planFromTemplate ?? fallbackBox(dims),
    extentMm: { w: dims.widthMm, h: dims.depthMm },
    dimensions: [dim('width', measurement.width), dim('depth', measurement.depth)],
    provenance: proj,
    basis: planFromTemplate
      ? `Nét mặt bằng của mẫu thư viện "${opts.match!.candidate.name}" (giống ${Math.round(opts.match!.matchScore * 100)}%), kéo giãn về đúng số đo.`
      : 'Không khớp được mẫu nào — chỉ hộp bao rộng × sâu.',
    isBoundingOutlineOnly: !planFromTemplate,
  };

  /* ── MẶT ĐỨNG — từ chính mặt nạ của vật (thật), hoặc hộp bao ── */
  const elevation = opts.silhouette?.front
    ? silhouetteToElevation(opts.silhouette.front, dims.widthMm, dims.heightMm)
    : null;
  const front: OrthoView = {
    kind: 'front',
    title: 'Mặt đứng · Front',
    prims: elevation ?? outlineRect(dims.widthMm, dims.heightMm),
    extentMm: { w: dims.widthMm, h: dims.heightMm },
    dimensions: [dim('width', measurement.width), dim('height', measurement.height)],
    provenance: proj,
    basis: elevation
      ? 'Đường bao dựng từ chính mặt nạ món đồ trong ảnh, nắn tuyến tính về rộng × cao đã đo (bỏ qua co ngắn phối cảnh bên trong món).'
      : 'Chưa có mặt nạ món đồ — chỉ hộp bao rộng × cao.',
    isBoundingOutlineOnly: !elevation,
  };

  /* ── MẶT BÊN — không có nguồn nào, luôn chỉ hộp bao ── */
  const side: OrthoView = {
    kind: 'side',
    title: 'Mặt bên · Side',
    prims: outlineRect(dims.depthMm, dims.heightMm),
    extentMm: { w: dims.depthMm, h: dims.heightMm },
    dimensions: [dim('depth', measurement.depth), dim('height', measurement.height)],
    provenance: proj,
    basis:
      'Chỉ hộp bao sâu × cao. Ảnh một góc không chứa mặt bên, và thư viện block IF là 2D nhìn từ trên nên không có hình khối để chiếu ra mặt bên.',
    isBoundingOutlineOnly: true,
  };

  return {
    plan,
    front,
    side,
    referenceBlock: opts.match
      ? { name: opts.match.candidate.name, matchScore: opts.match.matchScore, provenance: PROVENANCE.referenceBlock }
      : null,
    warning: HIDDEN_FACE_WARNING,
  };
}
