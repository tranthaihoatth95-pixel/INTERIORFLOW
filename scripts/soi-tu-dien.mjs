#!/usr/bin/env node
/**
 * scripts/soi-tu-dien.mjs — CHỐNG LỆCH ĐỊNH NGHĨA (Hoà đặt cơ chế 12/08: "từ ngữ không theo
 * chuẩn chung khiến ngữ nghĩa thay đổi, ảnh hưởng chất lượng và định hướng sản phẩm").
 *
 * Cùng họ soi-frontier/soi-hinh-hoc: TU_DIEN dưới đây là danh sách TỪ ĐÃ CHỐT ↔ từ lỗi thời/
 * cấm; script grep code UI + mock, BÁO chỗ dùng sai. Chế độ báo cáo (exit 0), `--strict` exit 1.
 * Nguồn chuẩn: SPEC-NGON-NGU-CHI-DAN §6 + các chốt tên trong 00-CHOT (vòng cuối 07/08 + 11/08).
 * THÊM TỪ MỚI = thêm 1 entry lúc CHỐT TÊN — cùng kỷ luật với frontier-registry.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const STRICT = process.argv.includes('--strict');

/** mau = regex bắt CHUỖI HIỂN THỊ sai (bọc quote/tag để né văn xuôi thường); pham_vi = dirs quét */
const TU_DIEN = [
  { sai: "'Trình bày'|\"Trình bày\"|>Trình bày<", dung: 'Trình chiếu (tên chặng — chốt vòng cuối 07/08)', pham_vi: ['components', 'docs/mocks'] },
  { sai: "'2D Kỹ thuật'|\"2D Kỹ thuật\"|>2D Kỹ thuật<", dung: 'Thiết kế 2D (chốt 07/08)', pham_vi: ['components'] },
  { sai: "'3D Thiết kế'|\"3D Thiết kế\"|>3D Thiết kế<", dung: 'Thiết kế 3D (chốt 07/08)', pham_vi: ['components'] },
  { sai: 'Thẻ gu|thẻ gu', dung: 'Thẻ DNA Thiết kế / Design DNA Card (chốt 11/08)', pham_vi: ['components', 'docs/mocks'] },
  { sai: "'tự động'|\"tự động\"|>[Tt]ự động<", dung: 'Magic ✨ (CHOT-TACH-AI: cấm chữ "tự động" trong UI)', pham_vi: ['components'] },
  { sai: "'Thẻ gu'|GuCard", dung: 'DnaCard (khoá code — hợp nhất Design DNA)', pham_vi: ['lib'] },
];

const EXT = new Set(['.ts', '.tsx', '.html', '.css']);
const SKIP = new Set(['node_modules', '.next', '.worktrees', '.git']);
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (EXT.has(name.slice(name.lastIndexOf('.')))) yield p;
  }
}

let total = 0;
console.log('\nSOI TỪ ĐIỂN — chống lệch định nghĩa ' + new Date().toISOString().slice(0, 10));
console.log('─'.repeat(96));
for (const t of TU_DIEN) {
  const re = new RegExp(t.sai, 'g');
  const hits = [];
  for (const d of t.pham_vi) {
    const dir = join(ROOT, d);
    if (!existsSync(dir)) continue;
    for (const f of walk(dir)) {
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => { if (re.test(line)) { hits.push(`${f.replace(ROOT, '')}:${i + 1}`); re.lastIndex = 0; } });
    }
  }
  if (hits.length) {
    total += hits.length;
    console.log(`🔴 ${hits.length}× dùng sai → ĐÚNG là: ${t.dung}`);
    hits.slice(0, 5).forEach((h) => console.log(`     ${h}`));
    if (hits.length > 5) console.log(`     … +${hits.length - 5} chỗ nữa`);
  }
}
console.log('─'.repeat(96));
console.log(total ? `🔴 ${total} chỗ lệch định nghĩa — sửa khi chạm file, chỗ nhãn hiển thị sửa NGAY\n` : '✅ 0 lệch định nghĩa\n');
process.exit(STRICT && total ? 1 : 0);
