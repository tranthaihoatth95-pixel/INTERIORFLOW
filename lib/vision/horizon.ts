/**
 * lib/vision/horizon.ts — HZ, 15/08 (docs/phieu-giao/duong-chan-troi.md). Lộ ĐƯỜNG CHÂN TRỜI mà
 * `single-view-metrology.ts` đã tính sẵn (2 điểm tụ ngang `horizA`/`horizB` trong `CameraCalib`)
 * ra cho KTS nhìn thấy và SỬA ĐƯỢC bằng tay — trước giờ số này tính xong rồi bỏ, không ai thấy
 * (`tryTier4()` tính `calib` nội bộ rồi vứt, không surface ra `TieredMeasurement`).
 *
 * ── TIỀN ĐỀ ⓪ (đã xác nhận, xem báo cáo phiên) ──────────────────────────────────────────────
 * `CameraCalib.vanishingPoints` (single-view-metrology.ts:71) LUÔN có đủ 3 điểm tụ
 * `vertical`/`horizA`/`horizB` — cả ba là trường BẮT BUỘC (không optional) trong kiểu, và
 * `calibrateFromVanishingPoints()` (:251-254) chỉ trả `CameraCalib` khi CẢ BA đã tính xong. Vậy
 * hễ có một `CameraCalib`, đường chân trời = đường nối `horizA`–`horizB` LUÔN suy được thẳng,
 * KHÔNG cần thuật toán dò mới. Trường hợp ảnh không đủ cạnh 2 phương (kể cả ảnh 1-điểm-tụ kiểu
 * nhìn thẳng vào tường) thì `calibrateFromImage()` (:675) tự trả `{needsManualScale:true}` —
 * KHÔNG có `CameraCalib` nào để đưa vào đây cả, nên `horizonFromCalib()` dưới đây nhận `null`/
 * `undefined` một cách tự nhiên và trả `null` — đúng luật [N1] "không đoán khi thiếu dữ kiện".
 *
 * ── QUYẾT ĐỊNH THIẾT KẾ (khác 1 chữ so với câu trong phiếu — ghi rõ để không ai tưởng nhầm) ───
 * Phiếu viết `applyUserHorizon(calib, line)`. Bản này bỏ tham số `calib` khỏi `applyUserHorizon`
 * — lý do: `HorizonLine.y0/y1` ở đây là PHÂN SỐ 0..1 theo chiều cao ảnh tại x=0/x=mép-phải, không
 * phải pixel thô. Lý do chọn phân số: `calibrateFromImage()` decode ảnh ở độ phân giải NHỎ HƠN
 * ảnh gốc (`maxSide` để dò cạnh nhanh, xem `decodeToRgba()` ở `lib/nodes/defs/metrology.ts:37`),
 * còn UI vẽ đè lên `<img>` hiển thị ở độ phân giải TỰ NHIÊN — nếu `HorizonLine` giữ pixel thô của
 * không gian `calib` thì UI phải nhân thêm 1 hệ số quy đổi (`img.naturalWidth / calib.imageWidth`)
 * ở MỌI nơi vẽ/kéo, dễ lệch khi 2 nơi quên nhân. Phân số thì cả đường suy ra (từ `calib`, biết
 * `calib.imageWidth/imageHeight`) lẫn đường người tự đặt tay (biết `img.naturalWidth/naturalHeight`
 * ngay tại chỗ kéo) đều quy về CÙNG một đơn vị, không cần calib để đè/lùi lại. `applyUserHorizon`
 * vì vậy chỉ cần chính đường đã kéo — không cần biết ảnh đến từ calib nào.
 */

import type { CameraCalib, Pt2D } from './single-view-metrology';

/** Đường chân trời hiển thị được — `y0` tại mép trái ảnh (x=0), `y1` tại mép phải ảnh (x=full),
 * cả hai là PHÂN SỐ 0..1 theo chiều cao ảnh (0=đỉnh ảnh, 1=đáy ảnh) — xem lý do ở đầu file. */
export interface HorizonLine {
  y0: number;
  y1: number;
  /** 'derived' = máy suy từ điểm tụ (nét đứt trong UI) · 'user' = KTS đã kéo tay (nét liền,
   * thắng máy — luật [T5]). */
  source: 'derived' | 'user';
  /** 0..1. Chỉ có nghĩa khi source==='derived' (độ khớp hình học 3 điểm tụ, xem
   * `CameraCalib.confidence`). source==='user' luôn 1 — người xác nhận bằng mắt, không phải máy
   * đoán, không cần thang tin cậy. */
  confidence: number;
}

