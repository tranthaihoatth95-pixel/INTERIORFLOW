/**
 * lib/commands/xoa-khoi-3d.test.ts — kiểm CẶP "chọn khối trong khung nhìn 3D ↔ xoá khối đó".
 *
 * VÌ SAO một tệp test cho CẢ HAI: mục xoá đọc ĐÚNG cái mà mục chọn ghi ra (`useTree3DUi.
 * selectedEntityId`). Tách ra kiểm riêng thì mỗi nửa vẫn xanh trong khi sợi dây giữa chúng đứt —
 * đúng loại "test khẳng định đường thoái lui" mà sổ 15/08 đã gọi là test che bug.
 *
 * Phần WebGL (raycast, tô viền khối) KHÔNG kiểm được ở đây — đó là `Scene3DViewer`, cần canvas
 * thật. Tệp này chỉ kiểm phần THUẦN: kho chọn + cổng `when` + nhánh thi hành của lệnh xoá.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/commands/xoa-khoi-3d.test.ts
 */
import { COMMANDS } from './registry';
import { useTree3DUi } from '../render-studio/tree3d-ui';
import { useCadStore } from '../cad/store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const tree = () => useTree3DUi.getState();
const reset = () => useTree3DUi.setState({ selectedName: null, selectedEntityId: null });

/* ── 1) Kho chọn 3D: pick đặt CẢ tên lẫn entityId, select (cây) KHÔNG để sót entityId ── */
function testKhoChon() {
  console.log('\n[1] useTree3DUi — pick / select / dọn cờ');

  reset();
  tree().pick('Wall_3', 'ent-3');
  ok('pick(name,id) đặt CẢ selectedName lẫn selectedEntityId', tree().selectedName === 'Wall_3' && tree().selectedEntityId === 'ent-3');

  // Khác hẳn `select`: bấm lại cùng khối trên khung nhìn phải GIỮ chọn, không bỏ chọn.
  tree().pick('Wall_3', 'ent-3');
  ok('pick lại CÙNG khối vẫn giữ chọn (đặt thẳng, không toggle)', tree().selectedName === 'Wall_3' && tree().selectedEntityId === 'ent-3');

  tree().pick(null);
  ok('pick(null) dọn SẠCH cả hai cờ', tree().selectedName === null && tree().selectedEntityId === null);

  // Group không có entityId (furniture/cửa sổ) — chọn được để xem, nhưng không có id để xoá.
  tree().pick('Furn_1');
  ok('pick(name) không kèm id ⇒ selectedEntityId = null', tree().selectedName === 'Furn_1' && tree().selectedEntityId === null);

  // Đường CÂY Navigator: giữ nguyên toggle theo TÊN như trước…
  reset();
  tree().select('Wall_9');
  ok('select(name) đặt selectedName (hành vi cũ giữ nguyên)', tree().selectedName === 'Wall_9');
  tree().select('Wall_9');
  ok('select lại CÙNG tên = bỏ chọn (toggle cũ giữ nguyên)', tree().selectedName === null);

  // …và PHẢI dọn entityId, nếu không lệnh xoá sẽ nhắm khối của lượt chọn TRƯỚC.
  reset();
  tree().pick('Wall_3', 'ent-3');
  tree().select('Furn_1');
  ok('select sau pick ⇒ selectedEntityId bị dọn (không nhắm nhầm khối cũ)', tree().selectedName === 'Furn_1' && tree().selectedEntityId === null);
  reset();
}

/* ── 2) Cổng `when` của lệnh xoá — đọc ĐÚNG nguồn theo chặng ───────────────── */
function testCongXoa() {
  console.log('\n[2] cad.sel.delete — `when` theo chặng × trạng thái chọn 3D');

  const del = COMMANDS.find((c) => c.id === 'cad.sel.delete');
  ok('có CommandDef cad.sel.delete', !!del);
  if (!del) return;

  reset();
  ok("stage='cad': THẬT dù 3D chưa chọn gì (đường 2D không đổi)", del.when({ stage: 'cad', proToolsAllowed: true }) === true);
  ok("stage='render' + chưa chọn khối: MỜ (cấm nút bấm-không-ra-gì, §9)", del.when({ stage: 'render' }) === false);

  tree().pick('Wall_3', 'ent-3');
  ok("stage='render' + ĐANG chọn khối: THẬT", del.when({ stage: 'render' }) === true);
  ok("stage='present': MỜ kể cả khi 3D đang chọn (không store toàn cục)", del.when({ stage: 'present' }) === false);

  // Group không entityId thì vẫn mờ — chọn để XEM ≠ xoá được.
  tree().pick('Furn_1');
  ok("stage='render' + chọn group KHÔNG có entityId: vẫn MỜ", del.when({ stage: 'render' }) === false);
  reset();
}

/* ── 3) Nhánh thi hành — một lệnh, hai bộ chạy ─────────────────────────────── */
function testThiHanh() {
  console.log('\n[3] cad.sel.delete — run() rẽ đúng nhánh theo nguồn chọn');

  const del = COMMANDS.find((c) => c.id === 'cad.sel.delete')!;
  const goc = { removeIds: useCadStore.getState().removeIds, deleteSelected: useCadStore.getState().deleteSelected };
  let removed: string[][] = [];
  let deleteSelectedCalls = 0;
  useCadStore.setState({
    removeIds: (ids: string[]) => { removed.push(ids); },
    deleteSelected: () => { deleteSelectedCalls += 1; },
  });

  try {
    // (a) 3D đang chọn ⇒ xoá ĐÚNG entity đó, KHÔNG đụng đường 2D.
    reset();
    tree().pick('Wall_3', 'ent-3');
    del.run({});
    ok('có khối 3D đang chọn ⇒ removeIds(["ent-3"])', removed.length === 1 && removed[0].length === 1 && removed[0][0] === 'ent-3');
    ok('có khối 3D đang chọn ⇒ KHÔNG gọi deleteSelected() của 2D', deleteSelectedCalls === 0);
    ok('xoá xong thì dọn cờ chọn (không trỏ vào khối vừa biến mất)', tree().selectedName === null && tree().selectedEntityId === null);

    // (b) Không có gì chọn ở 3D ⇒ đường cũ 2D nguyên vẹn.
    removed = [];
    del.run({});
    ok('không có khối 3D đang chọn ⇒ rơi về deleteSelected() như cũ', deleteSelectedCalls === 1 && removed.length === 0);
  } finally {
    useCadStore.setState(goc);
    reset();
  }
}

testKhoChon();
testCongXoa();
testThiHanh();
console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
