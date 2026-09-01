'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { rise, riseNoFade } from '@/lib/motion';
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
 *
 * 🟣 01/09 — VÁ THỊ GIÁC THEO BẢN VẼ GĐ1 (`design-if/TheKhoa.dc.html`): thêm CỤM ĐỒNG HỒ
 * MẢNH LỚN (ngày nhỏ · giờ 200-weight cỡ clamp) đứng TRÊN cụm logo — màn vào app đọc ra như
 * màn khoá của một hệ điều hành, đúng hướng "Local-first Design OS". CƠ CHẾ GIỮ NGUYÊN 100%:
 * backdrop động, adaptive contrast, form, picker, [data-login-tone]. Màu đồng hồ đi qua
 * `adaptiveTextStyle(plan)` — CÙNG kênh với logo/nhãn, nên nền sáng thì mực, nền tối thì kem;
 * KHÔNG bind thẳng --t1 tại đây để không giẫm cơ chế ép tone (globals.css [data-login-tone]).
 */


/** Vùng ảnh nằm ngay dưới cụm logo + nhãn (tỉ lệ khung hình) — dải giữa, hơi lệch trên. */
const LOGO_REGION = { x: 0.28, y: 0.26, w: 0.44, h: 0.3 };
/** Vùng ảnh mà CARD đăng nhập phủ lên (tỉ lệ khung) — giữa màn, hơi dưới tâm. Khớp với
 *  vùng chủ dự án đã đo trên ảnh mẫu #05 (hiệu dụng 0.152). */
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

  // 🟣 01/09 — ĐỒNG HỒ MẢNH (TheKhoa.dc.html). Đọc trong effect (client-only) để không lệch
  // hydrate; nhịp 30s là đủ cho phút (màn này không cần giây). Chưa mount ⇒ không vẽ, không nháy.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const gioStr = now ? now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null;
  const ngayStr = now
    ? now.toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      })
    : null;

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
          {/* 🟣 01/09 — CỤM ĐỒNG HỒ đứng trên logo. Màu theo `adaptiveTextStyle(plan)` — cùng
              kênh thích ứng với logo/nhãn; text-shadow rất nhẹ từ plan.logoShadow đã lo phần
              tách nền. `tabular-nums` để phút nhảy không xô ngang. */}
          {gioStr && (
            <motion.div
              variants={rise(amp(10), 0.02)}
              className="relative mb-7 flex flex-col items-center"
              // Nhịp đi qua THANG `--nhip-*` (cổng F-MOTION-TOKEN, `soi:foundation`): cụm logo
              // cạnh đây còn giữ `900ms` cũ và đã được tính vào trần — phần MỚI thì không được
              // đẻ thêm một số rời. `--nhip-ngu-canh` (300ms) là nấc "chuyển ngữ cảnh sâu",
              // đúng vai đổi tông khi trình chiếu sang ảnh khác.
              style={{ ...adaptiveTextStyle(plan), transition: 'color var(--nhip-ngu-canh) var(--ease-apple)' }}
              data-login-dong-ho
            >
              <div style={{ fontSize: 14, fontWeight: 300, letterSpacing: '.05em', opacity: 0.85 }}>
                {ngayStr}
              </div>
              <div
                className="tabular-nums"
                style={{
                  // vh chứ không vw: màn thấp (laptop 13") thì đồng hồ tự nhún để cả cụm
                  // clock+logo+card vẫn lọt trong 100dvh (root overflow-hidden, không cuộn).
                  fontSize: 'clamp(48px, 12vh, 120px)',
                  fontWeight: 200,
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                {gioStr}
              </div>
            </motion.div>
          )}

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
              className="relative mt-4 flex items-center gap-3 text-[length:var(--fs-xs)] uppercase"
              style={{
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
                borderColor: 'var(--border)',
                // 05/08 LUẬT TRUNG TÍNH: trước là rgba(240,96,32) = cam thương hiệu studio ở
                // dạng rgba (grep hex không bắt). Băng này báo phiên đứt ⇒ token --warning.
                background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
                color: 'var(--t2)',
              }}
            >
              {notice}
            </motion.p>
          )}

          {/* form kính (C-1) — element vừa, biên độ vừa.
              SO-KIEM-TONG §1: wrapper này là TỔ TIÊN của `.lq-card` (backdrop blur trong
              LoginForm.tsx) — dùng `riseNoFade` (không opacity) thay `rise()`, tránh chính
              wrapper này tạo backdrop root cô lập làm kính đục lúc mount (cơ chế K1/K2 P6c).
              `.lq-card` tự lo phần dịch chuyển y của riêng nó, ở đây chỉ còn khoảng thở layout. */}
          <motion.div variants={riseNoFade(amp(18), 0.14)} className="flex w-full justify-center text-left">
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
