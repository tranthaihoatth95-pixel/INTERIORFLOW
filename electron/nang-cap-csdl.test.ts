/**
 * electron/nang-cap-csdl.test.ts — M1, lane 07 · RELEASE.
 *
 * Kiểm ĐÚNG đường nâng cấp CSDL mà bản đóng gói chạy lúc khởi động
 * (`nangCapCsdl` trong electron/main.js), sau khi nó đổi từ `db push` sang `migrate deploy`.
 *
 * KHÔNG mock Prisma, KHÔNG dựng dữ liệu giả trong bộ nhớ: mọi ca tạo tệp SQLite THẬT,
 * chèn bản ghi THẬT, rồi ĐẾM bản ghi trước và sau khi nâng cấp.
 *
 * Bất biến tối cao đang được canh ở đây: KHÔNG BAO GIỜ MẤT VIỆC THIẾT KẾ.
 * Nghi ngờ ⇒ dừng và báo lỗi nhìn thấy được, tuyệt đối không im lặng ghi tiếp.
 *
 * Chạy: node_modules/.bin/sucrase-node electron/nang-cap-csdl.test.ts
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const goc = path.resolve(__dirname, '..');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { nangCapCsdl, doTrangThaiCsdl, raSoatSqlBacCau, danhSachMigration } = require(
  path.join(goc, 'electron', 'main.js'),
);

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, them = '') {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}${them ? ` (${them})` : ''}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}${them ? ` (${them})` : ''}`);
  }
}

const PRISMA_BIN = path.join(goc, 'node_modules', 'prisma', 'build', 'index.js');
const SCHEMA = path.join(goc, 'prisma', 'schema.prisma');

function prismaCli(args: string[], url: string) {
  return spawnSync(process.execPath, [PRISMA_BIN, ...args], {
    cwd: goc,
    env: { ...process.env, DATABASE_URL: url },
    encoding: 'utf8',
  });
}

function chayFileSql(url: string, sql: string, thuMuc: string) {
  const tep = path.join(thuMuc, `tam-${Date.now()}-${Math.random().toString(36).slice(2)}.sql`);
  fs.writeFileSync(tep, sql, 'utf8');
  const r = prismaCli(['db', 'execute', '--schema', SCHEMA, '--file', tep], url);
  fs.unlinkSync(tep);
  return r.status;
}

/** Đếm bằng CSDL thật: số bảng người dùng · số bản ghi User · số dòng lịch sử migration. */
async function dem(url: string) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const bang = await p.$queryRawUnsafe<{ c: number }[]>(
      "SELECT count(*) c FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite_%'",
    );
    const nguoi = await p.$queryRawUnsafe<{ c: number }[]>('SELECT count(*) c FROM "User"');
    let lichSu = -1;
    try {
      const r = await p.$queryRawUnsafe<{ c: number }[]>('SELECT count(*) c FROM _prisma_migrations');
      lichSu = Number(r[0].c);
    } catch {
      lichSu = -1; // chưa có bảng lịch sử
    }
    return { bang: Number(bang[0].c), nguoi: Number(nguoi[0].c), lichSu };
  } finally {
    await p.$disconnect();
  }
}

const SEED_USER = `
INSERT INTO "User" ("id","email","name","passwordHash","credits","isAdmin","lastSeenAt","createdAt")
VALUES ('u-m1-1','m1a@example.com','Ca Kiem 1','x',200,0,1756000000000,1756000000000),
       ('u-m1-2','m1b@example.com','Ca Kiem 2','x',200,0,1756000000000,1756000000000);
`;

/** CSDL "kiểu cũ": dựng bằng db push ⇒ có bảng nhưng KHÔNG có _prisma_migrations. */
function dungCsdlCu(thuMuc: string, tenTep: string, luiVeTruocCatchup: boolean) {
  const dbPath = path.join(thuMuc, tenTep);
  const url = `file:${dbPath}`;
  const push = prismaCli(['db', 'push', '--skip-generate', '--schema', SCHEMA], url);
  if (push.status !== 0) throw new Error(`db push dựng fixture lỗi: ${push.stderr || push.stdout}`);
  if (chayFileSql(url, SEED_USER, thuMuc) !== 0) throw new Error('chèn bản ghi fixture lỗi');
  if (luiVeTruocCatchup) {
    // Gỡ đúng phần mà migration 20260904000000_catchup_schema_drift thêm vào ⇒ CSDL TỤT SAU
    // schema, giống máy người dùng đang chạy bản app cũ hơn.
    // Chỉ mục phải gỡ TRƯỚC cột: SQLite từ chối bỏ một cột đang có chỉ mục.
    const lui = [
      'DROP TABLE "ProjectAssetUsage";',
      'DROP TABLE "ProjectFile";',
      'DROP TABLE "AssetRepresentation";',
      'DROP INDEX "ProductSpec_matId_key";',
      'DROP INDEX "LibraryAsset_userId_contentHash_idx";',
      'ALTER TABLE "ProductSpec" DROP COLUMN "matId";',
      'ALTER TABLE "LibraryAsset" DROP COLUMN "contentHash";',
    ].join('\n');
    if (chayFileSql(url, lui, thuMuc) !== 0) throw new Error('lùi fixture về trước catchup lỗi');
  }
  return { dbPath, url, env: { ...process.env, DATABASE_URL: url } };
}

