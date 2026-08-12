/**
 * lib/present-editor/table-doc-engine.test.ts — chạy bằng `sucrase-node` thẳng (không alias `@/`,
 * cùng khuôn `boq-group.test.ts`/`boq-overrides.test.ts`). Không phụ thuộc React/DOM.
 */
import assert from 'node:assert/strict';
import {
  buildTableRows,
  resyncTableRows,
  applyTableOverrides,
  setTableOverride,
  revertTableOverride,
  countTableOverrideStatus,
  groupTableRows,
  serializeTableDoc,
  parseTableDoc,
  overrideKey,
  type TableColumnDef,
  type TableRowSeed,
  type TableRow,
  type TableDoc,
} from './table-doc-engine';

let pass = 0;
function check(name: string, fn: () => void) {
  fn();
  pass += 1;
  console.log(`  ok ${pass}. ${name}`);
}

const COLUMNS: TableColumnDef[] = [
  { key: 'label', label: ['Tên', 'Name'], editable: false },
  { key: 'spec', label: ['Thông số', 'Spec'], kind: 'text' },
  { key: 'areaM2', label: ['Diện tích (m²)', 'Area (m²)'], kind: 'number', summable: true },
  { key: 'note', label: ['Ghi chú', 'Note'], kind: 'text' },
];

// ── [1] build dòng lần đầu từ seed — mọi ô = giá trị máy, chưa có override nào.
check('buildTableRows: dòng đầu tiên gieo đúng cells từ seed', () => {
  const seeds: TableRowSeed[] = [
    { id: 'entity:door-1', entityId: 'door-1', groupKey: 'door', groupLabel: 'Cửa', cells: { label: 'Cửa 1 cánh 800', spec: '800 × 2100 mm' } },
    { id: 'entity:room-1', entityId: 'room-1', groupKey: 'room', groupLabel: 'Phòng', cells: { label: 'PHÒNG KHÁCH', areaM2: 24.6 } },
  ];
  const rows = buildTableRows(seeds);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].cells.label, 'Cửa 1 cánh 800');
  assert.equal(rows[1].cells.areaM2, 24.6);
  // cột "note" (chỉ nhập tay) không được seed khai ⇒ không có key trong cells.
  assert.equal('note' in rows[0].cells, false);
  assert.equal(rows[0].orphaned, undefined);
});

// ── [2] resync: sửa tay 1 ô rồi gieo lại — ô tay PHẢI giữ nguyên (luật 6).
check('resyncTableRows: ô đã sửa tay không bị máy ghi đè lúc re-sync', () => {
  const seedsV1: TableRowSeed[] = [
    { id: 'entity:door-1', entityId: 'door-1', groupKey: 'door', groupLabel: 'Cửa', cells: { label: 'Cửa 1 cánh 800', spec: '800 × 2100 mm' } },
  ];
  let rows = buildTableRows(seedsV1);
  let overrides = setTableOverride({}, 'entity:door-1', 'note', 'Đã đặt hàng — không đổi mã', Date.now());

  // Bản vẽ đổi: cửa đổi kích thước (đo lại hiện trường) — spec máy đổi, nhưng override "note" ở
  // MAP RIÊNG (không nằm trong TableRow.cells) nên hoàn toàn không bị đụng.
  const seedsV2: TableRowSeed[] = [
    { id: 'entity:door-1', entityId: 'door-1', groupKey: 'door', groupLabel: 'Cửa', cells: { label: 'Cửa 1 cánh 900', spec: '900 × 2100 mm' } },
  ];
  const r = resyncTableRows(rows, seedsV2);
  rows = r.rows;
  assert.equal(r.matched, 1);
  assert.equal(r.added, 0);
  assert.equal(r.orphanedNow, 0);
  assert.equal(rows[0].cells.spec, '900 × 2100 mm'); // giá trị MÁY đã cập nhật

  const display = applyTableOverrides(rows, overrides);
  assert.equal(display[0].cells.note, 'Đã đặt hàng — không đổi mã'); // ô tay VẪN CÒN nguyên
  assert.equal(display[0].overrides?.note.value, 'Đã đặt hàng — không đổi mã');
});

