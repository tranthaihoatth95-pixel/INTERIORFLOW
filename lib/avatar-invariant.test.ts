/**
 * lib/avatar-invariant.test.ts — KHOÁ HAI INVARIANT của avatar (Hoà chốt 06/08).
 * Chạy: `node_modules/.bin/sucrase-node lib/avatar-invariant.test.ts`
 *
 *   ĐỔI ĐƯỢC:  tông DA · phụ kiện · nền mặt trung tính
 *   CẤM ĐỔI:   hình/khối cấu kiện · MÀU cấu kiện tuỳ tiện
 *
 * Vì sao file này DỰNG THẬT chứ không đọc nguồn dạng text như `avatar-render.test.ts`:
 * hai lỗi nó đi bắt là lỗi HÀNH VI, không phải lỗi toạ độ.
 *   · "tai ≠ mặt" chỉ lộ ra khi đã tính xong `darken()` — đọc chuỗi `darken(skin, .2)` trong
 *     nguồn không cho biết nó có bằng màu mặt tại chỗ đó hay không.
 *   · "đội nón mà tóc không đổi" chỉ lộ ra khi so HAI bản dựng với hai `config` khác nhau —
 *     nguồn thì lúc nào cũng chỉ có một bản.
 * `avatar-render.test.ts` (khoá toạ độ, đọc text) VẪN GIỮ — hai file bắt hai loại lỗi khác nhau.
 *
 * Hai rào kỹ thuật phải gỡ để dựng được, và cách gỡ:
 *   ① `sucrase-node` không hiểu alias `@/…` ⇒ vá `Module._resolveFilename` ngay đầu file.
 *      (Đây là lý do `avatar-render.test.ts` cũ phải đọc text — nay đã có đường.)
 *   ② `sucrase-node` dịch JSX theo lối CỔ ĐIỂN (`React.createElement`) trong khi Next dùng lối
 *      tự động nên `AvatarRenderer.tsx` không `import React` ⇒ gắn `React` lên `global`.
 *      KHÔNG sửa file sản phẩm để chiều test.
 */
import Module from 'module';
import path from 'path';
import { readFileSync } from 'fs';

const ROOT = path.join(__dirname, '..');

/* ① alias @/ → gốc repo */
const _resolve = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (request: string, ...rest: unknown[]) {
  return _resolve.call(this, request.startsWith('@/') ? path.join(ROOT, request.slice(2)) : request, ...rest);
};

/* ② React toàn cục cho JSX lối cổ điển */
const React = require('react');
(global as any).React = React;

const { renderToStaticMarkup } = require('react-dom/server');
const AR = require(path.join(ROOT, 'components/avatar/AvatarRenderer.tsx'));
const AV = require(path.join(ROOT, 'lib/avatar.ts'));

const { AvatarRenderer, skinRamp, HAT_COVER_Y, HAIRLINE_Y, mix } = AR;
const { normalizeAvatar, BASE_TONES, SKIN_TONES, HAT_STYLES, HAIR_STYLES, ACCESSORY_STYLES, BG_COLOR_KEYS } = AV;

const SRC = readFileSync(path.join(ROOT, 'components/avatar/AvatarRenderer.tsx'), 'utf8');

let pass = 0;
let fail = 0;
function ok(label: string, cond: unknown) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

function render(cfg: Record<string, unknown>): string {
  return renderToStaticMarkup(
    React.createElement(AvatarRenderer, { config: normalizeAvatar(cfg), size: 200, frame: false }),
  );
}

/** Mọi phần tử mang `data-skin` → [nấc, màu đã tô]. Nhận cả `fill=` lẫn `stop-color=`. */
function skinPaints(svg: string): Array<{ step: string; color: string }> {
  const out: Array<{ step: string; color: string }> = [];
  for (const tag of svg.match(/<[^>]*\sdata-skin="[^"]+"[^>]*>/g) ?? []) {
    const step = (tag.match(/data-skin="([^"]+)"/) as RegExpMatchArray)[1];
    const color = (tag.match(/(?:\sfill|stop-color)="([^"]+)"/) || [, ''])[1];
    out.push({ step, color });
  }
  return out;
}

