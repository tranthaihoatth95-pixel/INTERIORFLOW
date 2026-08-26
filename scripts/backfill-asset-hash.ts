/**
 * scripts/backfill-asset-hash.ts — ĐIỀN `LibraryAsset.contentHash` cho kho đã có, và XUẤT BẢN
 * KIỂM KÊ. Cột này mới có 20/08 (cửa duyệt 01) ⇒ 1.622 hàng cũ đều `null`; cửa dedupe ở
 * `promote.ts` chỉ nhận ra trùng khi CẢ HAI bên có hash, nên không backfill thì dedupe gần như
 * không bao giờ bắt được gì.
 *
 * ⛔ CHỈ ĐỌC · TÍNH · ĐIỀN. Script này KHÔNG xoá bản ghi nào, KHÔNG gộp bản ghi nào, KHÔNG đụng
 *   tệp trên đĩa. Nhóm trùng chỉ được **BÁO CÁO** — gộp hai vật là quyết định nghiệp vụ (mỗi vật
 *   có nguồn gốc và `ProjectAssetUsage` riêng), không phải việc của một script dọn dẹp.
 *
 * ⭐ TỆP CHẾT TRÊN ĐĨA LÀ SẢN PHẨM CHÍNH, KHÔNG PHẢI LỖI PHỤ. Bản ghi còn mà tệp mất thì hash để
 *   `null` — và **chính danh sách null sau lượt chạy này LÀ bản kiểm kê tệp chết** (đúng ý đồ đã
 *   ghi ở `prisma/schema.prisma:322-331`). Vì thế script phân biệt rạch ròi hai loại null:
 *   *chưa chạy tới* và *chạy rồi nhưng tệp không còn*.
 *
 * Dùng lại, không viết mới: `bamContentHash` (cùng hàm của `ProjectFile`) qua cửa trích chung
 * `lib/server/asset-metadata.ts`. Không có hàm băm thứ hai trong repo.
 *
 * Chạy:
 *   node_modules/.bin/sucrase-node scripts/backfill-asset-hash.ts          # THỬ (không ghi gì)
 *   node_modules/.bin/sucrase-node scripts/backfill-asset-hash.ts --ghi    # ghi thật
 *   … --sieu-du-lieu   # điền thêm w/h/palette cho hàng đang 0×0 (chậm hơn: giải mã ảnh)
 */
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';
import { trichSieuDuLieu, UPLOAD_DIR } from '../lib/server/asset-metadata';
import { bamContentHash } from '../app/api/project-files/_lib/luu-file';

const prisma = new PrismaClient();
const GHI = process.argv.includes('--ghi');
const SIEU = process.argv.includes('--sieu-du-lieu');

interface ThongKe {
  tong: number;
  daCoHash: number;
  hashMoi: number;
  tepChet: number;
  sieuDuLieuMoi: number;
  con0x0: number;
}

