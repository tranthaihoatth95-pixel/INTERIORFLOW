'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { easeApple } from '@/lib/motion';
import { useT } from '@/lib/i18n';
import { isStageIntroSeen, markStageIntroSeen, type OnboardingStage } from '@/lib/resume';

/**
 * components/onboarding/StageIntroCard.tsx — TẦNG 2 onboarding "just-in-time" (thay 3 bước
 * 'canvas' cũ của SmartTour — chỉ trỏ "phase-switcher ở đây"/"dock ở đây" mà không dạy CÁCH
 * làm việc). Thẻ nhỏ, KHÔNG chặn thao tác (khác Tầng 1 modal), góc màn hình, hiện đúng 1 lần
 * đầu tiên user vào MỖI chặng (CAD/Render/Present) — cờ theo (chặng, user) ở lib/resume.ts.
 *
 * Tone tham khảo StageSwitcher.tsx (gesture hint Vitals): lặng lẽ, tự mờ dần sau ~9s nếu
 * không đụng tới, KHÔNG phải modal phải đóng mới thao tác tiếp được.
 */

interface StageCopy {
  lines: { vi: string; en: string }[];
  before: string;
  after: string;
  alt: { vi: string; en: string };
}

const COPY: Record<OnboardingStage, StageCopy> = {
  cad: {
    lines: [
      { vi: 'Vẽ mặt bằng ở đây.', en: 'Draft your floor plan here.' },
      { vi: 'Gõ L vẽ tường · F8 khoá ngang dọc', en: 'Press L to draw walls · F8 locks horizontal/vertical' },
      { vi: 'Xong bấm Đưa sang Thiết kế 3D', en: 'When done, press "Send to 3D Design"' },
    ],
    before: '/onboarding/cad-before.svg',
    after: '/onboarding/cad-after.svg',
    alt: { vi: 'Canvas trống → mặt bằng đã vẽ', en: 'Empty canvas → drawn floor plan' },
  },
  render: {
    lines: [
      { vi: 'Biến bản vẽ thành ảnh thật.', en: 'Turn the drawing into a real photo.' },
      { vi: 'Chọn thẻ việc → thả ảnh → kéo 2 thanh trượt', en: 'Pick a task card → drop an image → drag the two sliders' },
      { vi: '→ Render', en: '→ Render' },
    ],
    before: '/demo/sketch-in.jpg',
    after: '/demo/sketch-out.png',
    alt: { vi: 'Phác thảo tay → ảnh render photoreal', en: 'Hand sketch → photoreal render' },
  },
  present: {
    lines: [
      { vi: 'Dàn hồ sơ trình khách.', en: 'Lay out the client presentation.' },
      { vi: 'Chọn loại hồ sơ → máy dàn sẵn → sửa theo ý', en: 'Pick a deck type → auto-laid out → edit freely' },
      { vi: '→ Xuất PDF/PPTX', en: '→ Export PDF/PPTX' },
    ],
    before: '/onboarding/present-before.svg',
    after: '/onboarding/present-after.svg',
    alt: { vi: 'Slide trống → slide đã dàn', en: 'Blank slide → laid-out slide' },
  },
};

const AUTO_FADE_MS = 9000;

export function StageIntroCard({ stage, userId }: { stage: OnboardingStage; userId: string | null | undefined }) {
  const tr = useT();
  const copy = COPY[stage];
  const [visible, setVisible] = useState(false);
  // Quyết định CHỈ 1 LẦN cho cả vòng đời component — chặn effect dưới đây tính lại nếu
  // userId đổi tiếp sau đó (vd store nạp xong user THẬT sau khi đã rơi về lastUserId).
  const decidedRef = useRef(false);

  // Chờ tới khi biết "user là ai" rồi mới quyết định — KHÔNG quyết định ngay lúc mount như
  // bản cũ. Lý do: route studio (`/projects/[id]/cad|present`) không nạp `user` vào store khi
  // vào bằng hard-reload/URL trực tiếp (userId khi đó tới từ `effectiveUserId()`/lastUserId ở
  // component cha — thường có NGAY vì đọc localStorage đồng bộ); route Render/`/` populate
  // `user` KHÔNG đồng bộ (chờ /api/auth/me) — nếu quyết định ngay lúc userId còn undefined thì
  // thẻ IM LẶNG không bao giờ hiện, kể cả với user thật sự chưa từng thấy. Effect này tự chạy
  // lại mỗi khi userId đổi cho tới khi có giá trị, rồi khoá lại bằng decidedRef.
  useEffect(() => {
    if (decidedRef.current || !userId) return;
    decidedRef.current = true;
    if (!isStageIntroSeen(stage, userId)) {
      setVisible(true);
      // Đánh dấu đã xem NGAY khi quyết định hiện — "hiện 1 lần" tính từ lúc thẻ xuất hiện,
      // không phải lúc đóng (đóng bằng tay hay tự mờ đều không hiện lại, đúng yêu cầu brief).
      markStageIntroSeen(stage, userId);
    }
  }, [stage, userId]);

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => setVisible(false), AUTO_FADE_MS);
    return () => window.clearTimeout(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.28, ease: easeApple }}
          className="fixed bottom-4 right-4 z-[45] w-[min(300px,calc(100vw-32px))] rounded-[14px] border p-3.5"
          style={{
            background: 'var(--panel, var(--card))',
            borderColor: 'var(--border)',
            boxShadow: '0 20px 48px -16px rgba(0,0,0,0.35)',
          }}
          data-stage-intro-card={stage}
        >
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label={tr('Bỏ qua', 'Skip')}
            className="absolute right-2.5 top-2.5 text-[var(--t4)] transition-colors hover:text-[var(--t1)]"
          >
            <X size={13} />
          </button>

          <div className="flex items-center gap-2 pr-5">
            {/* thumbnail trước/sau — nhỏ, không choán chỗ */}
            <div className="flex shrink-0 items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={copy.before}
                alt={tr(copy.alt.vi, copy.alt.en)}
                width={34}
                height={34}
                className="rounded-[6px] border border-[var(--border)] object-cover"
              />
              <span className="text-[10px] text-[var(--t4)]">→</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={copy.after}
                alt=""
                width={34}
                height={34}
                className="rounded-[6px] border border-[var(--border)] object-cover"
              />
            </div>
          </div>

          <div className="mt-2.5 space-y-0.5">
            {copy.lines.map((l, i) => (
              <p
                key={i}
                className={i === 0 ? 'text-[12.5px] font-semibold text-[var(--t1)]' : 'text-[11.5px] leading-snug text-[var(--t3)]'}
              >
                {tr(l.vi, l.en)}
              </p>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
