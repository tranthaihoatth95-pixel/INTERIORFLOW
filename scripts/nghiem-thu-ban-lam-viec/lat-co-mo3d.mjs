/**
 * scripts/nghiem-thu-ban-lam-viec/lat-co-mo3d.mjs — LẬT con trỏ khối 3D của một asset, để phép đo
 * "hòn đảo đã nối lại" có ĐỐI CHỨNG thay vì chỉ có một con số.
 *
 * Vì sao lật thẳng trong CSDL chứ không qua API: `app/api/library/[id]` chỉ có `DELETE` — không có
 * đường sửa tag. Lật ở tầng dữ liệu là đúng chỗ: thứ đang kiểm là *"tấm Thư viện đọc con trỏ từ
 * DỮ LIỆU hay từ bảng TÊN gõ cứng"*, nên phải đổi đúng dữ liệu đó.
 *
 * 🔴 `datasources` truyền TƯỜNG MINH — trong worktree `node_modules` là symlink, Prisma trần sẽ nạp
 * `.env` theo đường THẬT của module và ghi nhầm sang CSDL repo gốc (bài học `mk-user-worktree.mjs`).
 *
 * Chạy: DATABASE_URL="file:$(pwd)/prisma/dev.db" node …/lat-co-mo3d.mjs <assetId> go|cam
 */
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Thiếu DATABASE_URL — phải trỏ tường minh vào prisma/dev.db của worktree.');
const [, , assetId, viec] = process.argv;
if (!assetId || (viec !== 'go' && viec !== 'cam')) {
  console.error('Dùng: lat-co-mo3d.mjs <assetId> go|cam');
  process.exit(2);
}

const p = new PrismaClient({ datasources: { db: { url } } });
const a = await p.libraryAsset.findUnique({ where: { id: assetId }, select: { tags: true } });
if (!a) { console.error('không thấy asset', assetId); process.exit(2); }

const the = a.tags.split(',').map((t) => t.trim()).filter(Boolean);
let ra;
if (viec === 'go') {
  // giữ nguyên giá trị trong một tag TẠM để cắm lại đúng byte cũ — không tái tạo bằng trí nhớ
  ra = the.map((t) => (t.startsWith('mo3d:') ? `tam-${t}` : t));
} else {
  ra = the.map((t) => (t.startsWith('tam-mo3d:') ? t.slice(4) : t));
}
await p.libraryAsset.update({ where: { id: assetId }, data: { tags: ra.join(',') } });
console.log(viec === 'go' ? 'ĐÃ GỠ' : 'ĐÃ CẮM LẠI', '→', ra.join(','));
await p.$disconnect();
