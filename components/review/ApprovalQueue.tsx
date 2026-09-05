'use client';

/**
 * components/review/ApprovalQueue.tsx — CỔNG DUYỆT NỘI BỘ v0 (chốt 11/08 khuya): hàng đợi duyệt
 * theo DỰ ÁN, lưu server (xuyên thiết bị), quyền theo NĂNG LỰC (approval:request / approval:decide),
 * mọi ghi đi qua hàng đợi local-first có opId (useCollabQueue) — từ chối thì hiện, không mất.
 * Note duyệt = góp ý ghim `anchor.approvalId` (/api/comments?projectId) → "Tạo việc" từ note.
 * Đứng TRONG bảng kiểm (một chỗ ngồi), dưới hai khối luật/gợi ý — không mở panel mới.
 */
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleDashed, XCircle, MessageSquarePlus, ClipboardPlus, Loader2, RotateCcw } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useProjectPermissions } from '@/components/auth/useProjectPermissions';
import { useCollabQueue } from '@/components/auth/useCollabQueue';
import { DeniedState, PermissionNotice } from '@/components/auth/DeniedState';
import { RoleBadge } from '@/components/auth/RoleBadge';
import type { ApprovalRequest, ProjectComment } from '@/lib/auth/collab-store';

type Stage = 'concept' | 'render' | 'present';

