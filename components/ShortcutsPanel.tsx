'use client';

/**
 * components/ShortcutsPanel.tsx — bảng tra phím tắt (`7.3.33`, Sprint "Lộ nền" 31/07).
 *
 * Layout theo bản mẫu HTML Hoà gửi 31/07 (v3: "mã chuyển sang trái trong cột cố định 118px,
 * mọi hàng cao đúng 30px ⇒ hai đường thẳng đứng cho mắt bám; mã là thứ đậm nhất; 2 cột cân
 * bằng, không có khoảng trống thủng") — cột phím CỐ ĐỊNH `KEY_COL`, hàng cao CỐ ĐỊNH `ROW_H`,
 * font mono hệ thống cho mã (không nạp JetBrains Mono riêng như bản mẫu — giữ đúng quy ước font
 * mono `ui-monospace` đã dùng khắp app, tránh thêm phụ thuộc webfont mới không cần thiết).
 *
 * Đọc DUY NHẤT từ `lib/shortcuts.ts` (SHORTCUTS + cadTypedCommandGroupsByCategory) — không tự
 * khai chữ ở đây, tránh lệch dần với code thật (đúng phát hiện gốc của sprint: thứ ấn tượng
 * nhất — lệnh gõ tay `XL`/`AR`/`ARP` — đang vô hình vì không nơi nào liệt kê).
 *
 * Dùng `Popover` + `onDismiss` (khuôn đã làm ở `2.2.89`) — không viết cơ chế đóng mới.
 */

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import Popover from '@/components/ui/Popover';
import {
  SHORTCUTS,
  formatShortcutKeys,
  cadTypedCommandGroupsByCategory,
  type ShortcutScope,
  type ShortcutEntry,
} from '@/lib/shortcuts';
import { normalizeSearch } from '@/lib/nodes/search';
import { useMacAfterMount } from '@/lib/kbd';
import type { AppChromeActive } from '@/components/studio/AppChromeTypes';
import { useT } from '@/lib/i18n';

const PANEL_W = 1000;
const ROW_H = 30;
const KEY_COL = 118;

// 03/08 CHỐT TÊN vòng cuối (docs/CHOT-TEN-CHANG-MODE-2026-08-03.md).
// 04/08 [P7 ĐỔI TÊN] — 2D Kỹ thuật→Thiết kế 2D · 3D Thiết kế→Thiết kế 3D · Trình bày→Trình chiếu.
const SCOPE_LABEL: Record<ShortcutScope, { vi: string; en: string }> = {
  'toàn cục': { vi: 'Toàn cục', en: 'Global' },
  cad: { vi: 'Thiết kế 2D', en: '2D Design' },
  render: { vi: 'Thiết kế 3D', en: '3D Design' },
  present: { vi: 'Trình chiếu', en: 'Presenting' },
};

/** `active==='photo'` chưa có scope riêng trong lib/shortcuts.ts (ngoài phạm vi sprint này) —
 * chỉ hiện "Toàn cục", không bịa danh sách cho Photo. */
function routeScope(active: AppChromeActive): ShortcutScope | null {
  if (active === 'cad' || active === 'render' || active === 'present') return active;
  return null;
}

type ShortcutGroup = { title: string; items: ShortcutEntry[] };
type Weighted = { rows: number };

/** Chia N nhóm vào 2 cột cân bằng theo SỐ HÀNG (greedy — cột đang ít hàng hơn nhận nhóm tiếp
 * theo), không tách đôi 1 nhóm. +1 hàng/nhóm cho tiêu đề nhóm vào phép tính cân bằng. */
