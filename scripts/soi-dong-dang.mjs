#!/usr/bin/env node
/**
 * scripts/soi-dong-dang.mjs — MÁY SOI ĐỒNG DẠNG: dò *"một sự thật, tính hai nơi"*.
 *
 * Entry `may-soi-dong-dang` (frontier-registry, Hoà chốt cuối phiên 15/08). Máy này KHÔNG tìm
 * lỗi — nó tìm **VỐN CHƯA DÙNG HẾT**: mỗi ca bắt được là một lần khỏi xây lại thứ đã có.
 *
 * ══ VÌ SAO PHẢI LÀ MÁY, KHÔNG PHẢI THÓI QUEN ══
 * §9 HOP-DONG đã giao việc này cho phiên chính, nhưng nó phụ thuộc *người có để ý hay không*.
 * Bằng chứng: phiên 15/08 tìm ra 6 ca cùng-bản-chất-khác-tên — **đều do tình cờ**; phiên 05/09
 * tìm thêm 7 ca — **cũng do tình cờ**. Ba tuần, hai phiên, 13 ca, không lần nào do máy bắt.
 *
 * ══ NĂM TÍN HIỆU CỦA ENTRY — MÁY NÀY LÀM ĐÚNG HAI ══
 *   ① hai kiểu cùng HÌNH DẠNG dữ liệu, khác TÊN          ← LÀM
 *   ② hai union/enum cùng VAI NGỮ NGHĨA, khác TỪ VỰNG    ← chưa làm
 *   ③ cùng CHUỖI THAO TÁC ở hai nơi                      ← chưa làm
 *   ④ cùng một DANH SÁCH khai ở nhiều chỗ                ← LÀM
 *   ⑤ nhãn GẦN NGHĨA                                     ← `soi:tu-dien` đã làm một phần
 *
 * Entry chỉ định rõ *"LÀM TRƯỚC ① và ④ — thuần AST không cần đoán"*, và đó đúng là ranh giới
 * tất định. Ba tín hiệu còn lại đòi máy phán **NGHĨA** chứ không phán **HÌNH**:
 *   · ② phải biết `inferred` và `may-suy` nói cùng một điều — không AST nào suy ra được.
 *   · ③ phải biết hai chuỗi lệnh khác cú pháp mà cùng ý — là bài toán so khớp mờ.
 *   · ⑤ là ngữ nghĩa của tiếng Việt.
 * Cả ba chỉ giải được bằng bảng-người-khai (như `soi:tu-dien` đang làm) hoặc bằng AI — mà AI thì
 * **CẤM** (luật kiểm-bằng-MÁY, Hoà chốt 15/08: tất định, 0đ, chạy 10 lần ra 10 kết quả giống nhau).
 * ⇒ Làm ② ③ ⑤ ở đây là hứa thứ máy không giữ được. Để trống, khai rõ, hơn là báo bừa.
 *
 * ══ BA ĐIỀU BẮT BUỘC — rút từ BA máy soi đã báo QUÁ TAY trong ngày 04/09 ══
 *   1. **TỰ LOẠI TRỪ CHÍNH MÌNH.** `soi-thao-tac` từng đọc chữ trong chú thích rồi bắt đúng câu
 *      nó tự dặn (chính câu cấm chữ máy-làm-thay); máy chẩn đoán `pgrep` tự khớp chính dòng lệnh của
 *      mình rồi báo *"9 công cụ đồng bộ đang chạy"* trong một container Linux trống trơn.
 *      ⇒ tệp này + tệp test của nó nằm trong `TU_LOAI_TRU`, và **chú thích bị bóc trước khi so**.
 *   2. **HIỆU CHUẨN TRƯỚC KHI TIN.** `soi-dong-dang.test.ts` dựng ca BIẾT-ĐẠT (phải im) và ca
 *      BIẾT-HỎNG (phải kêu). Máy không đỏ được ở ca hỏng thì vô giá trị.
 *   3. **BÁO CÁO LÀ SÀN, KHÔNG PHẢI TRẦN.** Xem §KHÔNG BẮT ĐƯỢC ở cuối tệp — in ra mỗi lần chạy.
 *
 * ══ BÁNH CÓC ══
 * Mặc định `exit 0`. Kho đang có nợ cũ; đỏ-mà-không-sửa-được là cách nhanh nhất giết một máy soi
 * (người ta học cách bỏ qua nó). Chỉ `--chan <N>` mới thoát khác 0 khi vượt trần N.
 *
 * Dùng:  node scripts/soi-dong-dang.mjs [--chi-tiet] [--chan <N>] [--nguong-truong N] [--nguong-ds N]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
/* AST bằng `typescript` (5.9.3, đã có sẵn trong node_modules) chứ không phải `sucrase`:
 * sucrase là bộ BIÊN DỊCH — nó cố ý vứt thông tin kiểu (đó là việc của nó) và không phơi ra một
 * API cây cú pháp ổn định để đi bộ. `interface` / `type` / union chuỗi — tức đúng thứ tín hiệu ①
 * và ④ cần đọc — chính là phần sucrase xoá đi. `typescript` cho parse-only (`createSourceFile`,
 * KHÔNG dựng Program, KHÔNG type-check) nên vẫn nhanh, tất định, và giữ nguyên mọi nút cần đọc. */
