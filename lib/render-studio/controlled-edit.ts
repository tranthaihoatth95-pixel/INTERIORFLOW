/**
 * lib/render-studio/controlled-edit.ts — PHẦN TÍNH THUẦN của "Sửa có kiểm soát" (Controlled
 * Edit) trên kết quả ảnh sinh ra trong cửa sổ công cụ (`cua.anh.can-trang` — Cân trắng).
 *
 * Nối vào `MOI_TRUONG.anh` đã khai ở `lib/nodes/cua-so-cong-cu.ts` (id `cua.anh.can-trang`).
 * KHÔNG viết lại phép chỉnh màu — dùng LẠI `applyAdjust()` của `lib/photo-editor/imaging.ts`
 * (trình chỉnh ảnh đã có, có test), chỉ đổi tham số truyền vào (temperature/tint, phần còn lại
 * giữ nguyên trung tính) và giới hạn vùng áp bằng `EditRegion` — đúng luật NO-REBUILD §B25.
 *
 * Tách phần THUẦN (không đụng canvas/Image) ra tệp riêng để chạy được bằng `sucrase-node`
 * (không có DOM). Phần chạm canvas ở `controlled-edit-apply.ts` (client-only).
 *
 * LINEAGE: mỗi node ảnh giữ `run.editHistory` — mục đầu tiên LUÔN là bản GỐC (`kind:'original'`),
 * không bao giờ bị xoá hay ghi đè. Accept = thêm một mục MỚI vào cuối mảng, KHÔNG sửa mục cũ.
 * Đây là điều kiện "preserve original + preserve lineage" — downstream (Image→Spec…) chỉ đọc
 * `run.outputs.image.value` (giá trị ĐANG hoạt động), không cần biết lineage tồn tại.
 */

/** Vùng chọn thủ công — hình chữ nhật theo toạ độ PIXEL THẬT của ảnh (không phải toạ độ màn hình). */
export interface EditRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Tham số Cân trắng — tập con của `AdjustParams` (giữ tối giản, đúng phạm vi P0). */
export interface WhiteBalanceParams {
  /** -100 (lạnh) .. 100 (ấm), 0 = không đổi. */
  temperature: number;
  /** -100 (xanh lá) .. 100 (hồng magenta), 0 = không đổi. */
  tint: number;
}

export const NEUTRAL_WHITE_BALANCE: WhiteBalanceParams = { temperature: 0, tint: 0 };

export function whiteBalanceIsNeutral(p: WhiteBalanceParams): boolean {
  return p.temperature === 0 && p.tint === 0;
}

export type EditKind = 'original' | 'white-balance';

/** Một mục lịch sử — bất biến sau khi tạo. */
export interface EditRevision {
  id: string;
  ts: number;
  kind: EditKind;
  dataUrl: string;
  /** null = áp toàn ảnh (bản gốc luôn null). */
  region: EditRegion | null;
  params?: WhiteBalanceParams;
}

let _seq = 0;
/** id ổn định — KHÔNG gọi trong render body (chỉ trong handler), cùng khuôn `newId()` của photo-editor. */
export function newRevisionId(): string {
  _seq += 1;
  return `rev_${Date.now().toString(36)}_${_seq.toString(36)}`;
}

/** Mục GỐC — chỉ tạo một lần, lúc mở Controlled Edit lần đầu cho một node. */
export function makeOriginalRevision(dataUrl: string): EditRevision {
  return { id: newRevisionId(), ts: Date.now(), kind: 'original', dataUrl, region: null };
}

/** Lịch sử đã có bản gốc chưa (mục đầu tiên, kind luôn là 'original'). */
export function hasOriginal(history: EditRevision[] | undefined): boolean {
  return !!history && history.length > 0 && history[0].kind === 'original';
}

/**
 * Seed lịch sử nếu rỗng (dùng khi mở Controlled Edit lần đầu, ảnh hiện tại CHÍNH LÀ bản gốc
 * vì chưa qua Accept nào). Không đụng lịch sử nếu đã seed — tránh nhân đôi bản gốc.
 */
export function seedHistory(
  history: EditRevision[] | undefined,
  currentDataUrl: string,
): EditRevision[] {
  if (hasOriginal(history)) return history as EditRevision[];
  return [makeOriginalRevision(currentDataUrl)];
}

/** Thêm một revision MỚI vào cuối — không sửa/xoá mục cũ (append-only, đúng luật lineage). */
export function withNewRevision(history: EditRevision[], revision: EditRevision): EditRevision[] {
  return [...history, revision];
}

/** Revision đang HOẠT ĐỘNG = mục cuối cùng của lịch sử. */
export function activeRevision(history: EditRevision[]): EditRevision | null {
  return history.length ? history[history.length - 1] : null;
}

/** Bản gốc bất biến — mục đầu tiên. */
export function originalRevision(history: EditRevision[]): EditRevision | null {
  return history.length ? history[0] : null;
}

/**
 * Vùng chọn hợp lệ không (kích thước dương, nằm trong khung ảnh). Vùng quá nhỏ (< 4px một
 * chiều) coi là không hợp lệ — kéo nhầm một cú click không tạo được vùng chọn ma.
 */
export function regionIsValid(r: EditRegion | null, imgW: number, imgH: number): r is EditRegion {
  if (!r) return false;
  if (r.width < 4 || r.height < 4) return false;
  if (r.x < 0 || r.y < 0) return false;
  if (r.x + r.width > imgW + 0.5 || r.y + r.height > imgH + 0.5) return false;
  return true;
}

/** Chuẩn hoá 2 điểm kéo (bất kỳ hướng nào) thành {x,y,width,height} dương, ghim trong khung ảnh. */
export function regionFromDrag(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  imgW: number,
  imgH: number,
): EditRegion {
  const x0 = Math.max(0, Math.min(p0.x, p1.x));
  const y0 = Math.max(0, Math.min(p0.y, p1.y));
  const x1 = Math.min(imgW, Math.max(p0.x, p1.x));
  const y1 = Math.min(imgH, Math.max(p0.y, p1.y));
  return { x: x0, y: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) };
}
