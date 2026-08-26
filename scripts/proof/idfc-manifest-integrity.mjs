/**
 * scripts/proof/idfc-manifest-integrity.mjs — `IDFC-MANIFEST-INTEGRITY-001`.
 *
 * Chứng minh khối toàn vẹn `meta.integrity` của `.idfc`: ký · kiểm · các ca hỏng · và vòng đầy đủ
 * IMPORT → APPLY → EDIT → SAVE → REOPEN → EXPORT.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0 · luật F-17 (khẳng định phải có chủ thể, phải có ca mong THẤY).
 * Chạy:  node scripts/proof/idfc-manifest-integrity.mjs
 */

import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const REPO = process.cwd();
const tmp = mkdtempSync(path.join(REPO, 'node_modules', '.if-proof-'));
const ket = [];

function ca(ten, mong, got, ghiChu = '') {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  if (!dat && ghiChu) console.log(`         ${ghiChu}`);
  return dat;
}

function nap(tsFile, ten) {
  const out = path.join(tmp, `${ten}.cjs`);
  execFileSync('npx', ['esbuild', tsFile, '--bundle', '--format=cjs', '--platform=node',
    '--external:@prisma/client', '--external:next', `--outfile=${out}`], { stdio: 'pipe' });
  return require(out);
}

async function chay() {
  console.log('# IDFC-MANIFEST-INTEGRITY-001 · runtime proof\n');

  const IT = nap('lib/cad/idfc-integrity.ts', 'itg');
  const IDFC = nap('lib/cad/idfc.ts', 'idfc');
  const RESOLVE = nap('lib/cad/library-item-resolve.ts', 'resolve');
  const SEED = nap('lib/idfc-seed/seed.generated.ts', 'seed');
  const SHA = nap('lib/cad/sha256.ts', 'sha');

  const seeds = SEED.IDFC_SEED ?? SEED.default ?? Object.values(SEED).find(Array.isArray);
  const mau = seeds.find((s) => {
    const g = RESOLVE.idfcGeom2dOf(s.body);
    return g && g.prims.length > 0;
  });

  // ── CA 0 · CỔNG HARNESS ───────────────────────────────────────────────────
  // Đòi ba thứ: đúng module, hàm băm CHẠY THẬT (vector chuẩn), và một vòng ký→kiểm khớp.
  const vector = await SHA.sha256Text('abc');
  const goc = IDFC.exportIdfc(mau);
  const daKy = await IT.kyIdfc(goc);
  const congOk =
    typeof IT.kyIdfc === 'function' && typeof IT.kiemToanVenIdfc === 'function' &&
    vector === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' &&
    daKy !== goc && (await IT.kiemToanVenIdfc(daKy)).trangThai === 'khop';
  ca('CA 0 · HARNESS: module thật + sha256("abc") đúng vector chuẩn + một vòng ký→kiểm khớp', true, congOk);
  if (!congOk) { console.error('\n⛔ HARNESS ĐỎ — không báo ĐẠT cho ca nào phía sau.'); return; }

  // ── KÝ ────────────────────────────────────────────────────────────────────
  const k = JSON.parse(daKy);
  ca('CA 1 · F-17: khối `meta.integrity` TỒN TẠI và đúng hình dạng', true,
    !!k.meta?.integrity && k.meta.integrity.algo === 'sha256' &&
    typeof k.meta.integrity.contentHash === 'string' && k.meta.integrity.contentHash.length === 64 &&
    typeof k.meta.integrity.hashedAt === 'string' && typeof k.meta.integrity.appVersion === 'string');
  ca('CA 2 · **mong THẤY** — kiểm tệp vừa ký: KHỚP', 'khop', (await IT.kiemToanVenIdfc(daKy)).trangThai);
  ca('CA 3 · và KHÔNG có cảnh báo nào (tệp lành thì im lặng)', 0, (await IT.kiemToanVenIdfc(daKy)).canhBao.length);
  ca('CA 4 · ký KHÔNG làm hỏng tệp — vẫn nhập được bình thường', true, !!IDFC.importIdfc(daKy));
  ca('CA 5 · ký hai lần: dấu THAY dấu cũ, không chồng khối', 1,
    Object.keys(JSON.parse(await IT.kyIdfc(daKy)).meta).filter((x) => x === 'integrity').length);
  ca('CA 6 · ký lại vẫn KHỚP', 'khop', (await IT.kiemToanVenIdfc(await IT.kyIdfc(daKy))).trangThai);

  // ── XUẤT XỨ nguồn/đầu ra ──────────────────────────────────────────────────
  const nguon = { kind: 'photo', ref: 'asset-abc-123', sha256: 'f'.repeat(64) };
  const kyCoNguon = await IT.kyIdfc(goc, nguon);
  ca('CA 7 · **mong THẤY** — xuất xứ nguồn ghi được vào dấu', nguon, JSON.parse(kyCoNguon).meta.integrity.nguon);
  ca('CA 8 · và kiểm trả lại xuất xứ đó cho nơi gọi', nguon, (await IT.kiemToanVenIdfc(kyCoNguon)).nguon);
  ca('CA 9 · tệp có xuất xứ vẫn KHỚP hash', 'khop', (await IT.kiemToanVenIdfc(kyCoNguon)).trangThai);

  // ── TAMPER · CORRUPT · MISSING · VERSION-MISMATCH ─────────────────────────
  {
    // ① TAMPER — sửa một con số trong ruột, đúng kiểu tấn công đáng lo (đổi kích thước/giá).
    const suaRuot = JSON.parse(daKy);
    suaRuot.body.geom2d.w = (suaRuot.body.geom2d.w ?? 0) + 1;
    const rTamper = await IT.kiemToanVenIdfc(JSON.stringify(suaRuot));
    ca('CA 10 · TAMPER ruột (đổi 1 số) → LỆCH', 'lech', rTamper.trangThai);
    ca('CA 11 · và nói được LÝ DO cho người dùng', true, rTamper.canhBao.some((c) => /bị sửa|hỏng/i.test(c)));
    ca('CA 12 · kèm CẢ HAI hash để đối chiếu, không chỉ phán', true,
      rTamper.hashKhai !== rTamper.hashTinhLai && !!rTamper.hashKhai && !!rTamper.hashTinhLai);
    ca('CA 13 · LỆCH nhưng VẪN MỞ ĐƯỢC (cảnh báo, không chặn — cùng ngữ nghĩa `restoreIfpack`)',
      true, !!IDFC.importIdfc(JSON.stringify(suaRuot)));

    // TAMPER vào commerce (giá) — ca tiền bạc, phải bắt được y như ca hình học.
    const suaGia = JSON.parse(await IT.kyIdfc(IDFC.exportIdfc({ ...mau, commerce: { ...(mau.commerce ?? {}), priceVnd: 1000 } })));
    suaGia.commerce.priceVnd = 1;
    ca('CA 14 · TAMPER giá trong `commerce` → LỆCH', 'lech', (await IT.kiemToanVenIdfc(JSON.stringify(suaGia))).trangThai);

    // Sửa chính hash để "chữa" dấu ⇒ vẫn lệch (không tự chứng thực được).
    const suaHash = JSON.parse(JSON.stringify(suaRuot));
    suaHash.meta.integrity.contentHash = await SHA.sha256Text('bịa');
    ca('CA 15 · sửa luôn hash để che → VẪN LỆCH (dấu không tự chứng thực)', 'lech',
      (await IT.kiemToanVenIdfc(JSON.stringify(suaHash))).trangThai);

    // ② CORRUPT — JSON hỏng: KHÔNG KẾT LUẬN ĐƯỢC, không được nói "bị sửa".
    const rCorrupt = await IT.kiemToanVenIdfc(daKy.slice(0, Math.floor(daKy.length / 2)));
    ca('CA 16 · CORRUPT (JSON cụt) → `khong-doc-duoc`, KHÔNG phải `lech`', 'khong-doc-duoc', rCorrupt.trangThai);
    ca('CA 17 · và câu chữ KHÔNG buộc tội "bị sửa"', true, !rCorrupt.canhBao.some((c) => /bị sửa/i.test(c)));
    ca('CA 18 · mảng JSON → `khong-doc-duoc`', 'khong-doc-duoc', (await IT.kiemToanVenIdfc('[]')).trangThai);

    // ③ MISSING — tệp cũ chưa ký: BÌNH THƯỜNG, phải im lặng.
    const rMissing = await IT.kiemToanVenIdfc(goc);
    ca('CA 19 · MISSING (tệp cũ chưa ký) → `khong-co`', 'khong-co', rMissing.trangThai);
    ca('CA 20 · và KHÔNG cảnh báo gì — nếu không, mọi tệp cũ đều kêu và cảnh báo mất giá', 0, rMissing.canhBao.length);

    // Khối integrity hỏng/thuật toán lạ ⇒ không kết luận, không im.
    const laThuatToan = JSON.parse(daKy);
    laThuatToan.meta.integrity.algo = 'md5';
    const rLa = await IT.kiemToanVenIdfc(JSON.stringify(laThuatToan));
    ca('CA 21 · thuật toán LẠ → `khong-doc-duoc` (không im, không phán bừa)', 'khong-doc-duoc', rLa.trangThai);
    ca('CA 22 · và có câu chữ nói rõ vì sao không kiểm được', true, rLa.canhBao.length > 0);

    // ④ VERSION-MISMATCH — tách bạch với "bị sửa".
    const lechBan = JSON.parse(daKy);
    lechBan.meta.integrity.idfcVersion = 2;
    lechBan.meta.integrity.contentHash = await SHA.sha256Text(IT.chuoiChuanHoa(lechBan));
    const rBan = await IT.kiemToanVenIdfc(JSON.stringify(lechBan));
    ca('CA 23 · VERSION-MISMATCH: hash vẫn khớp ⇒ KHÔNG bị gọi là bị sửa', 'khop', rBan.trangThai);
    ca('CA 24 · nhưng CÓ cảnh báo riêng về lệch phiên bản định dạng', true,
      rBan.canhBao.some((c) => /định dạng|v2|v3/i.test(c)));
  }

  // ── CHUẨN HOÁ: đổi CÁCH VIẾT không được coi là đổi NỘI DUNG ────────────────
  {
    const o = JSON.parse(daKy);
    const daoKhoa = JSON.stringify({ body: o.body, meta: o.meta, idfcVersion: o.idfcVersion, commerce: o.commerce });
    ca('CA 25 · đảo thứ tự khoá → VẪN KHỚP (băm nội dung, không băm cách viết)', 'khop',
      (await IT.kiemToanVenIdfc(daoKhoa)).trangThai);
    const themTrang = JSON.stringify(o, null, 2);
    ca('CA 26 · thêm khoảng trắng/xuống dòng → VẪN KHỚP', 'khop', (await IT.kiemToanVenIdfc(themTrang)).trangThai);
    const doiThoiGian = JSON.parse(daKy);
    doiThoiGian.meta.modifiedAt = new Date(Date.now() + 86400000).toISOString();
    ca('CA 27 · `modifiedAt` đổi (mỗi lần lưu `exportIdfc` tự đóng dấu lại) → VẪN KHỚP, không cảnh báo giả',
      'khop', (await IT.kiemToanVenIdfc(JSON.stringify(doiThoiGian))).trangThai);
  }

  // ── VÒNG ĐẦY ĐỦ: IMPORT → APPLY → EDIT → SAVE → REOPEN → EXPORT ───────────
  {
    const kyLan1 = await IT.kyIdfc(IDFC.exportIdfc(mau), { kind: 'library', ref: 'seed-goc' });
    const p1 = IDFC.importIdfc(kyLan1);
    ca('CA 28 · IMPORT tệp đã ký: mở được', true, !!p1);
    ca('CA 29 · **mong THẤY** — dấu toàn vẹn SỐNG SÓT qua import (đi đường túi khoá lạ)', true,
      !!p1.meta?.integrity?.contentHash);
    ca('CA 30 · và xuất xứ nguồn cũng sống sót', 'seed-goc', p1.meta?.integrity?.nguon?.ref);

    // APPLY — rút hình 2D, đúng đường thả thật.
    const g = RESOLVE.idfcGeom2dOf(p1.body);
    ca('CA 31 · APPLY: rút được hình 2D từ tệp đã ký', true, !!g && g.prims.length > 0);

    // SAVE (không sửa gì) → dấu cũ vẫn khớp.
    const luuNguyen = IDFC.exportIdfc({ meta: p1.meta, body: p1.body, commerce: p1.commerce });
    ca('CA 32 · SAVE không sửa gì → dấu CŨ vẫn KHỚP (chuẩn hoá đã loại `modifiedAt`)', 'khop',
      (await IT.kiemToanVenIdfc(luuNguyen)).trangThai);

    // EDIT → SAVE mà KHÔNG ký lại ⇒ PHẢI lệch. Đây là ca xương sống: nếu nó xanh thì dấu vô dụng.
    const daSua = { ...p1, body: { ...p1.body, geom2d: { ...p1.body.geom2d, h: (p1.body.geom2d.h ?? 0) + 5 } } };
    const luuDaSua = IDFC.exportIdfc({ meta: daSua.meta, body: daSua.body, commerce: daSua.commerce });
    ca('CA 33 · EDIT rồi SAVE mà KHÔNG ký lại → LỆCH (nếu ca này xanh thì dấu vô dụng)', 'lech',
      (await IT.kiemToanVenIdfc(luuDaSua)).trangThai);

    // EDIT → KÝ LẠI → REOPEN → EXPORT ⇒ khớp lại, và xuất xứ giữ được nếu truyền lại.
    const kyLai = await IT.kyIdfc(luuDaSua, p1.meta.integrity.nguon);
    ca('CA 34 · ký lại sau khi sửa → KHỚP', 'khop', (await IT.kiemToanVenIdfc(kyLai)).trangThai);
    const p2 = IDFC.importIdfc(kyLai);
    const xuatLai = IDFC.exportIdfc({ meta: p2.meta, body: p2.body, commerce: p2.commerce });
    ca('CA 35 · REOPEN → EXPORT: vẫn KHỚP sau vòng đầy đủ', 'khop', (await IT.kiemToanVenIdfc(xuatLai)).trangThai);
    ca('CA 36 · xuất xứ nguồn đi trọn vòng', 'seed-goc',
      JSON.parse(xuatLai).meta?.integrity?.nguon?.ref);
    ca('CA 37 · nội dung sửa CÒN THẬT sau vòng (không phải khớp vì rỗng)',
      (p1.body.geom2d.h ?? 0) + 5, JSON.parse(xuatLai).body.geom2d.h);
  }

  // ── HỒI QUY TOÀN BỘ MÓN MẦM ───────────────────────────────────────────────
  {
    const coHinh = seeds.filter((s) => { const g = RESOLVE.idfcGeom2dOf(s.body); return g && g.prims.length > 0; });
    let khop = 0, hong = 0;
    for (const s of coHinh) {
      const ky = await IT.kyIdfc(IDFC.exportIdfc(s));
      if ((await IT.kiemToanVenIdfc(ky)).trangThai === 'khop' && IDFC.importIdfc(ky)) khop++;
      else hong++;
    }
    ca(`CA 38 · cả ${coHinh.length} món mầm: ký → kiểm KHỚP → nhập lại được`, coHinh.length, khop);
    ca('CA 39 · 0 món hỏng', 0, hong);
  }

  // ── DÂY ĐÃ NỐI CHƯA — chống "năng lực có, không ai gọi" ───────────────────
  // Repo đã ghi bốn lần cùng một lỗi: thêm năng lực rồi để 0 nơi gọi. `meta.integrity` mà không
  // ai ký/kiểm thì đúng là lỗi đó lần thứ năm. Hai ca dưới soi ĐƯỜNG CHẠY THẬT, không soi ý định.
  {
    const doc = (f) => require('fs').readFileSync(path.join(REPO, f), 'utf8')
      .split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');

    const sheet = doc('components/library/LibrarySheet.tsx');
    ca('CA 42 · đường XUẤT thật (`LibrarySheet`) có gọi `kyIdfc` trước khi ghi tệp', true,
      /import \{[^}]*kyIdfc[^}]*\} from '@\/lib\/cad\/idfc-integrity'/.test(sheet) &&
      /await kyIdfc\(/.test(sheet));
    ca('CA 43 · và Blob ghi ra là chuỗi ĐÃ KÝ, không phải chuỗi gốc', true,
      /new Blob\(\[daKy\]/.test(sheet) && !/new Blob\(\[json\]/.test(sheet));
    ca('CA 44 · ký hỏng KHÔNG im lặng — người dùng được báo là tệp không có dấu', true,
      /coDau/.test(sheet) && /KHÔNG đóng được dấu/.test(sheet));

    const ingest = doc('components/library/BulkIngestMode.tsx');
    ca('CA 45 · đường NHẬP thật (`BulkIngestMode`) có gọi `kiemToanVenIdfc`', true,
      /import \{[^}]*kiemToanVenIdfc[^}]*\} from '@\/lib\/cad\/idfc-integrity'/.test(ingest) &&
      /await kiemToanVenIdfc\(/.test(ingest));
    ca('CA 46 · cảnh báo toàn vẹn TÁCH khỏi lỗi nhập (`canhBao` ≠ `error`) — không gộp hai nghĩa',
      true, /canhBao\?: string\[\]/.test(ingest) && /f\.canhBao\?\.length/.test(ingest));
    ca('CA 47 · và cảnh báo KHÔNG chặn nhập — tệp lệch dấu vẫn vào được kho', true,
      /idfc: parsed, \.\.\.\(toanVen\?\.canhBao\.length/.test(ingest));
  }

  // ── MỘT HỆ BĂM, KHÔNG HAI ─────────────────────────────────────────────────
  {
    const nguonIfpack = require('fs').readFileSync(path.join(REPO, 'lib/cad/ifpack.ts'), 'utf8');
    ca('CA 40 · `ifpack.ts` KHÔNG còn định nghĩa hàm băm riêng — nó import từ `sha256.ts`', true,
      !/async function sha256Hex/.test(nguonIfpack) && /from '\.\/sha256'/.test(nguonIfpack));
    // ⚠️ Lượt đầu ca này ĐỎ vì lý do SAI: regex `crypto.subtle` khớp vào một câu GIẢI THÍCH
    // trong docstring ("`crypto.subtle.digest` là async nên…"). Mã không hề gọi hàm đó. Đây là
    // họ F-17 ở tầng khẳng định — soi đúng tệp nhưng soi cả phần không phải mã. Nên: bóc dòng
    // chú thích trước khi soi, và soi LỜI GỌI THẬT chứ không soi cái tên.
    const nguonItg = require('fs').readFileSync(path.join(REPO, 'lib/cad/idfc-integrity.ts'), 'utf8')
      .split('\n')
      .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l))
      .join('\n');
    ca('CA 41 · `idfc-integrity.ts` cũng import từ đó, không chép hàm băm thứ hai', true,
      !/crypto\.subtle\.digest\s*\(/.test(nguonItg) && /from '\.\/sha256'/.test(nguonItg));
  }
}

chay()
  .catch((e) => { console.error(e); ket.push({ ten: 'CHẠY ĐƯỢC', dat: false }); })
  .finally(() => {
    rmSync(tmp, { recursive: true, force: true });
    const fail = ket.filter((k) => !k.dat);
    console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
    process.exit(fail.length ? 1 : 0);
  });