const ts = require('typescript');

const ROOT = new URL('..', import.meta.url).pathname;

// ── Ngưỡng ────────────────────────────────────────────────────────────────────────────────────
export const NGUONG = {
  /* Số TRƯỜNG tối thiểu của một kiểu thì mới đem so.  ĐO RỒI MỚI CHỌN, không đoán.
   *
   * Tôi vào việc với giả thuyết "≥3, vì 1-2 trường là từ vựng tự nhiên của mọi codebase
   * (`{x,y}` `{id,name}` `{label,value}`) nên trùng nhau vô hại". **Đo trên kho thật thì giả
   * thuyết đó SAI một nửa** — tầng 2-trường chứa toàn ca thật:
   *     · `{vi,en}` — SÁU tên cho một khái niệm (Nhan · BilingualText · BaMatText · Nhan ·
   *       IfRnaText · ChuHaiThu). Đúng nghĩa "một sự thật, tính sáu nơi".
   *     · `{x,y}` — MƯỜI tên cho điểm 2D (Pt · Pt2D · P01 · Point · CurvePoint · DwgRawPoint…).
   *       Tôi tưởng đây là nhiễu; đọc lại thì nó là ca thật nhất trong cả bảng.
   *     · LoftSectionInput ↔ LoftSection · LarkColorRecord ↔ LarkRecord.
   * Đặt 3 là **vứt bỏ đúng những ca đó** (43 → 36 nhóm). ⇒ chọn **2**: sàn là "nhiều hơn một
   * trường", vì kiểu 1 trường (`{id:string}`) thì trùng nhau thật sự không nói lên điều gì.
   * Ngưỡng này là núm ĐỌC CHO DỄ, không phải núm SỰ THẬT — nâng nó lên là giấu bớt, không phải
   * lọc sạch. Ai muốn báo cáo ngắn thì `--nguong-truong 3`, và phải biết mình đang bỏ gì. */
  truong: 2,
  /* Số PHẦN TỬ RIÊNG tối thiểu của một danh sách thì mới đem so.  Cũng đo rồi mới chọn.
   *   · tầng 2 phần tử (227 nhóm): gần như sạch nhiễu phổ quát — `dark|light` `left|right`
   *     `png|jpeg` `portrait|landscape` `x|y` `user|assistant`. Chúng trùng vì thế giới chỉ có
   *     hai chiều đó, không phải vì ai chép của ai.
   *   · tầng 3 phần tử (127 nhóm): ca thật lộ ra ngay, gồm ĐÚNG HAI ca mà sổ đã ghi bằng tay:
   *     `inferred|measured|verified` (bộ từ vựng máy-suy/người-xác-nhận) và cặp `cad|present|render`
   *     ↔ `concept|present|render` (hai hệ tên chặng — 1 trong 6 ca tìm-do-tình-cờ ngày 15/08).
   * ⇒ **3**. Đây là chỗ tỷ lệ tín-hiệu/nhiễu đổi hẳn, không phải con số cho đẹp. */
  danhSach: 3,
};

/**
 * Tệp test có phải nơi giữ sự thật không?  — Nửa có, nửa không, và ranh giới đo được.
 *   · test ↔ test: `['a','b','c']` ở bốn tệp test là **dữ liệu vứt đi**, không tệp nào giữ sự
 *     thật nào; gom chúng lại là nhiễu thuần (đo: 11 nhóm, toàn chữ cái A·B·C).
 *   · test ↔ nguồn: test gõ cứng lại danh sách mà nguồn đã khai thì ĐÚNG LÀ một-sự-thật-hai-nơi,
 *     và là ca nguy hiểm — đổi nguồn xong test vẫn xanh vì nó đang khẳng định sự thật CŨ.
 *     (Đo được ca thật: 10 cột đầu bảng BOQ khai ở `lib/boq/xlsx.ts` rồi gõ lại ở HAI tệp test.)
 * ⇒ Luật: nhóm ④ phải có **≥1 chỗ ngoài tệp test**.  Cắt 11 nhóm, giữ nguyên mọi ca thật.
 * (Luật gắt hơn — "≥2 tệp không-test" — cắt tới 51 nhóm và ăn mất cả ca BOQ ở trên. Đã đo, đã loại.)
 */
