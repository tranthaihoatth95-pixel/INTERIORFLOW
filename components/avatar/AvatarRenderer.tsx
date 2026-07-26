'use client';

/**
 * AvatarRenderer — chân dung SVG 200×240 phong cách "búp bê nhựa/nỉ 3D":
 * chibi đầu to, khối tròn căng, đổ bóng mềm kiểu studio (nguồn sáng TRÊN-TRÁI, bóng
 * dịu DƯỚI-PHẢI), da mịn hồng hào có má ửng, nền trơn sáng, biểu cảm tiết chế.
 *
 * Nguyên tắc kỹ thuật:
 *  · Thuần SVG — KHÔNG ảnh ngoài, KHÔNG webfont, KHÔNG package mới.
 *  · Khối cầu (đầu/thân) dựng bằng radial gradient nhiều chặng + highlight chuyên biệt
 *    + contact shadow (dưới chân tóc, dưới cằm, dưới vai) blur mềm.
 *  · Cảm giác lông/nỉ ở tóc & áo bằng feTurbulence + feDisplacementMap biên độ nhỏ.
 *  · HIỆU NĂNG: avatar sẽ render nhiều lần trong danh sách người dùng. Mọi filter
 *    (turbulence/blur) CHỈ bật khi `size > 48`; nhỏ hơn dùng bản phẳng — vẫn đủ nét.
 *    Mọi id trong <defs> gắn `useId()` nên nhiều instance không giẫm chân nhau.
 *
 * Layer: nền → tóc sau → thân/áo → phụ kiện → bóng cằm → cổ → đầu → tai/khuyên →
 *        khối sáng → má/tàn nhang → mắt mũi miệng → tóc trước → mũ → kính.
 */

import { useId } from 'react';
import {
  AvatarConfig,
  BASE_TONES,
  BG_COLORS,
  HAIR_COLORS,
  SHIRT_COLORS,
} from '@/lib/avatar';

interface Props {
  config: AvatarConfig;
  size?: number;
  /** Vòng viền hairline quanh khung tròn. */
  frame?: boolean;
  className?: string;
  /** Ép bật/tắt filter nỉ + blur. Mặc định: chỉ bật khi size > 48. */
  detail?: boolean;
  /** Nhãn cho screen reader; bỏ trống = aria-hidden. */
  title?: string;
}

/* ── Hình học chung (đầu to kiểu chibi, bust lấp đầy khung tròn) ──
 * khung tròn: cx100 cy120 r96 → y 24..216 (đỉnh khung y=24 là TRẦN CỨNG: mọi thứ
 *   vẽ cao hơn đều bị clipPath cắt phẳng)
 * đầu:  x 42..158 · y 45..161
 * mắt y112 · mũi y128 · miệng y142 · vai y166
 *
 * ⚠️ Hộp sọ ĐÃ THU NHỎ (rx/ry 63→58, cy 98→103) để lấy chỗ cho KHỐI TÓC.
 * Trước đây đỉnh sọ ở y=35 mà trần khung là y=24 ⇒ chỉ còn 11px cho tóc, nên mọi kiểu
 * đều mỏng dính "dán sát đầu" và đỉnh còn bị khung cắt phẳng. Nay đỉnh sọ y=45 ⇒ tóc có
 * 21px để nhô. Đáy cằm GIỮ NGUYÊN y=161 (cy+ry = 103+58 = 98+63) nên cổ, vai, áo và
 * toàn bộ mắt/mũi/miệng/kính không phải dịch một pixel nào. */
const HEAD = { cx: 100, cy: 103, rx: 58, ry: 58 };
const EYE_Y = 112;
const EYE_DX = 23;

