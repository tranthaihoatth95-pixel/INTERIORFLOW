#!/usr/bin/env node
/**
 * scripts/soi-mat-tu-cham.mjs — MÁY SOI CHÍNH BỘ MÁY KIỂM.
 *
 * ⛔ VÌ SAO TỒN TẠI. 04/09 tìm được một mắt trong `nghiem-thu-g4-moat.mjs` hỏi
 *   `hasOwnProperty(commerce, 'specId')` trên object mà CHÍNH bộ đo vừa dựng 12 dòng trên.
 *   `exportIdfc`/`importIdfc` là pass-through ⇒ chỉ cần bộ đo thêm `specId` vào dữ liệu mẫu
 *   của chính nó là mắt XANH, **0 dòng mã sản phẩm đổi**. Nó đứng xanh/đỏ qua nhiều lượt mà
 *   không ai thấy. Đó là loại lỗi làm hỏng niềm tin vào MỌI con số khác.
 *
 * ĐỊNH NGHĨA BỆNH (không phải "bộ đo tự dựng dữ liệu" — mọi bộ đo đều phải dựng dữ liệu):
 *
 *   Một khẳng định là TỰ CHẤM ĐIỂM khi đường đi từ chỗ DỰNG dữ liệu tới chỗ ĐỌC nó
 *   KHÔNG đi qua một hàm sản phẩm nào — tức làm nó xanh chỉ cần sửa dữ liệu mẫu
 *   trong CHÍNH bộ đo, mà `lib/` · `app/` · `components/` đứng yên.
 *
 * CÁCH ĐO (tất định, không AI, không chạy mã):
 *   ① đọc danh sách hàm nhập từ `lib/` `app/` `components/` (require/import) ⇒ tập HÀM SẢN PHẨM
 *   ② dựng bản đồ gán trong tệp: `const X = RHS`, `let X = RHS`, `X.push(RHS)`, `for (const X of RHS)`
 *   ③ với mỗi khẳng định, lấy các định danh gốc của BIỂU THỨC ĐIỀU KIỆN rồi truy ngược
 *   ④ chạm hàm sản phẩm ⇒ 🟢 ĐO HÀNH VI · chỉ chạm readFileSync/regex-trên-mã ⇒ 🟡 ĐO HÌNH DẠNG
 *      · không chạm gì ngoài literal của chính tệp ⇒ 🔴 TỰ CHẤM ĐIỂM
 *
 * ⚠️ ĐÂY LÀ HEURISTIC, KHÔNG PHẢI CHỨNG MINH. Nó bắt được đúng khuôn bệnh đã biết và
 *   là SÀN, không phải trần. Ba nguồn sai đã biết, ghi thẳng để không ai tin quá tay:
 *   · truy vết theo TÊN BIẾN trong một tệp — không hiểu phạm vi, đóng gói, hàm gọi hàm
 *   · một khẳng định chạm hàm sản phẩm vẫn có thể YẾU (hàm đó không quyết định kết quả)
 *   · 🔴 gồm cả loại LÀNH: khẳng định kiểm TIỀN ĐỀ của chính phép thử (đúng chỗ, đúng việc)
 *     — máy tách được phần lớn bằng nhãn, nhưng không tách được hết. Xem cột `ghiChu`.
 *
 * CÁCH DÙNG
 *   node scripts/soi-mat-tu-cham.mjs                 # bảng tóm tắt
 *   node scripts/soi-mat-tu-cham.mjs --chi-tiet      # liệt kê từng khẳng định
 *   node scripts/soi-mat-tu-cham.mjs --do            # CHỈ liệt kê 🔴
 *   node scripts/soi-mat-tu-cham.mjs --json
 *   node scripts/soi-mat-tu-cham.mjs --moc N         # đỏ vượt mốc N thì exit 1
 *
 * MÃ THOÁT: 0 luôn luôn, TRỪ khi `--moc` được truyền và số 🔴 vượt mốc.
 * Cố ý KHÔNG chặn mặc định: một máy soi đỏ-mà-không-sửa-được là máy soi sắp chết.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOC = path.resolve(__dirname, '..');

const CO = (t) => process.argv.includes(`--${t}`);
const CHI_TIET = CO('chi-tiet');
const CHI_DO = CO('do');
const RA_JSON = CO('json');
const iMoc = process.argv.indexOf('--moc');
const MOC = iMoc >= 0 ? Number(process.argv[iMoc + 1]) : null;

/** Bộ nghiệm thu trong tầm soi. Thêm bộ mới thì thêm vào đây — nếu không nó không được canh. */
const BO_DO = [
  'scripts/nghiem-thu-g1.mjs',
  'scripts/nghiem-thu-g2-hanh-trinh.mjs',
  'scripts/nghiem-thu-g4-moat.mjs',
  'scripts/nghiem-thu-g4-moat-danh-tinh.mjs',
  'scripts/nghiem-thu-g6-kho-mo-dau.mjs',
  'scripts/nghiem-thu-g6-dot-2.mjs',
];