export const laTepTest = (rel) => /\.test\.tsx?$/.test(rel) || /(^|\/)__tests__\//.test(rel);

/* Thư mục quét. `docs/` cố ý ĐỨNG NGOÀI: đó là văn xuôi, không phải mã — và phần lớn là nhật ký. */
const QUET = ['lib', 'components', 'app', 'scripts', 'electron'];
const BO_QUA_THU_MUC = new Set(['node_modules', '.next', '.git', '.worktrees', 'worktrees', 'dist', 'out', '.nen-chrome-out']);

/** ĐIỀU BẮT BUỘC 1 — máy không được soi chính mình. Xem docstring đầu tệp. */
export const TU_LOAI_TRU = ['scripts/soi-dong-dang.mjs', 'scripts/soi-dong-dang.test.ts'];

const relHoa = (p) => p.replace(ROOT, '').replace(/^\/+/, '');
export const laTuLoaiTru = (rel) => TU_LOAI_TRU.includes(rel);

// ── Chuẩn hoá ─────────────────────────────────────────────────────────────────────────────────
/**
 * Bóc chú thích + khoảng trắng + `readonly` + dấu chấm phẩy/phẩy cuối trước khi so.
 * Bóc chú thích là **ĐIỀU BẮT BUỘC 1**: hai kiểu chỉ khác nhau ở lời giải thích thì vẫn là MỘT
 * hình dạng — mà đúng ca đó lại là ca đáng bắt nhất (chép rồi sửa lời, quên rằng bản gốc còn đó).
 */
export function chuanHoaKieu(txt) {
  return String(txt)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/\breadonly\b/g, '')
    .replace(/\s+/g, '')
    .replace(/[;,]+$/, '');
}

const doanVanBan = (sf, node) => sf.text.slice(node.pos, node.end);

// ── ① Thu hình dạng kiểu ──────────────────────────────────────────────────────────────────────
function tenThanhVien(sf, m) {
  if (!m.name) return null;
  if (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)) return m.name.text;
  return null; // tên tính toán (`[K in ...]`, `[x: string]`) ⇒ không so được tin cậy
}

/** Trả `null` nếu kiểu có thành viên KHÔNG phải property đơn (method, index signature, call…). */
function thuTruong(sf, members) {
  const out = [];
  for (const m of members) {
    if (!ts.isPropertySignature(m)) return null;
    const ten = tenThanhVien(sf, m);
    if (ten === null) return null;
    const kieu = m.type ? chuanHoaKieu(doanVanBan(sf, m.type)) : 'any';
    out.push({ ten, kieu });
  }
  return out;
}

// ── ④ Thu danh sách chuỗi ─────────────────────────────────────────────────────────────────────
const laChuoi = (n) => ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n);

function thuDanhSach(sf, node) {
  // (a) mảng toàn chuỗi:  ['a','b','c']  /  [...] as const
  if (ts.isArrayLiteralExpression(node)) {
    if (!node.elements.length || !node.elements.every(laChuoi)) return null;
    return node.elements.map((e) => e.text);
  }
  // (b) union chuỗi:  type X = 'a' | 'b' | 'c'   ← đúng dạng của bộ từ vựng measured/inferred/verified
  if (ts.isUnionTypeNode(node)) {
    const ok = node.types.every((t) => ts.isLiteralTypeNode(t) && laChuoi(t.literal));
    if (!ok || node.types.length < 2) return null;
    return node.types.map((t) => t.literal.text);
  }
  // (c) enum toàn chuỗi
  if (ts.isEnumDeclaration(node)) {
    const gt = [];
    for (const m of node.members) {
      if (!m.initializer || !laChuoi(m.initializer)) return null;
      gt.push(m.initializer.text);
    }
    return gt.length ? gt : null;
  }
  return null;
}

// ── Thu thập từ MỘT nguồn ─────────────────────────────────────────────────────────────────────
/**
 * Phân tích một tệp (hoặc một chuỗi mã trong test) ra { hinhDang[], danhSach[] }.
 * Tách riêng khỏi phần đi-bộ-thư-mục để `soi-dong-dang.test.ts` nạp được ca hiệu chuẩn
 * trong bộ nhớ, không phải ghi tệp thật ra đĩa.
 */
