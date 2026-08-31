/**
 * Test `mau-bo.ts` — chạy: node_modules/.bin/sucrase-node lib/wallpaper/mau-bo.test.ts
 * (nằm sẵn trên đường `npm test`: bước cuối gom mọi `*.test.ts`.)
 *
 * ─── LUẬT TIN CẬY ────────────────────────────────────────────────────────────
 * Máy này KHÔNG được phép nói ĐẠT bằng cách không tìm thấy gì (bài học `soi-cam-dien`
 * in `⚡ 0` trong khi có 5 entry sai). Nên nó có HAI nửa bắt buộc:
 *   ① cổng phải XANH với năm combo mặc định — không báo oan;
 *   ② cổng phải ĐỎ với TÁM ca đột biến — mỗi ca phá đúng một luật, và phải bị bắt
 *      ĐÚNG KHOÁ đó chứ không phải bắt nhầm khoá khác rồi ăn may.
 * Thiếu nửa ②, tệp này chỉ chứng minh cổng biết im lặng.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  BANG_MAU_BO,
  DOI_CHUNG,
  NGUONG_CHU,
  NGUONG_PHI_CHU,
  TOKEN_CHINH_DUOC,
  accentDat,
  accentRgb,
  comboMacDinh,
  doAccent,
  hueBiCam,
  kep,
  khoangSang,
  rgbToHex,
  soiCombo,
  type ComboNguoiDung,
  type LoiRange,
} from './mau-bo';
import { WALLPAPER_SETS, khoangCachHue } from './sets';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log('  ok  -', name);
  } else {
    fail++;
    console.log('  FAIL-', name);
  }
}

const ROOT = join(__dirname, '..', '..');
const CSS = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');

/** Lấy giá trị một token trong khối theme chỉ định. */
function tokenTrongKhoi(moKhoi: string, ten: string): string {
  const dau = CSS.indexOf(moKhoi);
  if (dau < 0) return '';
  const than = CSS.slice(dau, CSS.indexOf('\n}', dau));
  const m = than.match(new RegExp(`--${ten}:\\s*(#[0-9a-fA-F]{6})`));
  return m ? m[1].toLowerCase() : '';
}