/** Tên hàm khẳng định của các bộ (đối số 2 = điều kiện, trừ `ghi` của g1/g2 — xem `THU_TU`). */
const KHANG_DINH = {
  doi: 1,   // doi(nhan, dieuKien, chiTiet)
  ok: 1,    // ok(nhan, dieu, chiTiet)
};

/* ─────────────────────── cắt đối số ─────────────────────── */

function catDoiSo(src, iMo) {
  let sau = 0, i = iMo, batDau = iMo + 1;
  const ra = [];
  let trongChuoi = null, thoat = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (thoat) { thoat = false; continue; }
    if (c === '\\') { thoat = true; continue; }
    if (trongChuoi) { if (c === trongChuoi) trongChuoi = null; continue; }
    if (c === '"' || c === "'" || c === '`') { trongChuoi = c; continue; }
    if (c === '(' || c === '[' || c === '{') sau++;
    else if (c === ')' || c === ']' || c === '}') {
      sau--;
      if (sau === 0) { ra.push(src.slice(batDau, i)); return { doiSo: ra, ket: i }; }
    } else if (c === ',' && sau === 1) { ra.push(src.slice(batDau, i)); batDau = i + 1; }
  }
  return { doiSo: ra, ket: i };
}

/** Bỏ chuỗi + chú thích để không bắt nhầm định danh nằm trong văn bản. */
function boChuoi(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/`(?:\\.|\$\{[^}]*\}|[^`\\])*`/g, (m) => m.replace(/`(?:\\.|[^`$\\])*/g, ' '))
    .replace(/'(?:\\.|[^'\\])*'/g, ' ')
    .replace(/"(?:\\.|[^"\\])*"/g, ' ');
}

const TU_KHOA = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'of', 'in', 'new', 'await',
  'async', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'this', 'void', 'try',
  'catch', 'throw', 'delete', 'class', 'extends', 'switch', 'case', 'default', 'break', 'continue',
  'Object', 'Array', 'JSON', 'Math', 'Number', 'String', 'Boolean', 'Set', 'Map', 'Date', 'RegExp',
  'Promise', 'console', 'process', 'require', 'length', 'filter', 'map', 'some', 'every', 'find',
  'includes', 'startsWith', 'endsWith', 'test', 'has', 'get', 'keys', 'values', 'entries', 'push',
  'slice', 'split', 'join', 'trim', 'replace', 'toLowerCase', 'toUpperCase', 'isFinite', 'abs',
  'stringify', 'parse', 'from', 'isArray', 'toLocaleString', 'padStart', 'match', 'indexOf', 'findIndex',
]);

/** Định danh gốc: bỏ phần sau dấu chấm, bỏ nhãn thuộc tính trong object literal. */
function dinhDanhGoc(bieuThuc) {
  const s = boChuoi(bieuThuc);
  const ra = new Set();
  const re = /(^|[^\w$.])([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = re.exec(s))) {
    const t = m[2];
    if (TU_KHOA.has(t)) continue;
    // nhãn thuộc tính `x:` trong object literal — không phải tham chiếu biến
    const sau = s.slice(re.lastIndex);
    if (/^\s*:/.test(sau) && !/^\s*::/.test(sau)) continue;
    ra.add(t);
  }
  return [...ra];
}

/* ─────────────────────── phân tích một tệp ─────────────────────── */

function phanTich(tepTuongDoi) {
  const duong = path.join(GOC, tepTuongDoi);
  const src = fs.readFileSync(duong, 'utf8');
  const dong = src.split('\n');
  const viTri = [];
  let acc = 0;
  for (const d of dong) { viTri.push(acc); acc += d.length + 1; }
  const soDong = (i) => { let lo = 0, hi = viTri.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (viTri[m] <= i) lo = m; else hi = m - 1; } return lo + 1; };

  /* ① HÀM SẢN PHẨM — mọi tên nhập từ lib/ app/ components/ */
  const hamSanPham = new Set();
  const reNhap = /(?:const|let)\s*\{([^}]*)\}\s*=\s*(?:await\s+)?(?:require|import)\s*\(\s*(?:GOC\s*\+\s*)?['"`]([^'"`]+)/g;
  let m;
  while ((m = reNhap.exec(src))) {
    if (!/(^|\/)(lib|app|components)\//.test(m[2])) continue;
    for (const t of m[1].split(',')) {
      const ten = t.split(':').pop().trim();
      if (ten) hamSanPham.add(ten);
    }
  }
  // ⚠️ Bản đầu BỎ SÓT dạng NAMESPACE: `const HG = require(GOC + '/lib/materials/hat-giong.ts')`.
  // `g6-kho-mo-dau` dùng chủ yếu dạng này (HG. · KMD. · KE. · K3D.) nên bị chấm 🔴 oan hàng loạt.
  const reNhapNS = /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:require|import)\s*\(\s*(?:GOC\s*\+\s*)?['"`]([^'"`]+)/g;
  while ((m = reNhapNS.exec(src))) {
    if (!/(^|\/)(lib|app|components)\//.test(m[2])) continue;
    hamSanPham.add(m[1]);
  }
  const reNhapES = /import\s+(?:\{([^}]*)\}|(\w+))\s+from\s+['"`]([^'"`]+)/g;
  while ((m = reNhapES.exec(src))) {
    if (!/(^|\/|\.)(lib|app|components)\//.test(m[3])) continue;
    if (m[1]) for (const t of m[1].split(',')) { const ten = t.split(' as ').pop().trim(); if (ten) hamSanPham.add(ten); }
    if (m[2]) hamSanPham.add(m[2]);
  }

  /* ② BẢN ĐỒ GÁN */
  const ganCua = new Map();  // ten -> [rhs...]
  const them = (ten, rhs) => {
    if (!ten || TU_KHOA.has(ten)) return;
    if (!ganCua.has(ten)) ganCua.set(ten, []);
    ganCua.get(ten).push(rhs);
  };
  /** RHS ĐA DÒNG. Bản đầu chỉ lấy phần còn lại của DÒNG gán, nên `const taiSan = [` (nội dung ở
   *  các dòng sau) truy về chuỗi rỗng ⇒ chấm 🔴 oan. Gộp tới khi ngoặc cân bằng. */
  const rhsDayDu = (i) => {
    let s = '';
    let can = 0, batDau = false;
    for (let j = i; j < Math.min(dong.length, i + 60); j++) {
      const d = boChuoi(dong[j]);
      s += dong[j] + '\n';
      for (const c of d) {
        if ('([{'.includes(c)) { can++; batDau = true; }
        else if (')]}'.includes(c)) can--;
      }
      if (batDau && can <= 0) break;
      if (!batDau && j > i) break;
      if (!batDau && /;\s*$/.test(d)) break;
    }
    return s;
  };
  for (let i = 0; i < dong.length; i++) {
    const d = dong[i] + (/[[{(,=]\s*$/.test(boChuoi(dong[i])) ? '\n' + rhsDayDu(i + 1) : '');
    let mm;
    // const/let X = ...   (kể cả huỷ cấu trúc đơn giản)
    if ((mm = /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]*)$/.exec(d))) them(mm[1], mm[2]);
    else if ((mm = /^\s*(?:const|let|var)\s*\{([^}]*)\}\s*=\s*([\s\S]*)$/.exec(d))) {
      for (const t of mm[1].split(',')) them(t.split(':').pop().trim(), mm[2]);
    } else if ((mm = /^\s*(?:const|let|var)\s*\[([^\]]*)\]\s*=\s*([\s\S]*)$/.exec(d))) {
      for (const t of mm[1].split(',')) them(t.trim(), mm[2]);
    }
    // gán lại: X = ...
    if ((mm = /^\s*([A-Za-z_$][\w$]*)\s*=\s*([^=][\s\S]*)$/.exec(d))) them(mm[1], mm[2]);
    // X.push(...)
    if ((mm = /([A-Za-z_$][\w$]*)\.push\(([\s\S]*)$/.exec(d))) them(mm[1], mm[2]);
    // for (const X of RHS)
    if ((mm = /for\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s+of\s+([^)]*)\)/.exec(d))) them(mm[1], mm[2]);
    // .map((X) => / .filter((X) =>  — X mang giá trị của mảng nguồn
    if ((mm = /([A-Za-z_$][\w$]*)\s*\.\s*(?:map|filter|find|some|every|forEach|flatMap)\s*\(\s*\(?\s*([A-Za-z_$][\w$]*)/.exec(d))) them(mm[2], mm[1]);
  }

  /* ③ + ④ CHẤM TỪNG KHẲNG ĐỊNH */
  const ket = [];
  const re = /\b(doi|ok)\s*\(/g;
  while ((m = re.exec(src))) {
    const truoc = src[m.index - 1];
    if (truoc && /[.\w$]/.test(truoc)) continue;
    const l = soDong(m.index);
    if (/\b(function|const|let)\s+(doi|ok)\b/.test(dong[l - 1])) continue;
    const { doiSo, ket: iKet } = catDoiSo(src, m.index + m[0].length - 1);
    re.lastIndex = iKet;
    const iDk = KHANG_DINH[m[1]];
    if (doiSo.length <= iDk) continue;
    const nhan = doiSo[0].trim().replace(/\s+/g, ' ');
    const dieuKien = doiSo[iDk].trim().replace(/\s+/g, ' ');

    const daXet = new Set();
    let chamSanPham = null, chamNguon = false;
    const hangDoi = [dieuKien];
    let sau = 0;
    while (hangDoi.length && sau < 400) {
      const bt = hangDoi.shift();
      sau++;
      const sach = boChuoi(bt);
      // ⚠️ Bản đầu của máy này BÁO QUÁ TAY: nó chỉ nhận "hàm sản phẩm" là tên nhập từ `lib/`,
      // nên hai bộ lái trình duyệt (`g4-moat-danh-tinh`, `g6-dot-2`) bị chấm 🔴 gần như toàn bộ
      // — trong khi chúng đo qua APP CHẠY THẬT, tức mạnh hơn cả gọi hàm `lib/`. Đây là dạng
      // MẶT TIỀN sản phẩm thứ hai, phải nhận cả nó.
      if (/\b(page|p|pg)\s*\.\s*(evaluate|goto|\$\$?eval|request|locator|click|fill|screenshot|waitFor)|\.evaluate\(|fetch\(|launchPersistentContext/.test(sach)) {
        chamSanPham = chamSanPham ?? '(app chạy thật · trình duyệt/HTTP)';
      }
      if (/readFileSync|readdirSync|existsSync|execSync|spawnSync/.test(sach)) chamNguon = true;
      for (const ten of dinhDanhGoc(bt)) {
        // gọi trực tiếp `ham(` HOẶC qua namespace `NS.ham(` — cả hai đều là chạm mã sản phẩm
        if (hamSanPham.has(ten) && new RegExp(`\\b${ten}\\s*[.(]`).test(sach)) { chamSanPham = ten; break; }
        if (daXet.has(ten)) continue;
        daXet.add(ten);
        for (const rhs of ganCua.get(ten) ?? []) hangDoi.push(rhs);
      }
      if (chamSanPham && chamSanPham !== '(app chạy thật · trình duyệt/HTTP)') break;
    }

    const hang = chamSanPham ? 'XANH' : chamNguon ? 'VANG' : 'DO';

    /* ⭕ VÒNG TRÒN GIÁ TRỊ — tín hiệu thứ hai, và là tín hiệu đã BẮT ĐƯỢC ca thật.
     * Hiệu chuẩn trên bản `g4-moat` TRƯỚC 04/09 cho thấy tín hiệu "có chạm hàm sản phẩm"
     * KHÔNG đủ: mắt `.idfc` cũ chạm `importIdfc` nên được chấm 🟢, nhưng `exportIdfc`/
     * `importIdfc` là PASS-THROUGH ⇒ chạm hàm không có nghĩa hàm đó quyết định kết quả.
     *
     * Dấu hiệu chắc hơn: khẳng định đọc trường `T` rồi so với literal `V`, mà chính bộ đo
     * có một dòng nạp `T: V` vào dữ liệu mẫu ⇒ giá trị đi một VÒNG TRÒN và quay về.
     * Cũng bắt `hasOwnProperty(x, 'T')` — hỏi sự tồn tại của trường trên object mình tự dựng.
     * ⚠️ Cờ này KHÔNG kết tội: có biến đổi thật ở giữa (đường sinh chuyển `catalog.specId`
     * sang `commerce.specId`) thì vòng tròn là hợp lệ. Nó chỉ đòi NGƯỜI xác nhận. */
    const dkSach = boChuoi(dieuKien);
    let vongTron = null;
    const reSs = /([A-Za-z_$][\w$]*)\s*\??\.?\s*(?:===|==)\s*(['"])([^'"]{2,})\2|(['"])([^'"]{2,})\4\s*(?:===|==)/g;
    // trường cuối trong chuỗi truy cập + literal so sánh
    const reCap = /\.\s*([A-Za-z_$][\w$]*)\s*\)?\s*(?:===|==)\s*(['"])([^'"]{2,})\2/g;
    let mv;
    while ((mv = reCap.exec(dieuKien))) {
      const truong = mv[1], gt = mv[3];
      const reNap = new RegExp(`\\b${truong}\\s*:\\s*['"\`]${gt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`);
      if (reNap.test(src)) { vongTron = `${truong}: '${gt}' — bộ đo tự nạp giá trị này`; break; }
    }
    if (!vongTron) {
      const mh = /hasOwnProperty\s*\.\s*call\s*\(([^,]+),\s*['"]([^'"]+)['"]/.exec(dieuKien)
        || /hasOwnProperty\s*\(\s*['"]([^'"]+)['"]/.exec(dieuKien);
      if (mh) vongTron = `hasOwnProperty('${mh[2] ?? mh[1]}') — hỏi hình dạng của object do chính bộ đo dựng`;
      else if (/hasOwnProperty/.test(dkSach) || (ganCua.get(dinhDanhGoc(dieuKien)[0]) ?? []).some((r) => /hasOwnProperty/.test(r))) {
        vongTron = 'hasOwnProperty — hỏi hình dạng, không hỏi hành vi';
      }
    }
    void reSs;

    ket.push({
      tep: tepTuongDoi, dong: l, nhan, dieuKien,
      hang, vongTron,
      qua: chamSanPham ?? (chamNguon ? '(đọc mã nguồn)' : '(chỉ dữ liệu của chính bộ đo)'),
    });
  }
  return { tep: tepTuongDoi, hamSanPham: [...hamSanPham], ket };
}

/* ─────────────────────── chạy ─────────────────────── */

const tatCa = [];
// `--tep <đường dẫn>` — chấm một tệp ngoài danh sách (dùng để HIỆU CHUẨN máy này trên ca đã biết).
const iTep = process.argv.indexOf('--tep');
const DANH_SACH = iTep >= 0 ? [process.argv[iTep + 1]] : BO_DO;
for (const t of DANH_SACH) {
  if (!fs.existsSync(path.join(GOC, t))) continue;
  tatCa.push(phanTich(t));
}

const bieuTuong = { XANH: '🟢', VANG: '🟡', DO: '🔴' };

if (RA_JSON) {
  console.log(JSON.stringify(tatCa, null, 1));
} else {
  console.log('═══ SOI CHÍNH BỘ MÁY KIỂM — khẳng định nào đo hành vi, khẳng định nào tự chấm điểm ═══\n');
  console.log('bộ đo'.padEnd(40) + 'tổng'.padStart(6) + '🟢 hành vi'.padStart(12) + '🟡 hình dạng'.padStart(14) + '🔴 tự chấm'.padStart(12) + '⭕ vòng tròn'.padStart(14));
  console.log('─'.repeat(98));
  let tX = 0, tV = 0, tD = 0, tO = 0;
  for (const b of tatCa) {
    const x = b.ket.filter((k) => k.hang === 'XANH').length;
    const v = b.ket.filter((k) => k.hang === 'VANG').length;
    const d = b.ket.filter((k) => k.hang === 'DO').length;
    const o = b.ket.filter((k) => k.vongTron).length;
    tX += x; tV += v; tD += d; tO += o;
    console.log(path.basename(b.tep).padEnd(40) + String(b.ket.length).padStart(6) + String(x).padStart(12) + String(v).padStart(14) + String(d).padStart(12) + String(o).padStart(14));
  }
  console.log('─'.repeat(98));
  console.log('TỔNG'.padEnd(40) + String(tX + tV + tD).padStart(6) + String(tX).padStart(12) + String(tV).padStart(14) + String(tD).padStart(12) + String(tO).padStart(14));

  if (CHI_TIET || CHI_DO) {
    for (const b of tatCa) {
      const muc = b.ket.filter((k) => !CHI_DO || k.hang === 'DO' || k.vongTron);
      if (!muc.length) continue;
      console.log(`\n▸ ${b.tep}`);
      for (const k of muc) {
        console.log(`  ${bieuTuong[k.hang]}${k.vongTron ? '⭕' : '  '} :${k.dong}  ${k.nhan}`);
        console.log(`        qua: ${k.qua}`);
        if (k.vongTron) console.log(`        ⭕ : ${k.vongTron}`);
        console.log(`        đk : ${k.dieuKien.slice(0, 150)}`);
      }
    }
  }
  const trong = tatCa.filter((b) => b.ket.length === 0).map((b) => path.basename(b.tep));
  if (trong.length) {
    console.log(`\n🔵 KHÔNG PHỦ ĐƯỢC (0 khẳng định đọc ra): ${trong.join(' · ')}`);
    console.log('   Hai bộ này KHÔNG dùng khuôn `doi()`/`ok()` — g1 tính `const dat = …` rồi gọi');
    console.log('   `ghi(ma, ten, dat?PASS:FAIL, …)`, g2 gom mọi phán quyết vào MỘT chỗ gọi `ghi`');
    console.log('   trong khung chung. ⇒ Con số 0 ở đây là "máy này mù", KHÔNG phải "bộ đó rỗng".');
    console.log('   Soi tay 04/09: cả hai LÁI TRÌNH DUYỆT THẬT (g1 8 ca · g2 13 hành trình), phán');
    console.log('   quyết đọc từ IndexedDB/đĩa/số thực thể sau reload ⇒ hạng 🟢. Muốn máy phủ thì');
    console.log('   phải dạy nó khuôn thứ hai — chưa làm, và khai ra thay vì im lặng bỏ trống.');
  }
  console.log('\n⚠️ HEURISTIC, là SÀN không phải trần. 🔴 gồm cả loại LÀNH (khẳng định kiểm TIỀN ĐỀ');
  console.log('   của chính phép thử). Đọc từng dòng trước khi kết luận — máy này chỉ khoanh vùng.');
  console.log('   Tỉ lệ báo nhầm đã đo 04/09: trong 10 ca 🔴 của phát đầu, 6 là BÁO NHẦM (biến đếm');
  console.log('   tăng trong vòng lặp · lambda truyền vào tham số · handler sự kiện) — dùng để');
  console.log('   KHOANH VÙNG rồi đọc tay, đừng dùng làm con số nộp lên.');
  if (!CHI_TIET && !CHI_DO) console.log('   Chi tiết: --chi-tiet · chỉ đỏ: --do');
}

if (MOC !== null) {
  const d = tatCa.reduce((n, b) => n + b.ket.filter((k) => k.hang === 'DO').length, 0);
  if (d > MOC) { console.error(`\n🔴 ${d} khẳng định tự-chấm-điểm > mốc ${MOC}`); process.exit(1); }
}