export function thuThapTuNguon(rel, ma, nguong = NGUONG) {
  const kind = rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(rel, ma, ts.ScriptTarget.Latest, false, kind);
  const hinhDang = [];
  const danhSach = [];
  const dong = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;

  const di = (node) => {
    // ① kiểu có hình dạng
    let ten = null;
    let members = null;
    if (ts.isInterfaceDeclaration(node)) {
      ten = node.name.text;
      members = node.members;
    } else if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) {
      ten = node.name.text;
      members = node.type.members;
    }
    if (ten && members) {
      const truong = thuTruong(sf, members);
      if (truong && truong.length >= nguong.truong) {
        hinhDang.push({
          rel,
          ten,
          dong: dong(node),
          soTruong: truong.length,
          vanTayChat: truong.map((t) => `${t.ten}:${t.kieu}`).sort().join('|'),
          vanTayTen: truong.map((t) => t.ten).sort().join('|'),
        });
      }
    }

    // ④ danh sách
    const gt = thuDanhSach(sf, node);
    if (gt) {
      const rieng = [...new Set(gt)].sort();
      if (rieng.length >= nguong.danhSach) {
        danhSach.push({ rel, dong: dong(node), soPhanTu: rieng.length, vanTay: rieng.join('|'), gt: rieng });
      }
    }

    node.forEachChild(di);
  };
  sf.forEachChild(di);
  return { hinhDang, danhSach };
}

// ── Gom nhóm đồng dạng ────────────────────────────────────────────────────────────────────────
/**
 * `dongDang(...)` — gom kết quả thu thập thành các nhóm ĐỒNG DẠNG.
 * ① chỉ tính là ca khi **khác TÊN** (cùng tên ở hai chỗ là bệnh khác: khai trùng, không phải
 *   "một sự thật tính hai nơi" theo nghĩa entry — và `soi:that`/tsc đã canh phần đó).
 * ④ chỉ tính là ca khi trải trên **≥2 TỆP** (lặp trong cùng một tệp là chuyện gọn nhà, không
 *   phải chuyện hai nơi cùng giữ một sự thật).
 */
export function dongDang(thu) {
  const hinhDang = thu.flatMap((t) => t.hinhDang);
  const danhSach = thu.flatMap((t) => t.danhSach);

  const gom = (arr, khoa) => {
    const m = new Map();
    for (const x of arr) {
      const k = khoa(x);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    }
    return m;
  };

  // ① — hai tầng tin cậy, cố ý KHÔNG trộn vào một con số.
  const chat = [];
  const loLong = [];
  const daVao = new Set();
  for (const [, ds] of gom(hinhDang, (x) => x.vanTayChat)) {
    const ten = new Set(ds.map((x) => x.ten));
    if (ds.length < 2 || ten.size < 2) continue;
    chat.push(ds);
    ds.forEach((x) => daVao.add(x));
  }
  for (const [, ds] of gom(hinhDang, (x) => x.vanTayTen)) {
    const ten = new Set(ds.map((x) => x.ten));
    if (ds.length < 2 || ten.size < 2) continue;
    if (ds.every((x) => daVao.has(x))) continue; // đã nằm trọn trong nhóm KHỚP CHẶT
    loLong.push(ds);
  }

  // ④ — trải trên ≥2 tệp, và ≥1 trong số đó KHÔNG phải tệp test (xem `laTepTest`).
  const ds4 = [];
  for (const [, ds] of gom(danhSach, (x) => x.vanTay)) {
    if (new Set(ds.map((x) => x.rel)).size < 2) continue;
    if (!ds.some((x) => !laTepTest(x.rel))) continue;
    ds4.push(ds);
  }

  const sap = (a, b) => b.length - a.length || a[0].rel.localeCompare(b[0].rel);
  return { chat: chat.sort(sap), loLong: loLong.sort(sap), danhSach: ds4.sort(sap) };
}

// ── Đi bộ thư mục ─────────────────────────────────────────────────────────────────────────────
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (BO_QUA_THU_MUC.has(name)) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      yield* walk(p);
      continue;
    }
    if (!/\.tsx?$/.test(name)) continue;
    if (name.endsWith('.d.ts')) continue; // tệp khai báo là bản SINH RA, không phải nơi ai quyết gì
    yield p;
  }
}

