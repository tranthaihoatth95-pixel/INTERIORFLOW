/**
 * scripts/measure-upscale-dpi.ts — ĐO THẬT ai.upscale (fal-ai/esrgan ×4) cho P3 phần 2
 * (`docs/NGHIEN-CUU-PRESENT-VS-DOI-THU-2026-08-01.md` §3.1, quyết định Hoà 01/08).
 *
 * KHÔNG chạy được trong sandbox — cần FAL_KEY thật + tốn credit thật (~2 job × 2cr = ~4cr,
 * đúng creditCost của node `ai.upscale`, registry.ts:671). Hoà chạy trên máy thật:
 *
 *   node_modules/.bin/sucrase-node scripts/measure-upscale-dpi.ts
 *
 * Đo 2 việc CHƯA có số thật trong code (chỉ có typicalMs ước tính ở models.ts):
 *   1. Thời gian THẬT 1 lần gọi ESRGAN ×4 (từ submit tới COMPLETED).
 *   2. Trần độ phân giải THẬT ảnh trả về (parse PNG IHDR đo px thật, không suy đoán) → suy
 *      dpi đạt được trên A3 (420×297mm)/A4 (297×210mm) NẾU ảnh tràn hết bề ngang khổ giấy.
 *
 * Ảnh test: PNG gradient TỰ SINH TRONG SCRIPT (512px và 896px, không tải từ đâu cả) — không
 * dùng ảnh render/dự án thật nào, đúng LUẬT TRUNG TÍNH (0 nội dung thật, 0 phụ thuộc mạng cho
 * INPUT — chỉ fal.ai mới cần mạng, để chạy job thật).
 *
 * Exit code: 0 ok · 2 no-key · 1 lỗi khác (khớp quy ước scripts/probe-fal.ts).
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import type { submitJob as SubmitJobFn, jobStatus as JobStatusFn } from '../lib/ai/providers/fal';

/** Nạp env kiểu .env đơn giản — CÙNG CÁCH scripts/probe-fal.ts, không thêm dependency. */
function loadEnvFile(file: string) {
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split('\n')) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}
loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

/* ---------- PNG tự sinh (gradient, 100% hư cấu, không tải từ đâu) ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}
/** PNG RGB gradient size×size — filter 0 (none) mỗi dòng, nội dung thuần suy từ toạ độ x/y. */
function makeTestPng(size: number): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB (không palette/alpha, đơn giản nhất)
  const ihdr = pngChunk('IHDR', ihdrData);
  const stride = 1 + size * 3;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // filter byte: none
    for (let x = 0; x < size; x++) {
      const p = rowStart + 1 + x * 3;
      raw[p] = Math.floor((x / size) * 255);
      raw[p + 1] = Math.floor((y / size) * 255);
      raw[p + 2] = 128;
    }
  }
  const idat = pngChunk('IDAT', zlib.deflateSync(raw));
  const iend = pngChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

/** Đọc width/height thật từ PNG IHDR (byte 16-23) — KHÔNG suy đoán, đọc đúng chuẩn PNG spec. */
function pngDimensions(buf: Buffer): { w: number; h: number } | null {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null; // không phải PNG
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/* ---------- Đo 1 lần gọi ESRGAN ×4 thật ---------- */

async function measureOne(label: string, sizePx: number, submitJob: typeof SubmitJobFn, jobStatus: typeof JobStatusFn) {
  console.log(`\n[${label}] ảnh test ${sizePx}×${sizePx}px (tự sinh, hư cấu) → fal-ai/esrgan scale=4`);
  const png = makeTestPng(sizePx);
  const dataUri = `data:image/png;base64,${png.toString('base64')}`;
  const t0 = Date.now();
  const requestId = await submitJob('fal-ai/esrgan', { image_url: dataUri, scale: 4 });
  console.log(`  submit OK (request ${requestId.slice(0, 8)}…) — poll tới khi xong…`);

  const POLL_MS = 2000;
  const TIMEOUT_MS = 120_000;
  for (;;) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const elapsed = Date.now() - t0;
    if (elapsed > TIMEOUT_MS) {
      console.log(`  ✗ timeout ${TIMEOUT_MS / 1000}s — job chưa xong.`);
      return null;
    }
    const s = await jobStatus('fal-ai/esrgan', requestId);
    if (s.status !== 'COMPLETED' && s.status !== 'FAILED') continue; // IN_QUEUE/IN_PROGRESS — poll tiếp
    if (s.status === 'FAILED') {
      console.log(`  ✗ FAILED: ${s.error}`);
      return null;
    }
    const totalMs = Date.now() - t0;
    const url: string = s.mediaUrls[0];
    console.log(`  ✓ COMPLETED sau ${(totalMs / 1000).toFixed(1)}s — tải ảnh đo kích thước thật…`);
    const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
    const dim = pngDimensions(bytes);
    if (!dim) {
      console.log(`  ⚠ ảnh trả về KHÔNG phải PNG (${bytes.length} bytes) — mở link đo tay: ${url}`);
      return { totalMs, w: null, h: null, url };
    }
    console.log(`  📐 kích thước thật: ${dim.w}×${dim.h}px (nguồn ${sizePx}px × scale 4 lý thuyết = ${sizePx * 4}px)`);
    const A3_W_IN = 420 / 25.4; // PAPER_SIZE_MM['a3-landscape'], lib/present-editor/stage-presets.ts
    const A4_W_IN = 297 / 25.4; // PAPER_SIZE_MM['a4-landscape']
    console.log(`  🧮 dpi NẾU ảnh tràn hết bề ngang A3 (420mm): ${(dim.w / A3_W_IN).toFixed(0)}dpi`);
    console.log(`  🧮 dpi NẾU ảnh tràn hết bề ngang A4 (297mm): ${(dim.w / A4_W_IN).toFixed(0)}dpi`);
    return { totalMs, w: dim.w, h: dim.h, url };
  }
}

async function main() {
  const { falConfigured, submitJob, jobStatus } = await import('../lib/ai/providers/fal');
  if (!falConfigured()) {
    console.log('○ [measure-upscale-dpi] CHƯA có FAL_KEY trong .env.local/.env — không đo được. Thêm key rồi chạy lại.');
    process.exit(2);
  }

  const results = [];
  results.push(await measureOne('ảnh 1 (512px, mô phỏng hero AI free-tier)', 512, submitJob, jobStatus));
  results.push(await measureOne('ảnh 2 (896px, mô phỏng hero fal.ai trả phí)', 896, submitJob, jobStatus));

  const ok = results.filter((r): r is NonNullable<typeof r> => r !== null);
  console.log(`\n=== TỔNG KẾT (${ok.length}/${results.length} job xong) ===`);
  if (ok.length) {
    const avgMs = ok.reduce((s, r) => s + r.totalMs, 0) / ok.length;
    console.log(`Thời gian trung bình/ảnh: ${(avgMs / 1000).toFixed(1)}s (models.ts ước tính 15s — so sánh với số thật này)`);
    console.log(`Chi phí đã dùng: ${ok.length} job × 2cr (creditCost ai.upscale, registry.ts:671) = ${ok.length * 2}cr`);
  }
  console.log('\n⚠️ CACHE: khi lên code thật (P3 phần 2), BẮT BUỘC cache kết quả upscale theo img id — không');
  console.log('   upscale lại cùng 1 ảnh mỗi lần xuất (Hoà yêu cầu 01/08). Đo này CHƯA đụng phần code đó.');
  process.exit(ok.length === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error('! [measure-upscale-dpi] crash:', e instanceof Error ? e.message : e);
  process.exit(1);
});
