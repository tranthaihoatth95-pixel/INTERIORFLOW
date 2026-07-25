/**
 * lib/img-id.ts — ĐỊNH DANH ẢNH ổn định toàn app (Task #19 "ĐỔ NỀN T1").
 *
 * VẤN ĐỀ: trước đây ảnh render/asset được định danh bằng chính giá trị URL/dataURI (PortValue.value),
 * tên file (LibraryAsset.path — random), hoặc id ad-hoc mỗi nơi một kiểu (`asset_…` ở gallery/linked
 * asset, `render:<nodeId>` ở handoff, cuid ở LibraryAsset). Đổi tên file / di chuyển / thay URL nguồn
 * ⇒ có nguy cơ vỡ liên kết, và không có KHÔNG GIAN ID CHUNG để 1 ảnh (dù ở node canvas, slide
 * Present, thư viện, hay schedule) cùng trỏ về 1 danh tính.
 *
 * MODULE NÀY là nguồn chân lý duy nhất cho id ảnh: mọi ảnh render/asset khi sinh ra mang id tiền tố
 * `img_`, ĐỘC LẬP với tên file/URL nguồn. Thuần (không DOM, không import nặng) → test bằng
 * sucrase-node được, dùng chung cả client (gallery, present) lẫn server (LibraryAsset).
 *
 * BACKWARD-COMPAT (bắt buộc): id cũ (`asset_…`, `render:…`, cuid) là KHOÁ THUẦN — không nơi nào parse
 * theo tiền tố, nên dữ liệu cũ vẫn dùng được y nguyên; consumer nào chưa có `img_` id thì fallback theo
 * URL/tên như trước. Module này chỉ THÊM danh tính, không xoá đường cũ.
 */

/** Tiền tố chuẩn cho mọi id ảnh render/asset. */
export const IMG_ID_PREFIX = 'img_';

/**
 * KHÔNG dùng Math.random ở render body (hydration-safe) — theo đúng khuôn `newId`/`newAssetId`
 * hiện có: chuỗi tăng dần trong 1 phiên. Đủ độc nhất cho id ảnh cục bộ (gallery/linked-asset).
 */
let _seq = 0;

/** id ảnh MỚI, ngẫu nhiên-ổn định: `img_<time36>_<seq36>`. Gọi trong handler, KHÔNG trong render body. */
export function newImgId(): string {
  _seq += 1;
  return `${IMG_ID_PREFIX}${Date.now().toString(36)}_${_seq.toString(36)}`;
}

/** true nếu `s` là id ảnh chuẩn (tiền tố `img_`). Guard cho consumer khi phân biệt id mới/cũ. */
export function isImgId(s: unknown): s is string {
  return typeof s === 'string' && s.startsWith(IMG_ID_PREFIX);
}

/**
 * Chuẩn hoá id ảnh: đã là `img_` → giữ nguyên; rỗng/nullish → mint id mới. Dùng ở nơi có thể đã
 * có id cũ nhưng muốn đảm bảo luôn có id (vd server tạo LibraryAsset). KHÔNG ép id cũ dạng khác
 * (cuid/asset_) thành img_ để không phá liên kết đang trỏ tới id cũ — chỉ mint khi CHƯA có id.
 */
export function coerceImgId(id?: string | null): string {
  return isImgId(id) ? (id as string) : newImgId();
}

/**
 * Phủ 1 KHOÁ đã-ổn-định (vd cuid của LibraryAsset — prisma cấp lúc sinh ra, độc lập tên file) vào
 * không gian `img_` một cách TẤT ĐỊNH: đã là `img_` → giữ nguyên; ngược lại → `img_<key>`. Cùng key
 * luôn cho cùng img_ id (ổn định, không cần lưu cột DB mới) — dùng ở ranh giới API để mọi ảnh library
 * cũ/mới đều có danh tính `img_` chung với gallery/linked-asset/handoff, KHÔNG migrate/regenerate client.
 */
export function imgIdFromKey(key: string): string {
  return isImgId(key) ? key : `${IMG_ID_PREFIX}${key}`;
}

/**
 * id ổn định cho 1 ảnh render xuất từ node `nodeId` (handoff Render→Present). TẤT ĐỊNH theo nodeId
 * (React Flow id — ổn định suốt vòng đời flow, KHÔNG đổi giữa các lần Run) để CÙNG ảnh (cùng node
 * nguồn) chèn vào nhiều slide tự hội tụ về CÙNG assetId. `total` = tổng ảnh node xuất trong lượt rút:
 *   - node xuất 1 ảnh  → `img_render:<nodeId>`
 *   - node xuất n ảnh  → `img_render:<nodeId>:<index>`
 * Giữ dấu `:` phân tách (đúng ngữ nghĩa độc nhất của scheme `render:` cũ), chỉ thêm tiền tố `img_`.
 */
export function renderImgId(nodeId: string, index: number, total: number): string {
  const base = total > 1 ? `render:${nodeId}:${index}` : `render:${nodeId}`;
  return `${IMG_ID_PREFIX}${base}`;
}
