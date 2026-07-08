// electron/main.js
// ─────────────────────────────────────────────────────────────────────────────
// Tiến trình chính của Electron cho InteriorFlow.
//
// InteriorFlow KHÔNG phải web tĩnh: nó có API routes (app/api/**) + Prisma/SQLite
// nên bắt buộc phải có một Next.js server Node chạy nền. Luồng khởi động:
//   1. Chuẩn bị thư mục GHI ĐƯỢC trong userData (DB SQLite + thư mục uploads).
//   2. (Chỉ khi đóng gói) Chạy `prisma migrate deploy` để tạo/nâng cấp dev.db lần đầu.
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

// ── Chạy prisma migrate deploy lần đầu để tạo schema vào dev.db (chỉ khi đóng gói) ──
// Lúc dev ta đã có sẵn prisma/dev.db + `npx prisma migrate dev`, nên bỏ qua.
function runMigrations(appRoot, env) {
  return new Promise((resolve) => {
    // Prisma CLI có sẵn trong node_modules được đóng gói.
    const prismaBin = path.join(
      appRoot,
      'node_modules',
      'prisma',
      'build',
      'index.js'
    );
    if (!fs.existsSync(prismaBin)) {
      // Không tìm thấy CLI -> bỏ qua migrate, server vẫn chạy (DB có thể đã tồn tại).
      console.warn('[migrate] Không thấy Prisma CLI, bỏ qua migrate deploy.');
      resolve();
      return;
    }
    const child = spawn(process.execPath, [prismaBin, 'migrate', 'deploy'], {
      cwd: appRoot, // chạy ở appRoot để thấy prisma/schema.prisma + prisma/migrations
      env: {
        ...env,
        // ELECTRON_RUN_AS_NODE: chạy binary electron như Node thuần để exec Prisma CLI.
        ELECTRON_RUN_AS_NODE: '1',
      },
      stdio: 'ignore',
      windowsHide: true,
    });
    child.on('exit', () => resolve()); // dù thành/bại đều tiếp tục; server sẽ báo lỗi rõ hơn nếu DB hỏng
    child.on('error', () => resolve());
  });
}

// ── Spawn Next.js production server ───────────────────────────────────────────
async function startNextServer() {
  const appRoot = getAppRoot();
  const { userDataDir, dbUrl } = prepareWritablePaths();
  resolvedPort = await findFreePort(PREFERRED_PORT);

  // Env truyền cho server: production + DB trỏ userData + cổng đã dò.
  const serverEnv = {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE_URL: dbUrl, // ghi đè file:./dev.db bằng path tuyệt đối trong userData
    PORT: String(resolvedPort),
    // 0.0.0.0: server phục vụ cả LAN → điện thoại/máy khác trong mạng trỏ vào máy này được
    // (dùng làm "hub" cho Oppo). Cửa sổ app vẫn load qua 127.0.0.1 (cục bộ).
    HOSTNAME: '0.0.0.0',
    ELECTRON_RUN_AS_NODE: '1', // để dùng binary electron như node chạy next start
    // ── Gắn secret/key cố định trước khi build (xem README-electron.md mục 5) ──
    // Bỏ comment và điền giá trị nếu muốn nhúng sẵn vào bản .exe nội bộ:
    // AUTH_SECRET: 'chuoi-bi-mat-co-dinh-cua-team',
    // FAL_KEY: 'fal-key-neu-muon-gan-san',
  };

  if (isPackaged) {
    // Lần đầu: tạo/nâng cấp schema vào <userData>/dev.db.
    await runMigrations(appRoot, serverEnv);
  }

  // Đường tới CLI `next` trong node_modules đóng gói.
  const nextBin = path.join(appRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

  // QUAN TRỌNG: cwd = userDataDir (ghi được) để process.cwd()/uploads là nơi ghi được;
  // truyền appRoot làm tham số để `next start <appRoot>` đọc `.next` đúng chỗ đóng gói.
  serverProcess = spawn(
    process.execPath,
    [nextBin, 'start', appRoot, '-p', String(resolvedPort), '-H', '0.0.0.0'],
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
      submenu: [isMac ? { role: 'close' } : { role: 'quit', label: 'Thoát' }],
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

    // OTA: kiểm bản mới trên GitHub Releases rồi tải + cài ngầm (chỉ bản đóng gói).
    // Bản mới sẽ được cài ở lần thoát/mở app kế tiếp. Lỗi mạng -> bỏ qua im lặng.
    if (autoUpdater && isPackaged) {
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
