'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { easeApple } from '@/lib/motion';
import { useLang } from '@/lib/i18n';

/**
 * SmartTour — tour tương tác LẦN ĐẦU (Sprint 1 B-5), tự viết, KHÔNG thêm dependency.
 *
 * Cách hoạt động: mỗi bước trỏ một vùng UI qua attribute `data-tour="…"` (đã gắn ở
 * ProjectSelect / Header / LeftRail). Overlay tối toàn màn có "lỗ sáng" đục quanh
 * vùng target (box-shadow 9999px), kèm card giải thích + nút Tiếp/Bỏ qua. Target
 * không tìm thấy (layout đổi/mobile) → card đứng giữa màn, không highlight — tour
 * không bao giờ chặn chết UI.
 *
 * 2 màn: 'gallery' (chọn dự án) → 'canvas' (3 chặng + dock). Chuyển màn do cha
 * (app/page.tsx) điều phối theo stageDone; bước cuối màn gallery chỉ ẨN card để user
 * thao tác chọn dự án — tour nối tiếp khi vào canvas. Bỏ qua ở bất kỳ bước nào =
 * bỏ vĩnh viễn (cha markTourDone theo user.id).
 */

export type TourScreen = 'gallery' | 'canvas';

interface TourStep {
  /** selector vùng highlight — null = card giữa màn */
  target: string | null;
  title: { vi: string; en: string };
  body: { vi: string; en: string };
}

const STEPS: Record<TourScreen, TourStep[]> = {
  gallery: [
    {
      target: '[data-tour="project-gallery"]',
      title: { vi: 'Chọn dự án để bắt đầu', en: 'Pick a project to begin' },
      body: {
        vi: 'Mỗi thẻ là một dự án. Duyệt bằng ← → , bấm thẻ giữa (hoặc Enter) để mở. Thẻ cuối cùng tạo dự án mới. Tour sẽ tiếp tục khi bạn vào trong.',
        en: 'Each card is a project. Browse with ← →, click the focused card (or press Enter) to open. The last card creates a new project. The tour continues once you are in.',
      },
    },
  ],
  canvas: [
    {
      target: '[data-tour="phase-switcher"]',
      title: { vi: '3 chặng — một dòng chảy', en: '3 stages — one flow' },
      body: {
        vi: 'Drafting CAD · Rendering · Presenting. Đây là trục điều hướng duy nhất: vẽ mặt bằng, dựng phối cảnh AI, rồi đóng gói trình khách — đi lại tự do giữa các chặng.',
        en: 'Drafting CAD · Rendering · Presenting. Your single navigation axis: draft the plan, produce AI renders, then package the client deck — move freely between stages.',
      },
    },
    {
      target: '[data-tour="dock"]',
      title: { vi: 'Dock công cụ', en: 'The dock' },
      body: {
        vi: 'Node library, gallery ảnh, thư viện asset, danh sách flow và chat — mọi panel mở từ dải dock bên trái này.',
        en: 'Node library, image gallery, asset library, flows and chat — every panel opens from this left dock.',
      },
    },
    {
      target: null,
      title: { vi: 'Sẵn sàng!', en: 'You are set!' },
      body: {
        vi: 'Mẹo: gõ ⌘K (Ctrl+K) mở Command Palette để gọi nhanh mọi lệnh. Chúc dòng chảy mượt.',
        en: 'Tip: press ⌘K (Ctrl+K) for the Command Palette to reach any command fast. Enjoy the flow.',
      },
    },
  ],
};

const COPPER = '#c79a63';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';
const PAD = 8; // lỗ sáng nới ra quanh target

type Rect = { top: number; left: number; width: number; height: number };

