/**
 * lib/colors/registry.test.ts — cửa chặn lúc chạy + bảng tham chiếu trend.
 * Chạy: node_modules/.bin/sucrase-node lib/colors/registry.test.ts
 */
import { applyRegistryConfig, mergeRegistryConfig, envRegistryConfig, EMPTY_REGISTRY_CONFIG } from './registry';
import { TREND_COLORS, TREND_MISSING_YEARS, trendColorsByYear, latestTrendYear } from './trend';
import type { ColorSource } from './types';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const lab = { L: 50, a: 0, b: 0 };
const SOURCES: ColorSource[] = [
  {
    id: 'src_a', name: 'Bảng A', origin: 'user-csv', scope: 'studio', updatedAt: 0,
    colors: [
      { code: '1', name: 'x', hex: '#111111', lab, brand: 'HãngX' },
      { code: '2', name: 'y', hex: '#222222', lab, brand: 'HãngY' },
      { code: '3', name: 'z', hex: '#333333', lab },
    ],
  },
  {
    id: 'src_b', name: 'Bảng B', origin: 'larkbase', scope: 'project', projectId: 'p1', updatedAt: 0,
    colors: [{ code: '4', name: 'w', hex: '#444444', lab, brand: 'hãngx ' }],
  },
];

console.log('\n[1] applyRegistryConfig — không cấu hình thì không đụng gì');
{
  const out = applyRegistryConfig(SOURCES, EMPTY_REGISTRY_CONFIG);
  ok('giữ đủ 2 nguồn', out.length === 2);
  ok('giữ đủ màu', out[0].colors.length === 3 && out[1].colors.length === 1);
}

console.log('\n[2] Chặn theo HÃNG — xuyên mọi nguồn, không phân biệt hoa/thường/khoảng trắng');
{
  const out = applyRegistryConfig(SOURCES, { disabledSourceIds: [], blockedBrands: ['hangx', 'HãngX'] });
  ok('màu HãngX biến mất khỏi Bảng A', out[0].colors.length === 2 && !out[0].colors.some((c) => c.brand === 'HãngX'));
  ok('"hãngx " (khác hoa/thường + dấu cách) cũng bị chặn ở Bảng B', out[1].colors.length === 0);
  ok('màu KHÔNG khai brand không bị chặn oan', out[0].colors.some((c) => c.code === '3'));
  ok('nguồn rỗng sạch VẪN giữ lại để UI giải thích được', out.length === 2);
  ok('không đột biến mảng gốc', SOURCES[0].colors.length === 3);
}

console.log('\n[3] Tắt hẳn một nguồn — dữ liệu vẫn còn, chỉ không dùng nữa');
{
  const out = applyRegistryConfig(SOURCES, { disabledSourceIds: ['src_b'], blockedBrands: [] });
  ok('src_b biến mất khỏi kết quả', out.length === 1 && out[0].id === 'src_a');
  ok('id không tồn tại → không sao', applyRegistryConfig(SOURCES, { disabledSourceIds: ['none'], blockedBrands: [] }).length === 2);
}

console.log('\n[4] env + máy = HỢP, máy KHÔNG mở lại được thứ đã chặn ở mức phát hành');
{
  const env = envRegistryConfig({ NEXT_PUBLIC_IF_BLOCKED_COLOR_BRANDS: ' HãngX , HãngY ', NEXT_PUBLIC_IF_DISABLED_COLOR_SOURCES: 'src_b' });
  ok('env cắt khoảng trắng + bỏ mục rỗng', JSON.stringify(env.blockedBrands) === '["HãngX","HãngY"]');
  ok('env đọc được danh sách nguồn tắt', JSON.stringify(env.disabledSourceIds) === '["src_b"]');
  ok('env rỗng → cấu hình rỗng', JSON.stringify(envRegistryConfig({})) === JSON.stringify(EMPTY_REGISTRY_CONFIG));

  const merged = mergeRegistryConfig(env, { disabledSourceIds: ['src_a'], blockedBrands: ['HãngZ'] });
  ok('gộp-THÊM chứ không ghi đè (env vẫn còn sau khi gộp)',
    merged.blockedBrands.includes('HãngX') && merged.blockedBrands.includes('HãngZ') && merged.disabledSourceIds.length === 2);
  ok('khử trùng', mergeRegistryConfig(env, env).blockedBrands.length === 2);

  const out = applyRegistryConfig(SOURCES, merged);
  ok('cấu hình gộp có hiệu lực: 0 nguồn còn lại', out.length === 0);
}

console.log('\n[5] trend.ts — TRẦN CỨNG 1 mục/năm/bên công bố + BẮT BUỘC có nguồn dẫn');
{
  ok('mọi mục đều có link nguồn', TREND_COLORS.every((t) => /^https?:\/\//.test(t.source)));
  ok('mọi mục đều có năm + tên', TREND_COLORS.every((t) => t.year > 2000 && !!t.name));
  ok('mọi hex đúng định dạng #rrggbb', TREND_COLORS.every((t) => /^#[0-9a-f]{6}$/.test(t.hex)));

  // Trần: 1 mục/năm — TRỪ năm công bố CẶP màu, và mục thứ hai phải ghi rõ lý do ở `note`.
  const byYear = new Map<number, typeof TREND_COLORS>();
  for (const t of TREND_COLORS) byYear.set(t.year, [...(byYear.get(t.year) ?? []), t]);
  ok('không năm nào quá 2 mục', [...byYear.values()].every((v) => v.length <= 2));
  ok('năm có 2 mục thì CẢ HAI phải ghi lý do (cặp màu)',
    [...byYear.values()].every((v) => v.length < 2 || v.every((t) => !!t.note)));

  // Kích thước bộ sưu tập là chính ranh giới pháp lý — chặn ở test, không chỉ ở comment.
  ok(`tổng số mục nhỏ (${TREND_COLORS.length} ≤ 30) — không phải bảng tra`, TREND_COLORS.length <= 30);

  ok('2026 khai là CÒN THIẾU, không bịa', TREND_MISSING_YEARS.includes(2026) && trendColorsByYear(2026).length === 0);
  ok('latestTrendYear = năm lớn nhất trong bảng', latestTrendYear() === Math.max(...TREND_COLORS.map((t) => t.year)));
  ok('trendColorsByYear(2021) trả CẢ CẶP', trendColorsByYear(2021).length === 2);
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
