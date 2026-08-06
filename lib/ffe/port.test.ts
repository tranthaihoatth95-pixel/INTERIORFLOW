/**
 * lib/ffe/port.test.ts — cổng dữ liệu kiểu 'table' (C1, G-M3-02).
 * Chạy: node_modules/.bin/sucrase-node lib/ffe/port.test.ts
 *
 * Thứ file này khoá: một BẢNG N MÓN đi qua dây nối (chuỗi `PortValue.value`) rồi quay về phải
 * còn NGUYÊN — và chuỗi hỏng phải rơi về bảng rỗng chứ KHÔNG ném lỗi giữa lượt chạy (một dây
 * chuyền 5 khối chết vì 1 ký tự JSON hỏng = mất luôn 4 lượt gọi mô hình đã trả tiền).
 */
import { DATA_TYPE_COLORS } from '../types';
import { makeFfeItem, __resetFfeIdSeq, type FfeTable } from './item';
import {
  FFE_TABLE_DATA_TYPE, decodeFfeTablePort, emptyFfeTable, encodeFfeTablePort, ffeTableSummary, mergeFfeTables,
} from './port';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

__resetFfeIdSeq();

// ── [1] Kiểu 'table' có mặt ĐỦ ở mọi bảng tra theo DataType ───────────────────────────────
{
  ok("FFE_TABLE_DATA_TYPE là 'table'", FFE_TABLE_DATA_TYPE === 'table');
  ok('DATA_TYPE_COLORS có màu cho table', typeof DATA_TYPE_COLORS.table === 'string' && DATA_TYPE_COLORS.table.startsWith('#'));
  // KHÔNG chế màu mới: giá trị phải trùng token --accent-warm đã có ở app/globals.css.
  ok('màu table = token --accent-warm có sẵn (#c79a63)', DATA_TYPE_COLORS.table === '#c79a63');
  const others = Object.entries(DATA_TYPE_COLORS).filter(([k]) => k !== 'table').map(([, v]) => v);
  ok('màu table không trùng 5 màu port cũ', !others.includes(DATA_TYPE_COLORS.table));
}

// ── [2] Đi qua dây rồi về phải còn nguyên ─────────────────────────────────────────────────
{
  const table: FfeTable = {
    id: 'ffetab_x',
    label: 'FF&E — Tầng 2',
    sourceRef: 'img_01',
    items: [
      makeFfeItem({ name: 'Ghế lounge', qty: 4, unit: 'cái', room: 'Phòng khách', w: 780, d: 820, hUp: 720, confidence: 'inferred', source: 'vision' }),
      makeFfeItem({ name: 'Bàn trà', qty: 1, unit: 'cái', room: 'Phòng khách', priceVnd: 4500000, source: 'manual' }),
    ],
  };
  const wire = encodeFfeTablePort(table);
  ok('mã hoá ra CHUỖI (PortValue.value chỉ nhận string|number)', typeof wire === 'string');
  const back = decodeFfeTablePort(wire);
  ok('giữ đúng id bảng', back.id === 'ffetab_x');
  ok('giữ đúng nhãn', back.label === 'FF&E — Tầng 2');
  ok('giữ đủ 2 món', back.items.length === 2);
  ok('giữ số lượng + đơn vị', back.items[0].qty === 4 && back.items[0].unit === 'cái');
  ok('giữ phòng', back.items[0].room === 'Phòng khách');
  ok('giữ 3 chiều', back.items[0].w === 780 && back.items[0].d === 820 && back.items[0].hUp === 720);
  ok('giữ mức tin cậy', back.items[0].confidence === 'inferred');
  ok('giữ giá', back.items[1].priceVnd === 4500000);
  ok('giữ nguồn ảnh', back.sourceRef === 'img_01');
}

// ── [3] Đầu vào hỏng KHÔNG được ném lỗi ───────────────────────────────────────────────────
{
  const cases: [string, unknown][] = [
    ['chuỗi rỗng', ''],
    ['không phải JSON', 'ghế lounge x4'],
    ['JSON nhưng không phải bảng', '{"foo":1}'],
    ['số', 42],
    ['undefined', undefined],
    ['mảng trần', '[1,2,3]'],
  ];
  for (const [label, raw] of cases) {
    let threw = false;
    let items = -1;
    try { items = decodeFfeTablePort(raw).items.length; } catch { threw = true; }
    ok(`${label} → không ném lỗi, ra bảng rỗng`, !threw && items === 0);
  }
  // dòng rác trong items bị lọc, KHÔNG biến thành dòng báo giá "undefined"
  const dirty = decodeFfeTablePort('{"id":"t","items":[{"name":"Ghế","qty":2,"unit":"cái"},null,{"qty":9},"rác"]}');
  ok('lọc dòng rác, giữ đúng dòng có tên', dirty.items.length === 1 && dirty.items[0].name === 'Ghế');
  // JSON trần của FfeTable (không có phong bì) vẫn đọc được
  ok('đọc được JSON trần không phong bì', dirty.id === 't');
}

// ── [4] Gộp bảng — trùng id giữ bản đầu, KHÔNG tự cộng số lượng ───────────────────────────
{
  const a: FfeTable = { id: 'a', items: [makeFfeItem({ id: 'ffe_1', name: 'Ghế', qty: 2, source: 'manual' })] };
  const b: FfeTable = {
    id: 'b',
    label: 'Bảng B',
    items: [
      makeFfeItem({ id: 'ffe_1', name: 'Ghế', qty: 5, source: 'manual' }), // trùng id
      makeFfeItem({ id: 'ffe_2', name: 'Bàn', qty: 1, source: 'manual' }),
    ],
  };
  const m = mergeFfeTables([a, b, null, undefined], 'Gộp');
  ok('gộp ra 2 món (khử trùng id)', m.items.length === 2);
  ok('trùng id giữ bản ĐẦU, không cộng dồn số lượng', m.items[0].qty === 2);
  ok('nhãn truyền vào thắng', m.label === 'Gộp');
  ok('mergeFfeTables bỏ qua null/undefined không vỡ', m.items[1].name === 'Bàn');
}

// ── [5] Câu tóm tắt — ngắn, nói đúng chỗ còn thiếu ────────────────────────────────────────
{
  ok('bảng rỗng nói rõ là rỗng', ffeTableSummary(emptyFfeTable()) === 'Bảng trống — chưa có món nào.');
  const t: FfeTable = {
    id: 't',
    items: [
      makeFfeItem({ name: 'A', room: 'Bếp', source: 'manual' }),
      makeFfeItem({ name: 'B', room: 'Ngủ 1', source: 'manual' }),
      makeFfeItem({ name: 'C', source: 'manual' }),
    ],
  };
  const s = ffeTableSummary(t);
  ok('đếm đúng số món', s.includes('3 món'));
  ok('đếm đúng số phòng', s.includes('2 phòng'));
  ok('nêu rõ món chưa gán phòng', s.includes('1 chưa gán phòng'));
  ok('câu tóm tắt ngắn (≤12 từ)', s.split(/\s+/).length <= 12);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
