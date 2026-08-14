/**
 * scripts/proof-ghe-3d-library.ts — PROOF: lưu "Ghế bar Lincoln 327" vào Thư viện THẬT (DB),
 * phiếu `docs/phieu-giao/ghe-3d-window-app.md` việc 1.
 *
 * Chạy 1 lần, KHÔNG phải route API mới — script server-side này KHÔNG có cookie phiên, nên gọi
 * THẲNG cùng logic mà `app/api/library/route.ts` POST làm (sniff MIME thật bằng magic bytes +
 * ghi `./uploads` + `prisma.libraryAsset.create`), thay vì bịa auth qua HTTP. Idempotent — chạy
 * lại không nhân đôi (khớp theo `name`, cùng khuôn `seed-library-minh-hoa.ts`).
 *
 * LƯU Ý QUAN TRỌNG (ghi rõ để không ai tưởng nhầm): trường `dataUrl` của route POST CHỈ nhận ẢNH
 * RASTER thật (`sniffKind` whitelist PNG/JPEG/WEBP/GIF/AVIF, xem `lib/server/mime-sniff.ts`) — vì
 * đây là ẢNH XEM TRƯỚC lưu vào `LibraryAsset.path`/`url`, KHÔNG PHẢI nơi chứa mesh GLB/OBJ (mesh
 * 1.6MB cũng vượt xa trần 20.000 ký tự của cột `content`). Model 3D thật nằm ở
 * `public/library-assets/lincoln-327/` (đã copy từ scratchpad phiên CN — xem báo cáo), phục vụ
 * qua URL tĩnh Next.js; `Object3DWindow`/`Object3DToggle` (components/library/) đọc đường dẫn đó
 * qua props, KHÔNG qua bản ghi DB này. Bản ghi DB chỉ mang ẢNH + THÔNG SỐ (.idfc) — đúng vai trò
 * "thẻ trong Thư viện", không phải kho file nhị phân.
 *
 * Chạy:  node_modules/.bin/sucrase-node scripts/proof-ghe-3d-library.ts
 * Gỡ:    node_modules/.bin/sucrase-node scripts/proof-ghe-3d-library.ts --undo
 */

import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import path from 'path';
import { sniffKind, isRasterImageKind, SNIFFED_MIME } from '../lib/server/mime-sniff';

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'prisma', 'dev.db');
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = `file:${DB_PATH}`;
const UPLOAD_DIR = path.join(ROOT, 'uploads');

const prisma = new PrismaClient();

const NAME = 'Ghế bar Lincoln 327 · AI-sinh';
// Thumbnail = ảnh THẬT (studio, nguồn mezzocollection.com — provenance đầy đủ trong .idfc dưới),
// KHÔNG phải render máy — đúng nhất cho việc "nhận ra món này" khi lướt kệ.
const THUMB_SRC = path.join('/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/b779779b-76b3-4e9c-ba44-69dbf50c46a5/scratchpad', 'lincoln-01.jpg');
const IDFC_SRC = path.join('/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/b779779b-76b3-4e9c-ba44-69dbf50c46a5/scratchpad', 'lincoln-327.idfc');
const THUMB_W = 1000;
const THUMB_H = 1000;
// shelf:common-asset — "Ảnh & tài sản" (usage 'ref-render' đi mặc định về kệ này, xem
// lib/library/db-items.ts shelfOfAsset); thumb:furniture — icon+fallback đúng loại (khác usage
// 'material' mới tự suy ra 'furniture', usage 'ref-render' thì không). code: mã hiển thị ổn định.
const TAGS = 'ghe-bar,lincoln-327,ai-sinh,shelf:common-asset,thumb:furniture,code:LIN-327';
const CAPTION = 'Ghế bar Lincoln 327 (Mezzo Collection) · mesh AI-sinh (fal:trellis, ước-hình) + hình học chuẩn-nét (chuanNet, thuần hình học) · kích thước hãng verified, vật liệu/kiểu dáng inferred — xem .idfc đính kèm cho từng cờ.';

async function undo(): Promise<void> {
  const victims = await prisma.libraryAsset.findMany({ where: { name: NAME } });
  for (const v of victims) {
    const p = path.join(UPLOAD_DIR, v.path);
    if (existsSync(p)) unlinkSync(p);
  }
  const res = await prisma.libraryAsset.deleteMany({ where: { id: { in: victims.map((v) => v.id) } } });
  console.log(`Đã gỡ ${res.count} bản ghi "${NAME}" (+ file ảnh trong uploads/).`);
}

async function run(): Promise<void> {
  if (!existsSync(THUMB_SRC)) throw new Error(`Không thấy ảnh nguồn: ${THUMB_SRC}`);
  if (!existsSync(IDFC_SRC)) throw new Error(`Không thấy .idfc nguồn: ${IDFC_SRC}`);

  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) throw new Error('DB chưa có User nào — tạo tài khoản trước rồi chạy lại.');

  const dup = await prisma.libraryAsset.findFirst({ where: { name: NAME, deletedAt: null } });
  if (dup) {
    console.log(`Đã có sẵn "${NAME}" — id=${dup.id} (idempotent, không tạo lại).`);
    return;
  }

  // ── Sniff MIME bằng MAGIC BYTES thật (§6.2, y hệt route POST) — KHÔNG tin đuôi file. ──
  const buf = readFileSync(THUMB_SRC);
  const kind = sniffKind(buf);
  if (!kind || !isRasterImageKind(kind)) {
    throw new Error(`Ảnh nguồn không phải raster hợp lệ (kind=${kind ?? 'null'}) — Thư viện chỉ nhận PNG/JPEG/WEBP/GIF/AVIF.`);
  }
  const mime = SNIFFED_MIME[kind];
  const ext = mime.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'bin';

  mkdirSync(UPLOAD_DIR, { recursive: true });
  const filename = `ghe3d_lincoln327.${ext}`;
  const dest = path.join(UPLOAD_DIR, filename);
  if (!existsSync(dest)) writeFileSync(dest, buf);

  const idfcJson = readFileSync(IDFC_SRC, 'utf8');
  JSON.parse(idfcJson); // fail sớm nếu .idfc hỏng — không ghi rác vào content
  if (idfcJson.length > 20000) throw new Error(`.idfc (${idfcJson.length} ký tự) vượt trần cột content (20.000) — cắt bớt trước khi ghi.`);

  const asset = await prisma.libraryAsset.create({
    data: {
      userId: user.id,
      name: NAME,
      category: 'furniture',
      tags: TAGS,
      mime,
      path: filename,
      usage: 'ref-render',
      caption: CAPTION,
      content: idfcJson,
      w: THUMB_W,
      h: THUMB_H,
      lastEditedBy: user.id,
    },
  });
  console.log(`Đã tạo LibraryAsset id=${asset.id}`);
  console.log(`  category=${asset.category}  usage=${asset.usage}  tags=${asset.tags}`);
  console.log(`  file ảnh: uploads/${filename} (${buf.length} bytes, ${mime})`);
  console.log(`  content: ${idfcJson.length} ký tự .idfc (kho .idfc thật, round-trip importIdfc đã kiểm ở phiên GI)`);
  console.log('  URL asset: /api/library/' + asset.id + '/file');
}

async function main() {
  try {
    if (process.argv.includes('--undo')) await undo();
    else await run();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('PROOF FAIL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
