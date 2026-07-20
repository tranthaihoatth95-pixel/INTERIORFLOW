'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { rise } from '@/lib/motion';
import {
  AdaptiveScrim,
  adaptiveTextStyle,
  useAdaptiveContrast,
  useCardText,
} from '@/components/ui/AdaptiveContrast';
import { useLang } from '@/lib/i18n';
import { LangToggle } from '@/components/LangToggle';
import { LoginForm } from '@/components/entry/LoginForm';
import {
  cardLuminanceFor,
  LoginBackdropLayer,
  LoginBackdropPicker,
  useLoginBackdrop,
} from '@/components/entry/LoginBackdrop';
import { IFLogo } from '@/components/entry/IFLogo';

/**
 * LoginScreen — màn đăng nhập ĐỨNG RIÊNG, thay cho IntroSequence trong luồng chính
 * (Sprint 1 B-1: Login → Project Gallery, không còn intro điện ảnh chắn trước).
 *
 * Sprint 2 (C-1/C-2/C-4):
 * - Nền ĐỘNG user tự đổi (LoginBackdrop): preset gradient trôi chậm / ảnh riêng
 *   Ken Burns, lưu localStorage; 19/07 login-minimal — MẶC ĐỊNH (chưa lưu lựa chọn)
 *   là TRÌNH CHIẾU bộ 30 ảnh TTT ("như vậy trước để thấy độ đẹp").
 * - data-login-tone: nền tối/sáng ép bộ biến chữ tương ứng (globals.css) — chữ
 *   luôn đọc được bất kể theme app.
 * - Hero vào màn theo ADAPTIVE AMPLITUDE (lib/motion.ts rise()): tít lớn bay 28px,
 *   kicker nhỏ chỉ 10px — cả màn lắng xuống như một khối, không đều tăm tắp.
 *
 * 19/07 (login-contrast) — chỉ đạo chủ dự án:
 * - GỠ tiêu đề "Bắt đầu dòng chảy của bạn." + dòng phụ. Còn logo + nhãn + card;
 *   cụm logo/nhãn vì thế nằm sát ngay trên card, cả khối tự cân giữa màn.
 * - TƯƠNG PHẢN THÍCH ỨNG: đo độ sáng vùng ảnh ngay dưới cụm logo+nhãn mỗi khi
 *   trình chiếu đổi ảnh → nền sáng thì logo/chữ chuyển mực, nền tối thì chuyển kem,
 *   kèm quầng sương mềm (không viền, không khối đục). Xem lib/adaptive-contrast.ts.
 */

const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';

/** Vùng ảnh nằm ngay dưới cụm logo + nhãn (tỉ lệ khung hình) — dải giữa, hơi lệch trên. */
const LOGO_REGION = { x: 0.28, y: 0.26, w: 0.44, h: 0.3 };
/** Vùng ảnh mà CARD đăng nhập phủ lên (tỉ lệ khung) — giữa màn, hơi dưới tâm. Khớp với
 *  vùng chủ dự án đã đo trên ttt-05 (hiệu dụng 0.152). */
const CARD_REGION = { x: 0.34, y: 0.38, w: 0.32, h: 0.48 };

/**
 * `notice` — lý do người dùng bị đưa về đây (phiên hết hạn / cookie không còn hiệu
 * lực). Bỏ trống khi vào lần đầu. Có nó thì người dùng không còn cảm giác "tự nhiên
 * bị văng ra" mà biết chính xác chuyện gì vừa xảy ra.
 */