export function SmartTour({
  screen,
  onFinish,
  onSkip,
}: {
  screen: TourScreen;
  /** đi hết bước cuối màn 'canvas' — cha đánh dấu tourDone */
  onFinish: () => void;
  /** bỏ qua vĩnh viễn ở bất kỳ bước nào */
  onSkip: () => void;
}) {
  const steps = STEPS[screen];
  const [i, setI] = useState(0);
  const [hidden, setHidden] = useState(false); // gallery: ẩn card chờ user chọn dự án
  const [rect, setRect] = useState<Rect | null>(null);
  const lang = useLang();
  const en = lang === 'en';

  // đổi màn → về bước đầu, hiện lại
  useEffect(() => {
    setI(0);
    setHidden(false);
  }, [screen]);

  const step = steps[Math.min(i, steps.length - 1)];

  // đo vùng target — đợi 1 frame cho layout ổn định; bám theo resize.
  // querySelectorAll + lọc rect>0: cùng một data-tour có thể gắn 2 biến thể
  // (vd gallery 3D desktop + list phẳng mobile, một cái display:none) — lấy cái ĐANG hiện.
  const measure = useCallback(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    const r = Array.from(document.querySelectorAll(step.target))
      .map((el) => el.getBoundingClientRect())
      .find((b) => b.width > 0 && b.height > 0);
    if (!r) {
      setRect(null);
      return;
    }
    setRect({
      top: Math.max(4, r.top - PAD),
      left: Math.max(4, r.left - PAD),
      width: Math.min(window.innerWidth - 8, r.width + PAD * 2),
      height: r.height + PAD * 2,
    });
  }, [step.target]);

  useEffect(() => {
    if (hidden) return;
    const raf = requestAnimationFrame(measure);
    // canvas mount có animation fade — đo lại sau nhịp ngắn cho chắc vị trí cuối
    const t = setTimeout(measure, 450);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [measure, hidden]);

  if (hidden) return null;

  const last = i === steps.length - 1;
  const next = () => {
    if (!last) {
      setI(i + 1);
      return;
    }
    // hết bước của màn: gallery → ẩn card, chờ user chọn dự án (tour nối ở canvas);
    // canvas → hoàn tất tour.
    if (screen === 'gallery') setHidden(true);
    else onFinish();
  };

  // card đặt dưới target (hoặc trên nếu target ở nửa dưới màn); không target → giữa màn
  const cardPos: React.CSSProperties = rect
    ? rect.top + rect.height / 2 < (typeof window !== 'undefined' ? window.innerHeight : 800) / 2
      ? { top: rect.top + rect.height + 14, left: Math.min(rect.left, Math.max(16, window.innerWidth - 356)) }
      : { top: Math.max(16, rect.top - 14 - 190), left: Math.min(rect.left, Math.max(16, window.innerWidth - 356)) }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className="fixed inset-0 z-[90]" style={{ fontFamily: SANS }} data-tour-overlay>
      {/* lỗ sáng quanh target — box-shadow phủ tối phần còn lại. Không target → màn tối đều. */}
      {rect ? (
        // Rà soát motion 20/07: trước đây animate CẢ BỐN `top/left/width/height` — bốn thuộc
        // tính layout cùng lúc, kèm box-shadow spread 9999px phải vẽ lại mỗi khung. Nay vị trí
        // chạy bằng transform (`x`/`y`, chỉ composite); chỉ còn width/height là layout, và
        // chúng thường đổi ít hơn vị trí khi tour nhảy giữa các target.
        <motion.div
          className="absolute rounded-[14px]"
          initial={false}
          animate={{ x: rect.left, y: rect.top, width: rect.width, height: rect.height }}
          transition={{ duration: 0.4, ease: easeApple }}
          style={{
            top: 0,
            left: 0,
            boxShadow: `0 0 0 9999px rgba(8,7,6,0.62), 0 0 0 1.5px ${COPPER}`,
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: 'rgba(8,7,6,0.62)' }} />
      )}

      {/* card bước */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${screen}-${i}`}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.3, ease: easeApple }}
          className="absolute w-[min(340px,calc(100vw-32px))] rounded-[var(--radius-lg)] border p-4"
          style={{
            ...cardPos,
            background: 'rgba(24,21,18,0.92)',
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)',
            borderColor: 'rgba(199,154,99,0.35)',
            boxShadow: '0 24px 60px -20px rgba(0,0,0,0.7)',
          }}
        >
          {/* tiến trình bước (chỉ màn canvas có >1 bước) */}
          {steps.length > 1 && (
            <div className="mb-2.5 flex gap-1.5">
              {steps.map((_, idx) => (
                <span
                  key={idx}
                  className="h-[3px] flex-1 rounded-full"
                  style={{ background: idx <= i ? COPPER : 'rgba(199,154,99,0.2)' }}
                />
              ))}
            </div>
          )}

          <div className="text-[15px] font-semibold text-white">{step.title[lang]}</div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/70">{step.body[lang]}</p>

          <div className="mt-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={onSkip}
              className="text-[11.5px] text-white/45 transition-colors hover:text-white/80"
            >
              {en ? 'Skip — don’t show again' : 'Bỏ qua — không hiện lại'}
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-full px-4 py-1.5 text-[12px] font-semibold"
              style={{ background: COPPER, color: '#1c1409' }}
            >
              {last ? (screen === 'gallery' ? (en ? 'Got it' : 'Đã hiểu') : en ? 'Finish' : 'Hoàn tất') : en ? 'Next' : 'Tiếp'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
