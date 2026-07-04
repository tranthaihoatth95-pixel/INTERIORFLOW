// electron/preload.js
// ─────────────────────────────────────────────────────────────────────────────
// Preload tối thiểu, an toàn. Chạy với contextIsolation = true.
//
// App web InteriorFlow vốn tự chạy độc lập trong trình duyệt (mọi thứ đi qua
// API routes cùng origin), nên KHÔNG cần cầu IPC nào để hoạt động. Ở đây chỉ
// phơi ra một cờ nhận biết "đang chạy trong Electron" + phiên bản, phòng khi
// sau này UI muốn tuỳ biến (vd ẩn nút không hợp desktop). Không mở quyền Node.
// ─────────────────────────────────────────────────────────────────────────────

const { contextBridge } = require('electron');

// Chỉ expose dữ liệu tĩnh, không hàm nào chạm tới hệ thống tệp / tiến trình.
contextBridge.exposeInMainWorld('interiorflowDesktop', {
  isElectron: true,
  platform: process.platform, // 'win32' | 'darwin' | 'linux'
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