export function ApprovalQueue({ projectId, stage }: { projectId: string; stage: Stage }) {
  const tr = useT();
  const perm = useProjectPermissions(projectId);
  const q = useCollabQueue();
  const [items, setItems] = useState<ApprovalRequest[] | null>(null);
  const [notes, setNotes] = useState<Record<string, ProjectComment[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/comments/approvals?projectId=${encodeURIComponent(projectId)}`, { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (r.ok) setItems(j.approvals ?? []);
      else setItems([]);
    } catch { /* ngoại tuyến — giữ danh sách cũ */ }
  }, [projectId]);
  useEffect(() => { void load(); }, [load]);

  const loadNotes = useCallback(async (approvalId: string) => {
    try {
      const r = await fetch(`/api/comments?projectId=${encodeURIComponent(projectId)}&approvalId=${encodeURIComponent(approvalId)}`, { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (r.ok) setNotes((s) => ({ ...s, [approvalId]: j.comments ?? [] }));
    } catch { /* giữ */ }
  }, [projectId]);
  useEffect(() => { if (open) void loadNotes(open); }, [open, loadNotes]);

  const errOf = (r: { status: number; json: unknown } | null) => {
    if (!r) return tr('Chưa gửi được — đã xếp hàng, sẽ gửi khi có mạng.', 'Not sent yet — queued, will send when online.');
    const j = r.json as { error?: string; reason?: string; ineligible?: unknown } | null;
    if (r.status < 300) return null;
    return j?.error || j?.reason || `HTTP ${r.status}`;
  };

  const request = async () => {
    const t = title.trim();
    if (!t) return;
    setBusy(true); setErr(null);
    const r = await q.submit({ kind: 'approval', projectId, method: 'POST', url: '/api/comments/approvals', body: { projectId, title: t, stage } });
    const e = errOf(r); setErr(e);
    if (!e) { setTitle(''); await load(); }
    setBusy(false);
  };

  const decide = async (a: ApprovalRequest, decision: 'approved' | 'changes' | 'rejected' | 'withdrawn') => {
    setBusy(true); setErr(null);
    const r = await q.submit({ kind: 'decide', projectId, method: 'PATCH', url: '/api/comments/approvals', body: { projectId, id: a.id, decision } });
    const e = errOf(r); setErr(e);
    await load();
    setBusy(false);
  };

  const addNote = async (a: ApprovalRequest) => {
    const text = noteDraft.trim();
    if (!text) return;
    setBusy(true); setErr(null);
    const r = await q.submit({ kind: 'comment', projectId, method: 'POST', url: '/api/comments', body: { projectId, text, anchor: { approvalId: a.id, stage } } });
    const e = errOf(r); setErr(e);
    if (!e) { setNoteDraft(''); await loadNotes(a.id); }
    setBusy(false);
  };

  const noteToTask = async (c: ProjectComment) => {
    setBusy(true); setErr(null);
    const r = await q.submit({ kind: 'task', projectId, method: 'POST', url: '/api/tasks', body: { projectId, title: c.text.slice(0, 200), stage, entityId: c.anchor.entityId ?? null } });
    const e = errOf(r); setErr(e);
    if (!e) {
      // đánh dấu note đã thành việc
      await q.submit({ kind: 'resolve', projectId, method: 'PATCH', url: '/api/comments', body: { projectId, id: c.id, resolved: true } });
      await loadNotes(c.anchor.approvalId ?? '');
    }
    setBusy(false);
  };

  if (perm.resolution.kind === 'denied') return <div style={{ padding: '6px 10px' }}><DeniedState denial={perm.resolution.denial} compact /></div>;
  const canRequest = perm.can('approval:request');
  const canDecide = perm.can('approval:decide');
  const me = perm.userId;
  const pending = (items ?? []).filter((a) => a.status === 'pending');
  const done = (items ?? []).filter((a) => a.status !== 'pending').slice(0, 5);

  const statusIcon = (s: ApprovalRequest['status']) =>
    s === 'approved' ? <CheckCircle2 size={12} aria-hidden style={{ color: 'var(--success)' }} />
      : s === 'pending' ? <CircleDashed size={12} aria-hidden style={{ color: 'var(--warning)' }} />
        : <XCircle size={12} aria-hidden style={{ color: 'var(--t3)' }} />;
  const statusLbl: Record<ApprovalRequest['status'], string> = {
    pending: tr('Chờ duyệt', 'Pending'), approved: tr('Đã duyệt', 'Approved'), changes: tr('Cần sửa', 'Changes requested'), rejected: tr('Từ chối', 'Rejected'), withdrawn: tr('Đã rút', 'Withdrawn'),
  };

  return (
    <section aria-label={tr('Cổng duyệt', 'Approval gate')} style={{ borderTop: '1px solid var(--border)', marginTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px 4px' }}>
        <span style={{ fontSize: 11, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)' }}>{tr('Cổng duyệt — theo dự án', 'Approval gate — project')}</span>
        <span style={{ marginLeft: 'auto' }}>{perm.resolution.kind === 'grant' && <RoleBadge role={perm.resolution.grant.role} storedRole={perm.resolution.grant.storedRole} />}</span>
      </div>
      <div style={{ padding: '0 10px' }}><PermissionNotice resolution={perm.resolution} /></div>
      {(q.summary.pending > 0 || q.summary.denied > 0) && (
        <p role="status" style={{ margin: '4px 12px', fontSize: 10.5, lineHeight: 1.5, color: 'var(--t3)' }}>
          {q.summary.pending > 0 && tr(`${q.summary.pending} thao tác chờ gửi. `, `${q.summary.pending} action(s) queued. `)}
          {q.summary.denied > 0 && tr(`${q.summary.denied} thao tác bị từ chối (giữ lại để bạn xem).`, `${q.summary.denied} action(s) denied (kept for review).`)}
          {q.summary.pending > 0 && <button type="button" onClick={() => void q.flush()} style={{ ...btnNho, marginLeft: 6 }}><RotateCcw size={10} aria-hidden />{tr('Gửi lại', 'Retry')}</button>}
        </p>
      )}
      {q.items.filter((x) => x.state === 'denied').map((x) => (
        <p key={x.opId} role="alert" style={{ margin: '2px 12px', fontSize: 10.5, lineHeight: 1.5, color: 'var(--danger)' }}>
          {tr(`Bị từ chối: ${x.kind} — ${x.lastError ?? ''}`, `Denied: ${x.kind} — ${x.lastError ?? ''}`)}
          <button type="button" onClick={() => q.dismissDenied(x.opId)} style={{ ...btnNho, marginLeft: 6 }}>{tr('Đã hiểu', 'Dismiss')}</button>
        </p>
      ))}

      {canRequest ? (
        <form onSubmit={(e) => { e.preventDefault(); void request(); }} style={{ display: 'flex', gap: 6, padding: '4px 12px 8px' }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr('Xin duyệt: ví dụ "Mặt bằng tầng 1 v3"', 'Request: e.g. "Level 1 plan v3"')} aria-label={tr('Tiêu đề yêu cầu duyệt', 'Approval request title')} style={{ flex: 1, minWidth: 0, height: 26, padding: '0 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 11, fontFamily: 'inherit' }} />
          <button type="submit" disabled={busy || !title.trim()} style={btnNho}>{busy ? <Loader2 size={11} className="animate-spin" aria-hidden /> : <ClipboardPlus size={11} aria-hidden />}{tr('Xin duyệt', 'Request')}</button>
        </form>
      ) : perm.resolution.kind === 'grant' && (
        <p style={{ margin: '2px 12px 8px', fontSize: 10.5, lineHeight: 1.5, color: 'var(--t3)' }}>
          {tr('Vai của bạn không xin duyệt được (chỉ Biên tập/Chủ dự án). Bạn duyệt/góp ý bên dưới.', 'Your role cannot request approval (Editor/Owner only). You can decide/comment below.')}
        </p>
      )}
      {err && <p role="alert" style={{ margin: '0 12px 6px', fontSize: 11, lineHeight: 1.5, color: 'var(--danger)' }}>{err}</p>}

      {items === null && <p style={{ margin: '0 12px 8px', fontSize: 11, color: 'var(--t4)' }}>{tr('Đang tải…', 'Loading…')}</p>}
      {items !== null && pending.length === 0 && <p style={{ margin: '0 12px 8px', fontSize: 11, color: 'var(--t4)' }}>{tr('Không có yêu cầu nào chờ duyệt.', 'Nothing waiting for approval.')}</p>}

      {[...pending, ...done].map((a) => {
        const mine = a.requesterId === me;
        const isOpen = open === a.id;
        return (
          <div key={a.id} style={{ margin: '0 10px 8px', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {statusIcon(a.status)}
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.04em', textTransform: 'uppercase' }}>{statusLbl[a.status]}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)' }}>{a.requesterName}</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--t1)', fontWeight: 600 }}>{a.title}</p>
            {a.decisionNote && <p style={{ margin: '2px 0 0', fontSize: 11, lineHeight: 1.5, color: 'var(--t2)' }}>{a.decisionNote}</p>}
            <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
              {a.status === 'pending' && canDecide && !mine && (
                <>
                  <button type="button" disabled={busy} onClick={() => void decide(a, 'approved')} style={btnNho}><CheckCircle2 size={11} aria-hidden />{tr('Duyệt', 'Approve')}</button>
                  <button type="button" disabled={busy} onClick={() => void decide(a, 'changes')} style={btnNho}>{tr('Cần sửa', 'Changes')}</button>
                  <button type="button" disabled={busy} onClick={() => void decide(a, 'rejected')} style={btnNho}><XCircle size={11} aria-hidden />{tr('Từ chối', 'Reject')}</button>
                </>
              )}
              {a.status === 'pending' && canDecide && mine && (
                <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>{tr('Bạn là người xin — cần người duyệt khác.', 'You requested this — another reviewer must decide.')}</span>
              )}
              {a.status === 'pending' && mine && (
                <button type="button" disabled={busy} onClick={() => void decide(a, 'withdrawn')} style={btnNho}>{tr('Rút', 'Withdraw')}</button>
              )}
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : a.id)} style={{ ...btnNho, marginLeft: 'auto' }}>
                <MessageSquarePlus size={11} aria-hidden />{tr('Ghi chú', 'Notes')}{notes[a.id] ? ` (${notes[a.id].length})` : ''}
              </button>
            </div>
            {isOpen && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                {(notes[a.id] ?? []).map((c) => (
                  <div key={c.id} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
                    <p style={{ flex: 1, margin: 0, fontSize: 11, lineHeight: 1.5, color: c.resolved ? 'var(--t4)' : 'var(--t2)', textDecoration: c.resolved ? 'line-through' : 'none' }}>
                      <b style={{ color: 'var(--t3)' }}>{c.authorName}: </b>{c.text}
                    </p>
                    {!c.resolved && perm.can('task:write') && (
                      <button type="button" disabled={busy} onClick={() => void noteToTask(c)} style={btnNho} title={tr('Tạo việc từ ghi chú này', 'Create a task from this note')}>
                        <ClipboardPlus size={10} aria-hidden />{tr('Tạo việc', 'Task')}
                      </button>
                    )}
                  </div>
                ))}
                {(notes[a.id] ?? []).length === 0 && <p style={{ margin: '0 0 6px', fontSize: 10.5, color: 'var(--t4)' }}>{tr('Chưa có ghi chú.', 'No notes yet.')}</p>}
                {perm.can('comment:write') ? (
                  <form onSubmit={(e) => { e.preventDefault(); void addNote(a); }} style={{ display: 'flex', gap: 5 }}>
                    <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder={tr('Ghi chú duyệt…', 'Review note…')} aria-label={tr('Ghi chú duyệt', 'Review note')} style={{ flex: 1, minWidth: 0, height: 24, padding: '0 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 11, fontFamily: 'inherit' }} />
                    <button type="submit" disabled={busy || !noteDraft.trim()} style={btnNho}>{tr('Thêm', 'Add')}</button>
                  </form>
                ) : (
                  <p style={{ margin: 0, fontSize: 10.5, color: 'var(--t3)' }}>{tr('Vai Chỉ xem không viết ghi chú được.', 'Viewers cannot write notes.')}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

const btnNho: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 9px',
  borderRadius: 999, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)',
  fontSize: 11, lineHeight: 1.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};