export function LoginScreen({ onAuthed, notice }: { onAuthed: () => void; notice?: string | null }) {
  const reduce = useReducedMotion();
  const lang = useLang();
  const { choice, pick, tone } = useLoginBackdrop();

  // Ảnh nền ĐANG hiện (null = nền gradient) → đo tương phản 1 lần mỗi lần ảnh đổi.
  const [bgSrc, setBgSrc] = useState<string | null>(null);
  const plan = useAdaptiveContrast({
    src: bgSrc,
    region: LOGO_REGION,
    shape: 'halo',
    // nền gradient preset đều tối/đủ tương phản sẵn → chỉ cần sương mỏng
    baseAlpha: bgSrc ? 0.2 : 0.1,
    fallbackTone: tone === 'light' ? 'dark' : 'light',
    // LoginBackdrop đã đắp sẵn PhotoScrim (đen, ~0.34 ở tâm → ~0.62 ở mép). Vùng logo nằm
    // gần tâm nên gộp ~0.40; không gộp thì ảnh sáng bị đọc là "nền sáng" trong khi mắt
    // đang thấy nền đã tối đi, và chữ sẽ đảo sang màu mực trên nền tối.
    overlay: bgSrc ? { luminance: 0, alpha: 0.4 } : undefined,
  });

  // Việc 1 — TƯƠNG PHẢN CHỮ TRONG CARD: đo vùng card (ảnh) hoặc dùng độ sáng đại diện
  // (gradient preset / nền động) → bộ 5 bậc chữ cùng tông, mọi bậc ≥ 4.5. Trải vào card
  // qua CSS vars (cardTextVars) + tint kính + lớp sương nội bộ nếu nền quá sáng.
  const { plan: cardPlan, tint: cardTint } = useCardText({
    src: bgSrc,
    region: CARD_REGION,
    fallbackLuminance: cardLuminanceFor(choice) ?? 0.1,
  });

  // reduce motion → mọi rise() về amplitude 0 (chỉ còn fade)
  const amp = (px: number) => (reduce ? 0 : px);

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden"
      style={{ background: 'var(--bg)' }}
      data-login-tone={tone === 'auto' ? undefined : tone}
    >
      {/* C-2: nền động (preset / ảnh riêng) — thay khối quầng đồng hardcode cũ */}
      <LoginBackdropLayer choice={choice} reduce={!!reduce} onSrc={setBgSrc} />

      {/* đổi ngôn ngữ — góc phải trên, ghost để hoà nền */}
      <div className="absolute right-6 top-6 z-30">
        <LangToggle variant="ghost" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-6 py-16">
        <motion.div initial="hidden" animate="visible" className="flex w-full flex-col items-center text-center">
          {/* Cụm LOGO + NHÃN — nay là toàn bộ phần chữ của màn (đã gỡ tít + dòng phụ),
              nằm sát ngay trên card đăng nhập, cả khối cùng nhau cân giữa màn hình.
              Quầng sương thích ứng bọc quanh cụm: tan hẳn ở mép nên không thấy khối nền. */}
          <motion.div
            variants={rise(amp(12), 0.05)}
            className="relative mb-9 flex flex-col items-center"
          >
            {/* scrim toả rộng hơn cụm chữ để biên gradient nằm ngoài vùng mắt nhìn */}
            <AdaptiveScrim plan={plan} style={{ inset: '-46px -72px' }} />
            <div
              className="relative"
              style={{ color: plan.color, filter: plan.logoShadow, transition: 'color 900ms ease, filter 900ms ease' }}
            >
              <IFLogo size={46} variant="framed" />
            </div>
            <div
              className="relative mt-4 flex items-center gap-3 text-[11px] uppercase"
              style={{
                fontFamily: MONO,
                letterSpacing: '0.26em',
                ...adaptiveTextStyle(plan),
                transition: 'color 900ms ease',
              }}
            >
              <span className="h-px w-6" style={{ background: 'currentColor', opacity: 0.4 }} />
              <span>InteriorFlow</span>
              <span className="h-px w-6" style={{ background: 'currentColor', opacity: 0.4 }} />
            </div>
          </motion.div>

          {/* Phiên vừa đứt — nói rõ lý do thay vì im lặng đá về đây */}
          {notice && (
            <motion.p
              variants={rise(amp(12), 0.12)}
              role="status"
              className="mt-4 w-full max-w-sm rounded-[10px] border px-3 py-2 text-[12.5px] leading-relaxed"
              style={{
                fontFamily: SANS,
                borderColor: 'var(--border)',
                background: 'rgba(240,96,32,0.08)',
                color: 'var(--t2)',
              }}
            >
              {notice}
            </motion.p>
          )}

          {/* form kính (C-1) — element vừa, biên độ vừa */}
          <motion.div variants={rise(amp(18), 0.14)} className="flex w-full justify-center text-left">
            <LoginForm onAuthed={onAuthed} reduce={!!reduce} lang={lang} cardPlan={cardPlan} cardTint={cardTint} />
          </motion.div>
        </motion.div>
      </div>

      {/* C-2: nút đổi nền — góc phải dưới. Đặt SAU form đăng nhập trong DOM (dù vị trí
          nhìn thấy vẫn là góc phải-dưới nhờ `position: absolute`) để Tab đi qua form
          đăng nhập chính (Google/Apple/email) TRƯỚC, nút phụ trợ này sau — trước đây
          nằm trước form nên Tab nhảy ra góc màn hình rồi mới quay lại form. */}
      <LoginBackdropPicker choice={choice} onPick={pick} lang={lang} />
    </div>
  );
}
