#!/usr/bin/env node
/**
 * soi-giay-phep-phat-hanh.mjs — CỔNG GIẤY PHÉP CHO BỘ CÀI (28/08).
 *
 * VÌ SAO CÓ FILE NÀY, thay vì chỉ bỏ `--excludePackages` trong `license:check`:
 * `license:check` nằm TRONG `npm test`. Bỏ dòng loại trừ ⇒ `npm test` đỏ vĩnh viễn cho MỌI
 * lane, kể cả lane không đụng gì tới DWG. Một cổng luôn đỏ là một cổng người ta học cách
 * bỏ qua — chữa bằng vá ca thì đẻ ra thói quen xấu (luật 7).
 *
 * ⇒ Tách làm hai mức, không giấu gì cả:
 *   · `npm test`            → gọi file này ở mức CẢNH BÁO: in đỏ, exit 0. Không ai không thấy.
 *   · trước khi ĐÓNG GÓI    → gọi với `--chan`: exit 1 nếu gói GPL còn nằm trong artifact.
 *
 * ĐIỀU NÓ ĐO THẬT (không đọc tài liệu, đọc đĩa):
 *   ① Gói GPL có trong `dependencies` production không.
 *   ② Thư mục gói có THẬT trên đĩa không (`node_modules/**` đi theo `build.files`).
 *   ③ File WASM có trong `public/` không (đi theo bộ cài kể cả khi cờ nhập DWG tắt).
 * Cờ `NEXT_PUBLIC_IF_DWG_IMPORT` TẮT **không** gỡ được ba thứ trên — tắt nút không phải là
 * gỡ gói. Đây chính là điểm dễ nhầm nhất, nên máy phải nói ra.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const GOI_GPL = ['@mlightcad/libredwg-web'];
const chan = process.argv.includes('--chan');
const goc = process.cwd();

/** CA 0 · CỔNG HARNESS — không có package.json thì mọi kết luận đều vô nghĩa. */
const pkgPath = join(goc, 'package.json');
if (!existsSync(pkgPath)) {
  console.error('CỔNG HARNESS ĐỎ — không thấy package.json tại', goc);
  process.exit(1);
}
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
if (!pkg.dependencies) {
  console.error('CỔNG HARNESS ĐỎ — package.json không có khối `dependencies`.');
  process.exit(1);
}

function kichThuoc(dir) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    n += e.isDirectory() ? kichThuoc(p) : statSync(p).size;
  }
  return n;
}

/* 🔴 SỬA 29/08 — CỔNG CŨ ĐO SAI CHỖ, và cái sai đó suýt biến nó thành cổng chết.
 * Bản cũ hỏi "gói GPL có nằm trong CÂY NGUỒN không". Nhưng cây nguồn thì LUÔN có nó —
 * `npm test` và `npm run dev` cần. Nên sau khi loại trừ khỏi bộ cài, cổng vẫn đỏ vĩnh viễn,
 * tức thành "cổng ai cũng học cách bỏ qua" — đúng thứ chú thích đầu tệp này cảnh báo.
 * Câu hỏi ĐÚNG là: "gói GPL có ĐI VÀO BỘ CÀI không." Trả lời bằng hai nguồn:
 *   ① `build.files` có dòng loại trừ nó không (đọc ý định đóng gói)
 *   ② nếu đã có `dist-installer/`, quét ARTIFACT THẬT — bằng chứng mạnh hơn ý định.
 */
const loaiTru = (pkg.build?.files ?? []).filter((x) => typeof x === 'string' && x.startsWith('!'));
const daLoaiTru = (duongTuongDoi) =>
  loaiTru.some((m) => {
    const tienTo = m.slice(1).split('*')[0];      // phần cố định trước ký tự đại diện đầu tiên
    // ⚠️ Mẫu bắt đầu bằng `**` cho tiền tố RỖNG, mà `startsWith('')` luôn đúng ⇒ mọi thứ
    // trông như đã được loại trừ. Ca đột biến 29/08 bắt được đúng lỗi này ở bản đầu: gỡ dòng
    // loại trừ @mlightcad đi mà cổng vẫn xanh, vì `!**/node_modules/.cache/**` khớp bừa.
    if (tienTo.length < 2) return false;
    return duongTuongDoi.startsWith(tienTo);
  });

