/**
 * Test — LƯỚI CARO PHẢI THẬT SỰ NHÌN THẤY ĐƯỢC, đo bằng số chứ không bằng niềm tin.
 * Chạy: node_modules/.bin/sucrase-node lib/wallpaper/caro-hien.test.ts
 *
 * ── CA THẬT SINH RA CỔNG NÀY (02/09, ảnh 20:36) ──────────────────────────────────────────────
 * Lưới caro VÔ HÌNH ở cả 6 ảnh, cả sáng lẫn tối, cả ba khổ. Mã "đúng", `tsc` 0, `test:sweep`
 * xanh, và chú thích ngay cạnh chỗ sai thì viết rất thuyết phục:
 *     *"nét vẽ bằng s1, mà s1 ĐÃ theo theme — tương phản vì thế đã tự đúng chiều"*
 * Câu đó đúng về CHIỀU và sai về ĐỘ LỚN. Không ai tính con số, kể cả người viết nó (là tôi).
 *
 * Số thật: `NEO_DO_SANG` cố ý HẸP để chữ trên kính còn qua AA. Dark night [0.05 … 0.17], spread
 * .42 ⇒ `s1` và `s3` chênh ~8 đơn vị kênh sRGB; nhân alpha .16 còn ~1,3 đơn vị. Light còn tệ
 * hơn: ~0,8. ⇒ Lấy MỰC TỪ TRONG DẢI NỀN thì không bao giờ hiện, alpha bao nhiêu cũng vậy.
 *
 * 📌 Lần THỨ HAI cùng một bệnh — `sets.ts:159-165` đã ghi ca y hệt hôm 16/08: *"qua hết cửa
 * tương phản nhưng mở bản vẽ ra thì năm bộ gần như đen tuyền"*. Cả hai lần đều là **PASS giả ở
 * tầng thị giác**: mọi cổng đo ĐỘ ĐỌC đều xanh, vì không cổng nào đo ĐỘ THẤY.
 *
 * ⇒ Cổng này đo đúng thứ còn thiếu: nét sau khi hoà lên nền có KHÁC nền đủ để mắt bắt không.
 */
import { WALLPAPER_SETS, bangMau, hslToRgb } from './sets';
import { relLuminance } from '../adaptive-contrast';
import { PERIODS, THEMES } from './types';
import type { Rgb, WallpaperPeriod, WallpaperTheme } from './types';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

/** Hoà một màu có alpha lên một nền đục — đúng phép `source-over` mà trình duyệt làm. */
function hoa(muc: Rgb, nen: Rgb, a: number): Rgb {
  return [0, 1, 2].map((i) => Math.round(muc[i] * a + nen[i] * (1 - a))) as unknown as Rgb;
}

