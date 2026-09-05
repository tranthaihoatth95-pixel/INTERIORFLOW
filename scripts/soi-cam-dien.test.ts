/**
 * scripts/soi-cam-dien.test.ts — BÀI KIỂM HIỆU CHUẨN cho `soi:cam-dien`, phần MỞ RỘNG CHỦ THỂ
 * sang `components/` + `app/` (05/09).
 *
 * ─── VÌ SAO KHÔNG KHOÁ TÊN TỆP CỤ THỂ ─────────────────────────────────────────
 * Bản danh sách mồ côi là MỤC TIÊU DI ĐỘNG: năm làn đang chạy cùng cây, một tệp hôm nay mồ
 * côi mai được cắm là chuyện thường và ĐÚNG. Test khoá cứng tên tệp sẽ đỏ vì người khác làm
 * đúng việc — đó là test che, không phải test bảo vệ (luật 15/08, ca bug Hough).
 * ⇒ Test này khoá **BẤT BIẾN** + **TỰ TÍNH LẠI ĐỘC LẬP** câu trả lời của máy:
 *   ① với MỌI tệp máy khai là mồ côi, test tự đi tìm nơi gọi bằng một phép quét KHÁC (thô hơn,
 *      rộng hơn máy). Rộng hơn ⇒ chỉ bắt được BÁO OAN, không bao giờ đẻ báo thiếu. Máy nói
 *      "0 nơi gọi" mà phép quét thô tìm ra một chỗ ⇒ máy sai, test đỏ.
 *   ② các lớp KHÔNG BAO GIỜ được kêu (điểm vào Next · tệp test) phải vắng mặt tuyệt đối.
 *
 * ─── VÌ SAO CHẠY MÁY THẬT BẰNG SUBPROCESS ────────────────────────────────────
 * `soi-cam-dien.mjs` là script chạy-là-in, không xuất hàm. Chạy thật = kiểm ĐÚNG THỨ SẼ SHIP,
 * không kiểm một bản sao logic. `node --check` chỉ soi cú pháp: một làn trước đã để rơi mất
 * một tham số hàm mà `node --check` vẫn xanh, grep cũng mù, chỉ vỡ lúc chạy.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const chay = spawnSync('node', [join(ROOT, 'scripts', 'soi-cam-dien.mjs')], { encoding: 'utf8', cwd: ROOT });
assert.equal(chay.status, 0, `máy phải chạy được và exit 0 — stderr: ${chay.stderr?.slice(0, 400)}`);
const ra = chay.stdout;

/* ── ① MÁY CÓ THẬT SỰ COI `components/` LÀ CHỦ THỂ KHÔNG ────────────────────── */
const dongGoc = ra.match(/theo gốc: lib (\d+) · components (\d+) · app (\d+)/);
assert.ok(dongGoc, 'phải in dòng "theo gốc:" — nếu mất dòng này thì không ai đối chiếu được số');
const [, nLib, nComp, nApp] = dongGoc.map(Number) as unknown as [string, number, number, number];

/* ── ② LẤY DANH SÁCH MÁY KHAI ───────────────────────────────────────────────── */
const khaiMoCoi = [...ra.matchAll(/^ {2}📄 (\S+)/gm)].map((m) => m[1]);
assert.equal(khaiMoCoi.length, nLib + nComp + nApp, 'số dòng in phải khớp số đếm theo gốc');

/* ── ③ BẤT BIẾN: ĐIỂM VÀO KHUNG NEXT KHÔNG BAO GIỜ ĐƯỢC KÊU ─────────────────── */
const TEN_QUY_UOC = /\/(page|layout|template|loading|error|global-error|not-found|default|route|middleware|instrumentation|sitemap|robots|manifest|opengraph-image|twitter-image|icon|apple-icon)\.(ts|tsx|mjs)$/;
for (const t of khaiMoCoi) {
  if (!t.startsWith('app/')) continue;
  assert.ok(!TEN_QUY_UOC.test('/' + t.split('/').pop()),
    `BÁO QUÁ TAY: ${t} là điểm vào App Router — Next gọi theo TÊN TỆP, không qua import`);
}
assert.ok(/tha\s+\d+: điểm vào App Router/.test(ra), 'luật tha điểm-vào phải được IN kèm lý do, không lọc im lặng');

/* ── ④ BẤT BIẾN: TỆP TEST KHÔNG BAO GIỜ LÀ CHỦ THỂ ──────────────────────────── */
for (const t of khaiMoCoi) {
  assert.ok(!/\.(test|spec)\./.test(t), `BÁO QUÁ TAY: ${t} là bài kiểm, không phải nguyên thể`);
}

