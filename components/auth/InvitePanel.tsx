'use client';

/**
 * components/auth/InvitePanel.tsx — MỜI BẰNG LINK (owner/admin: năng lực invite:create) + sổ lời
 * mời đã phát + THU HỒI (invite:revoke). Gọi /api/share/invite. Link chỉ XEM TRƯỚC — người nhận
 * dán vào "Vào dự án bằng link mời" (JoinWithInvite) rồi bấm nhận (POST), không tự vào qua GET.
 * A11y: form có nhãn, nút có chữ, trạng thái qua role=status, lỗi qua role=alert.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link2, Copy, Ban, Loader2 } from 'lucide-react';
import { useLang, useT } from '@/lib/i18n';
import { INVITABLE_STORED_ROLES, STORED_ROLE_LABELS, type InvitableStoredRole } from '@/lib/auth/roles';

interface InviteRow {
  jti: string; role: string; inviterName: string; createdAt: string; expiresAt: string;
  status: 'active' | 'revoked' | 'accepted' | 'expired';
}

export function InvitePanel({ projectId, canRevoke }: { projectId: string; canRevoke: boolean }) {
  const tr = useT();
  const lang = useLang();
  const [role, setRole] = useState<InvitableStoredRole>('viewer');
  const [hours, setHours] = useState(168);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<{ url: string; insecure: boolean; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<InviteRow[] | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/share/invite?projectId=${encodeURIComponent(projectId)}`, { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      setRows(r.ok && Array.isArray(j?.invites) ? j.invites : []);
    } catch { setRows([]); }
  }, [projectId]);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    setBusy(true); setError(null); setLink(null);
    try {
      const r = await fetch('/api/share/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, role, hours }) });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || (j?.reason ? `${tr('Bị từ chối', 'Denied')}: ${j.reason}` : `HTTP ${r.status}`));
      setLink({ url: j.url, insecure: !!j.insecure, expiresAt: j.expiresAt });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  const revoke = async (jti: string) => {
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/share/invite', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, jti }) });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || j?.reason || `HTTP ${r.status}`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link.url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard bị chặn — link vẫn hiện để chọn tay */ }
  };

  const lbl = (r: string) => (r in STORED_ROLE_LABELS ? (lang === 'en' ? STORED_ROLE_LABELS[r as InvitableStoredRole].en : STORED_ROLE_LABELS[r as InvitableStoredRole].vi) : r);
  const statusLbl: Record<InviteRow['status'], string> = {
    active: tr('còn hiệu lực', 'active'), revoked: tr('đã thu hồi', 'revoked'), accepted: tr('đã nhận', 'accepted'), expired: tr('hết hạn', 'expired'),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <form onSubmit={(e) => { e.preventDefault(); void create(); }} style={{ display: 'flex', flexDirection: 'column', gap: 6 }} aria-label={tr('Tạo link mời', 'Create invite link')}>
        <label style={lblStyle}>
          {tr('Vai khi vào dự án', 'Role on joining')}
          <select value={role} onChange={(e) => setRole(e.target.value as InvitableStoredRole)} style={fieldStyle}>
            {INVITABLE_STORED_ROLES.map((r) => <option key={r} value={r}>{lbl(r)}</option>)}
          </select>
        </label>
        <label style={lblStyle}>
          {tr('Hết hạn sau', 'Expires after')}
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))} style={fieldStyle}>
            <option value={24}>{tr('1 ngày', '1 day')}</option>
            <option value={168}>{tr('7 ngày', '7 days')}</option>
            <option value={720}>{tr('30 ngày', '30 days')}</option>
          </select>
        </label>
        <button type="submit" disabled={busy} style={btnPrimary}>
          {busy ? <Loader2 size={12} className="animate-spin" aria-hidden /> : <Link2 size={12} aria-hidden />}
          {tr('Tạo link mời', 'Create invite link')}
        </button>
      </form>
      {link && (
        <div role="status" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, borderRadius: 10, background: 'var(--field)', border: '1px solid var(--border)' }}>
          <input readOnly value={link.url} aria-label={tr('Link mời', 'Invite link')} onFocus={(e) => e.currentTarget.select()} style={{ ...fieldStyle, fontSize: 10.5 }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button type="button" onClick={copy} style={btnGhost}><Copy size={11} aria-hidden />{copied ? tr('Đã chép', 'Copied') : tr('Chép link', 'Copy link')}</button>
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>{tr('Hết hạn', 'Expires')} {new Date(link.expiresAt).toLocaleDateString()}</span>
          </div>
          {link.insecure && (
            <p role="alert" style={{ margin: 0, fontSize: 10.5, lineHeight: 1.5, color: 'var(--warning)' }}>
              {tr('Máy chủ chưa đặt AUTH_SECRET — link ký bằng khoá tạm, chỉ dùng thử nội bộ.', 'Server has no AUTH_SECRET — link is signed with a dev key, internal testing only.')}
            </p>
          )}
        </div>
      )}
      {error && <p role="alert" style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: 'var(--danger)' }}>{error}</p>}
      <div>
        <p style={{ margin: '4px 0 3px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)' }}>{tr('Lời mời đã phát', 'Issued invites')}</p>
        {rows === null && <p style={{ margin: 0, fontSize: 11, color: 'var(--t4)' }}>{tr('Đang tải…', 'Loading…')}</p>}
        {rows !== null && rows.length === 0 && <p style={{ margin: 0, fontSize: 11, color: 'var(--t4)' }}>{tr('Chưa có lời mời nào.', 'No invites yet.')}</p>}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 150, overflowY: 'auto' }}>
          {(rows ?? []).map((r) => (
            <li key={r.jti} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, lineHeight: 1.5, color: 'var(--t2)' }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lbl(r.role)} · {statusLbl[r.status]} · {r.inviterName}
              </span>
              {canRevoke && r.status === 'active' && (
                <button type="button" disabled={busy} onClick={() => void revoke(r.jti)} style={btnGhost} aria-label={tr('Thu hồi lời mời này', 'Revoke this invite')}>
                  <Ban size={11} aria-hidden />{tr('Thu hồi', 'Revoke')}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const lblStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10.5, fontWeight: 600, color: 'var(--t3)' };
const fieldStyle: React.CSSProperties = { height: 28, padding: '0 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 11.5, fontFamily: 'inherit' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 28, padding: '0 12px', border: 0, borderRadius: 999, background: 'var(--accent)', color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
