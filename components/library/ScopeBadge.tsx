'use client';

import type { ScopeLevel } from '@/lib/library/types';
import { SCOPE_META } from '@/lib/library/types';

export function ScopeBadge({ scope, title }: { scope: ScopeLevel; title?: string }) {
  const meta = SCOPE_META[scope];
  return (
    <span
      title={title ?? meta.hint}
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none"
      style={{ background: meta.bg, color: meta.fg }}
    >
      {meta.label}
    </span>
  );
}
