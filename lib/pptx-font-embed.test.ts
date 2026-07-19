/**
 * lib/pptx-font-embed.test.ts — kiểm bộ đọc sfnt + cờ giấy phép + bộ dựng EOT. Chạy:
 *   node_modules/.bin/sucrase-node lib/pptx-font-embed.test.ts
 *
 * Dùng FONT THẬT của macOS ở /System/Library/Fonts/Supplemental (CHỈ ĐỌC) — parser font mà test
 * bằng dữ liệu tự bịa thì chỉ chứng minh được nó khớp với điều mình tưởng tượng.
 */
import { readFileSync, existsSync } from 'fs';
import {
  readSfntMeta,
  checkEmbeddingLicense,
  buildEot,
  prepareFontForEmbed,
  realFamilyName,
  FontEmbedError,
} from './pptx-font-embed';

let pass = 0;
let fail = 0;
const ok = (label: string, cond: boolean) => {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
};

const SYS = '/System/Library/Fonts/Supplemental';
const TTF = `${SYS}/Georgia.ttf`;
const OTF = `${SYS}/Silom.ttf`;

function toArrayBuffer(path: string): ArrayBuffer {
  const b = readFileSync(path);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

function u32le(b: Uint8Array, o: number): number {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}
function u16le(b: Uint8Array, o: number): number {
  return b[o] | (b[o + 1] << 8);
}

console.log('[1] readSfntMeta — đọc metadata từ font TrueType thật');
if (!existsSync(TTF)) {
  console.log(`  SKIP - không thấy ${TTF} (không phải macOS?)`);
} else {
  const buf = toArrayBuffer(TTF);
  const meta = readSfntMeta(buf);
  ok('lấy đúng tên họ "Georgia"', meta.familyName === 'Georgia');
  ok('weight nằm trong dải hợp lệ 1..1000', meta.weight >= 1 && meta.weight <= 1000);
  ok('PANOSE đúng 10 byte', meta.panose.length === 10);
  ok('checkSumAdjustment khác 0', meta.checkSumAdjustment !== 0);
  ok('có ít nhất 1 dải Unicode được đặt cờ', meta.unicodeRange.some((r) => r !== 0));

  console.log('[2] buildEot — cấu trúc header EOT version 1');
  const eot = buildEot(buf, meta);
  ok('EOTSize (4 byte đầu) = đúng tổng độ dài file', u32le(eot, 0) === eot.length);
  ok('FontDataSize = độ dài font gốc', u32le(eot, 4) === buf.byteLength);
  ok('Version = 0x00010000', u32le(eot, 8) === 0x00010000);
  ok('Flags = 0 (không nén, không MTX)', u32le(eot, 12) === 0);
  // MagicNumber nằm sau: 16(cố định) +10(PANOSE) +1 +1 +4(weight) +2(fsType) = offset 34.
  ok('MagicNumber = 0x504C', u16le(eot, 34) === 0x504c);
  ok('fsType trong header khớp fsType của font', u16le(eot, 32) === meta.fsType);
  ok('EOT dài hơn font gốc (có header)', eot.length > buf.byteLength);

  // Dữ liệu sfnt phải được nối NGUYÊN VẸN ở cuối — PowerPoint đọc phần này ra là font thật.
  const tail = eot.subarray(eot.length - buf.byteLength);
  const src = new Uint8Array(buf);
  let same = tail.length === src.length;
  for (let i = 0; same && i < src.length; i += 4093) same = tail[i] === src[i];
  ok('phần FontData ở cuối = byte font gốc, không đụng tới', same);
  ok('4 byte đầu FontData là signature sfnt', u32le(tail.subarray(0, 4), 0) === 0x00000100);
}

console.log('[3] checkEmbeddingLicense — cờ fsType (OS/2)');
{
  ok('0x0000 → installable, cho nhúng', checkEmbeddingLicense(0x0000).allowed === true);
  ok('0x0002 → restricted, CHẶN', checkEmbeddingLicense(0x0002).allowed === false);
  ok(
    '0x0002 báo đúng loại quyền',
    checkEmbeddingLicense(0x0002).permission === 'restricted',
  );
  ok('0x0004 → preview&print, cho nhúng', checkEmbeddingLicense(0x0004).allowed === true);
  ok('0x0008 → editable, cho nhúng', checkEmbeddingLicense(0x0008).allowed === true);
  // Restricted phải THẮNG dù có bit khác kèm theo — không được "thấy editable là cho qua".
  ok('0x000A (restricted + editable) vẫn CHẶN', checkEmbeddingLicense(0x000a).allowed === false);
  ok('bit cấm subset 0x0100 không ảnh hưởng', checkEmbeddingLicense(0x0100).allowed === true);
}

console.log('[4] Từ chối định dạng không nhúng được');
{
  const woff = 'data:font/woff;base64,' + Buffer.from('wOFFxxxxxxxxxxxx').toString('base64');
  let msg = '';
  try {
    prepareFontForEmbed(woff);
  } catch (e) {
    msg = e instanceof FontEmbedError ? e.message : `sai loại lỗi: ${String(e)}`;
  }
  ok('WOFF bị từ chối kèm lời giải thích tiếng Việt', msg.includes('WOFF'));

  let msg2 = '';
  try {
    prepareFontForEmbed('data:font/ttf;base64,' + Buffer.from('not a font at all').toString('base64'));
  } catch (e) {
    msg2 = e instanceof FontEmbedError ? e.message : '';
  }
  ok('rác không phải font bị từ chối', msg2.length > 0);
}

console.log('[5] prepareFontForEmbed / realFamilyName — LUÔN dùng tên họ THẬT, không phải bí danh app');
if (existsSync(TTF)) {
  const dataUrl = 'data:font/ttf;base64,' + readFileSync(TTF).toString('base64');
  const p = prepareFontForEmbed(dataUrl);
  // Bí danh app (vd "Georgia-0eht") KHÔNG được lọt vào XML: PowerPoint ghép font nhúng với chữ
  // bằng tên họ trong chính file font, ghi bí danh vào là font nhúng thành vô dụng.
  ok('typeface = tên họ thật trong font', p.typeface === 'Georgia');
  ok('dựng ra EOT hợp lệ', u32le(p.eot, 0) === p.eot.length);
  ok('realFamilyName đọc ra cùng tên', realFamilyName(dataUrl) === 'Georgia');
  ok('realFamilyName với rác → null', realFamilyName('data:font/ttf;base64,' + Buffer.from('rác').toString('base64')) === null);
}

if (existsSync(OTF)) {
  console.log('[6] Font thứ hai (kiểm parser không chỉ đúng với đúng một file)');
  const buf = toArrayBuffer(OTF);
  const meta = readSfntMeta(buf);
  ok('đọc được tên họ', meta.familyName.length > 0);
  const eot = buildEot(buf, meta);
  ok('EOTSize khớp', u32le(eot, 0) === eot.length);
  ok('MagicNumber đúng', u16le(eot, 34) === 0x504c);
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
