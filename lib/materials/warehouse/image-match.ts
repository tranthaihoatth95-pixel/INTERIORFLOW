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

/** URL dùng thẳng được (không cần tìm trong thư mục ảnh). */
export function isDirectImageUrl(ref: string): boolean {
  const s = ref.trim().toLowerCase();
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/');
}

/**
 * Ghép ảnh cho TỪNG DÒNG — khoá theo `rowIndex`, KHÔNG theo SKU.
 *
 * Vì sao đổi khoá (vòng KIỂM PHẢN BIỆN 06/08): đường ảnh duy nhất trước đây là "tên file == SKU"
 * (`matchImagesBySku`). Bảng thật ghi `ghe-xoay.jpg` còn SKU là `CH-MESH-01` ⇒ đo được **0/5 món
 * có ảnh**. Và dòng KHÔNG có SKU thì vĩnh viễn không bao giờ có ảnh, dù người dùng đã đưa cột Ảnh.
 *
 * Thứ tự thử, dừng ở cái đầu tiên khớp:
 *   ① cột "Ảnh" của dòng — so tên file ĐẦY ĐỦ (`ghe-xoay.jpg`), rồi so tên KHÔNG ĐUÔI
 *     (`ghe-xoay` — người ta hay quên/ghi sai đuôi khi gõ tay);
 *   ② SKU của dòng (hành vi cũ, giữ nguyên để file/thói quen cũ không hỏng).
 * `isDirectImageUrl` không xử ở đây: URL không nằm trong thư mục người dùng kéo vào — caller đọc
 * thẳng `imageRef` (xem `apply-import.ts` gắn vào `FfeItem.imageUrl`).
 */
export function matchImagesForRows(
  files: File[],
  rows: { rowIndex: number; sku?: string; imageRef?: string }[],
): Map<number, File> {
  /* 🔴 VÁ VÒNG 2 (kiểm phản biện 06/08) — CHUẨN HOÁ UNICODE. macOS/APFS trả tên file ở dạng NFD
     ("ghế" = g-h-ê-̂-́), Excel/người gõ tay ra NFC ("ghế" 1 ký tự) — hai chuỗi TRÔNG Y HỆT nhau,
     `===` thì khác nhau. Đo được: file `ghế.png` + ô ghi `ghế.png` ⇒ **0 ảnh khớp, không câu nào
     giải thích**. Đây là ca sẽ xảy ra với gần như MỌI khách hàng Việt Nam dùng máy Mac. */
  const norm = (s: string) => s.normalize('NFC').trim().toLowerCase();

  const byFullName = new Map<string, File>();
  const byStem = new Map<string, File>();
  for (const f of files) {
    if (!isImageFile(f.name)) continue;
    const base = norm(f.name.slice(f.name.lastIndexOf('/') + 1));
    byFullName.set(base, f);
    byStem.set(norm(stem(f.name)), f);
  }

  const out = new Map<number, File>();
  for (const r of rows) {
    const ref = norm(r.imageRef ?? '');
    if (ref && !isDirectImageUrl(ref)) {
      const base = ref.slice(ref.lastIndexOf('/') + 1);
      const dot = base.lastIndexOf('.');
      const hit = byFullName.get(base) ?? byStem.get(dot > 0 ? base.slice(0, dot) : base);
      if (hit) { out.set(r.rowIndex, hit); continue; }
    }
    const sku = norm(r.sku ?? '');
    if (sku) {
      const hit = byStem.get(sku);
      if (hit) out.set(r.rowIndex, hit);
    }
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

/**
 * Đọc 1 File ảnh thành thứ `lib/boq/xlsx.ts` cần để NHÚNG vào .xlsx (byte + đuôi + kích thước
 * gốc px). Trả `null` khi không phải PNG/JPEG (Excel không nhận webp/gif đáng tin) hoặc ảnh hỏng —
 * caller ĐẾM số `null` và báo, KHÔNG bỏ qua im lặng.
 * Chạy trong TRÌNH DUYỆT (dùng `Image`/`URL.createObjectURL`) — không gọi được từ test Node.
 */
export async function imageFileToXlsxImage(
  file: File,
): Promise<{ bytes: Uint8Array; ext: 'png' | 'jpeg'; wPx: number; hPx: number } | null> {
  const type = (file.type || '').toLowerCase();
  const ext: 'png' | 'jpeg' | null = type.includes('png') ? 'png' : (type.includes('jpeg') || type.includes('jpg')) ? 'jpeg' : null;
  if (!ext) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const url = URL.createObjectURL(file);
  const dim = await new Promise<{ w: number; h: number } | null>((resolve) => {
    const im = new Image();
    im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight });
    im.onerror = () => resolve(null);
    im.src = url;
  });
  URL.revokeObjectURL(url);
  if (!dim || !dim.w || !dim.h) return null;
  return { bytes, ext, wPx: dim.w, hPx: dim.h };
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
