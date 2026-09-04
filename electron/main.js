// electron/main.js
// ─────────────────────────────────────────────────────────────────────────────
// Tiến trình chính của Electron cho InteriorFlow.
//
// InteriorFlow KHÔNG phải web tĩnh: nó có API routes (app/api/**) + Prisma/SQLite
// nên bắt buộc phải có một Next.js server Node chạy nền. Luồng khởi động:
//   1. Chuẩn bị thư mục GHI ĐƯỢC trong userData (DB SQLite + thư mục uploads).
//   2. Chạy `prisma migrate deploy` để kiểm tra/nâng cấp dev.db; lỗi thì dừng (xem nangCapCsdl).
//   3. Spawn Next.js production server (`next start`) trên một cổng nội bộ (dò cổng trống).
//   4. Đợi server trả lời (poll HTTP) rồi mới tạo BrowserWindow trỏ vào http://localhost:<port>.
//   5. Đóng app -> kill server. Single-instance lock để tránh mở 2 cửa sổ.
//
// Ghi chú quan trọng về đường ghi (viết chi tiết trong README-electron.md):
//   - API route lưu ảnh dùng `path.join(process.cwd(), 'uploads')`.
//   - Prisma dùng DATABASE_URL (mặc định là `file:./dev.db`, tương đối theo cwd).
//   Khi đóng gói, cwd mặc định (trong Program Files / app.asar) KHÔNG ghi được.
//   => Ta spawn `next start <appRoot>` nhưng đặt cwd = thư mục userData (ghi được):
//        · `next start <appRoot>` để Next đọc `.next` từ đúng nơi đóng gói.
//        · cwd = userData nên `process.cwd()/uploads` rơi vào userData (ghi được).
//        · DATABASE_URL trỏ tuyệt đối tới <userData>/dev.db (Prisma chấp nhận path tuyệt đối).
//   Nhờ vậy KHÔNG phải sửa bất kỳ API route nào.
// ─────────────────────────────────────────────────────────────────────────────

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
// Tự cập nhật OTA (chỉ bản đóng gói): kiểm GitHub Releases → tải + cài bản mới.
// require phòng thủ: lúc dev trên Mac chưa cài electron-updater thì bỏ qua, không crash.
let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch {
  /* electron-updater chưa có (dev) — auto-update tắt */
}
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const crypto = require('crypto');
const { spawn } = require('child_process');

// true khi chạy bản đã đóng gói (.exe cài đặt), false khi `electron .` lúc dev.
// `app` undefined khi tệp được require từ Node thuần (test) — xem chayTrongElectron cuối tệp.
const isPackaged = Boolean(app && app.isPackaged);

// Chế độ dev: `npm run electron:dev` set ELECTRON_START_URL=http://localhost:3000
// (đã có `next dev` chạy sẵn nhờ concurrently + wait-on). Khi có biến này, main
// KHÔNG tự spawn server production mà chỉ trỏ cửa sổ vào URL dev đó.
const DEV_START_URL = process.env.ELECTRON_START_URL || '';

// Cổng ưa thích; nếu bận sẽ tự dò cổng trống kế tiếp.
const PREFERRED_PORT = 3777;

// Giữ tham chiếu để không bị GC và để kill lúc thoát.
let mainWindow = null;
let serverProcess = null;
let resolvedPort = PREFERRED_PORT;

// URL cửa sổ sẽ load: dev URL nếu có, ngược lại là server production nội bộ.
function getAppUrl() {
  return DEV_START_URL || `http://127.0.0.1:${resolvedPort}/`;
}

// ── Tiện ích: dò một cổng TCP trống, bắt đầu từ `startPort` ───────────────────
function findFreePort(startPort) {
  return new Promise((resolve, reject) => {
    const tryPort = (port, attemptsLeft) => {
      const tester = net
        .createServer()
        .once('error', (err) => {
          if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
            tryPort(port + 1, attemptsLeft - 1); // cổng bận -> thử cổng kế
          } else {
            reject(err);
          }
        })
        .once('listening', () => {
          tester.close(() => resolve(port)); // trống -> trả về cổng này
        })
        .listen(port, '127.0.0.1');
    };
    tryPort(startPort, 50);
  });
}