const phat = [];
for (const ten of GOI_GPL) {
  const khaiBao = pkg.dependencies?.[ten];
  const duong = join(goc, 'node_modules', ten);
  const coTrenDia = existsSync(duong);
  if (daLoaiTru(`node_modules/${ten}`)) continue;      // đã loại khỏi bộ cài ⇒ không phát hành
  if (khaiBao || coTrenDia) {
    phat.push({
      ten,
      khaiBao: khaiBao ?? null,
      coTrenDia,
      mb: coTrenDia ? (kichThuoc(duong) / 1024 / 1024).toFixed(1) : null,
    });
  }
}

const wasm = [];
const pubWasm = join(goc, 'public', 'wasm');
if (existsSync(pubWasm)) {
  for (const f of readdirSync(pubWasm)) {
    if (/libredwg/i.test(f) && !daLoaiTru(`public/wasm/${f}`)) {
      wasm.push({ f, mb: (statSync(join(pubWasm, f)).size / 1024 / 1024).toFixed(1) });
    }
  }
}

/* ② BẰNG CHỨNG MẠNH NHẤT — quét artifact thật nếu đã đóng gói. Ý định trong build.files có
 * thể đúng mà electron-builder vẫn nhét vào (phụ thuộc bắc cầu, asarUnpack…). Cái nằm trên
 * đĩa mới là cái giao cho người dùng. */
/* 🔴 SỬA 29/08 (lượt 2) — CỔNG NÀY VỪA BỊ BẮT QUẢ TANG NÓI DỐI.
 * Phép thử: dựng thật từ HEAD 913ac61 (`next build` + `electron-builder --mac --dir`) rồi chạy
 * `node scripts/soi-giay-phep-phat-hanh.mjs --chan` → in "✅ không thấy gói/WASM GPL", exit 0.
 * Trong khi trên đĩa, cùng lúc đó:
 *   · dist-installer/mac-arm64/InteriorFlow.app/.../app/.next/static/media/libredwg-web.*.wasm
 *     — 9,4 MB, sha256 TRÙNG KHỚP public/wasm/libredwg-web.wasm, và nằm ĐÚNG HAI BẢN.
 *   · .next/server/chunks/6995.js — TOÀN BỘ glue Emscripten của libredwg-web đã minify.
 * Hai lỗ, độc lập nhau, cả hai đều đủ để cho GPL lọt qua:
 *   ① TRẦN ĐỘ SÂU `sau > 6`. Đường thật sâu 8 (mac-arm64/InteriorFlow.app/Contents/Resources/
 *      app/.next/static/media/…) ⇒ vòng quét quay đầu TRƯỚC khi tới nơi có hàng. Cổng không
 *      "không thấy gì" — nó chưa từng đi tới chỗ có gì để thấy.
 *   ② CHỈ SOI TÊN TỆP. `6995.js` mang trọn mã GPL mà tên thì vô tội; không mẫu tên nào bắt được.
 * ⇒ Bỏ trần độ sâu, và soi RUỘT tệp mã.
 *
 * ⚠️ Dấu vết phải PHÂN BIỆT ĐƯỢC "mã GPL đi kèm" với "chữ nhắc tên GPL". Trang
 * `/settings/licenses` là trang GHI CÔNG bắt buộc của chính GPL — nó CHỨA chuỗi
 * "@mlightcad/libredwg-web" và "public/wasm/libredwg-web.wasm" dưới dạng VĂN XUÔI. Bắt bừa theo
 * chữ "libredwg" ⇒ cổng đỏ vĩnh viễn kể cả khi đã gỡ sạch mã, tức đẻ đúng "cổng ai cũng học cách
 * bỏ qua" mà đầu tệp này cảnh báo. Nên hai dấu vết dưới đây được chọn vì chúng CHỈ xuất hiện
 * trong mã đã bundle, và đo được là 0 lần trên trang ghi công. */
