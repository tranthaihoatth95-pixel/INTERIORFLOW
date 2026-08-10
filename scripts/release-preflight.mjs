/**
 * Kiểm tra tĩnh tối thiểu trước khi tạo bộ cài nội bộ.
 * Không thay thế smoke test trên máy sạch (xem docs/RELEASE-CHECKLIST-INTERNAL.md).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mainPath = path.join(root, 'electron', 'main.js');
const main = fs.readFileSync(mainPath, 'utf8');
const failures = [];

if (main.includes("HOSTNAME: '0.0.0.0'")) {
  failures.push('Electron server vẫn bind 0.0.0.0. Bản nội bộ phải chỉ nghe 127.0.0.1.');
}
if (main.includes("'-H', '0.0.0.0'")) {
  failures.push('Lệnh next start vẫn bind 0.0.0.0.');
}
if (!main.includes("HOSTNAME: '127.0.0.1'")) {
  failures.push('Không thấy HOSTNAME loopback trong electron/main.js.');
}
if (!main.includes("'-H', '127.0.0.1'")) {
  failures.push('Không thấy next start bind loopback trong electron/main.js.');
}
if (!main.includes('INTERIORFLOW_AUTO_UPDATE === \'1\'')) {
  failures.push('Auto-update chưa yêu cầu bật rõ ràng cho bản nội bộ.');
}
if (!main.includes('Dữ liệu chưa được mở để tránh ghi tiếp')) {
  failures.push('Lỗi đồng bộ schema chưa dừng khởi động với thông báo rõ ràng.');
}

if (failures.length) {
  console.error('Release preflight không đạt:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Release preflight đạt: loopback, migration failure gate, và update opt-in đã hiện diện.');
