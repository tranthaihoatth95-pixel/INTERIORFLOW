#!/usr/bin/env node
/**
 * scripts/nghiem-thu-ban-lam-viec/moat-co-mat-tien-chua.mjs
 *
 * HỎI ĐÚNG MỘT CÂU mà `nghiem-thu-g4-moat.mjs` chưa hỏi:
 *   **"Hàm moat này có MẶT TIỀN nào không, và mặt tiền đó có thật sự đổi kết quả không?"**
 *
 * ⛔ VÌ SAO CẦN — ca thật, năm lần trong một ngày: `resolveIdfcCommerceToSpec` dựng 04/09 đủ thứ
 * tự ưu tiên, đủ cờ `ben`, đủ 8 ca test — và `grep` toàn `app/`+`components/`+`lib/` trả **0 nơi
 * gọi ngoài chính test của nó**. Cổng moat vẫn XANH, vì nó đo *hàm chạy đúng không*, không đo
 * *có ai gọi hàm không*. Đúng nấc "dây có, chưa cắm điện".
 *
 * ⚠️ KHÔNG ĐO HÌNH DẠNG — ĐO HÀNH VI. Mắt cũ của cổng này từng hỏi `hasOwnProperty` trên object
 * do CHÍNH bộ đo vừa dựng ⇒ xanh mà 0 dòng mã sản phẩm đổi (`docs/bao-cao-phien/2026-09-04-dong-
 * mat-d2.md`). Nên mỗi mục ở đây gồm HAI vế, và vế ② mới là vế quyết định:
 *   ① MẶT TIỀN — đếm nơi gọi trong MÃ SẢN PHẨM (bỏ test, bỏ chính tệp khai, **bỏ chú thích**).
 *   ② HÀNH VI  — chạy đúng hàm mà mặt tiền gọi, trên HAI THẾ GIỚI khác nhau, và đòi nó trả
 *      HAI KẾT QUẢ khác nhau. Cùng kết quả ⇒ hàm không thật sự tham gia quyết định ⇒ ĐỎ.
 *      (Đây là chỗ chống "xanh giả": một hàm bị gọi mà kết quả không đổi gì thì cũng như không.)
 *
 * ⚠️ Tệp này **không ghi vào `scripts/nghiem-thu-g4-moat.mjs`** — lane khác đang giữ tệp đó.
 * Khi nào hợp nhất được thì chuyển thẳng bảng `MUC` sang đó, phần logic không phải viết lại.
 *
 * Chạy: node scripts/nghiem-thu-ban-lam-viec/moat-co-mat-tien-chua.mjs [--json]
 * Mã thoát: 0 = mọi mục có mặt tiền THẬT · 1 = có mục moat treo (hoặc phép đo thoái hoá).
 */
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOC = path.resolve(__dirname, '..', '..');
const require = createRequire(path.join(GOC, 'noop.cjs'));
require('sucrase/register/ts');

const JSON_RA = process.argv.includes('--json');

/* ── quét mã sản phẩm: bỏ test, bỏ chú thích, bỏ chính tệp khai hàm ───────────────────────── */
const VUNG = ['app', 'components', 'lib'];
const LA_MA = (f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f);

function motTep(dir, ra = []) {
  for (const t of readdirSync(dir)) {
    const p = path.join(dir, t);
    if (statSync(p).isDirectory()) motTep(p, ra);
    else if (LA_MA(t)) ra.push(p);
  }
  return ra;
}

/** Bỏ chú thích khối và chú thích dòng — tên hàm nằm trong docstring KHÔNG phải nơi gọi.
 *  (Ca thật: `lib/cad/idfc.ts:219` nhắc tên hàm trong docstring; đếm nó là báo quá tay.) */
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

function matTien(ten, tepKhai) {
  const ra = [];
  for (const vung of VUNG) {
    const goc = path.join(GOC, vung);
    let tep = [];
    try { tep = motTep(goc); } catch { continue; }
    for (const p of tep) {
      const tuongDoi = path.relative(GOC, p);
      if (tepKhai.some((k) => tuongDoi === k)) continue; // chính tệp khai hàm: không tính
      const noiDung = boChuThich(readFileSync(p, 'utf8'));
      if (new RegExp(`\\b${ten}\\b`).test(noiDung)) ra.push(tuongDoi);
    }
  }
  return ra;
}

