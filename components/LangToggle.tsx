'use client';

import { motion } from 'framer-motion';
import { useFlowStore } from '@/lib/store';
import { pressable } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * LangToggle — nút đổi ngôn ngữ VI/EN gọn (segmented 2 ô). Dùng ở Header, màn
 * Intro/StageSelect, MobileMenu. Nguồn chân lý: `lang` trong store (persist).
 *
 * variant:
 *  - 'chip'   : segmented nhỏ cho Header (mặc định).
 *  - 'ghost'  : nhẹ hơn cho nền tối màn intro (viền mờ, chữ đồng).
 */
export function LangToggle({
  variant = 'chip',
  className,
}: {
  variant?: 'chip' | 'ghost';
  className?: string;
}) {
  const lang = useFlowStore((s) => s.lang);
  const setLang = useFlowStore((s) => s.setLang);

  const ghost = variant === 'ghost';

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-[10px] border p-0.5',
        ghost
          ? 'border-[color:rgba(199,154,99,0.28)] bg-[rgba(199,154,99,0.06)]'
          : 'border-[var(--border)] bg-[var(--field)]',
        className,
      )}
      role="group"
      aria-label={lang === 'vi' ? 'Ngôn ngữ' : 'Language'}
    >
      {(['vi', 'en'] as const).map((l) => {
        const on = lang === l;
        return (
          <motion.button
            key={l}
            {...pressable}
            onClick={() => setLang(l)}
            aria-pressed={on}
            title={l === 'vi' ? 'Tiếng Việt' : 'English'}
            className={cn(
              'rounded-[7px] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors',
              on
                ? ghost
                  ? 'bg-[rgba(199,154,99,0.16)] text-[#c79a63]'
                  : 'bg-[var(--card)] text-[var(--t1)] shadow-sm'
                : ghost
                  ? 'text-[color:rgba(233,224,210,0.5)] hover:text-[color:rgba(233,224,210,0.85)]'
                  : 'text-[var(--t4)] hover:text-[var(--t2)]',
            )}
          >
            {l}
          </motion.button>
        );
      })}
    </div>
  );
}
