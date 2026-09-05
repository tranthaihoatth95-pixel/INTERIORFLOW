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
 * "Mời (+)": thêm NGƯỜI ĐÃ CÓ TÀI KHOẢN vào dự án qua `POST /api/projects/{id}/members` (API có
 * sẵn) — KHÔNG tạo tài khoản mới/gửi email. SLICE 6 (02/09) thêm hai đường nữa trong cùng popover:
 * LINK MỜI ký + thu hồi (`InvitePanel`, năng lực invite:create) và VÀO BẰNG LINK (`JoinWithInvite`,
 * ai cũng dùng được). Nút (+) hiện theo NĂNG LỰC từ `/api/auth/permissions` (invite:create), không
 * còn đọc `canManage` từ nhãn vai — ẩn hẳn thay vì hiện rồi báo lỗi 403.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useCollabStore, colorForUser } from '@/lib/collabStore';
import { useFlowStore } from '@/lib/store';
import { springPop } from '@/lib/motion';
import { useDismissable } from '@/lib/useDismissable';
import Popover from '@/components/ui/Popover';
import PresenceRow from '@/components/ui/PresenceRow';
import { useT } from '@/lib/i18n';
import { useProjectPermissions } from '@/components/auth/useProjectPermissions';
import { InvitePanel } from '@/components/auth/InvitePanel';
import { JoinWithInvite } from '@/components/auth/JoinWithInvite';
import { RoleBadge } from '@/components/auth/RoleBadge';

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
  // `meName`/`meColor` ĐÃ GỠ 22/08 — chúng chỉ phục vụ ô "(bạn)" trong dãy hiện diện, mà ô đó
  // nay không vẽ nữa (Hồ sơ thuộc cụm phải-trên của vỏ app). Giữ lại là nuôi hai đăng ký store chết.
  const currentProjectId = useFlowStore((s) => s.currentProjectId);
  const tr = useT();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const perm = useProjectPermissions(currentProjectId);
  // Năng lực, không nhãn: owner/admin có invite:create (theo ma trận lib/auth/roles.ts).
  const canManage = perm.can('invite:create');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTab, setInviteTab] = useState<'them' | 'link' | 'vao'>('them');
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
  /* 🔴 22/08 — THÔI VẼ CHÍNH MÌNH TRONG DÃY HIỆN DIỆN (hotfix trùng ảnh đại diện).
     Bản cũ đẩy `meId` vào đầu dãy với nhãn "(bạn)". Mà tấm này neo `right-4 top-4` của canvas,
     tức NGAY DƯỚI ảnh đại diện tài khoản ở cụm phải-trên của vỏ app ⇒ mặt người dùng hiện HAI
     LẦN trên cùng một khung hình, một lần là Hồ sơ, một lần là "người đang ở đây".
     RANH GIỚI SỞ HỮU (Hoà chốt 22/08): **Hồ sơ có ĐÚNG MỘT chủ — cụm phải-trên của vỏ app**
     (`CumPhaiTren.tsx`, cửa duy nhất tới Tài khoản/Cài đặt). Hiện diện trả lời câu KHÁC:
     *"còn AI NỮA đang ở đây"* ⇒ theo định nghĩa nó KHÔNG chứa mình.
     Chuẩn này KHÔNG mới trong repo — `CumPhaiTren.tsx:124` đã lọc `o.userId !== meId` từ trước;
     tấm này là chỗ DUY NHẤT còn làm khác. Nay hai nơi cùng một luật.
     ⚠️ `meId` vẫn dùng ở `onlineIds`/`invitable` bên dưới (lọc người có thể mời) — chỉ bỏ khỏi
     DÃY VẼ, không bỏ khỏi logic. */
  if (meId) seen.add(meId);
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

  // 1 mình + không có quyền mời + không có dự án (không có gì để vào bằng link) thì ẩn cho gọn
  if (people.length <= 1 && !canManage && !currentProjectId) return null;

  const memberIds = new Set(members.map((m) => m.userId));
  const invitable = (teamUsers ?? []).filter((u) => u.id !== meId && !memberIds.has(u.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springPop}
      className="nen-mo-card pointer-events-auto absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-[14px] border border-[var(--vien-mo)] px-2 py-1.5 shadow-xl shadow-black/20"
    >
      {/* 12/08 — thay stack avatar tự chế bằng PresenceRow dùng chung (components/ui/PresenceRow.tsx):
          online = màu đủ + chấm --success · offline = grayscale + mờ 0.7 (không chấm) · "+n" khi quá
          MAX_AVATARS. Bỏ luôn chấm hex '#34d399' cũ (ngoài token) và animate opacity theo online
          (offline nay là opacity TĨNH trong PresenceRow — đúng luật G1). */}
      <PresenceRow
        members={people.map((p) => ({ id: p.userId, name: p.name, color: p.color, online: p.online }))}
        max={MAX_AVATARS}
      />
      {perm.resolution.kind === 'grant' && (
        <span className="ml-1"><RoleBadge role={perm.resolution.grant.role} storedRole={perm.resolution.grant.storedRole} /></span>
      )}
      {currentProjectId && (
        <button
          ref={inviteBtnRef}
          type="button"
          onClick={() => { setInviteTab(canManage ? 'them' : 'vao'); openInvite(); }}
          aria-haspopup="dialog"
          aria-expanded={inviteOpen}
          title={canManage ? tr('Thêm thành viên · link mời', 'Add member · invite link') : tr('Vào dự án bằng link mời', 'Join a project with an invite link')}
          aria-label={canManage ? tr('Thêm thành viên · link mời', 'Add member · invite link') : tr('Vào dự án bằng link mời', 'Join a project with an invite link')}
          className="ml-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-dashed border-[var(--border)] text-[var(--t4)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
        >
          <UserPlus size={16} />
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
              className="w-72 rounded-[14px] border border-[var(--border)] bg-[var(--panel)] p-2 shadow-xl"
              style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            >
              {/* Ba đường vào cùng một popover — tab có chữ, aria-pressed; tab "Thêm"/"Link" chỉ khi có năng lực. */}
              <div role="group" aria-label={tr('Cách mời', 'Invite method')} className="mb-1.5 flex gap-1">
                {([
                  ['them', tr('Thêm', 'Add'), canManage],
                  ['link', tr('Link mời', 'Invite link'), canManage],
                  ['vao', tr('Vào bằng link', 'Join by link'), true],
                ] as const).filter(([, , show]) => show).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={inviteTab === k}
                    onClick={() => setInviteTab(k)}
                    className="h-6 flex-1 rounded-full text-[10.5px] font-semibold"
                    style={{ background: inviteTab === k ? 'var(--card)' : 'transparent', color: inviteTab === k ? 'var(--t1)' : 'var(--t3)', border: '1px solid var(--border)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {inviteTab === 'link' && currentProjectId && <InvitePanel projectId={currentProjectId} canRevoke={perm.can('invite:revoke')} />}
              {inviteTab === 'vao' && <JoinWithInvite onJoined={() => { fetchMembers(); void perm.refresh(); }} />}
              {inviteTab === 'them' && (<>
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
                    className="flex w-full items-center justify-between rounded-[10px] px-2 py-1.5 text-left text-[11.5px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)] disabled:opacity-40"
                  >
                    <span className="truncate">{u.name}</span>
                    <span className="shrink-0 text-[10px] text-[var(--t4)]">{inviting === u.id ? tr('Đang thêm…', 'Adding…') : tr('Thêm', 'Add')}</span>
                  </button>
                ))}
              </div>
              </>)}
            </Popover>
          );
        })()}
    </motion.div>
  );
}
