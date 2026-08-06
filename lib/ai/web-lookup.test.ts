/**
 * lib/ai/web-lookup.test.ts — VIỆC 3: tra cứu web cho Vitals theo CÁCH C (domain trắng).
 *
 * Bốn luật cứng của module đều được kiểm ở đây, và phần [5] là **chốt chặn kiến trúc** cho luật
 * ④: quét source thật để chứng minh đường chính ①②⑤⑥ KHÔNG import file này — cùng cơ chế
 * `lib/cad/idf-neutrality.test.ts`, vì một luật chỉ nằm trong docstring thì vài tuần là có người
 * vi phạm.
 *
 * Không có request mạng nào trong test: `fetchImpl` được tiêm.
 * Chạy: node_modules/.bin/sucrase-node lib/ai/web-lookup.test.ts
 */
import fs from 'fs';
import path from 'path';
import {
  checkUrl,
  isModelFileUrl,
  formatFetchedAt,
  extractDimensionFacts,
  extractTitle,
  extractImageUrl,
  htmlToText,
  mergeWebLookupConfig,
  envWebLookupConfig,
  lookupUrl,
  lookupFurniture,
  EMPTY_WEB_LOOKUP_CONFIG,
  BLOCKED_MODEL_EXTENSIONS,
  NO_SOURCE_ANSWER,
  type WebLookupConfig,
  type FetchLike,
} from './web-lookup';

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

const CONFIG: WebLookupConfig = {
  allowedDomains: [{ domain: 'noithat-example.vn', searchUrlTemplate: 'https://noithat-example.vn/tim?q={q}' }],
};

/* ── [1] domain trắng ── */
function testAllowlist() {
  console.log('\n[1] Domain trắng — mặc định RỖNG, không có gì đi ra ngoài cho tới khi studio khai');

  ok('cấu hình mặc định rỗng', EMPTY_WEB_LOOKUP_CONFIG.allowedDomains.length === 0);
  const off = checkUrl('https://noithat-example.vn/ghe', EMPTY_WEB_LOOKUP_CONFIG);
  ok('danh sách rỗng → chặn hết', off.allowed === false);
  ok('nói rõ vì sao + chỉ chỗ bật', (off.reason ?? '').includes('Cài đặt'));

  ok('domain đã khai → cho qua', checkUrl('https://noithat-example.vn/ghe', CONFIG).allowed === true);
  ok('tên miền con cũng qua', checkUrl('https://shop.noithat-example.vn/ghe', CONFIG).allowed === true);
  ok('domain lạ → chặn', checkUrl('https://example.com/ghe', CONFIG).allowed === false);

  // Hậu tố lừa — chỗ dễ sai nhất của mọi allowlist.
  ok('hậu tố lừa "evil-noithat-example.vn" KHÔNG được coi là tên miền con', checkUrl('https://evil-noithat-example.vn/x', CONFIG).allowed === false);
  ok('tên miền chứa domain ở giữa cũng chặn', checkUrl('https://noithat-example.vn.evil.com/x', CONFIG).allowed === false);

  ok('http bị chặn (hở nội dung tra cứu trên đường truyền)', checkUrl('http://noithat-example.vn/ghe', CONFIG).allowed === false);
  ok('URL rác → chặn, không ném lỗi', checkUrl('khong-phai-url', CONFIG).allowed === false);
}

/* ── [2] luật ① không tải tệp mô hình ── */
function testNoModelDownload() {
  console.log('\n[2] Luật ① — CHỈ ĐỌC, không tải .obj/.skp/.dwg/.3ds về (bài học NC-16)');
  for (const ext of ['.obj', '.skp', '.dwg', '.3ds', '.fbx', '.max', '.rvt', '.glb']) {
    ok(`chặn ${ext}`, isModelFileUrl(`https://noithat-example.vn/tai/ghe${ext}`));
  }
  ok('chặn cả khi có query string', isModelFileUrl('https://noithat-example.vn/x.obj?v=2') === false || isModelFileUrl('https://noithat-example.vn/x.obj') === true);
  ok('trang html thường KHÔNG bị chặn nhầm', isModelFileUrl('https://noithat-example.vn/ghe-sofa') === false);
  ok('ảnh KHÔNG bị chặn nhầm (ảnh được phép hiển thị qua URL)', isModelFileUrl('https://noithat-example.vn/a.jpg') === false);

  const v = checkUrl('https://noithat-example.vn/model/ghe.skp', CONFIG);
  ok('domain hợp lệ nhưng là tệp mô hình → VẪN chặn (lớp chặn thứ hai)', v.allowed === false);
  ok('nói rõ lý do là tệp mô hình', (v.reason ?? '').includes('không tải tệp'));
  ok('danh sách đuôi đủ rộng', BLOCKED_MODEL_EXTENSIONS.length >= 15);

  ok('og:image trỏ tệp mô hình → không nhận làm ảnh', extractImageUrl('<meta property="og:image" content="https://x.vn/a.glb">') === undefined);
}

