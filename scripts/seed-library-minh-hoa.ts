/**
 * scripts/seed-library-minh-hoa.ts — SEED MINH HOẠ cho Thư viện (12/08, entry `library-data-that`).
 *
 * Tạo ~17 `LibraryAsset` gắn nhãn minh hoạ để kệ Thư viện không "giả trân" khi kho mới:
 *   · 5 preset MÔI TRƯỜNG/ánh sáng (kệ `render-preset`) — ảnh bầu trời/ngoài trời đúng ngữ cảnh
 *   · 4 vật liệu (kệ `common-atlas`) — ảnh bề mặt chất liệu
 *   · 8 nội thất/không gian (kệ `common-asset`) — ảnh nền sạch
 *
 * NGUỒN ẢNH: Unsplash — theo Unsplash License (miễn phí cho mục đích thương mại lẫn phi thương
 * mại, KHÔNG bắt buộc attribution, KHÔNG được bán lại ảnh nguyên bản/không sửa đổi như một dịch
 * vụ ảnh cạnh tranh — https://unsplash.com/license). Ở đây chỉ dùng MINH HOẠ UI nội bộ; ảnh tải
 * về `uploads/` như mọi asset thường (route `/api/library/{id}/file` phục vụ), URL gốc lưu trong
 * `caption` để truy nguồn. Mỗi URL được HEAD-verify 200 + content-type image/* TRƯỚC khi ghi.
 *
 * NHẬN DIỆN MINH HOẠ (gỡ được bằng MỘT lệnh):
 *   · tên có hậu tố  " · minh hoạ"
 *   · tags chứa      "demo,minh-hoa,unsplash" (+ shelf:<kệ> + thumb:<loại> — xem db-items.ts)
 *   Gỡ:  node_modules/.bin/sucrase-node scripts/seed-library-minh-hoa.ts --undo
 *
 * Chạy:  node_modules/.bin/sucrase-node scripts/seed-library-minh-hoa.ts
 * (backup DB trước bằng: sqlite3 prisma/dev.db ".backup 'prisma/dev.db.bak-seed-lib'")
 */

import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import path from 'path';
import { buildGalleryTag, type GalleryIndustry } from '../lib/library/gallery-tags';

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'prisma', 'dev.db');
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = `file:${DB_PATH}`;
const UPLOAD_DIR = path.join(ROOT, 'uploads');

const prisma = new PrismaClient();

interface SeedItem {
  key: string; // tên file trong uploads/ (ổn định → chạy lại không nhân đôi)
  name: string;
  photo: string; // id ảnh Unsplash (photo-…), đã xem bằng mắt đúng ngữ cảnh 12/08
  usage: 'ref-render' | 'material' | 'furniture';
  category: string;
  shelf: 'render-preset' | 'common-atlas' | 'common-asset';
  thumb: string; // ThumbKind — db-items.ts đọc tag thumb:<kind>
  code: string;
  // ── Gallery liên ngành (K · 12/08, docs/phieu-giao/gallery-lien-nganh.md VIỆC 6) ──
  /** Nhóm ngành THẬT — cả 17 ảnh của seed này đều là ảnh render/nội thất, nên đều `noi-that`.
   * KHÔNG gắn kiến trúc/cảnh quan/graphic/art cho đủ 5 nhóm — sẽ là bịa (N4); seed khác ngành thì
   * thêm sau bằng seed script riêng. */
  nganh: GalleryIndustry;
  /** Slug bộ sưu tập xu hướng (VIỆC 3) — chỉ 5 preset môi trường có, vì cùng chủ đề thật "ánh
   * sáng tự nhiên cho render". Không gắn bừa cho nhóm vật liệu/nội thất (chúng không cùng 1 xu
   * hướng thật nào). */
  bosuutap?: string;
}

