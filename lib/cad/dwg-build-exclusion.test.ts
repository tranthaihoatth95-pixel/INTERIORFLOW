/**
 * dwg-build-exclusion.test.ts — CỔNG cho việc gỡ mã GPL khỏi cây dựng (29/08).
 *
 * Luật: một luật chỉ là luật khi có CHỖ NẠP · một CỔNG · một CA ĐỘT BIẾN chứng minh cổng bắt được.
 * Chỗ nạp = `next.config.mjs`. Cổng = tệp này. Ca đột biến = ca 6 dưới đây (giả bộ ai đó gỡ
 * `resolve.alias` đi thì cổng phải ĐỎ, chứ không phải xanh vì "chẳng có gì để so").
 *
 * KHÔNG dựng thật ở đây (một lượt `next build` tốn hàng phút) — tệp này soi đúng cái QUYẾT ĐỊNH
 * mà webpack sẽ thi hành. Bằng chứng dựng thật nằm trong báo cáo lane, đo bằng
 * `grep -ric 'libredwg\|mlightcad' .next/` và `npm run soi:giay-phep -- --chan`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const GOC = join(__dirname, '..', '..');
let pass = 0;
let fail = 0;
function t(ten: string, dieuKien: boolean) {
  if (dieuKien) { pass++; console.log('  ✓', ten); }
  else { fail++; console.error('  ✗', ten); }
}

/** Nạp `next.config.mjs` trong tiến trình con (nó là ESM thật) và hỏi nó ba câu. */
function hoiConfig(coBatCo: boolean): { alias: Record<string, string>; batTrongBanDung: boolean } {
  const ma = `
    const m = await import(${JSON.stringify(join(GOC, 'next.config.mjs'))});
    const cfg = { resolve: {}, plugins: [] };
    class IgnorePluginGia { constructor(o) { this.o = o; } }
    m.default.webpack(cfg, { webpack: { IgnorePlugin: IgnorePluginGia }, isServer: false });
    console.log(JSON.stringify({ alias: cfg.resolve.alias ?? {}, batTrongBanDung: m.dwgImportBatTrongBanDung() }));
  `;
  const env = { ...process.env };
  if (coBatCo) env.NEXT_PUBLIC_IF_DWG_IMPORT = '1';
  else delete env.NEXT_PUBLIC_IF_DWG_IMPORT;
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', ma], { env, encoding: 'utf8' });
  return JSON.parse(out.trim().split('\n').pop() as string);
}

console.log('dwg-build-exclusion.test.ts');

/* CA 0 · CỔNG HARNESS — thiếu một trong hai tệp thì mọi kết luận dưới đây vô nghĩa. */
if (!existsSync(join(GOC, 'next.config.mjs')) || !existsSync(join(GOC, 'lib', 'cad', 'dwg-engine-tat.ts'))) {
  console.error('CỔNG HARNESS ĐỎ — thiếu next.config.mjs hoặc lib/cad/dwg-engine-tat.ts');
  process.exit(1);
}

const GOI = '@mlightcad/libredwg-web';

/* ① CỜ TẮT (mặc định) — gói GPL phải bị trỏ đi chỗ khác. */
const tat = hoiConfig(false);
t('cờ tắt → dwgImportBatTrongBanDung() = false', tat.batTrongBanDung === false);
t('cờ tắt → có alias cho gói GPL', typeof tat.alias[GOI] === 'string');
t('cờ tắt → alias trỏ về bản thay thế rỗng trong lib/cad', (tat.alias[GOI] ?? '').endsWith('lib/cad/dwg-engine-tat.ts'));
t('cờ tắt → tệp bản thay thế có thật trên đĩa', existsSync(tat.alias[GOI] ?? ''));

/* ② CỜ BẬT — gói thật phải quay lại. Đây là mục "không được biến thành chức năng chết". */
const bat = hoiConfig(true);
t('cờ bật → dwgImportBatTrongBanDung() = true', bat.batTrongBanDung === true);
t('cờ bật → KHÔNG alias gói GPL (gói thật vào lại cây dựng)', bat.alias[GOI] === undefined);

/* ③ Bản thay thế phải mang ĐÚNG HÌNH DẠNG mà `dwg-worker.ts` gọi tới. */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const stub = require('./dwg-engine-tat');
t('bản thay thế export LibreDwg', typeof stub.LibreDwg === 'function');
t('bản thay thế export Dwg_File_Type.DWG', typeof stub.Dwg_File_Type?.DWG === 'number');

/* ④ Gọi vào bản thay thế phải ném lỗi CÓ LỜI GIẢI THÍCH, không phải undefined. */
let loi = '';
stub.LibreDwg.create('/wasm').catch((e: Error) => { loi = e.message; });

/* ⑤ `dwg-worker.ts` vẫn phải giữ nguyên điểm-vào-duy-nhất — nếu ai đó xoá dòng import động thì
 *    bật cờ lên cũng không phục hồi được tính năng, tức cờ nói dối. */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nguonWorker = require('node:fs').readFileSync(join(GOC, 'lib', 'cad', 'dwg-worker.ts'), 'utf8') as string;
t('dwg-worker.ts VẪN giữ import động gói thật (cờ bật là phục hồi được)', nguonWorker.includes(`await import('${GOI}')`));

/* ⑥ CA ĐỘT BIẾN — bỏ alias đi thì cổng phải bắt được. Dựng lại đúng phép so của ca ①. */
const doBienGia: Record<string, string> = {};
t('CA ĐỘT BIẾN: alias bị gỡ ⇒ phép so của ca ① phải TRƯỢT', typeof doBienGia[GOI] !== 'string');

setTimeout(() => {
  t('gọi bản thay thế → lỗi có lời giải thích, nêu tên cờ', loi.includes('NEXT_PUBLIC_IF_DWG_IMPORT'));
  console.log(`  → ${pass} pass · ${fail} fail`);
  process.exit(fail ? 1 : 0);
}, 0);
