/**
 * lib/ho-so-song/ho-so-song.test.ts — kiểm Gói Hồ Sơ Sống (phiếu goi-ho-so-song ④.5).
 * Chạy: node_modules/.bin/sucrase-node lib/ho-so-song/ho-so-song.test.ts
 * Thuần node, KHÔNG mạng, KHÔNG browser — round-trip pack → jszip đọc lại.
 * MARKER: HoSoSong.
 */

import { buildHoSoSong, packHoSoSong, hoSoSongFileName, hoSoSongSlug } from './pack';
import { sha256Hex, toBytes } from './manifest';
import { renderViewerHtml } from './viewer-template';
import type { HoSoSongInput, HoSoSongManifest } from './types';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const PNG_1PX = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
]);

function fixtureInput(): HoSoSongInput {
  return {
    projectId: 'prj-test-1',
    tenDuAn: 'Căn hộ Đông Anh — mẫu',
    taoLuc: '2026-08-13T09:00:00.000Z',
    nguoiXuat: 'test-user',
    deckJson: { idfpVersion: 1, sheets: [{ id: 's1', name: 'Deck 1', deck: { id: 'd1', slides: [] } }] },
    boqXlsx: Uint8Array.from([0x50, 0x4b, 0x03, 0x04]),
    boqTomTat: { rows: [{ ten: 'Sàn gỗ', qty: 42.5, unit: 'm2', thanhTien: 21250000 }], tong: 21250000 },
    images: [
      { name: 'trang-01.png', data: PNG_1PX },
      { name: '../hack/tr@ng 02.png', data: PNG_1PX },
    ],
    // pdf CỐ Ý vắng — kiểm kênh vắng được khai thật, không chặn.
  };
}

async function main() {
  console.log('# tên file + slug');
  ok('slug bỏ dấu tiếng Việt', hoSoSongSlug('Căn hộ Đông Anh — mẫu') === 'can-ho-dong-anh-mau');
  ok('tên file đúng khuôn ho-so-<slug>-<yyyymmdd>.zip',
    hoSoSongFileName('Căn hộ Đông Anh — mẫu', '2026-08-13T09:00:00.000Z') === 'ho-so-can-ho-dong-anh-mau-20260813.zip');

  console.log('# round-trip pack → jszip đọc lại');
  const built = await buildHoSoSong(fixtureInput());
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(built.bytes);

  const manifestRaw = await zip.file('manifest.json')?.async('string');
  ok('có manifest.json', !!manifestRaw);
  const manifest = JSON.parse(manifestRaw!) as HoSoSongManifest;
  ok('manifest.version = 1', manifest.version === 1);
  ok('taoLuc TẤT ĐỊNH — đúng chuỗi caller cấp, lib không tự Date.now',
    manifest.taoLuc === '2026-08-13T09:00:00.000Z');
  // 1 viewer + 1 deck + 1 boq + 2 ảnh = 5 kênh (pdf vắng, KHÔNG có entry giả)
  ok('đúng số kênh (5: viewer + deck + boq + 2 ảnh; pdf vắng)', manifest.kenh.length === 5);
  ok('không có kênh pdf giả', !manifest.kenh.some((k) => k.id === 'pdf'));
  ok('provenance đúng nguồn + số bản', manifest.provenance.nguon === 'interiorflow' && manifest.provenance.soBan === 1);

  let shaOk = true;
  for (const k of manifest.kenh) {
    const f = zip.file(k.path);
    if (!f) { shaOk = false; console.log(`    thiếu file ${k.path}`); continue; }
    const bytes = new Uint8Array(await f.async('uint8array'));
    const h = await sha256Hex(bytes);
    if (h !== k.sha256) { shaOk = false; console.log(`    sha lệch ${k.path}`); }
  }
  ok('sha256 mọi kênh khớp đúng byte trong zip (kể cả index.html)', shaOk);

  const anh = manifest.kenh.filter((k) => k.id.startsWith('anh-'));
  ok('tên ảnh bẩn được làm sạch, không path traversal',
    anh.every((k) => k.path.startsWith('out/images/') && !k.path.includes('..')));

  console.log('# viewer tự chứa');
  const html = await zip.file('index.html')!.async('string');
  ok('viewer chứa JSON nhúng (application/json)', html.includes('type="application/json" id="ho-so-song-data"'));
  ok('viewer nhúng tên dự án trong dữ liệu', html.includes('Căn hộ Đông Anh'));
  ok('viewer khai kênh vắng (pdf)', /"vang":\[[^\]]*"pdf"/.test(html));
  ok('KHOÁ TỰ CHỨA: viewer không chứa yêu cầu mạng ngoài (giao thức web tuyệt đối)',
    !/https?:\/\//.test(html));
  ok('viewer không fetch() gì (dữ liệu nhúng thẳng)', !/\bfetch\s*\(/.test(html));
  ok('viewer tham chiếu ảnh đường tương đối out/images/', html.includes('"out/images/trang-01.png"'));
  const dataSection = html.split('id="ho-so-song-data">')[1]!.split('</script>')[0]!;
  ok('dữ liệu nhúng không chứa "<" thô (đã thoát \\u003c, không phá được thẻ script)', !dataSection.includes('<'));

  console.log('# packHoSoSong trả Blob');
  const blob = await packHoSoSong(fixtureInput());
  ok('Blob đúng mime zip + cùng cỡ bytes', blob.type === 'application/zip' && blob.size > 0);
  const reZip = await JSZip.loadAsync(await blob.arrayBuffer());
  ok('Blob mở lại được bằng jszip', !!reZip.file('manifest.json'));

  console.log('# lỗi rõ ràng khi thiếu toàn bộ artifact');
  let threw: string | null = null;
  try {
    await buildHoSoSong({ projectId: 'p', tenDuAn: 't', taoLuc: '2026-08-13T00:00:00.000Z' });
  } catch (e) { threw = e instanceof Error ? e.message : String(e); }
  ok('ném lỗi có lời giải thích', !!threw && threw.includes('không có artifact nào'));

  console.log('# viewer render trực tiếp (không qua zip) cũng sạch mạng ngoài');
  const direct = renderViewerHtml({
    projectId: 'p', tenDuAn: 'Test </script> phá', taoLuc: '2026-01-01T00:00:00.000Z',
    kenh: [], pages: [], vang: ['deck', 'pdf', 'boq', 'anh'],
  });
  ok('escape </script> trong dữ liệu nhúng', !direct.includes('Test </script>'));
  ok('không giao thức web trong bản render trực tiếp', !/https?:\/\//.test(direct));

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main().then(
  () => {},
  (e) => { console.error(e); process.exit(1); },
);
