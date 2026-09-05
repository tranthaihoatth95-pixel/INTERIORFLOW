/**
 * HIỆU CHUẨN `soi:dong-dang` — **ĐIỀU BẮT BUỘC 2** của phiếu.
 *
 * Luật: *"Máy không đỏ được ở ca hỏng thì VÔ GIÁ TRỊ."*  Nên tệp này KHÔNG chỉ kiểm ca đạt —
 * mỗi luật đều có một cặp: một ca **BIẾT ĐẠT** (máy phải IM) và một ca **BIẾT HỎNG** (máy phải
 * KÊU). Nhóm chỉ toàn kỳ vọng phủ định thì không tin được: một máy trả về rỗng vô điều kiện
 * cũng qua sạch mọi ca "phải im".
 *
 * Vì sao phải hiệu chuẩn: ngày 04/09 có **ba** máy soi báo quá tay trong cùng một ngày, và cả ba
 * chỉ lộ ra khi có người đo lại. Cụ thể máy chẩn đoán `pgrep` báo *"9 công cụ đồng bộ đang chạy"*
 * trong một container Linux trống trơn — nó tự khớp chính dòng lệnh của mình. ⇒ ca `TỰ SOI` dưới
 * đây kiểm đúng bệnh đó, và nó là ca tôi tin cậy nhất trong tệp này.
 *
 * Chạy:  node_modules/.bin/sucrase-node scripts/soi-dong-dang.test.ts
 */

