'use client';

/**
 * components/auth/RoleBadge.tsx — nhãn vai canonical: KÝ HIỆU + CHỮ (không chỉ màu), song ngữ.
 * Vai lưu (crea/drafter/bim) hiện ở title để người dùng hiểu vì sao mình là reviewer ở chặng này.
 */
import { useLang } from '@/lib/i18n';
import { ROLE_GLYPH, ROLE_LABELS, STORED_ROLE_LABELS, type CollabRole, type StoredRole } from '@/lib/auth/roles';

export function RoleBadge({ role, storedRole, size = 'sm' }: { role: CollabRole; storedRole?: StoredRole | string | null; size?: 'sm' | 'md' }) {
  const lang = useLang();
  const label = lang === 'en' ? ROLE_LABELS[role].en : ROLE_LABELS[role].vi;
  const stored = storedRole && storedRole in STORED_ROLE_LABELS ? STORED_ROLE_LABELS[storedRole as StoredRole] : null;
  const title = stored && storedRole !== role ? `${label} · ${lang === 'en' ? stored.en : stored.vi}` : label;
  return (
    <span
      title={title}
      aria-label={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: size === 'sm' ? '0 7px' : '1px 9px', height: size === 'sm' ? 18 : 22,
        borderRadius: 999, border: '1px solid var(--border-strong)', color: 'var(--t2)', background: 'var(--field)',
        fontSize: size === 'sm' ? 10 : 11, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.03em', whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden>{ROLE_GLYPH[role]}</span>
      {label}
    </span>
  );
}