function splitBalanced<T extends Weighted>(groups: T[]): [T[], T[]] {
  const colA: T[] = [];
  const colB: T[] = [];
  let wA = 0;
  let wB = 0;
  for (const g of groups) {
    const w = g.rows + 1;
    if (wA <= wB) {
      colA.push(g);
      wA += w;
    } else {
      colB.push(g);
      wB += w;
    }
  }
  return [colA, colB];
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
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'commands' | 'shortcuts'>(active === 'cad' ? 'commands' : 'shortcuts');

  const typedGroups = useMemo(() => (active === 'cad' ? cadTypedCommandGroupsByCategory() : []), [active]);
  const hasTypedCommands = typedGroups.length > 0;

  const shortcutGroups: ShortcutGroup[] = useMemo(() => {
    const out: ShortcutGroup[] = [
      { title: tr('Toàn cục', 'Global'), items: SHORTCUTS.filter((s) => s.scope === 'toàn cục') },
    ];
    if (scope) {
      const byGroup = new Map<string, ShortcutEntry[]>();
      for (const s of SHORTCUTS.filter((x) => x.scope === scope)) {
        const g = s.group ?? '';
        const list = byGroup.get(g);
        if (list) list.push(s);
        else byGroup.set(g, [s]);
      }
      for (const [g, items] of byGroup) out.push({ title: g || tr(SCOPE_LABEL[scope].vi, SCOPE_LABEL[scope].en), items });
    }
    return out;
  }, [scope, tr]);

  const q = normalizeSearch(query);
  const filteredTyped = useMemo(() => {
    if (!q) return typedGroups;
    return typedGroups
      .map((g) => ({ ...g, items: g.items.filter((it) => normalizeSearch(`${it.cmds.join(' ')} ${it.label}`).includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [typedGroups, q]);
  const filteredShortcuts = useMemo(() => {
    if (!q) return shortcutGroups;
    return shortcutGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => normalizeSearch(`${formatShortcutKeys(it.keys, isMac)} ${it.label}`).includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [shortcutGroups, q, isMac]);

  const [typedColA, typedColB] = splitBalanced(filteredTyped.map((g) => ({ ...g, rows: g.items.length })));
  const [shortcutColA, shortcutColB] = splitBalanced(filteredShortcuts.map((g) => ({ ...g, rows: g.items.length })));

  if (!open) return null;

  // Chỉ tính khi open=true (luôn client-side tới lúc này) — không phải context-menu neo theo
  // toạ độ chuột, nên tự tính điểm giữa-ngang màn hình thay vì nhận anchorX/anchorY từ ngoài.
  const vw = typeof window !== 'undefined' ? window.innerWidth : PANEL_W + 32;
  const anchorX = Math.max(16, (vw - PANEL_W) / 2);
  const activeTab = hasTypedCommands ? tab : 'shortcuts';

  return (
    <Popover
      anchorX={anchorX}
      anchorY={48}
      onDismiss={onClose}
      style={{
        width: `min(96vw, ${PANEL_W}px)`,
        maxHeight: '82vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 26px 64px -22px rgba(0,0,0,.4), 0 2px 5px rgba(0,0,0,.08)',
      }}
    >
      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: 'var(--t1)', margin: 0 }}>
            {tr('Phím tắt & lệnh', 'Shortcuts & commands')}
          </p>
          {scope && (
            <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--t3)' }}>
              {tr('Chặng', 'Stage')} {tr(SCOPE_LABEL[scope].vi, SCOPE_LABEL[scope].en)}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            title={tr('Đóng', 'Close')}
            style={{ marginLeft: 'auto', display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 10, color: 'var(--t3)', background: 'transparent', border: 'none', cursor: 'pointer', alignSelf: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ position: 'relative', marginTop: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)' }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('Gõ để tìm — mặt cắt, hatch, xoá…', 'Type to search — hatch, section, delete…')}
            style={{
              width: '100%',
              padding: '8px 11px 8px 30px',
              fontSize: 13,
              lineHeight: 1.5,
              border: '1px solid var(--border)',
              borderRadius: 10,
              background: 'var(--field)',
              color: 'var(--t1)',
            }}
          />
        </div>

        {hasTypedCommands && (
          <div style={{ display: 'flex', gap: 2, marginTop: 12, borderBottom: '1px solid var(--border)' }}>
            <TabButton active={activeTab === 'commands'} onClick={() => setTab('commands')} count={filteredTyped.reduce((n, g) => n + g.items.length, 0)}>
              {tr('Lệnh gõ tay', 'Typed commands')}
            </TabButton>
            <TabButton active={activeTab === 'shortcuts'} onClick={() => setTab('shortcuts')} count={filteredShortcuts.reduce((n, g) => n + g.items.length, 0)}>
              {tr('Phím tắt', 'Keyboard shortcuts')}
            </TabButton>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 20px 16px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {activeTab === 'commands' ? (
          filteredTyped.length === 0 ? (
            <EmptyState text={tr('Không tìm thấy lệnh nào khớp.', 'No matching command.')} />
          ) : (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {typedColA.map((g) => (
                  <TypedGroupBox key={g.group} title={g.group} items={g.items} />
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {typedColB.map((g) => (
                  <TypedGroupBox key={g.group} title={g.group} items={g.items} />
                ))}
              </div>
            </div>
          )
        ) : filteredShortcuts.every((g) => g.items.length === 0) ? (
          <EmptyState text={tr('Không tìm thấy phím tắt nào khớp.', 'No matching shortcut.')} />
        ) : (
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {shortcutColA.map((g) => (
                <ShortcutGroupBox key={g.title} title={g.title} items={g.items} isMac={isMac} />
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {shortcutColB.map((g) => (
                <ShortcutGroupBox key={g.title} title={g.title} items={g.items} isMac={isMac} />
              ))}
            </div>
          </div>
        )}
      </div>

      <FooterHints scope={scope} isMac={isMac} tr={tr} />
    </Popover>
  );
}

function TabButton({ active, onClick, count, children }: { active: boolean; onClick: () => void; count: number; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 12px 9px',
        fontSize: 13,
        lineHeight: 1.5,
        fontWeight: 500,
        color: active ? 'var(--t1)' : 'var(--t3)',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--t1)' : 'transparent'}`,
        marginBottom: -1,
        cursor: 'pointer',
      }}
    >
      {children} <span style={{ color: 'var(--t4)', fontSize: 12, fontWeight: 400 }}>{count}</span>
    </button>
  );
}

function GroupHeader({ title }: { title: string }) {
  return (
    <p
      style={{
        margin: 0,
        padding: '7px 12px',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.5,
        color: 'var(--accent-warm)',
        background: 'var(--field)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {title}
    </p>
  );
}

/**
 * VIỆC 2 UI (04/08) — hàng "chưa nối" (§9 `docs/00-BAT-DAU-DOC-DAY.md`: hiện mờ kèm lý do,
 * KHÔNG giấu). Hàng vẫn cao ĐÚNG `ROW_H` — không phá lưới cố định của bản mẫu Hoà gửi (đầu
 * file) — lý do đủ nằm trong `title` (tooltip hover) + đuôi " — chưa nối" ngắn LUÔN hiện, không
 * cần hover mới thấy có vấn đề.
 */
function RowShell({ keyNode, desc, disabled, reason }: { keyNode: React.ReactNode; desc: string; disabled?: boolean; reason?: string }) {
  return (
    <div
      title={disabled ? reason : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: `${KEY_COL}px 1fr`,
        alignItems: 'center',
        height: ROW_H,
        padding: '0 12px',
        gap: 8,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'help' : undefined,
      }}
    >
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {keyNode}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--t2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {desc}
        {disabled && <span style={{ color: 'var(--t4)' }}> — chưa nối</span>}
      </div>
    </div>
  );
}

function TypedGroupBox({ title, items }: { title: string; items: { cmds: string[]; label: string }[] }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--panel)' }}>
      <GroupHeader title={title} />
      <div style={{ padding: '3px 0' }}>
        {items.map((it) => (
          <RowShell
            key={it.label}
            keyNode={
              <>
                {it.cmds[0]}
                {it.cmds.length > 1 && (
                  <span style={{ color: 'var(--t4)', fontWeight: 500, fontSize: 11, marginLeft: 6 }}>{it.cmds.slice(1).join(' ')}</span>
                )}
              </>
            }
            desc={it.label}
          />
        ))}
      </div>
    </div>
  );
}

function ShortcutGroupBox({ title, items, isMac }: { title: string; items: ShortcutEntry[]; isMac: boolean }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--panel)' }}>
      <GroupHeader title={title} />
      <div style={{ padding: '3px 0' }}>
        {items.map((it, i) => (
          <RowShell key={i} keyNode={formatShortcutKeys(it.keys, isMac)} desc={it.label} disabled={it.disabled} reason={it.disabledReason} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p style={{ padding: '24px 8px', textAlign: 'center', fontSize: 12.5, lineHeight: 1.5, color: 'var(--t4)' }}>{text}</p>;
}

/** Thanh gợi ý cuối bảng — chỉ nêu phím THẬT SỰ có trong `SHORTCUTS` cho scope hiện tại, không
 * bịa hint cho chặng không có (vd Render/Present không có Enter/Esc/Space riêng của canvas CAD). */
function FooterHints({ scope, isMac, tr }: { scope: ShortcutScope | null; isMac: boolean; tr: (vi: string, en: string) => string }) {
  const essentials = scope === 'cad'
    ? SHORTCUTS.filter((s) => s.scope === 'cad' && (s.keys[0] === 'Enter' || s.keys[0] === 'Esc' || (s.keys[0] === 'Space' && s.keys[1] === '(gõ nhanh)')))
    : [];
  return (
    <div
      style={{
        padding: '10px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--field)',
        fontSize: 12.5,
        lineHeight: 1.5,
        color: 'var(--t3)',
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}
    >
      {essentials.map((s, i) => (
        <span key={i}>
          <b style={{ color: 'var(--t2)', fontFamily: 'ui-monospace, monospace', fontSize: 11.5, fontWeight: 600 }}>
            {formatShortcutKeys(s.keys, isMac)}
          </b>{' '}
          {s.label.split(' — ')[0].split(',')[0]}
        </span>
      ))}
      <span style={{ marginLeft: 'auto' }}>
        <b style={{ color: 'var(--t2)', fontFamily: 'ui-monospace, monospace', fontSize: 11.5, fontWeight: 600 }}>Esc</b> {tr('đóng', 'close')}
        {'  ·  '}
        <b style={{ color: 'var(--t2)', fontFamily: 'ui-monospace, monospace', fontSize: 11.5, fontWeight: 600 }}>{formatShortcutKeys(['mod', '/'], isMac)}</b>{' '}
        {tr('mở lại bảng này', 'reopen this panel')}
      </span>
    </div>
  );
}
