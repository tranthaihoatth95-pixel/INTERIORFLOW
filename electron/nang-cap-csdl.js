/**
 * ═══ NÂNG CẤP CSDL CỤC BỘ — TÁCH RA MODULE RIÊNG 05/09 ═══════════════════════
 *
 * Trước 05/09 khối này nằm trong `electron/main.js`. Tách ra vì **không thử được**:
 * `main.js` gọi `ipcMain.handle` ngay lúc nạp, mà `ipcMain` chỉ tồn tại trong tiến trình
 * Electron thật ⇒ `require()` nó dưới Node là ném lỗi ⇒ đường nâng cấp dữ liệu — thứ RỦI RO
 * NHẤT trong cả bộ cài — là thứ DUY NHẤT không có cách nào chạy thử.
 *
 * ⭐ Đây không phải dọn cho gọn. Hợp đồng zero-loss nói dữ liệu thiết kế của người dùng không
 * được mất; một đường không thử được thì không giữ được lời hứa đó. Tách ra là điều kiện để
 * `electron/nang-cap-csdl.test.js` dựng ĐÚNG ca hỏng rồi chạy thật lên nó.
 *
 * Module này CỐ Ý không require 'electron'. Nó chỉ cần: node core + Prisma CLI trong bộ cài.
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// ── Đồng bộ schema vào dev.db bằng `prisma migrate deploy` ───────────────────
// LỊCH SỬ — VÌ SAO KHÔNG CÒN DÙNG `db push` (đổi 04/09):
//   Trước đó đường này chạy `db push --skip-generate`, lý do ghi ngay tại chỗ là
//   "prisma/migrations ĐÃ CŨ hơn schema.prisma — deploy sẽ tạo schema thiếu bảng".
//   Lý do đó NAY ĐÃ SAI: migration 20260904000000_catchup_schema_drift vá xong lệch;
//   `migrate diff --from-migrations → --to-schema-datamodel` trả "No difference detected"
//   và migrations dựng đủ 24/24 bảng.
//   `db push` không có lịch sử, không có đường lùi, và được phép ĐỔI/BỎ cột để ép CSDL
//   khớp schema. Chạy nó trên dữ liệu thiết kế thật, mỗi lần mở app, là rủi ro không cần
//   thiết — scripts/dung-moi-truong-kiem.sh:10-15 đã chọn `migrate deploy` cho CI đúng vì
//   lý do này ("db push CHE MẤT lệch migrations"). Máy người dùng nay đi cùng một đường.
//
// BỐN TRẠNG THÁI CSDL, bốn đường xử lý:
//   'moi'        — chưa có tệp dev.db (hoặc tệp rỗng)  → migrate deploy dựng từ đầu.
//   'daCoLichSu' — đã có bảng _prisma_migrations       → migrate deploy áp phần còn thiếu.
//   'cuDbPush'   — CÓ bảng nhưng KHÔNG có lịch sử: mọi CSDL do bản cũ dựng bằng db push.
//                  Chạy thẳng deploy lên đó sẽ gãy vì migration đầu tiên tạo lại bảng đã có.
//                  → BẮC CẦU rồi ĐÓNG MỐC: tính SQL chênh lệch giữa CSDL THẬT và schema,
//                    RÀ SOÁT câu lệnh phá huỷ, ghi SQL ra tệp đọc được, áp, rồi đánh dấu
//                    toàn bộ migration là đã áp (migrate resolve --applied).
//                  Từ lần mở kế tiếp, CSDL đó thuộc nhánh 'daCoLichSu' vĩnh viễn.
//   'lichSuLech'  — CÓ sổ, nhưng sổ ghi migration KHÔNG CÒN trong bộ cài (ca hoà nhánh 05/09)
//                  → bỏ sổ (sổ không chứa dữ liệu người dùng) rồi đi đúng đường 'cuDbPush'.
//
// BẤT BIẾN: thà DỪNG còn hơn ghi tiếp khi chưa chắc. Mọi nhánh nghi ngờ đều ném lỗi, và
// lỗi đó chặn khởi động (startNextServer) — snapshot tạo trước đó là đường lùi.

// Tên log GIỮ NGUYÊN `db-push.log` dù đường này không còn db push: bốn tài liệu ngoài
// phạm vi lane release đang trỏ đúng tên đó (README-electron.md · installers/windows/
// HUONG-DAN-CAI.md · docs/RELEASE-CHECKLIST-INTERNAL.md · docs/BAN-DO-DU-LIEU-IF-*).
// Đổi tên ở đây là làm mồ côi bốn con trỏ; phải đổi cùng lượt với bốn tệp đó.
const TEP_LOG_NANG_CAP = 'db-push.log';
const TEP_SQL_BAC_CAU = 'nang-cap-bac-cau.sql';

function ghiLogNangCap(ctx, dong) {
  if (ctx.logFd === null) return;
  try {
    fs.writeSync(ctx.logFd, `[${new Date().toISOString()}] ${dong}\n`);
  } catch {
    /* log hỏng không được làm chết lượt nâng cấp */
  }
}

