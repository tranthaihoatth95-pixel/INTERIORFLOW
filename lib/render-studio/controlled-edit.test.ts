/**
 * lib/render-studio/controlled-edit.test.ts — phép tính thuần của Controlled Edit (lineage +
 * vùng chọn). Chạy: node_modules/.bin/sucrase-node lib/render-studio/controlled-edit.test.ts
 */
import {
  hasOriginal,
  makeOriginalRevision,
  regionFromDrag,
  regionIsValid,
  seedHistory,
  whiteBalanceIsNeutral,
  withNewRevision,
  activeRevision,
  originalRevision,
  type EditRevision,
} from './controlled-edit';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

// --- seedHistory: bản gốc chỉ tạo một lần ---
{
  const seeded = seedHistory(undefined, 'data:image/png;base64,AAA');
  ok('seedHistory tạo đúng 1 mục gốc', seeded.length === 1 && seeded[0].kind === 'original');
  ok('bản gốc giữ đúng dataUrl ảnh hiện tại', seeded[0].dataUrl === 'data:image/png;base64,AAA');

  const reseeded = seedHistory(seeded, 'data:image/png;base64,BBB');
  ok('seedHistory KHÔNG tạo thêm bản gốc thứ hai nếu đã có', reseeded === seeded);
}

// --- withNewRevision: append-only, không sửa mục cũ ---
{
  const original = makeOriginalRevision('data:orig');
  const h1: EditRevision[] = [original];
  const edited: EditRevision = {
    id: 'r2',
    ts: Date.now(),
    kind: 'white-balance',
    dataUrl: 'data:edited',
    region: { x: 0, y: 0, width: 10, height: 10 },
    params: { temperature: 20, tint: 0 },
  };
  const h2 = withNewRevision(h1, edited);
  ok('withNewRevision không đụng mảng cũ', h1.length === 1);
  ok('withNewRevision thêm đúng 1 mục', h2.length === 2);
  ok('bản gốc vẫn nguyên vẹn ở vị trí đầu', originalRevision(h2)?.dataUrl === 'data:orig');
  ok('revision đang hoạt động là mục vừa thêm', activeRevision(h2)?.dataUrl === 'data:edited');
  ok('hasOriginal nhận đúng lịch sử có bản gốc', hasOriginal(h2));
  ok('hasOriginal từ chối lịch sử rỗng', !hasOriginal([]));
}

// --- whiteBalanceIsNeutral ---
{
  ok('trung tính khi cả hai = 0', whiteBalanceIsNeutral({ temperature: 0, tint: 0 }));
  ok('không trung tính khi temperature khác 0', !whiteBalanceIsNeutral({ temperature: 5, tint: 0 }));
}

// --- regionFromDrag: chuẩn hoá theo mọi hướng kéo ---
{
  const r1 = regionFromDrag({ x: 10, y: 10 }, { x: 50, y: 40 }, 100, 100);
  ok('kéo xuôi ra đúng rect', r1.x === 10 && r1.y === 10 && r1.width === 40 && r1.height === 30);

  const r2 = regionFromDrag({ x: 50, y: 40 }, { x: 10, y: 10 }, 100, 100);
  ok('kéo ngược ra CÙNG rect như kéo xuôi', r2.x === r1.x && r2.y === r1.y && r2.width === r1.width && r2.height === r1.height);

  const r3 = regionFromDrag({ x: -20, y: -20 }, { x: 30, y: 30 }, 100, 100);
  ok('kéo tràn mép âm bị ghim về 0', r3.x === 0 && r3.y === 0);

  const r4 = regionFromDrag({ x: 90, y: 90 }, { x: 200, y: 200 }, 100, 100);
  ok('kéo tràn mép dương bị ghim trong khung ảnh', r4.x + r4.width <= 100 && r4.y + r4.height <= 100);
}

// --- regionIsValid: chặn vùng chọn ma ---
{
  ok('vùng đủ lớn hợp lệ', regionIsValid({ x: 0, y: 0, width: 10, height: 10 }, 100, 100));
  ok('vùng quá nhỏ (click nhầm) KHÔNG hợp lệ', !regionIsValid({ x: 0, y: 0, width: 1, height: 1 }, 100, 100));
  ok('null KHÔNG hợp lệ', !regionIsValid(null, 100, 100));
  ok('vùng tràn ra ngoài khung KHÔNG hợp lệ', !regionIsValid({ x: 90, y: 90, width: 20, height: 20 }, 100, 100));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