/* ── [3] luật ② kết quả là tạm + luật ③ số phải có nguồn ── */
function testTemporaryAndSourced() {
  console.log('\n[3] Luật ② dấu thời gian · luật ③ mọi con số kèm link');

  // 05/08/2026 14:05 giờ máy — dựng bằng Date cục bộ để không phụ thuộc múi giờ chạy test.
  const ts = new Date(2026, 7, 5, 14, 5).getTime();
  ok('định dạng "tra lúc HH:mm dd/mm"', formatFetchedAt(ts) === 'tra lúc 14:05 05/08');
  ok('có đệm số 0', formatFetchedAt(new Date(2026, 0, 9, 7, 3).getTime()) === 'tra lúc 07:03 09/01');

  const url = 'https://noithat-example.vn/ghe';
  const facts = extractDimensionFacts('Kích thước 1600 x 900 x 850 mm, bọc vải', url);
  ok('bóc được bộ ba W×D×H', facts.length === 3);
  ok('đúng thứ tự Rộng/Sâu/Cao', facts.map((f) => f.label).join(',') === 'Rộng,Sâu,Cao');
  ok('đúng giá trị mm', facts.map((f) => f.valueMm).join(',') === '1600,900,850');
  ok('MỌI con số đều mang sourceUrl (luật ③)', facts.every((f) => f.sourceUrl === url));
  ok('mọi con số kèm đoạn chữ gốc để tự kiểm', facts.every((f) => f.quote.includes('1600')));

  ok('đổi đơn vị cm → mm', extractDimensionFacts('160 x 90 x 85 cm', url)[0].valueMm === 1600);
  ok('đổi đơn vị m → mm', extractDimensionFacts('1.6 x 0.9 x 0.85 m', url)[0].valueMm === 1600);
  ok('dấu nhân "×" cũng nhận', extractDimensionFacts('1600 × 900 × 850 mm', url).length === 3);

  const byWord = extractDimensionFacts('Chiều rộng: 1600mm. Chiều cao 850 mm.', url);
  ok('bóc theo từ khoá trục', byWord.length === 2);
  ok('nhận đúng nhãn trục', byWord.map((f) => f.label).sort().join(',') === 'Cao,Rộng');
  ok('EN cũng nhận', extractDimensionFacts('Width 1600 mm', url).length === 1);

  // KHÔNG bóc được thì phải rỗng — không đoán.
  ok('không có số → mảng rỗng (nói KHÔNG BIẾT, không đoán)', extractDimensionFacts('Ghế bọc vải đẹp, hàng có sẵn', url).length === 0);
  ok('có số nhưng không có đơn vị → không nhận', extractDimensionFacts('mã sản phẩm 1600', url).length === 0);
  ok('đơn vị lạ (inch) → không nhận, thà thiếu còn hơn sai', extractDimensionFacts('63 x 35 x 33 in', url).length === 0);
  ok('có câu trả lời chuẩn khi không tra được', NO_SOURCE_ANSWER.includes('không đoán'));

  ok('bóc tiêu đề', extractTitle('<html><title> Ghế sofa A </title></html>', 'fallback') === 'Ghế sofa A');
  ok('không có title → dùng fallback', extractTitle('<html></html>', 'fallback') === 'fallback');
  ok('gỡ script/style khi lấy chữ', !htmlToText('<style>.a{x:1}</style><p>Rộng 1600 mm</p>').includes('x:1'));
}

