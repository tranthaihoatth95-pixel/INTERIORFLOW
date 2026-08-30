/**
 * lib/cad/lineweight-iso.test.ts — KHOÁ DÃY BỀ DÀY NÉT theo ISO 128-24.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/lineweight-iso.test.ts
 *
 * VÌ SAO ĐÁNG KHOÁ: dãy nét bút của IF là TÀI SẢN CHUẨN QUỐC TẾ đã có sẵn trong app — khớp đúng
 * ISO 128-24 (dãy bề rộng nét, bước xấp xỉ √2). Không ai phải thiết kế lại; việc duy nhất là
 * TUYÊN BỐ và khoá, để không ai "làm tròn cho đẹp" rồi bản vẽ in ra sai cấp nét.
 *
 * ⚠️ ĐO ĐƯỢC, KHÔNG PHẢI KHẨU HIỆU — bước KHÔNG đúng √2 tuyệt đối:
 *     0.13→0.18 = 1.3846 (−2.09%)   0.35→0.50 = 1.4286 (+1.02%)
 *     0.18→0.25 = 1.3889 (−1.79%)   còn lại xen kẽ 1.4000 / 1.4286
 * ISO làm tròn √2 về số in được (2 chữ số có nghĩa), nên test KHÔNG khẳng định √2 chính xác —
 * khẳng định thế là sai và sẽ đỏ oan. Nó khoá: đúng 9 giá trị ISO, tăng dần, và mọi bước nằm
 * trong dung sai đã ĐO (≤2.1%) quanh √2.
 */
import assert from 'node:assert';
import { STANDARD_LINEWEIGHTS } from './model';
import { ISO_DRAFTING } from './standards/iso-drafting';

let n = 0;
function ok(ten: string, dieu: boolean) {
  n += 1;
  assert.ok(dieu, ten);
  console.log(`  ok  - ${ten}`);
}

/** Dãy bề rộng nét ISO 128-24 (mm). Viết TƯỜNG MINH ở đây làm mốc độc lập — nếu chép từ chính
 *  hằng số đang kiểm thì test tự khớp với mọi thay đổi và chẳng khoá được gì. */
const ISO_128_24 = [0.13, 0.18, 0.25, 0.35, 0.5, 0.7, 1.0, 1.4, 2.0];

ok('đúng 9 nấc như ISO 128-24', STANDARD_LINEWEIGHTS.length === ISO_128_24.length);
ok(
  'từng giá trị khớp ISO 128-24',
  ISO_128_24.every((v, i) => Math.abs(STANDARD_LINEWEIGHTS[i] - v) < 1e-9),
);
ok(
  'tăng dần nghiêm ngặt',
  STANDARD_LINEWEIGHTS.every((v, i) => i === 0 || v > STANDARD_LINEWEIGHTS[i - 1]),
);

const CAN2 = Math.SQRT2;
/** Dung sai lấy từ SỐ ĐO thật (lệch lớn nhất 2.09% ở bước 0.13→0.18), làm tròn lên 2.1%. */
const DUNG_SAI = 0.021;
const buoc = STANDARD_LINEWEIGHTS.slice(1).map((v, i) => v / STANDARD_LINEWEIGHTS[i]);
ok(
  `mọi bước nằm trong ±${(DUNG_SAI * 100).toFixed(1)}% quanh √2 (ISO làm tròn, không phải √2 đúng)`,
  buoc.every((r) => Math.abs(r - CAN2) / CAN2 <= DUNG_SAI),
);
ok('không bước nào đúng √2 tuyệt đối — đây là dãy ĐÃ LÀM TRÒN', buoc.every((r) => r !== CAN2));

/**
 * MỘT NGUỒN: rule `iso128-lineweight-set` chép lại 9 giá trị vào `params.lw0..lw8` thay vì import
 * hằng số. Hai bản khai cùng một sự thật thì sớm muộn lệch — khoá cho chúng phải bằng nhau.
 */
const rule = ISO_DRAFTING.rules.find((r) => r.id === 'iso128-lineweight-set');
ok('có rule iso128-lineweight-set', !!rule);
if (rule) {
  const tuRule = Object.keys(rule.params ?? {})
    .filter((k) => /^lw\d+$/.test(k))
    .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)))
    .map((k) => Number((rule.params as Record<string, number>)[k]));
  ok(
    'params của rule KHỚP STANDARD_LINEWEIGHTS (hai bản khai không được lệch)',
    tuRule.length === STANDARD_LINEWEIGHTS.length &&
      tuRule.every((v, i) => Math.abs(v - STANDARD_LINEWEIGHTS[i]) < 1e-9),
  );
}

console.log(`\n${n} ok, 0 fail`);