function moTaLoiNangCap(viec, kq) {
  const ma = kq && kq.code !== null && kq.code !== undefined ? ` (mã ${kq.code})` : '';
  const tinHieu = kq && kq.signal ? ` (${kq.signal})` : '';
  const chiTiet = kq && kq.loi ? ` — ${kq.loi}` : '';
  return (
    `${viec}${ma}${tinHieu}${chiTiet}. ` +
    'Dữ liệu chưa được mở để tránh ghi tiếp khi chưa an toàn. ' +
    `Xem ${TEP_LOG_NANG_CAP} trong thư mục dữ liệu rồi liên hệ người quản trị.`
  );
}

// Chạy một lệnh Prisma CLI. KHÔNG ném lỗi — trả mã thoát THẬT để nơi gọi tự quyết.
function chayLenhPrisma(ctx, args, stdoutFd) {
  return new Promise((resolve) => {
    let xong = false;
    const tra = (kq) => {
      if (xong) return;
      xong = true;
      resolve(kq);
    };
    const child = spawn(process.execPath, [ctx.prismaBin, ...args], {
      cwd: ctx.appRoot,
      env: {
        ...ctx.env,
        // ELECTRON_RUN_AS_NODE: chạy binary electron như Node thuần để exec Prisma CLI.
        ELECTRON_RUN_AS_NODE: '1',
      },
      stdio: [
        'ignore',
        stdoutFd !== undefined && stdoutFd !== null ? stdoutFd : ctx.logFd !== null ? ctx.logFd : 'ignore',
        ctx.logFd !== null ? ctx.logFd : 'ignore',
      ],
      windowsHide: true,
    });
    child.on('exit', (code, signal) => tra({ code, signal }));
    child.on('error', (err) => tra({ code: null, signal: null, loi: err.message }));
  });
}

// Thứ tự áp migration = thứ tự tên thư mục (tên bắt đầu bằng dấu thời gian).
function danhSachMigration(appRoot) {
  const thuMuc = path.join(appRoot, 'prisma', 'migrations');
  return fs
    .readdirSync(thuMuc, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(thuMuc, e.name, 'migration.sql')))
    .map((e) => e.name)
    .sort();
}