export function AvatarRenderer({
  config,
  size = 96,
  frame = true,
  className,
  detail,
  title,
}: Props) {
  const uid = useId().replace(/:/g, '');
  const hi = detail ?? size > 48;

  const skin = BASE_TONES[config.base] ?? BASE_TONES[2];
  const hair = HAIR_COLORS[config.hairColor] ?? HAIR_COLORS.brown;
  const shirt = SHIRT_COLORS[config.shirtColor] ?? SHIRT_COLORS.orange;
  const bg = BG_COLORS[config.bg] ?? BG_COLORS.cream;
  const dark = config.bg === 'charcoal';

  const id = (k: string) => `${k}-${uid}`;
  const url = (k: string) => `url(#${id(k)})`;
  const feltF = hi ? url('felt') : undefined;
  const fuzzF = hi ? url('fuzz') : undefined;
  const softF = hi ? url('soft') : undefined;
  const blushF = hi ? url('blush') : undefined;

  const lip = mix(skin, '#A0403C', 0.6);
  const ink = '#231B17';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 200 240"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      {title && <title>{title}</title>}
      <defs>
        {/* Phông studio: sáng ở giữa-trên, tối dần ra rìa. */}
        <radialGradient id={id('bg')} cx="0.44" cy="0.28" r="0.88">
          <stop offset="0%" stopColor={lighten(bg, 0.32)} />
          <stop offset="55%" stopColor={bg} />
          <stop offset="100%" stopColor={dark ? lighten(bg, 0.16) : darken(bg, 0.19)} />
        </radialGradient>

        {/* Da: khối cầu — sáng trên-trái, 5 chặng, tối sâu dưới-phải. */}
        <radialGradient id={id('skin')} cx="0.33" cy="0.22" r="0.98">
          <stop offset="0%" stopColor={lighten(skin, 0.32)} />
          <stop offset="26%" stopColor={lighten(skin, 0.14)} />
          <stop offset="54%" stopColor={skin} />
          <stop offset="82%" stopColor={darken(skin, 0.16)} />
          <stop offset="100%" stopColor={darken(skin, 0.36)} />
        </radialGradient>

        {/* Highlight chuyên dụng cho khối cầu (specular mềm). */}
        <radialGradient id={id('spec')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="52%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        {/* Rim light hắt từ dưới-phải — tách khối khỏi nền. */}
        <linearGradient id={id('rim')} x1="1" y1="0.95" x2="0.25" y2="0.15">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Tóc nỉ: sáng đỉnh, tối gáy. */}
        <radialGradient id={id('hair')} cx="0.32" cy="0.14" r="0.95">
          <stop offset="0%" stopColor={lighten(hair, 0.28)} />
          <stop offset="28%" stopColor={lighten(hair, 0.1)} />
          <stop offset="62%" stopColor={hair} />
          <stop offset="100%" stopColor={darken(hair, 0.45)} />
        </radialGradient>

        {/* Áo nỉ: chéo trên-trái → dưới-phải. */}
        <linearGradient id={id('shirt')} x1="0.12" y1="0" x2="0.92" y2="1">
          <stop offset="0%" stopColor={lighten(shirt, 0.24)} />
          <stop offset="38%" stopColor={shirt} />
          <stop offset="100%" stopColor={darken(shirt, 0.5)} />
        </linearGradient>

        {/* Mặt kính tối + khung nhựa đen bóng. */}
        <linearGradient id={id('lens')} x1="0.08" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#4C525C" />
          <stop offset="38%" stopColor="#1C2027" />
          <stop offset="100%" stopColor="#080A0D" />
        </linearGradient>
        <linearGradient id={id('rimplastic')} x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#6A6D77" />
          <stop offset="30%" stopColor="#26282E" />
          <stop offset="100%" stopColor="#0D0E12" />
        </linearGradient>

        {hi && (
          <>
            {/*
             * NỈ — làm hai việc cùng lúc, thiếu một trong hai là ra "icon vector mượt":
             *  1. mép vải lởm chởm: feDisplacementMap với nhiễu KÉO DỌC (baseFrequency
             *     "0.42 0.85" — tần số ngang thấp, dọc cao) nên biên gợn thành túm sợi.
             *     Bản cũ dùng nhiễu ĐẲNG HƯỚNG 0.9 ⇒ chỉ ra hạt lăn tăn như noise ảnh.
             *  2. mặt vải có nap: feDiffuseLighting trên nhiễu tần số cao → bản đồ gồ ghề,
             *     cắt vào trong hình rồi blend `overlay` nên vùng trung tính giữ nguyên
             *     màu, chỉ nhấn sáng/tối theo thớ. Đây mới là thứ đọc ra "xơ vải".
             */}
            <filter id={id('felt')} x="-16%" y="-16%" width="132%" height="132%">
              <feTurbulence type="fractalNoise" baseFrequency="0.42 0.85" numOctaves="2" seed="11" result="warp" />
              <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="edge" />
              <feTurbulence type="fractalNoise" baseFrequency="2.1" numOctaves="4" seed="5" result="nap" />
              <feDiffuseLighting in="nap" lightingColor="#FFFFFF" surfaceScale="1.6" diffuseConstant="1" result="litRaw">
                <feDistantLight azimuth="225" elevation="55" />
              </feDiffuseLighting>
              {/* Nén bản đồ sáng về quanh mức trung tính 0.5. KHÔNG có bước này thì
                  feDiffuseLighting ra gần TRẮNG, blend `overlay` kéo bạc hết màu bên dưới
                  (đo thật: tóc đen ra xám bê tông). Đo trên 4 nền (đen · bạc · kem · nâu) chọn slope 0.9. */}
              <feComponentTransfer in="litRaw" result="lit">
                <feFuncR type="linear" slope="0.9" intercept="0.05" />
                <feFuncG type="linear" slope="0.9" intercept="0.05" />
                <feFuncB type="linear" slope="0.9" intercept="0.05" />
              </feComponentTransfer>
              <feComposite in="lit" in2="edge" operator="in" result="litIn" />
              <feBlend in="litIn" in2="edge" mode="overlay" result="tex" />
              <feComposite in="tex" in2="edge" operator="in" />
            </filter>

            {/* XƠ VẢI ở viền: bản sao tóc/áo vẽ LÓT BÊN DƯỚI, méo mạnh (scale 9) + nhoè
                nhẹ ⇒ quầng sợi lởm chởm nhô ra ngoài mép — thứ ảnh tham chiếu có rõ ở
                tóc và áo len. Chỉ dựng khi `hi` nên cỡ nhỏ không tốn gì. */}
            <filter id={id('fuzz')} x="-26%" y="-26%" width="152%" height="152%">
              <feTurbulence type="fractalNoise" baseFrequency="0.26 0.72" numOctaves="3" seed="23" result="w" />
              <feDisplacementMap in="SourceGraphic" in2="w" scale="6" xChannelSelector="R" yChannelSelector="G" result="d" />
              <feGaussianBlur in="d" stdDeviation="0.7" />
            </filter>
            <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <filter id={id('blush')} x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </>
        )}

        <clipPath id={id('frame')}>
          <circle cx="100" cy="120" r="96" />
        </clipPath>
        <clipPath id={id('head')}>
          <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} />
        </clipPath>
        <clipPath id={id('lensL')}>
          <path d={CATEYE_LENS} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id('frame')})`}>
        <circle cx="100" cy="120" r="96" fill={url('bg')} />

        {/* Bóng đổ của cả khối tượng lên phông — nhấc nhân vật khỏi nền */}
        <ellipse
          cx="114"
          cy="120"
          rx="74"
          ry="72"
          fill="#241C18"
          opacity={hi ? 0.13 : 0.07}
          filter={softF}
        />

        {/* Tóc lớp sau (tóc dài, đuôi, búi phía sau đầu) — quầng xơ lót dưới rồi khối nỉ */}
        {hi && (
          <g filter={fuzzF} stroke={hair} strokeWidth="3.5" strokeLinejoin="round" opacity="0.8">
            <HairBack hair={config.hair} fill={hair} shade={hair} />
          </g>
        )}
        <g filter={feltF}>
          <HairBack hair={config.hair} fill={url('hair')} shade={darken(hair, 0.45)} />
        </g>

        {/* Thân + áo + phụ kiện */}
        <Torso shirt={config.shirt} fill={url('shirt')} base={shirt} feltF={feltF} fuzzF={fuzzF} softF={softF} hi={hi} />
        <Accessory kind={config.accessory} feltF={feltF} />

        {/* Contact shadow: đầu đổ bóng xuống ngực (dịu, lệch phải) */}
        <ellipse
          cx="103"
          cy="172"
          rx="44"
          ry="13"
          fill="#231B17"
          opacity={hi ? 0.24 : 0.13}
          filter={softF}
        />

        {/* Cổ + bóng dưới cằm */}
        <path d="M80 130 L80 172 Q100 184 120 172 L120 130 Z" fill={darken(skin, 0.24)} />
        <path d="M80 130 Q100 156 120 130 L120 142 Q100 166 80 142 Z" fill={darken(skin, 0.44)} opacity="0.8" />

        {/* Đầu — khối cầu chính */}
        <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill={url('skin')} />

        {/* Tai + khuyên — tựa ĐÚNG mép đầu (mép sọ mới ở x 42/158) nên nhô ra nửa vành,
            thay vì lọt vào trong má như khi sọ còn rộng tới x 37/163 */}
        <ellipse cx="41" cy="117" rx="9" ry="12.5" fill={darken(skin, 0.04)} />
        <ellipse cx="159" cy="117" rx="9" ry="12.5" fill={darken(skin, 0.2)} />
        <ellipse cx="41" cy="117" rx="3.6" ry="6" fill={darken(skin, 0.24)} opacity="0.4" />
        <ellipse cx="159" cy="117" rx="3.6" ry="6" fill={darken(skin, 0.3)} opacity="0.4" />
        <EarringShape kind={config.earring} />

        {/* Ánh sáng + bóng trên khối cầu đầu */}
        <g clipPath={`url(#${id('head')})`}>
          <ellipse cx="72" cy="72" rx="33" ry="25" fill={url('spec')} transform="rotate(-22 72 72)" />
          <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill={url('rim')} />
          {/* bóng chìm mép phải + dưới */}
          <ellipse cx="158" cy="116" rx="24" ry="48" fill={darken(skin, 0.5)} opacity="0.2" filter={softF} />
          <ellipse cx="100" cy="170" rx="52" ry="18" fill={darken(skin, 0.5)} opacity="0.22" filter={softF} />
          {/* bóng chân tóc hắt xuống trán — mấu chốt cảm giác 3D */}
          <HairShadow hair={config.hair} filter={softF} skin={skin} />
        </g>

        {/* Má ửng + tàn nhang */}
        <BlushShape kind={config.blush} skin={skin} filter={blushF} hi={hi} />
        {config.freckles && <Freckles skin={skin} />}

        {/* Mày · mắt · mũi · miệng */}
        <Brows expression={config.expression} color={darken(hair, 0.22)} />
        <Eyes expression={config.expression} ink={ink} />
        <ellipse cx="100" cy="129" rx="7" ry="5.2" fill={darken(skin, 0.22)} opacity="0.5" />
        <ellipse cx="97.6" cy="127.2" rx="2.8" ry="2" fill="#FFFFFF" opacity="0.32" />
        <Mouth expression={config.expression} lip={lip} ink={ink} />

        {/* Tóc lớp trước — quầng xơ lót dưới rồi khối nỉ */}
        {hi && (
          <g filter={fuzzF} stroke={hair} strokeWidth="3.5" strokeLinejoin="round" opacity="0.8">
            <HairFront hair={config.hair} fill={hair} shade={hair} glow={hair} />
          </g>
        )}
        <g filter={feltF}>
          <HairFront hair={config.hair} fill={url('hair')} shade={darken(hair, 0.45)} glow={lighten(hair, 0.4)} />
        </g>

        {/* Mũ / headwear */}
        <HatShape hat={config.hat} feltF={feltF} />

        {/* Kính — trên cùng của khuôn mặt */}
        <GlassesShape
          glasses={config.glasses}
          lens={url('lens')}
          frameFill={url('rimplastic')}
          lensClip={`url(#${id('lensL')})`}
          hi={hi}
        />
      </g>

      {frame && (
        <circle
          cx="100"
          cy="120"
          r="95.4"
          fill="none"
          stroke={dark ? '#F1ECE3' : '#231B17'}
          strokeWidth="1.2"
          opacity="0.25"
        />
      )}
    </svg>
  );
}