// `import` tĩnh không dùng được: sucrase-node biên ra CommonJS, mà `soi-dong-dang.mjs` là ESM
// (cùng khuôn mọi máy soi trong `scripts/`). `new Function` giữ nguyên `import()` thật cho tới
// lúc chạy — vẫn là CÙNG MỘT tệp luật, không phải bản sao thứ hai.
void (async () => {
  const nap = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
  const M = await nap(new URL('./soi-dong-dang.mjs', `file://${__dirname}/`).href);
  const { thuThapTuNguon, dongDang, chuanHoaKieu, laTuLoaiTru, laTepTest, NGUONG } = M;

  let ok = 0;
  let fail = 0;
  const la = (dieu: boolean, vi: string, them = '') => {
    if (dieu) {
      ok++;
      console.log(`  ok  - ${vi}`);
    } else {
      fail++;
      console.log(`  FAIL- ${vi}${them ? `\n        ${them}` : ''}`);
    }
  };

  /** Chạy máy trên một bộ nguồn trong bộ nhớ — không ghi tệp thật ra đĩa. */
  const soi = (tep: Record<string, string>) =>
    dongDang(Object.entries(tep).map(([rel, ma]) => thuThapTuNguon(rel, ma)));

  const tenNhom = (nhom: any[][]) => nhom.map((ds) => ds.map((x: any) => x.ten).sort().join('+')).sort();
  const dsNhom = (nhom: any[][]) => nhom.map((ds) => ds[0].vanTay).sort();

  // ═══ ① HÌNH DẠNG KIỂU ═══════════════════════════════════════════════════════════════════
  console.log('\n① hình dạng kiểu — cùng hình dạng, khác tên');

  // ── BIẾT HỎNG: phải KÊU ──────────────────────────────────────────────────────────────────
  la(
    tenNhom(soi({
      'lib/a.ts': 'export interface HoSoNguoiDung { ten: string; tuoi: number; }',
      'lib/b.ts': 'export interface UserProfile { ten: string; tuoi: number; }',
    }).chat).includes('HoSoNguoiDung+UserProfile'),
    'BIẾT HỎNG · hai interface trùng khít, khác tên → phải vào KHỚP CHẶT',
  );

  la(
    soi({
      'lib/a.ts': 'export interface A { ten: string; tuoi: number; }',
      'lib/b.ts': 'export type B = { ten: string; tuoi: number };',
    }).chat.length === 1,
    'BIẾT HỎNG · `interface` và `type` cùng hình dạng vẫn phải gặp nhau (khác cú pháp, cùng sự thật)',
  );

  // Đây là ca đáng bắt nhất trong thực tế: chép rồi sửa lời giải thích, quên rằng bản gốc còn đó.
  la(
    soi({
      'lib/a.ts': 'export interface Goc { ten: string; tuoi: number; ma: string; }',
      'lib/b.ts': `export interface Chep {
        /** Tên hiển thị cho người dùng cuối. */
        ten: string;
        readonly tuoi: number; // đơn vị: năm
        ma  :  string
      }`,
    }).chat.length === 1,
    'BIẾT HỎNG · chú thích + `readonly` + khoảng trắng KHÔNG được che mất trùng hình dạng',
  );

  la(
    soi({ 'lib/a.ts': 'interface A { x: number; y: number; }\ninterface B { x: number; y: number; }' }).chat.length === 1,
    'BIẾT HỎNG · trùng trong CÙNG một tệp vẫn phải kêu (① không đòi khác tệp)',
  );

  // ── BIẾT ĐẠT: phải IM ────────────────────────────────────────────────────────────────────
  la(
    soi({
      'lib/a.ts': 'export interface HoSo { ten: string; tuoi: number; }',
      'lib/b.ts': 'export interface Khac { nhan: string; gia: number; dvt: string; }',
    }).chat.length === 0,
    'BIẾT ĐẠT · hai kiểu khác hình dạng → phải IM',
  );

  la(
    soi({
      'lib/a.ts': 'export interface A { ma: string; sl: number; }',
      'lib/b.ts': 'export interface B { ma: number; sl: number; }',
    }).chat.length === 0,
    'BIẾT ĐẠT · cùng tên-trường nhưng `ma` khác KIỂU → KHÔNG được vào KHỚP CHẶT',
  );
  la(
    soi({
      'lib/a.ts': 'export interface A { ma: string; sl: number; }',
      'lib/b.ts': 'export interface B { ma: number; sl: number; }',
    }).loLong.length === 1,
    '…nhưng phải rơi xuống KHỚP TÊN-TRƯỜNG — hạ tin cậy, KHÔNG vứt đi',
  );

  la(
    soi({
      'lib/a.ts': 'export interface CungTen { ten: string; tuoi: number; }',
      'lib/b.ts': 'export interface CungTen { ten: string; tuoi: number; }',
    }).chat.length === 0,
    'BIẾT ĐẠT · CÙNG TÊN ở hai tệp → ① phải IM (đó là bệnh khai-trùng, `soi:that`/tsc canh)',
  );

  la(
    soi({ 'lib/a.ts': 'interface A { chi: string; }', 'lib/b.ts': 'interface B { chi: string; }' }).chat.length === 0,
    `BIẾT ĐẠT · kiểu 1 trường dưới ngưỡng ${NGUONG.truong} → phải IM`,
  );

  la(
    soi({
      'lib/a.ts': 'interface A { ten: string; chay(): void; }',
      'lib/b.ts': 'interface B { ten: string; chay(): void; }',
    }).chat.length === 0,
    'BIẾT ĐẠT · có method → bỏ qua cả khai báo (parse-only không so được tin cậy) — giới hạn ĐÃ KHAI',
  );

  // ═══ ④ DANH SÁCH ════════════════════════════════════════════════════════════════════════
  console.log('\n④ danh sách — cùng một danh sách khai ở nhiều tệp');

  const BA = "['do','vang','xanh']";

  la(
    dsNhom(soi({ 'lib/a.ts': `const A = ${BA};`, 'lib/b.ts': `const B = ${BA};` }).danhSach).includes('do|vang|xanh'),
    'BIẾT HỎNG · cùng danh sách 3 phần tử ở hai tệp → phải KÊU',
  );

  la(
    soi({
      'lib/a.ts': "export type Co = 'measured' | 'inferred' | 'verified';",
      'lib/b.ts': "export const CO = ['verified','measured','inferred'] as const;",
    }).danhSach.length === 1,
    'BIẾT HỎNG · union chuỗi ↔ mảng, khác THỨ TỰ, vẫn phải gặp nhau (ca thật: measured/inferred/verified)',
  );

  la(
    soi({
      'lib/a.ts': "enum E { A = 'x', B = 'y', C = 'z' }",
      'lib/b.ts': "const L = ['z','y','x'];",
    }).danhSach.length === 1,
    'BIẾT HỎNG · enum chuỗi ↔ mảng cùng tập giá trị → phải gặp nhau',
  );

  la(
    soi({ 'lib/a.ts': `const A = ${BA};`, 'lib/b.ts': `const B = ['do','vang','tim'];` }).danhSach.length === 0,
    'BIẾT ĐẠT · khác một phần tử → phải IM (so TẬP GIÁ TRỊ, không so đại khái)',
  );

  la(
    soi({ 'lib/a.ts': "const A = ['tren','duoi'];", 'lib/b.ts': "const B = ['duoi','tren'];" }).danhSach.length === 0,
    `BIẾT ĐẠT · danh sách 2 phần tử dưới ngưỡng ${NGUONG.danhSach} → phải IM (cặp đối lập phổ quát)`,
  );

  la(
    soi({ 'lib/a.ts': `const A = ${BA};\nconst B = ${BA};` }).danhSach.length === 0,
    'BIẾT ĐẠT · lặp trong CÙNG một tệp → ④ phải IM (chuyện gọn nhà, không phải hai-nơi-giữ-một-sự-thật)',
  );

  la(
    soi({ 'lib/a.test.ts': `const A = ${BA};`, 'lib/b.test.ts': `const B = ${BA};` }).danhSach.length === 0,
    'BIẾT ĐẠT · CHỈ có ở tệp test → phải IM (dữ liệu vứt đi, không tệp nào giữ sự thật)',
  );
  la(
    soi({ 'lib/a.test.ts': `const A = ${BA};`, 'lib/b.ts': `const B = ${BA};` }).danhSach.length === 1,
    '…nhưng test ↔ NGUỒN thì phải KÊU (test gõ cứng lại sự thật của nguồn — đổi nguồn, test vẫn xanh)',
  );

  la(
    soi({ 'lib/a.ts': "const A = ['x', y, 'z'];", 'lib/b.ts': "const B = ['x', y, 'z'];" }).danhSach.length === 0,
    'BIẾT ĐẠT · mảng có phần tử KHÔNG phải chuỗi → bỏ qua, không đoán giá trị',
  );

  // ═══ TỰ SOI — ĐIỀU BẮT BUỘC 1 ═══════════════════════════════════════════════════════════
  console.log('\n⊘ tự loại trừ chính mình (bệnh của ba máy soi báo quá tay ngày 04/09)');

  la(laTuLoaiTru('scripts/soi-dong-dang.mjs'), 'chính máy soi nằm trong danh sách tự loại trừ');
  la(laTuLoaiTru('scripts/soi-dong-dang.test.ts'), 'tệp hiệu chuẩn này cũng tự loại trừ');
  la(!laTuLoaiTru('lib/cad/model.ts'), '…nhưng KHÔNG loại trừ tệp thường (loại trừ hẹp, không quét bừa)');
  la(laTepTest('lib/a.test.tsx') && laTepTest('lib/__tests__/a.ts') && !laTepTest('lib/atest.ts'),
    'nhận đúng tệp test, không bắt nhầm `atest.ts`');

  // Chú thích bị bóc TRƯỚC khi so — nếu không, một máy soi đọc chính lời tự dặn của mình.
  la(chuanHoaKieu('string /* ghi chú */') === chuanHoaKieu('string'), 'bóc chú thích khối trước khi so');
  la(chuanHoaKieu('number // đơn vị mm') === chuanHoaKieu('number'), 'bóc chú thích dòng trước khi so');
  la(
    soi({ 'lib/a.ts': "const A = ['do','vang','xanh'];", 'lib/b.ts': "// const B = ['do','vang','xanh'];" }).danhSach.length === 0,
    'CA CHỐT · danh sách nằm trong CHÚ THÍCH không được tính là một chỗ khai',
  );

  console.log(`\n${fail ? '🔴' : '✅'} ${ok} ok · ${fail} fail`);
  if (fail) process.exit(1);
})();
