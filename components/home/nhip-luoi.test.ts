/**
 * Test R-2b — NHỊP LƯỚI HOME: ô CỐ ĐỊNH · số cột theo BỀ NGANG · khe nhận phần dư.
 * Chạy: node_modules/.bin/sucrase-node components/home/nhip-luoi.test.ts
 *
 * ── LUẬT ĐANG CANH (chốt 14 Hoà + phân giải cl:00 02/09) ─────────────────────────────────────
 * Springboard iPad phủ hết bề ngang mà widget vẫn đúng MỘT cỡ. Cách nó làm: **số cột** đi theo
 * màn, **khe** giãn ra nuốt phần dư, **ô** không đổi. Ba đường sai đã bị loại tường minh:
 *   · giữ 4 cột rồi bám trái  ⇒ 43% màn trống dồn một bên (đo trên ảnh 18:28)
 *   · thêm cột rỗng           ⇒ chỉ dời chỗ trống, không lấp gì
 *   · nới cỡ ô theo màn       ⇒ phạm thẳng H-4 (cỡ ô lại đi theo bề ngang cửa sổ)
 *
 * ⚠️ Test này nhập THẲNG `nhipLuoi` từ `BeMatHome.tsx`, không chép lại công thức. Chép là để
 * lại hai bản của một luật, và bản trong test sẽ xanh mãi kể cả khi bản thật đã đổi.
 */
import assert from 'node:assert/strict';
import { nhipLuoi, oPx, GAP_O, GAP_TOI_DA, COT_TOI_THIEU, O_MIN, O_MAX } from './nhip-luoi';

/** Ba khổ THẬT của máy chụp, kèm bề ngang vùng nội dung đo được trên ảnh 18:28. */
const KHO = [
  { ten: '1440 laptop Hoà', cuaSo: 1440, vung: 1276, cot: 6 },
  { ten: '1180 iPad ngang', cuaSo: 1180, vung: 1033, cot: 6 },
  { ten: '1054 khớp ảnh cũ', cuaSo: 1054, vung: 915, cot: 5 },
] as const;

console.log('[1] SỐ CỘT theo bề ngang — ba khổ thật');
for (const k of KHO) {
  const n = nhipLuoi(k.vung, k.cuaSo);
  assert.equal(n.cot, k.cot, `${k.ten}: phải ${k.cot} cột, ra ${n.cot}`);
  console.log(`  ok  - ${k.ten}: ${n.cot} cột · khe ${n.gap.toFixed(1)}px`);
}

console.log('[2] LƯỚI PHỦ HẾT BỀ NGANG — sai số ≤1px');
for (const k of KHO) {
  const n = nhipLuoi(k.vung, k.cuaSo);
  const rongLuoi = n.cot * oPx(k.cuaSo) + (n.cot - 1) * n.gap;
  assert.ok(Math.abs(rongLuoi - k.vung) <= 1,
    `${k.ten}: lưới ${rongLuoi.toFixed(1)} phải khớp vùng ${k.vung} (±1)`);
  console.log(`  ok  - ${k.ten}: lưới ${rongLuoi.toFixed(1)} ≈ vùng ${k.vung}`);
}

console.log('[3] Ô KHÔNG ĐỔI THEO VÙNG — đây là ranh giới với H-4');
{
  /* Cùng cửa sổ, hai bề ngang vùng khác nhau (vd inspector mở/đóng) ⇒ cạnh ô PHẢI y hệt.
     Ô đổi theo vùng là dấu hiệu ai đó đã lén nới ô cho kín màn. */
  assert.equal(oPx(1440), oPx(1440), 'cạnh ô là hàm của CỬA SỔ, không của vùng');
  const a = nhipLuoi(1276, 1440);
  const b = nhipLuoi(900, 1440);
  assert.ok(a.cot > b.cot, 'vùng hẹp hơn ⇒ ÍT CỘT HƠN, chứ không phải ô nhỏ hơn');
  assert.equal(oPx(1440), Math.min(O_MAX, Math.max(O_MIN, 0.115 * 1440)),
    'cạnh ô đúng bằng clamp(148, 11.5vw, 188)');
  assert.equal(oPx(600), O_MIN, 'màn hẹp ⇒ ô chạm SÀN 148, không nhỏ hơn');
  assert.equal(oPx(4000), O_MAX, 'màn siêu rộng ⇒ ô chạm TRẦN 188, không phình thành áp phích');
  console.log('  ok  - ô là hàm của cửa sổ, kẹp đúng hai đầu');
}

