/**
 * scripts/xuat-pdf-duyet-mat.mjs — XUẤT CỬA DUYỆT MẮT RA PDF (một tệp mỗi nền).
 *
 * VÌ SAO CÓ: trang duyệt bấm được chỉ sống khi có mạng và có phiên. PDF thì mở ở đâu cũng
 * được, và quan trọng hơn — **viết tay lên được**. Đó đúng là cách Hoà đã chốt từ 16/08:
 * thấy chỗ sai thì khoanh bút lên ảnh, rõ hơn mọi câu chữ.
 *
 * Hai tệp, KHÔNG phải một: nền sáng và nền tối là hai bài kiểm khác nhau, gộp vào một tệp
 * thì mắt đọc thành "cùng một màn chụp hai lần" và bỏ qua nửa sau.
 *
 * CHẠY:  node scripts/xuat-pdf-duyet-mat.mjs
 *        IF_RA_PDF=<thư mục>   đổi chỗ ghi (mặc định: thư mục tạm)
 *
 * Ảnh trong PDF là ảnh nhúng sẵn của trang ⇒ không phụ thuộc mạng, mở offline vẫn đủ hình.
 */
import { execFileSync } from 'child_process';
import { chromium } from 'playwright';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';

const RA = process.env.IF_RA_PDF ?? tmpdir();
const TRANG = join(tmpdir(), 'cua-duyet-mat.html');

/* Bản Playwright trong repo có thể lệch bản Chromium cài sẵn trên máy — dò tệp thật
   trước, chỉ để Playwright tự chọn khi không thấy. Cùng cách `chup-mock.mjs` đang làm. */
const TU_CHI = process.env.IF_TRINH_DUYET
  ?? ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => existsSync(p));

console.log('① dựng trang…');
execFileSync('node', ['scripts/dung-cua-duyet-mat.mjs'], {
  stdio: 'inherit',
  env: { ...process.env, IF_RA: TRANG },
});

const b = await chromium.launch(TU_CHI ? { executablePath: TU_CHI } : {});
for (const nen of ['sang', 'toi']) {
  const p = await b.newPage();
  await p.goto('file://' + TRANG, { waitUntil: 'load' });
  await p.emulateMedia({ media: 'print', colorScheme: nen === 'toi' ? 'dark' : 'light' });
  await p.evaluate((n) => {
    document.documentElement.setAttribute('data-anh', n);
    document.documentElement.setAttribute('data-theme', n === 'toi' ? 'dark' : 'light');
  }, nen);
  /* Ảnh là data URI nên không có lượt tải mạng nào để chờ — nhưng vẫn phải để trình duyệt
     giải mã xong, nếu không trang in ra khung trắng. Chờ THẬT sự thay vì đoán bằng timeout. */
  await p.evaluate(() => Promise.all(
    [...document.images].filter((i) => i.checkVisibility?.() !== false).map((i) => i.decode().catch(() => {})),
  ));
  const ra = join(RA, `cua-duyet-mat-nen-${nen}.pdf`);
  await p.pdf({ path: ra, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(`✅ ${ra}`);
  await p.close();
}
await b.close();
