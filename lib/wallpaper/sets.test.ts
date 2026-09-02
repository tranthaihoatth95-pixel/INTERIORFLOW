/** Test `sets.ts` + `css.ts` — chạy: node_modules/.bin/sucrase-node lib/wallpaper/sets.test.ts */
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  BAN_KINH_CAM,
  GOC_MAU_NGHIA,
  WALLPAPER_SETS,
  bangMau,
  hslToRgb,
  khoangCachHue,
  nguonSang,
  timBo,
  trongVungCam,
} from './sets';
import { nenCss } from './css';
import { PERIODS, THEMES } from './types';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const ROOT = join(__dirname, '..', '..');

/** hex → hue (0-360), dùng để kiểm bảng vùng cấm khớp token thật. */
function hueTuHex(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let hue: number;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  return (hue + 360) % 360;
}

console.log('DRIFT-GUARD — góc màu nghĩa khai ở sets.ts khớp hex thật trong globals.css');
{
  const css = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');
  const lay = (ten: string) => {
    // lấy lần khai ĐẦU TIÊN (khối :root dark) — cùng khối mà TOKEN/contrast.ts soi
    const m = css.match(new RegExp(`--${ten}:\\s*(#[0-9a-fA-F]{6})`));
    return m ? m[1] : '';
  };
  for (const [ten, khai] of Object.entries(GOC_MAU_NGHIA)) {
    const hex = lay(ten);
    const that = hueTuHex(hex);
    ok(
      `--${ten} ${hex} → ${that.toFixed(1)}° ≈ khai ${khai}° (lệch <2°)`,
      hex !== '' && Math.abs(that - khai) < 2,
    );
  }
}

console.log('V2 — năm bộ, mỗi bộ nói được MỘT CÂU, khác nhau về CƠ CHẾ không chỉ màu');
{
  /* 🔴 SỬA 02/09 — sáu ca ở khối này đều so với hằng `5`, và cả sáu đỏ khi thêm bộ `giay-caro`.
     Đọc lại thì con số 5 KHÔNG phải một luật: luật là *"mỗi bộ là một CƠ CHẾ khác nhau, không
     phải năm màu của cùng một thứ"*. Số 5 chỉ là số bộ có mặt lúc viết ca.
     ⇒ Ca ĐẾM giữ nguyên dạng đếm cứng (đổi 5→6) — cố ý, để thêm một bộ luôn là một quyết định
     có người sửa test, không lọt vào bằng một dòng vô hình.
     ⇒ Ca PHÂN BIỆT thì suy từ `WALLPAPER_SETS.length` — chúng canh "không trùng", và viết cứng
     số ở đó là buộc chặt một bất biến vào một con số chẳng liên quan. Đó đúng kiểu ca đỏ vì
     lý do sai, rồi người sau sửa cho hết đỏ mà không đọc nó đang canh gì. */
  const SO_BO = 5;
  ok(`đúng ${SO_BO} bộ`, WALLPAPER_SETS.length === SO_BO);
  ok('id không trùng', new Set(WALLPAPER_SETS.map((s) => s.id)).size === WALLPAPER_SETS.length);
  ok('mỗi bộ một CƠ CHẾ hình học KHÁC NHAU', new Set(WALLPAPER_SETS.map((s) => s.layer)).size === WALLPAPER_SETS.length);
  ok(
    'mỗi bộ có MỘT CÂU đủ 2 ngôn ngữ, không rỗng, không trùng nhau',
    WALLPAPER_SETS.every((s) => s.cau[0].length > 20 && s.cau[1].length > 20 && s.cau[0] !== s.cau[1]),
  );
  ok('câu không trùng giữa các bộ', new Set(WALLPAPER_SETS.map((s) => s.cau[0])).size === WALLPAPER_SETS.length);
  ok(
    'độ rộng dải sáng-tối khác nhau (không phải mấy màu của cùng một thứ)',
    new Set(WALLPAPER_SETS.map((s) => s.spread)).size === WALLPAPER_SETS.length,
  );
}

console.log('V2 ràng buộc ① — KHÔNG bộ nào lấn phổ màu nghĩa, kể cả sau khi dịch theo giờ');
{
  for (const s of WALLPAPER_SETS) {
    // dịch hue theo giờ nằm trong [-10, +8] (DICH_HUE) — kiểm cả hai đầu biên
    const bien = [s.hue - 10, s.hue, s.hue + 8];
    const sach = bien.every((h) => !trongVungCam(h));
    const gan = Math.min(
      ...bien.flatMap((h) => Object.values(GOC_MAU_NGHIA).map((g) => khoangCachHue(h, g))),
    );
    ok(`${s.id} hue ${s.hue}° — cách màu nghĩa gần nhất ${gan.toFixed(0)}° (> ${BAN_KINH_CAM}°)`, sach);
  }
}

