'use client';

/**
 * components/collab/PresenceBar.tsx — G2 phần (4) (`docs/SPEC-CHANG2-UI-2MODE.md` §3 "Presence
 * online/offline | nhóm online (màu, chấm xanh) · offline (xám) · nút mời (+)"): nâng cấp từ bản
 * cũ (chỉ hiện người có cursor sống, chấm xanh cứng cho mọi người, không có khái niệm offline).
 *
 * 2 NGUỒN DỮ LIỆU tách bạch (đọc kỹ trước khi sửa, đừng gộp nhầm):
 *   - `others`/`meId` (cursor sống, poll 900ms, server tự prune sau 6s — `useCollabStore`) = ai
 *     ĐANG THẬT SỰ hoạt động trên canvas ngay lúc này.
 *   - `members` (roster dự án, `GET /api/projects/{id}/members`, đổi CHẬM) = ai CÓ QUYỀN vào dự
 *     án, bất kể đang mở app hay không — nguồn cho "offline" (roster có nhưng không thấy cursor).
 *
 * "Mời (+)": KHÔNG có hạ tầng email-invite trong repo (đã khảo sát) — MVP này = thêm NGƯỜI ĐÃ CÓ
 * TÀI KHOẢN vào dự án, dùng THẲNG `POST /api/projects/{id}/members` (API có sẵn, `ProjectMembersPanel.tsx`
 * ở Dashboard đã dùng đúng luồng này) — KHÔNG tạo tài khoản mới/gửi email. Nút chỉ hiện khi
 * `canManage` (owner, đúng luật API — ẩn hẳn thay vì hiện rồi báo lỗi 403).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useCollabStore, colorForUser } from '@/lib/collabStore';
import { useFlowStore } from '@/lib/store';
import { springPop } from '@/lib/motion';
import { useDismissable } from '@/lib/useDismissable';
import Popover from '@/components/ui/Popover';
import { useT } from '@/lib/i18n';

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
  online: boolean;
}

interface MemberRow {
  userId: string;
  name: string;
  role: string;
}

const MAX_AVATARS = 6;
const MEMBERS_POLL_MS = 30_000; // roster đổi chậm — không cần tần suất 900ms như cursor

export function PresenceBar() {
  const others = useCollabStore((s) => s.others);
  const meId = useCollabStore((s) => s.meId);
  const meName = useCollabStore((s) => s.meName);
  const meColor = useCollabStore((s) => s.meColor);
  const currentProjectId = useFlowStore((s) => s.currentProjectId);
  const tr = useT();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teamUsers, setTeamUsers] = useState<{ id: string; name: string }[] | null>(null);
  const [inviting, setInviting] = useState<string | null>(null);
  const inviteBtnRef = useRef<HTMLButtonElement>(null);

  const fetchMembers = useCallback(() => {
    if (!currentProjectId) return;
    fetch(`/api/projects/${currentProjectId}/members`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setMembers(data.members ?? []);
        setCanManage(!!data.canManage);
      })
      .catch(() => {});
  }, [currentProjectId]);

  useEffect(() => {
    fetchMembers();
    const t = setInterval(fetchMembers, MEMBERS_POLL_MS);
    return () => clearInterval(t);
  }, [fetchMembers]);

  const onlineIds = new Set<string>(meId ? [meId] : []);
  for (const o of others) onlineIds.add(o.userId);

  // Gộp: cursor sống (mình + others) LUÔN hiện (online=true) + member roster KHÔNG có cursor
  // sống (online=false) — khử trùng theo userId, cursor sống ưu tiên (tên/màu tươi hơn roster).
  const seen = new Set<string>();
  const people: Person[] = [];
  if (meId) {
    people.push({ userId: meId, name: `${meName || 'Bạn'} (bạn)`, color: meColor, online: true });
    seen.add(meId);
  }
  for (const o of others) {
    if (seen.has(o.userId)) continue;
    seen.add(o.userId);
    people.push({ userId: o.userId, name: o.name, color: o.color || colorForUser(o.userId), online: true });
  }
  for (const m of members) {
    if (seen.has(m.userId)) continue;
    seen.add(m.userId);
    people.push({ userId: m.userId, name: m.name, color: colorForUser(m.userId), online: false });
  }
  // online trước, offline sau — đúng thứ tự spec "nhóm online ... offline".
  people.sort((a, b) => Number(b.online) - Number(a.online));

  const openInvite = () => {
    setInviteOpen(true);
    if (teamUsers) return; // đã fetch rồi, khỏi gọi lại mỗi lần mở
    fetch('/api/dashboard')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setTeamUsers((data?.team ?? []).map((u: { id: string; name: string }) => ({ id: u.id, name: u.name }))))
      .catch(() => setTeamUsers([]));
  };

  const addMember = (userId: string) => {
    if (!currentProjectId) return;
    setInviting(userId);
    fetch(`/api/projects/${currentProjectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: 'viewer' }),
    })
      .then(() => fetchMembers())
      .finally(() => setInviting(null));
  };

  useDismissable({ open: inviteOpen, onDismiss: () => setInviteOpen(false), refs: [inviteBtnRef] });

  if (people.length <= 1 && !canManage) return null; // 1 mình + không có quyền mời thì ẩn cho gọn

  const shown = people.slice(0, MAX_AVATARS);
  const overflow = people.length - shown.length;
  const memberIds = new Set(members.map((m) => m.userId));
  const invitable = (teamUsers ?? []).filter((u) => u.id !== meId && !memberIds.has(u.id));

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
              // p.online PHẢI nằm trong `animate` (không phải `style` tĩnh) — framer-motion tự
              // đặt inline style cho property nó đang animate (opacity ở đây), ĐÈ MẤT giá trị
              // style tĩnh dù đặt sau trong JSX. Bug thật gặp lúc verify: offline vẫn hiện
              // opacity:1 vì animate={{opacity:1}} cứng thắng style={{opacity:.45}}.
              animate={{ opacity: p.online ? 1 : 0.45, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={springPop}
              title={p.name}
              className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-[var(--card)]"
              style={{ background: p.color }}
            >
              {initials(p.name)}
              <span
                className="absolute -bottom-0 -right-0 h-2 w-2 rounded-full ring-2 ring-[var(--card)]"
                style={{ background: p.online ? '#34d399' /* emerald-400 */ : 'var(--t5)' }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {overflow > 0 && (
        <span className="ml-0.5 text-[11px] font-medium tabular-nums text-[var(--t3)]">
          +{overflow}
        </span>
      )}
      {canManage && (
        <button
          ref={inviteBtnRef}
          type="button"
          onClick={openInvite}
          title={tr('Thêm thành viên vào dự án', 'Add a member to this project')}
          className="ml-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-dashed border-[var(--border)] text-[var(--t4)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
        >
          <UserPlus size={13} />
        </button>
      )}

      {inviteOpen &&
        inviteBtnRef.current &&
        (() => {
          const r = inviteBtnRef.current.getBoundingClientRect();
          return (
            <Popover
              anchorX={r.right}
              anchorY={r.bottom + 6}
              onDismiss={() => setInviteOpen(false)}
              className="w-60 rounded-[12px] border border-[var(--border)] bg-[var(--panel)] p-2 shadow-xl"
              style={{ backdropFilter: 'blur(14px)' }}
            >
              <p className="px-1 pb-1.5 text-[10px] leading-relaxed text-[var(--t4)]">
                {tr('Thêm người đã có tài khoản IF vào dự án này.', 'Add someone who already has an IF account to this project.')}
              </p>
              <div className="max-h-52 space-y-0.5 overflow-y-auto">
                {teamUsers === null && (
                  <p className="px-1 py-2 text-center text-[11px] text-[var(--t4)]">{tr('Đang tải…', 'Loading…')}</p>
                )}
                {teamUsers !== null && invitable.length === 0 && (
                  <p className="px-1 py-2 text-center text-[11px] text-[var(--t4)]">{tr('Không còn ai để thêm.', 'No one left to add.')}</p>
                )}
                {invitable.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={inviting === u.id}
                    onClick={() => addMember(u.id)}
                    className="flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-left text-[11.5px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)] disabled:opacity-40"
                  >
                    <span className="truncate">{u.name}</span>
                    <span className="shrink-0 text-[10px] text-[var(--t4)]">{inviting === u.id ? tr('Đang thêm…', 'Adding…') : tr('Thêm', 'Add')}</span>
                  </button>
                ))}
              </div>
            </Popover>
          );
        })()}
    </motion.div>
  );
}
