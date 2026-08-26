/**
 * scripts/proof/idfc-identity-boq.mjs — IDFC-INTEGRITY-001, phần DANH TÍNH.
 *
 * Chứng minh vòng đầy đủ mà Hoà yêu cầu:
 *   IMPORT → SAVE (`.idf`) → REOPEN → APPLY (thả xuống bản vẽ) → BOQ HANDOFF.
 *
 * Trước lát này, đo được: **0/60 món mầm `.idfc` có hình 2D lên được BOQ**. Món xuống bản vẽ
 * dưới dạng nét rời (`.idfc` tự chứa không có `blockId` trong `BLOCK_MAP` — đăng ký block động
 * là mở lại bản vẽ mất hình, `block-library.ts:201`), mà nét rời trước nay KHÔNG mang được
 * `specId`. Chúng vào bản vẽ rồi **biến mất khỏi bảng khối lượng, không lỗi, không dòng**.
 *
 * Hai luật phải giữ đồng thời, và chúng kéo ngược nhau — đó là lý do phải có proof:
 *   ① một bản chèn `.idfc` = **MỘT** món trên BOQ, không phải 41 nét = 41 món;
 *   ② cờ TẮT ⇒ BOQ ra **y hệt hôm nay**.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0 · luật F-17 (khẳng định phải có chủ thể, phải có ca mong THẤY).
 * Chạy:  node scripts/proof/idfc-identity-boq.mjs
 */

import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const REPO = process.cwd();
// Bundle phải nằm TRONG repo (Node giải node_modules theo đường của FILE).
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
  execFileSync('npx', [
    'esbuild', tsFile, '--bundle', '--format=cjs', '--platform=node',
    '--external:@prisma/client', '--external:next', `--outfile=${out}`,
  ], { stdio: 'pipe' });
  return require(out);
}

