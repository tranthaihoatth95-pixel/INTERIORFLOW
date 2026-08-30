#!/usr/bin/env node
/**
 * scripts/quality/dung-fixture-giay-phep.mjs — FIXTURE cho cổng giấy phép phát hành (bàn 07).
 *
 * Bàn 07 sở hữu tệp này. KHÔNG phải mã sản xuất — nó chỉ DỰNG BẰNG CHỨNG để 06 chứng minh cổng
 * bắt được, và để 07 phản biện trước khi merge.
 *
 * VÌ SAO SINH LÚC CHẠY, KHÔNG COMMIT: payload lớn hơn 64MB. Commit nhị phân cỡ đó vào repo là
 * đúng thứ vừa buộc phải viết lại lịch sử git ngày 30/08 (bản .dmg 337MB chặn push GitHub).
 *
 * Dùng:
 *   node scripts/quality/dung-fixture-giay-phep.mjs         # dựng vào .fixture-giay-phep/
 *   node scripts/quality/dung-fixture-giay-phep.mjs --don   # xoá
 */
import { mkdirSync, writeFileSync, rmSync, existsSync, statSync, openSync, writeSync, closeSync } from 'node:fs';
import { join } from 'node:path';

const GOC = join(process.cwd(), '.fixture-giay-phep');

/** Dấu vết GPL — CÙNG chuỗi mà cổng thật đang tìm (`soi-giay-phep-phat-hanh.mjs` DAU_VET_MA_GPL).
 *  Chép ở đây có chủ đích: fixture phải độc lập với cổng, nếu import từ cổng thì đổi cổng là
 *  fixture tự đổi theo và chẳng chứng minh được gì. */
const DAU_VET = '@mlightcad/libredwg-web/wasm';

const MB = 1024 * 1024;

if (process.argv.includes('--don')) {
  rmSync(GOC, { recursive: true, force: true });
  console.log('đã xoá', GOC);
  process.exit(0);
}

rmSync(GOC, { recursive: true, force: true });
mkdirSync(GOC, { recursive: true });

/* ── ① tệp LỚN, payload nằm SAU mốc 64MB ─────────────────────────────────────────────────
   Đây là điểm mấu chốt: đặt dấu vết ở đầu tệp thì một cổng chỉ đọc 1MB đầu cũng "bắt được",
   và ta sẽ tin nhầm là nó đọc hết. Payload phải nằm ngoài tầm với của mọi cách đọc cụt. */
{
  const p = join(GOC, 'fx-lon.js');
  const fd = openSync(p, 'w');
  const khoi = Buffer.alloc(MB, 0x20); // toàn dấu cách — không vô tình chứa dấu vết
  for (let i = 0; i < 64; i++) writeSync(fd, khoi);          // 64 MB đệm
  writeSync(fd, Buffer.from(`\n/* ${DAU_VET} */\n`, 'latin1')); // payload ở ~64,0 MB
  writeSync(fd, khoi);                                        // đệm thêm để payload không ở cuối
  closeSync(fd);
}

/* ── ② nhị phân TÊN TRUNG TÍNH mang dấu vết (mối đe doạ T1) ────────────────────────────── */
{
  const dem = Buffer.alloc(3 * MB, 0);
  const dv = Buffer.from(DAU_VET, 'latin1');
  dv.copy(dem, 1_500_000); // giữa tệp
  writeFileSync(join(GOC, 'fx-blob.wasm'), dem);
}

/* ── ③+④ COUNTERPROOF — ca hợp lệ phải VẪN XANH ─────────────────────────────────────────
   Cổng nào cũng "bắt được vi phạm" nếu nó đỏ vô điều kiện. Hai tệp sạch dưới đây là thứ phân
   biệt một cổng thật với một cổng luôn kêu. */
writeFileSync(join(GOC, 'fx-sach.js'), '/* khong co dau vet */\n'.repeat(40_000), 'latin1');
writeFileSync(join(GOC, 'fx-sach.wasm'), Buffer.alloc(2 * MB, 7));

const bang = ['fx-lon.js', 'fx-blob.wasm', 'fx-sach.js', 'fx-sach.wasm'].map((f) => {
  const s = statSync(join(GOC, f)).size;
  return `  ${f.padEnd(16)} ${(s / MB).toFixed(1).padStart(6)} MB  ${f.startsWith('fx-sach') ? 'SẠCH (phải xanh)' : 'BẨN (phải đỏ)'}`;
});
console.log(`fixture tại ${GOC}\n${bang.join('\n')}`);
console.log('\nKỳ vọng: 2 tệp BẨN bị nêu tên · 2 tệp SẠCH KHÔNG bị nêu tên.');
console.log('Dọn: node scripts/quality/dung-fixture-giay-phep.mjs --don');