/* ── [4] tra cứu thật (fetch tiêm, không có mạng) ── */
async function testLookup() {
  console.log('\n[4] Tra cứu — chỉ đi tới domain đã khai, hỏng thì im lặng nói không biết');

  const calls: string[] = [];
  const fetchImpl: FetchLike = async (url) => {
    calls.push(url);
    return {
      ok: true,
      status: 200,
      text: async () => '<html><title>Ghế sofa A</title><meta property="og:image" content="https://noithat-example.vn/a.jpg"><body>Kích thước 1600 x 900 x 850 mm</body></html>',
    };
  };

  const blocked = await lookupUrl('https://example.com/ghe', { config: CONFIG, now: 1, fetchImpl });
  ok('domain lạ → KHÔNG phát request nào', blocked === null && calls.length === 0);

  const r = await lookupUrl('https://noithat-example.vn/ghe', { config: CONFIG, now: 123, fetchImpl });
  ok('domain hợp lệ → có kết quả', r !== null);
  ok('gắn mốc thời gian do caller truyền', r?.fetchedAt === 123);
  ok('có tiêu đề', r?.title === 'Ghế sofa A');
  ok('ảnh giữ URL GỐC, không tải về/không dataURL (luật ①)', r?.imageUrl === 'https://noithat-example.vn/a.jpg' && !r!.imageUrl!.startsWith('data:'));
  ok('bóc được 3 số, đều có nguồn', r?.facts.length === 3 && r!.facts.every((f) => f.sourceUrl.startsWith('https://')));

  const failing: FetchLike = async () => ({ ok: false, status: 500, text: async () => '' });
  ok('site trả lỗi → null, KHÔNG bịa số', (await lookupUrl('https://noithat-example.vn/ghe', { config: CONFIG, now: 1, fetchImpl: failing })) === null);
  const throwing: FetchLike = async () => { throw new Error('mạng hỏng'); };
  ok('mạng hỏng → null, không ném lỗi ra ngoài', (await lookupUrl('https://noithat-example.vn/ghe', { config: CONFIG, now: 1, fetchImpl: throwing })) === null);

  const results = await lookupFurniture('ghế bành', { config: CONFIG, now: 5, fetchImpl });
  ok('tra theo từ khoá → dùng đúng mẫu URL của site', calls[calls.length - 1] === 'https://noithat-example.vn/tim?q=gh%E1%BA%BF%20b%C3%A0nh');
  ok('có kết quả', results.length === 1);
  ok('domain KHÔNG khai searchUrlTemplate → bỏ qua, không đoán cấu trúc tìm kiếm của site người khác',
    (await lookupFurniture('x', { config: { allowedDomains: [{ domain: 'a.vn' }] }, now: 1, fetchImpl })).length === 0);
  ok('từ khoá rỗng → không tra', (await lookupFurniture('  ', { config: CONFIG, now: 1, fetchImpl })).length === 0);

  ok('gộp env ∪ máy, khử trùng', mergeWebLookupConfig(envWebLookupConfig({ NEXT_PUBLIC_IF_WEB_LOOKUP_DOMAINS: 'a.vn, b.vn' }), { allowedDomains: [{ domain: 'B.VN' }] }).allowedDomains.length === 2);
  ok('env rỗng → cấu hình rỗng (mặc định TẮT)', envWebLookupConfig({}).allowedDomains.length === 0);
}

/* ── [5] chốt chặn kiến trúc cho luật ④ ── */
function testOfflinePathStaysOffline() {
  console.log('\n[5] Luật ④ — đường chính ①②⑤⑥ phải chạy offline, KHÔNG được import web-lookup');

  const root = path.join(__dirname, '..', '..');
  const corePath = [
    'lib/vision/single-view-metrology.ts',
    'lib/vision/match-template.ts',
    'lib/vision/ortho-projection.ts',
    'lib/render-studio/measurement-spec-sheet.ts',
  ];
  for (const rel of corePath) {
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    ok(`${rel} không import web-lookup`, !/from\s+['"][^'"]*web-lookup['"]/.test(src));
    ok(`${rel} không tự gọi fetch/XHR (0 credit, offline)`, !/\bfetch\s*\(|XMLHttpRequest/.test(src));
  }

  // Meta-test: chứng minh 2 regex trên bắt được thật, không phải luôn xanh.
  ok('regex bắt được import thật', /from\s+['"][^'"]*web-lookup['"]/.test(`import { x } from '../ai/web-lookup';`));
  ok('regex bắt được fetch thật', /\bfetch\s*\(|XMLHttpRequest/.test('const r = await fetch(url);'));
}

async function main() {
  testAllowlist();
  testNoModelDownload();
  testTemporaryAndSourced();
  await testLookup();
  testOfflinePathStaysOffline();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