function chay() {
  console.log('# IDFC-INTEGRITY-001 · danh tính component → BOQ · runtime proof\n');

  const IDFC = nap('lib/cad/idfc.ts', 'idfc');
  const RESOLVE = nap('lib/cad/library-item-resolve.ts', 'resolve');
  const BLOCKLIB = nap('lib/cad/block-library.ts', 'blocklib');
  const IDF = nap('lib/cad/idf.ts', 'idf');
  const BOQ = nap('lib/boq/compute.ts', 'boq');
  const SEED = nap('lib/idfc-seed/seed.generated.ts', 'seed');

  // ── CA 0 · CỔNG HARNESS ───────────────────────────────────────────────────
  // Bundle rỗng vẫn require() thành công (bẫy F-15). Cổng đòi: đúng module thật, đúng dữ liệu
  // thật, và một vòng nhỏ CHẠY ĐƯỢC — không chỉ "có hàm".
  const seeds = SEED.IDFC_SEED ?? SEED.default ?? Object.values(SEED).find(Array.isArray);
  const congOk =
    IDFC.IDFC_VERSION === 3 &&
    typeof IDFC.importIdfc === 'function' &&
    typeof RESOLVE.resolveLibraryItem === 'function' &&
    typeof BLOCKLIB.clusterPrimsToEntities === 'function' &&
    typeof BOQ.computeBoq === 'function' &&
    Array.isArray(seeds) && seeds.length >= 60;
  ca(`CA 0 · HARNESS: 5 module thật + ${Array.isArray(seeds) ? seeds.length : 0} món mầm`, true, congOk);
  if (!congOk) {
    console.error('\n⛔ HARNESS ĐỎ — không báo ĐẠT cho ca nào phía sau.');
    return;
  }

  const SPEC = { id: 'spec-ghe-001', name: 'Ghế proof', unit: 'cái', priceVnd: 1_500_000, wastagePercent: 0 };

  /** Một vòng đầy đủ cho MỘT món mầm. Trả về { soNet, soDong, qty, giuSpecIdSauReopen }. */
  function vongDayDu(seedItem, ganSpecId) {
    // ① IMPORT — đi qua đúng cửa nhập thật, không dựng tay.
    const parsed = IDFC.importIdfc(IDFC.exportIdfc(seedItem));
    if (!parsed) return { loi: IDFC.lastImportIdfcError() ?? 'import trả null' };

    // ② APPLY — rút hình 2D của CHÍNH món rồi làm phẳng, đúng đường `LibraryDropBridge`.
    const g = RESOLVE.idfcGeom2dOf(parsed.body);
    if (!g) return { loi: 'món không có hình 2D' };
    const hit = RESOLVE.resolveLibraryItem(
      { name: parsed.meta.name, code: parsed.meta.code, kind: 'block', specId: ganSpecId },
      null, null, g,
    );
    if (!hit || hit.via !== 'idfc') return { loi: `resolve đi nhánh ${hit?.via}` };

    const srcInsertId = 'idfc-ins-proof-1';
    const entities = BLOCKLIB.clusterPrimsToEntities(g.prims, { x: 0, y: 0 }, { layer: 'l-furniture' })
      .map((e) => ({
        ...e,
        srcBlock: parsed.meta.code,
        srcInsertId,
        ...(process.env.NEXT_PUBLIC_IF_IDFC_IDENTITY === '1' && hit.specId ? { specId: hit.specId } : {}),
      }));

    // ③ SAVE `.idf` → ④ REOPEN. Đây là chặng mà mọi field additive phải sống sót.
    const doc = { entities, layers: [{ id: 'l-furniture', name: 'Nội thất', color: '#888', visible: true, locked: false }] };
    const moLai = IDF.importIdf(IDF.exportIdf([{ id: 's1', name: 'Sheet 1', doc }]));
    const docMoLai = moLai?.sheets?.[0]?.doc ?? null;
    if (!docMoLai) return { loi: 'mở lại .idf thất bại' };

    // ⑤ BOQ HANDOFF.
    const boq = BOQ.computeBoq(docMoLai, [SPEC]);
    const dong = (boq.rows ?? []).filter((r) => r.specId === SPEC.id);
    return {
      soNet: entities.length,
      soNetSauReopen: docMoLai.entities.length,
      giuSpecIdSauReopen: docMoLai.entities.filter((e) => e.specId === SPEC.id).length,
      soDong: dong.length,
      qty: dong[0]?.qty ?? 0,
      loiBoq: (boq.errors ?? []).map((e) => e.reason),
    };
  }

  const monCoHinh = seeds.filter((s) => {
    const g = RESOLVE.idfcGeom2dOf(s.body);
    return g && g.prims.length > 0;
  });
  ca(`CA 1 · có ${monCoHinh.length} món mầm mang hình 2D để chạy vòng đầy đủ`, true, monCoHinh.length >= 60);

  const mau = monCoHinh[0];

  // ── CỜ TẮT — BOQ phải Y HỆT hôm nay ───────────────────────────────────────
  delete process.env.NEXT_PUBLIC_IF_IDFC_IDENTITY;
  const tat = vongDayDu(mau, SPEC.id);
  ca('CA 2 · cờ TẮT: vòng chạy được, ra nét thật', true, !tat.loi && tat.soNet > 0, tat.loi ?? '');
  ca('CA 3 · cờ TẮT: nét KHÔNG mang specId (hành vi hôm nay)', 0, tat.giuSpecIdSauReopen);
  ca('CA 4 · cờ TẮT: BOQ KHÔNG có dòng nào cho món này (đúng lỗ đang đo: 0/60 lên được BOQ)', 0, tat.soDong);

  // ── CỜ BẬT ───────────────────────────────────────────────────────────────
  process.env.NEXT_PUBLIC_IF_IDFC_IDENTITY = '1';
  const bat = vongDayDu(mau, SPEC.id);
  ca('CA 5 · cờ BẬT: vòng chạy được', true, !bat.loi, bat.loi ?? '');
  ca('CA 6 · cờ BẬT: số nét KHÔNG đổi sau save→reopen (không mất hình)', bat.soNet, bat.soNetSauReopen);
  ca('CA 7 · cờ BẬT: specId SỐNG SÓT qua `.idf` save→reopen trên MỌI nét của cụm', bat.soNet, bat.giuSpecIdSauReopen);
  // Ca mong THẤY — xương sống của cả lát (luật F-17).
  ca('CA 8 · cờ BẬT: BOQ CÓ ĐÚNG MỘT dòng cho món này', 1, bat.soDong);
  ca(`CA 9 · cờ BẬT: qty = 1 (một bản chèn = MỘT món, KHÔNG phải ${bat.soNet} nét = ${bat.soNet} món)`, 1, bat.qty);

  // ── HAI BẢN CHÈN = HAI MÓN ───────────────────────────────────────────────
  {
    const parsed = IDFC.importIdfc(IDFC.exportIdfc(mau));
    const g = RESOLVE.idfcGeom2dOf(parsed.body);
    const cum = (ins) =>
      BLOCKLIB.clusterPrimsToEntities(g.prims, { x: 0, y: 0 }, { layer: 'l-furniture' })
        .map((e) => ({ ...e, id: `${e.id}-${ins}`, srcBlock: parsed.meta.code, srcInsertId: ins, specId: SPEC.id }));
    const doc = { entities: [...cum('ins-A'), ...cum('ins-B')], layers: [] };
    const boq = BOQ.computeBoq(doc, [SPEC]);
    const dong = (boq.rows ?? []).filter((r) => r.specId === SPEC.id);
    ca('CA 10 · hai bản chèn ⇒ vẫn MỘT dòng…', 1, dong.length);
    ca('CA 11 · …nhưng qty = 2', 2, dong[0]?.qty ?? 0);
    ca('CA 12 · thành tiền = 2 × đơn giá', 2 * SPEC.priceVnd, dong[0]?.amount ?? dong[0]?.thanhTien ?? 0);
  }

  // ── XUẤT XỨ + KHOÁ LẠ sống sót qua vòng đầy đủ ───────────────────────────
  {
    const coXuatXu = {
      idfcVersion: 3,
      meta: { ...mau.meta, code: 'PROOF-PROV', xNguonAnh: 'anh-goc-001.jpg' },
      body: mau.body,
      commerce: mau.commerce,
      xFromPhoto: { doTinCay: 0.82, mucSuThat: 'measured', nguoiKy: 'hoa' },
    };
    const r1 = IDFC.importIdfc(JSON.stringify(coXuatXu));
    ca('CA 13 · file mang xuất xứ mở được', true, !!r1);
    ca('CA 14 · xuất xứ cấp gốc GIỮ NGUYÊN VĂN sau import', coXuatXu.xFromPhoto, r1?.xFromPhoto);
    ca('CA 15 · khoá lạ trong meta giữ tại chỗ', 'anh-goc-001.jpg', r1?.meta?.xNguonAnh);

    // Nơi gọi BÓC TÁCH — đúng cách `LibrarySheet.tsx` đang làm. Đây là ca thật, không phải ca dựng.
    const daLuu = JSON.parse(IDFC.exportIdfc({ meta: r1.meta, body: r1.body, commerce: r1.commerce }));
    ca('CA 16 · lưu lại qua nơi gọi BÓC TÁCH: xuất xứ vẫn ở ĐÚNG CẤP GỐC', coXuatXu.xFromPhoto, daLuu.xFromPhoto);
    ca('CA 17 · KHÔNG mọc thêm field lạ `meta.x` trên đĩa', undefined, daLuu.meta?.x);
    ca('CA 18 · vòng THỨ HAI không mất thêm gì', coXuatXu.xFromPhoto,
      JSON.parse(IDFC.exportIdfc(IDFC.importIdfc(JSON.stringify(daLuu)))).xFromPhoto);

    // Túi vận chuyển KHÔNG được đổi danh tính món — file cố ý độc.
    const doc = {
      idfcVersion: 3,
      meta: { ...mau.meta, code: 'PROOF-DOC', x: { meta: { code: 'BI-CHIEM' }, body: { type: 'video' }, idfcVersion: 99 } },
      body: mau.body,
    };
    const r2 = IDFC.importIdfc(JSON.stringify(doc));
    const raDia = JSON.parse(IDFC.exportIdfc({ meta: r2.meta, body: r2.body, commerce: r2.commerce }));
    ca('CA 19 · túi KHÔNG đè được `meta.code`', 'PROOF-DOC', raDia.meta?.code);
    ca('CA 20 · túi KHÔNG đè được `idfcVersion`', 3, raDia.idfcVersion);
    ca('CA 21 · túi KHÔNG đè được `body.type`', mau.body.type, raDia.body?.type);
  }

  // ── LỖI ĐỌC ĐƯỢC cho JSON hỏng ───────────────────────────────────────────
  {
    ca('CA 22 · JSON cụt bị từ chối', null, IDFC.importIdfc('{"idfcVersion":3,"meta":{'));
    const ly = IDFC.lastImportIdfcError();
    ca('CA 23 · và lý do NÓI ĐƯỢC cho người dùng (trước lát này là `null` — ca hỏng phổ biến nhất là ca DUY NHẤT câm)',
      true, typeof ly === 'string' && ly.length > 20 && /JSON|cắt cụt|hỏng/i.test(ly));
    console.log(`         lý do trả về: "${ly}"`);
    IDFC.importIdfc('[]');
    ca('CA 24 · mảng JSON: có lý do riêng, không câm', true, /đối tượng|mảng/i.test(IDFC.lastImportIdfcError() ?? ''));
    IDFC.importIdfc('{"meta":{}}');
    ca('CA 25 · thiếu idfcVersion: có lý do riêng, không câm', true, /idfcVersion|phiên bản/i.test(IDFC.lastImportIdfcError() ?? ''));
  }

  // ── HỒI QUY 60 MÓN MẦM ───────────────────────────────────────────────────
  {
    let hong = 0, tongDong = 0;
    for (const s of monCoHinh) {
      const r = vongDayDu(s, SPEC.id);
      if (r.loi) { hong++; continue; }
      tongDong += r.soDong;
    }
    ca(`CA 26 · cờ BẬT: cả ${monCoHinh.length} món mầm đi trọn vòng, 0 món hỏng`, 0, hong);
    ca(`CA 27 · cờ BẬT: cả ${monCoHinh.length} món đều LÊN ĐƯỢC BOQ (trước lát này: 0/${monCoHinh.length})`,
      monCoHinh.length, tongDong);
  }
  delete process.env.NEXT_PUBLIC_IF_IDFC_IDENTITY;
}

try {
  chay();
} catch (e) {
  console.error(e);
  ket.push({ ten: 'CHẠY ĐƯỢC', dat: false });
} finally {
  rmSync(tmp, { recursive: true, force: true });
  const fail = ket.filter((k) => !k.dat);
  console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
  process.exit(fail.length ? 1 : 0);
}
