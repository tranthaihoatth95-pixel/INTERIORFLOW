/**
 * lib/present-editor/brand-kit-disk.test.ts — kiểm PHẦN THUẦN của đổi hình dạng tệp Brand Kit
 * (VIỆC 5, `docs/CHOT-BRAND-KIT-2026-08-01.md` ràng buộc ②). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/brand-kit-disk.test.ts
 *
 * Chỉ test `normalizeProjectBrandKitJson()` (THUẦN, không đụng File System Access API/window) +
 * đường ống nó nối vào (`parseBrandKitExport`/`importBrandKitsJson` từ `brand-kit.ts`, cũng THUẦN
 * hoặc tự guard `window`). KHÔNG test `writeBrandKitToProjectFolder`/`importBrandKitFromProjectFolder`
 * trực tiếp — 2 hàm đó cần File System Access API thật (trình duyệt), sucrase-node/Node không có.
 *
 * Bài kiểm BẮT BUỘC theo ràng buộc ②: "migration đọc tương thích hình dạng cũ, KHÔNG mất kit nào."
 */
import { normalizeProjectBrandKitJson, type ProjectBrandKitFile } from './brand-kit-disk';
import { parseBrandKitExport, importBrandKitsJson, type BrandKit, type BrandKitExport } from './brand-kit';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

const KIT: BrandKit = {
  id: 'bk_ms91ahvi_mrbu',
  name: 'ATELIER NORD · LUMEN VILLA',
  logo: null,
  palette: ['#efe9dc', '#c9b79a', '#a98a5b', '#6e5a3e', '#3b4038', '#211e1a'],
  fonts: 'Elegant',
  watermark: { corner: 'br', sizePct: 12, opacity: 0.85, marginPct: 3 },
  updatedAt: 1785507880446,
};

const KIT2: BrandKit = {
  id: 'bk_khac',
  name: 'Studio Khác',
  logo: 'data:image/png;base64,AAAA',
  palette: ['#000000', '#111111', '#222222', '#333333', '#444444', '#555555'],
  fonts: 'Modern',
  watermark: { corner: 'tl', sizePct: 10, opacity: 0.7, marginPct: 4 },
  updatedAt: 1785507990000,
};

/** Hình dạng v2 (MỚI, sau VIỆC 5) — 1 kit của đúng dự án. */
function v2File(kit: BrandKit): string {
  const payload: ProjectBrandKitFile = { version: 2, exportedAt: Date.now(), kit };
  return JSON.stringify(payload);
}

/** Hình dạng v1 (CŨ, trước VIỆC 5) — mảng toàn cục, đúng như tệp thật đã nằm trên đĩa (khớp
 * `cms915kza0001w9a613z8tp65 — Untitled flow/brand-kit.json` đo được ngoài repo, 01/08). */
function v1File(kits: BrandKit[], activeId: string | null): string {
  const payload: BrandKitExport = { version: 1, exportedAt: Date.now(), kits, activeId };
  return JSON.stringify(payload);
}

function testNormalizeV2ToV1() {
  console.log('\n[1] normalizeProjectBrandKitJson — tệp hình dạng MỚI (v2, 1 kit) → bọc thành v1');
  const normalized = normalizeProjectBrandKitJson(v2File(KIT));
  const parsed = parseBrandKitExport(normalized);
  ok('parseBrandKitExport() đọc được sau khi bọc lại (v1 hợp lệ)', parsed !== null);
  ok('đúng 1 kit, không thêm không bớt', parsed?.kits.length === 1);
  ok('giữ NGUYÊN mọi field của kit (id/name/palette/fonts/watermark/updatedAt)', JSON.stringify(parsed?.kits[0]) === JSON.stringify(KIT));
  ok('activeId = id của chính kit đó', parsed?.activeId === KIT.id);
}

function testNormalizeOldShapeUnchanged() {
  console.log('\n[2] normalizeProjectBrandKitJson — tệp hình dạng CŨ (v1, mảng toàn cục) → KHÔNG mất kit nào');
  const oldJson = v1File([KIT, KIT2], KIT2.id);
  const normalized = normalizeProjectBrandKitJson(oldJson);
  ok('tệp cũ đi qua NGUYÊN VĂN (không viết logic parse/merge lần 2)', normalized === oldJson);
  const parsed = parseBrandKitExport(normalized);
  ok('parseBrandKitExport() vẫn đọc được tệp cũ y như trước VIỆC 5', parsed !== null);
  ok('CẢ HAI kit trong tệp cũ còn nguyên — không kit nào bị rơi', parsed?.kits.length === 2);
  ok('kit 1 (Atelier Nord) còn đúng id', !!parsed?.kits.some((k) => k.id === KIT.id));
  ok('kit 2 (Studio Khác) còn đúng id', !!parsed?.kits.some((k) => k.id === KIT2.id));
  ok('activeId của tệp cũ được giữ nguyên', parsed?.activeId === KIT2.id);
}

function testNormalizeMalformedPassthrough() {
  console.log('\n[3] normalizeProjectBrandKitJson — JSON hỏng → trả nguyên văn, không ném, không nuốt lỗi thêm lớp');
  const broken = '{ khong phai json';
  ok('JSON hỏng trả về y hệt đầu vào', normalizeProjectBrandKitJson(broken) === broken);
  ok('parseBrandKitExport() vẫn báo lỗi (null) như hành vi cũ, không crash', parseBrandKitExport(normalizeProjectBrandKitJson(broken)) === null);

  const noVersion = JSON.stringify({ kit: KIT }); // thiếu version — không phải v2 hợp lệ
  ok('thiếu field version → coi như KHÔNG PHẢI v2, trả nguyên văn', normalizeProjectBrandKitJson(noVersion) === noVersion);
}

/** Đầu-cuối: mô phỏng đúng luồng `importBrandKitFromProjectFolder()` gọi
 * `importBrandKitsJson(normalizeProjectBrandKitJson(json), mode)` — chứng minh "không mất kit nào"
 * ở CẢ 2 hình dạng tệp, đi qua đúng con đường sản xuất dùng (không phải test cô lập lý thuyết). */
function testEndToEndImport() {
  console.log('\n[4] Đầu-cuối — normalizeProjectBrandKitJson() + importBrandKitsJson() (đúng luồng importBrandKitFromProjectFolder)');

  const fromV2 = importBrandKitsJson(normalizeProjectBrandKitJson(v2File(KIT)), 'merge');
  ok('nhập tệp v2 (1 kit) — thành công', fromV2.ok === true);
  if (fromV2.ok) {
    ok('nhập tệp v2 — thêm đúng 1 kit', fromV2.addedCount === 1);
  }

  const fromV1 = importBrandKitsJson(normalizeProjectBrandKitJson(v1File([KIT, KIT2], KIT.id)), 'merge');
  ok('nhập tệp v1 CŨ (2 kit) — thành công, tương thích ngược', fromV1.ok === true);
  if (fromV1.ok) {
    ok('nhập tệp v1 CŨ — thêm đủ 2 kit, không mất kit nào', fromV1.addedCount === 2 && fromV1.totalCount === 2);
  }
}

testNormalizeV2ToV1();
testNormalizeOldShapeUnchanged();
testNormalizeMalformedPassthrough();
testEndToEndImport();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
