/**
 * scripts/lib/anh-duyet-mat.mjs — nạp ảnh bằng chứng từ REPO rồi nén thành data URI.
 *
 * Nguồn ảnh CHỈ được lấy trong `docs/delivery/anh-duyet-mat/` — ảnh duyệt mắt là
 * deliverable, mà deliverable chỉ tồn tại khi nó nằm trong repo và git nhìn thấy
 * (bài học 04/09: một lô ảnh của lane Home biến mất khỏi đĩa vì nằm ở thư mục bị gitignore).
 *
 * Nén: rộng 1280, JPEG chất lượng 76 (mozjpeg). 38 ảnh ≈ 1,5 MB ⇒ ≈ 2 MB sau base64,
 * thừa chỗ trong trần 16 MB của một trang xuất bản. KHÔNG phóng to ảnh nhỏ hơn 1280.
 */
import sharp from 'sharp';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const KHO = join(process.cwd(), 'docs/delivery/anh-duyet-mat');
const nho = new Map();

/** Tìm ảnh theo tên (không đuôi) trong mọi lô con. Thiếu ảnh là DỪNG, không trả rỗng. */
function tim(ten) {
  for (const lo of readdirSync(KHO, { withFileTypes: true })) {
    if (!lo.isDirectory()) continue;
    for (const duoi of ['.png', '.jpg']) {
      const p = join(KHO, lo.name, ten + duoi);
      if (existsSync(p)) return p;
    }
  }
  throw new Error(`không thấy ảnh "${ten}" trong ${KHO} — kiểm lại tên khung`);
}

export async function nap(ten) {
  if (nho.has(ten)) return nho.get(ten);
  const buf = await sharp(tim(ten))
    .resize({ width: 1280, withoutEnlargement: true })
    .jpeg({ quality: 76, mozjpeg: true })
    .toBuffer();
  const uri = 'data:image/jpeg;base64,' + buf.toString('base64');
  nho.set(ten, uri);
  return uri;
}