/* ═══════════════════════ Thân / áo ═══════════════════════ */

const TORSO =
  'M4 240 L4 220 Q4 190 42 175 Q66 166 82 163 L118 163 Q134 166 158 175 Q196 190 196 220 L196 240 Z';

function Torso({
  shirt,
  fill,
  base,
  feltF,
  fuzzF,
  softF,
  hi,
}: {
  shirt: AvatarConfig['shirt'];
  fill: string;
  base: string;
  feltF?: string;
  fuzzF?: string;
  softF?: string;
  hi: boolean;
}) {
  const shade = darken(base, 0.36);
  const light = lighten(base, 0.32);
  const soft = shirt === 'sweater' || shirt === 'hoodie' || shirt === 'turtleneck';
  return (
    <g>
      {/* Áo len/nỉ: quầng xơ lót dưới cổ và vai — vải dệt không có mép cắt trơn */}
      {soft && hi && (
        <g filter={fuzzF} stroke={base} strokeWidth="4" strokeLinejoin="round" opacity="0.9">
          <path d={TORSO} fill={base} />
        </g>
      )}
      <g filter={soft ? feltF : undefined}>
        <path d={TORSO} fill={fill} />
      </g>
      {/* rim light vai trái + bóng vai phải — khối vai tròn, mép mềm */}
      <ellipse cx="26" cy="208" rx="32" ry="30" fill={light} opacity={hi ? 0.4 : 0.24} filter={softF} />
      <ellipse cx="176" cy="206" rx="34" ry="32" fill={shade} opacity={hi ? 0.5 : 0.3} filter={softF} />

      {shirt === 'hoodie' && (
        <>
          <path d="M54 186 Q100 152 146 186 Q146 172 132 163 Q100 152 68 163 Q54 172 54 186 Z" fill={shade} opacity="0.85" />
          <path d="M92 188 Q92 214 88 228" stroke={light} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M108 188 Q108 214 112 228" stroke={light} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.8" />
          <circle cx="88" cy="230" r="3" fill={light} opacity="0.85" />
          <circle cx="112" cy="230" r="3" fill={light} opacity="0.85" />
        </>
      )}

      {shirt === 'turtleneck' && (
        <g filter={feltF}>
          {/* cổ lọ nỉ — ống cao ôm cổ, có nếp gấp (đúng ảnh tham chiếu) */}
          <path d="M72 138 Q100 158 128 138 L128 176 Q100 196 72 176 Z" fill={fill} />
          <path d="M72 158 Q100 178 128 158 L128 168 Q100 188 72 168 Z" fill={shade} opacity="0.5" />
          <path d="M74 142 Q100 162 126 142" stroke={light} strokeWidth="2.4" fill="none" opacity="0.55" />
          <path d="M72 138 Q100 158 128 138" stroke={darken(base, 0.5)} strokeWidth="1.6" fill="none" opacity="0.4" />
        </g>
      )}

      {shirt === 'sweater' && (
        <g stroke={shade} strokeWidth="1.8" opacity="0.4" fill="none">
          <path d="M34 200 Q56 192 56 240" />
          <path d="M78 190 Q78 214 78 240" />
          <path d="M122 190 Q122 214 122 240" />
          <path d="M166 200 Q144 192 144 240" />
          <path d="M76 172 Q100 188 124 172" strokeWidth="3" opacity="0.7" />
        </g>
      )}

      {shirt === 'blazer' && (
        <>
          <path d="M82 164 L58 240 L100 192 Z" fill={shade} />
          <path d="M118 164 L142 240 L100 192 Z" fill={shade} />
          <path d="M87 168 L70 240 L100 196 Z" fill={lighten(base, 0.16)} opacity="0.8" />
          <path d="M113 168 L130 240 L100 196 Z" fill={lighten(base, 0.06)} opacity="0.75" />
          <circle cx="100" cy="222" r="3.4" fill={light} opacity="0.9" />
        </>
      )}

      {shirt === 'jacket' && (
        <>
          <path d="M90 163 L86 240 L114 240 L110 163 Z" fill={shade} opacity="0.9" />
          <path d="M100 170 L100 240" stroke={light} strokeWidth="1.8" opacity="0.75" />
          <path d="M68 174 Q56 200 58 240" stroke={shade} strokeWidth="2.6" fill="none" opacity="0.6" />
          <path d="M132 174 Q144 200 142 240" stroke={shade} strokeWidth="2.6" fill="none" opacity="0.6" />
          <circle cx="88" cy="196" r="2.6" fill={light} opacity="0.85" />
          <circle cx="112" cy="196" r="2.6" fill={light} opacity="0.85" />
        </>
      )}

      {shirt === 'coat' && (
        <>
          <path d="M82 163 L66 240 L104 240 L104 186 Z" fill={lighten(base, 0.12)} opacity="0.92" />
          <path d="M118 163 L134 240 L104 240 L104 186 Z" fill={shade} opacity="0.8" />
          <circle cx="84" cy="208" r="3.4" fill={light} opacity="0.9" />
          <circle cx="84" cy="230" r="3.4" fill={light} opacity="0.9" />
          <circle cx="120" cy="208" r="3.4" fill={light} opacity="0.9" />
          <circle cx="120" cy="230" r="3.4" fill={light} opacity="0.9" />
        </>
      )}

      {shirt === 'vest' && (
        <>
          <path d="M70 170 L56 240 L82 240 L86 182 Z" fill={shade} opacity="0.55" />
          <path d="M130 170 L144 240 L118 240 L114 182 Z" fill={shade} opacity="0.55" />
          <path d="M86 182 L100 208 L114 182 L114 166 L86 166 Z" fill={lighten(base, 0.4)} opacity="0.95" />
          <path d="M100 210 L100 240" stroke={shade} strokeWidth="1.6" opacity="0.6" />
        </>
      )}

      {shirt === 'overalls' && (
        <>
          <path d="M4 240 L4 220 Q6 196 40 180 L54 240 Z" fill={lighten(base, 0.46)} opacity="0.92" />
          <path d="M196 240 L196 220 Q194 196 160 180 L146 240 Z" fill={lighten(base, 0.46)} opacity="0.92" />
          <rect x="70" y="192" width="60" height="48" rx="5" fill={darken(base, 0.14)} />
          <path d="M76 192 L84 166" stroke={darken(base, 0.14)} strokeWidth="8" strokeLinecap="round" />
          <path d="M124 192 L116 166" stroke={darken(base, 0.14)} strokeWidth="8" strokeLinecap="round" />
          <circle cx="80" cy="196" r="2.8" fill={light} />
          <circle cx="120" cy="196" r="2.8" fill={light} />
        </>
      )}

      {shirt === 'dress' && (
        <>
          <path d="M76 163 L100 198 L124 163 Z" fill="#FFFFFF" opacity="0.75" />
          <path d="M76 163 Q100 178 124 163 L124 172 Q100 188 76 172 Z" fill={shade} opacity="0.42" />
          <circle cx="100" cy="206" r="3.6" fill={light} opacity="0.9" />
        </>
      )}

      {shirt === 'tshirt' && (
        <path d="M78 165 Q100 186 122 165" stroke={shade} strokeWidth="3.4" fill="none" opacity="0.7" strokeLinecap="round" />
      )}

      {hi && <ellipse cx="76" cy="200" rx="34" ry="18" fill="#FFFFFF" opacity="0.1" filter={softF} />}
    </g>
  );
}

