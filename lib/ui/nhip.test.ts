/**
 * lib/ui/nhip.test.ts — canh HỢP ĐỒNG của nhịp + phép mọc-từ-nguồn.
 * Chạy: node_modules/.bin/sucrase-node lib/ui/nhip.test.ts   (khuôn nhà, xem lib/boq/compute.test.ts)
 *
 * Không test "hàm chạy không lỗi" — test những thứ MẤT ĐI thì lớp bề mặt hỏng đúng cách mà mắt
 * khó bắt: nhịp trôi khỏi khung đã chốt · CSS và TS lệch nhau · giảm-chuyển-động bị bỏ quên ·
 * gốc mọc rơi về tâm (thành "mọc từ hư không").
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BAC_BE_MAT,
  gocMocTuNguon,
  NHIP,
  nhipDong,
  nhipToiBac,
  thoiLuong,
  tiLeDong,
  type BacBeMat,
} from './nhip';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const trong = (v: number, lo: number, hi: number) => v >= lo && v <= hi;
const tangDan = (xs: number[]) => xs.every((v, i) => i === 0 || xs[i - 1] <= v);

/* ---------- THANG NHỊP ---------- */
{
  console.log('\n[1] thang nhịp');
  ok('bấm 100-160ms', trong(NHIP.bam, 100, 160));
  ok('viên 140-200ms', trong(NHIP.vien, 140, 200));
  ok('bảng 180-260ms', trong(NHIP.bang, 180, 260));
  ok('ngữ cảnh sâu 240-380ms', trong(NHIP.nguCanh, 240, 380));
  ok('biến hình 300-700ms', trong(NHIP.bienHinh, 300, 700));

  const bac = BAC_BE_MAT.filter((b): b is Exclude<BacBeMat, 'nguon'> => b !== 'nguon');
  ok('nấc sâu hơn KHÔNG được nhanh hơn nấc nông', tangDan(bac.map(nhipToiBac)));
  ok('ĐÓNG luôn nhanh hơn MỞ (vào chậm ra nhanh)',
    BAC_BE_MAT.every((b) => nhipDong(b) < nhipToiBac(b)));
}

/* ---------- CSS ↔ TS PHẢI KHỚP ----------
   Thang khai ở HAI nơi (globals.css cho transition thuần · nhip.ts cho phần phải đo DOM).
   Test này là thứ DUY NHẤT giữ chúng khớp — đọc ngược file CSS chứ không chép số, nên sửa
   một bên mà quên bên kia là đỏ ngay. */
{
  console.log('\n[2] globals.css khớp nhip.ts');
  const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
  const doc = (ten: string): number | null => {
    const m = css.match(new RegExp(`--nhip-${ten}:\\s*(\\d+)ms`));
    return m ? Number(m[1]) : null;
  };
  ok('--nhip-bam khớp', doc('bam') === NHIP.bam);
  ok('--nhip-vien khớp', doc('vien') === NHIP.vien);
  ok('--nhip-bang khớp', doc('bang') === NHIP.bang);
  ok('--nhip-ngu-canh khớp', doc('ngu-canh') === NHIP.nguCanh);
  ok('--nhip-bien-hinh khớp', doc('bien-hinh') === NHIP.bienHinh);
}

/* ---------- GIẢM CHUYỂN ĐỘNG THẮNG TUYỆT ĐỐI ---------- */
{
  console.log('\n[3] giảm chuyển động');
  ok('mọi nhịp về 0 — hiện THẲNG, không phải chậm lại',
    Object.values(NHIP).every((ms) => thoiLuong(ms, true) === 0));
  ok('không bật giảm thì giữ nguyên nhịp', thoiLuong(NHIP.bang, false) === NHIP.bang);
}

/* ---------- MỌC TỪ NGUỒN ---------- */
{
  console.log('\n[4] mọc từ nguồn');
  const beMat = { x: 100, y: 100, rong: 200, cao: 100 };

  const giua = gocMocTuNguon({ x: 190, y: 140, rong: 20, cao: 20 }, beMat);
  ok('nguồn ở giữa bề mặt ⇒ gốc là tâm', giua.originX === 50 && giua.originY === 50);

  ok('nguồn ở TRÊN ⇒ gốc lên trên (bề mặt nở XUỐNG từ nguồn)',
    gocMocTuNguon({ x: 190, y: 60, rong: 20, cao: 20 }, beMat).originY < 0);
  ok('nguồn ở BÊN TRÁI ⇒ gốc lệch trái',
    gocMocTuNguon({ x: 40, y: 140, rong: 20, cao: 20 }, beMat).originX < 0);

  const xa = gocMocTuNguon({ x: -9000, y: 9000, rong: 10, cao: 10 }, beMat);
  ok('nguồn xa tít ngoài màn vẫn bị KẸP — không quăng bề mặt bay đi',
    xa.originX >= -40 && xa.originY <= 140);

  const chuaDo = gocMocTuNguon({ x: 0, y: 0, rong: 10, cao: 10 }, { x: 0, y: 0, rong: 0, cao: 0 });
  ok('bề mặt chưa đo được (cỡ 0) ⇒ về tâm, KHÔNG chia cho 0',
    chuaDo.originX === 50 && chuaDo.originY === 50 && !Number.isNaN(chuaDo.originX));
}

/* ---------- TỈ LỆ LÚC ĐÓNG ---------- */
{
  console.log('\n[5] tỉ lệ lúc đóng');
  ok('KHÔNG co về 0 — co hết cỡ đọc ra là "biến mất", mất cảm giác thu-về-nguồn',
    BAC_BE_MAT.every((b) => tiLeDong(b) > 0.85 && tiLeDong(b) < 1));
  ok('nấc càng lớn co càng sâu (quãng đường về nguồn dài hơn)',
    tiLeDong('bangSau') < tiLeDong('bang') && tiLeDong('bang') < tiLeDong('vien'));
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
