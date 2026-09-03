/**
 * Test giải mã server (sharp thật) + chạy trọn đường ĐO PIXEL trên ảnh mã hoá thật —
 * chạy: node_modules/.bin/sucrase-node lib/vision/decode-server.test.ts
 * Không mạng: chặn SSRF kiểm bằng hàm thuần; data-URI dựng bằng sharp ngay trong test.
 */
import sharp from 'sharp';
import { decodeImageSource, decodeToRgba, imageBytes, isPrivateHost, ImageDecodeError } from './decode-server';
import { pixelEvidence } from './image-spec';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

console.log('isPrivateHost — chặn nội bộ, cho công khai');
{
  ok('localhost', isPrivateHost('localhost'));
  ok('127.0.0.1', isPrivateHost('127.0.0.1'));
  ok('10.x', isPrivateHost('10.1.2.3'));
  ok('172.16-31', isPrivateHost('172.20.0.1') && !isPrivateHost('172.32.0.1'));
  ok('192.168', isPrivateHost('192.168.1.1'));
  ok('169.254', isPrivateHost('169.254.169.254'));
  ok('::1', isPrivateHost('[::1]'));
  ok('công khai qua', !isPrivateHost('images.example.com') && !isPrivateHost('8.8.8.8'));
}

(async () => {
  console.log('decode — PNG 1600×1000 (trên nâu, dưới xám) → RGBA thu ≤640, đo đúng');
  const w = 1600, h = 1000;
  const raw = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 3;
    if (y < h / 2) { raw[o] = 150; raw[o + 1] = 90; raw[o + 2] = 40; } else { raw[o] = 60; raw[o + 1] = 60; raw[o + 2] = 70; }
  }
  const png = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
  const dataUri = `data:image/png;base64,${png.toString('base64')}`;
  const img = await decodeImageSource(dataUri);
  ok('thu về cạnh dài 640', img.width === 640 && img.height === 400);
  ok('RGBA đủ byte', img.data.length === 640 * 400 * 4 && img.data[3] === 255);
  const fields = pixelEvidence(img, 'png-test');
  const by = new Map(fields.map((f) => [f.id, f]));
  ok('nhiệt màu ấm (nửa nâu)', by.get('anh-sang.nhiet-mau')!.value.startsWith('ấm'));
  ok('trên sáng hơn dưới', by.get('anh-sang.huong-sang')!.value.includes('trên'));
  const sw = by.get('bang-mau.chu-dao')!.data!.swatches as Array<{ hex: string }>;
  ok('bảng màu bắt được nâu + xám', sw.some((s) => s.hex === '#965a28') && sw.some((s) => s.hex === '#3c3c46'));

  console.log('decode — JPEG cũng đọc được; rác thì lỗi chữ rõ');
  const jpg = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg().toBuffer();
  const j = await decodeToRgba(jpg, 200);
  ok('jpeg thu 200', j.width === 200);
  let msg = '';
  try { await decodeToRgba(Buffer.from('không phải ảnh')); } catch (e) { msg = (e as Error).message; }
  ok('rác → ImageDecodeError', msg.includes('Không giải mã'));

  console.log('imageBytes — từ chối nguồn sai');
  const rej = async (src: string) => { try { await imageBytes(src); return ''; } catch (e) { return e instanceof ImageDecodeError ? (e as Error).message : 'sai loại lỗi'; } };
  ok('URL nội bộ bị chặn', (await rej('http://127.0.0.1:3000/a.png')).includes('nội bộ'));
  ok('ftp bị chặn', (await rej('ftp://x/a.png')).includes('http'));
  ok('chuỗi rác bị chặn', (await rej('abc')).includes('data-URI'));
  ok('data-URI rỗng bị chặn', (await rej('data:image/png;base64,')).includes('rỗng'));

  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