function Accessory({ kind, feltF }: { kind: AvatarConfig['accessory']; feltF?: string }) {
  switch (kind) {
    case 'scarf':
      return (
        <g filter={feltF}>
          <path d="M66 166 Q100 194 134 166 L136 184 Q100 212 64 184 Z" fill="#B4593A" />
          <path d="M116 196 L128 240 L148 240 L126 190 Z" fill="#9C4A2E" />
          <path d="M66 176 Q100 202 134 176" stroke="#8F4227" strokeWidth="1.8" fill="none" opacity="0.55" />
        </g>
      );
    case 'necklace':
      return (
        <g>
          <path d="M78 172 Q100 200 122 172" stroke="#D9B45A" strokeWidth="2.2" fill="none" />
          <circle cx="100" cy="199" r="5.4" fill="#D9B45A" />
          <circle cx="98.2" cy="197.2" r="1.7" fill="#FFF6DA" opacity="0.9" />
        </g>
      );
    case 'collarPin':
      return (
        <g>
          <circle cx="122" cy="186" r="4.8" fill="#F06020" />
          <circle cx="120.6" cy="184.6" r="1.6" fill="#FFE2CE" opacity="0.9" />
        </g>
      );
    case 'bowtie':
      return (
        <g>
          <path d="M100 184 L78 175 L78 197 Z" fill="#8E2C3A" />
          <path d="M100 184 L122 175 L122 197 Z" fill="#8E2C3A" />
          <path d="M100 184 L78 175 L78 186 Z" fill="#A8404E" opacity="0.8" />
          <rect x="94" y="178" width="12" height="12" rx="3.5" fill="#6E1F2B" />
        </g>
      );
    case 'none':
    default:
      return null;
  }
}

/* ═══════════════════════ Tóc ═══════════════════════ */

/** Bóng chân tóc hắt xuống trán — chiều cao đổ bóng theo độ dày mái. */
function HairShadow({ hair, filter, skin }: { hair: AvatarConfig['hair']; filter?: string; skin: string }) {
  // y của đường chân tóc giữa trán theo từng kiểu (khớp HairFront bên dưới)
  const line: Record<number, number> = {
    1: 70, 2: 72, 3: 60, 4: 76, 5: 58, 6: 78, 7: 70, 8: 68,
    9: 58, 10: 60, 11: 68, 12: 58, 13: 68, 14: 64, 15: 74, 16: 72,
  };
  const y = line[hair] ?? 70;
  return (
    <ellipse cx="100" cy={y + 5} rx="55" ry="14" fill={darken(skin, 0.55)} opacity="0.3" filter={filter} />
  );
}

/** Phần tóc nằm SAU đầu (tóc dài, đuôi, búi sau) — khối rộng hơn đầu. */
function HairBack({ hair, fill, shade }: { hair: AvatarConfig['hair']; fill: string; shade: string }) {
  switch (hair) {
    case 4: // dài thẳng
      return (
        <path
          d="M14 220 C8 158 8 86 46 46 C60 32 80 26 100 26 C120 26 140 32 154 46 C192 86 192 158 186 220 L152 220 Q158 138 152 96 Q142 58 100 54 Q58 58 48 96 Q42 138 48 220 Z"
          fill={fill}
        />
      );
    case 5: // bob ngang cằm
      return (
        <path
          d="M18 158 C10 102 14 58 48 36 C62 28 80 26 100 26 C120 26 138 28 152 36 C186 58 190 102 182 158 Q174 176 150 166 Q160 120 152 92 Q142 56 100 52 Q58 56 48 92 Q40 120 50 166 Q26 176 18 158 Z"
          fill={fill}
        />
      );
    case 9: // bob ngang vai, cụp vào trong (dáng ref)
      return (
        <path
          d="M18 184 C10 112 12 62 48 38 C62 29 80 26 100 26 C120 26 138 29 152 38 C188 62 190 112 182 184 Q172 204 146 188 Q160 134 152 94 Q142 56 100 52 Q58 56 48 94 Q40 134 54 188 Q28 204 18 184 Z"
          fill={fill}
        />
      );
    case 10: // dài gợn sóng
      return (
        <>
          <path
            d="M12 220 C6 152 8 84 46 44 C60 31 80 26 100 26 C120 26 140 31 154 44 C192 84 194 152 188 220 L154 220 Q172 184 158 156 Q172 124 152 94 Q142 56 100 52 Q58 56 48 94 Q28 124 42 156 Q28 184 46 220 Z"
            fill={fill}
          />
          <path d="M38 116 Q24 152 40 182" stroke={shade} strokeWidth="2.6" fill="none" opacity="0.35" />
          <path d="M162 116 Q176 152 160 182" stroke={shade} strokeWidth="2.6" fill="none" opacity="0.35" />
        </>
      );
    case 12: // đuôi ngựa lệch phải
      return (
        <>
          <path
            d="M24 152 C16 98 20 58 50 38 C64 29 82 26 100 26 C118 26 136 29 150 38 C180 58 184 98 176 152 Q164 106 152 92 Q126 56 100 54 Q74 54 48 92 Q36 106 24 152 Z"
            fill={fill}
          />
          <path d="M162 88 Q198 110 190 162 Q182 200 158 208 Q180 172 174 140 Q166 106 150 100 Z" fill={fill} />
          <path d="M164 94 Q184 110 184 138" stroke={shade} strokeWidth="2.6" fill="none" opacity="0.45" />
        </>
      );
    case 15: // hime — hai lọn dài hai bên
      return (
        <path
          d="M14 220 C8 152 8 84 46 44 C60 31 80 26 100 26 C120 26 140 31 154 44 C192 84 192 152 186 220 L152 220 Q158 136 152 94 Q142 56 100 52 Q58 56 48 94 Q42 136 48 220 Z"
          fill={fill}
        />
      );
    default:
      return null;
  }
}

/**
 * Phần tóc nằm TRƯỚC/TRÊN mặt — khối nỉ dày, phủ đỉnh đầu.
 *
 * ⚠️ Luật hình học phải giữ (có `lib/avatar-render.test.ts` khoá bằng số):
 *  · Đỉnh sọ y=45, trần khung tròn y=24 ⇒ đỉnh tóc nằm trong 26..33 để CÓ KHỐI mà
 *    KHÔNG bị khung cắt phẳng. Riêng kiểu 2 (cạo sát) cố ý ôm sát sọ.
 *  · Không mảng nào được phủ vùng mắt (tâm 77/123, y 106..118) — tóc lớp trước vẽ SAU
 *    mắt nên mọi vệt cạo/đổ bóng phải nằm ở mép đầu, tuyệt đối không vắt ngang mặt.
 *  · Mỗi kiểu phải có DẤU HIỆU RIÊNG đọc được ở cỡ nhỏ (khối, đường ngôi, búi, độ bất
 *    đối xứng) — nhóm 1/2/7/8/14 trước đây gần như trùng nhau vì đều là "mũ lưỡi trai mỏng".
 */