// ── [3] resync: entity biến mất khỏi Doc → dòng KHÔNG bị xoá, chỉ đánh dấu orphaned.
check('resyncTableRows: entity bị xoá trên bản vẽ → dòng giữ nguyên + orphaned=true', () => {
  const seedsV1: TableRowSeed[] = [
    { id: 'entity:door-1', entityId: 'door-1', groupKey: 'door', groupLabel: 'Cửa', cells: { label: 'Cửa A' } },
    { id: 'entity:door-2', entityId: 'door-2', groupKey: 'door', groupLabel: 'Cửa', cells: { label: 'Cửa B' } },
  ];
  const rows = buildTableRows(seedsV1);
  // Cửa B bị xoá trên bản vẽ + có 1 cửa MỚI (door-3) xuất hiện.
  const seedsV2: TableRowSeed[] = [
    { id: 'entity:door-1', entityId: 'door-1', groupKey: 'door', groupLabel: 'Cửa', cells: { label: 'Cửa A' } },
    { id: 'entity:door-3', entityId: 'door-3', groupKey: 'door', groupLabel: 'Cửa', cells: { label: 'Cửa C' } },
  ];
  const r = resyncTableRows(rows, seedsV2);
  assert.equal(r.added, 1);
  assert.equal(r.matched, 1);
  assert.equal(r.orphanedNow, 1);
  assert.equal(r.rows.length, 3); // A + C + B (mồ côi, vẫn còn)
  const doorB = r.rows.find((x) => x.id === 'entity:door-2');
  assert.ok(doorB);
  assert.equal(doorB!.orphaned, true);
  assert.equal(doorB!.cells.label, 'Cửa B'); // dữ liệu KHÔNG mất
});

// ── [4] dòng thêm tay (không entityId) không tham gia re-sync theo bất kỳ chiều nào.
check('resyncTableRows: dòng thêm tay (không entityId) không bao giờ bị đánh orphaned', () => {
  const manualRow: TableRow = { id: 'row_abc', cells: { label: 'Dòng tự thêm' } };
  const rows = [...buildTableRows([{ id: 'entity:door-1', entityId: 'door-1', cells: { label: 'Cửa A' } }]), manualRow];
  const r = resyncTableRows(rows, [{ id: 'entity:door-1', entityId: 'door-1', cells: { label: 'Cửa A' } }]);
  const kept = r.rows.find((x) => x.id === 'row_abc');
  assert.ok(kept);
  assert.equal(kept!.orphaned, undefined);
  assert.equal(r.orphanedNow, 0);
});

// ── [5] revert đưa ô về đúng số máy.
check('revertTableOverride: quay lại đúng giá trị máy sau khi revert', () => {
  const rows = buildTableRows([{ id: 'entity:room-1', entityId: 'room-1', groupKey: 'room', cells: { areaM2: 24.6 } }]);
  let overrides = setTableOverride({}, 'entity:room-1', 'areaM2', 30, 1000);
  let display = applyTableOverrides(rows, overrides);
  assert.equal(display[0].cells.areaM2, 30);
  assert.equal(display[0].overrides?.areaM2.machineValue, 24.6);

  overrides = revertTableOverride(overrides, 'entity:room-1', 'areaM2');
  assert.equal(overrideKey('entity:room-1', 'areaM2') in overrides, false);
  display = applyTableOverrides(rows, overrides);
  assert.equal(display[0].cells.areaM2, 24.6);
  assert.equal(display[0].overrides, undefined);
});

