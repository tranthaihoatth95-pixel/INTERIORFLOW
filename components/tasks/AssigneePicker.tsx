'use client';

/**
 * components/tasks/AssigneePicker.tsx — chọn NGƯỜI PHỤ TRÁCH từ thành viên dự án. Chỉ liệt kê
 * người `assignable` (năng lực task:assignable — viewer không có); người không đủ điều kiện
 * vẫn HIỆN nhưng mờ + lý do (luật §9: không giấu ô trống, không nút giả). Server kiểm lại và
 * trả 400 nêu tên nếu client cũ gửi sai — đây là gương, không phải chốt chặn.
 * A11y: listbox multi-select bằng checkbox thật, nhãn chữ, đóng bằng Esc.
 */
import { useEffect, useRef } from 'react';
import { useLang, useT } from '@/lib/i18n';
import type { MemberSummary } from '@/lib/auth/authorize';
import { ROLE_GLYPH, ROLE_LABELS } from '@/lib/auth/roles';

export function AssigneePicker({ members, value, onChange, onClose, disabled }: {
  members: MemberSummary[];
  value: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const tr = useT();
  const lang = useLang();
  const first = useRef<HTMLInputElement | null>(null);
  useEffect(() => { first.current?.focus(); }, []);
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div
      role="group"
      aria-label={tr('Giao việc cho', 'Assign to')}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
      style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 6, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--panel)', boxShadow: '0 8px 24px rgba(0,0,0,.18)', minWidth: 200 }}
    >
      {members.length === 0 && <p style={{ margin: 0, padding: 6, fontSize: 11, color: 'var(--t4)' }}>{tr('Chưa tải được thành viên.', 'Members not loaded.')}</p>}
      {members.map((m, i) => {
        const roleLbl = lang === 'en' ? ROLE_LABELS[m.role].en : ROLE_LABELS[m.role].vi;
        const off = disabled || !m.assignable;
        return (
          <label key={m.userId} title={!m.assignable ? tr(`${roleLbl} không nhận việc được — chỉ xem.`, `${roleLbl} cannot be assigned — read-only.`) : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 7, fontSize: 11.5, lineHeight: 1.5, color: 'var(--t1)', opacity: off ? 'var(--mo-vo-hieu, .6)' : 1, cursor: off ? 'not-allowed' : 'pointer' }}>
            <input ref={i === 0 ? first : undefined} type="checkbox" checked={value.includes(m.userId)} disabled={off} onChange={() => toggle(m.userId)} aria-describedby={!m.assignable ? `asg-${m.userId}` : undefined} />
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
            <span aria-hidden style={{ fontSize: 10, color: 'var(--t3)' }}>{ROLE_GLYPH[m.role]} {roleLbl}</span>
            {!m.assignable && <span id={`asg-${m.userId}`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{tr('không nhận việc được', 'cannot be assigned')}</span>}
          </label>
        );
      })}
      <button type="button" onClick={onClose} style={{ marginTop: 4, height: 24, border: '1px solid var(--border)', borderRadius: 999, background: 'var(--field)', color: 'var(--t2)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        {tr('Xong', 'Done')}
      </button>
    </div>
  );
}