function HairFront({
  hair,
  fill,
  shade,
  glow,
}: {
  hair: AvatarConfig['hair'];
  fill: string;
  shade: string;
  glow: string;
}) {
  const sheen = (
    <path d="M58 54 Q84 34 116 42" stroke={glow} strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.26" />
  );

  switch (hair) {
    case 1: // cắt ngắn gọn — khối tròn đều, chân tóc cong, tông "gọn gàng"
      return (
        <>
          <path d="M32 116 C30 54 58 28 100 28 C142 28 170 54 168 116 C158 84 136 70 100 70 C64 70 42 84 32 116 Z" fill={fill} />
          <path d="M40 104 C42 74 62 60 100 60" stroke={shade} strokeWidth="2.2" fill="none" opacity="0.3" />
          {sheen}
        </>
      );
    case 2: // cạo sát (buzz) — CỐ Ý mỏng, ôm sát sọ, chân tóc thẳng, có hạt lăn tăn tông đơ
      return (
        <>
          <path d="M42 108 C42 60 68 43 100 43 C132 43 158 60 158 108 C150 84 128 73 100 73 C72 73 50 84 42 108 Z" fill={fill} opacity="0.9" />
          {/* chân tóc THẲNG — dấu hiệu tông đơ, khác hẳn chân tóc cong của kiểu 1 */}
          <path d="M56 73 L144 73" stroke={shade} strokeWidth="2.6" opacity="0.45" />
          {/* Hạt lăn tăn = vết tông đơ. Toạ độ viết THẲNG (không `.map`) để
              `lib/avatar-render.test.ts` đọc và kiểm được — nó chỉ hiểu số literal. */}
          <circle cx="62" cy="62" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="76" cy="56" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="92" cy="52" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="108" cy="52" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="124" cy="56" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="138" cy="62" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="54" cy="78" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="70" cy="68" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="86" cy="60" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="114" cy="60" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="130" cy="68" r="2.2" fill={shade} opacity="0.34" />
          <circle cx="146" cy="78" r="2.2" fill={shade} opacity="0.34" />
        </>
      );
    case 3: // rẽ ngôi lệch — mái vuốt hẳn sang phải, hai bên dài không đều
      return (
        <>
          <path d="M30 118 C26 50 56 26 100 26 C148 26 174 52 170 128 C162 78 146 58 116 56 C92 54 72 76 56 96 C44 110 38 112 30 118 Z" fill={fill} />
          <path d="M104 30 C96 44 84 58 66 72" stroke={shade} strokeWidth="2.6" fill="none" opacity="0.35" />
          {sheen}
        </>
      );
    case 4: // dài thẳng — mái ngang phẳng (blunt), khối vuông vức
      return (
        <>
          <path d="M16 196 C12 60 50 26 100 26 C150 26 188 60 184 196 C176 176 170 148 168 124 C168 108 170 90 168 76 L32 76 C30 90 32 108 32 124 C30 148 24 176 16 196 Z" fill={fill} />
          <path d="M34 76 L166 76" stroke={shade} strokeWidth="2" opacity="0.28" />
          {sheen}
        </>
      );
    case 5: // bob — mái cong ôm trán, khối phồng hai bên
      return (
        <>
          <path d="M20 150 C16 58 52 26 100 26 C148 26 184 58 180 150 C172 138 166 124 164 108 C164 76 142 58 100 58 C58 58 36 76 36 108 C34 124 28 138 20 150 Z" fill={fill} />
          {sheen}
        </>
      );
    case 6: // xù afro — khối cầu lớn ghép từ nhiều múi
      return (
        <>
          <ellipse cx="100" cy="64" rx="72" ry="38" fill={fill} />
          <circle cx="38" cy="86" r="22" fill={fill} />
          <circle cx="162" cy="86" r="22" fill={fill} />
          <circle cx="28" cy="110" r="17" fill={fill} />
          <circle cx="172" cy="110" r="17" fill={fill} />
          <circle cx="70" cy="48" r="18" fill={fill} />
          <circle cx="130" cy="48" r="18" fill={fill} />
          <circle cx="100" cy="46" r="19" fill={fill} />
          <ellipse cx="70" cy="52" rx="23" ry="13" fill={glow} opacity="0.3" />
        </>
      );
    case 7: // búi cao — DẤU HIỆU: quả búi to tròn hẳn trên đỉnh + vòng buộc
      return (
        <>
          <path d="M38 112 C38 56 66 40 100 40 C134 40 162 56 162 112 C152 82 130 70 100 70 C70 70 48 82 38 112 Z" fill={fill} />
          {/* các lọn vuốt ngược hội tụ về búi */}
          <path d="M56 76 C70 58 86 50 100 48" stroke={shade} strokeWidth="2.4" fill="none" opacity="0.35" />
          <path d="M144 76 C130 58 114 50 100 48" stroke={shade} strokeWidth="2.4" fill="none" opacity="0.35" />
          <ellipse cx="100" cy="45" rx="27" ry="19" fill={fill} />
          <ellipse cx="90" cy="36" rx="11" ry="6" fill={glow} opacity="0.45" />
          <rect x="82" y="60" width="36" height="9" rx="4.5" fill={shade} />
        </>
      );
    case 8: // undercut — DẤU HIỆU: đỉnh CAO dựng ngược, hai bên cạo hẹp lộ mép đầu
      return (
        <>
          <path d="M48 112 C42 52 64 26 100 26 C136 26 158 52 152 112 C140 78 126 68 100 68 C74 68 60 78 48 112 Z" fill={fill} />
          {/* Vệt cạo hai bên thái dương — CHỈ nằm trong dải tóc sát mép đầu.
              Bản cũ là một dải vắt NGANG cả mặt ở y110–124, ĐÚNG TẦM MẮT ⇒ đọc ra như bịt mắt. */}
          <path d="M48 112 C46 88 54 72 66 62 C58 76 55 92 56 112 Z" fill={shade} opacity="0.5" />
          <path d="M152 112 C154 88 146 72 134 62 C142 76 145 92 144 112 Z" fill={shade} opacity="0.5" />
          {/* sống tóc dựng ngược — nét đặc trưng của undercut */}
          <path d="M70 60 C78 38 92 30 104 28" stroke={glow} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.42" />
          <path d="M100 28 C112 32 124 44 132 62" stroke={shade} strokeWidth="2.6" fill="none" opacity="0.3" />
        </>
      );
    case 9: // bob ngang vai — mái dày ngang, hai má ôm kín (dáng ref)
      return (
        <>
          <path d="M18 182 C14 62 52 26 100 26 C148 26 186 62 182 182 C172 166 166 146 164 122 C164 88 142 58 100 58 C58 58 36 88 36 122 C34 146 28 166 18 182 Z" fill={fill} />
          <path d="M40 100 Q62 60 100 58 Q138 60 160 100 L162 78 Q136 48 100 48 Q64 48 38 78 Z" fill={shade} opacity="0.22" />
          <path d="M56 48 Q86 32 116 38" stroke={glow} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.42" />
        </>
      );
    case 10: // dài gợn sóng — rẽ giữa, hai lọn ôm má
      return (
        <>
          <path d="M18 190 C14 60 52 26 100 26 C148 26 186 60 182 190 C174 172 168 148 166 124 C166 96 148 62 112 58 Q100 56 100 78 Q100 56 88 58 C52 62 34 96 34 124 C32 148 26 172 18 190 Z" fill={fill} />
          {sheen}
        </>
      );
    case 11: // xoăn ngắn — viền ngoài ghép cụm xoăn tròn nhỏ
      return (
        <>
          <path d="M34 112 C34 54 62 30 100 30 C138 30 166 54 166 112 C156 80 134 68 100 68 C66 68 44 80 34 112 Z" fill={fill} />
          <circle cx="46" cy="76" r="15" fill={fill} />
          <circle cx="68" cy="50" r="17" fill={fill} />
          <circle cx="100" cy="44" r="18" fill={fill} />
          <circle cx="132" cy="50" r="17" fill={fill} />
          <circle cx="154" cy="76" r="15" fill={fill} />
          <circle cx="36" cy="98" r="12" fill={fill} />
          <circle cx="164" cy="98" r="12" fill={fill} />
          <circle cx="66" cy="46" r="7" fill={glow} opacity="0.35" />
          <circle cx="96" cy="40" r="6" fill={glow} opacity="0.3" />
        </>
      );
    case 12: // đuôi ngựa — mái gọn vuốt hết sang trái, thái dương lộ
      return (
        <>
          <path d="M26 114 C24 48 56 26 100 26 C144 26 176 48 174 114 C164 74 138 58 110 56 C84 54 60 72 44 94 C36 102 30 106 26 114 Z" fill={fill} />
          {sheen}
        </>
      );
    case 13: // hai búi — DẤU HIỆU: hai quả búi hai bên đỉnh
      return (
        <>
          <path d="M34 112 C34 54 62 30 100 30 C138 30 166 54 166 112 C156 80 134 68 100 68 C66 68 44 80 34 112 Z" fill={fill} />
          <circle cx="58" cy="54" r="19" fill={fill} />
          <circle cx="142" cy="54" r="19" fill={fill} />
          <ellipse cx="51" cy="46" rx="8" ry="5" fill={glow} opacity="0.45" />
          <ellipse cx="135" cy="46" rx="8" ry="5" fill={glow} opacity="0.45" />
          <path d="M76 62 Q100 52 124 62" stroke={shade} strokeWidth="2.4" fill="none" opacity="0.3" />
        </>
      );
    case 14: // pixie — DẤU HIỆU: BẤT ĐỐI XỨNG rõ, mái dài vắt chéo xuống thái dương trái
      return (
        <>
          <path d="M30 110 C26 54 56 26 104 26 C152 26 178 58 174 126 C168 90 152 68 132 64 C120 84 96 98 70 98 C52 98 38 102 30 110 Z" fill={fill} />
          {/* đường ngôi lệch hẳn sang phải + mũi mái nhọn buông xuống thái dương trái */}
          <path d="M128 34 C118 56 100 76 76 88" stroke={shade} strokeWidth="2.8" fill="none" opacity="0.38" />
          <path d="M132 64 C118 86 94 98 68 98 C88 90 112 78 124 60 Z" fill={shade} opacity="0.28" />
          <path d="M52 60 Q78 40 108 40" stroke={glow} strokeWidth="6" fill="none" opacity="0.4" strokeLinecap="round" />
        </>
      );
    case 15: // hime — mái ngang phẳng + hai lọn cắt ngang má
      return (
        <>
          <path d="M18 168 C14 58 52 26 100 26 C148 26 186 58 182 168 C174 152 170 130 168 110 C168 92 170 82 168 74 L32 74 C30 82 32 92 32 110 C30 130 26 152 18 168 Z" fill={fill} />
          <path d="M24 92 Q16 132 26 156 L50 156 Q40 124 44 92 Z" fill={fill} />
          <path d="M176 92 Q184 132 174 156 L150 156 Q160 124 156 92 Z" fill={fill} />
        </>
      );
    case 16: // faux hawk — DẤU HIỆU: chóp giữa nhô cao hình mũi thuyền
      return (
        <>
          <path d="M44 114 C46 88 58 78 72 72 C60 40 100 26 100 26 C100 26 140 40 128 72 C142 78 154 88 156 114 C140 84 128 74 100 72 C72 74 60 84 44 114 Z" fill={fill} />
          {/* Hai bên cạo sát — cùng lỗi cũ như kiểu 8: dải ngang y112–126 phủ kín hai mắt. */}
          <path d="M44 114 C44 94 52 82 64 76 C56 88 51 100 52 114 Z" fill={shade} opacity="0.5" />
          <path d="M156 114 C156 94 148 82 136 76 C144 88 149 100 148 114 Z" fill={shade} opacity="0.5" />
          <path d="M86 40 Q100 30 114 42" stroke={glow} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.45" />
        </>
      );
    default:
      return null;
  }
}

