/** Test `settle.ts` + `prefs.ts` — chạy: node_modules/.bin/sucrase-node lib/wallpaper/settle.test.ts
 *
 * 📏 CỬA NGHIỆM THU V3: chậm dần rồi **DỪNG HẲN**, và `prefers-reduced-motion` ⇒ **0 chuyển động**.
 */
import {
  BUOC_PHUT,
  SETTLE_EASE,
  SETTLE_MS,
  daDungHan,
  gioThapPhan,
  msToiMocSau,
  styleNen,
} from './settle';
import { MAC_DINH, chuanHoa } from './prefs';
import { WALLPAPER_SETS } from './sets';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

console.log('V3 — pha VÀO: có chuyển động, đường cong giảm tốc, không "bật cụp"');
{
  const s = styleNen('entering', false);
  ok('có transition trên transform', s.transition.includes('transform'));
  ok(`thời lượng đúng ${SETTLE_MS}ms`, s.transition.includes(`${SETTLE_MS}ms`));
  ok('dùng đường cong giảm tốc đã khai', s.transition.includes(SETTLE_EASE));
  ok('đạo hàm cuối = 0 (bezier y2 = 1 ⇒ không bật cụp)', /,\s*1\)/.test(SETTLE_EASE));
  ok('KHÔNG dùng animation/keyframes (không có vòng lặp nào)', s.animation === 'none');
  ok('biên độ rất nhẹ — nền không cướp sự chú ý', s.transform.includes('scale(1.045)'));
}

console.log('🔴 V3 — DỪNG HẲN nghĩa là NGỪNG TIÊU CPU/GPU, không phải vẽ tiếp khung không đổi');
{
  const s = styleNen('stopped', false);
  ok('transition = none', s.transition === 'none');
  ok('animation = none', s.animation === 'none');
  ok('willChange gỡ về auto (không nuôi lớp GPU vĩnh viễn)', s.willChange === 'auto');
  ok('transform = none (không giữ transform thừa)', s.transform === 'none');
  ok('daDungHan() xác nhận', daDungHan(s) === true);
  ok('pha entering KHÔNG bị nhận nhầm là đã dừng', daDungHan(styleNen('entering', false)) === false);
}

console.log('🔴 V3 — prefers-reduced-motion ⇒ KHÔNG chuyển động chút nào (không phải "chậm hơn")');
{
  const r = styleNen('entering', true);
  ok('vào thẳng khung cuối, y hệt trạng thái đã dừng', daDungHan(r) === true);
  ok(
    'giống hệt style của pha stopped',
    JSON.stringify(r) === JSON.stringify(styleNen('stopped', true)),
  );
}

console.log('V3 — nhịp thời gian dùng MỘT setTimeout, không interval');
{
  const t = (h: number, m: number, s: number) => new Date(2026, 7, 16, h, m, s, 0);
  ok(`bước ${BUOC_PHUT} phút`, BUOC_PHUT === 30);
  ok('10:00:00 → 30 phút nữa', msToiMocSau(t(10, 0, 0)) === 30 * 60_000);
  ok('10:29:30 → 30 giây nữa', msToiMocSau(t(10, 29, 30)) === 30_000);
  ok('10:31:00 → 29 phút nữa', msToiMocSau(t(10, 31, 0)) === 29 * 60_000);
  ok('23:59:30 → 30 giây nữa (qua nửa đêm không âm)', msToiMocSau(t(23, 59, 30)) === 30_000);
  let duong = true;
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 1, 14, 15, 29, 30, 44, 59]) {
      const v = msToiMocSau(t(h, m, 17));
      if (v <= 0 || v > BUOC_PHUT * 60_000) duong = false;
    }
  }
  ok('mọi giờ trong ngày: luôn dương và ≤ một bước (không hẹn giờ 0 ⇒ không quay vòng nóng)', duong);
}

console.log('V3 — giờ thập phân đúng, nối được vào sunPosition');
{
  ok('12:30 → 12.5', gioThapPhan(new Date(2026, 7, 16, 12, 30)) === 12.5);
  ok('00:00 → 0', gioThapPhan(new Date(2026, 7, 16, 0, 0)) === 0);
}

console.log('V5 — lựa chọn được NHỚ, dữ liệu hỏng không làm vỡ giao diện');
{
  ok('mặc định là bộ đầu, nấc 0, bật', MAC_DINH.setId === WALLPAPER_SETS[0].id && MAC_DINH.nacGiamChoi === 0 && MAC_DINH.bat === true);
  ok('null → mặc định', chuanHoa(null).setId === MAC_DINH.setId);
  ok('id lạ → mặc định', chuanHoa({ setId: 'xxx' }).setId === MAC_DINH.setId);
  ok('id thật giữ nguyên', chuanHoa({ setId: 'binh-do' }).setId === 'binh-do');
  ok('nấc lạ → 0', chuanHoa({ nacGiamChoi: 9 as never }).nacGiamChoi === 0);
  ok('nấc 2 giữ nguyên', chuanHoa({ nacGiamChoi: 2 }).nacGiamChoi === 2);
  ok('tắt hình nền được (bat:false giữ nguyên)', chuanHoa({ bat: false }).bat === false);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
