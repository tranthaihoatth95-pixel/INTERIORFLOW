/**
 * lib/input/wheel.test.ts — phân loại sự kiện wheel cho 3 chặng.
 * Chạy: node_modules/.bin/sucrase-node lib/input/wheel.test.ts
 *
 * Các mẫu sự kiện dưới đây lấy theo đặc trưng THỰC của từng thiết bị (xem bảng đầu wheel.ts),
 * không phải số bịa — đó là điểm mấu chốt để test có giá trị.
 */
import {
  classifyWheel,
  looksLikeTrackpad,
  normalizeWheelDelta,
  WheelLike,
  LINE_HEIGHT_PX,
  MOUSE_STEP_MIN_PX,
  zoomAtPoint,
} from './wheel';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/** Dựng sự kiện với mặc định "không phím bổ trợ, đơn vị pixel". */
const ev = (o: Partial<WheelLike>): WheelLike => ({
  deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, metaKey: false, shiftKey: false, ...o,
});

/* Mẫu chuẩn theo thiết bị */
const MOUSE_DOWN = ev({ deltaY: 100 });                    // Chrome, 1 nấc lăn xuống
const MOUSE_UP = ev({ deltaY: -100 });                     // Chrome, 1 nấc lăn lên
const FIREFOX_DOWN = ev({ deltaY: 3, deltaMode: 1 });      // Firefox, 1 nấc = 3 dòng
const TRACKPAD_PAN = ev({ deltaY: 8, deltaX: 3 });         // cuộn 2 ngón, có trục ngang
const TRACKPAD_SMALL = ev({ deltaY: 6 });                  // cuộn 2 ngón dọc thuần
const TRACKPAD_FLICK = ev({ deltaY: 143.5 });              // vuốt mạnh — delta lớn NHƯNG lẻ
const PINCH_IN = ev({ deltaY: -4, ctrlKey: true });        // chụm ra (phóng to)
const PINCH_OUT = ev({ deltaY: 4, ctrlKey: true });        // chụm vào (thu nhỏ)

function testNormalize() {
  console.log('\n[1] Quy đổi deltaMode → px (chốt chặn bug Firefox zoom giật)');
  ok('pixel-mode giữ nguyên', normalizeWheelDelta(MOUSE_DOWN).dy === 100);
  ok(`line-mode nhân ${LINE_HEIGHT_PX}`, normalizeWheelDelta(FIREFOX_DOWN).dy === 3 * LINE_HEIGHT_PX);
  ok('page-mode quy đổi ra px', normalizeWheelDelta(ev({ deltaY: 1, deltaMode: 2 })).dy === 400);
  ok('quy đổi cả trục ngang', normalizeWheelDelta(ev({ deltaX: 2, deltaMode: 1 })).dx === 2 * LINE_HEIGHT_PX);
}

function testTrackpadDetection() {
  console.log('\n[2] Nhận diện trackpad');
  ok('có deltaX ⇒ trackpad', looksLikeTrackpad(TRACKPAD_PAN));
  ok('bước nhỏ ⇒ trackpad', looksLikeTrackpad(TRACKPAD_SMALL));
  ok('delta lẻ (đà quán tính) ⇒ trackpad dù bước lớn', looksLikeTrackpad(TRACKPAD_FLICK));
  ok('nấc chuột 100px ⇒ KHÔNG phải trackpad', !looksLikeTrackpad(MOUSE_DOWN));
  ok('Firefox 3 dòng (=48px) ⇒ KHÔNG phải trackpad', !looksLikeTrackpad(FIREFOX_DOWN));
  ok(`ngưỡng ${MOUSE_STEP_MIN_PX}px nằm giữa hai vùng`,
    !looksLikeTrackpad(ev({ deltaY: MOUSE_STEP_MIN_PX })) && looksLikeTrackpad(ev({ deltaY: MOUSE_STEP_MIN_PX - 1 })));
}

function testMouseZoom() {
  console.log('\n[3] Chuột lăn = ZOOM (giữ đúng phản xạ CAD cũ)');
  const down = classifyWheel(MOUSE_DOWN);
  const up = classifyWheel(MOUSE_UP);
  ok('lăn xuống ⇒ zoom', down.kind === 'zoom');
  ok('lăn lên ⇒ zoom', up.kind === 'zoom');
  ok('nguồn = mouse', down.kind === 'zoom' && down.source === 'mouse');
  // Hằng số cũ của CadCanvas: lăn lên = ×1.12, lăn xuống = ÷1.12.
  ok('lăn lên đúng hệ số 1.12 như trước',
    up.kind === 'zoom' && Math.abs(up.factor - 1.12) < 1e-9);
  ok('lăn xuống đúng hệ số 1/1.12 như trước',
    down.kind === 'zoom' && Math.abs(down.factor - 1 / 1.12) < 1e-9);
}