// ── Tiện ích: poll HTTP tới server tới khi có phản hồi (server đã sẵn sàng) ────
function waitForServer(port, timeoutMs = 60_000) {
  const url = `http://127.0.0.1:${port}/`;
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const ping = () => {
      const req = http.get(url, (res) => {
        // Bất kỳ status HTTP nào cũng nghĩa là server đã đứng dậy (kể cả 200/302/404).
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Next.js server không phản hồi ở ${url} sau ${timeoutMs}ms.`));
        } else {
          setTimeout(ping, 400); // chưa lên -> thử lại sau 400ms
        }
      });
      req.setTimeout(3000, () => req.destroy());
    };
    ping();
  });
}

// ── Đường dẫn gốc app khi đã đóng gói ────────────────────────────────────────
// asar TẮT (xem package.json build.asar=false) → mã nằm ở `resources/app/`,
// main.js ở `resources/app/electron/main.js` nên __dirname/.. = resources/app
// (chứa .next, node_modules, prisma). Dùng chung cho cả dev lẫn packaged.
function getAppRoot() {
  return path.join(__dirname, '..');
}

// ── Chuẩn bị thư mục userData ghi được (DB + uploads) ─────────────────────────
// Trả về { userDataDir, dbUrl } để nhét vào env của tiến trình server.
function prepareWritablePaths() {
  const userDataDir = app.getPath('userData'); // vd Windows: %APPDATA%/InteriorFlow
  // Đảm bảo tồn tại (Electron thường tạo sẵn, nhưng cho chắc).
  fs.mkdirSync(userDataDir, { recursive: true });
  // Thư mục uploads: vì cwd của server = userDataDir nên process.cwd()/uploads
  // sẽ là <userDataDir>/uploads. Tạo trước cho gọn.
  fs.mkdirSync(path.join(userDataDir, 'uploads'), { recursive: true });

  // DB SQLite tuyệt đối trong userData. Prisma chấp nhận `file:<absolute>`.
  const dbPath = path.join(userDataDir, 'dev.db');
  // Prisma trên Windows cần path kiểu file:C:\... — dùng luôn path hệ điều hành.
  const dbUrl = `file:${dbPath}`;
  return { userDataDir, dbUrl, dbPath };
}

// ── Snapshot an toàn trước khi đổi schema ────────────────────────────────────
// `db push` không có migration history/rollback. Vì vậy khi phiên bản app thay đổi,
// giữ nguyên một bản DB + uploads trước khi Prisma chạm vào dữ liệu. Không xoá hay
// ghi đè snapshot cũ; nếu không thể tạo snapshot thì CHẶN nâng cấp thay vì liều ghi.
const RELEASE_STATE_FILE = '.interiorflow-release-state.json';
function releaseStatePath(userDataDir) {
  return path.join(userDataDir, RELEASE_STATE_FILE);
}

function readReleaseState(userDataDir) {
  try {
    return JSON.parse(fs.readFileSync(releaseStatePath(userDataDir), 'utf8'));
  } catch {
    return {};
  }
}

function writeReleaseState(userDataDir) {
  fs.writeFileSync(
    releaseStatePath(userDataDir),
    JSON.stringify({ lastStartedVersion: app.getVersion(), updatedAt: new Date().toISOString() }, null, 2) + '\n',
    'utf8',
  );
}

function snapshotBeforeUpgrade(userDataDir, dbPath) {
  if (!fs.existsSync(dbPath)) return; // first boot has no data to protect yet
  const state = readReleaseState(userDataDir);
  const currentVersion = app.getVersion();
  if (state.lastStartedVersion === currentVersion) return;

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const previous = String(state.lastStartedVersion || 'unknown');
  const snapshotDir = path.join(userDataDir, 'backups', `${stamp}-before-${previous}`);
  try {
    fs.mkdirSync(snapshotDir, { recursive: true });
    for (const suffix of ['', '-wal', '-shm']) {
      const source = `${dbPath}${suffix}`;
      if (fs.existsSync(source)) fs.copyFileSync(source, path.join(snapshotDir, `dev.db${suffix}`));
    }
    const uploads = path.join(userDataDir, 'uploads');
    if (fs.existsSync(uploads)) fs.cpSync(uploads, path.join(snapshotDir, 'uploads'), { recursive: true, errorOnExist: true });
    fs.writeFileSync(
      path.join(snapshotDir, 'snapshot.json'),
      JSON.stringify({ createdAt: new Date().toISOString(), previousVersion: previous, nextVersion: currentVersion }, null, 2) + '\n',
      'utf8',
    );
  } catch (error) {
    throw new Error(`Không tạo được bản sao an toàn trước khi nâng cấp (${error.message}). Dữ liệu chưa được mở.`);
  }
}

// ── Cấu hình người dùng: <userData>/config.json ──────────────────────────────
// KHÔNG hardcode API key vào bộ cài. Lần đầu chạy, app tự tạo config.json từ
// electron/config.example.json (AUTH_SECRET sinh ngẫu nhiên + persist để giữ
// đăng nhập qua các lần mở). User điền FAL_KEY / NVIDIA_API_KEY... vào file này
// (menu Tệp → "Mở file cấu hình…"), lưu, rồi mở lại app.
const CONFIG_KEYS = [
  'AUTH_SECRET',
  'FAL_KEY',
  'NVIDIA_API_KEY',
  'COMFYUI_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];
let configJsonPath = null; // giữ để menu "Mở file cấu hình…" dùng
// Log riêng cho cấu hình: tách khỏi log nâng cấp CSDL vì hai thứ hỏng vì lý do khác nhau,
// và người vận hành cần đọc đúng tệp khi đi tìm nguyên nhân "tự nhiên bị đăng xuất".
const TEP_LOG_CAU_HINH = 'cau-hinh.log';

function loadUserConfig(userDataDir) {
  configJsonPath = path.join(userDataDir, 'config.json');
  let cfg = {};
  if (fs.existsSync(configJsonPath)) {
    try {
      cfg = JSON.parse(fs.readFileSync(configJsonPath, 'utf8'));
    } catch (e) {
      // `dialog` chỉ tồn tại khi chạy trong Electron — guard để hàm này gọi được từ Node thuần.
      if (dialog && typeof dialog.showErrorBox === 'function') {
        dialog.showErrorBox(
          'InteriorFlow — config.json lỗi',
          `File cấu hình ${configJsonPath} không phải JSON hợp lệ:\n${e.message}\n\nApp vẫn chạy nhưng bỏ qua cấu hình này.`
        );
      }
      cfg = {};
    }
  } else {
    // Lần đầu: tạo từ file mẫu đóng gói kèm app.
    const examplePath = path.join(__dirname, 'config.example.json');
    try {
      cfg = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
    } catch {
      cfg = {};
    }
    // (giữ nguyên dòng "//" chú thích của file mẫu để user đọc hướng dẫn ngay trong config.json)
  }
  // AUTH_SECRET bắt buộc để cookie đăng nhập sống qua các lần mở app:
  // thiếu/để trống → sinh ngẫu nhiên 1 lần rồi persist.
  const vuaSinhSecret =
    !cfg.AUTH_SECRET || typeof cfg.AUTH_SECRET !== 'string' || cfg.AUTH_SECRET.trim() === '';
  if (vuaSinhSecret) {
    cfg.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
  }
  try {
    fs.writeFileSync(configJsonPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  } catch (e) {
    // GIỮ NGUYÊN đường lùi: ổ đĩa read-only thì vẫn chạy tiếp với cfg trong RAM.
    // NHƯNG KHÔNG ĐƯỢC IM LẶNG. Nếu secret VỪA được sinh mà không ghi xuống được thì
    // mỗi lần mở app lại sinh một secret khác ⇒ mọi cookie phiên cũ chết ⇒ người dùng
    // BỊ ĐĂNG XUẤT MỖI LẦN MỞ APP và không có gì trên màn nói cho họ biết vì sao.
    // (Nếu secret đọc được từ config.json sẵn có thì đăng nhập vẫn sống — chỉ là các
    //  khoá API vừa nhập sẽ không được nhớ; nhẹ hơn hẳn, nên nói khác đi.)
    const hauQua = vuaSinhSecret
      ? 'Bạn sẽ bị đăng xuất mỗi lần mở lại app, và các khoá API vừa nhập sẽ không được nhớ.'
      : 'Các thay đổi cấu hình vừa rồi sẽ không được nhớ khi mở lại app. Đăng nhập vẫn giữ.';
    const loiNhan =
      `Không ghi được file cấu hình:\n${configJsonPath}\n\n${e && e.message}\n\n` +
      `${hauQua}\n\nApp vẫn chạy bình thường. Thường do thư mục dữ liệu bị khoá hoặc ổ đĩa chỉ-đọc — ` +
      'kiểm tra quyền ghi của thư mục rồi mở lại app.';
    try {
      fs.appendFileSync(
        path.join(userDataDir, TEP_LOG_CAU_HINH),
        `[${new Date().toISOString()}] ghi config.json thất bại: ${e && e.message}` +
          ` — ${vuaSinhSecret ? 'AUTH_SECRET vừa sinh, KHÔNG persist được' : 'AUTH_SECRET cũ vẫn đọc được'}\n`,
        'utf8',
      );
    } catch {
      /* cả log cũng không ghi được — vẫn còn hộp thoại bên dưới */
    }
    if (dialog && typeof dialog.showErrorBox === 'function') {
      dialog.showErrorBox('InteriorFlow — không lưu được cấu hình', loiNhan);
    }
  }
  // Chỉ nhặt các key hợp lệ, giá trị chuỗi khác rỗng.
  const env = {};
  for (const k of CONFIG_KEYS) {
    if (typeof cfg[k] === 'string' && cfg[k].trim() !== '') env[k] = cfg[k].trim();
  }
  return env;
}

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
// BA TRẠNG THÁI CSDL, ba đường xử lý:
//   'moi'        — chưa có tệp dev.db (hoặc tệp rỗng)  → migrate deploy dựng từ đầu.
//   'daCoLichSu' — đã có bảng _prisma_migrations       → migrate deploy áp phần còn thiếu.
//   'cuDbPush'   — CÓ bảng nhưng KHÔNG có lịch sử: mọi CSDL do bản cũ dựng bằng db push.
//                  Chạy thẳng deploy lên đó sẽ gãy vì migration đầu tiên tạo lại bảng đã có.
//                  → BẮC CẦU rồi ĐÓNG MỐC: tính SQL chênh lệch giữa CSDL THẬT và schema,
//                    RÀ SOÁT câu lệnh phá huỷ, ghi SQL ra tệp đọc được, áp, rồi đánh dấu
//                    toàn bộ migration là đã áp (migrate resolve --applied).
//                  Từ lần mở kế tiếp, CSDL đó thuộc nhánh 'daCoLichSu' vĩnh viễn.
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
  try {
    const kq = await chayLenhPrisma(ctx, ['db', 'execute', '--schema', schemaPath, '--file', tepDo]);
    return kq.code === 0 ? 'daCoLichSu' : 'cuDbPush';
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
    if (trangThai === 'cuDbPush') await bacCauCsdlCu(ctx, schemaPath, dbPath, userDataDir);

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

// ── Spawn Next.js production server ───────────────────────────────────────────
async function startNextServer() {
  const appRoot = getAppRoot();
  const { userDataDir, dbUrl, dbPath } = prepareWritablePaths();
  resolvedPort = await findFreePort(PREFERRED_PORT);

  // Cấu hình user (API key, AUTH_SECRET…) đọc từ <userData>/config.json —
  // KHÔNG có key nào hardcode trong bộ cài. Xem loadUserConfig() phía trên.
  const userConfigEnv = loadUserConfig(userDataDir);

  // Env truyền cho server: production + DB trỏ userData + cổng đã dò + config user.
  const serverEnv = {
    ...process.env,
    ...userConfigEnv, // AUTH_SECRET (auto-gen persist) + FAL_KEY/NVIDIA_API_KEY… nếu user điền
    NODE_ENV: 'production',
    DATABASE_URL: dbUrl, // ghi đè file:./dev.db bằng path tuyệt đối trong userData
    PORT: String(resolvedPort),
    // Bản desktop nội bộ chỉ phục vụ chính máy đang mở app. Không bind LAN ngầm:
    // chia sẻ nhiều máy cần server có xác thực và kiến trúc đồng bộ riêng.
    HOSTNAME: '127.0.0.1',
    ELECTRON_RUN_AS_NODE: '1', // để dùng binary electron như node chạy next start
  };

  // Khi app version đổi, snapshot DB + uploads TRƯỚC. Lần đầu không cần snapshot.
  snapshotBeforeUpgrade(userDataDir, dbPath);
  // Lần đầu: tạo/nâng cấp schema vào <userData>/dev.db. Nếu bước này lỗi thì
  // DỪNG khởi động; tuyệt đối không mở app rồi ghi tiếp trên trạng thái không rõ.
  // Người vận hành phải sao lưu DB trước khi cài bản nâng cấp (checklist release).
  await nangCapCsdl(appRoot, serverEnv, userDataDir, dbPath);
  // Chỉ đánh dấu phiên bản sau khi schema pass; lần khởi động lại cùng bản không
  // tạo thêm snapshot, còn lần update tiếp theo luôn còn một đường lùi.
  writeReleaseState(userDataDir);

  // Đường tới CLI `next` trong node_modules đóng gói.
  const nextBin = path.join(appRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

  // QUAN TRỌNG: cwd = userDataDir (ghi được) để process.cwd()/uploads là nơi ghi được;
  // truyền appRoot làm tham số để `next start <appRoot>` đọc `.next` đúng chỗ đóng gói.
  serverProcess = spawn(
    process.execPath,
    [nextBin, 'start', appRoot, '-p', String(resolvedPort), '-H', '127.0.0.1'],
    {
      cwd: userDataDir,
      env: serverEnv,
      stdio: 'ignore',
      windowsHide: true,
    }
  );

  serverProcess.on('error', (err) => {
    dialog.showErrorBox('InteriorFlow', `Không khởi động được server nội bộ:\n${err.message}`);
  });

  // Đợi server sẵn sàng rồi mới trả về (BrowserWindow tạo sau đó).
  await waitForServer(resolvedPort);
}

// ── Tạo cửa sổ chính ──────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0b0b0d', // tránh flash trắng trước khi web load (app có theme tối)
    title: 'InteriorFlow',
    // Icon: dùng .ico trên Windows (electron-builder cũng nhúng icon riêng cho .exe).
    icon: path.join(__dirname, 'icons', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // cô lập context — bảo mật
      nodeIntegration: false, // web KHÔNG truy cập Node trực tiếp
      sandbox: true,
      // TẮT spellcheck: bộ kiểm chính tả của Electron nuốt sự kiện composition IME
      // → gõ tiếng Việt (Telex/dấu) bị mất dấu / nhảy chữ. Tắt là gõ tiếng Việt đúng.
      spellcheck: false,
    },
  });

  mainWindow.loadURL(getAppUrl());

  // Mở link ngoài (http/https khác host) bằng trình duyệt hệ thống, không mở trong app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Menu tối giản ─────────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Tệp',
      submenu: [
        {
          label: 'Mở file cấu hình (API key)…',
          click: () => {
            // config.json nằm trong userData; tạo sẵn ở loadUserConfig(). Nếu chưa
            // chạy server (dev mode) thì suy ra path trực tiếp.
            const p = configJsonPath || path.join(app.getPath('userData'), 'config.json');
            if (!fs.existsSync(p)) {
              try {
                fs.writeFileSync(p, '{\n}\n', 'utf8');
              } catch { /* bỏ qua */ }
            }
            shell.openPath(p); // mở bằng editor mặc định (Notepad…)
          },
        },
        {
          label: 'Mở thư mục dữ liệu (DB + uploads)',
          click: () => shell.openPath(app.getPath('userData')),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Thoát' },
      ],
    },
    {
      label: 'Chỉnh sửa',
      submenu: [
        { role: 'undo', label: 'Hoàn tác' },
        { role: 'redo', label: 'Làm lại' },
        { type: 'separator' },
        { role: 'cut', label: 'Cắt' },
        { role: 'copy', label: 'Sao chép' },
        { role: 'paste', label: 'Dán' },
        { role: 'selectAll', label: 'Chọn tất cả' },
      ],
    },
    {
      label: 'Xem',
      submenu: [
        { role: 'reload', label: 'Tải lại' },
        { role: 'forceReload', label: 'Tải lại (bỏ cache)' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom mặc định' },
        { role: 'zoomIn', label: 'Phóng to' },
        { role: 'zoomOut', label: 'Thu nhỏ' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toàn màn hình' },
        ...(isPackaged ? [] : [{ role: 'toggleDevTools', label: 'DevTools' }]),
      ],
    },
    { role: 'windowMenu', label: 'Cửa sổ' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Single-instance lock: chỉ cho 1 tiến trình app chạy ───────────────────────
// `app` chỉ tồn tại khi tệp này chạy TRONG Electron. Khi nó được require từ Node thuần
// (test đường nâng cấp CSDL), require('electron') trả về một CHUỖI đường dẫn nhị phân nên
// `app` là undefined — khi đó bỏ qua toàn bộ phần dựng app, chỉ để lộ các hàm thuần ở cuối tệp.
const chayTrongElectron = Boolean(app && typeof app.requestSingleInstanceLock === 'function');
const gotLock = chayTrongElectron ? app.requestSingleInstanceLock() : false;
if (!chayTrongElectron) {
  /* require từ Node thuần (test) — không dựng cửa sổ, không spawn server */
} else if (!gotLock) {
  app.quit(); // đã có instance khác -> thoát ngay
} else {
  // Nếu người dùng mở app lần 2, đưa cửa sổ hiện có lên trước.
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    buildMenu();
    try {
      if (DEV_START_URL) {
        // Dev: `next dev` đã chạy sẵn ở localhost:3000 -> chỉ mở cửa sổ.
        createWindow();
      } else {
        await startNextServer(); // production: dựng server nội bộ + đợi sẵn sàng
        createWindow(); // rồi mới mở cửa sổ trỏ vào server
      }
    } catch (err) {
      dialog.showErrorBox('InteriorFlow', `Khởi động thất bại:\n${err && err.message}`);
      app.quit();
    }

    // Bản nội bộ chỉ cập nhật khi người vận hành bật rõ ràng biến môi trường này.
    // Không tự tải bản từ một kho public/personal vào máy đang giữ dữ liệu dự án.
    if (autoUpdater && isPackaged && process.env.INTERIORFLOW_AUTO_UPDATE === '1') {
      try {
        autoUpdater.checkForUpdatesAndNotify();
      } catch {
        /* không có mạng / chưa có release -> chạy bình thường, không update */
      }
    }

    // macOS: click dock mở lại cửa sổ nếu đã đóng hết (server vẫn còn sống).
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

// ── Dọn dẹp: kill server khi thoát ────────────────────────────────────────────
function killServer() {
  if (serverProcess && !serverProcess.killed) {
    try {
      serverProcess.kill(); // gửi SIGTERM (Windows: terminate)
    } catch {
      /* bỏ qua */
    }
    serverProcess = null;
  }
}

if (chayTrongElectron) {
  app.on('window-all-closed', () => {
    // Windows/Linux: đóng hết cửa sổ = thoát app (đồng thời kill server).
    if (process.platform !== 'darwin') {
      killServer();
      app.quit();
    }
  });

  app.on('before-quit', killServer); // chắc chắn kill server trước khi thoát
  app.on('quit', killServer);
}

// Để lộ đúng đường nâng cấp CSDL cho test (electron/nang-cap-csdl.test.ts). Không có tác
// dụng phụ khi chạy trong Electron — main process không ai require tệp này.
module.exports = { nangCapCsdl, doTrangThaiCsdl, raSoatSqlBacCau, danhSachMigration, loadUserConfig };