/* ── ⑤ BẪY TỰ GÂY: luật `icon` phải NEO VÀO `app/` ──────────────────────────── */
/* `app/icon.tsx` là tên quy ước của Next; `components/ui/Icon.tsx` thì KHÔNG. So tên trần
   toàn cây là tự bịt mắt ở đúng tệp primitive đang muốn soi. */
const nguon = readFileSync(join(ROOT, 'scripts', 'soi-cam-dien.mjs'), 'utf8');
assert.ok(/t\.startsWith\('app\/'\)\s*&&\s*TEN_QUY_UOC_APP\.has/.test(nguon),
  "luật điểm-vào phải neo vào `app/` — bỏ neo là `components/ui/Icon.tsx` bị tha oan");

/* ── ⑥ TỰ LOẠI TRỪ CHÍNH MÌNH ───────────────────────────────────────────────── */
/* Máy quét văn bản mà đọc chính docstring của nó thì tự cấp chứng chỉ cho tệp nó nhắc tên.
   04/09 hỏng đúng kiểu này ba lần trong một ngày. */
assert.ok(/TU_LOAI_TRU/.test(nguon) && /soi-cam-dien\.test\.ts/.test(nguon),
  'máy phải loại CHÍNH NÓ và bài kiểm của nó khỏi đồ thị người-gọi');
assert.ok(nguon.includes('TU_LOAI_TRU.has(tuTep)'), 'khai TU_LOAI_TRU mà không dùng thì bằng không');

/* ── ⑦ TỰ TÍNH LẠI ĐỘC LẬP — phép quét THÔ HƠN máy, chỉ bắt được BÁO OAN ───── */
const BO_QUA = new Set(['node_modules', '.next', '.git', 'dist', 'dist-installer', 'out', 'coverage', 'uploads', 'public']);
const DUOI = new Set(['.ts', '.tsx', '.mjs']);
function quet(d: string, ra: string[] = []): string[] {
  let ds: string[]; try { ds = readdirSync(d); } catch { return ra; }
  for (const ten of ds) {
    if (BO_QUA.has(ten) || ten.includes('worktree')) continue;
    const p = join(d, ten);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) quet(p, ra);
    else if (DUOI.has(extname(ten))) ra.push(relative(ROOT, p));
  }
  return ra;
}
const MOI_TEP = ['lib', 'app', 'components', 'electron', 'scripts'].flatMap((g) => quet(join(ROOT, g)));
const NOI = new Map<string, string>();
for (const t of MOI_TEP) { try { NOI.set(t, readFileSync(join(ROOT, t), 'utf8')); } catch { NOI.set(t, ''); } }

/** Đuôi đường dẫn mà một lệnh import trỏ tới tệp này sẽ chứa. Tệp `index.*` thì lấy TÊN THƯ MỤC. */
function duoiDuongDan(t: string): string {
  const bo = t.replace(/\.(ts|tsx|mjs)$/, '');
  return /\/index$/.test(bo) ? bo.replace(/\/index$/, '') : bo;
}
for (const t of khaiMoCoi) {
  if (t.startsWith('lib/')) continue;               // phần cũ, đã có bằng chứng riêng
  const duoi = duoiDuongDan(t);
  const doan = duoi.split('/');
  // Mẫu RỘNG: bất kỳ chuỗi import/dynamic-import nào KẾT THÚC bằng ≥2 đoạn cuối của đường dẫn.
  const hai = doan.slice(-2).join('/');
  const mau = new RegExp(String.raw`(?:from|import|require)\s*\(?\s*['"\`][^'"\`]*` + hai.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + String.raw`['"\`]`);
  for (const [tep, src] of NOI) {
    if (tep === t || /\.(test|spec)\./.test(tep) || tep === 'scripts/soi-cam-dien.mjs' || tep === 'scripts/soi-cam-dien.test.ts') continue;
    for (const dong of src.split('\n')) {
      if (/^\s*(\*|\/\/)/.test(dong)) continue;     // chú thích không phải lời gọi
      assert.ok(!mau.test(dong),
        `BÁO OAN: máy khai ${t} mồ côi, nhưng ${tep} có dòng gọi thật:\n    ${dong.trim().slice(0, 140)}`);
    }
  }
}

/* ── ⑧ MÁY PHẢI KHÔNG CHẶN (exit 0) khi chỉ có mồ côi ──────────────────────── */
assert.ok(/MỒ CÔI ≠ RÁC/.test(ra), 'phải in cảnh báo mồ-côi-không-phải-rác: máy CHỈ IN, không xoá, không sửa registry');

console.log(`✅ soi-cam-dien hiệu chuẩn: ${khaiMoCoi.length} mồ côi (lib ${nLib} · components ${nComp} · app ${nApp}) — 0 báo oan ở phần mở rộng`);