/* ═══════════════════════ Mặt ═══════════════════════ */

function BlushShape({
  kind,
  skin,
  filter,
  hi,
}: {
  kind: AvatarConfig['blush'];
  skin: string;
  filter?: string;
  hi: boolean;
}) {
  if (kind === 'none') return null;
  const strong = kind === 'strong';
  const c = mix(skin, '#E8746A', strong ? 0.58 : 0.36);
  return (
    <g filter={filter} opacity={(strong ? 0.85 : 0.62) * (hi ? 1 : 0.7)}>
      <ellipse cx="62" cy="134" rx={strong ? 17 : 14} ry={strong ? 11 : 8.5} fill={c} />
      <ellipse cx="138" cy="134" rx={strong ? 17 : 14} ry={strong ? 11 : 8.5} fill={c} />
    </g>
  );
}

function Freckles({ skin }: { skin: string }) {
  const c = darken(skin, 0.36);
  const pts: [number, number][] = [
    [72, 130], [79, 137], [65, 141], [86, 132],
    [128, 130], [121, 137], [135, 141], [114, 132],
    [94, 138], [106, 138],
  ];
  return (
    <g fill={c} opacity="0.45">
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.7} />
      ))}
    </g>
  );
}

function Brows({ expression, color }: { expression: AvatarConfig['expression']; color: string }) {
  const props = {
    stroke: color,
    strokeWidth: 5,
    fill: 'none',
    strokeLinecap: 'round' as const,
    opacity: 0.9,
  };
  switch (expression) {
    case 'frown':
      return (
        <g {...props}>
          <path d="M64 92 L88 100" />
          <path d="M136 92 L112 100" />
        </g>
      );
    case 'grin':
      return (
        <g {...props}>
          <path d="M64 90 Q76 80 89 88" />
          <path d="M136 90 Q124 80 111 88" />
        </g>
      );
    case 'smirk':
      return (
        <g {...props}>
          <path d="M64 94 Q76 87 89 92" />
          <path d="M136 88 Q124 80 111 88" />
        </g>
      );
    case 'pout':
      return (
        <g {...props}>
          <path d="M64 90 Q76 98 89 93" />
          <path d="M136 90 Q124 98 111 93" />
        </g>
      );
    default:
      return (
        <g {...props}>
          <path d="M64 93 Q76 85 89 91" />
          <path d="M136 93 Q124 85 111 91" />
        </g>
      );
  }
}

function Eyes({ expression, ink }: { expression: AvatarConfig['expression']; ink: string }) {
  const L = 100 - EYE_DX;
  const R = 100 + EYE_DX;
  const eye = (cx: number) => (
    <g key={cx}>
      <ellipse cx={cx} cy={EYE_Y} rx="8.4" ry="9.6" fill={ink} />
      <circle cx={cx - 2.8} cy={EYE_Y - 3.4} r="3" fill="#FFFFFF" opacity="0.95" />
      <circle cx={cx + 3} cy={EYE_Y + 3.6} r="1.5" fill="#FFFFFF" opacity="0.5" />
    </g>
  );
  if (expression === 'grin') {
    return (
      <g stroke={ink} strokeWidth="5" fill="none" strokeLinecap="round">
        <path d={`M${L - 9} ${EYE_Y + 4} Q${L} ${EYE_Y - 8} ${L + 9} ${EYE_Y + 4}`} />
        <path d={`M${R - 9} ${EYE_Y + 4} Q${R} ${EYE_Y - 8} ${R + 9} ${EYE_Y + 4}`} />
      </g>
    );
  }
  return (
    <g>
      {eye(L)}
      {eye(R)}
    </g>
  );
}

function Mouth({ expression, lip, ink }: { expression: AvatarConfig['expression']; lip: string; ink: string }) {
  switch (expression) {
    case 'smile':
      return <path d="M86 143 Q100 157 114 143" stroke={lip} strokeWidth="4" fill="none" strokeLinecap="round" />;
    case 'grin':
      return (
        <g>
          <path d="M83 141 Q100 162 117 141 Z" fill={darken(lip, 0.42)} />
          <path d="M85 142 Q100 147 115 142 Z" fill="#FFF6EC" />
        </g>
      );
    case 'pout':
      return (
        <g>
          <ellipse cx="100" cy="145" rx="7" ry="8.4" fill={darken(lip, 0.3)} />
          <ellipse cx="98" cy="142" rx="2.5" ry="2.2" fill="#FFFFFF" opacity="0.3" />
        </g>
      );
    case 'frown':
      return <path d="M87 150 Q100 139 113 150" stroke={lip} strokeWidth="4" fill="none" strokeLinecap="round" />;
    case 'smirk':
      return (
        <g>
          <path d="M85 147 Q100 150 116 138" stroke={lip} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="118" cy="137" r="2" fill={darken(lip, 0.25)} opacity="0.6" />
        </g>
      );
    case 'neutral':
    default:
      // mím môi — đường ngang hơi trề + bóng dưới môi
      return (
        <g>
          <path d="M87 144 Q100 149 113 144" stroke={lip} strokeWidth="4.2" fill="none" strokeLinecap="round" />
          <path d="M92 152 Q100 155 108 152" stroke={ink} strokeWidth="1.8" fill="none" opacity="0.13" strokeLinecap="round" />
        </g>
      );
  }
}

