import { PALM_CONTACT_PX, PEN_RELEASE_GUARD_MS, shouldRejectTouch, shouldUseTouchForNavigation } from './touch-input';

let pass = 0;
let fail = 0;
function ok(name: string, value: boolean) {
  if (value) { pass++; console.log(`  ok  - ${name}`); }
  else { fail++; console.error(`  FAIL - ${name}`); }
}

const base = {
  pointerType: 'touch', width: 8, height: 8, now: 1_000,
  penActive: false, penSeen: false, penUpAt: 0, fingerDrawEnabled: false,
};

ok('ngón bình thường vẫn vẽ khi chưa từng thấy bút', !shouldRejectTouch(base));
ok('lòng bàn tay theo chiều rộng bị loại', shouldRejectTouch({ ...base, width: PALM_CONTACT_PX }));
ok('lòng bàn tay theo chiều cao bị loại', shouldRejectTouch({ ...base, height: PALM_CONTACT_PX }));
ok('touch mới bị loại khi bút đang chạm', shouldRejectTouch({ ...base, penActive: true }));
ok('touch bị loại trong 300ms sau pen-up', shouldRejectTouch({ ...base, penUpAt: base.now - PEN_RELEASE_GUARD_MS + 1 }));
ok('touch hết bị loại sau cửa sổ pen-up', !shouldRejectTouch({ ...base, penUpAt: base.now - PEN_RELEASE_GUARD_MS }));
ok('đã thấy bút không loại pointer vì còn dùng để điều hướng', !shouldRejectTouch({ ...base, penSeen: true }));
ok('đã thấy bút thì ngón mặc định chỉ điều hướng', shouldUseTouchForNavigation({ ...base, penSeen: true }));
ok('bật Ngón vẽ cho phép ngón vẽ lại', !shouldUseTouchForNavigation({ ...base, penSeen: true, fingerDrawEnabled: true }));
ok('logic không chặn pointer bút', !shouldRejectTouch({ ...base, pointerType: 'pen', width: 30, penActive: true }));

console.log(`\n${pass} ok, ${fail} fail`);
if (fail) process.exit(1);