// ── [6] countTableOverrideStatus đếm ĐÚNG theo DÒNG (không theo Ô), cùng cách BOQ đếm.
check('countTableOverrideStatus: đếm dòng có ít nhất 1 ô sửa tay + dòng orphaned', () => {
  const rows = buildTableRows([
    { id: 'entity:d1', entityId: 'd1', cells: { label: 'A' } },
    { id: 'entity:d2', entityId: 'd2', cells: { label: 'B' } },
  ]);
  const overrides = setTableOverride(setTableOverride({}, 'entity:d1', 'label', 'A (sửa)', 1), 'entity:d1', 'note', 'x', 2);
  const withOrphan = [...rows, { id: 'entity:d3', entityId: 'd3', cells: { label: 'C' }, orphaned: true }];
  const display = applyTableOverrides(withOrphan, overrides);
  const status = countTableOverrideStatus(display);
  assert.equal(status.handEdited, 1); // d1 có 2 ô sửa nhưng tính 1 DÒNG
  assert.equal(status.fromModel, 2);
  assert.equal(status.orphaned, 1);
});

// ── [7] groupTableRows: thứ tự nhóm ổn định + tổng chỉ cộng cột summable + không cộng null/text.
check('groupTableRows: subtotal đúng, chỉ cộng cột summable, thứ tự = lần gặp đầu', () => {
  const rows = buildTableRows([
    { id: 'entity:room-1', entityId: 'room-1', groupKey: 'room', groupLabel: 'Phòng · Rooms', cells: { label: 'PK', areaM2: 20 } },
    { id: 'entity:door-1', entityId: 'door-1', groupKey: 'door', groupLabel: 'Cửa · Doors', cells: { label: 'Cửa A', spec: '800mm' } },
    { id: 'entity:room-2', entityId: 'room-2', groupKey: 'room', groupLabel: 'Phòng · Rooms', cells: { label: 'PN', areaM2: 15.5 } },
  ]);
  const display = applyTableOverrides(rows, {});
  const groups = groupTableRows(display, COLUMNS);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].key, 'room'); // gặp lần đầu ở dòng 0
  assert.equal(groups[0].count, 2);
  assert.equal(groups[0].totals.areaM2, 35.5);
  assert.equal(groups[1].key, 'door');
  assert.equal(groups[1].totals.areaM2, undefined); // cửa không khai areaM2 ⇒ không cộng gì
});

// Σ subtotal các nhóm LUÔN = tổng toàn bộ (bất biến N3, cùng luật boq-group.ts).
check('groupTableRows: Σ subtotal các nhóm = tổng areaM2 toàn bộ rows (bất biến N3)', () => {
  const rows = buildTableRows([
    { id: 'entity:r1', entityId: 'r1', groupKey: 'room', cells: { areaM2: 10 } },
    { id: 'entity:r2', entityId: 'r2', groupKey: 'room', cells: { areaM2: 5 } },
    { id: 'entity:r3', entityId: 'r3', groupKey: 'hall', cells: { areaM2: 3 } },
  ]);
  const display = applyTableOverrides(rows, {});
  const groups = groupTableRows(display, COLUMNS);
  const sumGroups = groups.reduce((s, g) => s + (g.totals.areaM2 ?? 0), 0);
  const sumAll = display.reduce((s, r) => s + (typeof r.cells.areaM2 === 'number' ? r.cells.areaM2 : 0), 0);
  assert.equal(sumGroups, sumAll);
});

// ── [8] round-trip serialize/parse — dữ liệu ra vào KHÔNG lệch.
check('serializeTableDoc/parseTableDoc: round-trip giữ nguyên rows + columns', () => {
  const rows = buildTableRows([{ id: 'entity:d1', entityId: 'd1', groupKey: 'door', groupLabel: 'Cửa', cells: { label: 'Cửa A', spec: '800mm' } }]);
  const doc: TableDoc = { docType: 'schedule', columns: COLUMNS, rows, syncedAt: 123456 };
  const json = serializeTableDoc(doc);
  const back = parseTableDoc(json);
  assert.ok(back);
  assert.deepEqual(back, doc);
});

check('parseTableDoc: JSON hỏng/sai version trả null, KHÔNG throw', () => {
  assert.equal(parseTableDoc('{not json'), null);
  assert.equal(parseTableDoc(JSON.stringify({ v: 2, doc: {} })), null);
  assert.equal(parseTableDoc(JSON.stringify({ v: 1, doc: { docType: 'x' } })), null); // thiếu rows/columns
});

console.log(`\nTableDocEngine: ${pass}/${pass} PASS`);