// ── ⓪ Bộ rà soát SQL phá huỷ — HIỆU CHUẨN trước khi tin nó ────────────────────
// Ca BIẾT ĐẠT phải trả rỗng, ca BIẾT HỎNG phải trả cảnh báo. Bộ nào không đỏ được
// ở ca hỏng thì vô giá trị.
function kiemRaSoat() {
  ok('⓪a SQL rỗng → không cảnh báo', raSoatSqlBacCau('-- This is an empty migration.\n').length === 0);
  ok(
    '⓪b SQL thuần thêm (ADD COLUMN + CREATE TABLE) → không cảnh báo',
    raSoatSqlBacCau(
      'ALTER TABLE "ProductSpec" ADD COLUMN "matId" TEXT;\nCREATE TABLE "ProjectFile" ("id" TEXT NOT NULL PRIMARY KEY);\n',
    ).length === 0,
  );
  // Khuôn DỰNG LẠI BẢNG của Prisma cho SQLite — CÓ chép dữ liệu sang nên AN TOÀN.
  // Đây là ca dễ báo quá tay nhất: nó chứa DROP TABLE nhưng không mất dữ liệu.
  const khuonDungLai =
    'PRAGMA foreign_keys=OFF;\n' +
    'CREATE TABLE "new_User" ("id" TEXT NOT NULL PRIMARY KEY, "credits" TEXT NOT NULL DEFAULT \'200\');\n' +
    'INSERT INTO "new_User" ("id", "credits") SELECT "id", "credits" FROM "User";\n' +
    'DROP TABLE "User";\n' +
    'ALTER TABLE "new_User" RENAME TO "User";\n' +
    'PRAGMA foreign_keys=ON;\n';
  ok('⓪c khuôn dựng-lại-bảng của Prisma (có chép dữ liệu) → KHÔNG báo quá tay', raSoatSqlBacCau(khuonDungLai).length === 0);
  const xoaBang = raSoatSqlBacCau('DROP TABLE "BangLa";\n');
  ok('⓪d xoá bảng không chép lại → BÁO ĐỎ', xoaBang.length === 1 && xoaBang[0].includes('BangLa'), xoaBang.join('|'));
  const boCot = raSoatSqlBacCau('ALTER TABLE "User" DROP COLUMN "email";\n');
  ok('⓪e bỏ cột → BÁO ĐỎ', boCot.length === 1 && boCot[0].includes('User.email'), boCot.join('|'));
  ok('⓪f đọc được đủ 6 thư mục migration', danhSachMigration(goc).length === 6, String(danhSachMigration(goc).length));
}

// ── ① CSDL TRỐNG → dựng đủ bảng ───────────────────────────────────────────────
async function ca1(thuMuc: string) {
  const dbPath = path.join(thuMuc, 'ca1.db');
  const url = `file:${dbPath}`;
  const env = { ...process.env, DATABASE_URL: url };
  ok('① CSDL chưa tồn tại → trạng thái "moi"', (await doTrangThaiCsdl({ prismaBin: PRISMA_BIN, appRoot: goc, env, logFd: null }, SCHEMA, dbPath, thuMuc)) === 'moi');
  await nangCapCsdl(goc, env, thuMuc, dbPath);
  const sau = await dem(url);
  ok('① nâng cấp CSDL trống → đủ 24 bảng', sau.bang === 24, `bảng=${sau.bang}`);
  ok('① nâng cấp CSDL trống → có lịch sử 6 migration', sau.lichSu === 6, `lịch sử=${sau.lichSu}`);
}