// ── Chạy ──────────────────────────────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const soCua = (co, mac) => {
    const i = argv.indexOf(co);
    return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : mac;
  };
  const chiTiet = argv.includes('--chi-tiet');
  const tran = argv.includes('--chan') ? soCua('--chan', 0) : null;
  const nguong = {
    truong: soCua('--nguong-truong', NGUONG.truong),
    danhSach: soCua('--nguong-ds', NGUONG.danhSach),
  };

  const thu = [];
  let soTep = 0;
  for (const d of QUET) {
    const dir = join(ROOT, d);
    if (!existsSync(dir)) continue;
    for (const f of walk(dir)) {
      const rel = relHoa(f);
      if (laTuLoaiTru(rel)) continue; // ĐIỀU BẮT BUỘC 1
      soTep++;
      try {
        thu.push(thuThapTuNguon(rel, readFileSync(f, 'utf8'), nguong));
      } catch {
        /* tệp không parse được thì bỏ qua — máy soi không được làm sập việc của người khác */
      }
    }
  }

  const kq = dongDang(thu);
  const ngay = new Date().toISOString().slice(0, 10);
  console.log(`\nSOI ĐỒNG DẠNG — "một sự thật, tính hai nơi"  ${ngay}`);
  console.log(`   ${soTep} tệp .ts/.tsx · ngưỡng: ≥${nguong.truong} trường · ≥${nguong.danhSach} phần tử`);
  console.log('─'.repeat(98));

  const bay = (nhan, nhom, ve) => {
    console.log(`\n${nhan}  — ${nhom.length} nhóm`);
    const hien = chiTiet ? nhom : nhom.slice(0, 12);
    for (const ds of hien) console.log(ve(ds));
    if (!chiTiet && nhom.length > hien.length) {
      console.log(`   … +${nhom.length - hien.length} nhóm nữa — chạy với --chi-tiet để xem hết`);
    }
  };

  bay('① KHỚP CHẶT — cùng tên-trường VÀ cùng kiểu, khác tên kiểu', kq.chat, (ds) =>
    `   ${ds[0].soTruong} trường: ${ds.map((x) => `${x.ten} (${x.rel}:${x.dong})`).join('  ↔  ')}`);

  bay('① KHỚP TÊN-TRƯỜNG — cùng tập tên, ≥1 kiểu khác (tin cậy thấp hơn)', kq.loLong, (ds) =>
    `   ${ds[0].soTruong} trường: ${ds.map((x) => `${x.ten} (${x.rel}:${x.dong})`).join('  ↔  ')}`);

  bay('④ CÙNG MỘT DANH SÁCH KHAI Ở NHIỀU TỆP', kq.danhSach, (ds) => {
    const v = ds[0].gt;
    const nhan = v.slice(0, 6).join(' · ') + (v.length > 6 ? ` … +${v.length - 6}` : '');
    return `   [${ds[0].soPhanTu}] ${nhan}\n        ${ds.map((x) => `${x.rel}:${x.dong}`).join('\n        ')}`;
  });

  const tong = kq.chat.length + kq.loLong.length + kq.danhSach.length;
  console.log('\n' + '─'.repeat(98));
  console.log(`📊 ${tong} nhóm đồng dạng — ${kq.chat.length} khớp chặt · ${kq.loLong.length} khớp tên-trường · ${kq.danhSach.length} danh sách`);
  console.log('   ⚠️ Đây là SÀN DƯỚI, không phải trần. Máy này KHÔNG bắt được:');
  console.log('      · danh sách dựng lúc chạy (map/filter/concat/spread, đọc từ tệp hay CSDL)');
  console.log('      · kiểu SUY RA (Pick/Omit/Partial/generic/`typeof x`) — parse-only không giải kiểu');
  console.log('      · kiểu có method hoặc index signature (bỏ qua cả khai báo, xem `thuTruong`)');
  console.log('      · kiểu cùng hình dạng nhưng ĐẶT TÊN KIỂU khác nhau (`Ngay` vs `Date`)');
  console.log('      · tín hiệu ② vai-ngữ-nghĩa · ③ chuỗi-thao-tác · ⑤ nhãn-gần-nghĩa (xem docstring)');
  console.log('      · trùng lặp trong .md/.mjs/.json và trong `docs/`');
  console.log('   Bắt được một nhóm KHÔNG có nghĩa là phải gộp — nó có nghĩa là phải NGỒI XUỐNG XEM.');

  if (tran !== null && tong > tran) {
    console.log(`\n🔴 ${tong} > trần ${tran} — thoát 1 theo --chan`);
    process.exit(1);
  }
  process.exit(0);
}

const laChayThang = process.argv[1] && process.argv[1].endsWith('soi-dong-dang.mjs');
if (laChayThang) main();
