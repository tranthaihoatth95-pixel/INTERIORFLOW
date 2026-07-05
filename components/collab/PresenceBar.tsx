'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCollabStore, colorForUser } from '@/lib/collabStore';
import { springPop } from '@/lib/motion';

/** Lấy initials từ tên: "Trần Hoà" → "TH", "Khách" → "K". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Person {
  userId: string;
  name: string;
  color: string;
}

const MAX_AVATARS = 6;

/**
 * PresenceBar — pill nổi (mat-card) hiện avatar đồng đội đang online.
 * Gồm cả người dùng cục bộ. "+N" khi tràn. Tooltip = tên đầy đủ.
 */
export function PresenceBar() {
  const others = useCollabStore((s) => s.others);
  const meId = useCollabStore((s) => s.meId);
  const meName = useCollabStore((s) => s.meName);
  const meColor = useCollabStore((s) => s.meColor);

  // gộp mình + người khác, khử trùng theo userId
  const seen = new Set<string>();
  const people: Person[] = [];
  if (meId) {
    people.push({ userId: meId, name: `${meName || 'Bạn'} (bạn)`, color: meColor });
    seen.add(meId);
  }
  for (const o of others) {
    if (seen.has(o.userId)) continue;
    seen.add(o.userId);
    people.push({ userId: o.userId, name: o.name, color: o.color || colorForUser(o.userId) });
  }

  if (people.length <= 1) return null; // 1 mình thì ẩn cho gọn

  const shown = people.slice(0, MAX_AVATARS);
  const overflow = people.length - shown.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springPop}
      className="mat-card pointer-events-auto absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-[14px] border border-[var(--mat-hairline)] px-2 py-1.5 shadow-xl shadow-black/20"
    >
      <div className="flex -space-x-2">
        <AnimatePresence mode="popLayout">
          {shown.map((p) => (
            <motion.div
              key={p.userId}
              layout
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={springPop}
              title={p.name}
              className="relative grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-[var(--card)]"
              style={{ background: p.color }}
            >
              {initials(p.name)}
              <span className="absolute -bottom-0 -right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[var(--card)]" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {overflow > 0 && (
        <span className="ml-0.5 text-[11px] font-medium tabular-nums text-[var(--t3)]">
          +{overflow}
        </span>
      )}
    </motion.div>
  );
}