/** Tỉ số tương phản WCAG giữa hai màu đục. */
function tiSo(x: Rgb, y: Rgb): number {
  const a = relLuminance(x);
  const b = relLuminance(y);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/* Gương của `css.ts` case 'caro'. ⚠️ Giữ khớp bằng ca [4] bên dưới — nếu `css.ts` đổi mà bản
   này không đổi thì mọi ca ở trên đang đo một hàm không ai chạy (cổng hoá mù). */
function mucCaro(hue: number, theme: WallpaperTheme): Rgb {
  return hslToRgb(hue, 0.4, theme === 'dark' ? 0.58 : 0.62);
}
function alphaCaro(theme: WallpaperTheme): { mo: number; dam: number } {
  return theme === 'dark' ? { mo: 0.1, dam: 0.22 } : { mo: 0.2, dam: 0.42 };
}

/* Ngưỡng. Cố ý THẤP: đây không phải ngưỡng ĐỌC CHỮ (4,5) mà là ngưỡng THẤY MỘT ĐƯỜNG KẺ trên
   nền — nét phải nhận ra được nhưng KHÔNG được cướp chú ý khỏi nội dung. Nét lớn mang nhịp 5
   nên phải rõ hơn nét nhỏ. */
const SAN_NET_LON = 1.25;
const SAN_NET_NHO = 1.08;
/* Trần kênh của theme tối — `sets.ts:164`: chữ `--t3` trên pill kính đạt 4,5 khi kênh hình nền
   ≤ 138. Nét sáng lên mà vượt trần này là đổi một lỗi thấy được lấy một lỗi ĐỌC được. */
const TRAN_KENH_TOI = 138;

const bo = WALLPAPER_SETS.find((s) => s.layer === 'caro');

console.log('[1] Có bộ nào dùng lớp caro không — nếu không thì mọi ca dưới là vô nghĩa');
ok('tìm được bộ dùng layer caro', Boolean(bo));

if (bo) {
  console.log('\n[2] NÉT PHẢI THẤY ĐƯỢC — 4 buổi × 2 theme, cả nét lớn lẫn nét nhỏ');
  for (const theme of THEMES as WallpaperTheme[]) {
    for (const period of PERIODS as WallpaperPeriod[]) {
      const p = bangMau(bo, period, theme);
      const nen = p.stops[p.stops.length - 1]; // s3 — chặng tối nhất, đáy nền
      const muc = mucCaro(bo.hue, theme);
      const { mo, dam } = alphaCaro(theme);
      const tLon = tiSo(hoa(muc, nen, dam), nen);
      const tNho = tiSo(hoa(muc, nen, mo), nen);
      ok(`${theme}/${period} nét LỚN ${tLon.toFixed(3)} ≥ ${SAN_NET_LON}`, tLon >= SAN_NET_LON);
      ok(`${theme}/${period} nét nhỏ ${tNho.toFixed(3)} ≥ ${SAN_NET_NHO}`, tNho >= SAN_NET_NHO);
      ok(`${theme}/${period} nét lớn ĐẬM HƠN nét nhỏ (nhịp 5 còn đọc ra)`, tLon > tNho);
    }
  }

  console.log('\n[3] KHÔNG ĐƯỢC ĐỔI LỖI THẤY LẤY LỖI ĐỌC — trần kênh 138 ở theme tối');
  for (const period of PERIODS as WallpaperPeriod[]) {
    const p = bangMau(bo, period, 'dark');
    const nen = p.stops[p.stops.length - 1];
    const { dam } = alphaCaro('dark');
    const hop = hoa(mucCaro(bo.hue, 'dark'), nen, dam);
    const kenhMax = Math.max(...hop);
    ok(`dark/${period}: kênh cao nhất của nét ${kenhMax} ≤ ${TRAN_KENH_TOI}`, kenhMax <= TRAN_KENH_TOI);
  }

  console.log('\n[4] ĐỐI CHỨNG — bản CŨ (mực lấy từ trong dải nền) phải ĐỎ');
  /* Đây là khối quan trọng nhất của tệp. Không có nó thì mọi ca trên chỉ chứng minh "số hiện
     tại qua ngưỡng hiện tại" — mà ngưỡng do chính tôi đặt. Khối này chứng minh cổng PHÂN BIỆT
     ĐƯỢC bản sai khỏi bản đúng, bằng cách dựng lại đúng phép tính đã cho ra 6 ảnh vô hình. */
  let soCaCuTruot = 0;
  for (const theme of THEMES as WallpaperTheme[]) {
    for (const period of PERIODS as WallpaperPeriod[]) {
      const p = bangMau(bo, period, theme);
      const nen = p.stops[p.stops.length - 1];
      const s1Cu = p.stops[1];              // bản cũ vẽ nét bằng s1
      const tLonCu = tiSo(hoa(s1Cu, nen, 0.16), nen); // alpha cũ .16
      if (tLonCu < SAN_NET_LON) soCaCuTruot += 1;
    }
  }
  ok(`bản CŨ trượt ngưỡng ở CẢ 8 tổ hợp (đo ${soCaCuTruot}/8)`, soCaCuTruot === 8);

  console.log('\n[5] GƯƠNG PHẢI KHỚP BẢN THẬT — chống cổng hoá mù');
  /* Tệp này chép công thức mực sang đây để tính được. Nếu `css.ts` đổi mà bản chép không đổi
     thì mọi ca trên đo một hàm không ai chạy — đúng bệnh "vật bị dời khỏi tầm đo". Neo bằng
     cách đọc chính chuỗi CSS: màu mực phải XUẤT HIỆN trong nền sinh ra. */
  const { nenCss } = require('./css') as typeof import('./css');
  const { nguonSang } = require('./sets') as typeof import('./sets');
  for (const theme of THEMES as WallpaperTheme[]) {
    const p = bangMau(bo, 'day', theme);
    const css = nenCss(bo, p, nguonSang(12));
    const m = mucCaro(bo.hue, theme);
    /* ⚠️ KHÔNG dấu cách sau dấu phẩy: `rgba()` của `sets.ts` xuất `rgba(105,155,191,0.220)`.
       Bản đầu tôi viết `rgba(105, 155, 191` theo thói quen CSS và ca đỏ oan — màu thì khớp
       chính xác. Ca đọc-chuỗi luôn có rủi ro này: nó đo ĐỊNH DẠNG chứ không đo GIÁ TRỊ. Giữ
       nó vì nó là thứ duy nhất neo được bản gương vào bản thật, nhưng in ra chuỗi khi đỏ để
       lần sau phân biệt ngay "sai màu" với "sai dấu cách". */
    const co = css.includes(`rgba(${m[0]},${m[1]},${m[2]}`);
    if (!co) console.log(`        ↳ ${theme}: CSS bắt đầu bằng → ${css.slice(0, 150)}`);
    ok(`${theme}: màu mực gương (${m.join(',')}) có mặt trong CSS thật`, co);
  }
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
