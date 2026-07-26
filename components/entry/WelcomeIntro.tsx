'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { easeApple } from '@/lib/motion';
import { useT } from '@/lib/i18n';
import { createFlow, openFlow } from '@/lib/workspace';
import { applyCadHandoff } from '@/lib/cad/handoff';
import { requestCadDemoSeed } from '@/lib/cad/seed-demo-flag';

/**
 * components/entry/WelcomeIntro.tsx — TẦNG 1 onboarding "just-in-time" (thay bước 'gallery'
 * cũ của SmartTour, xem docs/... — brief onboarding 27/07).
 *
 * KHÁC SmartTour cũ: đây là modal CĂN GIỮA trên nền tối dịu, KHÔNG spotlight/highlight vùng
 * UI có sẵn (SmartTour cũ định vị card "trên/dưới" 1 rect đo được, mù hoàn toàn với nội dung
 * xung quanh — bug lấn lên tiêu đề/mô tả phía trên gallery). Modal độc lập né hẳn lớp bug đó
 * bằng cấu trúc: không cần biết bên dưới có gì, chỉ cần dimmed backdrop.
 *
 * Dạy "bức tranh lớn" (CAD→Render→Present dùng chung 1 dữ liệu) — KHÔNG dạy vị trí nút bấm
 * (đó là việc của Tầng 2 StageIntroCard, hiện lần đầu mỗi chặng).
 *
 * 2 nút hành động THẬT (không phải nút trang trí):
 *  - "Mở dự án mẫu để xem thử": tạo 1 flow trống → mở → gắn cờ seed-demo-flag → vào thẳng
 *    `/projects/[id]/cad` — CadEditor tự nạp buildDemoPlan() (mặt bằng mẫu có sẵn) lúc mount,
 *    y hệt nút "Mở bản demo" nội bộ CadEditor vẫn dùng — user thấy ngay 1 bản vẽ thật, không
 *    phải canvas trống.
 *  - "Tạo dự án của tôi": tạo 1 flow trống → mở → onEnter() (cùng hàm hoàn tất ProjectSelect
 *    đang dùng cho card "+ Dự án mới" — HomeScreen truyền prop này y hệt).
 */
export function WelcomeIntro({
  userId,
  onEnter,
  onDismiss,
}: {
  userId: string;
  /** Hoàn tất vào canvas — HomeScreen truyền CÙNG callback đưa cho ProjectSelect. */
  onEnter: () => void;
  /** Đóng overlay + đánh dấu tourDone (không hiện lại) — KHÔNG điều hướng đi đâu. */
  onDismiss: () => void;
}) {
  const tr = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<'sample' | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateNew = useCallback(async () => {
    if (busy) return;
    setBusy('new');
    setError(null);
    try {
      const id = await createFlow('Untitled flow', JSON.stringify({ nodes: [], edges: [] }));
      await openFlow(id);
      applyCadHandoff();
      onDismiss();
      onEnter();
    } catch {
      setBusy(null);
      setError(tr('Không tạo được dự án — thử lại.', 'Could not create the project — try again.'));
    }
  }, [busy, onDismiss, onEnter, tr]);

  const handleOpenSample = useCallback(async () => {
    if (busy) return;
    setBusy('sample');
    setError(null);
    try {
      const id = await createFlow(
        tr('Dự án mẫu', 'Sample project'),
        JSON.stringify({ nodes: [], edges: [] }),
      );
      await openFlow(id);
      requestCadDemoSeed(); // CadEditor đọc cờ này lúc mount → tự nạp mặt bằng mẫu
      onDismiss();
      router.push(`/projects/${id}/cad`);
    } catch {
      setBusy(null);
      setError(tr('Không mở được dự án mẫu — thử lại.', 'Could not open the sample project — try again.'));
    }
  }, [busy, onDismiss, router, tr]);

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center p-4" data-welcome-intro>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: easeApple }}
        style={{ background: 'rgba(8,7,6,0.68)' }}
      />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.32, ease: easeApple }}
          className="relative w-[min(460px,calc(100vw-32px))] rounded-[var(--radius-lg,18px)] border p-6"
          style={{
            background: 'rgba(24,21,18,0.94)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderColor: 'var(--accent-ring)',
            boxShadow: '0 32px 80px -24px rgba(0,0,0,0.75)',
          }}
        >
          <button
            type="button"
            onClick={onDismiss}
            aria-label={tr('Bỏ qua', 'Skip')}
            className="absolute right-4 top-4 text-[13px] text-white/40 transition-colors hover:text-white/80"
          >
            {tr('Bỏ qua', 'Skip')}
          </button>

          <div className="pr-12 text-[19px] font-semibold leading-snug text-white">
            {tr(
              'InteriorFlow — từ bản vẽ tới hồ sơ trình khách.',
              'InteriorFlow — from drawing to client deck.',
            )}
          </div>
          <p className="mt-2.5 text-[13px] leading-relaxed text-white/70">
            {tr(
              'Vẽ mặt bằng → dựng ảnh phối cảnh → dàn deck thuyết trình. Cả ba dùng chung một dữ liệu: sửa một chỗ, cả ba cập nhật.',
              'Draft the floor plan → produce perspective renders → lay out the presentation deck. All three share one dataset: edit once, all three update.',
            )}
          </p>

          {error && <p className="mt-3 text-[12px] text-red-300">{error}</p>}

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleOpenSample}
              disabled={busy !== null}
              className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium text-white/85 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ border: '1px solid rgba(255,255,255,0.18)' }}
            >
              {busy === 'sample' && <Loader2 size={14} className="animate-spin" />}
              {tr('Mở dự án mẫu để xem thử', 'Open the sample project to try it out')}
            </button>
            <button
              type="button"
              onClick={handleCreateNew}
              disabled={busy !== null}
              className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {busy === 'new' && <Loader2 size={14} className="animate-spin" />}
              {tr('Tạo dự án của tôi', 'Create my own project')}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
