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
  /**
   * Cặp thumbnail Trước→Sau. TUỲ CHỌN từ 31/08 (QĐ-1 "demo sạch"): chặng nào chưa có
   * ảnh MINH HOẠ TỰ VẼ thì bỏ trống, thẻ đứng bằng chữ. Trước đó chặng `render` mượn
   * ảnh trong `public/demo/` — bộ ảnh ấy đã rời bản ship, và mượn tiếp là đưa dữ liệu
   * demo trở lại đúng bề mặt người dùng mới nhìn thấy đầu tiên.
   */
  before?: string;
  after?: string;
  /** Mô tả Trước→Sau bằng lời — là alt khi CÓ ảnh, và là nội dung hiển thị khi KHÔNG. */
  alt: { vi: string; en: string };
}

const COPY: Record<OnboardingStage, StageCopy> = {
  cad: {
    lines: [
      { vi: 'Vẽ mặt bằng ở đây.', en: 'Draft your floor plan here.' },
      /* 🔴 04/09 — SỬA HAI LỖI ĐO ĐƯỢC TRÊN APP THẬT, không phải chuyện chữ nghĩa.
         ① SAI PHÍM: dòng này từng ghi "Gõ L vẽ tường". Sổ lệnh chuẩn nói ngược:
            `lib/commands/registry.ts:288` L = `cad.draw.line` (Đường thẳng) ·
            `:304` W = `cad.draw.wall` (Tường). Gõ L ra ĐƯỜNG, không ra TƯỜNG.
            `components/cad/CadEditor.tsx` đã sửa đúng thành W và để lại chú thích cấm
            đổi ngược — nhưng thẻ này bị bỏ sót, nên HAI thẻ trên CÙNG MỘT MÀN đang dạy
            hai phím khác nhau cho cùng một việc (chụp được ở `.nen-kiem/out/2d-D-enter.png`).
         ② THIẾU MỘT NHỊP: gõ chữ trần chỉ NẠP vào dòng lệnh (`CadCanvas.tsx` nhánh
            type-anywhere bắn `cad:cmd-key`), phải ENTER mới chạy. Đo thật: gõ W ⇒ ô lệnh
            hiện "W", công cụ vẫn là "Chọn"; W rồi Enter ⇒ công cụ đổi thành "Tường".
            Chỉ dẫn thiếu Enter là chỉ dẫn làm theo không ra kết quả. */
      { vi: 'Gõ W ↵ vẽ tường · F8 khoá ngang dọc', en: 'Type W ↵ to draw walls · F8 locks horizontal/vertical' },
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
    // TODO(phiếu "bộ minh hoạ trung tính"): cắm cặp SVG tự vẽ vào đây, cùng khuôn
    // `/onboarding/cad-*.svg` của hai chặng kia. KHÔNG mượn lại ảnh render dự án khách.
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
          /* 🔴 04/09 — `pointer-events-none` KHÔNG PHẢI trang trí: nó làm cho lời hứa ở
             docstring ("Thẻ nhỏ, KHÔNG chặn thao tác") thành SỰ THẬT. Đo trên app thật:
             thẻ này `fixed bottom-4 right-4` chiếm hộp (1284,756,300×128) trên màn 1600×900,
             mà công tắc "Vẽ 3D" của dock chặng 3D nằm ở (1296,817,112×34) — NẰM TRỌN BÊN
             TRONG. `document.elementFromPoint` tại tâm nút, tại núm, tại nhãn đều trả về
             `DIV.mt-2.5` của chính thẻ này ⇒ bấm vào công tắc KHÔNG có gì xảy ra, im lặng,
             không báo gì. Tức lối vào mode Vẽ 3D bị chặn cho tới khi người dùng bấm ✕.
             Đúng ba câu chuẩn vi-tương-tác: "công cụ bấm vào im lặng không làm gì".
             Ruột thẻ chỉ có CHỮ + 2 ảnh minh hoạ (không bấm được) ⇒ trả pointer về cho lớp
             dưới KHÔNG mất chức năng nào của thẻ; đúng một thứ cần bấm là nút ✕, và nó được
             bật lại `pointer-events-auto` riêng. Cách này giữ NGUYÊN pixel (0 delta cho mắt).
             ⚠️ z: 45 là số trần NGOÀI thang z đã khai ở globals.css (canvas 0 · rail/inspector
             30 · dock 31 · sheet 40 · popover 60 · toast 80). Đổi sang --z-sheet (40): vẫn
             đứng trên dock (31) nên nhìn y hệt, mà thôi là số tự chế. */
          className="pointer-events-none fixed bottom-4 right-4 w-[min(300px,calc(100vw-32px))] rounded-[14px] border p-3.5"
          style={{
            background: 'var(--panel, var(--card))',
            borderColor: 'var(--border)',
            boxShadow: '0 20px 48px -16px rgba(0,0,0,0.35)',
            zIndex: 'var(--z-sheet)',
          }}
          data-stage-intro-card={stage}
        >
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label={tr('Bỏ qua', 'Skip')}
            /* `pointer-events-auto` bù lại cho `pointer-events-none` của vỏ: đây là thứ DUY
               NHẤT trong thẻ cần bấm được. Ô chạm nới lên --tap (đang là icon 13px trần —
               dưới ngưỡng chạm, và đây lại là đường thoát duy nhất của thẻ). */
            className="pointer-events-auto absolute right-2.5 top-2.5 grid place-items-center text-[var(--t4)] transition-colors hover:text-[var(--t1)]"
            style={{ width: 'var(--tap)', height: 'var(--tap)', margin: 'calc(var(--tap) / -2 + 10px)' }}
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-2 pr-5">
            {/* thumbnail trước/sau — nhỏ, không choán chỗ. Chặng chưa có ảnh tự vẽ thì
                thẻ nói bằng LỜI thay vì bịa một khung ảnh rỗng hoặc mượn ảnh dự án khách. */}
            {copy.before && copy.after ? (
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
            ) : (
              <p className="shrink-0 text-[10.5px] leading-snug text-[var(--t4)]">
                {tr(copy.alt.vi, copy.alt.en)}
              </p>
            )}
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
