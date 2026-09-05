'use client';

/**
 * components/ui/TruthBadge.tsx — nhãn nguồn sự thật Measured/Verified/Inferred/External/Stale
 * (EXS điều 9). Vỏ mỏng: lấy ngôn ngữ hiện hành rồi giao cho `TruthBadgeView` (lib/ui/truth.tsx,
 * thuần, test render được). Định nghĩa dấu/nhãn/token sống ở lib/ui/truth.tsx — CẤM chép sang
 * đây hay sang panel nào khác; nơi cần nhãn nguồn thì gọi component này.
 *
 *   <TruthBadge kind="inferred" />            → ≈ Máy suy đoán
 *   <TruthBadge kind="measured" compact />    → ✓ (chữ nằm trong aria-label)
 */

import { useLang } from '@/lib/i18n';
import { TruthBadgeView, type TruthKind } from '@/lib/ui/truth';

export type { TruthKind } from '@/lib/ui/truth';

export function TruthBadge({ kind, compact, className }: { kind: TruthKind; compact?: boolean; className?: string }) {
  const lang = useLang();
  return <TruthBadgeView kind={kind} lang={lang} compact={compact} className={className} />;
}

export default TruthBadge;