// Rà soát SQL bắc cầu — CHỈ chặn thứ thật sự mất dữ liệu.
// SQLite không sửa cột tại chỗ được, nên Prisma dựng lại bảng theo khuôn:
//   CREATE TABLE "new_X" → INSERT INTO "new_X" … SELECT … FROM "X" → DROP TABLE "X" → RENAME.
// Khuôn đó CÓ chép dữ liệu sang ⇒ DROP TABLE nằm trong khuôn là an toàn.
// DROP TABLE ngoài khuôn, và mọi DROP COLUMN, đều là mất dữ liệu ⇒ dừng.
function raSoatSqlBacCau(sql) {
  const canhBao = [];
  for (const m of sql.matchAll(/ALTER\s+TABLE\s+["`']?(\w+)["`']?\s+DROP\s+COLUMN\s+["`']?(\w+)/gi)) {
    canhBao.push(`bỏ cột ${m[1]}.${m[2]}`);
  }
  for (const m of sql.matchAll(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["`']?(\w+)["`']?/gi)) {
    const bang = m[1];
    if (/^new_/i.test(bang)) continue; // bảng tạm của chính khuôn dựng lại
    const coChepLai =
      new RegExp(`INSERT\\s+INTO\\s+["\`']?new_${bang}["\`']?`, 'i').test(sql) &&
      new RegExp(`FROM\\s+["\`']?${bang}["\`']?`, 'i').test(sql);
    if (!coChepLai) canhBao.push(`xoá bảng ${bang}`);
  }
  return canhBao;
}

// Dò trạng thái bằng MỘT câu SELECT chỉ-đọc: có bảng lịch sử ⇒ mã thoát 0.
async function doTrangThaiCsdl(ctx, schemaPath, dbPath, userDataDir) {
  if (!fs.existsSync(dbPath)) return 'moi';
  let kichThuoc = 0;
  try {
    kichThuoc = fs.statSync(dbPath).size;
  } catch {
    kichThuoc = 0;
  }
  if (kichThuoc === 0) return 'moi';

  const tepDo = path.join(userDataDir, '.do-lich-su-migration.sql');
  try {
    fs.writeFileSync(tepDo, 'SELECT 1 FROM _prisma_migrations LIMIT 1;\n', 'utf8');
  } catch (e) {
    throw new Error(moTaLoiNangCap(`Không dò được trạng thái dữ liệu (${e.message})`, {}));
  }
  let coLichSu;
  try {
    const kq = await chayLenhPrisma(ctx, ['db', 'execute', '--schema', schemaPath, '--file', tepDo]);
    coLichSu = kq.code === 0;
  } finally {
    try {
      fs.unlinkSync(tepDo);
    } catch {
      /* bỏ qua */
    }
  }
  if (!coLichSu) return 'cuDbPush';

  // ⭐ TRẠNG THÁI THỨ TƯ — 'lichSuLech' (thêm 05/09, sau khi hoà hai nhánh).
  // CÓ lịch sử, nhưng lịch sử đó ghi một migration KHÔNG CÒN trong bộ cài này.
  // Ca thật đã xảy ra: bản `integration` từng phát hành mang migration
  // `20260904000000_catchup_schema_drift`; khi hoà nền, migration đó bị XOÁ vì trùng việc với
  // `20260820000000_baseline_bu_ba_bang` có sẵn từ 20/08. Máy nào đã cài bản cũ thì sổ của nó
  // ghi một cái tên mà bộ cài mới không có ⇒ `migrate deploy` đi tiếp sẽ thử TẠO LẠI bảng đã
  // tồn tại và GÃY. Người dùng không làm gì sai, và dữ liệu họ thì không được phép mất.
  //
  // Dò bằng MỘT câu chỉ-đọc, phân biệt bằng MÃ THOÁT (đường duy nhất `db execute` cho phép —
  // nó không trả kết quả SELECT về): `CASE` của SQLite lười, nên `abs(-9223372036854775808)`
  // chỉ chạy khi thật sự có hàng mồ côi, và khi chạy thì nó ném "integer overflow" ⇒ mã ≠ 0.
  const coDinh = danhSachMigration(ctx.appRoot).map((t) => `'${t.replace(/'/g, "''")}'`).join(', ');
  const tepLech = path.join(userDataDir, '.do-lich-su-lech.sql');
  try {
    fs.writeFileSync(
      tepLech,
      'SELECT CASE WHEN COUNT(*) > 0 THEN abs(-9223372036854775808) ELSE 0 END\n' +
        `FROM _prisma_migrations WHERE migration_name NOT IN (${coDinh});\n`,
      'utf8',
    );
  } catch (e) {
    throw new Error(moTaLoiNangCap(`Không dò được lệch sổ nâng cấp (${e.message})`, {}));
  }
  try {
    const kq = await chayLenhPrisma(ctx, ['db', 'execute', '--schema', schemaPath, '--file', tepLech]);
    return kq.code === 0 ? 'daCoLichSu' : 'lichSuLech';
  } finally {
    try {
      fs.unlinkSync(tepDo);
    } catch {
      /* bỏ qua */
    }
  }
}

// CSDL do bản cũ dựng bằng db push: đưa về đúng schema rồi đóng mốc lịch sử migration.
async function bacCauCsdlCu(ctx, schemaPath, dbPath, userDataDir) {
  const tepSql = path.join(userDataDir, TEP_SQL_BAC_CAU);
  let sqlFd = null;
  try {
    sqlFd = fs.openSync(tepSql, 'w');
  } catch (e) {
    throw new Error(moTaLoiNangCap(`Không ghi được tệp bắc cầu nâng cấp (${e.message})`, {}));
  }
  let kq;
  try {
    kq = await chayLenhPrisma(
      ctx,
      ['migrate', 'diff', '--from-url', `file:${dbPath}`, '--to-schema-datamodel', schemaPath, '--script'],
      sqlFd,
    );
  } finally {
    try {
      fs.closeSync(sqlFd);
    } catch {
      /* bỏ qua */
    }
  }
  if (kq.code !== 0) throw new Error(moTaLoiNangCap('Không so sánh được cấu trúc dữ liệu hiện có', kq));

  const sql = fs.readFileSync(tepSql, 'utf8');
  const khongChenhLech = sql.replace(/--[^\n]*/g, '').trim() === '';

  if (khongChenhLech) {
    ghiLogNangCap(ctx, 'bắc cầu: CSDL đã khớp schema, chỉ cần đóng mốc lịch sử');
  } else {
    const canhBao = raSoatSqlBacCau(sql);
    if (canhBao.length > 0) {
      // Nghi ngờ ⇒ DỪNG. Không bao giờ im lặng ghi tiếp lên dữ liệu thiết kế.
      throw new Error(
        `Nâng cấp dữ liệu bị dừng: bước đồng bộ cấu trúc sẽ ${canhBao.join(', ')}. ` +
          'Dữ liệu chưa được mở để tránh ghi tiếp khi chưa an toàn. ' +
          `Bản sao an toàn nằm trong thư mục backups; xem ${TEP_SQL_BAC_CAU} và ` +
          `${TEP_LOG_NANG_CAP} trong thư mục dữ liệu rồi liên hệ người quản trị.`,
      );
    }
    ghiLogNangCap(ctx, `bắc cầu: áp SQL đồng bộ cấu trúc (xem ${TEP_SQL_BAC_CAU})`);
    const ap = await chayLenhPrisma(ctx, ['db', 'execute', '--schema', schemaPath, '--file', tepSql]);
    if (ap.code !== 0) throw new Error(moTaLoiNangCap('Không áp được bước đồng bộ cấu trúc', ap));
  }

  // CSDL nay khớp schema hiện tại ⇒ đánh dấu toàn bộ migration là đã áp.
  for (const ten of danhSachMigration(ctx.appRoot)) {
    const r = await chayLenhPrisma(ctx, ['migrate', 'resolve', '--applied', ten, '--schema', schemaPath]);
    if (r.code !== 0) throw new Error(moTaLoiNangCap(`Không đóng mốc được migration ${ten}`, r));
  }
  ghiLogNangCap(ctx, 'bắc cầu: đã đóng mốc lịch sử migration');
}

// CSDL có lịch sử NHƯNG lệch với bộ migration của bộ cài này.
//
// ⭐ VÌ SAO CHỈ ~15 DÒNG: bảng `_prisma_migrations` là SỔ GHI CHÉP, **không chứa một dòng dữ liệu
// thiết kế nào**. Bỏ sổ đi rồi dựng lại sổ cho đúng là thao tác KHÔNG mất gì của người dùng. Bỏ
// xong thì ca này trở thành đúng ca `cuDbPush` (có bảng, không có sổ) — vốn đã có đường xử được
// viết và rà soát kỹ. Quy về đường cũ, KHÔNG đẻ nhánh thứ hai làm cùng một việc.
//
// Trình tự an toàn giữ nguyên của `bacCauCsdlCu`: so cấu trúc thật ↔ schema → RÀ SOÁT câu lệnh
// phá huỷ → ghi SQL ra tệp đọc được → áp → đóng mốc lại toàn bộ. Nghi ngờ ⇒ ném lỗi, và lỗi đó
// chặn khởi động; ảnh chụp dữ liệu tạo trước đó là đường lùi.
async function xoaSoLechRoiBacCau(ctx, schemaPath, dbPath, userDataDir) {
  ghiLogNangCap(ctx, 'lệch sổ: sổ migration ghi tên không có trong bộ cài này — dựng lại sổ');
  const tepBo = path.join(userDataDir, '.bo-so-lech.sql');
  try {
    fs.writeFileSync(tepBo, 'DROP TABLE IF EXISTS _prisma_migrations;\n', 'utf8');
  } catch (e) {
    throw new Error(moTaLoiNangCap(`Không dựng lại được sổ nâng cấp (${e.message})`, {}));
  }
  try {
    const kq = await chayLenhPrisma(ctx, ['db', 'execute', '--schema', schemaPath, '--file', tepBo]);
    if (kq.code !== 0) throw new Error(moTaLoiNangCap('Không dựng lại được sổ nâng cấp', kq));
  } finally {
    try {
      fs.unlinkSync(tepBo);
    } catch {
      /* bỏ qua */
    }
  }
  await bacCauCsdlCu(ctx, schemaPath, dbPath, userDataDir);
}

async function nangCapCsdl(appRoot, env, userDataDir, dbPath) {
  // Prisma CLI có sẵn trong node_modules được đóng gói. `migrate deploy` dùng CÙNG
  // schema-engine mà `db push` vẫn dùng ⇒ không cần thêm nhị phân nào vào bộ cài.
  const prismaBin = path.join(appRoot, 'node_modules', 'prisma', 'build', 'index.js');
  if (!fs.existsSync(prismaBin)) {
    throw new Error('Không tìm thấy Prisma CLI để kiểm tra dữ liệu. Hãy cài lại InteriorFlow.');
  }
  const schemaPath = path.join(appRoot, 'prisma', 'schema.prisma');

  // Log ra userData để debug được khi máy user lỗi (không có console).
  let logFd = null;
  try {
    logFd = fs.openSync(path.join(userDataDir, TEP_LOG_NANG_CAP), 'a');
  } catch {
    /* không ghi được log — vẫn chạy */
  }
  const ctx = { prismaBin, appRoot, env, logFd };

  try {
    const trangThai = await doTrangThaiCsdl(ctx, schemaPath, dbPath, userDataDir);
    ghiLogNangCap(ctx, `nâng cấp CSDL — trạng thái: ${trangThai}`);
    if (trangThai === 'lichSuLech') await xoaSoLechRoiBacCau(ctx, schemaPath, dbPath, userDataDir);
    else if (trangThai === 'cuDbPush') await bacCauCsdlCu(ctx, schemaPath, dbPath, userDataDir);

    const kq = await chayLenhPrisma(ctx, ['migrate', 'deploy', '--schema', schemaPath]);
    if (kq.code !== 0) throw new Error(moTaLoiNangCap('Không thể kiểm tra/nâng cấp dữ liệu cục bộ', kq));
    ghiLogNangCap(ctx, 'migrate deploy: đạt');
  } finally {
    if (logFd !== null) {
      try {
        fs.closeSync(logFd);
      } catch {
        /* bỏ qua */
      }
    }
  }
}
module.exports = {
  nangCapCsdl,
  doTrangThaiCsdl,
  xoaSoLechRoiBacCau,
  bacCauCsdlCu,
  raSoatSqlBacCau,
  danhSachMigration,
  TEP_LOG_NANG_CAP,
  TEP_SQL_BAC_CAU,
};
