// electron/main.js
// ─────────────────────────────────────────────────────────────────────────────
// Tiến trình chính của Electron cho InteriorFlow.
//
// InteriorFlow KHÔNG phải web tĩnh: nó có API routes (app/api/**) + Prisma/SQLite
// nên bắt buộc phải có một Next.js server Node chạy nền. Luồng khởi động:
//   1. Chuẩn bị thư mục GHI ĐƯỢC trong userData (DB SQLite + thư mục uploads).
//   2. (Chỉ khi đóng gói) Chạy `prisma db push` để kiểm tra/nâng cấp dev.db; lỗi thì dừng.
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
const isPackaged = app.isPackaged;

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

function loadUserConfig(userDataDir) {
  configJsonPath = path.join(userDataDir, 'config.json');
  let cfg = {};
  if (fs.existsSync(configJsonPath)) {
    try {
      cfg = JSON.parse(fs.readFileSync(configJsonPath, 'utf8'));
    } catch (e) {
      dialog.showErrorBox(
        'InteriorFlow — config.json lỗi',
        `File cấu hình ${configJsonPath} không phải JSON hợp lệ:\n${e.message}\n\nApp vẫn chạy nhưng bỏ qua cấu hình này.`
      );
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
  if (!cfg.AUTH_SECRET || typeof cfg.AUTH_SECRET !== 'string' || cfg.AUTH_SECRET.trim() === '') {
    cfg.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
  }
  try {
    fs.writeFileSync(configJsonPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  } catch {
    /* ổ đĩa read-only? — vẫn chạy tiếp với cfg trong RAM */
  }
  // Chỉ nhặt các key hợp lệ, giá trị chuỗi khác rỗng.
  const env = {};
  for (const k of CONFIG_KEYS) {
    if (typeof cfg[k] === 'string' && cfg[k].trim() !== '') env[k] = cfg[k].trim();
  }
  return env;
}

// ── Đồng bộ schema vào dev.db bằng `prisma db push` ──────────────────────────
// Dùng `db push --skip-generate` thay vì `migrate deploy` vì repo quản lý schema
// bằng db push (prisma/migrations ĐÃ CŨ hơn schema.prisma — deploy sẽ tạo schema
// thiếu bảng). db push idempotent: lần đầu tạo đủ bảng, các lần sau chỉ diff.
function spawnDbPush(appRoot, env, userDataDir, extraArgs) {
  return new Promise((resolve) => {
    // Prisma CLI có sẵn trong node_modules được đóng gói.
    const prismaBin = path.join(appRoot, 'node_modules', 'prisma', 'build', 'index.js');
    if (!fs.existsSync(prismaBin)) {
      resolve({ ok: false, missing: true });
      return;
    }
    // Log ra userData để debug được khi máy user lỗi (không có console).
    let logFd = null;
    try {
      logFd = fs.openSync(path.join(userDataDir, 'db-push.log'), 'a');
    } catch {
      /* không ghi được log — vẫn chạy */
    }
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (logFd !== null) {
        try { fs.closeSync(logFd); } catch { /* bỏ qua */ }
        logFd = null;
      }
      resolve(result);
    };
    const child = spawn(
      process.execPath,
      [
        prismaBin, 'db', 'push', '--skip-generate',
        '--schema', path.join(appRoot, 'prisma', 'schema.prisma'),
        ...extraArgs,
      ],
      {
        cwd: appRoot,
        env: {
          ...env,
          // ELECTRON_RUN_AS_NODE: chạy binary electron như Node thuần để exec Prisma CLI.
          ELECTRON_RUN_AS_NODE: '1',
        },
        stdio: logFd !== null ? ['ignore', logFd, logFd] : 'ignore',
        windowsHide: true,
      }
    );
    child.on('exit', (code, signal) => finish({ ok: code === 0, code, signal }));
    child.on('error', (err) => finish({ ok: false, spawnError: err }));
  });
}

// Sao lưu dev.db (kèm -wal/-journal/-shm) TRƯỚC khi thử nâng cấp có rủi ro.
// Gọi lúc server CHƯA chạy nên DB đang đóng ⇒ copy tệp là an toàn.
function backupDbBeforeRisky(userDataDir) {
  const src = path.join(userDataDir, 'dev.db');
  if (!fs.existsSync(src)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(userDataDir, `dev.db.backup-${stamp}`);
  fs.copyFileSync(src, dest);
  for (const suffix of ['-wal', '-journal', '-shm']) {
    if (fs.existsSync(src + suffix)) {
      try { fs.copyFileSync(src + suffix, dest + suffix); } catch { /* phụ trợ — bỏ qua */ }
    }
  }
  return dest;
}

// Hai nấc, CỐ Ý:
//   1. `db push` thường — đủ cho gần hết trường hợp (tạo mới / diff không rủi ro).
//   2. Nếu nấc 1 hỏng: Prisma thường từ chối vì CẢNH BÁO có thể mất dữ liệu (ví dụ
//      thêm ràng buộc UNIQUE lên cột đã có). Lúc đó SAO LƯU dev.db rồi thử LẠI
//      ĐÚNG MỘT LẦN với --accept-data-loss.
// Vì sao KHÔNG đặt --accept-data-loss ngay từ đầu: cờ đó tắt lưới an toàn cho MỌI
// thay đổi schema về sau, kể cả thay đổi xoá thật. Chỉ dùng khi đã có bản sao.
async function runDbPush(appRoot, env, userDataDir) {
  const first = await spawnDbPush(appRoot, env, userDataDir, []);
  if (first.ok) return;
  if (first.missing) {
    throw new Error('Không tìm thấy Prisma CLI để kiểm tra dữ liệu. Hãy cài lại InteriorFlow.');
  }
  if (first.spawnError) {
    throw new Error(`Không chạy được Prisma: ${first.spawnError.message}`);
  }

  let backupPath = null;
  try {
    backupPath = backupDbBeforeRisky(userDataDir);
  } catch (err) {
    throw new Error(
      'Không nâng cấp được dữ liệu cục bộ và cũng KHÔNG sao lưu được trước khi thử lại ' +
        `(${err.message}). Dữ liệu chưa được mở để tránh ghi tiếp khi chưa an toàn.`,
    );
  }

  const second = await spawnDbPush(appRoot, env, userDataDir, ['--accept-data-loss']);
  if (second.ok) return;

  throw new Error(
    'Không thể kiểm tra/nâng cấp dữ liệu cục bộ' +
      (second.code !== null && second.code !== undefined ? ` (mã ${second.code})` : '') +
      '. Dữ liệu chưa được mở để tránh ghi tiếp khi chưa an toàn.' +
      (backupPath ? ` Bản sao trước khi thử nâng cấp: ${backupPath}.` : '') +
      ' Xem db-push.log trong thư mục dữ liệu rồi liên hệ người quản trị.',
  );
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
  await runDbPush(appRoot, serverEnv, userDataDir);
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
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
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

app.on('window-all-closed', () => {
  // Windows/Linux: đóng hết cửa sổ = thoát app (đồng thời kill server).
  if (process.platform !== 'darwin') {
    killServer();
    app.quit();
  }
});

app.on('before-quit', killServer); // chắc chắn kill server trước khi thoát
app.on('quit', killServer);


