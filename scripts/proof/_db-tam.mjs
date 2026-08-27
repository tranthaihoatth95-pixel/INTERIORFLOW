/**
 * scripts/proof/_db-tam.mjs — CƠ SỞ DỮ LIỆU TẠM cho các script chứng minh.
 *
 * ── VẤN ĐỀ ĐO ĐƯỢC (lane `IF-RELEASE-QA-001`, 27/08) ──────────────────────────────────────────
 * Bảy script proof dựng dữ liệu thật rồi tự dọn — nhưng chúng `new PrismaClient()` **không truyền
 * `datasources`**, nên lấy `DATABASE_URL` từ `.env` = `prisma/dev.db` **THẬT** (38,5 MB · 1982
 * `ProjectFile` · 1635 `LibraryAsset`). Chúng dọn **sau khi đã ghi**; đứt giữa chừng là để rác
 * trong cơ sở dữ liệu sản xuất của Hoà.
 *
 * Hệ quả nặng hơn cả rác: **ma trận proof không chạy lại được trong một phiên bình thường.** Một
 * lane read-only muốn tái xác nhận 7 kết quả cũ thì không dám chạy — và một bằng chứng không tái
 * lập được thì chỉ còn là một dòng chữ trong quá khứ.
 *
 * ── ĐO ĐƯỢC, VÀ ĐÂY LÀ CHỖ DỄ NHẦM ────────────────────────────────────────────────────────────
 * **`next dev` TÔN TRỌNG `process.env.DATABASE_URL`; Prisma CLI thì KHÔNG.**
 * Hai bộ nạp `.env` khác nhau: dotenv của Next **không** ghi đè biến đã có, còn Prisma CLI thì
 * ghi đè (đó chính là F-18). Đo bằng thực nghiệm: tạo một user CHỈ CÓ trong bản sao, spawn
 * `next dev` với `DATABASE_URL` trỏ bản sao, đúc cookie cho user đó → **200**. Nếu server đọc DB
 * thật thì `findUserById` trả `null` → 401. Sau lượt đo, DB thật vẫn `0` marker.
 * ⇒ Truyền env cho server **đủ** để cách ly; nhưng lệnh Prisma CLI thì **phải** đi qua
 * `scripts/db-target-guard.mjs`.
 *
 * ── DÙNG ──────────────────────────────────────────────────────────────────────────────────────
 *   import { moDbTam } from './_db-tam.mjs';
 *   const db = await moDbTam('ten-proof');
 *   const prisma = db.prisma;                    // đã trỏ bản sao
 *   spawn('npx', ['next','dev','-p',port], { env: { ...process.env, ...db.env } });
 *   …
 *   await db.dong();                             // đóng + xoá bản sao
 *
 * Bản sao là **tệp riêng của lượt chạy**, xoá sạch lúc đóng ⇒ không cần dọn từng bảng, và đứt
 * giữa chừng cũng không để lại gì trong DB thật.
 */

import { copyFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const REPO = process.cwd();

/** Đường DB thật theo `.env` — đọc y như Prisma đọc (bóc cặp nháy). */
export function duongDbThat() {
  const tep = path.join(REPO, '.env');
  if (!existsSync(tep)) return null;
  const dong = readFileSync(tep, 'utf8').split('\n').find((l) => l.startsWith('DATABASE_URL'));
  if (!dong) return null;
  const url = dong.slice(dong.indexOf('=') + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
  return url.startsWith('file:') ? path.resolve(REPO, url.slice(5)) : null;
}

const bam = (p) => (existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex') : null);

/**
 * Mở một bản sao DB dùng riêng cho lượt chạy này.
 * `nhan` chỉ để đặt tên thư mục tạm cho dễ nhìn khi soi.
 */
export async function moDbTam(nhan = 'proof') {
  const that = duongDbThat();
  if (!that || !existsSync(that)) {
    throw new Error(`Không tìm được DB thật theo .env (${that ?? 'null'}) — không dựng được bản sao.`);
  }
  const thuMuc = mkdtempSync(path.join(tmpdir(), `if-${nhan}-`));
  const ban = path.join(thuMuc, 'dev.db');
  // Chép cả WAL/SHM: hàng mới nhất có thể còn nằm trong WAL, chép mỗi `dev.db` là được bản THIẾU.
  for (const hau of ['', '-wal', '-shm']) {
    if (existsSync(`${that}${hau}`)) copyFileSync(`${that}${hau}`, `${ban}${hau}`);
  }

  const url = `file:${ban}`;

  /* ⚠️ ĐẶT LUÔN VÀO `process.env` — không chỉ trả về.
   *
   * Nhiều proof bundle mã sản xuất bằng esbuild rồi `require()` (ví dụ `lib/server/access.ts`).
   * Bundle đó tự dựng `PrismaClient` của riêng nó, và client ấy đọc `process.env.DATABASE_URL`
   * lúc khởi tạo. Nếu ta chỉ đưa URL cho `db.prisma` mà quên `process.env`, ta có **hai client
   * trỏ hai cơ sở dữ liệu khác nhau**: proof ghi dữ liệu vào bản sao, còn hàm sản xuất đọc DB
   * thật ⇒ mọi ca "mong THẤY" đỏ, mọi ca "không thấy" xanh.
   *
   * Đúng ca đó đã xảy ra lượt đầu chuyển `access-scope.mjs`: 4 ca đỏ, **tất cả đều là ca dương
   * tính**; toàn bộ ca âm tính xanh trên một đường ống chưa nối. Nếu nhóm ca ấy chỉ toàn kỳ vọng
   * "không thấy" thì script đã báo xanh trọn vẹn — đúng luật F-17, và đó là lý do luật ấy tồn tại. */
  process.env.DATABASE_URL = url;

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  // Chốt chặn: giữ băm DB THẬT lúc mở, đối chiếu lúc đóng. Cách ly mà không kiểm lại thì vẫn chỉ
  // là ý định — chính bài học F-18.
  const bamThatLucMo = bam(that);

  return {
    prisma,
    /** Đường tuyệt đối tới bản sao. */
    duongDan: ban,
    /** Nhét vào `env` của tiến trình con (`next dev`) để nó dùng chung bản sao. */
    env: { DATABASE_URL: url },
    duongDbThat: that,
    async dong() {
      await prisma.$disconnect().catch(() => {});
      rmSync(thuMuc, { recursive: true, force: true });
      const sau = bam(that);
      const nguyen = bamThatLucMo === sau;
      console.log(
        nguyen
          ? `  ✅ DB THẬT không đổi một byte trong cả lượt chạy (${(sau ?? '').slice(0, 16)})`
          : `  🔴 DB THẬT ĐÃ ĐỔI: ${(bamThatLucMo ?? '').slice(0, 16)} → ${(sau ?? '').slice(0, 16)} — cách ly THẤT BẠI`,
      );
      return nguyen;
    },
  };
}