function testFirefoxParity() {
  console.log('\n[4] Firefox line-mode zoom cùng CHIỀU và cùng cỡ với Chrome (không nhảy giật)');
  const ff = classifyWheel(FIREFOX_DOWN);
  const chrome = classifyWheel(MOUSE_DOWN);
  ok('Firefox cũng ra zoom', ff.kind === 'zoom');
  ok('cùng chiều thu nhỏ (factor < 1)', ff.kind === 'zoom' && ff.factor < 1);
  // 48px vs 100px ⇒ không bằng nhau, nhưng phải CÙNG CỠ (không lệch quá 2 lần).
  const ratio = ff.kind === 'zoom' && chrome.kind === 'zoom' ? Math.log(ff.factor) / Math.log(chrome.factor) : 0;
  ok('cùng cỡ với Chrome (0.3–1.0 lần)', ratio > 0.3 && ratio <= 1.0);
  // Nếu KHÔNG quy đổi line→px thì deltaY=3 sẽ bị coi là trackpad ⇒ pan. Chốt chặn hồi quy:
  ok('KHÔNG bị hiểu nhầm thành pan', ff.kind !== 'pan');
}

function testTrackpadPan() {
  console.log('\n[5] Trackpad cuộn 2 ngón = PAN, tuyệt đối không zoom');
  const p = classifyWheel(TRACKPAD_PAN);
  ok('ra pan', p.kind === 'pan');
  ok('nguồn = trackpad', p.kind === 'pan' && p.source === 'trackpad');
  ok('giữ nguyên cả 2 trục', p.kind === 'pan' && p.dx === 3 && p.dy === 8);
  ok('cuộn dọc thuần cũng pan', classifyWheel(TRACKPAD_SMALL).kind === 'pan');
  ok('vuốt mạnh vẫn pan (không nhảy zoom)', classifyWheel(TRACKPAD_FLICK).kind === 'pan');
}

function testPinchZoom() {
  console.log('\n[6] Pinch trackpad (ctrlKey=true) = ZOOM');
  const zin = classifyWheel(PINCH_IN);
  const zout = classifyWheel(PINCH_OUT);
  ok('chụm ra ⇒ zoom', zin.kind === 'zoom');
  ok('nguồn = pinch', zin.kind === 'zoom' && zin.source === 'pinch');
  ok('chụm ra = phóng to (factor > 1)', zin.kind === 'zoom' && zin.factor > 1);
  ok('chụm vào = thu nhỏ (factor < 1)', zout.kind === 'zoom' && zout.factor < 1);
  // ctrlKey phải THẮNG mọi dấu hiệu trackpad khác — nếu không, pinch sẽ bị pan.
  ok('ctrlKey thắng cả khi có deltaX (pinch không bao giờ thành pan)',
    classifyWheel(ev({ deltaY: -4, deltaX: 2, ctrlKey: true })).kind === 'zoom');
  ok('Ctrl + lăn chuột cũng zoom', classifyWheel(ev({ deltaY: 100, ctrlKey: true })).kind === 'zoom');
  // Độ nhạy phải theo THIẾT BỊ, không theo phím: nếu Ctrl+lăn chuột dùng k của pinch thì 1 nấc
  // nhảy ~2.7× (chóng mặt) và chạm luôn trần chặn 3×.
  const ctrlMouse = classifyWheel(ev({ deltaY: -100, ctrlKey: true }));
  ok('Ctrl + lăn chuột 1 nấc = 1.12 (không nhảy vọt)',
    ctrlMouse.kind === 'zoom' && Math.abs(ctrlMouse.factor - 1.12) < 1e-9);
  ok('pinch delta nhỏ vẫn nhạy hơn mỗi sự kiện so với cùng delta của chuột',
    (() => {
      const pinch = classifyWheel(ev({ deltaY: -4, ctrlKey: true }));
      const mouseSameDelta = classifyWheel(ev({ deltaY: -4 }));
      // cùng delta -4: pinch zoom, còn -4 không ctrl thì là trackpad ⇒ pan
      return pinch.kind === 'zoom' && pinch.factor > 1 && mouseSameDelta.kind === 'pan';
    })());
}

function testShiftPan() {
  console.log('\n[7] Shift + cuộn = pan ngang');
  const s = classifyWheel(ev({ deltaY: 100, shiftKey: true }));
  ok('ra pan', s.kind === 'pan');
  ok('nguồn = shift', s.kind === 'pan' && s.source === 'shift');
  ok('dy dồn sang dx (chuột chỉ có trục dọc)', s.kind === 'pan' && s.dx === 100 && s.dy === 0);
  ok('trackpad có sẵn dx thì dùng dx',
    (() => { const r = classifyWheel(ev({ deltaY: 8, deltaX: 5, shiftKey: true })); return r.kind === 'pan' && r.dx === 5; })());
}

