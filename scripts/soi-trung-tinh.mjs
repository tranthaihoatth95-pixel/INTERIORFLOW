#!/usr/bin/env node
/**
 * soi-trung-tinh.mjs — MỌI MẶT NỀN TRONG MỘT THEME PHẢI ÁM CÙNG MỘT HƯỚNG.
 *
 * ══ CA THẬT — Hoà báo HƠN BA LẦN, mỗi lần sửa xong lại quay về ══
 *   *"Các màn trong IF, màu nền trắng xám như màu bẩn ám lên màu trắng, mà nó cứ hết rồi lại
 *   xuất hiện."*
 *
 * Nó quay lại vì **chưa ai tìm ra gốc**, và vì **không có cổng**. Đo 30/08:
 * ```
 *   --bg     #f2f2f7   lệch kênh +5   ám xanh nhẹ
 *   --panel  #f9f9fb   lệch kênh +2   ám xanh nhẹ
 *   --card   #ffffff   lệch kênh  0   TRUNG TÍNH TUYỆT ĐỐI   ← cái lạc
 * ```
 * Trộn một trung tính **thuần** với các trung tính **đã ám màu** thì mắt lấy cái thuần làm **mốc
 * trắng**, và mọi mặt còn lại đọc thành *"xám bẩn"*. Đây là lỗi bảng màu kinh điển, **không phải
 * chuyện gu** — nên máy chấm được, không cần chờ mắt ai.
 *
 * Theme tối KHÔNG bị: `0c0c0e · 141417 · 1a1a1e` cùng ám một hướng.
 *
 * ⚠️ Vì sao tìm mãi không ra: thủ phạm **không** phải trắng đóng cứng trong mã. Đo cùng ngày có
 * **319** chỗ `#fff`/`#ffffff`/`bg-white`, nhưng thẻ dự án dùng **đúng** `var(--card)`. Sửa mã
 * thì không bao giờ hết, vì lỗi nằm ở **bảng màu**. Sửa đúng chỗ mới hết.
 *
 * ══ NÓ CANH GÌ ══
 * Trong mỗi khối theme, gom các token MẶT NỀN. Nếu **có token ám màu** (lệch kênh ≥ 2) mà lại
 * **có token thuần** (lệch kênh 0) ⇒ đỏ. Cả bảng thuần thì không sao; cả bảng ám thì không sao.
 * Sai là **trộn**.
 *
 * ⛔ CHẶN (`--chan` → exit 1).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS = path.join(REPO, 'app/globals.css');

/** Token đóng vai MẶT NỀN — thứ chiếm diện tích lớn và nằm cạnh nhau trong cùng khung hình. */
const MAT_NEN = ['bg', 'panel', 'card', 'field', 'surface-page'];

/* Bóng cũng phải cùng họ với mặt nền nó đổ lên — thêm 30/08 sau khi đo được bóng ám tím
 * MẠNH HƠN mọi mặt nền (B−R = 12 so với 2–8). Cổng bản đầu chỉ canh mặt nền nên bóng lọt qua:
 * một cổng canh thiếu một loại là một cổng im đúng chỗ cần kêu. */
const BONG = ['shadow-sheet', 'shadow-pop', 'shadow-node'];
const NGUONG_LECH_BONG = 10;

/** Lệch kênh ≥ ngưỡng này thì coi là ĐÃ ÁM MÀU. Dưới nó là trung tính thuần. */
const NGUONG_AM = 2;

const hex = (v) => {
  const m = /^#([0-9a-f]{6})$/i.exec(v.trim());
  if (!m) return null;
  const h = m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return { r, g, b, lech: Math.max(r, g, b) - Math.min(r, g, b), sang: Math.round((Math.max(r, g, b) / 255) * 100) };
};

const src = readFileSync(CSS, 'utf8');

/* Cắt theo khối `:root` / `[data-theme=…]` / `@media (prefers-color-scheme:…)`.
 * Cách thô nhưng đủ: mỗi khối bắt đầu ở một dấu mở ngoặc có chọn tử phía trước. */
const khoi = [];
const re = /(^|\n)([^\n{]*\{)/g;
let m;
while ((m = re.exec(src))) {
  const ten = m[2].replace('{', '').trim();
  if (!/:root|data-theme|prefers-color-scheme/.test(ten) && !/^\s*$/.test(ten)) continue;
  const dau = re.lastIndex;
  const cuoi = src.indexOf('\n}', dau);
  if (cuoi < 0) continue;
  khoi.push({ ten: ten.slice(0, 60), than: src.slice(dau, cuoi) });
}

const chan = process.argv.includes('--chan');
console.log('── trung tính: mặt nền trong một theme phải ám CÙNG hướng ──');

let loi = 0;
for (const k of khoi) {
  const found = [];
  for (const t of MAT_NEN) {
    const mm = new RegExp(`--${t}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(k.than);
    if (!mm) continue;
    const c = hex(mm[1]);
    if (c) found.push({ ten: t, hex: mm[1], ...c });
  }
  /* Bóng dùng rgba() nên bắt riêng, không qua hàm hex(). */
  for (const b of BONG) {
    const mb = new RegExp(`--${b}:[^;]*rgba\\(\\s*(\\d+)[,\\s]+(\\d+)[,\\s]+(\\d+)`).exec(k.than);
    if (!mb) continue;
    const [r, g, bl] = [1, 2, 3].map((i) => Number(mb[i]));
    const lech = Math.max(r, g, bl) - Math.min(r, g, bl);
    if (lech >= NGUONG_LECH_BONG) {
      loi++;
      console.log(`  🔴 ${k.ten} · --${b} rgba(${r},${g},${bl}) lệch kênh ${lech} — ÁM HƠN mọi mặt nền (bảng 2–8)`);
      console.log('       Bóng không cùng họ với mặt nó phủ lên ⇒ đọc thành "ám tím", và gắt hơn cùng alpha.');
    }
  }

  if (found.length < 2) continue;

  const am = found.filter((f) => f.lech >= NGUONG_AM);
  const thuan = found.filter((f) => f.lech === 0);

  if (am.length && thuan.length) {
    loi++;
    console.log(`  🔴 ${k.ten}`);
    for (const f of found) {
      const nhan = f.lech === 0 ? '← THUẦN, lạc khỏi bảng' : '';
      console.log(`       --${f.ten.padEnd(12)} ${f.hex}  sáng ${String(f.sang).padStart(3)}%  lệch kênh ${f.lech}  ${nhan}`);
    }
  } else {
    console.log(`  ✅ ${k.ten}  (${found.length} mặt nền, ${am.length ? 'cùng ám' : 'cùng thuần'})`);
  }
}

if (loi) {
  console.log(`\n  🔴 ${loi} theme trộn trung tính THUẦN với trung tính ĐÃ ÁM.`);
  console.log('  Mắt lấy cái thuần làm MỐC TRẮNG ⇒ mọi mặt còn lại đọc thành "xám bẩn".');
  console.log('  Chữa: kéo token thuần về cùng hướng ám với cả bảng — giữ nguyên vai sáng-tối của nó,');
  console.log('  chỉ đổi độ ám. Ví dụ đã làm: `--card` #ffffff → #fdfdff (sáng 100%, lệch kênh 2).');
  console.log('  ⛔ Đừng sửa bằng cách đổi `#fff` trong mã — đo 30/08 có 319 chỗ, mà lỗi không nằm ở đó.');
  if (chan) process.exit(1);
} else {
  console.log('\n  ✅ Không theme nào trộn trung tính thuần với trung tính đã ám.');
}