// ── ② CSDL KIỂU CŨ CÓ DỮ LIỆU → không mất bản ghi nào ─────────────────────────
async function ca2(thuMuc: string) {
  // ②a: dựng bằng db push ở ĐÚNG schema hiện tại (ca phổ biến nhất trên máy người dùng).
  const a = dungCsdlCu(thuMuc, 'ca2a.db', false);
  const truocA = await dem(a.url);
  ok('②a CSDL cũ chưa có lịch sử migration', truocA.lichSu === -1);
  ok(
    '②a trạng thái nhận đúng là "cuDbPush"',
    (await doTrangThaiCsdl({ prismaBin: PRISMA_BIN, appRoot: goc, env: a.env, logFd: null }, SCHEMA, a.dbPath, thuMuc)) === 'cuDbPush',
  );
  await nangCapCsdl(goc, a.env, thuMuc, a.dbPath);
  const sauA = await dem(a.url);
  ok('②a SỐ BẢN GHI TRƯỚC = SAU', truocA.nguoi === sauA.nguoi && sauA.nguoi === 2, `${truocA.nguoi} → ${sauA.nguoi}`);
  ok('②a sau nâng cấp có lịch sử 6 migration', sauA.lichSu === 6, `lịch sử=${sauA.lichSu}`);
  ok('②a đủ 24 bảng', sauA.bang === 24, `bảng=${sauA.bang}`);

  // ②b: CSDL TỤT SAU schema (bản app cũ hơn) ⇒ phải bắc cầu thật rồi mới đóng mốc.
  const b = dungCsdlCu(thuMuc, 'ca2b.db', true);
  const truocB = await dem(b.url);
  ok('②b CSDL cũ tụt sau schema (thiếu 3 bảng)', truocB.bang === 21 && truocB.lichSu === -1, `bảng=${truocB.bang}`);
  await nangCapCsdl(goc, b.env, thuMuc, b.dbPath);
  const sauB = await dem(b.url);
  ok('②b SỐ BẢN GHI TRƯỚC = SAU', truocB.nguoi === sauB.nguoi && sauB.nguoi === 2, `${truocB.nguoi} → ${sauB.nguoi}`);
  ok('②b bắc cầu dựng đủ 24 bảng', sauB.bang === 24, `bảng=${truocB.bang} → ${sauB.bang}`);
  ok('②b sau nâng cấp có lịch sử 6 migration', sauB.lichSu === 6, `lịch sử=${sauB.lichSu}`);
  return b;
}

// ── ③ CHẠY LẠI TRÊN CSDL ĐÃ ĐÚNG → không đổi gì ───────────────────────────────
async function ca3(thuMuc: string, b: { dbPath: string; url: string; env: NodeJS.ProcessEnv }) {
  const truoc = await dem(b.url);
  ok(
    '③ CSDL đã có lịch sử → trạng thái "daCoLichSu"',
    (await doTrangThaiCsdl({ prismaBin: PRISMA_BIN, appRoot: goc, env: b.env, logFd: null }, SCHEMA, b.dbPath, thuMuc)) === 'daCoLichSu',
  );
  await nangCapCsdl(goc, b.env, thuMuc, b.dbPath);
  const sau = await dem(b.url);
  ok(
    '③ chạy lại → bảng · bản ghi · lịch sử KHÔNG đổi (idempotent)',
    sau.bang === truoc.bang && sau.nguoi === truoc.nguoi && sau.lichSu === truoc.lichSu,
    `${JSON.stringify(truoc)} → ${JSON.stringify(sau)}`,
  );
}

// ── ④ NÂNG CẤP GÃY GIỮA CHỪNG → bản sao lưu còn nguyên và MỞ ĐƯỢC ─────────────
async function ca4(thuMuc: string) {
  const c = dungCsdlCu(thuMuc, 'ca4.db', false);
  // CSDL có một bảng KHÔNG thuộc schema ⇒ bước đồng bộ sẽ muốn DROP nó ⇒ phải DỪNG.
  if (chayFileSql(c.url, 'CREATE TABLE "BangLa" ("id" TEXT NOT NULL PRIMARY KEY);', thuMuc) !== 0) {
    throw new Error('không dựng được fixture bảng lạ');
  }
  const truoc = await dem(c.url);
  // Bản sao an toàn — production tạo bằng snapshotBeforeUpgrade() (fs.copyFileSync) TRƯỚC bước này.
  const banSao = path.join(thuMuc, 'ca4-backup.db');
  fs.copyFileSync(c.dbPath, banSao);

  let loi: Error | null = null;
  try {
    await nangCapCsdl(goc, c.env, thuMuc, c.dbPath);
  } catch (e) {
    loi = e as Error;
  }
  ok('④ nâng cấp có nguy cơ mất dữ liệu → NÉM LỖI, không đi tiếp', loi !== null);
  ok(
    '④ thông báo lỗi nói rõ sẽ mất gì + dữ liệu chưa được mở',
    loi !== null && loi.message.includes('xoá bảng BangLa') && loi.message.includes('Dữ liệu chưa được mở'),
    loi ? loi.message.slice(0, 90) : '',
  );
  const sau = await dem(c.url);
  ok('④ CSDL gốc KHÔNG bị đụng vào', sau.bang === truoc.bang && sau.nguoi === truoc.nguoi, `${JSON.stringify(truoc)} → ${JSON.stringify(sau)}`);
  const banSaoDoc = await dem(`file:${banSao}`);
  ok('④ bản sao lưu MỞ ĐƯỢC và còn đủ bản ghi', banSaoDoc.nguoi === truoc.nguoi && banSaoDoc.bang === truoc.bang, JSON.stringify(banSaoDoc));
}

void (async () => {
  const thuMuc = fs.mkdtempSync(path.join(os.tmpdir(), 'if-m1-'));
  try {
    kiemRaSoat();
    await ca1(thuMuc);
    const b = await ca2(thuMuc);
    await ca3(thuMuc, b);
    await ca4(thuMuc);
  } finally {
    fs.rmSync(thuMuc, { recursive: true, force: true });
  }
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
