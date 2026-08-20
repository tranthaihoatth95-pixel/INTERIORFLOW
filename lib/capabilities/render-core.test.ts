/**
 * lib/capabilities/render-core.test.ts — kiểm phần THUẦN của năng lực render/motion. Chạy:
 *   node_modules/.bin/sucrase-node lib/capabilities/render-core.test.ts
 *
 * Ba thứ được canh ở đây là ba thứ dễ trôi nhất khi phiên sau sửa vội:
 *  ① BẢNG CHẾ ĐỘ KHAI THẬT — không chế độ nào được tự nhận là "ray tracing"/"dò tia", và chế độ
 *    0 credit thì KHÔNG được có lệnh AI nào (0 credit mà gọi provider là khai khống chiều ngược).
 *  ② CỜ CŨ — nguồn đổi thì bản cũ phải nhận dấu, và tuyệt đối không có đường nào tự sinh lại.
 *  ③ PROMPT CHUYỂN ĐỘNG + các bảng giá trị phải khớp tham số node thật.
 */
import {
  CHE_DO_RENDER,
  bamChuoi,
  bamSceneRev,
  cheDoTheoId,
  laBanCu,
  lyDoKhongBamDuoc,
  type BanGhiKetQua,
} from './render-core';
import {
  CHAT_LUONG_VIDEO,
  CREDIT_MOT_LUOT_VIDEO,
  THOI_LUONG,
  Y_DINH_CHUYEN_DONG,
  dungPromptChuyenDong,
  yDinhTheoId,
} from './motion-core';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ───────────────────────── ① bảng chế độ khai THẬT ───────────────────────── */

ok('có đúng 3 chế độ', CHE_DO_RENDER.length === 3);

const CAM_TU = /ray[\s-]?trac|dò tia|path[\s-]?trac|photon/i;
ok(
  'KHÔNG chế độ nào tự nhận là dò tia (ray tracing) — không có bộ dò tia nào chạy',
  CHE_DO_RENDER.every((c) => {
    const noiDung = [...c.ten, ...c.giaiThich].join(' ');
    // Được phép nói "KHÔNG phải dò tia"; cấm khẳng định là dò tia.
    return !CAM_TU.test(noiDung) || /không phải|not ray/i.test(noiDung);
  }),
);

ok(
  '0 credit ⇔ không lệnh AI nào (không tính tiền hụt, cũng không gọi provider chùa)',
  CHE_DO_RENDER.every((c) => (c.credit === 0) === (c.lenhNoiBo.length === 0)),
);
ok(
  'cần provider ⇔ có lệnh AI',
  CHE_DO_RENDER.every((c) => c.canProvider === c.lenhNoiBo.length > 0),
);
ok(
  'mọi lệnh nội bộ đều là node ai.* có thật trong registry (danh sách đối chiếu tay)',
  CHE_DO_RENDER.every((c) => c.lenhNoiBo.every((l) => ['ai.clay2render', 'ai.upscale'].includes(l))),
);
ok('cheDoTheoId trả đúng bản ghi', cheDoTheoId('banCuoi').credit === 6);
ok('cheDoTheoId ném khi id lạ', (() => { try { cheDoTheoId('xyz' as never); return false; } catch { return true; } })());

/* ───────────────────────── nút mờ KÈM LÝ DO THẬT ───────────────────────── */

const cheDoAi = cheDoTheoId('xemTruocChatLuong');
const cheDoChup = cheDoTheoId('xemTruocThietKe');
ok('cảnh rỗng ⇒ chặn, có lý do', !!lyDoKhongBamDuoc(cheDoChup, true, 0));
ok('không provider + chế độ AI ⇒ chặn, có lý do', !!lyDoKhongBamDuoc(cheDoAi, false, 5));
ok('không provider nhưng chế độ chụp ⇒ VẪN BẤM ĐƯỢC', lyDoKhongBamDuoc(cheDoChup, false, 5) === null);
ok('đủ điều kiện ⇒ không chặn', lyDoKhongBamDuoc(cheDoAi, true, 5) === null);
ok('lý do luôn song ngữ VI/EN', (lyDoKhongBamDuoc(cheDoAi, false, 5) ?? []).length === 2);

/* ───────────────────────── ② băm cảnh + cờ CŨ ───────────────────────── */

ok('bamChuoi tất định', bamChuoi('abc') === bamChuoi('abc'));
ok('bamChuoi phân biệt được', bamChuoi('abc') !== bamChuoi('abd'));
ok('bamChuoi luôn 8 ký tự hex', /^[0-9a-f]{8}$/.test(bamChuoi('')));

const sceneA = { groups: [{ name: 'tuong1', h: 2700 }], bboxMm: { minX: 0, minY: 0, maxX: 1, maxY: 1 } };
const sceneB = { groups: [{ name: 'tuong1', h: 3000 }], bboxMm: { minX: 0, minY: 0, maxX: 1, maxY: 1 } };
const revA = bamSceneRev(sceneA);
ok('cùng cảnh ⇒ cùng bản sửa', revA === bamSceneRev(sceneA));
ok('đổi chiều cao tường ⇒ bản sửa đổi', revA !== bamSceneRev(sceneB));

function banGhi(rev: string): BanGhiKetQua {
  return {
    id: 'kq1', loai: 'anh', url: 'https://x/y.png', ten: 'test', sceneRev: rev,
    provider: 'fal', credit: 4, thamSo: {}, trangThai: 'daNhan', luc: 0,
  };
}
ok('nguồn không đổi ⇒ không CŨ', laBanCu(banGhi(revA), revA) === false);
ok('nguồn đổi ⇒ CŨ', laBanCu(banGhi(revA), bamSceneRev(sceneB)) === true);
ok('chưa biết bản sửa hiện tại ⇒ KHÔNG vu cho nó là cũ', laBanCu(banGhi(revA), null) === false);

/* ───────────────────────── ③ chuyển động ───────────────────────── */

ok('có 6 ý định chuyển động', Y_DINH_CHUYEN_DONG.length === 6);
ok('mỗi ý định có prompt tiếng Anh không rỗng', Y_DINH_CHUYEN_DONG.every((y) => y.prompt.trim().length > 10));
ok('id ý định không trùng', new Set(Y_DINH_CHUYEN_DONG.map((y) => y.id)).size === 6);
ok('prompt = ý định khi không mô tả thêm', dungPromptChuyenDong('lia') === yDinhTheoId('lia').prompt);
ok('mô tả thêm nối SAU ý định', dungPromptChuyenDong('lia', 'ánh chiều').endsWith(', ánh chiều'));
ok('mô tả thêm toàn khoảng trắng ⇒ bỏ qua', dungPromptChuyenDong('lia', '   ') === yDinhTheoId('lia').prompt);
ok('yDinhTheoId ném khi id lạ', (() => { try { yDinhTheoId('xyz' as never); return false; } catch { return true; } })());

// Khớp tham số node ai.image2video (registry.ts:561) — lệch là nút giả.
ok('thời lượng đúng 2 giá trị node nhận', THOI_LUONG.length === 2 && THOI_LUONG.includes('5s') && THOI_LUONG.includes('10s'));
ok('chất lượng đúng 2 model node khai', CHAT_LUONG_VIDEO.length === 2 && CHAT_LUONG_VIDEO[0].startsWith('Kling'));
ok('credit video khớp creditCost của node (8)', CREDIT_MOT_LUOT_VIDEO === 8);

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