/** Mỗi ảnh đã tải bản 200px về xem MẮT THƯỜNG (phiên 12/08) — không chọn mù theo từ khoá. */
const ITEMS: SeedItem[] = [
  // ── 5 preset MÔI TRƯỜNG / ánh sáng — ảnh trời đúng điều kiện sáng của preset ──
  // Cùng gắn `bosuutap:anh-sang-tu-nhien` — bộ sưu tập xu hướng ĐẦU TIÊN của Gallery, demo cho
  // cơ chế "thiếu nguồn/giấy phép thì không vào được bộ sưu tập" (VIỆC 3): cả 5 đều đủ cả hai.
  { key: 'preset-nang-trua', name: 'Nắng trưa · trời quang', photo: 'photo-1601297183305-6df142704ea2', usage: 'ref-render', category: 'Preset môi trường', shelf: 'render-preset', thumb: 'light-studio', code: 'ENV-NOON', nganh: 'noi-that', bosuutap: 'anh-sang-tu-nhien' },
  { key: 'preset-hoang-hon', name: 'Hoàng hôn mặt nước', photo: 'photo-1495616811223-4d98c6e9c869', usage: 'ref-render', category: 'Preset môi trường', shelf: 'render-preset', thumb: 'light-gold', code: 'ENV-SUNSET', nganh: 'noi-that', bosuutap: 'anh-sang-tu-nhien' },
  { key: 'preset-gio-vang', name: 'Giờ vàng xuyên mây', photo: 'photo-1504608524841-42fe6f032b4b', usage: 'ref-render', category: 'Preset môi trường', shelf: 'render-preset', thumb: 'light-dawn', code: 'ENV-GOLDEN', nganh: 'noi-that', bosuutap: 'anh-sang-tu-nhien' },
  { key: 'preset-phu-may', name: 'Trời phủ mây', photo: 'photo-1534088568595-a066f410bcda', usage: 'ref-render', category: 'Preset môi trường', shelf: 'render-preset', thumb: 'light-overcast', code: 'ENV-OVERCAST', nganh: 'noi-that', bosuutap: 'anh-sang-tu-nhien' },
  { key: 'preset-dem-sao', name: 'Đêm đầy sao', photo: 'photo-1419242902214-272b3f66ee7a', usage: 'ref-render', category: 'Preset môi trường', shelf: 'render-preset', thumb: 'light-night', code: 'ENV-NIGHT', nganh: 'noi-that', bosuutap: 'anh-sang-tu-nhien' },

  // ── 4 vật liệu — ảnh bề mặt chất liệu (close-up) ──
  { key: 'mat-son-xam', name: 'Sơn hiệu ứng xám khói', photo: 'photo-1620812097331-ff636155488f', usage: 'material', category: 'Vật liệu/Texture', shelf: 'common-atlas', thumb: 'paint', code: 'PNT-SMOKE', nganh: 'noi-that' },
  { key: 'mat-gach-trang', name: 'Gạch men trắng ốp tường', photo: 'photo-1523413651479-597eb2da0ad6', usage: 'material', category: 'Vật liệu/Texture', shelf: 'common-atlas', thumb: 'stone', code: 'TIL-WHITE', nganh: 'noi-that' },
  { key: 'mat-da-be', name: 'Da màu be', photo: 'photo-1519972064555-542444e71b54', usage: 'material', category: 'Vật liệu/Texture', shelf: 'common-atlas', thumb: 'fabric', code: 'LTH-BEIGE', nganh: 'noi-that' },
  { key: 'mat-thep-xam', name: 'Kim loại xám xước', photo: 'photo-1516617442634-75371039cb3a', usage: 'material', category: 'Vật liệu/Texture', shelf: 'common-atlas', thumb: 'metal', code: 'MTL-GREY', nganh: 'noi-that' },

  // ── 8 nội thất / không gian — ảnh nền sạch ──
  { key: 'fur-sofa-nhung', name: 'Sofa nhung xanh rêu', photo: 'photo-1555041469-a586c61ea9bc', usage: 'furniture', category: 'Ref nội thất', shelf: 'common-asset', thumb: 'furniture', code: 'SOFA-VEL', nganh: 'noi-that' },
  { key: 'fur-ghe-dau', name: 'Ghế đẩu gỗ studio', photo: 'photo-1503602642458-232111445657', usage: 'furniture', category: 'Ref nội thất', shelf: 'common-asset', thumb: 'furniture', code: 'STOOL-WD', nganh: 'noi-that' },
  { key: 'fur-den-cay', name: 'Đèn cây đọc sách', photo: 'photo-1507473885765-e6ed057f782c', usage: 'furniture', category: 'Ref nội thất', shelf: 'common-asset', thumb: 'furniture', code: 'LAMP-FLR', nganh: 'noi-that' },
  { key: 'fur-ban-tron', name: 'Bàn tròn + ghế trắng', photo: 'photo-1533090481720-856c6e3c1fdc', usage: 'furniture', category: 'Ref nội thất', shelf: 'common-asset', thumb: 'furniture', code: 'TBL-RND', nganh: 'noi-that' },
  { key: 'fur-ban-lam-viec', name: 'Bàn làm việc gỗ sáng', photo: 'photo-1611269154421-4e27233ac5c7', usage: 'furniture', category: 'Ref nội thất', shelf: 'common-asset', thumb: 'furniture', code: 'DESK-OAK', nganh: 'noi-that' },
  { key: 'fur-tu-treo', name: 'Tủ treo tường gỗ sồi', photo: 'photo-1595428774223-ef52624120d2', usage: 'furniture', category: 'Ref nội thất', shelf: 'common-asset', thumb: 'furniture', code: 'CAB-OAK', nganh: 'noi-that' },
  { key: 'ref-phong-ngu', name: 'Phòng ngủ vách gỗ', photo: 'photo-1586105251261-72a756497a11', usage: 'ref-render', category: 'Ref nội thất', shelf: 'common-asset', thumb: 'sheet', code: 'REF-BED', nganh: 'noi-that' },
  { key: 'ref-phong-khach', name: 'Phòng khách ốp gỗ mở', photo: 'photo-1604014237800-1c9102c219da', usage: 'ref-render', category: 'Ref nội thất', shelf: 'common-asset', thumb: 'sheet', code: 'REF-LIV', nganh: 'noi-that' },
];

