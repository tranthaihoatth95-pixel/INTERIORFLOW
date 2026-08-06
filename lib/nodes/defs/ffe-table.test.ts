/**
 * lib/nodes/defs/ffe-table.test.ts — khối "Bảng món" (`util.ffetable`), C2 / G-M3-01+02.
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/defs/ffe-table.test.ts
 *
 * Thứ file này khoá:
 *  · nối N lượt bốc tách/đo lại thành MỘT bảng N món (đúng cái người dùng đang phải gõ tay);
 *  · chạy lại cùng một khối KHÔNG đẻ dòng trùng (id khoá theo nodeId);
 *  · số lượng gõ bậy thì BÁO LỖI, không âm thầm thành 1 (đoán số lượng = đoán tiền);
 *  · khối được xếp đúng nhóm quy trình và tìm được bằng tiếng Việt ở ⌘K.
 */
import { ffeTableNodes } from './ffe-table';
import { decodeFfeTablePort, encodeFfeTablePort, emptyFfeTable } from '../../ffe/port';
import { makeFfeItem } from '../../ffe/item';
import { groupOf } from '../groups';
import { nodeMatches } from '../search';
import type { ExecContext, PortValue } from '../../types';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const def = ffeTableNodes[0];

// sucrase-node biên dịch ra CommonJS ⇒ KHÔNG có top-level await; bọc trong main() như
// `lib/materials/warehouse/xlsx-parse.test.ts` đã làm.
async function main() {

  function ctx(params: Record<string, string | number>, inputs: Record<string, PortValue | undefined> = {}, nodeId = 'n1'): ExecContext {
    return { nodeId, inputs, params, onProgress: () => {}, aiTier: 1 as ExecContext['aiTier'] };
  }

  /** JSON đúng hình dạng cổng `measurement` của `vision.measureobject` (xem metrology.ts). */
  const MEASUREMENT_JSON = JSON.stringify({
    tier: 2,
    tierLabel: 'Bậc 2 — tỉ lệ khung bao mặt nạ (Ghế lounge)',
    confidencePercent: 65,
    width: { valueMm: 782.4, toleranceMm: 150, kind: 'measured', basis: 'x' },
    depth: { valueMm: 815.2, toleranceMm: 200, kind: 'inferred', basis: 'y' },
    height: { valueMm: 720, toleranceMm: 80, kind: 'measured', basis: 'z' },
    aiTier: 1,
    warnings: [],
  });

  // ── [0] Khai báo khối ─────────────────────────────────────────────────────────────────────
  {
    ok('type là util.ffetable', def.type === 'util.ffetable');
    ok('có cổng RA kiểu table', def.outputs.some((o) => o.id === 'table' && o.dataType === 'table'));
    ok('có cổng VÀO kiểu table (nối tiếp để cộng dồn)', def.inputs.some((i) => i.id === 'table' && i.dataType === 'table'));
    ok('nhận được cổng measurement của khối đo (text)', def.inputs.some((i) => i.id === 'measurement' && i.dataType === 'text'));
    ok('nhận được ảnh cutout của khối tách nội thất', def.inputs.some((i) => i.id === 'cutout' && i.dataType === 'image'));
    ok('có tên tiếng Anh cho tooltip', typeof def.titleEn === 'string' && def.titleEn.length > 0);
    ok('không tính phí (chạy cục bộ)', def.creditCost === 0);
    // Luật §9 "cấm nút giả": giới hạn 1 món/lượt phải nằm ở chỗ NGƯỜI DÙNG ĐỌC, không chỉ trong comment.
    ok('mô tả nói thẳng giới hạn 1 món/lượt', /1 món mỗi lượt/.test(def.description));
    ok('xếp đúng nhóm ⑥ Hồ sơ', groupOf('util.ffetable') === 'doc');
    ok('tìm được bằng "bảng món"', nodeMatches(def, 'bảng món'));
    ok('tìm được khi gõ không dấu "danh sach do"', nodeMatches(def, 'danh sach do'));
    ok('tìm được bằng thuật ngữ ngành "ff&e"', nodeMatches(def, 'ff&e'));
  }

  // ── [1] Một lượt đo → một dòng món có đủ số ───────────────────────────────────────────────
  {
    const out = await def.execute(ctx(
      { name: 'Ghế lounge Volumen', qty: '4', unit: 'cái', room: 'Phòng khách', sku: 'GHE-01', materials: 'gỗ sồi, vải lanh', colorHex: 'C79A63' },
      { measurement: { dataType: 'text', value: MEASUREMENT_JSON }, cutout: { dataType: 'image', value: 'data:image/png;base64,AAA' } },
    ));
    ok('cổng ra khai đúng dataType table', out.table.dataType === 'table');
    const t = decodeFfeTablePort(out.table.value);
    ok('ra đúng 1 món', t.items.length === 1);
    const it = t.items[0];
    ok('giữ tên', it.name === 'Ghế lounge Volumen');
    ok('số lượng đọc đúng, làm tròn vì đơn vị đếm', it.qty === 4);
    ok('giữ phòng', it.room === 'Phòng khách');
    ok('lấy 3 chiều từ JSON đo (làm tròn mm)', it.w === 782 && it.d === 815 && it.hUp === 720);
    ok('mức tin = mức YẾU NHẤT trong 3 chiều (có 1 chiều suy ⇒ suy)', it.confidence === 'inferred');
    ok('ghi rõ căn cứ mức tin', /Bậc 2/.test(it.confidenceBasis ?? ''));
    ok('tách vật liệu thành mảng', JSON.stringify(it.materials) === JSON.stringify(['gỗ sồi', 'vải lanh']));
    ok('chuẩn hoá mã màu về #rrggbb thường', it.colorHex === '#c79a63');
    ok('gắn ảnh cutout', it.imageUrl === 'data:image/png;base64,AAA');
    ok("nguồn là 'vision' vì có số đo/ảnh từ máy", it.source === 'vision');
    ok('cổng tóm tắt nói đúng số món', String(out.summary.value).includes('1 món'));
  }

  // ── [2] NỐI TIẾP N khối = bảng N món (đúng việc G-M3-01 đang thiếu) ───────────────────────
  {
    const a = await def.execute(ctx({ name: 'Ghế', qty: '4', unit: 'cái', room: 'Khách', label: 'FF&E — Tầng 2' }, {}, 'nA'));
    const b = await def.execute(ctx({ name: 'Bàn trà', qty: '1', unit: 'cái', room: 'Khách' }, { table: a.table }, 'nB'));
    const c = await def.execute(ctx({ name: 'Đèn sàn', qty: '2', unit: 'cái', room: 'Ngủ 1' }, { table: b.table }, 'nC'));
    const t = decodeFfeTablePort(c.table.value);
    ok('3 khối nối tiếp ⇒ bảng 3 món', t.items.length === 3);
    ok('giữ đúng thứ tự nối', t.items.map((i) => i.name).join('|') === 'Ghế|Bàn trà|Đèn sàn');
    ok('id bảng giữ nguyên suốt chuỗi', t.id === decodeFfeTablePort(a.table.value).id);
    ok('nhãn bảng do khối đầu đặt vẫn còn', t.label === 'FF&E — Tầng 2');
    ok('tóm tắt đếm đúng 3 món · 2 phòng', String(c.summary.value).includes('3 món') && String(c.summary.value).includes('2 phòng'));
  }

  // ── [3] Chạy lại cùng khối KHÔNG đẻ dòng trùng ────────────────────────────────────────────
  {
    const first = await def.execute(ctx({ name: 'Ghế', qty: '2' }, {}, 'nX'));
    // lần 2: cùng nodeId, và bảng vào chính là bảng ra lần trước (ca người dùng bấm ▶ lại)
    const again = await def.execute(ctx({ name: 'Ghế', qty: '3' }, { table: first.table }, 'nX'));
    const t = decodeFfeTablePort(again.table.value);
    ok('chạy lại cùng khối vẫn 1 dòng, không nhân đôi', t.items.length === 1);
    ok('dòng được cập nhật theo giá trị mới nhất', t.items[0].qty === 3);
  }

  // ── [4] Số lượng gõ bậy ⇒ BÁO LỖI, không âm thầm thành 1 ──────────────────────────────────
  {
    let msg = '';
    try {
      await def.execute(ctx({ name: 'Ghế', qty: 'khoảng chục cái' }));
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    ok('số lượng không đọc được → ném lỗi rõ', /không đọc được thành số/.test(msg));
    ok('lỗi có nhắc lại đúng thứ người dùng gõ', msg.includes('khoảng chục cái'));
  }

  // ── [5] Thiếu dữ liệu thì SUY, không CHẶN (luật X4) ───────────────────────────────────────
  {
    const out = await def.execute(ctx({}, { table: { dataType: 'table', value: encodeFfeTablePort({ ...emptyFfeTable(), items: [makeFfeItem({ name: 'A', source: 'manual' })] }) } }));
    const t = decodeFfeTablePort(out.table.value);
    ok('không khai gì vẫn tạo được món (không chặn)', t.items.length === 2);
    ok('tên trống ⇒ đặt tạm theo thứ tự, nhìn là biết còn thiếu', t.items[1].name === 'Món 2');
    ok('số lượng mặc định 1', t.items[1].qty === 1);
    ok('đơn vị mặc định là đơn vị ĐẾM (cái), không phải m²', t.items[1].unit === 'cai');
    ok("không số đo/ảnh ⇒ nguồn 'manual'", t.items[1].source === 'manual');
  }

  // ── [6] Bảng vào hỏng không làm chết lượt chạy ────────────────────────────────────────────
  {
    let threw = false;
    let n = -1;
    try {
      const out = await def.execute(ctx({ name: 'Ghế' }, { table: { dataType: 'table', value: 'rác không phải JSON' } }));
      n = decodeFfeTablePort(out.table.value).items.length;
    } catch { threw = true; }
    ok('bảng vào hỏng → vẫn chạy, bắt đầu bảng mới 1 món', !threw && n === 1);
  }


  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