/**
 * Suy đường chân trời từ `CameraCalib` đã hiệu chỉnh — đường nối 2 điểm tụ ngang `horizA`–`horizB`,
 * kéo dài ra 2 mép ảnh. KHÔNG tính lại điểm tụ, KHÔNG có thuật toán riêng — chỉ nội suy tuyến
 * tính. `null`/`undefined` (chưa hiệu chỉnh được, hoặc ảnh 1-điểm-tụ không có `CameraCalib`) →
 * trả `null`, KHÔNG bịa đường thay thế [N1].
 */
export function horizonFromCalib(calib: CameraCalib | null | undefined): HorizonLine | null {
  if (!calib) return null;
  const { horizA, horizB } = calib.vanishingPoints;
  const dx = horizB.x - horizA.x;
  // Suy biến: 2 điểm tụ ngang trùng hoành độ (camera roll ~90°, cực hiếm ở ảnh nội thất) — đường
  // chân trời gần như THẲNG ĐỨNG, không biểu diễn được bằng {y tại x=0, y tại x=full}. Trả null
  // thay vì báo số sai lệch — đúng luật "không đoán".
  if (!Number.isFinite(dx) || Math.abs(dx) < 1e-6) return null;
  if (!Number.isFinite(calib.imageWidth) || !Number.isFinite(calib.imageHeight) || calib.imageHeight <= 0) return null;
  const slope = (horizB.y - horizA.y) / dx;
  const yAtX = (x: number) => horizA.y + slope * (x - horizA.x);
  const y0 = yAtX(0) / calib.imageHeight;
  const y1 = yAtX(calib.imageWidth) / calib.imageHeight;
  if (!Number.isFinite(y0) || !Number.isFinite(y1)) return null;
  return { y0, y1, source: 'derived', confidence: calib.confidence };
}

/**
 * KTS kéo tay 2 đầu đường chân trời (toạ độ đã quy sẵn về phân số 0..1 theo chiều cao ảnh hiển
 * thị) → đường mới, đè lên đường máy suy [T5]. Kẹp về [0,1] — kéo ra ngoài khung ảnh vẫn giữ được
 * trên mép, không "mất tay cầm". Lùi lại: gọi lại `horizonFromCalib(calib)` với CHÍNH `calib` gốc
 * (hàm này không đụng `calib`, không mutate gì) — bản suy ra vẫn nguyên đó để quay về.
 */
export function applyUserHorizon(line: { y0: number; y1: number }): HorizonLine {
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  return { y0: clamp01(line.y0), y1: clamp01(line.y1), source: 'user', confidence: 1 };
}

/** Chữ người đọc được cho độ tin cậy — [N1] cấm chữ "tự động". */
export function horizonConfidenceLabel(h: HorizonLine): string {
  if (h.source === 'user') return 'Đã chỉnh tay — thắng đường máy suy';
  const pct = Math.round(h.confidence * 100);
  if (h.confidence >= 0.75) return `Suy từ hình học ảnh · tin cậy cao (${pct}%)`;
  if (h.confidence >= 0.4) return `Suy từ hình học ảnh · tin cậy vừa (${pct}%)`;
  return `Suy từ hình học ảnh · tin cậy thấp (${pct}%) — nên kiểm lại bằng mắt`;
}

/* ═══════════════════════════ Đường gióng phụ (④.4 — tối đa 4, chỉ hiển thị + lưu) ═══════════════
 * Đường tham chiếu bất kỳ (không nhất thiết ngang) KTS tự đặt lên ảnh để so lệch/kiểm mắt —
 * KHÔNG dính điểm tụ, KHÔNG dính camera calib, nên lưu thẳng toạ độ PIXEL TỰ NHIÊN của ảnh hiển
 * thị (đơn giản nhất, không có gì để quy đổi). Đợt này CHƯA nối vào control image AI — xem cảnh
 * báo trong UI (`ToolModeForm.tsx`). */

export interface GuideLine {
  id: string;
  a: Pt2D;
  b: Pt2D;
}

export const MAX_GUIDE_LINES = 4;

export function canAddGuideLine(lines: GuideLine[]): boolean {
  return lines.length < MAX_GUIDE_LINES;
}

/** Thêm 1 đường — vượt trần thì trả nguyên mảng cũ (không tự xoá bớt âm thầm), caller tự kiểm
 * `canAddGuideLine()` trước để báo UI đúng lý do. */
export function addGuideLine(lines: GuideLine[], line: GuideLine): GuideLine[] {
  if (!canAddGuideLine(lines)) return lines;
  return [...lines, line];
}

export function updateGuideLineEndpoint(lines: GuideLine[], id: string, end: 'a' | 'b', point: Pt2D): GuideLine[] {
  return lines.map((l) => (l.id === id ? { ...l, [end]: point } : l));
}

export function removeGuideLine(lines: GuideLine[], id: string): GuideLine[] {
  return lines.filter((l) => l.id !== id);
}