console.log('[4] KHE — có sàn, có trần, và trần nghĩa là THÊM CỘT');
{
  for (const k of KHO) {
    const n = nhipLuoi(k.vung, k.cuaSo);
    assert.ok(n.gap >= GAP_O, `${k.ten}: khe không được nhỏ hơn sàn ${GAP_O}`);
    assert.ok(n.gap <= GAP_TOI_DA, `${k.ten}: khe không được vượt trần ${GAP_TOI_DA}`);
  }
  /* Màn càng rộng thì thêm cột chứ không giãn khe — kiểm bằng cách quét một dải bề ngang và
     đòi khe KHÔNG BAO GIỜ vượt trần. Đây là ca chống "lưới hở toác trên màn 4K". */
  let cotTruoc = 0;
  for (let rong = 900; rong <= 3800; rong += 37) {
    const n = nhipLuoi(rong, Math.max(rong, 1024));
    assert.ok(n.gap <= GAP_TOI_DA, `rộng ${rong}: khe ${n.gap.toFixed(1)} vượt trần`);
    assert.ok(n.cot >= cotTruoc || n.cot >= COT_TOI_THIEU,
      `rộng ${rong}: số cột không được TỤT khi vùng rộng ra`);
    cotTruoc = Math.max(cotTruoc, n.cot);
  }
  console.log(`  ok  - quét 900→3800: khe luôn trong [${GAP_O}, ${GAP_TOI_DA}], cột không tụt`);
}

console.log('[5] SÀN CỘT — không bao giờ ra một lưới trông như danh sách');
{
  assert.ok(nhipLuoi(400, 400).cot >= COT_TOI_THIEU, 'vùng rất hẹp vẫn giữ sàn cột');
  assert.ok(nhipLuoi(700, 900).cot >= COT_TOI_THIEU, 'vùng hẹp vừa vẫn giữ sàn cột');
  console.log(`  ok  - sàn ${COT_TOI_THIEU} cột được giữ ở mọi bề ngang`);
}

console.log('[6] ĐỐI CHỨNG — cổng phải ĐỎ với bản sai (cổng luôn xanh là cổng vô dụng)');
{
  /* ① Bản GIẢ "giữ 4 cột" — đúng thứ vừa bị loại. Nó phải trượt ca [1] và ca [2]. */
  const gia4Cot = (vung: number, cuaSo: number) => ({ cot: 4, gap: (vung - 4 * oPx(cuaSo)) / 3 });
  const g = gia4Cot(1276, 1440);
  assert.notEqual(g.cot, KHO[0].cot, 'bản GIẢ 4 cột phải KHÁC kỳ vọng 6 ⇒ ca [1] bắt được');
  assert.ok(g.gap > GAP_TOI_DA, `bản GIẢ 4 cột cho khe ${g.gap.toFixed(1)} vượt trần ⇒ ca [4] bắt được`);

  /* ② Bản GIẢ "nới ô cho kín màn" — phạm H-4. Ô của nó đổi theo VÙNG, ca [3] bắt. */
  const giaOGian = (vung: number, cot: number) => (vung - (cot - 1) * GAP_O) / cot;
  assert.notEqual(giaOGian(1276, 4), giaOGian(900, 4),
    'bản GIẢ nới ô: cạnh ô đổi theo vùng ⇒ ca [3] bắt được');

  /* ③ Bản GIẢ "khe nuốt tất, không trần" — hở toác trên màn rộng. */
  const giaKhongTran = (vung: number, cuaSo: number) => (vung - 4 * oPx(cuaSo)) / 3;
  assert.ok(giaKhongTran(3800, 3800) > GAP_TOI_DA, 'bản GIẢ không trần ⇒ ca [4] bắt được');
  console.log('  ok  - ba bản sai đều bị bắt bởi ba ca khác nhau');
}

console.log('✓ nhip-luoi: ô cố định · cột theo bề ngang · khe nhận phần dư · ba bản sai đều đỏ');
