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

/* ── ⑤ RENAMED BINARY — cùng payload, đuôi khác, tên không tố cáo (T1, ca B) ───────────────
   Ca A (.wasm) và ca B (.bin) tách riêng có chủ đích: một cổng chỉ thêm '.wasm' vào allow-list
   sẽ ĐỎ ở A và XANH ở B — và ta sẽ tưởng đã vá xong. B là thứ phân biệt "thêm một đuôi" với
   "quét theo nội dung". */
{
  const dem = Buffer.alloc(2 * MB, 0x41);
  Buffer.from(DAU_VET, 'latin1').copy(dem, 900_000);
  writeFileSync(join(GOC, 'fx-doi-ten.bin'), dem);
}

/* ── ⑥ ARCHIVE — payload nằm TRONG kho nén (T5, ca C) ──────────────────────────────────────
   Đo được 30/08: `dist/InteriorFlow-0.1.0-arm64.dmg` 320,6 MB — CHÍNH LÀ bộ cài giao cho người
   dùng — chưa từng được mở ra soi. Dùng .zip làm bản đại diện chạy được ở mọi máy; cổng thật
   phải mở được cả .dmg.
   Zip "stored" (không nén) dựng bằng tay: không kéo thêm phụ thuộc, và payload nằm nguyên văn
   trong tệp nên cổng nào ĐỌC BYTE cũng thấy — nếu cổng vẫn không thấy thì đó là vì nó chưa
   enumerate, chứ không phải vì nén che mất. */
{
  const ten = Buffer.from('ben-trong.txt', 'latin1');
  const noi = Buffer.from(`payload ${DAU_VET} het`, 'latin1');
  const crc = (() => { let c = ~0; for (const b of noi) { c ^= b; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; })();
  const lfh = Buffer.alloc(30);
  lfh.writeUInt32LE(0x04034b50, 0); lfh.writeUInt16LE(20, 4); lfh.writeUInt16LE(0, 8);
  lfh.writeUInt32LE(crc, 14); lfh.writeUInt32LE(noi.length, 18); lfh.writeUInt32LE(noi.length, 22);
  lfh.writeUInt16LE(ten.length, 26);
  const cdh = Buffer.alloc(46);
  cdh.writeUInt32LE(0x02014b50, 0); cdh.writeUInt16LE(20, 4); cdh.writeUInt16LE(20, 6);
  cdh.writeUInt32LE(crc, 16); cdh.writeUInt32LE(noi.length, 20); cdh.writeUInt32LE(noi.length, 24);
  cdh.writeUInt16LE(ten.length, 28);
  const off = lfh.length + ten.length + noi.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cdh.length + ten.length, 12); eocd.writeUInt32LE(off, 16);
  writeFileSync(join(GOC, 'fx-kho.zip'), Buffer.concat([lfh, ten, noi, cdh, ten, eocd]));
}

/* ── ⑦ EXCLUDED DEPENDENCY — T4, ca D ──────────────────────────────────────────────────────
   Đúng gói mà `license:check --excludePackages` đang miễn trừ. Ca này thuộc cổng SOURCE, KHÔNG
   thuộc cổng ARTIFACT — nó tồn tại để chứng minh việc tách hai cổng (§5 packet) là cần thiết:
   cổng artifact PHẢI xanh ở đây (gói không vào bộ cài), cổng source PHẢI đỏ. */
{
  const d = join(GOC, 'fx-node_modules', '@mlightcad', 'libredwg-web');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'package.json'), JSON.stringify({ name: '@mlightcad/libredwg-web', version: '0.7.7', license: 'GPL-3.0' }, null, 1));
}

const CA = [
  ['fx-blob.wasm', 'A · allow-list bypass (T1)', 'ĐỎ'],
  ['fx-doi-ten.bin', 'B · renamed binary (T1)', 'ĐỎ theo NỘI DUNG'],
  ['fx-kho.zip', 'C · archive (T5)', 'ĐỎ sau khi mở'],
  ['fx-node_modules/@mlightcad/libredwg-web/package.json', 'D · excluded dep (T4)', 'ĐỎ ở cổng SOURCE'],
  ['fx-lon.js', 'E · trần 64MB (T3)', 'ĐỎ — nhưng DORMANT'],
  ['fx-sach.js', 'counterproof', 'XANH'],
  ['fx-sach.wasm', 'counterproof', 'XANH'],
];
const bang = CA.map(([f, ca, ky]) => {
  let s = 0;
  try { s = statSync(join(GOC, f)).size; } catch { /* thư mục con */ }
  return `  ${f.split('/').pop().padEnd(15)} ${(s / MB).toFixed(1).padStart(6)} MB  ${ca.padEnd(28)} ${ky}`;
});
console.log(`fixture tại ${GOC}\n${bang.join('\n')}`);
console.log('\n⚠️ Ca E (65MB) XANH GIẢ nếu đứng một mình: cổng chỉ sửa trần 64MB sẽ đỏ ở E mà vẫn');
console.log('   để lọt A/B/C/D. E chỉ có giá trị khi chạy CÙNG bốn ca kia.');
console.log('⚠️ Không có ca XANH thì không phân biệt được cổng thật với cổng `exit 1` vô điều kiện.');
console.log('Dọn: node scripts/quality/dung-fixture-giay-phep.mjs --don');
