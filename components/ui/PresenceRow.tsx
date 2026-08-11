'use client';

/**
 * components/ui/PresenceRow.tsx — [marker: PresenceRow] dãy avatar presence dùng chung.
 *
 * - Avatar tròn chồng mép (overlap -8px), viền `--card` để tách nhau trên mọi nền.
 * - ONLINE: màu/ảnh đầy đủ + chấm `--success` 7px góc dưới-phải.
 * - OFFLINE: `filter: grayscale(1)` + mờ 0.7 (opacity TĨNH, không animate — luật G1), KHÔNG chấm.
 * - Quá `max` (mặc định 5) → bong bóng "+n". Tooltip tên qua `title` từng avatar.
 * - Không ảnh (`avatarUrl`) → initials trên nền `color` (fallback `--accent`).
 */

export interface PresenceMember {
  id: string;
  name: string;
  color?: string;
  avatarUrl?: string;
  online: boolean;
}

export interface PresenceRowProps {
  members: PresenceMember[];
  /** Số avatar tối đa hiện — phần dư gom vào "+n". Mặc định 5. */
  max?: number;
}

/** "Trần Hoà" → "TH" · "Khách" → "KH" · rỗng → "?" */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR = 28;

export default function PresenceRow({ members, max = 5 }: PresenceRowProps) {
  const shown = members.slice(0, Math.max(0, max));
  const overflow = members.length - shown.length;

  return (
    <div className="presence-row" style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((m, i) => (
        <span
          key={m.id}
          title={m.name}
          style={{
            position: 'relative',
            width: AVATAR,
            height: AVATAR,
            flex: 'none',
            marginLeft: i === 0 ? 0 : -8,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: m.color || 'var(--accent)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            boxShadow: '0 0 0 2px var(--card)',
            overflow: 'visible',
            zIndex: shown.length - i,
            ...(m.online ? {} : { filter: 'grayscale(1)', opacity: 0.7 }),
          }}
        >
          {m.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.avatarUrl}
              alt={m.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            initials(m.name)
          )}
          {m.online && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 0 2px var(--card)',
              }}
            />
          )}
        </span>
      ))}
      {overflow > 0 && (
        <span
          title={members.slice(shown.length).map((m) => m.name).join(', ')}
          style={{
            marginLeft: 4,
            height: 20,
            padding: '0 6px',
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--field)',
            border: '1px solid var(--border)',
            color: 'var(--t3)',
            fontSize: 10.5,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