function EarringShape({ kind }: { kind: AvatarConfig['earring'] }) {
  const gold = '#D9B45A';
  const hl = '#FFF3D2';
  switch (kind) {
    case 'hoop':
      return (
        <g fill="none" stroke={gold} strokeWidth="2.6">
          <circle cx="42" cy="134" r="7" />
          <circle cx="158" cy="134" r="7" />
        </g>
      );
    case 'stud':
      return (
        <g>
          <circle cx="42" cy="126" r="3.8" fill={gold} />
          <circle cx="158" cy="126" r="3.8" fill={gold} />
          <circle cx="41" cy="124.8" r="1.2" fill={hl} />
          <circle cx="157" cy="124.8" r="1.2" fill={hl} />
        </g>
      );
    case 'drop':
      return (
        <g>
          <line x1="42" y1="126" x2="42" y2="135" stroke={gold} strokeWidth="1.8" />
          <line x1="158" y1="126" x2="158" y2="135" stroke={gold} strokeWidth="1.8" />
          <ellipse cx="42" cy="140" rx="4" ry="5.6" fill={gold} />
          <ellipse cx="158" cy="140" rx="4" ry="5.6" fill={gold} />
          <circle cx="40.6" cy="138" r="1.3" fill={hl} />
          <circle cx="156.6" cy="138" r="1.3" fill={hl} />
        </g>
      );
    case 'none':
    default:
      return null;
  }
}

/* ═══════════════════════ Kính ═══════════════════════ */

/**
 * Mắt kính CATEYE — bản DÀY, đuôi trên-ngoài HẾCH nhọn lên, ngồi ĐÚNG tầm mắt.
 * Vẽ 1 bên rồi lật gương qua matrix(-1 0 0 1 200 0).
 *
 * ⚠️ Bản cũ đọc ra "hai cục đen" chứ không ra kính: mắt kính rộng 70 đơn vị (x 30→100,
 * tức nửa khuôn mặt), trọng tâm buông xuống tận y=131 (thấp hơn tâm mắt 19 đơn vị, tràn
 * xuống má), và mặt kính TÔ ĐẶC nên nuốt mất hai con mắt vẽ bên dưới.
 * Nay: 51×34 đơn vị, tâm (73,112) trùng tầm mắt (EYE_Y=112, tâm mắt trái x=77), mặt kính
 * trong mờ để vẫn đọc được mắt, và đuôi ngoài hếch hẳn lên bằng một cánh nhọn riêng.
 */
const CATEYE_LENS =
  // (52,95) đuôi trên-NGOÀI hếch → mép trên THOẢI XUỐNG phía mũi (96,106): đó là dáng mắt mèo
  'M52 95 C64 97 84 101 96 106 C100 109 98 118 92 122 C80 129 62 128 55 119 C50 112 48 99 52 95 Z';

/** Cánh nhọn ở đuôi kính — nét đọc ra "mắt mèo" ngay ở cỡ nhỏ. */
const CATEYE_FLICK = 'M54 94 L41 86 L50 100 Z';