/** Mọi chuỗi hình học `d="…"` — dấu vân tay HÌNH/KHỐI của bản dựng. */
function shapes(svg: string): string[] {
  return (svg.match(/\sd="[^"]+"/g) ?? []).slice().sort();
}

/** Cắt đúng lớp tóc cần soi (`front` hoặc `back`) ra khỏi bản dựng. */
function hairLayer(svg: string, which: 'front' | 'back'): string {
  const i = svg.indexOf(`data-hair-layer="${which}"`);
  if (i === -1) return '';
  return svg.slice(svg.lastIndexOf('<g', i), svg.indexOf('</g>', i) + 4);
}

const BASE_CFG = { base: 2, hair: 4, hairColor: 'brown', shirt: 'hoodie', shirtColor: 'navy' };

/* ══════════════ [1] SỬA 1 — DA LÀ MỘT BIẾN ══════════════ */
function testSkinIsOneToken() {
  console.log('\n[1] Da = MỘT biến — mặt · tai · cổ đọc cùng một thang');

  // (a) Không một vùng da nào được tô bằng màu nằm ngoài thang.
  let offRamp = 0;
  let painted = 0;
  for (const tone of SKIN_TONES) {
    const ramp = skinRamp(BASE_TONES[tone]);
    for (const p of skinPaints(render({ ...BASE_CFG, base: tone, freckles: true, blush: 'soft' }))) {
      painted += 1;
      if (ramp[p.step] !== p.color) {
        offRamp += 1;
        console.log(`      ↳ tone ${tone} nấc "${p.step}": tô ${p.color}, thang nói ${ramp[p.step]}`);
      }
    }
  }
  ok(`mọi vùng da tô ĐÚNG nấc của thang (${painted} vùng × 6 tông, lệch ${offRamp})`, offRamp === 0);
  ok('có vùng da để mà kiểm (chống test rỗng luôn xanh)', painted >= 6 * 10);

  /* (a-bis) 🔴 RÀO CHÍNH — thêm 06/08 sau vòng KIỂM PHẢN BIỆN.
   *
   * Rào (a) ở trên CHỈ soi phần tử mang `data-skin`. Kiểm phản biện dựng lại NGUYÊN bug gốc
   * (tai trái `−.04`, tai phải `−.20`) nhưng XOÁ thuộc tính `data-skin` đi — và (a) xanh 23/23.
   * Bỏ một thuộc tính `data-*` không đổi một pixel nào, không tsc/lint nào cản ⇒ rào (a) một
   * mình là lưới có lỗ to bằng bàn tay. Rào (d) cũng không cứu: nó grep chuỗi `darken(skin`,
   * tức khoá TÊN BIẾN, nên `darken(BASE_TONES[config.base], .2)` đi thẳng qua.
   *
   * Rào này KHÔNG dựa vào dấu nào cả. Nó hỏi một câu thuần hành vi:
   *   «màu nào ĐỔI khi ta đổi tông da? Mọi màu như thế BẮT BUỘC phải là một nấc của thang.»
   * Vẽ da bằng bất kỳ cách nào — biến khác tên, không data-skin, hàm bọc mấy lớp — thì màu đó
   * vẫn phải đổi theo tông da, nên vẫn rơi vào lưới này. */
  const paints = (svg: string): string[] =>
    (svg.match(/(?:fill|stroke|stop-color)="#[0-9A-Fa-f]{3,8}"/g) ?? []).map((s) => s.slice(s.indexOf('"') + 1, -1));

  const probeCfg = { ...BASE_CFG, freckles: true, blush: 'strong', hat: 'none', glasses: 'none' };
  const p1 = paints(render({ ...probeCfg, base: 1 }));
  const p6 = paints(render({ ...probeCfg, base: 6 }));
  ok('hai bản dựng cùng số mảng tô (điều kiện để so theo vị trí)', p1.length === p6.length && p1.length > 20);

  // Môi + má là PHA MÀU KHÁC vào da (tint), không phải nấc sáng-tối — miễn trừ CÓ TÊN, đúng 2 công thức.
  const tints = (base: string) => [mix(base, '#A0403C', 0.6), mix(base, '#E8746A', 0.58), mix(base, '#E8746A', 0.36)];
  const allowed = new Set([...Object.values(skinRamp(BASE_TONES[1])), ...tints(BASE_TONES[1])].map((c) => c.toUpperCase()));
  const skinDriven = p1.filter((c, i) => p6[i] !== c);
  const stray = skinDriven.filter((c) => !allowed.has(c.toUpperCase()));
  for (const s of new Set(stray)) console.log(`      ↳ màu ${s} đổi theo tông da nhưng KHÔNG phải nấc nào của thang`);
  ok(`mọi màu ĐỔI THEO tông da đều là nấc của thang (${skinDriven.length} màu, lạc ${stray.length})`, stray.length === 0);
  ok(`có màu đổi theo tông da để mà kiểm (thấy ${skinDriven.length})`, skinDriven.length >= 8);

  /* (a-ter) Thang phải CÓ NẤC PHÂN BIỆT ĐƯỢC. Kiểm phản biện dí đúng chỗ: ép cả 6 nấc về `0`
   * thì mọi vùng da cùng một màu — mất sạch khối cầu, mặt phẳng lì như giấy dán — mà test cũ
   * vẫn xanh, vì nó chỉ khoá tính NHẤT QUÁN chứ chưa bao giờ khoá tính PHÂN BIỆT. */
  const rampVals = skinRamp(BASE_TONES[3]);
  const lum = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  const order = ['lit', 'sheen', 'base', 'shade', 'recess', 'deep', 'cast'];
  const lums = order.map((k) => lum(rampVals[k]));
  const strictlyDarker = lums.every((v, i) => i === 0 || v < lums[i - 1] - 1);
  ok(`thang đi từ sáng xuống tối, không nấc nào trùng/đảo (${lums.map((v) => v.toFixed(0)).join('>')})`, strictlyDarker);

  /* (b) Bug đã báo: tai phải TỐI HƠN cả chỗ tối nhất của mặt ⇒ đọc ra hai mảnh rời.
   *     ⚠️ Bản cũ chọn tai bằng `data-skin` nên gom nhầm CẢ 2 thẻ `<stop>` của gradient mặt vào
   *     tập "tai" ⇒ có thành phần tự-so-với-chính-mình, và xanh RỖNG khi ai đó gỡ `data-skin`
   *     (kiểm phản biện chỉ ra). Nay chọn tai bằng TOẠ ĐỘ `cx` — thứ không thể bỏ đi mà tai vẫn
   *     còn trên hình. */
  const svg = render(BASE_CFG);
  const ramp = skinRamp(BASE_TONES[2]);
  const faceStops = (svg.match(/<stop[^>]*stop-color="[^"]+"[^>]*>/g) ?? [])
    .filter((t) => t.includes('data-skin='))
    .map((t) => (t.match(/stop-color="([^"]+)"/) as RegExpMatchArray)[1]);
  const earFill = (cx: string) => {
    const tag = (svg.match(new RegExp(`<ellipse cx="${cx}" cy="117" rx="9"[^>]*>`)) ?? [''])[0];
    return (tag.match(/fill="([^"]+)"/) || [, ''])[1];
  };
  const earL = earFill('41');
  const earR = earFill('159');
  ok('gradient khuôn mặt dùng đúng 3 nấc lit/base/shade', faceStops.join('|') === [ramp.lit, ramp.base, ramp.shade].join('|'));
  ok(`tìm được cả hai tai trên hình (trái "${earL}" · phải "${earR}")`, !!earL && !!earR);
  ok('màu tai NẰM TRONG bộ màu của khuôn mặt (hết "tai ≠ mặt")', faceStops.includes(earL) && faceStops.includes(earR));

  // (c) Đổi tông da phải kéo theo TOÀN BỘ vùng da. Vùng nào đứng yên = vùng đó đã tách ra
  //     thành ô độc lập, đúng lỗi cần bắt.
  const a = skinPaints(render({ ...BASE_CFG, base: 1, freckles: true }));
  const b = skinPaints(render({ ...BASE_CFG, base: 4, freckles: true }));
  const frozen = a.filter((p, i) => b[i] && b[i].color === p.color);
  ok(`đổi tông da → 0 vùng da đứng yên (thấy ${frozen.length})`, frozen.length === 0 && a.length === b.length);

  // (d) Khoá NGUỒN: chỉ `skinRamp` được phép pha sáng/tối lên da. Không có rào này thì mai
  //     có người thêm `darken(skin, .37)` ở một chỗ mới và (a) vẫn xanh vì chỗ đó không mang
  //     `data-skin`. Đây là rào chống LƯỚI THỦNG, không phải rào màu.
  //     ⚠️ KHÔNG đếm `darken(base…)` chung chung: `base` cũng là tên tham số của màu ÁO trong
  //     `Torso` và của nhiều component khác — đếm kiểu đó bắt nhầm 18 chỗ không liên quan gì
  //     đến da (đúng luật N7: grep phải trúng CHỈ BÁO, không phải chỉ báo gần đúng). Chỉ báo
  //     đúng ở đây là biến `skin` — sau khi sửa, nó chỉ còn được phép đi vào `mix()` (tint).
  const body = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const strayOnSkin = (body.match(/(?:darken|lighten)\(\s*skin\b/g) ?? []).length;
  ok(`0 chỗ tự pha sáng/tối lên \`skin\` ngoài thang (thấy ${strayOnSkin})`, strayOnSkin === 0);

  const rampBody = (SRC.match(/export function skinRamp[\s\S]*?\n}/) as RegExpMatchArray)[0];
  const rampCalls = (rampBody.match(/(?:darken|lighten)\(/g) ?? []).length;
  ok(`thang là nơi DUY NHẤT pha sáng/tối da (${rampCalls} lời gọi, chờ đúng 6 nấc dẫn xuất)`, rampCalls === 6);
  // Môi + má là PHA MÀU KHÁC vào da (tint), không phải nấc sáng-tối — miễn trừ có tên, đúng 2 chỗ.
  ok('miễn trừ tint chỉ đúng 2 chỗ đã biết: môi + má ửng', (body.match(/mix\(\s*skin\b/g) ?? []).length === 2);
}

/* ══════════════ [2] SỬA 2 — ĐỘI NÓN THÌ TÓC PHẢI BIẾT ══════════════ */
function testHatDrivesHair() {
  console.log('\n[2] Nón → tóc — lộ phần dưới, ẩn phần bị che');

  /* 🔴 DANH SÁCH VIẾT TAY, CỐ Ý KHÔNG DẪN XUẤT TỪ `HAT_COVER_Y` — sửa 06/08 sau kiểm phản biện.
   *
   * Bản cũ tính `covering = HAT_STYLES.filter(h => HAT_COVER_Y[h] !== null)`, tức KỲ VỌNG lấy từ
   * chính BẢNG ĐANG BỊ KIỂM ⇒ nó luôn tự khớp với chính mình. Kiểm phản biện đặt `cap: null`
   * (tóc chui xuyên thân mũ lưỡi trai trở lại — đúng bug gốc) và test vẫn xanh 23/23; đặt cả 8
   * nón về `null` thì `covering` rỗng, hai câu khoá thành `0 === 0` xanh rỗng.
   *
   * Hai danh sách dưới đây là SỰ THẬT VẬT LÝ về từng cái nón, không phải bản sao của bảng:
   * mũ phớt/len/lưỡi trai/tai bèo/nồi ÔM SỌ; băng đô đè lên tóc; tai nghe vòng qua hai bên.
   * Ai đổi bảng mà không đổi hiện thực thì đỏ — đó mới là điều cần khoá. */
  const MUST_COVER = ['fedora', 'beanie', 'cap', 'bucket', 'beret'];
  const MUST_NOT_COVER = ['none', 'hairband', 'headphone'];

  const declared = [...MUST_COVER, ...MUST_NOT_COVER].sort().join(',');
  ok(`hai danh sách phủ ĐỦ và ĐÚNG ${HAT_STYLES.length} kiểu nón (nón mới buộc phải khai)`, declared === [...HAT_STYLES].sort().join(','));

  const bare = hairLayer(render({ ...BASE_CFG, hat: 'none' }), 'front');
  ok('có lớp tóc trước để mà so (chống test rỗng)', bare.length > 100);

  /** Nhóm tóc lớp trước có THẬT SỰ được áp phép cắt không — đọc trên chính thẻ `<g>`.
   *  Bản cũ chỉ dò `<clipPath>` trong `<defs>`, nên khi kiểm phản biện gỡ `clipPath` khỏi `<g>`
   *  (định nghĩa vẫn nằm trong defs) câu đó VẪN XANH 5/5. Định nghĩa tồn tại ≠ được áp. */
  const frontTag = (svg: string) => (svg.match(/<g[^>]*data-hair-layer="front"[^>]*>/) ?? [''])[0];

  let changed = 0;
  let clipped = 0;
  for (const hat of MUST_COVER) {
    const svg = render({ ...BASE_CFG, hat });
    if (hairLayer(svg, 'front') !== bare) changed += 1;
    if (/clip-path="url\(#underhat-/.test(frontTag(svg))) clipped += 1;
  }
  ok(`đội nón che sọ → tóc ĐỔI THEO (${changed}/${MUST_COVER.length})`, changed === MUST_COVER.length);
  ok(`phép cắt được ÁP LÊN nhóm tóc, không chỉ khai trong defs (${clipped}/${MUST_COVER.length})`, clipped === MUST_COVER.length);

  /* Mép che phải là số ĐỌC ĐƯỢC TRÊN HÌNH. Kiểm phản biện đặt `beanie: 200` (ngoài khung 240)
   * — cắt bay TOÀN BỘ tóc lớp trước kể cả tóc mai, phá đúng lời hứa "phần dưới vẫn lộ" — mà test
   * cũ xanh, vì nó chưa bao giờ đối chiếu con số với hình. Khoảng hợp lệ: đỉnh sọ y=45, thái
   * dương/tóc mai phải còn ⇒ mép nằm trong 45..100. */
  const badY = MUST_COVER.filter((h) => !(HAT_COVER_Y[h] >= 45 && HAT_COVER_Y[h] <= 100));
  ok(`mép che của mọi nón nằm trong 45..100 (lệch: ${badY.map((h) => `${h}=${HAT_COVER_Y[h]}`).join(',') || '—'})`, badY.length === 0);
  const nullY = MUST_NOT_COVER.filter((h) => HAT_COVER_Y[h] !== null);
  ok(`nón không ôm sọ phải khai \`null\` (sai: ${nullY.join(',') || '—'})`, nullY.length === 0);

  // (c) Nón KHÔNG che sọ (băng đô đè lên tóc, tai nghe vòng qua) ⇒ tóc phải nguyên vẹn.
  //     Nếu chỗ này cũng cắt thì đã sửa quá tay, thành lỗi mới.
  const intact = MUST_NOT_COVER.filter((h: string) => hairLayer(render({ ...BASE_CFG, hat: h }), 'front') === bare);
  ok(`nón không che sọ → tóc NGUYÊN VẸN (${intact.length}/${MUST_NOT_COVER.length}: ${MUST_NOT_COVER.join(',')})`, intact.length === MUST_NOT_COVER.length);

  // (d) "Lộ phần dưới": tóc lớp SAU (đuôi, lọn dài) không bao giờ bị nón cắt.
  const backBare = hairLayer(render({ ...BASE_CFG, hair: 4, hat: 'none' }), 'back');
  const backHat = hairLayer(render({ ...BASE_CFG, hair: 4, hat: 'beanie' }), 'back');
  ok('tóc dài phía sau vẫn lộ nguyên dưới nón', backBare === backHat && backBare.length > 100);

  // (e) Bóng chân tóc hắt xuống trán: chân tóc khuất dưới nón thì bóng phải biến mất, còn
  //     hở thì phải còn. Kiểm CẢ HAI chiều — chỉ kiểm một chiều thì xoá phăng nó cũng xanh.
  const hairLo = 5; // chân tóc y=58, beanie che tới 88 ⇒ khuất
  const hidden = !render({ ...BASE_CFG, hair: hairLo, hat: 'beanie' }).includes(`cy="${HAIRLINE_Y[hairLo] + 5}"`);
  const shown = render({ ...BASE_CFG, hair: hairLo, hat: 'none' }).includes(`cy="${HAIRLINE_Y[hairLo] + 5}"`);
  ok('chân tóc khuất dưới nón → KHÔNG còn bóng hắt xuống trán', hidden);
  ok('không đội nón → bóng chân tóc VẪN CÒN (chiều ngược lại)', shown);
}

/* ══════════════ [3] RANH GIỚI: đổi được gì · cấm đổi gì ══════════════ */
function testWhatMayChange() {
  console.log('\n[3] Ranh giới — tông da/phụ kiện/nền ĐỔI ĐƯỢC · hình & màu cấu kiện CẤM ĐỔI');

  // CẤM ĐỔI — đây là rào quan trọng nhất: đổi tông da tuyệt đối không được chạm HÌNH.
  const s1 = render({ ...BASE_CFG, base: 1, hat: 'fedora', glasses: 'round' });
  const s6 = render({ ...BASE_CFG, base: 6, hat: 'fedora', glasses: 'round' });
  // Chốt chống-rỗng: `[] === []` ⇒ `'' === ''` xanh câm. Chính file này đã có chốt đó ở 3 chỗ
  // khác nhưng BỎ SÓT đúng câu quan trọng nhất của nhóm — kiểm phản biện chỉ ra.
  ok(`có hình để mà so (thấy ${shapes(s1).length} đường)`, shapes(s1).length > 20);
  ok('đổi tông da → 0 thay đổi hình/khối (mọi path d="…" y hệt)', shapes(s1).join('~') === shapes(s6).join('~'));

  // …và không chạm MÀU CẤU KIỆN. Màu nón/kính là hằng trong `HatShape`/`GlassesShape`,
  // không được phép trôi theo da.
  const hatHex = (svg: string) => (svg.match(/#[0-9A-Fa-f]{6}/g) ?? []).filter((h) => /1E3A5F|33608E|12253C|C08A4E/i.test(h)).sort().join(',');
  ok('đổi tông da → màu cấu kiện (nón) không đổi', hatHex(s1) === hatHex(s6) && hatHex(s1).length > 0);

  const acc1 = render({ ...BASE_CFG, accessory: 'none' });
  const acc2 = render({ ...BASE_CFG, accessory: 'collarPin' });
  ok('đổi phụ kiện → 0 thay đổi vùng da', JSON.stringify(skinPaints(acc1)) === JSON.stringify(skinPaints(acc2)));

  // ĐỔI ĐƯỢC — ba trục này phải THẬT SỰ đổi được, không phải nút chết.
  ok('tông da: đổi được', render({ ...BASE_CFG, base: 1 }) !== render({ ...BASE_CFG, base: 6 }));
  ok(`phụ kiện: đổi được (${ACCESSORY_STYLES.length} kiểu)`, acc1 !== acc2 && ACCESSORY_STYLES.length >= 4);
  ok('nền mặt: đổi được', render({ ...BASE_CFG, bg: 'cream' }) !== render({ ...BASE_CFG, bg: 'charcoal' }));
  // ⚠️ Câu này TRƯỚC ĐÂY ghi "bảng nền vẫn trung tính (không màu thương hiệu)" nhưng thân hàm chỉ
  // ĐẾM số key — kiểm phản biện chứng minh: nhét đúng màu beige thương hiệu vào `BG_COLORS.cream`
  // thì nó vẫn in `ok`. Một tích xanh KHAI MAN còn tệ hơn không có tích nào. Nay nói đúng việc nó
  // làm; phần trung tính đã có `lib/legal/brand-neutrality.test.ts` khoá thật.
  ok(`đổi nền KHÔNG đụng vùng da (${BG_COLOR_KEYS.length} nền)`,
    JSON.stringify(skinPaints(render({ ...BASE_CFG, bg: 'cream' }))) === JSON.stringify(skinPaints(render({ ...BASE_CFG, bg: 'charcoal' }))));
}

testSkinIsOneToken();
testHatDrivesHair();
testWhatMayChange();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