function testOptions() {
  console.log('\n[8] Tuỳ chọn theo chặng');
  const inv = classifyWheel(MOUSE_UP, { invertZoom: true });
  ok('invertZoom đảo chiều', inv.kind === 'zoom' && inv.factor < 1);
  const flat = classifyWheel(MOUSE_DOWN, { zoomOnPlainWheel: false });
  ok('zoomOnPlainWheel=false ⇒ chuột lăn thành pan (chặng Presenting)', flat.kind === 'pan');
  ok('…nhưng pinch VẪN zoom khi tắt cờ đó',
    classifyWheel(PINCH_IN, { zoomOnPlainWheel: false }).kind === 'zoom');
}

function testNoNaN() {
  console.log('\n[9] Không sinh giá trị rác (NaN/Infinity) làm hỏng viewport');
  const weird = [
    ev({ deltaY: 0 }), ev({ deltaY: 1e6 }), ev({ deltaY: -1e6 }),
    ev({ deltaY: 1e6, ctrlKey: true }), ev({ deltaY: NaN }),
  ];
  let allFinite = true;
  for (const w of weird) {
    const r = classifyWheel(w);
    const vals = r.kind === 'zoom' ? [r.factor] : [r.dx, r.dy];
    if (vals.some((v) => !Number.isFinite(v))) allFinite = false;
  }
  ok('mọi kết quả đều hữu hạn', allFinite);
  const huge = classifyWheel(ev({ deltaY: -1e6 }));
  ok('factor bị chặn trần (không zoom vô hạn)', huge.kind === 'zoom' && huge.factor <= 3);
  const hugeDown = classifyWheel(ev({ deltaY: 1e6 }));
  ok('factor bị chặn sàn (không zoom về 0)', hugeDown.kind === 'zoom' && hugeDown.factor >= 1 / 3);
}

function testZoomAtPoint() {
  console.log('\n[10] zoomAtPoint — điểm dưới con trỏ phải ĐỨNG YÊN (chặng Rendering)');
  const v = { x: 120, y: -40, zoom: 1 };
  // Điểm nội dung đang nằm dưới con trỏ, tính trước khi zoom.
  const contentAt = (vp: typeof v, px: number, py: number) => ({
    x: (px - vp.x) / vp.zoom, y: (py - vp.y) / vp.zoom,
  });
  const px = 400, py = 300;
  const before = contentAt(v, px, py);
  const zoomed = zoomAtPoint(v, px, py, 1.12);
  const after = contentAt(zoomed, px, py);
  ok('zoom nhân đúng hệ số', Math.abs(zoomed.zoom - 1.12) < 1e-9);
  ok('điểm nội dung dưới con trỏ không đổi (x)', Math.abs(before.x - after.x) < 1e-9);
  ok('điểm nội dung dưới con trỏ không đổi (y)', Math.abs(before.y - after.y) < 1e-9);

  // Zoom quanh góc trái-trên và quanh điểm lệch tâm cũng phải giữ bất biến ấy.
  for (const [qx, qy] of [[0, 0], [37, 911], [-50, 20]]) {
    const b = contentAt(v, qx, qy);
    const a = contentAt(zoomAtPoint(v, qx, qy, 0.5), qx, qy);
    ok(`bất biến tại (${qx},${qy})`, Math.abs(b.x - a.x) < 1e-9 && Math.abs(b.y - a.y) < 1e-9);
  }

  ok('chặn trần maxZoom', zoomAtPoint({ x: 0, y: 0, zoom: 2.4 }, 0, 0, 10, 0.15, 2.5).zoom === 2.5);
  ok('chặn sàn minZoom', zoomAtPoint({ x: 0, y: 0, zoom: 0.2 }, 0, 0, 0.01, 0.15, 2.5).zoom === 0.15);
  // Khi bị kẹp biên thì KHÔNG được nhảy vị trí lung tung — vẫn phải là phép zoom quanh đúng điểm.
  const clamped = zoomAtPoint({ x: 10, y: 10, zoom: 2.4 }, 100, 100, 10, 0.15, 2.5);
  ok('kẹp biên vẫn giữ bất biến điểm neo',
    Math.abs((100 - clamped.x) / clamped.zoom - (100 - 10) / 2.4) < 1e-9);
}

console.log('=== lib/input/wheel.test.ts ===');
testNormalize();
testTrackpadDetection();
testMouseZoom();
testFirefoxParity();
testTrackpadPan();
testPinchZoom();
testShiftPan();
testOptions();
testNoNaN();
testZoomAtPoint();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