async function main() {
  const assets = await prisma.libraryAsset.findMany({
    where: { deletedAt: null },
    select: { id: true, userId: true, name: true, path: true, contentHash: true, w: true, h: true, tags: true },
    orderBy: { createdAt: 'asc' },
  });

  const tk: ThongKe = { tong: assets.length, daCoHash: 0, hashMoi: 0, tepChet: 0, sieuDuLieuMoi: 0, con0x0: 0 };
  const chet: { id: string; name: string; path: string }[] = [];
  /** `userId|hash|license` → danh sách asset. Khoá GIỐNG HỆT khoá dedupe của `promote.ts` —
   *  báo cáo phải đếm đúng thứ cửa nhập coi là trùng, không phải một định nghĩa trùng khác. */
  const nhom = new Map<string, { id: string; name: string }[]>();

  for (const a of assets) {
    let hash = a.contentHash;

    if (!hash || (SIEU && (!a.w || !a.h))) {
      let buf: Buffer | null = null;
      try {
        buf = await readFile(path.join(UPLOAD_DIR, a.path));
      } catch {
        tk.tepChet++;
        chet.push({ id: a.id, name: a.name, path: a.path });
        continue; // hash để NULL — đây chính là bản kiểm kê tệp chết
      }

      if (SIEU) {
        const meta = await trichSieuDuLieu(buf, hash);
        hash = meta.contentHash;
        const canGhi = !a.contentHash || ((!a.w || !a.h) && meta.w > 0);
        if (canGhi && GHI) {
          await prisma.libraryAsset.update({
            where: { id: a.id },
            data: {
              contentHash: meta.contentHash,
              ...(!a.w || !a.h ? { w: meta.w, h: meta.h } : {}),
              ...(meta.palette.length ? { palette: JSON.stringify(meta.palette.slice(0, 8)) } : {}),
            },
          });
        }
        if (!a.contentHash) tk.hashMoi++;
        if ((!a.w || !a.h) && meta.w > 0) tk.sieuDuLieuMoi++;
      } else {
        // Đường NHANH: chỉ băm, không giải mã ảnh. Đây là việc phiếu yêu cầu.
        hash = bamContentHash(buf);
        if (GHI) await prisma.libraryAsset.update({ where: { id: a.id }, data: { contentHash: hash } });
        tk.hashMoi++;
      }
    } else {
      tk.daCoHash++;
    }

    if (!a.w || !a.h) tk.con0x0++;

    if (hash) {
      const license = (a.tags || '').split(',').map((t) => t.trim().toLowerCase())
        .find((t) => t.startsWith('license:')) ?? 'license:(chưa khai)';
      const khoa = `${a.userId}|${hash}|${license}`;
      const ds = nhom.get(khoa) ?? [];
      ds.push({ id: a.id, name: a.name });
      nhom.set(khoa, ds);
    }
  }

  const nhomTrung = [...nhom.entries()].filter(([, ds]) => ds.length > 1);
  const soHangThua = nhomTrung.reduce((s, [, ds]) => s + ds.length - 1, 0);

  /* ══════════════════ BÁO CÁO KIỂM KÊ ══════════════════ */
  console.log(`\n${GHI ? '✍  GHI THẬT' : '👁  CHẠY THỬ — không ghi gì (thêm --ghi để ghi)'}${SIEU ? ' · kèm siêu dữ liệu' : ' · chỉ hash'}`);
  console.log('─'.repeat(72));
  console.log(`Tổng asset còn sống          : ${tk.tong}`);
  console.log(`  · đã có hash từ trước      : ${tk.daCoHash}`);
  console.log(`  · hash ${GHI ? 'ĐÃ ĐIỀN' : 'sẽ điền'}            : ${tk.hashMoi}`);
  console.log(`  · TỆP CHẾT trên đĩa        : ${tk.tepChet}  ← hash để NULL, đây là bản kiểm kê`);
  if (SIEU) console.log(`  · w/h/palette ${GHI ? 'đã điền' : 'sẽ điền'}     : ${tk.sieuDuLieuMoi}`);
  console.log(`  · còn 0×0 sau lượt này     : ${SIEU ? tk.con0x0 - tk.sieuDuLieuMoi : tk.con0x0}${SIEU ? '' : '  (chạy --sieu-du-lieu để điền)'}`);
  console.log(`NHÓM TRÙNG THẬT              : ${nhomTrung.length} nhóm · ${soHangThua} hàng dôi`);
  console.log('  (khoá = userId + contentHash + lớp license — ĐÚNG khoá dedupe của promote.ts)');

  if (nhomTrung.length) {
    console.log('\n10 nhóm trùng lớn nhất:');
    for (const [khoa, ds] of nhomTrung.sort((a, b) => b[1].length - a[1].length).slice(0, 10)) {
      const [, h, lic] = khoa.split('|');
      console.log(`  ×${ds.length}  ${lic.padEnd(18)} ${h.slice(0, 12)}…  "${ds[0].name.slice(0, 46)}"`);
    }
    console.log('  ⛔ KHÔNG gộp tự động — mỗi hàng có nguồn gốc + usage riêng. Gộp là quyết định nghiệp vụ.');
  }

  if (chet.length) {
    console.log(`\n${chet.length} bản ghi TRỎ VÀO TỆP KHÔNG CÒN (10 dòng đầu):`);
    for (const c of chet.slice(0, 10)) console.log(`  ${c.id}  ${c.path.padEnd(28)} "${c.name.slice(0, 40)}"`);
    console.log('  ⛔ KHÔNG xoá — xoá bản ghi là mất luôn nguồn gốc và where-used. Cần một quyết định riêng.');
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