function GlassesShape({
  glasses,
  lens,
  frameFill,
  lensClip,
  hi,
}: {
  glasses: AvatarConfig['glasses'];
  lens: string;
  frameFill: string;
  lensClip: string;
  hi: boolean;
}) {
  const ink = '#1A1C21';
  const mirror = 'matrix(-1 0 0 1 200 0)';

  if (glasses === 'none') return null;

  if (glasses === 'cateye') {
    const one = (
      <g>
        {/* mặt kính TRONG MỜ — để hai con mắt vẽ bên dưới vẫn đọc được */}
        <path d={CATEYE_LENS} fill={lens} opacity="0.45" />
        {/* phản chiếu cửa sổ mờ (2 vệt chéo) */}
        <g clipPath={lensClip} opacity={hi ? 0.16 : 0.12}>
          <path d="M50 132 L70 92 L76 92 L56 134 Z" fill="#FFFFFF" />
          <path d="M84 94 L88 94 L68 130 L64 130 Z" fill="#FFFFFF" opacity="0.6" />
        </g>
        {/* cánh nhọn đuôi ngoài — vẽ TRƯỚC khung để khung liền mạch với nó */}
        <path d={CATEYE_FLICK} fill={frameFill} />
        {/* khung bản DÀY, mối nối nhọn ở đuôi hếch */}
        <path d={CATEYE_LENS} fill="none" stroke={frameFill} strokeWidth="6.5" strokeLinejoin="miter" strokeMiterlimit="6" />
        {/* mép trên dày thêm — đặc trưng gọng mắt mèo */}
        <path d="M52 95 C64 97 84 101 96 106" stroke={frameFill} strokeWidth="9" fill="none" strokeLinecap="round" />
        {/* highlight chất nhựa bóng dọc mép trên */}
        <path d="M57 97 C68 99 84 103 94 107" stroke="#AFB5C0" strokeWidth="1.8" fill="none" opacity="0.5" strokeLinecap="round" />
        {/* càng kính về phía tai */}
        <path d="M50 106 L35 108" stroke={frameFill} strokeWidth="5" strokeLinecap="round" />
      </g>
    );
    return (
      <g>
        {one}
        <g transform={mirror}>{one}</g>
        <path d="M96 110 Q100 105 104 110" stroke={frameFill} strokeWidth="5.5" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (glasses === 'oversized') {
    const one = (
      <g>
        <rect x="46" y="92" width="50" height="34" rx="15" fill={lens} opacity="0.5" />
        <rect x="46" y="92" width="50" height="34" rx="15" fill="none" stroke={frameFill} strokeWidth="6.5" />
        <path d="M53 122 L76 96" stroke="#FFFFFF" strokeWidth="6" opacity="0.2" strokeLinecap="round" />
        <path d="M46 100 L32 105" stroke={frameFill} strokeWidth="6" strokeLinecap="round" />
      </g>
    );
    return (
      <g>
        {one}
        <g transform={mirror}>{one}</g>
        <path d="M96 109 L104 109" stroke={frameFill} strokeWidth="6" strokeLinecap="round" />
      </g>
    );
  }

  if (glasses === 'shield') {
    return (
      <g>
        <path d="M40 98 Q100 86 160 98 Q162 124 132 130 Q100 135 68 130 Q38 124 40 98 Z" fill={lens} opacity="0.6" />
        <path d="M40 98 Q100 86 160 98 Q162 124 132 130 Q100 135 68 130 Q38 124 40 98 Z" fill="none" stroke={frameFill} strokeWidth="6" strokeLinejoin="round" />
        {/* gọng vắt qua sống mũi + phản chiếu chéo */}
        <path d="M96 92 Q100 89 104 92" stroke={frameFill} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M52 124 L82 94" stroke="#FFFFFF" strokeWidth="7" opacity="0.16" strokeLinecap="round" />
        <path d="M94 124 L118 98" stroke="#FFFFFF" strokeWidth="5" opacity="0.11" strokeLinecap="round" />
      </g>
    );
  }

  if (glasses === 'aviator') {
    const one = (
      <g>
        <path d="M40 96 L92 96 Q93 120 74 128 Q50 131 43 112 Z" fill={lens} opacity="0.55" />
        <path d="M40 96 L92 96 Q93 120 74 128 Q50 131 43 112 Z" fill="none" stroke={frameFill} strokeWidth="4" />
        <path d="M50 120 L76 98" stroke="#FFFFFF" strokeWidth="5" opacity="0.17" strokeLinecap="round" />
        <path d="M40 96 L26 100" stroke={frameFill} strokeWidth="4" strokeLinecap="round" />
      </g>
    );
    return (
      <g>
        {one}
        <g transform={mirror}>{one}</g>
        <path d="M92 98 Q100 93 108 98" stroke={frameFill} strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (glasses === 'round') {
    const one = (
      <g>
        <circle cx="70" cy="111" r="22" fill={lens} opacity="0.5" />
        <circle cx="70" cy="111" r="22" fill="none" stroke={frameFill} strokeWidth="5" />
        <path d="M58 122 L80 98" stroke="#FFFFFF" strokeWidth="5" opacity="0.3" strokeLinecap="round" />
        <path d="M48 104 L28 100" stroke={frameFill} strokeWidth="4.4" strokeLinecap="round" />
      </g>
    );
    return (
      <g>
        {one}
        <g transform={mirror}>{one}</g>
        <path d="M92 108 Q100 103 108 108" stroke={frameFill} strokeWidth="4.4" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (glasses === 'square') {
    const one = (
      <g>
        <rect x="44" y="94" width="48" height="32" rx="7" fill={lens} opacity="0.5" />
        <rect x="44" y="94" width="48" height="32" rx="7" fill="none" stroke={frameFill} strokeWidth="5.6" />
        <path d="M52 122 L74 98" stroke="#FFFFFF" strokeWidth="5" opacity="0.3" strokeLinecap="round" />
        <path d="M44 100 L28 102" stroke={frameFill} strokeWidth="5" strokeLinecap="round" />
      </g>
    );
    return (
      <g>
        {one}
        <g transform={mirror}>{one}</g>
        <path d="M92 106 L108 106" stroke={frameFill} strokeWidth="5" strokeLinecap="round" />
      </g>
    );
  }

  if (glasses === 'halfrim') {
    const one = (
      <g>
        <path d="M44 100 L92 100 L92 116 Q68 130 44 114 Z" fill={lens} opacity="0.35" />
        <path d="M42 98 L94 98" stroke={frameFill} strokeWidth="5.6" strokeLinecap="round" />
        <path d="M92 100 Q68 130 44 114" stroke={frameFill} strokeWidth="1.8" fill="none" opacity="0.5" />
        <path d="M42 98 L28 102" stroke={frameFill} strokeWidth="4.6" strokeLinecap="round" />
      </g>
    );
    return (
      <g>
        {one}
        <g transform={mirror}>{one}</g>
        <path d="M94 98 L106 98" stroke={frameFill} strokeWidth="4.6" strokeLinecap="round" />
      </g>
    );
  }

  // rimless
  const one = (
    <g>
      <ellipse cx="70" cy="111" rx="22" ry="15" fill="#FFFFFF" opacity="0.2" />
      <ellipse cx="70" cy="111" rx="22" ry="15" fill="none" stroke={ink} strokeWidth="1.4" opacity="0.45" />
      <path d="M58 120 L80 100" stroke="#FFFFFF" strokeWidth="3.4" opacity="0.4" strokeLinecap="round" />
      <path d="M48 104 L28 101" stroke={ink} strokeWidth="1.8" opacity="0.45" strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      {one}
      <g transform={mirror}>{one}</g>
      <path d="M92 108 L108 108" stroke={ink} strokeWidth="1.8" opacity="0.45" strokeLinecap="round" />
    </g>
  );
}

/* ═══════════════════════ Mũ / headwear ═══════════════════════ */

function HatShape({ hat, feltF }: { hat: AvatarConfig['hat']; feltF?: string }) {
  const navy = '#002850';
  const navyLight = '#1B4470';
  const navyDark = '#00172E';

  switch (hat) {
    case 'fedora':
      return (
        <g>
          <ellipse cx="100" cy="62" rx="86" ry="14" fill={navyDark} />
          <ellipse cx="97" cy="59" rx="86" ry="12" fill={navy} />
          <path d="M56 60 Q54 34 100 28 Q146 34 144 60 Z" fill={navy} />
          <path d="M61 57 Q60 38 94 30 Q76 40 72 57 Z" fill={navyLight} opacity="0.6" />
          <rect x="56" y="47" width="88" height="10" fill="#F06020" opacity="0.92" />
        </g>
      );
    case 'beanie':
      return (
        <g filter={feltF}>
          <path d="M36 80 Q36 40 100 36 Q164 40 164 80 Z" fill={navy} />
          <path d="M46 74 Q44 46 90 38 Q66 48 60 74 Z" fill={navyLight} opacity="0.55" />
          <rect x="30" y="70" width="140" height="20" rx="9" fill={navyLight} />
          <rect x="30" y="70" width="140" height="7" rx="3.5" fill="#3A6394" opacity="0.5" />
          <circle cx="100" cy="33" r="9" fill="#F1ECE3" />
          <circle cx="96.6" cy="30" r="3" fill="#FFFFFF" opacity="0.8" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M40 76 Q40 36 100 32 Q160 36 160 76 Z" fill={navy} />
          <path d="M50 70 Q48 44 94 34 Q72 44 64 70 Z" fill={navyLight} opacity="0.55" />
          <path d="M30 76 Q100 66 170 76 Q170 90 100 96 Q30 90 30 76 Z" fill={navyDark} />
          <circle cx="100" cy="34" r="4.6" fill={navyLight} />
        </g>
      );
    case 'bucket':
      return (
        <g filter={feltF}>
          <path d="M46 68 Q44 34 100 30 Q156 34 154 68 Z" fill="#7E8F72" />
          <path d="M54 64 Q52 40 94 32 Q72 42 66 64 Z" fill="#9BAA8E" opacity="0.6" />
          <path d="M20 68 Q100 56 180 68 Q176 94 100 100 Q24 94 20 68 Z" fill="#6B7C60" />
          <path d="M20 68 Q100 56 180 68 Q176 78 100 84 Q24 78 20 68 Z" fill="#8A9B7D" opacity="0.7" />
        </g>
      );
    case 'beret':
      return (
        <g filter={feltF}>
          <path d="M32 62 Q32 30 106 28 Q170 32 162 56 Q148 76 100 78 Q46 78 32 62 Z" fill="#8E2C3A" />
          <path d="M46 54 Q48 34 96 30 Q70 40 60 58 Z" fill="#B4525E" opacity="0.6" />
          <circle cx="128" cy="31" r="7" fill="#6E1F2B" />
          <ellipse cx="100" cy="74" rx="58" ry="9" fill="#6E1F2B" opacity="0.6" />
        </g>
      );
    case 'headphone':
      return (
        <g>
          <path d="M30 106 Q30 38 100 34 Q170 38 170 106" fill="none" stroke="#2C2E33" strokeWidth="10" strokeLinecap="round" />
          <path d="M38 94 Q42 46 96 40" fill="none" stroke="#5A5C64" strokeWidth="3.4" strokeLinecap="round" opacity="0.65" />
          <rect x="18" y="94" width="26" height="40" rx="12" fill="#2C2E33" />
          <rect x="156" y="94" width="26" height="40" rx="12" fill="#1D1F23" />
          <rect x="23" y="99" width="9" height="24" rx="4.5" fill="#5A5C64" opacity="0.55" />
          <circle cx="169" cy="114" r="4.4" fill="#F06020" />
        </g>
      );
    case 'hairband':
      return (
        <g filter={feltF}>
          <path d="M32 82 Q100 38 168 82 L168 94 Q100 50 32 94 Z" fill="#F06020" />
          <path d="M36 82 Q100 44 164 82" stroke="#FF8A50" strokeWidth="3" fill="none" opacity="0.7" />
        </g>
      );
    case 'none':
    default:
      return null;
  }
}

/* ═══════════════════════ Utils màu ═══════════════════════ */

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

function toHex(r: number, g: number, b: number): string {
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${((cl(r) << 16) | (cl(g) << 8) | cl(b)).toString(16).padStart(6, '0')}`;
}

/** amount 0..1 (dương = tối đi, âm = sáng lên). */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = toRgb(hex);
  const f = 1 - amount;
  return toHex(r * f, g * f, b * f);
}

/** Trộn về trắng — sáng lên mà không bạc màu quá nhanh. */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = toRgb(hex);
  const t = Math.max(0, Math.min(1, amount));
  return toHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}

/** Trộn 2 màu, t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return toHex(r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k);
}
