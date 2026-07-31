'use client';

/**
 * components/ShortcutsPanel.tsx — bảng tra phím tắt (`7.3.33`, Sprint "Lộ nền" 31/07).
 *
 * Đọc DUY NHẤT từ `lib/shortcuts.ts` (SHORTCUTS + cadTypedCommandGroups) — không tự khai chữ ở
 * đây, tránh lệch dần với code thật (đúng phát hiện gốc của sprint: thứ ấn tượng nhất — lệnh gõ
 * tay `XL`/`AR`/`ARP` — đang vô hình vì không nơi nào liệt kê).
 *
 * Dùng `Popover` + `onDismiss` (khuôn đã làm ở `2.2.89`) — không viết cơ chế đóng mới. Neo ở
 * gần đỉnh màn hình, giữa theo chiều ngang (không dùng flip-theo-click-point như context menu,
 * vì đây là panel tra cứu mở bằng phím, không có toạ độ chuột để neo).
 */

import { useMemo } from 'react';
import { X } from 'lucide-react';
import Popover from '@/components/ui/Popover';
import { SHORTCUTS, formatShortcutKeys, cadTypedCommandGroups, type ShortcutScope } from '@/lib/shortcuts';
import { useMacAfterMount } from '@/lib/kbd';
import type { AppChromeActive } from '@/components/studio/AppChromeTypes';
import { useT } from '@/lib/i18n';

const PANEL_W = 560;

const SCOPE_LABEL: Record<ShortcutScope, { vi: string; en: string }> = {
  'toàn cục': { vi: 'Toàn cục', en: 'Global' },
  cad: { vi: 'Drafting CAD', en: 'Drafting CAD' },
  render: { vi: 'Rendering', en: 'Rendering' },
  present: { vi: 'Presenting', en: 'Presenting' },
};

/** `active==='photo'` chưa có scope riêng trong lib/shortcuts.ts (ngoài phạm vi sprint này) —
 * chỉ hiện "Toàn cục", không bịa danh sách cho Photo. */
function routeScope(active: AppChromeActive): ShortcutScope | null {
  if (active === 'cad' || active === 'render' || active === 'present') return active;
  return null;
}

export default function ShortcutsPanel({
  open,
  onClose,
  active,
}: {
  open: boolean;
  onClose: () => void;
  active: AppChromeActive;
}) {
  const isMac = useMacAfterMount();
  const tr = useT();
  const scope = routeScope(active);

  const globalEntries = useMemo(() => SHORTCUTS.filter((s) => s.scope === 'toàn cục'), []);
  const scopedEntries = useMemo(() => (scope ? SHORTCUTS.filter((s) => s.scope === scope) : []), [scope]);
  const typedCommands = useMemo(() => (active === 'cad' ? cadTypedCommandGroups() : []), [active]);

  if (!open) return null;

  // Chỉ tính khi open=true (luôn client-side tới lúc này) — không phải context-menu neo theo
  // toạ độ chuột, nên tự tính điểm giữa-ngang màn hình thay vì nhận anchorX/anchorY từ ngoài.
  const vw = typeof window !== 'undefined' ? window.innerWidth : PANEL_W + 32;
  const anchorX = Math.max(16, (vw - PANEL_W) / 2);

  return (
    <Popover
      anchorX={anchorX}
      anchorY={64}
      onDismiss={onClose}
      style={{
        width: `min(92vw, ${PANEL_W}px)`,
        maxHeight: '78vh',
        overflowY: 'auto',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 20px 60px rgba(0,0,0,.4)',
      }}
    >
      <div style={{ position: 'sticky', top: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
        <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--t1)' }}>
          {tr('Phím tắt & lệnh gõ tay', 'Shortcuts & typed commands')}
        </p>
        <button
          type="button"
          onClick={onClose}
          title={tr('Đóng', 'Close')}
          style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8, color: 'var(--t3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <X size={15} />
        </button>
      </div>

      <div style={{ padding: '10px 16px 16px' }}>
        <ScopeSection title={tr(SCOPE_LABEL['toàn cục'].vi, SCOPE_LABEL['toàn cục'].en)} entries={globalEntries} isMac={isMac} />
        {scope && (
          <ScopeSection
            title={`${tr('Chặng', 'Stage')}: ${tr(SCOPE_LABEL[scope].vi, SCOPE_LABEL[scope].en)}`}
            entries={scopedEntries}
            isMac={isMac}
          />
        )}
        {typedCommands.length > 0 && (
          <div style={{ marginTop: 18 }}>
            {/* 7.1.23 ⑤: fontSize ≥12px bắt buộc trên chuỗi có dấu — "lệnh gõ tay" có dấu. */}
            <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'var(--t4)', marginBottom: 6, textTransform: 'none' }}>
              {tr('CAD · lệnh gõ tay (gõ vào ô lệnh dưới màn hình)', 'CAD · typed commands (type into the command line)')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '4px 12px' }}>
              {typedCommands.map((g) => (
                <div key={g.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '3px 0', fontSize: 12, lineHeight: 1.5 }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--accent)', minWidth: 64, flexShrink: 0 }}>
                    {g.cmds.join(' · ')}
                  </span>
                  <span style={{ color: 'var(--t3)', minWidth: 0 }}>{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Popover>
  );
}

function ScopeSection({
  title,
  entries,
  isMac,
}: {
  title: string;
  entries: { keys: string[]; label: string; group?: string }[];
  isMac: boolean;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const g = e.group ?? '';
      const list = map.get(g);
      if (list) list.push(e);
      else map.set(g, [e]);
    }
    return Array.from(map, ([group, items]) => ({ group, items }));
  }, [entries]);

  if (!entries.length) return null;

  return (
    <div style={{ marginTop: 14 }}>
      {/* 7.1.23 ⑤: fontSize ≥12px bắt buộc — tiêu đề scope/nhóm đều là chuỗi có dấu. */}
      <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'var(--t4)', marginBottom: 6 }}>{title}</p>
      {groups.map(({ group, items }) => (
        <div key={group || '_'} style={{ marginBottom: 6 }}>
          {group && (
            <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--t5)', margin: '4px 0 2px' }}>{group}</p>
          )}
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '3px 0' }}>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--t2)' }}>{it.label}</span>
              <kbd
                style={{
                  flexShrink: 0,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: 'var(--t3)',
                  background: 'var(--field)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '2px 6px',
                }}
              >
                {formatShortcutKeys(it.keys, isMac)}
              </kbd>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