console.log('DRIFT-GUARD — bản sao token phải khớp app/globals.css (bản sao trôi là nói dối)');
{
  const cardToi = tokenTrongKhoi(":root[data-theme='dark'] {", 'card');
  const cardSang = tokenTrongKhoi(":root[data-theme='light'] {", 'card');
  const accentCss = (CSS.match(/--accent:\s*(#[0-9a-fA-F]{6})/) || [])[1]?.toLowerCase() ?? '';

  ok(`dark/--card = ${cardToi} khớp bản sao ${rgbToHex(DOI_CHUNG.cardToi)}`,
    cardToi !== '' && cardToi === rgbToHex(DOI_CHUNG.cardToi));
  ok(`light/--card = ${cardSang} khớp bản sao ${rgbToHex(DOI_CHUNG.cardSang)}`,
    cardSang !== '' && cardSang === rgbToHex(DOI_CHUNG.cardSang));

  /* Accent CSS hiện hành phải bằng accent của bộ MẶC ĐỊNH. Đây là điều giữ cho câu
     "accent không còn là hằng số" KHÔNG kéo theo việc app đổi mặt lúc chưa ai chọn gì. */
  const boDau = BANG_MAU_BO.find((b) => b.setId === WALLPAPER_SETS[0].id)!;
  const hexBoDau = rgbToHex(accentRgb(boDau));
  ok(`--accent ${accentCss} = accent bộ mặc định "${boDau.setId}" ${hexBoDau}`,
    accentCss !== '' && accentCss === hexBoDau);
}

console.log('\nNĂM BẢNG MÀU khoá đúng vào NĂM BỘ đã có — không đẻ bộ thứ sáu');
{
  ok('đúng 5 bảng màu', BANG_MAU_BO.length === 5);
  ok('mỗi bảng màu khoá vào một setId có thật',
    BANG_MAU_BO.every((b) => WALLPAPER_SETS.some((s) => s.id === b.setId)));
  ok('phủ hết 5 bộ, không bộ nào thiếu bảng màu',
    WALLPAPER_SETS.every((s) => BANG_MAU_BO.some((b) => b.setId === s.id)));
  ok('không bộ nào có hai bảng màu',
    new Set(BANG_MAU_BO.map((b) => b.setId)).size === 5);
  ok('mỗi bảng màu khai NGUỒN của ánh xạ phong cách (rỗng = bịa)',
    BANG_MAU_BO.every((b) => b.nguon.trim().length > 20));
}

console.log('\nMỖI ACCENT KHAI RA PHẢI TỰ QUA CỔNG — và nằm trong RANGE của chính nó');
{
  for (const b of BANG_MAU_BO) {
    const c = accentRgb(b);
    const d = doAccent(c);
    const cua = khoangSang(b.accent.h, b.accent.s);
    console.log(
      `     ${b.setId.padEnd(10)} ${rgbToHex(c)}  h${b.accent.h} s${b.accent.s} l${b.accent.l}` +
        `  | chữ trắng ${d.chuTrenAccent.toFixed(2)} · vs card sáng ${d.vsCardSang.toFixed(2)}` +
        ` · vs card tối ${d.vsCardToi.toFixed(2)}  | cửa sổ L [${cua ? cua.join(' … ') : 'KHÔNG CÓ'}]` +
        `${cua ? ` rộng ${(cua[1] - cua[0]).toFixed(3)}` : ''}`,
    );
    ok(`${b.setId}: qua cả 3 ngưỡng (${NGUONG_CHU} / ${NGUONG_PHI_CHU} / ${NGUONG_PHI_CHU})`,
      accentDat(c));
    ok(`${b.setId}: L khai (${b.accent.l}) nằm TRONG cửa sổ tính được`,
      !!cua && b.accent.l >= cua[0] && b.accent.l <= cua[1]);
    ok(`${b.setId}: hue ${b.accent.h}° ngoài mọi vùng cấm màu nghĩa`, hueBiCam(b.accent.h) === null);
  }
}

console.log('\nNĂM CÁ TÍNH phải PHÂN BIỆT ĐƯỢC — không phải một màu chia năm phần');
{
  let ganNhat = 360;
  for (let i = 0; i < BANG_MAU_BO.length; i++) {
    for (let j = i + 1; j < BANG_MAU_BO.length; j++) {
      ganNhat = Math.min(ganNhat, khoangCachHue(BANG_MAU_BO[i].accent.h, BANG_MAU_BO[j].accent.h));
    }
  }
  console.log(`     hai accent gần nhau nhất cách ${ganNhat}°`);
  /* 25° là mức tối thiểu để hai accent không đọc ra như một màu bị lệch in.
     ⚠️ CHỐT SẢN PHẨM, CHƯA CÓ NGUỒN NGHIÊN CỨU — ghi ra để nó không âm thầm thành "chuẩn". */
  ok(`hai accent gần nhau nhất ≥ 25° (đo ${ganNhat}°)`, ganNhat >= 25);
}

console.log('\nCỬA SỔ ĐỘ SÁNG là RANGE HẸP — nói thẳng, đừng hứa tự do không có');
{
  const rong = BANG_MAU_BO.map((b) => {
    const cua = khoangSang(b.accent.h, b.accent.s)!;
    return cua[1] - cua[0];
  });
  const max = Math.max(...rong);
  console.log(`     rộng nhất ${max.toFixed(3)} trên thang L (0…1)`);
  ok('mọi bộ đều CÓ cửa sổ hợp lệ (không bộ nào bất khả thi)', rong.every((r) => r > 0));
  ok(`cửa sổ rộng nhất vẫn < 0,10 — trục sáng gần như không có tự do (đo ${max.toFixed(3)})`,
    max < 0.1);
}

console.log('\nNỬA ① — CỔNG PHẢI XANH với năm combo mặc định (không báo oan)');
{
  for (const s of WALLPAPER_SETS) {
    const loi = soiCombo(comboMacDinh(s.id));
    ok(`${s.id}: 0 lỗi (thấy ${loi.length}${loi.length ? ' — ' + loi.map((l) => l.khoa).join(',') : ''})`,
      loi.length === 0);
  }
}

console.log('\nNỬA ② — CỔNG PHẢI ĐỎ với TÁM ca đột biến, và ĐỎ ĐÚNG KHOÁ');
{
  const goc = comboMacDinh('chan-troi');
  const bat = (ten: string, sua: Partial<ComboNguoiDung>, khoa: LoiRange['khoa']) => {
    const loi = soiCombo({ ...goc, ...sua });
    const trung = loi.find((l) => l.khoa === khoa);
    ok(`${ten} → bắt đúng khoá "${khoa}"${trung ? ': ' + trung.noi.slice(0, 88) : ' (KHÔNG BẮT)'}`,
      !!trung);
  };

  bat('accent hue 12° (đè màu danger)', { accentHue: 12 }, 'accentHue');
  bat('accent hue 190° (đè màu AI)', { accentHue: 190 }, 'accentHue');
  bat('accent bão hoà 0,20 (dưới sàn — accent thành xám)', { accentSat: 0.2 }, 'accentSat');
  bat('accent sáng 0,80 (chữ trắng trên accent trượt 4,5)', { accentL: 0.8 }, 'accentL');
  bat('accent tối 0,20 (lẫn vào --card tối, trượt 3,0)', { accentL: 0.2 }, 'accentL');
  bat('nền bão hoà 0,30 (trên trần 0,12 — nền tự mang gu)', { nenSat: 0.3 }, 'nenSat');
  bat('nấc giảm chói 3 (không phải 0/1/2)', { nacGiamChoi: 3 }, 'nacGiamChoi');
  bat('setId không có thật', { setId: 'bo-thu-sau' }, 'setId');
}

console.log('\nKẸP — đưa combo sai về hợp lệ, và KHÔNG đụng combo đã đúng');
{
  const bay: ComboNguoiDung = {
    setId: 'bo-thu-sau',
    accentHue: 12,
    accentSat: 1.4,
    accentL: 0.95,
    nenHue: 145,
    nenSat: 0.9,
    nacGiamChoi: 7,
  };
  const sach = kep(bay);
  ok('kẹp một combo hỏng toàn tập ra được kết quả', sach !== null);
  ok('combo sau khi kẹp qua cổng sạch', !!sach && soiCombo(sach).length === 0);
  if (sach) {
    console.log(
      `     ${JSON.stringify(bay)}\n  →  ${JSON.stringify(sach)}`,
    );
    ok('hue bị đẩy ra MÉP vùng cấm, không bị vứt về 0 (giữ ý người dùng tới mức luật cho)',
      khoangCachHue(sach.accentHue, 12) < 40 && sach.accentHue !== 0);
  }

  for (const s of WALLPAPER_SETS) {
    const md = comboMacDinh(s.id);
    const lai = kep(md);
    ok(`${s.id}: kẹp một combo ĐÃ ĐÚNG không đổi giá trị nào`,
      !!lai && JSON.stringify(lai) === JSON.stringify(md));
  }
}

console.log('\nRANGE phải khai NGUỒN từng biên — biên không nguồn là biên tự nghĩ ra');
{
  ok('có đúng 6 token chỉnh được', TOKEN_CHINH_DUOC.length === 6);
  ok('mỗi token khai lý do CẢ HAI biên',
    TOKEN_CHINH_DUOC.every((t) => t.vieBienDuoi.length > 30 && t.vieBienTren.length > 30));
  const chuaNguon = TOKEN_CHINH_DUOC.filter((t) => t.nguon === 'CHOT-SAN-PHAM-CHUA-CO-NGUON');
  console.log(`     ${chuaNguon.length}/6 token có biên CHƯA có nguồn nghiên cứu: ` +
    (chuaNguon.map((t) => t.khoa).join(', ') || '(không)'));
  /* Không đòi con số này bằng 0 — đòi nó được KHAI. Một biên chưa có nguồn mà nói thẳng thì
     sáu tháng sau còn sửa được; một biên chưa có nguồn mà im thì thành "chuẩn" (IF-CHUAN-NEN §5). */
  ok('token accentL — biên do WCAG quyết, không do mắt',
    TOKEN_CHINH_DUOC.find((t) => t.khoa === 'accentL')!.nguon === 'WCAG-2.2');
  ok('token accentL khai biên là TÍNH ĐƯỢC (bien = null), không phải cặp số gõ tay',
    TOKEN_CHINH_DUOC.find((t) => t.khoa === 'accentL')!.bien === null);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
