/**
 * scripts/cad-library/verify-library.ts — KIỂM CHỨNG thư viện block vừa sinh.
 *
 * Đọc lại `public/cad-library/manifest.json`, với mỗi block: parse file .dxf bằng
 * `lib/cad/dxf.ts` (parser thật của app, KHÔNG sửa) và kiểm tra parse ra ít nhất 1 entity,
 * không rơi vào entity lạ (mọi Prim của ta chỉ dùng LINE/LWPOLYLINE/CIRCLE/ARC nên phải khớp
 * 100%). Cũng đối chiếu số entity kỳ vọng (đếm từ blocks-data) với số entity parse được.
 *
 * Chạy: npx tsx scripts/cad-library/verify-library.ts
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseDxf } from '../../lib/cad/dxf';
import { LIB_BLOCKS } from './blocks-data';

const OUT_DIR = path.resolve(__dirname, '../../public/cad-library');

function main() {
  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const expectedById = new Map(LIB_BLOCKS.map((b) => [b.id, b.prims.length]));

  let ok = 0;
  let fail = 0;
  const failures: string[] = [];

  for (const b of manifest.blocks as { id: string; file: string }[]) {
    const filePath = path.join(process.cwd(), 'public', b.file.replace(/^\/cad-library\//, 'cad-library/'));
    const text = readFileSync(filePath, 'utf-8');
    let doc;
    try {
      doc = parseDxf(text);
    } catch (err) {
      fail++;
      failures.push(`${b.id}: THROW ${(err as Error).message}`);
      continue;
    }
    const expected = expectedById.get(b.id) ?? -1;
    if (doc.entities.length === 0) {
      fail++;
      failures.push(`${b.id}: 0 entity parse được (file rỗng/lỗi)`);
      continue;
    }
    if (expected !== -1 && doc.entities.length !== expected) {
      fail++;
      failures.push(`${b.id}: mong ${expected} entity, parse được ${doc.entities.length}`);
      continue;
    }
    ok++;
  }

  console.log(`OK: ${ok}/${manifest.blocks.length}`);
  if (failures.length) {
    console.log('LỖI:');
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exitCode = 1;
  } else {
    console.log('Tất cả block DXF parse lại đúng 100% bằng lib/cad/dxf.ts.');
  }
}

main();