console.log('V2 ràng buộc ② — bão hoà rất thấp ⇒ không bộ nào KHOÁ vào màu nhấn chưa chốt');
{
  ok('mọi bộ sat ≤ 0.12', WALLPAPER_SETS.every((s) => s.sat <= 0.12));
  // mòng két ~185° và mận ~335° đều cách xa mọi hue nền ⇒ không bộ nào "chỉ sống với một màu"
  for (const ungVien of [185, 335]) {
    const gan = Math.min(...WALLPAPER_SETS.map((s) => khoangCachHue(s.hue, ungVien)));
    ok(`ứng viên màu nhấn ${ungVien}° cách hue nền gần nhất ${gan.toFixed(0)}° (≥ 15°)`, gan >= 15);
  }
}

console.log('V2 — bốn thời điểm cho ra bốn bảng màu KHÁC NHAU ở mọi bộ, mọi theme');
{
  for (const theme of THEMES) {
    for (const s of WALLPAPER_SETS) {
      const khoa = PERIODS.map((p) => bangMau(s, p, theme).stops.map((c) => c.join()).join('|'));
      ok(`${s.id}/${theme} — 4 thời điểm ra 4 bảng khác nhau`, new Set(khoa).size === 4);
    }
  }
}

console.log('V2 — theme TỐI luôn tối, theme SÁNG luôn sáng (không đảo ngược ở bộ nào)');
{
  for (const s of WALLPAPER_SETS) {
    for (const p of PERIODS) {
      const d = bangMau(s, p, 'dark');
      const l = bangMau(s, p, 'light');
      // TRẦN của theme tối KHÔNG phải số tự đặt: chữ --t3 kem trên pill kính đạt 4.5 khi
      // kênh hình nền ≤ 138. Khẳng định đúng ràng buộc đó, không phải một ngưỡng tuỳ hứng.
      const kenhMax = Math.max(...d.stops.flat());
      ok(`${s.id}/${p} tối: kênh sáng nhất ${kenhMax} ≤ 138 (trần suy từ tương phản)`, kenhMax <= 138);
      ok(`${s.id}/${p} sáng: lumMin ${l.lumMin.toFixed(3)} > 0.60`, l.lumMin > 0.6);
    }
  }
}

console.log('hslToRgb — thuần, biên an toàn');
{
  ok('sat 0 ra xám', hslToRgb(200, 0, 0.5).join() === '128,128,128');
  ok('l=0 ra đen', hslToRgb(200, 0.5, 0).join() === '0,0,0');
  ok('l=1 ra trắng', hslToRgb(200, 0.5, 1).join() === '255,255,255');
  ok('hue âm không throw', hslToRgb(-40, 0.3, 0.4).every((v) => v >= 0 && v <= 255));
  ok('hue > 360 không throw', hslToRgb(760, 0.3, 0.4).every((v) => v >= 0 && v <= 255));
}

console.log('V2 — nền MANG TIN: nguồn sáng lấy từ mặt trời thật, không phải hoa văn');
{
  const sang = nguonSang(6);
  const trua = nguonSang(12.5);
  const chieu = nguonSang(19);
  const dem = nguonSang(2);
  ok('sáng sớm mặt trời bên trái', sang.x < 20);
  ok('giữa ngày mặt trời giữa cung', trua.x > 40 && trua.x < 60);
  ok('chiều muộn mặt trời bên phải', chieu.x > 85);
  ok('đêm = đã lặn', dem.daLan === true);
  ok('góc vệt nắng đổi theo giờ (sáng ≠ trưa ≠ chiều)',
    new Set([sang.gocVet, trua.gocVet, chieu.gocVet].map((g) => g.toFixed(1))).size === 3);
}

console.log('css.ts — chuỗi background sinh ra tất định, đủ 40 tổ hợp, không có hex rời rạc');
{
  const thay = new Set<string>();
  let hexRoiRac = 0;
  for (const s of WALLPAPER_SETS) {
    for (const p of PERIODS) {
      for (const t of THEMES) {
        const gio = { dawn: 6, day: 12, dusk: 18.5, night: 2 }[p];
        const css = nenCss(s, bangMau(s, p, t), nguonSang(gio));
        if (/#[0-9a-fA-F]{3,8}\b/.test(css)) hexRoiRac++;
        thay.add(css);
      }
    }
  }
  /* Số tổ hợp SUY RA, không viết cứng: bộ × buổi × theme. Luật đang canh là *"không hai tổ hợp
     nào ra cùng một nền"* — tức mỗi (bộ, buổi, theme) thật sự nhìn khác nhau. Viết cứng 40 là
     buộc luật ấy vào số bộ hiện có, và nó đỏ ngay khi thêm bộ dù chẳng có gì hỏng. */
  const soToHop = WALLPAPER_SETS.length * PERIODS.length * THEMES.length;
  ok(`${soToHop} tổ hợp ra ${soToHop} chuỗi khác nhau`, thay.size === soToHop);
  ok('0 hex rời rạc trong CSS sinh ra (mọi màu đi qua bảng màu)', hexRoiRac === 0);
  ok('không có animation trong nền (nền đứng yên — xem settle.ts)',
    [...thay].every((c) => !c.includes('animation')));
}

console.log('timBo — id lạ rơi về bộ đầu, không throw');
{
  ok('id lạ → bộ đầu', timBo('khong-ton-tai').id === WALLPAPER_SETS[0].id);
  ok('id thật → đúng bộ', timBo('binh-do').id === 'binh-do');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