/* ── các mục moat cần soi ─────────────────────────────────────────────────────────────────── */
const MUC = [
  {
    id: 'noi-idfc-ve-kho',
    ten: 'resolveIdfcCommerceToSpec',
    tepKhai: ['lib/materials/warehouse/catalog-link.ts'],
    /** Người dùng trải nghiệm nó ở đâu — khai tường minh để báo cáo đọc được. */
    mo_ta: 'Cột thông số ④ tấm Thư viện: cấu kiện .idfc nối về hàng nào, nối chắc hay mỏng',
    /**
     * HAI THẾ GIỚI khác nhau ĐÚNG MỘT ĐIỂM: kho có / không có món đó. Chạy qua ĐÚNG hàm mà
     * mặt tiền gọi (`noiIdfcVeKho`, `lib/library/idfc-noi-kho.ts`) — không mô phỏng.
     */
    hanhVi() {
      const { noiIdfcVeKho } = require(path.join(GOC, 'lib/library/idfc-noi-kho.ts'));
      const body = { type: 'component', geom2d: { group: 'x', w: 1, h: 1, prims: [] } };
      const commerce = { specId: 'ps-x', sku: 'SKU-X', priceVnd: 111, unit: 'cái' };
      const kho = [{ id: 'ps-x', name: 'Món trong kho', matId: null, sku: 'SKU-KHAC', unit: 'bộ', priceVnd: 999 }];

      const coKho = noiIdfcVeKho(body, commerce, kho);
      const khongKho = noiIdfcVeKho(body, commerce, []);
      return {
        A: { nhan: 'kho CÓ món (nối bằng khoá bất biến)', kieu: coKho.trangThai?.kieu, gia: coKho.nguon?.priceVnd },
        B: { nhan: 'kho KHÔNG có món', kieu: khongKho.trangThai?.kieu, gia: khongKho.nguon?.priceVnd },
        /* Vế quyết định: phải khác nhau ở CẢ trạng thái LẪN con số hiện ra. Chỉ khác trạng thái
           mà giá vẫn là số của tệp thì nghĩa là kho không hề tham gia — moat vẫn treo. */
        khac: coKho.trangThai?.kieu !== khongKho.trangThai?.kieu && coKho.nguon?.priceVnd !== khongKho.nguon?.priceVnd,
        chiTiet: `A: ${coKho.trangThai?.kieu}/${coKho.nguon?.priceVnd} ↔ B: ${khongKho.trangThai?.kieu}/${khongKho.nguon?.priceVnd}`,
      };
    },
  },
];

/* ── chạy ─────────────────────────────────────────────────────────────────────────────────── */
const ketQua = [];
let dut = 0;

for (const m of MUC) {
  const noiGoi = matTien(m.ten, m.tepKhai);
  const hv = m.hanhVi();
  const datMatTien = noiGoi.length > 0;
  const datHanhVi = hv.khac === true;
  if (!datMatTien || !datHanhVi) dut++;
  ketQua.push({ id: m.id, ten: m.ten, moTa: m.mo_ta, noiGoi, datMatTien, datHanhVi, hanhVi: hv });

  if (!JSON_RA) {
    console.log(`\n■ ${m.ten}`);
    console.log(`  mặt tiền: ${m.mo_ta}`);
    console.log(`  ${datMatTien ? 'ok  ' : 'ĐỨT '}- có ${noiGoi.length} nơi gọi trong mã sản phẩm${noiGoi.length ? ` → ${noiGoi.join(' · ')}` : ' (0 — moat treo, dây chưa cắm điện)'}`);
    console.log(`  ${datHanhVi ? 'ok  ' : 'ĐỨT '}- hai thế giới ra hai kết quả · ${hv.chiTiet}`);
    if (!datHanhVi) console.log('        ⇒ hàm CÓ bị gọi nhưng KHÔNG đổi kết quả — xanh giả, đo lại chỗ cắm.');
  }
}

if (JSON_RA) console.log(JSON.stringify({ dut, muc: ketQua }, null, 2));
else console.log(`\n${MUC.length - dut}/${MUC.length} mục moat CÓ mặt tiền thật · ${dut} đứt`);

process.exit(dut ? 1 : 0);