const DAU_VET_MA_GPL = [
  '@mlightcad/libredwg-web/wasm', // đường dẫn module hardcode trong glue Emscripten đã bundle
  'static/media/libredwg-web',    // tham chiếu asset WASM do webpack phát ra
];
const DUOI_MA = new Set(['.js', '.mjs', '.cjs', '.html', '.json', '.css', '.txt']);
const TRAN_DOC = 64 * 1024 * 1024; // tệp lớn hơn mức này không phải mã nguồn — bỏ, khỏi ngốn RAM

const trongGoi = [];
for (const thuMuc of ['dist-installer', 'dist']) {
  const d = join(goc, thuMuc);
  if (!existsSync(d)) continue;
  const quet = (dir) => {
    let muc;
    try { muc = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of muc) {
      const p = join(dir, e.name);
      if (e.isSymbolicLink()) continue;           // .app đầy symlink vòng — đi vào là treo
      if (e.isDirectory()) { quet(p); continue; } // KHÔNG còn trần độ sâu (xem lỗ ① ở trên)
      if (!e.isFile()) continue;
      const tuongDoi = p.slice(goc.length + 1);
      if (/libredwg|mlightcad/i.test(e.name)) {
        trongGoi.push({ duong: tuongDoi, vi: 'tên tệp' });
        continue;
      }
      if (!DUOI_MA.has(extname(e.name).toLowerCase())) continue;
      let noi;
      try {
        if (statSync(p).size > TRAN_DOC) continue;
        noi = readFileSync(p, 'latin1');          // latin1: so khớp theo BYTE, khỏi giải mã UTF-8
      } catch { continue; }
      const dau = DAU_VET_MA_GPL.find((m) => noi.includes(m));
      if (dau) trongGoi.push({ duong: tuongDoi, vi: `ruột tệp mang dấu vết "${dau}"` });
    }
  };
  quet(d);
}

if (!phat.length && !wasm.length && !trongGoi.length) {
  console.log('✅ CỔNG GIẤY PHÉP PHÁT HÀNH — không thấy gói/WASM GPL trong artifact.');
  process.exit(0);
}

const nhan = chan ? '⛔ CHẶN' : '🟥 CẢNH BÁO';
console.log(`\n${nhan} · CỔNG GIẤY PHÉP PHÁT HÀNH`);
console.log('  Bộ cài IF hiện VẪN mang mã GPL-3.0. Tắt cờ nhập DWG KHÔNG gỡ được nó.');
for (const p of phat) {
  console.log(`  · ${p.ten} — dependencies: ${p.khaiBao ?? '(không khai)'} · trên đĩa: ${p.coTrenDia ? `có, ${p.mb} MB` : 'không'}`);
}
for (const w of wasm) console.log(`  · public/wasm/${w.f} — ${w.mb} MB`);
for (const t of trongGoi) console.log(`  · 🔥 NẰM TRONG ARTIFACT ĐÃ ĐÓNG GÓI (${t.vi}): ${t.duong}`);
console.log('  GPL tính việc GIAO BẢN SAO, không tính có thu tiền — pilot miễn phí KHÔNG được miễn.');
console.log('  Phải gỡ khỏi artifact (hoặc có lời giải giấy phép) TRƯỚC khi giao bộ cài cho bất kỳ ai.');
console.log('  Xem: lib/cad/dwg-flag.ts · docs/LICENSE-NOTES.md · docs/RESEARCH-DWG-LICENSE.md\n');

process.exit(chan ? 1 : 0);
