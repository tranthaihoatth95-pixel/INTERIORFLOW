/**
 * lib/materials/warehouse/image-match.ts — VIỆC 4 "ảnh: cho phép kéo cả thư mục ảnh, ghép theo
 * mã/SKU trùng tên file". Thuần hàm — không DOM/API, dễ test.
 */

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

function stem(filename: string): string {
  const base = filename.slice(filename.lastIndexOf('/') + 1); // webkitdirectory trả path/tên
  const dot = base.lastIndexOf('.');
  const s = dot > 0 ? base.slice(0, dot) : base;
  return s.trim().toLowerCase();
}

function isImageFile(name: string): boolean {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  return IMAGE_EXT.has(ext);
}

/** Ghép danh sách file ảnh (kéo cả thư mục) vào danh sách SKU — khớp CHÍNH XÁC tên file (bỏ đuôi,
 * không phân biệt hoa/thường) == SKU. SKU trùng ảnh trùng tên → giữ ảnh XUẤT HIỆN SAU CÙNG (thư
 * mục có thể có ảnh trùng tên khác định dạng, ưu tiên cái người dùng kéo vào sau vì thường là bản
 * thay thế mới hơn — đơn giản hơn so khớp thời gian sửa file, KHÔNG có trong `File` API đáng tin
 * cậy xuyên trình duyệt). SKU rỗng/không khớp ảnh nào → không có trong map trả về (caller tự coi
 * là "chưa có ảnh"). */
export function matchImagesBySku(files: File[], skus: string[]): Map<string, File> {
  const bySkuStem = new Map<string, File>();
  for (const f of files) {
    if (!isImageFile(f.name)) continue;
    bySkuStem.set(stem(f.name), f);
  }
  const out = new Map<string, File>();
  for (const sku of skus) {
    const key = sku.trim().toLowerCase();
    if (!key) continue;
    const file = bySkuStem.get(key);
    if (file) out.set(sku, file);
  }
  return out;
}

/** Đọc 1 File ảnh thành data URL — dùng để gửi lên `POST /api/library` (contract dataUrl có sẵn,
 * xem `app/api/library/route.ts`). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Không đọc được file ảnh.'));
    reader.readAsDataURL(file);
  });
}

/** Tải 1 ảnh vật liệu lên Thư viện dùng chung — cùng contract `uploadCover()` ở
 * `components/ProjectSelect.tsx` (không viết đường upload thứ hai). `usage:'material'` đã có sẵn
 * trong whitelist `USAGES` của route. Trả `imageAssetId` để gắn vào `ProductSpec.imageAssetId`. */
export async function uploadMaterialImage(file: File): Promise<{ imageAssetId: string; url: string }> {
  if (!file.type.startsWith('image/')) throw new Error('Hãy chọn một file ảnh.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Ảnh quá 25MB.');
  const dataUrl = await fileToDataUrl(file);
  const res = await fetch('/api/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name || 'Ảnh vật liệu', category: 'Vật liệu', tags: 'material', usage: 'material', dataUrl }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || typeof j?.id !== 'string') throw new Error(typeof j?.error === 'string' ? j.error : 'Tải ảnh lên thất bại.');
  return { imageAssetId: j.id, url: j.url };
}