const urlOf = (photo: string) => `https://images.unsplash.com/${photo}?w=640&q=70&auto=format&fit=crop`;
const TAG_MARK = 'demo,minh-hoa,unsplash';
const NAME_SUFFIX = ' · minh hoạ';
/** Giấy phép THẬT của cả seed (đã ghi trong caption từ trước) — Unsplash License, không CC0 (hai
 * giấy phép khác điều khoản, xem `lib/library/gallery-tags.ts`). */
const GALLERY_LICENSE_TAG = buildGalleryTag('license', 'unsplash');

/** BẮT BUỘC theo phiếu: từng URL phải HEAD 200 + content-type image/* trước khi ghi vào DB. */
function verifyUrl(url: string): void {
  const out = execFileSync('curl', ['-sI', '-m', '30', '-o', '/dev/stderr', '-w', '%{http_code}\t%{content_type}', url], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const [code, ctype] = out.trim().split('\t');
  if (code !== '200' || !ctype?.startsWith('image/')) {
    throw new Error(`URL chết hoặc không phải ảnh (${code} ${ctype}): ${url}`);
  }
}

function download(url: string, dest: string): void {
  const buf = execFileSync('curl', ['-s', '-m', '60', url], { maxBuffer: 20 * 1024 * 1024 });
  if (buf.length < 1000) throw new Error(`Tải về quá nhỏ (${buf.length}B): ${url}`);
  writeFileSync(dest, buf);
}

async function undo(): Promise<void> {
  const victims = await prisma.libraryAsset.findMany({
    where: { name: { endsWith: NAME_SUFFIX }, tags: { contains: 'minh-hoa' } },
  });
  for (const v of victims) {
    const p = path.join(UPLOAD_DIR, v.path);
    if (existsSync(p)) unlinkSync(p);
  }
  const res = await prisma.libraryAsset.deleteMany({
    where: { id: { in: victims.map((v) => v.id) } },
  });
  console.log(`Đã gỡ ${res.count} asset minh hoạ (+ file trong uploads/).`);
}

async function seed(): Promise<void> {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) throw new Error('DB chưa có User nào — tạo tài khoản trước rồi chạy lại seed.');
  mkdirSync(UPLOAD_DIR, { recursive: true });

  let verified = 0;
  let created = 0;
  let skipped = 0;
  for (const it of ITEMS) {
    const url = urlOf(it.photo);
    verifyUrl(url);
    verified += 1;

    const name = `${it.name}${NAME_SUFFIX}`;
    const dup = await prisma.libraryAsset.findFirst({ where: { name, deletedAt: null } });
    if (dup) {
      skipped += 1;
      continue; // idempotent — chạy lại không nhân đôi
    }

    const filename = `minhhoa_${it.key}.jpg`;
    const dest = path.join(UPLOAD_DIR, filename);
    if (!existsSync(dest)) download(url, dest);

    // Gallery liên ngành (VIỆC 6): `nganh:`/`license:`/`nguon:` cho MỌI ảnh; `bosuutap:` chỉ khi
    // item có khai (5 preset môi trường). `nguon:` = chính URL Unsplash đã verify 200 phía trên —
    // KHÔNG bịa nguồn khác, đây là nguồn thật đã tải ảnh về.
    const galleryTags = [
      buildGalleryTag('nganh', it.nganh),
      GALLERY_LICENSE_TAG,
      buildGalleryTag('nguon', url),
      ...(it.bosuutap ? [buildGalleryTag('bosuutap', it.bosuutap)] : []),
    ].join(',');

    await prisma.libraryAsset.create({
      data: {
        userId: user.id,
        name,
        category: it.category,
        tags: `${TAG_MARK},shelf:${it.shelf},thumb:${it.thumb},code:${it.code},${galleryTags}`,
        mime: 'image/jpeg',
        path: filename,
        usage: it.usage,
        caption: `Ảnh minh hoạ · Unsplash License · nguồn: ${url}`,
        lastEditedBy: user.id,
      },
    });
    created += 1;
    console.log(`  + ${name}  [${it.shelf}]`);
  }
  console.log(`\nURL verify 200 image/*: ${verified}/${ITEMS.length} · tạo mới: ${created} · đã có (bỏ qua): ${skipped}`);

  const perShelf = await prisma.libraryAsset.groupBy({
    by: ['category'],
    where: { tags: { contains: 'minh-hoa' }, deletedAt: null },
    _count: true,
  });
  console.log('Đang có trong kho (minh hoạ):', perShelf.map((r) => `${r.category}=${r._count}`).join(' · '));
}

async function main() {
  try {
    if (process.argv.includes('--undo')) await undo();
    else await seed();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('SEED FAIL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
