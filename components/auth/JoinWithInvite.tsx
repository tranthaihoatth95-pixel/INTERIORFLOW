'use client';

/**
 * components/auth/JoinWithInvite.tsx — VÀO DỰ ÁN BẰNG LINK MỜI: dán link/token → XEM TRƯỚC (GET,
 * không ghi) → bấm NHẬN (POST). Mọi từ chối hiện đúng câu server trả (hết hạn · thu hồi · người
 * mời mất quyền · dự án không còn). Không có bước nào tự đưa người vào dự án khi chỉ bấm link.
 */
import { useState } from 'react';
import { DoorOpen, Loader2 } from 'lucide-react';
import { useLang, useT } from '@/lib/i18n';
import { extractInviteToken } from '@/lib/auth/invite';

interface Preview { projectId: string; projectName: string; role: string; roleLabel: { vi: string; en: string }; inviterName: string; expiresAt: string; alreadyMember: boolean }

export function JoinWithInvite({ onJoined }: { onJoined?: (projectId: string) => void }) {
  const tr = useT();
  const lang = useLang();
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const token = extractInviteToken(raw);

  const denialText = (j: { reason?: string; message?: { vi: string; en: string }; error?: string } | null, status: number) => {
    if (j?.message) return lang === 'en' ? j.message.en : j.message.vi;
    if (j?.reason === 'anonymous' || j?.reason === 'session-stale') return tr('Bạn cần đăng nhập trước.', 'You need to sign in first.');
    return j?.error || `HTTP ${status}`;
  };

  const look = async () => {
    if (!token) { setMsg({ kind: 'error', text: tr('Chuỗi dán vào không phải link mời.', 'That is not an invite link.') }); return; }
    setBusy(true); setMsg(null); setPreview(null);
    try {
      const r = await fetch(`/api/share/invite/accept?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (!r.ok) { setMsg({ kind: 'error', text: denialText(j, r.status) }); return; }
      setPreview(j.preview);
    } catch { setMsg({ kind: 'error', text: tr('Không liên lạc được máy chủ.', 'Server unreachable.') }); } finally { setBusy(false); }
  };

  const accept = async () => {
    if (!token) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch('/api/share/invite/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const j = await r.json().catch(() => null);
      if (!r.ok) { setMsg({ kind: 'error', text: denialText(j, r.status) }); return; }
      setMsg({ kind: 'ok', text: j.alreadyMember ? tr('Bạn đã là thành viên dự án này.', 'You are already a member of this project.') : tr(`Đã vào dự án "${j.projectName}".`, `Joined "${j.projectName}".`) });
      setPreview(null); setRaw('');
      onJoined?.(j.projectId);
    } catch { setMsg({ kind: 'error', text: tr('Không liên lạc được máy chủ — thử lại khi có mạng.', 'Server unreachable — retry when online.') }); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void (preview ? accept() : look()); }} style={{ display: 'flex', flexDirection: 'column', gap: 6 }} aria-label={tr('Vào dự án bằng link mời', 'Join a project with an invite link')}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10.5, fontWeight: 600, color: 'var(--t3)' }}>
        {tr('Dán link mời', 'Paste invite link')}
        <input value={raw} onChange={(e) => { setRaw(e.target.value); setPreview(null); }} placeholder="https://…/api/share/invite/accept?token=…" style={{ height: 28, padding: '0 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 11, fontFamily: 'inherit' }} />
      </label>
      {preview && (
        <div role="status" style={{ padding: 8, borderRadius: 10, background: 'var(--field)', border: '1px solid var(--border)', fontSize: 11.5, lineHeight: 1.5, color: 'var(--t2)' }}>
          <b style={{ color: 'var(--t1)' }}>{preview.projectName}</b> · {lang === 'en' ? preview.roleLabel.en : preview.roleLabel.vi}
          <br />{tr('Người mời', 'Invited by')}: {preview.inviterName || '—'} · {tr('Hết hạn', 'Expires')} {new Date(preview.expiresAt).toLocaleDateString()}
          {preview.alreadyMember && <><br />{tr('Bạn đã là thành viên — nhận lại không đổi vai.', 'You are already a member — accepting will not change your role.')}</>}
        </div>
      )}
      <button type="submit" disabled={busy || !raw.trim()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 28, padding: '0 12px', border: 0, borderRadius: 999, background: preview ? 'var(--accent)' : 'var(--field)', color: preview ? '#fff' : 'var(--t1)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: busy || !raw.trim() ? 'var(--mo-vo-hieu, .6)' : 1 }}>
        {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <DoorOpen size={14} aria-hidden />}
        {preview ? tr('Nhận lời mời', 'Accept invite') : tr('Xem lời mời', 'Preview invite')}
      </button>
      {msg && <p role={msg.kind === 'error' ? 'alert' : 'status'} style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: msg.kind === 'error' ? 'var(--danger)' : 'var(--t2)' }}>{msg.text}</p>}
    </form>
  );
}
