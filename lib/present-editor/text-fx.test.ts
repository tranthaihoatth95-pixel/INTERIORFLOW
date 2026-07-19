/**
 * lib/present-editor/text-fx.test.ts — kiểm phần TOÁN dùng chung của hiệu ứng chữ (#2).
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/text-fx.test.ts
 *
 * Vì sao đáng test: DOM (Element.tsx) và canvas (render.ts) vẽ chữ bằng hai cơ chế khác hẳn
 * nhau nhưng PHẢI ra cùng một hình. Chúng chỉ khớp được nếu dùng chung đúng bộ hàm này —
 * nên sai ở đây là lệch âm thầm giữa màn hình và file PDF xuất ra.
 */
import {
  applyPreset,
  applyTransform,
  gradientCss,
  gradientLine,
  hasFx,
  isCurved,
  pctToPx,
  shadowCss,
  FX_PRESETS,
} from './text-fx';
import type { TextFx } from './model';

let pass = 0;
let fail = 0;
const ok = (label: string, cond: boolean) => {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
};

console.log('[1] hasFx — deck CŨ (không có fx) phải đi đường nhanh, không đổi hành vi');
{
  ok('undefined → false', hasFx(undefined) === false);
  ok('object rỗng → false', hasFx({}) === false);
  ok('transform none → false', hasFx({ transform: 'none' }) === false);
  ok('blend normal → false', hasFx({ blend: 'normal' }) === false);
  ok('strokeWidth 0 → false', hasFx({ strokeWidth: 0 }) === false);
  ok('shadows rỗng → false', hasFx({ shadows: [] }) === false);
  ok('có stroke → true', hasFx({ strokeWidth: 0.2 }) === true);
  ok('có gradient → true', hasFx({ gradient: { from: '#000', to: '#fff', angle: 0 } }) === true);
  ok('có shadow → true', hasFx({ shadows: [{ x: 0, y: 1, blur: 2, color: '#000' }] }) === true);
  ok('outlineOnly → true', hasFx({ outlineOnly: true }) === true);
}

console.log('[2] pctToPx — quy ước "% chiều cao sân khấu"');
{
  ok('5% của 1080 = 54px', pctToPx(5, 1080) === 54);
  ok('0 → 0', pctToPx(0, 1080) === 0);
  ok('âm giữ dấu', pctToPx(-2, 1080) === -21.6);
  // cùng giá trị % phải ra CÙNG TỈ LỆ ở khổ khác → đây là lý do dùng % thay vì px
  ok('tỉ lệ giữ nguyên giữa 1080 và 2160', pctToPx(5, 2160) === pctToPx(5, 1080) * 2);
}

console.log('[3] applyTransform — DOM và canvas phải ra CÙNG chuỗi (không dùng CSS text-transform)');
{
  ok('undefined fx → giữ nguyên', applyTransform('Nhà Đẹp', undefined) === 'Nhà Đẹp');
  ok('uppercase giữ dấu tiếng Việt', applyTransform('nhà đẹp', { transform: 'uppercase' }) === 'NHÀ ĐẸP');
  ok('lowercase giữ dấu', applyTransform('NHÀ ĐẸP', { transform: 'lowercase' }) === 'nhà đẹp');
  ok('capitalize hoa đầu từ', applyTransform('nhà đẹp', { transform: 'capitalize' }) === 'Nhà Đẹp');
  ok('capitalize giữ xuống dòng', applyTransform('nhà\nđẹp', { transform: 'capitalize' }) === 'Nhà\nĐẹp');
  ok('none → giữ nguyên', applyTransform('Nhà Đẹp', { transform: 'none' }) === 'Nhà Đẹp');
}

console.log('[4] shadowCss — cùng dữ liệu, hai đơn vị, phải cùng TỈ LỆ');
{
  const shadows = [{ x: 0, y: 0.5, blur: 1, color: 'rgba(0,0,0,0.4)' }];
  ok('rỗng → undefined', shadowCss([], { unit: 'cqh' }) === undefined);
  ok('undefined → undefined', shadowCss(undefined, { unit: 'cqh' }) === undefined);
  ok(
    'cqh dùng thẳng số %',
    shadowCss(shadows, { unit: 'cqh' }) === '0cqh 0.5cqh 1cqh rgba(0,0,0,0.4)',
  );
  ok(
    'px quy đổi theo chiều cao sân khấu',
    shadowCss(shadows, { unit: 'px', stageHeightPx: 1080 }) === '0.00px 5.40px 10.80px rgba(0,0,0,0.4)',
  );
  ok(
    'nhiều lớp nối bằng dấu phẩy (thứ tự = thứ tự CSS)',
    (shadowCss(
      [
        { x: 0, y: 0, blur: 1, color: '#a' },
        { x: 1, y: 1, blur: 2, color: '#b' },
      ],
      { unit: 'cqh' },
    ) ?? '').split(', ').length === 2,
  );
  ok(
    'blur âm bị kẹp về 0 (CSS không nhận blur âm)',
    (shadowCss([{ x: 0, y: 0, blur: -5, color: '#000' }], { unit: 'cqh' }) ?? '').includes('0cqh #000'),
  );
}

console.log('[5] gradientLine — đường gradient phải PHỦ TRỌN hộp ở mọi góc');
{
  const box = { x: 0, y: 0, w: 100, h: 50 };
  const g0 = gradientLine(0, box);
  ok('0° = trái→phải, đi qua tâm', Math.abs(g0.y0 - 25) < 1e-9 && Math.abs(g0.y1 - 25) < 1e-9);
  ok('0° trải hết bề ngang', Math.abs(g0.x0 - 0) < 1e-9 && Math.abs(g0.x1 - 100) < 1e-9);

  const g90 = gradientLine(90, box);
  ok('90° = trên→dưới, đi qua tâm', Math.abs(g90.x0 - 50) < 1e-9 && Math.abs(g90.x1 - 50) < 1e-9);
  ok('90° trải hết bề cao', Math.abs(g90.y0 - 0) < 1e-9 && Math.abs(g90.y1 - 50) < 1e-9);

  // ở góc chéo, độ dài phải ≥ cạnh dài nhất — nếu không, chữ ở góc hộp sẽ mất màu chuyển sắc
  const g45 = gradientLine(45, box);
  const len = Math.hypot(g45.x1 - g45.x0, g45.y1 - g45.y0);
  ok('45° đủ dài để phủ hộp', len >= 100);
  ok('mọi góc đều đối xứng qua tâm', Math.abs((g45.x0 + g45.x1) / 2 - 50) < 1e-9);
}

console.log('[6] isCurved — ngưỡng tránh uốn "gần như thẳng" mà vẫn trả giá phí vẽ từng ký tự');
{
  ok('undefined → false', isCurved(undefined) === false);
  ok('0 → false', isCurved({ curve: 0 }) === false);
  ok('0.2 (quá nhỏ) → false', isCurved({ curve: 0.2 }) === false);
  ok('30 → true', isCurved({ curve: 30 }) === true);
  ok('âm (cong xuống) → true', isCurved({ curve: -30 }) === true);
}

console.log('[7] gradientCss + preset');
{
  ok(
    'gradientCss đúng cú pháp CSS',
    gradientCss({ from: '#002850', to: '#4A6C86', angle: 90 }) === 'linear-gradient(90deg, #002850, #4A6C86)',
  );

  const none = FX_PRESETS.find((p) => p.id === 'none')!;
  ok('preset "Phẳng" trả undefined = gỡ sạch hiệu ứng', applyPreset({ strokeWidth: 1 }, none) === undefined);

  const brass = FX_PRESETS.find((p) => p.id === 'brass')!;
  const merged = applyPreset({ transform: 'uppercase' }, brass);
  ok('preset GỘP vào fx cũ, không xoá field không liên quan', merged?.transform === 'uppercase');
  ok('preset áp được gradient', Boolean(merged?.gradient));

  ok('mọi preset có id + label', FX_PRESETS.every((p) => p.id && p.label));
  ok('id preset là duy nhất', new Set(FX_PRESETS.map((p) => p.id)).size === FX_PRESETS.length);
  // gu quiet-luxury: preset phải TIẾT CHẾ — không lớp bóng nào nhoè quá 2% chiều cao sân khấu
  ok(
    'preset đều tiết chế (bóng ≤ 2%, viền ≤ 0.2%)',
    FX_PRESETS.every(
      (p) =>
        (p.fx?.shadows ?? []).every((s) => Math.abs(s.blur) <= 2) && (p.fx?.strokeWidth ?? 0) <= 0.2,
    ),
  );
}

console.log('[8] fx là TUỲ CHỌN toàn phần — deck cũ không có field nào vẫn hợp lệ');
{
  const empty: TextFx = {};
  ok('không field bắt buộc', Object.keys(empty).length === 0 && hasFx(empty) === false);
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
